import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { BASE_RULESET, canonicalJson, isValidWorld, resolveTurn, worldHash, type Command, type World } from '../src';
import { arbScenario, mirrorCommands, mirrorWorld } from './helpers';

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
