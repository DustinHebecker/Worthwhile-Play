import { createLocaleContent } from '@wp/game-core';
// Type only (erased at build time): makes the loader table below exhaustive for the 16 UI locales.
import type { SupportedLocale } from '@wp/localization';
import type { LocaleContent } from './types';

/**
 * Texts per UI locale (ADR 0010: original, all 16 locales). Every locale has the identical id structure of
 * `structure.ts` (checked by test/content.test.ts).
 *
 * One chunk per locale (ADR 0011): only the UI locale and the English fallback are loaded, by `preloadContent`,
 * which the host awaits before creating the game. Nothing here imports a locale file statically.
 */
export const CONTENT_LOADERS: Readonly<Record<SupportedLocale, () => Promise<LocaleContent>>> = {
  de: () => import('./de').then((m) => m.de),
  en: () => import('./en').then((m) => m.en),
  nl: () => import('./nl').then((m) => m.nl),
  es: () => import('./es').then((m) => m.es),
  fr: () => import('./fr').then((m) => m.fr),
  ru: () => import('./ru').then((m) => m.ru),
  'zh-Hans': () => import('./zh-Hans').then((m) => m.zhHans),
  ko: () => import('./ko').then((m) => m.ko),
  ja: () => import('./ja').then((m) => m.ja),
  ar: () => import('./ar').then((m) => m.ar),
  pt: () => import('./pt').then((m) => m.pt),
  it: () => import('./it').then((m) => m.it),
  pl: () => import('./pl').then((m) => m.pl),
  tr: () => import('./tr').then((m) => m.tr),
  uk: () => import('./uk').then((m) => m.uk),
  hi: () => import('./hi').then((m) => m.hi)
};

const store = createLocaleContent<LocaleContent>(CONTENT_LOADERS);

/** Loads the content of a UI locale and the English fallback (`GameModule.preload`). */
export const preloadContent = (locale: string): Promise<void> => store.preload(locale);

/** Content of a preloaded UI locale, falling back to English (synchronous; after `preloadContent`). */
export const contentFor = (locale: string): LocaleContent => store.get(locale);
