/**
 * Timbres (design § 9.2): Fourier coefficients for one `PeriodicWave` each, built once per context. Harmonics matter
 * for consonance (coinciding partials), so notes are never sine-only, never square or saw. With normalisation on,
 * the browser scales each wave to a peak of 1.
 */
import type { Voice } from './schedule';

/** Sine amplitudes of harmonics 1…n (index 0 is the DC term and stays 0). */
export const HARMONICS: Readonly<Record<Voice, readonly number[]>> = {
  soft: [0, 1, 0.45, 0.25, 0.14, 0.08, 0.05, 0.03, 0.02],
  tick: [0, 1, 0.5, 0.25]
};

/** `real` (cosine) and `imag` (sine) arrays for `createPeriodicWave`. */
export function waveTables(voice: Voice): { real: Float32Array; imag: Float32Array } {
  const imag = Float32Array.from(HARMONICS[voice]);
  return { real: new Float32Array(imag.length), imag };
}
