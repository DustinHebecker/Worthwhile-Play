/**
 * Marks of a prediction (design § 11.2): 3 = ●●● "just like the model", 2 = ●●○ "close", 1 = ●○○ "partly",
 * 0 = ○○○ "the model went another way". Integer arithmetic only.
 */
import { idiv } from './model';
import { family, type Shape } from './shape';

/** Level bands: 0 lower, 1 about the same, 2 higher. */
export type Band = 0 | 1 | 2;
export type Marks = 0 | 1 | 2 | 3;

/** The band of v_t against v₀: lower < 0.85 ≤ same ≤ 1.15 < higher; with v₀ = 0, higher iff v_t ≥ 1,000 u. */
export function levelBand(v0: number, vt: number): Band {
  if (v0 === 0) return vt >= 1000 ? 2 : 1;
  if (100 * vt < 85 * v0) return 0;
  if (100 * vt > 115 * v0) return 2;
  return 1;
}

/** The model's band ●●●, the neighbouring band ●○○, the opposite band ○○○. */
export const levelMarks = (model: Band, answer: Band): Marks => (model === answer ? 3 : Math.abs(model - answer) === 1 ? 1 : 0);

/** Same class ●●●, same family ●●○, otherwise ○○○. */
export function shapeMarks(model: Shape, answer: Shape): Marks {
  if (model === answer) return 3;
  const f = family(model);
  return f !== null && f === family(answer) ? 2 : 0;
}

/** The six sketch handles sit at weeks ⌊k·H/6⌋, k = 1…6. */
export const sketchWeeks = (H: number): number[] => [1, 2, 3, 4, 5, 6].map((k) => idiv(k * H, 6));

/** Sketch error in ‰ of the chart height: mean absolute distance of the six handles from the model. */
export function sketchError(points: readonly number[], series: readonly number[], H: number, Y: number): number {
  const weeks = sketchWeeks(H);
  let sum = 0;
  for (let k = 0; k < 6; k++) sum += Math.abs((points[k] ?? 0) - (series[weeks[k]!] ?? 0));
  return idiv(1000 * sum, 6 * Y);
}

export const SKETCH_LIMITS = [120, 250, 400] as const;

export function sketchMarks(e: number): Marks {
  if (e <= SKETCH_LIMITS[0]) return 3;
  if (e <= SKETCH_LIMITS[1]) return 2;
  if (e <= SKETCH_LIMITS[2]) return 1;
  return 0;
}

export const MARK_SYMBOLS: Readonly<Record<Marks, string>> = { 3: '●●●', 2: '●●○', 1: '●○○', 0: '○○○' };
