import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { NEUTRAL, observe, type Order, type World } from '@wp/strategy-engine';
import { planAi } from '../src/ai';
import { generatedMapProblems, generateMap } from '../src/generator';
import { MAP_HEIGHTS, MAP_WIDTHS, type EditMap } from '../src/maps';
import { isValidState, lockTurn, newGame, planOrder, PLAYER, OPPONENT, rulesOf } from '../src/rules';
import { FIELD_EXERCISE } from '../src/scenarios';

/**
 * The long tests of generator.test.ts (ADR 0021: `*.slow.test.ts` runs in CI but not under Stryker):
 * every size with several seeds, the fast-check properties over random seeds, whole AI games on
 * generated maps and the mirror symmetry of every seat over many turns.
 */

const SIZES = MAP_WIDTHS.flatMap((w) => MAP_HEIGHTS.map((h) => [w, h] as const));

describe('map generator (I6c, P9)', () => {
  it('every size and seed gives a map the independent validator accepts; the same seed gives the same map', () => {
    for (const [w, h] of SIZES) {
      for (let seed = 0; seed < 6; seed++) {
        const map = generateMap(w, h, seed, 'Random');
        expect(generatedMapProblems(map), `${w}×${h} seed ${seed}`).toEqual([]);
        expect(map).toMatchObject({ w, h, name: 'Random' });
        expect(generateMap(w, h, seed, 'Random')).toEqual(map);
      }
      // Different seeds give different maps.
      expect(new Set([0, 1, 2, 3].map((seed) => generateMap(w, h, seed).terrain)).size).toBeGreaterThan(1);
    }
  }, 120_000);

  it('asymmetric maps: every size and seed passes the validator in asymmetric mode and is not mirrored; any seed (property)', () => {
    for (const [w, h] of SIZES) {
      for (let seed = 0; seed < 4; seed++) {
        const map = generateMap(w, h, seed, 'Random', 2, true);
        expect(generatedMapProblems(map, true), `${w}×${h} seed ${seed}`).toEqual([]);
        expect(generatedMapProblems(map), `${w}×${h} seed ${seed}`).toContain('not symmetric');
      }
    }
    fc.assert(
      fc.property(fc.constantFrom(...SIZES), fc.integer({ min: 0, max: 0xffffffff }), ([w, h], seed) => {
        expect(generatedMapProblems(generateMap(w, h, seed, '', 2, true), true)).toEqual([]);
      }),
      { numRuns: 100 }
    );
  }, 300_000);

  it('property: any seed on any size passes the validator (P9)', () => {
    fc.assert(
      fc.property(fc.constantFrom(...SIZES), fc.integer({ min: 0, max: 0xffffffff }), ([w, h], seed) => {
        expect(generatedMapProblems(generateMap(w, h, seed))).toEqual([]);
      }),
      { numRuns: 150 }
    );
  });

  it('the opponent plays generated maps of every size class: every turn a valid save', () => {
    for (const [w, h, seed] of [[10, 8, 1], [16, 12, 2], [24, 16, 3]] as const) {
      let s = newGame(seed, FIELD_EXERCISE, 'normal', 12, false, generateMap(w, h, seed, `Random ${w}×${h}`));
      expect(s.scenario).toBe('custom');
      while (s.phase === 'plan') {
        for (const c of planAi(observe(s.world, rulesOf(s), PLAYER), rulesOf(s), 'normal')) s = planOrder(s, c.unit, c.order, c.doctrine) ?? s;
        s = lockTurn(s);
        expect(isValidState(JSON.parse(JSON.stringify(s))), `${w}×${h} turn ${s.world.turn}`).toBe(true);
      }
      expect(s.world.turn).toBe(12);
      expect(s.world.entities.some((e) => e.side === OPPONENT)).toBe(true);
    }
  }, 120_000);

  it('the opponent gets through a ring of holding units around the post it cannot see (random maps where its storm used to stall)', () => {
    // A passive player whose starting pieces ring the post: every move onto the post found no way
    // and ended at once, turn after turn; these games ran past turn 120 before the fix (now lost at 83–94).
    for (const [w, h, seed, level] of [[20, 14, 1, 'normal'], [20, 14, 1, 'hard'], [24, 16, 0, 'hard']] as const) {
      let s = newGame(seed, FIELD_EXERCISE, level, null, false, generateMap(w, h, seed));
      while (s.phase === 'plan' && s.world.turn < 120) s = lockTurn(s);
      expect(`${s.result}@${s.world.turn}`, `${w}×${h} seed ${seed} ${level}`).toMatch(/^lost@\d+$/);
    }
  }, 120_000);
});

describe('map generator, four bases (Generator C, owner decisions 2026-10-18)', () => {
  /** The seat whose quarter holds (x, y): 0 bottom left, 1 top left, 2 top right, 3 bottom right. */
  const quarterOf = (map: EditMap, x: number, y: number) => (y >= map.h / 2 ? (x < map.w / 2 ? 0 : 3) : x < map.w / 2 ? 1 : 2);

  it('every size and seed gives a four-base map the validator accepts; the same seed the same map, unrelated to the two-side one', () => {
    for (const [w, h] of SIZES) {
      for (let seed = 0; seed < 4; seed++) {
        const map = generateMap(w, h, seed, 'Random', 4);
        expect(generatedMapProblems(map), `${w}×${h} seed ${seed}`).toEqual([]);
        expect(map).toMatchObject({ w, h, name: 'Random', seats: 4 });
        expect(generateMap(w, h, seed, 'Random', 4)).toEqual(map);
        expect(generateMap(w, h, seed, 'Random')).not.toHaveProperty('seats');
        // Each seat's units stand in its own quarter, its post near its corner.
        for (const u of map.units) expect(quarterOf(map, u.x, u.y), `${w}×${h} seed ${seed} ${u.kind} of ${u.side}`).toBe(u.side);
      }
      expect(new Set([0, 1, 2, 3].map((seed) => generateMap(w, h, seed, '', 4).terrain)).size, `${w}×${h}`).toBeGreaterThan(1);
    }
    expect(() => generateMap(12, 10, 1, '', 3 as 4)).toThrow(RangeError);
  }, 120_000);

  it('property: any seed on any size passes the validator (P9)', () => {
    fc.assert(
      fc.property(fc.constantFrom(...SIZES), fc.integer({ min: 0, max: 0xffffffff }), ([w, h], seed) => {
        expect(generatedMapProblems(generateMap(w, h, seed, '', 4))).toEqual([]);
      }),
      { numRuns: 80 }
    );
  });

  it('every seat plans alike: mirrored left to right or top to bottom, a seat\'s plan is the mirrored seat\'s plan (each seat\'s frame)', () => {
    const map = generateMap(20, 14, 7, '', 4);
    const { w: W, h: H } = map;
    const mirrors = [
      { at: (x: number, y: number): [number, number] => [W - 1 - x, y], seat: [3, 2, 1, 0] },
      { at: (x: number, y: number): [number, number] => [x, H - 1 - y], seat: [1, 0, 3, 2] }
    ];
    for (const { at, seat } of mirrors) {
      const next = (side: number) => (side === NEUTRAL ? NEUTRAL : seat[side]!);
      const cell = (c: number) => {
        const [x, y] = at(c % W, Math.floor(c / W));
        return y * W + x;
      };
      const order = (o: Order): Order => {
        if (o.type === 'move' || o.type === 'build') return { ...o, x: at(o.x, o.y)[0], y: at(o.x, o.y)[1] };
        if (o.type === 'patrol') return { ...o, x: at(o.x, o.y)[0], y: at(o.x, o.y)[1], rx: at(o.rx, o.ry)[0], ry: at(o.rx, o.ry)[1] };
        return o;
      };
      const mirrored = (world: World): World => {
        const perm = <T,>(list: readonly T[]): T[] => {
          const out = [...list];
          list.forEach((v, s) => (out[next(s)] = v));
          return out;
        };
        return {
          ...structuredClone(world),
          map: { ...world.map, deposits: (world.map.deposits ?? []).map((d) => ({ ...d, x: at(d.x, d.y)[0], y: at(d.x, d.y)[1] })).sort((a, b) => a.y * W + a.x - (b.y * W + b.x)) },
          ...(world.supply && { supply: perm(world.supply) }),
          ...(world.out && { out: world.out.map(next).sort((a, b) => a - b) }),
          entities: world.entities.map((e) => ({
            ...structuredClone(e),
            side: next(e.side),
            x: at(e.x, e.y)[0],
            y: at(e.x, e.y)[1],
            order: order(e.order),
            ...(e.stall && { stall: { ...e.stall, goal: e.stall.goal < W * H ? cell(e.stall.goal) : e.stall.goal } }),
            ...(e.prev !== undefined && { prev: cell(e.prev) })
          })),
          projectiles: world.projectiles.map((p) => ({ ...p, side: next(p.side), x: at(p.x, p.y)[0], y: at(p.x, p.y)[1] })),
          ...(world.intel && { intel: perm(world.intel.map((list) => list.map((r) => ({ ...r, side: next(r.side), x: at(r.x, r.y)[0], y: at(r.x, r.y)[1] })))) })
        };
      };
      for (const level of ['normal', 'hard'] as const) {
        let s = newGame(1, FIELD_EXERCISE, level, 30, false, map, 3);
        const rules = rulesOf(s);
        for (let t = 0; t < 10 && s.phase === 'plan'; t++) {
          const r = mirrored(s.world);
          for (let side = 0; side < 4; side++) {
            if (s.world.out?.includes(side)) continue;
            const plan = planAi(observe(s.world, rules, side), rules, level).map((c) => ({ ...c, side: next(c.side), order: order(c.order) }));
            expect(planAi(observe(r, rules, next(side)), rules, level), `${level} turn ${t} seat ${side}`).toEqual(plan);
          }
          for (const c of planAi(observe(s.world, rules, PLAYER), rules, level)) s = planOrder(s, c.unit, c.order, c.doctrine) ?? s;
          s = lockTurn(s);
        }
      }
    }
  }, 300_000);
});
