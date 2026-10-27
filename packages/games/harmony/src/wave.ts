/**
 * Ratio and wave pictures (design § 11.3), pure. The wave is the sum of the fundamentals only (stated in the
 * caption), sampled over 16 periods of the lowest note; the caption says after how many lower-note periods the
 * pure-ratio sum repeats, or that there is no short repeat.
 */
import { RATIOS, SHORT_REPEAT, cents, etDeviation, repeatPeriods, type IntervalId } from './theory';

export const WAVE_PERIODS = 16;
export const MAX_SAMPLES = 800;

/** y values in [−1, 1] of the summed sines of `freqs` over 16 periods of the lowest frequency. */
export function waveSamples(freqs: readonly number[], samples = MAX_SAMPLES): number[] {
  const n = Math.min(MAX_SAMPLES, Math.max(2, Math.floor(samples)));
  if (!freqs.length) return new Array<number>(n).fill(0);
  const low = Math.min(...freqs);
  const span = WAVE_PERIODS / low;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = (span * i) / (n - 1);
    let y = 0;
    for (const f of freqs) y += Math.sin(2 * Math.PI * f * t);
    out.push(y / freqs.length);
  }
  return out;
}

/** The caption's fact: repeats after k lower-note periods (k ≤ 5), or `null` for "no short repeat". */
export function shortRepeat(semitonesAboveLowest: readonly number[]): number | null {
  const k = repeatPeriods(semitonesAboveLowest);
  return k <= SHORT_REPEAT ? k : null;
}

export interface RatioFacts {
  readonly ratio: readonly [number, number];
  /** Cents of equal temperament and of the pure ratio. */
  readonly etCents: number;
  readonly pureCents: number;
  /** Equal temperament minus pure, rounded to 0.1 cent. */
  readonly deviation: number;
  /** The tritone has no simple ratio. */
  readonly simple: boolean;
}

export function ratioFacts(ivl: IntervalId): RatioFacts {
  const [p, q] = RATIOS[ivl];
  return { ratio: [p, q], etCents: etDeviation(ivl) + cents(p / q), pureCents: cents(p / q), deviation: Math.round(etDeviation(ivl) * 10) / 10, simple: ivl !== 'TT' };
}
