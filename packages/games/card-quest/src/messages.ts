import type { GameMessages } from '@wp/game-core';
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
import type { Catalogue } from './i18n/types';

/**
 * UI messages of Lootlings in all 16 locales (metadata.messages must be complete and synchronous).
 * English is the master; German is written directly; the others are transcreated from the master.
 * Card names and flavour lines are not here: they are per-locale content chunks (src/content, ADR 0011).
 */
const catalogues: Readonly<Record<string, Catalogue>> = { de, en, nl, es, fr, ru, 'zh-Hans': zhHans, ko, ja, ar, pt, it, pl, tr, uk, hi };

export const messages: GameMessages = catalogues;
