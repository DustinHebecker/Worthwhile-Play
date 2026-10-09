/**
 * Content model of Deep Read (ADR 0010).
 *
 * The language-independent structure (text ids, difficulty, paragraph count, question ids and types,
 * option ids, gold answers, supporting paragraphs) lives once in `structure.ts`. Each locale file only
 * supplies the strings for those ids, so gold answers can never differ between languages and a save
 * (ids only) stays valid when the UI language changes.
 */

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const QUESTION_TYPES = ['main', 'detail', 'structure', 'contradiction', 'evidence'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const OPTION_IDS = ['a', 'b', 'c', 'd'] as const;
export type OptionId = (typeof OPTION_IDS)[number];

export interface QuestionStructure {
  readonly id: string;
  readonly type: QuestionType;
  /** Option ids in display order (3–4 of `OPTION_IDS`). */
  readonly options: readonly OptionId[];
  readonly gold: OptionId;
  /** 1-based paragraph number that supports the answer, shown after answering. */
  readonly support?: number;
}

export interface TextStructure {
  readonly id: string;
  readonly difficulty: Difficulty;
  /** Number of paragraphs; paragraph ids are `p1` … `pN`. */
  readonly paragraphs: number;
  readonly questions: readonly QuestionStructure[];
}

/** Option text and the short explanation shown after answering. */
export type OptionText = readonly [text: string, explanation: string];

export interface QuestionText {
  readonly q: string;
  readonly a?: OptionText;
  readonly b?: OptionText;
  readonly c?: OptionText;
  readonly d?: OptionText;
}

export interface TextContent {
  readonly title: string;
  /** Paragraphs in order (`p1` first). */
  readonly paragraphs: readonly string[];
  /** Model one-sentence summary of the core message (compared, never graded). */
  readonly summary: string;
  readonly questions: Readonly<Record<string, QuestionText>>;
}

/** All texts of one UI locale, keyed by text id. */
export type LocaleContent = Readonly<Record<string, TextContent>>;
