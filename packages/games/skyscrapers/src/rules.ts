import { createRng, isInt, isOneOf, isRecord, isUint32, type Rng } from '@wp/game-core';

/**
 * Pure, DOM-free rules for Skyscrapers (also known as "Towers").
 *
 * Fill an N×N grid with building heights 1..N so that every row and column holds each
 * height exactly once (a Latin square). A clue on the edge tells how many buildings are
 * visible from that side: a taller building hides every shorter one behind it.
 *
 * Generation (spec "Puzzle generation"): seeded random Latin square → all 4N clues →
 * clues removed greedily in random order while the constraint-propagation solver below
 * still deduces the whole grid without guessing. Sound deduction of a complete grid proves
 * that the solution is unique; the tests re-check uniqueness with an independent
 * brute-force oracle that shares no code with this file.
 *
 * The state stores the full puzzle (solution, clues, givens), so restoring a save never
 * depends on regenerating it.
 */

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

/** Grid edge length per difficulty. */
export const SIZES: Readonly<Record<Difficulty, number>> = { easy: 4, medium: 5, hard: 6 };

/** Extra digits revealed after clue removal, to make the smallest puzzles gentler. */
export const EXTRA_GIVENS: Readonly<Record<Difficulty, number>> = { easy: 2, medium: 0, hard: 0 };

/** Upper bound for counters in untrusted saves (far beyond any real game). */
export const MAX_COUNTER = 1_000_000;

export const SIDES = ['top', 'bottom', 'left', 'right'] as const;
export type Side = (typeof SIDES)[number];

/** Edge clues; `0` means "no clue". Index `i` is column `i` (top/bottom) or row `i` (left/right). */
export type Clues = Record<Side, number[]>;

export interface Puzzle {
  size: number;
  clues: Clues;
  /** Row-major given digits (`0` = not given). */
  givens: number[];
}

export interface CheckResult {
  /** Filled cells whose digit differs from the solution. */
  wrong: number;
  /** Player-filled cells whose digit repeats in their row or column. */
  repeated: number;
}

export interface SkyscrapersState {
  seed: number;
  difficulty: Difficulty;
  /** Edge length; always `SIZES[difficulty]`. */
  size: number;
  /** Row-major solution, a Latin square of 1..size. */
  solution: number[];
  clues: Clues;
  /** Row-major given digits (`0` = not given); given digits equal the solution. */
  givens: number[];
  /** Row-major entered heights (`0` = empty); given cells always hold their given digit. */
  cells: number[];
  /** Row-major pencil marks: bit `1 << d` set when candidate `d` is noted. */
  notes: number[];
  /** Whether number input adds notes instead of heights. */
  pencil: boolean;
  /** Number of effective cell changes (heights and notes). */
  moves: number;
  /** Number of times "Check" was used. */
  checks: number;
  /** Result of the last check, or `null` once the grid changed since. */
  lastCheck: CheckResult | null;
}

export function toDifficulty(value: unknown): Difficulty {
  return isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY;
}

// --- Lines and clues -------------------------------------------------------------------------

/** Number of buildings visible from the start of the line (each one taller than all before it). */
export function visibleCount(line: readonly number[]): number {
  let count = 0;
  let tallest = 0;
  for (const height of line) {
    if (height > tallest) {
      count++;
      tallest = height;
    }
  }
  return count;
}

/** Cell indices of line `k`: rows are lines 0..n-1, columns are lines n..2n-1, in reading order. */
export function lineCells(size: number, k: number): number[] {
  const cells: number[] = [];
  for (let j = 0; j < size; j++) cells.push(k < size ? k * size + j : j * size + (k - size));
  return cells;
}

/** Clues seen from the start / end of line `k` (left/right for rows, top/bottom for columns). */
export function lineClues(clues: Clues, size: number, k: number): [number, number] {
  return k < size ? [clues.left[k] as number, clues.right[k] as number] : [clues.top[k - size] as number, clues.bottom[k - size] as number];
}

/** All four clue rows for a complete grid. */
export function cluesOf(grid: readonly number[], size: number): Clues {
  const clues: Clues = { top: [], bottom: [], left: [], right: [] };
  for (let i = 0; i < size; i++) {
    const row = lineCells(size, i).map((c) => grid[c] as number);
    const col = lineCells(size, size + i).map((c) => grid[c] as number);
    clues.left.push(visibleCount(row));
    clues.right.push(visibleCount([...row].reverse()));
    clues.top.push(visibleCount(col));
    clues.bottom.push(visibleCount([...col].reverse()));
  }
  return clues;
}

/** True when every row and column of `grid` is a permutation of 1..size. */
export function isLatinSquare(grid: readonly number[], size: number): boolean {
  if (grid.length !== size * size) return false;
  for (let k = 0; k < 2 * size; k++) {
    let seen = 0;
    for (const c of lineCells(size, k)) {
      const v = grid[c] as number;
      if (!Number.isInteger(v) || v < 1 || v > size || seen & (1 << v)) return false;
      seen |= 1 << v;
    }
  }
  return true;
}

// --- Candidate sets ----------------------------------------------------------------------------

/** Bit mask of all heights 1..size (bit `d` stands for height `d`). */
export const fullMask = (size: number): number => (1 << (size + 1)) - 2;

export function bitCount(mask: number): number {
  let count = 0;
  for (let m = mask; m !== 0; m &= m - 1) count++;
  return count;
}

/** The heights contained in a mask, ascending. */
export function maskDigits(mask: number): number[] {
  const digits: number[] = [];
  for (let d = 1; 1 << d <= mask; d++) if (mask & (1 << d)) digits.push(d);
  return digits;
}

interface Arrangement {
  heights: number[];
  front: number;
  back: number;
}

const arrangementCache = new Map<number, Arrangement[]>();

/** Every permutation of 1..size with its visibility from both ends (cached per size). */
export function arrangements(size: number): readonly Arrangement[] {
  const cached = arrangementCache.get(size);
  if (cached) return cached;
  const result: Arrangement[] = [];
  const current: number[] = [];
  const build = (used: number) => {
    if (current.length === size) {
      const heights = [...current];
      result.push({ heights, front: visibleCount(heights), back: visibleCount([...heights].reverse()) });
      return;
    }
    for (let d = 1; d <= size; d++) {
      if (used & (1 << d)) continue;
      current.push(d);
      build(used | (1 << d));
      current.pop();
    }
  };
  build(0);
  arrangementCache.set(size, result);
  return result;
}

/**
 * Constraint propagation to a fixpoint. For every row and column it keeps exactly those
 * candidates that occur in at least one arrangement of the line that matches both clues and
 * the current candidates (exact single-line reasoning, which includes the Latin rule).
 * Never guesses, so each removed candidate is impossible in every solution.
 *
 * Returns the row-major candidate masks, or `null` when the puzzle is contradictory.
 */
export function propagate(puzzle: Puzzle, start?: readonly number[]): number[] | null {
  const { size, clues, givens } = puzzle;
  const lines = 2 * size;
  const all = arrangements(size);
  const cand = start ? [...start] : givens.map((g) => (g > 0 ? 1 << g : fullMask(size)));
  const dirty = new Array<boolean>(lines).fill(true);
  let pending = lines;
  while (pending > 0) {
    for (let k = 0; k < lines; k++) {
      if (!dirty[k]) continue;
      dirty[k] = false;
      pending--;
      const cells = lineCells(size, k);
      const [front, back] = lineClues(clues, size, k);
      const allowed = new Array<number>(size).fill(0);
      let any = false;
      for (const a of all) {
        if ((front !== 0 && a.front !== front) || (back !== 0 && a.back !== back)) continue;
        if (!a.heights.every((h, j) => (cand[cells[j] as number] as number) & (1 << h))) continue;
        any = true;
        a.heights.forEach((h, j) => (allowed[j] = (allowed[j] as number) | (1 << h)));
      }
      if (!any) return null;
      cells.forEach((cell, j) => {
        if (allowed[j] === cand[cell]) return;
        cand[cell] = allowed[j] as number;
        const cross = k < size ? size + j : j;
        if (!dirty[cross]) {
          dirty[cross] = true;
          pending++;
        }
      });
    }
  }
  return cand;
}

/** True when propagation alone fixes every cell (which also proves a unique solution). */
export function isLogicSolvable(puzzle: Puzzle): boolean {
  const cand = propagate(puzzle);
  return cand !== null && cand.every((m) => bitCount(m) === 1);
}

/** Counts solutions up to `limit` by propagation plus branching on the most constrained cell. */
export function countSolutions(puzzle: Puzzle, limit = 2): number {
  const search = (start: readonly number[] | undefined, wanted: number): number => {
    const cand = propagate(puzzle, start);
    if (!cand) return 0;
    let best = -1;
    for (let i = 0; i < cand.length; i++) {
      const bits = bitCount(cand[i] as number);
      if (bits > 1 && (best < 0 || bits < bitCount(cand[best] as number))) best = i;
    }
    if (best < 0) return 1;
    let found = 0;
    for (const d of maskDigits(cand[best] as number)) {
      const next = [...cand];
      next[best] = 1 << d;
      found += search(next, wanted - found);
      if (found >= wanted) return found;
    }
    return found;
  };
  return search(undefined, limit);
}

/** The single solution found by propagation, or `null` if the puzzle is not logic-solvable. */
export function solveByLogic(puzzle: Puzzle): number[] | null {
  const cand = propagate(puzzle);
  if (!cand || !cand.every((m) => bitCount(m) === 1)) return null;
  return cand.map((m) => (maskDigits(m)[0] as number));
}

// --- Generation --------------------------------------------------------------------------------

/** A random Latin square (randomised backtracking; deterministic for a given generator). */
export function randomLatinSquare(rng: Rng, size: number): number[] {
  const grid = new Array<number>(size * size).fill(0);
  const rowUsed = new Array<number>(size).fill(0);
  const colUsed = new Array<number>(size).fill(0);
  const fill = (i: number): boolean => {
    if (i === size * size) return true;
    const r = Math.floor(i / size);
    const c = i % size;
    const free = maskDigits(fullMask(size) & ~((rowUsed[r] as number) | (colUsed[c] as number)));
    for (const d of rng.shuffle(free)) {
      grid[i] = d;
      rowUsed[r] = (rowUsed[r] as number) | (1 << d);
      colUsed[c] = (colUsed[c] as number) | (1 << d);
      if (fill(i + 1)) return true;
      rowUsed[r] = (rowUsed[r] as number) & ~(1 << d);
      colUsed[c] = (colUsed[c] as number) & ~(1 << d);
    }
    grid[i] = 0;
    return false;
  };
  fill(0);
  return grid;
}

const copyClues = (clues: Clues): Clues => ({
  top: [...clues.top],
  bottom: [...clues.bottom],
  left: [...clues.left],
  right: [...clues.right]
});

export interface GeneratedPuzzle extends Puzzle {
  solution: number[];
}

/**
 * The seeded puzzle for a difficulty: a random solution, then given digits only where the
 * full clue set leaves cells open, then greedy random clue removal that keeps the puzzle
 * solvable by deduction alone, then (for easy) a few extra given digits.
 */
export function generatePuzzle(seed: number, difficulty: Difficulty): GeneratedPuzzle {
  const rng = createRng(seed);
  const size = SIZES[difficulty];
  const solution = randomLatinSquare(rng, size);
  const clues = cluesOf(solution, size);
  const givens = new Array<number>(size * size).fill(0);

  // Rare: the full clue set does not pin the grid down. Reveal open cells until it does.
  for (;;) {
    const cand = propagate({ size, clues, givens }) as number[];
    const open = [...cand.keys()].filter((i) => bitCount(cand[i] as number) > 1);
    if (open.length === 0) break;
    const cell = rng.pick(open);
    givens[cell] = solution[cell] as number;
  }

  let current = clues;
  for (const slot of rng.shuffle([...Array(4 * size).keys()])) {
    const trial = copyClues(current);
    (trial[SIDES[Math.floor(slot / size)] as Side] as number[])[slot % size] = 0;
    if (isLogicSolvable({ size, clues: trial, givens })) current = trial;
  }

  const hidden = [...givens.keys()].filter((i) => givens[i] === 0);
  for (const cell of rng.shuffle(hidden).slice(0, EXTRA_GIVENS[difficulty])) givens[cell] = solution[cell] as number;

  return { size, solution, clues: current, givens };
}

// --- Game state --------------------------------------------------------------------------------

export function createInitialState(seed: number, difficulty: Difficulty = DEFAULT_DIFFICULTY): SkyscrapersState {
  const s = seed >>> 0;
  const puzzle = generatePuzzle(s, difficulty);
  const size = puzzle.size;
  return {
    seed: s,
    difficulty,
    size,
    solution: puzzle.solution,
    clues: puzzle.clues,
    givens: puzzle.givens,
    cells: [...puzzle.givens],
    notes: new Array<number>(size * size).fill(0),
    pencil: false,
    moves: 0,
    checks: 0,
    lastCheck: null
  };
}

type Grid = Pick<SkyscrapersState, 'solution' | 'cells'>;

/** Solved when every cell holds its solution height. */
export function isSolved(state: Grid): boolean {
  return state.cells.every((v, i) => v === state.solution[i]);
}

/** Indices of filled cells whose height differs from the solution, ascending. */
export function wrongCells(state: Grid): number[] {
  const wrong: number[] = [];
  state.cells.forEach((v, i) => {
    if (v !== 0 && v !== state.solution[i]) wrong.push(i);
  });
  return wrong;
}

/** Indices of player-filled (non-given) cells whose height repeats in their row or column, ascending. */
export function repeatedCells(cells: readonly number[], givens: readonly number[], size: number): number[] {
  const marked = new Array<boolean>(cells.length).fill(false);
  for (let k = 0; k < 2 * size; k++) {
    const line = lineCells(size, k);
    for (const a of line) {
      const v = cells[a] as number;
      if (v !== 0 && givens[a] === 0 && line.some((b) => b !== a && cells[b] === v)) marked[a] = true;
    }
  }
  return [...marked.keys()].filter((i) => marked[i]);
}

/** Number of filled cells (givens included). */
export const filledCount = (cells: readonly number[]): number => cells.filter((v) => v !== 0).length;

/** Only open cells of an unsolved grid can change (out-of-range or fractional indices have no `givens` entry). */
const editable = (state: SkyscrapersState, index: number): boolean => state.givens[index] === 0 && !isSolved(state);

const withCell = (state: SkyscrapersState, index: number, value: number, notes: number): SkyscrapersState => {
  if (state.cells[index] === value && state.notes[index] === notes) return state;
  const cells = [...state.cells];
  const allNotes = [...state.notes];
  cells[index] = value;
  allNotes[index] = notes;
  return { ...state, cells, notes: allNotes, moves: state.moves + 1, lastCheck: null };
};

const isDigit = (state: SkyscrapersState, digit: number): boolean => Number.isInteger(digit) && digit >= 1 && digit <= state.size;

/** Puts a height into an editable cell (notes are kept and reappear when the height is cleared). */
export function setValue(state: SkyscrapersState, index: number, digit: number): SkyscrapersState {
  if (!editable(state, index) || !isDigit(state, digit)) return state;
  return withCell(state, index, digit, state.notes[index] as number);
}

/** Toggles a candidate note in an empty editable cell. */
export function toggleNote(state: SkyscrapersState, index: number, digit: number): SkyscrapersState {
  if (!editable(state, index) || !isDigit(state, digit) || state.cells[index] !== 0) return state;
  return withCell(state, index, 0, (state.notes[index] as number) ^ (1 << digit));
}

/** Number input: a height in normal mode, a note in pencil mode. */
export function enterDigit(state: SkyscrapersState, index: number, digit: number): SkyscrapersState {
  return state.pencil ? toggleNote(state, index, digit) : setValue(state, index, digit);
}

/** Clears the height of a cell, or its notes when it has no height. */
export function clearCell(state: SkyscrapersState, index: number): SkyscrapersState {
  if (!editable(state, index)) return state;
  return state.cells[index] !== 0 ? withCell(state, index, 0, state.notes[index] as number) : withCell(state, index, 0, 0);
}

export function setPencil(state: SkyscrapersState, pencil: boolean): SkyscrapersState {
  return state.pencil === pencil ? state : { ...state, pencil };
}

/** Counts wrong and repeated heights without revealing the solution. */
export function check(state: SkyscrapersState): SkyscrapersState {
  if (isSolved(state)) return state;
  return {
    ...state,
    checks: state.checks + 1,
    lastCheck: { wrong: wrongCells(state).length, repeated: repeatedCells(state.cells, state.givens, state.size).length }
  };
}

/** Cells marked as repeated: only directly after a check, until the grid changes. */
export const markedCells = (state: SkyscrapersState): number[] =>
  state.lastCheck === null ? [] : repeatedCells(state.cells, state.givens, state.size);

// --- Validation --------------------------------------------------------------------------------

const isCounter = (value: unknown): value is number => isInt(value, 0, MAX_COUNTER);

const isGrid = (value: unknown, length: number, max: number): value is number[] =>
  Array.isArray(value) && value.length === length && value.every((v) => isInt(v, 0, max));

function isClues(value: unknown, grid: readonly number[], size: number): value is Clues {
  if (!isRecord(value)) return false;
  const full = cluesOf(grid, size);
  return SIDES.every((side) => {
    const list = value[side];
    return Array.isArray(list) && list.length === size && list.every((v, i) => v === 0 || v === full[side][i]);
  });
}

function isCheckResult(value: unknown, total: number): value is CheckResult {
  return value === null || (isRecord(value) && isInt(value.wrong, 0, total) && isInt(value.repeated, 0, total));
}

/** Structural validation of untrusted saves. Never throws. */
export function isSkyscrapersState(value: unknown): value is SkyscrapersState {
  try {
    if (!isRecord(value)) return false;
    const v = value;
    if (!isUint32(v.seed) || !isOneOf(v.difficulty, DIFFICULTIES)) return false;
    const size = SIZES[v.difficulty];
    const total = size * size;
    if (v.size !== size) return false;
    if (!isGrid(v.solution, total, size) || !isLatinSquare(v.solution, size)) return false;
    const solution = v.solution;
    if (!isClues(v.clues, solution, size)) return false;
    if (!isGrid(v.givens, total, size) || !v.givens.every((g, i) => g === 0 || g === solution[i])) return false;
    const givens = v.givens;
    if (!isGrid(v.cells, total, size) || !v.cells.every((c, i) => givens[i] === 0 || c === givens[i])) return false;
    if (!isGrid(v.notes, total, fullMask(size)) || !v.notes.every((m) => (m & 1) === 0)) return false;
    if (typeof v.pencil !== 'boolean') return false;
    if (!isCounter(v.moves) || !isCounter(v.checks)) return false;
    return isCheckResult(v.lastCheck, total);
  } catch {
    return false;
  }
}
