import { withCardMessages } from '@wp/cards';
import type { GameMessages } from '@wp/game-core';
import { de, en } from './messages/en-de';
import { es, fr, it, nl, pt } from './messages/romance-nl';
import { pl, ru, tr, uk } from './messages/slavic-tr';
import { ar, hi, ja, ko, zhHans } from './messages/asia-ar';

/**
 * Skat strings in all 16 UI locales, plus the shared card vocabulary (`cards.*`, via `withCardMessages`).
 * Skat is a German game: German has the original terms; other languages use their established Skat words
 * where they exist and otherwise keep the German terms (Reizen, Hand, Schneider, Schwarz, Ramsch …), which the
 * help text explains.
 */
export const messages: GameMessages = withCardMessages({
  en,
  de,
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
});
