/**
 * Pure, DOM-free rules for the code-breaking game (id `mastermind`).
 *
 * A code is an array of symbol indices (0-based). The player submits guesses and
 * receives feedback: `exact` (right symbol, right place) and `partial` (right symbol,
 * wrong place). All state transitions are immutable and return the same object when
 * nothing changed, so callers can cheaply detect real changes.
 */
import { createRng, isArrayOf, isInt, isOneOf, isRecord, isUint32 } from '@wp/game-core';

export const MAX_GUESSES = 10;
/** Largest symbol alphabet used by any difficulty (keyboard digits 1–8). */
export const MAX_SYMBOLS = 8;

export const DIFFICULTIES = ['easy', 'standard', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'standard';

export interface CodeConfig {
  readonly positions: number;
  readonly symbols: number;
  /** Whether the secret (and thus every candidate code) may contain a symbol more than once. */
  readonly repeats: boolean;
}

export const CONFIGS: Readonly<Record<Difficulty, CodeConfig>> = {
  easy: { positions: 4, symbols: 6, repeats: false },
  standard: { positions: 4, symbols: 6, repeats: true },
  hard: { positions: 5, symbols: 8, repeats: true }
};

export type Code = readonly number[];

export interface Feedback {
  readonly exact: number;
  readonly partial: number;
}

export interface HistoryEntry {
  readonly code: Code;
  readonly feedback: Feedback;
}

export interface MastermindState {
  seed: number;
  difficulty: Difficulty;
  secret: number[];
  /** Submitted guesses in order. Feedback is derived from `secret`. */
  guesses: number[][];
  /** The guess being composed; `null` marks an empty position. Persisted so closing mid-entry loses nothing. */
  draft: (number | null)[];
  /** Position that receives the next chosen symbol. */
  cursor: number;
}

export type GameStatus = 'playing' | 'won' | 'lost';

export function isDifficulty(value: unknown): value is Difficulty {
  return isOneOf(value, DIFFICULTIES);
}

export function toDifficulty(value: string | undefined): Difficulty {
  return isDifficulty(value) ? value : DEFAULT_DIFFICULTY;
}

/** Feedback for `guess` against `secret`. Symmetric in its arguments. */
export function scoreGuess(secret: Code, guess: Code): Feedback {
  if (secret.length !== guess.length) throw new RangeError('Secret and guess must have the same length.');
  let exact = 0;
  const secretRest = new Map<number, number>();
  const guessRest = new Map<number, number>();
  for (let i = 0; i < secret.length; i++) {
    const s = secret[i] as number;
    const g = guess[i] as number;
    if (s === g) exact++;
    else {
      secretRest.set(s, (secretRest.get(s) ?? 0) + 1);
      guessRest.set(g, (guessRest.get(g) ?? 0) + 1);
    }
  }
  let partial = 0;
  for (const [symbol, count] of guessRest) partial += Math.min(count, secretRest.get(symbol) ?? 0);
  return { exact, partial };
}

export function sameFeedback(a: Feedback, b: Feedback): boolean {
  return a.exact === b.exact && a.partial === b.partial;
}

export function sameCode(a: Code, b: Code): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i]);
}

/** True if `code` is a possible secret under `config` (length, symbol range and repeat rule). */
export function isCodeAllowed(config: CodeConfig, code: readonly unknown[]): boolean {
  if (code.length !== config.positions) return false;
  if (!code.every((symbol) => isInt(symbol, 0, config.symbols - 1))) return false;
  return config.repeats || new Set(code).size === code.length;
}

/** The secret for a seed and difficulty. Deterministic: same inputs, same code. */
export function generateSecret(seed: number, difficulty: Difficulty): number[] {
  const config = CONFIGS[difficulty];
  const rng = createRng(seed);
  if (!config.repeats) {
    const alphabet = Array.from({ length: config.symbols }, (_, i) => i);
    return rng.shuffle(alphabet).slice(0, config.positions);
  }
  return Array.from({ length: config.positions }, () => rng.int(0, config.symbols - 1));
}

/** Calls `visit` for every allowed code of `config` in lexicographic order. The array passed is reused. */
export function forEachCode(config: CodeConfig, visit: (code: Code) => void): void {
  const code: number[] = new Array<number>(config.positions).fill(0);
  for (;;) {
    if (config.repeats || new Set(code).size === code.length) visit(code);
    let i = config.positions - 1;
    while (i >= 0 && code[i] === config.symbols - 1) {
      code[i] = 0;
      i--;
    }
    if (i < 0) return;
    code[i] = (code[i] as number) + 1;
  }
}

/** Index of the first history entry that contradicts `candidate` being the secret, or -1. */
export function firstContradiction(candidate: Code, history: readonly HistoryEntry[]): number {
  return history.findIndex((entry) => !sameFeedback(scoreGuess(candidate, entry.code), entry.feedback));
}

export function isConsistent(candidate: Code, history: readonly HistoryEntry[]): boolean {
  return firstContradiction(candidate, history) === -1;
}

/** Number of allowed codes that agree with every piece of feedback so far (brute force). */
export function countConsistent(config: CodeConfig, history: readonly HistoryEntry[]): number {
  let count = 0;
  forEachCode(config, (code) => {
    if (isConsistent(code, history)) count++;
  });
  return count;
}

export type DraftCheck =
  | { readonly verdict: 'incomplete' | 'consistent' | 'repeats'; readonly remaining: number }
  | {
      readonly verdict: 'contradicts';
      readonly remaining: number;
      /** 0-based index of the first contradicted guess. */
      readonly guessIndex: number;
      /** Feedback that guess would have received if the draft were the secret. */
      readonly wouldGet: Feedback;
    };

/**
 * The user-invoked consistency helper: could the draft still be the secret, and how many
 * codes remain possible? Never reveals the secret itself.
 */
export function checkDraft(config: CodeConfig, history: readonly HistoryEntry[], draft: readonly (number | null)[]): DraftCheck {
  const remaining = countConsistent(config, history);
  if (draft.some((symbol) => symbol === null)) return { verdict: 'incomplete', remaining };
  const code = draft as Code;
  if (!config.repeats && new Set(code).size !== code.length) return { verdict: 'repeats', remaining };
  const guessIndex = firstContradiction(code, history);
  if (guessIndex === -1) return { verdict: 'consistent', remaining };
  const entry = history[guessIndex] as HistoryEntry;
  return { verdict: 'contradicts', remaining, guessIndex, wouldGet: scoreGuess(code, entry.code) };
}

// --- Game state -------------------------------------------------------------------------

export function createInitialState(seed: number, difficulty: Difficulty = DEFAULT_DIFFICULTY): MastermindState {
  const positions = CONFIGS[difficulty].positions;
  return {
    seed: seed >>> 0,
    difficulty,
    secret: generateSecret(seed, difficulty),
    guesses: [],
    draft: new Array<number | null>(positions).fill(null),
    cursor: 0
  };
}

export function configOf(state: MastermindState): CodeConfig {
  return CONFIGS[state.difficulty];
}

export function historyOf(state: MastermindState): HistoryEntry[] {
  return state.guesses.map((code) => ({ code, feedback: scoreGuess(state.secret, code) }));
}

export function gameStatus(state: MastermindState): GameStatus {
  const last = state.guesses[state.guesses.length - 1];
  if (last && sameCode(last, state.secret)) return 'won';
  return state.guesses.length >= MAX_GUESSES ? 'lost' : 'playing';
}

export function isDraftComplete(state: MastermindState): boolean {
  return state.draft.every((symbol) => symbol !== null);
}

export function canSubmit(state: MastermindState): boolean {
  return gameStatus(state) === 'playing' && isDraftComplete(state);
}

/** Next position after `from` (wrapping) that is still empty; `from + 1` (clamped) if all are filled. */
function nextCursor(draft: readonly (number | null)[], from: number): number {
  for (let step = 1; step < draft.length; step++) {
    const i = (from + step) % draft.length;
    if (draft[i] === null) return i;
  }
  return Math.min(from + 1, draft.length - 1);
}

/** Puts `symbol` at the cursor position and advances the cursor to the next empty position. */
export function placeSymbol(state: MastermindState, symbol: number): MastermindState {
  if (gameStatus(state) !== 'playing' || !isInt(symbol, 0, configOf(state).symbols - 1)) return state;
  const draft = [...state.draft];
  draft[state.cursor] = symbol;
  return { ...state, draft, cursor: nextCursor(draft, state.cursor) };
}

export function setCursor(state: MastermindState, position: number): MastermindState {
  if (gameStatus(state) !== 'playing' || !isInt(position, 0, state.draft.length - 1) || position === state.cursor) return state;
  return { ...state, cursor: position };
}

/** Backspace: clears the cursor position, or if it is already empty, steps back and clears that one. */
export function clearSlot(state: MastermindState): MastermindState {
  if (gameStatus(state) !== 'playing') return state;
  let cursor = state.cursor;
  if (state.draft[cursor] === null) {
    if (cursor === 0) return state;
    cursor--;
  }
  const draft = [...state.draft];
  draft[cursor] = null;
  return { ...state, draft, cursor };
}

export function clearDraft(state: MastermindState): MastermindState {
  if (gameStatus(state) !== 'playing' || (state.cursor === 0 && state.draft.every((s) => s === null))) return state;
  return { ...state, draft: state.draft.map(() => null), cursor: 0 };
}

export function submitGuess(state: MastermindState): MastermindState {
  if (!canSubmit(state)) return state;
  return {
    ...state,
    guesses: [...state.guesses, state.draft as number[]],
    draft: state.draft.map(() => null),
    cursor: 0
  };
}

/** Thorough structural validation of untrusted saved data. Never throws. */
export function isMastermindState(value: unknown): value is MastermindState {
  try {
    if (!isRecord(value)) return false;
    const { seed, difficulty, secret, guesses, draft, cursor } = value;
    if (!isUint32(seed) || !isDifficulty(difficulty)) return false;
    const config = CONFIGS[difficulty];
    const isSymbol = (v: unknown): v is number => isInt(v, 0, config.symbols - 1);
    if (!isArrayOf(secret, isSymbol, config.positions) || !sameCode(secret, generateSecret(seed, difficulty))) return false;
    if (!Array.isArray(guesses) || guesses.length > MAX_GUESSES) return false;
    for (let i = 0; i < guesses.length; i++) {
      const guess: unknown = guesses[i];
      if (!isArrayOf(guess, isSymbol, config.positions)) return false;
      // The game ends with a correct guess, so only the last one may equal the secret.
      if (i < guesses.length - 1 && sameCode(guess, secret)) return false;
    }
    if (!isArrayOf(draft, (v): v is number | null => v === null || isSymbol(v), config.positions)) return false;
    if (!isInt(cursor, 0, config.positions - 1)) return false;
    const state = value as unknown as MastermindState;
    if (gameStatus(state) !== 'playing' && (cursor !== 0 || draft.some((v) => v !== null))) return false;
    return true;
  } catch {
    return false;
  }
}
