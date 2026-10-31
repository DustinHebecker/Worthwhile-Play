import { createRng, isInt, isOneOf, isRecord, isUint32 } from '@wp/game-core';

/**
 * Pure, DOM-free rules for Nonogram (picture-logic puzzle).
 *
 * Pipeline (spec "Puzzle generation"): seeded random picture → clues → line solver
 * (independent of the generator's picture) → accept only when line logic alone fills
 * the whole grid. A complete line-logic solution is sound deduction, so it also
 * proves uniqueness; the tests re-check uniqueness with a separate brute-force oracle.
 *
 * The state records the solution picture itself, so restoring a save never depends
 * on regenerating the puzzle.
 */

export const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

/** Board edge length per difficulty (square boards). */
export const SIZES: Readonly<Record<Difficulty, number>> = { easy: 5, medium: 8, hard: 10, expert: 15 };

/** Fill density range of generated pictures (inclusive fractions of all cells) for easy to hard. */
export const MIN_DENSITY = 0.5;
export const MAX_DENSITY = 0.6;

/**
 * Expert boards use a sparser picture: fewer filled cells mean more, shorter blocks per line
 * and longer chains of deductions (measured: ~4 clue numbers per line instead of ~2.8).
 */
export const EXPERT_MIN_DENSITY = 0.45;
export const EXPERT_MAX_DENSITY = 0.55;

/** Density range per difficulty. */
export const DENSITIES: Readonly<Record<Difficulty, readonly [number, number]>> = {
  easy: [MIN_DENSITY, MAX_DENSITY],
  medium: [MIN_DENSITY, MAX_DENSITY],
  hard: [MIN_DENSITY, MAX_DENSITY],
  expert: [EXPERT_MIN_DENSITY, EXPERT_MAX_DENSITY]
};

/**
 * Minimum number of solver rounds (see `solveRounds`) a puzzle must need. Hard 10×10 puzzles
 * need ~3.4 rounds on average; expert puzzles need at least 7, so the player has to carry
 * deductions back and forth between rows and columns many times. 0 = no requirement.
 */
export const MIN_ROUNDS: Readonly<Record<Difficulty, number>> = { easy: 0, medium: 0, hard: 0, expert: 7 };

/** Random candidates tried before the deterministic repair fallback is used (easy to hard). */
export const MAX_ATTEMPTS = 400;

/**
 * Candidate cap for expert puzzles. About one candidate in ten qualifies (line-solvable and at
 * least `MIN_ROUNDS.expert` rounds), so the cap is practically never reached; it bounds the
 * worst-case generation time on slow phones. Each candidate costs well under 1 ms on a desktop.
 */
export const EXPERT_MAX_ATTEMPTS = 300;

/** Upper bound for counters in untrusted saves (far beyond any real game). */
export const MAX_COUNTER = 1_000_000;

/** Player cell marks. */
export const UNKNOWN = 0;
export const FILLED = 1;
export const CROSSED = 2;
export type Mark = typeof UNKNOWN | typeof FILLED | typeof CROSSED;

/** Line-solver knowledge for one cell: -1 unknown, 0 empty, 1 filled. */
export type Knowledge = -1 | 0 | 1;

export type Mode = 'fill' | 'cross';
export const MODES: readonly Mode[] = ['fill', 'cross'];

export type CellAction = 'toggleFill' | 'toggleCross' | 'fill' | 'cross' | 'clear';

export interface NonogramState {
  seed: number;
  difficulty: Difficulty;
  /** Edge length; always `SIZES[difficulty]`. */
  size: number;
  /** Row-major target picture: 1 filled, 0 empty. Length `size * size`. */
  solution: number[];
  /** Row-major player marks (`UNKNOWN`, `FILLED`, `CROSSED`). */
  cells: number[];
  /** What a plain tap/click does. */
  mode: Mode;
  /** Number of cell changes made. */
  moves: number;
  /** Number of times "Check" was used. */
  checks: number;
  /** Number of times a cell was filled that is empty in the solution. */
  mistakes: number;
  /** Wrongly filled cells reported by the last check, or `null` when the board changed since. */
  lastCheck: number | null;
  /** Cells currently marked as wrong (after "Show mistakes"), ascending. */
  marked: number[];
}

export interface Clues {
  rows: number[][];
  cols: number[][];
}

export function toDifficulty(value: unknown): Difficulty {
  return isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY;
}

// --- Clues ---------------------------------------------------------------------------------

/** Lengths of consecutive filled runs in a line (`1` = filled); `[]` for an empty line. */
export function lineClue(line: readonly number[]): number[] {
  const runs: number[] = [];
  let run = 0;
  for (const value of line) {
    if (value === 1) run++;
    else if (run > 0) {
      runs.push(run);
      run = 0;
    }
  }
  if (run > 0) runs.push(run);
  return runs;
}

export function rowOf<T>(grid: readonly T[], size: number, r: number): T[] {
  return grid.slice(r * size, r * size + size);
}

export function colOf<T>(grid: readonly T[], size: number, c: number): T[] {
  const col: T[] = [];
  for (let r = 0; r < size; r++) col.push(grid[r * size + c] as T);
  return col;
}

export function cluesOf(solution: readonly number[], size: number): Clues {
  const rows: number[][] = [];
  const cols: number[][] = [];
  for (let i = 0; i < size; i++) {
    rows.push(lineClue(rowOf(solution, size, i)));
    cols.push(lineClue(colOf(solution, size, i)));
  }
  return { rows, cols };
}

const sameRuns = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((v, i) => v === b[i]);

/** True when the player's filled cells in a line form exactly the clue's runs (crosses are irrelevant). */
export function lineSatisfied(clue: readonly number[], marks: readonly number[]): boolean {
  return sameRuns(lineClue(marks.map((m) => (m === FILLED ? 1 : 0))), clue);
}

// --- Line solver ---------------------------------------------------------------------------

/**
 * Exact single-line deduction: returns the line with every cell fixed that has the same
 * value in *all* placements of `clue` consistent with `line`, or `null` if no placement fits.
 * Dynamic programming over (position, next block); O(n² · k).
 */
export function solveLine(clue: readonly number[], line: readonly Knowledge[]): Knowledge[] | null {
  const n = line.length;
  const k = clue.length;
  const canFill = new Array<boolean>(n).fill(false);
  const canEmpty = new Array<boolean>(n).fill(false);
  // memo[pos * (k + 1) + b]: 0 = not computed, 1 = feasible, 2 = infeasible.
  const memo = new Uint8Array((n + 2) * (k + 1));

  // Can blocks b..k-1 be placed in cells pos..n-1 (cell pos-1 is empty or the border)?
  const fits = (pos: number, b: number): boolean => {
    const key = pos * (k + 1) + b;
    const known = memo[key];
    if (known !== 0) return known === 1;
    let ok = false;
    if (b === k) {
      ok = true;
      for (let i = pos; i < n; i++) if (line[i] === 1) ok = false;
      if (ok) for (let i = pos; i < n; i++) canEmpty[i] = true;
    } else {
      // Option 1: cell `pos` stays empty.
      if (pos < n && line[pos] !== 1 && fits(pos + 1, b)) {
        canEmpty[pos] = true;
        ok = true;
      }
      // Option 2: block b starts at `pos`.
      const len = clue[b] as number;
      const end = pos + len;
      if (end <= n && (end === n || line[end] !== 1)) {
        let free = true;
        for (let i = pos; i < end; i++) if (line[i] === 0) free = false;
        if (free && fits(end === n ? n : end + 1, b + 1)) {
          for (let i = pos; i < end; i++) canFill[i] = true;
          if (end < n) canEmpty[end] = true;
          ok = true;
        }
      }
    }
    memo[key] = ok ? 1 : 2;
    return ok;
  };

  if (!fits(0, 0)) return null;
  return line.map((value, i): Knowledge => {
    if (canFill[i] && !canEmpty[i]) return 1;
    if (canEmpty[i] && !canFill[i]) return 0;
    return value;
  });
}

export interface SolveResult {
  /** Row-major knowledge after reaching the fixpoint (or the point of contradiction). */
  grid: Knowledge[];
  /** Every cell determined. */
  solved: boolean;
  /** Some line had no consistent placement. */
  contradiction: boolean;
}

/**
 * Repeats `solveLine` on all rows and columns until nothing changes. Never guesses, so
 * every fixed cell is forced by the clues (and the optional starting knowledge).
 */
export function solveByLines(clues: Clues, start?: readonly Knowledge[]): SolveResult {
  const size = clues.rows.length;
  const grid: Knowledge[] = start ? [...start] : new Array<Knowledge>(size * size).fill(-1);
  // Lines to (re)visit: 0..size-1 rows, size..2size-1 columns.
  const dirty = new Array<boolean>(2 * size).fill(true);
  let pending = 2 * size;
  while (pending > 0) {
    for (let line = 0; line < 2 * size && pending > 0; line++) {
      if (!dirty[line]) continue;
      dirty[line] = false;
      pending--;
      const isRow = line < size;
      const index = isRow ? line : line - size;
      const cells = isRow ? rowOf(grid, size, index) : colOf(grid, size, index);
      const solved = solveLine(isRow ? (clues.rows[index] as number[]) : (clues.cols[index] as number[]), cells);
      if (!solved) return { grid, solved: false, contradiction: true };
      for (let j = 0; j < size; j++) {
        if (solved[j] === cells[j]) continue;
        const at = isRow ? index * size + j : j * size + index;
        grid[at] = solved[j] as Knowledge;
        const cross = isRow ? size + j : j;
        if (!dirty[cross]) {
          dirty[cross] = true;
          pending++;
        }
      }
    }
  }
  return { grid, solved: grid.every((v) => v !== -1), contradiction: false };
}

export interface RoundsResult extends SolveResult {
  /** Number of full sweeps (all rows, then all columns) that changed at least one cell. */
  rounds: number;
}

/**
 * Difficulty metric: solves like a person working in sweeps — every row, then every column,
 * repeated until nothing changes — and counts the sweeps that made progress. More rounds mean
 * longer chains of deductions where one line only opens up after others were worked out.
 */
export function solveRounds(clues: Clues): RoundsResult {
  const size = clues.rows.length;
  const grid = new Array<Knowledge>(size * size).fill(-1);
  let rounds = 0;
  for (;;) {
    let changed = false;
    for (let line = 0; line < 2 * size; line++) {
      const isRow = line < size;
      const index = isRow ? line : line - size;
      const cells = isRow ? rowOf(grid, size, index) : colOf(grid, size, index);
      const solved = solveLine(isRow ? (clues.rows[index] as number[]) : (clues.cols[index] as number[]), cells);
      if (!solved) return { grid, solved: false, contradiction: true, rounds };
      for (let j = 0; j < size; j++) {
        if (solved[j] === cells[j]) continue;
        grid[isRow ? index * size + j : j * size + index] = solved[j] as Knowledge;
        changed = true;
      }
    }
    if (!changed) return { grid, solved: grid.every((v) => v !== -1), contradiction: false, rounds };
    rounds++;
  }
}

/** True when line logic alone determines the full picture for these clues. */
export function isLineSolvable(solution: readonly number[], size: number): boolean {
  const result = solveByLines(cluesOf(solution, size));
  return result.solved && result.grid.every((v, i) => v === solution[i]);
}

// --- Generation ----------------------------------------------------------------------------

/** Deterministic per-attempt seed derivation (FNV-style mix of seed and attempt number). */
export function attemptSeed(seed: number, attempt: number): number {
  // Avalanche the seed fully before mixing in the attempt, so that neighbouring seeds never share
  // retry sequences (the former xor-based mix mapped (s, a) and (s ^ 1, a ^ 1) to the same value).
  const fmix = (x: number): number => {
    let h = x >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
    return (h ^ (h >>> 16)) >>> 0;
  };
  return fmix((fmix(seed ^ 0x9e3779b9) + Math.imul(attempt + 1, 0x27d4eb2f)) >>> 0);
}

/** Random picture with a fill count between `minDensity` and `maxDensity` of all cells. */
export function randomPicture(seed: number, size: number, minDensity = MIN_DENSITY, maxDensity = MAX_DENSITY): number[] {
  const rng = createRng(seed);
  const total = size * size;
  const count = rng.int(Math.ceil(total * minDensity), Math.floor(total * maxDensity));
  const picture = new Array<number>(total).fill(0);
  for (const i of rng.shuffle([...picture.keys()]).slice(0, count)) picture[i] = 1;
  return picture;
}

/**
 * Makes a picture line-solvable by filling the first undetermined cell until the line
 * solver completes it. Terminates because a fully filled grid is trivially solvable.
 * Used only if every random attempt fails (practically never).
 */
export function repairPicture(picture: readonly number[], size: number): number[] {
  const result = [...picture];
  for (;;) {
    const solved = solveByLines(cluesOf(result, size));
    if (solved.solved) return result;
    const open = solved.grid.findIndex((v, i) => v === -1 && result[i] === 0);
    // An undetermined cell that is empty in the picture always exists while unsolved;
    // fall back to the first empty cell defensively.
    result[open >= 0 ? open : result.indexOf(0)] = 1;
  }
}

/**
 * Seeded puzzle that must need at least `minRounds` solver rounds: the first line-solvable
 * candidate that does is used. Bounded by `maxAttempts`; if no candidate qualifies, the
 * line-solvable candidate with the most rounds is used (the first one on ties), and only if none
 * was line-solvable at all, the last candidate is repaired. Always deterministic per seed.
 */
export function generateWithRounds(
  seed: number,
  size: number,
  density: readonly [number, number],
  minRounds: number,
  maxAttempts: number
): number[] {
  let best: number[] | null = null;
  let bestRounds = -1;
  let candidate: number[] = [];
  // At least one candidate, so the repair fallback always has a full-size picture.
  for (let attempt = 0; attempt < Math.max(1, maxAttempts); attempt++) {
    candidate = randomPicture(attemptSeed(seed, attempt), size, density[0], density[1]);
    const result = solveRounds(cluesOf(candidate, size));
    if (!result.solved) continue;
    if (result.rounds >= minRounds) return candidate;
    if (result.rounds > bestRounds) {
      best = candidate;
      bestRounds = result.rounds;
    }
  }
  return best ?? repairPicture(candidate, size);
}

/** The seeded puzzle for a difficulty: a picture whose clues are solvable without guessing. */
export function generatePuzzle(seed: number, difficulty: Difficulty): number[] {
  if (difficulty === 'expert') return generateWithRounds(seed, SIZES.expert, DENSITIES.expert, MIN_ROUNDS.expert, EXPERT_MAX_ATTEMPTS);
  const size = SIZES[difficulty];
  let candidate: number[] = [];
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    candidate = randomPicture(attemptSeed(seed, attempt), size);
    if (isLineSolvable(candidate, size)) return candidate;
  }
  return repairPicture(candidate, size);
}

// --- Game state ----------------------------------------------------------------------------

export function createInitialState(seed: number, difficulty: Difficulty = DEFAULT_DIFFICULTY): NonogramState {
  const size = SIZES[difficulty];
  return {
    seed: seed >>> 0,
    difficulty,
    size,
    solution: generatePuzzle(seed >>> 0, difficulty),
    cells: new Array<number>(size * size).fill(UNKNOWN),
    mode: 'fill',
    moves: 0,
    checks: 0,
    mistakes: 0,
    lastCheck: null,
    marked: []
  };
}

/** Solved when the filled cells equal the solution exactly; crosses and blanks are equivalent. */
export function isSolved(state: Pick<NonogramState, 'solution' | 'cells'>): boolean {
  return state.cells.every((mark, i) => (mark === FILLED) === (state.solution[i] === 1));
}

/** Indices of filled cells that are empty in the solution, ascending. */
export function wrongCells(state: Pick<NonogramState, 'solution' | 'cells'>): number[] {
  const wrong: number[] = [];
  state.cells.forEach((mark, i) => {
    if (mark === FILLED && state.solution[i] !== 1) wrong.push(i);
  });
  return wrong;
}

/** The mark a cell gets after an action. */
export function nextMark(current: number, action: CellAction): Mark {
  switch (action) {
    case 'toggleFill':
      return current === FILLED ? UNKNOWN : FILLED;
    case 'toggleCross':
      return current === CROSSED ? UNKNOWN : CROSSED;
    case 'fill':
      return FILLED;
    case 'cross':
      return CROSSED;
    case 'clear':
      return UNKNOWN;
  }
}

/** Action a plain tap performs in the given mode. */
export const tapAction = (mode: Mode): CellAction => (mode === 'cross' ? 'toggleCross' : 'toggleFill');

/** Applies a cell action. Returns the same object when nothing changes (finished game, out of range, same mark). */
export function applyCell(state: NonogramState, index: number, action: CellAction): NonogramState {
  if (isSolved(state) || !Number.isInteger(index) || index < 0 || index >= state.cells.length) return state;
  const current = state.cells[index] as number;
  const mark = nextMark(current, action);
  if (mark === current) return state;
  const cells = [...state.cells];
  cells[index] = mark;
  const wrongFill = mark === FILLED && state.solution[index] !== 1;
  return {
    ...state,
    cells,
    moves: state.moves + 1,
    mistakes: state.mistakes + (wrongFill ? 1 : 0),
    lastCheck: null,
    marked: state.marked.filter((i) => i !== index)
  };
}

/** Counts wrongly filled cells without revealing which; clears any shown mistake marks. */
export function check(state: NonogramState): NonogramState {
  if (isSolved(state)) return state;
  return { ...state, checks: state.checks + 1, lastCheck: wrongCells(state).length, marked: [] };
}

/** True when "Show mistakes" is meaningful: the last check found wrong cells and nothing changed since. */
export const canShowMistakes = (state: NonogramState): boolean =>
  state.lastCheck !== null && state.lastCheck > 0 && state.marked.length === 0 && !isSolved(state);

/** Marks the wrongly filled cells (only directly after a check that found some). */
export function showMistakes(state: NonogramState): NonogramState {
  if (!canShowMistakes(state)) return state;
  return { ...state, marked: wrongCells(state) };
}

export function setMode(state: NonogramState, mode: Mode): NonogramState {
  return state.mode === mode ? state : { ...state, mode };
}

/** Index ↔ coordinates. */
export const indexOf = (size: number, r: number, c: number): number => r * size + c;

// --- Validation ----------------------------------------------------------------------------

const isCounter = (value: unknown): value is number => isInt(value, 0, MAX_COUNTER);

/** Structural validation of untrusted saves. Never throws. */
export function isNonogramState(value: unknown): value is NonogramState {
  try {
    if (!isRecord(value)) return false;
    const v = value;
    if (!isUint32(v.seed) || !isOneOf(v.difficulty, DIFFICULTIES)) return false;
    const size = SIZES[v.difficulty];
    const total = size * size;
    if (v.size !== size) return false;
    if (!Array.isArray(v.solution) || v.solution.length !== total || !v.solution.every((x) => x === 0 || x === 1)) return false;
    if (!Array.isArray(v.cells) || v.cells.length !== total || !v.cells.every((x) => x === UNKNOWN || x === FILLED || x === CROSSED)) return false;
    if (!isOneOf(v.mode, MODES)) return false;
    if (!isCounter(v.moves) || !isCounter(v.checks) || !isCounter(v.mistakes) || v.mistakes > v.moves) return false;
    if (v.lastCheck !== null && !isInt(v.lastCheck, 0, total)) return false;
    if (!Array.isArray(v.marked) || !v.marked.every((i, n, all) => isInt(i, 0, total - 1) && (n === 0 || i > (all[n - 1] as number)))) return false;
    const cells = v.cells as number[];
    const solution = v.solution as number[];
    if (!(v.marked as number[]).every((i) => cells[i] === FILLED && solution[i] === 0)) return false;
    return isLineSolvable(solution, size);
  } catch {
    return false;
  }
}
