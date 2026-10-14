import { createRng, createRngFromState, isArrayOf, isInt, isOneOf, isRecord, isUint32, normalizeSeed, type Rng } from '@wp/game-core';

/**
 * Pattern Memory: a calm, user-paced visual-spatial memory task. A set of cells is shown
 * all at once, then hidden; the player marks the cells they remember. Pure, DOM-free logic.
 * Whether the pattern is currently visible is deliberately *view* state: closing the game
 * while the pattern is shown simply returns to the "Show pattern" button.
 */

/** A session always has exactly this many rounds: no endless mode, no lives. */
export const ROUNDS = 10;
export const START_SIZE = 3;
export const MIN_SIZE = 2;
export const MAX_SIZE = 16;
export const MIN_SIDE = 4;
export const MAX_SIDE = 6;

export const DIFFICULTIES = ['standard', 'rotated'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'standard';

export const PRESENTATIONS = ['auto', 'step'] as const;
export type Presentation = (typeof PRESENTATIONS)[number];

export const PHASES = ['showing', 'recalling', 'feedback', 'finished'] as const;
export type Phase = (typeof PHASES)[number];

export interface RoundResult {
  size: number;
  correct: boolean;
}

export interface PatternState {
  seed: number;
  difficulty: Difficulty;
  /** How the pattern is hidden again (a game-internal option that survives "New game"). */
  presentation: Presentation;
  /** PRNG state after generating the current round's pattern. */
  rng: number;
  /** Index of the current round, 0..ROUNDS-1. */
  round: number;
  /** Number of cells in the current pattern. */
  size: number;
  /** Cells of the current pattern (distinct, ascending, row-major indices on a side×side grid). */
  pattern: number[];
  phase: Phase;
  /** Cells the player has marked in the current round (distinct, ascending; partial while recalling). */
  marks: number[];
  /** Evaluated rounds, oldest first. */
  history: RoundResult[];
}

export interface Summary {
  maxSize: number;
  correctRounds: number;
  rounds: number;
}

/** What a cell shows. Every kind has its own symbol/border, so nothing relies on colour. */
export type CellMark = 'idle' | 'shown' | 'marked' | 'hit' | 'miss' | 'wrong';

const ascending = (a: number, b: number) => a - b;
const isStrictlyAscending = (values: readonly number[]) => values.every((v, i) => i === 0 || v > (values[i - 1] as number));
const isRoundResult = (value: unknown): value is RoundResult =>
  isRecord(value) && isInt(value.size, MIN_SIZE, MAX_SIZE) && typeof value.correct === 'boolean';

export function toDifficulty(value: unknown): Difficulty {
  return isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY;
}

export function toPresentation(value: unknown, fallback: Presentation): Presentation {
  return isOneOf(value, PRESENTATIONS) ? value : fallback;
}

/** The grid grows with the pattern: 4×4 up to 5 cells, 5×5 up to 10 cells, then 6×6. */
export function gridSide(size: number): number {
  if (size <= 5) return 4;
  if (size <= 10) return 5;
  return 6;
}

/** Adaptive staircase: one cell more after a correct answer, one fewer after a mistake. */
export function nextSize(size: number, correct: boolean): number {
  return correct ? Math.min(MAX_SIZE, size + 1) : Math.max(MIN_SIZE, size - 1);
}

/** The size of every round, given the correctness of the rounds played so far (plus the next one). */
export function sizeSchedule(results: readonly boolean[]): number[] {
  const sizes = [START_SIZE];
  for (const correct of results) sizes.push(nextSize(sizes[sizes.length - 1] as number, correct));
  return sizes;
}

/** `size` distinct cells of the grid that belongs to `size`, in ascending order. */
export function generatePattern(rng: Rng, size: number): number[] {
  if (!isInt(size, MIN_SIZE, MAX_SIZE)) throw new RangeError(`size must be ${MIN_SIZE}..${MAX_SIZE}`);
  const side = gridSide(size);
  const all = Array.from({ length: side * side }, (_, i) => i);
  return rng.shuffle(all).slice(0, size).sort(ascending);
}

/** The cell at (row, column) moves to (column, side − 1 − row): a quarter turn clockwise. */
export function rotateCell(cell: number, side: number): number {
  const row = Math.floor(cell / side);
  const column = cell % side;
  return column * side + (side - 1 - row);
}

/** The cells the player has to mark, in ascending order. */
export function expectedCells(pattern: readonly number[], side: number, difficulty: Difficulty): number[] {
  const cells = difficulty === 'rotated' ? pattern.map((cell) => rotateCell(cell, side)) : [...pattern];
  return cells.sort(ascending);
}

/** Correct exactly when the marked cells are the expected cells (order does not matter). */
export function isRecallCorrect(expected: readonly number[], marks: readonly number[]): boolean {
  const wanted = new Set(expected);
  return marks.length === wanted.size && marks.every((cell) => wanted.has(cell));
}

/** Number of marked cells that are part of the expected answer. */
export function countHits(expected: readonly number[], marks: readonly number[]): number {
  const wanted = new Set(expected);
  return marks.filter((cell) => wanted.has(cell)).length;
}

export function newSession(seed: number, difficulty: Difficulty, presentation: Presentation): PatternState {
  const normalized = normalizeSeed(seed);
  const rng = createRng(normalized);
  const pattern = generatePattern(rng, START_SIZE);
  return {
    seed: normalized,
    difficulty,
    presentation,
    rng: rng.state(),
    round: 0,
    size: START_SIZE,
    pattern,
    phase: 'showing',
    marks: [],
    history: []
  };
}

export function setPresentation(state: PatternState, presentation: Presentation): PatternState {
  return { ...state, presentation };
}

/** The pattern has been hidden: the player now marks the cells. */
export function beginRecall(state: PatternState): PatternState {
  if (state.phase !== 'showing') return state;
  return { ...state, phase: 'recalling', marks: [] };
}

/**
 * Marks or unmarks a cell during recall. At most `size` cells can be marked at once;
 * marking another one is ignored (the player unmarks one first).
 */
export function toggleCell(state: PatternState, cell: number): PatternState {
  const side = gridSide(state.size);
  if (state.phase !== 'recalling' || !isInt(cell, 0, side * side - 1)) return state;
  if (state.marks.includes(cell)) return { ...state, marks: state.marks.filter((c) => c !== cell) };
  if (state.marks.length >= state.size) return state;
  return { ...state, marks: [...state.marks, cell].sort(ascending) };
}

/** True while "Done" can be pressed: recalling with at least one marked cell. */
export function canSubmit(state: PatternState): boolean {
  return state.phase === 'recalling' && state.marks.length > 0;
}

/** Evaluates the marked cells: feedback, or the end of the session after the last round. */
export function submit(state: PatternState): PatternState {
  if (!canSubmit(state)) return state;
  const correct = isRecallCorrect(expectedCells(state.pattern, gridSide(state.size), state.difficulty), state.marks);
  const finished = state.round === ROUNDS - 1;
  return { ...state, phase: finished ? 'finished' : 'feedback', history: [...state.history, { size: state.size, correct }] };
}

/** Size of the round that follows the last evaluated one. */
export function upcomingSize(state: PatternState): number {
  const last = state.history[state.history.length - 1];
  return last ? nextSize(last.size, last.correct) : START_SIZE;
}

/** Feedback → the next round, with the staircase size and a fresh pattern. */
export function nextRound(state: PatternState): PatternState {
  if (state.phase !== 'feedback') return state;
  const rng = createRngFromState(state.rng);
  const size = upcomingSize(state);
  const pattern = generatePattern(rng, size);
  return { ...state, rng: rng.state(), round: state.round + 1, size, pattern, phase: 'showing', marks: [] };
}

/** Factual session summary (never compared with earlier sessions). */
export function summarize(state: PatternState): Summary {
  let maxSize = 0;
  let correctRounds = 0;
  for (const result of state.history) {
    if (!result.correct) continue;
    correctRounds++;
    maxSize = Math.max(maxSize, result.size);
  }
  return { maxSize, correctRounds, rounds: state.history.length };
}

/**
 * Cell marks for a state. `revealed` is the (view-only) visibility of the pattern while
 * showing. After a round, expected cells are `hit` (marked) or `miss` (not marked), and
 * marked cells outside the expected answer are `wrong`.
 */
export function cellMarks(state: PatternState, revealed = false): CellMark[] {
  const side = gridSide(state.size);
  const marks: CellMark[] = Array.from({ length: side * side }, () => 'idle');
  if (state.phase === 'showing') {
    if (revealed) for (const cell of state.pattern) marks[cell] = 'shown';
    return marks;
  }
  for (const cell of state.marks) marks[cell] = state.phase === 'recalling' ? 'marked' : 'wrong';
  if (state.phase === 'recalling') return marks;
  for (const cell of expectedCells(state.pattern, side, state.difficulty)) marks[cell] = marks[cell] === 'wrong' ? 'hit' : 'miss';
  return marks;
}

/** Structural and cross-field validation of untrusted saves. Never throws. */
export function isValidPatternState(value: unknown): value is PatternState {
  if (!isRecord(value)) return false;
  const { seed, difficulty, presentation, rng, round, size, pattern, phase, marks, history } = value;
  if (!isUint32(seed) || !isOneOf(difficulty, DIFFICULTIES) || !isOneOf(presentation, PRESENTATIONS) || !isUint32(rng)) return false;
  if (!isInt(round, 0, ROUNDS - 1) || !isOneOf(phase, PHASES) || !isInt(size, MIN_SIZE, MAX_SIZE)) return false;
  const cells = gridSide(size) ** 2;
  const isCell = (v: unknown): v is number => isInt(v, 0, cells - 1);
  if (!isArrayOf(pattern, isCell, size) || !isStrictlyAscending(pattern)) return false;
  if (!isArrayOf(marks, isCell) || !isStrictlyAscending(marks) || marks.length > size) return false;
  if (!isArrayOf(history, isRoundResult)) return false;

  const evaluated = phase === 'feedback' || phase === 'finished';
  if (history.length !== round + (evaluated ? 1 : 0)) return false;
  if (phase === 'finished' && round !== ROUNDS - 1) return false;
  if (phase === 'feedback' && round === ROUNDS - 1) return false;
  if (phase === 'showing' && marks.length !== 0) return false;
  if (evaluated && marks.length === 0) return false;

  // The staircase must explain every size, including the current one.
  const sizes = sizeSchedule(history.map((r) => r.correct));
  if (!history.every((r, i) => r.size === sizes[i])) return false;
  if (sizes[round] !== size) return false;
  const current = history[round];
  if (current && current.correct !== isRecallCorrect(expectedCells(pattern, gridSide(size), difficulty), marks)) return false;

  // Replay the generator: the pattern and PRNG state must follow from the seed.
  const replay = createRng(seed);
  const generated = sizes.slice(0, round + 1).map((s) => generatePattern(replay, s));
  const replayed = generated[round] as number[];
  return replay.state() === rng && replayed.every((cell, i) => pattern[i] === cell);
}
