import type { LocaleContent } from './types';
import { nl as kz } from './kz/nl';
import { nl as of } from './of/nl';
import { nl as sl } from './sl/nl';

/** Card texts of all worlds in this locale (one chunk; each world's texts live in `<world>/nl.ts`). */
export const nl: LocaleContent = { ...kz, ...sl, ...of };
