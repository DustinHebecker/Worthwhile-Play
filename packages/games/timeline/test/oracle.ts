/**
 * An independent oracle for the generator and the scoring (design § 11.4): it reads the raw `events.ts` literals
 * (`year`/`ago`, without `normalise`) and re-implements the scale, the separation, the window, the gap rungs and the
 * order of a set directly. It shares no code with `src/` except the data.
 */
import { EVENTS } from '../src/events';

const raw = new Map(EVENTS.map((e) => [e.id, e]));

/** [older end, newer end] in astronomical years, straight from the literal. */
export function ends(id: string): [number, number] {
  const e = raw.get(id)!;
  return e.unit === 'ago' ? [1950 - e.lo, 1950 - e.hi] : [e.lo, e.hi];
}

/** The position: the point's value, or the floored midpoint of a span. */
export function position(id: string): number {
  const e = raw.get(id)!;
  const [lo, hi] = ends(id);
  if (e.kind === 'span' || e.at === undefined) return Math.floor((lo + hi) / 2);
  return e.unit === 'ago' ? 1950 - e.at : e.at;
}

/** Decades of age from 2030. */
export const decades = (year: number): number => Math.log10(2030 - year);

/** Log-scale gap between two year intervals (0 when they touch or overlap). */
export function gapDecades(a: readonly [number, number], b: readonly [number, number]): number {
  const [older, newer] = a[1] < b[0] ? [a, b] : b[1] < a[0] ? [b, a] : [null, null];
  if (!older || !newer) return 0;
  return decades(older[1]) - decades(newer[0]);
}

/** Era of a position. */
export function era(id: string): string {
  const y = position(id);
  if (y <= 1950 - 1e6) return 'deep';
  if (y < 500) return 'early';
  if (y < 1800) return 'middle';
  return 'modern';
}

/** Width of a span: oldest older end to newest newer end, in decades. */
export function width(span: string): number {
  const ids = EVENTS.filter((e) => !e.retired && (span === 'all' || era(e.id) === span)).map((e) => e.id);
  const oldest = Math.min(...ids.map((id) => ends(id)[0]));
  const newest = Math.max(...ids.map((id) => ends(id)[1]));
  return decades(oldest) - decades(newest);
}

/** The ids sorted oldest first (by position). */
export const sortOldestFirst = (ids: readonly string[]): string[] => [...ids].sort((p, q) => position(p) - position(q));

/** The rung of a gap: medium 10^k (k = 1…9), hard 10^(k/2) (k = 2…19); null outside. */
export function rung(level: 'medium' | 'hard', years: number): number | null {
  const per = level === 'medium' ? 1 : 2;
  const k = Math.round(Math.log10(years) * per);
  const [min, max] = level === 'medium' ? [1, 9] : [2, 19];
  return k >= min && k <= max ? k : null;
}
export const rungYears = (level: 'medium' | 'hard', k: number): number => Number((10 ** (level === 'medium' ? k : k / 2)).toPrecision(1));

/** Whether a gap question is fair for two events, and its right rung in years. */
export function fairGap(level: 'medium' | 'hard', a: string, b: string): number | null {
  const [p, q] = position(a) < position(b) ? [a, b] : [b, a];
  const shortest = Math.max(1, ends(q)[0] - ends(p)[1]);
  const longest = ends(q)[1] - ends(p)[0];
  const r1 = rung(level, shortest);
  const r2 = rung(level, longest);
  return r1 !== null && r1 === r2 ? rungYears(level, r1) : null;
}

/** The window of a focus for τ: its ends widened by τ. */
export function windowOf(focus: string, tau: number): [number, number] {
  const [lo, hi] = ends(focus);
  return [lo - tau, hi + tau];
}

/** Whether an event overlaps a year window. */
export function overlaps(id: string, w: readonly [number, number]): boolean {
  const [lo, hi] = ends(id);
  return hi >= w[0] && lo <= w[1];
}

/** Pairs in the right relative order (counted directly). */
export function concordant(arrangement: readonly string[]): number {
  let n = 0;
  for (let i = 0; i < arrangement.length; i++) for (let j = i + 1; j < arrangement.length; j++) if (position(arrangement[i]!) < position(arrangement[j]!)) n++;
  return n;
}

/** The scale-aware distance in milli-decades of a guess from an event's range. */
export function milli(id: string, guess: number): number {
  const [lo, hi] = ends(id);
  if (guess >= lo && guess <= hi) return 0;
  const near = guess < lo ? lo : hi;
  return Math.round(1000 * Math.abs(Math.log10((2030 - guess) / (2030 - near))));
}
