import type { GameMessages } from '@wp/game-core';
import { LOCALES, type Locale } from './art/types';
import { CATALOGUE } from './catalogue';
import { ar } from './locales/ar';
import { de } from './locales/de';
import { en, type Catalogue } from './locales/en';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { hi } from './locales/hi';
import { it } from './locales/it';
import { ja } from './locales/ja';
import { ko } from './locales/ko';
import { nl } from './locales/nl';
import { pl } from './locales/pl';
import { pt } from './locales/pt';
import { ru } from './locales/ru';
import { tr } from './locales/tr';
import { uk } from './locales/uk';
import { zhHans } from './locales/zh-Hans';

/**
 * Translations of Pixel Peel, one file per locale in ./locales (each typed against the English keys). The start-screen
 * labels `motif.<id>` are the motif titles, generated here from the motif cards (titles in every locale), so adding a
 * motif needs no message change; the group labels (`group.<group>`, `motif.any-<group>`) are in the catalogues. The number of colours is shown in the game's title line (`title.colours`), where it
 * is the number actually played.
 * Translator notes: a "shooter" is a small token that runs around the picture and removes pixels of its colour;
 * "waiting place" is a parking spot for a shooter that still has shots; "parking" means moving a shooter aside;
 * "peeling" (display option) is how a launch is drawn: slowly pixel by pixel, quickly, or not at all.
 * Colour names are lower case where the language allows, because they appear inside sentences.
 */
const CATALOGUES: Record<Locale, Catalogue> = { en, de, nl, es, fr, ru, 'zh-Hans': zhHans, ko, ja, ar, pt, it, pl, tr, uk, hi };

function withMotifs(locale: Locale): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const card of CATALOGUE) labels[`motif.${card.id}`] = card.title[locale];
  return { ...CATALOGUES[locale], ...labels };
}

export const messages: GameMessages = Object.fromEntries(LOCALES.map((locale) => [locale, withMotifs(locale)]));
