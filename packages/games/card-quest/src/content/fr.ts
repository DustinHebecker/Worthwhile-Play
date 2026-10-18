import type { LocaleContent } from './types';
import { fr as kz } from './kz/fr';
import { fr as of } from './of/fr';
import { fr as sl } from './sl/fr';

/** Card texts of all worlds in this locale (one chunk; each world's texts live in `<world>/fr.ts`). */
export const fr: LocaleContent = { ...kz, ...sl, ...of };
