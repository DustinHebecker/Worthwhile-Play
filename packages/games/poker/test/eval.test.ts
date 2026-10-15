import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { deck52, type Card } from '@wp/cards';
import { cardId, cardOfId, categoryOf, HAND_CATEGORIES, scoreCards, scoreIds } from '../src/eval';

/* ------------------------------------------------------------------------------------------------
 * Independent oracle: a deliberately simple five-card evaluator (sort, group, compare tuples) and the
 * best of all 21 five-card subsets of seven cards. Shares no code with src/eval.ts.
 * ---------------------------------------------------------------------------------------------- */
const ORDER = '23456789TJQKA';
type Tuple = number[];

function oracle5(cards: readonly string[]): Tuple {
  const ranks = cards.map((c) => ORDER.indexOf(c[0] as string)).sort((a, b) => b - a);
  const flush = cards.every((c) => c[1] === cards[0]?.[1]);
  const unique = [...new Set(ranks)];
  let straightHigh = -1;
  if (unique.length === 5) {
    if ((unique[0] as number) - (unique[4] as number) === 4) straightHigh = unique[0] as number;
    else if (unique.join(',') === '12,3,2,1,0') straightHigh = 3;
  }
  const groups = unique
    .map((r) => ({ r, n: ranks.filter((x) => x === r).length }))
    .sort((a, b) => b.n - a.n || b.r - a.r);
  const shape = groups.map((g) => g.n).join('');
  const byGroup = groups.map((g) => g.r);
  if (straightHigh >= 0 && flush) return [8, straightHigh];
  if (shape === '41') return [7, ...byGroup];
  if (shape === '32') return [6, ...byGroup];
  if (flush) return [5, ...ranks];
  if (straightHigh >= 0) return [4, straightHigh];
  if (shape === '311') return [3, ...byGroup];
  if (shape === '221') return [2, ...byGroup];
  if (shape === '2111') return [1, ...byGroup];
  return [0, ...ranks];
}

const compareTuples = (a: Tuple, b: Tuple): number => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? -1) - (b[i] ?? -1);
    if (d !== 0) return Math.sign(d);
  }
  return 0;
};

function oracleBest(cards: readonly string[]): Tuple {
  let best: Tuple = [-1];
  const n = cards.length;
  for (let a = 0; a < n; a++)
    for (let b = a + 1; b < n; b++)
      for (let c = b + 1; c < n; c++)
        for (let d = c + 1; d < n; d++)
          for (let e = d + 1; e < n; e++) {
            const t = oracle5([cards[a], cards[b], cards[c], cards[d], cards[e]] as string[]);
            if (compareTuples(t, best) > 0) best = t;
          }
  return best;
}

const sevenCards = fc.shuffledSubarray([...Array(52).keys()], { minLength: 7, maxLength: 7 }).map((ids) => ids.map(cardOfId));
const twoHands = fc
  .shuffledSubarray([...Array(52).keys()], { minLength: 9, maxLength: 9 })
  .map((ids) => ids.map(cardOfId))
  .map((cards) => ({ a: [...cards.slice(0, 2), ...cards.slice(4)], b: [...cards.slice(2, 4), ...cards.slice(4)] }));

const H = (text: string) => text.split(' ') as Card[];

describe('card ids', () => {
  it('maps every card to a unique id and back', () => {
    const ids = deck52().map(cardId);
    expect(new Set(ids).size).toBe(52);
    expect(Math.min(...ids)).toBe(0);
    expect(Math.max(...ids)).toBe(51);
    for (const card of deck52()) expect(cardOfId(cardId(card))).toBe(card);
    expect(cardId('2C')).toBe(0);
    expect(cardId('AC')).toBe(12);
    expect(cardId('2S')).toBe(13);
    expect(cardId('AD')).toBe(51);
  });
});

describe('hand categories (examples)', () => {
  const cases: [string, (typeof HAND_CATEGORIES)[number]][] = [
    ['AS KS QS JS TS 2D 3C', 'straightFlush'],
    ['5H 4H 3H 2H AH KD KC', 'straightFlush'],
    ['9C 9D 9H 9S 2D 3C 4H', 'quads'],
    ['KC KD KH 5S 5D 2C 3H', 'fullHouse'],
    ['KC KD KH 5S 5D 5C 3H', 'fullHouse'],
    ['2H 7H 9H JH KH AS AD', 'flush'],
    ['AS 2D 3C 4H 5S 9D KC', 'straight'],
    ['TS JD QC KH AS 2D 3C', 'straight'],
    ['7S 7D 7C KH 2S 4D 9C', 'trips'],
    ['7S 7D KC KH 2S 2D 9C', 'twoPair'],
    ['7S 7D KC QH 2S 4D 9C', 'pair'],
    ['7S 3D KC QH 2S 4D 9C', 'highCard']
  ];
  it.each(cases)('%s is %s', (hand, category) => {
    expect(categoryOf(scoreCards(H(hand)))).toBe(category);
  });

  it('orders kickers, wheels and boards correctly', () => {
    const s = (hand: string) => scoreCards(H(hand));
    expect(s('AS AD KC 7H 4S 3D 2C')).toBeGreaterThan(s('AS AD QC JH 9S 3D 2C'));
    expect(s('AS 2D 3C 4H 5S 9D KC')).toBeLessThan(s('6S 2D 3C 4H 5S 9D KC'));
    expect(s('AS KD 7C 7H 2S 2D 4C')).toBe(s('AH KC 7D 7S 2H 2C 4D'));
    // Three pairs: the best two count, the third pair's rank can be the kicker.
    expect(s('KS KD 9C 9H 8S 8D 2C')).toBeGreaterThan(s('KS KD 9C 9H 7S 6D 2C'));
    // Two trips make a full house with the lower trip as the pair.
    expect(s('KS KD KC 9H 9S 9D 2C')).toBeGreaterThan(s('KS KD KC 8H 8S 8D AC'));
    // A flush beats a straight on the same seven cards.
    expect(categoryOf(s('2H 3H 4H 5D 6H 9H KC'))).toBe('flush');
    // Quads with the best kicker from the rest.
    expect(s('9C 9D 9H 9S AD KC KH')).toBeGreaterThan(s('9C 9D 9H 9S QD QC QH'));
    expect(s('JC TD 9H 8S 7D 6C 5H')).toBe(s('JD TC 9S 8H 7C 2C 3H'));
  });

  it('accepts 5, 6 and 7 cards', () => {
    expect(categoryOf(scoreIds(H('AS KS QS JS TS').map(cardId)))).toBe('straightFlush');
    expect(categoryOf(scoreIds(H('AS AD 3C 3H 9S 9D').map(cardId)))).toBe('twoPair');
    const ids = H('AS AD 3C 3H 9S 9D 2C').map(cardId);
    expect(scoreIds(ids, 5)).toBe(scoreIds(ids.slice(0, 5)));
  });
});

describe('evaluator against the brute-force oracle', () => {
  it('finds the same category and kicker order as the best of 21 five-card hands', () => {
    fc.assert(
      fc.property(sevenCards, (cards) => {
        const tuple = oracleBest(cards);
        expect(HAND_CATEGORIES.indexOf(categoryOf(scoreCards(cards)))).toBe(tuple[0]);
      }),
      { numRuns: 3000, seed: 1 }
    );
  });

  it('orders pairs of hands exactly like the oracle (wins, losses and ties)', () => {
    fc.assert(
      fc.property(twoHands, ({ a, b }) => {
        const fast = Math.sign(scoreCards(a) - scoreCards(b));
        expect(fast).toBe(compareTuples(oracleBest(a), oracleBest(b)));
      }),
      { numRuns: 3000, seed: 2 }
    );
  });

  it('agrees with the oracle on hands rich in pairs, flushes and straights', () => {
    // Few ranks / one suit heavy: forces the rare categories much more often than random deals.
    const narrow = fc
      .shuffledSubarray(
        deck52().filter((c) => '9TJQKA'.includes(c[0] as string) || c[1] === 'H'),
        { minLength: 14, maxLength: 14 }
      )
      .map((cards) => ({ a: [...cards.slice(0, 7)], b: [...cards.slice(7, 9), ...cards.slice(2, 7)] }));
    fc.assert(
      fc.property(narrow, ({ a, b }) => {
        expect(Math.sign(scoreCards(a) - scoreCards(b))).toBe(compareTuples(oracleBest(a), oracleBest(b)));
      }),
      { numRuns: 3000, seed: 3 }
    );
  });
});

describe('all five-card hands', () => {
  it('has exactly 7,462 distinct ranks with the known class counts and frequencies', () => {
    const distinct = new Set<number>();
    const frequency = new Array<number>(9).fill(0);
    const ids = new Int32Array(5);
    for (let a = 0; a < 52; a++)
      for (let b = a + 1; b < 52; b++)
        for (let c = b + 1; c < 52; c++)
          for (let d = c + 1; d < 52; d++)
            for (let e = d + 1; e < 52; e++) {
              ids[0] = a;
              ids[1] = b;
              ids[2] = c;
              ids[3] = d;
              ids[4] = e;
              const score = scoreIds(ids, 5);
              distinct.add(score);
              frequency[score >> 20] = (frequency[score >> 20] as number) + 1;
            }
    expect(distinct.size).toBe(7462);
    const classes = new Array<number>(9).fill(0);
    for (const score of distinct) classes[score >> 20] = (classes[score >> 20] as number) + 1;
    expect(classes).toEqual([1277, 2860, 858, 858, 10, 1277, 156, 156, 10]);
    expect(frequency).toEqual([1302540, 1098240, 123552, 54912, 10200, 5108, 3744, 624, 40]);
  }, 120_000);

  it('the 7,462 classes agree with the oracle order on a sample', () => {
    // One representative hand per distinct score, compared with its neighbours in score order.
    const reps = new Map<number, string[]>();
    const all = deck52();
    const rng = fc.sample(fc.shuffledSubarray(all, { minLength: 5, maxLength: 5 }), { numRuns: 20000, seed: 9 });
    for (const hand of rng) reps.set(scoreCards(hand), hand);
    const sorted = [...reps.entries()].sort((x, y) => x[0] - y[0]);
    for (let i = 1; i < sorted.length; i++) {
      expect(compareTuples(oracle5((sorted[i] as [number, string[]])[1]), oracle5((sorted[i - 1] as [number, string[]])[1]))).toBe(1);
    }
  });
});
