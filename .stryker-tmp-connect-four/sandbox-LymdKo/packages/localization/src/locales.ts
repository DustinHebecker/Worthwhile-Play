/** The 16 UI locales, matching the Home Workout project. BCP-47 identifiers. */
// @ts-nocheck

export const SUPPORTED_LOCALES = ['de', 'en', 'nl', 'es', 'fr', 'ru', 'zh-Hans', 'ko', 'ja', 'ar', 'pt', 'it', 'pl', 'tr', 'uk', 'hi'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export type TextDirection = 'ltr' | 'rtl';

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export interface LocaleDefinition {
  code: SupportedLocale;
  direction: TextDirection;
  /** Language name as written by its speakers. */
  nativeName: string;
}

export const LOCALE_DEFINITIONS: readonly LocaleDefinition[] = [
  { code: 'de', direction: 'ltr', nativeName: 'Deutsch' },
  { code: 'en', direction: 'ltr', nativeName: 'English' },
  { code: 'nl', direction: 'ltr', nativeName: 'Nederlands' },
  { code: 'es', direction: 'ltr', nativeName: 'Español' },
  { code: 'fr', direction: 'ltr', nativeName: 'Français' },
  { code: 'ru', direction: 'ltr', nativeName: 'Русский' },
  { code: 'zh-Hans', direction: 'ltr', nativeName: '简体中文' },
  { code: 'ko', direction: 'ltr', nativeName: '한국어' },
  { code: 'ja', direction: 'ltr', nativeName: '日本語' },
  { code: 'ar', direction: 'rtl', nativeName: 'العربية' },
  { code: 'pt', direction: 'ltr', nativeName: 'Português' },
  { code: 'it', direction: 'ltr', nativeName: 'Italiano' },
  { code: 'pl', direction: 'ltr', nativeName: 'Polski' },
  { code: 'tr', direction: 'ltr', nativeName: 'Türkçe' },
  { code: 'uk', direction: 'ltr', nativeName: 'Українська' },
  { code: 'hi', direction: 'ltr', nativeName: 'हिन्दी' }
];

const supported = new Set<string>(SUPPORTED_LOCALES);

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && supported.has(value);
}

export function localeDirection(locale: SupportedLocale): TextDirection {
  return LOCALE_DEFINITIONS.find((d) => d.code === locale)?.direction ?? 'ltr';
}

/**
 * Maps an arbitrary BCP-47 tag to a supported UI locale, or `undefined` if there is
 * no match. Simplified-Chinese variants map to `zh-Hans`; traditional Chinese does not
 * (it would be wrong to show simplified characters to `zh-TW`/`zh-Hant` users).
 */
export function matchLocale(tag: string | null | undefined): SupportedLocale | undefined {
  if (!tag) return undefined;
  if (isSupportedLocale(tag)) return tag;
  const normalized = tag.replace(/_/g, '-').toLowerCase();
  if (normalized.startsWith('zh')) {
    if (normalized === 'zh' || normalized.startsWith('zh-hans') || normalized === 'zh-cn' || normalized === 'zh-sg') return 'zh-Hans';
    return undefined;
  }
  const base = normalized.split('-')[0];
  return isSupportedLocale(base) ? base : undefined;
}

/** Explicit fallback rule: stored choice → first matching browser language → English. */
export function resolveUiLocale(stored: string | null | undefined, browserLanguages: readonly string[]): SupportedLocale {
  if (isSupportedLocale(stored)) return stored;
  for (const language of browserLanguages) {
    const match = matchLocale(language);
    if (match) return match;
  }
  return DEFAULT_LOCALE;
}
