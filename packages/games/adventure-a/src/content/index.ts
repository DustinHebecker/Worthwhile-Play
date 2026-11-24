import { createLocaleContent } from '@wp/game-core';
import type { Catalogue } from '@wp/adventure-engine';
// Type only (erased at build time): makes the loader table exhaustive for the 16 UI locales.
import type { SupportedLocale } from '@wp/localization';

/**
 * Story texts per UI locale (ADR 0011: one chunk per locale; only the UI locale and English are loaded).
 * Keys are derived from the structure (`textKeys`); the content test checks every locale against them.
 */
export const CONTENT_LOADERS: Readonly<Record<SupportedLocale, () => Promise<Catalogue>>> = {
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

export const content = createLocaleContent<Catalogue>(CONTENT_LOADERS);
