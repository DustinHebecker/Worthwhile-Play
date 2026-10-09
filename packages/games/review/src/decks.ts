import type { GameContentLanguages, Translator, UserDeckSource } from '@wp/game-core';
import {
  builtinItemIds,
  capitalName,
  countryName,
  findWord,
  flagEmoji,
  isVocabularyLanguage,
  resolveContentLanguages,
  validateDeck,
  type CardSide,
  type Deck,
  type LearningItem
} from '@wp/learning-content';
import { BUILTIN_REVIEW_DECKS, type ReviewCard, type ReviewLanguages, type ReviewState } from './rules';

export const isBuiltinReviewDeck = (id: string): boolean => (BUILTIN_REVIEW_DECKS as readonly string[]).includes(id);

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

/** Item ids of a deck that can be reviewed (built-in or available user deck), or undefined. */
export function deckItemIds(deckId: string, userDecks: UserDeckSource | undefined): readonly string[] | undefined {
  if (isBuiltinReviewDeck(deckId)) return builtinItemIds(deckId);
  return userDeck(userDecks, deckId)?.items.map((item) => item.id);
}

/** Content languages to fix for a new session on a built-in deck (Memory uses the same fallbacks). */
export function sessionLanguages(deckId: string, choice: GameContentLanguages | undefined, uiLocale: string): { languages: ReviewLanguages; learningFallback: boolean } {
  const resolved = resolveContentLanguages(choice, uiLocale);
  if (deckId === 'first-words') return { languages: { learning: resolved.learning, translation: resolved.translation }, learningFallback: resolved.learningFallback };
  if (deckId === 'flags') return { languages: { countries: resolved.countries }, learningFallback: false };
  // Capital names exist in the 16 "First words" languages only, so "Capitals" follows the learning language.
  if (deckId === 'capitals') return { languages: { learning: resolved.learning }, learningFallback: resolved.learningFallback };
  return { languages: {}, learningFallback: false };
}

export interface Face {
  side: CardSide;
  /** Accessible description (never reveals the other side). */
  description: string;
}

export interface CardFaces {
  prompt: Face;
  answer: Face;
}

/** Resolves both faces of a card, or `undefined` for the whole state when its deck is not available. */
export type FaceResolver = (card: ReviewCard) => CardFaces;

const uiVocabulary = (locale: string) => (isVocabularyLanguage(locale) ? locale : 'en');

const textFace = (side: CardSide, t: Translator): Face => ({ side, description: side.text ?? side.alt ?? t('card.image') });

export function faceResolver(state: Pick<ReviewState, 'deckId' | 'languages'>, t: Translator, userDecks: UserDeckSource | undefined): FaceResolver | undefined {
  const orient = (front: Face, back: Face, card: ReviewCard): CardFaces => (card.dir === 'forward' ? { prompt: front, answer: back } : { prompt: back, answer: front });
  switch (state.deckId) {
    case 'first-words': {
      const { learning, translation } = state.languages;
      if (!learning || !translation || !isVocabularyLanguage(learning) || !isVocabularyLanguage(translation)) return undefined;
      return (card) => {
        const entry = findWord(card.item);
        if (!entry) return { prompt: { side: {}, description: '' }, answer: { side: {}, description: '' } };
        const word = entry.words[learning];
        const meaning = entry.words[translation];
        // The picture would give the meaning away, so it is shown with the answer only.
        const picture = t('card.picture', { name: entry.words[uiVocabulary(t.locale)] });
        const front: Face = { side: { text: word, lang: learning }, description: word };
        const back: Face = { side: { text: meaning, lang: translation }, description: meaning };
        const withPicture = (face: Face): Face => ({ side: { ...face.side, symbol: entry.emoji }, description: `${face.description} (${picture})` });
        return card.dir === 'forward' ? { prompt: front, answer: withPicture(back) } : { prompt: back, answer: withPicture(front) };
      };
    }
    case 'flags': {
      const language = state.languages.countries ?? t.locale;
      return (card) => {
        const code = card.item.toUpperCase();
        const name = countryName(code, language);
        const flag = flagEmoji(code);
        const nameFace: Face = { side: { text: name, lang: language }, description: name };
        // A flag shown as the question must not carry the country name in its label.
        if (card.dir === 'forward') return { prompt: { side: { symbol: flag }, description: t('card.flag') }, answer: { side: { symbol: flag, text: name, lang: language }, description: t('card.flagOf', { name }) } };
        return { prompt: nameFace, answer: { side: { symbol: flag }, description: t('card.flagOf', { name: countryName(code, t.locale) }) } };
      };
    }
    case 'capitals': {
      const { learning } = state.languages;
      if (!learning || !isVocabularyLanguage(learning)) return undefined;
      return (card) => {
        const code = card.item.toUpperCase();
        const country = countryName(code, learning);
        const capital = capitalName(code, learning) ?? '';
        const front: Face = { side: { text: country, lang: learning }, description: country };
        const back: Face = { side: { text: capital, lang: learning }, description: capital };
        return orient(front, back, card);
      };
    }
    default: {
      const deck = userDeck(userDecks, state.deckId);
      if (!deck) return undefined;
      const items = new Map<string, LearningItem>(deck.items.map((item) => [item.id, item]));
      return (card) => {
        const item = items.get(card.item);
        return orient(textFace(item?.front ?? {}, t), textFace(item?.back ?? {}, t), card);
      };
    }
  }
}

/** True when every card of the state exists in its deck (a re-imported or edited deck may have lost items). */
export function hasAllItems(state: Pick<ReviewState, 'deckId' | 'cards'>, userDecks: UserDeckSource | undefined): boolean {
  const ids = deckItemIds(state.deckId, userDecks);
  if (!ids) return false;
  const set = new Set(ids);
  return state.cards.every((card) => set.has(card.item));
}
