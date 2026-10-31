import type { Deck } from './deck';
import { AI_TERMS } from './builtin/ai-basics';
import { CAPITALS } from './builtin/capitals';
import { COUNTRY_CODES, countryName, flagEmoji } from './builtin/countries';
import { FIRST_WORDS, toVocabularyLanguage, VOCABULARY_LANGUAGES, type VocabularyLanguage } from './builtin/first-words';
import { SYMBOL_DECK } from './builtin/symbols';

/** Learning/translation languages as chosen in Settings (any BCP-47 tag, both optional). */
export interface ContentLanguageChoice {
  learning?: string | undefined;
  translation?: string | undefined;
}

export interface ResolvedLanguages {
  /** Language being learned: the words of "First words" (the only language-learning pair among the built-in decks). */
  learning: VocabularyLanguage;
  /** Language of translations (always different from `learning`). */
  translation: VocabularyLanguage;
  /** Language of country names in "Flags & countries": the UI language (general knowledge, not language learning). */
  countries: string;
  /** The UI language as a content language: "Capitals" and "AI basics" (both sides in one language). */
  ui: VocabularyLanguage;
  /** The chosen learning language has no "First words" yet; `learning` is a fallback. */
  learningFallback: boolean;
  /** The chosen translation language was unavailable or equal to the learning language. */
  translationFallback: boolean;
}

/**
 * Explicit, tested fallback rules for content languages (spec: "Fallback behavior must be explicit"):
 * - learning: chosen learning language → UI language → English (first that has "First words");
 * - translation: chosen translation language → UI language → English → German, skipping the learning language;
 * - general-knowledge decks are not language practice, so they always use the UI (main) language, never the
 *   learning language: country names ("Flags & countries"), "Capitals" (country and capital names) and
 *   "AI basics" (term and definition). The 16 UI locales all have capital names and AI terms (`ui`);
 *   an unknown UI tag falls back to English.
 */
export function resolveContentLanguages(choice: ContentLanguageChoice | undefined, uiLocale: string): ResolvedLanguages {
  const chosenLearning = toVocabularyLanguage(choice?.learning);
  const learning = chosenLearning ?? toVocabularyLanguage(uiLocale) ?? 'en';
  const candidates = [choice?.translation, uiLocale, 'en', 'de'].map(toVocabularyLanguage);
  const translation = candidates.find((l): l is VocabularyLanguage => l !== undefined && l !== learning) ?? 'en';
  const ui = toVocabularyLanguage(uiLocale) ?? 'en';
  return {
    learning,
    translation,
    countries: uiLocale,
    ui,
    learningFallback: Boolean(choice?.learning) && chosenLearning === undefined,
    translationFallback: Boolean(choice?.translation) && toVocabularyLanguage(choice?.translation) !== translation
  };
}

export const BUILTIN_DECK_IDS = ['symbols', 'first-words', 'flags', 'capitals', 'ai-basics'] as const;
export type BuiltinDeckId = (typeof BUILTIN_DECK_IDS)[number];

export function isBuiltinDeckId(value: unknown): value is BuiltinDeckId {
  return typeof value === 'string' && (BUILTIN_DECK_IDS as readonly string[]).includes(value);
}

/** Built-in decks that make sense for review (front and back differ). */
export const REVIEW_BUILTIN_DECK_IDS = ['first-words', 'flags', 'capitals', 'ai-basics'] as const satisfies readonly BuiltinDeckId[];

/**
 * Key under which learning records of a deck are kept, or `undefined` if the deck is not reviewable.
 * "First words" is learned per learning language (`first-words:ja`); the translation language does not matter.
 * Flags, capitals and AI basics are language-independent knowledge; imported decks use their (unique) id.
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
    case 'capitals':
      return CAPITALS.map((entry) => entry.code.toLowerCase());
    case 'ai-basics':
      return AI_TERMS.map((entry) => entry.id);
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

/** "Capitals" as a deck: country name ↔ capital, both in `language`. Item ids are the flags deck's (`de`, `fr`, …). */
export function capitalsDeck(language: VocabularyLanguage): Deck {
  return {
    schemaVersion: 1,
    id: 'capitals',
    title: { en: 'Capitals', de: 'Hauptstädte' },
    license: 'Capital names: PolyForm-Perimeter-1.0.0 (authored for Worthwhile Play); country names: Unicode CLDR via the browser (Intl.DisplayNames)',
    source: 'Worthwhile Play; Unicode CLDR (provided by the browser)',
    items: CAPITALS.map((entry) => ({
      id: entry.code.toLowerCase(),
      front: { text: countryName(entry.code, language), lang: language },
      back: { text: entry.names[language], lang: language },
      category: 'geography'
    }))
  };
}

/** "AI basics" as a deck: term ↔ definition, both in `language`. */
export function aiBasicsDeck(language: VocabularyLanguage): Deck {
  return {
    schemaVersion: 1,
    id: 'ai-basics',
    title: { en: 'AI basics', de: 'KI-Grundbegriffe' },
    license: 'PolyForm-Perimeter-1.0.0 (authored for Worthwhile Play)',
    source: 'Worthwhile Play',
    items: AI_TERMS.map((entry) => ({
      id: entry.id,
      front: { text: entry.terms[language], lang: language },
      back: { text: entry.definitions[language], lang: language },
      category: 'ai'
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
    case 'capitals':
      return capitalsDeck(languages.ui);
    case 'ai-basics':
      return aiBasicsDeck(languages.ui);
  }
}

export { VOCABULARY_LANGUAGES };
