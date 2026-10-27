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
