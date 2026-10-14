import { createRng, isArrayOf, isInt, isOneOf, isRecord, isUint32 } from '@wp/game-core';

/**
 * Stay on Task (Distractor Control): sort a calm, self-paced stream of numbers into even
 * and odd while mild, clearly announced "tempting" extras appear next to the task. The
 * correct action for every extra is to ignore it.
 *
 * The whole session (numbers, which items carry an extra, its kind and position) is derived
 * from the seed, so the logical state only stores the seed, the current item, the answers
 * and the items whose extra was tapped. No timers are involved at all.
 */

export const DIFFICULTIES = ['calm', 'busy'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'calm';

/** Fixed session: 40 numbers, about 3 minutes at the player's own pace. */
export const ITEM_COUNT = 40;
export const SESSION_MINUTES = 3;
/** Number of items that carry a distractor, per difficulty (exact, not random). */
export const DISTRACTOR_COUNTS: Readonly<Record<Difficulty, number>> = { calm: 10, busy: 20 };
/** The first items never carry a distractor, so the player can settle in. */
export const LEAD_IN = 2;
export const MIN_VALUE = 10;
export const MAX_VALUE = 99;

export const CHOICES = ['even', 'odd'] as const;
export type Choice = (typeof CHOICES)[number];

export const DISTRACTOR_KINDS = ['bonus', 'message', 'tapHere', 'badge', 'offer'] as const;
export type DistractorKind = (typeof DISTRACTOR_KINDS)[number];
/** Reserved positions around the task, so an appearing extra never shifts the layout. */
export const SLOTS = ['aboveStart', 'aboveEnd', 'belowStart', 'belowEnd'] as const;
export type Slot = (typeof SLOTS)[number];

export interface Distractor {
  readonly kind: DistractorKind;
  readonly slot: Slot;
}

export interface Item {
  readonly value: number;
  readonly correct: Choice;
  readonly distractor: Distractor | null;
}

export const PHASES = ['ready', 'running', 'finished'] as const;
export type Phase = (typeof PHASES)[number];

export interface DistractorState {
  seed: number;
  difficulty: Difficulty;
  phase: Phase;
  /** Current item while running; 0 when ready; ITEM_COUNT when finished. */
  index: number;
  /** answers[i] is the answer given to item i (length === index). */
  answers: Choice[];
  /** Indices of items whose distractor was tapped, strictly increasing. */
  captured: number[];
}

export interface DistractorScore {
  answered: number;
  correct: number;
  /** Distractors that have been on screen so far (including the current item's). */
  shown: number;
  /** Distractors that were tapped ("caught your attention"). */
  captured: number;
}

export const toDifficulty = (value: unknown): Difficulty => (isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY);

export const parity = (value: number): Choice => (value % 2 === 0 ? 'even' : 'odd');

/** Deterministically generates the complete item stream for a seed and difficulty. */
export function generateSequence(seed: number, difficulty: Difficulty): Item[] {
  const rng = createRng(seed);
  const candidates = rng.shuffle(Array.from({ length: ITEM_COUNT - LEAD_IN }, (_, i) => i + LEAD_IN));
  const withDistractor = new Set(candidates.slice(0, DISTRACTOR_COUNTS[difficulty]));
  const items: Item[] = [];
  let previousValue = -1;
  let previousKind: DistractorKind | undefined;
  for (let i = 0; i < ITEM_COUNT; i++) {
    let value = rng.int(MIN_VALUE, MAX_VALUE - 1);
    if (value >= previousValue && previousValue >= MIN_VALUE) value++; // never the same number twice in a row
    let distractor: Distractor | null = null;
    if (withDistractor.has(i)) {
      const kind = rng.pick(DISTRACTOR_KINDS.filter((k) => k !== previousKind));
      distractor = { kind, slot: rng.pick(SLOTS) };
      previousKind = kind;
    }
    items.push({ value, correct: parity(value), distractor });
    previousValue = value;
  }
  return items;
}

export function newSession(seed: number, difficulty: Difficulty): DistractorState {
  return { seed: seed >>> 0, difficulty, phase: 'ready', index: 0, answers: [], captured: [] };
}

/** Starts the session at the first item. */
export function startSession(state: DistractorState): DistractorState {
  if (state.phase !== 'ready') return state;
  return { ...state, phase: 'running', index: 0 };
}

/** Answers the current item and moves on (or finishes). Ignored unless running. */
export function answer(state: DistractorState, choice: Choice): DistractorState {
  if (state.phase !== 'running' || !isOneOf(choice, CHOICES)) return state;
  const index = state.index + 1;
  return { ...state, index, answers: [...state.answers, choice], phase: index >= ITEM_COUNT ? 'finished' : 'running' };
}

export const isCaptured = (state: DistractorState, index: number): boolean => state.captured.includes(index);

/** Whether the current item's distractor is on screen (present and not yet tapped). */
export function visibleDistractor(state: DistractorState, sequence: readonly Item[]): Distractor | null {
  if (state.phase !== 'running') return null;
  const distractor = sequence[state.index]?.distractor ?? null;
  return distractor && !isCaptured(state, state.index) ? distractor : null;
}

/** Records a tap on the current item's distractor (at most once per item). */
export function tapDistractor(state: DistractorState, sequence: readonly Item[]): DistractorState {
  if (!visibleDistractor(state, sequence)) return state;
  return { ...state, captured: [...state.captured, state.index] };
}

/** Factual summary of a (partial or complete) session. */
export function score(state: DistractorState, sequence: readonly Item[]): DistractorScore {
  let correct = 0;
  state.answers.forEach((choice, i) => {
    if (sequence[i]?.correct === choice) correct++;
  });
  const seen = state.phase === 'running' ? state.index + 1 : state.index;
  let shown = 0;
  for (let i = 0; i < seen; i++) if (sequence[i]?.distractor) shown++;
  return { answered: state.answers.length, correct, shown, captured: state.captured.length };
}

const isChoice = (value: unknown): value is Choice => isOneOf(value, CHOICES);
const isIndex = (value: unknown): value is number => isInt(value, 0, ITEM_COUNT - 1);

/** Structural validation of untrusted persisted data. Never throws. */
export function isValidDistractorState(value: unknown): value is DistractorState {
  if (!isRecord(value)) return false;
  if (!isUint32(value.seed) || !isOneOf(value.difficulty, DIFFICULTIES) || !isOneOf(value.phase, PHASES)) return false;
  if (!isInt(value.index, 0, ITEM_COUNT) || !isArrayOf(value.answers, isChoice) || !isArrayOf(value.captured, isIndex)) return false;
  const { index, phase, answers, captured } = value;
  if (answers.length !== index) return false;
  if (phase === 'ready' && (index !== 0 || captured.length > 0)) return false;
  if (phase === 'running' && index >= ITEM_COUNT) return false;
  if (phase === 'finished' && index !== ITEM_COUNT) return false;
  if (captured.length === 0) return true;
  const sequence = generateSequence(value.seed, value.difficulty);
  let last = -1;
  for (const i of captured) {
    if (i <= last || i > index || !sequence[i]?.distractor) return false;
    last = i;
  }
  return true;
}
