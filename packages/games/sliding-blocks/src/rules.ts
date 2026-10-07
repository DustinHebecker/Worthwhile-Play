/**
 * Unblock (sliding block puzzle) rules: pure, DOM-free logic and the serializable state.
 *
 * The board is a 6 × 6 grid. Every block is a straight piece of length 2 or 3 lying either
 * horizontally (`h`, slides left/right) or vertically (`v`, slides up/down). Block 0 is the
 * star block: horizontal, length 2. The puzzle is solved when the star block reaches the exit
 * on the right edge of its row, i.e. when its right end is in the last column.
 *
 * One move = sliding one block any distance along its axis through free cells. This is also
 * the unit of the stored optimum (the fewest moves found by breadth-first search).
 *
 * The saved state holds the puzzle itself (initial layout + optimum) and the action history;
 * the current position is always derived by replaying the history. History entries:
 *   - `"<id>:<delta>"`: block `id` slid by `delta` cells (positive = right/down). Consecutive
 *     slides of the same block are merged into one entry (one move), and an entry whose
 *     merged delta is 0 disappears — so the move counter matches the optimum's definition;
 *   - `"*"`: restart. Restarting is recorded, so Undo right after a restart brings the
 *     previous attempt back.
 */
import { isArrayOf, isInt, isOneOf, isRecord, isUint32, normalizeSeed } from '@wp/game-core';
import { PUZZLES } from './puzzles';

export const SIZE = 6;
export const CELLS = SIZE * SIZE;
/** Column the star block's left end occupies when it reaches the exit. */
export const EXIT_COL = SIZE - 2;
/** Most blocks a valid layout can hold (18 × 2 cells = 36). */
export const MAX_BLOCKS = 18;
/** Largest optimum a saved puzzle may claim (the hardest 6 × 6 layouts need about 50 moves). */
export const MAX_OPTIMUM = 200;
/** Upper bound on the number of history entries — keeps untrusted saves small. */
export const MAX_HISTORY = 5_000;
export const RESTART = '*';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

/** Accepted optimum (fewest moves) per difficulty, both ends inclusive. */
export const BANDS: Readonly<Record<Difficulty, readonly [number, number]>> = {
  easy: [4, 10],
  medium: [11, 20],
  hard: [21, MAX_OPTIMUM]
};

export const ORIENTATIONS = ['h', 'v'] as const;
export type Orientation = (typeof ORIENTATIONS)[number];

export interface Block {
  /** Top-left cell of the block in the starting layout (0-based). */
  row: number;
  col: number;
  len: number;
  orient: Orientation;
}

export interface Puzzle {
  /** `blocks[0]` is the star block. */
  blocks: Block[];
  /** Fewest moves that solve the puzzle. */
  optimum: number;
}

/** Offset of every block along its own axis: the column of a horizontal block, the row of a vertical one. */
export type Positions = number[];

export interface Move {
  id: number;
  delta: number;
}

export interface Progress {
  positions: Positions;
  /** Moves since the last restart. */
  moves: number;
  solved: boolean;
}

export interface SlidingBlocksState {
  seed: number;
  difficulty: Difficulty;
  puzzle: Puzzle;
  history: string[];
}

export class LayoutError extends Error {
  override name = 'LayoutError';
}

export const toDifficulty = (value: unknown): Difficulty => (isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY);

/* ---------- Geometry ---------- */

export const startPositions = (blocks: readonly Block[]): Positions => blocks.map((b) => (b.orient === 'h' ? b.col : b.row));

/** Top-left cell of `block` when it sits at offset `pos`. */
export const placeAt = (block: Block, pos: number): { row: number; col: number } =>
  block.orient === 'h' ? { row: block.row, col: pos } : { row: pos, col: block.col };

/** Cell indices (row * 6 + col) covered by `block` at offset `pos`. */
export function cellsOf(block: Block, pos: number): number[] {
  const { row, col } = placeAt(block, pos);
  const step = block.orient === 'h' ? 1 : SIZE;
  const start = row * SIZE + col;
  return Array.from({ length: block.len }, (_, i) => start + i * step);
}

/** Block id per cell, -1 for free cells. */
export function occupancy(blocks: readonly Block[], positions: Positions): number[] {
  const grid = new Array<number>(CELLS).fill(-1);
  blocks.forEach((block, id) => {
    for (const cell of cellsOf(block, positions[id] as number)) grid[cell] = id;
  });
  return grid;
}

/** Cell index of the free square at offset `pos` on the block's line. */
const lineCell = (block: Block, pos: number) => (block.orient === 'h' ? block.row * SIZE + pos : pos * SIZE + block.col);

/** How far block `id` can slide: `min` ≤ 0 ≤ `max` cells along its axis. */
export function slideRange(blocks: readonly Block[], positions: Positions, id: number, grid = occupancy(blocks, positions)): { min: number; max: number } {
  const block = blocks[id] as Block;
  const pos = positions[id] as number;
  let min = 0;
  while (pos + min - 1 >= 0 && grid[lineCell(block, pos + min - 1)] === -1) min--;
  let max = 0;
  while (pos + block.len + max < SIZE && grid[lineCell(block, pos + block.len + max)] === -1) max++;
  return { min, max };
}

/** Positions after sliding block `id` by `delta`, or `null` if the slide is not a legal move. */
export function slide(blocks: readonly Block[], positions: Positions, id: number, delta: number): Positions | null {
  if (!isInt(id, 0, blocks.length - 1) || !isInt(delta) || delta === 0) return null;
  const { min, max } = slideRange(blocks, positions, id);
  if (delta < min || delta > max) return null;
  const next = [...positions];
  next[id] = (positions[id] as number) + delta;
  return next;
}

/** Every legal move from `positions`, ordered by block id, then delta ascending. */
export function legalMoves(blocks: readonly Block[], positions: Positions): Move[] {
  const grid = occupancy(blocks, positions);
  const moves: Move[] = [];
  for (let id = 0; id < blocks.length; id++) {
    const { min, max } = slideRange(blocks, positions, id, grid);
    for (let delta = min; delta <= max; delta++) if (delta !== 0) moves.push({ id, delta });
  }
  return moves;
}

export const isSolvedAt = (positions: Positions): boolean => positions[0] === EXIT_COL;

/* ---------- Solver ---------- */

const keyOf = (positions: Positions) => String.fromCharCode(...positions.map((p) => 48 + p));

/**
 * Breadth-first search for a shortest solution (one move = one block slid any distance).
 * Returns the moves, `[]` when already solved, or `null` when unsolvable (or when more than
 * `limit` positions would have to be explored).
 */
export function findSolution(blocks: readonly Block[], limit = 1_000_000): Move[] | null {
  const start = startPositions(blocks);
  if (isSolvedAt(start)) return [];
  const parent = new Map<string, { from: string; move: Move } | null>([[keyOf(start), null]]);
  const queue: Positions[] = [start];
  for (let head = 0; head < queue.length; head++) {
    const positions = queue[head] as Positions;
    const key = keyOf(positions);
    for (const move of legalMoves(blocks, positions)) {
      const next = [...positions];
      next[move.id] = (next[move.id] as number) + move.delta;
      const nextKey = keyOf(next);
      if (parent.has(nextKey)) continue;
      parent.set(nextKey, { from: key, move });
      if (isSolvedAt(next)) {
        const path: Move[] = [];
        for (let at = parent.get(nextKey); at; at = parent.get(at.from)) path.unshift(at.move);
        return path;
      }
      if (parent.size > limit) return null;
      queue.push(next);
    }
  }
  return null;
}

/** Fewest moves that solve the layout, or `null` when it cannot be solved. */
export function solve(blocks: readonly Block[], limit?: number): number | null {
  return findSolution(blocks, limit)?.length ?? null;
}

/* ---------- Layout text format ---------- */

/** Letters for blocks 1… in layout strings; the star block is `x`, free cells are `.`. */
const LETTERS = 'abcdefghijklmnopqr';

/**
 * Parses a 36-character row-major layout. Block ids follow the first appearance of their
 * letter (star block first). Throws `LayoutError` with the reason for malformed layouts.
 */
export function parseLayout(text: string): Block[] {
  if (text.length !== CELLS) throw new LayoutError(`layout must have ${CELLS} cells, got ${text.length}`);
  const cells = new Map<string, number[]>();
  for (let i = 0; i < CELLS; i++) {
    const ch = text.charAt(i);
    if (ch === '.') continue;
    if (ch !== 'x' && !LETTERS.includes(ch)) throw new LayoutError(`unknown character "${ch}" at cell ${i}`);
    cells.set(ch, [...(cells.get(ch) ?? []), i]);
  }
  if (!cells.has('x')) throw new LayoutError('layout has no star block');
  const blocks: Block[] = [];
  const order = ['x', ...[...cells.keys()].filter((ch) => ch !== 'x')];
  for (const ch of order) {
    const list = cells.get(ch) as number[];
    const first = list[0] as number;
    const row = Math.floor(first / SIZE);
    const col = first % SIZE;
    const len = list.length;
    const horizontal = list.every((cell, i) => cell === first + i);
    const vertical = list.every((cell, i) => cell === first + i * SIZE);
    if (len < 2 || len > 3 || !(horizontal || vertical) || (horizontal && col + len > SIZE)) {
      throw new LayoutError(`block "${ch}" is not a straight piece of length 2 or 3`);
    }
    blocks.push({ row, col, len, orient: horizontal ? 'h' : 'v' });
  }
  const problem = layoutProblem(blocks);
  if (problem) throw new LayoutError(problem);
  return blocks;
}

/** Inverse of `parseLayout` for the given positions (default: the starting layout). */
export function layoutString(blocks: readonly Block[], positions: Positions = startPositions(blocks)): string {
  const grid = occupancy(blocks, positions);
  return grid.map((id) => (id < 0 ? '.' : id === 0 ? 'x' : (LETTERS[id - 1] as string))).join('');
}

/** The layout upside down (rows reversed). The exit stays on the right edge of the star block's row. */
export function mirrorLayout(text: string): string {
  return Array.from({ length: SIZE }, (_, i) => text.slice((SIZE - 1 - i) * SIZE, (SIZE - i) * SIZE)).join('');
}

/* ---------- Validation ---------- */

const isOrientation = (value: unknown): value is Orientation => isOneOf(value, ORIENTATIONS);

function isBlock(value: unknown): value is Block {
  if (!isRecord(value)) return false;
  const { row, col, len, orient } = value;
  if (!isInt(row, 0, SIZE - 1) || !isInt(col, 0, SIZE - 1) || !isInt(len, 2, 3) || !isOrientation(orient)) return false;
  return (orient === 'h' ? col : row) + len <= SIZE;
}

/**
 * Why a structurally valid block list is not a playable layout (`null` when it is):
 * overlapping blocks, a wrong or already-freed star block, or a horizontal block to the right
 * of the star block in its row (which could never be passed).
 */
export function layoutProblem(blocks: readonly Block[]): string | null {
  if (blocks.length < 1 || blocks.length > MAX_BLOCKS) return `a layout has 1 to ${MAX_BLOCKS} blocks`;
  const target = blocks[0] as Block;
  if (target.orient !== 'h' || target.len !== 2) return 'the star block must be horizontal with length 2';
  if (target.col === EXIT_COL) return 'the star block is already at the exit';
  const seen = new Set<number>();
  for (const block of blocks) {
    for (const cell of cellsOf(block, block.orient === 'h' ? block.col : block.row)) {
      if (seen.has(cell)) return 'blocks overlap';
      seen.add(cell);
    }
  }
  if (blocks.some((b, id) => id > 0 && b.orient === 'h' && b.row === target.row && b.col > target.col)) {
    return 'a horizontal block blocks the exit row for good';
  }
  return null;
}

export const isLayout = (value: unknown): value is Block[] => isArrayOf(value, isBlock) && layoutProblem(value) === null;

/* ---------- History ---------- */

const ENTRY = /^(\d{1,2}):(-?[1-5])$/;

/** Parses a move entry; `null` for a restart marker or anything malformed. */
export function parseEntry(entry: string): Move | null {
  const match = ENTRY.exec(entry);
  return match ? { id: Number(match[1]), delta: Number(match[2]) } : null;
}

export const entryOf = ({ id, delta }: Move): string => `${id}:${delta}`;

/**
 * Replays a history from the puzzle start. Returns `null` if the history is not one the rules
 * produce: an illegal slide, two consecutive entries for the same block (they are always
 * merged), anything after solving, or a restart with nothing to restart.
 */
export function replay(blocks: readonly Block[], history: readonly string[]): Progress | null {
  let positions = startPositions(blocks);
  let moves = 0;
  let solved = false;
  let previous = -1;
  for (const entry of history) {
    if (solved) return null;
    if (entry === RESTART) {
      if (moves === 0) return null;
      positions = startPositions(blocks);
      moves = 0;
      previous = -1;
      continue;
    }
    const move = parseEntry(entry);
    if (!move || move.id === previous) return null;
    const next = slide(blocks, positions, move.id, move.delta);
    if (!next) return null;
    positions = next;
    moves++;
    previous = move.id;
    solved = isSolvedAt(positions);
  }
  return { positions, moves, solved };
}

/* ---------- Game state ---------- */

export const puzzleCount = (difficulty: Difficulty): number => PUZZLES[difficulty].length;

/**
 * The seed picks a puzzle of the difficulty's shipped list and whether it is shown upside
 * down, so each list offers twice as many distinct boards (same optimum either way).
 */
export function puzzleFor(seed: number, difficulty: Difficulty): Puzzle {
  const list = PUZZLES[difficulty];
  const normalized = normalizeSeed(seed);
  const source = list[normalized % list.length] as { layout: string; optimum: number };
  const flipped = Math.floor(normalized / list.length) % 2 === 1;
  return { blocks: parseLayout(flipped ? mirrorLayout(source.layout) : source.layout), optimum: source.optimum };
}

export function createInitialState(seed: number, difficulty: Difficulty = DEFAULT_DIFFICULTY): SlidingBlocksState {
  const normalized = normalizeSeed(seed);
  return { seed: normalized, difficulty, puzzle: puzzleFor(normalized, difficulty), history: [] };
}

/** The seeded starting state again (same puzzle, empty history). */
export const resetState = (state: SlidingBlocksState): SlidingBlocksState => ({
  seed: state.seed,
  difficulty: state.difficulty,
  puzzle: { blocks: state.puzzle.blocks.map((b) => ({ ...b })), optimum: state.puzzle.optimum },
  history: []
});

/** Current progress of a valid state. Throws if the history cannot be replayed. */
export function progressOf(state: SlidingBlocksState): Progress {
  const progress = replay(state.puzzle.blocks, state.history);
  if (!progress) throw new Error('Invalid history');
  return progress;
}

/**
 * Appends an entry. If the history would exceed `limit` entries, the oldest attempts (up to and
 * including the earliest restart) are dropped; without a restart to drop, the entry is refused
 * and the same state is returned.
 */
export function appendEntry(state: SlidingBlocksState, entry: string, limit = MAX_HISTORY): SlidingBlocksState {
  const history = [...state.history, entry];
  while (history.length > limit) {
    const cut = history.indexOf(RESTART);
    if (cut < 0) return state;
    history.splice(0, cut + 1);
  }
  return { ...state, history };
}

/**
 * Slides block `id` by `delta`. A slide of the same block as the previous move extends that
 * move (and cancels it when the block is back where it started). Same object when illegal
 * or when the puzzle is solved.
 */
export function move(state: SlidingBlocksState, id: number, delta: number): SlidingBlocksState {
  const progress = progressOf(state);
  if (progress.solved || !slide(state.puzzle.blocks, progress.positions, id, delta)) return state;
  const last = parseEntry(state.history[state.history.length - 1] ?? '');
  if (last && last.id === id) {
    const merged = last.delta + delta;
    const history = state.history.slice(0, -1);
    return { ...state, history: merged === 0 ? history : [...history, entryOf({ id, delta: merged })] };
  }
  return appendEntry(state, entryOf({ id, delta }));
}

/**
 * Tap on a cell while block `id` is selected: the slide the block so that it reaches that cell
 * (its near end for cells behind it, its far end for cells ahead). `null` when the cell is not
 * on the block's line or is covered by the block itself; otherwise the slide (possibly illegal).
 */
export function deltaToCell(blocks: readonly Block[], positions: Positions, id: number, row: number, col: number): number | null {
  const block = blocks[id];
  if (!block) return null;
  const line = block.orient === 'h' ? row === block.row : col === block.col;
  if (!line) return null;
  const target = block.orient === 'h' ? col : row;
  const pos = positions[id] as number;
  if (target < pos) return target - pos;
  if (target >= pos + block.len) return target - (pos + block.len - 1);
  return null;
}

export const canUndo = (state: SlidingBlocksState): boolean => state.history.length > 0 && !progressOf(state).solved;

/** Takes back the last entry (a move or a restart). Same object if nothing to undo or solved. */
export function undo(state: SlidingBlocksState): SlidingBlocksState {
  return canUndo(state) ? { ...state, history: state.history.slice(0, -1) } : state;
}

export function canRestart(state: SlidingBlocksState): boolean {
  const progress = progressOf(state);
  return progress.moves > 0 && !progress.solved;
}

/** Back to the puzzle start; recorded in the history so it can be undone. */
export function restart(state: SlidingBlocksState): SlidingBlocksState {
  return canRestart(state) ? appendEntry(state, RESTART) : state;
}

/** Structural and cross-field validation of untrusted saved data. Never throws. */
export function isSlidingBlocksState(value: unknown): value is SlidingBlocksState {
  try {
    if (!isRecord(value)) return false;
    const { seed, difficulty, puzzle, history } = value;
    if (!isUint32(seed) || !isOneOf(difficulty, DIFFICULTIES) || !isRecord(puzzle)) return false;
    if (!isInt(puzzle.optimum, 1, MAX_OPTIMUM) || !isLayout(puzzle.blocks)) return false;
    if (!Array.isArray(history) || history.length > MAX_HISTORY) return false;
    if (!history.every((entry): entry is string => typeof entry === 'string')) return false;
    return replay(puzzle.blocks, history) !== null;
  } catch {
    return false;
  }
}
