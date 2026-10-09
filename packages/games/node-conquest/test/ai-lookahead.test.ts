import { describe, expect, it } from 'vitest';
import {
  controllerFor,
  decide,
  isDecisionTick,
  lastPlan,
  opponents,
  PASSIVE,
  POLICY_DECISION_WORK,
  PROFILES,
  simulate,
  type AiProfile,
  type Lookahead
} from '../src/ai';
import { cloneState, createGame, INTRO_MAP, mapOf, MAX_LEVEL, stepMut, type Difficulty, type GameMap, type NcState, type NodeType } from '../src/rules';
import { makeMap, quiet, stateFor, stubRng, type NodeSpec } from './fixtures';

/**
 * Lookahead lab: own sources (faction 1, level 5 unless given) at x = 100, each with lanes of
 * length ≥ 300 to its neutral targets, plus an isolated player node 0. Within short horizons no
 * unit arrives, so a candidate's simulated gain is exactly half the strength it puts in flight:
 * an outpost +0.5 per 10 ticks, a shipyard +1.5 per 25, a bastion +0.5 per 16.
 */
interface LabSource {
  type?: NodeType;
  level?: number;
  /** Levels of its neutral targets. */
  targets: number[];
  /** Already sends to its first target. */
  sending?: boolean;
}

function lab(sources: LabSource[]): { map: GameMap; s: NcState; ids: number[][] } {
  const specs: NodeSpec[] = [{ x: 2000, y: 2000, owner: 0, level: 5 }];
  const pairs: [number, number][] = [];
  const ids: number[][] = [];
  sources.forEach((source, i) => {
    const y = 100 + 400 * i;
    const v = specs.length;
    specs.push({ x: 100, y, owner: 1, level: source.level ?? 5, type: source.type ?? 'standard' });
    const row = [v];
    source.targets.forEach((level, j) => {
      row.push(specs.length);
      pairs.push([v, specs.length]);
      specs.push({ x: 400, y: y + 100 * j, level });
    });
    ids.push(row);
  });
  const map = makeMap(specs, pairs);
  const s = stateFor(map);
  sources.forEach((source, i) => {
    if (source.sending) s.out[ids[i]![0]!] = [ids[i]![1]!];
  });
  return { map, s, ids };
}

/** Outposts A (target level 1) and B (2), shipyard Y (3), bastion Z (4): heuristic order A, B, Y, Z. */
const standardLab = () => lab([{ targets: [1] }, { targets: [2] }, { type: 'shipyard', targets: [3] }, { type: 'bastion', targets: [4] }]);
const A = { from: 1, to: 2 };
const B = { from: 3, to: 4 };
const Y = { from: 5, to: 6 };

const look = (lookahead: Partial<Lookahead>, profile: Partial<AiProfile> = {}): AiProfile => ({
  ...quiet,
  ...profile,
  lookahead: { candidates: 9, horizon: 25, pairs: 0, budget: 1e9, policy: false, ...lookahead }
});

const plan = (l: { map: GameMap; s: NcState }, profile: AiProfile) => {
  const commands = decide(l.s, l.map, 1, profile, stubRng());
  return { commands, ticks: lastPlan.ticks, work: lastPlan.work };
};

describe('lookahead: choosing among candidates', () => {
  it('ranks candidates by simulated value, not by heuristic score', () => {
    // 25 ticks: Y +1.5 (a frigate), A and B +1.0, Z +0.5. Baseline plus four candidates.
    const l = standardLab();
    expect(plan(l, look({}, { actions: 1 }))).toMatchObject({ commands: [Y], ticks: 125 });
    expect(plan(l, look({}, { actions: 2 }))).toMatchObject({ commands: [Y, A], ticks: 125 });
    // Only the first candidates by heuristic score are simulated.
    expect(plan(l, look({ candidates: 2 }, { actions: 2 }))).toMatchObject({ commands: [A, B], ticks: 75 });
  });

  it('changes nothing that does not simulate better than the current paths', () => {
    // 5 ticks: nothing is produced, every candidate ties with the baseline.
    expect(plan(standardLab(), look({ horizon: 5 }, { actions: 3 }))).toMatchObject({ commands: [], ticks: 25 });
    // 12 ticks: outposts gain 0.5, the shipyard and the bastion nothing.
    expect(plan(standardLab(), look({ horizon: 12 }, { actions: 3 }))).toMatchObject({ commands: [A, B], ticks: 60 });
  });

  it('evaluates candidates on top of the paths that already exist', () => {
    // C (node 9) already sends: every rollout includes its drone.
    const l = lab([{ targets: [1] }, { targets: [2] }, { type: 'shipyard', targets: [3] }, { type: 'bastion', targets: [4] }, { targets: [6], sending: true }]);
    expect(plan(l, look({ horizon: 12 }, { actions: 2 }))).toMatchObject({ commands: [A, B], ticks: 60 });
    expect(plan(l, look({ horizon: 12, pairs: 2, greedy: true }, { actions: 3 }))).toMatchObject({ commands: [A, B], ticks: 84 });
  });

  it('adds further improvements only up to the action budget, skipping second paths of one source', () => {
    // A (level 10) has two targets; with two actions the plan is [A→2, A→3], and the second is skipped.
    const l = lab([{ level: 10, targets: [1, 1] }, { targets: [2] }, { type: 'shipyard', targets: [3] }]);
    expect(plan(l, look({ horizon: 12 }, { actions: 2 }))).toMatchObject({ commands: [{ from: 1, to: 2 }], ticks: 60 });
    expect(plan(l, look({ horizon: 12 }, { actions: 3 }))).toMatchObject({
      commands: [
        { from: 1, to: 2 },
        { from: 4, to: 5 }
      ]
    });
  });

  it('stops simulating a candidate when the match ends', () => {
    // Player node 0 (level 1) is 50 from source 1: the attack converts it on tick 19.
    const map = makeMap(
      [
        { x: 100, y: 50, owner: 0, level: 1 },
        { x: 100, y: 100, owner: 1, level: 5 },
        { x: 400, y: 100, level: 1 }
      ],
      [
        [1, 0],
        [1, 2]
      ]
    );
    expect(plan({ map, s: stateFor(map) }, look({}, { actions: 1 }))).toMatchObject({ commands: [{ from: 1, to: 0 }], ticks: 25 + 19 + 25 });
  });
});

describe('lookahead: budget', () => {
  it('charges Σ (units + nodes) per simulated tick and stops before exceeding the budget', () => {
    const l = standardLab();
    const nodes = l.map.nodes.length;
    // The baseline alone: no units, so 25 ticks × 9 nodes.
    expect(plan(l, look({ budget: 1 }, { actions: 2 }))).toEqual({ commands: [], ticks: 25, work: 25 * nodes });
    // A budget of exactly two rollouts' estimate allows the baseline and one candidate (A).
    expect(plan(l, look({ budget: 2 * 25 * nodes }, { actions: 2 }))).toMatchObject({ commands: [A], ticks: 50 });
    expect(plan(l, look({ budget: 2 * 25 * nodes - 1 }, { actions: 2 }))).toMatchObject({ commands: [], ticks: 25 });
  });

  it('pair simulations stop at the budget, too', () => {
    const l = standardLab();
    const candidatesOnly = plan(l, look({ pairs: 0 }, { actions: 2 })).work;
    const perRollout = 25 * l.map.nodes.length;
    for (const greedy of [false, true]) {
      const exact = look({ pairs: 2, greedy, budget: candidatesOnly + perRollout }, { actions: 3 });
      expect(plan(l, exact).ticks, `greedy ${greedy}`).toBe(150);
      const short = look({ pairs: 2, greedy, budget: candidatesOnly + perRollout - 1 }, { actions: 3 });
      expect(plan(l, short).ticks, `greedy ${greedy}`).toBe(125);
    }
  });

  it('charges every heuristic decision inside a reply-aware rollout', () => {
    const l = standardLab();
    const policy: AiProfile = { ...PROFILES.advanced, hesitation: 0 };
    const control = controllerFor([policy, policy]);
    // Independent account of the baseline rollout of 60 ticks.
    const x = cloneState(l.s);
    let work = 0;
    let decisions = 0;
    for (let i = 0; i < 60; i++) {
      work += x.units.length + l.map.nodes.length;
      for (let f = 0; f < 2; f++) if (isDecisionTick(x.tick, f, policy) && x.owner.includes(f)) decisions++;
      stepMut(x, l.map, control);
    }
    expect(x.units.length).toBeGreaterThan(0);
    expect(decisions).toBe(5);
    expect(plan(l, look({ horizon: 60, budget: 1, policy: true }, { actions: 2 }))).toEqual({
      commands: [],
      ticks: 60,
      work: work + decisions * POLICY_DECISION_WORK
    });
    // Frozen rollouts charge no decisions and see no new paths.
    expect(plan(l, look({ horizon: 60, budget: 1 }, { actions: 2 })).work).toBe(60 * l.map.nodes.length);
  });
});

describe('lookahead: combining changes', () => {
  it('greedy: a runner-up joins only when the combined plan simulates better', () => {
    // 12 ticks: A and B +0.5 each, Y and Z nothing. Baseline, four candidates, two combinations.
    const l = standardLab();
    expect(plan(l, look({ horizon: 12, pairs: 2, greedy: true }, { actions: 3 }))).toMatchObject({ commands: [A, B], ticks: 84 });
    expect(plan(l, look({ horizon: 12, pairs: 1, greedy: true }, { actions: 3 }))).toMatchObject({ commands: [A, B], ticks: 72 });
    // The plan is complete after two actions: no further combination is simulated.
    expect(plan(l, look({ horizon: 12, pairs: 2, greedy: true }, { actions: 2 }))).toMatchObject({ commands: [A, B], ticks: 72 });
    expect(plan(l, look({ pairs: 2, greedy: true }, { actions: 1 }))).toMatchObject({ commands: [Y], ticks: 125 });
    // 25 ticks: Y, then A, then B each improve the plan.
    expect(plan(l, look({ pairs: 2, greedy: true }, { actions: 3 }))).toMatchObject({ commands: [Y, A, B], ticks: 175 });
  });

  it('greedy: combinations that cannot be applied together are not simulated', () => {
    // Source 1 (level 5) has two targets but room for one path.
    const l = lab([{ targets: [1, 1] }, { targets: [2] }, { type: 'shipyard', targets: [3] }, { type: 'bastion', targets: [4] }]);
    expect(plan(l, look({ horizon: 12, pairs: 2, greedy: true }, { actions: 3 }))).toMatchObject({
      commands: [
        { from: 1, to: 2 },
        { from: 4, to: 5 }
      ],
      ticks: 12 * (1 + 5 + 1)
    });
  });

  it('pairs: the best change is combined with each runner-up, the best pair wins', () => {
    const l = standardLab();
    // 25 ticks: [Y, A] = +2.5 beats Y alone; [Y, B] is not better than [Y, A].
    expect(plan(l, look({ pairs: 2 }, { actions: 2 }))).toMatchObject({ commands: [Y, A], ticks: 175 });
    expect(plan(l, look({ pairs: 1 }, { actions: 2 }))).toMatchObject({ commands: [Y, A], ticks: 150 });
    // More pairs than runners-up: every runner-up once.
    expect(plan(l, look({ pairs: 5 }, { actions: 2 }))).toMatchObject({ commands: [Y, A], ticks: 200 });
    // Further independent improvements fill the remaining actions.
    expect(plan(l, look({ pairs: 1 }, { actions: 3 }))).toMatchObject({ commands: [Y, A, B], ticks: 150 });
  });

  it('pairs: a pair that cannot be applied together is skipped, and the next one is tried', () => {
    const l = lab([{ targets: [1, 1] }, { targets: [2] }, { type: 'shipyard', targets: [3] }, { type: 'bastion', targets: [4] }]);
    // [1→2, 1→3] does not fit (one path at level 5); [1→2, 4→5] simulates better than 1→2 alone.
    expect(plan(l, look({ horizon: 12, pairs: 2 }, { actions: 2 }))).toMatchObject({
      commands: [
        { from: 1, to: 2 },
        { from: 4, to: 5 }
      ],
      ticks: 12 * (1 + 5 + 1)
    });
  });
});

describe('lookahead: combinations on top of existing paths', () => {
  it('simulates every pair together with the paths that already exist', () => {
    // As above, plus node 10 already sending: [1→2, 4→5] still beats 1→2 alone only with that path.
    const l = lab([{ targets: [1, 1] }, { targets: [2] }, { type: 'shipyard', targets: [3] }, { type: 'bastion', targets: [4] }, { targets: [6], sending: true }]);
    expect(l.ids[4]).toEqual([10, 11]);
    expect(plan(l, look({ horizon: 12, pairs: 2 }, { actions: 2 }))).toMatchObject({
      commands: [
        { from: 1, to: 2 },
        { from: 4, to: 5 }
      ],
      ticks: 12 * (1 + 5 + 1)
    });
  });
});

describe('lookahead: urgent housekeeping', () => {
  /** The standard lab plus own node 9 feeding own node 10 at full level without paths. */
  const housekeeping = () => {
    const l = lab([{ targets: [1] }, { targets: [2] }, { type: 'shipyard', targets: [3] }, { type: 'bastion', targets: [4] }]);
    const specs: NodeSpec[] = l.map.nodes.map((n) => ({ ...n }));
    specs.push({ x: 3000, y: 100, owner: 1, level: 5 }, { x: 3000, y: 300, owner: 1, level: MAX_LEVEL });
    const map = makeMap(specs, [...l.map.lanes.map(([a, b]) => [a, b] as [number, number]), [9, 10]]);
    const s = stateFor(map);
    s.out[9] = [10];
    return { map, s };
  };

  it('stops useless feeding without simulation, then simulates the rest', () => {
    const l = housekeeping();
    expect(plan(l, look({}, { actions: 3 }))).toMatchObject({ commands: [{ from: 9, to: 10 }, Y, A], ticks: 125 });
    // When the housekeeping uses up the actions, nothing is simulated.
    expect(plan(l, look({}, { actions: 1 }))).toMatchObject({ commands: [{ from: 9, to: 10 }], ticks: 0 });
  });

  it('simulates nothing when only housekeeping is left', () => {
    const map = makeMap(
      [
        { x: 2000, y: 2000, owner: 0, level: 5 },
        { x: 100, y: 100, owner: 1, level: 5 },
        { x: 100, y: 300, owner: 1, level: MAX_LEVEL }
      ],
      [[1, 2]]
    );
    const s = stateFor(map);
    s.out[1] = [2];
    expect(plan({ map, s }, look({}, { actions: 3 }))).toEqual({ commands: [{ from: 1, to: 2 }], ticks: 0, work: 0 });
  });

  it('a switch needs two actions', () => {
    // Saturated node 1 (level 5, sending to neutral 2 at level 12) can switch to neutral 3 (level 1),
    // 20 away: its first drone converts node 3 within the horizon.
    const map = makeMap(
      [
        { x: 2000, y: 2000, owner: 0, level: 5 },
        { x: 100, y: 100, owner: 1, level: 5 },
        { x: 400, y: 100, level: 12 },
        { x: 120, y: 100, level: 1 }
      ],
      [
        [1, 2],
        [1, 3]
      ]
    );
    const s = stateFor(map);
    s.out[1] = [2];
    const both = plan({ map, s }, look({}, { actions: 2 }));
    expect(both.commands).toEqual([
      { from: 1, to: 2 },
      { from: 1, to: 3 }
    ]);
    expect(plan({ map, s }, look({}, { actions: 1 })).commands).toEqual([]);
  });
});

describe('opponents controller: one cached controller per level', () => {
  it('uses the right level for every match it is given, in any order', () => {
    // The introduction opponent at a decision tick (7), with a drone on its way to its node 5.
    const attacked = createGame(5, { map: INTRO_MAP });
    attacked.owner[3] = 0;
    attacked.level[3] = 20;
    attacked.out[3] = [5];
    attacked.level[5] = 1;
    attacked.tick = 7;
    attacked.units.push({ f: 0, k: 0, a: 3, b: 5, d: 0, hp: 1, h: 0 });
    attacked.stats.produced++;
    // Positions at a tick on which beginner and advanced (resp. their free-for-all variants) decide.
    const duel = simulate(createGame(5, { map: 0, difficulty: 'beginner' }), 287);
    const ffa = simulate(createGame(5, { map: 2, difficulty: 'advanced', opponents: 2 }), 157);
    const as = (s: NcState, difficulty: Difficulty) => ({ ...cloneState(s), difficulty });
    const matches = [attacked, as(duel, 'beginner'), as(duel, 'advanced'), as(ffa, 'advanced'), as(ffa, 'beginner')];
    const run = (control: (s: NcState, map: GameMap) => void, s: NcState) => {
      const x = cloneState(s);
      control(x, mapOf(x));
      return x.out;
    };
    const fresh = matches.map((s) => run(opponents(), s));
    // Every level really decides differently on these positions.
    expect(fresh[0]).toEqual(run(controllerFor([null, PASSIVE]), attacked));
    expect(fresh[0]).not.toEqual(run(controllerFor([null, PROFILES.beginner]), attacked));
    expect(fresh[1]).not.toEqual(fresh[2]);
    expect(fresh[3]).not.toEqual(fresh[4]);
    for (const order of [
      [0, 1, 2, 3, 4],
      [1, 0, 2, 4, 3],
      [2, 1, 0, 3, 4]
    ]) {
      const shared = opponents();
      for (const i of order) expect(run(shared, matches[i]!), `match ${i}`).toEqual(fresh[i]);
    }
  });
});
