import { createRng, createRngFromState, isArrayOf, isInt, isOneOf, isRecord, isUint32, normalizeSeed, type Rng } from '@wp/game-core';

/**
 * Sequence Memory: a calm, user-paced spatial span task (in the spirit of the Corsi
 * block test). Pure, DOM-free logic. The presentation progress (which tile of the
 * sequence is currently highlighted) is deliberately *not* part of the logical state:
 * closing the game during the presentation restarts it from the first tile.
 */

/** Tiles in the 3×3 grid, numbered row by row from the top left (0..8). */
export const TILES = 9;
export const COLUMNS = 3;
/** A session always has exactly this many rounds: no endless mode, no lives. */
export const ROUNDS = 12;
export const START_SPAN = 3;
export const MIN_SPAN = 2;
/** Sequences use distinct tiles, so the 3×3 grid caps the span at 9. */
export const MAX_SPAN = TILES;

export const DIFFICULTIES = ['standard', 'backwards'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'standard';

export const PRESENTATIONS = ['auto', 'step'] as const;
export type Presentation = (typeof PRESENTATIONS)[number];

export const PHASES = ['showing', 'recalling', 'feedback', 'finished'] as const;
export type Phase = (typeof PHASES)[number];

export interface RoundResult {
  span: number;
  correct: boolean;
}

export interface SequenceState {
  seed: number;
  difficulty: Difficulty;
  /** How the sequence is presented (a game-internal option that survives "New game"). */
  presentation: Presentation;
  /** PRNG state after generating the current round's sequence. */
  rng: number;
  /** Index of the current round, 0..ROUNDS-1. */
  round: number;
  /** Length of the current round's sequence. */
  span: number;
  /** Tiles of the current round in presentation order (distinct). */
  sequence: number[];
  phase: Phase;
  /** The player's taps in the current round (partial while recalling). */
  input: number[];
  /** Evaluated rounds, oldest first. */
  history: RoundResult[];
}

export type TileEvent =
  | { kind: 'ignored' }
  | { kind: 'entered'; tile: number; step: number }
  | { kind: 'completed'; tile: number; step: number; correct: boolean; finished: boolean };

export interface TileResult {
  state: SequenceState;
  event: TileEvent;
}

export interface Summary {
  maxSpan: number;
  correctRounds: number;
  rounds: number;
}

export function toDifficulty(value: unknown): Difficulty {
  return isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY;
}

export function toPresentation(value: unknown, fallback: Presentation): Presentation {
  return isOneOf(value, PRESENTATIONS) ? value : fallback;
}

/** Adaptive staircase: one longer after a correct answer, one shorter after a mistake. */
export function nextSpan(span: number, correct: boolean): number {
  return correct ? Math.min(MAX_SPAN, span + 1) : Math.max(MIN_SPAN, span - 1);
}

/** The span of every round, given the correctness of the rounds played so far (plus the next one). */
export function spanSchedule(results: readonly boolean[]): number[] {
  const spans = [START_SPAN];
  for (const correct of results) spans.push(nextSpan(spans[spans.length - 1] as number, correct));
  return spans;
}

/** `span` distinct tiles in random order (so a tile never repeats, immediately or later). */
export function generateSequence(rng: Rng, span: number): number[] {
  if (!isInt(span, 1, TILES)) throw new RangeError(`span must be 1..${TILES}`);
  const all = Array.from({ length: TILES }, (_, i) => i);
  return rng.shuffle(all).slice(0, span);
}

/** The order in which the tiles must be tapped. */
export function expectedAnswer(sequence: readonly number[], difficulty: Difficulty): number[] {
  return difficulty === 'backwards' ? [...sequence].reverse() : [...sequence];
}

export function isRecallCorrect(sequence: readonly number[], input: readonly number[], difficulty: Difficulty): boolean {
  const expected = expectedAnswer(sequence, difficulty);
  return input.length === expected.length && expected.every((tile, i) => input[i] === tile);
}

export function newSession(seed: number, difficulty: Difficulty, presentation: Presentation): SequenceState {
  const normalized = normalizeSeed(seed);
  const rng = createRng(normalized);
  const sequence = generateSequence(rng, START_SPAN);
  return {
    seed: normalized,
    difficulty,
    presentation,
    rng: rng.state(),
    round: 0,
    span: START_SPAN,
    sequence,
    phase: 'showing',
    input: [],
    history: []
  };
}

export function setPresentation(state: SequenceState, presentation: Presentation): SequenceState {
  return { ...state, presentation };
}

/** End of the presentation: the player now reproduces the sequence. */
export function beginRecall(state: SequenceState): SequenceState {
  if (state.phase !== 'showing') return state;
  return { ...state, phase: 'recalling', input: [] };
}

/**
 * Records a tap during recall. Tapping a tile already entered this round is ignored:
 * sequences never repeat a tile, so this only forgives accidental double taps.
 */
export function enterTile(state: SequenceState, tile: number): TileResult {
  if (state.phase !== 'recalling' || !isInt(tile, 0, TILES - 1) || state.input.includes(tile)) return { state, event: { kind: 'ignored' } };
  const input = [...state.input, tile];
  const step = input.length;
  if (step < state.span) return { state: { ...state, input }, event: { kind: 'entered', tile, step } };
  const correct = isRecallCorrect(state.sequence, input, state.difficulty);
  const finished = state.round === ROUNDS - 1;
  return {
    state: { ...state, input, phase: finished ? 'finished' : 'feedback', history: [...state.history, { span: state.span, correct }] },
    event: { kind: 'completed', tile, step, correct, finished }
  };
}

/** Removes the last tap of the current recall. */
export function undoInput(state: SequenceState): SequenceState {
  if (state.phase !== 'recalling' || state.input.length === 0) return state;
  return { ...state, input: state.input.slice(0, -1) };
}

/** Span of the round that follows the last evaluated one. */
export function upcomingSpan(state: SequenceState): number {
  const last = state.history[state.history.length - 1];
  return last ? nextSpan(last.span, last.correct) : START_SPAN;
}

/** Feedback → the next round, with the staircase span and a fresh sequence. */
export function nextRound(state: SequenceState): SequenceState {
  if (state.phase !== 'feedback') return state;
  const rng = createRngFromState(state.rng);
  const span = upcomingSpan(state);
  const sequence = generateSequence(rng, span);
  return { ...state, rng: rng.state(), round: state.round + 1, span, sequence, phase: 'showing', input: [] };
}

/** Factual session summary (never compared with earlier sessions). */
export function summarize(state: SequenceState): Summary {
  let maxSpan = 0;
  let correctRounds = 0;
  for (const result of state.history) {
    if (!result.correct) continue;
    correctRounds++;
    maxSpan = Math.max(maxSpan, result.span);
  }
  return { maxSpan, correctRounds, rounds: state.history.length };
}

const isTile = (value: unknown): value is number => isInt(value, 0, TILES - 1);
const isDistinct = (values: readonly number[]) => new Set(values).size === values.length;
const isRoundResult = (value: unknown): value is RoundResult =>
  isRecord(value) && isInt(value.span, MIN_SPAN, MAX_SPAN) && typeof value.correct === 'boolean';

/** Structural and cross-field validation of untrusted saves. Never throws. */
export function isValidSequenceState(value: unknown): value is SequenceState {
  if (!isRecord(value)) return false;
  const { seed, difficulty, presentation, rng, round, span, sequence, phase, input, history } = value;
  if (!isUint32(seed) || !isOneOf(difficulty, DIFFICULTIES) || !isOneOf(presentation, PRESENTATIONS) || !isUint32(rng)) return false;
  if (!isInt(round, 0, ROUNDS - 1) || !isOneOf(phase, PHASES) || !isInt(span, MIN_SPAN, MAX_SPAN)) return false;
  if (!isArrayOf(sequence, isTile, span) || !isDistinct(sequence)) return false;
  if (!isArrayOf(input, isTile) || !isDistinct(input) || input.length > span) return false;
  if (!isArrayOf(history, isRoundResult)) return false;

  const evaluated = phase === 'feedback' || phase === 'finished';
  if (history.length !== round + (evaluated ? 1 : 0)) return false;
  if (phase === 'finished' && round !== ROUNDS - 1) return false;
  if (phase === 'feedback' && round === ROUNDS - 1) return false;
  if (phase === 'showing' && input.length !== 0) return false;
  if (phase === 'recalling' && input.length === span) return false;
  if (evaluated && input.length !== span) return false;

  // The staircase must explain every span, including the current one.
  const spans = spanSchedule(history.map((r) => r.correct));
  if (!history.every((r, i) => r.span === spans[i])) return false;
  if (spans[round] !== span) return false;
  const current = history[round];
  if (current && current.correct !== isRecallCorrect(sequence, input, difficulty)) return false;

  // Replay the generator: the sequence and PRNG state must follow from the seed.
  const replay = createRng(seed);
  let generated: number[] = [];
  for (let r = 0; r <= round; r++) generated = generateSequence(replay, spans[r] as number);
  return replay.state() === rng && generated.every((tile, i) => sequence[i] === tile);
}
