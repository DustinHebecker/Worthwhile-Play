/**
 * Scoring (design § 7.3, § 8.2, § 9.2, § 10.2): the scale-aware distance of a guess, the bands, the gap ladder, the
 * Kendall agreement of an order and the "same time" window. Pure.
 */
import { age } from './time';

/** Upper limits of bands 1–3 in milli-decades of age (§ 7.3); beyond the last: band 4. */
export const BAND_LIMITS = [20, 60, 150] as const;
export type Band = 0 | 1 | 2 | 3 | 4;

export interface WhenScore {
  /** round(1000 · |log10(age(g) / age(y*))|); 0 inside the range. */
  readonly milli: number;
  readonly band: Band;
  /** log10(age(g) / age(y*)): positive = placed further back than it was. */
  readonly signed: number;
  /** Years between the guess and the nearest accepted year (0 inside). */
  readonly off: number;
}

/** The band of a stored distance (`inside`: the guess lay within the accepted range). */
export function bandOf(milli: number, inside: boolean): Band {
  if (inside) return 0;
  if (milli <= BAND_LIMITS[0]) return 1;
  if (milli <= BAND_LIMITS[1]) return 2;
  if (milli <= BAND_LIMITS[2]) return 3;
  return 4;
}

/** Scores a guess `g` (astronomical year) against an accepted range `[lo, hi]`. */
export function scoreYear(g: number, lo: number, hi: number): WhenScore {
  const nearest = Math.min(hi, Math.max(lo, g));
  if (nearest === g) return { milli: 0, band: 0, signed: 0, off: 0 };
  const signed = Math.log10(age(g) / age(nearest));
  const milli = Math.round(Math.abs(signed) * 1000);
  return { milli, band: bandOf(milli, false), signed, off: Math.abs(g - nearest) };
}

/** Marks of the five bands, always shown with words (§ 7.3). */
export const BAND_MARKS = ['●●●', '●●●', '●●○', '●○○', '○○○'] as const;

/* ---------- Order (§ 8.2) ---------- */

/** Number of pairs of `arrangement` in the right relative order (`rank` = position in the correct order). */
export function kendallPairs(arrangement: readonly string[], rank: (id: string) => number): number {
  let n = 0;
  for (let i = 0; i < arrangement.length; i++)
    for (let j = i + 1; j < arrangement.length; j++) if (rank(arrangement[i]!) < rank(arrangement[j]!)) n++;
  return n;
}
export const pairsTotal = (n: number): number => (n * (n - 1)) / 2;

/** Marks of an order result: all pairs ●●●, ≥ 80 % ●●○, ≥ 50 % ●○○, else ○○○. */
export function orderMark(pairs: number, total: number): 0 | 2 | 3 | 4 {
  if (pairs >= total) return 0;
  if (pairs >= 0.8 * total) return 2;
  if (pairs >= 0.5 * total) return 3;
  return 4;
}

/* ---------- Gap ladder (§ 9.2) ---------- */

export type GapLevel = 'medium' | 'hard';

/** Steps of the ladder: medium 10^k (k = 1…9), hard 10^(k/2) (k = 2…19). */
const LADDER: Readonly<Record<GapLevel, { readonly step: number; readonly kMin: number; readonly kMax: number }>> = {
  medium: { step: 1, kMin: 1, kMax: 9 },
  hard: { step: 0.5, kMin: 2, kMax: 19 }
};

/** The years of rung k, rounded to one significant digit (10, 30, 100, 300, …). */
export const rungValue = (level: GapLevel, k: number): number => Number((10 ** (k * LADDER[level].step)).toPrecision(1));

/** All rung values of a level, increasing. */
export function ladder(level: GapLevel): number[] {
  const { kMin, kMax } = LADDER[level];
  const out: number[] = [];
  for (let k = kMin; k <= kMax; k++) out.push(rungValue(level, k));
  return out;
}

/** The rung of a gap in years (boundaries at 10^(k ± step/2) on the log scale); null outside the ladder. */
export function rungOf(level: GapLevel, years: number): number | null {
  if (!(years >= 1)) return null;
  const { step, kMin, kMax } = LADDER[level];
  const k = Math.round(Math.log10(years) / step);
  return k >= kMin && k <= kMax ? k : null;
}

/**
 * The gap question of two non-overlapping ranges (earlier first): the right rung when the shortest and the longest
 * possible gap fall on the same rung (fair), else null.
 */
export function fairRung(level: GapLevel, earlier: { lo: number; hi: number }, later: { lo: number; hi: number }): number | null {
  const gMin = Math.max(1, later.lo - earlier.hi);
  const gMax = later.hi - earlier.lo;
  const a = rungOf(level, gMin);
  const b = rungOf(level, gMax);
  return a !== null && a === b ? a : null;
}

/** Four consecutive rungs containing `k` at position `pos` (0–3), shifted to stay on the ladder. */
export function gapOptions(level: GapLevel, k: number, pos: number): { readonly values: number[]; readonly index: number } {
  const { kMin, kMax } = LADDER[level];
  let start = k - pos;
  start = Math.max(kMin, Math.min(kMax - 3, start));
  const values = [0, 1, 2, 3].map((i) => rungValue(level, start + i));
  return { values, index: k - start };
}

/** Whether `values` is four consecutive rungs of a level. */
export function isGapLadder(level: GapLevel, values: readonly unknown[]): boolean {
  if (values.length !== 4) return false;
  const all = ladder(level);
  const i = all.indexOf(values[0] as number);
  return i >= 0 && i + 3 < all.length && values.every((v, j) => v === all[i + j]);
}

/* ---------- Same time (§ 10.2) ---------- */

/** The nearest of 1, 2, 5 × 10^k to `x` on the log scale (ties to the smaller). */
export function nice(x: number): number {
  const lx = Math.log10(Math.max(1, x));
  let best = 1;
  let bestD = Infinity;
  for (let k = 0; k <= 10; k++)
    for (const m of [1, 2, 5]) {
      const v = m * 10 ** k;
      const d = Math.abs(Math.log10(v) - lx);
      if (d < bestD - 1e-12) {
        best = v;
        bestD = d;
      }
    }
  return best;
}

/** Whether `v` is a 1/2/5 × 10^k value (k = 1…10). */
export const isNice = (v: unknown): v is number => typeof v === 'number' && v >= 10 && v <= 5e10 && nice(v) === v;

/** The window size τ for a focus at year y: nice(max(10, 0.1 · age)). */
export const tauFor = (y: number): number => nice(Math.max(10, 0.1 * age(y)));
