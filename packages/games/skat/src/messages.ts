import { withCardMessages } from '@wp/cards';
import type { GameMessages } from '@wp/game-core';
import { de, en } from './messages/en-de';
import { es, fr, it, nl, pt } from './messages/romance-nl';
import { pl, ru, tr, uk } from './messages/slavic-tr';
import { ar, hi, ja, ko, zhHans } from './messages/asia-ar';

/**
 * Sentences whose subject can be the person. Each has a `<key>.you` variant in every locale with the verb in
 * the second person ("Du gewinnst", "You win"); the view uses it instead of inserting "Du"/"You" as {player}.
 * Sentences of the form "{player}: …" need no variant.
 */
export const PERSON_KEYS = [
  'log.bid',
  'log.pass',
  'log.pickup',
  'log.hand',
  'log.discard',
  'log.declare',
  'log.trick',
  'contract.line',
  'trick.last',
  'outcome.won',
  'outcome.lost',
  'outcome.nullWon',
  'outcome.nullLost',
  'outcome.durchmarsch',
  'announce.newDeal'
] as const;
export type PersonKey = (typeof PERSON_KEYS)[number];

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
