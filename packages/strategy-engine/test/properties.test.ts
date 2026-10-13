import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { BASE_RULESET, canonicalJson, createWorld, isValidWorld, resolveTurn, STRATEGY_RULESET, worldHash, type Command, type World } from '../src';
import { arbScenario, mirrorCommands, mirrorWorld, open } from './helpers';

const rs = BASE_RULESET;
const play = (world: World, plans: readonly Command[][]): World =>
  plans.reduce((w, plan) => resolveTurn(w, rs, [plan]).world, world);
const RUNS = { numRuns: 150 };

describe('engine properties (docs/design/strategy.md § 13)', () => {
  it('P1 determinism: same seed + state + commands ⇒ identical world hash', () => {
    fc.assert(
      fc.property(arbScenario, ({ world, plans }) => {
        expect(worldHash(play(world, plans))).toBe(worldHash(play(structuredClone(world), structuredClone(plans))));
      }),
      RUNS
    );
  });

  it('P2 purity: resolving never mutates its inputs', () => {
    fc.assert(
      fc.property(arbScenario, ({ world, plans }) => {
        const before = canonicalJson({ world, plans });
        play(world, plans);
        expect(canonicalJson({ world, plans })).toBe(before);
      }),
      RUNS
    );
  });

  it('P3 save round-trip: continuing from a JSON copy equals continuing in memory', () => {
    fc.assert(
      fc.property(arbScenario, fc.nat(3), ({ world, plans }, split) => {
        const mid = play(world, plans.slice(0, split));
        const restored = JSON.parse(JSON.stringify(mid)) as World;
        expect(isValidWorld(restored, rs)).toBe(true);
        expect(worldHash(play(restored, plans.slice(split)))).toBe(worldHash(play(mid, plans.slice(split))));
      }),
      RUNS
    );
  });

  it('P4 mirror symmetry: a point-mirrored world with mirrored commands evolves as the mirror image', () => {
    fc.assert(
      fc.property(arbScenario, ({ world, plans }) => {
        const direct = mirrorWorld(play(world, plans));
        const mirrored = play(mirrorWorld(world), plans.map((p) => mirrorCommands(world, p)));
        expect(canonicalJson(mirrored)).toBe(canonicalJson(direct));
      }),
      RUNS
    );
  });

  it('P5 invariants: valid world, hp within bounds, unique ids, one unit per cell and layer', () => {
    fc.assert(
      fc.property(arbScenario, ({ world, plans }) => {
        let w = world;
        for (const plan of plans) {
          w = resolveTurn(w, rs, [plan]).world;
          expect(isValidWorld(w, rs)).toBe(true);
          for (const e of w.entities) {
            expect(e.hp).toBeGreaterThan(0);
            expect(e.hp).toBeLessThanOrEqual(rs.archetypes[e.kind]?.hp ?? 0);
            const terrain = w.map.terrain[e.y * w.map.w + e.x] ?? '';
            if (rs.archetypes[e.kind]?.layer === 'ground') expect(rs.terrain[terrain]?.cost).not.toBeNull();
          }
          expect(w.tick).toBe(world.tick + rs.ticksPerTurn * (w.turn - world.turn));
        }
      }),
      RUNS
    );
  });

  it('fuzz: arbitrary command data never throws and never breaks the world', () => {
    fc.assert(
      fc.property(arbScenario, fc.array(fc.record({ side: fc.integer({ min: -1, max: 3 }), unit: fc.integer({ min: -2, max: 20 }), order: fc.anything() })), ({ world }, junk) => {
        const { world: w } = resolveTurn(world, rs, [junk as unknown as Command[]]);
        expect(isValidWorld(w, rs)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

describe('engine properties with the command network (strategy ruleset)', () => {
  const net = STRATEGY_RULESET;
  const playNet = (world: World, plans: readonly Command[][]): World => plans.reduce((w, plan) => resolveTurn(w, net, [plan]).world, world);
  const asNet = (world: World): World => ({ ...world, ruleset: net.id });

  it('P1 determinism and P4 mirror symmetry hold with coverage gating, order slots and deploying', () => {
    fc.assert(
      fc.property(arbScenario, ({ world, plans }) => {
        const w = { ...asNet(world), supply: [400, 400] };
        expect(worldHash(playNet(w, plans))).toBe(worldHash(playNet(structuredClone(w), structuredClone(plans))));
        const direct = mirrorWorld(playNet(w, plans));
        const mirrored = playNet(mirrorWorld(w), plans.map((p) => mirrorCommands(w, p)));
        expect(canonicalJson(mirrored)).toBe(canonicalJson(direct));
        expect(isValidWorld(playNet(w, plans), net)).toBe(true);
      }),
      RUNS
    );
  });

  it('P6 plan order: handing in the sides\' plans the other way round changes nothing (ADR 0009), with the economy', () => {
    fc.assert(
      fc.property(arbScenario, ({ world, plans }) => {
        const w = { ...asNet(world), supply: [400, 400] };
        const bySide = (plan: readonly Command[], first: number) => [...plan.filter((c) => c.side === first), ...plan.filter((c) => c.side !== first)];
        expect(canonicalJson(playNet(w, plans.map((p) => bySide(p, 1))))).toBe(canonicalJson(playNet(w, plans.map((p) => bySide(p, 0)))));
      }),
      RUNS
    );
  });
});

describe('contested sales (review of PR #14)', () => {
  const net = STRATEGY_RULESET;
  /**
   * A structure is sold in the same batch in which the enemy attacks it and the enemy post places
   * a site on its cell; small open map, overlapping coverage. Old code (sale applied mid-batch)
   * failed this within a few dozen cases; the plan order must not matter.
   */
  const arbContested = fc.record({
    kind: fc.constantFrom('relay-mast', 'muster', 'motor-pool'),
    x: fc.integer({ min: 2, max: 5 }),
    y: fc.integer({ min: 0, max: 3 }),
    dx: fc.integer({ min: 1, max: 2 }),
    dy: fc.integer({ min: -1, max: 1 }),
    attacker: fc.constantFrom('rifles', 'lancer', 'outrider'),
    site: fc.constantFrom('relay-mast', 'muster'),
    extra: fc.boolean(),
    hidden: fc.boolean(),
    gx: fc.integer({ min: 0, max: 7 }),
    gy: fc.integer({ min: 0, max: 3 })
  });
  it('P6b: a sale contested by an attack and a placement on its cell gives the same world in both plan orders', () => {
    fc.assert(
      fc.property(arbContested, ({ kind, x, y, dx, dy, attacker, site, extra, hidden, gx, gy }) => {
        const ay = Math.max(0, Math.min(3, y + dy));
        const entities = [
          { side: 0, kind: 'command-post', x: 0, y: 1 },
          { side: 1, kind: 'command-post', x: 7, y: 2 },
          { side: 0, kind, x, y },
          { side: 1, kind: attacker, x: Math.min(7, x + dx), y: ay === 2 && x + dx >= 7 ? 3 : ay }
        ];
        const w = createWorld({ map: open(8, 4), sides: 2, entities, seed: 1, supply: [400, 400] }, net);
        // The attacker has somewhere to go if its attack is refused or ends; the structure is
        // either known to the enemy (the attack is contested) or not (the placement is).
        w.entities[3]!.order = { type: 'move', x: gx, y: gy };
        if (hidden) w.intel = w.intel!.map((list, side) => (side === 1 ? list.filter((r) => r.id !== 3) : list));
        const plans = [
          [{ side: 0, unit: 3, order: { type: 'sell' } }, ...(extra ? [{ side: 0, unit: 1, order: { type: 'build', kind: 'relay-mast', x: 1, y: 3 } }] : [])],
          [{ side: 1, unit: 4, order: { type: 'attack', target: 3 } }, { side: 1, unit: 2, order: { type: 'build', kind: site, x, y } }]
        ] as Command[][];
        const a = resolveTurn(w, net, [[...plans[0]!, ...plans[1]!]]);
        const b = resolveTurn(w, net, [[...plans[1]!, ...plans[0]!]]);
        expect(canonicalJson(b.world)).toBe(canonicalJson(a.world));
      }),
      { numRuns: 300 }
    );
  });
});

describe('contested placements (review of PR #15)', () => {
  const net = STRATEGY_RULESET;
  /**
   * Ids of entities renumbered by position (row, column, layer), references rewritten: worlds
   * that differ only in which of two sites placed in the same batch got which id compare equal.
   */
  function canonicalIds(w: World): World {
    const order = [...w.entities].sort((a, b) => a.y - b.y || a.x - b.x || a.kind.localeCompare(b.kind));
    const map = new Map(order.map((e, i) => [e.id, i + 1]));
    const id = (n: number) => map.get(n) ?? -n;
    const entities = w.entities
      .map((e) => ({ ...e, id: id(e.id), ...('target' in e.order ? { order: { ...e.order, target: id((e.order as { target: number }).target) } } : {}) }))
      .sort((a, b) => a.id - b.id);
    const intel = w.intel?.map((list) => list.map((r) => ({ ...r, id: id(r.id) })).sort((a, b) => a.id - b.id));
    return { ...w, entities, ...(intel && { intel }) } as World;
  }
  const arbPlacements = fc.array(fc.record({ side: fc.integer({ min: 0, max: 1 }), kind: fc.constantFrom('relay-mast', 'muster', 'motor-pool'), x: fc.integer({ min: 1, max: 6 }), y: fc.integer({ min: 0, max: 3 }) }), { minLength: 2, maxLength: 4 });
  it('P4 with both sides placing in one batch: the mirror image evolves as the mirror, apart from which same-batch site got which id', () => {
    fc.assert(
      fc.property(arbPlacements, (placements) => {
        const w = createWorld({ map: open(8, 4), sides: 2, entities: [{ side: 0, kind: 'command-post', x: 0, y: 1 }, { side: 1, kind: 'command-post', x: 7, y: 2 }], seed: 1, supply: [400, 400] }, net);
        const plan = placements.map((p): Command => ({ side: p.side, unit: p.side + 1, order: { type: 'build', kind: p.kind, x: p.x, y: p.y } }));
        const direct = mirrorWorld(resolveTurn(w, net, [plan]).world);
        const mirrored = resolveTurn(mirrorWorld(w), net, [mirrorCommands(w, plan)]).world;
        expect(canonicalJson(canonicalIds(mirrored))).toBe(canonicalJson(canonicalIds(direct)));
      }),
      { numRuns: 500 }
    );
  });
  it('one side placing several sites in a batch keeps exact mirror symmetry, ids included', () => {
    fc.assert(
      fc.property(arbPlacements, (placements) => {
        const w = createWorld({ map: open(8, 4), sides: 2, entities: [{ side: 0, kind: 'command-post', x: 0, y: 1 }, { side: 1, kind: 'command-post', x: 7, y: 2 }], seed: 1, supply: [400, 400] }, net);
        const plan = placements.map((p): Command => ({ side: 1, unit: 2, order: { type: 'build', kind: p.kind, x: p.x, y: p.y } }));
        const direct = mirrorWorld(resolveTurn(w, net, [plan]).world);
        const mirrored = resolveTurn(mirrorWorld(w), net, [mirrorCommands(w, plan)]).world;
        expect(canonicalJson(mirrored)).toBe(canonicalJson(direct));
      }),
      { numRuns: 300 }
    );
  });
});

describe('isValidWorld', () => {
  it('never throws and rejects junk', () => {
    fc.assert(
      fc.property(fc.anything(), (v) => {
        expect(() => isValidWorld(v, rs)).not.toThrow();
      }),
      { numRuns: 300 }
    );
    for (const junk of [null, 1, 'x', [], {}, { v: 1 }]) expect(isValidWorld(junk)).toBe(false);
  });

  it('rejects corrupted fields of a valid world', () => {
    fc.assert(
      fc.property(arbScenario, ({ world }) => {
        expect(isValidWorld(world, rs)).toBe(true);
        const bad: ((w: World) => void)[] = [
          (w) => void (w.map = { ...w.map, terrain: w.map.terrain.slice(1) }),
          (w) => void (w.tick = -1),
          (w) => void (w.nextId = 0),
          (w) => void (w.projectiles = [{ id: 1, side: 9, kind: 'rifles', x: 0, y: 0, ticks: 1 }])
        ];
        if (world.entities.length > 0) {
          bad.push(
            (w) => void (w.entities[0]!.hp = 0),
            (w) => void (w.entities[0]!.x = w.map.w),
            (w) => void (w.entities[0]!.kind = 'unknown'),
            (w) => void (w.entities[0]!.order = { type: 'teleport' } as never),
            (w) => void w.entities.push(structuredClone(w.entities[0]!))
          );
        }
        for (const corrupt of bad) {
          const copy = structuredClone(world);
          corrupt(copy);
          expect(isValidWorld(copy, rs)).toBe(false);
        }
      }),
      { numRuns: 50 }
    );
  });
});
