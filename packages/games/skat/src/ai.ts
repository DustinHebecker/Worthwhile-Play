/**
 * Computer players for Skat. Pure and deterministic per seed.
 *
 * Information hiding: every decision function receives only a `PlayerView` (`viewFor`), i.e. the seat's own
 * cards and what is public at the table (bids, declaration, played tricks, an open hand in ouvert games, and for
 * the declarer the two cards they put away). The hidden cards never reach the decision code.
 *
 * Levels:
 * - easy: hand-evaluation bidding with a looser, noisy limit; rule-based card play with occasional slips.
 * - normal: calibrated bidding; card play by seeded Monte Carlo over card distributions consistent with what
 *   the seat has seen (including revealed voids), each candidate card scored by rule-based roll-outs.
 * - hard: more samples, and an exact search of the last four tricks in every sampled distribution.
 */
import { SUITS, deck32, rankOf, suitOf, type Card, type Suit } from '@wp/cards';
import { createRng, type Rng } from '@wp/game-core';
import {
  BASE_VALUES,
  HUMAN,
  SEATS,
  applyAction,
  beats,
  biddingStatus,
  cardPoints,
  effectiveSuit,
  isTrump,
  legalCards,
  matadors,
  minimumValue,
  nextBid,
  nullValue,
  sumPoints,
  toAct,
  trickWinnerIndex,
  vorhand,
  type Action,
  type BidAction,
  type Contract,
  type DealState,
  type Difficulty,
  type GameKind,
  type PlayKind,
  type Seat,
  type SkatState
} from './rules';

/** Everything one seat may know. */
export interface PlayerView {
  seat: Seat;
  difficulty: Difficulty;
  dealer: Seat;
  hand: Card[];
  bids: BidAction[];
  skatChoice: 'pickup' | 'hand' | null;
  /** The two cards put away: known to the declarer only (else `null`). */
  discards: Card[] | null;
  contract: Contract | null;
  ramsch: boolean;
  tricks: Card[][];
  trick: Card[];
  /** The declarer's current hand when it lies open (ouvert) and this seat is a defender. */
  openHand: Card[] | null;
  /** Number of cards each seat holds. */
  handSizes: [number, number, number];
}

export function viewFor(d: DealState, seat: Seat, difficulty: Difficulty): PlayerView {
  const declarer = biddingStatus(d.bids, d.dealer)?.declarer ?? null;
  const open = d.contract?.ouvert === true && declarer !== null && declarer !== seat;
  return {
    seat,
    difficulty,
    dealer: d.dealer,
    hand: [...d.hands[seat]],
    bids: [...d.bids],
    skatChoice: d.skatChoice,
    discards: seat === declarer && d.skatChoice === 'pickup' ? [...d.discards] : null,
    contract: d.contract ? { ...d.contract } : null,
    ramsch: d.ramsch,
    tricks: d.tricks.map((t) => [...t]),
    trick: [...d.trick],
    openHand: open ? [...d.hands[declarer]] : null,
    handSizes: [d.hands[0].length, d.hands[1].length, d.hands[2].length]
  };
}

// ------------------------------------------------------------------ hand evaluation (bidding, Skat)

const JACK_WEIGHT: Readonly<Record<Suit, number>> = { C: 2.6, S: 2.3, H: 2.0, D: 1.8 };

/** Heuristic strength of a hand for a suit game or Grand (larger = stronger). */
export function handStrength(hand: readonly Card[], kind: Suit | 'grand'): number {
  let score = 0;
  let trumps = 0;
  for (const c of hand) {
    if (!isTrump(c, kind)) continue;
    trumps++;
    if (rankOf(c) === 'J') score += JACK_WEIGHT[suitOf(c)];
    else score += rankOf(c) === 'A' ? 1.5 : rankOf(c) === 'T' ? 1.2 : 0.9;
  }
  if (kind === 'grand') score += Math.max(0, trumps - 2) * 0.6;
  for (const s of SUITS) {
    if (kind !== 'grand' && s === kind) continue;
    const cards = hand.filter((c) => suitOf(c) === s && rankOf(c) !== 'J');
    const has = (r: string) => cards.some((c) => rankOf(c) === r);
    if (cards.length === 0) {
      score += kind === 'grand' ? 0.4 : trumps >= 4 ? 0.7 : 0.2;
      continue;
    }
    if (has('A')) score += kind === 'grand' ? 2.0 : 1.5;
    if (has('T')) score += has('A') ? (kind === 'grand' ? 1.5 : 1.0) : cards.length >= 3 ? 0.4 : cards.length === 2 ? 0.1 : -0.6;
    if (has('K') && (has('A') || has('T'))) score += 0.3;
    if (kind === 'grand' && has('A') && has('T')) score += Math.max(0, cards.length - 2) * 0.7;
    if (kind !== 'grand' && cards.length === 1 && !has('A')) score += trumps >= 5 ? 0.3 : 0;
  }
  return score;
}

const NULL_ORDER = ['7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
/** Number of suits in which the hand could be forced to take a trick in Null. */
export function nullDanger(hand: readonly Card[]): { danger: number; worstLength: number } {
  let danger = 0;
  let worstLength = 0;
  for (const s of SUITS) {
    const ranks = hand.filter((c) => suitOf(c) === s).map((c) => NULL_ORDER.indexOf(rankOf(c))).sort((a, b) => a - b);
    const safe = ranks.every((r, i) => r <= 2 * i);
    if (!safe) {
      danger++;
      worstLength = Math.max(worstLength, ranks.length);
    }
  }
  return { danger, worstLength };
}

/** Strength needed for a game with the Skat picked up, by level (the threshold for Hand is higher). */
const THRESHOLD: Readonly<Record<Difficulty, Readonly<Record<'suit' | 'grand', number>>>> = {
  easy: { suit: 8.0, grand: 10.0 },
  normal: { suit: 8.6, grand: 10.5 },
  hard: { suit: 8.5, grand: 10.3 }
};
const HAND_MARGIN = 2.6;

const threshold = (difficulty: Difficulty, kind: Suit | 'grand') => THRESHOLD[difficulty][kind === 'grand' ? 'grand' : 'suit'];

/** How well a ten-card hand suits a game kind, relative to the level's playing threshold. */
export function margin(hand: readonly Card[], kind: GameKind, difficulty: Difficulty, withSkat: boolean): number {
  if (kind === 'null') {
    const { danger, worstLength } = nullDanger(hand);
    if (danger === 0) return 1.5;
    if (withSkat && danger === 1 && worstLength <= 2) return 0.2;
    return -3 - danger;
  }
  return handStrength(hand, kind) - threshold(difficulty, kind) - (withSkat ? 0 : HAND_MARGIN);
}

/** The highest value this seat is willing to bid. */
export function biddingLimit(view: PlayerView, rng: Rng): number {
  let limit = 0;
  const noise = view.difficulty === 'easy' ? (rng.next() - 0.5) * 2.0 : 0;
  for (const kind of ['C', 'S', 'H', 'D', 'grand'] as const) {
    const m = margin(view.hand, kind, view.difficulty, true) + noise;
    if (m < 0) continue;
    const spitzen = matadors(view.hand, kind);
    // "Without" counts are fragile: a jack in the Skat breaks them; count at most one for safety unless easy.
    const count = spitzen.with || view.difficulty === 'easy' ? spitzen.count : Math.min(spitzen.count, 2);
    const hand = m >= HAND_MARGIN ? 1 : 0;
    limit = Math.max(limit, BASE_VALUES[kind] * (count + 1 + hand));
  }
  const n = margin(view.hand, 'null', view.difficulty, true);
  if (n >= 1.5) limit = Math.max(limit, nullValue(true, false));
  else if (n >= 0) limit = Math.max(limit, nullValue(false, false));
  return limit;
}

/** The kind and margin of the best declaration for this hand; with `minBid`, only games worth at least that. */
function bestDeclaration(cards10: readonly Card[], allCards: readonly Card[], difficulty: Difficulty, withSkat: boolean, minBid: number): { kind: GameKind; score: number } {
  let best: { kind: GameKind; score: number } | null = null;
  for (const kind of ['C', 'S', 'H', 'D', 'grand', 'null'] as const) {
    let score = margin(cards10, kind, difficulty, withSkat);
    const contract: Contract = { kind, hand: !withSkat, schneider: false, schwarz: false, ouvert: false };
    if (minimumValue(contract, allCards) < minBid) score -= 20; // would be overbid
    if (!best || score > best.score) best = { kind, score };
  }
  return best as { kind: GameKind; score: number };
}

// ------------------------------------------------------------------ card play: shared helpers

interface PlayInfo {
  seat: Seat;
  kind: PlayKind;
  declarer: Seat | null;
  hand: readonly Card[];
  trick: readonly Card[];
  leader: Seat;
  /** Cards this seat cannot see (not own, not played). */
  unseen: readonly Card[];
}

const sameTeam = (a: Seat, b: Seat, declarer: Seat | null) => a === b || (declarer !== null && a !== declarer && b !== declarer);
const lowest = (cards: readonly Card[], kind: PlayKind) =>
  [...cards].sort((a, b) => cardPoints(a) - cardPoints(b) || strengthKey(a, kind) - strengthKey(b, kind))[0] as Card;
const strengthKey = (c: Card, kind: PlayKind) => (isTrump(c, kind) ? 100 : 0) + rankStrength(c, kind);
const rankStrength = (c: Card, kind: PlayKind): number => {
  if (kind === 'null') return NULL_ORDER.indexOf(rankOf(c));
  if (rankOf(c) === 'J') return 10 + ['D', 'H', 'S', 'C'].indexOf(suitOf(c));
  return ['7', '8', '9', 'Q', 'K', 'T', 'A'].indexOf(rankOf(c));
};

/** `true` if no unseen card could beat `card` in a trick it currently wins. */
function isMaster(card: Card, info: PlayInfo): boolean {
  return !info.unseen.some((u) => beats(u, card, info.kind));
}

/** Rule-based card choice (used by easy and inside the Monte Carlo roll-outs). */
export function ruleCard(info: PlayInfo): Card {
  const legal = legalCards(info.hand, info.trick, info.kind);
  if (legal.length === 1) return legal[0] as Card;
  const { kind, trick, seat, declarer } = info;
  const byStrength = (cards: readonly Card[]) => [...cards].sort((a, b) => strengthKey(a, kind) - strengthKey(b, kind));

  if (kind === 'null') {
    const isDeclarer = seat === declarer;
    if (trick.length === 0) {
      // Lead the card with the fewest unseen cards below it (declarer) or the lowest card (defenders).
      const lowerCount = (c: Card) => info.unseen.filter((u) => suitOf(u) === suitOf(c) && rankStrength(u, kind) < rankStrength(c, kind)).length;
      if (isDeclarer) return [...legal].sort((a, b) => lowerCount(a) - lowerCount(b) || rankStrength(a, kind) - rankStrength(b, kind))[0] as Card;
      return byStrength(legal)[0] as Card;
    }
    const best = trick[trickWinnerIndex(trick, kind)] as Card;
    const under = legal.filter((c) => !beats(c, best, kind));
    if (isDeclarer) return (under.length ? byStrength(under).pop() : byStrength(legal).pop()) as Card;
    const winnerSeat = ((info.leader + trickWinnerIndex(trick, kind)) % 3) as Seat;
    const declarerStillToPlay = declarer !== null && !trick.some((_, i) => (info.leader + i) % 3 === declarer);
    if (winnerSeat === declarer) return (under.length ? byStrength(under).pop() : byStrength(legal)[0]) as Card;
    if (declarerStillToPlay) return byStrength(legal)[0] as Card;
    return byStrength(legal).pop() as Card;
  }

  if (kind === 'ramsch') {
    if (trick.length === 0) return byStrength(legal)[0] as Card;
    const best = trick[trickWinnerIndex(trick, kind)] as Card;
    const under = legal.filter((c) => !beats(c, best, kind));
    if (under.length) return [...under].sort((a, b) => cardPoints(b) - cardPoints(a) || strengthKey(b, kind) - strengthKey(a, kind))[0] as Card;
    return byStrength(legal).pop() as Card;
  }

  const isDeclarer = seat === declarer;
  const myTrumps = info.hand.filter((c) => isTrump(c, kind));
  if (trick.length === 0) {
    const trumpsOut = info.unseen.filter((c) => isTrump(c, kind)).length;
    if (isDeclarer && myTrumps.length > 0 && trumpsOut > 0) {
      const top = byStrength(myTrumps).pop() as Card;
      if (isMaster(top, info) || myTrumps.length >= 2) return isMaster(top, info) ? top : (byStrength(myTrumps)[0] as Card);
    }
    const masters = legal.filter((c) => !isTrump(c, kind) && isMaster(c, info));
    if (masters.length) return [...masters].sort((a, b) => cardPoints(b) - cardPoints(a))[0] as Card;
    const side = legal.filter((c) => !isTrump(c, kind));
    if (side.length) {
      // Defenders lead from long suits, the declarer from short ones; always a low card.
      const len = (c: Card) => side.filter((x) => suitOf(x) === suitOf(c)).length;
      const order = [...side].sort((a, b) => (isDeclarer ? len(a) - len(b) : len(b) - len(a)) || cardPoints(a) - cardPoints(b) || rankStrength(a, kind) - rankStrength(b, kind));
      return order[0] as Card;
    }
    return byStrength(legal)[0] as Card;
  }

  const winIdx = trickWinnerIndex(trick, kind);
  const best = trick[winIdx] as Card;
  const winnerSeat = ((info.leader + winIdx) % 3) as Seat;
  const last = trick.length === 2;
  const trickPoints = sumPoints(trick);
  if (sameTeam(winnerSeat, seat, declarer) && winnerSeat !== seat) {
    const safe = last || isMaster(best, info);
    if (safe) {
      // Add points ("schmieren"), but do not waste jacks or high trumps.
      const fat = legal.filter((c) => rankOf(c) !== 'J' && (!isTrump(c, kind) || cardPoints(c) >= 10));
      if (fat.length) return [...fat].sort((a, b) => cardPoints(b) - cardPoints(a) || strengthKey(a, kind) - strengthKey(b, kind))[0] as Card;
    }
    return lowest(legal, kind);
  }
  const winners = byStrength(legal.filter((c) => beats(c, best, kind)));
  if (winners.length) {
    if (last) {
      const cheapest = winners[0] as Card;
      if (trickPoints + cardPoints(cheapest) > 0 || rankOf(cheapest) !== 'J') return cheapest;
    } else {
      const master = winners.find((c) => isMaster(c, info));
      if (master) return master;
      if (trickPoints >= 10) return winners[winners.length - 1] as Card;
    }
  }
  return lowest(legal, kind);
}

// ------------------------------------------------------------------ Monte Carlo

/** A full deal from one seat's imagination: the seat's own cards plus a guess for every hidden card. */
interface World {
  hands: Card[][];
  skat: Card[];
}

/** Which effective suits each seat has shown to be void in (failed to follow). */
export function revealedVoids(view: PlayerView, kind: PlayKind): Set<string>[] {
  const voids = [new Set<string>(), new Set<string>(), new Set<string>()];
  const leaders = leadersOf(view, kind);
  const scan = (trick: readonly Card[], leader: Seat) => {
    const lead = trick[0];
    if (!lead) return;
    const led = effectiveSuit(lead, kind);
    trick.forEach((c, i) => {
      if (i > 0 && effectiveSuit(c, kind) !== led) voids[(leader + i) % 3]?.add(led);
    });
  };
  view.tricks.forEach((t, i) => scan(t, leaders[i] as Seat));
  scan(view.trick, leaders[leaders.length - 1] as Seat);
  return voids;
}

function leadersOf(view: PlayerView, kind: PlayKind): Seat[] {
  const leaders: Seat[] = [vorhand(view.dealer)];
  for (const trick of view.tricks) {
    const leader = leaders[leaders.length - 1] as Seat;
    leaders.push(((leader + trickWinnerIndex(trick, kind)) % 3) as Seat);
  }
  return leaders;
}

const declarerOfView = (view: PlayerView): Seat | null => biddingStatus(view.bids, view.dealer)?.declarer ?? null;

/** Samples hidden cards consistent with the view (hand sizes and revealed voids). `null` if it fails. */
export function sampleWorld(view: PlayerView, kind: PlayKind, rng: Rng): World | null {
  const declarer = declarerOfView(view);
  const seen = new Set<Card>([...view.hand, ...view.tricks.flat(), ...view.trick, ...(view.discards ?? []), ...(view.openHand ?? [])]);
  const unknown = deck32().filter((c) => !seen.has(c));
  const voids = revealedVoids(view, kind);
  const hands: Card[][] = [[], [], []];
  hands[view.seat] = [...view.hand];
  const capacity = [0, 0, 0];
  for (const s of SEATS) {
    if (s === view.seat) continue;
    if (view.openHand && s === declarer) hands[s] = [...view.openHand];
    else capacity[s] = view.handSizes[s];
  }
  // The Skat (or the cards put away) is hidden unless this seat is the declarer who put them away.
  const skatHidden = view.discards === null;
  let skatCapacity = skatHidden ? 2 : 0;
  if (unknown.length !== capacity[0]! + capacity[1]! + capacity[2]! + skatCapacity) return null;
  for (let attempt = 0; attempt < 20; attempt++) {
    const pool = rng.shuffle(unknown);
    const h: Card[][] = hands.map((x) => [...x]);
    const cap = [...capacity];
    skatCapacity = skatHidden ? 2 : 0;
    const skat: Card[] = [];
    // Most constrained cards first: those that only few seats can hold.
    const options = (c: Card) => SEATS.filter((s) => (cap[s] ?? 0) > 0 && !voids[s]?.has(effectiveSuit(c, kind)));
    pool.sort((a, b) => options(a).length - options(b).length);
    let ok = true;
    for (const c of pool) {
      const seats = options(c);
      const slots = seats.reduce<number>((n, s) => n + (cap[s] ?? 0), 0) + skatCapacity;
      if (slots === 0) {
        ok = false;
        break;
      }
      let r = rng.int(0, slots - 1);
      let placed = false;
      for (const s of seats) {
        if (r < (cap[s] ?? 0)) {
          h[s]?.push(c);
          cap[s] = (cap[s] ?? 0) - 1;
          placed = true;
          break;
        }
        r -= cap[s] ?? 0;
      }
      if (!placed) {
        skat.push(c);
        skatCapacity--;
      }
    }
    if (ok) return { hands: h, skat: skatHidden ? skat : [...(view.discards ?? [])] };
  }
  return null;
}

export interface SimState {
  hands: Card[][];
  trick: Card[];
  leader: Seat;
  points: [number, number, number];
  tricks: [number, number, number];
  played: Set<Card>;
  remainingTricks: number;
}

function simCard(sim: SimState, seat: Seat, kind: PlayKind, declarer: Seat | null): Card {
  const hand = sim.hands[seat] as Card[];
  const unseen: Card[] = [];
  for (const c of ALL_CARDS) if (!sim.played.has(c) && !hand.includes(c)) unseen.push(c);
  return ruleCard({ seat, kind, declarer, hand, trick: sim.trick, leader: sim.leader, unseen });
}
const ALL_CARDS = deck32();

function playCard(sim: SimState, seat: Seat, card: Card, kind: PlayKind): void {
  sim.hands[seat] = (sim.hands[seat] as Card[]).filter((c) => c !== card);
  sim.trick.push(card);
  sim.played.add(card);
  if (sim.trick.length === 3) {
    const winner = ((sim.leader + trickWinnerIndex(sim.trick, kind)) % 3) as Seat;
    sim.points[winner] += sumPoints(sim.trick);
    sim.tricks[winner] += 1;
    sim.trick = [];
    sim.leader = winner;
    sim.remainingTricks--;
  }
}

function utility(sim: SimState, view: PlayerView, kind: PlayKind, declarer: Seat | null, skatPoints: number): number {
  if (kind === 'ramsch') {
    const pts = sim.points.map((p, s) => p + (s === sim.leader ? skatPoints : 0));
    const mine = pts[view.seat] as number;
    return -(mine === Math.max(...pts) ? 1 : 0) - mine / 240;
  }
  const d = declarer as Seat;
  if (kind === 'null') {
    const u = sim.tricks[d] > 0 ? 0 : 1;
    return view.seat === d ? u : -u;
  }
  const p = sim.points[d] + skatPoints;
  const c = view.contract;
  const defenderTricks = sim.tricks[0] + sim.tricks[1] + sim.tricks[2] - sim.tricks[d];
  const won = p >= 61 && (!c?.schneider || p >= 90) && (!c?.schwarz || defenderTricks === 0);
  const u = (won ? 1 : 0) + 0.5 * (p / 120) + (p >= 90 ? 0.15 : 0);
  return view.seat === d ? u : -u;
}

/**
 * Exact alpha–beta search of the remaining tricks with all hands known (one sampled distribution):
 * the declarer's card points from here on (suit/Grand), or 1/0 for "the declarer stays clean" (Null).
 */
export function solve(sim: SimState, kind: PlayKind, declarer: Seat, nodeLimit = Infinity): number | null {
  const hands = sim.hands.map((h) => [...h]);
  const isNull = kind === 'null';
  let nodes = 0;
  const search = (trick: Card[], leader: Seat, remaining: number, declTook: boolean, alpha: number, beta: number): number => {
    if (++nodes > nodeLimit) return 0; // over budget: the caller discards the result
    if (isNull && declTook) return 0;
    if (remaining === 0) return isNull ? 1 : 0;
    const seat = ((leader + trick.length) % 3) as Seat;
    const maximize = seat === declarer;
    const hand = hands[seat] as Card[];
    let best = maximize ? -Infinity : Infinity;
    for (const card of legalCards(hand, trick, kind)) {
      const index = hand.indexOf(card);
      hand.splice(index, 1);
      let value: number;
      if (trick.length === 2) {
        const full = [...trick, card];
        const winner = ((leader + trickWinnerIndex(full, kind)) % 3) as Seat;
        const gained = winner === declarer && !isNull ? sumPoints(full) : 0;
        value = gained + search([], winner, remaining - 1, declTook || winner === declarer, alpha - gained, beta - gained);
      } else {
        value = search([...trick, card], leader, remaining, declTook, alpha, beta);
      }
      hand.splice(index, 0, card);
      if (maximize) {
        if (value > best) best = value;
        if (best > alpha) alpha = best;
      } else {
        if (value < best) best = value;
        if (best < beta) beta = best;
      }
      if (alpha >= beta) break;
    }
    return best;
  };
  const base = isNull ? 0 : sim.points[declarer];
  const value = base + search([...sim.trick], sim.leader, sim.remainingTricks, sim.tricks[declarer] > 0, -Infinity, Infinity);
  lastSolveNodes = Math.min(nodes, nodeLimit);
  return nodes > nodeLimit ? null : value;
}

const SAMPLES: Readonly<Record<Difficulty, number>> = { easy: 0, normal: 12, hard: 28 };
/**
 * Deterministic work budget per card decision, in units: one roll-out card play = 10 units (it runs the
 * rule-based player), one endgame-search node = 1 unit. It bounds the time of a computer turn on any device
 * (two computer cards per turn) without making play depend on the clock. Normal never reaches its budget.
 */
export const WORK_BUDGET: Readonly<Record<Difficulty, number>> = { easy: 0, normal: 45_000, hard: 45_000 };
const ROLLOUT_STEP = 10;
/** The most one endgame search may use; above it the sample is scored by a roll-out instead. */
const SOLVE_LIMIT = 6_000;
let lastSolveNodes = 0;
/** Work units used by the most recent `chooseCard` call (for tests and measurements). */
export let lastWork = 0;
const EXACT_TRICKS: Readonly<Record<Difficulty, number>> = { easy: 0, normal: 0, hard: 4 };

/** Builds the starting simulation of a sampled world from the view's public history. */
function simFrom(view: PlayerView, world: World, kind: PlayKind, declarer: Seat | null): SimState {
  const leaders = leadersOf(view, kind);
  const points: [number, number, number] = [0, 0, 0];
  const tricks: [number, number, number] = [0, 0, 0];
  view.tricks.forEach((t, i) => {
    const w = (((leaders[i] as Seat) + trickWinnerIndex(t, kind)) % 3) as Seat;
    points[w] += sumPoints(t);
    tricks[w] += 1;
  });
  void declarer;
  return {
    hands: world.hands.map((h) => [...h]),
    trick: [...view.trick],
    leader: leaders[leaders.length - 1] as Seat,
    points,
    tricks,
    played: new Set([...view.tricks.flat(), ...view.trick]),
    remainingTricks: 10 - view.tricks.length
  };
}

/** Whether a sampled distribution fits the declaration: a suit declarer holds 5+ trumps, a Grand declarer 2+ jacks or aces-rich cards. */
function plausible(view: PlayerView, world: World, kind: PlayKind, declarer: Seat | null): boolean {
  if (declarer === null || declarer === view.seat || kind === 'null' || kind === 'ramsch') return true;
  const leaders = leadersOf(view, kind);
  const played: Card[] = [];
  view.tricks.forEach((t, i) => played.push(t[(declarer - (leaders[i] as Seat) + 3) % 3] as Card));
  const current = leaders[leaders.length - 1] as Seat;
  const offset = (declarer - current + 3) % 3;
  if (offset < view.trick.length) played.push(view.trick[offset] as Card);
  const cards = [...(world.hands[declarer] ?? []), ...played, ...(view.skatChoice === 'hand' ? world.skat : [])];
  if (kind === 'grand') return cards.filter((c) => rankOf(c) === 'J').length + cards.filter((c) => rankOf(c) === 'A').length >= 4;
  return cards.filter((c) => isTrump(c, kind)).length >= 5;
}

/** Card choice by Monte Carlo sampling (normal/hard) or by rules (easy). Uses only the view. */
export function chooseCard(view: PlayerView, seed: number): Card {
  const kind: PlayKind = view.ramsch ? 'ramsch' : ((view.contract?.kind ?? 'grand') as PlayKind);
  const declarer = declarerOfView(view);
  const legal = legalCards(view.hand, view.trick, kind);
  if (legal.length === 1) return legal[0] as Card;
  const rng = createRng(seed);
  const seen = new Set<Card>([...view.hand, ...view.tricks.flat(), ...view.trick, ...(view.discards ?? [])]);
  const leaders = leadersOf(view, kind);
  const info: PlayInfo = {
    seat: view.seat,
    kind,
    declarer,
    hand: view.hand,
    trick: view.trick,
    leader: leaders[leaders.length - 1] as Seat,
    unseen: deck32().filter((c) => !seen.has(c))
  };
  const samples = SAMPLES[view.difficulty];
  if (samples === 0) {
    // Easy: rules, with an occasional slip to a random legal card.
    return rng.next() < 0.15 ? rng.pick(legal) : ruleCard(info);
  }
  const totals = new Map<Card, number>(legal.map((c) => [c, 0]));
  const exact = view.hand.length <= EXACT_TRICKS[view.difficulty] && kind !== 'ramsch' && declarer !== null;
  const budget = WORK_BUDGET[view.difficulty];
  let work = 0;
  let used = 0;
  // Every sample scores every candidate, so a sample only starts if roll-outs for all candidates still fit
  // (an upper bound: every card still in a hand is played). An endgame search only gets what is left above that
  // reservation, so the total never exceeds the budget.
  const perCandidate = view.handSizes.reduce((a, b) => a + b, 0) * ROLLOUT_STEP;
  for (let i = 0; i < samples && work + legal.length * perCandidate <= budget; i++) {
    let world = sampleWorld(view, kind, rng);
    // Hard defenders also use what the bidding revealed: the declarer rarely plays a game without trumps.
    for (let retry = 0; view.difficulty === 'hard' && world && retry < 6 && !plausible(view, world, kind, declarer); retry++) {
      world = sampleWorld(view, kind, rng);
    }
    if (!world) continue;
    used++;
    const skatPoints = sumPoints(world.skat);
    for (const [index, card] of legal.entries()) {
      const sim = simFrom(view, world, kind, declarer);
      playCard(sim, view.seat, card, kind);
      let u: number;
      const room = Math.min(SOLVE_LIMIT, budget - work - (legal.length - index) * perCandidate);
      const result = exact && room > 0 ? solve(sim, kind, declarer as Seat, room) : null;
      if (exact) work += lastSolveNodes;
      if (result !== null) {
        if (kind === 'null') u = view.seat === declarer ? result : -result;
        else {
          const p = result + skatPoints;
          const c = view.contract;
          const won = p >= 61 && (!c?.schneider || p >= 90);
          const v = (won ? 1 : 0) + 0.5 * (p / 120) + (p >= 90 ? 0.15 : 0);
          u = view.seat === declarer ? v : -v;
        }
      } else {
        let guard = 40;
        while (sim.remainingTricks > 0 && guard-- > 0) {
          if (kind === 'null' && declarer !== null && sim.tricks[declarer] > 0) break;
          work += ROLLOUT_STEP;
          const seat = ((sim.leader + sim.trick.length) % 3) as Seat;
          playCard(sim, seat, simCard(sim, seat, kind, declarer), kind);
        }
        u = utility(sim, view, kind, declarer, skatPoints);
      }
      totals.set(card, (totals.get(card) ?? 0) + u);
    }
  }
  lastWork = work;
  if (used === 0) return ruleCard(info);
  // Ties go to the rule-based choice, then to the lowest-value card.
  const preferred = ruleCard(info);
  let bestCard = preferred;
  let bestScore = totals.get(preferred) ?? -Infinity;
  for (const card of legal) {
    const score = totals.get(card) ?? -Infinity;
    if (score > bestScore + 1e-9) {
      bestCard = card;
      bestScore = score;
    }
  }
  return bestCard;
}

// ------------------------------------------------------------------ decisions

const PAIRS: readonly [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) out.push([i, j]);
  return out;
})();

/** Chooses the two cards to put away after picking up the Skat. */
export function chooseDiscard(view: PlayerView, bid: number): [Card, Card] {
  const hand = view.hand;
  let best: { pair: [Card, Card]; score: number } | null = null;
  for (const [i, j] of PAIRS) {
    const a = hand[i] as Card;
    const b = hand[j] as Card;
    const rest = hand.filter((_, k) => k !== i && k !== j);
    const decl = bestDeclaration(rest, hand, view.difficulty, true, bid);
    // Points put away count for the declarer (not in Null, where they are irrelevant).
    const bonus = decl.kind === 'null' ? 0 : (cardPoints(a) + cardPoints(b)) * 0.04 - (rankOf(a) === 'J' || rankOf(b) === 'J' ? 3 : 0) -
      (isTrump(a, decl.kind) || isTrump(b, decl.kind) ? 1.5 : 0);
    const score = decl.score + bonus;
    if (!best || score > best.score) best = { pair: [a, b], score };
  }
  return (best as { pair: [Card, Card] }).pair;
}

/** Chooses the declaration once the hand is final. Computers do not announce Schneider, Schwarz or ouvert. */
export function chooseContract(view: PlayerView, bid: number): Contract {
  const hand = view.skatChoice === 'hand';
  const all = [...view.hand, ...(view.discards ?? [])];
  const decl = bestDeclaration(view.hand, all, view.difficulty, !hand, bid);
  return { kind: decl.kind, hand, schneider: false, schwarz: false, ouvert: false };
}

/** The computer's next action for this view (bidding, Skat, discard, declaration or a card). */
export function chooseAction(view: PlayerView, seed: number): Action {
  const rng = createRng(seed);
  const status = biddingStatus(view.bids, view.dealer);
  if (!status) return { type: 'pass' };
  if (!status.done) {
    const limit = biddingLimit(view, rng);
    if (status.expect === 'answer') return status.high <= limit ? { type: 'yes' } : { type: 'pass' };
    if (status.expect === 'open') return limit >= 18 ? { type: 'bid', value: 18 } : { type: 'pass' };
    const value = nextBid(status.high);
    return value !== undefined && value <= limit ? { type: 'bid', value } : { type: 'pass' };
  }
  if (!view.ramsch && !view.contract) {
    if (view.skatChoice === null) {
      const hand = bestDeclaration(view.hand, view.hand, view.difficulty, false, status.high);
      return hand.score >= 0 && view.difficulty !== 'easy' ? { type: 'hand' } : { type: 'pickup' };
    }
    if (view.skatChoice === 'pickup' && view.hand.length === 12) return { type: 'discard', cards: chooseDiscard(view, status.high) };
    return { type: 'declare', contract: chooseContract(view, status.high) };
  }
  return { type: 'play', card: chooseCard(view, seed) };
}

/** Deterministic per-decision seed from public counters (never from hidden cards). */
export function decisionSeed(state: SkatState, seat: Seat): number {
  const d = state.deal;
  const steps = d ? d.bids.length * 7 + d.tricks.length * 3 + d.trick.length + (d.skatChoice ? 50 : 0) + (d.contract ? 100 : 0) : 0;
  let h = (state.seed ^ 0x9e3779b9) >>> 0;
  for (const n of [state.list.length, steps, seat]) {
    h = Math.imul(h ^ n, 0x85ebca6b) >>> 0;
    h ^= h >>> 13;
  }
  return h >>> 0;
}

export interface ComputerMove {
  seat: Seat;
  action: Action;
}

/**
 * Lets the computer seats act until the person is to act (or the game is over). `levels` gives the level per
 * seat (default: the state's difficulty for seats 1 and 2; seat 0 is the person unless a level is given).
 */
export function advance(state: SkatState, levels: Partial<Record<Seat, Difficulty>> = { 1: state.difficulty, 2: state.difficulty }): { state: SkatState; moves: ComputerMove[] } {
  let current = state;
  const moves: ComputerMove[] = [];
  for (let guard = 0; guard < 200; guard++) {
    const d = current.deal;
    if (current.stage !== 'play' || !d || d.result) break;
    const seat = toAct(d);
    if (seat === null) break;
    const level = levels[seat];
    if (level === undefined) break;
    const action = chooseAction(viewFor(d, seat, level), decisionSeed(current, seat));
    const next = applyAction(current, seat, action);
    if (!next) break; // never happens for legal AI moves; guards against an endless loop
    moves.push({ seat, action });
    current = next;
  }
  return { state: current, moves };
}

export const COMPUTER_SEATS: readonly Seat[] = SEATS.filter((s) => s !== HUMAN);
