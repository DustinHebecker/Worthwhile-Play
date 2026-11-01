import type { GameMessages } from '@wp/game-core';
import { withUnitMessages } from '@wp/td-core';
import { ar } from './i18n/ar';
import { de } from './i18n/de';
import { en } from './i18n/en';
import { es } from './i18n/es';
import { fr } from './i18n/fr';
import { hi } from './i18n/hi';
import { it } from './i18n/it';
import { ja } from './i18n/ja';
import { ko } from './i18n/ko';
import { nl } from './i18n/nl';
import { pl } from './i18n/pl';
import { pt } from './i18n/pt';
import { ru } from './i18n/ru';
import { tr } from './i18n/tr';
import { uk } from './i18n/uk';
import { zhHans } from './i18n/zh-Hans';

/**
 * Translations for Tower Defense; English is the source (src/i18n/en.ts), the others are AI-assisted.
 * Tower, unit and target texts come from @wp/td-core (shared with the hybrid).
 */
export const messages: GameMessages = withUnitMessages({ en, de, nl, es, fr, ru, 'zh-Hans': zhHans, ko, ja, ar, pt, it, pl, tr, uk, hi });
