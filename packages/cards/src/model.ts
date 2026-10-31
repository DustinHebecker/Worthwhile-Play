import { createRngFromState, normalizeSeed, type Rng } from '@wp/game-core';

/**
 * Suits, in Skat order from highest to lowest. The same four letters serve both suit sets:
 *
 * | id  | French    | German           |
 * |-----|-----------|------------------|
 * | `C` | clubs ♣   | acorns (Eichel)  |
 * | `S` | spades ♠  | leaves (Grün)    |
 * | `H` | hearts ♥  | hearts (Rot)     |
 * | `D` | diamonds ♦| bells (Schellen) |
 *
 * The suit set is a matter of presentation only (`renderCard`, `cardLabel`); rules never depend on it.
 */
export const SUITS = ['C', 'S', 'H', 'D'] as const;
export type Suit = (typeof SUITS)[number];

/**
 * Ranks from lowest to highest (ace high). `T` is the ten. For German-suited cards
 * `J` is the Unter, `Q` the Ober, `K` the King and `A` the Ace (Daus).
 */
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const;
export type Rank = (typeof RANKS)[number];

/** The eight ranks of a 32-card (Skat/Piquet) deck, lowest to highest by face value. */
export const SHORT_RANKS = ['7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const satisfies readonly Rank[];

/**
 * A card is a two-character id string: rank then suit, e.g. `"AS"` (ace of spades),
 * `"TD"` (ten of diamonds), `"7H"`. Plain JSON, safe to store in game states.
 */
export type Card = `${Rank}${Suit}`;

/** Which picture set is drawn and named. */
export type SuitSet = 'french' | 'german';

const SUIT_SET = new Set<string>(SUITS);
const RANK_SET = new Set<string>(RANKS);

export const isSuit = (value: unknown): value is Suit => typeof value === 'string' && SUIT_SET.has(value);
export const isRank = (value: unknown): value is Rank => typeof value === 'string' && RANK_SET.has(value);

export function makeCard(rank: Rank, suit: Suit): Card {
  return `${rank}${suit}`;
}

export const rankOf = (card: Card): Rank => card[0] as Rank;
export const suitOf = (card: Card): Suit => card[1] as Suit;

/** `true` for hearts and diamonds (French two-colour convention). */
export const isRedSuit = (suit: Suit): boolean => suit === 'H' || suit === 'D';

/** Index of the rank in `RANKS` (2 → 0 … ace → 12). */
export const rankValue = (rank: Rank): number => RANKS.indexOf(rank);

/** The 52-card French deck in a fixed order: suits as in `SUITS`, ranks ascending within a suit. */
export function deck52(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => makeCard(rank, suit)));
}

/** The 32-card deck (7 to ace in four suits), e.g. for Skat. */
export function deck32(): Card[] {
  return SUITS.flatMap((suit) => SHORT_RANKS.map((rank) => makeCard(rank, suit)));
}

/** Never throws, whatever `value` is. */
export function isCard(value: unknown): value is Card {
  return typeof value === 'string' && value.length === 2 && RANK_SET.has(value[0] as string) && SUIT_SET.has(value[1] as string);
}

export interface CardListOptions {
  /** Restrict to the cards of this deck, e.g. `deck32()`. */
  deck?: readonly Card[];
  /** Reject duplicates (default `true`: one physical deck has every card once). */
  unique?: boolean;
  minLength?: number;
  maxLength?: number;
}

/** Validates a list of card ids for `isValidState`. Never throws, also not on proxies or exotic objects. */
export function isCardList(value: unknown, options: CardListOptions = {}): value is Card[] {
  try {
    if (!Array.isArray(value)) return false;
    const { deck, unique = true, minLength = 0, maxLength = Number.MAX_SAFE_INTEGER } = options;
    if (value.length < minLength || value.length > maxLength) return false;
    const allowed = deck ? new Set<string>(deck) : undefined;
    const seen = new Set<string>();
    for (let i = 0; i < value.length; i++) {
      const item: unknown = value[i];
      if (!isCard(item)) return false;
      if (allowed && !allowed.has(item)) return false;
      if (unique) {
        if (seen.has(item)) return false;
        seen.add(item);
      }
    }
    return true;
  } catch {
    return false;
  }
}

/** `true` if no card occurs in more than one of the lists (or twice in one). */
export function areDisjoint(...lists: readonly (readonly Card[])[]): boolean {
  const seen = new Set<Card>();
  for (const list of lists) {
    for (const card of list) {
      if (seen.has(card)) return false;
      seen.add(card);
    }
  }
  return true;
}

// ---------------------------------------------------------------- shuffling

/**
 * Fisher–Yates shuffle drawing from a seeded `Rng` (from `createRng(seed)` in @wp/game-core).
 * Returns a new array; the input is not changed. The same rng state always gives the same order,
 * and `rng.state()` afterwards can be stored in a save to continue the sequence later.
 */
export function shuffleCards<T extends Card>(cards: readonly T[], rng: Rng): T[] {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    const tmp = result[i] as T;
    result[i] = result[j] as T;
    result[j] = tmp;
  }
  return result;
}

/**
 * Convenience for games that persist only a number: shuffles `cards` with the generator state
 * `rngState` (a seed works too) and returns the shuffled cards plus the state to store for the next shuffle.
 */
export function shuffleWithState<T extends Card>(cards: readonly T[], rngState: number): { cards: T[]; rngState: number } {
  const rng = createRngFromState(normalizeSeed(rngState));
  const shuffled = shuffleCards(cards, rng);
  return { cards: shuffled, rngState: rng.state() };
}

/**
 * Deals consecutive packets from the top (index 0) of `deck`: `deal(deck, [10, 10, 10])` gives three
 * hands of ten and the rest (in Skat: the two-card skat). Throws a `RangeError` if the deck is too small.
 */
export function deal<T extends Card>(deck: readonly T[], sizes: readonly number[]): { hands: T[][]; rest: T[] } {
  let offset = 0;
  const hands = sizes.map((size) => {
    if (!Number.isInteger(size) || size < 0) throw new RangeError('Hand sizes must be non-negative integers.');
    const hand = deck.slice(offset, offset + size);
    if (hand.length < size) throw new RangeError('Not enough cards to deal.');
    offset += size;
    return hand;
  });
  return { hands, rest: deck.slice(offset) };
}

// ------------------------------------------------------------------ sorting

export interface CardOrder {
  /** Suit order, first = leftmost. Default `SUITS` (♣ ♠ ♥ ♦ — Skat order). */
  suits?: readonly Suit[];
  /** Rank order from low to high. Default `RANKS` (ace high). */
  ranks?: readonly Rank[];
  /** Group by suit (default) or by rank. */
  by?: 'suit' | 'rank';
  /** High ranks first (default `true`, the way most players hold a hand). */
  descending?: boolean;
}

/** Comparator for `Array.prototype.sort`. Cards not listed in a custom order sort last. */
export function cardComparator(order: CardOrder = {}): (a: Card, b: Card) => number {
  const { suits = SUITS, ranks = RANKS, by = 'suit', descending = true } = order;
  const pos = (list: readonly string[], item: string) => {
    const i = list.indexOf(item);
    return i === -1 ? list.length : i;
  };
  const suitKey = (c: Card) => pos(suits, suitOf(c));
  const rankKey = (c: Card) => {
    const i = ranks.indexOf(rankOf(c));
    if (i === -1) return descending ? -1 : ranks.length; // unknown ranks last either way
    return i;
  };
  const rankCmp = (a: Card, b: Card) => (descending ? rankKey(b) - rankKey(a) : rankKey(a) - rankKey(b));
  return (a, b) => (by === 'suit' ? suitKey(a) - suitKey(b) || rankCmp(a, b) : rankCmp(a, b) || suitKey(a) - suitKey(b));
}

/** Returns a sorted copy. Pass a `CardOrder` or your own comparator (e.g. Skat with the jacks as trumps first). */
export function sortCards<T extends Card>(cards: readonly T[], order: CardOrder | ((a: T, b: T) => number) = {}): T[] {
  const compare = typeof order === 'function' ? order : cardComparator(order);
  return [...cards].sort(compare);
}
