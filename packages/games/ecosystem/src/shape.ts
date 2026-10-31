/**
 * Shape classes of a weekly series (design § 11.1): a zigzag with a relative threshold. A move counts when it is at
 * least p % of the series' maximum; the comparison is exact (`100 · move ≥ p · max`), so multiplying a series by a
 * whole number never changes its class.
 */

export const SHAPES = ['steady', 'rises', 'falls', 'rise-fall', 'fall-rise', 'swings-fade', 'swings-last', 'vanishes'] as const;
export type Shape = (typeof SHAPES)[number];

export interface Leg {
  /** +1 up, -1 down. */
  readonly dir: 1 | -1;
  readonly fromWeek: number;
  readonly from: number;
  readonly toWeek: number;
  readonly to: number;
}

export const legSize = (l: Leg): number => Math.abs(l.to - l.from);

/** The zigzag legs of `v` at threshold `p` % of its maximum. */
export function legs(v: readonly number[], p = 20): Leg[] {
  const out: Leg[] = [];
  if (v.length === 0) return out;
  let ref = 0;
  for (const x of v) if (x > ref) ref = x;
  if (ref === 0) return out;
  const big = (diff: number) => diff > 0 && 100 * diff >= ref * p;
  let dir: -1 | 0 | 1 = 0;
  let piv = v[0]!;
  let pivW = 0;
  let ext = piv;
  let extW = 0;
  for (let i = 1; i < v.length; i++) {
    const x = v[i]!;
    if (dir === 0) {
      if (big(x - piv)) dir = 1;
      else if (big(piv - x)) dir = -1;
      if (dir !== 0) {
        ext = x;
        extW = i;
      }
      continue;
    }
    if (dir === 1) {
      if (x > ext) {
        ext = x;
        extW = i;
      } else if (big(ext - x)) {
        out.push({ dir: 1, fromWeek: pivW, from: piv, toWeek: extW, to: ext });
        piv = ext;
        pivW = extW;
        dir = -1;
        ext = x;
        extW = i;
      }
    } else if (x < ext) {
      ext = x;
      extW = i;
    } else if (big(x - ext)) {
      out.push({ dir: -1, fromWeek: pivW, from: piv, toWeek: extW, to: ext });
      piv = ext;
      pivW = extW;
      dir = 1;
      ext = x;
      extW = i;
    }
  }
  if (dir !== 0) out.push({ dir, fromWeek: pivW, from: piv, toWeek: extW, to: ext });
  return out;
}

/** The class of a series (§ 11.1). */
export function classify(v: readonly number[], p = 20): Shape {
  if (v.length > 0 && v[0]! > 0 && v[v.length - 1] === 0) return 'vanishes';
  const L = legs(v, p);
  if (L.length === 0) return 'steady';
  if (L.length === 1) return L[0]!.dir > 0 ? 'rises' : 'falls';
  if (L.length === 2) return L[0]!.dir > 0 ? 'rise-fall' : 'fall-rise';
  return legSize(L[L.length - 1]!) * 2 <= legSize(L[0]!) ? 'swings-fade' : 'swings-last';
}

export type Family = 'up' | 'down' | 'swings';

/** Families for "close" (●●○): up-first, down-first, swings; `steady` has none. */
export function family(s: Shape): Family | null {
  switch (s) {
    case 'rises':
    case 'rise-fall':
      return 'up';
    case 'falls':
    case 'fall-rise':
    case 'vanishes':
      return 'down';
    case 'swings-fade':
    case 'swings-last':
      return 'swings';
    default:
      return null;
  }
}
