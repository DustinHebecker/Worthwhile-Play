import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { archetypeOf } from '@wp/strategy-engine';
import { along, ENEMIES, isDefenderKind, TD_RULESET, TOWERS } from '@wp/td-core';
import { defenderResearch, expectedWave, leakage, planRound } from '../src/ai';
import { CROSSING, ownPad } from '../src/maps';
import {
  applyPlan,
  checkPlan,
  defendersOf,
  guardRoute,
  isValidState,
  lockRound,
  MAX_BATTLE_TICKS,
  MAX_DEFENDERS,
  newGame,
  resolveBattle,
  routesOf,
  stepBattle,
  type HoldState,
  type PlanCommand,
  type Planner
} from '../src/rules';

/** Defenders against the outside force (owner 2026-11-01; design § 18.3). */
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const idle: Planner = () => [];
const pads = (side: number): [number, number][] => {
  const out: [number, number][] = [];
  for (let y = 0; y < CROSSING.h; y++) for (let x = 0; x < CROSSING.w; x++) if (ownPad(CROSSING, side, x, y)) out.push([x, y]);
  return out;
};
/** An outside-force game where `side` has these buildings (far pads first) and plenty of credits. */
function built(kinds: readonly ('barracks' | 'garage' | 'hangar' | 'lab')[], options: { solo?: boolean } = {}, side = 0): HoldState {
  let s = clone(newGame(1, 'normal', CROSSING.id, options));
  s.sides[side]!.credits = 20_000;
  const free = pads(side).reverse();
  kinds.forEach((kind, i) => (s = applyPlan(s, side, { t: 'produce', kind, x: free[i]![0], y: free[i]![1] })));
  return s;
}

describe('defenders: what the buildings send', () => {
  it('Drill yards, Garages and Hangars send defenders against the outside force, with research as in the Duel', () => {
    const s = built(['barracks', 'garage', 'hangar']);
    expect(defendersOf(s, 0)).toEqual(['picket', 'picket', 'picket', 'scout', 'scout', 'skimmer']);
    const researched = clone(s);
    researched.sides[0].research = ['shields', 'repair', 'raiders', 'chassis', 'hangars', 'siege'];
    // The Mortar team sets off second, so a long column does not keep it off the road.
    expect(defendersOf({ ...researched, round: 2 }, 0)).toEqual(['picket-shield', 'mortar-team', 'picket-shield', 'picket-shield', 'medic', 'gun-car', 'gun-car', 'bulwark', 'skimmer', 'skimmer']);
    expect(defendersOf({ ...researched, world: { ...researched.world, entities: researched.world.entities.filter((e) => !['barracks', 'garage', 'hangar'].includes(e.kind)) }, round: 2 }, 0)).toEqual(['mortar-team']);
    expect(defendersOf({ ...researched, round: 0 }, 0)).not.toContain('mortar-team');
    // In the Duel buildings send attackers, never defenders.
    expect(defendersOf(newGame(1, 'normal'), 0)).toEqual([]);
  });

  it('they set off with the force on the road that comes for their side; without buildings nothing changes', () => {
    const plain = lockRound(newGame(1, 'normal', CROSSING.id), idle);
    expect(plain.run!.guards).toBeUndefined();
    const s = built(['barracks']);
    const locked = lockRound(s, idle);
    expect(locked.run!.guards).toEqual([0, 1, 2].map((i) => ({ at: 8 * i, kind: 'picket', route: guardRoute(0), side: 0 })));
    expect(isValidState(clone(locked))).toBe(true);
    // The waves are the outside force as before.
    expect(locked.sides[0].wave).toEqual(plain.sides[0].wave);
  });
});

describe('defenders: in battle', () => {
  it('exist within a battle only: never in a plan phase, the round start or the next round', () => {
    const s = built(['barracks', 'garage']);
    let saw = false;
    let t = lockRound(s, idle);
    while (t.phase === 'battle') {
      t = stepBattle(t, 25).state;
      saw ||= t.world.entities.some((e) => isDefenderKind(e.kind));
      expect(isValidState(clone(t))).toBe(true);
    }
    expect(saw).toBe(true);
    expect(t.world.entities.some((e) => isDefenderKind(e.kind))).toBe(false);
    expect(t.roundStart.world.entities.some((e) => isDefenderKind(e.kind))).toBe(false);
    expect(t.run).toBeNull();
  });

  it('they fight: with defenders less of the force gets through, and the defender side earns the bounties', () => {
    const without = resolveBattle(lockRound(built([]), idle)).state;
    const withThem = resolveBattle(lockRound(built(['barracks', 'barracks', 'garage']), idle)).state;
    expect(withThem.sides[0].core).toBeGreaterThan(without.sides[0].core);
    expect(withThem.sides[0].stats.killed).toBeGreaterThan(without.sides[0].stats.killed);
  });

  it('every battle ends well below MAX_BATTLE_TICKS, also with many defenders against a heavy force', () => {
    const s = built(['barracks', 'barracks', 'barracks', 'garage', 'garage', 'hangar', 'hangar', 'barracks']);
    for (const round of [0, 9, 20]) {
      const at = { ...s, round, log: Array.from({ length: round + 1 }, () => ({ player: [], ai: [] })), roundStart: { ...s.roundStart, sides: clone(s.sides) } } as HoldState;
      at.sides[0].research = ['repair', 'chassis'];
      at.roundStart.sides[0].research = ['repair', 'chassis'];
      let t = lockRound(at, idle);
      let ticks = 0;
      while (t.phase === 'battle') {
        t = stepBattle(t, 50).state;
        ticks += 50;
      }
      expect(ticks, `round ${round + 1}`).toBeLessThan(MAX_BATTLE_TICKS / 2);
    }
  });

  it('a battle saved at any tick, defenders and all, continues exactly', () => {
    const start = lockRound(built(['barracks', 'garage', 'hangar']), idle);
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 500 }), (at) => {
        const mid = stepBattle(start, at).state;
        expect(isValidState(clone(mid))).toBe(true);
        expect(resolveBattle(clone(mid)).state).toEqual(resolveBattle(mid).state);
      }),
      { numRuns: 8 }
    );
  }, 60_000);

  it('alone: only your buildings send defenders', () => {
    const locked = lockRound(built(['barracks'], { solo: true }), idle);
    expect(locked.run!.guards!.every((g) => g.side === 0)).toBe(true);
    expect(isValidState(clone(stepBattle(locked, 30).state))).toBe(true);
  });
});

describe('defenders: saves', () => {
  it('rejects defenders in the Duel, on the wrong road or side, or beyond the bound', () => {
    const locked = lockRound(built(['barracks']), idle);
    const mid = stepBattle(locked, 20).state;
    expect(mid.world.entities.some((e) => isDefenderKind(e.kind))).toBe(true);
    const bad: [HoldState, (t: HoldState) => void][] = [
      [locked, (t) => (t.run!.guards![0]!.route = 0)],
      [locked, (t) => (t.run!.guards![0]!.kind = 'walker' as never)],
      [locked, (t) => (t.run!.guards = Array.from({ length: MAX_DEFENDERS + 1 }, () => ({ at: 0, kind: 'picket', route: guardRoute(0), side: 0 })) as never)],
      [mid, (t) => (t.run!.walkers.find((x) => isDefenderKind(t.world.entities.find((e) => e.id === x.id)?.kind ?? ''))!.route = 0)],
      [mid, (t) => (t.world.entities.find((e) => isDefenderKind(e.kind))!.side = 1)]
    ];
    for (const [i, [base, tamper]] of bad.entries()) {
      const t = clone(base);
      tamper(t);
      expect(isValidState(t), `case ${i}`).toBe(false);
    }
    // Defenders in a Duel battle, or a guard list there.
    const duel = lockRound(newGame(1, 'normal'), (): PlanCommand[] => []);
    expect(isValidState({ ...clone(duel), run: { ...clone(duel.run!), guards: [{ at: 0, kind: 'picket', route: 2, side: 0 }] } })).toBe(false);
    // Alone, the other side has no defenders.
    const solo = lockRound(built(['barracks'], { solo: true }), idle);
    const other = clone(solo);
    other.run!.guards![0] = { ...other.run!.guards![0]!, side: 1, route: guardRoute(1) };
    expect(isValidState(other)).toBe(false);
  });

  it('isValidState never throws on tampered defender saves', () => {
    const mid = stepBattle(lockRound(built(['barracks', 'garage']), idle), 40).state;
    fc.assert(
      fc.property(fc.anything(), fc.constantFrom('guards', 'walkers', 'pending'), (junk, key) => {
        const t = clone(mid) as unknown as { run: Record<string, unknown> };
        t.run[key] = junk;
        expect(() => isValidState(t)).not.toThrow();
      }),
      { numRuns: 200 }
    );
  });
});

describe('defenders: the computer', () => {
  const atRound = (s: HoldState, round: number): HoldState => ({ ...s, round, log: Array.from({ length: round + 1 }, () => ({ player: [], ai: [] })), pressure: 0 });

  it('its leakage simulation includes the side’s defenders (a Hangar holds part of round 6’s force)', () => {
    const base = atRound(built([]), 5);
    const withHangar = atRound(built(['hangar']), 5);
    const wave = expectedWave(base, 0);
    expect(leakage(withHangar.world, withHangar, 0, wave)).toBeLessThan(leakage(base.world, base, 0, wave));
    // In the Duel no defenders take part.
    const duel = newGame(1, 'normal');
    expect(leakage(duel.world, duel, 1, ['walker'])).toBe(1);
  });

  it('considers defender buildings among its candidates; every command it gives is legal', () => {
    for (const level of ['normal', 'hard'] as const) {
      const s = atRound(built([], {}, 1), 5);
      s.sides[1].credits = 3000;
      s.roundStart = { ...s.roundStart, sides: clone(s.sides) };
      const plan = planRound(s, 1, level);
      let t = s;
      for (const c of plan) {
        expect(checkPlan(t, 1, c), `${level} ${JSON.stringify(c)}`).toBeNull();
        t = applyPlan(t, 1, c);
      }
    }
  });

  it('research for defenders: a Lab from three buildings on, then one item that helps a building it has', () => {
    expect(defenderResearch(built(['barracks', 'barracks'], {}, 1), 1)).toEqual([]);
    const three = built(['barracks', 'garage', 'garage'], {}, 1);
    expect(defenderResearch(three, 1)).toMatchObject([{ t: 'produce', kind: 'lab' }]);
    const lab = built(['barracks', 'garage', 'garage', 'lab'], {}, 1);
    expect(defenderResearch(lab, 1)).toEqual([{ t: 'research', id: 'shields' }]);
    const garages = built(['garage', 'garage', 'garage', 'lab'], {}, 1);
    expect(defenderResearch(garages, 1)).toEqual([{ t: 'research', id: 'chassis' }]);
    garages.sides[1].research = ['chassis', 'raiders'];
    expect(defenderResearch(garages, 1)).toEqual([{ t: 'research', id: 'siege' }]);
    garages.sides[1].researching = ['siege'];
    expect(defenderResearch(garages, 1)).toEqual([]);
  });
});

describe('defenders: the computer, in detail', () => {
  const atRound = (s: HoldState, round: number): HoldState => ({ ...s, round, log: Array.from({ length: round + 1 }, () => ({ player: [], ai: [] })), pressure: 0 });

  it('leakage with defenders and no force simulates nothing; with a force, it matches the real battle', () => {
    const s = built(['barracks', 'garage', 'hangar'], { solo: true });
    const m = { used: 0 };
    expect(leakage(s.world, s, 0, [], Infinity, m)).toBe(0);
    expect(m.used).toBe(0);
    // Alone and without towers, what the real battle lets through (health-weighted) is what the simulation says.
    for (const round of [1, 5]) {
      const at = atRound(s, round);
      at.roundStart = { ...at.roundStart, sides: clone(at.sides), world: clone(at.world) };
      const wave = expectedWave(at, 0);
      const { leaks } = resolveBattle(lockRound(at, idle));
      const through = leaks.reduce((n, l) => n + (ENEMIES[l.kind].threat * l.hp) / (archetypeOf(TD_RULESET, l.kind)?.hp ?? 1), 0);
      expect(leakage(at.world, at, 0, wave), `round ${round + 1}`).toBeCloseTo(through, 6);
    }
  });

  it('Normal builds defender buildings when they are worth it: in its own game against the outside force it does', () => {
    let s = newGame(1, 'normal', CROSSING.id);
    const built: string[] = [];
    for (let round = 0; round < 9 && s.phase === 'plan'; round++) {
      for (const c of planRound(s, 0, 'normal')) s = applyPlan(s, 0, c);
      s = lockRound(s, (v) => {
        const plan = planRound(v, 1, 'normal');
        for (const c of plan) if (c.t === 'produce') built.push(c.kind);
        return plan;
      });
      s = resolveBattle(s).state;
    }
    expect(built.some((k) => k === 'barracks' || k === 'garage' || k === 'hangar')).toBe(true);
  }, 60_000);

  it('adds a Lab or research only from its defence money (not below its floor)', () => {
    const s = atRound(built(['barracks', 'garage', 'hangar'], {}, 1), 4);
    s.sides[1].credits = 2000;
    s.roundStart = { ...s.roundStart, sides: clone(s.sides) };
    expect(planRound(s, 1, 'normal').some((c) => c.t === 'produce' && c.kind === 'lab')).toBe(true);
    const poor = clone(s);
    poor.sides[1].credits = 120;
    poor.roundStart.sides[1].credits = 120;
    expect(planRound(poor, 1, 'normal').some((c) => c.t === 'produce' && c.kind === 'lab')).toBe(false);
    // Easy never researches.
    expect(planRound(s, 1, 'easy').some((c) => c.t === 'research' || (c.t === 'produce' && c.kind === 'lab'))).toBe(false);
  });

  it('research order with every building: Armour plates, Heavy chassis, Armed raiders, Field repair, Twin hangars, Siege works', () => {
    const s = built(['barracks', 'garage', 'hangar', 'lab'], {}, 1);
    const order: string[] = [];
    for (let i = 0; i < 7; i++) {
      const [cmd] = defenderResearch(s, 1);
      if (!cmd || cmd.t !== 'research') break;
      order.push(cmd.id);
      s.sides[1].research = [...(s.sides[1].research ?? []), cmd.id];
    }
    expect(order).toEqual(['shields', 'chassis', 'raiders', 'repair', 'hangars', 'siege']);
    // Without a Hangar, Twin hangars is skipped.
    const noHangar = built(['barracks', 'garage', 'garage', 'lab'], {}, 1);
    noHangar.sides[1].research = ['shields', 'chassis', 'raiders', 'repair'];
    expect(defenderResearch(noHangar, 1)).toEqual([{ t: 'research', id: 'siege' }]);
  });
});

describe('defenders: review of PR #111', () => {
  const at = (s: HoldState, round: number): HoldState =>
    ({ ...s, round, pressure: 0, log: Array.from({ length: round + 1 }, () => ({ player: [], ai: [] })), roundStart: { world: clone(s.world), sides: clone(s.sides) } }) as HoldState;

  it('M1: no tower ever damages an opposing defender (they carry the armour class towers cannot engage)', () => {
    // The orchestrator's repro: guns along both halves' edges at the split, ten Drill yards a side.
    let s = clone(newGame(1, 'normal', CROSSING.id));
    for (const side of [0, 1] as const) {
      s.sides[side].credits = 50_000;
      const guns = side === 0 ? [[3, 9], [4, 9], [5, 9], [1, 9]] : [[0, 7], [1, 7], [2, 7], [3, 7]];
      for (const [x, y] of guns) s = applyPlan(s, side, { t: 'place', kind: 'gun', x: x!, y: y! });
      const free = pads(side).filter(([x, y]) => !s.world.entities.some((e) => e.x === x && e.y === y)).reverse();
      for (let i = 0; i < 10; i++) s = applyPlan(s, side, { t: 'produce', kind: 'barracks', x: free[i]![0], y: free[i]![1] });
    }
    let t = lockRound(at(s, 5), idle);
    const defenders = new Set<number>();
    const towers = new Set(s.world.entities.filter((e) => Object.hasOwn(TOWERS, e.kind)).map((e) => e.id));
    let towerShotsAtDefenders = 0;
    let towerShots = 0;
    while (t.phase === 'battle') {
      const step = stepBattle(t, 1);
      for (const e of step.state.world.entities) if (isDefenderKind(e.kind)) defenders.add(e.id);
      for (const ev of step.events) {
        if (ev.t !== 'fire' || !towers.has(ev.id)) continue;
        towerShots++;
        if (defenders.has(ev.target)) towerShotsAtDefenders++;
      }
      t = step.state;
    }
    expect(defenders.size).toBeGreaterThan(0);
    expect(towerShots).toBeGreaterThan(0);
    expect(towerShotsAtDefenders).toBe(0);
    // The reason: defenders carry the armour class no tower can engage.
    expect(archetypeOf(TD_RULESET, 'picket')!.armor).toBe('structure');
    for (const kind of Object.keys(TOWERS)) expect(archetypeOf(TD_RULESET, kind)!.weapon?.vs.structure ?? 0, kind).toBe(0);
  });

  it('saves: defender kinds must match the side’s research and round, guards have no extra fields, defenders stand on the road and only move or hold', () => {
    const locked = lockRound(at(built(['barracks']), 4), idle);
    const mid = stepBattle(locked, 30).state;
    const bad: [HoldState, (t: HoldState) => void][] = [
      [locked, (t) => (t.run!.guards![0]!.kind = 'picket-shield')], // no Armour plates
      [locked, (t) => (t.run!.guards![0]!.kind = 'mortar-team')], // no Siege works
      [locked, (t) => ((t.run!.guards![0] as unknown as Record<string, unknown>).extra = 1)],
      [mid, (t) => (t.world.entities.find((e) => isDefenderKind(e.kind))!.order = { type: 'attack', target: 1 })],
      [mid, (t) => {
        const d = t.world.entities.find((e) => isDefenderKind(e.kind))!;
        [d.x, d.y] = [0, 16];
      }]
    ];
    for (const [i, [base, tamper]] of bad.entries()) {
      const t = clone(base);
      tamper(t);
      expect(isValidState(t), `case ${i}`).toBe(false);
    }
    // With Siege works, a Mortar team is allowed in its rounds only.
    const siege = built(['barracks']);
    siege.sides[0].research = ['siege'];
    const third = lockRound(at(siege, 2), idle);
    expect(third.run!.guards!.some((g) => g.kind === 'mortar-team')).toBe(true);
    expect(isValidState(clone(third))).toBe(true);
  });

  it('M2: with ten buildings the front stands out on the road, not at the core, and reserves set off as it falls', () => {
    const s = built(['barracks', 'garage', 'barracks', 'hangar', 'barracks', 'garage', 'barracks', 'hangar', 'garage', 'barracks'], { solo: true });
    const route = routesOf(CROSSING)[guardRoute(0)]!.points;
    const length = along(route, ...route[route.length - 1]!)!;
    let t = lockRound(at(s, 5), idle);
    const due = (t.run!.guards ?? []).length;
    let front = 0;
    let fewestWaiting = due;
    while (t.phase === 'battle') {
      t = stepBattle(t, 1).state;
      if (t.phase !== 'battle') break;
      fewestWaiting = Math.min(fewestWaiting, t.run!.guards?.length ?? 0);
      for (const e of t.world.entities) if (e.side === 0 && isDefenderKind(e.kind) && e.kind !== 'skimmer') front = Math.max(front, along(route, e.x, e.y) ?? 0);
    }
    // The first ones walk on to the bend in the middle of the road (before: one or two cells from the core).
    expect(front).toBeGreaterThanOrEqual(Math.floor(length / 2) - 1);
    // At least half of the 23 set off during the battle (before: 5 to 7 left the core at all).
    expect(due - fewestWaiting).toBeGreaterThanOrEqual(Math.ceil(due / 2));
  });
});
