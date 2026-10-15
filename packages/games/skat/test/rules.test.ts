import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { deck32, rankOf, suitOf, type Card } from '@wp/cards';
import { advance, chooseAction, viewFor } from '../src/ai';
import {
  BID_VALUES,
  applyAction,
  applyDealAction,
  beats,
  biddingStatus,
  cardPoints,
  dealPhase,
  declarerCards,
  effectiveSuit,
  endSeries,
  entryScores,
  finishedResult,
  isLegalContract,
  isValidState,
  legalCards,
  matadors,
  minimumValue,
  newDeal,
  newGame,
  nextBid,
  nextDeal,
  roleOf,
  roundUpTo,
  sortHand,
  startSeries,
  sumPoints,
  toAct,
  totals,
  trickLeaders,
  trickWinnerIndex,
  trickWinners,
  valueGame,
  type BidAction,
  type Contract,
  type DealState,
  type GameKind,
  type ListEntry,
  type PlayKind,
  type Seat,
  type SkatState
} from '../src/rules';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const C = (kind: GameKind, extra: Partial<Contract> = {}): Contract => ({ kind, hand: false, schneider: false, schwarz: false, ouvert: false, ...extra });

// ----------------------------------------------------------------- independent oracle for trick taking
const ORACLE_SUIT = ['7', '8', '9', 'Q', 'K', 'T', 'A'];
const ORACLE_NULL = ['7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const ORACLE_JACKS = ['JD', 'JH', 'JS', 'JC'];
/** A total score per card: trumps above everything, then the led suit; other suits never win. */
function oracleScore(card: Card, led: Card, kind: PlayKind): number {
  if (kind === 'null') return suitOf(card) === suitOf(led) ? 1 + ORACLE_NULL.indexOf(rankOf(card)) : 0;
  const trumpSuit = kind === 'grand' || kind === 'ramsch' ? null : kind;
  const isJack = rankOf(card) === 'J';
  if (isJack) return 100 + ORACLE_JACKS.indexOf(card);
  if (suitOf(card) === trumpSuit) return 50 + ORACLE_SUIT.indexOf(rankOf(card));
  const ledIsTrump = rankOf(led) === 'J' || suitOf(led) === trumpSuit;
  if (!ledIsTrump && suitOf(card) === suitOf(led)) return 1 + ORACLE_SUIT.indexOf(rankOf(card));
  return 0;
}
const oracleWinner = (trick: readonly Card[], kind: PlayKind) => {
  const scores = trick.map((c) => oracleScore(c, trick[0] as Card, kind));
  return scores.indexOf(Math.max(...scores));
};

const KINDS: readonly PlayKind[] = ['C', 'S', 'H', 'D', 'grand', 'null', 'ramsch'];
const arbKind = fc.constantFrom(...KINDS);
const arbDeck = fc.shuffledSubarray(deck32(), { minLength: 32, maxLength: 32 }) as fc.Arbitrary<Card[]>;

describe('cards and trumps', () => {
  it('card points: A 11, 10 10, K 4, Q 3, J 2, others 0; 120 in the deck', () => {
    expect(['AC', 'TC', 'KC', 'QC', 'JC', '9C', '8C', '7C'].map((c) => cardPoints(c as Card))).toEqual([11, 10, 4, 3, 2, 0, 0, 0]);
    expect(sumPoints(deck32())).toBe(120);
  });

  it('orders trumps in a suit game: four jacks (C S H D), then A 10 K Q 9 8 7', () => {
    const trumps = deck32().filter((c) => effectiveSuit(c, 'H') === 'T');
    const sorted = [...trumps].sort((a, b) => (beats(a, b, 'H') ? -1 : beats(b, a, 'H') ? 1 : 0));
    expect(sorted).toEqual(['JC', 'JS', 'JH', 'JD', 'AH', 'TH', 'KH', 'QH', '9H', '8H', '7H']);
    expect(sortHand(['7H', 'JD', 'AC', 'TH', 'JC'], 'H')).toEqual(['JC', 'JD', 'TH', '7H', 'AC']);
  });

  it('in Grand only the jacks are trumps; side suits rank A 10 K Q 9 8 7', () => {
    expect(deck32().filter((c) => effectiveSuit(c, 'grand') === 'T')).toEqual(['JC', 'JS', 'JH', 'JD']);
    expect(beats('TS', 'KS', 'grand')).toBe(true);
    expect(beats('KS', 'TS', 'grand')).toBe(false);
    expect(beats('JD', 'AS', 'grand')).toBe(true);
    expect(beats('AH', 'TS', 'grand')).toBe(false); // not following suit never wins
  });

  it('in Null there are no trumps and the order is A K Q J 10 9 8 7', () => {
    expect(deck32().some((c) => effectiveSuit(c, 'null') === 'T')).toBe(false);
    const hearts = deck32().filter((c) => suitOf(c) === 'H');
    const sorted = [...hearts].sort((a, b) => (beats(a, b, 'null') ? -1 : 1));
    expect(sorted).toEqual(['AH', 'KH', 'QH', 'JH', 'TH', '9H', '8H', '7H']);
    expect(sortHand(['7H', 'JH', 'TH', 'AC'], 'null')).toEqual(['AC', 'JH', 'TH', '7H']);
  });

  it('a jack belongs to the trumps, not to its printed suit', () => {
    // Hearts led in a Clubs game: the jack of hearts does not follow hearts.
    expect(legalCards(['JH', '7S', '8S'], ['AH'], 'C')).toEqual(['JH', '7S', '8S']);
    expect(legalCards(['JH', '7H', '8S'], ['AH'], 'C')).toEqual(['7H']);
    // A jack led demands trumps, including the trump suit.
    expect(legalCards(['AC', '7H', 'JD'], ['JS'], 'C')).toEqual(['AC', 'JD']);
    expect(legalCards(['AC', '7H'], ['JS'], 'grand')).toEqual(['AC', '7H']);
    // In Null the jack follows its suit.
    expect(legalCards(['JH', '7S'], ['AH'], 'null')).toEqual(['JH']);
    expect(legalCards(['JH', '7S'], [], 'null')).toEqual(['JH', '7S']);
  });

  it('trick winner agrees with an independent oracle (property)', () => {
    fc.assert(
      fc.property(arbDeck, arbKind, (deck, kind) => {
        const trick = deck.slice(0, 3);
        expect(trickWinnerIndex(trick, kind)).toBe(oracleWinner(trick, kind));
        expect(trickWinnerIndex(trick.slice(0, 2), kind)).toBe(oracleWinner(trick.slice(0, 2), kind));
      }),
      { numRuns: 1500 }
    );
  });

  it('legal cards: must follow the led effective suit if possible (property)', () => {
    fc.assert(
      fc.property(arbDeck, arbKind, fc.integer({ min: 1, max: 10 }), (deck, kind, size) => {
        const hand = deck.slice(1, 1 + size);
        const lead = deck[0] as Card;
        const legal = legalCards(hand, [lead], kind);
        const follows = hand.filter((c) => effectiveSuit(c, kind) === effectiveSuit(lead, kind));
        expect(legal).toEqual(follows.length ? follows : hand);
        expect(legalCards(hand, [], kind)).toEqual(hand);
      }),
      { numRuns: 500 }
    );
  });
});

describe('bid values and game values', () => {
  it('lists the official bid values', () => {
    expect(BID_VALUES).toEqual([
      18, 20, 22, 23, 24, 27, 30, 33, 35, 36, 40, 44, 45, 46, 48, 50, 54, 55, 59, 60, 63, 66, 70, 72, 77, 80, 81, 84, 88, 90, 96, 99,
      100, 108, 110, 117, 120, 121, 126, 130, 132, 135, 140, 143, 144, 150, 153, 154, 156, 160, 162, 165, 168, 170, 176, 180, 187, 192,
      198, 204, 216, 240, 264
    ]);
    expect(nextBid(0)).toBe(18);
    expect(nextBid(18)).toBe(20);
    expect(nextBid(23)).toBe(24);
    expect(nextBid(264)).toBeUndefined();
  });

  it('counts matadors with and without, including the Skat', () => {
    expect(matadors(['JC', 'JS', 'JD', 'AH'], 'H')).toEqual({ with: true, count: 2 });
    expect(matadors(['JH', 'JD'], 'grand')).toEqual({ with: false, count: 2 });
    expect(matadors(['JC', 'JS', 'JH', 'JD'], 'grand')).toEqual({ with: true, count: 4 });
    expect(matadors(['JC', 'JS', 'JH', 'JD', 'AD', 'TD', 'KD', 'QD', '9D', '8D', '7D'], 'D')).toEqual({ with: true, count: 11 });
    expect(matadors(['AC', 'TS'], 'H')).toEqual({ with: false, count: 11 });
    expect(matadors(['JS', 'TH'], 'H')).toEqual({ with: false, count: 1 });
  });

  it('checks the ISkO constraints on announcements', () => {
    expect(isLegalContract(C('C'))).toBe(true);
    expect(isLegalContract(C('C', { schneider: true }))).toBe(false); // only Hand
    expect(isLegalContract(C('C', { hand: true, schneider: true }))).toBe(true);
    expect(isLegalContract(C('C', { hand: true, schwarz: true }))).toBe(false); // Schwarz implies Schneider
    expect(isLegalContract(C('grand', { hand: true, ouvert: true, schneider: true }))).toBe(false); // ouvert implies Schwarz
    expect(isLegalContract(C('grand', { hand: true, ouvert: true, schneider: true, schwarz: true }))).toBe(true);
    expect(isLegalContract(C('grand', { ouvert: true, schneider: true, schwarz: true }))).toBe(false); // ouvert suit/Grand needs Hand
    expect(isLegalContract(C('null', { ouvert: true }))).toBe(true);
    expect(isLegalContract(C('null', { hand: true, schneider: true }))).toBe(false);
    expect(isLegalContract({ ...C('C'), kind: 'X' as GameKind })).toBe(false);
  });

  // Worked examples (values per the ISkO game value table).
  const twelve = (cards: Card[]) => cards; // only the trumps matter for matadors
  const cases: { name: string; contract: Contract; bid: number; cards: Card[]; points: number; dTricks: number; won: boolean; value: number; score: number; overbid?: boolean }[] = [
    { name: 'Clubs with 2, won', contract: C('C'), bid: 18, cards: ['JC', 'JS', 'AH'], points: 61, dTricks: 6, won: true, value: 36, score: 36 },
    { name: 'Clubs with 1, 60 points: lost, doubled', contract: C('C'), bid: 18, cards: ['JC', 'JH'], points: 60, dTricks: 5, won: false, value: 24, score: -48 },
    { name: 'Spades without 3, Hand, won', contract: C('S', { hand: true }), bid: 18, cards: ['JD', 'AS'], points: 70, dTricks: 6, won: true, value: 55, score: 55 },
    { name: 'Hearts with 1, Schneider made', contract: C('H'), bid: 18, cards: ['JC', 'JH'], points: 95, dTricks: 8, won: true, value: 30, score: 30 },
    { name: 'Hearts with 1, declarer Schneider (30)', contract: C('H'), bid: 18, cards: ['JC', 'JH'], points: 30, dTricks: 2, won: false, value: 30, score: -60 },
    { name: 'Clubs with 1, declarer Schwarz', contract: C('C'), bid: 18, cards: ['JC'], points: 0, dTricks: 0, won: false, value: 48, score: -96 },
    { name: 'Grand with 4, Hand, Schneider announced and made', contract: C('grand', { hand: true, schneider: true }), bid: 18, cards: ['JC', 'JS', 'JH', 'JD'], points: 92, dTricks: 8, won: true, value: 192, score: 192 },
    { name: 'Spades with 1, Hand, Schneider announced, 75 points', contract: C('S', { hand: true, schneider: true }), bid: 18, cards: ['JC', 'JH'], points: 75, dTricks: 6, won: false, value: 55, score: -110 },
    { name: 'Grand ouvert without 1, all tricks', contract: C('grand', { hand: true, schneider: true, schwarz: true, ouvert: true }), bid: 18, cards: ['JS', 'JH', 'JD'], points: 120, dTricks: 10, won: true, value: 192, score: 192 },
    { name: 'Schwarz announced, one trick lost', contract: C('D', { hand: true, schneider: true, schwarz: true }), bid: 18, cards: ['JC', 'JS'], points: 110, dTricks: 9, won: false, value: 72, score: -144 },
    { name: 'Diamonds with 1 bid 24: overbid', contract: C('D'), bid: 24, cards: ['JC', 'JH'], points: 70, dTricks: 6, won: false, value: 27, score: -54, overbid: true },
    { name: 'Diamonds with 1 bid 24 rescued by Schneider', contract: C('D'), bid: 24, cards: ['JC', 'JH'], points: 95, dTricks: 8, won: true, value: 27, score: 27 },
    { name: 'Hearts without 2 bid 33 → overbid, rounded to 40', contract: C('H'), bid: 33, cards: ['JH'], points: 80, dTricks: 7, won: false, value: 40, score: -80, overbid: true },
    { name: 'Grand with 1 bid 59 → overbid, 72', contract: C('grand'), bid: 59, cards: ['JC'], points: 88, dTricks: 7, won: false, value: 72, score: -144, overbid: true },
    { name: 'Null won', contract: C('null'), bid: 23, cards: [], points: 0, dTricks: 0, won: true, value: 23, score: 23 },
    { name: 'Null Hand lost', contract: C('null', { hand: true }), bid: 18, cards: [], points: 10, dTricks: 1, won: false, value: 35, score: -70 },
    { name: 'Null ouvert', contract: C('null', { ouvert: true }), bid: 46, cards: [], points: 0, dTricks: 0, won: true, value: 46, score: 46 },
    { name: 'Null ouvert Hand', contract: C('null', { ouvert: true, hand: true }), bid: 59, cards: [], points: 0, dTricks: 0, won: true, value: 59, score: 59 },
    { name: 'Null bid 24 → overbid, 46', contract: C('null'), bid: 24, cards: [], points: 0, dTricks: 0, won: false, value: 46, score: -92, overbid: true }
  ];
  it.each(cases.map((c) => [c.name, c] as const))('game value: %s', (_, c) => {
    const v = valueGame({ contract: c.contract, bid: c.bid, declarerCards: twelve(c.cards), declarerPoints: c.points, declarerTricks: c.dTricks, defenderTricks: 10 - c.dTricks });
    expect({ won: v.won, value: v.value, score: v.score, overbid: v.overbid }).toEqual({ won: c.won, value: c.value, score: c.score, overbid: c.overbid ?? false });
  });

  it('reports Schneider/Schwarz and the multiplier', () => {
    const v = valueGame({ contract: C('C'), bid: 18, declarerCards: ['JC', 'JS', 'JH'], declarerPoints: 120, declarerTricks: 10, defenderTricks: 0 });
    expect(v).toMatchObject({ schneider: true, schwarz: true, multiplier: 6, base: 12, value: 72, matadors: { with: true, count: 3 } });
    const exactly90 = valueGame({ contract: C('C'), bid: 18, declarerCards: ['JS'], declarerPoints: 90, declarerTricks: 8, defenderTricks: 2 });
    expect(exactly90).toMatchObject({ schneider: true, schwarz: false, multiplier: 3, value: 36 });
    const just31 = valueGame({ contract: C('C'), bid: 18, declarerCards: ['JS'], declarerPoints: 31, declarerTricks: 3, defenderTricks: 7 });
    expect(just31).toMatchObject({ schneider: false, multiplier: 2, won: false });
  });

  it('rounds overbid values up to a multiple of the base value', () => {
    expect(roundUpTo(9, 24)).toBe(27);
    expect(roundUpTo(12, 24)).toBe(24);
    expect(roundUpTo(23, 24)).toBe(46);
  });

  it('minimum value of a declaration (for the declaration panel)', () => {
    expect(minimumValue(C('C'), ['JC', 'JS'])).toBe(36);
    expect(minimumValue(C('grand', { hand: true, schneider: true, schwarz: true, ouvert: true }), ['JC'])).toBe(24 * 8);
    expect(minimumValue(C('null', { hand: true }), [])).toBe(35);
  });
});

describe('bidding (Reizen)', () => {
  // Dealer 2: Vorhand 0, Mittelhand 1, Hinterhand 2.
  const run = (history: BidAction[]) => biddingStatus(history, 2);

  it('knows the roles', () => {
    expect([0, 1, 2].map((s) => roleOf(s as Seat, 2))).toEqual(['vorhand', 'mittelhand', 'hinterhand']);
    expect(roleOf(0, 0)).toBe('hinterhand');
  });

  it('starts with Mittelhand saying to Vorhand', () => {
    expect(run([])).toMatchObject({ done: false, next: 1, expect: 'bid', high: 0 });
    expect(run([18])).toMatchObject({ next: 0, expect: 'answer', high: 18 });
    expect(run([18, 'yes'])).toMatchObject({ next: 1, expect: 'bid' });
  });

  it('then Hinterhand bids against the survivor', () => {
    expect(run([18, 'yes', 20, 'pass'])).toMatchObject({ next: 2, expect: 'bid', high: 20, passed: [0] });
    expect(run([18, 'yes', 20, 'pass', 22])).toMatchObject({ next: 1, expect: 'answer', high: 22 });
    expect(run([18, 'yes', 20, 'pass', 22, 'yes', 'pass'])).toMatchObject({ done: true, declarer: 1, high: 22, next: null });
    expect(run([18, 'yes', 20, 'pass', 22, 'pass'])).toMatchObject({ done: true, declarer: 2, high: 22 });
    expect(run([18, 'pass', 'pass'])).toMatchObject({ done: true, declarer: 1, high: 18 });
    expect(run([18, 'yes', 'pass', 'pass'])).toMatchObject({ done: true, declarer: 0, high: 18 });
  });

  it('when Mittelhand passes at once, Hinterhand bids to Vorhand', () => {
    expect(run(['pass'])).toMatchObject({ next: 2, expect: 'bid' });
    expect(run(['pass', 18])).toMatchObject({ next: 0, expect: 'answer' });
    expect(run(['pass', 18, 'pass'])).toMatchObject({ done: true, declarer: 2, high: 18 });
    expect(run(['pass', 18, 'yes', 'pass'])).toMatchObject({ done: true, declarer: 0, high: 18 });
  });

  it('if both others pass, Vorhand may play at 18 or pass too', () => {
    expect(run(['pass', 'pass'])).toMatchObject({ done: false, next: 0, expect: 'open', high: 0 });
    expect(run(['pass', 'pass', 18])).toMatchObject({ done: true, declarer: 0, high: 18 });
    expect(run(['pass', 'pass', 'pass'])).toMatchObject({ done: true, declarer: null, passed: [1, 2, 0] });
  });

  it('records who said each step', () => {
    expect(run([18, 'yes', 20, 'pass', 22, 'pass'])?.speakers).toEqual([1, 0, 1, 0, 2, 1]);
  });

  it('rejects impossible histories', () => {
    expect(run(['yes'])).toBeNull();
    expect(run([19])).toBeNull();
    expect(run([20, 'yes', 18])).toBeNull();
    expect(run([20, 20])).toBeNull();
    expect(run([18, 'yes', 18])).toBeNull();
    expect(run(['pass', 'pass', 20])).toBeNull();
    expect(run(['pass', 'pass', 'yes'])).toBeNull();
    expect(run(['pass', 'pass', 'pass', 'pass'])).toBeNull();
    expect(run([18, 'pass', 'pass', 18])).toBeNull();
  });

  it('any sequence of legal steps ends with at most one declarer at the highest bid (property)', () => {
    fc.assert(
      fc.property(fc.array(fc.nat(9), { maxLength: 60 }), fc.constantFrom<Seat>(0, 1, 2), (choices, dealer) => {
        const history: BidAction[] = [];
        let status = biddingStatus(history, dealer);
        for (const choice of choices) {
          if (!status || status.done) break;
          const options: BidAction[] =
            status.expect === 'answer' ? ['yes', 'pass'] : status.expect === 'open' ? [18, 'pass'] : ['pass', ...BID_VALUES.filter((v) => v > (status?.high ?? 0)).slice(0, 3)];
          history.push(options[choice % options.length] as BidAction);
          status = biddingStatus(history, dealer);
          expect(status).not.toBeNull();
        }
        if (status?.done && status.declarer !== null) {
          expect(status.passed).not.toContain(status.declarer);
          expect(status.passed).toHaveLength(2);
          expect(status.high).toBeGreaterThanOrEqual(18);
        }
        const bids = history.filter((b): b is number => typeof b === 'number');
        expect(status?.high).toBe(bids.length ? Math.max(...bids) : 0);
      }),
      { numRuns: 400 }
    );
  });
});

/** A deal where seat 0 is Vorhand and becomes declarer at 18 (others pass). */
function declarerDeal(hands: [Card[], Card[], Card[]], skat: Card[]): DealState {
  return { dealer: 2, hands, skat, bids: ['pass', 'pass', 18], skatChoice: null, discards: [], contract: null, ramsch: false, tricks: [], trick: [], result: null };
}

describe('a game from Skat to result', () => {
  const fixed = () => {
    const { deal } = newDeal(2, 12345);
    return deal;
  };

  it('deals 10/10/10 + 2 and lets Mittelhand speak first', () => {
    const d = fixed();
    expect(d.hands.map((h) => h.length)).toEqual([10, 10, 10]);
    expect(d.skat).toHaveLength(2);
    expect(new Set([...d.hands.flat(), ...d.skat]).size).toBe(32);
    expect(toAct(d)).toBe(1);
    expect(dealPhase(d)).toBe('bidding');
    expect(newDeal(2, 12345)).toEqual(newDeal(2, 12345));
    expect(newDeal(2, 12346).deal.hands).not.toEqual(d.hands);
  });

  it('only the seat to act may act, and only legally', () => {
    const d = fixed();
    expect(applyDealAction(d, 0, { type: 'bid', value: 18 })).toBeNull();
    expect(applyDealAction(d, 1, { type: 'yes' })).toBeNull();
    expect(applyDealAction(d, 1, { type: 'bid', value: 19 })).toBeNull();
    expect(applyDealAction(d, 1, { type: 'play', card: d.hands[1][0] as Card })).toBeNull();
    expect(applyDealAction(d, 1, { type: 'bid', value: 18 })?.bids).toEqual([18]);
  });

  it('pick up, discard, declare and play: phases and the declarer’s twelve cards', () => {
    let d: DealState | null = declarerDeal(
      [
        ['JC', 'JS', 'AC', 'TC', 'KC', 'QC', '9C', 'AH', 'TH', '7D'],
        ['JH', 'JD', '8C', '7C', 'AS', 'TS', 'KS', 'QS', '9S', '8S'],
        ['7S', 'KH', 'QH', '9H', '8H', '7H', 'AD', 'TD', 'KD', 'QD']
      ],
      ['9D', '8D']
    );
    expect(dealPhase(d)).toBe('skat');
    expect(toAct(d)).toBe(0);
    expect(applyDealAction(d, 1, { type: 'pickup' })).toBeNull();
    d = applyDealAction(d, 0, { type: 'pickup' });
    expect(d?.hands[0]).toHaveLength(12);
    expect(dealPhase(d as DealState)).toBe('discard');
    expect(applyDealAction(d as DealState, 0, { type: 'discard', cards: ['9D', '9D'] })).toBeNull();
    expect(applyDealAction(d as DealState, 0, { type: 'discard', cards: ['9D', 'AS'] })).toBeNull();
    d = applyDealAction(d as DealState, 0, { type: 'discard', cards: ['9D', '8D'] });
    expect(dealPhase(d as DealState)).toBe('declare');
    // Announcements need Hand; the hand flag must match the choice.
    expect(applyDealAction(d as DealState, 0, { type: 'declare', contract: C('C', { schneider: true }) })).toBeNull();
    expect(applyDealAction(d as DealState, 0, { type: 'declare', contract: C('C', { hand: true }) })).toBeNull();
    d = applyDealAction(d as DealState, 0, { type: 'declare', contract: C('C') });
    expect(dealPhase(d as DealState)).toBe('play');
    expect(toAct(d as DealState)).toBe(0); // Vorhand leads
    expect(declarerCards(d as DealState, 0).sort()).toEqual(['JC', 'JS', 'AC', 'TC', 'KC', 'QC', '9C', 'AH', 'TH', '7D', '9D', '8D'].sort());
    // Play: a jack demands trumps.
    d = applyDealAction(d as DealState, 0, { type: 'play', card: 'JC' });
    expect(applyDealAction(d as DealState, 1, { type: 'play', card: 'AS' })).toBeNull();
    d = applyDealAction(d as DealState, 1, { type: 'play', card: 'JH' });
    d = applyDealAction(d as DealState, 2, { type: 'play', card: '7S' }); // no trump: any card
    expect(d?.tricks).toEqual([['JC', 'JH', '7S']]);
    expect(trickWinners(d as DealState)).toEqual([0]);
    expect(toAct(d as DealState)).toBe(0);
  });

  it('Null ends as soon as the declarer takes a trick', () => {
    let d: DealState | null = declarerDeal(
      [
        ['AH', '7C', '8C', '9C', '7S', '8S', '9S', '7D', '8D', '9D'],
        ['KH', 'TC', 'JC', 'QC', 'TS', 'JS', 'QS', 'TD', 'JD', 'QD'],
        ['QH', 'KC', 'AC', 'KS', 'AS', 'KD', 'AD', 'JH', 'TH', '9H']
      ],
      ['8H', '7H']
    );
    d = applyDealAction(d, 0, { type: 'hand' });
    d = applyDealAction(d as DealState, 0, { type: 'declare', contract: C('null', { hand: true }) });
    d = applyDealAction(d as DealState, 0, { type: 'play', card: 'AH' });
    d = applyDealAction(d as DealState, 1, { type: 'play', card: 'KH' });
    d = applyDealAction(d as DealState, 2, { type: 'play', card: 'QH' });
    expect(d?.result).toMatchObject({ type: 'game', declarer: 0, declarerTricks: 1, valuation: { won: false, value: 35, score: -70 } });
    expect(toAct(d as DealState)).toBeNull();
    expect(applyDealAction(d as DealState, 0, { type: 'play', card: '7C' })).toBeNull();
  });

  it('a full game: card points add up to 120 and the result follows the rules', () => {
    let checked = 0;
    for (let seed = 77; seed < 120 && checked < 5; seed++) {
      const { state } = advance(startSeries(newGame(seed, 'easy', { series: 3, scoring: 'simple', ramsch: false })), { 0: 'easy', 1: 'easy', 2: 'easy' });
      const d = state.deal as DealState;
      expect(d.result).not.toBeNull();
      expect(state.list).toHaveLength(1);
      expect(isValidState(clone(state))).toBe(true);
      const r = d.result;
      if (r?.type !== 'game' || r.contract.kind === 'null') continue;
      const winners = trickWinners(d);
      let points = sumPoints(r.contract.hand ? d.skat : d.discards);
      d.tricks.forEach((t, i) => (points += winners[i] === r.declarer ? sumPoints(t) : 0));
      expect(r.declarerPoints).toBe(points);
      const defenders = d.tricks.reduce((n, t, i) => n + (winners[i] !== r.declarer ? sumPoints(t) : 0), 0);
      expect(points + defenders).toBe(120);
      expect(r.declarerTricks).toBe(winners.filter((w) => w === r.declarer).length);
      checked++;
    }
    expect(checked).toBe(5);
  });
});

describe('Ramsch (house rule) and thrown-in games', () => {
  const allPass = (ramsch: boolean) => {
    let s = startSeries(newGame(9, 'easy', { series: 3, scoring: 'simple', ramsch }));
    for (const step of [{ seat: 1, a: { type: 'pass' } }, { seat: 2, a: { type: 'pass' } }, { seat: 0, a: { type: 'pass' } }] as const) {
      s = applyAction(s, step.seat, step.a) as SkatState;
    }
    return s;
  };

  it('without the house rule the game is thrown in (eingepasst) and counts as played', () => {
    const s = allPass(false);
    expect(s.deal?.result).toEqual({ type: 'passed' });
    expect(s.list).toEqual([{ dealer: 2, result: { type: 'passed' } }]);
    expect(entryScores(s.list[0] as ListEntry, 'seeger')).toEqual([0, 0, 0]);
    const next = nextDeal(s) as SkatState;
    expect(next.deal?.dealer).toBe(0);
    expect(isValidState(clone(next))).toBe(true);
  });

  it('with it, Ramsch is played: jacks only, Skat to the last trick, most points lose', () => {
    const s = allPass(true);
    expect(s.deal?.ramsch).toBe(true);
    expect(dealPhase(s.deal as DealState)).toBe('play');
    expect(toAct(s.deal as DealState)).toBe(0);
    const { state } = advance(s, { 0: 'easy', 1: 'easy', 2: 'easy' });
    const r = state.deal?.result;
    expect(r?.type).toBe('ramsch');
    if (r?.type !== 'ramsch') return;
    expect(r.points.reduce((a, b) => a + b, 0)).toBe(120);
    const last = trickWinners(state.deal as DealState)[9] as Seat;
    expect(r.points[last]).toBeGreaterThanOrEqual(sumPoints(state.deal?.skat ?? []));
    const most = Math.max(...r.points);
    if (!r.tricks.includes(10)) expect(r.scores).toEqual(r.points.map((p) => (p === most ? -p : 0)));
    expect(isValidState(clone(state))).toBe(true);
  });

  it('Durchmarsch scores plus 120', () => {
    const d: DealState = { dealer: 2, hands: [[], [], []], skat: ['7H', '8H'], bids: ['pass', 'pass', 'pass'], skatChoice: null, discards: [], contract: null, ramsch: true, tricks: [], trick: [], result: null };
    // Seat 0 leads every trick with a winner: give it all jacks and aces.
    d.tricks = [
      ['JC', '7C', '8C'], ['JS', '9C', 'QC'], ['JH', '7S', '8S'], ['JD', '9S', 'QS'], ['AC', 'KC', 'TC'],
      ['AS', 'KS', 'TS'], ['AD', '7D', '8D'], ['TD', '9D', 'QD'], ['AH', '9H', 'QH'], ['TH', 'KH', 'KD']
    ];
    expect(finishedResult(d)).toEqual({ type: 'ramsch', points: [120, 0, 0], tricks: [10, 0, 0], scores: [120, 0, 0] });
  });
});

describe('the list (Liste) and scoring', () => {
  const game = (declarer: Seat, won: boolean, value: number): ListEntry => ({
    dealer: 2,
    result: {
      type: 'game',
      declarer,
      contract: C('C'),
      bid: 18,
      declarerPoints: won ? 70 : 50,
      declarerTricks: 5,
      valuation: { won, overbid: false, value, base: 12, multiplier: value / 12, matadors: { with: true, count: 1 }, schneider: false, schwarz: false, score: won ? value : -2 * value }
    }
  });

  it('simple: won +value, lost −2 × value', () => {
    expect(entryScores(game(1, true, 24), 'simple')).toEqual([0, 24, 0]);
    expect(entryScores(game(1, false, 24), 'simple')).toEqual([0, -48, 0]);
  });

  it('Seeger–Fabian: ±50 for the declarer, 40 to each opponent when the declarer loses', () => {
    expect(entryScores(game(2, true, 36), 'seeger')).toEqual([0, 0, 86]);
    expect(entryScores(game(2, false, 36), 'seeger')).toEqual([40, 40, -122]);
    expect(totals([game(0, true, 24), game(1, false, 24), { dealer: 1, result: { type: 'passed' } }], 'seeger')).toEqual([74 + 40, -98, 40]);
    expect(totals([game(0, true, 24), game(1, false, 24)], 'simple')).toEqual([24, -48, 0]);
  });

  it('a series ends after its length and needs no further deal', () => {
    let s = startSeries(newGame(3, 'easy', { series: 3, scoring: 'simple', ramsch: false }));
    for (let i = 0; i < 3; i++) {
      s = advance(s, { 0: 'easy', 1: 'easy', 2: 'easy' }).state;
      if (i < 2) s = nextDeal(s) as SkatState;
    }
    expect(s.stage).toBe('over');
    expect(s.list.map((e) => e.dealer)).toEqual([2, 0, 1]);
    expect(nextDeal(s)).toBeNull();
    expect(isValidState(clone(s))).toBe(true);
  });

  it('an open-ended series can be ended between games only', () => {
    const s = startSeries(newGame(3, 'easy', { series: 0, scoring: 'simple', ramsch: false }));
    expect(endSeries(s)).toBeNull();
    const done = advance(s, { 0: 'easy', 1: 'easy', 2: 'easy' }).state;
    const over = endSeries(done) as SkatState;
    expect(over.stage).toBe('over');
    expect(isValidState(clone(over))).toBe(true);
    expect(nextDeal(over)).toBeNull();
  });
});

describe('full games between computer players (property)', () => {
  it(
    'always terminate with consistent, valid states and scores',
    () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 0xffff_ffff }), fc.boolean(), fc.constantFrom('simple', 'seeger' as const), (seed, ramsch, scoring) => {
          let s = startSeries(newGame(seed, 'easy', { series: 3, scoring: scoring as 'simple' | 'seeger', ramsch }));
          for (let g = 0; g < 3; g++) {
            s = advance(s, { 0: 'easy', 1: 'easy', 2: 'easy' }).state;
            const d = s.deal as DealState;
            expect(d.result).not.toBeNull();
            expect(isValidState(clone(s))).toBe(true);
            const all = [...d.hands.flat(), ...d.skat, ...d.discards, ...d.tricks.flat(), ...d.trick];
            expect(new Set(all).size).toBe(32);
            if (g < 2) s = nextDeal(s) as SkatState;
          }
          expect(s.stage).toBe('over');
          const sums = totals(s.list, s.options.scoring);
          const manual = s.list.map((e) => entryScores(e, s.options.scoring)).reduce<number[]>((a, b) => a.map((x, i) => x + (b[i] ?? 0)), [0, 0, 0]);
          expect(sums).toEqual(manual);
        }),
        { numRuns: 25 }
      );
    },
    60_000
  );
});

describe('isValidState', () => {
  /** A state in the middle of the card play (after three tricks), stepping the computer players one action at a time. */
  const midGame = (): SkatState => {
    for (let seed = 2024; seed < 2100; seed++) {
      let state = startSeries(newGame(seed, 'easy', { series: 6, scoring: 'simple', ramsch: false }));
      for (let step = 0; step < 80; step++) {
        const d = state.deal as DealState;
        if (d.tricks.length >= 3 && d.trick.length === 1 && !d.result) return state;
        const seat = toAct(d);
        if (seat === null) break;
        state = applyAction(state, seat, chooseAction(viewFor(d, seat, 'easy'), seed + step)) as SkatState;
      }
    }
    throw new Error('no game found');
  };

  it('accepts real states and rejects tampered ones', () => {
    const s = startSeries(newGame(5));
    expect(isValidState(clone(s))).toBe(true);
    expect(isValidState(clone(newGame(5)))).toBe(true);
    const tamper = (fn: (x: SkatState) => void) => {
      const copy = clone(s);
      fn(copy);
      return isValidState(copy);
    };
    expect(tamper((x) => ((x.deal as DealState).hands[0][0] = (x.deal as DealState).hands[1][0] as Card))).toBe(false); // duplicate
    expect(tamper((x) => (x.deal as DealState).hands[0].pop())).toBe(false); // 31 cards
    expect(tamper((x) => ((x.deal as DealState).bids = ['yes']))).toBe(false);
    expect(tamper((x) => ((x.deal as DealState).dealer = 0))).toBe(false); // dealer rotation
    expect(tamper((x) => ((x.deal as DealState).skatChoice = 'hand'))).toBe(false);
    expect(tamper((x) => ((x.options as { series: number }).series = 5))).toBe(false);
    expect(tamper((x) => (x.difficulty = 'expert' as 'easy'))).toBe(false);
    expect(tamper((x) => (x.stage = 'setup'))).toBe(false);
    expect(tamper((x) => (x.rng = -1))).toBe(false);
    expect(tamper((x) => ((x as { v: number }).v = 2))).toBe(false);
  });

  it('replays tricks and rejects an illegal card in the history', () => {
    const s = midGame();
    const d = s.deal as DealState;
    expect(d.tricks.length).toBeGreaterThan(0);
    expect(isValidState(clone(s))).toBe(true);
    const kind = (d.ramsch ? 'ramsch' : d.contract?.kind) as PlayKind;
    const leaders = trickLeaders(d);
    // Find a trick where a follower could have followed suit but we swap in a card that does not.
    let rejected = 0;
    d.tricks.forEach((trick, ti) => {
      for (let i = 1; i < 3; i++) {
        const seat = (((leaders[ti] as Seat) + i) % 3) as Seat;
        const led = effectiveSuit(trick[0] as Card, kind);
        const offSuit = d.hands[seat].find((c) => effectiveSuit(c, kind) !== led);
        if (!offSuit || effectiveSuit(trick[i] as Card, kind) !== led) continue;
        const copy = clone(s);
        const cd = copy.deal as DealState;
        const played = cd.tricks[ti]?.[i] as Card;
        (cd.tricks[ti] as Card[])[i] = offSuit;
        cd.hands[seat] = cd.hands[seat].map((c) => (c === offSuit ? played : c));
        expect(isValidState(copy)).toBe(false);
        rejected++;
      }
    });
    expect(rejected).toBeGreaterThan(0);
  });

  it('rejects a list or result that does not match the rules', () => {
    const s = advance(startSeries(newGame(8, 'easy')), { 0: 'easy', 1: 'easy', 2: 'easy' }).state;
    expect(isValidState(clone(s))).toBe(true);
    const copy = clone(s);
    copy.list = [];
    expect(isValidState(copy)).toBe(false);
    const copy2 = clone(s);
    if (copy2.deal?.result?.type === 'game') {
      copy2.deal.result.valuation.score += 1;
      expect(isValidState(copy2)).toBe(false);
    }
    const copy3 = clone(s);
    copy3.list = [...copy3.list, ...copy3.list, ...copy3.list, ...copy3.list, ...copy3.list, ...copy3.list, ...copy3.list];
    expect(isValidState(copy3)).toBe(false);
  });

  it('never throws on junk (property)', () => {
    fc.assert(
      fc.property(fc.anything(), (v) => {
        expect(() => isValidState(v)).not.toThrow();
        expect(isValidState(v)).toBe(false);
      }),
      { numRuns: 300 }
    );
    const s = clone(startSeries(newGame(5)));
    fc.assert(
      fc.property(fc.anything(), fc.constantFrom('deal', 'list', 'options', 'seed', 'stage'), (junk, key) => {
        const copy = clone(s) as unknown as Record<string, unknown>;
        copy[key] = junk;
        expect(() => isValidState(copy)).not.toThrow();
      }),
      { numRuns: 300 }
    );
  });

  it('applyAction refuses actions outside a running game', () => {
    const setup = newGame(1);
    expect(applyAction(setup, 1, { type: 'pass' })).toBeNull();
    expect(nextDeal(setup)).toBeNull();
  });
});
