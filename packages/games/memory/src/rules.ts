import { createRng, isInt, isOneOf, isRecord, isUint32 } from '@wp/game-core';
import { isUserDeckId, isVocabularyLanguage, type Deck } from '@wp/learning-content';

/**
 * Pure, DOM-free rules for Memory (concentration / pairs).
 *
 * A pair is always `(item.front, item.back)` of the same `LearningItem`, so the same
 * rules work for image↔image (symbol deck), word↔image, word↔translation or
 * term↔definition decks without changes. The state stores only the variant, deck id,
 * the content languages chosen at deal time and the selected item ids; card contents are
 * resolved by the view (built-in decks are generated, user decks come from the host).
 */

export const DIFFICULTIES = ['small', 'medium', 'large'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'small';

/** Board sizes. Column counts keep cards comfortably large on a 360px-wide phone. */
export const BOARD: Readonly<Record<Difficulty, { readonly pairs: number; readonly columns: number }>> = {
  small: { pairs: 6, columns: 3 },
  medium: { pairs: 8, columns: 4 },
  large: { pairs: 12, columns: 4 }
};

/** Upper bound for the move counter in untrusted saves (far beyond any real game). */
export const MAX_MOVES = 1_000_000;

/**
 * What the cards show. Built-in variants use fixed decks; `own` uses a deck the user imported.
 * - `symbols`: the same picture on both cards (classic Memory, default, all v1 saves)
 * - `picture-word`: picture ↔ word in the learning language ("First words")
 * - `word-translation`: word in the learning language ↔ word in the translation language ("First words")
 * - `flag-country`: flag ↔ country name ("Flags & countries")
 * - `own`: front ↔ back of a user deck
 */
export const VARIANTS = ['symbols', 'picture-word', 'word-translation', 'flag-country', 'own'] as const;
export type Variant = (typeof VARIANTS)[number];
export type BuiltinVariant = Exclude<Variant, 'own'>;
export const DEFAULT_VARIANT: Variant = 'symbols';

/** Deck behind each built-in variant (ids from `@wp/learning-content`). */
export const VARIANT_DECK: Readonly<Record<BuiltinVariant, string>> = {
  symbols: 'symbols',
  'picture-word': 'first-words',
  'word-translation': 'first-words',
  'flag-country': 'flags'
};

/** Smallest board for user decks with fewer items than the difficulty asks for. */
export const MIN_PAIRS = 2;
/** Upper bound for item ids of user decks in untrusted saves. */
export const MAX_ITEM_ID_LENGTH = 200;

/** Content languages fixed when the cards were dealt (so a resumed game looks the same). */
export interface CardLanguages {
  front?: string;
  back?: string;
}

export type Side = 'front' | 'back';
export const SIDES: readonly Side[] = ['front', 'back'];

export interface Card {
  /** `LearningItem.id` within the state's deck. */
  item: string;
  side: Side;
}

export interface MemoryState {
  seed: number;
  difficulty: Difficulty;
  variant: Variant;
  /** `VARIANT_DECK[variant]` for built-in variants, the user deck id (`user-…`) for `own`. */
  deckId: string;
  languages: CardLanguages;
  /** Item ids selected for this game, in selection order. */
  itemIds: string[];
  /** Board layout: one entry per position. Each selected item appears once per side. */
  cards: Card[];
  /** `matched[i]` is true once the card at position `i` belongs to a found pair. */
  matched: boolean[];
  /**
   * Face-up positions that are not matched (at most 2). One entry: first card of a
   * move. Two entries: a pending mismatch that stays visible until the player's next
   * action (no timers).
   */
  revealed: number[];
  /** Completed moves (each move = two cards turned over). */
  moves: number;
}

export type CardView = 'hidden' | 'revealed' | 'matched';

export type MemoryEvent =
  | { kind: 'ignored' }
  | { kind: 'first'; position: number; hid: boolean }
  | { kind: 'match'; positions: [number, number] }
  | { kind: 'mismatch'; positions: [number, number] }
  | { kind: 'hid' };

export interface SelectResult {
  state: MemoryState;
  event: MemoryEvent;
}

export function toDifficulty(value: unknown): Difficulty {
  return isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY;
}

export function isVariant(value: unknown): value is Variant {
  return isOneOf(value, VARIANTS);
}

/** Number of pairs on the board for a deck of `available` items. User decks may be smaller than the board. */
export function pairsFor(variant: Variant, difficulty: Difficulty, available: number): number {
  const { pairs } = BOARD[difficulty];
  return variant === 'own' ? Math.min(pairs, available) : pairs;
}

export interface DealOptions {
  /** Defaults to `symbols` for the symbol deck and `own` for any other deck. */
  variant?: Variant;
  languages?: CardLanguages;
}

/** Deals a new game: picks `pairs` items from the deck and shuffles both sides of each onto the board. */
export function deal(deck: Deck, difficulty: Difficulty, seed: number, options: DealOptions = {}): MemoryState {
  const variant = options.variant ?? (deck.id === 'symbols' ? 'symbols' : 'own');
  const pairs = pairsFor(variant, difficulty, deck.items.length);
  if (deck.items.length < pairs || pairs < MIN_PAIRS) throw new RangeError(`Deck "${deck.id}" has ${deck.items.length} items; ${Math.max(pairs, MIN_PAIRS)} are needed.`);
  const rng = createRng(seed);
  const itemIds = rng.shuffle(deck.items.map((item) => item.id)).slice(0, pairs);
  const cards = rng.shuffle(itemIds.flatMap((item): Card[] => SIDES.map((side) => ({ item, side }))));
  return {
    seed: seed >>> 0,
    difficulty,
    variant,
    deckId: deck.id,
    languages: { ...options.languages },
    itemIds,
    cards,
    matched: cards.map(() => false),
    revealed: [],
    moves: 0
  };
}

/** Two positions form a pair when they hold opposite sides of the same item. */
export function isPair(cards: readonly Card[], a: number, b: number): boolean {
  const first = cards[a];
  const second = cards[b];
  return first !== undefined && second !== undefined && a !== b && first.item === second.item && first.side !== second.side;
}

/** Position of the other half of the pair at `position`, or -1. */
export function partnerOf(cards: readonly Card[], position: number): number {
  return cards.findIndex((_, other) => isPair(cards, position, other));
}

export function cardView(state: MemoryState, position: number): CardView {
  if (state.matched[position] === true) return 'matched';
  return state.revealed.includes(position) ? 'revealed' : 'hidden';
}

export function hasPendingMismatch(state: MemoryState): boolean {
  return state.revealed.length === 2;
}

export function matchedPairs(state: MemoryState): number {
  return state.matched.filter(Boolean).length / 2;
}

export function isFinished(state: MemoryState): boolean {
  return state.matched.every(Boolean);
}

/** Turns a pending mismatch face down again ("Continue"). No-op otherwise. */
export function dismiss(state: MemoryState): MemoryState {
  return hasPendingMismatch(state) ? { ...state, revealed: [] } : state;
}

/**
 * The player activates the card at `position`.
 * - During a pending mismatch, any activation turns both cards face down; activating a
 *   hidden card also turns it over as the first card of the next move.
 * - Matched cards, the already revealed first card and invalid positions are ignored.
 * - The second card completes a move: a pair stays face up, a mismatch stays visible.
 */
export function select(state: MemoryState, position: number): SelectResult {
  if (isFinished(state)) return { state, event: { kind: 'ignored' } };
  const valid = Number.isInteger(position) && position >= 0 && position < state.cards.length;
  if (hasPendingMismatch(state)) {
    const cleared = dismiss(state);
    if (!valid || state.matched[position] === true || state.revealed.includes(position)) return { state: cleared, event: { kind: 'hid' } };
    return { state: { ...cleared, revealed: [position] }, event: { kind: 'first', position, hid: true } };
  }
  if (!valid || state.matched[position] === true || state.revealed.includes(position)) return { state, event: { kind: 'ignored' } };
  const [first] = state.revealed;
  if (first === undefined) return { state: { ...state, revealed: [position] }, event: { kind: 'first', position, hid: false } };
  const positions: [number, number] = [first, position];
  const moves = state.moves + 1;
  if (isPair(state.cards, first, position)) {
    const matched = state.matched.map((value, i) => value || i === first || i === position);
    return { state: { ...state, matched, revealed: [], moves }, event: { kind: 'match', positions } };
  }
  return { state: { ...state, revealed: positions, moves }, event: { kind: 'mismatch', positions } };
}

/** Item ids available in a built-in deck, or `undefined` when the deck id is unknown. */
export type DeckLookup = (deckId: string) => readonly string[] | undefined;

const isCard = (value: unknown): value is Card => isRecord(value) && typeof value.item === 'string' && isOneOf(value.side, SIDES);
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((v) => typeof v === 'string');
const LANGUAGE_TAG = /^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/;
const isLanguageTag = (value: unknown): value is string => typeof value === 'string' && value.length <= 35 && LANGUAGE_TAG.test(value);

/** The languages each variant records at deal time, and nothing else. */
export function isValidLanguages(variant: Variant, value: unknown): value is CardLanguages {
  if (!isRecord(value) || Object.keys(value).some((key) => key !== 'front' && key !== 'back')) return false;
  const { front, back } = value;
  switch (variant) {
    case 'picture-word':
      return front === undefined && isVocabularyLanguage(back);
    case 'word-translation':
      return isVocabularyLanguage(front) && isVocabularyLanguage(back) && front !== back;
    case 'flag-country':
      return front === undefined && isLanguageTag(back);
    default:
      return front === undefined && back === undefined;
  }
}

/**
 * Item ids of the state's deck as far as they can be checked without the user's data:
 * built-in decks are checked against the lookup; user decks only structurally (they may be
 * deleted later; the view handles a missing deck).
 */
function validItems(value: Record<string, unknown>, variant: Variant, lookup: DeckLookup, difficulty: Difficulty): boolean {
  const { itemIds, deckId } = value;
  if (!isStringArray(itemIds) || new Set(itemIds).size !== itemIds.length) return false;
  const { pairs } = BOARD[difficulty];
  if (variant === 'own') {
    return isUserDeckId(deckId) && itemIds.length >= MIN_PAIRS && itemIds.length <= pairs && itemIds.every((id) => id.length > 0 && id.length <= MAX_ITEM_ID_LENGTH);
  }
  if (deckId !== VARIANT_DECK[variant] || itemIds.length !== pairs) return false;
  const available = lookup(deckId);
  return available !== undefined && itemIds.every((id) => available.includes(id));
}

/** Thorough structural validation of untrusted saved data. Never throws. */
export function isValidMemoryState(value: unknown, lookup: DeckLookup): value is MemoryState {
  try {
    if (!isRecord(value)) return false;
    if (!isUint32(value.seed) || !isOneOf(value.difficulty, DIFFICULTIES) || typeof value.deckId !== 'string' || !isVariant(value.variant)) return false;
    if (!isValidLanguages(value.variant, value.languages)) return false;
    if (!validItems(value, value.variant, lookup, value.difficulty)) return false;
    const itemIds = value.itemIds as string[];
    const pairs = itemIds.length;
    const { cards, matched, revealed, moves } = value;
    if (!Array.isArray(cards) || cards.length !== pairs * 2 || !cards.every(isCard)) return false;
    // Every selected item appears exactly once per side.
    const seen = new Set(cards.map((card) => `${card.side}:${card.item}`));
    if (seen.size !== cards.length || !itemIds.every((id) => seen.has(`front:${id}`) && seen.has(`back:${id}`))) return false;
    if (!Array.isArray(matched) || matched.length !== cards.length || !matched.every(isBoolean)) return false;
    // Pairs are matched together or not at all.
    if (!cards.every((_, i) => matched[i] === matched[partnerOf(cards, i)])) return false;
    if (!Array.isArray(revealed) || revealed.length > 2 || new Set(revealed).size !== revealed.length) return false;
    if (!revealed.every((p) => isInt(p, 0, cards.length - 1) && matched[p] === false)) return false;
    if (revealed.length === 2 && isPair(cards, revealed[0] as number, revealed[1] as number)) return false;
    const found = matched.filter(Boolean).length / 2;
    return isInt(moves, found + (revealed.length === 2 ? 1 : 0), MAX_MOVES);
  } catch {
    return false;
  }
}

/**
 * Upgrades older saves. Version 1 (only the symbol deck existed) gains `variant: 'symbols'`
 * and empty `languages`; everything else is kept unchanged, so the restored game is identical.
 * Returns `undefined` for anything that cannot be upgraded.
 */
export function migrateMemoryState(state: unknown, fromVersion: number): MemoryState | undefined {
  if (fromVersion !== 1 || !isRecord(state) || 'variant' in state) return undefined;
  return { ...state, variant: 'symbols', languages: {} } as unknown as MemoryState;
}
