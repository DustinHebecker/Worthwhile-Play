import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import type { LearningRating, LearningRecordSummary } from '@wp/game-core';
import { applyReview, builtinItemIds, createLearningRecords, type LearningRecord } from '@wp/learning-content';
import {
  availableCounts,
  buildCards,
  currentCard,
  directionsOf,
  isFinished,
  isValidReviewState,
  matchesAnswer,
  rate,
  recordDeckOf,
  restart,
  reveal,
  reviewsOf,
  SESSION_LIMITS,
  sessionId,
  startSession,
  summary,
  type DirectionChoice,
  type Mode,
  type ReviewState,
  type StartOptions
} from '../src/rules';

const TODAY = '2026-03-10';
const ITEMS = ['a', 'b', 'c', 'd', 'e', 'f'];
const DECK = 'user-test-ab12';

const rec = (itemId: string, due: string, direction: 'forward' | 'backward' = 'forward'): LearningRecordSummary => ({ deckId: DECK, itemId, direction, box: 2, due, reviews: 1 });

const options = (overrides: Partial<StartOptions> = {}): StartOptions => ({
  seed: 42,
  mode: 'review',
  direction: 'forward',
  itemIds: ITEMS,
  records: [],
  today: TODAY,
  deckId: DECK,
  languages: {},
  ...overrides
});

/** Reveal and rate every card of the queue (including repetitions) with `pick(index)`. */
function playThrough(state: ReviewState, pick: (i: number) => LearningRating, day = TODAY): { state: ReviewState; reviews: number } {
  let s = state;
  let reviews = 0;
  for (let i = 0; !isFinished(s) && i < 100; i++) {
    const result = rate(reveal(s), pick(i), day, recordDeckOf(s));
    s = result.state;
    if (result.review) reviews++;
  }
  return { state: s, reviews };
}

describe('building a session', () => {
  it('review: only due cards of the allowed direction, most overdue first, at most 20', () => {
    const records = [rec('a', '2026-03-10'), rec('b', '2026-03-11'), rec('c', '2026-03-01'), rec('d', '2026-03-09', 'backward'), rec('x', '2026-03-01')];
    const cards = buildCards({ seed: 1, mode: 'review', direction: 'forward', itemIds: ITEMS, records, today: TODAY });
    expect(cards.map((c) => c.item).sort()).toEqual(['a', 'c']);
    expect(cards.every((c) => c.dir === 'forward')).toBe(true);
    const backward = buildCards({ seed: 1, mode: 'review', direction: 'backward', itemIds: ITEMS, records, today: TODAY });
    expect(backward).toEqual([{ item: 'd', dir: 'backward' }]);
    const many = Array.from({ length: 30 }, (_, i) => `i${i}`);
    const due = many.map((id, i) => rec(id, `2026-02-${String((i % 28) + 1).padStart(2, '0')}`));
    const chosen = buildCards({ seed: 3, mode: 'review', direction: 'forward', itemIds: many, records: due, today: TODAY });
    expect(chosen).toHaveLength(SESSION_LIMITS.review);
    // The 20 most overdue: every chosen due day is earlier than or equal to every left-out one.
    const dueOf = new Map(due.map((r) => [r.itemId, r.due]));
    const chosenDays = chosen.map((c) => dueOf.get(c.item) as string);
    const left = many.filter((id) => !chosen.some((c) => c.item === id)).map((id) => dueOf.get(id) as string);
    expect(chosenDays.every((d) => left.every((l) => d <= l))).toBe(true);
  });

  it('new: only cards never rated in that direction, at most 10', () => {
    const records = [rec('a', '2026-03-20'), rec('b', '2026-03-01', 'backward')];
    const cards = buildCards({ seed: 1, mode: 'new', direction: 'forward', itemIds: ITEMS, records, today: TODAY });
    expect(cards.map((c) => c.item).sort()).toEqual(['b', 'c', 'd', 'e', 'f']);
    const many = Array.from({ length: 30 }, (_, i) => `i${i}`);
    expect(buildCards({ seed: 1, mode: 'new', direction: 'forward', itemIds: many, records: [], today: TODAY })).toHaveLength(SESSION_LIMITS.new);
  });

  it('mixed: each item at most once per session', () => {
    const records = [rec('a', '2026-03-01'), rec('a', '2026-03-02', 'backward'), rec('b', '2026-03-01', 'backward')];
    const review = buildCards({ seed: 5, mode: 'review', direction: 'mixed', itemIds: ITEMS, records, today: TODAY });
    expect(review.map((c) => c.item).sort()).toEqual(['a', 'b']);
    expect(review.find((c) => c.item === 'a')?.dir).toBe('forward');
    const fresh = buildCards({ seed: 5, mode: 'new', direction: 'mixed', itemIds: ITEMS, records, today: TODAY });
    expect(new Set(fresh.map((c) => c.item)).size).toBe(fresh.length);
    // "a" was rated in both directions; "b" only backward, so it is still new forward.
    expect(fresh.map((c) => c.item).sort()).toEqual(['b', 'c', 'd', 'e', 'f']);
    expect(directionsOf('mixed')).toEqual(['forward', 'backward']);
    expect(directionsOf('backward')).toEqual(['backward']);
  });

  it('practice: any cards regardless of records, at most 10, both directions when mixed', () => {
    const many = Array.from({ length: 40 }, (_, i) => `i${i}`);
    const cards = buildCards({ seed: 9, mode: 'practice', direction: 'mixed', itemIds: many, records: [], today: '' });
    expect(cards).toHaveLength(SESSION_LIMITS.practice);
    expect(new Set(cards.map((c) => c.dir))).toEqual(new Set(['forward', 'backward']));
    expect(buildCards({ seed: 9, mode: 'practice', direction: 'backward', itemIds: ['a', 'a', 'b'], records: [], today: '' }).map((c) => c.dir)).toEqual(['backward', 'backward']);
  });

  it('property: deterministic, valid, bounded and duplicate-free for any input', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 0xffffffff }),
        fc.constantFrom<Mode>('review', 'new', 'practice'),
        fc.constantFrom<DirectionChoice>('forward', 'backward', 'mixed'),
        fc.array(fc.tuple(fc.constantFrom(...ITEMS), fc.constantFrom('forward', 'backward') as fc.Arbitrary<'forward' | 'backward'>, fc.integer({ min: 1, max: 20 })), { maxLength: 12 }),
        (seed, mode, direction, raw) => {
          // One record per (item, direction), like the store.
          const unique = new Map(raw.map(([item, dir, day]) => [`${item}:${dir}`, rec(item, `2026-03-${String(day).padStart(2, '0')}`, dir)]));
          const records = [...unique.values()];
          const input = { seed, mode, direction, itemIds: ITEMS, records, today: TODAY };
          const cards = buildCards(input);
          expect(buildCards(input)).toEqual(cards);
          expect(cards.length).toBeLessThanOrEqual(SESSION_LIMITS[mode]);
          expect(new Set(cards.map((c) => c.item)).size).toBe(cards.length);
          const allowed = directionsOf(direction);
          for (const card of cards) {
            expect(allowed).toContain(card.dir);
            const record = records.find((r) => r.itemId === card.item && r.direction === card.dir);
            if (mode === 'review') expect(record && record.due <= TODAY).toBe(true);
            if (mode === 'new') expect(record).toBeUndefined();
          }
          const state = startSession(options({ seed, mode, direction, records }));
          expect(isValidReviewState(state)).toBe(true);
          expect(JSON.parse(JSON.stringify(state))).toEqual(state);
        }
      )
    );
  });

  it('counts what a session could offer', () => {
    const records = [rec('a', '2026-03-01'), rec('b', '2026-03-12'), rec('c', '2026-03-10', 'backward')];
    expect(availableCounts(ITEMS, records, 'forward', TODAY)).toEqual({ due: 1, unseen: 4 });
    expect(availableCounts(ITEMS, records, 'backward', TODAY)).toEqual({ due: 1, unseen: 5 });
    expect(availableCounts(ITEMS, records, 'mixed', TODAY)).toEqual({ due: 2, unseen: 6 });
    expect(availableCounts([], records, 'mixed', TODAY)).toEqual({ due: 0, unseen: 0 });
  });
});

describe('sessions', () => {
  it('session ids are derived from day and seed; practice has none', () => {
    expect(sessionId('review', 42, TODAY)).toBe('20260310-16');
    expect(sessionId('new', 0xffffffff, TODAY)).toBe('20260310-1z141z3');
    expect(sessionId('practice', 42, TODAY)).toBe('');
    expect(sessionId('review', 42, '')).toBe('');
    expect(sessionId('review', 42, 'yesterday')).toBe('');
  });

  it('without a day (no learning records) a session is practice only', () => {
    const state = startSession(options({ today: '', mode: 'review' }));
    expect(state.mode).toBe('practice');
    expect(state.session).toBe('');
    expect(state.cards.length).toBeGreaterThan(0);
  });

  it('reveal → rate moves through the queue; "Not yet" brings a card back once, unrecorded', () => {
    let state = startSession(options({ mode: 'new' }));
    expect(state.cards).toHaveLength(6);
    expect(rate(state, 'good', TODAY, DECK).state).toBe(state); // not revealed yet
    state = reveal(state, '  hello  ');
    expect(state).toMatchObject({ revealed: true, typed: 'hello' });
    expect(reveal(state, 'other')).toBe(state);
    const first = currentCard(state)!;
    const result = rate(state, 'again', TODAY, DECK);
    expect(result.review).toEqual({ deckId: DECK, itemId: first.item, direction: 'forward', rating: 'again', session: state.session, day: TODAY });
    state = result.state;
    expect(state).toMatchObject({ index: 1, revealed: false, typed: null });
    expect(state.cards).toHaveLength(7);
    expect(state.cards[6]).toEqual({ item: first.item, dir: 'forward', repeat: true });
    expect(rate(reveal(state, ''), 'easy' as LearningRating, TODAY, DECK).state.index).toBe(1);
    expect(reveal(state, '   ').typed).toBeNull();
    expect(reveal(state, 'x'.repeat(400)).typed).toHaveLength(300);
    // Play to the end: the repetition is not recorded and does not repeat again.
    const done = playThrough(state, (i) => (i === 5 ? 'again' : 'good'));
    expect(done.reviews).toBe(5);
    expect(isFinished(done.state)).toBe(true);
    expect(done.state.cards).toHaveLength(7);
    expect(summary(done.state)).toEqual({ cards: 6, again: 1, hard: 0, good: 5 });
    expect(reveal(done.state)).toBe(done.state);
    expect(rate(done.state, 'good', TODAY, DECK).state).toBe(done.state);
    expect(isValidReviewState(done.state)).toBe(true);
  });

  it('practice records nothing; an invalid day is stored as empty', () => {
    const state = startSession(options({ mode: 'practice' }));
    const result = rate(reveal(state), 'good', 'not-a-day', DECK);
    expect(result.review).toBeUndefined();
    expect(result.state.answers).toEqual([{ rating: 'good', day: '' }]);
    expect(reviewsOf(playThrough(state, () => 'again').state, DECK)).toEqual([]);
  });

  it('reviewsOf lists every recorded rating of the session (first looks only)', () => {
    const state = startSession(options({ mode: 'new' }));
    const done = playThrough(state, (i) => (['again', 'hard', 'good'] as const)[i % 3]!).state;
    const reviews = reviewsOf(done, DECK);
    expect(reviews).toHaveLength(6);
    expect(reviews.map((r) => r.itemId)).toEqual(done.cards.filter((c) => !c.repeat).map((c) => c.item));
    expect(new Set(reviews.map((r) => r.session))).toEqual(new Set([done.session]));
  });

  it('restart returns to the first card without repetitions', () => {
    const state = startSession(options({ mode: 'new' }));
    const mid = rate(reveal(state, 'x'), 'again', TODAY, DECK).state;
    expect(restart(mid)).toEqual(state);
    expect(restart(reveal(state))).toEqual(state);
  });

  it('record deck keys', () => {
    expect(recordDeckOf({ deckId: 'first-words', languages: { learning: 'ja', translation: 'en' } })).toBe('first-words:ja');
    expect(recordDeckOf({ deckId: 'flags', languages: { countries: 'de' } })).toBe('flags');
    expect(recordDeckOf({ deckId: DECK, languages: {} })).toBe(DECK);
  });
});

describe('idempotent learning records', () => {
  it('property: resending the ratings of a session (resume, reload) never counts twice', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.array(fc.constantFrom<LearningRating>('again', 'hard', 'good'), { minLength: 6, maxLength: 12 }), fc.nat(), (seed, ratings, cut) => {
        const learning = createLearningRecords([], { today: () => TODAY });
        let state = startSession(options({ seed, mode: 'new' }));
        const stop = cut % (state.cards.length + 1);
        let i = 0;
        // Rate up to the "reload" point, resend everything (resume), then finish and resend again.
        for (; i < stop; i++) {
          const result = rate(reveal(state), ratings[i % ratings.length]!, TODAY, DECK);
          state = result.state;
          if (result.review) learning.record([result.review]);
        }
        learning.record(reviewsOf(state, DECK));
        while (!isFinished(state)) {
          const result = rate(reveal(state), ratings[i++ % ratings.length]!, TODAY, DECK);
          state = result.state;
          if (result.review) learning.record([result.review]);
          learning.record(reviewsOf(state, DECK));
        }
        const records = learning.all();
        expect(records).toHaveLength(6);
        expect(records.every((r) => r.reviews === 1)).toBe(true);
        // Exactly what a single, uninterrupted delivery produces.
        const once = createLearningRecords([], { today: () => TODAY });
        once.record(reviewsOf(state, DECK));
        expect(records).toEqual(once.all());
      })
    );
  });

  it('a later session on the next due day updates the same records', () => {
    const learning = createLearningRecords([], { today: () => TODAY });
    const first = playThrough(startSession(options({ seed: 1, mode: 'new' })), () => 'good').state;
    learning.record(reviewsOf(first, DECK));
    const records = learning.list(DECK);
    expect(records.every((r) => r.box === 2 && r.due === '2026-03-12')).toBe(true);
    const later = startSession(options({ seed: 2, mode: 'review', records, today: '2026-03-12' }));
    expect(later.cards).toHaveLength(6);
    learning.record(reviewsOf(playThrough(later, () => 'good', '2026-03-12').state, DECK));
    expect(learning.list(DECK).every((r) => r.box === 3 && r.reviews === 2 && r.due === '2026-03-16')).toBe(true);
    const tooEarly = startSession(options({ seed: 3, mode: 'review', records: learning.list(DECK), today: '2026-03-15' }));
    expect(tooEarly.cards).toEqual([]);
    expect(isValidReviewState(tooEarly)).toBe(true);
  });
});

describe('typed answers', () => {
  it('compares leniently', () => {
    expect(matchesAnswer('Hund', 'Hund')).toBe(true);
    expect(matchesAnswer('  hund ', 'Hund')).toBe(true);
    expect(matchesAnswer('cafe', 'Café')).toBe(true);
    expect(matchesAnswer('Muller', 'Müller!')).toBe(true);
    expect(matchesAnswer('der hund', 'der Hund')).toBe(true);
    expect(matchesAnswer('dog', 'dog; hound')).toBe(true);
    expect(matchesAnswer('hound', 'dog, hound')).toBe(true);
    expect(matchesAnswer('grey', 'grey / gray')).toBe(true);
    expect(matchesAnswer('apple', 'apple (fruit)')).toBe(true);
    expect(matchesAnswer('ΚΑΛΗΜΕΡΑ', 'καλημέρα')).toBe(true);
    expect(matchesAnswer('cat', 'dog')).toBe(false);
    expect(matchesAnswer('', '')).toBe(false);
    expect(matchesAnswer('!!', '??')).toBe(false);
    expect(matchesAnswer('hun', 'Hund')).toBe(false);
  });
});

describe('validation of untrusted saves', () => {
  const valid = () => startSession(options({ mode: 'review', records: [rec('a', '2026-03-01'), rec('b', '2026-03-02')] }));
  const playedTwo = () => {
    const s = valid();
    return rate(reveal(rate(reveal(s), 'again', TODAY, DECK).state, 'typed'), 'good', TODAY, DECK).state;
  };

  it('accepts real states, including built-in decks', () => {
    expect(isValidReviewState(valid())).toBe(true);
    expect(isValidReviewState(playedTwo())).toBe(true);
    expect(isValidReviewState(reveal(playedTwo(), 'abc'))).toBe(true);
    const words = builtinItemIds('first-words')!;
    const fw = startSession(options({ deckId: 'first-words', languages: { learning: 'ja', translation: 'en' }, itemIds: words, mode: 'practice', direction: 'mixed' }));
    expect(isValidReviewState(fw)).toBe(true);
    const flags = startSession(options({ deckId: 'flags', languages: { countries: 'pt-BR' }, itemIds: builtinItemIds('flags')!, mode: 'new' }));
    expect(isValidReviewState(flags)).toBe(true);
  });

  it('rejects inconsistent or malformed states', () => {
    const s = playedTwo();
    const fw = startSession(options({ deckId: 'first-words', languages: { learning: 'ja', translation: 'en' }, itemIds: builtinItemIds('first-words')!, mode: 'practice' }));
    const broken: unknown[] = [
      null,
      [],
      { ...s, seed: -1 },
      { ...s, deckId: 'symbols' },
      { ...s, deckId: 'nope' },
      { ...s, languages: { learning: 'ja' } },
      { ...fw, languages: { learning: 'ja', translation: 'ja' } },
      { ...fw, languages: { learning: 'xx', translation: 'en' } },
      { ...fw, cards: [{ item: 'not-a-word', dir: 'forward' }] },
      { ...s, direction: 'up' },
      { ...s, mode: 'cram' },
      { ...s, session: '' },
      { ...s, session: 'x' },
      { ...startSession(options({ mode: 'practice' })), session: '20260310-1' },
      { ...s, index: 5 },
      { ...s, index: 1 },
      { ...s, answers: [{ rating: 'good', day: TODAY }, { rating: 'easy', day: TODAY }] },
      { ...s, answers: [{ rating: 'good', day: TODAY }, { rating: 'good', day: '2026-02-30' }] },
      { ...s, answers: [{ rating: 'good', day: TODAY }, { rating: 'good', day: TODAY }] }, // the repetition has no "Not yet"
      { ...s, cards: s.cards.slice(0, 2) },
      { ...s, cards: [...s.cards, { item: 'a', dir: 'forward', repeat: true }] },
      { ...s, cards: [{ ...s.cards[0], repeat: false }, ...s.cards.slice(1)] },
      { ...s, cards: [{ ...s.cards[0], extra: 1 }, ...s.cards.slice(1)] },
      { ...s, cards: [{ item: 'a', dir: 'backward' }, ...s.cards.slice(1)] },
      { ...s, cards: [s.cards[0], s.cards[0], s.cards[2]] },
      { ...s, cards: [{ item: '', dir: 'forward' }, ...s.cards.slice(1)] },
      { ...s, revealed: 'yes' },
      { ...s, typed: 'abc' },
      { ...reveal(s), typed: '   ' },
      { ...reveal(s), typed: 'x'.repeat(301) },
      { ...s, extra: true },
      { ...startSession(options({ mode: 'practice' })), cards: [], index: 0 },
      { ...startSession(options({ mode: 'new', itemIds: Array.from({ length: 30 }, (_, i) => `i${i}`) })), cards: Array.from({ length: 11 }, (_, i) => ({ item: `i${i}`, dir: 'forward' })) }
    ];
    for (const value of broken) expect(isValidReviewState(value), JSON.stringify(value)?.slice(0, 200)).toBe(false);
    const finished = playThrough(valid(), () => 'good').state;
    expect(isValidReviewState({ ...finished, revealed: true })).toBe(false);
  });

  it('never throws on junk', () => {
    fc.assert(fc.property(fc.anything(), (value) => void expect(() => isValidReviewState(value)).not.toThrow()));
    const hostile = new Proxy({}, { get: () => { throw new Error('boom'); }, ownKeys: () => { throw new Error('boom'); } });
    expect(isValidReviewState(hostile)).toBe(false);
  });
});

describe('records from the scheduling model feed the next session', () => {
  it('uses LearningRecord as LearningRecordSummary', () => {
    const record = applyReview(undefined, { deckId: DECK, itemId: 'a', direction: 'forward', rating: 'again', session: 's', day: '2026-03-09' }) as LearningRecord;
    expect(buildCards({ seed: 1, mode: 'review', direction: 'forward', itemIds: ITEMS, records: [record], today: TODAY })).toEqual([{ item: 'a', dir: 'forward' }]);
  });
});
