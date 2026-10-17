import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import {
  NETWORK_FALLBACK,
  fermatPoint,
  generateNetwork,
  groupsOf,
  isNetworkPlan,
  isNetworkProblem,
  junctionIndices,
  networkCost,
  networkFeasible,
  networkIsInteresting,
  pointLabel,
  segmentsCross,
  solveNetwork,
  spanningTree,
  townIndices,
  usedJunctions,
  type NetworkProblem
} from '../src/network';
import { DIFFICULTIES } from '../src/common';
import { networkOracle } from './oracle';

const town = (x: number, y: number) => ({ x, y, junction: false, open: 0 });
const junction = (x: number, y: number, open = 0) => ({ x, y, junction: true, open });
const link = (a: number, b: number, cost: number) => ({ a, b, cost, rough: false });

/** Four towns on a square with a junction in the middle: the junction saves cost (4 × 3 = 12 < 3 × 5 = 15). */
const SQUARE: NetworkProblem = {
  kind: 'network',
  points: [town(2, 2), town(6, 2), town(2, 6), town(6, 6), junction(4, 4)],
  links: [link(0, 1, 5), link(0, 2, 5), link(1, 3, 5), link(2, 3, 5), link(0, 4, 3), link(1, 4, 3), link(2, 4, 3), link(3, 4, 3)]
};

describe('network: score and constraints', () => {
  it('labels towns with letters and junctions with numbers', () => {
    expect([0, 1, 2, 3, 4].map((i) => pointLabel(SQUARE, i))).toEqual(['A', 'B', 'C', 'D', '1']);
  });

  it('counts link costs plus opening costs of used junctions only', () => {
    const p: NetworkProblem = { ...SQUARE, points: SQUARE.points.map((q) => (q.junction ? { ...q, open: 2 } : q)) };
    expect(networkCost(p, { built: [0, 1] })).toBe(10);
    expect(networkCost(p, { built: [0, 4] })).toBe(10);
    expect(usedJunctions(p, [4, 5])).toEqual([4]);
  });

  it('groups towns by built links; feasible exactly when there is one group', () => {
    expect(groupsOf(SQUARE, [])).toEqual([[0], [1], [2], [3]]);
    expect(groupsOf(SQUARE, [0, 3])).toEqual([[0, 1], [2, 3]]);
    expect(networkFeasible(SQUARE, { built: [4, 5, 6, 7] })).toBe(true);
    expect(networkFeasible(SQUARE, { built: [4, 5, 6] })).toBe(false);
  });

  it('finds the junction saving in the hand-made square', () => {
    expect(solveNetwork(SQUARE)).toEqual({ score: 12, plan: { built: [4, 5, 6, 7] } });
    expect(spanningTree(SQUARE, new Set(townIndices(SQUARE)))?.cost).toBe(15);
    expect(networkOracle(SQUARE)).toBe(12);
  });

  it('does not use a junction whose opening cost eats the saving', () => {
    const p: NetworkProblem = { ...SQUARE, points: SQUARE.points.map((q) => (q.junction ? { ...q, open: 4 } : q)) };
    expect(solveNetwork(p).score).toBe(15);
    expect(networkOracle(p)).toBe(15);
  });
});

describe('network: geometry helpers', () => {
  it('detects crossings, collinear overlaps and allows shared endpoints', () => {
    expect(segmentsCross([0, 0], [4, 4], [0, 4], [4, 0])).toBe(true);
    expect(segmentsCross([0, 0], [4, 4], [4, 4], [8, 0])).toBe(false);
    expect(segmentsCross([0, 0], [4, 0], [0, 0], [2, 0])).toBe(true);
    expect(segmentsCross([0, 0], [4, 0], [0, 0], [-2, 0])).toBe(false);
    expect(segmentsCross([0, 0], [1, 0], [2, 0], [3, 0])).toBe(false);
  });

  it('puts the Fermat point of an equilateral-ish triangle near its centre', () => {
    const [x, y] = fermatPoint([0, 0], [6, 0], [3, 5.196]);
    expect(x).toBeCloseTo(3, 2);
    expect(y).toBeCloseTo(1.732, 2);
  });
});

describe('network: generator', () => {
  it('is deterministic and yields valid, solvable, interesting instances (all difficulties)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom(...DIFFICULTIES), (seed, d) => {
        const a = generateNetwork(createRng(seed), d);
        expect(generateNetwork(createRng(seed), d)).toEqual(a);
        const p = a.problem;
        expect(isNetworkProblem(p)).toBe(true);
        expect(townIndices(p).length).toBe({ easy: 6, medium: 7, hard: 8 }[d]);
        expect(junctionIndices(p).length).toBe({ easy: 0, medium: 2, hard: 3 }[d]);
        expect(networkIsInteresting(p, d)).toBe(true);
        const best = solveNetwork(p);
        expect(networkFeasible(p, best.plan)).toBe(true);
        expect(networkCost(p, best.plan)).toBe(best.score);
        // Planar drawing: no two candidate roads cross.
        const xy = p.points.map((q) => [q.x, q.y] as const);
        p.links.forEach((l, i) => p.links.slice(i + 1).forEach((k) => expect(segmentsCross(xy[l.a]!, xy[l.b]!, xy[k.a]!, xy[k.b]!)).toBe(false)));
      }),
      { numRuns: 60 }
    );
  });

  it('labels towns in reading order (A top left)', () => {
    const p = generateNetwork(createRng(5), 'hard').problem;
    const towns = townIndices(p).map((i) => p.points[i]!);
    towns.slice(1).forEach((q, i) => expect(q.y > towns[i]!.y || (q.y === towns[i]!.y && q.x > towns[i]!.x)).toBe(true));
  });

  it('falls back to its fixed instance in under 1 % of 500 seeds, generated quickly on average', () => {
    for (const d of DIFFICULTIES) {
      let fallbacks = 0;
      const t0 = performance.now();
      for (let seed = 0; seed < 500; seed++) if (generateNetwork(createRng(seed * 7919 + 1), d).fallback) fallbacks++;
      expect(fallbacks, d).toBeLessThan(5);
      // About 5 ms per instance on a quiet machine; the bound leaves room for a loaded CI runner.
      expect((performance.now() - t0) / 500, d).toBeLessThan(100);
    }
  });

  it('has fixed fallback instances that pass the same checks', () => {
    for (const d of DIFFICULTIES) {
      const p = NETWORK_FALLBACK[d];
      expect(isNetworkProblem(p)).toBe(true);
      expect(networkIsInteresting(p, d)).toBe(true);
    }
  });
});

describe('network: solver against the brute-force oracle', () => {
  it('matches the oracle on easy and medium instances (≥ 60 each)', () => {
    for (const d of ['easy', 'medium'] as const) {
      for (let seed = 0; seed < 60; seed++) {
        const p = generateNetwork(createRng(1000 + seed), d).problem;
        expect(solveNetwork(p).score, `${d} seed ${seed}`).toBe(networkOracle(p));
      }
    }
  });

  it('matches the oracle on hard instances (sample of 15)', () => {
    for (let seed = 0; seed < 15; seed++) {
      const p = generateNetwork(createRng(5000 + seed), 'hard').problem;
      expect(p.links.length).toBeLessThanOrEqual(19);
      expect(solveNetwork(p).score, `hard seed ${seed}`).toBe(networkOracle(p));
    }
  });

  it('no random connecting plan beats the optimum; building a road never lowers the cost', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom(...DIFFICULTIES), fc.array(fc.nat(), { maxLength: 30 }), (seed, d, picks) => {
        const p = generateNetwork(createRng(seed), d).problem;
        const built = [...new Set(picks.map((k) => k % p.links.length))].sort((a, b) => a - b);
        const plan = { built };
        expect(isNetworkPlan(plan, p)).toBe(true);
        if (networkFeasible(p, plan)) expect(networkCost(p, plan)).toBeGreaterThanOrEqual(solveNetwork(p).score);
        const extra = p.links.findIndex((_, i) => !built.includes(i));
        if (extra >= 0) expect(networkCost(p, { built: [...built, extra].sort((a, b) => a - b) })).toBeGreaterThan(networkCost(p, plan));
      }),
      { numRuns: 60 }
    );
  });
});

describe('network: validation', () => {
  it('rejects malformed or unsolvable instances', () => {
    expect(isNetworkProblem(SQUARE)).toBe(true);
    expect(isNetworkProblem({ ...SQUARE, links: SQUARE.links.slice(0, 1) })).toBe(false);
    expect(isNetworkProblem({ ...SQUARE, links: [...SQUARE.links, link(0, 1, 2)] })).toBe(false);
    expect(isNetworkProblem({ ...SQUARE, links: [...SQUARE.links.slice(1), link(1, 0, 2)] })).toBe(false);
    expect(isNetworkProblem({ ...SQUARE, points: [...SQUARE.points.slice(0, 4), town(2, 2)] })).toBe(false);
    expect(isNetworkProblem({ ...SQUARE, points: [...SQUARE.points, junction(8, 8), junction(9, 1), junction(1, 9)] })).toBe(false);
    expect(isNetworkProblem({ ...SQUARE, points: SQUARE.points.map((q) => ({ ...q, x: 11 })) })).toBe(false);
    expect(isNetworkPlan({ built: [1, 0] }, SQUARE)).toBe(false);
    expect(isNetworkPlan({ built: [8] }, SQUARE)).toBe(false);
    expect(isNetworkPlan({ built: [0, 0] }, SQUARE)).toBe(false);
  });
});
