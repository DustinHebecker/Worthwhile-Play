import { createRng, type Rng } from '@wp/game-core';
import { estimateEquity } from './equity';
import type { Action, Difficulty, PublicView, SeatStats } from './rules';

/**
 * Computer opponents. `decide` sees only a `PublicView`: the public table (stacks, bets, actions, board, public
 * action statistics) plus its own two hole cards — never the deck or other players' cards. Its random numbers
 * come from `view.aiSeed`, derived from the stored game generator, so every decision is reproducible.
 *
 * Method (all levels): seeded Monte Carlo equity against the opponents still in the hand, compared with the pot
 * odds; bet and raise when the hand is clearly stronger than an average hand at this table size, call when the
 * equity pays for the call, sometimes bluff. The levels differ in:
 * - easy: few samples, a noisy view of its own strength, calls too loosely, raises only strong hands, never bluffs;
 * - medium: more samples, narrows opponents' starting hands by their action in this hand (raised/called), small
 *   bluff frequency;
 * - hard: more samples, narrows ranges by each opponent's observed habits (how often they play and raise before
 *   the flop), reads aggression (frequent bettors get called lighter, passive ones respected), bluffs more in
 *   position, and sizes bets with the hand strength.
 */
export interface LevelConfig {
  iterations: number;
  /** ± noise added to the estimated equity. */
  noise: number;
  /** Extra equity required above the pot odds to call (negative = calls too much). */
  callMargin: number;
  /** Bluff probability when checked to (doubled in position). */
  bluff: number;
  /** Relative strength (0 = average hand at this table size, 1 = certain win) needed to bet for value. */
  valueEdge: number;
  /** Relative strength needed to raise a bet. */
  raiseEdge: number;
  ranges: 'none' | 'action' | 'stats';
}

export const LEVELS: Readonly<Record<Difficulty, LevelConfig>> = {
  easy: { iterations: 80, noise: 0.14, callMargin: -0.1, bluff: 0, valueEdge: 0.4, raiseEdge: 0.65, ranges: 'none' },
  medium: { iterations: 200, noise: 0.04, callMargin: 0, bluff: 0.04, valueEdge: 0.22, raiseEdge: 0.45, ranges: 'action' },
  hard: { iterations: 320, noise: 0, callMargin: 0.02, bluff: 0.03, valueEdge: 0.25, raiseEdge: 0.5, ranges: 'stats' }
};

/** Priors for players without much history: share of hands played / raised before the flop. */
const PRIOR_HANDS = 8;
const PRIOR_VPIP = 0.35;
const PRIOR_PFR = 0.15;
const PRIOR_AGGRESSION = 0.4;

const smoothed = (count: number, hands: number, prior: number) => (count + prior * PRIOR_HANDS) / (hands + PRIOR_HANDS);

/** Share of starting hands an opponent is assumed to hold, from their actions before the flop. */
export function opponentRange(view: PublicView, opponent: number, mode: LevelConfig['ranges']): number {
  if (mode === 'none') return 1;
  const pre = view.log.filter((e) => e.seat === opponent && e.street === 'preflop');
  const raised = pre.some((e) => e.kind === 'raise' || e.kind === 'bet');
  const called = pre.some((e) => e.kind === 'call');
  if (mode === 'action') return raised ? 0.25 : called ? 0.55 : 1;
  const stats = view.stats[opponent] as SeatStats;
  const clamp = (x: number) => Math.min(1, Math.max(0.06, x));
  if (raised) return clamp(smoothed(stats.pfr, stats.hands, PRIOR_PFR) * 1.2);
  if (called) return clamp(smoothed(stats.vpip, stats.hands, PRIOR_VPIP) * 1.2);
  return 1;
}

/** Observed share of bets/raises among an opponent's bets, raises and calls. */
export function aggression(stats: SeatStats): number {
  return (stats.aggressive + PRIOR_AGGRESSION * 5) / (stats.aggressive + stats.passive + 5);
}

/** Total of all chips in the pot (including the current street's bets). */
const potOf = (view: PublicView) => view.seats.reduce((sum, seat) => sum + seat.committed, 0);

/** Live opponents who act after this seat after the flop (0 = acting last, "in position"). */
export function playersBehind(view: PublicView): number {
  const n = view.seats.length;
  // After the flop the order starts left of the button; the button acts last.
  const order = (i: number) => (i - view.button - 1 + n) % n;
  return view.seats.filter((seat, i) => i !== view.seat && seat.inHand && !seat.folded && order(i) > order(view.seat)).length;
}

function raiseTo(view: PublicView, fraction: number): Action {
  const legal = view.legal;
  if (!legal.raise) return legal.call > 0 ? { type: 'call' } : { type: 'check' };
  const me = view.seats[view.seat];
  const myBet = me?.bet ?? 0;
  const toCall = legal.call;
  const pot = potOf(view);
  let to = Math.round(myBet + toCall + fraction * (pot + toCall));
  if (view.street === 'preflop' && view.currentBet <= view.bb) to = Math.max(to, Math.round(view.bb * 3));
  to = Math.min(legal.raise.max, Math.max(legal.raise.min, to));
  // Commit when most of the stack would go in anyway.
  if (to >= legal.raise.max * 0.6) to = legal.raise.max;
  return { type: 'raise', to };
}

/** Chooses an action for `view.seat`. Always legal; deterministic for a given view and level. */
export function decide(view: PublicView, level: Difficulty): Action {
  const config = LEVELS[level];
  const rng: Rng = createRng(view.aiSeed);
  const legal = view.legal;
  const opponents = view.seats.map((seat, i) => ({ seat, i })).filter(({ seat, i }) => i !== view.seat && seat.inHand && !seat.folded);
  const fallback: Action = legal.check ? { type: 'check' } : legal.call > 0 ? { type: 'call' } : { type: 'fold' };
  if (opponents.length === 0 || view.hole.length !== 2) return fallback;

  const ranges = opponents.map(({ i }) => opponentRange(view, i, config.ranges));
  let equity = estimateEquity(view.hole, view.board, ranges, config.iterations, rng);
  equity += config.noise * (rng.next() * 2 - 1);
  const toCall = legal.call;
  const pot = potOf(view);

  if (config.ranges === 'stats' && toCall > 0) {
    // Read the last aggressor this street: frequent bettors bluff more, passive players rarely do.
    const aggressor = [...view.log].reverse().find((e) => e.street === view.street && (e.kind === 'bet' || e.kind === 'raise'));
    if (aggressor) equity += (aggression(view.stats[aggressor.seat] as SeatStats) - PRIOR_AGGRESSION) * 0.25;
  }

  const base = 1 / (opponents.length + 1);
  const strength = (equity - base) / (1 - base);
  const inPosition = view.street !== 'preflop' && playersBehind(view) === 0;

  if (toCall === 0) {
    if (legal.raise && strength >= config.valueEdge) return raiseTo(view, strength >= config.raiseEdge ? 0.75 : 0.5);
    const bluffChance = config.bluff * (inPosition ? 2 : 1) * (opponents.length <= 2 ? 1 : 0.3);
    if (legal.raise && view.street !== 'preflop' && rng.next() < bluffChance) return raiseTo(view, 0.5);
    return { type: 'check' };
  }

  const potOdds = toCall / (pot + toCall);
  if (legal.raise && strength >= config.raiseEdge) return raiseTo(view, strength >= (1 + config.raiseEdge) / 2 ? 1 : 0.75);
  if (equity >= potOdds + config.callMargin) return { type: 'call' };
  // An occasional bluff-raise from the hard level, only against one opponent and with chips to spare.
  if (config.ranges === 'stats' && legal.raise && opponents.length === 1 && view.street === 'flop' && rng.next() < config.bluff / 2) {
    return raiseTo(view, 0.75);
  }
  return { type: 'fold' };
}

/** A `Decider` for `runComputers` at a fixed level. */
export const computer =
  (level: Difficulty) =>
  (view: PublicView): Action =>
    decide(view, level);
