/**
 * Word languages: alphabet, on-screen keyboard layout and answer lists. Pure data,
 * no DOM. The word language is the content language and independent of the UI language.
 */
import { WORD_SOURCE } from './word-lists';

export const WORD_LANGUAGES = ['en', 'de'] as const;
export type WordLanguage = (typeof WORD_LANGUAGES)[number];

export const WORD_LENGTHS = [5, 6] as const;
export type WordLength = (typeof WORD_LENGTHS)[number];

export interface LanguageInfo {
  readonly id: WordLanguage;
  /** Language name as written by its speakers (shown untranslated, like a language menu). */
  readonly nativeName: string;
  /** Text direction of the words (the grid follows this, not the UI direction). */
  readonly direction: 'ltr' | 'rtl';
  /** Every letter that may appear in a guess, lowercase. */
  readonly alphabet: string;
  /** Rows of the familiar physical keyboard for this language (letters only). */
  readonly layout: readonly string[];
}

export const LANGUAGE_INFO: Readonly<Record<WordLanguage, LanguageInfo>> = {
  en: { id: 'en', nativeName: 'English', direction: 'ltr', alphabet: 'abcdefghijklmnopqrstuvwxyz', layout: ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'] },
  de: { id: 'de', nativeName: 'Deutsch', direction: 'ltr', alphabet: 'abcdefghijklmnopqrstuvwxyzäöü', layout: ['qwertzuiopü', 'asdfghjklöä', 'yxcvbnm'] }
};

const parse = (source: string): readonly string[] => Object.freeze(source.split(/\s+/).filter((word) => word.length > 0));

const LISTS: Readonly<Record<WordLanguage, Readonly<Record<WordLength, readonly string[]>>>> = {
  en: { 5: parse(WORD_SOURCE.en[5]), 6: parse(WORD_SOURCE.en[6]) },
  de: { 5: parse(WORD_SOURCE.de[5]), 6: parse(WORD_SOURCE.de[6]) }
};

export function isWordLanguage(value: unknown): value is WordLanguage {
  return typeof value === 'string' && (WORD_LANGUAGES as readonly string[]).includes(value);
}

/** The answer list for a language and word length. */
export function wordList(language: WordLanguage, length: WordLength): readonly string[] {
  return LISTS[language][length];
}

/** Whether `letter` is a single letter of the language's alphabet. */
export function isLetter(language: WordLanguage, letter: string): boolean {
  return letter.length === 1 && LANGUAGE_INFO[language].alphabet.includes(letter);
}

/** Default word language for a UI locale: the same language when we have words for it, else English. */
export function defaultLanguage(uiLocale: string): WordLanguage {
  const base = uiLocale.split('-')[0]?.toLowerCase();
  return isWordLanguage(base) ? base : 'en';
}
