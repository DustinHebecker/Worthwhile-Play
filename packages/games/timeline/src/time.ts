/**
 * The time model (design § 5): astronomical years, "years ago", the logarithmic age scale, eras, display regimes,
 * snapping and typed entry. Pure; no clock is read here (the view passes the current year for typed "years ago").
 */
import type { EventData } from './types';

/** The fixed "now" of the scale: ages are measured from here, so saves score the same in every year (§ 5.4). */
export const AXIS_YEAR = 2030;
/** "Before present" in radiocarbon dating and geology counts from 1950. */
export const BP_YEAR = 1950;
/** The age of the Earth (Earth-day clock, § 7.5). */
export const EARTH_AGE = 4.54e9;
/** The most recent year a guess may name. */
export const Y_MAX = 2020;
/** The oldest year a guess may name (5 billion years before 1950). */
export const Y_MIN = BP_YEAR - 5e9;

/** Years between `y` and the anchor year (≥ 10 for every valid guess). */
export const age = (y: number): number => AXIS_YEAR - y;
/** Position on the logarithmic scale: decades of age. */
export const u = (y: number): number => Math.log10(age(y));
/** The year at a scale position. */
export const yearAtU = (v: number): number => AXIS_YEAR - 10 ** v;
/** The scale's ends: 10 years (2020) and 5 billion years. */
export const U_MIN = u(Y_MAX);
export const U_MAX = u(Y_MIN);

/** n BCE as an astronomical year (there is no year 0: 1 BCE = 0). */
export const fromBce = (n: number): number => 1 - n;
/** The BCE number of an astronomical year ≤ 0. */
export const toBce = (y: number): number => 1 - y;
/** Years before present (1950) as an astronomical year. */
export const fromBp = (ago: number): number => BP_YEAR - ago;
/** Years between two astronomical years (a ≤ b): plain subtraction, the missing year 0 is built in. */
export const yearsBetween = (a: number, b: number): number => b - a;

/** A date in astronomical years: the position `y` and the accepted range `[lo, hi]` (lo older). */
export interface When {
  readonly y: number;
  readonly lo: number;
  readonly hi: number;
}

/** Converts an event's date as stored to astronomical years (§ 5.1). Spans sit at their midpoint. */
export function normalise(e: Pick<EventData, 'kind' | 'unit' | 'at' | 'lo' | 'hi'>): When {
  const conv = (v: number) => (e.unit === 'ago' ? fromBp(v) : v);
  const lo = conv(e.lo);
  const hi = conv(e.hi);
  const y = e.kind === 'span' || e.at === undefined ? Math.floor((lo + hi) / 2) : conv(e.at);
  return { y, lo, hi };
}

export type Era = 'deep' | 'early' | 'middle' | 'modern';
export const ERAS: readonly Era[] = ['deep', 'early', 'middle', 'modern'];

/** The era of a position (§ 5.5): 1 million years ago or older, to 499 CE, 500–1799, from 1800. */
export const eraOf = (y: number): Era => (y <= BP_YEAR - 1_000_000 ? 'deep' : y < 500 ? 'early' : y < 1800 ? 'middle' : 'modern');

/** How a year is shown (§ 5.3): years ago, BCE, CE with its marker (1–999), or the plain year. */
export type Regime = 'ago' | 'bce' | 'ceEarly' | 'ce';
export const regimeOf = (y: number): Regime => (y < -9999 ? 'ago' : y <= 0 ? 'bce' : y <= 999 ? 'ceEarly' : 'ce');

/** Clamps a year into the guess range. */
export const clampYear = (y: number): number => Math.min(Y_MAX, Math.max(Y_MIN, Math.round(y)));

/** The snapping resolution at a year: three significant digits of its age, at least one year (§ 7.2). */
export function snapStep(y: number): number {
  const a = age(y);
  if (!(a > 0)) return 1;
  return Math.max(1, 10 ** (Math.floor(Math.log10(a) + 1e-9) - 2));
}

/** Snaps a year from the axis to three significant digits of its age, inside the guess range. */
export function snapYear(y: number): number {
  const c = clampYear(y);
  const step = snapStep(c);
  return clampYear(AXIS_YEAR - Math.round(age(c) / step) * step);
}

/** Units of the typed year field (§ 7.2). */
export type EntryUnit = 'ce' | 'bce' | 'ago' | 'ka' | 'ma' | 'ga';
export const ENTRY_UNITS: readonly EntryUnit[] = ['ce', 'bce', 'ago', 'ka', 'ma', 'ga'];
const AGO_FACTOR: Readonly<Record<'ago' | 'ka' | 'ma' | 'ga', number>> = { ago: 1, ka: 1e3, ma: 1e6, ga: 1e9 };

export type EntryResult = { readonly ok: true; readonly y: number } | { readonly ok: false; readonly reason: 'tooRecent' | 'tooOld' | 'zero' };

/**
 * A typed number in a unit as an astronomical year. "Years ago" count back from `nowYear` (the current year, from the
 * view); CE and BCE values are rounded to whole years.
 */
export function entryToYear(value: number, unit: EntryUnit, nowYear: number): EntryResult {
  if (!Number.isFinite(value) || value <= 0) return { ok: false, reason: 'zero' };
  let y: number;
  if (unit === 'ce' || unit === 'bce') {
    const n = Math.round(value);
    if (n < 1) return { ok: false, reason: 'zero' };
    y = unit === 'ce' ? n : fromBce(n);
  } else {
    const years = Math.round(value * AGO_FACTOR[unit]);
    if (years < 1) return { ok: false, reason: 'zero' };
    y = nowYear - years;
  }
  if (y > Y_MAX) return { ok: false, reason: 'tooRecent' };
  if (y < Y_MIN) return { ok: false, reason: 'tooOld' };
  return { ok: true, y };
}

/** `x` rounded to `n` significant digits. */
export const roundSig = (x: number, n: number): number => (x > 0 && Number.isFinite(x) ? Number(x.toPrecision(n)) : x);

/**
 * How a year from the axis appears in the typed field: the year (CE or BCE) from 10,000 BCE on, else years ago from
 * `nowYear` (three significant digits) in a fitting unit.
 */
export function yearToEntry(y: number, nowYear: number): { readonly unit: EntryUnit; readonly value: number } {
  if (y >= 1) return { unit: 'ce', value: y };
  if (y >= -9999) return { unit: 'bce', value: toBce(y) };
  const a = nowYear - y;
  if (a < 1e6) return { unit: 'ago', value: roundSig(a, 3) };
  if (a < 1e9) return { unit: 'ma', value: roundSig(a / 1e6, 3) };
  return { unit: 'ga', value: roundSig(a / 1e9, 3) };
}

/** Separation of two ranges on the log scale (§ 11.2): 0 when they overlap, else decades between the near ends. */
export function sep(a: { readonly lo: number; readonly hi: number }, b: { readonly lo: number; readonly hi: number }): number {
  if (a.hi < b.lo) return u(a.hi) - u(b.lo);
  if (b.hi < a.lo) return u(b.hi) - u(a.lo);
  return 0;
}
