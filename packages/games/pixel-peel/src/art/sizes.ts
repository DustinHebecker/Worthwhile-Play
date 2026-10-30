import type { Aspect, Motif, MotifGroup } from './types';

/**
 * Picture sizes per motif and difficulty (design v2 § 2.1 and § 15.1, docs/design/pixel-peel-motifs.md § 3). Pictures
 * with large areas (seasons, landscapes, landmarks) get more pixels, so those areas can carry several colours and
 * detail. The palette tier follows the difficulty. Used when authoring and baking; a game plays the baked rows.
 */

export type ArtDifficulty = 'easy' | 'medium' | 'hard';
export const ART_DIFFICULTIES: readonly ArtDifficulty[] = ['easy', 'medium', 'hard'];
export const TIER_OF: Readonly<Record<ArtDifficulty, 1 | 2 | 3>> = { easy: 1, medium: 2, hard: 3 };

/** Width : height of each aspect, in lowest terms; a width must be a multiple of the first number. */
export const ASPECTS: Readonly<Record<Aspect, readonly [w: number, h: number]>> = {
  square: [1, 1],
  wide: [4, 3],
  tall: [3, 4],
  panorama: [2, 1]
};

/**
 * Size bounds (the rules allow sides up to 64). Width 64 at 5 px cells fits a 360 px phone (v2 § 15.1); height 60 at
 * 5 px cells still leaves the status, waiting places, lane fronts and actions on a 360 × 640 screen (v3 § 4.2: about
 * 305 px of chrome); 3 136 cells (56 × 56, the largest picture of v2) bound generation time on phones.
 */
export const MAX_WIDTH = 64;
export const MAX_HEIGHT = 60;
export const MIN_WIDTH = 24;
export const MAX_CELLS = 56 * 56;

/** Size class of a group: `large` for pictures with large areas. */
export const sizeClass = (group: MotifGroup): 'large' | 'other' => (group === 'animal' || group === 'scene' ? 'other' : 'large');

/** [easy, medium, hard] widths per aspect and size class. */
export const WIDTHS: Readonly<Record<Aspect, Readonly<Record<'large' | 'other', readonly [number, number, number]>>>> = {
  square: { other: [32, 40, 48], large: [36, 44, 56] },
  wide: { other: [36, 44, 56], large: [40, 48, 64] },
  tall: { other: [30, 36, 42], large: [33, 39, 45] },
  panorama: { other: [48, 56, 64], large: [48, 56, 64] }
};

/** Height in cells of a picture of this aspect at width `w`. */
export const heightOf = (motif: Pick<Motif, 'aspect'>, w: number): number => {
  const [rw, rh] = ASPECTS[motif.aspect] ?? ASPECTS.square;
  return (w * rh) / rw;
};

/** Problems of a [easy, medium, hard] width list for an aspect (empty when it is usable). */
export function sizeProblems(aspect: Aspect, widths: readonly number[]): string[] {
  const problems: string[] = [];
  const ratio = ASPECTS[aspect];
  if (!ratio) return [`unknown aspect ${String(aspect)}`];
  if (widths.length !== 3) return ['three widths are needed: easy, medium, hard'];
  widths.forEach((w, k) => {
    const d = ART_DIFFICULTIES[k];
    if (!Number.isInteger(w)) return problems.push(`${d}: width ${w} is not a whole number`);
    if (w % ratio[0] !== 0) problems.push(`${d}: width ${w} is not a multiple of ${ratio[0]} (${aspect})`);
    const h = heightOf({ aspect }, w);
    if (w < MIN_WIDTH || w > MAX_WIDTH) problems.push(`${d}: width ${w} is outside ${MIN_WIDTH}–${MAX_WIDTH}`);
    if (h > MAX_HEIGHT) problems.push(`${d}: height ${h} is above ${MAX_HEIGHT}`);
    if (w * h > MAX_CELLS) problems.push(`${d}: ${w} × ${h} is more than ${MAX_CELLS} cells`);
    if (k > 0 && !(w > (widths[k - 1] as number))) problems.push(`${d}: width ${w} is not larger than the one before`);
    return undefined;
  });
  return problems;
}

/** The width of a motif at a difficulty: its own `size` when that is usable, else the table. */
export function widthFor(motif: Pick<Motif, 'group' | 'aspect' | 'size'>, difficulty: ArtDifficulty): number {
  const k = ART_DIFFICULTIES.indexOf(difficulty);
  if (motif.size && sizeProblems(motif.aspect, motif.size).length === 0) return motif.size[k] as number;
  return (WIDTHS[motif.aspect] ?? WIDTHS.square)[sizeClass(motif.group)][k] as number;
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
