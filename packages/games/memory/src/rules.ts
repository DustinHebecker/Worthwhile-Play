import { createRng, isInt, isOneOf, isRecord, isUint32 } from '@wp/game-core';
import type { Deck } from '@wp/learning-content';

/**
 * Pure, DOM-free rules for Memory (concentration / pairs).
 *
 * A pair is always `(item.front, item.back)` of the same `LearningItem`, so the same
 * rules work for image↔image (symbol deck), word↔image, word↔translation or
 * term↔definition decks without changes. The state stores only the deck id and the
 * selected item ids; card contents are resolved against a deck registry by the view.
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
  deckId: string;
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

/** Deals a new game: picks `pairs` items from the deck and shuffles both sides of each onto the board. */
export function deal(deck: Deck, difficulty: Difficulty, seed: number): MemoryState {
  const { pairs } = BOARD[difficulty];
  if (deck.items.length < pairs) throw new RangeError(`Deck "${deck.id}" has ${deck.items.length} items; ${pairs} are needed.`);
  const rng = createRng(seed);
  const itemIds = rng.shuffle(deck.items.map((item) => item.id)).slice(0, pairs);
  const cards = rng.shuffle(itemIds.flatMap((item): Card[] => SIDES.map((side) => ({ item, side }))));
  return {
    seed: seed >>> 0,
    difficulty,
    deckId: deck.id,
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

/** Item ids available in a deck, or `undefined` when the deck id is unknown. */
export type DeckLookup = (deckId: string) => readonly string[] | undefined;

const isCard = (value: unknown): value is Card => isRecord(value) && typeof value.item === 'string' && isOneOf(value.side, SIDES);
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((v) => typeof v === 'string');

/** Thorough structural validation of untrusted saved data. Never throws. */
export function isValidMemoryState(value: unknown, lookup: DeckLookup): value is MemoryState {
  try {
    if (!isRecord(value)) return false;
    if (!isUint32(value.seed) || !isOneOf(value.difficulty, DIFFICULTIES) || typeof value.deckId !== 'string') return false;
    const available = lookup(value.deckId);
    if (!available) return false;
    const { pairs } = BOARD[value.difficulty];
    const { itemIds, cards, matched, revealed, moves } = value;
    if (!isStringArray(itemIds) || itemIds.length !== pairs || new Set(itemIds).size !== pairs) return false;
    if (!itemIds.every((id) => available.includes(id))) return false;
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
