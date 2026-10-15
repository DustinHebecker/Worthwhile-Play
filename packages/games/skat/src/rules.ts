/**
 * Skat rules after the International Skat Order (ISkO, Deutscher Skatverband / ISPA), written in our own words.
 * Pure and DOM-free: cards, trumps and trick taking, bidding, game declaration, game value, scoring and the
 * series list ("Liste"). All state is plain JSON.
 *
 * Seats are fixed table positions: 0 = the person, 1 and 2 = the computer players, in playing order
 * (clockwise: 0 → 1 → 2 → 0). The roles move with the dealer: Vorhand (forehand) sits after the dealer,
 * then Mittelhand (middlehand), and the dealer is Hinterhand (rearhand).
 *
 * Rules decisions (ISkO topics: Reizen, Spielarten, Spielwert, Überreizen, Abrechnung):
 * - Bidding: Mittelhand says to Vorhand, the survivor hears Hinterhand; if both pass without a bid, Vorhand may
 *   still play at 18. Bid values are exactly the reachable game values (18 … 264, incl. the Null values).
 * - All pass: the game is thrown in ("eingepasst"; ISkO default). It is recorded in the list, counts as a game
 *   of the series and the deal passes on. Ramsch is an optional house rule (see `finishedResult`).
 * - Announcements: Schneider/Schwarz only in Hand games; Schwarz implies Schneider; ouvert in suit/Grand games
 *   only as Hand with Schwarz announced; Null ouvert with or without Hand.
 * - Game value: base (♣12 ♠11 ♥10 ♦9, Grand 24) × (matadors + 1 game + Hand + Schneider + Schneider announced +
 *   Schwarz + Schwarz announced + ouvert); announced levels count even if not made; Schneider/Schwarz count for
 *   either side (declarer ≤ 30 points / no trick as well). Null: 23 / Hand 35 / ouvert 46 / ouvert Hand 59.
 * - Matadors are counted over the declarer's twelve cards (incl. the Skat, also in Hand games).
 * - Overbid (game value below the bid): lost; its value is the smallest multiple of the base value that reaches
 *   the bid (applied to Null with its fixed value as the base, e.g. Null at a bid of 24 → 46).
 * - Lost games count double. Under the current ISkO this applies to all games, Hand games included (the old rule
 *   "lost Hand games count single" is no longer part of the ISkO).
 * - Null ends as soon as the declarer takes a trick; all other games are played to the tenth trick.
 * - Scoring: `simple` (±value, lost ×2) by default, Seeger–Fabian as an option (see `entryScores`).
 */
import {
  SUITS,
  areDisjoint,
  deck32,
  deal as dealPackets,
  isCard,
  isCardList,
  rankOf,
  shuffleWithState,
  suitOf,
  type Card,
  type Suit
} from '@wp/cards';
import { isInt, isOneOf, isRecord, isUint32, normalizeSeed } from '@wp/game-core';

export type Seat = 0 | 1 | 2;
export const SEATS: readonly Seat[] = [0, 1, 2];
export const HUMAN: Seat = 0;

export const DIFFICULTIES = ['easy', 'normal', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'normal';

/** Games in a series; 0 = open-ended (until the person ends it). */
export const SERIES_LENGTHS = [3, 6, 9, 12, 0] as const;
export type SeriesLength = (typeof SERIES_LENGTHS)[number];
export const SCORINGS = ['simple', 'seeger'] as const;
export type Scoring = (typeof SCORINGS)[number];

export interface Options {
  series: SeriesLength;
  scoring: Scoring;
  /** House rule: if all three pass, play Ramsch instead of throwing the game in (ISkO default: thrown in). */
  ramsch: boolean;
}
export const DEFAULT_OPTIONS: Options = { series: 6, scoring: 'simple', ramsch: false };

// ------------------------------------------------------------------ cards

export type GameKind = Suit | 'grand' | 'null';
export type PlayKind = GameKind | 'ramsch';
export const GAME_KINDS: readonly GameKind[] = ['C', 'S', 'H', 'D', 'grand', 'null'];

/** Card points (Augen): ace 11, ten 10, king 4, queen/Ober 3, jack/Unter 2, 9 8 7 nothing. 120 in the deck. */
export function cardPoints(card: Card): number {
  switch (rankOf(card)) {
    case 'A':
      return 11;
    case 'T':
      return 10;
    case 'K':
      return 4;
    case 'Q':
      return 3;
    case 'J':
      return 2;
    default:
      return 0;
  }
}
export const sumPoints = (cards: readonly Card[]): number => cards.reduce((sum, c) => sum + cardPoints(c), 0);

/** `'T'` (trump) or the card's suit: the suit that must be followed. In Null there are no trumps. */
export type EffectiveSuit = Suit | 'T';
export function effectiveSuit(card: Card, kind: PlayKind): EffectiveSuit {
  if (kind === 'null') return suitOf(card);
  if (rankOf(card) === 'J') return 'T';
  if (kind !== 'grand' && kind !== 'ramsch' && suitOf(card) === kind) return 'T';
  return suitOf(card);
}
export const isTrump = (card: Card, kind: PlayKind): boolean => effectiveSuit(card, kind) === 'T';

const PLAIN_ORDER = ['7', '8', '9', 'Q', 'K', 'T', 'A'] as const; // low → high in suit games (jacks are trumps)
const NULL_ORDER = ['7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const; // low → high in Null
const JACK_ORDER: readonly Suit[] = ['D', 'H', 'S', 'C']; // low → high

/** Strength of a card within its effective suit (higher wins). Jacks are above all other trumps. */
export function cardStrength(card: Card, kind: PlayKind): number {
  const rank = rankOf(card);
  if (kind === 'null') return NULL_ORDER.indexOf(rank as (typeof NULL_ORDER)[number]);
  if (rank === 'J') return 10 + JACK_ORDER.indexOf(suitOf(card));
  return PLAIN_ORDER.indexOf(rank as (typeof PLAIN_ORDER)[number]);
}

/** `true` if `card` beats `best` (the card currently winning a trick whose lead suit is `led`). */
export function beats(card: Card, best: Card, kind: PlayKind): boolean {
  const s = effectiveSuit(card, kind);
  const b = effectiveSuit(best, kind);
  if (s === b) return cardStrength(card, kind) > cardStrength(best, kind);
  return s === 'T';
}

/** Index (0–2, in playing order) of the card that wins a complete or partial trick. */
export function trickWinnerIndex(trick: readonly Card[], kind: PlayKind): number {
  let best = 0;
  for (let i = 1; i < trick.length; i++) if (beats(trick[i] as Card, trick[best] as Card, kind)) best = i;
  return best;
}

/** Cards that may be played: the lead's effective suit must be followed if possible, else any card. */
export function legalCards(hand: readonly Card[], trick: readonly Card[], kind: PlayKind): Card[] {
  const lead = trick[0];
  if (lead === undefined) return [...hand];
  const led = effectiveSuit(lead, kind);
  const follow = hand.filter((c) => effectiveSuit(c, kind) === led);
  return follow.length > 0 ? follow : [...hand];
}

/** Display order of a hand: trumps first (highest first), then the suits in Skat order. */
export function sortHand(cards: readonly Card[], kind: PlayKind = 'grand'): Card[] {
  const key = (c: Card) => {
    const eff = effectiveSuit(c, kind);
    const group = eff === 'T' ? -1 : SUITS.indexOf(eff);
    return { group, strength: cardStrength(c, kind) };
  };
  return [...cards].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    return ka.group - kb.group || kb.strength - ka.strength;
  });
}

// ------------------------------------------------------------------ game values

export const BASE_VALUES: Readonly<Record<Suit | 'grand', number>> = { C: 12, S: 11, H: 10, D: 9, grand: 24 };
/** Null: fixed values (Null, Null Hand, Null ouvert, Null ouvert Hand). */
export function nullValue(hand: boolean, ouvert: boolean): number {
  if (ouvert) return hand ? 59 : 46;
  return hand ? 35 : 23;
}

/**
 * All values a bid may have, ascending: every reachable game value (base value × 2…18 for suit games,
 * 24 × 2…11 for Grand, and the four Null values), starting at 18.
 */
export const BID_VALUES: readonly number[] = (() => {
  const set = new Set<number>([23, 35, 46, 59]);
  for (const base of [9, 10, 11, 12]) for (let level = 2; level <= 18; level++) set.add(base * level);
  for (let level = 2; level <= 11; level++) set.add(24 * level);
  return [...set].filter((v) => v >= 18).sort((a, b) => a - b);
})();
export const isBidValue = (value: unknown): value is number => typeof value === 'number' && BID_VALUES.includes(value);
/** The smallest bid above `high` (or `undefined` above 264). */
export const nextBid = (high: number): number | undefined => BID_VALUES.find((v) => v > high);

/** Trump sequence for counting matadors, highest first: the four jacks, then A 10 K Q 9 8 7 of the trump suit. */
export function matadorSequence(kind: Suit | 'grand'): Card[] {
  const jacks: Card[] = ['JC', 'JS', 'JH', 'JD'];
  if (kind === 'grand') return jacks;
  return [...jacks, ...(['A', 'T', 'K', 'Q', '9', '8', '7'] as const).map((r) => `${r}${kind}` as Card)];
}

/**
 * Matadors ("Spitzen"): the unbroken run of top trumps the declarer holds ("with n") or lacks ("without n"),
 * counted over all twelve cards of the declarer (ten in hand plus the Skat, also in Hand games).
 */
export function matadors(cards: readonly Card[], kind: Suit | 'grand'): { with: boolean; count: number } {
  const seq = matadorSequence(kind);
  const held = new Set(cards);
  const top = held.has(seq[0] as Card);
  let count = 0;
  while (count < seq.length && held.has(seq[count] as Card) === top) count++;
  return { with: top, count };
}

export interface Contract {
  kind: GameKind;
  /** Played without picking up the Skat. */
  hand: boolean;
  /** Announced Schneider (Hand suit/Grand games only). */
  schneider: boolean;
  /** Announced Schwarz (Hand only; implies Schneider announced). */
  schwarz: boolean;
  /** Open game: Null ouvert (with or without Hand) or, for suit/Grand, Hand with Schwarz announced. */
  ouvert: boolean;
}

/** ISkO constraints on announcements. */
export function isLegalContract(c: Contract): boolean {
  if (!isOneOf(c.kind, GAME_KINDS)) return false;
  if (c.kind === 'null') return !c.schneider && !c.schwarz;
  if (!c.hand && (c.schneider || c.schwarz || c.ouvert)) return false;
  if (c.schwarz && !c.schneider) return false;
  if (c.ouvert && !c.schwarz) return false;
  return true;
}

/** Smallest multiple of `base` that is at least `bid`. */
export const roundUpTo = (base: number, bid: number): number => Math.ceil(bid / base) * base;

export interface GameFacts {
  contract: Contract;
  bid: number;
  /** All twelve cards that belonged to the declarer (hand at declaration + Skat or discards). */
  declarerCards: readonly Card[];
  /** Card points of the declarer including the Skat (or the two cards put away). */
  declarerPoints: number;
  declarerTricks: number;
  defenderTricks: number;
}

export interface Valuation {
  won: boolean;
  overbid: boolean;
  /** Game value used for scoring (after rounding up an overbid game). */
  value: number;
  base: number;
  /** Multiplier ("Stufen"): matadors + game + Hand + Schneider … ; 0 for Null. */
  multiplier: number;
  matadors: { with: boolean; count: number } | null;
  schneider: boolean;
  schwarz: boolean;
  /** Points for the declarer: +value if won, −2 × value if lost (ISkO 2002+: every lost game counts double). */
  score: number;
}

/** Computes outcome and value of a played game according to the ISkO. */
export function valueGame(f: GameFacts): Valuation {
  const { contract: c, bid } = f;
  if (c.kind === 'null') {
    const base = nullValue(c.hand, c.ouvert);
    const overbid = bid > base;
    const won = f.declarerTricks === 0 && !overbid;
    const value = overbid ? roundUpTo(base, bid) : base;
    return { won, overbid, value, base, multiplier: 0, matadors: null, schneider: false, schwarz: false, score: won ? value : -2 * value };
  }
  const base = BASE_VALUES[c.kind];
  const m = matadors(f.declarerCards, c.kind);
  const schneider = f.declarerPoints >= 90 || f.declarerPoints <= 30;
  const schwarz = f.defenderTricks === 0 || f.declarerTricks === 0;
  const multiplier =
    m.count +
    1 +
    (c.hand ? 1 : 0) +
    (schneider || c.schneider ? 1 : 0) +
    (c.schneider ? 1 : 0) +
    (schwarz || c.schwarz ? 1 : 0) +
    (c.schwarz ? 1 : 0) +
    (c.ouvert ? 1 : 0);
  const reached = base * multiplier;
  const overbid = reached < bid;
  const made = f.declarerPoints >= 61 && (!c.schneider || f.declarerPoints >= 90) && (!c.schwarz || f.defenderTricks === 0);
  const won = made && !overbid;
  const value = overbid ? roundUpTo(base, bid) : reached;
  return { won, overbid, value, base, multiplier, matadors: m, schneider, schwarz, score: won ? value : -2 * value };
}

/**
 * The value a declaration is worth if it is won without extra Schneider/Schwarz (for the declaration panel):
 * `null` for Null, otherwise base × (matadors + 1 + Hand + announcements).
 */
export function minimumValue(contract: Contract, declarerCards: readonly Card[]): number {
  if (contract.kind === 'null') return nullValue(contract.hand, contract.ouvert);
  const m = matadors(declarerCards, contract.kind);
  const c = contract;
  const levels = m.count + 1 + (c.hand ? 1 : 0) + (c.schneider ? 2 : 0) + (c.schwarz ? 2 : 0) + (c.ouvert ? 1 : 0);
  return BASE_VALUES[contract.kind] * levels;
}

// ------------------------------------------------------------------ bidding

/** A bidding step: a bid value (said), `'yes'` (held) or `'pass'`. The speaker follows from the history. */
export type BidAction = number | 'yes' | 'pass';

export const vorhand = (dealer: Seat): Seat => ((dealer + 1) % 3) as Seat;
export const mittelhand = (dealer: Seat): Seat => ((dealer + 2) % 3) as Seat;
export const hinterhand = (dealer: Seat): Seat => dealer;
export type Role = 'vorhand' | 'mittelhand' | 'hinterhand';
export function roleOf(seat: Seat, dealer: Seat): Role {
  if (seat === vorhand(dealer)) return 'vorhand';
  if (seat === mittelhand(dealer)) return 'mittelhand';
  return 'hinterhand';
}

export interface BiddingStatus {
  done: boolean;
  /** Who acts next (null when done). */
  next: Seat | null;
  /**
   * `bid`: say a higher value or pass. `answer`: hold the value ("yes") or pass.
   * `open`: everybody else passed without a bid; Vorhand may play at 18 or pass as well.
   */
  expect: 'bid' | 'answer' | 'open' | null;
  /** Highest value said and not passed on (0 = none yet). */
  high: number;
  declarer: Seat | null;
  passed: Seat[];
  /** Who said each step of the history. */
  speakers: Seat[];
}

/**
 * Replays the bidding (ISkO): Mittelhand says values to Vorhand, who holds ("yes") or passes; the survivor
 * then hears Hinterhand. The last one in is the declarer at the highest value. If Mittelhand and Hinterhand
 * pass without a bid, Vorhand may still play (at 18) or pass, too. Returns `null` for an impossible history.
 */
export function biddingStatus(history: readonly BidAction[], dealer: Seat): BiddingStatus | null {
  const V = vorhand(dealer);
  const M = mittelhand(dealer);
  const H = hinterhand(dealer);
  let stage = 1;
  let sayer: Seat = M;
  let hearer: Seat = V;
  let high = 0;
  let expect: 'bid' | 'answer' | 'open' = 'bid';
  let declarer: Seat | null = null;
  let done = false;
  const passed: Seat[] = [];
  const speakers: Seat[] = [];
  for (const action of history) {
    if (done) return null;
    if (expect === 'bid') {
      speakers.push(sayer);
      if (action === 'pass') {
        passed.push(sayer);
        if (stage === 1) {
          stage = 2;
          sayer = H;
        } else if (high === 0) {
          expect = 'open'; // only Vorhand can be left here without any bid
        } else {
          done = true;
          declarer = hearer;
        }
      } else if (typeof action === 'number' && isBidValue(action) && action > high) {
        high = action;
        expect = 'answer';
      } else return null;
    } else if (expect === 'answer') {
      speakers.push(hearer);
      if (action === 'yes') expect = 'bid';
      else if (action === 'pass') {
        passed.push(hearer);
        if (stage === 1) {
          stage = 2;
          hearer = sayer;
          sayer = H;
          expect = 'bid';
        } else {
          done = true;
          declarer = sayer;
        }
      } else return null;
    } else {
      speakers.push(V);
      if (action === 'pass') {
        passed.push(V);
        done = true;
      } else if (action === 18) {
        high = 18;
        done = true;
        declarer = V;
      } else return null;
    }
  }
  const next: Seat | null = done ? null : expect === 'answer' ? hearer : expect === 'open' ? V : sayer;
  return { done, next, expect: done ? null : expect, high, declarer, passed, speakers };
}

// ------------------------------------------------------------------ a single game (deal)

export type GameResult =
  | { type: 'passed' }
  | {
      type: 'game';
      declarer: Seat;
      contract: Contract;
      bid: number;
      declarerPoints: number;
      declarerTricks: number;
      valuation: Valuation;
    }
  | { type: 'ramsch'; points: [number, number, number]; tricks: [number, number, number]; scores: [number, number, number] };

export interface DealState {
  dealer: Seat;
  /** Current hands by seat. */
  hands: [Card[], Card[], Card[]];
  /** The Skat: two cards until the declarer picks it up (stays here in Hand games and Ramsch). */
  skat: Card[];
  bids: BidAction[];
  /** `null` until the declarer chooses: pick up the Skat or play Hand. */
  skatChoice: 'pickup' | 'hand' | null;
  /** The two cards the declarer put away after picking up the Skat. */
  discards: Card[];
  contract: Contract | null;
  /** True when all passed and Ramsch is played. */
  ramsch: boolean;
  /** Completed tricks, three cards each, in playing order from their leader. */
  tricks: Card[][];
  /** The trick in progress (0–2 cards). */
  trick: Card[];
  result: GameResult | null;
}

export type DealPhase = 'bidding' | 'skat' | 'discard' | 'declare' | 'play' | 'done';

export function dealPhase(d: DealState): DealPhase {
  if (d.result) return 'done';
  const status = biddingStatus(d.bids, d.dealer);
  if (!status?.done) return 'bidding';
  if (d.ramsch) return 'play';
  if (d.contract) return 'play';
  if (d.skatChoice === null) return 'skat';
  if (d.skatChoice === 'pickup' && d.discards.length < 2) return 'discard';
  return 'declare';
}

export const declarerOf = (d: DealState): Seat | null => biddingStatus(d.bids, d.dealer)?.declarer ?? null;
export const highBid = (d: DealState): number => biddingStatus(d.bids, d.dealer)?.high ?? 0;

/** The kind of play (trumps) of the running game, or `null` before it is declared. */
export const playKind = (d: DealState): PlayKind | null => (d.ramsch ? 'ramsch' : (d.contract?.kind ?? null));

/** Seat that leads each completed trick and the current one (Vorhand leads the first trick). */
export function trickLeaders(d: DealState): Seat[] {
  const kind = playKind(d) ?? 'grand';
  const leaders: Seat[] = [vorhand(d.dealer)];
  for (const trick of d.tricks) {
    const leader = leaders[leaders.length - 1] as Seat;
    leaders.push(((leader + trickWinnerIndex(trick, kind)) % 3) as Seat);
  }
  return leaders;
}

/** Winner seat of every completed trick. */
export function trickWinners(d: DealState): Seat[] {
  return trickLeaders(d).slice(1);
}

/** Whose turn it is in the current phase, or `null` when the game is over. */
export function toAct(d: DealState): Seat | null {
  const phase = dealPhase(d);
  if (phase === 'done') return null;
  if (phase === 'bidding') return biddingStatus(d.bids, d.dealer)?.next ?? null;
  if (phase !== 'play') return declarerOf(d);
  const leaders = trickLeaders(d);
  return (((leaders[leaders.length - 1] as Seat) + d.trick.length) % 3) as Seat;
}

/** All twelve cards that belong to the declarer: hand, played cards and Skat or discards. */
export function declarerCards(d: DealState, declarer: Seat): Card[] {
  const leaders = trickLeaders(d);
  const played: Card[] = [];
  d.tricks.forEach((trick, i) => {
    const offset = (declarer - (leaders[i] as Seat) + 3) % 3;
    played.push(trick[offset] as Card);
  });
  const leader = leaders[leaders.length - 1] as Seat;
  const offset = (declarer - leader + 3) % 3;
  if (offset < d.trick.length) played.push(d.trick[offset] as Card);
  return [...d.hands[declarer], ...played, ...(d.skatChoice === 'pickup' ? d.discards : d.skat)];
}

export function newDeal(dealer: Seat, rngState: number): { deal: DealState; rng: number } {
  const { cards, rngState: rng } = shuffleWithState(deck32(), rngState);
  const { hands, rest } = dealPackets(cards, [10, 10, 10]);
  const byRole = hands as [Card[], Card[], Card[]];
  const seated: [Card[], Card[], Card[]] = [[], [], []];
  // First packet to Vorhand, then Mittelhand, then Hinterhand.
  [vorhand(dealer), mittelhand(dealer), hinterhand(dealer)].forEach((seat, i) => (seated[seat] = byRole[i] as Card[]));
  return {
    deal: { dealer, hands: seated, skat: rest, bids: [], skatChoice: null, discards: [], contract: null, ramsch: false, tricks: [], trick: [], result: null },
    rng
  };
}

export type Action =
  | { type: 'bid'; value: number }
  | { type: 'yes' }
  | { type: 'pass' }
  | { type: 'pickup' }
  | { type: 'hand' }
  | { type: 'discard'; cards: [Card, Card] }
  | { type: 'declare'; contract: Contract }
  | { type: 'play'; card: Card };

const cloneDeal = (d: DealState): DealState => ({
  ...d,
  hands: [[...d.hands[0]], [...d.hands[1]], [...d.hands[2]]],
  skat: [...d.skat],
  bids: [...d.bids],
  discards: [...d.discards],
  contract: d.contract ? { ...d.contract } : null,
  tricks: d.tricks.map((t) => [...t]),
  trick: [...d.trick]
});

/** Legal actions for the seat to act (cards to play, bids, declarations are listed by the caller). */
export function isLegalAction(d: DealState, seat: Seat, action: Action, ramschOption = false): boolean {
  return applyDealAction(d, seat, action, ramschOption) !== null;
}

/**
 * Applies one action by `seat`. Returns the new deal state, or `null` if the action is not legal now.
 * `ramschOption`: if everybody passes, Ramsch is played instead of throwing the game in.
 */
export function applyDealAction(d: DealState, seat: Seat, action: Action, ramschOption = false): DealState | null {
  if (toAct(d) !== seat) return null;
  const phase = dealPhase(d);
  const next = cloneDeal(d);
  switch (phase) {
    case 'bidding': {
      const status = biddingStatus(d.bids, d.dealer);
      if (!status) return null;
      let step: BidAction;
      if (action.type === 'bid') step = action.value;
      else if (action.type === 'yes' || action.type === 'pass') step = action.type;
      else return null;
      const after = biddingStatus([...d.bids, step], d.dealer);
      if (!after) return null;
      next.bids.push(step);
      if (after.done && after.declarer === null) {
        if (ramschOption) next.ramsch = true;
        else next.result = { type: 'passed' };
      }
      return next;
    }
    case 'skat': {
      if (action.type === 'pickup') {
        next.skatChoice = 'pickup';
        next.hands[seat] = [...next.hands[seat], ...next.skat];
        next.skat = [];
        return next;
      }
      if (action.type === 'hand') {
        next.skatChoice = 'hand';
        return next;
      }
      return null;
    }
    case 'discard': {
      if (action.type !== 'discard') return null;
      const [a, b] = action.cards;
      if (!isCard(a) || !isCard(b) || a === b) return null;
      const hand = next.hands[seat];
      if (!hand.includes(a) || !hand.includes(b)) return null;
      next.hands[seat] = hand.filter((c) => c !== a && c !== b);
      next.discards = [a, b];
      return next;
    }
    case 'declare': {
      if (action.type !== 'declare') return null;
      const c = action.contract;
      const contract: Contract = { kind: c.kind, hand: d.skatChoice === 'hand', schneider: !!c.schneider, schwarz: !!c.schwarz, ouvert: !!c.ouvert };
      if (c.hand !== contract.hand || !isLegalContract(contract)) return null;
      next.contract = contract;
      return next;
    }
    case 'play': {
      if (action.type !== 'play') return null;
      const kind = playKind(d) as PlayKind;
      if (!legalCards(d.hands[seat], d.trick, kind).includes(action.card)) return null;
      next.hands[seat] = next.hands[seat].filter((c) => c !== action.card);
      next.trick.push(action.card);
      if (next.trick.length === 3) {
        next.tricks.push(next.trick);
        next.trick = [];
        next.result = finishedResult(next);
      }
      return next;
    }
    default:
      return null;
  }
}

/** The result once the game is decided (all tricks played, or the Null declarer took a trick), else `null`. */
export function finishedResult(d: DealState): GameResult | null {
  const kind = playKind(d);
  if (kind === null) return null;
  const winners = trickWinners(d);
  if (d.ramsch) {
    if (d.tricks.length < 10) return null;
    const points: [number, number, number] = [0, 0, 0];
    const tricks: [number, number, number] = [0, 0, 0];
    d.tricks.forEach((t, i) => {
      const w = winners[i] as Seat;
      points[w] += sumPoints(t);
      tricks[w] += 1;
    });
    points[winners[9] as Seat] += sumPoints(d.skat); // the Skat goes to the winner of the last trick
    const scores: [number, number, number] = [0, 0, 0];
    const sweep = tricks.findIndex((n) => n === 10);
    if (sweep >= 0) scores[sweep] = 120; // Durchmarsch
    else {
      const most = Math.max(...points);
      SEATS.forEach((s) => {
        if (points[s] === most) scores[s] = -most;
      });
    }
    return { type: 'ramsch', points, tricks, scores };
  }
  const declarer = declarerOf(d) as Seat;
  const contract = d.contract as Contract;
  const declarerTricks = winners.filter((w) => w === declarer).length;
  const nullLost = contract.kind === 'null' && declarerTricks > 0;
  if (d.tricks.length < 10 && !nullLost) return null;
  let declarerPoints = sumPoints(contract.hand ? d.skat : d.discards);
  d.tricks.forEach((t, i) => {
    if (winners[i] === declarer) declarerPoints += sumPoints(t);
  });
  const bid = highBid(d);
  const valuation = valueGame({
    contract,
    bid,
    declarerCards: declarerCards(d, declarer),
    declarerPoints,
    declarerTricks,
    defenderTricks: d.tricks.length - declarerTricks
  });
  return { type: 'game', declarer, contract, bid, declarerPoints, declarerTricks, valuation };
}

// ------------------------------------------------------------------ series ("Liste")

export interface ListEntry {
  dealer: Seat;
  result: GameResult;
}

/**
 * Score changes per seat for one list entry.
 * - simple: the declarer gets +value (won) or −2 × value (lost).
 * - seeger (Seeger–Fabian, as used by the DSkV): additionally +50 for a won and −50 for a lost game, and each
 *   of the two opponents gets +40 when the declarer loses (three-player table).
 * Ramsch (house rule) scores the same in both: the player(s) with most card points lose that many points; a
 * Durchmarsch (all ten tricks) wins 120.
 */
export function entryScores(entry: ListEntry, scoring: Scoring): [number, number, number] {
  const r = entry.result;
  if (r.type === 'passed') return [0, 0, 0];
  if (r.type === 'ramsch') return [...r.scores];
  const scores: [number, number, number] = [0, 0, 0];
  const won = r.valuation.won;
  scores[r.declarer] = r.valuation.score + (scoring === 'seeger' ? (won ? 50 : -50) : 0);
  if (scoring === 'seeger' && !won) for (const s of SEATS) if (s !== r.declarer) scores[s] += 40;
  return scores;
}

export function totals(list: readonly ListEntry[], scoring: Scoring): [number, number, number] {
  const sum: [number, number, number] = [0, 0, 0];
  for (const entry of list) {
    const s = entryScores(entry, scoring);
    for (const seat of SEATS) sum[seat] += s[seat];
  }
  return sum;
}

export interface SkatState {
  v: 1;
  seed: number;
  difficulty: Difficulty;
  options: Options;
  /** `setup`: options screen; `play`: a series is running; `over`: the series has ended. */
  stage: 'setup' | 'play' | 'over';
  /** Generator state for the next shuffle. */
  rng: number;
  list: ListEntry[];
  deal: DealState | null;
}

export function newGame(seed: number, difficulty: Difficulty = DEFAULT_DIFFICULTY, options: Options = DEFAULT_OPTIONS): SkatState {
  const s = normalizeSeed(seed);
  return { v: 1, seed: s, difficulty, options: { ...options }, stage: 'setup', rng: s, list: [], deal: null };
}

/** The first dealer is seat 2, so the person is Vorhand in the first game; the deal then passes clockwise. */
export const FIRST_DEALER: Seat = 2;

export function startSeries(state: SkatState, options: Options = state.options, difficulty: Difficulty = state.difficulty): SkatState {
  const base = newGame(state.seed, difficulty, options);
  const { deal, rng } = newDeal(FIRST_DEALER, base.rng);
  return { ...base, stage: 'play', rng, deal };
}

export const seriesComplete = (state: SkatState): boolean =>
  state.options.series > 0 && state.list.length >= state.options.series;

/** Deals the next game of the series (after the current one is done). */
export function nextDeal(state: SkatState): SkatState | null {
  if (state.stage !== 'play' || !state.deal?.result || seriesComplete(state)) return null;
  const dealer = ((state.deal.dealer + 1) % 3) as Seat;
  const { deal, rng } = newDeal(dealer, state.rng);
  return { ...state, rng, deal, list: [...state.list] };
}

/** Ends an open-ended (or any) series between games. */
export function endSeries(state: SkatState): SkatState | null {
  if (state.stage !== 'play' || (state.deal && !state.deal.result)) return null;
  return { ...state, stage: 'over' };
}

/** Applies one action of `seat` to the running game; records the result in the list when the game ends. */
export function applyAction(state: SkatState, seat: Seat, action: Action): SkatState | null {
  if (state.stage !== 'play' || !state.deal) return null;
  const deal = applyDealAction(state.deal, seat, action, state.options.ramsch);
  if (!deal) return null;
  const list = deal.result ? [...state.list, { dealer: deal.dealer, result: deal.result }] : state.list;
  const next: SkatState = { ...state, deal, list };
  if (seriesComplete(next)) next.stage = 'over';
  return next;
}

// ------------------------------------------------------------------ validation

const isSeat = (v: unknown): v is Seat => v === 0 || v === 1 || v === 2;
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';

function isContract(v: unknown): v is Contract {
  if (!isRecord(v)) return false;
  return isOneOf(v.kind as string, GAME_KINDS) && isBool(v.hand) && isBool(v.schneider) && isBool(v.schwarz) && isBool(v.ouvert) &&
    isLegalContract(v as unknown as Contract);
}

function isTriple(v: unknown, min: number, max: number): v is [number, number, number] {
  return Array.isArray(v) && v.length === 3 && v.every((n) => isInt(n, min, max));
}

function isResult(v: unknown): v is GameResult {
  if (!isRecord(v)) return false;
  if (v.type === 'passed') return Object.keys(v).length === 1;
  if (v.type === 'ramsch') return isTriple(v.points, 0, 120) && isTriple(v.tricks, 0, 10) && isTriple(v.scores, -120, 120) &&
    (v.points as number[]).reduce((a, b) => a + b, 0) === 120 && (v.tricks as number[]).reduce((a, b) => a + b, 0) === 10;
  if (v.type !== 'game') return false;
  const val = v.valuation;
  if (!isSeat(v.declarer) || !isContract(v.contract) || !isBidValue(v.bid) || !isInt(v.declarerPoints, 0, 120) || !isInt(v.declarerTricks, 0, 10)) return false;
  if (!isRecord(val) || !isBool(val.won) || !isBool(val.overbid) || !isInt(val.value, 1, 10_000) || !isInt(val.score, -20_000, 10_000)) return false;
  if (val.score !== (val.won ? val.value : -2 * (val.value as number))) return false;
  return isInt(val.base, 9, 59) && isInt(val.multiplier, 0, 18) && isBool(val.schneider) && isBool(val.schwarz) &&
    (val.matadors === null || (isRecord(val.matadors) && isBool(val.matadors.with) && isInt(val.matadors.count, 1, 11)));
}

/** Structural and logical validation of a deal (cards, bidding replay, trick legality, result). Never throws. */
export function isValidDeal(v: unknown, ramschOption: boolean): v is DealState {
  if (!isRecord(v)) return false;
  if (!isSeat(v.dealer) || !Array.isArray(v.hands) || v.hands.length !== 3) return false;
  const deck = deck32();
  const cardList = (x: unknown, max: number) => isCardList(x, { deck, maxLength: max });
  if (!v.hands.every((hnd) => cardList(hnd, 12)) || !cardList(v.skat, 2) || !cardList(v.discards, 2) || !cardList(v.trick, 2)) return false;
  if (!Array.isArray(v.tricks) || v.tricks.length > 10 || !v.tricks.every((t) => isCardList(t, { deck, minLength: 3, maxLength: 3 }))) return false;
  if (!Array.isArray(v.bids) || v.bids.length > 200) return false;
  if (!(v.skatChoice === null || v.skatChoice === 'pickup' || v.skatChoice === 'hand')) return false;
  if (!(v.contract === null || isContract(v.contract)) || !isBool(v.ramsch) || !(v.result === null || isResult(v.result))) return false;
  const d = v as unknown as DealState;
  const all: Card[][] = [...d.hands, d.skat, d.discards, d.trick, ...d.tricks];
  if (!areDisjoint(...all) || all.reduce((n, l) => n + l.length, 0) !== 32) return false;
  const status = biddingStatus(d.bids, d.dealer);
  if (!status) return false;
  const declarer = status.declarer;
  // Phase consistency.
  if (!status.done) {
    if (d.skatChoice !== null || d.contract || d.ramsch || d.tricks.length || d.trick.length || d.discards.length || d.result) return false;
    if (d.skat.length !== 2 || d.hands.some((hnd) => hnd.length !== 10)) return false;
    return true;
  }
  if (declarer === null) {
    if (d.skatChoice !== null || d.contract || d.discards.length || d.skat.length !== 2) return false;
    if (!d.ramsch) return !ramschOption && d.result?.type === 'passed' && d.tricks.length === 0 && d.trick.length === 0 && d.hands.every((hnd) => hnd.length === 10);
    if (!ramschOption) return false;
  } else {
    if (d.ramsch) return false;
    if (d.skatChoice === 'hand' && (d.skat.length !== 2 || d.discards.length)) return false;
    if (d.skatChoice === 'pickup' && d.skat.length !== 0) return false;
    if (d.skatChoice === null && (d.skat.length !== 2 || d.discards.length || d.contract)) return false;
    if (d.contract && (d.contract.hand !== (d.skatChoice === 'hand') || (d.skatChoice === 'pickup' && d.discards.length !== 2))) return false;
    if (!d.contract && (d.tricks.length || d.trick.length)) return false;
  }
  // Hand sizes: every seat has 10 − (cards played); the declarer holds 12 while choosing the discard.
  const played = [0, 0, 0];
  const leaders = trickLeaders(d);
  if (!d.contract && !d.ramsch) {
    for (const s of SEATS) {
      const expected = s === declarer && d.skatChoice === 'pickup' && d.discards.length === 0 ? 12 : 10;
      if (d.hands[s].length !== expected) return false;
    }
  } else {
    // Replay the tricks backwards to check every card was a legal play.
    const kind = playKind(d) as PlayKind;
    const handsAt = d.hands.map((hnd) => [...hnd]);
    // Going backwards, a trick's cards are added back to the hands they came from; each card must then have
    // been legal for the hand its player held at the start of that trick.
    const replay = (trick: readonly Card[], leader: Seat): boolean => {
      trick.forEach((card, i) => {
        handsAt[(leader + i) % 3]?.push(card);
        played[(leader + i) % 3] = (played[(leader + i) % 3] ?? 0) + 1;
      });
      return trick.every((card, i) => legalCards(handsAt[(leader + i) % 3] as Card[], trick.slice(0, i), kind).includes(card));
    };
    if (!replay(d.trick, leaders[leaders.length - 1] as Seat)) return false;
    for (let t = d.tricks.length - 1; t >= 0; t--) if (!replay(d.tricks[t] as Card[], leaders[t] as Seat)) return false;
    // Null ends as soon as the declarer takes a trick; no trick may follow.
    if (d.contract?.kind === 'null' && declarer !== null) {
      const first = trickWinners(d).indexOf(declarer);
      if (first >= 0 && (first < d.tricks.length - 1 || d.trick.length > 0)) return false;
    }
    for (const s of SEATS) if (d.hands[s].length + (played[s] ?? 0) !== 10) return false;
  }
  // The result must be exactly what the rules give.
  const expected = d.ramsch || d.contract ? finishedResult(d) : d.result;
  if (JSON.stringify(expected) !== JSON.stringify(d.result)) return false;
  if (d.result && d.trick.length) return false;
  return true;
}

function isListEntry(v: unknown): v is ListEntry {
  return isRecord(v) && isSeat(v.dealer) && isResult(v.result);
}

export function isValidState(value: unknown): value is SkatState {
  try {
    if (!isRecord(value) || value.v !== 1) return false;
    if (!isUint32(value.seed) || !isUint32(value.rng) || !isOneOf(value.difficulty as string, DIFFICULTIES)) return false;
    const o = value.options;
    if (!isRecord(o) || !isOneOf(o.series as number, SERIES_LENGTHS) || !isOneOf(o.scoring as string, SCORINGS) || !isBool(o.ramsch)) return false;
    if (!isOneOf(value.stage as string, ['setup', 'play', 'over'] as const)) return false;
    if (!Array.isArray(value.list) || value.list.length > 999 || !value.list.every(isListEntry)) return false;
    const s = value as unknown as SkatState;
    if (s.options.series > 0 && s.list.length > s.options.series) return false;
    if (!s.options.ramsch && s.list.some((e) => e.result.type === 'ramsch')) return false;
    if (s.options.ramsch && s.list.some((e) => e.result.type === 'passed')) return false;
    // Dealers rotate clockwise from the first dealer.
    if (s.list.some((e, i) => e.dealer !== (FIRST_DEALER + i) % 3)) return false;
    if (s.stage === 'setup') return s.deal === null && s.list.length === 0;
    if (!isValidDeal(s.deal, s.options.ramsch)) return false;
    const deal = s.deal as DealState;
    const games = s.list.length + (deal.result ? 0 : 1);
    if (deal.dealer !== (FIRST_DEALER + games - 1) % 3) return false;
    if (deal.result && JSON.stringify(s.list[s.list.length - 1]?.result) !== JSON.stringify(deal.result)) return false;
    if (s.stage === 'play' && seriesComplete(s)) return false;
    if (s.stage === 'over' && deal.result === null) return false;
    return true;
  } catch {
    return false;
  }
}
