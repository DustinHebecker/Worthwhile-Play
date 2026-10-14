import { describe, expect, it } from 'vitest';
import { decide, effectiveLevel, evaluate, levelProfile, material, options, PROFILES, rivalWeights, type AiProfile, type Option } from '../src/ai';
import { MAX_LEVEL, type GameMap, type NcState, type NodeType } from '../src/rules';
import { addUnit, makeMap, quiet, stateFor, stubRng } from './fixtures';

/** Options of `faction` with the predictable stand-in PRNG (target noise exactly +3, no shuffling). */
const optionsOf = (s: NcState, map: GameMap, profile: AiProfile, faction = 1, value = 0.5) => options(s, map, faction, profile, stubRng(value));
const from = (list: Option[], v: number) => list.filter((o) => o.cmds[0]!.from === v);
const opt = (score: number, ...cmds: [number, number][]): Option => ({ cmds: cmds.map(([f, t]) => ({ from: f, to: t })), score, urgent: score >= 150 });

describe('opponent levels: exact free-for-all tuning', () => {
  it('pins every adjusted value', () => {
    expect(levelProfile('beginner', 2)).toMatchObject({ period: 50, hesitation: 0.1, actions: 1 });
    expect(levelProfile('beginner', 3)).toMatchObject({ period: 80, hesitation: 0.4, actions: 1 });
    for (const n of [2, 3] as const) {
      expect(levelProfile('advanced', n)).toMatchObject({ period: 30, actions: 3, lookahead: null, weakest: false });
      expect(levelProfile('master', n)).toMatchObject({ period: 12, actions: 3, weakest: true });
      expect(levelProfile('strong', n)).toMatchObject({
        weakest: true,
        actions: 2,
        lookahead: { candidates: 3, horizon: 120, pairs: 0, budget: 80_000, policy: true }
      });
    }
    expect(levelProfile('strong', 2).period).toBe(25);
    expect(levelProfile('strong', 3).period).toBe(18);
    expect(PROFILES.master.period).toBe(10);
  });
});

describe('opponent heuristics: defence', () => {
  /** Node 0 (faction 1, level 1) with own helper 1, attacker 2 (player) and own node 3. */
  const siege = (attacker: NodeType, defended: NodeType = 'standard') =>
    makeMap(
      [
        { x: 300, y: 300, owner: 1, level: 1, type: defended },
        { x: 100, y: 300, owner: 1, level: 5 },
        { x: 500, y: 300, owner: 0, level: MAX_LEVEL, type: attacker },
        { x: 300, y: 100, owner: 1, level: 5 }
      ],
      [
        [0, 1],
        [0, 2],
        [0, 3]
      ]
    );
  const aware = { ...quiet, defend: true, aware: true };
  /** Defence options (score ≥ 200) as [helper, score]. */
  const defence = (s: NcState, map: GameMap, profile: AiProfile = aware) =>
    optionsOf(s, map, profile)
      .filter((o) => o.score >= 200)
      .map((o) => [o.cmds[0]!.from, o.score]);

  it('aware levels count what an attacking path delivers within 60 ticks, per node type', () => {
    const expected: [NodeType, number][] = [
      ['standard', 6],
      ['shipyard', 6],
      ['bastion', 3]
    ];
    for (const [type, danger] of expected) {
      const map = siege(type);
      const s = stateFor(map);
      s.out[2] = [0];
      // Both own neighbours may help; the score grows with the excess danger.
      expect(defence(s, map), type).toEqual([
        [1, 200 + danger - 1],
        [3, 200 + danger - 1]
      ]);
      // Without the path there is no danger.
      expect(defence(stateFor(map), map), type).toEqual([]);
    }
    // Platforms produce nothing, so a platform's path is no danger.
    const platform = siege('station');
    const s = stateFor(platform);
    s.out[2] = [0];
    expect(defence(s, platform)).toEqual([]);
  });

  it('adds units in flight and halves the danger for a bastion', () => {
    const map = siege('standard', 'bastion');
    const s = stateFor(map);
    s.out[2] = [0];
    addUnit(s, { f: 0, a: 2, b: 0 });
    expect(defence(s, map)).toEqual([
      [1, 202],
      [3, 202]
    ]);
    const plain = siege('standard');
    const t = stateFor(plain);
    t.out[2] = [0];
    addUnit(t, { f: 0, a: 2, b: 0 });
    expect(defence(t, plain)).toEqual([
      [1, 206],
      [3, 206]
    ]);
  });

  it('ignores own paths into the node, and only free own neighbours help', () => {
    const map = siege('standard');
    const s = stateFor(map);
    s.out[2] = [0];
    s.out[3] = [0];
    // Node 3 already feeds node 0: no danger from it, and it is not asked again.
    expect(defence(s, map)).toEqual([[1, 205]]);
    // A platform helps only at full level (it relays nothing below).
    const platform = makeMap(
      [
        { x: 300, y: 300, owner: 1, level: 1 },
        { x: 100, y: 300, owner: 1, level: MAX_LEVEL - 1, type: 'station' },
        { x: 500, y: 300, owner: 0, level: 10 }
      ],
      [
        [0, 1],
        [0, 2]
      ]
    );
    const p = stateFor(platform);
    p.out[2] = [0];
    expect(defence(p, platform)).toEqual([]);
    p.level[1] = MAX_LEVEL;
    expect(defence(p, platform)).toEqual([[1, 205]]);
    // A helper at its path limit cannot help.
    const busy = stateFor(map);
    busy.out[2] = [0];
    busy.out[1] = [0];
    busy.out[3] = [];
    busy.level[3] = 5;
    expect(defence(busy, map)).toEqual([[3, 205]]);
  });

  it('defends only when the profile defends', () => {
    const map = siege('standard');
    const s = stateFor(map);
    s.out[2] = [0];
    addUnit(s, { f: 0, a: 2, b: 0 });
    expect(defence(s, map, quiet)).toEqual([]);
    expect(defence(s, map, { ...quiet, defend: true })).toEqual([
      [1, 200],
      [3, 200]
    ]);
  });

  /** Node 0 (faction 1, level `level`) with `paths` active paths, helper 1, attacker 2 and neutral targets 3–5. */
  const front = (level: number, paths: number, drones: number) => {
    const map = makeMap(
      [
        { x: 300, y: 300, owner: 1, level },
        { x: 100, y: 300, owner: 1, level: 5 },
        { x: 500, y: 300, owner: 0, level: 10 },
        { x: 300, y: 100 },
        { x: 300, y: 500 },
        { x: 500, y: 100 }
      ],
      [
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4],
        [0, 5]
      ]
    );
    const s = stateFor(map);
    s.out[0] = [3, 4, 5].slice(0, paths);
    for (let i = 0; i < drones; i++) addUnit(s, { f: 0, a: 2, b: 0, d: 10 * i });
    return defence(s, map);
  };

  it('aware levels defend before a node drops below 10 or 20 and would lose paths', () => {
    expect(front(20, 3, 1)).toEqual([[1, 200]]);
    expect(front(20, 2, 1)).toEqual([]);
    expect(front(21, 3, 1)).toEqual([]);
    expect(front(21, 3, 2)).toEqual([[1, 200]]);
    expect(front(10, 2, 1)).toEqual([[1, 200]]);
    expect(front(10, 1, 1)).toEqual([]);
    expect(front(12, 2, 2)).toEqual([]);
    expect(front(12, 2, 3)).toEqual([[1, 200]]);
    expect(front(12, 2, 1)).toEqual([]);
    expect(front(9, 1, 8)).toEqual([]);
    expect(front(9, 1, 9)).toEqual([[1, 200]]);
    expect(front(9, 1, 11)).toEqual([[1, 202]]);
  });
});

describe('opponent heuristics: counters', () => {
  /** Own node 2 attacked by 0 (level 3), 1 (level 8) and 3 (level 3); 4 is hostile without a path, 5 feeds node 2. */
  const map = makeMap(
    [
      { x: 100, y: 300, owner: 0, level: 3 },
      { x: 300, y: 100, owner: 0, level: 8 },
      { x: 300, y: 300, owner: 1, level: 5 },
      { x: 500, y: 300, owner: 0, level: 3 },
      { x: 300, y: 500, owner: 0, level: 1 },
      { x: 500, y: 500, owner: 1, level: 2 }
    ],
    [
      [2, 0],
      [2, 1],
      [2, 3],
      [2, 4],
      [2, 5]
    ]
  );
  const counter = { ...quiet, counter: true };

  it('answers the weakest attacker (the first on equal level) with an urgent counter path', () => {
    const s = stateFor(map);
    s.out[0] = [2];
    s.out[1] = [2];
    s.out[3] = [2];
    s.out[5] = [2];
    const counters = optionsOf(s, map, counter).filter((o) => o.score === 150);
    expect(counters).toEqual([opt(150, [2, 0])]);
    expect(counters[0]!.urgent).toBe(true);
    // Without the first attacker the next weakest one is answered.
    s.out[0] = [];
    expect(optionsOf(s, map, counter).filter((o) => o.score === 150)).toEqual([opt(150, [2, 3])]);
    s.out[3] = [];
    expect(optionsOf(s, map, counter).filter((o) => o.score === 150)).toEqual([opt(150, [2, 1])]);
  });

  it('has nothing to answer without hostile paths', () => {
    const s = stateFor(map);
    s.out[5] = [2];
    expect(optionsOf(s, map, counter).filter((o) => o.score === 150)).toEqual([]);
    expect(optionsOf(s, map, counter).every((o) => o.cmds.every((c) => c.to >= 0))).toBe(true);
  });
});

describe('opponent heuristics: target scores', () => {
  /**
   * Own node 0 at the centre with targets at distance 200: neutral 1 (level 3), player 2 (level 10),
   * player 3 (level 11) and neutral shipyard 4 (level 4) that own node 5 already attacks. Hostile 6
   * attacks neutral 1; own node 7 next to it does not.
   */
  const map = makeMap(
    [
      { x: 500, y: 500, owner: 1, level: 5 },
      { x: 300, y: 500, level: 3 },
      { x: 700, y: 500, owner: 0, level: 10 },
      { x: 500, y: 300, owner: 0, level: 11 },
      { x: 500, y: 700, level: 4, type: 'shipyard' },
      { x: 500, y: 900, owner: 1, level: 5 },
      { x: 100, y: 500, owner: 0, level: 5 },
      { x: 300, y: 300, owner: 1, level: 5 }
    ],
    [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [4, 5],
      [1, 6],
      [1, 7]
    ]
  );
  const scene = () => {
    const s = stateFor(map);
    s.out[5] = [4];
    s.out[6] = [1];
    return s;
  };

  it('weighs level, lane length, type, hostility and joint attacks exactly', () => {
    // 100 − 6·level − length/20 + type bonus − hostility + focus + noise (+3 here).
    expect(from(optionsOf(scene(), map, quiet), 0)).toEqual([opt(90, [0, 4]), opt(75, [0, 1]), opt(25, [0, 2]), opt(-33, [0, 3])]);
    // Hostile nodes above the attack level cost 60 instead of 8.
    expect(from(optionsOf(scene(), map, { ...quiet, attackLevel: 9 }), 0).map((o) => o.score)).toEqual([90, 75, -27, -33]);
    expect(from(optionsOf(scene(), map, { ...quiet, attackLevel: 11 }), 0).map((o) => o.score)).toEqual([90, 75, 25, 19]);
    // Only own nodes act.
    const all = optionsOf(scene(), map, quiet);
    expect(all.length).toBeGreaterThan(4);
    expect(all.every((o) => scene().owner[o.cmds[0]!.from] === 1)).toBe(true);
  });

  it('gives no rival bonus in a duel, even when preferring the weakest rival', () => {
    expect(from(optionsOf(scene(), map, { ...quiet, weakest: true }), 0)).toEqual(from(optionsOf(scene(), map, quiet), 0));
  });

  it('keeps equally scored options in the order they were found', () => {
    const twins = makeMap(
      [
        { x: 500, y: 500, owner: 1, level: 5 },
        { x: 300, y: 500, level: 3 },
        { x: 700, y: 500, level: 3 },
        { x: 500, y: 300, level: 3 },
        { x: 900, y: 900, owner: 0 }
      ],
      [
        [0, 1],
        [0, 2],
        [0, 3]
      ]
    );
    expect(optionsOf(stateFor(twins), twins, quiet)).toEqual([opt(75, [0, 1]), opt(75, [0, 2]), opt(75, [0, 3])]);
  });

  it('stops feeding only own full nodes without paths, and plans nothing in a finished match', () => {
    const feeding = makeMap(
      [
        { x: 300, y: 300, owner: 1, level: 10 },
        { x: 100, y: 300, owner: 1, level: MAX_LEVEL },
        { x: 500, y: 300, owner: 0, level: MAX_LEVEL }
      ],
      [
        [0, 1],
        [0, 2]
      ]
    );
    const s = stateFor(feeding);
    s.out[0] = [1, 2];
    expect(optionsOf(s, feeding, quiet).filter((o) => o.score >= 300)).toEqual([opt(300, [0, 1])]);
    expect(optionsOf({ ...s, result: 'lost' }, feeding, quiet)).toEqual([]);
    expect(optionsOf({ ...s, result: 'won' }, feeding, { ...quiet, defend: true, counter: true, aware: true })).toEqual([]);
  });
});

describe('opponent heuristics: the weakest rival in free-for-all', () => {
  /**
   * Own node 0 (faction 1, alone) with targets 1 (player), 2 (faction 2), 3 (neutral) and, when
   * given, 4 (faction 3), all at distance 200 and level 5. Further nodes set the node counts.
   */
  const ffa = (counts: [number, number, number]) => {
    const specs = [
      { x: 500, y: 500, owner: 1, level: 5 },
      { x: 300, y: 500, owner: 0, level: 5 },
      { x: 700, y: 500, owner: 2, level: 5 },
      { x: 500, y: 300, level: 5 },
      { x: 500, y: 700, owner: counts[2] > 0 ? 3 : -1, level: 5 }
    ];
    const extra = (owner: number, count: number) => {
      for (let i = 0; i < count; i++) specs.push({ x: 2000 + 100 * specs.length, y: 2000, owner, level: 5 });
    };
    extra(0, counts[0] - 1);
    extra(2, counts[1] - 1);
    extra(3, counts[2] - 1);
    return makeMap(
      specs,
      [
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4]
      ],
      4
    );
  };
  const weakest = { ...quiet, weakest: true };
  /** Scores of the four targets of node 0: player, faction 2, neutral, faction 3 (or neutral). */
  const scores = (counts: [number, number, number], profile: AiProfile = weakest) => {
    const map = ffa(counts);
    const list = from(optionsOf(stateFor(map), map, profile), 0);
    return [1, 2, 3, 4].map((t) => list.find((o) => o.cmds[0]!.to === t)!.score);
  };

  it('adds 12 to targets of the rival with the fewest nodes', () => {
    // Hostile targets at level 5: 100 − 30 − 10 − 8 + 3 = 55; neutrals 63.
    expect(scores([3, 2, 4])).toEqual([55, 67, 63, 55]);
    expect(scores([3, 4, 2])).toEqual([55, 55, 63, 67]);
    expect(scores([2, 3, 4])).toEqual([67, 55, 63, 55]);
    expect(scores([3, 2, 4], quiet)).toEqual([55, 55, 63, 55]);
  });

  it('ignores eliminated rivals and prefers the first on equal counts', () => {
    expect(scores([2, 2, 0])).toEqual([67, 55, 63, 63]);
    expect(scores([3, 2, 0])).toEqual([55, 67, 63, 63]);
  });
});

describe('opponent heuristics: the impulsive nearest target', () => {
  /**
   * Own node 0 (level 10, one path to 2) with neighbours: own 1 (100 away), neutral 2 (120, active),
   * neutrals 3 and 4 (both 150) and neutral 5 (179).
   */
  const map = makeMap(
    [
      { x: 500, y: 500, owner: 1, level: 10 },
      { x: 600, y: 500, owner: 1, level: 5 },
      { x: 500, y: 620 },
      { x: 350, y: 500 },
      { x: 500, y: 350 },
      { x: 373, y: 627 },
      { x: 2000, y: 2000, owner: 0 }
    ],
    [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [0, 5]
    ]
  );
  const scene = () => {
    const s = stateFor(map);
    s.out[0] = [2];
    return s;
  };
  const impulsive = { ...quiet, impulsive: 0.45 };

  it('adds 200 to the nearest non-own neighbour without an active path (the first on ties)', () => {
    expect(from(optionsOf(scene(), map, impulsive, 1, 0.3), 0)).toEqual([opt(266, [0, 3]), opt(66, [0, 4]), opt(65, [0, 5])]);
  });

  it('acts on impulse only with a draw below the impulsive chance', () => {
    const calm = [opt(66, [0, 3]), opt(66, [0, 4]), opt(65, [0, 5])];
    expect(from(optionsOf(scene(), map, impulsive, 1, 0.45), 0)).toEqual(calm);
    expect(from(optionsOf(scene(), map, impulsive, 1, 0.9), 0)).toEqual(calm);
    expect(from(optionsOf(scene(), map, quiet, 1, 0), 0)).toEqual(calm);
  });

  it('draws an impulse only for nodes that act and can still start a path', () => {
    // Shuffle (1) + one noise draw per scored target (3) + the supply pick of node 1 (1).
    const count = (profile: AiProfile, s = scene()) => {
      const rng = stubRng(0.9);
      options(s, map, 1, profile, rng);
      return rng.draws;
    };
    expect(count(quiet)).toBe(5);
    expect(count(impulsive)).toBe(7);
    // Only frontier nodes act: node 1 (interior) draws nothing and supplies nothing.
    expect(count({ ...impulsive, frontierOnly: true })).toBe(5);
    // A saturated node does not draw an impulse.
    const full = scene();
    full.out[0] = [2, 5];
    expect(count(impulsive, full)).toBe(5);
  });
});

describe('opponent heuristics: growth and supply', () => {
  /**
   * Chain: hostile 0 – own front node 1 – own interior node 2 – own node 3 (further inside); own
   * node 4 borders the hostile node and node 1. Lanes are 200 long.
   */
  const map = makeMap(
    [
      { x: 100, y: 500, owner: 0, level: 5 },
      { x: 300, y: 500, owner: 1, level: 5 },
      { x: 500, y: 500, owner: 1, level: 5 },
      { x: 700, y: 500, owner: 1, level: 5 },
      { x: 300, y: 300, owner: 1, level: 5 }
    ],
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [0, 4],
      [1, 4]
    ]
  );
  const aware = { ...quiet, aware: true };

  it('lifts a front node at levels 6–9 and 16–19 from the interior: 70 − level % 10 − length / 30', () => {
    const expected: [number, number[]][] = [
      [5, [20]],
      [6, [58, 20]],
      [9, [55, 20]],
      [10, [20]],
      [15, [20]],
      [16, [58, 20]],
      [19, [55, 20]],
      [20, [20]]
    ];
    for (const [level, scores] of expected) {
      const s = stateFor(map);
      s.level[1] = level;
      expect(
        from(optionsOf(s, map, aware), 2).map((o) => o.score),
        `level ${level}`
      ).toEqual(scores);
      expect(from(optionsOf(s, map, quiet), 2).map((o) => o.score)).toEqual([20]);
    }
  });

  it('grows only front nodes, only from the interior and only from free nodes', () => {
    const s = stateFor(map);
    s.level[2] = 8;
    s.level[4] = 8;
    // Node 3 does not lift interior node 2; front node 1 does not lift front node 4.
    expect(from(optionsOf(s, map, aware), 3)).toEqual([opt(20, [3, 2])]);
    expect(from(optionsOf(s, map, aware), 1).every((o) => o.cmds[0]!.to === 0)).toBe(true);
    const busy = stateFor(map);
    busy.level[1] = 8;
    busy.out[2] = [3];
    expect(from(optionsOf(busy, map, aware), 2)).toEqual([]);
  });

  /**
   * Supply: hostile 0 – front 1 – interior 2; node 3 (frontier 2) borders 1 and 2; node 4 lies
   * behind 2 (frontier 3). Node 2 lists its neighbours as 4, 3, 1.
   */
  const supply = makeMap(
    [
      { x: 100, y: 500, owner: 0, level: 5 },
      { x: 300, y: 500, owner: 1, level: 5 },
      { x: 500, y: 500, owner: 1, level: 10 },
      { x: 400, y: 300, owner: 1, level: 5 },
      { x: 700, y: 500, owner: 1, level: 5 }
    ],
    [
      [0, 1],
      [2, 4],
      [2, 3],
      [1, 2],
      [1, 3]
    ]
  );

  it('supplies only towards nodes closer to the front, and only from nodes without paths', () => {
    const s = stateFor(supply);
    expect(from(optionsOf(s, supply, quiet), 2)).toEqual([opt(20, [2, 1])]);
    s.out[2] = [3];
    expect(from(optionsOf(s, supply, quiet), 2)).toEqual([]);
  });
});

describe('opponent heuristics: switching a saturated node (lookahead levels)', () => {
  /**
   * Node 1 (faction 1, level 20) sends to 0 (player, level 12), 2 (own, level 25) and 3 (neutral,
   * level 12). Candidates: neutral 4 (level 3), neutral 5 (level 8), own 6 (level 2).
   */
  const map = makeMap(
    [
      { x: 300, y: 500, owner: 0, level: 12 },
      { x: 500, y: 500, owner: 1, level: 20 },
      { x: 700, y: 500, owner: 1, level: 25 },
      { x: 500, y: 300, level: 12 },
      { x: 500, y: 700, level: 3 },
      { x: 359, y: 359, level: 8 },
      { x: 641, y: 641, owner: 1, level: 2 }
    ],
    [
      [1, 0],
      [1, 2],
      [1, 3],
      [1, 4],
      [1, 5],
      [1, 6]
    ]
  );
  const scene = () => {
    const s = stateFor(map);
    s.out[1] = [0, 2, 3];
    return s;
  };
  const lookahead = { ...quiet, lookahead: { candidates: 3, horizon: 10, pairs: 0, budget: 1, policy: false } };

  it('stops the path to the strongest non-own target (the first on ties) for a much weaker one', () => {
    // Neutral 4: 100 − 18 − 10 + 3 = 75, minus 20 for the switch. Neutral 5 is not 5 levels weaker.
    expect(from(optionsOf(scene(), map, lookahead), 1)).toEqual([opt(55, [1, 0], [1, 4])]);
    expect(from(optionsOf(scene(), map, quiet), 1)).toEqual([]);
    const later = scene();
    later.out[1] = [3, 2, 0];
    expect(from(optionsOf(later, map, lookahead), 1)).toEqual([opt(55, [1, 3], [1, 4])]);
    const stronger = scene();
    stronger.level[3] = 13;
    // Now neutral 5 (level 8, 100 − 48 − 9 + 3 − 20) is weak enough, too.
    expect(from(optionsOf(stronger, map, lookahead), 1)).toEqual([opt(55, [1, 3], [1, 4]), opt(26, [1, 3], [1, 5])]);
  });

  it('never switches from own targets only or away from a platform below full level', () => {
    const own = scene();
    own.owner[0] = 1;
    own.owner[3] = 1;
    expect(from(optionsOf(own, map, lookahead), 1)).toEqual([]);
    const platform = makeMap(
      [
        { x: 300, y: 500, owner: 0, level: 12 },
        { x: 500, y: 500, owner: 1, level: 15, type: 'station' },
        { x: 500, y: 700, level: 3 }
      ],
      [
        [1, 0],
        [1, 2]
      ]
    );
    const p = stateFor(platform);
    p.out[1] = [0];
    expect(from(optionsOf(p, platform, lookahead), 1)).toEqual([]);
  });
});

describe('opponent decisions without lookahead', () => {
  /**
   * Helper 0 (faction 1, level 10, already sending to neutral 4) next to own nodes 1–3 (level 1),
   * each threatened by a drone from player nodes 5–7.
   */
  const map = makeMap(
    [
      { x: 500, y: 500, owner: 1, level: 10 },
      { x: 300, y: 500, owner: 1, level: 1 },
      { x: 700, y: 500, owner: 1, level: 1 },
      { x: 500, y: 300, owner: 1, level: 1 },
      { x: 500, y: 700 },
      { x: 100, y: 500, owner: 0, level: 5 },
      { x: 900, y: 500, owner: 0, level: 5 },
      { x: 500, y: 100, owner: 0, level: 5 }
    ],
    [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7]
    ]
  );
  const scene = () => {
    const s = stateFor(map);
    s.out[0] = [4];
    for (const [a, b] of [
      [5, 1],
      [6, 2],
      [7, 3]
    ] as const)
      addUnit(s, { f: 0, a, b });
    return s;
  };
  const defend = { ...quiet, defend: true, actions: 3 };

  it('skips changes that no longer fit after earlier ones, without disturbing the plan', () => {
    expect(optionsOf(scene(), map, defend).slice(0, 3)).toEqual([opt(200, [0, 1]), opt(200, [0, 2]), opt(200, [0, 3])]);
    // Node 0 has room for one more path: the other two reinforcements are skipped.
    expect(decide(scene(), map, 1, defend, stubRng())).toEqual([
      { from: 0, to: 1 },
      { from: 1, to: 5 },
      { from: 2, to: 6 }
    ]);
  });

  it('hesitates only with a draw below the hesitation', () => {
    const plan = decide(scene(), map, 1, defend, stubRng());
    expect(decide(scene(), map, 1, { ...defend, hesitation: 0.5 }, stubRng(0.5))).toEqual(plan);
    expect(decide(scene(), map, 1, { ...defend, hesitation: 0.5 }, stubRng(0.49))).toEqual([]);
  });
});

describe('opponent evaluation', () => {
  /** Faction 0: standard 5 and bastion 9; faction 1: shipyard 12 and platform 20; three neutrals. */
  const map = makeMap(
    [
      { x: 100, y: 100, owner: 0, level: 5 },
      { x: 300, y: 100, owner: 0, level: 9, type: 'bastion' },
      { x: 100, y: 300, owner: 1, level: 12, type: 'shipyard' },
      { x: 300, y: 300, owner: 1, level: 20, type: 'station' },
      { x: 500, y: 300, level: 4 },
      { x: 500, y: 500, level: 3, type: 'bastion' },
      { x: 300, y: 500, level: 7 },
      { x: 500, y: 100, level: 6 }
    ],
    [
      [0, 1],
      [2, 3],
      [3, 4],
      [3, 5],
      [1, 7],
      [3, 7]
    ]
  );
  const scene = () => {
    const s = stateFor(map);
    s.half[5] = 1;
    addUnit(s, { f: 0, k: 1, a: 0, b: 1 });
    addUnit(s, { f: 1, a: 2, b: 3 });
    return s;
  };

  it('counts node value, type, level, path capacity and half the strength in flight', () => {
    // 0: (20 + 0 + 5 + 6) + (20 + 6 + 9 + 6) + 3/2; 1: (20 + 10 + 12 + 12) + (20 + 4 + 20 + 18) + 1/2.
    expect(material(scene(), map)).toEqual([73.5, 116.5]);
  });

  it('subtracts weighted rival material and 0.6 per level of neutrals next to own nodes', () => {
    const s = scene();
    expect(effectiveLevel(map, s, 5)).toBe(5);
    // Neutrals 4 (4), 5 (bastion, 5) and 7 (6, also next to faction 0) border faction 1; 6 borders nobody.
    expect(evaluate(s, map, 1, [1, 0])).toBeCloseTo(116.5 - 73.5 - 0.6 * (4 + 5 + 6), 10);
    expect(evaluate(s, map, 1, [0.5, 0])).toBeCloseTo(116.5 - 36.75 - 0.6 * 15, 10);
    expect(evaluate(s, map, 0, [0, 1])).toBeCloseTo(73.5 - 116.5 - 0.6 * 6, 10);
    const gone = scene();
    gone.owner[0] = gone.owner[1] = -1;
    gone.units = [];
    expect(evaluate(gone, map, 0, [0, 1])).toBe(-100_000);
  });

  it('weights the weakest living rival double in free-for-all', () => {
    /** One isolated standard node per faction at the given levels (0 = eliminated). */
    const weights = (levels: number[], faction = 1) => {
      const four = makeMap(
        levels.map((level, f) => ({ x: 100 * f, y: 100, owner: level > 0 ? f : -1, level: Math.max(1, level) })),
        [],
        4
      );
      return rivalWeights(stateFor(four), four, faction, true);
    };
    expect(weights([1, 5, 3, 4])).toEqual([0.5, 0, 0.25, 0.25]);
    expect(weights([5, 5, 3, 0])).toEqual([0.25, 0, 0.5, 0.25]);
    expect(weights([5, 1, 3, 4])).toEqual([0.25, 0, 0.5, 0.25]);
    expect(weights([3, 5, 3, 5])).toEqual([0.5, 0, 0.25, 0.25]);
    expect(weights([4, 5, 3, 5], 2)).toEqual([0.5, 0.25, 0, 0.25]);
  });
});
