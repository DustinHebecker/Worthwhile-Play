import { resolveUiLocale, type SupportedLocale } from './locales';

/**
 * Language preferences. UI language and content (learning) languages are stored
 * independently: changing the UI language never changes what a user is learning.
 * Content languages accept any BCP-47 tag, not only the 16 UI locales.
 */
export const STORAGE_KEYS = {
  uiLocale: 'worthwhile-play:ui-locale',
  learningLanguage: 'worthwhile-play:learning-language',
  translationLanguage: 'worthwhile-play:translation-language'
} as const;

type KV = Pick<Storage, 'getItem' | 'setItem'>;

function safeGet(storage: KV, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage: KV, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // Storage may be unavailable (private mode, quota). Preferences then last for the session only.
  }
}

export function readUiLocale(storage: KV, browserLanguages: readonly string[]): SupportedLocale {
  return resolveUiLocale(safeGet(storage, STORAGE_KEYS.uiLocale), browserLanguages);
}

export function writeUiLocale(storage: KV, locale: SupportedLocale): void {
  safeSet(storage, STORAGE_KEYS.uiLocale, locale);
}

const BCP47 = /^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/;

export function isLanguageTag(value: unknown): value is string {
  return typeof value === 'string' && BCP47.test(value);
}

export interface ContentLanguages {
  /** Language being learned, e.g. `ja`. */
  learning: string | undefined;
  /** Language translations are shown in, e.g. `en`. Defaults to the UI locale at use site. */
  translation: string | undefined;
}

export function readContentLanguages(storage: KV): ContentLanguages {
  const learning = safeGet(storage, STORAGE_KEYS.learningLanguage);
  const translation = safeGet(storage, STORAGE_KEYS.translationLanguage);
  return {
    learning: isLanguageTag(learning) ? learning : undefined,
    translation: isLanguageTag(translation) ? translation : undefined
  };
}

export function writeContentLanguages(storage: KV, value: Partial<ContentLanguages>): void {
  if (value.learning !== undefined && isLanguageTag(value.learning)) safeSet(storage, STORAGE_KEYS.learningLanguage, value.learning);
  if (value.translation !== undefined && isLanguageTag(value.translation)) safeSet(storage, STORAGE_KEYS.translationLanguage, value.translation);
}
