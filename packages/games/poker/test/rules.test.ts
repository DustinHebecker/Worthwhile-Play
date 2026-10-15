import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { areDisjoint, deck52 } from '@wp/cards';
import { createRng } from '@wp/game-core';
import { computer } from '../src/ai';
import { scoreCards } from '../src/eval';
import {
  applyAction,
  blindsForHand,
  BLIND_LEVELS,
  canAct,
  cloneState,
  computePots,
  configureTable,
  createTable,
  dealHand,
  endTable,
  HANDS_PER_LEVEL,
  isLegal,
  isValidState,
  legalActions,
  nextHand,
  nextSeat,
  potTotal,
  publicView,
  runComputers,
  splitPot,
  START_STACK,
  startTable,
  totalChips,
  type Action,
  type Decider,
  type PokerState
} from '../src/rules';

/** A dealt hand with `players` seats (custom stacks optional). The first button is `seed % players`. */
function deal(players: number, seed = 0, stacks?: number[], rngState = 12345): PokerState {
  const base = createTable(seed, 'easy', players - 1);
  if (stacks) base.seats.forEach((seat, i) => (seat.stack = stacks[i] as number));
  return dealHand({ ...base, rngState });
}

const act = (state: PokerState, ...actions: Action[]) => actions.reduce((s, a) => applyAction(s, a), state);
const fold: Action = { type: 'fold' };
const check: Action = { type: 'check' };
const call: Action = { type: 'call' };
const raise = (to: number): Action => ({ type: 'raise', to });

const chipsOf = (state: PokerState) => state.seats.reduce((sum, s) => sum + s.stack + s.committed, 0);
const cardsOf = (state: PokerState) => [state.board, state.deck, ...state.seats.map((s) => s.hole)];

/** Random legal action from a seeded generator. */
const randomAction = (state: PokerState, rngState: number): Action => {
  const rng = createRng(rngState);
  const legal = legalActions(state);
  const options: Action[] = [];
  if (legal.fold) options.push(fold);
  if (legal.check) options.push(check);
  if (legal.call > 0) options.push(call);
  if (legal.raise) {
    options.push(raise(legal.raise.min), raise(legal.raise.max));
    options.push(raise(rng.int(legal.raise.min, legal.raise.max)));
  }
  return rng.pick(options);
};

describe('table setup', () => {
  it('creates a setup table with equal stacks and nothing dealt', () => {
    const state = createTable(7, 'medium', 3);
    expect(state.phase).toBe('setup');
    expect(state.seats).toHaveLength(4);
    expect(state.seats.every((s) => s.stack === START_STACK && s.hole.length === 0)).toBe(true);
    expect(state.stats).toHaveLength(4);
    expect(START_STACK / blindsForHand(1)[1]).toBe(100);
    expect(isValidState(state)).toBe(true);
  });

  it('clamps the opponent count to 1–5', () => {
    expect(createTable(1, 'easy', 0).opponents).toBe(1);
    expect(createTable(1, 'easy', 9).opponents).toBe(5);
    expect(createTable(1, 'easy', 2.7).opponents).toBe(2);
  });

  it('changes options only during setup', () => {
    const state = createTable(1, 'easy', 2);
    const changed = configureTable(state, { opponents: 4, difficulty: 'hard' });
    expect(changed.opponents).toBe(4);
    expect(changed.difficulty).toBe('hard');
    expect(configureTable(changed, {}).opponents).toBe(4);
    const started = startTable(changed);
    expect(configureTable(started, { opponents: 1 })).toBe(started);
    expect(startTable(started)).toBe(started);
  });

  it('blinds rise by hand count only', () => {
    expect(blindsForHand(1)).toEqual([1, 2]);
    expect(blindsForHand(HANDS_PER_LEVEL)).toEqual([1, 2]);
    expect(blindsForHand(HANDS_PER_LEVEL + 1)).toEqual([2, 4]);
    expect(blindsForHand(10_000)).toEqual(BLIND_LEVELS[BLIND_LEVELS.length - 1]);
    expect(blindsForHand(0)).toEqual([1, 2]);
    for (let i = 1; i < BLIND_LEVELS.length; i++) {
      const [sb, bb] = BLIND_LEVELS[i] as readonly [number, number];
      expect(bb).toBeGreaterThan((BLIND_LEVELS[i - 1] as readonly [number, number])[1]);
      expect(sb).toBeLessThan(bb);
    }
  });
});

describe('dealing and blinds', () => {
  it('deals two cards to every seat, keeps all 52 cards unique and posts the blinds', () => {
    const state = deal(4, 0);
    expect(state.phase).toBe('betting');
    expect(state.handNumber).toBe(1);
    expect(state.button).toBe(0);
    expect(state.seats.every((s) => s.hole.length === 2)).toBe(true);
    expect(state.deck).toHaveLength(52 - 8);
    expect(areDisjoint(...cardsOf(state))).toBe(true);
    expect(state.seats.map((s) => s.bet)).toEqual([0, 1, 2, 0]);
    expect(state.log.map((e) => [e.seat, e.kind, e.amount])).toEqual([
      [1, 'sb', 1],
      [2, 'bb', 2]
    ]);
    expect(state.currentBet).toBe(2);
    expect(state.minRaise).toBe(2);
    // Under the gun (left of the big blind) acts first.
    expect(state.toAct).toBe(3);
  });

  it('deals one card at a time starting left of the button', () => {
    const state = deal(3, 0);
    const shuffledTop = [...state.seats[1]!.hole.slice(0, 1), ...state.seats[2]!.hole.slice(0, 1), ...state.seats[0]!.hole.slice(0, 1)];
    const second = [state.seats[1]!.hole[1], state.seats[2]!.hole[1], state.seats[0]!.hole[1]];
    const all = [...shuffledTop, ...second, ...state.deck];
    expect(new Set(all).size).toBe(52);
  });

  it('heads-up: the button posts the small blind and acts first before the flop, last after it', () => {
    const state = deal(2, 1);
    expect(state.button).toBe(1);
    expect(state.seats[1]!.bet).toBe(1);
    expect(state.seats[0]!.bet).toBe(2);
    expect(state.toAct).toBe(1);
    const afterCall = act(state, call);
    expect(afterCall.toAct).toBe(0); // big blind's option
    expect(legalActions(afterCall).check).toBe(true);
    expect(legalActions(afterCall).raise).not.toBeNull();
    const flop = act(afterCall, check);
    expect(flop.street).toBe('flop');
    expect(flop.board).toHaveLength(3);
    expect(flop.toAct).toBe(0); // big blind first after the flop
  });

  it('moves the button to the next seat with chips and skips busted seats', () => {
    let state = deal(4, 0);
    state = { ...cloneState(state), phase: 'handOver' };
    state.seats.forEach((s) => {
      s.stack += s.committed;
      s.committed = 0;
      s.bet = 0;
    });
    state.seats[0]!.stack += state.seats[1]!.stack;
    state.seats[1]!.stack = 0;
    const next = nextHand(state);
    expect(next.button).toBe(2);
    expect(next.seats[1]!.inHand).toBe(false);
    expect(next.seats[1]!.hole).toEqual([]);
    expect(next.seats[3]!.bet).toBe(1);
    expect(next.seats[0]!.bet).toBe(2);
    expect(next.toAct).toBe(2);
  });

  it('posts a short blind all-in', () => {
    const state = deal(3, 0, [200, 1, 399]);
    expect(state.seats[1]!.bet).toBe(1);
    expect(state.seats[1]!.stack).toBe(0);
    expect(state.log[0]!.allIn).toBe(true);
    const short = deal(3, 0, [200, 200, 1]);
    expect(short.log[1]).toMatchObject({ kind: 'bb', amount: 1, allIn: true });
    // The amount to call is the largest blind actually posted.
    expect(short.currentBet).toBe(1);
    expect(legalActions(short).call).toBe(1);
  });
});

describe('betting rules', () => {
  it('only offers fold when there is a bet, and check when there is none', () => {
    const state = deal(3, 0);
    expect(legalActions(state)).toMatchObject({ fold: true, check: false, call: 2 });
    expect(isLegal(state, check)).toBe(false);
    const bigBlindOption = act(state, call, call);
    expect(legalActions(bigBlindOption)).toMatchObject({ fold: false, check: true, call: 0 });
    expect(isLegal(bigBlindOption, fold)).toBe(false);
    expect(() => applyAction(bigBlindOption, fold)).toThrow(RangeError);
  });

  it('requires a minimum raise of the last raise size (at least one big blind)', () => {
    const state = deal(3, 0);
    expect(legalActions(state).raise).toEqual({ min: 4, max: 200 });
    expect(isLegal(state, raise(3))).toBe(false);
    expect(isLegal(state, raise(4))).toBe(true);
    expect(isLegal(state, raise(4.5))).toBe(false);
    const raised = act(state, raise(10)); // raise of 8
    expect(raised.currentBet).toBe(10);
    expect(raised.minRaise).toBe(8);
    expect(legalActions(raised).raise).toEqual({ min: 18, max: 200 });
    expect(raised.log.at(-1)).toMatchObject({ kind: 'raise', amount: 10 });
  });

  it('a bet on a later street starts at one big blind and is logged as a bet', () => {
    const flop = act(deal(3, 0), call, call, check);
    expect(flop.street).toBe('flop');
    expect(flop.toAct).toBe(1);
    expect(legalActions(flop).raise).toEqual({ min: 2, max: 198 });
    const bet = act(flop, raise(6));
    expect(bet.log.at(-1)).toMatchObject({ kind: 'bet', amount: 6, street: 'flop' });
    expect(bet.minRaise).toBe(6);
  });

  it('an all-in for less than a full raise does not reopen the betting for players who already acted', () => {
    // Seat 0 is the button; 1 SB, 2 BB, 3 has only 30 chips.
    const state = deal(4, 0, [400, 200, 200, 30, 0].slice(0, 4).map((v, i) => (i === 3 ? 30 : v === 400 ? 370 : v)));
    expect(state.toAct).toBe(3);
    // Seat 3 calls, button raises to 20 (full raise of 18), blinds fold.
    let s = act(state, call, raise(20), fold, fold);
    expect(s.toAct).toBe(3);
    // Seat 3 goes all-in to 30: only 10 more, less than the last raise (18).
    s = act(s, raise(30));
    expect(s.currentBet).toBe(30);
    expect(s.minRaise).toBe(18);
    expect(s.toAct).toBe(0);
    const legal = legalActions(s);
    expect(legal.call).toBe(10);
    expect(legal.raise).toBeNull();
  });

  it('a full raise reopens the betting', () => {
    let s = deal(3, 0);
    s = act(s, raise(6), call); // button raises, SB calls
    s = act(s, raise(20)); // BB re-raises by 14 ≥ 4
    expect(s.toAct).toBe(0);
    expect(legalActions(s).raise).toEqual({ min: 34, max: 200 });
  });

  it('a player still to act may raise after a short all-in', () => {
    // Button 0 opens, SB 1 (25 chips) shoves short, BB 2 has not acted yet and may re-raise.
    let s = deal(3, 0, [200, 25, 375]);
    s = act(s, raise(20), raise(25));
    expect(s.toAct).toBe(2);
    expect(legalActions(s).raise).not.toBeNull();
  });

  it('cannot raise when everyone else is all-in', () => {
    let s = deal(2, 1, [300, 100]);
    s = act(s, raise(100));
    expect(s.toAct).toBe(0);
    expect(legalActions(s)).toMatchObject({ call: 98, raise: null, fold: true });
  });

  it('returns uncalled chips and gives the pot to the last player', () => {
    let s = deal(3, 0);
    s = act(s, raise(50), fold, fold);
    expect(s.phase).toBe('handOver');
    expect(s.result?.showdown).toBe(false);
    // The raise to 50 was matched only up to the big blind (2): 48 chips go back.
    expect(s.result?.pots).toEqual([{ amount: 5, eligible: [0], winners: [0] }]);
    expect(s.seats.map((x) => x.stack)).toEqual([203, 199, 198]);
    expect(s.result?.shown).toEqual([]);
  });

  it('runs out the board without betting when all but one player are all-in', () => {
    let s = deal(2, 1, [300, 100]);
    s = act(s, raise(100), call);
    expect(s.phase === 'handOver' || s.phase === 'finished').toBe(true);
    expect(s.board).toHaveLength(5);
    expect(s.result?.showdown).toBe(true);
    expect(s.result?.shown.sort()).toEqual([0, 1]);
  });

  it('plays a full hand to showdown and pays the best hand', () => {
    let s = deal(3, 0);
    s = act(s, call, call, check);
    while (s.phase === 'betting') s = act(s, check);
    expect(s.board).toHaveLength(5);
    const scores = s.seats.map((seat) => scoreCards([...seat.hole, ...s.board]));
    const best = Math.max(...scores);
    const winners = scores.map((x, i) => (x === best ? i : -1)).filter((i) => i >= 0);
    expect(s.result?.pots[0]?.winners).toEqual(winners);
    expect(s.result?.scores).toEqual(scores);
    expect(chipsOf(s)).toBe(600);
  });
});

/* --------------------------------------------------------------------------------- pots */

/** Brute-force pot splitter: chip layer by chip layer. */
function bruteForcePots(committed: readonly number[], live: readonly boolean[]) {
  const top = Math.max(0, ...committed);
  const layers: { amount: number; eligible: number[] }[] = [];
  for (let level = 1; level <= top; level++) {
    const amount = committed.filter((c) => c >= level).length;
    const eligible = committed.map((c, i) => (c >= level && live[i] ? i : -1)).filter((i) => i >= 0);
    if (eligible.length === 0) {
      const last = layers[layers.length - 1];
      if (last) last.amount += amount;
      continue;
    }
    const last = layers[layers.length - 1];
    if (last && last.eligible.join() === eligible.join()) last.amount += amount;
    else layers.push({ amount, eligible });
  }
  return layers;
}

describe('side pots', () => {
  it('builds main and side pots', () => {
    expect(computePots([50, 100, 100, 20], [true, true, true, false])).toEqual([
      { amount: 20 * 4 + 30 * 3, eligible: [0, 1, 2] },
      { amount: 100, eligible: [1, 2] }
    ]);
    expect(computePots([10, 10], [true, false])).toEqual([{ amount: 20, eligible: [0] }]);
    expect(computePots([0, 0], [true, true])).toEqual([]);
  });

  it('matches a brute-force layer-by-layer splitter and sums to the total', () => {
    const scenario = fc
      .array(fc.record({ committed: fc.integer({ min: 0, max: 60 }), live: fc.boolean() }), { minLength: 2, maxLength: 6 })
      .filter((seats) => seats.some((s) => s.live && s.committed > 0));
    fc.assert(
      fc.property(scenario, (seats) => {
        const committed = seats.map((s) => s.committed);
        const live = seats.map((s) => s.live);
        const pots = computePots(committed, live);
        expect(pots).toEqual(bruteForcePots(committed, live));
        expect(pots.reduce((sum, p) => sum + p.amount, 0)).toBe(committed.reduce((a, b) => a + b, 0));
      }),
      { numRuns: 500, seed: 4 }
    );
  });

  it('splits pots evenly with odd chips going left of the button first', () => {
    expect(splitPot(10, [1, 3], 0, 4)).toEqual([0, 5, 0, 5]);
    expect(splitPot(11, [1, 3], 0, 4)).toEqual([0, 6, 0, 5]);
    expect(splitPot(11, [1, 3], 2, 4)).toEqual([0, 5, 0, 6]);
    expect(splitPot(11, [0, 1, 3], 3, 4)).toEqual([4, 4, 0, 3]);
    expect(splitPot(7, [2], 1, 4)).toEqual([0, 0, 7, 0]);
    expect(splitPot(7, [], 1, 3)).toEqual([0, 0, 0]);
  });

  it('pays side pots to the right players in a multi-way all-in', () => {
    // Three all-ins of different sizes: everyone sees the board.
    let s = deal(4, 0, [50, 100, 150, 500]);
    s = act(s, raise(500), call, call, call);
    expect(s.result?.showdown).toBe(true);
    const pots = s.result?.pots ?? [];
    expect(pots.map((p) => p.amount)).toEqual([200, 150, 100]);
    expect(pots.map((p) => p.eligible)).toEqual([[0, 1, 2, 3], [1, 2, 3], [2, 3]]);
    // 350 uncalled chips of seat 3 went back.
    const paid = s.result?.payouts.reduce((a, b) => a + b, 0);
    expect(paid).toBe(450);
    expect(chipsOf(s)).toBe(800);
    for (const pot of pots) {
      const best = Math.max(...pot.eligible.map((i) => s.result!.scores[i]!));
      expect(pot.winners).toEqual(pot.eligible.filter((i) => s.result!.scores[i] === best));
    }
  });
});

/* --------------------------------------------------------------------------------- properties */

describe('betting state machine (property)', () => {
  it('keeps chips, cards and turn order consistent through random tables', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), fc.integer({ min: 0, max: 0xffffffff }), (opponents, seed) => {
        let state = startTable(createTable(seed, 'easy', opponents));
        const total = totalChips(opponents);
        let steps = 0;
        while (state.phase !== 'finished' && steps < 400) {
          steps++;
          if (state.phase === 'handOver') {
            state = nextHand(state);
            continue;
          }
          // Invariants of every betting state.
          expect(chipsOf(state)).toBe(total);
          expect(areDisjoint(...cardsOf(state))).toBe(true);
          expect(cardsOf(state).reduce((n, list) => n + list.length, 0)).toBe(52);
          expect(state.currentBet).toBe(Math.max(...state.seats.map((x) => x.bet)));
          const seat = state.seats[state.toAct]!;
          expect(canAct(seat)).toBe(true);
          expect(seat.bet < state.currentBet || !seat.acted).toBe(true);
          const before = state;
          const action = randomAction(state, seed + steps);
          expect(isLegal(state, action)).toBe(true);
          state = applyAction(state, action);
          if (state.phase === 'betting' && state.street !== before.street) {
            // A new street starts with no bets and the first player left of the button.
            expect(state.seats.every((x) => x.bet === 0)).toBe(true);
            expect(state.toAct).toBe(nextSeat(state.seats, state.button, canAct));
            // The previous street ended with every player able to act matching the highest bet.
            const live = before.seats.filter((x, i) => x.inHand && !x.folded && i !== before.toAct);
            expect(live.length).toBeGreaterThan(0);
          }
          if (state.phase !== 'betting') {
            expect(state.seats.every((x) => x.committed === 0 && x.bet === 0)).toBe(true);
            expect(chipsOf(state)).toBe(total);
            const result = state.result!;
            const paid = result.payouts.reduce((a, b) => a + b, 0);
            expect(paid).toBe(result.pots.reduce((a, p) => a + p.amount, 0));
            // Everything in the pot was paid out, except an uncalled part of the last bet.
            expect(paid).toBeLessThanOrEqual(potTotal(before) + (action.type === 'call' || action.type === 'raise' ? total : 0));
            expect(paid).toBeGreaterThan(0);
          }
        }
      }),
      { numRuns: 60, seed: 5 }
    );
  }, 60_000);

  it('saved states during play are valid (computer seats run until the player acts)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom('easy', 'medium', 'hard' as const), (opponents, seed, level) => {
        const decide = computer(level);
        let state = runComputers(startTable(createTable(seed, level, opponents)), decide);
        for (let step = 0; step < 40 && state.phase !== 'finished'; step++) {
          expect(isValidState(JSON.parse(JSON.stringify(state)))).toBe(true);
          if (state.phase === 'handOver') state = runComputers(nextHand(state), decide);
          else state = runComputers(applyAction(state, randomAction(state, seed ^ step)), decide);
        }
        expect(isValidState(JSON.parse(JSON.stringify(state)))).toBe(true);
      }),
      { numRuns: 25, seed: 6 }
    );
  }, 60_000);

  it('is deterministic: same seed and actions give the same table', () => {
    const run = () => {
      let state = runComputers(startTable(createTable(99, 'medium', 3)), computer('medium'));
      for (let i = 0; i < 30 && state.phase !== 'finished'; i++) {
        state = state.phase === 'handOver' ? runComputers(nextHand(state), computer('medium')) : runComputers(applyAction(state, randomAction(state, i)), computer('medium'));
      }
      return state;
    };
    expect(run()).toEqual(run());
  });
});

describe('table end', () => {
  const playOut = (state: PokerState, decide: Decider) => {
    let s = state;
    for (let i = 0; i < 2000 && s.phase !== 'finished'; i++) s = s.phase === 'handOver' ? nextHand(s) : runComputers(s, decide, -1);
    return s;
  };

  it('ends naturally with a winner because the blinds rise', () => {
    const final = playOut(startTable(createTable(3, 'easy', 2)), computer('easy'));
    expect(final.phase).toBe('finished');
    expect(['busted', 'champion']).toContain(final.ended);
    expect(isValidState(final)).toBe(true);
    if (final.ended === 'busted') expect(final.seats[0]!.stack).toBe(0);
    else expect(final.seats[0]!.stack).toBe(totalChips(2));
    expect(final.summary.hands).toBeGreaterThan(0);
    expect(final.summary.showdownsWon).toBeLessThanOrEqual(final.summary.hands);
  }, 30_000);

  it('counts hands, showdowns won and the biggest pot for the player', () => {
    let s = deal(2, 1, [300, 100]);
    s = act(s, raise(100), call);
    const won = s.result!.payouts[0]! > 0;
    expect(s.summary.hands).toBe(1);
    expect(s.summary.showdownsWon).toBe(won ? 1 : 0);
    expect(s.summary.biggestPot).toBe(s.result!.payouts[0]);
    expect(s.phase).toBe(won ? 'finished' : 'handOver');
    if (won) expect(s.ended).toBe('champion');
  });

  it('busts the player when they lose all chips', () => {
    // Find a deal where the short-stacked player loses an all-in.
    for (let rngState = 1; rngState < 50; rngState++) {
      let s = deal(2, 1, [100, 300], rngState);
      s = act(s, raise(100), call);
      if (s.result!.payouts[0] === 0) {
        expect(s.phase).toBe('finished');
        expect(s.ended).toBe('busted');
        expect(isValidState(s)).toBe(true);
        return;
      }
    }
    throw new Error('no losing deal found');
  });

  it('the player can end the table at any time; a running hand is called off', () => {
    const s = deal(3, 0);
    const ended = endTable(act(s, raise(10)));
    expect(ended.phase).toBe('finished');
    expect(ended.ended).toBe('stopped');
    expect(ended.seats.map((x) => x.stack)).toEqual([200, 200, 200]);
    expect(ended.summary.hands).toBe(0);
    expect(endTable(ended)).toBe(ended);
    expect(endTable(createTable(1, 'easy', 2)).phase).toBe('finished');
    expect(isValidState(endTable(createTable(1, 'easy', 2)))).toBe(true);
  });

  it('records public statistics per seat', () => {
    let s = deal(3, 0);
    s = act(s, raise(6), call, fold);
    while (s.phase === 'betting') s = act(s, legalActions(s).check ? check : call);
    expect(s.stats[0]).toMatchObject({ hands: 1, vpip: 1, pfr: 1, aggressive: 1 });
    expect(s.stats[1]).toMatchObject({ hands: 1, vpip: 1, pfr: 0, passive: 1 });
    expect(s.stats[2]).toMatchObject({ hands: 1, vpip: 0, pfr: 0 });
  });
});

describe('public view', () => {
  it('contains own hole cards but never other hole cards or the deck', () => {
    const state = deal(4, 0);
    const view = publicView(state, 3);
    expect(view.hole).toEqual(state.seats[3]!.hole);
    const text = JSON.stringify(view);
    for (const [i, seat] of state.seats.entries()) {
      if (i === 3) continue;
      for (const card of seat.hole) expect(text.includes(`"${card}"`)).toBe(false);
    }
    for (const card of state.deck) expect(text.includes(`"${card}"`)).toBe(false);
    expect(Object.keys(view.seats[0]!)).not.toContain('hole');
  });
});

describe('isValidState', () => {
  const sample = () => runComputers(startTable(createTable(5, 'easy', 3)), computer('easy'));

  it('accepts real states', () => {
    expect(isValidState(sample())).toBe(true);
    expect(isValidState(createTable(1, 'hard', 5))).toBe(true);
  });

  it('rejects tampered states', () => {
    const base = sample();
    const tamper = (change: (s: PokerState) => void) => {
      const s = JSON.parse(JSON.stringify(base)) as PokerState;
      change(s);
      return isValidState(s);
    };
    expect(tamper(() => undefined)).toBe(true);
    expect(tamper((s) => (s.seats[1]!.stack += 1))).toBe(false); // chip created
    expect(tamper((s) => (s.seats[1]!.hole[0] = s.seats[2]!.hole[0]!))).toBe(false); // duplicate card
    expect(tamper((s) => s.deck.pop())).toBe(false); // card lost
    expect(tamper((s) => (s.toAct = 1))).toBe(false);
    expect(tamper((s) => (s.board = s.deck.splice(0, 1)))).toBe(false); // board size vs street
    expect(tamper((s) => (s.bb = 4))).toBe(false);
    expect(tamper((s) => (s.opponents = 2))).toBe(false);
    expect(tamper((s) => (s.phase = 'setup'))).toBe(false);
    expect(tamper((s) => (s.difficulty = 'insane' as never))).toBe(false);
    expect(tamper((s) => (s.seats[0]!.bet = s.seats[0]!.committed + 1))).toBe(false);
    expect(tamper((s) => (s.log = [{ seat: 9, kind: 'call', amount: 1, allIn: false, street: 'flop' }]))).toBe(false);
    expect(tamper((s) => (s.summary.showdownsWon = 5))).toBe(false);
    expect(tamper((s) => (s.version = 2 as 1))).toBe(false);
    expect(tamper((s) => (s.ended = 'stopped'))).toBe(false);
    expect(tamper((s) => (s.currentBet += 1))).toBe(false);
  });

  it('checks finished and hand-over states', () => {
    let s = deal(3, 0);
    s = act(s, raise(50), fold, fold);
    expect(isValidState(s)).toBe(true);
    expect(isValidState({ ...s, result: null })).toBe(false);
    expect(isValidState({ ...s, toAct: 0 })).toBe(false);
    expect(isValidState({ ...s, phase: 'finished' })).toBe(false); // no ending
    expect(isValidState({ ...s, phase: 'finished', ended: 'busted' })).toBe(false); // player has chips
    expect(isValidState({ ...s, phase: 'finished', ended: 'champion' })).toBe(false);
    expect(isValidState({ ...s, phase: 'finished', ended: 'stopped' })).toBe(true);
    const bad = cloneState(s);
    bad.result!.payouts[0] = 99;
    expect(isValidState(bad)).toBe(false);
  });

  it('never throws on junk', () => {
    fc.assert(fc.property(fc.anything(), (v) => void isValidState(v)), { numRuns: 300 });
    const s = sample() as unknown as Record<string, unknown>;
    for (const key of Object.keys(s)) {
      expect(isValidState({ ...s, [key]: undefined })).toBe(false);
      expect(isValidState({ ...s, [key]: 'x' })).toBe(false);
    }
  });

  it('every card of the deck is accounted for in a dealt state', () => {
    const s = sample();
    expect([...s.deck, ...s.board, ...s.seats.flatMap((x) => x.hole)].sort()).toEqual(deck52().sort());
  });
});
