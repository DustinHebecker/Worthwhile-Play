import { createRng, isArrayOf, isInt, isOneOf, isRecord, isUint32, type Rng } from '@wp/game-core';

/**
 * Pure, DOM-free rules for Circuit (a rotate-the-tiles network puzzle).
 *
 * Every tile carries wire stubs towards some of its four sides, stored as a bit mask
 * (`N`, `E`, `S`, `W`). Rotating a tile rotates its mask. The circuit is complete when
 * every tile is connected to the power source, no wire end is loose and the wires
 * form no loop — i.e. the matched connections form a spanning tree of the grid.
 *
 * Generation: seeded random spanning tree (randomised Prim growth, at most three
 * connections per tile) → tile masks → random rotations. Solutions need not be
 * unique; the checker accepts any configuration that satisfies the rules above.
 */

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

/** Board edge length per difficulty (square boards). */
export const SIZES: Readonly<Record<Difficulty, number>> = { easy: 5, medium: 7, hard: 9 };

/** Direction bits. Clockwise order: N → E → S → W. */
export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;
export const DIRECTIONS = [N, E, S, W] as const;
export type Direction = (typeof DIRECTIONS)[number];

/** Highest number of connections a generated tile may have (no 4-way crossings). */
export const MAX_DEGREE = 3;
/** Degree-capped growth attempts before falling back to uncapped growth. */
export const MAX_ATTEMPTS = 60;
/** Undo history kept in the save (oldest entries are dropped beyond this). */
export const MAX_HISTORY = 500;
/** Upper bound for the move counter in untrusted saves. */
export const MAX_COUNTER = 1_000_000;

export type TileKind = 'end' | 'straight' | 'corner' | 'tee' | 'cross';
export const TILE_KINDS: readonly TileKind[] = ['end', 'straight', 'corner', 'tee', 'cross'];
/** Canonical (rotation 0) mask of each kind. */
export const CANONICAL: Readonly<Record<TileKind, number>> = { end: N, straight: N | S, corner: N | E, tee: N | E | S, cross: N | E | S | W };

export interface CircuitState {
  seed: number;
  difficulty: Difficulty;
  /** Edge length; always `SIZES[difficulty]`. */
  size: number;
  /** Row-major index of the power source tile (the centre). */
  source: number;
  /** Row-major generated target configuration (one valid solution). */
  solution: number[];
  /** Row-major current tile masks; each is a rotation of the matching `solution` mask. */
  masks: number[];
  /** Row-major lock flags; locked tiles do not rotate. */
  locked: boolean[];
  /** Rotations made (undo takes one back). */
  moves: number;
  /** Undo stack: `index + 1` for a clockwise turn, `-(index + 1)` for a counter-clockwise turn. */
  history: number[];
}

export function toDifficulty(value: unknown): Difficulty {
  return isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY;
}

// --- Tile algebra --------------------------------------------------------------------------

export function rotateCW(mask: number): number {
  return ((mask << 1) | (mask >> 3)) & 15;
}

export function rotateCCW(mask: number): number {
  return ((mask >> 1) | (mask << 3)) & 15;
}

/** Rotates `turns` quarter turns clockwise (negative = counter-clockwise). */
export function rotateBy(mask: number, turns: number): number {
  const k = ((turns % 4) + 4) % 4;
  let m = mask;
  for (let i = 0; i < k; i++) m = rotateCW(m);
  return m;
}

export function opposite(dir: Direction): Direction {
  return rotateBy(dir, 2) as Direction;
}

export function degree(mask: number): number {
  let count = 0;
  for (const d of DIRECTIONS) if (mask & d) count++;
  return count;
}

export function kindOf(mask: number): TileKind | null {
  const deg = degree(mask);
  if (deg === 1) return 'end';
  if (deg === 3) return 'tee';
  if (deg === 4) return 'cross';
  if (deg === 2) return mask === (N | S) || mask === (E | W) ? 'straight' : 'corner';
  return null;
}

/** Quarter turns clockwise from the canonical shape of its kind (0–3), or -1 for an empty mask. */
export function rotationOf(mask: number): number {
  const kind = kindOf(mask);
  if (kind === null) return -1;
  return [0, 1, 2, 3].findIndex((k) => rotateBy(CANONICAL[kind], k) === mask);
}

/** True when `b` can be reached from `a` by rotation. */
export function isRotationOf(a: number, b: number): boolean {
  return [0, 1, 2, 3].some((k) => rotateBy(a, k) === b);
}

// --- Grid ----------------------------------------------------------------------------------

/** Neighbour index in direction `dir`, or -1 when it would leave the board. */
export function neighbor(index: number, size: number, dir: Direction): number {
  const r = Math.floor(index / size);
  const c = index % size;
  if (dir === N) return r > 0 ? index - size : -1;
  if (dir === S) return r < size - 1 ? index + size : -1;
  if (dir === E) return c < size - 1 ? index + 1 : -1;
  return c > 0 ? index - 1 : -1;
}

/** True when tile `index` has a wire towards `dir` and the neighbour wires back. */
export function linked(masks: readonly number[], size: number, index: number, dir: Direction): boolean {
  if (!((masks[index] ?? 0) & dir)) return false;
  // Off-board neighbours (-1) read as an empty tile.
  return ((masks[neighbor(index, size, dir)] ?? 0) & opposite(dir)) !== 0;
}

/** Tiles connected to the source through matched wires (breadth-first search). */
export function poweredSet(masks: readonly number[], size: number, source: number): boolean[] {
  const powered = masks.map(() => false);
  if (source < 0 || source >= masks.length) return powered;
  powered[source] = true;
  const queue = [source];
  // Iterating an array while appending to it visits the appended items too (BFS order).
  for (const i of queue) {
    for (const d of DIRECTIONS) {
      if (!linked(masks, size, i, d)) continue;
      const j = neighbor(i, size, d);
      if (!powered[j]) {
        powered[j] = true;
        queue.push(j);
      }
    }
  }
  return powered;
}

/** Per tile, the mask of wire ends that are loose (off the board or unmatched). */
export function looseEnds(masks: readonly number[], size: number): number[] {
  return masks.map((mask, i) => {
    let loose = 0;
    for (const d of DIRECTIONS) if (mask & d && !linked(masks, size, i, d)) loose |= d;
    return loose;
  });
}

export function countLoose(masks: readonly number[], size: number): number {
  return looseEnds(masks, size).reduce((sum, m) => sum + degree(m), 0);
}

/** Number of matched connections (each counted once). */
export function countLinks(masks: readonly number[], size: number): number {
  let links = 0;
  masks.forEach((_, i) => {
    if (linked(masks, size, i, E)) links++;
    if (linked(masks, size, i, S)) links++;
  });
  return links;
}

/** Complete circuit: everything powered, no loose ends, and no loops (a spanning tree). */
export function isCircuitComplete(masks: readonly number[], size: number, source: number): boolean {
  if (masks.length !== size * size) return false;
  if (!poweredSet(masks, size, source).every(Boolean)) return false;
  if (countLoose(masks, size) !== 0) return false;
  return countLinks(masks, size) === masks.length - 1;
}

export function isSolved(state: CircuitState): boolean {
  return isCircuitComplete(state.masks, state.size, state.source);
}

// --- Generation ----------------------------------------------------------------------------

/**
 * Random spanning tree grown from `start` (randomised Prim). With `maxDegree < 4`
 * growth can get stuck; then `null` is returned and the caller retries.
 */
export function randomSpanningTree(rng: Rng, size: number, start: number, maxDegree = 4): number[] | null {
  const total = size * size;
  const masks = new Array<number>(total).fill(0);
  const inTree = new Array<boolean>(total).fill(false);
  const frontier: [number, Direction][] = [];
  const addFrontier = (i: number) => {
    for (const d of DIRECTIONS) {
      const j = neighbor(i, size, d);
      if (j >= 0 && !inTree[j]) frontier.push([i, d]);
    }
  };
  inTree[start] = true;
  addFrontier(start);
  let count = 1;
  while (count < total) {
    if (frontier.length === 0) return null;
    const k = rng.int(0, frontier.length - 1);
    const [i, d] = frontier[k] as [number, Direction];
    const j = neighbor(i, size, d);
    frontier[k] = frontier[frontier.length - 1] as [number, Direction];
    frontier.pop();
    if (inTree[j] || degree(masks[i] as number) >= maxDegree) continue;
    masks[i] = (masks[i] as number) | d;
    masks[j] = (masks[j] as number) | opposite(d);
    inTree[j] = true;
    count++;
    addFrontier(j);
  }
  return masks;
}

export function sourceIndex(size: number): number {
  const mid = Math.floor(size / 2);
  return mid * size + mid;
}

export interface Puzzle {
  source: number;
  solution: number[];
  masks: number[];
}

export function generatePuzzle(seed: number, size: number): Puzzle {
  const rng = createRng(seed);
  const source = sourceIndex(size);
  let solution: number[] | null = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS && solution === null; attempt++) {
    solution = randomSpanningTree(rng, size, source, MAX_DEGREE);
  }
  // Uncapped growth always succeeds (a 4-way tile is allowed as a rare fallback).
  solution ??= randomSpanningTree(rng, size, source) as number[];
  const masks = solution.map((m) => rotateBy(m, rng.int(0, 3)));
  // Never hand out an already completed board: turn random tiles until it is broken.
  const turnable = solution.map((m, i) => (rotateCW(m) !== m ? i : -1)).filter((i) => i >= 0);
  while (turnable.length > 0 && isCircuitComplete(masks, size, source)) {
    const i = rng.pick(turnable);
    masks[i] = rotateCW(masks[i] as number);
  }
  return { source, solution, masks };
}

export function createInitialState(seed: number, difficulty: Difficulty = DEFAULT_DIFFICULTY): CircuitState {
  const size = SIZES[difficulty];
  const { source, solution, masks } = generatePuzzle(seed, size);
  return {
    seed: seed >>> 0,
    difficulty,
    size,
    source,
    solution,
    masks,
    locked: masks.map(() => false),
    moves: 0,
    history: []
  };
}

// --- Moves ---------------------------------------------------------------------------------

export function canRotate(state: CircuitState, index: number): boolean {
  return isInt(index, 0, state.masks.length - 1) && !state.locked[index] && !isSolved(state);
}

/** Rotates tile `index` a quarter turn (`clockwise` or not). Returns `state` unchanged when not allowed. */
export function rotateTile(state: CircuitState, index: number, clockwise = true): CircuitState {
  if (!canRotate(state, index)) return state;
  const masks = [...state.masks];
  masks[index] = clockwise ? rotateCW(masks[index] as number) : rotateCCW(masks[index] as number);
  const history = [...state.history, clockwise ? index + 1 : -(index + 1)];
  if (history.length > MAX_HISTORY) history.shift();
  return { ...state, masks, moves: Math.min(state.moves + 1, MAX_COUNTER), history };
}

export function canUndo(state: CircuitState): boolean {
  return state.history.length > 0 && !isSolved(state);
}

/** Takes back the last rotation (also on a tile locked since). */
export function undo(state: CircuitState): CircuitState {
  if (!canUndo(state)) return state;
  const history = state.history.slice(0, -1);
  const entry = state.history[state.history.length - 1] as number;
  const index = Math.abs(entry) - 1;
  const masks = [...state.masks];
  masks[index] = entry > 0 ? rotateCCW(masks[index] as number) : rotateCW(masks[index] as number);
  return { ...state, masks, moves: Math.max(0, state.moves - 1), history };
}

export function toggleLock(state: CircuitState, index: number): CircuitState {
  if (!isInt(index, 0, state.masks.length - 1) || isSolved(state)) return state;
  const locked = [...state.locked];
  locked[index] = !locked[index];
  return { ...state, locked };
}

// --- Validation ----------------------------------------------------------------------------

/** Structural validation of untrusted saves. Never throws. */
export function isCircuitState(value: unknown): value is CircuitState {
  try {
    if (!isRecord(value)) return false;
    const { seed, difficulty, size, source, solution, masks, locked, moves, history } = value;
    if (!isUint32(seed) || !isOneOf(difficulty, DIFFICULTIES)) return false;
    if (size !== SIZES[difficulty] || source !== sourceIndex(size)) return false;
    const total = size * size;
    const isMask = (m: unknown): m is number => isInt(m, 1, 15);
    if (!isArrayOf(solution, isMask, total) || !isArrayOf(masks, isMask, total)) return false;
    if (!masks.every((m, i) => isRotationOf(solution[i] as number, m))) return false;
    if (!isCircuitComplete(solution, size, source)) return false;
    if (!isArrayOf(locked, (b): b is boolean => typeof b === 'boolean', total)) return false;
    if (!isInt(moves, 0, MAX_COUNTER)) return false;
    if (!Array.isArray(history) || history.length > MAX_HISTORY || history.length > moves) return false;
    return history.every((h) => isInt(h, -total, total) && h !== 0);
  } catch {
    return false;
  }
}
