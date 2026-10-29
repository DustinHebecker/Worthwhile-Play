import { createLocaleContent, type Translator } from '@wp/game-core';
// Type only (erased at build time): makes the loader table below exhaustive for the 16 UI locales.
import type { SupportedLocale } from '@wp/localization';
import type { BalanceContent } from './types';

export type { BalanceContent, ContentKey } from './types';

/**
 * The in-game texts of Weight & Balance per UI locale. The catalogue and start-screen texts (title, tagline, rules,
 * difficulty and settings labels) stay in `../locales`, because the host shows them before the game is loaded.
 *
 * One chunk per locale (ADR 0011): only the UI locale and the English fallback are loaded, by `preloadContent`,
 * which the host awaits before creating the game. Nothing here imports a locale file statically.
 */
export const CONTENT_LOADERS: Readonly<Record<SupportedLocale, () => Promise<BalanceContent>>> = {
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

const store = createLocaleContent<BalanceContent>(CONTENT_LOADERS);

/** Loads the content of a UI locale and the English fallback (`GameModule.preload`). */
export const preloadContent = (locale: string): Promise<void> => store.preload(locale);

/** Content of a preloaded UI locale, falling back to English (synchronous; after `preloadContent`). */
export const contentFor = (locale: string): BalanceContent => store.get(locale);

const PLACEHOLDER = /\{(\w+)\}/g;

/**
 * The view's translator: in-game keys come from the preloaded content of `t.locale` (English when that locale could
 * not be loaded), every other key (catalogue, settings labels, `common.*`) from the host's translator `t`. Placeholders
 * are filled like the host's translator does.
 */
export function withContent(t: Translator): Translator {
  const content: Readonly<Record<string, string>> = contentFor(t.locale);
  const translate = (key: string, params?: Readonly<Record<string, string | number>>): string => {
    const template = Object.hasOwn(content, key) ? content[key] : undefined;
    if (template === undefined) return t(key, params);
    return params ? template.replace(PLACEHOLDER, (match, name: string) => (Object.hasOwn(params, name) ? String(params[name]) : match)) : template;
  };
  return Object.assign(translate, { locale: t.locale, direction: t.direction });
}
