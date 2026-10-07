import type { GameMap, Layer, Ruleset, TerrainSpec } from './types';

/** Neighbour order in side 0's frame: orthogonal first, then diagonal. */
const BASE_DIRS: readonly (readonly [number, number])[] = [
  [1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [-1, -1], [1, -1]
];
const MIRRORED_DIRS = BASE_DIRS.map(([dx, dy]) => [-dx, -dy] as const);

/** Air movement cost for an orthogonal step (terrain is ignored). */
export const AIR_COST = 4;

/**
 * Neighbour order seen from a side. Side 1 uses the point-mirrored order, so that a
 * point-mirrored world with swapped sides evolves as the exact mirror image (no side bias).
 */
export const dirsFor = (side: number): readonly (readonly [number, number])[] => (side === 1 ? MIRRORED_DIRS : BASE_DIRS);

/** Cell index as seen from a side, used for deterministic, mirror-consistent tie-breaking. */
export const frameIndex = (cell: number, side: number, cells: number): number => (side === 1 ? cells - 1 - cell : cell);

export const cellOf = (map: GameMap, x: number, y: number): number => y * map.w + x;
export const xOf = (map: GameMap, cell: number): number => cell % map.w;
export const yOf = (map: GameMap, cell: number): number => Math.floor(cell / map.w);
export const inBounds = (map: GameMap, x: number, y: number): boolean => x >= 0 && y >= 0 && x < map.w && y < map.h;

export const dist2 = (ax: number, ay: number, bx: number, by: number): number => (ax - bx) ** 2 + (ay - by) ** 2;

const PLAIN: TerrainSpec = { cost: null, cover: 0, rangeBonus: 0 };

export function terrainAt(map: GameMap, ruleset: Ruleset, x: number, y: number): TerrainSpec {
  return ruleset.terrain[map.terrain[cellOf(map, x, y)] ?? ''] ?? PLAIN;
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
