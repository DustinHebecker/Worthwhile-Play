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

/** Clamps a window into the scale and to the minimum width, keeping its width where possible. */
export function clampWindow(w: Window): Window {
  let width = Math.min(FULL.hi - FULL.lo, Math.max(MIN_WIDTH, w.hi - w.lo));
  if (!Number.isFinite(width)) width = FULL.hi - FULL.lo;
  let lo = Number.isFinite(w.lo) ? w.lo : FULL.lo;
  if (w.hi - w.lo < MIN_WIDTH) lo = (w.lo + w.hi) / 2 - width / 2;
  lo = Math.max(FULL.lo, Math.min(FULL.hi - width, lo));
  return { lo, hi: lo + width };
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
    const width = Math.min(FULL.hi - FULL.lo, Math.max(MIN_WIDTH, (w.hi - w.lo) / factor));
    return clampWindow({ lo: at - (1 - x) * width, hi: at + x * width });
  }
  const [l, r] = windowYears(w);
  const at = l + x * (r - l);
  const span = (r - l) / factor;
  const nl = at - x * span;
  const nr = Math.min(AXIS_YEAR - 10, nl + span);
  const hi = Math.log10(age(nl));
  const lo = Math.log10(age(nr));
  return clampWindow(hi - lo < MIN_WIDTH ? { lo: (lo + hi) / 2 - MIN_WIDTH / 2, hi: (lo + hi) / 2 + MIN_WIDTH / 2 } : { lo, hi });
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
    const half = widthOf(label(t)) / 2;
    if (x - half < -px * 0.02 || x + half > px * 1.02) return false;
    return chosen.every((c) => Math.abs(xOf(c.y, w, view) * px - x) >= Math.max(minGap, half + widthOf(label(c)) / 2 + 8));
  };
  const chosen: Tick[] = [];
  for (const level of [0, 1, 2]) for (const t of TICK_CATALOGUE) if (t.level === level && visible(t) && fits(chosen, t)) chosen.push(t);
  if (chosen.length < 3) {
    for (const t of generatedTicks(w, view, px, label, widthOf, minGap)) if (fits(chosen, t)) chosen.push(t);
  }
  return chosen.sort((p, q) => p.y - q.y);
}

/** Ticks at multiples of 1, 2, 5 × 10^k years (calendar years from 10,000 BCE on, else years ago). */
export function generatedTicks(w: Window, view: AxisView, px: number, label: (t: Tick) => string, widthOf: (s: string) => number, minGap = 56): Tick[] {
  const [l, r] = windowYears(w);
  const ago = l < -9999;
  const steps: number[] = [];
  for (let k = 0; k <= 10; k++) for (const m of [1, 2, 5]) steps.push(m * 10 ** k);
  for (const step of steps) {
    const ticks: Tick[] = [];
    if (ago) {
      const a0 = Math.ceil((1950 - r) / step) * step;
      for (let a = a0; 1950 - a >= l && ticks.length < 60; a += step) if (a > 0) ticks.push({ y: 1950 - a, level: 3, ago: true });
    } else {
      const y0 = Math.ceil(l / step) * step;
      for (let y = y0; y <= r && ticks.length < 60; y += step) if (y !== 0) ticks.push({ y, level: 3, ago: false });
    }
    if (ticks.length > 40) continue;
    const xs = ticks.map((t) => xOf(t.y, w, view) * px);
    const ok = xs.every((x, i) => i === 0 || Math.abs(x - xs[i - 1]!) >= Math.max(minGap, (widthOf(label(ticks[i]!)) + widthOf(label(ticks[i - 1]!))) / 2 + 8));
    if (ok && ticks.length) return ticks;
  }
  return [];
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
