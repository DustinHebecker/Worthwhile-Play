import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { BASE_RULESET, canReach, cellOf, findPath, flowField, maxStepCost, minStepCost, nextStep, regions, stepCost } from '../src';
import { mapOf, open } from './helpers';

const rs = BASE_RULESET;

describe('grid costs', () => {
  it('uses terrain cost orthogonally and ×1.5 diagonally', () => {
    const map = mapOf('...', '.f.', '...');
    expect(stepCost(map, rs, 0, 0, 1, 0, 'ground')).toBe(4);
    expect(stepCost(map, rs, 0, 1, 1, 1, 'ground')).toBe(6);
    expect(stepCost(map, rs, 0, 0, 1, 1, 'ground')).toBe(9);
    expect(stepCost(map, rs, 0, 0, 2, 0, 'ground')).toBeUndefined();
    expect(stepCost(map, rs, 0, 0, 0, 0, 'ground')).toBeUndefined();
  });

  it('blocks impassable terrain and corner cutting for ground, not for air', () => {
    const map = mapOf('.~', '..');
    expect(stepCost(map, rs, 0, 0, 1, 0, 'ground')).toBeUndefined();
    expect(stepCost(map, rs, 0, 1, 1, 0, 'ground')).toBeUndefined();
    expect(stepCost(map, rs, 0, 0, 1, 1, 'ground')).toBeUndefined();
    expect(stepCost(map, rs, 0, 0, 1, 1, 'air')).toBe(6);
    expect(stepCost(map, rs, 0, 0, 1, 0, 'air')).toBe(4);
  });

  it('ruleset terrain costs are even so diagonal costs stay integral', () => {
    for (const spec of Object.values(rs.terrain)) if (spec.cost !== null) expect(spec.cost % 2).toBe(0);
    expect(minStepCost(rs, 'ground')).toBe(2);
    expect(maxStepCost(rs, 'ground')).toBe(12);
    expect(minStepCost(rs, 'air')).toBe(4);
    expect(maxStepCost(rs, 'air')).toBe(6);
  });
});

describe('pathfinding', () => {
  it('finds a straight path and returns [] at the goal', () => {
    const map = open(5, 1);
    expect(findPath(map, rs, 0, 4, { layer: 'ground', side: 0 })).toEqual([1, 2, 3, 4]);
    expect(findPath(map, rs, 2, 2, { layer: 'ground', side: 0 })).toEqual([]);
    expect(findPath(map, rs, 0, 99, { layer: 'ground', side: 0 })).toBeUndefined();
  });

  it('routes around water and prefers roads', () => {
    const map = mapOf('.....', '.~~~.', '.....');
    const path = findPath(map, rs, cellOf(map, 0, 1), cellOf(map, 4, 1), { layer: 'ground', side: 0 });
    expect(path?.at(-1)).toBe(cellOf(map, 4, 1));
    expect(path?.every((c) => map.terrain[c] !== '~')).toBe(true);
    const roads = mapOf('.....', '=====', '.....');
    // Road cost 2 ×4 = 8 beats plain cost 4 ×4 = 16.
    const via = findPath(roads, rs, cellOf(roads, 0, 1), cellOf(roads, 4, 1), { layer: 'ground', side: 0 });
    expect(via).toEqual([6, 7, 8, 9]);
  });

  it('reports unreachable goals, may end on a blocked goal, and respects blockers', () => {
    const map = mapOf('.~.', '.~.', '.~.');
    expect(findPath(map, rs, 0, 2, { layer: 'ground', side: 0 })).toBeUndefined();
    expect(findPath(map, rs, 0, 2, { layer: 'air', side: 0 })).toHaveLength(2);
    const plain = open(3, 1);
    expect(findPath(plain, rs, 0, 2, { layer: 'ground', side: 0, blocked: new Set([1]) })).toBeUndefined();
    expect(findPath(plain, rs, 0, 1, { layer: 'ground', side: 0, blocked: new Set([1]) })).toEqual([1]);
  });

  it('breaks ties in the side frame so that mirrored searches give mirrored paths', () => {
    const map = open(5, 5);
    const a = findPath(map, rs, cellOf(map, 0, 0), cellOf(map, 4, 2), { layer: 'ground', side: 0 }) ?? [];
    const b = findPath(map, rs, cellOf(map, 4, 4), cellOf(map, 0, 2), { layer: 'ground', side: 1 }) ?? [];
    expect(b).toEqual(a.map((c) => 24 - c));
  });

  it('builds a flow field whose next steps descend to the goal', () => {
    const map = mapOf('.....', '.~~~.', '.....');
    const goal = cellOf(map, 4, 2);
    const field = flowField(map, rs, [goal], 'ground');
    expect(field[goal]).toBe(0);
    expect(field[cellOf(map, 1, 1)]).toBe(-1);
    let cell = cellOf(map, 0, 0);
    for (let i = 0; i < 10 && cell !== goal; i++) {
      const next = nextStep(map, rs, field, cell, 'ground', 0);
      expect(next).toBeDefined();
      expect(field[next as number]).toBeLessThan(field[cell] as number);
      cell = next as number;
    }
    expect(cell).toBe(goal);
    expect(nextStep(map, rs, field, goal, 'ground', 0)).toBeUndefined();
    // Path length agrees with A*.
    const path = findPath(map, rs, cellOf(map, 0, 0), goal, { layer: 'ground', side: 0 }) ?? [];
    let cost = 0;
    let prev = cellOf(map, 0, 0);
    for (const c of path) {
      cost += stepCost(map, rs, prev % 5, Math.floor(prev / 5), c % 5, Math.floor(c / 5), 'ground') as number;
      prev = c;
    }
    expect(field[cellOf(map, 0, 0)]).toBe(cost);
  });
});

describe('canReach agrees with findPath', () => {
  it('for random maps, blockers, starts and goals', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 9 }),
        fc.integer({ min: 2, max: 9 }),
        fc.array(fc.constantFrom('.', '.', 'f', 's', '~', '^'), { minLength: 81, maxLength: 81 }),
        fc.array(fc.nat(80), { maxLength: 20 }),
        fc.nat(80),
        fc.nat(80),
        fc.constantFrom('ground' as const, 'air' as const),
        (w, h, terrain, blockedCells, s, g, layer) => {
          const map = { w, h, terrain: terrain.slice(0, w * h).join('') };
          const n = w * h;
          const blocked = new Set(blockedCells.map((c) => c % n));
          const start = s % n;
          const goal = g % n;
          const region = regions(map, BASE_RULESET, layer, blocked);
          const path = findPath(map, BASE_RULESET, start, goal, { layer, side: 0, blocked });
          expect(canReach(map, BASE_RULESET, layer, region, start, goal)).toBe(path !== undefined);
        }
      ),
      { numRuns: 1500 }
    );
  });

  it('a bounded search finds the same route when one is cheap enough, and none otherwise', () => {
    const map = { w: 7, h: 3, terrain: '.......' + '.^^^^^.' + '.......' };
    const free = findPath(map, BASE_RULESET, 7, 13, { layer: 'ground', side: 0 })!;
    expect(free.length).toBeGreaterThan(0);
    expect(findPath(map, BASE_RULESET, 7, 13, { layer: 'ground', side: 0, maxCost: 1000 })).toEqual(free);
    expect(findPath(map, BASE_RULESET, 7, 13, { layer: 'ground', side: 0, maxCost: 10 })).toBeUndefined();
  });
});
