import type { Translator, UserDeckSource } from '@wp/game-core';
import {
  builtinItemIds,
  capitalName,
  capitalsDeck,
  countryName,
  findWord,
  firstWordsDeck,
  flagEmoji,
  flagsDeck,
  isVocabularyLanguage,
  resolveContentLanguages,
  SYMBOL_DECK,
  validateDeck,
  type CardSide,
  type ContentLanguageChoice,
  type Deck,
  type LearningItem
} from '@wp/learning-content';
import type { BuiltinVariant, CardLanguages, Card, DeckLookup, MemoryState, Variant } from './rules';

/** Item ids of the built-in decks (symbols, first words, flags, capitals) for save validation. */
export const lookupDeckItems: DeckLookup = (deckId) => builtinItemIds(deckId);

/** What the player can choose in the "Cards" menu: a built-in variant or `own:<deck id>`. */
export type CardChoice = BuiltinVariant | `own:${string}`;
export const BUILTIN_CHOICES: readonly BuiltinVariant[] = ['symbols', 'picture-word', 'word-translation', 'flag-country', 'country-capital'];

export function parseChoice(value: unknown): { variant: Variant; deckId?: string } | undefined {
  if (typeof value !== 'string') return undefined;
  if ((BUILTIN_CHOICES as readonly string[]).includes(value)) return { variant: value as BuiltinVariant };
  if (value.startsWith('own:') && value.length > 4) return { variant: 'own', deckId: value.slice(4) };
  return undefined;
}

export function choiceOf(state: Pick<MemoryState, 'variant' | 'deckId'>): CardChoice {
  return state.variant === 'own' ? `own:${state.deckId}` : state.variant;
}

/** Validated user deck from the host snapshot, or undefined when it is missing or unusable. */
export function userDeck(source: UserDeckSource | undefined, deckId: string): Deck | undefined {
  let raw: unknown;
  try {
    raw = source?.get(deckId);
  } catch {
    return undefined;
  }
  const result = validateDeck(raw);
  return result.ok && result.deck.id === deckId ? result.deck : undefined;
}

/** The deck and recorded languages to deal for a built-in variant under the given content languages. */
export function builtinDeal(variant: BuiltinVariant, choice: ContentLanguageChoice | undefined, uiLocale: string): { deck: Deck; languages: CardLanguages } {
  const resolved = resolveContentLanguages(choice, uiLocale);
  switch (variant) {
    case 'symbols':
      return { deck: SYMBOL_DECK, languages: {} };
    case 'picture-word':
      return { deck: firstWordsDeck(resolved.learning, resolved.translation), languages: { back: resolved.learning } };
    case 'word-translation':
      return { deck: firstWordsDeck(resolved.learning, resolved.translation), languages: { front: resolved.learning, back: resolved.translation } };
    case 'flag-country':
      return { deck: flagsDeck(resolved.countries), languages: { back: resolved.countries } };
    case 'country-capital':
      // Capital names exist in the 16 "First words" languages only, so this follows the learning language.
      return { deck: capitalsDeck(resolved.learning), languages: { back: resolved.learning } };
  }
}

export interface CardFace {
  side: CardSide;
  /** Accessible description in the UI language (or the card's own text). */
  description: string;
}

/** Resolves card faces for a state. `undefined` means the state's deck (or one of its items) is not available. */
export type FaceResolver = (card: Card) => CardFace;

const vocabularyUiLanguage = (locale: string) => (isVocabularyLanguage(locale) ? locale : 'en');

/**
 * Returns a resolver for the faces of `state`'s cards, or `undefined` if the cards cannot be shown
 * (a user deck that was deleted, or that no longer contains the dealt items).
 */
export function faceResolver(state: MemoryState, t: Translator, userDecks: UserDeckSource | undefined): FaceResolver | undefined {
  const { front: frontLang, back: backLang } = state.languages;
  switch (state.variant) {
    case 'symbols': {
      const items = new Map(SYMBOL_DECK.items.map((item) => [item.id, item]));
      return (card) => {
        const item = items.get(card.item);
        return { side: item?.[card.side] ?? {}, description: t(`symbol.${card.item}`) };
      };
    }
    case 'picture-word':
    case 'word-translation':
      return (card) => {
        const entry = findWord(card.item);
        if (!entry) return { side: {}, description: '' };
        const lang = card.side === 'front' ? frontLang : backLang;
        if (card.side === 'front' && state.variant === 'picture-word') {
          return { side: { symbol: entry.emoji }, description: t('card.picture', { name: entry.words[vocabularyUiLanguage(t.locale)] }) };
        }
        const text = lang && isVocabularyLanguage(lang) ? entry.words[lang] : '';
        return { side: { text, lang: lang ?? '' }, description: text };
      };
    case 'flag-country':
      return (card) => {
        const code = card.item.toUpperCase();
        if (card.side === 'front') return { side: { symbol: flagEmoji(code) }, description: t('card.flag', { name: countryName(code, t.locale) }) };
        const text = countryName(code, backLang ?? t.locale);
        return { side: { text, lang: backLang ?? t.locale }, description: text };
      };
    case 'country-capital': {
      const lang = backLang && isVocabularyLanguage(backLang) ? backLang : vocabularyUiLanguage(t.locale);
      return (card) => {
        const code = card.item.toUpperCase();
        // Both cards are plain text in the same language: the country name (CLDR) and its capital.
        const text = card.side === 'front' ? countryName(code, lang) : (capitalName(code, lang) ?? '');
        return { side: { text, lang }, description: text };
      };
    }
    case 'own': {
      const deck = userDeck(userDecks, state.deckId);
      if (!deck) return undefined;
      const items = new Map<string, LearningItem>(deck.items.map((item) => [item.id, item]));
      if (!state.itemIds.every((id) => items.has(id))) return undefined;
      return (card) => {
        const side = items.get(card.item)?.[card.side] ?? {};
        return { side, description: side.text ?? side.alt ?? t('card.image') };
      };
    }
  }
}
