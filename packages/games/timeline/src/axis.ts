/**
 * The time axis, pure part (design § 12): the visible window, the squeezed (log) and even (linear) mappings, zoom and
 * pan that keep the point under the pointer fixed, the tick choice and the label layout. Past on the left, present on
 * the right, in every language. No DOM.
 */
import { AXIS_YEAR, U_MAX, U_MIN, age, u, yearAtU } from './time';

export type AxisView = 'log' | 'linear';

/** The visible window in decades of age: `lo` = the newest end (right), `hi` = the oldest end (left). */
export interface Window {
  readonly lo: number;
  readonly hi: number;
}

/** The narrowest window (about 25 years across around 1500). */
export const MIN_WIDTH = 0.01;
export const FULL: Window = { lo: U_MIN, hi: U_MAX };

/** The narrowest window starting at `lo`: 0.01 decades, and at least 20 years across (near today). */
export const minWidthAt = (lo: number): number => Math.max(MIN_WIDTH, Math.log10(1 + 20 / 10 ** lo));

/** Clamps a window into the scale and to the minimum width, keeping its width where possible. */
export function clampWindow(w: Window): Window {
  const full = FULL.hi - FULL.lo;
  let width = Number.isFinite(w.hi - w.lo) ? Math.min(full, w.hi - w.lo) : full;
  let lo = Number.isFinite(w.lo) ? w.lo : FULL.lo;
  const min = minWidthAt(Math.max(FULL.lo, lo));
  if (width < min) {
    lo = (Number.isFinite(w.hi) ? (w.lo + w.hi) / 2 : lo) - min / 2;
    width = min;
  }
  lo = Math.max(FULL.lo, Math.min(FULL.hi - width, lo));
  width = Math.max(width, minWidthAt(lo));
  return { lo, hi: Math.min(FULL.hi, lo + width) };
}

/** The window's ends as years: [left (oldest), right (newest)]. */
export const windowYears = (w: Window): [number, number] => [yearAtU(w.hi), yearAtU(w.lo)];

/** Position 0 (left) … 1 (right) of a year in the window. */
export function xOf(y: number, w: Window, view: AxisView): number {
  if (view === 'log') return (w.hi - u(y)) / (w.hi - w.lo);
  const [l, r] = windowYears(w);
  return (y - l) / (r - l);
}

/** The year at position x (0…1) of the window. */
export function yearAt(x: number, w: Window, view: AxisView): number {
  if (view === 'log') return yearAtU(w.hi - x * (w.hi - w.lo));
  const [l, r] = windowYears(w);
  return l + x * (r - l);
}

/** Zooms by `factor` (> 1 = in) keeping the point at position `x` fixed (then clamped into the scale). */
export function zoomAt(w: Window, x: number, factor: number, view: AxisView): Window {
  if (!(factor > 0) || !Number.isFinite(factor)) return w;
  if (view === 'log') {
    const at = w.hi - x * (w.hi - w.lo);
    const width = Math.min(FULL.hi - FULL.lo, (w.hi - w.lo) / factor);
    return clampWindow({ lo: at - (1 - x) * width, hi: at + x * width });
  }
  const [l, r] = windowYears(w);
  const at = l + x * (r - l);
  const span = (r - l) / factor;
  const nl = at - x * span;
  const nr = Math.min(AXIS_YEAR - 10, nl + span);
  return clampWindow({ lo: Math.log10(age(nr)), hi: Math.log10(age(nl)) });
}

/** Pans by `dx` of the axis width (positive = towards the present). */
export function pan(w: Window, dx: number, view: AxisView): Window {
  if (!Number.isFinite(dx)) return w;
  if (view === 'log') {
    const d = dx * (w.hi - w.lo);
    return clampWindow({ lo: w.lo - d, hi: w.hi - d });
  }
  const [l, r] = windowYears(w);
  let shift = dx * (r - l);
  shift = Math.min(shift, AXIS_YEAR - 10 - r);
  const nl = l + shift;
  const nr = r + shift;
  return clampWindow({ lo: Math.log10(age(nr)), hi: Math.log10(age(nl)) });
}

/** A window around years [a, b] (a older), padded by `pad` of its log width on each side. */
export function fitYears(a: number, b: number, pad = 0.15): Window {
  const hi = u(Math.min(a, b));
  const lo = u(Math.max(a, b));
  const width = Math.max(MIN_WIDTH * 4, hi - lo);
  return clampWindow({ lo: lo - pad * width, hi: hi + pad * width });
}

/* ---------- Ticks (§ 12.2) ---------- */

export interface Tick {
  readonly y: number;
  /** 0 = most important. */
  readonly level: number;
  /** Shown as years ago (true) or as a calendar year. */
  readonly ago: boolean;
}

const BC = (n: number) => 1 - n;
/** The fixed catalogue: calendar years and "years ago" values with importance levels. */
export const TICK_CATALOGUE: readonly Tick[] = [
  ...([[2000, 0], [1900, 1], [1800, 1], [1500, 1], [1000, 0], [500, 1], [1, 0], [BC(500), 2], [BC(1000), 1], [BC(2000), 1], [BC(3000), 0], [BC(5000), 1], [BC(10000), 1]] as const).map(([y, level]) => ({ y, level, ago: false })),
  ...([[2e4, 2], [5e4, 2], [1e5, 0], [3e5, 2], [1e6, 0], [3e6, 2], [1e7, 1], [3e7, 2], [1e8, 0], [3e8, 1], [1e9, 0], [2e9, 2], [3e9, 2], [4e9, 1]] as const).map(([a, level]) => ({ y: 1950 - a, level, ago: true }))
];

/** Chooses ticks greedily by level while their labels stay apart (`widthOf` estimates a label's pixels). */
export function chooseTicks(w: Window, view: AxisView, px: number, label: (t: Tick) => string, widthOf: (s: string) => number, minGap = 56): Tick[] {
  const visible = (t: Tick) => {
    const x = xOf(t.y, w, view);
    return x >= -1e-9 && x <= 1 + 1e-9;
  };
  const fits = (chosen: readonly Tick[], t: Tick) => {
    const x = xOf(t.y, w, view) * px;
    const text = label(t);
    const half = widthOf(text) / 2;
    // Labels at the ends are shifted inside when drawn, so only the spacing counts; two ticks never share a label.
    return chosen.every((c) => label(c) !== text && Math.abs(xOf(c.y, w, view) * px - x) >= Math.max(minGap, half + widthOf(label(c)) / 2 + 8));
  };
  const chosen: Tick[] = [];
  for (const level of [0, 1, 2]) for (const t of TICK_CATALOGUE) if (t.level === level && visible(t) && fits(chosen, t)) chosen.push(t);
  if (chosen.length < 3) {
    for (const t of generatedTicks(w, view, px, label, widthOf, minGap)) if (fits(chosen, t)) chosen.push(t);
  }
  return chosen.sort((p, q) => p.y - q.y);
}

/**
 * Ticks at multiples of 1, 2, 5 × 10^k years (calendar years from 10,000 BCE on, else years ago): candidates on the
 * finest step that gives at most 200 of them, taken roundest first while their labels stay apart, and none less than a
 * tenth as round as the third-roundest candidate.
 */
export function generatedTicks(w: Window, view: AxisView, px: number, label: (t: Tick) => string, widthOf: (s: string) => number, minGap = 56): Tick[] {
  const [l, r] = windowYears(w);
  const steps: number[] = [];
  for (let k = 0; k <= 10; k++) for (const m of [1, 2, 5]) steps.push(m * 10 ** k);
  const cands: { t: Tick; round: number }[] = [];
  // The part before 10,000 BCE is counted in years ago (from 1950), the rest in calendar years.
  const parts: [number, number, boolean][] = [];
  if (l < -9999) parts.push([1950 - Math.min(r, -10_000), 1950 - l, true]);
  if (r >= -9999) parts.push([Math.max(l, -9999), r, false]);
  for (const [a, b, ago] of parts) {
    const step = steps.find((s) => (b - a) / s <= 200) ?? steps[steps.length - 1]!;
    for (let v = Math.ceil(a / step) * step; v <= b; v += step) {
      if (v === 0 || (ago && v <= 0)) continue;
      let round = step;
      for (const s of steps) if (s > step && v % s === 0) round = s;
      cands.push({ t: { y: ago ? 1950 - v : v, level: 3, ago }, round });
    }
  }
  cands.sort((p, q) => q.round - p.round || p.t.y - q.t.y);
  // Only values at most ten times less round than the third-roundest ("1880" next to "1900", never "1876").
  const minRound = (cands[Math.min(2, cands.length - 1)]?.round ?? 1) / 10;
  const chosen: Tick[] = [];
  for (const { t, round } of cands) {
    if (round < minRound) break;
    const x = xOf(t.y, w, view) * px;
    const text = label(t);
    const half = widthOf(text) / 2;
    if (chosen.every((c) => label(c) !== text && Math.abs(xOf(c.y, w, view) * px - x) >= Math.max(minGap, half + widthOf(label(c)) / 2 + 8))) chosen.push(t);
    if (chosen.length >= 40) break;
  }
  return chosen.sort((p, q) => p.y - q.y);
}

/* ---------- Label layout (§ 12.3) ---------- */

export interface LabelIn {
  readonly x: number;
  readonly width: number;
}

/** Rows (0–2) for labels centred at `x`, greedily without overlap; null = no room (shown in the legend). */
export function layoutLabels(labels: readonly LabelIn[], px: number, rows = 3, gap = 6): (number | null)[] {
  const order = labels.map((_, i) => i).sort((p, q) => labels[p]!.x - labels[q]!.x);
  const out: (number | null)[] = labels.map(() => null);
  const spans: [number, number][][] = Array.from({ length: rows }, () => []);
  for (const i of order) {
    const l = labels[i]!;
    const a = Math.max(0, Math.min(px - l.width, l.x - l.width / 2));
    const b = a + l.width;
    for (let r = 0; r < rows; r++) {
      if (spans[r]!.every(([p, q]) => b + gap <= p || a >= q + gap)) {
        spans[r]!.push([a, b]);
        out[i] = r;
        break;
      }
    }
  }
  return out;
}

/** The left edge of a label centred at x, kept inside the axis. */
export const labelLeft = (x: number, width: number, px: number): number => Math.max(0, Math.min(px - width, x - width / 2));
