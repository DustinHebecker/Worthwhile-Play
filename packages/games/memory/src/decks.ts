import type { Deck, LearningItem } from '@wp/learning-content';
import { SYMBOL_DECK } from '@wp/learning-content';
import type { DeckLookup } from './rules';

export interface DeckEntry {
  readonly deck: Deck;
  /**
   * When set, the accessible description of a card is the translated message
   * `<descriptionKeyPrefix><item.id>` (used for language-neutral symbol decks whose
   * `alt` text is English only). Otherwise the side's own `text`/`alt` is used.
   */
  readonly descriptionKeyPrefix?: string;
}

/** Decks Memory can be played with. Saves reference decks by id only. */
export const DECKS: Readonly<Record<string, DeckEntry>> = {
  [SYMBOL_DECK.id]: { deck: SYMBOL_DECK, descriptionKeyPrefix: 'symbol.' }
};

export const DEFAULT_DECK_ID = SYMBOL_DECK.id;

export function getDeck(deckId: string): DeckEntry | undefined {
  return Object.prototype.hasOwnProperty.call(DECKS, deckId) ? DECKS[deckId] : undefined;
}

export function findItem(entry: DeckEntry, itemId: string): LearningItem | undefined {
  return entry.deck.items.find((item) => item.id === itemId);
}

export const lookupDeckItems: DeckLookup = (deckId) => getDeck(deckId)?.deck.items.map((item) => item.id);
