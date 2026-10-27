import type { LifeState, YearRecord } from './life';
import { balanceOf } from './ledger';
import type { Profile } from './profile';
import { STATS, type StatId } from './state';
import { ageInYears } from './time';

/**
 * The life review (design § 9, owner decisions O8 and O12): several dimensions, no single score,
 * absolute values and positions relative to the profile's population and to the person's start.
 */

/** Percentile (0–100) of a value in a distribution given as ascending [percentile, value] points. */
export function percentileOf(points: readonly (readonly [number, number])[], value: number): number {
  const first = points[0];
  const last = points[points.length - 1];
  if (first === undefined || last === undefined) return 50;
  if (value <= first[1]) return first[1] <= 0 ? first[0] : Math.max(0, (first[0] * value) / first[1]);
  if (value >= last[1]) return last[0] + ((100 - last[0]) * Math.min(1, (value - last[1]) / last[1]));
  for (let i = 1; i < points.length; i++) {
    const [p1, v1] = points[i] as readonly [number, number];
    const [p0, v0] = points[i - 1] as readonly [number, number];
    if (value <= v1) return p0 + ((p1 - p0) * (value - v0)) / (v1 - v0);
  }
  return last[0];
}

export interface DimensionScore {
  id: 'wealth' | 'security' | 'health' | 'relationships' | 'freedom' | 'meaning' | 'satisfaction';
  /** 0–100; for wealth the percentile in the profile's population. */
  value: number;
}

export interface LifeReview {
  age: number;
  /** Money at the end in start-year prices (cents). */
  realWealth: number;
  dimensions: DimensionScore[];
  /** Σ satisfaction (0–1) over the years with own finances: "satisfied years". */
  satisfiedYears: number;
  /** Income position of the parents' household at the start and of the person in working age (percentiles). */
  mobility: { start: number; working?: number };
  children: number;
  qualification: number;
}

const mean = (xs: readonly number[]): number => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);
const statOf = (r: YearRecord, id: StatId): number => r.stats[STATS.indexOf(id)] ?? 0;

export function reviewLife(s: LifeState, profile: Profile): LifeReview {
  const years = s.years ?? [];
  const prices = s.economy.priceIndex;
  const realWealth = Math.round(balanceOf(s.ledger, 'cash') / prices);
  const avg = (id: StatId) => Math.round(mean(years.map((r) => statOf(r, id))) / 10);
  // Income in working age (25–64), in start prices, annual; percentile among equivalised net incomes.
  const working = years.filter((r) => r.age >= 25 && r.age <= 64 && r.income > 0).map((r) => (r.income * 12) / r.prices / 100);
  const household = profile.households.find((h) => h.id === s.householdId);
  return {
    age: ageInYears(s.month),
    realWealth,
    dimensions: [
      { id: 'wealth', value: Math.round(percentileOf(profile.wealthDistribution, realWealth / 100)) },
      { id: 'security', value: avg('security') },
      { id: 'health', value: Math.round((avg('health') + avg('mental')) / 2) },
      { id: 'relationships', value: avg('relationships') },
      { id: 'freedom', value: avg('freedom') },
      { id: 'meaning', value: avg('meaning') },
      { id: 'satisfaction', value: avg('satisfaction') }
    ],
    satisfiedYears: Math.round(years.reduce((a, r) => a + statOf(r, 'satisfaction') / 1000, 0) * 10) / 10,
    mobility: working.length > 0
      ? { start: household?.incomePercentile ?? 50, working: Math.round(percentileOf(profile.incomeDistribution, mean(working))) }
      : { start: household?.incomePercentile ?? 50 },
    children: s.counters.children ?? 0,
    qualification: s.counters.qual ?? 0
  };
}
