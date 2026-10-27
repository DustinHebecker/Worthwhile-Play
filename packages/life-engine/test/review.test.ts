import { describe, expect, it } from 'vitest';
import {
  EVENTS_DE, EVENTS_DE_FAMILY, PROFILE_DE, STATS, advanceUntilEvent, availableChoices, choose, isLifeState, lifeSystems,
  newLife, percentileOf, reviewLife, type LifeState
} from '../src';
import { testRngFor } from './helpers';

const EVENTS = [...EVENTS_DE, ...EVENTS_DE_FAMILY];

describe('percentiles', () => {
  const pts = [[10, 100], [50, 200], [90, 400]] as const;
  it('interpolates between points and extrapolates gently at the ends', () => {
    expect(percentileOf(pts, 200)).toBe(50);
    expect(percentileOf(pts, 300)).toBe(70);
    expect(percentileOf(pts, 50)).toBe(5);
    expect(percentileOf(pts, 0)).toBe(0);
    expect(percentileOf(pts, -10)).toBe(0);
    expect(percentileOf(pts, 600)).toBe(95);
    expect(percentileOf(pts, 10_000)).toBe(100);
    expect(percentileOf([], 5)).toBe(50);
    expect(percentileOf([[10, 0], [50, 10]], -1)).toBe(10);
  });
});

describe('life review', () => {
  it('records a year on each birthday from 16 and at death, and reviews the life', () => {
    const seed = 3;
    const rngFor = testRngFor(seed);
    const systems = lifeSystems(PROFILE_DE);
    let s: LifeState = newLife({ seed, profile: PROFILE_DE, householdId: 'basic-support', rngFor });
    for (let guard = 0; guard < 4000 && s.alive; guard++) {
      s = advanceUntilEvent(s, EVENTS, rngFor, 1200, systems).state;
      while (s.pending.length > 0) {
        const head = s.pending[0]!;
        const c = choose(EVENTS, s, head.eventId, availableChoices(EVENTS, s, head.eventId)[0]!.id, rngFor(s.month, head.eventId));
        if (c.ok) s = c.state;
      }
    }
    const years = s.years ?? [];
    expect(years[0]?.age).toBe(16);
    const final = years[years.length - 1]!;
    expect(final.age).toBe(Math.floor(s.month / 12));
    expect(final.stats).toHaveLength(STATS.length);
    expect(isLifeState(s)).toBe(true);
    const review = reviewLife(s, PROFILE_DE);
    expect(review.age).toBe(final.age);
    expect(review.mobility.start).toBe(8);
    expect(review.dimensions.map((d) => d.id)).toEqual(['wealth', 'security', 'health', 'relationships', 'freedom', 'meaning', 'satisfaction']);
    for (const d of review.dimensions) {
      expect(d.value).toBeGreaterThanOrEqual(0);
      expect(d.value).toBeLessThanOrEqual(100);
    }
    expect(review.satisfiedYears).toBeGreaterThan(0);
    expect(review.satisfiedYears).toBeLessThanOrEqual(years.length);
  });

  it('accepts saves without history and rejects broken history', () => {
    const s = newLife({ seed: 1, profile: PROFILE_DE, rngFor: testRngFor(1) });
    expect(s.years).toBeUndefined();
    expect(isLifeState(s)).toBe(true);
    const r = { age: 20, cash: 0, prices: 1, income: 0, stats: STATS.map(() => 500) };
    expect(isLifeState({ ...s, years: [r] })).toBe(true);
    expect(isLifeState({ ...s, years: [{ ...r, stats: [1] }] })).toBe(false);
    expect(isLifeState({ ...s, years: [{ ...r, prices: 0 }] })).toBe(false);
    expect(isLifeState({ ...s, years: 'x' })).toBe(false);
    expect(reviewLife(s, PROFILE_DE).mobility.working).toBeUndefined();
    expect(reviewLife(s, PROFILE_DE).satisfiedYears).toBe(0);
  });
});

describe('review details (constructed lives)', () => {
  const rec = (age: number, income: number, prices: number, stats: Partial<Record<(typeof STATS)[number], number>> = {}) =>
    ({ age, cash: 0, prices, income, stats: STATS.map((id) => stats[id] ?? 500) });
  const base = (over: Partial<LifeState> = {}): LifeState => ({
    ...newLife({ seed: 1, profile: PROFILE_DE, householdId: 'middle', rngFor: testRngFor(1) }), ...over
  });

  it('values every dimension from the yearly history', () => {
    const years = [
      rec(20, 100_000, 1, { security: 200, health: 400, mental: 600, relationships: 300, freedom: 700, meaning: 800, satisfaction: 1000 }),
      rec(21, 100_000, 1, { security: 400, health: 400, mental: 600, relationships: 500, freedom: 900, meaning: 600, satisfaction: 500 })
    ];
    const r = reviewLife(base({ years, counters: { children: 2, qual: 3 } }), PROFILE_DE);
    expect(Object.fromEntries(r.dimensions.map((d) => [d.id, d.value]))).toEqual({
      wealth: 0, security: 30, health: 50, relationships: 40, freedom: 80, meaning: 70, satisfaction: 75
    });
    expect(r.satisfiedYears).toBe(1.5);
    expect(r.children).toBe(2);
    expect(r.qualification).toBe(3);
    expect(r.mobility).toEqual({ start: 50 });
  });

  it('measures money in start prices and working income only from 25 to 64 with income', () => {
    const years = [rec(24, 999_999_99, 1), rec(25, 200_000, 2), rec(64, 200_000, 2), rec(65, 999_999_99, 1), rec(40, 0, 1)];
    const s = base({ years, economy: { ...base().economy, priceIndex: 2 }, ledger: { balances: { cash: 20_640_000 }, flows: { gift: 20_640_000 }, opening: 0 } });
    const r = reviewLife(s, PROFILE_DE);
    expect(r.realWealth).toBe(10_320_000);
    expect(r.dimensions[0]).toEqual({ id: 'wealth', value: 50 });
    // 2 000 € a month at a price index of 2 = 12 000 € a year in start prices.
    expect(r.mobility.working).toBe(Math.round(percentileOf(PROFILE_DE.incomeDistribution, 12_000)));
    expect(reviewLife({ ...s, householdId: 'gone' }, PROFILE_DE).mobility.start).toBe(50);
    expect(reviewLife(base({ householdId: 'basic-support' }), PROFILE_DE).mobility.start).toBe(8);
    expect(reviewLife(base({ counters: {} }), PROFILE_DE)).toMatchObject({ children: 0, qualification: 0 });
  });

  it('percentiles at exact points and for empty or one-point distributions', () => {
    const pts = [[10, 100], [50, 200], [90, 400]] as const;
    expect(percentileOf(pts, 100)).toBe(10);
    expect(percentileOf(pts, 400)).toBe(90);
    expect(percentileOf(pts, 199.99)).toBeLessThan(50);
    expect(percentileOf([[20, 100]], 100)).toBe(20);
    expect(percentileOf([[20, 100]], 150)).toBe(60);
  });
});
