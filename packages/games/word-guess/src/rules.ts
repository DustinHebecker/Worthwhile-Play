/**
 * Pure, DOM-free rules for the word-guessing game (id `word-guess`).
 *
 * The answer is chosen deterministically from the seed (the host's "game number"),
 * the word language and the word length. Guesses are any strings of letters of the
 * language's alphabet with the right length: there is deliberately no dictionary gate.
 * All transitions are immutable and return the same object when nothing changed.
 */
import { createRng, isArrayOf, isInt, isOneOf, isRecord, isUint32 } from '@wp/game-core';
import { isLetter, isWordLanguage, wordList, type WordLanguage, type WordLength } from './words';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

export interface DifficultyConfig {
  readonly length: WordLength;
  readonly tries: number;
}

/** easy: 5 letters, 7 tries · medium: 5 letters, 6 tries · hard: 6 letters, 6 tries. */
export const CONFIGS: Readonly<Record<Difficulty, DifficultyConfig>> = {
  easy: { length: 5, tries: 7 },
  medium: { length: 5, tries: 6 },
  hard: { length: 6, tries: 6 }
};

export const LAYOUTS = ['familiar', 'large'] as const;
export type KeyboardLayout = (typeof LAYOUTS)[number];

/** Letter feedback: right place / in the word elsewhere / not (or no more often) in the word. */
export type Mark = 'hit' | 'near' | 'miss';
export type GameStatus = 'playing' | 'won' | 'lost';

export interface Options {
  language: WordLanguage;
  /** "Strict mode": every revealed hint must be used in later guesses. */
  strict: boolean;
  layout: KeyboardLayout;
}

export interface WordGuessState extends Options {
  seed: number;
  difficulty: Difficulty;
  /** Index of the answer in `wordList(language, length)`; derived from the seed (checked on load). */
  answer: number;
  /** Submitted guesses, lowercase. */
  guesses: string[];
  /** Letters typed for the next guess. Persisted so closing mid-word loses nothing. */
  input: string;
}

export type SubmitError =
  | { kind: 'finished' }
  | { kind: 'short'; needed: number }
  | { kind: 'strict-position'; position: number; letter: string }
  | { kind: 'strict-contains'; letter: string };

export interface SubmitResult {
  state: WordGuessState;
  error?: SubmitError;
}

export const DEFAULT_OPTIONS: Options = { language: 'en', strict: false, layout: 'familiar' };

export function isDifficulty(value: unknown): value is Difficulty {
  return isOneOf(value, DIFFICULTIES);
}

export function toDifficulty(value: string | undefined): Difficulty {
  return isDifficulty(value) ? value : DEFAULT_DIFFICULTY;
}

export function configOf(state: Pick<WordGuessState, 'difficulty'>): DifficultyConfig {
  return CONFIGS[state.difficulty];
}

/** Deterministic answer index for a seed, language and word length. */
export function pickAnswer(seed: number, language: WordLanguage, length: WordLength): number {
  return createRng(seed).int(0, wordList(language, length).length - 1);
}

export function answerOf(state: Pick<WordGuessState, 'language' | 'difficulty' | 'answer'>): string {
  return wordList(state.language, CONFIGS[state.difficulty].length)[state.answer] ?? '';
}

export function createInitialState(seed: number, difficulty: Difficulty = DEFAULT_DIFFICULTY, options: Options = DEFAULT_OPTIONS): WordGuessState {
  const normalizedSeed = Math.trunc(seed) >>> 0;
  return {
    seed: normalizedSeed,
    difficulty,
    language: options.language,
    strict: options.strict,
    layout: options.layout,
    answer: pickAnswer(normalizedSeed, options.language, CONFIGS[difficulty].length),
    guesses: [],
    input: ''
  };
}

/** Same seed and difficulty, current options, no guesses. */
export function restart(state: WordGuessState): WordGuessState {
  return createInitialState(state.seed, state.difficulty, optionsOf(state));
}

export function optionsOf(state: WordGuessState): Options {
  return { language: state.language, strict: state.strict, layout: state.layout };
}

/**
 * Feedback for `guess` against `answer` (standard two-pass algorithm): first every exact
 * match is a hit; then, left to right, a letter is "near" only while the answer still has
 * unmatched copies of it. Extra copies of a letter are misses.
 */
export function scoreGuess(guess: string, answer: string): Mark[] {
  if (guess.length !== answer.length) throw new RangeError('Guess and answer must have the same length.');
  const marks: Mark[] = [];
  const unmatched = new Map<string, number>();
  for (let i = 0; i < answer.length; i++) {
    const a = answer.charAt(i);
    if (guess.charAt(i) === a) marks.push('hit');
    else {
      marks.push('miss');
      unmatched.set(a, (unmatched.get(a) ?? 0) + 1);
    }
  }
  for (let i = 0; i < guess.length; i++) {
    if (marks[i] === 'hit') continue;
    const g = guess.charAt(i);
    const left = unmatched.get(g) ?? 0;
    if (left > 0) {
      marks[i] = 'near';
      unmatched.set(g, left - 1);
    }
  }
  return marks;
}

export function statusOf(state: WordGuessState): GameStatus {
  const last = state.guesses[state.guesses.length - 1];
  if (last !== undefined && last === answerOf(state)) return 'won';
  return state.guesses.length >= configOf(state).tries ? 'lost' : 'playing';
}

export function historyOf(state: WordGuessState): { word: string; marks: Mark[] }[] {
  const answer = answerOf(state);
  return state.guesses.map((word) => ({ word, marks: scoreGuess(word, answer) }));
}

const RANK: Readonly<Record<Mark, number>> = { miss: 1, near: 2, hit: 3 };

/** Best known feedback per letter over all guesses (for the on-screen keyboard). */
export function letterStatus(state: WordGuessState): Map<string, Mark> {
  const status = new Map<string, Mark>();
  for (const { word, marks } of historyOf(state)) {
    marks.forEach((mark, i) => {
      const letter = word.charAt(i);
      const known = status.get(letter);
      if (known === undefined || RANK[mark] > RANK[known]) status.set(letter, mark);
    });
  }
  return status;
}

const countOf = (word: string, letter: string): number => [...word].filter((c) => c === letter).length;

/**
 * Strict mode: every hit must stay in place and every revealed letter (hit or near) must be
 * reused at least as often as it was revealed in a single earlier guess. Returns the first
 * violation (position checks before letter checks) or `undefined`.
 */
export function strictViolation(history: readonly { word: string; marks: readonly Mark[] }[], guess: string): SubmitError | undefined {
  for (const { word, marks } of history) {
    for (let i = 0; i < marks.length; i++) {
      if (marks[i] === 'hit' && guess.charAt(i) !== word.charAt(i)) return { kind: 'strict-position', position: i, letter: word.charAt(i) };
    }
  }
  for (const { word, marks } of history) {
    const revealed = new Map<string, number>();
    marks.forEach((mark, i) => {
      if (mark !== 'miss') revealed.set(word.charAt(i), (revealed.get(word.charAt(i)) ?? 0) + 1);
    });
    for (const [letter, needed] of revealed) if (countOf(guess, letter) < needed) return { kind: 'strict-contains', letter };
  }
  return undefined;
}

export function typeLetter(state: WordGuessState, letter: string): WordGuessState {
  const normalized = letter.normalize('NFC').toLocaleLowerCase(state.language);
  if (statusOf(state) !== 'playing' || state.input.length >= configOf(state).length || !isLetter(state.language, normalized)) return state;
  return { ...state, input: state.input + normalized };
}

export function deleteLetter(state: WordGuessState): WordGuessState {
  if (statusOf(state) !== 'playing' || state.input.length === 0) return state;
  return { ...state, input: state.input.slice(0, -1) };
}

export function submitGuess(state: WordGuessState): SubmitResult {
  if (statusOf(state) !== 'playing') return { state, error: { kind: 'finished' } };
  const { length } = configOf(state);
  if (state.input.length < length) return { state, error: { kind: 'short', needed: length } };
  if (state.strict) {
    const violation = strictViolation(historyOf(state), state.input);
    if (violation) return { state, error: violation };
  }
  return { state: { ...state, guesses: [...state.guesses, state.input], input: '' } };
}

/** Switching the word language starts this game number afresh in the new language. */
export function setLanguage(state: WordGuessState, language: WordLanguage): WordGuessState {
  if (language === state.language) return state;
  return createInitialState(state.seed, state.difficulty, { ...optionsOf(state), language });
}

export function setStrict(state: WordGuessState, strict: boolean): WordGuessState {
  return strict === state.strict ? state : { ...state, strict };
}

export function setLayout(state: WordGuessState, layout: KeyboardLayout): WordGuessState {
  return layout === state.layout ? state : { ...state, layout };
}

const isWordOf = (language: WordLanguage, length: number) => (value: unknown): value is string =>
  typeof value === 'string' && value.length === length && [...value].every((c) => isLetter(language, c));

/** Thorough structural validation of untrusted saved data. Never throws. */
export function isWordGuessState(value: unknown): value is WordGuessState {
  try {
    if (!isRecord(value)) return false;
    const { seed, difficulty, language, strict, layout, answer, guesses, input } = value;
    if (!isUint32(seed) || !isDifficulty(difficulty) || !isWordLanguage(language)) return false;
    if (typeof strict !== 'boolean' || !isOneOf(layout, LAYOUTS)) return false;
    const { length, tries } = CONFIGS[difficulty];
    if (!isInt(answer, 0, wordList(language, length).length - 1) || answer !== pickAnswer(seed, language, length)) return false;
    if (!isArrayOf(guesses, isWordOf(language, length)) || guesses.length > tries) return false;
    if (typeof input !== 'string' || input.length > length || ![...input].every((c) => isLetter(language, c))) return false;
    const word = wordList(language, length)[answer];
    // Only the last guess may be the answer: play stops once the word is found.
    if (guesses.slice(0, -1).includes(word as string)) return false;
    const finished = guesses.length === tries || guesses[guesses.length - 1] === word;
    return !(finished && input.length > 0);
  } catch {
    return false;
  }
}
