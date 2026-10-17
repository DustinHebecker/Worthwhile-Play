import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import {
  PRODUCTION_FALLBACK,
  generateProduction,
  greedyPlan,
  isProductionPlan,
  isProductionProblem,
  overStock,
  productionFeasible,
  productionIsInteresting,
  productionValue,
  resourceUse,
  setQty,
  setupCost,
  singleProductPlan,
  solveProduction,
  type ProductionProblem
} from '../src/production';
import { DIFFICULTIES } from '../src/common';
import { productionOracle } from './oracle';

/** 10 wood. Tables (4 wood, value 9) look best per piece, crates (3 wood, value 7) fill the stock better: 3 crates = 21 + nothing; 1 table + 2 crates = 23. */
const WOOD: ProductionProblem = {
  kind: 'production',
  resources: [{ id: 'wood', stock: 10 }],
  products: [
    { id: 'table', value: 9, use: [4], max: 3, setup: 0 },
    { id: 'crate', value: 7, use: [3], max: 3, setup: 0 }
  ]
};

describe('production: score and constraints', () => {
  it('sums value, subtracts setup costs of products made at all, and reports over-used stock', () => {
    const p: ProductionProblem = { ...WOOD, products: WOOD.products.map((x) => ({ ...x, setup: 2 })) };
    expect(productionValue(p, { qty: [1, 2] })).toBe(9 + 14 - 4);
    expect(setupCost(p, [0, 2])).toBe(2);
    expect(resourceUse(p, [2, 1])).toEqual([11]);
    expect(overStock(p, { qty: [2, 1] })).toEqual([0]);
    expect(productionFeasible(p, { qty: [1, 2] })).toBe(true);
  });

  it('clamps quantities to 0 … max and returns the same plan when nothing changes', () => {
    const plan = { qty: [0, 0] };
    expect(setQty(WOOD, plan, 0, 7)).toEqual({ qty: [3, 0] });
    expect(setQty(WOOD, plan, 1, -2)).toBe(plan);
    expect(setQty(WOOD, plan, 5, 1)).toBe(plan);
    expect(setQty(WOOD, plan, 0, 1.5)).toBe(plan);
  });

  it('beats "only the most valuable product" and the greedy habit on a hand-made case', () => {
    expect(singleProductPlan(WOOD)).toEqual({ qty: [2, 0] });
    expect(productionValue(WOOD, singleProductPlan(WOOD))).toBe(18);
    expect(productionValue(WOOD, greedyPlan(WOOD))).toBe(21);
    expect(solveProduction(WOOD)).toEqual({ score: 23, plan: { qty: [1, 2] } });
    expect(productionOracle(WOOD)).toBe(23);
  });
});

describe('production: generator', () => {
  it('is deterministic and yields valid, interesting instances with the stated sizes', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom(...DIFFICULTIES), (seed, d) => {
        const { problem: p } = generateProduction(createRng(seed), d);
        expect(generateProduction(createRng(seed), d).problem).toEqual(p);
        expect(isProductionProblem(p)).toBe(true);
        expect(p.products.length).toBe({ easy: 3, medium: 3, hard: 4 }[d]);
        expect(p.resources.map((r) => r.id)).toEqual({ easy: ['wood'], medium: ['wood', 'hours'], hard: ['wood', 'fittings', 'hours'] }[d]);
        for (const product of p.products) {
          // Every product fits at least once.
          expect(product.use.every((u, r) => u <= p.resources[r]!.stock)).toBe(true);
          if (d === 'hard') expect(product.use.filter((u) => u > 0).length).toBeGreaterThanOrEqual(2);
          else expect(product.setup).toBe(0);
        }
        expect(productionIsInteresting(p, d)).toBe(true);
        const best = solveProduction(p);
        expect(productionFeasible(p, best.plan)).toBe(true);
        expect(productionValue(p, best.plan)).toBe(best.score);
      }),
      { numRuns: 80 }
    );
  });

  it('falls back in under 1 % of 500 seeds; the fixed instances pass the same checks', () => {
    for (const d of DIFFICULTIES) {
      let fallbacks = 0;
      for (let seed = 0; seed < 500; seed++) if (generateProduction(createRng(seed * 13 + 3), d).fallback) fallbacks++;
      expect(fallbacks, d).toBeLessThan(5);
      expect(isProductionProblem(PRODUCTION_FALLBACK[d])).toBe(true);
      expect(productionIsInteresting(PRODUCTION_FALLBACK[d], d)).toBe(true);
    }
  });
});

describe('production: solver against the knapsack oracle', () => {
  it('matches the oracle (≥ 60 easy and medium instances, 15 hard)', () => {
    for (const [d, count] of [['easy', 60], ['medium', 60], ['hard', 15]] as const) {
      for (let seed = 0; seed < count; seed++) {
        const p = generateProduction(createRng(700 + seed), d).problem;
        expect(solveProduction(p).score, `${d} seed ${seed}`).toBe(productionOracle(p));
      }
    }
  });

  it('no random feasible plan beats the optimum; one more piece never uses less stock', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom(...DIFFICULTIES), fc.array(fc.nat(5), { minLength: 4, maxLength: 4 }), (seed, d, raw) => {
        const p = generateProduction(createRng(seed), d).problem;
        const plan = { qty: p.products.map((x, i) => Math.min(x.max, raw[i]!)) };
        expect(isProductionPlan(plan, p)).toBe(true);
        if (productionFeasible(p, plan)) expect(productionValue(p, plan)).toBeLessThanOrEqual(solveProduction(p).score);
        p.products.forEach((_, i) => {
          const more = setQty(p, plan, i, plan.qty[i]! + 1);
          resourceUse(p, more.qty).forEach((u, r) => expect(u).toBeGreaterThanOrEqual(resourceUse(p, plan.qty)[r]!));
        });
      }),
      { numRuns: 80 }
    );
  });
});

describe('production: validation', () => {
  it('rejects malformed instances and plans', () => {
    expect(isProductionProblem(WOOD)).toBe(true);
    expect(isProductionProblem({ ...WOOD, resources: [{ id: 'wood', stock: 31 }] })).toBe(false);
    expect(isProductionProblem({ ...WOOD, resources: [{ id: 'stone', stock: 3 }] })).toBe(false);
    expect(isProductionProblem({ ...WOOD, products: [WOOD.products[0]!, WOOD.products[0]!] })).toBe(false);
    expect(isProductionProblem({ ...WOOD, products: WOOD.products.map((x) => ({ ...x, use: [1, 1] })) })).toBe(false);
    expect(isProductionProblem({ ...WOOD, products: WOOD.products.map((x) => ({ ...x, max: 6 })) })).toBe(false);
    expect(isProductionPlan({ qty: [4, 0] }, WOOD)).toBe(false);
    expect(isProductionPlan({ qty: [1] }, WOOD)).toBe(false);
    expect(isProductionPlan({ qty: [-1, 0] }, WOOD)).toBe(false);
  });
});
