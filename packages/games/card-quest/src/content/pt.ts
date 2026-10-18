import type { LocaleContent } from './types';
import { pt as kz } from './kz/pt';
import { pt as of } from './of/pt';
import { pt as sl } from './sl/pt';

/** Card texts of all worlds in this locale (one chunk; each world's texts live in `<world>/pt.ts`). */
export const pt: LocaleContent = { ...kz, ...sl, ...of };
