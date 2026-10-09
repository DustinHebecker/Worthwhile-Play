import type { LocaleContent } from './types';
import { ar } from './ar';
import { de } from './de';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { hi } from './hi';
import { it } from './it';
import { ja } from './ja';
import { ko } from './ko';
import { nl } from './nl';
import { pl } from './pl';
import { pt } from './pt';
import { ru } from './ru';
import { tr } from './tr';
import { uk } from './uk';
import { zhHans } from './zh-Hans';

/**
 * Texts per UI locale (ADR 0010: bundled, original, all 16 locales). Every locale has the identical id
 * structure of `structure.ts` (checked by test/content.test.ts).
 */
export const CONTENT: Readonly<Record<string, LocaleContent>> = {
  de,
  en,
  nl,
  es,
  fr,
  ru,
  'zh-Hans': zhHans,
  ko,
  ja,
  ar,
  pt,
  it,
  pl,
  tr,
  uk,
  hi
};

/** Content for a UI locale, falling back to English for unknown locales. */
export const contentFor = (locale: string): LocaleContent => CONTENT[locale] ?? en;
