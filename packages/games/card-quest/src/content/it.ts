import type { LocaleContent } from './types';
import { it as kz } from './kz/it';
import { it as of } from './of/it';
import { it as sl } from './sl/it';

/** Card texts of all worlds in this locale (one chunk; each world's texts live in `<world>/it.ts`). */
export const it: LocaleContent = { ...kz, ...sl, ...of };
