import { isRecord, type GameLearningRecords, type LearningDirection, type LearningRating, type LearningRecordSummary, type LearningReview } from '@wp/game-core';

/**
 * Spaced repetition ("Items worth reviewing") as a small Leitner-box model with whole days.
 *
 * - Every card (deck, item, direction) that has been rated once sits in one of seven boxes.
 * - "Knew it" (`good`) moves it up one box, "Almost" (`hard`) keeps it in its box, "Not yet" (`again`) moves it
 *   back to box 1. A card that was never rated counts as box 1.
 * - Box n is suggested again after BOX_DAYS[n-1] days (1, 2, 4, 8, 16, 32, 64); "Almost" uses half of that
 *   (at least one day), "Not yet" one day.
 * - Dates are local calendar days (`YYYY-MM-DD`) of the device. Nothing depends on the time of day, and nothing
 *   is ever triggered by time: a card simply counts as "worth reviewing" from its suggested day on.
 *
 * The model deliberately records no streaks, no daily goals and no history beyond what scheduling needs.
 */

/** A local calendar day, `YYYY-MM-DD`. */
export type Day = string;

export const BOX_DAYS = [1, 2, 4, 8, 16, 32, 64] as const;
export const MAX_BOX = BOX_DAYS.length;
export const RATINGS: readonly LearningRating[] = ['again', 'hard', 'good'];
export const DIRECTIONS: readonly LearningDirection[] = ['forward', 'backward'];

/** What is stored per card. `session` makes writes idempotent (one update per record and session). */
export interface LearningRecord extends LearningRecordSummary {
  /** Day of the last rating. */
  readonly lastDay: Day;
  readonly last: LearningRating;
  /** How often the card was rated "not yet" (factual; never shown as a score). */
  readonly lapses: number;
  /** Session id of the last rating. */
  readonly session: string;
}

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

const dayToUtc = (day: Day): number => {
  const match = DAY.exec(day);
  if (!match) return Number.NaN;
  const [, y, m, d] = match;
  return Date.UTC(Number(y), Number(m) - 1, Number(d));
};

const utcToDay = (ms: number): Day => {
  const date = new Date(ms);
  const pad = (n: number, width = 2) => String(n).padStart(width, '0');
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
};

/** True for a real calendar day in `YYYY-MM-DD` form (years 1000–9999). */
export function isDay(value: unknown): value is Day {
  if (typeof value !== 'string' || !DAY.test(value) || value < '1000') return false;
  const ms = dayToUtc(value);
  return Number.isFinite(ms) && utcToDay(ms) === value;
}

/** The device's local calendar day of `date`. */
export function localDay(date: Date = new Date()): Day {
  const pad = (n: number, width = 2) => String(n).padStart(width, '0');
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `day` plus `days` whole days (calendar arithmetic, no time zones involved). */
export function addDays(day: Day, days: number): Day {
  return utcToDay(dayToUtc(day) + Math.trunc(days) * MS_PER_DAY);
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: Day, to: Day): number {
  return Math.round((dayToUtc(to) - dayToUtc(from)) / MS_PER_DAY);
}

/** Box after a rating; `box` is the current box (1 for a card that was never rated). */
export function nextBox(box: number, rating: LearningRating): number {
  const current = Math.min(Math.max(Math.trunc(box) || 1, 1), MAX_BOX);
  if (rating === 'again') return 1;
  if (rating === 'hard') return current;
  return Math.min(current + 1, MAX_BOX);
}

/** Days until a card in `box` (after the rating) is suggested again. */
export function intervalDays(box: number, rating: LearningRating): number {
  if (rating === 'again') return 1;
  const days = BOX_DAYS[Math.min(Math.max(box, 1), MAX_BOX) - 1] ?? 1;
  return rating === 'hard' ? Math.max(1, Math.floor(days / 2)) : days;
}

/** Stable map key of a card's record. */
export function recordKey(key: { deckId: string; itemId: string; direction: LearningDirection }): string {
  return JSON.stringify([key.deckId, key.itemId, key.direction]);
}

const isDirection = (value: unknown): value is LearningDirection => value === 'forward' || value === 'backward';
const isRating = (value: unknown): value is LearningRating => value === 'again' || value === 'hard' || value === 'good';
const isCount = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;
const isId = (value: unknown, max = 400): value is string => typeof value === 'string' && value.length > 0 && value.length <= max;

/** Validates a self-rating (untrusted input from a game). */
export function isLearningReview(value: unknown): value is LearningReview {
  return (
    isRecord(value) &&
    isId(value.deckId) &&
    isId(value.itemId) &&
    isDirection(value.direction) &&
    isRating(value.rating) &&
    isId(value.session, 100) &&
    isDay(value.day)
  );
}

/** Validates a stored record (storage is untrusted). Returns a clean copy or undefined. */
export function toLearningRecord(value: unknown): LearningRecord | undefined {
  if (!isRecord(value)) return undefined;
  const { deckId, itemId, direction, box, due, reviews, lastDay, last, lapses, session } = value;
  if (!isId(deckId) || !isId(itemId) || !isDirection(direction)) return undefined;
  if (!Number.isInteger(box) || (box as number) < 1 || (box as number) > MAX_BOX) return undefined;
  if (!isDay(due) || !isDay(lastDay) || due <= lastDay || !isRating(last)) return undefined;
  if (!isCount(reviews) || reviews < 1 || !isCount(lapses) || lapses > reviews || !isId(session, 100)) return undefined;
  return { deckId, itemId, direction, box: box as number, due, reviews, lastDay, last, lapses, session };
}

/**
 * Applies one self-rating. Returns the updated record, or `undefined` when there is nothing to change: the review
 * is invalid, or the record was already updated by the same session (repeated delivery after a reload/resume).
 * The new due day is always at least one day after the review day.
 */
export function applyReview(previous: LearningRecord | undefined, review: LearningReview): LearningRecord | undefined {
  if (!isLearningReview(review)) return undefined;
  if (previous && previous.session === review.session) return undefined;
  const box = nextBox(previous?.box ?? 1, review.rating);
  return {
    deckId: review.deckId,
    itemId: review.itemId,
    direction: review.direction,
    box,
    due: addDays(review.day, intervalDays(box, review.rating)),
    reviews: (previous?.reviews ?? 0) + 1,
    lastDay: review.day,
    last: review.rating,
    lapses: (previous?.lapses ?? 0) + (review.rating === 'again' ? 1 : 0),
    session: review.session
  };
}

/** True when the card is suggested for review on `today` (its due day has arrived). */
export function isDue(record: Pick<LearningRecordSummary, 'due'>, today: Day): boolean {
  return record.due <= today;
}

export interface ReviewCounts {
  /** Cards (item × direction) whose suggested day has arrived. */
  due: number;
  /** Cards (item × direction) rated at least once. */
  seen: number;
}

/** Neutral counts for one learning deck; records of items that are no longer in the deck are ignored. */
export function reviewCounts(records: readonly LearningRecordSummary[], deckId: string, itemIds: readonly string[], today: Day): ReviewCounts {
  const items = new Set(itemIds);
  let due = 0;
  let seen = 0;
  for (const record of records) {
    if (record.deckId !== deckId || !items.has(record.itemId)) continue;
    seen++;
    if (isDue(record, today)) due++;
  }
  return { due, seen };
}

export interface LearningRecordsOptions {
  /** The local calendar day; injected for deterministic tests. */
  today: () => Day;
  /** Called with the records changed by one `record` call (e.g. to store them). Errors are the caller's concern. */
  persist?: (changed: LearningRecord[]) => void;
}

/**
 * In-memory learning records with the `GameContext.learning` interface: the host loads the stored records once,
 * games read a synchronous snapshot and write ratings, which are applied idempotently and handed to `persist`.
 */
export function createLearningRecords(initial: readonly LearningRecord[], options: LearningRecordsOptions): GameLearningRecords & { all(): LearningRecord[] } {
  const records = new Map<string, LearningRecord>();
  for (const record of initial) records.set(recordKey(record), record);
  return {
    today: options.today,
    list(deckId) {
      return [...records.values()].filter((record) => record.deckId === deckId);
    },
    record(reviews) {
      const changed: LearningRecord[] = [];
      for (const review of Array.isArray(reviews) ? reviews : []) {
        const key = isLearningReview(review) ? recordKey(review) : undefined;
        if (key === undefined) continue;
        const next = applyReview(records.get(key), review);
        if (!next) continue;
        records.set(key, next);
        changed.push(next);
      }
      if (changed.length > 0) options.persist?.(changed);
    },
    all() {
      return [...records.values()];
    }
  };
}
