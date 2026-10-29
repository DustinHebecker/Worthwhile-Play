import { createLocaleContent, type Translator } from '@wp/game-core';
// Type only (erased at build time): makes the loader table below exhaustive for the 16 UI locales.
import type { SupportedLocale } from '@wp/localization';
import type { ContentText } from './types';

export type { ContentText } from './types';

/**
 * Names, sentences and in-game texts per UI locale (ADR 0011): one chunk per locale; only the UI locale and the English fallback are
 * loaded, by `preloadContent`, which the game's `preload` awaits together with the atlas.
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

/** Loads the content of a UI locale and the English fallback. */
export const preloadContent = (locale: string): Promise<void> => store.preload(locale);

/** Content of a preloaded UI locale, falling back to English (synchronous; after `preloadContent`). */
export const contentFor = (locale: string): ContentText => store.get(locale);

const PLACEHOLDER = /\{(\w+)\}/g;

/**
 * The view's translator: in-game keys come from the preloaded `text` of `t.locale` (English when that locale could not
 * be loaded), every other key (catalogue and start-screen texts, `common.*`) from the host's translator `t`.
 * Placeholders are filled like the host's translator does: a missing parameter stays visible as its placeholder.
 */
export function withContent(t: Translator): Translator {
  const text: Readonly<Record<string, string>> = contentFor(t.locale).text;
  const translate = (key: string, params?: Readonly<Record<string, string | number>>): string => {
    const template = Object.hasOwn(text, key) ? text[key] : undefined;
    if (template === undefined) return t(key, params);
    return params ? template.replace(PLACEHOLDER, (match, name: string) => (Object.hasOwn(params, name) ? String(params[name]) : match)) : template;
  };
  return Object.assign(translate, { locale: t.locale, direction: t.direction });
}
