import type { Locale } from '../art/types';
import { ar } from './ar';
import { de } from './de';
import { en, type Catalogue } from './en';
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

/** The message catalogue of every locale (without the motif titles, which `messages.ts` adds from the motif cards). */
export const CATALOGUES: Readonly<Record<Locale, Catalogue>> = { en, de, nl, es, fr, ru, 'zh-Hans': zhHans, ko, ja, ar, pt, it, pl, tr, uk, hi };
