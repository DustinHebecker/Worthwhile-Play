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
 * UI translations of Estimation Lab, one file per locale in ./locales (each typed against the English keys).
 * Task wording lives in `content/<locale>.ts` (ADR 0010/0011).
 * Translator notes: `u.<id>` is a unit word in its per-unit form ("g/grain", "L/day"); the form after a number
 * ("1 grain", "40,000 grains") and the "times too high/low" sentences have plural forms in the content
 * (`counts`, `ratios`). SI symbols (m, kg, W, kWh …) are not translated. "Fermi estimate" names the method after
 * Enrico Fermi. Other counts are phrased as "label: {n}" or "{n} of {total}" so no plural forms are needed there.
 */
export const messages: GameMessages = { en, de, nl, es, fr, ru, 'zh-Hans': zhHans, ko, ja, ar, pt, it, pl, tr, uk, hi };
