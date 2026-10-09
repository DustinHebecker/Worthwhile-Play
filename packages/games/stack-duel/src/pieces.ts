/**
 * Piece catalogue for Stack Duel: original abstract "stones".
 *
 * Every kind has a drawing outline (may be concave) and a convex decomposition used by
 * the physics. Both are shifted so that the centre of mass (uniform density) lies at the
 * origin. Units are world units (the platform is 5 units wide).
 *
 * Kinds are identified by their index in `PIECE_KINDS`; that index is what the saved state
 * stores, so the order of this list is part of the save format (append only).
 */

export type Point = readonly [number, number];
export type Polygon = readonly Point[];

/** Visual pattern drawn inside the piece so that colour is never the only cue. */
export const PATTERNS = ['stripes', 'dots', 'grid', 'waves', 'checks', 'rings', 'cross'] as const;
export type Pattern = (typeof PATTERNS)[number];

export interface PieceKind {
  /** Stable id, also used for message keys `piece.<id>`. */
  readonly id: string;
  /** Concave-capable outline, counter-clockwise, centred on the centre of mass. */
  readonly outline: Polygon;
  /** Convex parts (counter-clockwise), centred like `outline`. Their union is the outline. */
  readonly parts: readonly Polygon[];
  readonly pattern: Pattern;
  /** Hue index into the view's palette (0–6). */
  readonly hue: number;
}

interface RawKind {
  id: string;
  outline: Polygon;
  parts?: Polygon[];
  pattern: Pattern;
  hue: number;
}

const rect = (x0: number, y0: number, x1: number, y1: number): Polygon => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1]
];

const regular = (sides: number, radius: number): Polygon =>
  Array.from({ length: sides }, (_, i) => {
    const angle = -Math.PI / 2 + Math.PI / sides + (2 * Math.PI * i) / sides;
    return [radius * Math.cos(angle), radius * Math.sin(angle)] as const;
  });

const RAW: readonly RawKind[] = [
  { id: 'block', outline: rect(0, 0, 1, 1), pattern: 'grid', hue: 0 },
  { id: 'tile', outline: rect(0, 0, 0.7, 0.7), pattern: 'dots', hue: 1 },
  { id: 'bar', outline: rect(0, 0, 2.8, 0.5), pattern: 'stripes', hue: 2 },
  { id: 'plank', outline: rect(0, 0, 1.8, 0.5), pattern: 'waves', hue: 3 },
  {
    id: 'corner',
    outline: [[0, 0], [1.8, 0], [1.8, 0.6], [0.6, 0.6], [0.6, 1.5], [0, 1.5]],
    parts: [rect(0, 0, 1.8, 0.6), rect(0, 0.6, 0.6, 1.5)],
    pattern: 'checks',
    hue: 4
  },
  {
    id: 'tee',
    outline: [[0.7, 0], [1.3, 0], [1.3, 1], [2, 1], [2, 1.5], [0, 1.5], [0, 1], [0.7, 1]],
    parts: [rect(0.7, 0, 1.3, 1), rect(0, 1, 2, 1.5)],
    pattern: 'rings',
    hue: 5
  },
  {
    id: 'arch',
    outline: [[0, 0], [0.5, 0], [0.5, 0.8], [1.7, 0.8], [1.7, 0], [2.2, 0], [2.2, 1.3], [0, 1.3]],
    parts: [rect(0, 0, 0.5, 0.8), rect(1.7, 0, 2.2, 0.8), rect(0, 0.8, 2.2, 1.3)],
    pattern: 'cross',
    hue: 6
  },
  {
    id: 'cup',
    outline: [[0, 0], [1.8, 0], [1.8, 1.1], [1.4, 1.1], [1.4, 0.4], [0.4, 0.4], [0.4, 1.1], [0, 1.1]],
    parts: [rect(0, 0, 1.8, 0.4), rect(0, 0.4, 0.4, 1.1), rect(1.4, 0.4, 1.8, 1.1)],
    pattern: 'stripes',
    hue: 1
  },
  { id: 'trapezoid', outline: [[0, 0], [2, 0], [1.5, 0.8], [0.5, 0.8]], pattern: 'dots', hue: 2 },
  { id: 'triangle', outline: [[0, 0], [1.6, 0], [0.8, 1.3]], pattern: 'grid', hue: 3 },
  { id: 'wedge', outline: [[0, 0], [2, 0], [2, 0.7]], pattern: 'cross', hue: 0 },
  { id: 'pentagon', outline: regular(5, 0.65), pattern: 'rings', hue: 4 },
  { id: 'diamond', outline: [[0, 0.6], [0.9, 0], [1.8, 0.6], [0.9, 1.2]], pattern: 'checks', hue: 5 },
  { id: 'slant', outline: [[0, 0], [1.6, 0], [2.2, 0.7], [0.6, 0.7]], pattern: 'waves', hue: 6 },
  {
    id: 'step',
    outline: [[0, 0], [1.2, 0], [1.2, 0.5], [1.8, 0.5], [1.8, 1], [0.6, 1], [0.6, 0.5], [0, 0.5]],
    parts: [rect(0, 0, 1.2, 0.5), rect(0.6, 0.5, 1.8, 1)],
    pattern: 'grid',
    hue: 2
  }
];

/** Signed area (positive for counter-clockwise polygons). */
export function polygonArea(poly: Polygon): number {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i]!;
    const [x2, y2] = poly[(i + 1) % poly.length]!;
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

/** Area-weighted centroid of a set of polygons. */
export function centroidOf(polys: readonly Polygon[]): Point {
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (const poly of polys) {
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i]!;
      const [x2, y2] = poly[(i + 1) % poly.length]!;
      const cross = x1 * y2 - x2 * y1;
      area += cross;
      cx += (x1 + x2) * cross;
      cy += (y1 + y2) * cross;
    }
  }
  return [cx / (3 * area), cy / (3 * area)];
}

const shift = (poly: Polygon, [dx, dy]: Point): Polygon => poly.map(([x, y]) => [x - dx, y - dy] as const);

export const PIECE_KINDS: readonly PieceKind[] = RAW.map((raw) => {
  const parts = raw.parts ?? [raw.outline];
  const c = centroidOf(parts);
  return { id: raw.id, outline: shift(raw.outline, c), parts: parts.map((p) => shift(p, c)), pattern: raw.pattern, hue: raw.hue };
});

export const KIND_COUNT = PIECE_KINDS.length;

export const kindById = (id: string): number => PIECE_KINDS.findIndex((k) => k.id === id);

/**
 * Relative frequency of each kind per difficulty (index = kind). Easy favours calm, flat
 * pieces; hard favours pointed and rolling ones. Difficulty never adds time pressure.
 */
export const PIECE_WEIGHTS: Readonly<Record<'easy' | 'medium' | 'hard', readonly number[]>> = {
  //      block tile bar plank corner tee arch cup trap tri wedge pent diam slant step
  easy: [4, 3, 2, 4, 1, 1, 1, 2, 3, 0, 0, 0, 0, 0, 1],
  medium: [2, 2, 2, 2, 2, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2],
  hard: [1, 1, 1, 1, 2, 2, 1, 1, 1, 3, 3, 2, 3, 3, 2]
};

/** Rotates a point by `angle` radians (counter-clockwise, y up). */
export function rotatePoint([x, y]: Point, angle: number): Point {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [x * c - y * s, x * s + y * c];
}
