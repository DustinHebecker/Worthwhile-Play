/**
 * The picture's fit (design v3 § 4.2), pure so it can be tested without a layout engine. The view measures the
 * available width and height once per mount and resize, and the height of everything in the play unit except the
 * picture (`chrome`); the cell size is the largest that fits both.
 */

export const MIN_CELL = 5;
export const MAX_CELL = 24;
/** Spare pixels kept below the play unit (rounding, focus rings). */
export const FIT_MARGIN = 8;

export interface FitInput {
  /** Width available to the picture (CSS px). */
  availW: number;
  /** Height of the viewport with the browser bars shown (CSS px; `100svh`). */
  availH: number;
  /** Picture size in cells. */
  w: number;
  h: number;
  /** Track frame around the picture (CSS px). */
  track: number;
  /** Height of the play unit without the picture (CSS px). */
  chrome: number;
}

/** Cell size in CSS px: never below 5 or above 24; 0 when the width is not known yet. */
export function fitCell({ availW, availH, w, h, track, chrome }: FitInput): number {
  if (!(availW > 0) || w <= 0 || h <= 0) return 0;
  const byWidth = Math.floor((availW - 2 * track) / w);
  const byHeight = availH > 0 ? Math.floor((availH - chrome - 2 * track - FIT_MARGIN) / h) : MAX_CELL;
  return Math.max(MIN_CELL, Math.min(MAX_CELL, byWidth, byHeight));
}
