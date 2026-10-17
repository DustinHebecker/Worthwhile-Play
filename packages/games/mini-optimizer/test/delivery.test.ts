import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import {
  DELIVERY_FALLBACK,
  addStop,
  deliveryDistance,
  deliveryFeasible,
  deliveryIsInteresting,
  generateDelivery,
  isDeliveryPlan,
  isDeliveryProblem,
  nearestFitPlan,
  newTrip,
  overloaded,
  removeStop,
  solveDelivery,
  tripLength,
  unvisited,
  type DeliveryProblem
} from '../src/delivery';
import { DIFFICULTIES } from '../src/common';
import { deliveryOracle } from './oracle';

/** Depot in the middle, a near customer A on the left, B and C to the right; the van takes 2 parcels. */
const LINE: DeliveryProblem = {
  kind: 'delivery',
  size: 9,
  depot: { x: 4, y: 4 },
  stops: [
    { x: 3, y: 4, parcels: 1 },
    { x: 7, y: 4, parcels: 1 },
    { x: 8, y: 4, parcels: 1 }
  ],
  capacity: 2
};

describe('delivery: plan edits', () => {
  it('adds to the current trip, starts new trips, removes stops and drops emptied trips', () => {
    let plan = addStop(LINE, { trips: [] }, 1);
    expect(plan).toEqual({ trips: [[1]] });
    expect(addStop(LINE, plan, 1)).toBe(plan);
    plan = newTrip(LINE, plan);
    expect(plan).toEqual({ trips: [[1], []] });
    expect(newTrip(LINE, plan)).toBe(plan);
    plan = addStop(LINE, plan, 0);
    plan = addStop(LINE, plan, 2);
    expect(plan).toEqual({ trips: [[1], [0, 2]] });
    expect(removeStop(plan, 1)).toEqual({ trips: [[0, 2]] });
    expect(removeStop(removeStop(plan, 0), 2)).toEqual({ trips: [[1], []] });
    expect(removeStop(plan, 5)).toBe(plan);
  });

  it('never opens more trips than there are customers', () => {
    let plan = { trips: [[0], [1], [2]] };
    expect(newTrip(LINE, plan)).toBe(plan);
    plan = { trips: [[0, 1]] };
    expect(newTrip(LINE, plan).trips).toHaveLength(2);
  });
});

describe('delivery: score, constraints and the nearest-stop habit', () => {
  it('measures round trips in blocks and reports overloads and unvisited customers', () => {
    expect(tripLength(LINE, [1, 2])).toBe(8);
    expect(tripLength(LINE, [])).toBe(0);
    expect(deliveryDistance(LINE, { trips: [[0], [1, 2]] })).toBe(10);
    expect(overloaded(LINE, { trips: [[0, 1, 2]] })).toEqual([0]);
    expect(unvisited(LINE, { trips: [[2]] })).toEqual([0, 1]);
    expect(deliveryFeasible(LINE, { trips: [[0], [1, 2]] })).toBe(true);
  });

  it('beats the nearest-stop habit on a hand-made case', () => {
    // Nearest first: A, then B (van full), back; then C alone: 8 + 8 = 16. Best: A alone, B and C together: 2 + 8 = 10.
    expect(deliveryDistance(LINE, nearestFitPlan(LINE))).toBe(16);
    expect(solveDelivery(LINE).score).toBe(10);
    expect(deliveryOracle(LINE)).toBe(10);
    expect(deliveryIsInteresting(LINE, 'medium')).toBe(true);
  });
});

describe('delivery: generator', () => {
  it('is deterministic and yields valid instances with the stated sizes and capacities', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom(...DIFFICULTIES), (seed, d) => {
        const { problem: p } = generateDelivery(createRng(seed), d);
        expect(generateDelivery(createRng(seed), d).problem).toEqual(p);
        expect(isDeliveryProblem(p)).toBe(true);
        expect(p.stops.length).toBe({ easy: 5, medium: 6, hard: 7 }[d]);
        const total = p.stops.reduce((s, x) => s + x.parcels, 0);
        if (d === 'easy') expect(p.capacity).toBe(total);
        else expect(p.capacity).toBeLessThan(total);
        // Customers are at least two crossings apart (big enough targets on a phone).
        const all = [p.depot, ...p.stops];
        all.forEach((a, i) => all.slice(i + 1).forEach((b) => expect(Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))).toBeGreaterThanOrEqual(2)));
        expect(deliveryIsInteresting(p, d)).toBe(true);
        const best = solveDelivery(p);
        expect(deliveryFeasible(p, best.plan)).toBe(true);
        expect(deliveryDistance(p, best.plan)).toBe(best.score);
        if (d !== 'easy') expect(best.plan.trips.length).toBeGreaterThanOrEqual(2);
      }),
      { numRuns: 80 }
    );
  });

  it('falls back in under 1 % of 500 seeds; the fixed instances pass the same checks', () => {
    for (const d of DIFFICULTIES) {
      let fallbacks = 0;
      for (let seed = 0; seed < 500; seed++) if (generateDelivery(createRng(seed * 31 + 7), d).fallback) fallbacks++;
      expect(fallbacks, d).toBeLessThan(5);
      expect(isDeliveryProblem(DELIVERY_FALLBACK[d])).toBe(true);
      expect(deliveryIsInteresting(DELIVERY_FALLBACK[d], d)).toBe(true);
    }
  });
});

describe('delivery: solver against the brute-force oracle', () => {
  it('matches the oracle (≥ 60 easy and medium instances, 15 hard)', () => {
    for (const [d, count] of [['easy', 60], ['medium', 60], ['hard', 15]] as const) {
      for (let seed = 0; seed < count; seed++) {
        const p = generateDelivery(createRng(300 + seed), d).problem;
        expect(solveDelivery(p).score, `${d} seed ${seed}`).toBe(deliveryOracle(p));
      }
    }
  });

  it('no random feasible plan beats the optimum; adding a stop never shortens a trip', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom(...DIFFICULTIES), fc.array(fc.boolean(), { minLength: 7, maxLength: 7 }), (seed, d, cuts) => {
        const p = generateDelivery(createRng(seed), d).problem;
        const order = createRng(seed ^ 0x5555).shuffle(p.stops.map((_, i) => i));
        const trips: number[][] = [[]];
        order.forEach((s, k) => {
          if (k > 0 && cuts[k]) trips.push([]);
          trips[trips.length - 1]!.push(s);
        });
        const plan = { trips };
        expect(isDeliveryPlan(plan, p)).toBe(true);
        if (deliveryFeasible(p, plan)) expect(deliveryDistance(p, plan)).toBeGreaterThanOrEqual(solveDelivery(p).score);
        for (const trip of trips) for (let k = 1; k <= trip.length; k++) expect(tripLength(p, trip.slice(0, k))).toBeGreaterThanOrEqual(tripLength(p, trip.slice(0, k - 1)));
      }),
      { numRuns: 80 }
    );
  });
});

describe('delivery: validation', () => {
  it('rejects malformed instances and plans', () => {
    expect(isDeliveryProblem(LINE)).toBe(true);
    expect(isDeliveryProblem({ ...LINE, capacity: 0 })).toBe(false);
    expect(isDeliveryProblem({ ...LINE, stops: [...LINE.stops, { x: 4, y: 4, parcels: 1 }] })).toBe(false);
    expect(isDeliveryProblem({ ...LINE, stops: LINE.stops.map((s) => ({ ...s, parcels: 3 })) })).toBe(false);
    expect(isDeliveryProblem({ ...LINE, size: 10 })).toBe(false);
    expect(isDeliveryProblem({ ...LINE, stops: [] })).toBe(false);
    expect(isDeliveryPlan({ trips: [[0], [0]] }, LINE)).toBe(false);
    expect(isDeliveryPlan({ trips: [[], [0]] }, LINE)).toBe(false);
    expect(isDeliveryPlan({ trips: [[3]] }, LINE)).toBe(false);
    expect(isDeliveryPlan({ trips: [[0], [1], [2], []] }, LINE)).toBe(false);
    expect(isDeliveryPlan({ trips: [[0], []] }, LINE)).toBe(true);
  });
});
