import type { GameMessages } from '@wp/game-core';
import { ar } from './messages/ar';
import { de } from './messages/de';
import { en } from './messages/en';
import { es } from './messages/es';
import { fr } from './messages/fr';
import { hi } from './messages/hi';
import { it } from './messages/it';
import { ja } from './messages/ja';
import { ko } from './messages/ko';
import { nl } from './messages/nl';
import { pl } from './messages/pl';
import { pt } from './messages/pt';
import { ru } from './messages/ru';
import { tr } from './messages/tr';
import { uk } from './messages/uk';
import { zhHans } from './messages/zh-Hans';

/**
 * UI translations for Compression Challenge, one file per locale. Piece wording lives in `content/<locale>.ts`
 * (ADR 0010). Counts are phrased as "Label: {n}" so no plural forms are needed.
 */
export const messages: GameMessages = { en, de, nl, es, fr, ru, 'zh-Hans': zhHans, ko, ja, ar, pt, it, pl, tr, uk, hi };
