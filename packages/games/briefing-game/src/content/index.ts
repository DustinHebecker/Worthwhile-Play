import type { ContentText } from './types';
import { content as de } from './de';
import { content as en } from './en';
import { content as nl } from './nl';
import { content as es } from './es';
import { content as fr } from './fr';
import { content as ru } from './ru';
import { content as zhHans } from './zh-Hans';
import { content as ko } from './ko';
import { content as ja } from './ja';
import { content as ar } from './ar';
import { content as pt } from './pt';
import { content as it } from './it';
import { content as pl } from './pl';
import { content as tr } from './tr';
import { content as uk } from './uk';
import { content as hi } from './hi';

export type { ContentText, SituationText } from './types';

/** Situation wording per UI locale (ADR 0010). Ids and counts are checked for parity by the content tests. */
export const CONTENT: Readonly<Record<string, ContentText>> = {
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

export function contentFor(locale: string): ContentText {
  return CONTENT[locale] ?? en;
}
