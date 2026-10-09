/**
 * Language-independent content of Ambiguity Detector (ADR 0010): ids, gold answers and reply kinds.
 * The texts for each item live in `content/<locale>.ts`, keyed by the same ids.
 */

/** The fixed set of information dimensions a request can leave open. Order = display order. */
export const DIMENSIONS = ['what', 'when', 'who', 'where', 'format', 'audience', 'scope', 'priority', 'criterion', 'purpose'] as const;
export type DimId = (typeof DIMENSIONS)[number];

/** Easy rounds only offer the five everyday dimensions. */
export const EASY_DIMENSIONS: readonly DimId[] = ['what', 'when', 'who', 'where', 'format'];

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/**
 * Kinds of reply offered in the second step. `clear` is always the best one; `vague` leaves the gaps open;
 * `assume` fills the gaps with guesses; `rude` is demanding or dismissive; `redundant` asks for what is already known.
 */
export const REPLY_KINDS = ['clear', 'vague', 'assume', 'rude', 'redundant'] as const;
export type ReplyKind = (typeof REPLY_KINDS)[number];
export type DistractorKind = Exclude<ReplyKind, 'clear' | 'vague'>;

export interface ItemSpec {
  readonly id: string;
  readonly difficulty: Difficulty;
  /** Gold answer: dimensions that are genuinely missing and relevant. */
  readonly missing: readonly DimId[];
  /** Dimensions that look relevant but are stated in the message or its context line. */
  readonly given: readonly DimId[];
  /** The third reply option besides `clear` and `vague`. */
  readonly third: DistractorKind;
}

export const ITEMS: readonly ItemSpec[] = [
  // Easy: everyday requests, one or two gaps among the five everyday dimensions.
  { id: 'finish-tomorrow', difficulty: 'easy', missing: ['what', 'when'], given: ['who'], third: 'assume' },
  { id: 'concert-entrance', difficulty: 'easy', missing: ['when', 'where'], given: ['what'], third: 'rude' },
  { id: 'party-photos', difficulty: 'easy', missing: ['what', 'format'], given: ['who'], third: 'assume' },
  { id: 'water-plants', difficulty: 'easy', missing: ['when', 'where'], given: ['what', 'who'], third: 'assume' },
  { id: 'train-tickets', difficulty: 'easy', missing: ['when'], given: ['what', 'who'], third: 'assume' },
  { id: 'bins-tonight', difficulty: 'easy', missing: ['who'], given: ['what', 'when'], third: 'rude' },
  { id: 'school-form', difficulty: 'easy', missing: ['what', 'format'], given: ['when'], third: 'assume' },
  { id: 'holiday-keys', difficulty: 'easy', missing: ['where'], given: ['what', 'who'], third: 'assume' },
  // Medium: three or four gaps across all ten dimensions.
  { id: 'project-slides', difficulty: 'medium', missing: ['when', 'audience', 'scope', 'purpose'], given: ['what', 'who'], third: 'assume' },
  { id: 'cafe-website', difficulty: 'medium', missing: ['what', 'where', 'priority'], given: ['who'], third: 'assume' },
  { id: 'walk-report', difficulty: 'medium', missing: ['when', 'format', 'audience'], given: ['what', 'scope'], third: 'assume' },
  { id: 'office-paper', difficulty: 'medium', missing: ['when', 'who', 'scope'], given: ['what'], third: 'assume' },
  { id: 'anniversary', difficulty: 'medium', missing: ['what', 'when', 'who', 'scope'], given: ['audience', 'purpose'], third: 'assume' },
  { id: 'customer-reply', difficulty: 'medium', missing: ['what', 'when', 'format'], given: ['audience', 'purpose'], third: 'assume' },
  { id: 'shop-translation', difficulty: 'medium', missing: ['when', 'audience', 'scope'], given: ['what', 'who'], third: 'assume' },
  { id: 'basement', difficulty: 'medium', missing: ['when', 'where', 'purpose'], given: ['what', 'who'], third: 'rude' },
  // Hard: subtler gaps, and several things that seem missing but are given by the context line.
  { id: 'board-report', difficulty: 'hard', missing: ['format', 'criterion'], given: ['what', 'when', 'audience', 'scope'], third: 'redundant' },
  { id: 'school-pickup', difficulty: 'hard', missing: ['where', 'scope'], given: ['when', 'who'], third: 'redundant' },
  { id: 'checkout-bug', difficulty: 'hard', missing: ['who', 'criterion'], given: ['what', 'where', 'priority'], third: 'redundant' },
  { id: 'client-room', difficulty: 'hard', missing: ['when', 'format'], given: ['what', 'who', 'scope'], third: 'redundant' },
  { id: 'newsletter', difficulty: 'hard', missing: ['what', 'when'], given: ['audience', 'scope'], third: 'redundant' },
  { id: 'airport', difficulty: 'hard', missing: ['scope'], given: ['when', 'where', 'purpose'], third: 'redundant' },
  { id: 'contract-check', difficulty: 'hard', missing: ['format', 'criterion'], given: ['what', 'when'], third: 'redundant' },
  { id: 'shared-dinner', difficulty: 'hard', missing: ['what', 'criterion'], given: ['when', 'where'], third: 'redundant' }
];

/** Texts of one item in one UI locale. `ask` has exactly the `missing` keys, `given` exactly the `given` keys. */
export interface ItemText {
  /** Who writes to whom, and what both already know. */
  readonly context: string;
  /** The request itself. */
  readonly text: string;
  /** A model clarifying question for every missing dimension. */
  readonly ask: Readonly<Partial<Record<DimId, string>>>;
  /** Where each given dimension is stated. */
  readonly given: Readonly<Partial<Record<DimId, string>>>;
  /** Exactly the reply kinds `clear`, `vague` and the item's `third`. */
  readonly replies: Readonly<Partial<Record<ReplyKind, string>>>;
}

export type LocaleContent = Readonly<Record<string, ItemText>>;
