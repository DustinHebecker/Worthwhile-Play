import { RANKS, SUITS, type Card } from '@wp/cards';

/**
 * Poker hand evaluator (own implementation, no lookup tables from third parties).
 *
 * Cards are converted to small integers `suit * 13 + rank` (rank 0 = deuce … 12 = ace). `scoreIds` takes the
 * best five-card hand out of 5–7 cards and returns a single integer that orders hands exactly like poker does:
 * a higher score is a better hand, equal scores tie. Layout: category in bits 20–23, then up to five rank
 * nibbles (most significant first), e.g. a full house "kings full of fives" is `6 << 20 | 11 << 16 | 3 << 12`.
 *
 * It is tested against an independent brute-force oracle (best of all 5-card subsets) and against the known
 * count of 7,462 distinct five-card hand classes.
 */
export const HAND_CATEGORIES = [
  'highCard',
  'pair',
  'twoPair',
  'trips',
  'straight',
  'flush',
  'fullHouse',
  'quads',
  'straightFlush'
] as const;
export type HandCategory = (typeof HAND_CATEGORIES)[number];

const CARD_INDEX = new Map<string, number>();
SUITS.forEach((suit, s) => RANKS.forEach((rank, r) => CARD_INDEX.set(`${rank}${suit}`, s * 13 + r)));

/** Integer id of a card (`suit * 13 + rank`). */
export const cardId = (card: Card): number => CARD_INDEX.get(card) as number;
/** The card of an integer id. */
export const cardOfId = (id: number): Card => `${RANKS[id % 13] as string}${SUITS[Math.floor(id / 13)] as string}` as Card;

/** Highest rank of a five-in-a-row in a 13-bit rank mask (3 for the wheel A-2-3-4-5), or -1. */
const STRAIGHT_HIGH = new Int8Array(1 << 13);
for (let mask = 0; mask < 1 << 13; mask++) {
  let high = -1;
  for (let top = 12; top >= 4; top--) {
    if (((mask >> (top - 4)) & 0x1f) === 0x1f) {
      high = top;
      break;
    }
  }
  if (high < 0 && (mask & 0x100f) === 0x100f) high = 3;
  STRAIGHT_HIGH[mask] = high;
}

/** Packs the `count` highest ranks of `mask` (high first) into nibbles, shifted to fill `count` slots. */
function topRanks(mask: number, count: number): number {
  let packed = 0;
  let taken = 0;
  for (let r = 12; r >= 0 && taken < count; r--) {
    if (mask & (1 << r)) {
      packed = (packed << 4) | r;
      taken++;
    }
  }
  return packed;
}

const counts = new Int8Array(13);
const suitMasks = new Int32Array(4);
const suitCounts = new Int8Array(4);

/** Score of the best five-card hand among 5–7 card ids (see module comment). */
export function scoreIds(ids: ArrayLike<number>, length: number = ids.length): number {
  counts.fill(0);
  suitMasks.fill(0);
  suitCounts.fill(0);
  let rankMask = 0;
  for (let i = 0; i < length; i++) {
    const id = ids[i] as number;
    const rank = id % 13;
    const suit = (id - rank) / 13;
    counts[rank] = (counts[rank] as number) + 1;
    suitMasks[suit] = (suitMasks[suit] as number) | (1 << rank);
    suitCounts[suit] = (suitCounts[suit] as number) + 1;
    rankMask |= 1 << rank;
  }
  let flushMask = 0;
  for (let s = 0; s < 4; s++) {
    if ((suitCounts[s] as number) >= 5) {
      flushMask = suitMasks[s] as number;
      const high = STRAIGHT_HIGH[flushMask] as number;
      if (high >= 0) return (8 << 20) | (high << 16);
    }
  }
  let quad = -1;
  let trip1 = -1;
  let trip2 = -1;
  let pair1 = -1;
  let pair2 = -1;
  for (let r = 12; r >= 0; r--) {
    const c = counts[r] as number;
    if (c === 4) quad = r;
    else if (c === 3) {
      if (trip1 < 0) trip1 = r;
      else if (trip2 < 0) trip2 = r;
    } else if (c === 2) {
      if (pair1 < 0) pair1 = r;
      else if (pair2 < 0) pair2 = r;
    }
  }
  if (quad >= 0) return (7 << 20) | (quad << 16) | (topRanks(rankMask & ~(1 << quad), 1) << 12);
  if (trip1 >= 0 && (trip2 >= 0 || pair1 >= 0)) return (6 << 20) | (trip1 << 16) | (Math.max(trip2, pair1) << 12);
  if (flushMask) return (5 << 20) | topRanks(flushMask, 5);
  const straight = STRAIGHT_HIGH[rankMask] as number;
  if (straight >= 0) return (4 << 20) | (straight << 16);
  if (trip1 >= 0) return (3 << 20) | (trip1 << 16) | (topRanks(rankMask & ~(1 << trip1), 2) << 8);
  if (pair2 >= 0) return (2 << 20) | (pair1 << 16) | (pair2 << 12) | (topRanks(rankMask & ~(1 << pair1) & ~(1 << pair2), 1) << 8);
  if (pair1 >= 0) return (1 << 20) | (pair1 << 16) | (topRanks(rankMask & ~(1 << pair1), 3) << 4);
  return topRanks(rankMask, 5);
}

/** Score of the best five-card hand among 5–7 cards. */
export function scoreCards(cards: readonly Card[]): number {
  return scoreIds(cards.map(cardId));
}

/** Category of a score. */
export const categoryOf = (score: number): HandCategory => HAND_CATEGORIES[score >> 20] as HandCategory;
