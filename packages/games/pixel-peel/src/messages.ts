import type { GameMessages } from '@wp/game-core';
import { MOTIFS } from './motifs/index';
import { LOCALES, type Locale } from './motifs/types';
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
 * labels `motif.<id>` ("Red fox · 4 colours") are generated here from the motif data (titles in every locale) and the
 * translated `motif.label` pattern, so adding a motif needs no message change.
 * Translator notes: a "shooter" is a small token that runs around the picture and removes pixels of its colour;
 * "waiting place" is a parking spot for a shooter that still has shots; "parking" means moving a shooter aside.
 * Colour names are lower case where the language allows, because they appear inside sentences.
 */
const CATALOGUES: Record<Locale, Catalogue> = { en, de, nl, es, fr, ru, 'zh-Hans': zhHans, ko, ja, ar, pt, it, pl, tr, uk, hi };

const fill = (template: string, params: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));

function withMotifs(locale: Locale): Record<string, string> {
  const catalogue = CATALOGUES[locale];
  const labels: Record<string, string> = {};
  for (const motif of MOTIFS) labels[`motif.${motif.id}`] = fill(catalogue['motif.label'], { title: motif.title[locale], n: Object.keys(motif.palette).length });
  return { ...catalogue, ...labels };
}

export const messages: GameMessages = Object.fromEntries(LOCALES.map((locale) => [locale, withMotifs(locale)]));
