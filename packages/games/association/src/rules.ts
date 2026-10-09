import { createRng, isArrayOf, isInt, isOneOf, isRecord, isUint32, type Rng } from '@wp/game-core';

/**
 * Vivid Links (association / mnemonic practice): the person studies picture pairs one at a time,
 * at their own pace, imagining the two pictures together in one vivid scene (and may jot the idea
 * down). After an optional short, untimed counting break, each pair is asked once: one picture is
 * shown and its partner is chosen from a few options.
 *
 * The whole round (pairs, counting breaks, questions and options) is generated from the seed at the
 * start and stored in the state, so a save stays valid even if the picture collection grows later.
 * This module is pure and DOM-free; picture names and emoji come from the view.
 */

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

/**
 * Where the wrong options come from:
 * - unstudied: pictures that were not part of this round (recognising the pictures is enough to rule them out);
 * - studied: partners from other pairs of this round (the specific link must be remembered);
 * - similar: other pictures of this round, those of the answer's category first (closest look-alikes).
 */
export const DISTRACTOR_KINDS = ['unstudied', 'studied', 'similar'] as const;
export type DistractorKind = (typeof DISTRACTOR_KINDS)[number];

export interface DifficultyConfig {
  readonly pairs: number;
  /** Options per question, including the answer. */
  readonly options: number;
  readonly distractors: DistractorKind;
  /** Counting breaks between learning and recall (0 = none). */
  readonly fillers: number;
  /** Whether the question can show the right-hand picture and ask for the left one. */
  readonly bothDirections: boolean;
}

export const CONFIGS: Readonly<Record<Difficulty, DifficultyConfig>> = {
  easy: { pairs: 5, options: 3, distractors: 'unstudied', fillers: 0, bothDirections: false },
  medium: { pairs: 8, options: 4, distractors: 'studied', fillers: 2, bothDirections: true },
  hard: { pairs: 12, options: 5, distractors: 'similar', fillers: 3, bothDirections: true }
};

export const CATEGORIES = ['food', 'animal', 'nature', 'thing'] as const;
export type Category = (typeof CATEGORIES)[number];

/**
 * The pictures used by this exercise (ids of the built-in "First words" deck, which provides the
 * emoji and the names in all UI languages) with a coarse category for similar distractors.
 */
export const ITEM_CATEGORIES: Readonly<Record<string, Category>> = {
  apple: 'food',
  banana: 'food',
  grapes: 'food',
  strawberry: 'food',
  lemon: 'food',
  cherry: 'food',
  pear: 'food',
  carrot: 'food',
  tomato: 'food',
  bread: 'food',
  cheese: 'food',
  egg: 'food',
  milk: 'food',
  cake: 'food',
  cup: 'food',
  dog: 'animal',
  cat: 'animal',
  horse: 'animal',
  cow: 'animal',
  pig: 'animal',
  fish: 'animal',
  bird: 'animal',
  mouse: 'animal',
  rabbit: 'animal',
  elephant: 'animal',
  lion: 'animal',
  bear: 'animal',
  frog: 'animal',
  snake: 'animal',
  butterfly: 'animal',
  tree: 'nature',
  flower: 'nature',
  sun: 'nature',
  moon: 'nature',
  star: 'nature',
  cloud: 'nature',
  fire: 'nature',
  mountain: 'nature',
  house: 'thing',
  car: 'thing',
  bicycle: 'thing',
  train: 'thing',
  airplane: 'thing',
  book: 'thing',
  key: 'thing',
  clock: 'thing',
  chair: 'thing',
  bed: 'thing',
  door: 'thing',
  ball: 'thing',
  hat: 'thing',
  shoe: 'thing',
  umbrella: 'thing',
  glasses: 'thing',
  pencil: 'thing',
  scissors: 'thing',
  guitar: 'thing',
  bell: 'thing',
  heart: 'thing',
  candle: 'thing'
};

export const ITEM_IDS: readonly string[] = Object.keys(ITEM_CATEGORIES);

export const isItemId = (value: unknown): value is string => typeof value === 'string' && Object.hasOwn(ITEM_CATEGORIES, value);

export const categoryOf = (id: string): Category | undefined => (isItemId(id) ? ITEM_CATEGORIES[id] : undefined);

/** Shapes of the neutral counting break. */
export const FILLER_SHAPES = ['circle', 'square', 'triangle'] as const;
export type FillerShape = (typeof FILLER_SHAPES)[number];
/** Shapes per counting break. */
export const FILLER_SIZE = 10;
/** The counted shape appears MIN..MAX times; the answer buttons are 1..MAX. */
export const FILLER_MIN_COUNT = 2;
export const FILLER_MAX_COUNT = 6;

export interface FillerRound {
  shapes: FillerShape[];
  target: FillerShape;
}

/** 0: the left picture is shown and its right partner is asked; 1: the reverse. */
export type CueSide = 0 | 1;

export interface Question {
  /** Index into `pairs`. */
  pair: number;
  cueSide: CueSide;
  /** Item ids offered as answers (distinct, contains the answer, never the cue). */
  options: string[];
}

export const PHASES = ['learn', 'filler', 'recall', 'finished'] as const;
export type Phase = (typeof PHASES)[number];

export interface AssociationState {
  seed: number;
  difficulty: Difficulty;
  phase: Phase;
  /** learn: pair shown; filler: break shown; recall: question shown; finished: number of questions. */
  index: number;
  pairs: [string, string][];
  /** The person's own association per pair (plain text, may be empty). */
  notes: string[];
  fillers: FillerRound[];
  /** Count chosen in each finished break. */
  fillerAnswers: number[];
  questions: Question[];
  /** Item id chosen for each answered question. */
  answers: string[];
}

export const NOTE_MAX = 140;

/**
 * Plain-text note: control characters (including line breaks and tabs) become spaces, and the text is
 * cut to NOTE_MAX code points (never splitting a character). Idempotent; never throws.
 */
export function sanitizeNote(value: unknown): string {
  if (typeof value !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  const plain = value.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, ' ');
  const chars = Array.from(plain);
  return chars.length > NOTE_MAX ? chars.slice(0, NOTE_MAX).join('') : plain;
}

export const toDifficulty = (value: unknown): Difficulty => (isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY);

export const cueOf = (state: Pick<AssociationState, 'pairs'>, question: Question): string =>
  (state.pairs[question.pair] as [string, string])[question.cueSide];

export const answerOf = (state: Pick<AssociationState, 'pairs'>, question: Question): string =>
  (state.pairs[question.pair] as [string, string])[question.cueSide === 0 ? 1 : 0];

/** Draws `count` distinct pairs of distinct pictures. */
export function generatePairs(rng: Rng, count: number): [string, string][] {
  if (count * 2 > ITEM_IDS.length) throw new RangeError('Not enough pictures.');
  const items = rng.shuffle(ITEM_IDS).slice(0, count * 2);
  return Array.from({ length: count }, (_, i) => [items[2 * i] as string, items[2 * i + 1] as string]);
}

/** The wrong options for one question (see DistractorKind); never the cue or the answer, all distinct. */
export function pickDistractors(rng: Rng, pairs: readonly (readonly [string, string])[], pair: number, cueSide: CueSide, kind: DistractorKind, count: number): string[] {
  const own = pairs[pair] as readonly [string, string];
  const answer = own[1 - cueSide] as string;
  const studied = new Set(pairs.flat());
  let candidates: string[];
  if (kind === 'unstudied') candidates = rng.shuffle(ITEM_IDS.filter((id) => !studied.has(id)));
  else if (kind === 'studied') candidates = rng.shuffle(pairs.filter((_, q) => q !== pair).map((p) => p[1 - cueSide] as string));
  else {
    const others = pairs.flat().filter((id) => !own.includes(id));
    const category = categoryOf(answer);
    const same = rng.shuffle(others.filter((id) => categoryOf(id) === category));
    const rest = rng.shuffle(others.filter((id) => categoryOf(id) !== category));
    candidates = [...same, ...rest];
  }
  if (candidates.length < count) throw new RangeError('Not enough distractors.');
  return candidates.slice(0, count);
}

/** One counting break: FILLER_SIZE shapes, the target shape appearing FILLER_MIN_COUNT..FILLER_MAX_COUNT times. */
export function generateFiller(rng: Rng): FillerRound {
  const target = rng.pick(FILLER_SHAPES);
  const count = rng.int(FILLER_MIN_COUNT, FILLER_MAX_COUNT);
  const others = FILLER_SHAPES.filter((shape) => shape !== target);
  const shapes: FillerShape[] = Array.from({ length: FILLER_SIZE }, (_, i) => (i < count ? target : rng.pick(others)));
  return { shapes: rng.shuffle(shapes), target };
}

export const countOf = (round: FillerRound): number => round.shapes.filter((shape) => shape === round.target).length;

/** Deterministically generates a complete round for the seed and difficulty. */
export function newRound(seed: number, difficulty: Difficulty): AssociationState {
  const config = CONFIGS[difficulty];
  const rng = createRng(seed);
  const pairs = generatePairs(rng, config.pairs);
  const fillers = Array.from({ length: config.fillers }, () => generateFiller(rng));
  const questions: Question[] = rng.shuffle(pairs.map((_, i) => i)).map((pair) => {
    const cueSide: CueSide = config.bothDirections && rng.int(0, 1) === 1 ? 1 : 0;
    const answer = (pairs[pair] as [string, string])[1 - cueSide] as string;
    const distractors = pickDistractors(rng, pairs, pair, cueSide, config.distractors, config.options - 1);
    return { pair, cueSide, options: rng.shuffle([answer, ...distractors]) };
  });
  return {
    seed: seed >>> 0,
    difficulty,
    phase: 'learn',
    index: 0,
    pairs,
    notes: pairs.map(() => ''),
    fillers,
    fillerAnswers: [],
    questions,
    answers: []
  };
}

/** The phase that follows learning: the counting break if there is one, else recall. */
const afterLearning = (state: AssociationState): Phase => (state.fillers.length > 0 ? 'filler' : 'recall');

/** Learning: show the next pair, or move on after the last one. */
export function nextPair(state: AssociationState): AssociationState {
  if (state.phase !== 'learn') return state;
  if (state.index < state.pairs.length - 1) return { ...state, index: state.index + 1 };
  return { ...state, phase: afterLearning(state), index: 0 };
}

/** Learning: show the previous pair again. */
export function previousPair(state: AssociationState): AssociationState {
  if (state.phase !== 'learn' || state.index === 0) return state;
  return { ...state, index: state.index - 1 };
}

/** Learning: stores the (sanitized) note of the pair shown. */
export function setNote(state: AssociationState, text: unknown): AssociationState {
  if (state.phase !== 'learn') return state;
  const note = sanitizeNote(text);
  if (state.notes[state.index] === note) return state;
  const notes = [...state.notes];
  notes[state.index] = note;
  return { ...state, notes };
}

/** Counting break: records the chosen count (any of the offered 1..FILLER_MAX_COUNT) and moves on. */
export function answerFiller(state: AssociationState, count: number): AssociationState {
  if (state.phase !== 'filler' || !isInt(count, 1, FILLER_MAX_COUNT)) return state;
  const fillerAnswers = [...state.fillerAnswers, count];
  if (fillerAnswers.length < state.fillers.length) return { ...state, fillerAnswers, index: state.index + 1 };
  return { ...state, fillerAnswers, phase: 'recall', index: 0 };
}

/** Recall: chooses one of the offered options for the question shown. */
export function answerQuestion(state: AssociationState, itemId: string): AssociationState {
  if (state.phase !== 'recall') return state;
  const question = state.questions[state.index] as Question;
  if (!question.options.includes(itemId)) return state;
  const answers = [...state.answers, itemId];
  const done = answers.length >= state.questions.length;
  return { ...state, answers, index: state.index + 1, phase: done ? 'finished' : 'recall' };
}

export interface AssociationScore {
  answered: number;
  correct: number;
  total: number;
  fillerCorrect: number;
  fillerTotal: number;
}

export function score(state: AssociationState): AssociationScore {
  let correct = 0;
  state.answers.forEach((answer, i) => {
    if (answer === answerOf(state, state.questions[i] as Question)) correct++;
  });
  let fillerCorrect = 0;
  state.fillerAnswers.forEach((count, i) => {
    if (count === countOf(state.fillers[i] as FillerRound)) fillerCorrect++;
  });
  return { answered: state.answers.length, correct, total: state.questions.length, fillerCorrect, fillerTotal: state.fillers.length };
}

/** Per pair (in pair order): the item chosen for its question, or undefined while unanswered. */
export function answersByPair(state: AssociationState): (string | undefined)[] {
  const result: (string | undefined)[] = state.pairs.map(() => undefined);
  state.answers.forEach((answer, i) => {
    result[(state.questions[i] as Question).pair] = answer;
  });
  return result;
}

// --- validation of untrusted saves ---

const isPair = (value: unknown): value is [string, string] => isArrayOf(value, isItemId, 2) && value[0] !== value[1];
const isNote = (value: unknown): value is string => typeof value === 'string' && sanitizeNote(value) === value;
const isFillerRound = (value: unknown): value is FillerRound => {
  if (!isRecord(value) || !isOneOf(value.target, FILLER_SHAPES)) return false;
  if (!isArrayOf(value.shapes, (s: unknown): s is FillerShape => isOneOf(s, FILLER_SHAPES), FILLER_SIZE)) return false;
  return isInt(countOf(value as unknown as FillerRound), FILLER_MIN_COUNT, FILLER_MAX_COUNT);
};
const isQuestionShape = (value: unknown, pairs: number, options: number): value is Question =>
  isRecord(value) && isInt(value.pair, 0, pairs - 1) && isOneOf(value.cueSide, [0, 1]) && isArrayOf(value.options, isItemId, options);

/** Structural validation of untrusted persisted data. Never throws. */
export function isValidAssociationState(value: unknown): value is AssociationState {
  try {
    if (!isRecord(value)) return false;
    if (!isUint32(value.seed) || !isOneOf(value.difficulty, DIFFICULTIES) || !isOneOf(value.phase, PHASES)) return false;
    const config = CONFIGS[value.difficulty];
    const { pairs, notes, fillers, fillerAnswers, questions, answers, phase, index } = value;
    if (!isArrayOf(pairs, isPair, config.pairs) || new Set(pairs.flat()).size !== config.pairs * 2) return false;
    if (!isArrayOf(notes, isNote, config.pairs)) return false;
    if (!isArrayOf(fillers, isFillerRound, config.fillers)) return false;
    if (!isArrayOf(fillerAnswers, (n: unknown): n is number => isInt(n, 1, FILLER_MAX_COUNT)) || fillerAnswers.length > config.fillers) return false;
    if (!Array.isArray(questions) || questions.length !== config.pairs) return false;
    const asked = new Set<number>();
    for (const q of questions as unknown[]) {
      if (!isQuestionShape(q, config.pairs, config.options)) return false;
      if (!config.bothDirections && q.cueSide !== 0) return false;
      const cue = cueOf({ pairs }, q);
      const answer = answerOf({ pairs }, q);
      if (new Set(q.options).size !== q.options.length || !q.options.includes(answer) || q.options.includes(cue)) return false;
      asked.add(q.pair);
    }
    if (asked.size !== config.pairs) return false;
    if (!isArrayOf(answers, (a: unknown): a is string => typeof a === 'string') || answers.length > config.pairs) return false;
    if (!answers.every((a, i) => (questions as Question[])[i]?.options.includes(a))) return false;
    if (!isInt(index, 0, config.pairs)) return false;
    switch (phase) {
      case 'learn':
        return index < config.pairs && fillerAnswers.length === 0 && answers.length === 0;
      case 'filler':
        return config.fillers > 0 && fillerAnswers.length === index && index < config.fillers && answers.length === 0;
      case 'recall':
        return fillerAnswers.length === config.fillers && answers.length === index && index < config.pairs;
      default:
        return fillerAnswers.length === config.fillers && answers.length === config.pairs && index === config.pairs;
    }
  } catch {
    return false;
  }
}
