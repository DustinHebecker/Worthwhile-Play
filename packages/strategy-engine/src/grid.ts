import type { Frame, GameMap, Layer, Ruleset, TerrainSpec } from './types';

export const FRAMES: readonly Frame[] = ['id', 'r90', 'r180', 'r270', 'fx', 'fy'];

/** The frame of a side when a world declares none: side 1 sees the map point-mirrored (two-side default). */
export const defaultFrame = (side: number): Frame => (side === 1 ? 'r180' : 'id');

/** A side's frame in a world: the declared one, else the two-side default. */
export const frameOf = (world: { readonly frames?: readonly Frame[] }, side: number): Frame => world.frames?.[side] ?? defaultFrame(side);

/** A vector seen in `frame`, expressed in map coordinates (the inverse of the frame's turn). */
export function frameVector(frame: Frame, dx: number, dy: number): readonly [number, number] {
  switch (frame) {
    case 'id':
      return [dx, dy];
    case 'r180':
      return [-dx, -dy];
    case 'r90':
      return [dy, -dx];
    case 'r270':
      return [-dy, dx];
    case 'fx':
      return [-dx, dy];
    case 'fy':
      return [dx, -dy];
  }
}

/** Air movement cost for an orthogonal step (terrain is ignored). */
export const AIR_COST = 4;

/** Neighbour order in the map's own frame: orthogonal first, then diagonal. */
const BASE_DIRS: readonly (readonly [number, number])[] = [
  [1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [-1, -1], [1, -1]
];
const DIRS: Readonly<Record<Frame, readonly (readonly [number, number])[]>> = Object.fromEntries(
  FRAMES.map((f) => [f, BASE_DIRS.map(([dx, dy]) => frameVector(f, dx, dy))])
) as unknown as Record<Frame, readonly (readonly [number, number])[]>;

/** Neighbour order as seen in a frame (the base order turned with the frame). */
export const frameDirs = (frame: Frame): readonly (readonly [number, number])[] => DIRS[frame];

/**
 * Neighbour order seen from a side under the two-side default frames. Side 1 uses the
 * point-mirrored order, so that a point-mirrored world with swapped sides evolves as the exact
 * mirror image (no side bias). Worlds with declared frames use `frameDirs(frameOf(world, side))`.
 */
export const dirsFor = (side: number): readonly (readonly [number, number])[] => DIRS[defaultFrame(side)];

/** Cell index as seen in a frame (row by row of the turned map), for deterministic, symmetry-consistent tie-breaking. */
export function frameIndexIn(map: { readonly w: number; readonly h: number }, frame: Frame, cell: number): number {
  const { w, h } = map;
  const x = cell % w;
  const y = (cell - x) / w;
  switch (frame) {
    case 'id':
      return cell;
    case 'r180':
      return w * h - 1 - cell;
    case 'r90':
      return x * h + (h - 1 - y);
    case 'r270':
      return (w - 1 - x) * h + y;
    case 'fx':
      return y * w + (w - 1 - x);
    case 'fy':
      return (h - 1 - y) * w + x;
  }
}

/** The cell whose index in `frame` is `index` (inverse of `frameIndexIn`). */
export function frameCell(map: { readonly w: number; readonly h: number }, frame: Frame, index: number): number {
  const { w, h } = map;
  switch (frame) {
    case 'id':
      return index;
    case 'r180':
      return w * h - 1 - index;
    case 'r90': {
      const yy = index % h;
      const x = (index - yy) / h;
      return (h - 1 - yy) * w + x;
    }
    case 'r270': {
      const y = index % h;
      const xx = (index - y) / h;
      return y * w + (w - 1 - xx);
    }
    case 'fx': {
      const xx = index % w;
      return index - xx + (w - 1 - xx);
    }
    case 'fy': {
      const x = index % w;
      const yy = (index - x) / w;
      return (h - 1 - yy) * w + x;
    }
  }
}

/** Cell index as seen from a side under the two-side default frames (see `frameIndexIn` for declared frames). */
export const frameIndex = (cell: number, side: number, cells: number): number => (side === 1 ? cells - 1 - cell : cell);

export const cellOf = (map: GameMap, x: number, y: number): number => y * map.w + x;
export const xOf = (map: GameMap, cell: number): number => cell % map.w;
export const yOf = (map: GameMap, cell: number): number => Math.floor(cell / map.w);
export const inBounds = (map: GameMap, x: number, y: number): boolean => x >= 0 && y >= 0 && x < map.w && y < map.h;

export const dist2 = (ax: number, ay: number, bx: number, by: number): number => (ax - bx) ** 2 + (ay - by) ** 2;

const PLAIN: TerrainSpec = { cost: null, cover: 0, rangeBonus: 0 };

export function terrainAt(map: GameMap, ruleset: Ruleset, x: number, y: number): TerrainSpec {
  const code = map.terrain[cellOf(map, x, y)] ?? '';
  return Object.hasOwn(ruleset.terrain, code) ? (ruleset.terrain[code] ?? PLAIN) : PLAIN;
}

export function passable(map: GameMap, ruleset: Ruleset, x: number, y: number, layer: Layer): boolean {
  if (!inBounds(map, x, y)) return false;
  return layer === 'air' || terrainAt(map, ruleset, x, y).cost !== null;
}

/**
 * Integer cost of a single step between neighbouring cells, or `undefined` if not allowed.
 * Diagonal steps cost ×1.5 and may not cut corners past impassable ground.
 */
export function stepCost(map: GameMap, ruleset: Ruleset, fx: number, fy: number, tx: number, ty: number, layer: Layer): number | undefined {
  const dx = tx - fx;
  const dy = ty - fy;
  if (Math.abs(dx) > 1 || Math.abs(dy) > 1 || (dx === 0 && dy === 0)) return undefined;
  if (!passable(map, ruleset, tx, ty, layer)) return undefined;
  const diagonal = dx !== 0 && dy !== 0;
  if (layer === 'air') return diagonal ? (AIR_COST * 3) / 2 : AIR_COST;
  if (diagonal && (!passable(map, ruleset, fx + dx, fy, layer) || !passable(map, ruleset, fx, fy + dy, layer))) return undefined;
  const base = terrainAt(map, ruleset, tx, ty).cost as number;
  return diagonal ? (base * 3) / 2 : base;
}

/** Cheapest orthogonal step on this layer (for an admissible A* heuristic). */
export function minStepCost(ruleset: Ruleset, layer: Layer): number {
  if (layer === 'air') return AIR_COST;
  let min = Infinity;
  for (const spec of Object.values(ruleset.terrain)) if (spec.cost !== null && spec.cost < min) min = spec.cost;
  return Number.isFinite(min) ? min : AIR_COST;
}

/** Most expensive single step on this layer (caps movement-point accumulation). */
export function maxStepCost(ruleset: Ruleset, layer: Layer): number {
  if (layer === 'air') return (AIR_COST * 3) / 2;
  let max = 0;
  for (const spec of Object.values(ruleset.terrain)) if (spec.cost !== null && spec.cost > max) max = spec.cost;
  return (max * 3) / 2;
}
