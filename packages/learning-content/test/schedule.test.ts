import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import type { LearningRating, LearningReview } from '@wp/game-core';
import {
  addDays,
  applyReview,
  BOX_DAYS,
  createLearningRecords,
  daysBetween,
  intervalDays,
  isDay,
  isDue,
  isLearningReview,
  learningDeckId,
  localDay,
  MAX_BOX,
  nextBox,
  recordKey,
  reviewCounts,
  toLearningRecord,
  type LearningRecord
} from '../src';

const review = (overrides: Partial<LearningReview> = {}): LearningReview => ({
  deckId: 'flags',
  itemId: 'de',
  direction: 'forward',
  rating: 'good',
  session: 's1',
  day: '2026-03-10',
  ...overrides
});

/** Applies ratings on consecutive sessions, each on the day the card became due. */
function run(ratings: readonly LearningRating[], start = '2026-01-01'): LearningRecord[] {
  const out: LearningRecord[] = [];
  let record: LearningRecord | undefined;
  let day = start;
  ratings.forEach((rating, i) => {
    record = applyReview(record, review({ rating, day, session: `s${i}` }));
    if (!record) throw new Error('not applied');
    out.push(record);
    day = record.due;
  });
  return out;
}

const day = fc.date({ min: new Date('2000-01-01T00:00:00Z'), max: new Date('2090-12-31T00:00:00Z'), noInvalidDate: true }).map((d) => d.toISOString().slice(0, 10));
const rating = fc.constantFrom<LearningRating>('again', 'hard', 'good');

describe('calendar days', () => {
  it('validates YYYY-MM-DD days', () => {
    expect(isDay('2026-02-28')).toBe(true);
    expect(isDay('2024-02-29')).toBe(true);
    expect(isDay('2026-02-29')).toBe(false);
    expect(isDay('2026-13-01')).toBe(false);
    expect(isDay('2026-1-01')).toBe(false);
    expect(isDay('0999-01-01')).toBe(false);
    expect(isDay(' 2026-01-01')).toBe(false);
    expect(isDay(20260101)).toBe(false);
    expect(isDay(undefined)).toBe(false);
  });

  it('adds days across months, years and leap days', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-03-10', 64)).toBe('2026-05-13');
    expect(daysBetween('2026-03-10', '2026-05-13')).toBe(64);
    expect(daysBetween('2026-05-13', '2026-03-10')).toBe(-64);
  });

  it('uses the local calendar day of the device', () => {
    expect(localDay(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(localDay(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31');
    expect(isDay(localDay())).toBe(true);
  });

  it('addDays and daysBetween are inverse (property)', () => {
    fc.assert(
      fc.property(day, fc.integer({ min: -400, max: 400 }), (d, n) => {
        const later = addDays(d, n);
        expect(isDay(later)).toBe(true);
        expect(daysBetween(d, later)).toBe(n);
      })
    );
  });
});

describe('Leitner boxes', () => {
  it('moves up on "good", stays on "hard", resets on "again"', () => {
    expect(nextBox(1, 'good')).toBe(2);
    expect(nextBox(3, 'good')).toBe(4);
    expect(nextBox(MAX_BOX, 'good')).toBe(MAX_BOX);
    expect(nextBox(4, 'hard')).toBe(4);
    expect(nextBox(5, 'again')).toBe(1);
    expect(nextBox(0, 'hard')).toBe(1);
    expect(nextBox(99, 'hard')).toBe(MAX_BOX);
    expect(nextBox(Number.NaN, 'good')).toBe(2);
  });

  it('uses 1, 2, 4 … 64 days; half for "hard"; one day for "again"', () => {
    expect(BOX_DAYS).toEqual([1, 2, 4, 8, 16, 32, 64]);
    expect(intervalDays(1, 'good')).toBe(1);
    expect(intervalDays(2, 'good')).toBe(2);
    expect(intervalDays(7, 'good')).toBe(64);
    expect(intervalDays(1, 'hard')).toBe(1);
    expect(intervalDays(2, 'hard')).toBe(1);
    expect(intervalDays(4, 'hard')).toBe(4);
    expect(intervalDays(7, 'hard')).toBe(32);
    expect(intervalDays(5, 'again')).toBe(1);
    expect(intervalDays(0, 'good')).toBe(1);
    expect(intervalDays(12, 'good')).toBe(64);
  });

  it('a new card rated "good" goes to box 2 (2 days), "hard"/"again" to box 1 (1 day)', () => {
    expect(applyReview(undefined, review({ rating: 'good' }))).toEqual({
      deckId: 'flags',
      itemId: 'de',
      direction: 'forward',
      box: 2,
      due: '2026-03-12',
      reviews: 1,
      lastDay: '2026-03-10',
      last: 'good',
      lapses: 0,
      session: 's1'
    });
    expect(applyReview(undefined, review({ rating: 'hard' }))).toMatchObject({ box: 1, due: '2026-03-11', lapses: 0, last: 'hard' });
    expect(applyReview(undefined, review({ rating: 'again' }))).toMatchObject({ box: 1, due: '2026-03-11', lapses: 1, last: 'again' });
  });

  it('follows the documented schedule for repeated "good"', () => {
    const records = run(['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good']);
    expect(records.map((r) => r.box)).toEqual([2, 3, 4, 5, 6, 7, 7, 7]);
    const gaps = records.map((r) => daysBetween(r.lastDay, r.due));
    expect(gaps).toEqual([2, 4, 8, 16, 32, 64, 64, 64]);
    expect(records.at(-1)).toMatchObject({ reviews: 8, lapses: 0 });
  });

  it('"again" after progress resets to box 1 and counts a lapse', () => {
    const records = run(['good', 'good', 'good', 'again', 'hard', 'good']);
    expect(records.map((r) => r.box)).toEqual([2, 3, 4, 1, 1, 2]);
    expect(records.at(-1)).toMatchObject({ lapses: 1, reviews: 6, last: 'good' });
  });

  it('property: intervals never shrink under repeated "good"', () => {
    fc.assert(
      fc.property(fc.array(rating, { maxLength: 12 }), fc.integer({ min: 1, max: 12 }), (prefix, goods) => {
        const records = run([...prefix, ...Array<LearningRating>(goods).fill('good')]);
        const gaps = records.slice(prefix.length).map((r) => daysBetween(r.lastDay, r.due));
        for (let i = 1; i < gaps.length; i++) expect(gaps[i]).toBeGreaterThanOrEqual(gaps[i - 1] as number);
      })
    );
  });

  it('property: "again" always resets to box 1 and tomorrow', () => {
    fc.assert(
      fc.property(fc.array(rating, { maxLength: 12 }), day, (prefix, d) => {
        const previous = prefix.length ? run(prefix).at(-1) : undefined;
        const next = applyReview(previous, review({ rating: 'again', day: d, session: 'final' }));
        expect(next).toMatchObject({ box: 1, due: addDays(d, 1) });
      })
    );
  });

  it('property: after any review the due day is after the review day, the box stays in range, ratings are ordered', () => {
    fc.assert(
      fc.property(fc.array(rating, { maxLength: 12 }), day, rating, (prefix, d, r) => {
        const previous = prefix.length ? run(prefix).at(-1) : undefined;
        const next = applyReview(previous, review({ rating: r, day: d, session: 'final' }));
        expect(next).toBeDefined();
        expect(next!.due > d).toBe(true);
        expect(next!.box).toBeGreaterThanOrEqual(1);
        expect(next!.box).toBeLessThanOrEqual(MAX_BOX);
        expect(toLearningRecord(next)).toEqual(next);
        const gap = (x: LearningRating) => daysBetween(d, applyReview(previous, review({ rating: x, day: d, session: 'final' }))!.due);
        expect(gap('good')).toBeGreaterThanOrEqual(gap('hard'));
        expect(gap('hard')).toBeGreaterThanOrEqual(gap('again'));
      })
    );
  });

  it('property: deterministic for the same inputs', () => {
    fc.assert(
      fc.property(fc.array(rating, { maxLength: 10 }), day, (ratings, d) => {
        expect(run(ratings, d)).toEqual(run(ratings, d));
      })
    );
  });
});

describe('idempotent reviews', () => {
  it('ignores a second update from the same session', () => {
    const first = applyReview(undefined, review({ session: 'a' }));
    expect(applyReview(first, review({ session: 'a', rating: 'again' }))).toBeUndefined();
    expect(applyReview(first, review({ session: 'b', day: '2026-03-12' }))).toMatchObject({ box: 3, reviews: 2 });
  });

  it('rejects invalid reviews', () => {
    expect(applyReview(undefined, review({ day: '2026-02-30' }))).toBeUndefined();
    expect(applyReview(undefined, review({ session: '' }))).toBeUndefined();
    expect(applyReview(undefined, { ...review(), rating: 'easy' } as unknown as LearningReview)).toBeUndefined();
    expect(applyReview(undefined, { ...review(), direction: 'up' } as unknown as LearningReview)).toBeUndefined();
    expect(applyReview(undefined, review({ itemId: '' }))).toBeUndefined();
    expect(applyReview(undefined, review({ deckId: 'x'.repeat(401) }))).toBeUndefined();
    expect(isLearningReview(review())).toBe(true);
    expect(isLearningReview(null)).toBe(false);
  });

  it('createLearningRecords applies each (card, session) once, persists only changes and serves snapshots per deck', () => {
    const persisted: LearningRecord[][] = [];
    const learning = createLearningRecords([], { today: () => '2026-03-10', persist: (changed) => persisted.push(changed) });
    const batch = [review({ itemId: 'de' }), review({ itemId: 'fr', rating: 'again' }), review({ deckId: 'other', itemId: 'de' })];
    learning.record(batch);
    learning.record(batch); // a resume sends the same ratings again
    learning.record([review({ itemId: 'de', rating: 'again' })]); // same session: ignored
    expect(persisted).toHaveLength(1);
    expect(persisted[0]).toHaveLength(3);
    expect(learning.list('flags').map((r) => [r.itemId, r.box, r.reviews])).toEqual([
      ['de', 2, 1],
      ['fr', 1, 1]
    ]);
    expect(learning.list('missing')).toEqual([]);
    expect(learning.today()).toBe('2026-03-10');
    learning.record([review({ itemId: 'de', session: 's2', day: '2026-03-12' })]);
    expect(learning.list('flags').find((r) => r.itemId === 'de')).toMatchObject({ box: 3, reviews: 2 });
    expect(learning.all()).toHaveLength(3);
  });

  it('createLearningRecords ignores junk and works without persist', () => {
    const learning = createLearningRecords([applyReview(undefined, review())!], { today: () => '2026-03-11' });
    learning.record([null, { deckId: 'flags' }, 'x'] as unknown as LearningReview[]);
    learning.record('nope' as unknown as LearningReview[]);
    expect(learning.all()).toHaveLength(1);
    learning.record([review({ session: 's9', day: '2026-03-12' })]);
    expect(learning.list('flags')[0]).toMatchObject({ reviews: 2 });
  });

  it('property: replaying any prefix of a session never changes the result', () => {
    fc.assert(
      fc.property(fc.array(fc.tuple(fc.constantFrom('a', 'b', 'c'), rating), { minLength: 1, maxLength: 12 }), fc.nat(), (cards, cut) => {
        const reviews = cards.map(([itemId, r]) => review({ itemId, rating: r }));
        const once = createLearningRecords([], { today: () => '2026-03-10' });
        once.record(reviews);
        const twice = createLearningRecords([], { today: () => '2026-03-10' });
        twice.record(reviews.slice(0, cut % (reviews.length + 1)));
        twice.record(reviews);
        expect(twice.all()).toEqual(once.all());
      })
    );
  });
});

describe('stored records', () => {
  const valid = () => applyReview(undefined, review())!;

  it('accepts valid records and returns a clean copy', () => {
    expect(toLearningRecord({ ...valid(), extra: 1 })).toEqual(valid());
  });

  it('rejects broken records', () => {
    for (const broken of [
      null,
      'x',
      { ...valid(), box: 0 },
      { ...valid(), box: MAX_BOX + 1 },
      { ...valid(), box: 1.5 },
      { ...valid(), due: '2026-03-10' },
      { ...valid(), due: 'tomorrow' },
      { ...valid(), lastDay: '2026-02-31' },
      { ...valid(), reviews: 0 },
      { ...valid(), lapses: 2 },
      { ...valid(), lapses: -1 },
      { ...valid(), last: 'easy' },
      { ...valid(), session: '' },
      { ...valid(), direction: 'sideways' },
      { ...valid(), itemId: 5 },
      { ...valid(), deckId: '' }
    ]) {
      expect(toLearningRecord(broken)).toBeUndefined();
    }
    fc.assert(fc.property(fc.anything(), (value) => void expect(() => toLearningRecord(value)).not.toThrow()));
  });

  it('record keys are unambiguous', () => {
    expect(recordKey({ deckId: 'a', itemId: 'b|c', direction: 'forward' })).not.toBe(recordKey({ deckId: 'a|b', itemId: 'c', direction: 'forward' }));
  });
});

describe('review counts', () => {
  it('counts due and seen cards of one deck, ignoring other decks and removed items', () => {
    const at = (itemId: string, d: string, direction: 'forward' | 'backward' = 'forward', deckId = 'flags') =>
      applyReview(undefined, review({ itemId, day: d, direction, deckId }))!; // due two days later
    const records = [at('de', '2026-03-01'), at('fr', '2026-03-08'), at('fr', '2026-03-09', 'backward'), at('it', '2026-03-10'), at('gone', '2026-03-01'), at('de', '2026-03-01', 'forward', 'x')];
    expect(reviewCounts(records, 'flags', ['de', 'fr', 'it'], '2026-03-10')).toEqual({ due: 2, seen: 4 });
    expect(reviewCounts(records, 'flags', ['de', 'fr', 'it'], '2026-03-11')).toEqual({ due: 3, seen: 4 });
    expect(reviewCounts([], 'flags', ['de'], '2026-03-11')).toEqual({ due: 0, seen: 0 });
    expect(isDue({ due: '2026-03-10' }, '2026-03-10')).toBe(true);
    expect(isDue({ due: '2026-03-11' }, '2026-03-10')).toBe(false);
  });

  it('keys built-in decks by what is learned', () => {
    expect(learningDeckId('first-words', { learning: 'ja' })).toBe('first-words:ja');
    expect(learningDeckId('flags', { learning: 'ja' })).toBe('flags');
    expect(learningDeckId('user-x-1', { learning: 'ja' })).toBe('user-x-1');
    expect(learningDeckId('symbols', { learning: 'ja' })).toBeUndefined();
  });
});
