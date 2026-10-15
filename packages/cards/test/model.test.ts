import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import {
  areDisjoint, cardComparator, deal, deck32, deck52, isCard, isCardList, isRank, isRedSuit, isSuit, makeCard,
  RANKS, rankOf, shuffleCards, shuffleWithState, SHORT_RANKS, sortCards, SUITS, suitOf, type Card
} from '../src';

describe('decks', () => {
  it('deck52 has 52 distinct valid cards, 13 per suit', () => {
    const deck = deck52();
    expect(deck).toHaveLength(52);
    expect(new Set(deck).size).toBe(52);
    expect(deck.every(isCard)).toBe(true);
    for (const suit of SUITS) expect(deck.filter((c) => suitOf(c) === suit)).toHaveLength(13);
    for (const rank of RANKS) expect(deck.filter((c) => rankOf(c) === rank)).toHaveLength(4);
  });

  it('deck32 has 7 to ace in four suits and is a subset of deck52', () => {
    const deck = deck32();
    expect(deck).toHaveLength(32);
    expect(new Set(deck).size).toBe(32);
    expect(new Set(deck.map(rankOf))).toEqual(new Set(SHORT_RANKS));
    const full = new Set(deck52());
    expect(deck.every((c) => full.has(c))).toBe(true);
    expect(deck).toContain('7H');
    expect(deck).not.toContain('6H');
  });

  it('builds ids rank-first and splits them back', () => {
    expect(makeCard('A', 'S')).toBe('AS');
    expect(makeCard('T', 'D')).toBe('TD');
    expect(rankOf('7H')).toBe('7');
    expect(suitOf('7H')).toBe('H');
    expect(isRedSuit('H') && isRedSuit('D') && !isRedSuit('S') && !isRedSuit('C')).toBe(true);
    expect(isSuit('H') && !isSuit('X') && isRank('T') && !isRank('10')).toBe(true);
  });
});

describe('validators', () => {
  it('accept cards and reject near misses', () => {
    expect(isCard('AS')).toBe(true);
    for (const bad of ['', 'A', 'AS ', 'as', '1S', '10S', 'AX', 'SA', null, undefined, 12, ['AS'], { r: 'A' }]) expect(isCard(bad)).toBe(false);
  });

  it('isCardList checks uniqueness, deck membership and length', () => {
    expect(isCardList([])).toBe(true);
    expect(isCardList(['AS', 'KH'])).toBe(true);
    expect(isCardList(['AS', 'AS'])).toBe(false);
    expect(isCardList(['AS', 'AS'], { unique: false })).toBe(true);
    expect(isCardList(['2S'], { deck: deck32() })).toBe(false);
    expect(isCardList(['7S'], { deck: deck32() })).toBe(true);
    expect(isCardList(['7S'], { minLength: 2 })).toBe(false);
    expect(isCardList(['7S', '8S', '9S'], { maxLength: 2 })).toBe(false);
    expect(isCardList('AS')).toBe(false);
    expect(isCardList(new Array<string>(2).fill('AS', 1))).toBe(false); // sparse
  });

  it('never throw on arbitrary input, including hostile objects', () => {
    const revoked = Proxy.revocable([], {});
    revoked.revoke();
    const throwing = new Proxy(['AS'], { get: () => { throw new Error('boom'); } });
    expect(isCardList(revoked.proxy)).toBe(false);
    expect(isCardList(throwing)).toBe(false);
    fc.assert(fc.property(fc.anything(), (value) => {
      expect(typeof isCard(value)).toBe('boolean');
      expect(typeof isCardList(value)).toBe('boolean');
      expect(typeof isCardList(value, { deck: deck32(), unique: false })).toBe('boolean');
    }), { numRuns: 500 });
  });

  it('round-trips every card list through JSON', () => {
    fc.assert(fc.property(fc.subarray(deck52()), (cards) => {
      const copy: unknown = JSON.parse(JSON.stringify(cards));
      expect(isCardList(copy)).toBe(true);
      expect(copy).toEqual(cards);
    }));
  });

  it('areDisjoint detects shared cards', () => {
    expect(areDisjoint(['AS'], ['KS'], [])).toBe(true);
    expect(areDisjoint(['AS'], ['KS', 'AS'])).toBe(false);
  });
});

describe('shuffle', () => {
  it('is deterministic per seed and a permutation', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 0xffffffff }), (seed) => {
      const a = shuffleCards(deck52(), createRng(seed));
      const b = shuffleCards(deck52(), createRng(seed));
      expect(a).toEqual(b);
      expect([...a].sort()).toEqual([...deck52()].sort());
    }), { numRuns: 50 });
  });

  it('does not mutate its input and differs between seeds', () => {
    const deck = deck32();
    const before = [...deck];
    const a = shuffleCards(deck, createRng(1));
    const b = shuffleCards(deck, createRng(2));
    expect(deck).toEqual(before);
    expect(a).not.toEqual(b);
  });

  it('pins the order for a fixed seed (saves stay valid across releases)', () => {
    expect(shuffleCards(deck32(), createRng(42)).slice(0, 8)).toMatchInlineSnapshot(`
      [
        "JD",
        "TD",
        "JS",
        "QD",
        "8H",
        "8C",
        "7H",
        "9C",
      ]
    `);
  });

  it('shuffleWithState continues the sequence from the returned state', () => {
    const first = shuffleWithState(deck32(), 7);
    const second = shuffleWithState(deck32(), first.rngState);
    const rng = createRng(7);
    expect(first.cards).toEqual(shuffleCards(deck32(), rng));
    expect(second.cards).toEqual(shuffleCards(deck32(), rng));
    expect(second.rngState).toBe(rng.state());
  });

  it('is roughly uniform: each card lands in each position about equally often (chi-square)', () => {
    const deck = deck32().slice(0, 8);
    const runs = 8000;
    const counts = deck.map(() => new Array<number>(deck.length).fill(0));
    const rng = createRng(2024);
    for (let r = 0; r < runs; r++) {
      shuffleCards(deck, rng).forEach((card, pos) => {
        const row = counts[deck.indexOf(card)] as number[];
        row[pos] = (row[pos] as number) + 1;
      });
    }
    const expected = runs / deck.length;
    let chi = 0;
    for (const row of counts) for (const observed of row) chi += (observed - expected) ** 2 / expected;
    // 64 cells, (8-1)^2 = 49 degrees of freedom: the 99.9 % quantile is about 85.4.
    expect(chi).toBeLessThan(85.4);
    expect(chi).toBeGreaterThan(10); // suspiciously perfect would mean a broken generator
  });
});

describe('deal', () => {
  it('deals Skat: three hands of ten and a skat of two', () => {
    const deck = shuffleCards(deck32(), createRng(3));
    const { hands, rest } = deal(deck, [10, 10, 10]);
    expect(hands.map((h) => h.length)).toEqual([10, 10, 10]);
    expect(rest).toHaveLength(2);
    expect(areDisjoint(...hands, rest)).toBe(true);
  });

  it('throws on impossible deals', () => {
    expect(() => deal(deck32(), [33])).toThrow(RangeError);
    expect(() => deal(deck32(), [-1])).toThrow(RangeError);
  });
});

describe('sorting', () => {
  it('groups by suit in Skat order, high ranks first, by default', () => {
    expect(sortCards(['7H', 'AS', 'TD', 'KS', 'JC'] as Card[])).toEqual(['JC', 'AS', 'KS', '7H', 'TD']);
  });

  it('supports rank-first, ascending and custom orders', () => {
    expect(sortCards(['2H', 'AS', '2C'] as Card[], { by: 'rank', descending: false })).toEqual(['2C', '2H', 'AS']);
    expect(sortCards(['AH', 'AS'] as Card[], { suits: ['H', 'S', 'D', 'C'] })).toEqual(['AH', 'AS']);
    // Skat-like rank order with the ten above the king.
    const skat = ['7', '8', '9', 'Q', 'K', 'T', 'A'] as const;
    expect(sortCards(['KH', 'TH', 'AH', 'JH'] as Card[], { ranks: skat })).toEqual(['AH', 'TH', 'KH', 'JH']);
    const jacksFirst = (a: Card, b: Card) => Number(rankOf(b) === 'J') - Number(rankOf(a) === 'J') || cardComparator()(a, b);
    expect(sortCards(['AS', 'JD', 'JC'] as Card[], jacksFirst)).toEqual(['JC', 'JD', 'AS']);
  });

  it('is a total order: sorting is stable under shuffling', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 1e6 }), (seed) => {
      expect(sortCards(shuffleCards(deck52(), createRng(seed)))).toEqual(sortCards(deck52()));
    }), { numRuns: 30 });
  });
});
