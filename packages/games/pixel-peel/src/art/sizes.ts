import type { Motif } from './types';

/**
 * Picture sizes per motif and difficulty (design v2 § 2.1, owner feedback 2026-10-18). Landscapes get more pixels,
 * so their large areas can carry several colours and detail. Wide pictures are ¾ as high as wide, so their widths
 * are multiples of 4. The palette tier follows the difficulty.
 */

export type ArtDifficulty = 'easy' | 'medium' | 'hard';
export const ART_DIFFICULTIES: readonly ArtDifficulty[] = ['easy', 'medium', 'hard'];
export const TIER_OF: Readonly<Record<ArtDifficulty, 1 | 2 | 3>> = { easy: 1, medium: 2, hard: 3 };

/** [easy, medium, hard] widths. */
const WIDTHS = {
  squareOther: [32, 40, 48],
  squareLandscape: [36, 44, 56],
  wideOther: [36, 44, 56],
  wideLandscape: [40, 48, 64]
} as const;

/** The largest width any motif uses (the rules' limit). */
export const MAX_WIDTH = 64;

export const isLandscape = (motif: Pick<Motif, 'group'>): boolean => motif.group === 'landscape' || motif.group === 'season';

export function widthFor(motif: Pick<Motif, 'group' | 'aspect'>, difficulty: ArtDifficulty): number {
  const key = `${motif.aspect === 'wide' ? 'wide' : 'square'}${isLandscape(motif) ? 'Landscape' : 'Other'}` as keyof typeof WIDTHS;
  return WIDTHS[key][ART_DIFFICULTIES.indexOf(difficulty)] as number;
}

/** Pixel share per colour key and the effective number of colours, 1 / Σ p² (owner feedback 2026-10-18). */
export function colourStats(rows: readonly string[]): { shares: Map<string, number>; effective: number; atLeast2: number; largest: number } {
  const counts = new Map<string, number>();
  let total = 0;
  for (const row of rows) {
    for (const ch of row) {
      if (ch === '.') continue;
      counts.set(ch, (counts.get(ch) ?? 0) + 1);
      total++;
    }
  }
  const shares = new Map<string, number>();
  let sum2 = 0;
  let atLeast2 = 0;
  let largest = 0;
  for (const [k, n] of counts) {
    const p = total ? n / total : 0;
    shares.set(k, p);
    sum2 += p * p;
    if (p >= 0.02) atLeast2++;
    largest = Math.max(largest, p);
  }
  return { shares, effective: sum2 > 0 ? 1 / sum2 : 0, atLeast2, largest };
}
