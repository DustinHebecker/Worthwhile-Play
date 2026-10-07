// @ts-nocheck
import { createRng, isInt, isOneOf, isRecord, isUint32, seedFromString, type Rng } from '@wp/game-core';

/**
 * Pure, DOM-free rules for Mine Logic (no-guess Minesweeper).
 *
 * The mine layout does not exist until the first reveal: the first cell is part of the
 * puzzle. `generateMines` then draws layouts from seeds derived from (game seed, first
 * cell, attempt) and keeps the first one that the logic solver below clears completely
 * from that opening. The solver only ever acts on deductions that hold in every mine
 * layout consistent with what is visible (checked by an independent brute-force oracle
 * in the tests), so a generated board never needs a guess.
 *
 * The state stores the layout once it exists; restoring a save never regenerates it.
 */

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

export interface BoardSpec {
  readonly rows: number;
  readonly cols: number;
  readonly mines: number;
}

/**
 * Board sizes. At most 10 columns so that cells stay at least 30 px wide on a 360 px
 * phone (328 px content width); "hard" grows downwards instead of sideways.
 */
export const BOARDS: Readonly<Record<Difficulty, BoardSpec>> = {
  easy: { rows: 8, cols: 8, mines: 10 },
  medium: { rows: 10, cols: 10, mines: 18 },
  hard: { rows: 15, cols: 10, mines: 30 }
};

/** Player marks per cell. */
export const HIDDEN = 0;
export const REVEALED = 1;
export const FLAGGED = 2;

export type Mode = 'reveal' | 'flag';
export const MODES: readonly Mode[] = ['reveal', 'flag'];

/** Layout candidates tried for one first click before the best-effort fallback is used. */
export const MAX_ATTEMPTS = 4000;

/** Frontier components larger than this are not enumerated (treated as "anything possible"). */
export const MAX_COMPONENT = 48;
/** Backtracking node budget per component enumeration; exceeding it is treated like a skip. */
export const MAX_NODES = 60_000;

/** Upper bound for counters in untrusted saves (far beyond any real game). */
export const MAX_COUNTER = 1_000_000;

export interface MinesState {
  seed: number;
  difficulty: Difficulty;
  rows: number;
  cols: number;
  mineCount: number;
  /** First revealed cell, `null` before the first reveal. */
  first: number | null;
  /** Which derived seed produced the layout (reproducibility/debugging), `null` before the first reveal. */
  attempt: number | null;
  /** Sorted mine cell indices; `null` until the first reveal. */
  mines: number[] | null;
  /** Row-major player marks: `HIDDEN`, `REVEALED`, `FLAGGED`. */
  marks: number[];
  /** A mine revealed by mistake that waits for "undo" (or "show board"), else `null`. */
  exploded: number | null;
  /** The player ended the game by showing the whole board. */
  shown: boolean;
  /** What a plain tap does on a covered cell. */
  mode: Mode;
  /** Number of state-changing actions (reveals, chords, flag changes). */
  moves: number;
  /** Number of mistaken reveals that were undone. */
  undos: number;
}

export function toDifficulty(value: unknown): Difficulty {
  return isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY;
}

// --- Geometry ------------------------------------------------------------------------------

/** Indices of the up to eight neighbours of `index`, ascending. */
export function neighbours(rows: number, cols: number, index: number): number[] {
  const r = Math.floor(index / cols);
  const c = index % cols;
  const result: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) result.push(nr * cols + nc);
    }
  }
  return result;
}

/** Boolean mine map from a list of mine indices. */
export function mineMap(size: number, mines: readonly number[]): boolean[] {
  const map = new Array<boolean>(size).fill(false);
  for (const m of mines) map[m] = true;
  return map;
}

/** Number of adjacent mines for every cell (mines included, counting their mine neighbours). */
export function adjacentCounts(rows: number, cols: number, mines: readonly number[]): number[] {
  const counts = new Array<number>(rows * cols).fill(0);
  for (const m of mines) for (const n of neighbours(rows, cols, m)) counts[n] = (counts[n] as number) + 1;
  return counts;
}

/**
 * Cells opened by revealing the safe cell `start`: the cell itself and, flood-filling
 * through cells with zero adjacent mines, every reachable cell. Returned ascending;
 * cells for which `skip` is true are neither opened nor expanded.
 */
export function floodCells(rows: number, cols: number, counts: readonly number[], start: number, skip: (i: number) => boolean = () => false): number[] {
  const seen = new Set<number>([start]);
  const stack = [start];
  while (stack.length > 0) {
    const i = stack.pop() as number;
    if (counts[i] !== 0) continue;
    for (const n of neighbours(rows, cols, i)) {
      if (seen.has(n) || skip(n)) continue;
      seen.add(n);
      stack.push(n);
    }
  }
  return [...seen].sort((a, b) => a - b);
}

// --- Generation ----------------------------------------------------------------------------

/** Deterministic seed for layout attempt `attempt` after a first reveal at `first`. */
export function deriveSeed(seed: number, first: number, attempt: number): number {
  return seedFromString(`mine-logic:${seed >>> 0}:${first}:${attempt}`);
}

/** Uniformly random layout of `mineCount` mines avoiding `first` and its neighbours (sorted). */
export function randomLayout(rows: number, cols: number, mineCount: number, first: number, rng: Rng): number[] {
  const banned = new Set([first, ...neighbours(rows, cols, first)]);
  const candidates: number[] = [];
  for (let i = 0; i < rows * cols; i++) if (!banned.has(i)) candidates.push(i);
  return rng
    .shuffle(candidates)
    .slice(0, mineCount)
    .sort((a, b) => a - b);
}

export interface Generated {
  mines: number[];
  attempt: number;
  /** False only if no attempt was solvable (never observed for the shipped boards). */
  solvable: boolean;
}

/** First layout (over derived seeds) that the logic solver clears from the opening at `first`. */
export function generateMines(rows: number, cols: number, mineCount: number, first: number, seed: number, maxAttempts = MAX_ATTEMPTS): Generated {
  let fallback: Generated | null = null;
  let bestRevealed = -1;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const mines = randomLayout(rows, cols, mineCount, first, createRng(deriveSeed(seed, first, attempt)));
    const result = solve(rows, cols, mines, first);
    if (result.solved) return { mines, attempt, solvable: true };
    if (result.revealedCount > bestRevealed) {
      bestRevealed = result.revealedCount;
      fallback = { mines, attempt, solvable: false };
    }
  }
  return fallback ?? { mines: randomLayout(rows, cols, mineCount, first, createRng(deriveSeed(seed, first, 0))), attempt: 0, solvable: false };
}

// --- Logic solver --------------------------------------------------------------------------

export type SolverRule = 'single' | 'pair' | 'enumerate';

export interface SolveStep {
  rule: SolverRule;
  /** Revealed cells (ascending) the deduction was based on. */
  revealed: number[];
  /** Cells deduced to be safe (ascending). */
  safe: number[];
  /** Cells deduced to be mines (ascending). */
  mines: number[];
}

export interface SolveResult {
  /** Every safe cell was revealed by logic alone. */
  solved: boolean;
  revealedCount: number;
  /** Deduction steps, only filled when `record` is true. */
  steps: SolveStep[];
}

interface Constraint {
  cells: number[];
  need: number;
}

const UNKNOWN = -1;
const KNOWN_MINE = -2;

/**
 * Plays the board from the opening at `first` using only forced deductions:
 *  1. single-cell rules (a number's remaining mines equal its unknown neighbours, or zero);
 *  2. pair rules on overlapping numbers (subset / difference reasoning);
 *  3. exact enumeration of each frontier component combined with the total mine count.
 * Each step applies one rule's batch of deductions, all derived from the same snapshot.
 */
export function solve(rows: number, cols: number, mines: readonly number[], first: number, record = false): SolveResult {
  const size = rows * cols;
  const isMine = mineMap(size, mines);
  const counts = adjacentCounts(rows, cols, mines);
  const nbrs: number[][] = [];
  for (let i = 0; i < size; i++) nbrs.push(neighbours(rows, cols, i));
  /** -1 unknown, -2 known mine, >= 0 revealed with that number. */
  const know = new Array<number>(size).fill(UNKNOWN);
  let revealedCount = 0;
  let knownMines = 0;
  const safeTotal = size - mines.length;
  const steps: SolveStep[] = [];

  const reveal = (start: number) => {
    if (know[start] !== UNKNOWN) return;
    for (const i of floodCells(rows, cols, counts, start, (n) => know[n] !== UNKNOWN)) {
      know[i] = counts[i] as number;
      revealedCount++;
    }
  };

  const apply = (rule: SolverRule, safe: Set<number>, found: Set<number>): boolean => {
    if (safe.size === 0 && found.size === 0) return false;
    if (record) {
      const revealed: number[] = [];
      for (let i = 0; i < size; i++) if ((know[i] as number) >= 0) revealed.push(i);
      steps.push({ rule, revealed, safe: [...safe].sort((a, b) => a - b), mines: [...found].sort((a, b) => a - b) });
    }
    for (const m of found) {
      if (know[m] === UNKNOWN) {
        know[m] = KNOWN_MINE;
        knownMines++;
      }
    }
    for (const s of safe) {
      // A sound solver never deduces a mine as safe; guard anyway so a bug cannot "reveal" one.
      if (isMine[s]) throw new Error(`solver deduced mine ${s} as safe`);
      reveal(s);
    }
    return true;
  };

  const constraints = (): Constraint[] => {
    const list: Constraint[] = [];
    for (let i = 0; i < size; i++) {
      const value = know[i] as number;
      if (value < 0) continue;
      const cells: number[] = [];
      let need = value;
      for (const n of nbrs[i] as number[]) {
        if (know[n] === UNKNOWN) cells.push(n);
        else if (know[n] === KNOWN_MINE) need--;
      }
      if (cells.length > 0) list.push({ cells, need });
    }
    return list;
  };

  if (!isMine[first]) reveal(first);
  while (revealedCount < safeTotal) {
    const list = constraints();
    if (apply('single', ...singleRule(list))) continue;
    if (apply('pair', ...pairRule(list))) continue;
    const unknown: number[] = [];
    for (let i = 0; i < size; i++) if (know[i] === UNKNOWN) unknown.push(i);
    if (apply('enumerate', ...enumerateRule(list, unknown, mines.length - knownMines))) continue;
    break;
  }
  return { solved: revealedCount === safeTotal && !isMine[first], revealedCount, steps };
}

/** Rule 1: a number whose remaining mines are 0 (all unknown neighbours safe) or all of them. */
export function singleRule(list: readonly Constraint[]): [Set<number>, Set<number>] {
  const safe = new Set<number>();
  const mines = new Set<number>();
  for (const { cells, need } of list) {
    if (need === 0) for (const c of cells) safe.add(c);
    else if (need === cells.length) for (const c of cells) mines.add(c);
  }
  return [safe, mines];
}

/**
 * Rule 2: for overlapping numbers A and B, if A needs exactly |A \ B| more mines than B,
 * then every cell of A \ B is a mine and every cell of B \ A is safe (this includes the
 * classic subset rule).
 */
export function pairRule(list: readonly Constraint[]): [Set<number>, Set<number>] {
  const safe = new Set<number>();
  const mines = new Set<number>();
  const byCell = new Map<number, number[]>();
  list.forEach((con, k) => {
    for (const c of con.cells) {
      const entry = byCell.get(c);
      if (entry) entry.push(k);
      else byCell.set(c, [k]);
    }
  });
  list.forEach((a, ka) => {
    const partners = new Set<number>();
    for (const c of a.cells) for (const kb of byCell.get(c) as number[]) if (kb !== ka) partners.add(kb);
    for (const kb of partners) {
      const b = list[kb] as Constraint;
      const onlyA = a.cells.filter((c) => !b.cells.includes(c));
      if (a.need - b.need !== onlyA.length) continue;
      for (const c of onlyA) mines.add(c);
      for (const c of b.cells) if (!a.cells.includes(c)) safe.add(c);
    }
  });
  return [safe, mines];
}

interface ComponentInfo {
  cells: number[];
  /** Mine counts that some local solution has; `null` when enumeration was skipped. */
  possible: boolean[] | null;
  /** canMine[k][j]: a local solution with k mines has cell j as a mine. */
  canMine: boolean[][];
  canSafe: boolean[][];
}

/**
 * Rule 3: exact reasoning over the frontier. Unknown cells next to numbers are split into
 * independent components; each is enumerated exhaustively (up to a size/node budget) and
 * the per-component mine counts are combined with the remaining mine total and the
 * unconstrained ("interior") unknown cells. A cell is deduced only if it has the same
 * value in every globally consistent combination. Skipped components contribute every
 * count from 0 to their size, which only weakens (never falsifies) the conclusions.
 */
export function enumerateRule(list: readonly Constraint[], unknown: readonly number[], remaining: number): [Set<number>, Set<number>] {
  const safe = new Set<number>();
  const mines = new Set<number>();
  // Union-find over constrained cells.
  const parent = new Map<number, number>();
  const find = (x: number): number => {
    let root = x;
    while (parent.get(root) !== root) root = parent.get(root) as number;
    parent.set(x, root);
    return root;
  };
  for (const { cells } of list) {
    for (const c of cells) if (!parent.has(c)) parent.set(c, c);
    for (const c of cells.slice(1)) parent.set(find(c), find(cells[0] as number));
  }
  const groups = new Map<number, number[]>();
  for (const c of [...parent.keys()].sort((a, b) => a - b)) {
    const root = find(c);
    const group = groups.get(root);
    if (group) group.push(c);
    else groups.set(root, [c]);
  }
  const interior = unknown.filter((c) => !parent.has(c));
  const components: ComponentInfo[] = [];
  for (const cells of groups.values()) {
    const local = list.filter((con) => parent.has(con.cells[0] as number) && find(con.cells[0] as number) === find(cells[0] as number));
    components.push(enumerateComponent(cells, local));
  }

  const ranges = components.map((comp) => comp.possible ?? new Array<boolean>(comp.cells.length + 1).fill(true));
  const sumsWithout = (skip: number): boolean[] => {
    let sums = [true];
    ranges.forEach((range, k) => {
      if (k === skip) return;
      const next = new Array<boolean>(sums.length + range.length - 1).fill(false);
      sums.forEach((ok, s) => {
        if (ok) range.forEach((possible, add) => void (possible && (next[s + add] = true)));
      });
      sums = next;
    });
    return sums;
  };
  /** A frontier-wide mine total `s` leaves a feasible number of mines for the interior. */
  const fits = (s: number) => remaining - s >= 0 && remaining - s <= interior.length;

  components.forEach((comp, k) => {
    if (!comp.possible) return;
    const others = sumsWithout(k);
    const feasible = comp.possible.map((p, mineCount) => p && others.some((ok, s) => ok && fits(s + mineCount)));
    comp.cells.forEach((cell, j) => {
      let canMine = false;
      let canSafe = false;
      feasible.forEach((ok, mineCount) => {
        if (!ok) return;
        if (comp.canMine[mineCount]?.[j]) canMine = true;
        if (comp.canSafe[mineCount]?.[j]) canSafe = true;
      });
      if (!canMine && canSafe) safe.add(cell);
      if (!canSafe && canMine) mines.add(cell);
    });
  });

  if (interior.length > 0) {
    const all = sumsWithout(-1);
    let canMine = false;
    let canSafe = false;
    all.forEach((ok, s) => {
      if (!ok || !fits(s)) return;
      if (remaining - s >= 1) canMine = true;
      if (remaining - s <= interior.length - 1) canSafe = true;
    });
    if (!canMine && canSafe) for (const c of interior) safe.add(c);
    if (!canSafe && canMine) for (const c of interior) mines.add(c);
  }
  return [safe, mines];
}

/** Exhaustive backtracking over one frontier component. */
function enumerateComponent(cells: readonly number[], local: readonly Constraint[]): ComponentInfo {
  const n = cells.length;
  const info: ComponentInfo = { cells: [...cells], possible: null, canMine: [], canSafe: [] };
  if (n > MAX_COMPONENT) return info;
  // Order cells so that constraints become complete early (better pruning).
  const order: number[] = [];
  const placed = new Set<number>();
  for (const con of local) {
    for (const c of con.cells) {
      if (placed.has(c)) continue;
      placed.add(c);
      order.push(c);
    }
  }
  const position = new Map(order.map((c, i) => [c, i]));
  const cons = local.map((con) => ({ idx: con.cells.map((c) => position.get(c) as number), need: con.need }));
  const consOf: number[][] = order.map(() => []);
  cons.forEach((con, k) => con.idx.forEach((i) => (consOf[i] as number[]).push(k)));
  const assigned = cons.map(() => 0);
  const open = cons.map((con) => con.idx.length);
  const value = new Array<number>(n).fill(0);
  const possible = new Array<boolean>(n + 1).fill(false);
  const canMine = Array.from({ length: n + 1 }, () => new Array<boolean>(n).fill(false));
  const canSafe = Array.from({ length: n + 1 }, () => new Array<boolean>(n).fill(false));
  let nodes = 0;
  let aborted = false;

  const step = (i: number, mineTotal: number) => {
    if (aborted) return;
    if (++nodes > MAX_NODES) {
      aborted = true;
      return;
    }
    if (i === n) {
      possible[mineTotal] = true;
      const mineRow = canMine[mineTotal] as boolean[];
      const safeRow = canSafe[mineTotal] as boolean[];
      for (let j = 0; j < n; j++) {
        const cell = position.get(cells[j] as number) as number;
        if (value[cell] === 1) mineRow[j] = true;
        else safeRow[j] = true;
      }
      return;
    }
    for (const v of [0, 1]) {
      let ok = true;
      for (const k of consOf[i] as number[]) {
        const con = cons[k] as { need: number };
        const a = (assigned[k] as number) + v;
        const o = (open[k] as number) - 1;
        if (a > con.need || a + o < con.need) ok = false;
      }
      if (!ok) continue;
      value[i] = v;
      for (const k of consOf[i] as number[]) {
        assigned[k] = (assigned[k] as number) + v;
        open[k] = (open[k] as number) - 1;
      }
      step(i + 1, mineTotal + v);
      for (const k of consOf[i] as number[]) {
        assigned[k] = (assigned[k] as number) - v;
        open[k] = (open[k] as number) + 1;
      }
    }
  };
  step(0, 0);
  if (aborted) return info;
  return { cells: [...cells], possible, canMine, canSafe };
}

// --- Game state ----------------------------------------------------------------------------

export function createInitialState(seed: number, difficulty: Difficulty = DEFAULT_DIFFICULTY): MinesState {
  const spec = BOARDS[difficulty];
  return {
    seed: seed >>> 0,
    difficulty,
    rows: spec.rows,
    cols: spec.cols,
    mineCount: spec.mines,
    first: null,
    attempt: null,
    mines: null,
    marks: new Array<number>(spec.rows * spec.cols).fill(HIDDEN),
    exploded: null,
    shown: false,
    mode: 'reveal',
    moves: 0,
    undos: 0
  };
}

export const revealedCount = (state: MinesState): number => state.marks.filter((m) => m === REVEALED).length;
export const flagCount = (state: MinesState): number => state.marks.filter((m) => m === FLAGGED).length;
export const safeCellsLeft = (state: MinesState): number => state.rows * state.cols - state.mineCount - revealedCount(state);
export const isWon = (state: MinesState): boolean => state.mines !== null && safeCellsLeft(state) === 0;
/** The game has ended (won or board shown); no further moves are possible. */
export const isOver = (state: MinesState): boolean => state.shown || isWon(state);
/** Moves are possible: not over and no mistaken reveal pending. */
export const canAct = (state: MinesState): boolean => !isOver(state) && state.exploded === null;

/** Adjacent mine count for a cell (0 before the layout exists). */
export function countAt(state: MinesState, index: number): number {
  if (!state.mines) return 0;
  const mines = state.mines;
  return neighbours(state.rows, state.cols, index).filter((n) => mines.includes(n)).length;
}

/** Opens `targets` (safe cells only) with flood fill; wrong flags on opened cells are removed. */
function openCells(state: MinesState, mines: readonly number[], targets: readonly number[]): number[] {
  const counts = adjacentCounts(state.rows, state.cols, mines);
  const marks = [...state.marks];
  for (const target of targets) {
    if (marks[target] === REVEALED) continue;
    for (const i of floodCells(state.rows, state.cols, counts, target, (n) => marks[n] === REVEALED)) marks[i] = REVEALED;
  }
  return marks;
}

/**
 * Reveals a covered, unflagged cell. The first reveal creates the layout. Revealing a mine
 * does not end the game: it is recorded in `exploded` until the player undoes it.
 */
export function reveal(state: MinesState, index: number): MinesState {
  if (!canAct(state) || !isInt(index, 0, state.marks.length - 1) || state.marks[index] !== HIDDEN) return state;
  let { mines, first, attempt } = state;
  if (mines === null) {
    const generated = generateMines(state.rows, state.cols, state.mineCount, index, state.seed);
    mines = generated.mines;
    first = index;
    attempt = generated.attempt;
  }
  const base = { ...state, mines, first, attempt, moves: state.moves + 1 };
  if (mines.includes(index)) return { ...base, exploded: index };
  return { ...base, marks: openCells(state, mines, [index]) };
}

/**
 * Chord: on a revealed number whose adjacent flags equal its number, reveal all other
 * covered neighbours at once. If a flag was wrong, nothing opens and the first mine among
 * the targets becomes the pending mistake.
 */
export function chord(state: MinesState, index: number): MinesState {
  if (!canAct(state) || !state.mines || !isInt(index, 0, state.marks.length - 1) || state.marks[index] !== REVEALED) return state;
  const around = neighbours(state.rows, state.cols, index);
  const flags = around.filter((n) => state.marks[n] === FLAGGED).length;
  const targets = around.filter((n) => state.marks[n] === HIDDEN);
  if (targets.length === 0 || flags !== countAt(state, index)) return state;
  const mines = state.mines;
  const hit = targets.find((n) => mines.includes(n));
  const base = { ...state, moves: state.moves + 1 };
  if (hit !== undefined) return { ...base, exploded: hit };
  return { ...base, marks: openCells(state, mines, targets) };
}

/** Places or removes a flag on a covered cell. */
export function toggleFlag(state: MinesState, index: number): MinesState {
  if (!canAct(state) || !isInt(index, 0, state.marks.length - 1)) return state;
  const mark = state.marks[index];
  if (mark === REVEALED) return state;
  const marks = [...state.marks];
  marks[index] = mark === FLAGGED ? HIDDEN : FLAGGED;
  return { ...state, marks, moves: state.moves + 1 };
}

/** What a plain tap does: chord on numbers, otherwise reveal or flag depending on the mode. */
export function tap(state: MinesState, index: number): MinesState {
  if (state.marks[index] === REVEALED) return chord(state, index);
  if (state.mode === 'flag') return toggleFlag(state, index);
  return reveal(state, index);
}

export function setMode(state: MinesState, mode: Mode): MinesState {
  return state.mode === mode || !isOneOf(mode, MODES) ? state : { ...state, mode };
}

/** Takes back a mistaken reveal of a mine (counted in `undos`). */
export function undoReveal(state: MinesState): MinesState {
  if (state.exploded === null || state.shown) return state;
  return { ...state, exploded: null, undos: state.undos + 1 };
}

/** Ends the game after a mistaken reveal by showing every mine. */
export function showBoard(state: MinesState): MinesState {
  if (state.exploded === null || state.shown) return state;
  return { ...state, shown: true };
}

// --- Validation ----------------------------------------------------------------------------

const isSortedUnique = (values: readonly number[]) => values.every((v, i) => i === 0 || v > (values[i - 1] as number));

/** Like `Array.prototype.every`, but also visits holes of sparse arrays. */
function everyIndex(values: readonly unknown[], test: (v: unknown) => boolean): boolean {
  for (let i = 0; i < values.length; i++) if (!test(values[i])) return false;
  return true;
}

/** Structural validation of untrusted saves. Never throws. */
export function isMinesState(value: unknown): value is MinesState {
  try {
    return checkState(value);
  } catch {
    return false;
  }
}

function checkState(value: unknown): value is MinesState {
  if (!isRecord(value)) return false;
  const v = value;
  if (!isUint32(v.seed) || !isOneOf(v.difficulty, DIFFICULTIES)) return false;
  const spec = BOARDS[v.difficulty];
  if (v.rows !== spec.rows || v.cols !== spec.cols || v.mineCount !== spec.mines) return false;
  const size = spec.rows * spec.cols;
  if (!Array.isArray(v.marks) || v.marks.length !== size || !everyIndex(v.marks, (m) => m === HIDDEN || m === REVEALED || m === FLAGGED)) return false;
  if (!isOneOf(v.mode, MODES) || typeof v.shown !== 'boolean') return false;
  if (!isInt(v.moves, 0, MAX_COUNTER) || !isInt(v.undos, 0, MAX_COUNTER)) return false;
  const marks = v.marks as number[];
  if (v.mines === null) {
    return v.first === null && v.attempt === null && v.exploded === null && !v.shown && !marks.includes(REVEALED);
  }
  if (!Array.isArray(v.mines) || v.mines.length !== spec.mines || !everyIndex(v.mines, (m) => isInt(m, 0, size - 1))) return false;
  const mines = v.mines as number[];
  if (!isSortedUnique(mines)) return false;
  if (!isInt(v.first, 0, size - 1) || !isInt(v.attempt, 0, MAX_ATTEMPTS)) return false;
  const opening = [v.first, ...neighbours(spec.rows, spec.cols, v.first)];
  if (opening.some((c) => mines.includes(c))) return false;
  if (marks[v.first] !== REVEALED) return false;
  if (mines.some((m) => marks[m] === REVEALED)) return false;
  if (v.exploded !== null) {
    if (!isInt(v.exploded, 0, size - 1) || !mines.includes(v.exploded) || marks[v.exploded] !== HIDDEN) return false;
  } else if (v.shown) return false;
  return true;
}
