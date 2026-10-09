import type { LocaleContent } from './items';
import { content as ar } from './ar';
import { content as de } from './de';
import { content as en } from './en';
import { content as es } from './es';
import { content as fr } from './fr';
import { content as hi } from './hi';
import { content as it } from './it';
import { content as ja } from './ja';
import { content as ko } from './ko';
import { content as nl } from './nl';
import { content as pl } from './pl';
import { content as pt } from './pt';
import { content as ru } from './ru';
import { content as tr } from './tr';
import { content as uk } from './uk';
import { content as zhHans } from './zh-Hans';

/** Item texts per UI locale (ADR 0010: original content, bundled, keyed by language-independent ids). */
export const CONTENT: Readonly<Record<string, LocaleContent>> = { de, en, nl, es, fr, ru, 'zh-Hans': zhHans, ko, ja, ar, pt, it, pl, tr, uk, hi };

/** Texts for a UI locale, falling back to English. */
export function contentFor(locale: string): LocaleContent {
  return CONTENT[locale] ?? en;
}
