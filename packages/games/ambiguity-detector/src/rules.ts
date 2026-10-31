/**
 * Ambiguity Detector — pure game logic (no DOM).
 *
 * A round shows six short requests. For each one the person ticks the information that is missing and
 * matters, optionally writes their own clarifying question (never graded, ADR 0010), checks, and then picks
 * the best reply among three. Scoring is plain set arithmetic against the item's gold answer.
 */
import { createRng, isInt, isOneOf, isRecord, isUint32, normalizeSeed, seedFromString } from '@wp/game-core';
import {
  DIFFICULTIES,
  DIMENSIONS,
  EASY_DIMENSIONS,
  ITEMS,
  REPLY_KINDS,
  type DimId,
  type Difficulty,
  type ItemSpec,
  type ReplyKind
} from './content/items';

export { DIFFICULTIES, DIMENSIONS, EASY_DIMENSIONS, ITEMS, REPLY_KINDS };
export type { DimId, Difficulty, ItemSpec, ReplyKind };

export const ROUND_SIZE = 6;
export const NOTE_MAX = 500;
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

export interface Answer {
  /** Ticked dimensions, unique, in `DIMENSIONS` order. */
  ticked: DimId[];
  /** Optional own clarifying question (free text, never graded). */
  note: string;
  checked: boolean;
  reply: ReplyKind | null;
}

export interface AmbiguityState {
  seed: number;
  difficulty: Difficulty;
  /** Item ids of this round, in play order. */
  items: string[];
  /** Current item; `items.length` once the round is over (summary). */
  index: number;
  /** One answer per item. */
  answers: Answer[];
}

export type Phase = 'tick' | 'feedback' | 'replied' | 'summary';

export interface Score {
  hits: DimId[];
  misses: DimId[];
  extra: DimId[];
}

const ITEM_BY_ID = new Map(ITEMS.map((item) => [item.id, item]));

export const toDifficulty = (value: unknown): Difficulty => (isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY);

export function itemById(id: string): ItemSpec | undefined {
  return ITEM_BY_ID.get(id);
}

function itemOf(id: string): ItemSpec {
  const item = ITEM_BY_ID.get(id);
  if (!item) throw new RangeError(`unknown item ${id}`);
  return item;
}

/** The dimensions offered as tick boxes at a difficulty. */
export function dimensionsFor(difficulty: Difficulty): readonly DimId[] {
  return difficulty === 'easy' ? EASY_DIMENSIONS : DIMENSIONS;
}

/** The item pool of a difficulty. */
export function itemsFor(difficulty: Difficulty): readonly ItemSpec[] {
  return ITEMS.filter((item) => item.difficulty === difficulty);
}

const emptyAnswer = (): Answer => ({ ticked: [], note: '', checked: false, reply: null });

export function createInitialState(seed: number, difficulty: Difficulty = DEFAULT_DIFFICULTY): AmbiguityState {
  const rng = createRng(seed);
  const items = rng.shuffle(itemsFor(difficulty).map((item) => item.id)).slice(0, ROUND_SIZE);
  return { seed: normalizeSeed(seed), difficulty, items, index: 0, answers: items.map(emptyAnswer) };
}

export function phaseOf(state: AmbiguityState): Phase {
  const answer = state.answers[state.index];
  if (!answer) return 'summary';
  if (!answer.checked) return 'tick';
  return answer.reply === null ? 'feedback' : 'replied';
}

export function currentItem(state: AmbiguityState): ItemSpec | undefined {
  const id = state.items[state.index];
  return id === undefined ? undefined : ITEM_BY_ID.get(id);
}

const inOrder = (dims: Iterable<DimId>): DimId[] => {
  const set = new Set(dims);
  return DIMENSIONS.filter((dim) => set.has(dim));
};

function withAnswer(state: AmbiguityState, update: (answer: Answer) => Answer): AmbiguityState {
  const answers = state.answers.map((answer, i) => (i === state.index ? update(answer) : answer));
  return { ...state, answers };
}

/** Ticks or unticks a dimension of the current item (only before checking). */
export function toggleDimension(state: AmbiguityState, dim: DimId): AmbiguityState {
  if (phaseOf(state) !== 'tick' || !dimensionsFor(state.difficulty).includes(dim)) return state;
  return withAnswer(state, (answer) => {
    const ticked = new Set(answer.ticked);
    if (ticked.has(dim)) ticked.delete(dim);
    else ticked.add(dim);
    return { ...answer, ticked: inOrder(ticked) };
  });
}

/** Normalises free text: no control characters except line breaks, at most `NOTE_MAX` characters. */
export function sanitizeNote(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').slice(0, NOTE_MAX);
}

/** Stores the optional own clarifying question (only before checking). */
export function setNote(state: AmbiguityState, text: string): AmbiguityState {
  if (phaseOf(state) !== 'tick') return state;
  const note = sanitizeNote(text);
  const current = state.answers[state.index];
  if (current?.note === note) return state;
  return withAnswer(state, (answer) => ({ ...answer, note }));
}

/** Reveals the result for the current item. */
export function check(state: AmbiguityState): AmbiguityState {
  if (phaseOf(state) !== 'tick') return state;
  return withAnswer(state, (answer) => ({ ...answer, checked: true }));
}

/** The three reply kinds offered for an item, in a seed-dependent but stable order. */
export function replyOrder(seed: number, itemId: string): ReplyKind[] {
  const item = itemOf(itemId);
  const kinds: ReplyKind[] = ['clear', 'vague', item.third];
  return createRng((seed ^ seedFromString(itemId)) >>> 0).shuffle(kinds);
}

/** Picks one of the three replies (only after checking, once). */
export function chooseReply(state: AmbiguityState, kind: ReplyKind): AmbiguityState {
  const item = currentItem(state);
  if (!item || phaseOf(state) !== 'feedback') return state;
  if (kind !== 'clear' && kind !== 'vague' && kind !== item.third) return state;
  return withAnswer(state, (answer) => ({ ...answer, reply: kind }));
}

/** Moves on to the next item (or to the summary after the last one). */
export function next(state: AmbiguityState): AmbiguityState {
  if (phaseOf(state) !== 'replied') return state;
  return { ...state, index: state.index + 1 };
}

/** Set arithmetic: hits = ticked ∩ gold, misses = gold \ ticked, extra = ticked \ gold (all in display order). */
export function score(ticked: readonly DimId[], gold: readonly DimId[]): Score {
  const t = new Set(ticked);
  const g = new Set(gold);
  return {
    hits: DIMENSIONS.filter((d) => t.has(d) && g.has(d)),
    misses: DIMENSIONS.filter((d) => g.has(d) && !t.has(d)),
    extra: DIMENSIONS.filter((d) => t.has(d) && !g.has(d))
  };
}

/** Score of the item at `index` (undefined while it is not checked yet). */
export function scoreAt(state: AmbiguityState, index: number): Score | undefined {
  const answer = state.answers[index];
  const id = state.items[index];
  if (!answer?.checked || id === undefined) return undefined;
  return score(answer.ticked, itemOf(id).missing);
}

export interface DimensionSummary {
  dim: DimId;
  /** How often it was missing in this round. */
  missing: number;
  found: number;
  overlooked: number;
  /** How often it was ticked although it was not missing. */
  extra: number;
}

export interface RoundSummary {
  dimensions: DimensionSummary[];
  hits: number;
  misses: number;
  extra: number;
  gaps: number;
  bestReplies: number;
  answered: number;
  /** Dimensions overlooked most often (ties included); empty when nothing was overlooked. */
  mostOverlooked: DimId[];
}

/** Per-dimension accuracy over all checked items of the round. */
export function summarize(state: AmbiguityState): RoundSummary {
  const rows = new Map<DimId, DimensionSummary>(DIMENSIONS.map((dim) => [dim, { dim, missing: 0, found: 0, overlooked: 0, extra: 0 }]));
  let bestReplies = 0;
  let answered = 0;
  state.items.forEach((id, i) => {
    const result = scoreAt(state, i);
    if (!result) return;
    answered++;
    for (const dim of itemOf(id).missing) (rows.get(dim) as DimensionSummary).missing++;
    for (const dim of result.hits) (rows.get(dim) as DimensionSummary).found++;
    for (const dim of result.misses) (rows.get(dim) as DimensionSummary).overlooked++;
    for (const dim of result.extra) (rows.get(dim) as DimensionSummary).extra++;
    if (state.answers[i]?.reply === 'clear') bestReplies++;
  });
  const dimensions = [...rows.values()].filter((row) => row.missing > 0 || row.extra > 0);
  const sum = (key: 'found' | 'overlooked' | 'extra' | 'missing') => dimensions.reduce((total, row) => total + row[key], 0);
  const worst = Math.max(0, ...dimensions.map((row) => row.overlooked));
  return {
    dimensions,
    hits: sum('found'),
    misses: sum('overlooked'),
    extra: sum('extra'),
    gaps: sum('missing'),
    bestReplies,
    answered,
    mostOverlooked: worst === 0 ? [] : dimensions.filter((row) => row.overlooked === worst).map((row) => row.dim)
  };
}

// --- Validation ------------------------------------------------------------------------------

function isAnswer(value: unknown, item: ItemSpec, allowed: readonly DimId[]): value is Answer {
  if (!isRecord(value)) return false;
  const { ticked, note, checked, reply } = value;
  if (!Array.isArray(ticked) || ticked.length > allowed.length) return false;
  if (!ticked.every((dim) => isOneOf(dim, allowed))) return false;
  const canonical = inOrder(ticked as DimId[]);
  if (canonical.length !== ticked.length || canonical.some((dim, i) => dim !== ticked[i])) return false;
  if (typeof note !== 'string' || note.length > NOTE_MAX || sanitizeNote(note) !== note) return false;
  if (typeof checked !== 'boolean') return false;
  if (reply !== null && !(reply === 'clear' || reply === 'vague' || reply === item.third)) return false;
  if (reply !== null && !checked) return false;
  return true;
}

const isPristine = (answer: Answer) => answer.ticked.length === 0 && answer.note === '' && !answer.checked && answer.reply === null;

export function isAmbiguityState(value: unknown): value is AmbiguityState {
  try {
    if (!isRecord(value)) return false;
    const { seed, difficulty, items, index, answers } = value;
    if (!isUint32(seed) || !isOneOf(difficulty, DIFFICULTIES)) return false;
    if (!Array.isArray(items) || items.length !== ROUND_SIZE || new Set(items).size !== ROUND_SIZE) return false;
    const specs: ItemSpec[] = [];
    for (const id of items) {
      const item = typeof id === 'string' ? ITEM_BY_ID.get(id) : undefined;
      if (!item || item.difficulty !== difficulty) return false;
      specs.push(item);
    }
    if (!isInt(index, 0, ROUND_SIZE)) return false;
    if (!Array.isArray(answers) || answers.length !== ROUND_SIZE) return false;
    const allowed = dimensionsFor(difficulty);
    return answers.every((answer, i) => {
      if (!isAnswer(answer, specs[i] as ItemSpec, allowed)) return false;
      if (i < index) return answer.checked && answer.reply !== null;
      if (i > index) return isPristine(answer);
      return true;
    });
  } catch {
    return false;
  }
}
