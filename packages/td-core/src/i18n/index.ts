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
 * Names and descriptions of the shared towers, units and target priorities in all 16 locales
 * (keys `tower.*`, `about.*`, `enemy.*`, `enemyAbout.*`, `target.*`). Tower Defense and the hybrid
 * merge them into their own catalogues, so both games call things the same. English is the source,
 * the others are AI-assisted.
 */
export const UNIT_MESSAGES: Readonly<Record<string, Readonly<Record<string, string>>>> = { en, de, nl, es, fr, ru, 'zh-Hans': zhHans, ko, ja, ar, pt, it, pl, tr, uk, hi };

/** A game's catalogue with the shared unit texts added (the game's own keys win). */
export function withUnitMessages(own: Readonly<Record<string, Readonly<Record<string, string>>>>): Record<string, Record<string, string>> {
  return Object.fromEntries(Object.entries(own).map(([locale, texts]) => [locale, { ...UNIT_MESSAGES[locale], ...texts }]));
}

export type { UnitMessageKey } from './en';
