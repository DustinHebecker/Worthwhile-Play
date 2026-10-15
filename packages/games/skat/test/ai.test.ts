import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import { deck32, type Card } from '@wp/cards';
import {
  advance,
  biddingLimit,
  chooseAction,
  chooseCard,
  chooseContract,
  chooseDiscard,
  decisionSeed,
  handStrength,
  lastWork,
  WORK_BUDGET,
  nullDanger,
  revealedVoids,
  ruleCard,
  sampleWorld,
  solve,
  viewFor,
  type PlayerView,
  type SimState
} from '../src/ai';
import {
  applyAction,
  declarerOf,
  effectiveSuit,
  isValidState,
  legalCards,
  newGame,
  playKind,
  startSeries,
  sumPoints,
  toAct,
  trickWinnerIndex,
  type DealState,
  type Difficulty,
  type PlayKind,
  type Seat,
  type SkatState
} from '../src/rules';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** Steps a series one action at a time with computer decisions, returning every intermediate state. */
function trace(seed: number, level: Difficulty, maxSteps = 120): SkatState[] {
  let s = startSeries(newGame(seed, level, { series: 3, scoring: 'simple', ramsch: seed % 2 === 0 }));
  const states = [s];
  for (let step = 0; step < maxSteps; step++) {
    const d = s.deal as DealState;
    const seat = toAct(d);
    if (seat === null) break;
    const next = applyAction(s, seat, chooseAction(viewFor(d, seat, level), decisionSeed(s, seat)));
    if (!next) throw new Error(`illegal computer action at step ${step}`);
    s = next;
    states.push(s);
  }
  return states;
}

/** Cards a seat must not know: other hands, the Skat (unless it is the declarer who put cards away). */
function hiddenFrom(d: DealState, seat: Seat): Card[] {
  const others = ([0, 1, 2] as Seat[]).filter((s) => s !== seat).flatMap((s) => d.hands[s]);
  const declarer = viewFor(d, seat, 'easy').discards === null;
  return [...others, ...d.skat, ...(declarer ? d.discards : [])];
}

describe('information hiding', () => {
  it('a view never contains hidden cards (property over real games)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1e6 }), (seed) => {
        for (const s of trace(seed, 'easy')) {
          const d = s.deal as DealState;
          for (const seat of [0, 1, 2] as Seat[]) {
            const text = JSON.stringify(viewFor(d, seat, 'easy'));
            const visible = new Set<Card>([...d.hands[seat], ...d.tricks.flat(), ...d.trick]);
            for (const card of hiddenFrom(d, seat)) if (!visible.has(card)) expect(text).not.toContain(`"${card}"`);
          }
        }
      }),
      { numRuns: 12 }
    );
  });

  it('decisions do not depend on the actual hidden cards', () => {
    // Swap hidden cards between the two other hands (and the Skat): the view, and so the decision, is identical.
    let checked = 0;
    for (const seed of [11, 12, 13, 14]) {
      for (const s of trace(seed, 'easy').filter((_, i) => i % 5 === 0)) {
        const d = s.deal as DealState;
        const seat = toAct(d);
        if (seat === null) continue;
        const [a, b] = ([0, 1, 2] as Seat[]).filter((x) => x !== seat) as [Seat, Seat];
        const shuffled = clone(d);
        const pool = [...shuffled.hands[a], ...shuffled.hands[b]];
        const rng = createRng(seed);
        const mixed = rng.shuffle(pool);
        shuffled.hands[a] = mixed.slice(0, d.hands[a].length);
        shuffled.hands[b] = mixed.slice(d.hands[a].length);
        expect(viewFor(shuffled, seat, 'normal')).toEqual(viewFor(d, seat, 'normal'));
        for (const level of ['easy', 'normal', 'hard'] as const) {
          expect(chooseAction(viewFor(shuffled, seat, level), 99)).toEqual(chooseAction(viewFor(d, seat, level), 99));
        }
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(10);
  }, 60_000);

  it('a defender sees the declarer’s hand only in ouvert games', () => {
    const s = trace(5, 'easy').find((x) => x.deal?.contract && !x.deal.result && x.deal.tricks.length === 0);
    expect(s?.deal?.contract).toBeTruthy();
    const d = s?.deal as DealState;
    const declarer = declarerOf(d) as Seat;
    const defender = ((declarer + 1) % 3) as Seat;
    expect(viewFor(d, defender, 'easy').openHand).toBeNull();
    const open = clone(d);
    open.contract = { ...(open.contract as NonNullable<DealState['contract']>), ouvert: true };
    expect(viewFor(open, defender, 'easy').openHand).toEqual(open.hands[declarer]);
    expect(viewFor(open, declarer, 'easy').openHand).toBeNull();
  });
});

describe('legality and determinism', () => {
  it('computers only make legal moves and finish games at every level', () => {
    for (const level of ['easy', 'normal', 'hard'] as const) {
      for (const seed of [1, 2]) {
        const states = trace(seed, level);
        const last = states[states.length - 1] as SkatState;
        expect(last.deal?.result).not.toBeNull();
        expect(isValidState(clone(last))).toBe(true);
      }
    }
  }, 120_000);

  it('the same view and seed always give the same decision', () => {
    const states = trace(21, 'easy');
    for (const s of states.filter((_, i) => i % 7 === 0)) {
      const d = s.deal as DealState;
      const seat = toAct(d);
      if (seat === null) continue;
      expect(chooseAction(viewFor(d, seat, 'normal'), 5)).toEqual(chooseAction(viewFor(d, seat, 'normal'), 5));
    }
    const a = advance(startSeries(newGame(4, 'normal')), { 0: 'normal', 1: 'normal', 2: 'normal' }).state;
    const b = advance(startSeries(newGame(4, 'normal')), { 0: 'normal', 1: 'normal', 2: 'normal' }).state;
    expect(a).toEqual(b);
  }, 60_000);

  it('advance stops at the person and leaves them a legal choice', () => {
    const s = startSeries(newGame(31, 'normal'));
    const { state, moves } = advance(s);
    const d = state.deal as DealState;
    expect(moves.every((m) => m.seat !== 0)).toBe(true);
    expect(d.result === null ? toAct(d) : 0).toBe(0);
    expect(decisionSeed(s, 1)).not.toBe(decisionSeed(s, 2));
  });
});

describe('Monte Carlo sampling', () => {
  it('samples distributions with the right sizes, the seat’s own cards and the revealed voids', () => {
    let checked = 0;
    for (const seed of [41, 42, 43]) {
      for (const s of trace(seed, 'easy')) {
        const d = s.deal as DealState;
        const seat = toAct(d);
        const kind = playKind(d);
        if (seat === null || !kind || d.tricks.length < 2) continue;
        const view = viewFor(d, seat, 'normal');
        const world = sampleWorld(view, kind, createRng(seed));
        expect(world).not.toBeNull();
        if (!world) continue;
        expect(world.hands[seat]).toEqual(d.hands[seat]);
        world.hands.forEach((h, i) => expect(h).toHaveLength(d.hands[i as Seat].length));
        expect(world.skat).toHaveLength(2);
        const all = [...world.hands.flat(), ...world.skat, ...d.tricks.flat(), ...d.trick];
        expect(new Set(all).size).toBe(32);
        const voids = revealedVoids(view, kind);
        world.hands.forEach((h, i) => h.forEach((c) => expect(voids[i]?.has(effectiveSuit(c, kind))).toBe(false)));
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(5);
  });

  it('hard card decisions stay within the deterministic work budget', () => {
    let decisions = 0;
    let max = 0;
    for (const seed of [71, 72, 73]) {
      for (const s of trace(seed, 'easy')) {
        const d = s.deal as DealState;
        const seat = toAct(d);
        if (seat === null || !d.contract || d.result) continue;
        if (legalCards(d.hands[seat], d.trick, playKind(d) as PlayKind).length < 2) continue;
        chooseCard(viewFor(d, seat, 'hard'), seed);
        max = Math.max(max, lastWork);
        decisions++;
      }
    }
    expect(decisions).toBeGreaterThan(20);
    expect(max).toBeGreaterThan(0);
    expect(max).toBeLessThanOrEqual(WORK_BUDGET.hard);
    expect(solve({ hands: [['AC'], ['7C'], ['8C']], trick: [], leader: 0, points: [0, 0, 0], tricks: [0, 0, 0], played: new Set(), remainingTricks: 1 }, 'grand', 0, 1)).toBeNull();
  }, 60_000);

  it('the endgame search equals plain minimax (property)', () => {
    const minimax = (hands: Card[][], trick: Card[], leader: Seat, remaining: number, kind: PlayKind, declarer: Seat, declTook: boolean): number => {
      if (kind === 'null' && declTook) return 0;
      if (remaining === 0) return kind === 'null' ? 1 : 0;
      const seat = ((leader + trick.length) % 3) as Seat;
      const values = legalCards(hands[seat] as Card[], trick, kind).map((card) => {
        const next = hands.map((h, i) => (i === seat ? h.filter((c) => c !== card) : h));
        const t = [...trick, card];
        if (t.length < 3) return minimax(next, t, leader, remaining, kind, declarer, declTook);
        const winner = ((leader + trickWinnerIndex(t, kind)) % 3) as Seat;
        const gained = winner === declarer && kind !== 'null' ? sumPoints(t) : 0;
        return gained + minimax(next, [], winner, remaining - 1, kind, declarer, declTook || winner === declarer);
      });
      return seat === declarer ? Math.max(...values) : Math.min(...values);
    };
    fc.assert(
      fc.property(
        fc.shuffledSubarray(deck32(), { minLength: 32, maxLength: 32 }),
        fc.constantFrom<PlayKind>('C', 'H', 'grand', 'null'),
        fc.integer({ min: 1, max: 3 }),
        fc.constantFrom<Seat>(0, 1, 2),
        fc.constantFrom<Seat>(0, 1, 2),
        (deck, kind, tricks, leader, declarer) => {
          const cards = deck as Card[];
          const hands = [cards.slice(0, tricks), cards.slice(tricks, 2 * tricks), cards.slice(2 * tricks, 3 * tricks)];
          const sim: SimState = { hands, trick: [], leader, points: [5, 0, 0], tricks: [0, 0, 0], played: new Set(), remainingTricks: tricks };
          const expected = (kind === 'null' ? 0 : declarer === 0 ? 5 : 0) + minimax(hands, [], leader, tricks, kind, declarer, false);
          expect(solve(sim, kind, declarer)).toBe(expected);
        }
      ),
      { numRuns: 200 }
    );
  });
});

describe('hand evaluation and declarations', () => {
  const view = (hand: Card[], extra: Partial<PlayerView> = {}): PlayerView => ({
    seat: 0, difficulty: 'normal', dealer: 2, hand, bids: [], skatChoice: null, discards: null, contract: null, ramsch: false,
    tricks: [], trick: [], openHand: null, handSizes: [10, 10, 10], ...extra
  });
  const strongGrand: Card[] = ['JC', 'JS', 'JH', 'AC', 'TC', 'KC', 'AS', 'TS', 'AH', 'TH'];
  const strongClubs: Card[] = ['JC', 'JS', 'AC', 'TC', 'KC', '9C', '8C', 'AH', 'AS', '7D'];
  const junk: Card[] = ['7C', '8S', '9H', 'QD', 'KS', '8H', '7D', 'QC', 'TS', 'KH'];
  const nullHand: Card[] = ['7C', '8C', '7S', '9S', '7H', '8H', 'TH', '7D', '9D', 'JD'];

  it('rates strong hands above weak ones and bids accordingly', () => {
    expect(handStrength(strongGrand, 'grand')).toBeGreaterThan(handStrength(junk, 'grand') + 8);
    expect(handStrength(strongClubs, 'C')).toBeGreaterThan(handStrength(strongClubs, 'H'));
    expect(biddingLimit(view(strongGrand), createRng(1))).toBeGreaterThanOrEqual(96);
    expect(biddingLimit(view(strongClubs), createRng(1))).toBeGreaterThanOrEqual(36);
    expect(biddingLimit(view(junk), createRng(1))).toBe(0);
    expect(biddingLimit(view(nullHand), createRng(1))).toBeGreaterThanOrEqual(23);
  });

  it('judges Null safety per suit', () => {
    expect(nullDanger(nullHand).danger).toBe(0);
    expect(nullDanger(['8C', 'AS']).danger).toBe(2);
    expect(nullDanger(['7C', '9C', 'JC']).danger).toBe(0);
    expect(nullDanger(['7C', 'TC']).danger).toBe(1);
  });

  it('bids, holds and passes by its limit', () => {
    expect(chooseAction(view(junk), 1)).toEqual({ type: 'pass' });
    expect(chooseAction(view(strongClubs), 1)).toEqual({ type: 'bid', value: 18 });
    expect(chooseAction(view(strongClubs, { seat: 0, bids: [18] }), 1)).toEqual({ type: 'yes' });
    expect(chooseAction(view(junk, { seat: 0, bids: [18] }), 1)).toEqual({ type: 'pass' });
    expect(chooseAction(view(strongClubs, { seat: 0, bids: ['pass', 'pass'] }), 1)).toEqual({ type: 'bid', value: 18 });
  });

  it('keeps jacks and trumps when putting cards away, and declares the best game', () => {
    const twelve: Card[] = [...strongClubs, 'TD', 'KD'];
    const v = view(twelve, { bids: ['pass', 'pass', 18], skatChoice: 'pickup', discards: [] });
    const discard = chooseDiscard(v, 18);
    expect(discard.some((c) => c[0] === 'J')).toBe(false);
    expect(discard.some((c) => c[1] === 'C')).toBe(false);
    const rest = twelve.filter((c) => !discard.includes(c));
    const contract = chooseContract(view(rest, { bids: ['pass', 'pass', 18], skatChoice: 'pickup', discards: discard }), 18);
    expect(contract).toEqual({ kind: 'C', hand: false, schneider: false, schwarz: false, ouvert: false });
  });
});

describe('rule-based card play', () => {
  const info = (hand: Card[], trick: Card[], extra: Partial<Parameters<typeof ruleCard>[0]> = {}) => {
    const seen = new Set<Card>([...hand, ...trick]);
    return { seat: 2 as Seat, kind: 'grand' as PlayKind, declarer: 0 as Seat, hand, trick, leader: 0 as Seat, unseen: deck32().filter((c) => !seen.has(c)), ...extra };
  };

  it('a defender adds points when the partner’s card is safe', () => {
    // Declarer (0) led 7S, partner (1) took it with the ace; seat 2 is last and void in spades.
    expect(ruleCard(info(['TH', '7H', '8D'], ['7S', 'AS']))).toBe('TH');
  });

  it('wins cheaply as last player and otherwise throws the lowest card', () => {
    expect(ruleCard(info(['AS', 'KS', '7S'], ['TS', '8S'], { declarer: 1 }))).toBe('AS');
    expect(ruleCard(info(['KS', '7S'], ['AS', '8S'], { declarer: 0 }))).toBe('7S');
    // Partner (seat 0) holds the trick against the declarer (1): add the king.
    expect(ruleCard(info(['KS', '7S'], ['AS', '8S'], { declarer: 1 }))).toBe('KS');
  });

  it('the declarer draws trumps with the top jack', () => {
    expect(ruleCard(info(['JC', 'JD', 'AH', '7S'], [], { seat: 0, declarer: 0 }))).toBe('JC');
  });

  it('Null declarer ducks under the current card', () => {
    expect(ruleCard(info(['KH', '9H', '7H'], ['TH', 'JH'], { kind: 'null', declarer: 2, leader: 0 }))).toBe('9H');
  });

  it('Ramsch players avoid taking points', () => {
    expect(ruleCard(info(['AH', 'TH', '7H'], ['KH'], { kind: 'ramsch', declarer: null, leader: 1 }))).toBe('7H');
  });

  it('normal and hard choose among legal cards only', () => {
    const states = trace(61, 'easy');
    for (const s of states.filter((x) => x.deal && toAct(x.deal) !== null && x.deal.contract)) {
      const d = s.deal as DealState;
      const seat = toAct(d) as Seat;
      const legal = legalCards(d.hands[seat], d.trick, playKind(d) as PlayKind);
      expect(legal).toContain(chooseCard(viewFor(d, seat, 'normal'), 3));
    }
  }, 60_000);
});
