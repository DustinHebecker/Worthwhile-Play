import type { Deck } from './deck';
import { COUNTRY_CODES, countryName, flagEmoji, hasCountryNames } from './builtin/countries';
import { FIRST_WORDS, toVocabularyLanguage, VOCABULARY_LANGUAGES, type VocabularyLanguage } from './builtin/first-words';
import { SYMBOL_DECK } from './builtin/symbols';

/** Learning/translation languages as chosen in Settings (any BCP-47 tag, both optional). */
export interface ContentLanguageChoice {
  learning?: string | undefined;
  translation?: string | undefined;
}

export interface ResolvedLanguages {
  /** Language of the words in "First words" games. */
  learning: VocabularyLanguage;
  /** Language of translations (always different from `learning`). */
  translation: VocabularyLanguage;
  /** Language of country names (any language the platform has CLDR names for). */
  countries: string;
  /** The chosen learning language has no "First words" yet; `learning` is a fallback. */
  learningFallback: boolean;
  /** The chosen translation language was unavailable or equal to the learning language. */
  translationFallback: boolean;
}

/**
 * Explicit, tested fallback rules for content languages (spec: "Fallback behavior must be explicit"):
 * - learning: chosen learning language → UI language → English (first that has "First words");
 * - translation: chosen translation language → UI language → English → German, skipping the learning language;
 * - country names: chosen learning language if the platform knows it → UI language.
 */
export function resolveContentLanguages(choice: ContentLanguageChoice | undefined, uiLocale: string): ResolvedLanguages {
  const chosenLearning = toVocabularyLanguage(choice?.learning);
  const learning = chosenLearning ?? toVocabularyLanguage(uiLocale) ?? 'en';
  const candidates = [choice?.translation, uiLocale, 'en', 'de'].map(toVocabularyLanguage);
  const translation = candidates.find((l): l is VocabularyLanguage => l !== undefined && l !== learning) ?? 'en';
  const countries = choice?.learning && hasCountryNames(choice.learning) ? choice.learning : uiLocale;
  return {
    learning,
    translation,
    countries,
    learningFallback: Boolean(choice?.learning) && chosenLearning === undefined,
    translationFallback: Boolean(choice?.translation) && toVocabularyLanguage(choice?.translation) !== translation
  };
}

export const BUILTIN_DECK_IDS = ['symbols', 'first-words', 'flags'] as const;
export type BuiltinDeckId = (typeof BUILTIN_DECK_IDS)[number];

export function isBuiltinDeckId(value: unknown): value is BuiltinDeckId {
  return typeof value === 'string' && (BUILTIN_DECK_IDS as readonly string[]).includes(value);
}

/** Built-in decks that make sense for review (front and back differ). */
export const REVIEW_BUILTIN_DECK_IDS = ['first-words', 'flags'] as const satisfies readonly BuiltinDeckId[];

/**
 * Key under which learning records of a deck are kept, or `undefined` if the deck is not reviewable.
 * "First words" is learned per learning language (`first-words:ja`); the translation language does not matter.
 * Flags are language-independent knowledge; imported decks use their (unique) id.
 */
export function learningDeckId(deckId: string, languages: Pick<ResolvedLanguages, 'learning'>): string | undefined {
  if (deckId === 'symbols') return undefined;
  if (deckId === 'first-words') return `first-words:${languages.learning}`;
  return deckId;
}

/** Item ids of a built-in deck (independent of languages), e.g. for validating saves. */
export function builtinItemIds(id: string): readonly string[] | undefined {
  switch (id) {
    case 'symbols':
      return SYMBOL_DECK.items.map((item) => item.id);
    case 'first-words':
      return FIRST_WORDS.map((entry) => entry.id);
    case 'flags':
      return COUNTRY_CODES.map((code) => code.toLowerCase());
    default:
      return undefined;
  }
}

/** "First words" as a deck: picture + word in `learning` ↔ word in `translation`. */
export function firstWordsDeck(learning: VocabularyLanguage, translation: VocabularyLanguage): Deck {
  return {
    schemaVersion: 1,
    id: 'first-words',
    title: { en: 'First words', de: 'Erste Wörter' },
    license: 'PolyForm-Perimeter-1.0.0 (authored for Worthwhile Play); pictures: Unicode emoji (system font)',
    source: 'Worthwhile Play',
    items: FIRST_WORDS.map((entry) => ({
      id: entry.id,
      front: { symbol: entry.emoji, text: entry.words[learning], lang: learning },
      back: { text: entry.words[translation], lang: translation },
      category: 'first-words'
    }))
  };
}

/** "Flags & countries" as a deck: flag ↔ country name in `language`. */
export function flagsDeck(language: string): Deck {
  return {
    schemaVersion: 1,
    id: 'flags',
    title: { en: 'Flags & countries', de: 'Flaggen & Länder' },
    license: 'Country names: Unicode CLDR via the browser (Intl.DisplayNames); flags: Unicode emoji (system font)',
    source: 'Unicode CLDR (provided by the browser)',
    items: COUNTRY_CODES.map((code) => ({
      id: code.toLowerCase(),
      front: { symbol: flagEmoji(code), alt: countryName(code, language) },
      back: { text: countryName(code, language), lang: language },
      category: 'geography'
    }))
  };
}

/** Builds a built-in deck for the given content languages. */
export function builtinDeck(id: BuiltinDeckId, languages: ResolvedLanguages): Deck {
  switch (id) {
    case 'symbols':
      return SYMBOL_DECK;
    case 'first-words':
      return firstWordsDeck(languages.learning, languages.translation);
    case 'flags':
      return flagsDeck(languages.countries);
  }
}

export { VOCABULARY_LANGUAGES };
