import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from '@wp/localization';
import type { LearningCatalogue } from './learning/en';
import type { UiCatalogue } from './ui/en';

export type { UiKey, UiCatalogue } from './ui/en';
export type { LearningUiKey, LearningCatalogue } from './learning/en';

/** Everything the shell needs in one locale: one chunk per locale (`./locales/<locale>.ts`). */
export interface LocaleMessages {
  readonly ui: UiCatalogue;
  readonly learning: LearningCatalogue;
  /** Catalogue messages (title, tagline, rules, difficulty labels) per game id (apps/web/catalogue-plugin.ts). */
  readonly games: Readonly<Record<string, Readonly<Record<string, string>>>>;
}

/**
 * Per-locale loaders. Each locale is a separate chunk, so the main chunk carries no translations; the service
 * worker precaches all of them, so switching the language works offline.
 */
export const LOCALE_LOADERS: Readonly<Record<SupportedLocale, () => Promise<LocaleMessages>>> = {
  de: () => import('./locales/de'),
  en: () => import('./locales/en'),
  nl: () => import('./locales/nl'),
  es: () => import('./locales/es'),
  fr: () => import('./locales/fr'),
  ru: () => import('./locales/ru'),
  'zh-Hans': () => import('./locales/zh-Hans'),
  ko: () => import('./locales/ko'),
  ja: () => import('./locales/ja'),
  ar: () => import('./locales/ar'),
  pt: () => import('./locales/pt'),
  it: () => import('./locales/it'),
  pl: () => import('./locales/pl'),
  tr: () => import('./locales/tr'),
  uk: () => import('./locales/uk'),
  hi: () => import('./locales/hi')
};

const ui: Partial<Record<SupportedLocale, UiCatalogue>> = {};
const learning: Partial<Record<SupportedLocale, LearningCatalogue>> = {};
const games: Record<string, Record<string, Readonly<Record<string, string>>>> = {};
const pending = new Map<SupportedLocale, Promise<void>>();

/** Shell UI messages of the locales loaded so far (translator source; filled by `loadLocale`). */
export const UI_MESSAGES: Readonly<Partial<Record<SupportedLocale, UiCatalogue>>> = ui;
/** Deck-page messages ("Items worth reviewing") of the locales loaded so far. */
export const LEARNING_UI_MESSAGES: Readonly<Partial<Record<SupportedLocale, LearningCatalogue>>> = learning;

/**
 * The catalogue messages of one game, per locale, as a live object: locales appear in it as they are loaded.
 * The registry uses it as `metadata.messages` of its catalogue entries.
 */
export const gameCatalogueMessages = (gameId: string): Readonly<Record<string, Readonly<Record<string, string>>>> => (games[gameId] ??= {});

export const isLocaleLoaded = (locale: SupportedLocale): boolean => locale in ui;

function loadOne(locale: SupportedLocale): Promise<void> {
  let promise = pending.get(locale);
  if (!promise) {
    promise = LOCALE_LOADERS[locale]().then((messages) => {
      ui[locale] = messages.ui;
      learning[locale] = messages.learning;
      for (const [id, table] of Object.entries(messages.games)) (games[id] ??= {})[locale] = table;
    });
    // A failed load (e.g. offline before the chunk was cached) may be retried later.
    promise.catch(() => pending.delete(locale));
    pending.set(locale, promise);
  }
  return promise;
}

/**
 * Loads the messages of `locale` and of English (the reported fallback safety net of the translator) before
 * anything is rendered in that locale. An unsupported locale resolves to English. Resolves to the locale that
 * can be used: if only the requested locale fails to load, English; rejects only if English cannot be loaded
 * either (the app then has no text to show).
 */
export async function loadLocale(requested: string): Promise<SupportedLocale> {
  const locale = isSupportedLocale(requested) ? requested : DEFAULT_LOCALE;
  const [wanted, fallback] = await Promise.allSettled([loadOne(locale), loadOne(DEFAULT_LOCALE)]);
  if (wanted.status === 'fulfilled' && fallback.status === 'fulfilled') return locale;
  if (wanted.status === 'rejected') console.error(wanted.reason);
  if (fallback.status === 'rejected') {
    console.error(fallback.reason);
    if (wanted.status === 'fulfilled') return locale;
    throw fallback.reason;
  }
  return DEFAULT_LOCALE;
}
