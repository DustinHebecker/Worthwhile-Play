import { createRng, isInt, isRecord, isUint32 } from '@wp/game-core';
import { TEXTS } from './content/structure';
import { DIFFICULTIES, type Difficulty, type QuestionStructure, type TextStructure } from './content/types';

export { DIFFICULTIES, type Difficulty } from './content/types';

/**
 * Deep Read rules (pure, DOM-free).
 *
 * Flow: `reading` → `questions` (one at a time; each answered question shows its feedback until
 * `next`) → `summary` (optional one-sentence summary) → `compare` (model sentence + self-check) → `done`.
 * Skipping the summary goes straight from `summary` to `done`.
 *
 * The text may be re-opened while answering. An answer given while the text was open at any time
 * during that question is recorded as "looked back" — a neutral note, never a penalty.
 */
export const PHASES = ['reading', 'questions', 'summary', 'compare', 'done'] as const;
export type Phase = (typeof PHASES)[number];

export const SUMMARY_MAX = 240;
export const SELF_CHECK_ITEMS = 3;

export interface DeepReadState {
  seed: number;
  difficulty: Difficulty;
  textId: string;
  phase: Phase;
  /** Index of the question on screen (questions phase); the last index afterwards. */
  cursor: number;
  /** Chosen option ids, in question order. `answers.length === cursor + 1` means feedback is shown. */
  answers: string[];
  /** Per answer: whether the text was open while that question was being answered. */
  lookedBack: boolean[];
  /** Whether the text is currently shown next to the questions. */
  textOpen: boolean;
  /** The text was open at some point while the current question was unanswered. */
  peeked: boolean;
  /** One-sentence summary written by the person (never graded). */
  summary: string;
  /** Self-check ticks for the summary (self-assessment, not a score). */
  selfCheck: boolean[];
}

export const toDifficulty = (value: unknown): Difficulty =>
  (DIFFICULTIES as readonly unknown[]).includes(value) ? (value as Difficulty) : 'easy';

export const textsFor = (difficulty: Difficulty): TextStructure[] => TEXTS.filter((t) => t.difficulty === difficulty);

export const findText = (id: unknown): TextStructure | undefined => TEXTS.find((t) => t.id === id);

/** Structure of the state's text (state must be valid). */
export const textOf = (state: Pick<DeepReadState, 'textId'>): TextStructure => {
  const text = findText(state.textId);
  if (!text) throw new RangeError(`Unknown text "${state.textId}".`);
  return text;
};

export const questionCount = (state: Pick<DeepReadState, 'textId'>): number => textOf(state).questions.length;

/** The question on screen (questions phase) or the last one. */
export const currentQuestion = (state: DeepReadState): QuestionStructure => textOf(state).questions[state.cursor] as QuestionStructure;

/** Whether the question on screen has been answered and shows its feedback. */
export const isAnswered = (state: DeepReadState): boolean => state.answers.length > state.cursor;

export function createInitialState(seed: number, difficulty: Difficulty = 'easy'): DeepReadState {
  const pool = textsFor(difficulty);
  const text = createRng(seed).pick(pool);
  return {
    seed: seed >>> 0,
    difficulty,
    textId: text.id,
    phase: 'reading',
    cursor: 0,
    answers: [],
    lookedBack: [],
    textOpen: false,
    peeked: false,
    summary: '',
    selfCheck: new Array<boolean>(SELF_CHECK_ITEMS).fill(false)
  };
}

/**
 * Restarts the same text from the beginning. Keeps the saved `textId`, so a save made before more texts
 * were added (when the same seed picked from a smaller pool) restarts the text it was reading.
 */
export function restart(state: DeepReadState): DeepReadState {
  return { ...createInitialState(state.seed, state.difficulty), textId: state.textId };
}

/** "I'm done reading": the text closes and the first question appears. */
export function finishReading(state: DeepReadState): DeepReadState {
  if (state.phase !== 'reading') return state;
  return { ...state, phase: 'questions', cursor: 0, textOpen: false, peeked: false };
}

/** Shows or hides the text while answering questions. */
export function setTextOpen(state: DeepReadState, open: boolean): DeepReadState {
  if (state.phase !== 'questions' || state.textOpen === open) return state;
  return { ...state, textOpen: open, peeked: state.peeked || (open && !isAnswered(state)) };
}

/** Answers the question on screen. Ignored when already answered or when the option does not exist. */
export function answer(state: DeepReadState, optionId: string): DeepReadState {
  if (state.phase !== 'questions' || isAnswered(state)) return state;
  const question = currentQuestion(state);
  if (!(question.options as readonly string[]).includes(optionId)) return state;
  return {
    ...state,
    answers: [...state.answers, optionId],
    lookedBack: [...state.lookedBack, state.peeked]
  };
}

/** Moves on after the feedback: to the next question, or to the summary step after the last one. */
export function next(state: DeepReadState): DeepReadState {
  if (state.phase !== 'questions' || !isAnswered(state)) return state;
  if (state.cursor + 1 < questionCount(state)) return { ...state, cursor: state.cursor + 1, peeked: state.textOpen };
  return { ...state, phase: 'summary', textOpen: false, peeked: false };
}

/** Clamps a summary draft to `SUMMARY_MAX` characters (UTF-16 units, like `maxlength`). */
export const clampSummary = (text: string): string => text.slice(0, SUMMARY_MAX);

export function setSummary(state: DeepReadState, text: string): DeepReadState {
  if (state.phase !== 'summary') return state;
  const summary = clampSummary(text);
  return summary === state.summary ? state : { ...state, summary };
}

/** Shows the model sentence and the self-check. Needs a non-blank sentence. */
export function submitSummary(state: DeepReadState): DeepReadState {
  if (state.phase !== 'summary' || state.summary.trim() === '') return state;
  return { ...state, phase: 'compare' };
}

/** Skips the optional summary: the exercise ends without a sentence. */
export function skipSummary(state: DeepReadState): DeepReadState {
  if (state.phase !== 'summary') return state;
  return { ...state, phase: 'done', summary: '' };
}

export function toggleSelfCheck(state: DeepReadState, index: number): DeepReadState {
  if (state.phase !== 'compare' || !isInt(index, 0, SELF_CHECK_ITEMS - 1)) return state;
  const selfCheck = state.selfCheck.map((ticked, i) => (i === index ? !ticked : ticked));
  return { ...state, selfCheck };
}

export function finish(state: DeepReadState): DeepReadState {
  if (state.phase !== 'compare') return state;
  return { ...state, phase: 'done' };
}

/** Whether the answer at `index` matches the gold option. */
export function isCorrect(state: DeepReadState, index: number): boolean {
  const question = textOf(state).questions[index];
  return question !== undefined && state.answers[index] === question.gold;
}

export const correctCount = (state: DeepReadState): number => state.answers.filter((_, i) => isCorrect(state, i)).length;

export const lookedBackCount = (state: DeepReadState): number => state.lookedBack.filter(Boolean).length;

export const selfCheckCount = (state: DeepReadState): number => state.selfCheck.filter(Boolean).length;

/** Factual stats for the host's finished screen (never used to pressure anyone). */
export function resultStats(state: DeepReadState): Record<string, number> {
  return {
    correct: correctCount(state),
    questions: questionCount(state),
    lookedBack: lookedBackCount(state),
    selfCheck: selfCheckCount(state)
  };
}

const isBoolArray = (value: unknown): value is boolean[] => Array.isArray(value) && value.every((v) => typeof v === 'boolean');

/** Thorough structural validation of untrusted saves. Never throws. */
export function isDeepReadState(value: unknown): value is DeepReadState {
  try {
    if (!isRecord(value)) return false;
    const s = value;
    if (!isUint32(s.seed)) return false;
    if (!(DIFFICULTIES as readonly unknown[]).includes(s.difficulty)) return false;
    const text = findText(s.textId);
    if (!text || text.difficulty !== s.difficulty) return false;
    if (!(PHASES as readonly unknown[]).includes(s.phase)) return false;
    const phase = s.phase as Phase;
    const total = text.questions.length;
    if (!isInt(s.cursor, 0, total - 1)) return false;
    const cursor = s.cursor;
    if (!Array.isArray(s.answers) || s.answers.length > total) return false;
    const answers = s.answers as unknown[];
    if (!answers.every((id, i) => typeof id === 'string' && (text.questions[i]?.options as readonly string[] | undefined)?.includes(id) === true)) return false;
    if (!isBoolArray(s.lookedBack) || s.lookedBack.length !== answers.length) return false;
    if (typeof s.textOpen !== 'boolean' || typeof s.peeked !== 'boolean') return false;
    if (typeof s.summary !== 'string' || s.summary.length > SUMMARY_MAX) return false;
    if (!isBoolArray(s.selfCheck) || s.selfCheck.length !== SELF_CHECK_ITEMS) return false;
    const anyTick = s.selfCheck.some(Boolean);

    if (phase === 'reading') {
      return cursor === 0 && answers.length === 0 && !s.textOpen && !s.peeked && s.summary === '' && !anyTick;
    }
    if (phase === 'questions') {
      const answeredOk = answers.length === cursor || answers.length === cursor + 1;
      // An open text while the question is unanswered always counts as looked back.
      const peekOk = !(s.textOpen && answers.length === cursor && !s.peeked);
      return answeredOk && peekOk && s.summary === '' && !anyTick;
    }
    // summary, compare, done: every question answered, text closed.
    if (answers.length !== total || cursor !== total - 1 || s.textOpen || s.peeked) return false;
    if (phase === 'summary') return !anyTick;
    if (phase === 'compare') return s.summary.trim() !== '';
    // done: either with a written sentence (after compare) or skipped (no sentence, no ticks).
    return s.summary.trim() !== '' || (s.summary === '' && !anyTick);
  } catch {
    return false;
  }
}
