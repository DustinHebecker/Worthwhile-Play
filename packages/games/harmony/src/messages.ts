import type { GameMessages } from '@wp/game-core';
import { ar } from './locales/ar';
import { de } from './locales/de';
import { en } from './locales/en';
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
 * UI texts of Tones & Chords, one file per locale in ./locales (each typed against the English keys). Music terms,
 * tips and explanations live in `content/<locale>.ts` (ADR 0011). Counts are phrased as "label: {n}", so only the
 * content's semitone and cent forms need plurals.
 */
export const messages: GameMessages = { en, de, nl, es, fr, ru, 'zh-Hans': zhHans, ko, ja, ar, pt, it, pl, tr, uk, hi };
