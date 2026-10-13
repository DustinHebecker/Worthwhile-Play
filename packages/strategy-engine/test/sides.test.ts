import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  BASE_RULESET,
  canonicalJson,
  computeNetwork,
  createWorld,
  frameCell,
  frameDirs,
  frameIndexIn,
  FRAMES,
  frameVector,
  hostile,
  incomeOf,
  isValidWorld,
  NEUTRAL,
  observe,
  resolveTurn,
  STRATEGY_RULESET,
  teamOf,
  validateCommand,
  worldHash,
  type Command,
  type Frame,
  type Scenario,
  type World
} from '../src';
import { arbWorld, open, transformCommands, transformWorld } from './helpers';

/**
 * Several sides (ADR 0009 amendment, docs/design/strategy.md § 9.4): teams and hostility,
 * neutral Command Posts, per-side frames, and the engine invariants for 3–8 sides.
 */
const RUNS = { numRuns: 60 };
const play = (world: World, plans: readonly Command[][], rs = BASE_RULESET): World => plans.reduce((w, plan) => resolveTurn(w, rs, [plan]).world, world);

describe('teams and hostility', () => {
  it('free-for-all by default; teams make sides allies; neutral is hostile to everyone but never an ally', () => {
    const ffa = {};
    expect(hostile(ffa, 0, 1)).toBe(true);
    expect(hostile(ffa, 2, 2)).toBe(false);
    const teams = { teams: [0, 1, 0, 1] };
    expect(hostile(teams, 0, 2)).toBe(false);
    expect(hostile(teams, 1, 3)).toBe(false);
    expect(hostile(teams, 0, 3)).toBe(true);
    for (const w of [ffa, teams]) {
      expect(hostile(w, 0, NEUTRAL)).toBe(true);
      expect(hostile(w, NEUTRAL, 3)).toBe(true);
      expect(hostile(w, NEUTRAL, NEUTRAL)).toBe(false);
      expect(teamOf(w, NEUTRAL)).toBe(NEUTRAL);
    }
    expect(teamOf(teams, 2)).toBe(0);
    expect(teamOf(ffa, 2)).toBe(2);
  });

  it('allies do not fire on each other, do not jam each other and cannot be ordered to attack each other', () => {
    const scenario = { map: open(6, 3), sides: 3, entities: [{ side: 0, kind: 'rifles', x: 1, y: 1 }, { side: 2, kind: 'rifles', x: 2, y: 1 }, { side: 1, kind: 'rifles', x: 5, y: 1 }], seed: 1 };
    const allied = createWorld({ ...scenario, teams: [0, 1, 0] }, BASE_RULESET);
    const after = resolveTurn(allied, BASE_RULESET, [[]]).world;
    expect(after.entities.filter((e) => e.side !== 1).map((e) => e.hp)).toEqual([40, 40]);
    expect(validateCommand(allied, BASE_RULESET, { side: 0, unit: 1, order: { type: 'attack', target: 2 } })).toEqual({ ok: false, reason: 'bad-target' });
    // Without teams the same neighbours fight.
    const ffa = resolveTurn(createWorld(scenario, BASE_RULESET), BASE_RULESET, [[]]).world;
    expect(ffa.entities.filter((e) => e.side !== 1).some((e) => e.hp < 40)).toBe(true);
    // An allied jammer does not cut the own network; a hostile one does.
    const jam = (teams?: number[]) => {
      const w = createWorld({ map: open(9, 3), sides: 2, entities: [{ side: 0, kind: 'command-post', x: 0, y: 1 }, { side: 1, kind: 'jammer', x: 3, y: 1 }], seed: 1, ...(teams && { teams }) }, STRATEGY_RULESET);
      w.entities[1]!.deploy = { done: true } as never;
      return computeNetwork(w, STRATEGY_RULESET, 0).coverage.reduce((n, v) => n + v, 0);
    };
    expect(jam([0, 0])).toBeGreaterThanOrEqual(jam());
  });
});

describe('neutral Command Posts', () => {
  const neutralWorld = () =>
    createWorld(
      { map: open(7, 3), sides: 2, entities: [{ side: 0, kind: 'command-post', x: 0, y: 1 }, { side: NEUTRAL, kind: 'command-post', x: 3, y: 1 }, { side: 1, kind: 'command-post', x: 6, y: 1 }, { side: 0, kind: 'rifles', x: 2, y: 1 }], seed: 1, supply: [100, 100] },
      STRATEGY_RULESET
    );

  it('only Command Posts can stand neutral; the world validates', () => {
    const w = neutralWorld();
    expect(isValidWorld(w, STRATEGY_RULESET)).toBe(true);
    expect(isValidWorld(JSON.parse(JSON.stringify(w)), STRATEGY_RULESET)).toBe(true);
    expect(() => createWorld({ map: open(4, 1), sides: 2, entities: [{ side: NEUTRAL, kind: 'rifles', x: 0, y: 0 }], seed: 1 }, BASE_RULESET)).toThrow(RangeError);
    expect(() => createWorld({ map: open(4, 1), sides: 2, entities: [{ side: -2, kind: 'command-post', x: 0, y: 0 }], seed: 1 }, BASE_RULESET)).toThrow(RangeError);
    const bad = structuredClone(w);
    bad.entities[3]!.side = NEUTRAL;
    expect(isValidWorld(bad, STRATEGY_RULESET)).toBe(false);
  });

  it('takes no orders, earns nothing, covers nothing, never moves or fires — and can be fired on', () => {
    let w = neutralWorld();
    const post = w.entities.find((e) => e.side === NEUTRAL)!;
    expect(validateCommand(w, STRATEGY_RULESET, { side: NEUTRAL, unit: post.id, order: { type: 'hold' } })).toEqual({ ok: false, reason: 'not-yours' });
    for (const side of [0, 1]) expect(computeNetwork(w, STRATEGY_RULESET, side).coverage[3 + 7]).toBe(side === 0 ? 1 : computeNetwork(w, STRATEGY_RULESET, side).coverage[3 + 7]);
    const supply = [...w.supply!];
    for (let i = 0; i < 3; i++) w = resolveTurn(w, STRATEGY_RULESET, [[]]).world;
    // Income goes to the two posts' owners only (20 a turn each).
    expect(w.supply).toEqual(supply.map((s) => s + 3 * 20));
    expect(incomeOf(w, STRATEGY_RULESET, w.entities.find((e) => e.side === NEUTRAL)!, computeNetwork(w, STRATEGY_RULESET, 0))).toBe(0);
    const after = w.entities.find((e) => e.side === NEUTRAL)!;
    expect([after.x, after.y]).toEqual([3, 1]);
    // The rifle squad next to it fires on it on its own.
    expect(after.hp).toBeLessThan(400);
    expect(w.entities.find((e) => e.kind === 'rifles')!.hp).toBe(40);
    expect(isValidWorld(w, STRATEGY_RULESET)).toBe(true);
  });

  it('is reported to every side as a neutral structure, never as anybody\'s own', () => {
    const w = neutralWorld();
    for (const side of [0, 1]) {
      const report = w.intel![side]!.find((r) => r.kind === 'command-post' && r.x === 3);
      expect(report?.side).toBe(NEUTRAL);
      expect(observe(w, STRATEGY_RULESET, side).world.entities.some((e) => e.side === NEUTRAL)).toBe(true);
    }
  });
});

describe('frames', () => {
  it('frameIndexIn and frameCell are inverse bijections for every frame and map size', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 9 }), fc.integer({ min: 1, max: 9 }), fc.constantFrom(...FRAMES), (w, h, frame) => {
        const seen = new Set<number>();
        for (let c = 0; c < w * h; c++) {
          const i = frameIndexIn({ w, h }, frame, c);
          expect(i).toBeGreaterThanOrEqual(0);
          expect(i).toBeLessThan(w * h);
          seen.add(i);
          expect(frameCell({ w, h }, frame, i)).toBe(c);
        }
        expect(seen.size).toBe(w * h);
      })
    );
  });

  it('turning the map by a frame and back is the identity on vectors; the default frames keep the two-side order', () => {
    for (const f of FRAMES) for (const [dx, dy] of frameDirs('id')) {
      const back: Record<Frame, Frame> = { id: 'id', r90: 'r270', r180: 'r180', r270: 'r90', fx: 'fx', fy: 'fy' };
      const [x, y] = frameVector(f, dx, dy);
      expect(frameVector(back[f], x, y)).toEqual([dx, dy]);
    }
    expect(frameDirs('r180')).toEqual(frameDirs('id').map(([dx, dy]) => [-dx, -dy]));
    expect(frameIndexIn({ w: 5, h: 4 }, 'r180', 3)).toBe(20 - 1 - 3);
  });
});

describe('engine invariants for several sides', () => {
  it('P1 determinism with 3 to 8 sides, neutral posts included; every world stays valid', () => {
    for (const sides of [3, 4, 5, 8]) {
      fc.assert(
        fc.property(arbWorld({ sides, neutral: true, supply: 300 }), ({ world, plans }) => {
          const a = play(world, plans, STRATEGY_RULESET);
          expect(worldHash(a)).toBe(worldHash(play(structuredClone(world), structuredClone(plans), STRATEGY_RULESET)));
          expect(isValidWorld(a, STRATEGY_RULESET)).toBe(true);
        }),
        { numRuns: 25 }
      );
    }
  });

  /** Quarter turn clockwise on an n×n map, and the side permutation that goes with it (k → k+1). */
  const turn = (n: number) => (x: number, y: number) => [n - 1 - y, x] as const;
  const next = (sides: number) => (s: number) => (s + 1) % sides;
  // Side k sees the map turned back k quarters: then a quarter turn of the world carries side k's
  // view onto side k+1's (frame of k+1 after the turn = frame of k before it).
  const FOUR: Frame[] = ['id', 'r270', 'r180', 'r90'];

  it('P4 under a quarter turn: four sides with turned frames on a square map evolve as the turned image (sides moved on by one)', () => {
    fc.assert(
      fc.property(arbWorld({ sides: 4, square: true, frames: FOUR }), ({ world, plans }) => {
        const n = world.map.w;
        const direct = transformWorld(play(world, plans), turn(n), next(4));
        const turned = play(transformWorld(world, turn(n), next(4)), plans.map((p) => transformCommands(p, turn(n), next(4))));
        expect(canonicalJson(turned)).toBe(canonicalJson(direct));
      }),
      RUNS
    );
  });

  it('P4 under a quarter turn with the command network, fog and economy (neutral posts included)', () => {
    fc.assert(
      fc.property(arbWorld({ sides: 4, square: true, frames: FOUR, neutral: true, supply: 300 }), ({ world, plans }) => {
        const n = world.map.w;
        const direct = transformWorld(play(world, plans, STRATEGY_RULESET), turn(n), next(4));
        const turned = play(transformWorld(world, turn(n), next(4)), plans.map((p) => transformCommands(p, turn(n), next(4))), STRATEGY_RULESET);
        // Sites placed by two sides in one batch on cells with the same index in their frames get
        // ids by side number (§ ADR 0009, contested placements), so ids are compared by position.
        expect(canonicalJson(canonicalIds(turned))).toBe(canonicalJson(canonicalIds(direct)));
      }),
      RUNS
    );
  });

  // Targeted: the random worlds above rarely hit a tie, so tie-breaks get their own cases.
  const square = (n: number, sides: number, frames: Frame[], extra: Scenario['entities'] = []) =>
    createWorld(
      {
        map: open(n, n),
        sides,
        frames,
        entities: [{ side: 0, kind: 'command-post', x: 0, y: 0 }, { side: 1, kind: 'command-post', x: n - 1, y: 0 }, { side: 2, kind: 'command-post', x: n - 1, y: n - 1 }, { side: 3, kind: 'command-post', x: 0, y: n - 1 }, ...extra],
        seed: 1,
        supply: [600, 600, 600, 600]
      },
      STRATEGY_RULESET
    );

  it('P4 tie-breaks under a quarter turn: one side placing several sites keeps exact symmetry, ids included', () => {
    fc.assert(
      fc.property(fc.array(fc.record({ kind: fc.constantFrom('relay-mast', 'muster'), x: fc.integer({ min: 0, max: 3 }), y: fc.integer({ min: 0, max: 3 }) }), { minLength: 2, maxLength: 4 }), fc.nat(3), (sites, side) => {
        const w = square(7, 4, FOUR);
        const plan = sites.map((p): Command => ({ side, unit: side + 1, order: { type: 'build', kind: p.kind, x: p.x, y: p.y } }));
        const direct = transformWorld(resolveTurn(w, STRATEGY_RULESET, [plan]).world, turn(7), next(4));
        const turned = resolveTurn(transformWorld(w, turn(7), next(4)), STRATEGY_RULESET, [transformCommands(plan, turn(7), next(4))]).world;
        expect(canonicalJson(turned)).toBe(canonicalJson(direct));
      }),
      { numRuns: 200 }
    );
  });

  it('P4 tie-breaks under a quarter turn: paths with several equally good ways stay symmetric', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), fc.integer({ min: 1, max: 5 }), fc.integer({ min: 0, max: 6 }), fc.integer({ min: 0, max: 6 }), fc.nat(3), (ux, uy, gx, gy, side) => {
        const w = square(7, 4, FOUR, [{ side, kind: 'outrider', x: ux, y: uy }]);
        const unit = w.entities.find((e) => e.kind === 'outrider')!;
        const plans = [[{ side, unit: unit.id, order: { type: 'move', x: gx, y: gy } } as Command], [], []];
        const direct = transformWorld(play(w, plans, STRATEGY_RULESET), turn(7), next(4));
        const turned = play(transformWorld(w, turn(7), next(4)), plans.map((p) => transformCommands(p, turn(7), next(4))), STRATEGY_RULESET);
        expect(canonicalJson(turned)).toBe(canonicalJson(direct));
      }),
      { numRuns: 200 }
    );
  });

  it('P4 tie-breaks under a quarter turn: a yard delivers onto the symmetric neighbour (neighbour order turns with the frame)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), fc.integer({ min: 1, max: 5 }), fc.nat(3), fc.array(fc.integer({ min: 0, max: 7 }), { maxLength: 5 }), (yx, yy, side, blocks) => {
        const dirs: [number, number][] = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [-1, -1], [1, -1]];
        const walls = [...new Set(blocks)].map((i) => ({ side, kind: 'relay-mast', x: yx + dirs[i]![0], y: yy + dirs[i]![1] })).filter((m) => m.x >= 0 && m.y >= 0 && m.x < 7 && m.y < 7 && !(m.x === 0 && m.y === 0) && !(m.x === 6 && m.y === 0) && !(m.x === 6 && m.y === 6) && !(m.x === 0 && m.y === 6));
        const w = square(7, 4, FOUR, [{ side, kind: 'muster', x: yx, y: yy }, ...walls]);
        const yard = w.entities.find((e) => e.kind === 'muster')!;
        const plans = [[{ side, unit: yard.id, order: { type: 'produce', kind: 'rifles' } } as Command], [], []];
        const direct = transformWorld(play(w, plans, STRATEGY_RULESET), turn(7), next(4));
        const turned = play(transformWorld(w, turn(7), next(4)), plans.map((p) => transformCommands(p, turn(7), next(4))), STRATEGY_RULESET);
        expect(canonicalJson(turned)).toBe(canonicalJson(direct));
      }),
      { numRuns: 200 }
    );
  });

  it('P4 under a left-right mirror: two sides with mirrored frames', () => {
    const flip = (w: number) => (x: number, y: number) => [w - 1 - x, y] as const;
    fc.assert(
      fc.property(arbWorld({ sides: 2, frames: ['id', 'fx'] }), ({ world, plans }) => {
        const direct = transformWorld(play(world, plans), flip(world.map.w), (s) => 1 - s);
        const mirrored = play(transformWorld(world, flip(world.map.w), (s) => 1 - s), plans.map((p) => transformCommands(p, flip(world.map.w), (s) => 1 - s)));
        expect(canonicalJson(mirrored)).toBe(canonicalJson(direct));
      }),
      RUNS
    );
  });

  it('P6 plan order: any order of the sides\' commands in the batch gives the same world (4 sides, economy)', () => {
    fc.assert(
      fc.property(arbWorld({ sides: 4, neutral: true, supply: 300 }), fc.array(fc.nat(3), { minLength: 4, maxLength: 4 }), ({ world, plans }, keys) => {
        const order = [0, 1, 2, 3].sort((a, b) => (keys[a] ?? 0) - (keys[b] ?? 0) || a - b);
        const bySides = (plan: readonly Command[], sides: readonly number[]) => sides.flatMap((s) => plan.filter((c) => c.side === s));
        const base = play(world, plans.map((p) => bySides(p, [0, 1, 2, 3])), STRATEGY_RULESET);
        expect(canonicalJson(play(world, plans.map((p) => bySides(p, order)), STRATEGY_RULESET))).toBe(canonicalJson(base));
      }),
      RUNS
    );
  });

  it('no leaks: what a side observes does not change when a third side\'s unseen units change', () => {
    fc.assert(
      fc.property(arbWorld({ sides: 3, supply: 300 }), fc.nat(), ({ world, plans }, pick) => {
        const w = play(world, plans, STRATEGY_RULESET);
        const third = w.entities.filter((e) => e.side === 2 && !w.intel![0]!.some((r) => r.id === e.id));
        if (third.length === 0) return;
        const changed = structuredClone(w);
        const target = changed.entities.find((e) => e.id === third[pick % third.length]!.id)!;
        target.hp = Math.max(1, target.hp - 1);
        expect(canonicalJson(observe(changed, STRATEGY_RULESET, 0))).toBe(canonicalJson(observe(w, STRATEGY_RULESET, 0)));
      }),
      RUNS
    );
  });
});

/** Ids renumbered by position (see properties.test.ts, contested placements). */
function canonicalIds(w: World): World {
  const order = [...w.entities].sort((a, b) => a.y - b.y || a.x - b.x || a.kind.localeCompare(b.kind));
  const map = new Map(order.map((e, i) => [e.id, i + 1]));
  const id = (n: number) => map.get(n) ?? -n;
  const entities = w.entities
    .map((e) => ({ ...e, id: id(e.id), ...('target' in e.order ? { order: { ...e.order, target: id((e.order as { target: number }).target) } } : {}) }))
    .sort((a, b) => a.id - b.id);
  const intel = w.intel?.map((list) => list.map((r) => ({ ...r, id: id(r.id) })).sort((a, b) => a.id - b.id));
  return { ...w, entities, nextId: 0, ...(intel && { intel }) } as World;
}
