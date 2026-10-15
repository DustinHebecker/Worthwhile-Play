import { areDisjoint, deck52, isCardList, shuffleWithState, type Card } from '@wp/cards';
import { isInt, isOneOf, isRecord, isUint32, normalizeSeed } from '@wp/game-core';
import { scoreCards } from './eval';

/**
 * Texas Hold'em, no-limit, one table: the player (seat 0) against 1–5 computer opponents.
 *
 * Table decisions (documented for players in the rules text and in the final report):
 * - Everyone starts with START_STACK chips = 100 big blinds of the first level. Chips exist only at this table.
 * - Blinds rise by HAND COUNT, never by time: every HANDS_PER_LEVEL hands to the next entry of BLIND_LEVELS.
 *   This gives the table a natural end without any clock.
 * - Moving button (no dead button): the button moves to the next seat that still has chips; small blind is the
 *   next seat with chips after the button, big blind the next after that. Heads-up the button posts the small
 *   blind and acts first before the flop, last after it.
 * - A blind that cannot be posted in full is posted all-in; the amount to call is the largest blind actually
 *   posted (simplification), the minimum raise stays one big blind.
 * - No-limit raises: a raise must be at least the size of the last full bet or raise of the street (one big
 *   blind at least). An all-in for less does not reopen the betting for players who already acted (they may
 *   only call or fold). Several short all-ins are not added up (simplification).
 * - Uncalled chips are returned at the end of each betting round. Side pots are layered by commitment.
 * - Showdown: every hand still in is shown (no mucking); hands that folded are never shown. Split pots are
 *   divided evenly; odd chips go one at a time to the winners in seat order starting left of the button.
 * - Folding is only offered when there is a bet to call (checking is free). No burn cards (they do not change
 *   the odds).
 */

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

export const MIN_OPPONENTS = 1;
export const MAX_OPPONENTS = 5;
export const DEFAULT_OPPONENTS = 3;

export const START_STACK = 200;
export const HANDS_PER_LEVEL = 10;
/** [small blind, big blind]; the last level stays. */
export const BLIND_LEVELS: readonly (readonly [number, number])[] = [
  [1, 2],
  [2, 4],
  [3, 6],
  [5, 10],
  [8, 16],
  [10, 20],
  [15, 30],
  [20, 40],
  [30, 60],
  [50, 100],
  [75, 150],
  [100, 200],
  [150, 300],
  [200, 400],
  [300, 600]
];

export const STREETS = ['preflop', 'flop', 'turn', 'river'] as const;
export type Street = (typeof STREETS)[number];
const BOARD_SIZE: Readonly<Record<Street, number>> = { preflop: 0, flop: 3, turn: 4, river: 5 };

export const PHASES = ['setup', 'betting', 'handOver', 'finished'] as const;
export type Phase = (typeof PHASES)[number];

export const LOG_KINDS = ['sb', 'bb', 'fold', 'check', 'call', 'bet', 'raise'] as const;
export type LogKind = (typeof LOG_KINDS)[number];

export const ENDINGS = ['busted', 'champion', 'stopped'] as const;
export type Ending = (typeof ENDINGS)[number];

/** A player's choice. `raise.to` is the player's total bet on this street afterwards (a bet is a raise from 0). */
export type Action = { type: 'fold' } | { type: 'check' } | { type: 'call' } | { type: 'raise'; to: number };

export interface LogEntry {
  seat: number;
  kind: LogKind;
  /** The seat's total bet on the street after the action (0 for fold/check). */
  amount: number;
  allIn: boolean;
  street: Street;
}

export interface Seat {
  stack: number;
  /** Chips put in on the current street. */
  bet: number;
  /** Chips put in during the whole hand (includes `bet`). */
  committed: number;
  /** Two hole cards while dealt into the current/last hand, else empty. */
  hole: Card[];
  /** Dealt into the current/last hand. */
  inHand: boolean;
  folded: boolean;
  /** Acted since the last full bet or raise of this street (blinds do not count). */
  acted: boolean;
}

/** Public, per-seat action counts over the whole table (used for simple opponent modelling). */
export interface SeatStats {
  hands: number;
  /** Hands with a voluntary call, bet or raise before the flop. */
  vpip: number;
  /** Hands with a bet or raise before the flop. */
  pfr: number;
  /** Bets and raises on all streets. */
  aggressive: number;
  /** Calls on all streets. */
  passive: number;
}

export interface PotResult {
  amount: number;
  eligible: number[];
  winners: number[];
}

export interface HandResult {
  showdown: boolean;
  pots: PotResult[];
  /** Chips each seat received from the pots. */
  payouts: number[];
  /** Seats whose hole cards are shown (showdown only). */
  shown: number[];
  /** Best-hand score per seat for shown seats, else 0. */
  scores: number[];
}

export interface Summary {
  hands: number;
  showdownsWon: number;
  biggestPot: number;
}

export interface PokerState {
  version: 1;
  seed: number;
  difficulty: Difficulty;
  opponents: number;
  phase: Phase;
  handNumber: number;
  button: number;
  sb: number;
  bb: number;
  street: Street;
  board: Card[];
  /** Undealt cards, top first. */
  deck: Card[];
  seats: Seat[];
  /** Seat to act, -1 if none. */
  toAct: number;
  currentBet: number;
  /** Size of the last full bet or raise on this street (at least one big blind). */
  minRaise: number;
  log: LogEntry[];
  result: HandResult | null;
  rngState: number;
  stats: SeatStats[];
  summary: Summary;
  ended: Ending | null;
}

/* ------------------------------------------------------------------ helpers */

export const blindsForHand = (handNumber: number): readonly [number, number] => {
  const level = Math.min(BLIND_LEVELS.length - 1, Math.floor(Math.max(0, handNumber - 1) / HANDS_PER_LEVEL));
  return BLIND_LEVELS[level] as readonly [number, number];
};

export const totalChips = (opponents: number): number => START_STACK * (opponents + 1);

const cloneSeat = (seat: Seat): Seat => ({ ...seat, hole: [...seat.hole] });
export const cloneState = (state: PokerState): PokerState => ({
  ...state,
  board: [...state.board],
  deck: [...state.deck],
  seats: state.seats.map(cloneSeat),
  log: state.log.map((entry) => ({ ...entry })),
  result: state.result
    ? {
        ...state.result,
        pots: state.result.pots.map((pot) => ({ amount: pot.amount, eligible: [...pot.eligible], winners: [...pot.winners] })),
        payouts: [...state.result.payouts],
        shown: [...state.result.shown],
        scores: [...state.result.scores]
      }
    : null,
  stats: state.stats.map((s) => ({ ...s })),
  summary: { ...state.summary }
});

/** Still competing for the pot. */
export const isLive = (seat: Seat): boolean => seat.inHand && !seat.folded;
/** Live and with chips behind (can still act). */
export const canAct = (seat: Seat): boolean => isLive(seat) && seat.stack > 0;
export const isAllIn = (seat: Seat): boolean => isLive(seat) && seat.stack === 0;

export const potTotal = (state: PokerState): number => state.seats.reduce((sum, seat) => sum + seat.committed, 0);

/** Next seat index after `from` (clockwise) that satisfies `test`, or -1. */
export function nextSeat(seats: readonly Seat[], from: number, test: (seat: Seat, index: number) => boolean): number {
  const n = seats.length;
  for (let step = 1; step <= n; step++) {
    const index = (((from + step) % n) + n) % n;
    if (test(seats[index] as Seat, index)) return index;
  }
  return -1;
}

const emptyStats = (): SeatStats => ({ hands: 0, vpip: 0, pfr: 0, aggressive: 0, passive: 0 });

/* ------------------------------------------------------------------ table life cycle */

/** A table in its setup phase (nothing dealt yet). */
export function createTable(seed: number, difficulty: Difficulty, opponents: number): PokerState {
  const count = Math.min(MAX_OPPONENTS, Math.max(MIN_OPPONENTS, Math.trunc(opponents)));
  const [sb, bb] = blindsForHand(1);
  return {
    version: 1,
    seed: normalizeSeed(seed),
    difficulty,
    opponents: count,
    phase: 'setup',
    handNumber: 0,
    button: 0,
    sb,
    bb,
    street: 'preflop',
    board: [],
    deck: [],
    seats: Array.from({ length: count + 1 }, () => ({ stack: START_STACK, bet: 0, committed: 0, hole: [], inHand: false, folded: false, acted: false })),
    toAct: -1,
    currentBet: 0,
    minRaise: bb,
    log: [],
    result: null,
    rngState: normalizeSeed(seed),
    stats: Array.from({ length: count + 1 }, emptyStats),
    summary: { hands: 0, showdownsWon: 0, biggestPot: 0 },
    ended: null
  };
}

/** Changes the setup options (only in the setup phase). */
export function configureTable(state: PokerState, options: { difficulty?: Difficulty; opponents?: number }): PokerState {
  if (state.phase !== 'setup') return state;
  return createTable(state.seed, options.difficulty ?? state.difficulty, options.opponents ?? state.opponents);
}

/** Puts chips from a seat into the pot (at most its stack). */
function putIn(seat: Seat, amount: number): number {
  const paid = Math.min(amount, seat.stack);
  seat.stack -= paid;
  seat.bet += paid;
  seat.committed += paid;
  return paid;
}

/**
 * Deals the next hand: blinds by hand count, moving button, a fresh shuffle from the stored generator state,
 * two hole cards per seat with chips, blinds posted. Leaves the first seat to act in `toAct`.
 */
export function dealHand(previous: PokerState): PokerState {
  const state = cloneState(previous);
  state.handNumber += 1;
  const [sb, bb] = blindsForHand(state.handNumber);
  state.sb = sb;
  state.bb = bb;
  state.phase = 'betting';
  state.street = 'preflop';
  state.board = [];
  state.log = [];
  state.result = null;
  for (const seat of state.seats) {
    seat.bet = 0;
    seat.committed = 0;
    seat.hole = [];
    seat.folded = false;
    seat.acted = false;
    seat.inHand = seat.stack > 0;
  }
  const { cards, rngState } = shuffleWithState(deck52(), state.rngState);
  state.rngState = rngState;
  if (state.handNumber === 1) {
    // The first button follows from the seed (every seat is still in at hand 1).
    state.button = state.seed % state.seats.length;
  } else {
    state.button = nextSeat(state.seats, state.button, (seat) => seat.inHand);
  }
  const liveCount = state.seats.filter((seat) => seat.inHand).length;
  const sbSeat = liveCount === 2 ? state.button : nextSeat(state.seats, state.button, (seat) => seat.inHand);
  const bbSeat = nextSeat(state.seats, sbSeat, (seat) => seat.inHand);
  // Deal one card at a time, starting left of the button.
  const deck = [...cards];
  for (let round = 0; round < 2; round++) {
    let seat = state.button;
    for (let k = 0; k < liveCount; k++) {
      seat = nextSeat(state.seats, seat, (s) => s.inHand);
      (state.seats[seat] as Seat).hole.push(deck.shift() as Card);
    }
  }
  state.deck = deck;
  const sbSeatObj = state.seats[sbSeat] as Seat;
  const bbSeatObj = state.seats[bbSeat] as Seat;
  putIn(sbSeatObj, sb);
  state.log.push({ seat: sbSeat, kind: 'sb', amount: sbSeatObj.bet, allIn: sbSeatObj.stack === 0, street: 'preflop' });
  putIn(bbSeatObj, bb);
  state.log.push({ seat: bbSeat, kind: 'bb', amount: bbSeatObj.bet, allIn: bbSeatObj.stack === 0, street: 'preflop' });
  state.currentBet = Math.max(sbSeatObj.bet, bbSeatObj.bet);
  state.minRaise = bb;
  state.toAct = nextToAct(state, bbSeat);
  if (state.toAct < 0) return finishRound(state);
  return state;
}

/** Starts play at a table in its setup phase. */
export function startTable(state: PokerState): PokerState {
  if (state.phase !== 'setup') return state;
  return dealHand(state);
}

/** Next hand after a finished one. */
export function nextHand(state: PokerState): PokerState {
  if (state.phase !== 'handOver') return state;
  return dealHand(state);
}

/**
 * The player ends the table calmly. A hand in progress is not played out: every seat takes back what it put
 * in, and the hand does not count.
 */
export function endTable(previous: PokerState): PokerState {
  if (previous.phase === 'finished') return previous;
  const state = cloneState(previous);
  for (const seat of state.seats) {
    seat.stack += seat.committed;
    seat.bet = 0;
    seat.committed = 0;
  }
  state.toAct = -1;
  state.currentBet = 0;
  state.phase = 'finished';
  state.ended = 'stopped';
  return state;
}

/* ------------------------------------------------------------------ betting */

export interface Legal {
  fold: boolean;
  check: boolean;
  /** Chips needed to call (0 = no call possible). */
  call: number;
  /** Smallest and largest total bet for a bet/raise (`max` = all-in), or null when raising is not allowed. */
  raise: { min: number; max: number } | null;
}

export function legalActions(state: PokerState, seatIndex: number = state.toAct): Legal {
  const none: Legal = { fold: false, check: false, call: 0, raise: null };
  if (state.phase !== 'betting' || seatIndex !== state.toAct || seatIndex < 0) return none;
  const seat = state.seats[seatIndex] as Seat;
  if (!canAct(seat)) return none;
  const toCall = Math.max(0, state.currentBet - seat.bet);
  const call = Math.min(toCall, seat.stack);
  const max = seat.bet + seat.stack;
  const othersCanRespond = state.seats.some((other, i) => i !== seatIndex && canAct(other));
  let raise: Legal['raise'] = null;
  if (!seat.acted && othersCanRespond && max > state.currentBet) {
    const min = Math.min(max, state.currentBet + state.minRaise);
    raise = { min, max };
  }
  return { fold: toCall > 0, check: toCall === 0, call, raise };
}

export function isLegal(state: PokerState, action: Action): boolean {
  const legal = legalActions(state);
  switch (action.type) {
    case 'fold':
      return legal.fold;
    case 'check':
      return legal.check;
    case 'call':
      return legal.call > 0;
    case 'raise':
      return legal.raise !== null && Number.isInteger(action.to) && action.to >= legal.raise.min && action.to <= legal.raise.max;
  }
}

/** The next seat after `from` that still has to act this street, or -1 when the round is complete. */
function nextToAct(state: PokerState, from: number): number {
  const live = state.seats.filter(isLive);
  if (live.length <= 1) return -1;
  const actors = state.seats.filter(canAct);
  if (actors.length === 0) return -1;
  const maxOtherBet = (index: number) => Math.max(0, ...state.seats.filter((_, i) => i !== index).map((s) => s.bet));
  return nextSeat(state.seats, from, (seat, index) => {
    if (!canAct(seat)) return false;
    if (seat.bet < state.currentBet) return true;
    if (seat.acted) return false;
    // A lone player with chips behind, already matching every bet, has nobody to bet against.
    if (actors.length === 1 && seat.bet >= maxOtherBet(index)) return false;
    return true;
  });
}

/** Applies the action of the seat to act. Throws a RangeError for an illegal action. */
export function applyAction(previous: PokerState, action: Action): PokerState {
  if (!isLegal(previous, action)) throw new RangeError(`Illegal action ${JSON.stringify(action)}`);
  const state = cloneState(previous);
  const index = state.toAct;
  const seat = state.seats[index] as Seat;
  const street = state.street;
  switch (action.type) {
    case 'fold':
      seat.folded = true;
      state.log.push({ seat: index, kind: 'fold', amount: 0, allIn: false, street });
      break;
    case 'check':
      state.log.push({ seat: index, kind: 'check', amount: 0, allIn: false, street });
      break;
    case 'call':
      putIn(seat, state.currentBet - seat.bet);
      state.log.push({ seat: index, kind: 'call', amount: seat.bet, allIn: seat.stack === 0, street });
      break;
    case 'raise': {
      const kind: LogKind = state.currentBet === 0 ? 'bet' : 'raise';
      const increment = action.to - state.currentBet;
      putIn(seat, action.to - seat.bet);
      if (increment >= state.minRaise) {
        // A full raise reopens the betting for everyone else.
        state.minRaise = increment;
        for (const other of state.seats) other.acted = false;
      }
      state.currentBet = action.to;
      state.log.push({ seat: index, kind, amount: seat.bet, allIn: seat.stack === 0, street });
      break;
    }
  }
  seat.acted = true;
  state.toAct = nextToAct(state, index);
  if (state.toAct < 0) return finishRound(state);
  return state;
}

/** Returns the part of the highest bet that nobody matched. */
function returnUncalled(state: PokerState): void {
  let top = -1;
  for (let i = 0; i < state.seats.length; i++) if (top < 0 || (state.seats[i] as Seat).bet > (state.seats[top] as Seat).bet) top = i;
  if (top < 0) return;
  const topSeat = state.seats[top] as Seat;
  const second = Math.max(0, ...state.seats.filter((_, i) => i !== top).map((s) => s.bet));
  const extra = topSeat.bet - second;
  if (extra > 0) {
    topSeat.bet -= extra;
    topSeat.committed -= extra;
    topSeat.stack += extra;
  }
}

/** Ends a betting round: next street, or the end of the hand. */
function finishRound(state: PokerState): PokerState {
  returnUncalled(state);
  const live = state.seats.filter(isLive);
  if (live.length <= 1) return finishHand(state, false);
  for (;;) {
    for (const seat of state.seats) {
      seat.bet = 0;
      seat.acted = false;
    }
    state.currentBet = 0;
    state.minRaise = state.bb;
    if (state.street === 'river') return finishHand(state, true);
    const nextStreet = STREETS[STREETS.indexOf(state.street) + 1] as Street;
    state.street = nextStreet;
    const need = BOARD_SIZE[nextStreet] - state.board.length;
    state.board.push(...state.deck.splice(0, need));
    state.toAct = nextToAct(state, state.button);
    if (state.toAct >= 0) return state;
  }
}

interface Pot {
  amount: number;
  eligible: number[];
}

/**
 * Splits the chips committed in a hand into the main pot and side pots. `committed[i]` is what seat i put in,
 * `live[i]` whether it can still win. Pots with the same eligible seats are merged.
 */
export function computePots(committed: readonly number[], live: readonly boolean[]): Pot[] {
  const remaining = [...committed];
  const pots: Pot[] = [];
  for (;;) {
    const levels = remaining.filter((amount, i) => amount > 0 && live[i]);
    if (levels.length === 0) break;
    const level = Math.min(...levels);
    let amount = 0;
    const eligible: number[] = [];
    remaining.forEach((value, i) => {
      const part = Math.min(value, level);
      amount += part;
      remaining[i] = value - part;
      if (live[i] && value >= level) eligible.push(i);
    });
    const last = pots[pots.length - 1];
    if (last && last.eligible.length === eligible.length && last.eligible.every((seat, k) => seat === eligible[k])) last.amount += amount;
    else pots.push({ amount, eligible });
  }
  // Chips of folded seats above every live commitment (cannot happen after uncalled bets are returned).
  const rest = remaining.reduce((sum, value) => sum + value, 0);
  const last = pots[pots.length - 1];
  if (rest > 0 && last) last.amount += rest;
  return pots;
}

/** Divides a pot among winners; odd chips go one by one in seat order starting left of the button. */
export function splitPot(amount: number, winners: readonly number[], button: number, seatCount: number): number[] {
  const payouts = new Array<number>(seatCount).fill(0);
  if (winners.length === 0) return payouts;
  const share = Math.floor(amount / winners.length);
  let odd = amount - share * winners.length;
  for (const w of winners) payouts[w] = (payouts[w] as number) + share;
  for (let step = 1; step <= seatCount && odd > 0; step++) {
    const seat = (button + step) % seatCount;
    if (winners.includes(seat)) {
      payouts[seat] = (payouts[seat] as number) + 1;
      odd--;
    }
  }
  return payouts;
}

function finishHand(state: PokerState, showdown: boolean): PokerState {
  const n = state.seats.length;
  const live = state.seats.map(isLive);
  const scores = state.seats.map((seat, i) => (showdown && live[i] ? scoreCards([...seat.hole, ...state.board]) : 0));
  const pots = computePots(state.seats.map((s) => s.committed), live);
  const payouts = new Array<number>(n).fill(0);
  const results: PotResult[] = pots.map((pot) => {
    const best = Math.max(...pot.eligible.map((i) => scores[i] as number));
    const winners = pot.eligible.filter((i) => scores[i] === best);
    splitPot(pot.amount, winners, state.button, n).forEach((value, i) => (payouts[i] = (payouts[i] as number) + value));
    return { amount: pot.amount, eligible: pot.eligible, winners };
  });
  state.seats.forEach((seat, i) => {
    seat.stack += payouts[i] as number;
    seat.bet = 0;
    seat.committed = 0;
    seat.acted = false;
  });
  const shown = showdown ? live.map((l, i) => (l ? i : -1)).filter((i) => i >= 0) : [];
  state.result = { showdown, pots: results, payouts, shown, scores };
  state.toAct = -1;
  state.currentBet = 0;
  state.phase = 'handOver';
  updateStats(state);
  const me = state.seats[0] as Seat;
  if (me.inHand) {
    state.summary.hands += 1;
    if (showdown && live[0] && (payouts[0] as number) > 0) state.summary.showdownsWon += 1;
    state.summary.biggestPot = Math.max(state.summary.biggestPot, payouts[0] as number);
  }
  if (me.stack === 0) {
    state.phase = 'finished';
    state.ended = 'busted';
  } else if (state.seats.every((seat, i) => i === 0 || seat.stack === 0)) {
    state.phase = 'finished';
    state.ended = 'champion';
  }
  return state;
}

function updateStats(state: PokerState): void {
  state.seats.forEach((seat, i) => {
    if (!seat.inHand) return;
    const stats = state.stats[i] as SeatStats;
    const own = state.log.filter((entry) => entry.seat === i);
    stats.hands += 1;
    if (own.some((e) => e.street === 'preflop' && (e.kind === 'call' || e.kind === 'raise' || e.kind === 'bet'))) stats.vpip += 1;
    if (own.some((e) => e.street === 'preflop' && (e.kind === 'raise' || e.kind === 'bet'))) stats.pfr += 1;
    stats.aggressive += own.filter((e) => e.kind === 'bet' || e.kind === 'raise').length;
    stats.passive += own.filter((e) => e.kind === 'call').length;
  });
}

/* ------------------------------------------------------------------ computer seats */

/** What a computer seat may know: public table state plus its own hole cards. No deck, no other hole cards. */
export interface PublicSeat {
  stack: number;
  bet: number;
  committed: number;
  inHand: boolean;
  folded: boolean;
  acted: boolean;
}

export interface PublicView {
  seat: number;
  hole: readonly Card[];
  board: readonly Card[];
  street: Street;
  button: number;
  sb: number;
  bb: number;
  handNumber: number;
  currentBet: number;
  minRaise: number;
  seats: readonly PublicSeat[];
  log: readonly LogEntry[];
  stats: readonly SeatStats[];
  legal: Legal;
  /** Seed for the decision's own random numbers, derived from the stored game generator and the public position. */
  aiSeed: number;
}

export function publicView(state: PokerState, seatIndex: number): PublicView {
  const seat = state.seats[seatIndex] as Seat;
  let aiSeed = state.rngState ^ Math.imul(state.handNumber + 1, 0x9e3779b1) ^ Math.imul(state.log.length + 1, 0x85ebca6b) ^ Math.imul(seatIndex + 1, 0xc2b2ae35);
  aiSeed = Math.imul(aiSeed ^ (aiSeed >>> 16), 0x7feb352d) >>> 0;
  return {
    seat: seatIndex,
    hole: [...seat.hole],
    board: [...state.board],
    street: state.street,
    button: state.button,
    sb: state.sb,
    bb: state.bb,
    handNumber: state.handNumber,
    currentBet: state.currentBet,
    minRaise: state.minRaise,
    seats: state.seats.map(({ stack, bet, committed, inHand, folded, acted }) => ({ stack, bet, committed, inHand, folded, acted })),
    log: state.log.map((entry) => ({ ...entry })),
    stats: state.stats.map((s) => ({ ...s })),
    legal: legalActions(state, seatIndex),
    aiSeed
  };
}

export type Decider = (view: PublicView) => Action;

/**
 * Lets computer seats act until the human seat (`human`, default 0) has to act or the hand is over.
 * Pass `human = -1` to let `decide` play every seat (simulations).
 */
export function runComputers(previous: PokerState, decide: Decider, human = 0): PokerState {
  let state = previous;
  let guard = 0;
  while (state.phase === 'betting' && state.toAct !== human && state.toAct >= 0) {
    state = applyAction(state, decide(publicView(state, state.toAct)));
    if (++guard > 1000) throw new Error('Betting did not terminate.');
  }
  return state;
}

/* ------------------------------------------------------------------ validation */

const isStats = (value: unknown): value is SeatStats =>
  isRecord(value) && ['hands', 'vpip', 'pfr', 'aggressive', 'passive'].every((key) => isInt(value[key], 0, 1e7));

const isSeat = (value: unknown): value is Seat =>
  isRecord(value) &&
  isInt(value.stack, 0, 1e7) &&
  isInt(value.bet, 0, 1e7) &&
  isInt(value.committed, 0, 1e7) &&
  (value.bet as number) <= (value.committed as number) &&
  typeof value.inHand === 'boolean' &&
  typeof value.folded === 'boolean' &&
  typeof value.acted === 'boolean' &&
  isCardList(value.hole, { maxLength: 2 }) &&
  (value.hole as Card[]).length === (value.inHand ? 2 : 0) &&
  (value.inHand || (value.committed === 0 && !value.folded));

const isLogEntry = (value: unknown, seats: number): value is LogEntry =>
  isRecord(value) &&
  isInt(value.seat, 0, seats - 1) &&
  isOneOf(value.kind, LOG_KINDS) &&
  isInt(value.amount, 0, 1e7) &&
  typeof value.allIn === 'boolean' &&
  isOneOf(value.street, STREETS);

const isIntList = (value: unknown, length: number, max: number): value is number[] =>
  Array.isArray(value) && value.length === length && value.every((v) => isInt(v, 0, max));

const isSeatList = (value: unknown, seats: number): value is number[] =>
  Array.isArray(value) && value.length <= seats && value.every((v) => isInt(v, 0, seats - 1)) && new Set(value).size === value.length;

function isResult(value: unknown, seats: number): value is HandResult {
  if (!isRecord(value) || typeof value.showdown !== 'boolean') return false;
  if (!Array.isArray(value.pots) || value.pots.length > seats) return false;
  for (const pot of value.pots as unknown[]) {
    if (!isRecord(pot) || !isInt(pot.amount, 0, 1e7) || !isSeatList(pot.eligible, seats) || !isSeatList(pot.winners, seats)) return false;
    if ((pot.winners as number[]).some((w) => !(pot.eligible as number[]).includes(w))) return false;
  }
  if (!isIntList(value.payouts, seats, 1e7) || !isSeatList(value.shown, seats) || !isIntList(value.scores, seats, 0xffffff)) return false;
  const potSum = (value.pots as PotResult[]).reduce((sum, pot) => sum + pot.amount, 0);
  const paid = (value.payouts as number[]).reduce((sum, p) => sum + p, 0);
  return potSum === paid;
}

/** Thorough structural and consistency check of untrusted data. Never throws. */
export function isValidState(value: unknown): value is PokerState {
  try {
    return checkState(value);
  } catch {
    return false;
  }
}

function checkState(value: unknown): value is PokerState {
  if (!isRecord(value) || value.version !== 1) return false;
  if (!isUint32(value.seed) || !isUint32(value.rngState) || !isOneOf(value.difficulty, DIFFICULTIES)) return false;
  if (!isInt(value.opponents, MIN_OPPONENTS, MAX_OPPONENTS) || !isOneOf(value.phase, PHASES) || !isOneOf(value.street, STREETS)) return false;
  const n = (value.opponents as number) + 1;
  if (!Array.isArray(value.seats) || value.seats.length !== n || !value.seats.every(isSeat)) return false;
  if (!Array.isArray(value.stats) || value.stats.length !== n || !value.stats.every(isStats)) return false;
  if (!isInt(value.handNumber, 0, 1e6) || !isInt(value.button, 0, n - 1) || !isInt(value.toAct, -1, n - 1)) return false;
  const [sb, bb] = blindsForHand(Math.max(1, value.handNumber as number));
  if (value.sb !== sb || value.bb !== bb) return false;
  if (!isInt(value.currentBet, 0, 1e7) || !isInt(value.minRaise, 1, 1e7)) return false;
  if (!isCardList(value.board, { maxLength: 5 }) || !isCardList(value.deck, { maxLength: 52 })) return false;
  if (!Array.isArray(value.log) || value.log.length > 2000 || !value.log.every((e) => isLogEntry(e, n))) return false;
  if (value.result !== null && !isResult(value.result, n)) return false;
  const summary = value.summary;
  if (!isRecord(summary) || !isInt(summary.hands, 0, 1e6) || !isInt(summary.showdownsWon, 0, 1e6) || !isInt(summary.biggestPot, 0, 1e7)) return false;
  if ((summary.showdownsWon as number) > (summary.hands as number)) return false;
  if (!(value.ended === null || isOneOf(value.ended, ENDINGS))) return false;

  const state = value as unknown as PokerState;
  const seats = state.seats;
  // Chip conservation: every chip is in a stack or in the pot.
  if (seats.reduce((sum, s) => sum + s.stack + s.committed, 0) !== totalChips(state.opponents)) return false;
  // Every card exactly once.
  const holes = seats.map((s) => s.hole);
  if (!areDisjoint(state.board, state.deck, ...holes)) return false;
  const dealt = state.board.length + state.deck.length + holes.reduce((sum, h) => sum + h.length, 0);
  const maxBet = Math.max(...seats.map((s) => s.bet));

  switch (state.phase) {
    case 'setup':
      return (
        state.handNumber === 0 && dealt === 0 && state.toAct === -1 && state.ended === null && state.result === null &&
        state.log.length === 0 && seats.every((s) => s.stack === START_STACK && !s.inHand)
      );
    case 'betting': {
      if (state.handNumber < 1 || dealt !== 52 || state.ended !== null || state.result !== null) return false;
      if (state.board.length !== BOARD_SIZE[state.street]) return false;
      if (state.currentBet !== maxBet || state.minRaise < state.bb) return false;
      if (seats.filter(isLive).length < 2) return false;
      // The game always runs the computer seats until the player has to act.
      if (state.toAct !== 0 || !canAct(seats[0] as Seat)) return false;
      const me = seats[0] as Seat;
      return me.bet < state.currentBet || !me.acted;
    }
    case 'handOver':
    case 'finished': {
      if (seats.some((s) => s.bet !== 0 || s.committed !== 0) || state.toAct !== -1) return false;
      if (state.phase === 'finished' ? state.ended === null : state.ended !== null) return false;
      if (state.handNumber === 0) return state.phase === 'finished' && dealt === 0 && state.result === null;
      if (dealt !== 52) return false;
      if (state.phase === 'handOver' && state.result === null) return false;
      if (state.ended === 'busted' && (seats[0] as Seat).stack !== 0) return false;
      if (state.ended === 'champion' && seats.some((s, i) => i !== 0 && s.stack !== 0)) return false;
      return true;
    }
  }
}
