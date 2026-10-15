/**
 * Simulation helpers for tests: scripted players and duplicate heads-up matches measured in big blinds per
 * 100 hands (bb/100). Every deal is played twice with the seats swapped, which removes most of the card luck.
 */
import { createRng } from '@wp/game-core';
import { computer } from '../src/ai';
import { classOf, PREFLOP_PERCENTILE } from '../src/equity';
import { cardId } from '../src/eval';
import { createTable, dealHand, runComputers, START_STACK, type Action, type Decider, type Difficulty, type PokerState, type PublicView } from '../src/rules';

export const callingStation: Decider = (view) => (view.legal.check ? { type: 'check' } : { type: 'call' });

/** Plays only the top 20 % of starting hands, continues after the flop only with a pair or better using a hole card. Never raises. */
export const tightPassive: Decider = (view) => {
  const continueOn = (): boolean => {
    if (view.street === 'preflop') return (PREFLOP_PERCENTILE[classOf(view.hole)] as number) <= 0.2;
    const ranks = view.hole.map((c) => cardId(c) % 13);
    const boardRanks = view.board.map((c) => cardId(c) % 13);
    return ranks[0] === ranks[1] || ranks.some((r) => boardRanks.includes(r));
  };
  if (view.legal.check) return { type: 'check' };
  return continueOn() ? { type: 'call' } : { type: 'fold' };
};

/** Uniformly random among fold / check-or-call / raise (random legal size). */
export const randomPlayer: Decider = (view) => {
  const rng = createRng(view.aiSeed ^ 0x5bd1e995);
  const options: Action[] = [];
  if (view.legal.fold) options.push({ type: 'fold' });
  options.push(view.legal.check ? { type: 'check' } : { type: 'call' });
  if (view.legal.raise) options.push({ type: 'raise', to: rng.int(view.legal.raise.min, view.legal.raise.max) });
  return rng.pick(options);
};

export const level = (difficulty: Difficulty): Decider => computer(difficulty);

/** One heads-up hand at the first blind level with 100 big blinds each; returns seat 0's chip result. */
export function playHeadsUp(agents: readonly [Decider, Decider], rngState: number, button: 0 | 1): number {
  // Hand 1 places the button at `seed % seats`; the deck comes from `rngState`.
  let state: PokerState = dealHand({ ...createTable(button, 'easy', 1), rngState: rngState >>> 0 });
  const decide: Decider = (view: PublicView) => (agents[view.seat as 0 | 1] as Decider)(view);
  state = runComputers(state, decide, -1);
  return (state.seats[0]?.stack ?? START_STACK) - START_STACK;
}

/**
 * Ring game: `hero` in seat 0 against `players - 1` copies of `villain`, 100 big blinds each, stacks reset every
 * hand, button rotating. Each deal is replayed once per seat rotation of the hero's cards (hero gets every seat's
 * cards once), which removes much of the card luck. Returns the hero's bb/100.
 */
export function ringMatch(hero: Decider, villain: Decider, players: number, deals: number, seed: number): MatchResult {
  let total = 0;
  let hands = 0;
  for (let k = 0; k < deals; k++) {
    const rngState = (seed * 7919 + k * 104729) >>> 0;
    for (let heroSeat = 0; heroSeat < players; heroSeat++) {
      let state: PokerState = dealHand({ ...createTable(k % players, 'easy', players - 1), rngState });
      const decide: Decider = (view) => (view.seat === heroSeat ? hero : villain)(view);
      state = runComputers(state, decide, -1);
      total += (state.seats[heroSeat]?.stack ?? START_STACK) - START_STACK;
      hands++;
    }
  }
  return { hands, bb100: (total / 2 / hands) * 100 };
}

export interface MatchResult {
  hands: number;
  /** Big blinds per 100 hands won by the first agent. */
  bb100: number;
}

/** Duplicate match: `deals` deals, each played twice with swapped seats, alternating the button. */
export function duplicateMatch(a: Decider, b: Decider, deals: number, seed: number): MatchResult {
  let total = 0;
  for (let k = 0; k < deals; k++) {
    const rngState = (seed * 7919 + k * 104729) >>> 0;
    const button = (k % 2) as 0 | 1;
    total += playHeadsUp([a, b], rngState, button);
    total -= playHeadsUp([b, a], rngState, button);
  }
  const hands = deals * 2;
  return { hands, bb100: (total / 2 / hands) * 100 };
}
