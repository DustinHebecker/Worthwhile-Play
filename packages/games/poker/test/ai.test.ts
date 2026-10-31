import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import { aggression, decide, LEVELS, opponentRange, playersBehind } from '../src/ai';
import { classOf, className, combosOf, computePreflopEquity, estimateEquity, PREFLOP_PERCENTILE } from '../src/equity';
import { PREFLOP_EQUITY, PREFLOP_ITERATIONS, PREFLOP_SEED } from '../src/preflop-table';
import {
  applyAction,
  cloneState,
  createTable,
  DIFFICULTIES,
  isLegal,
  nextHand,
  publicView,
  startTable,
  type Action,
  type PokerState,
  type PublicView
} from '../src/rules';

const legalFor = (state: PokerState, action: Action) => isLegal(state, action);

describe('preflop table', () => {
  it('has 169 classes with 1,326 combinations in total', () => {
    expect(PREFLOP_EQUITY).toHaveLength(169);
    let combos = 0;
    for (let i = 0; i < 169; i++) combos += combosOf(i);
    expect(combos).toBe(1326);
    expect(className(168)).toBe('AA');
    expect(className(12 * 13 + 11)).toBe('AKs');
    expect(className(11 * 13 + 12)).toBe('AKo');
    expect(className(1)).toBe('32o');
    expect(classOf(['AS', 'KS'])).toBe(12 * 13 + 11);
    expect(classOf(['KD', 'AS'])).toBe(11 * 13 + 12);
    expect(classOf(['7H', '7C'])).toBe(5 * 13 + 5);
  });

  it('is reproduced by its own generator (sample of classes)', () => {
    for (const index of [0, 1, 26, 84, 100, 155, 168]) {
      const value = Math.round(computePreflopEquity(index, PREFLOP_ITERATIONS, PREFLOP_SEED) * 10000) / 10000;
      expect(value).toBe(PREFLOP_EQUITY[index]);
    }
  }, 30_000);

  it('ranks hands sensibly', () => {
    const eq = (name: string) => PREFLOP_EQUITY[Array.from({ length: 169 }, (_, i) => i).find((i) => className(i) === name) as number] as number;
    expect(eq('AA')).toBeGreaterThan(0.84);
    expect(eq('AA')).toBeGreaterThan(eq('KK'));
    expect(eq('KK')).toBeGreaterThan(eq('AKs'));
    expect(eq('AKs')).toBeGreaterThan(eq('AKo'));
    expect(eq('32o')).toBeLessThan(0.34);
    expect(Math.max(...PREFLOP_EQUITY)).toBe(eq('AA'));
    expect(PREFLOP_PERCENTILE[168]).toBeCloseTo(6 / 1326, 6);
    expect(Math.max(...PREFLOP_PERCENTILE)).toBe(1);
  });
});

describe('equity estimate', () => {
  it('is near-certain for the nuts on the river and near zero for a dead hand', () => {
    const rng = createRng(1);
    expect(estimateEquity(['AS', 'KS'], ['QS', 'JS', 'TS', '2D', '3C'], [1, 1], 200, rng)).toBe(1);
    // 7-2 against a royal flush on the board can only split.
    expect(estimateEquity(['7C', '2D'], ['AS', 'KS', 'QS', 'JS', 'TS'], [1], 200, rng)).toBe(0.5);
    expect(estimateEquity(['AS', 'KS'], [], [], 10, rng)).toBe(1);
  });

  it('matches known heads-up preflop values roughly', () => {
    const rng = createRng(2);
    expect(estimateEquity(['AH', 'AD'], [], [1], 3000, rng)).toBeGreaterThan(0.82);
    expect(estimateEquity(['7C', '2D'], [], [1], 3000, rng)).toBeLessThan(0.38);
    // Against more opponents equity drops.
    expect(estimateEquity(['AH', 'AD'], [], [1, 1, 1, 1], 2000, rng)).toBeLessThan(0.7);
  });

  it('a narrow opponent range lowers a medium hand’s equity', () => {
    const wide = estimateEquity(['QH', 'JD'], [], [1], 3000, createRng(3));
    const narrow = estimateEquity(['QH', 'JD'], [], [0.08], 3000, createRng(3));
    expect(narrow).toBeLessThan(wide - 0.1);
  });

  it('is deterministic for the same generator state', () => {
    expect(estimateEquity(['9H', '8H'], ['7H', '2C', 'KD'], [1, 1], 300, createRng(9))).toBe(
      estimateEquity(['9H', '8H'], ['7H', '2C', 'KD'], [1, 1], 300, createRng(9))
    );
  });
});

describe('opponent model', () => {
  const view = (log: PublicView['log'], hands = 0, vpip = 0, pfr = 0): PublicView =>
    ({ log, stats: [{ hands, vpip, pfr, aggressive: 0, passive: 0 }, { hands, vpip, pfr, aggressive: 0, passive: 0 }] }) as unknown as PublicView;

  it('narrows ranges by preflop action', () => {
    const raised = view([{ seat: 1, kind: 'raise', amount: 6, allIn: false, street: 'preflop' }]);
    const called = view([{ seat: 1, kind: 'call', amount: 2, allIn: false, street: 'preflop' }]);
    const blind = view([{ seat: 1, kind: 'bb', amount: 2, allIn: false, street: 'preflop' }]);
    expect(opponentRange(raised, 1, 'none')).toBe(1);
    expect(opponentRange(raised, 1, 'action')).toBe(0.25);
    expect(opponentRange(called, 1, 'action')).toBe(0.55);
    expect(opponentRange(blind, 1, 'action')).toBe(1);
    expect(opponentRange(blind, 1, 'stats')).toBe(1);
    // With no history, the priors decide; a loose player (plays every hand) gets a wide range.
    expect(opponentRange(raised, 1, 'stats')).toBeCloseTo(0.18, 5);
    const loose = view([{ seat: 1, kind: 'raise', amount: 6, allIn: false, street: 'preflop' }], 100, 100, 100);
    expect(opponentRange(loose, 1, 'stats')).toBe(1);
    const tight = view([{ seat: 1, kind: 'call', amount: 2, allIn: false, street: 'preflop' }], 100, 5, 0);
    expect(opponentRange(tight, 1, 'stats')).toBeCloseTo(Math.max(0.06, ((5 + 0.35 * 8) / 108) * 1.2), 5);
  });

  it('measures aggression with a prior', () => {
    expect(aggression({ hands: 0, vpip: 0, pfr: 0, aggressive: 0, passive: 0 })).toBeCloseTo(0.4, 5);
    expect(aggression({ hands: 9, vpip: 9, pfr: 9, aggressive: 45, passive: 0 })).toBeGreaterThan(0.9);
    expect(aggression({ hands: 9, vpip: 9, pfr: 0, aggressive: 0, passive: 45 })).toBeLessThan(0.1);
  });

  it('knows who acts last after the flop', () => {
    const base = { button: 0, seat: 0, seats: [0, 1, 2, 3].map(() => ({ inHand: true, folded: false, stack: 10, bet: 0, committed: 0, acted: false })) } as unknown as PublicView;
    expect(playersBehind(base)).toBe(0);
    expect(playersBehind({ ...base, seat: 1 })).toBe(3);
    expect(playersBehind({ ...base, seat: 3 })).toBe(1);
  });
});

describe('decisions', () => {
  it('always returns a legal action at every level (random tables)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom(...DIFFICULTIES), (opponents, seed, level) => {
        let state = startTable(createTable(seed, level, opponents));
        for (let step = 0; step < 120 && state.phase !== 'finished'; step++) {
          if (state.phase === 'handOver') {
            state = nextHand(state);
            continue;
          }
          const action = decide(publicView(state, state.toAct), level);
          expect(legalFor(state, action)).toBe(true);
          state = applyAction(state, action);
        }
      }),
      { numRuns: 30, seed: 7 }
    );
  }, 60_000);

  it('never depends on hidden cards: other hole cards and the deck can change without changing the decision', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 5 }), fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom(...DIFFICULTIES), fc.integer({ min: 0, max: 1000 }), (opponents, seed, level, salt) => {
        const state = startTable(createTable(seed, level, opponents));
        const seat = state.toAct;
        // Swap every hidden card (other hole cards and deck) for a reshuffled arrangement of the same hidden cards.
        const hidden = [...state.deck, ...state.seats.flatMap((s, i) => (i === seat ? [] : s.hole))];
        const shuffled = createRng(salt).shuffle(hidden);
        const other = cloneState(state);
        let k = 0;
        other.seats.forEach((s, i) => {
          if (i !== seat) s.hole = s.hole.map(() => shuffled[k++] as never);
        });
        other.deck = shuffled.slice(k);
        expect(publicView(other, seat)).toEqual(publicView(state, seat));
        expect(decide(publicView(other, seat), level)).toEqual(decide(publicView(state, seat), level));
      }),
      { numRuns: 40, seed: 8 }
    );
  }, 60_000);

  it('raises or bets with the nuts and folds hopeless hands to big bets', () => {
    const state = startTable(createTable(1, 'hard', 1));
    const view = publicView(state, state.toAct);
    const strong = decide({ ...view, hole: ['AS', 'AH'] }, 'hard');
    expect(strong.type).toBe('raise');
    // Facing an all-in on the river with nothing.
    const facing: PublicView = {
      ...view,
      street: 'river',
      board: ['AS', 'KS', 'QD', '8C', '3H'],
      hole: ['7C', '2D'],
      currentBet: 190,
      legal: { fold: true, check: false, call: 180, raise: null },
      seats: view.seats.map((s, i) => (i === view.seat ? { ...s, bet: 10, committed: 10, stack: 190 } : { ...s, bet: 190, committed: 200, stack: 0 }))
    };
    for (const level of DIFFICULTIES) expect(decide(facing, level)).toEqual({ type: 'fold' });
    // The nuts facing the same bet calls.
    expect(decide({ ...facing, hole: ['JS', 'TS'] }, 'medium')).toEqual({ type: 'call' });
  });

  it('checks when it is free and the hand is weak', () => {
    const view: PublicView = {
      seat: 0,
      hole: ['7C', '2D'],
      board: ['AS', 'KH', 'QD'],
      street: 'flop',
      button: 1,
      sb: 1,
      bb: 2,
      handNumber: 1,
      currentBet: 0,
      minRaise: 2,
      seats: [0, 1, 2, 3].map(() => ({ stack: 190, bet: 0, committed: 10, inHand: true, folded: false, acted: false })),
      log: [],
      stats: [0, 1, 2, 3].map(() => ({ hands: 0, vpip: 0, pfr: 0, aggressive: 0, passive: 0 })),
      legal: { fold: false, check: true, call: 0, raise: { min: 2, max: 190 } },
      aiSeed: 5
    };
    for (const level of DIFFICULTIES) expect(decide(view, level)).toEqual({ type: 'check' });
  });

  it('levels differ in effort and style', () => {
    expect(LEVELS.easy.iterations).toBeLessThan(LEVELS.medium.iterations);
    expect(LEVELS.medium.iterations).toBeLessThan(LEVELS.hard.iterations);
    expect(LEVELS.easy.bluff).toBe(0);
    expect(LEVELS.hard.bluff).toBeGreaterThan(0);
    expect(LEVELS.hard.ranges).toBe("stats");
  });
});
