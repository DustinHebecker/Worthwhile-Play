import { createLocaleContent } from '@wp/game-core';
// Type only (erased at build time): makes the loader table below exhaustive for the 16 UI locales.
import type { SupportedLocale } from '@wp/localization';
import type { ContentText } from './types';

export type { ContentText, PieceText } from './types';

/**
 * Piece wording per UI locale (ADR 0010). Ids and counts are checked for parity by the content tests.
 *
 * One chunk per locale (ADR 0011): only the UI locale and the English fallback are loaded, by `preloadContent`,
 * which the host awaits before creating the game. Nothing here imports a locale file statically.
 */
export const CONTENT_LOADERS: Readonly<Record<SupportedLocale, () => Promise<ContentText>>> = {
  de: () => import('./de').then((m) => m.content),
  en: () => import('./en').then((m) => m.content),
  nl: () => import('./nl').then((m) => m.content),
  es: () => import('./es').then((m) => m.content),
  fr: () => import('./fr').then((m) => m.content),
  ru: () => import('./ru').then((m) => m.content),
  'zh-Hans': () => import('./zh-Hans').then((m) => m.content),
  ko: () => import('./ko').then((m) => m.content),
  ja: () => import('./ja').then((m) => m.content),
  ar: () => import('./ar').then((m) => m.content),
  pt: () => import('./pt').then((m) => m.content),
  it: () => import('./it').then((m) => m.content),
  pl: () => import('./pl').then((m) => m.content),
  tr: () => import('./tr').then((m) => m.content),
  uk: () => import('./uk').then((m) => m.content),
  hi: () => import('./hi').then((m) => m.content)
};

const store = createLocaleContent<ContentText>(CONTENT_LOADERS);

/** Loads the content of a UI locale and the English fallback (`GameModule.preload`). */
export const preloadContent = (locale: string): Promise<void> => store.preload(locale);

/** Content of a preloaded UI locale, falling back to English (synchronous; after `preloadContent`). */
export const contentFor = (locale: string): ContentText => store.get(locale);
