import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import type { Deck } from '@wp/learning-content';
import { capitalsDeck, SYMBOL_DECK } from '@wp/learning-content';
import { lookupDeckItems } from '../src/decks';
import { metadata } from '../src/metadata';
import { SYMBOL_IDS } from '../src/messages';
import {
  BOARD,
  cardView,
  DEFAULT_DIFFICULTY,
  deal,
  DIFFICULTIES,
  dismiss,
  hasPendingMismatch,
  isFinished,
  isPair,
  isValidLanguages,
  isValidMemoryState,
  matchedPairs,
  migrateMemoryState,
  MIN_PAIRS,
  pairsFor,
  VARIANT_DECK,
  VARIANTS,
  MAX_MOVES,
  partnerOf,
  select,
  toDifficulty,
  type Card,
  type Difficulty,
  type MemoryState
} from '../src/rules';

const valid = (value: unknown) => isValidMemoryState(value, lookupDeckItems);
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const play = (state: MemoryState, positions: readonly number[]) => positions.reduce((s, p) => select(s, p).state, state);

/** First position whose card is not a pair with `position`. */
const nonPartner = (state: MemoryState, position: number) => state.cards.findIndex((_, i) => i !== position && !isPair(state.cards, position, i));

/** A word↔translation deck: fronts and backs differ, as in later learning decks. */
const WORD_DECK: Deck = {
  schemaVersion: 1,
  id: 'user-words-1',
  title: { en: 'Words' },
  items: ['one', 'two', 'three', 'four', 'five', 'six', 'seven'].map((w, i) => ({
    id: `w${i}`,
    front: { text: w, lang: 'en' },
    back: { text: `${w}-de`, lang: 'de' }
  }))
};

describe('board configuration', () => {
  it('uses 6, 8 and 12 pairs with phone-friendly columns', () => {
    expect(BOARD).toEqual({ small: { pairs: 6, columns: 3 }, medium: { pairs: 8, columns: 4 }, large: { pairs: 12, columns: 4 } });
    for (const d of DIFFICULTIES) expect((BOARD[d].pairs * 2) % BOARD[d].columns).toBe(0);
  });

  it('matches metadata difficulties', () => {
    expect(metadata.difficulties).toEqual([...DIFFICULTIES]);
    expect(DEFAULT_DIFFICULTY).toBe('small');
  });

  it('maps unknown difficulty values to the default', () => {
    expect(toDifficulty('large')).toBe('large');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('huge')).toBe('small');
    expect(toDifficulty(undefined)).toBe('small');
    expect(toDifficulty(3)).toBe('small');
  });
});

describe('deck lookup', () => {
  it('knows the built-in decks and their item ids, and nothing else', () => {
    expect(SYMBOL_DECK.items.map((i) => i.id)).toEqual([...SYMBOL_IDS]);
    for (const id of SYMBOL_IDS) expect(metadata.messages.en?.[`symbol.${id}`]).toBeTruthy();
    expect(lookupDeckItems('symbols')).toEqual([...SYMBOL_IDS]);
    expect(lookupDeckItems('first-words')).toHaveLength(60);
    expect(lookupDeckItems('flags')).toContain('jp');
    expect(lookupDeckItems('nope')).toBeUndefined();
    expect(lookupDeckItems('toString')).toBeUndefined();
    expect(lookupDeckItems('__proto__')).toBeUndefined();
    expect(lookupDeckItems('user-words-1')).toBeUndefined();
  });

  it('maps built-in variants to decks', () => {
    expect(VARIANTS).toEqual(['symbols', 'picture-word', 'word-translation', 'flag-country', 'country-capital', 'own']);
    expect(VARIANT_DECK).toEqual({ symbols: 'symbols', 'picture-word': 'first-words', 'word-translation': 'first-words', 'flag-country': 'flags', 'country-capital': 'capitals' });
  });
});

describe('deal', () => {
  it.each(DIFFICULTIES)('deals exactly one front and one back of each selected item (%s)', (difficulty) => {
    const state = deal(SYMBOL_DECK, difficulty, 123);
    const { pairs } = BOARD[difficulty];
    expect(state.itemIds).toHaveLength(pairs);
    expect(new Set(state.itemIds).size).toBe(pairs);
    for (const id of state.itemIds) expect(SYMBOL_IDS).toContain(id);
    expect(state.cards).toHaveLength(pairs * 2);
    const expected = state.itemIds.flatMap((item): Card[] => [{ item, side: 'front' }, { item, side: 'back' }]);
    const key = (c: Card) => `${c.item}/${c.side}`;
    expect(state.cards.map(key).sort()).toEqual(expected.map(key).sort());
    expect(state).toMatchObject({ seed: 123, difficulty, variant: 'symbols', deckId: 'symbols', languages: {}, revealed: [], moves: 0 });
    expect(state.matched).toEqual(new Array(pairs * 2).fill(false));
    expect(valid(state)).toBe(true);
  });

  it('is a deterministic function of deck, difficulty and seed', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffff_ffff }), fc.constantFrom(...DIFFICULTIES), (seed, difficulty) => {
        expect(deal(SYMBOL_DECK, difficulty, seed)).toEqual(deal(SYMBOL_DECK, difficulty, seed));
      }),
      { numRuns: 50 }
    );
  });

  it('varies with the seed (selection and layout)', () => {
    const deals = Array.from({ length: 20 }, (_, seed) => deal(SYMBOL_DECK, 'small', seed));
    expect(new Set(deals.map((d) => JSON.stringify(d.cards))).size).toBeGreaterThan(15);
    expect(new Set(deals.map((d) => [...d.itemIds].sort().join())).size).toBeGreaterThan(10);
    // Layout is shuffled: the two halves of a pair are not always adjacent.
    expect(deals.some((d) => !isPair(d.cards, 0, 1))).toBe(true);
  });

  it('normalizes the seed to uint32', () => {
    expect(deal(SYMBOL_DECK, 'small', -1).seed).toBe(0xffff_ffff);
    expect(deal(SYMBOL_DECK, 'small', -1).cards).toEqual(deal(SYMBOL_DECK, 'small', 0xffff_ffff).cards);
  });

  it('throws when a built-in variant has too few items, but accepts exactly enough', () => {
    expect(() => deal(WORD_DECK, 'medium', 1, { variant: 'picture-word', languages: { back: 'en' } })).toThrow(RangeError);
    const six = { ...WORD_DECK, items: WORD_DECK.items.slice(0, 6) };
    expect(deal(six, 'small', 1, { variant: 'symbols' }).itemIds.sort()).toEqual(['w0', 'w1', 'w2', 'w3', 'w4', 'w5']);
  });

  it('plays user decks that are smaller than the board with all their items (at least two)', () => {
    expect(pairsFor('own', 'medium', 7)).toBe(7);
    expect(pairsFor('own', 'small', 60)).toBe(6);
    expect(pairsFor('symbols', 'small', 3)).toBe(6);
    const own = deal(WORD_DECK, 'medium', 1);
    expect(own).toMatchObject({ variant: 'own', deckId: 'user-words-1', languages: {} });
    expect(own.itemIds).toHaveLength(7);
    expect(own.cards).toHaveLength(14);
    expect(valid(own)).toBe(true);
    const two = { ...WORD_DECK, items: WORD_DECK.items.slice(0, MIN_PAIRS) };
    expect(deal(two, 'large', 3).itemIds).toHaveLength(2);
    expect(() => deal({ ...WORD_DECK, items: WORD_DECK.items.slice(0, 1) }, 'small', 1)).toThrow(RangeError);
  });

  it('records the variant and content languages', () => {
    const words = { ...WORD_DECK, id: 'first-words', items: Array.from({ length: 8 }, (_, i) => ({ id: `apple${i}`, front: { text: 'x' }, back: { text: 'y' } })) };
    const s = deal(words, 'small', 4, { variant: 'word-translation', languages: { front: 'ja', back: 'de' } });
    expect(s).toMatchObject({ variant: 'word-translation', deckId: 'first-words', languages: { front: 'ja', back: 'de' } });
  });
});

describe('isPair / partnerOf', () => {
  const cards: Card[] = [
    { item: 'a', side: 'front' },
    { item: 'b', side: 'back' },
    { item: 'a', side: 'back' },
    { item: 'b', side: 'front' }
  ];
  it('pairs opposite sides of the same item only', () => {
    expect(isPair(cards, 0, 2)).toBe(true);
    expect(isPair(cards, 2, 0)).toBe(true);
    expect(isPair(cards, 1, 3)).toBe(true);
    expect(isPair(cards, 0, 1)).toBe(false);
    expect(isPair(cards, 0, 3)).toBe(false);
    expect(isPair(cards, 0, 0)).toBe(false);
    expect(isPair(cards, 0, 9)).toBe(false);
    expect(isPair(cards, -1, 0)).toBe(false);
    expect(isPair([{ item: 'a', side: 'front' }, { item: 'a', side: 'front' }], 0, 1)).toBe(false);
  });
  it('finds the partner position', () => {
    expect(cards.map((_, i) => partnerOf(cards, i))).toEqual([2, 3, 0, 1]);
    expect(partnerOf(cards.slice(0, 2), 0)).toBe(-1);
  });
});

describe('select', () => {
  const start = deal(SYMBOL_DECK, 'small', 42);
  const a = 0;
  const partner = partnerOf(start.cards, a);
  const other = nonPartner(start, a);

  it('reveals the first card without counting a move', () => {
    const { state, event } = select(start, a);
    expect(event).toEqual({ kind: 'first', position: a, hid: false });
    expect(state.revealed).toEqual([a]);
    expect(state.moves).toBe(0);
    expect(cardView(state, a)).toBe('revealed');
    expect(cardView(state, partner)).toBe('hidden');
    expect(start.revealed).toEqual([]); // input not mutated
  });

  it('keeps a matching pair face up and counts one move', () => {
    const { state, event } = select(select(start, a).state, partner);
    expect(event).toEqual({ kind: 'match', positions: [a, partner] });
    expect(state.revealed).toEqual([]);
    expect(state.moves).toBe(1);
    expect(state.matched.filter(Boolean)).toHaveLength(2);
    expect(state.matched[a]).toBe(true);
    expect(state.matched[partner]).toBe(true);
    expect(cardView(state, a)).toBe('matched');
    expect(matchedPairs(state)).toBe(1);
    expect(hasPendingMismatch(state)).toBe(false);
  });

  it('leaves a mismatch visible (pending) and counts one move', () => {
    const { state, event } = select(select(start, a).state, other);
    expect(event).toEqual({ kind: 'mismatch', positions: [a, other] });
    expect(state.revealed).toEqual([a, other]);
    expect(state.moves).toBe(1);
    expect(state.matched.every((m) => !m)).toBe(true);
    expect(hasPendingMismatch(state)).toBe(true);
    expect(cardView(state, a)).toBe('revealed');
    expect(cardView(state, other)).toBe('revealed');
  });

  it('ignores the already revealed first card, matched cards and invalid positions', () => {
    const first = select(start, a).state;
    expect(select(first, a)).toEqual({ state: first, event: { kind: 'ignored' } });
    const matched = select(first, partner).state;
    expect(select(matched, a)).toEqual({ state: matched, event: { kind: 'ignored' } });
    expect(select(matched, partner).event.kind).toBe('ignored');
    for (const bad of [-1, 12, 1.5, Number.NaN]) {
      expect(select(start, bad)).toEqual({ state: start, event: { kind: 'ignored' } });
      expect(select(first, bad).state).toBe(first);
    }
  });

  describe('pending mismatch', () => {
    const pending = play(start, [a, other]);
    const hiddenCard = start.cards.findIndex((_, i) => i !== a && i !== other);

    it('blocks a third reveal: selecting a hidden card turns the pair face down and starts a new move', () => {
      const { state, event } = select(pending, hiddenCard);
      expect(event).toEqual({ kind: 'first', position: hiddenCard, hid: true });
      expect(state.revealed).toEqual([hiddenCard]);
      expect(state.moves).toBe(1);
    });

    it('selecting one of the two visible cards only turns them face down', () => {
      for (const p of [a, other]) {
        const { state, event } = select(pending, p);
        expect(event).toEqual({ kind: 'hid' });
        expect(state.revealed).toEqual([]);
        expect(state.moves).toBe(1);
      }
    });

    it('selecting a matched card or an invalid position only turns them face down', () => {
      const withMatch = play(start, [a, partner]);
      const unmatched = withMatch.cards.map((_, i) => i).filter((i) => !withMatch.matched[i]);
      const x = unmatched[0] as number;
      const y = unmatched.find((i) => i !== x && !isPair(withMatch.cards, x, i)) as number;
      const p2 = play(withMatch, [x, y]);
      expect(hasPendingMismatch(p2)).toBe(true);
      expect(select(p2, a)).toEqual({ state: { ...p2, revealed: [] }, event: { kind: 'hid' } });
      expect(select(p2, -1)).toEqual({ state: { ...p2, revealed: [] }, event: { kind: 'hid' } });
    });

    it('dismiss turns both cards face down without changing anything else', () => {
      expect(dismiss(pending)).toEqual({ ...pending, revealed: [] });
      expect(pending.revealed).toHaveLength(2); // not mutated
    });

    it('dismiss is a no-op without a pending mismatch', () => {
      expect(dismiss(start)).toBe(start);
      const first = select(start, a).state;
      expect(dismiss(first)).toBe(first);
    });
  });

  it('a perfect player finishes in exactly one move per pair', () => {
    for (const difficulty of DIFFICULTIES) {
      let state = deal(SYMBOL_DECK, difficulty, 9);
      const { pairs } = BOARD[difficulty];
      for (let i = 0; i < pairs; i++) {
        expect(isFinished(state)).toBe(false);
        const p = state.matched.indexOf(false);
        state = select(select(state, p).state, partnerOf(state.cards, p)).state;
      }
      expect(isFinished(state)).toBe(true);
      expect(state.moves).toBe(pairs);
      expect(matchedPairs(state)).toBe(pairs);
      expect(select(state, 0)).toEqual({ state, event: { kind: 'ignored' } });
    }
  });

  it('works unchanged for decks whose fronts and backs differ', () => {
    const start2 = deal(WORD_DECK, 'small', 5);
    const p = 0;
    const q = partnerOf(start2.cards, p);
    expect(start2.cards[p]?.item).toBe(start2.cards[q]?.item);
    expect(start2.cards[p]?.side).not.toBe(start2.cards[q]?.side);
    expect(select(select(start2, p).state, q).event.kind).toBe('match');
  });
});

describe('isFinished', () => {
  it('is true iff every card is matched', () => {
    const s = deal(SYMBOL_DECK, 'small', 1);
    expect(isFinished(s)).toBe(false);
    expect(isFinished({ ...s, matched: s.matched.map(() => true) })).toBe(true);
    expect(isFinished({ ...s, matched: s.matched.map((_, i) => i > 0) })).toBe(false);
  });
});

describe('isValidMemoryState', () => {
  const base = deal(SYMBOL_DECK, 'medium', 77);
  const a = 0;
  const partner = partnerOf(base.cards, a);
  const other = nonPartner(base, a);
  const matchedOne = play(base, [a, partner]);
  const pending = play(base, [a, other]);
  const firstOnly = play(base, [a]);
  const mutate = (s: MemoryState, f: (x: Record<string, unknown>) => void): unknown => {
    const copy = clone(s) as unknown as Record<string, unknown>;
    f(copy);
    return copy;
  };

  it('accepts valid states in all phases', () => {
    for (const s of [base, matchedOne, pending, firstOnly]) expect(valid(clone(s))).toBe(true);
    expect(valid({ ...matchedOne, moves: 5 })).toBe(true);
    expect(valid({ ...base, seed: 0xffff_ffff })).toBe(true);
    expect(valid({ ...base, moves: MAX_MOVES })).toBe(true);
  });

  it('rejects non-objects and junk', () => {
    for (const junk of [null, undefined, 1, 'x', [], {}, { ...base, cards: 'x' }]) expect(valid(junk)).toBe(false);
  });

  const cases: Array<[string, unknown]> = [
    ['negative seed', { ...base, seed: -1 }],
    ['fractional seed', { ...base, seed: 1.5 }],
    ['seed too large', { ...base, seed: 2 ** 32 }],
    ['unknown difficulty', { ...base, difficulty: 'huge' }],
    ['mismatched difficulty', { ...base, difficulty: 'small' }],
    ['unknown deck', { ...base, deckId: 'nope' }],
    ['deck of another variant', { ...base, deckId: 'flags' }],
    ['unknown variant', { ...base, variant: 'cats' }],
    ['missing variant', mutate(base, (s) => delete s.variant)],
    ['missing languages', mutate(base, (s) => delete s.languages)],
    ['languages for symbols', { ...base, languages: { back: 'de' } }],
    ['languages not an object', { ...base, languages: 'de' }],
    ['own variant with built-in deck id', { ...base, variant: 'own' }],
    ['non-string deck', { ...base, deckId: 1 }],
    ['prototype deck id', { ...base, deckId: 'constructor' }],
    ['unknown item id', mutate(base, (s) => ((s.itemIds as string[])[0] = 'dragon'))],
    ['duplicate item ids', mutate(base, (s) => ((s.itemIds as string[])[1] = (s.itemIds as string[])[0] as string))],
    ['too few item ids', mutate(base, (s) => (s.itemIds as string[]).pop())],
    ['non-string item id', mutate(base, (s) => ((s.itemIds as unknown[])[0] = 5))],
    ['item ids not array', { ...base, itemIds: 'apple' }],
    ['card of unselected item', mutate(base, (s) => {
      const unused = SYMBOL_IDS.find((id) => !(s.itemIds as string[]).includes(id)) as string;
      const cards = s.cards as Card[];
      const victim = cards[0] as Card;
      for (const c of cards) if (c.item === victim.item) c.item = unused;
    })],
    ['duplicate card side', mutate(base, (s) => {
      const cards = s.cards as Card[];
      const p = partnerOf(cards, 0);
      (cards[p] as Card).side = (cards[0] as Card).side;
    })],
    ['card with bad side', mutate(base, (s) => (((s.cards as Card[])[0] as unknown as Record<string, unknown>).side = 'top'))],
    ['card with non-string item', mutate(base, (s) => (((s.cards as Card[])[0] as unknown as Record<string, unknown>).item = 1))],
    ['card not an object', mutate(base, (s) => ((s.cards as unknown[])[0] = 'apple'))],
    ['missing card', mutate(base, (s) => (s.cards as unknown[]).pop())],
    ['extra card', mutate(base, (s) => (s.cards as unknown[]).push({ item: 'apple', side: 'front' }))],
    ['matched wrong length', mutate(base, (s) => (s.matched as unknown[]).pop())],
    ['matched non-boolean', mutate(base, (s) => ((s.matched as unknown[])[0] = 1))],
    ['matched not array', { ...base, matched: {} }],
    ['half-matched pair', mutate(base, (s) => ((s.matched as boolean[])[a] = true))],
    ['revealed not array', { ...base, revealed: 0 }],
    ['three revealed', { ...firstOnly, revealed: [0, 1, 2], moves: 2 }],
    ['duplicate revealed', { ...firstOnly, revealed: [a, a], moves: 1 }],
    ['revealed out of range', { ...base, revealed: [base.cards.length] }],
    ['revealed negative', { ...base, revealed: [-1] }],
    ['revealed fractional', { ...base, revealed: [0.5] }],
    ['revealed matched card', { ...matchedOne, revealed: [a] }],
    ['revealed pair not matched', { ...base, revealed: [a, partner], moves: 1 }],
    ['moves below found pairs', { ...matchedOne, moves: 0 }],
    ['moves below pending move', { ...pending, moves: 0 }],
    ['negative moves', { ...base, moves: -1 }],
    ['fractional moves', { ...base, moves: 0.5 }],
    ['too many moves', { ...base, moves: MAX_MOVES + 1 }],
    ['string moves', { ...base, moves: '1' }],
    ['missing moves', mutate(base, (s) => delete s.moves)]
  ];
  it.each(cases)('rejects %s', (_, value) => {
    expect(valid(value)).toBe(false);
  });

  it('validates the recorded languages per variant', () => {
    expect(isValidLanguages('symbols', {})).toBe(true);
    expect(isValidLanguages('own', {})).toBe(true);
    expect(isValidLanguages('own', { front: 'de' })).toBe(false);
    expect(isValidLanguages('picture-word', { back: 'ja' })).toBe(true);
    expect(isValidLanguages('picture-word', { back: 'sv' })).toBe(false);
    expect(isValidLanguages('picture-word', { front: 'ja', back: 'ja' })).toBe(false);
    expect(isValidLanguages('word-translation', { front: 'ja', back: 'de' })).toBe(true);
    expect(isValidLanguages('word-translation', { front: 'de', back: 'de' })).toBe(false);
    expect(isValidLanguages('word-translation', { front: 'ja' })).toBe(false);
    expect(isValidLanguages('flag-country', { back: 'sv' })).toBe(true);
    expect(isValidLanguages('flag-country', { back: 'not a tag' })).toBe(false);
    expect(isValidLanguages('flag-country', { back: `en-${'x'.repeat(40)}` })).toBe(false);
    expect(isValidLanguages('country-capital', { back: 'ja' })).toBe(true);
    expect(isValidLanguages('country-capital', { back: 'sv' })).toBe(false); // no capital names in Swedish
    expect(isValidLanguages('country-capital', { front: 'ja', back: 'ja' })).toBe(false);
    expect(isValidLanguages('country-capital', {})).toBe(false);
    expect(isValidLanguages('symbols', { other: 'x' })).toBe(false);
    expect(isValidLanguages('symbols', null)).toBe(false);
  });

  it('validates built-in word and flag games against their decks', () => {
    const words = deal({ ...SYMBOL_DECK, id: 'first-words', items: (lookupDeckItems('first-words') ?? []).map((id) => ({ id, front: { text: id }, back: { text: id } })) }, 'small', 8, { variant: 'picture-word', languages: { back: 'ko' } });
    expect(valid(words)).toBe(true);
    expect(valid({ ...words, variant: 'word-translation' })).toBe(false);
    expect(valid({ ...words, variant: 'word-translation', languages: { front: 'ko', back: 'en' } })).toBe(true);
    expect(valid(mutate(words, (s) => ((s.itemIds as string[])[0] = 'dragon')))).toBe(false);
    const flags = deal({ ...SYMBOL_DECK, id: 'flags', items: (lookupDeckItems('flags') ?? []).map((id) => ({ id, front: { text: id }, back: { text: id } })) }, 'large', 8, { variant: 'flag-country', languages: { back: 'de' } });
    expect(valid(flags)).toBe(true);
    expect(valid({ ...flags, deckId: 'first-words' })).toBe(false);
  });

  it('validates country ↔ capital games against the capitals deck', () => {
    const capitals = deal(capitalsDeck('fr'), 'large', 8, { variant: 'country-capital', languages: { back: 'fr' } });
    expect(capitals.deckId).toBe('capitals');
    expect(valid(capitals)).toBe(true);
    expect(valid(JSON.parse(JSON.stringify(capitals)))).toBe(true);
    expect(lookupDeckItems('capitals')).toContain('jp');
    // Another deck id, a language without capital names, or a card the deck does not have: rejected.
    expect(valid({ ...capitals, deckId: 'flags' })).toBe(false);
    expect(valid({ ...capitals, variant: 'flag-country' })).toBe(false);
    expect(valid({ ...capitals, languages: { back: 'sv' } })).toBe(false);
    expect(valid({ ...capitals, languages: {} })).toBe(false);
    const swap = (from: string, to: string) =>
      mutate(capitals, (s) => {
        s.itemIds = (s.itemIds as string[]).map((id) => (id === from ? to : id));
        s.cards = (s.cards as Card[]).map((c) => (c.item === from ? { ...c, item: to } : c));
      });
    const first = capitals.itemIds[0] as string;
    expect(valid(swap(first, 'za'))).toBe(false); // in the flags deck, but without a capital
    expect(valid(swap(first, 'xx'))).toBe(false);
    const unused = (lookupDeckItems('capitals') ?? []).find((id) => !capitals.itemIds.includes(id)) as string;
    expect(valid(swap(first, unused))).toBe(true);
  });

  it('validates own-deck games structurally (the deck itself may be gone)', () => {
    const own = deal(WORD_DECK, 'small', 2);
    expect(valid(own)).toBe(true);
    expect(valid({ ...own, deckId: 'symbols' })).toBe(false);
    expect(valid({ ...own, deckId: 'User-Words' })).toBe(false);
    expect(valid(mutate(own, (s) => ((s.itemIds as string[])[0] = '')))).toBe(false);
    expect(valid(mutate(own, (s) => ((s.itemIds as string[])[0] = 'x'.repeat(201))))).toBe(false);
    const big = deal({ ...WORD_DECK, items: Array.from({ length: 20 }, (_, i) => ({ id: `i${i}`, front: { text: 'a' }, back: { text: 'b' } })) }, 'small', 2);
    expect(valid({ ...big, difficulty: 'medium' })).toBe(true); // 6 pairs is a valid smaller own-deck board
    expect(valid({ ...deal(WORD_DECK, 'medium', 2), difficulty: 'small' })).toBe(false); // 7 pairs > 6
  });

  it('accepts the lowest consistent move counts exactly', () => {
    expect(valid({ ...pending, moves: 1 })).toBe(true);
    expect(valid({ ...matchedOne, moves: 1 })).toBe(true);
    expect(valid({ ...firstOnly, moves: 0 })).toBe(true);
  });

  it('never throws, even if the lookup or data misbehaves', () => {
    const throwing = () => {
      throw new Error('boom');
    };
    expect(isValidMemoryState(base, throwing)).toBe(false);
    fc.assert(fc.property(fc.anything(), (v) => typeof isValidMemoryState(v, lookupDeckItems) === 'boolean'), { numRuns: 300 });
  });
});

describe('random legal play (property)', () => {
  type Action = { type: 'select'; position: number } | { type: 'continue' };
  const action = fc.oneof(
    { weight: 6, arbitrary: fc.integer({ min: -1, max: 24 }).map((position): Action => ({ type: 'select', position })) },
    { weight: 1, arbitrary: fc.constant<Action>({ type: 'continue' }) }
  );

  it('preserves invariants for arbitrary click sequences', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffff_ffff }), fc.constantFrom<Difficulty>(...DIFFICULTIES), fc.array(action, { maxLength: 150 }), (seed, difficulty, actions) => {
        let state = deal(SYMBOL_DECK, difficulty, seed);
        const layout = clone(state.cards);
        for (const act of actions) {
          const before = state;
          const snapshot = clone(before);
          let event: string;
          if (act.type === 'continue') {
            state = dismiss(state);
            event = hasPendingMismatch(before) ? 'hid' : 'ignored';
          } else {
            const result = select(state, act.position);
            state = result.state;
            event = result.event.kind;
          }
          // Inputs are never mutated; layout and identity never change.
          expect(before).toEqual(snapshot);
          expect(state.cards).toEqual(layout);
          expect(state.itemIds).toEqual(before.itemIds);
          expect(valid(state)).toBe(true);
          // Matched cards never un-match; at most 2 revealed unmatched cards.
          before.matched.forEach((m, i) => m && expect(state.matched[i]).toBe(true));
          expect(state.revealed.length).toBeLessThanOrEqual(2);
          expect(state.revealed.every((p) => !state.matched[p])).toBe(true);
          // Moves count completed pairs of reveals.
          const delta = state.moves - before.moves;
          expect(delta).toBe(event === 'match' || event === 'mismatch' ? 1 : 0);
          const newlyMatched = matchedPairs(state) - matchedPairs(before);
          expect(newlyMatched).toBe(event === 'match' ? 1 : 0);
          if (event === 'ignored') expect(state).toEqual(before);
          if (event === 'mismatch') expect(hasPendingMismatch(state)).toBe(true);
          if (hasPendingMismatch(before) && act.type === 'select') expect(state.revealed.length).toBeLessThanOrEqual(1);
          expect(isFinished(state)).toBe(state.matched.every(Boolean));
          if (isFinished(state)) expect(state.revealed).toEqual([]);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('always reaches the end when the player keeps turning over hidden cards', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffff_ffff }), fc.constantFrom<Difficulty>(...DIFFICULTIES), fc.infiniteStream(fc.nat()), (seed, difficulty, picks) => {
        let state = deal(SYMBOL_DECK, difficulty, seed);
        const it = picks[Symbol.iterator]();
        let steps = 0;
        while (!isFinished(state) && steps < 10_000) {
          const candidates = state.cards.map((_, i) => i).filter((i) => cardView(state, i) === 'hidden');
          const pick = candidates[(it.next().value as number) % candidates.length] as number;
          state = select(state, pick).state;
          steps++;
        }
        expect(isFinished(state)).toBe(true);
        expect(state.moves).toBeGreaterThanOrEqual(BOARD[difficulty].pairs);
      }),
      { numRuns: 30 }
    );
  });
});

describe('migrateMemoryState (v1 → v2)', () => {
  const v1 = () => {
    const state = play(deal(SYMBOL_DECK, 'medium', 31), [0, 1]) as unknown as Record<string, unknown>;
    const copy = clone(state);
    delete copy.variant;
    delete copy.languages;
    return copy;
  };

  it('adds the symbols variant and empty languages, keeping everything else unchanged', () => {
    const old = v1();
    const migrated = migrateMemoryState(old, 1);
    expect(migrated).toEqual({ ...old, variant: 'symbols', languages: {} });
    expect(valid(migrated)).toBe(true);
    expect(migrated).toEqual(play(deal(SYMBOL_DECK, 'medium', 31), [0, 1]));
  });

  it('refuses unknown versions and non-objects', () => {
    expect(migrateMemoryState(v1(), 2)).toBeUndefined();
    expect(migrateMemoryState(v1(), 0)).toBeUndefined();
    expect(migrateMemoryState(null, 1)).toBeUndefined();
    expect(migrateMemoryState([], 1)).toBeUndefined();
    expect(migrateMemoryState({ ...v1(), variant: 'own' }, 1)).toBeUndefined();
  });

  it('migrated junk is still rejected by validation', () => {
    expect(valid(migrateMemoryState({ seed: 1 }, 1))).toBe(false);
  });
});
