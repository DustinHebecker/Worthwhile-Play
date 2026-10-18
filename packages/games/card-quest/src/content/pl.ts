import type { LocaleContent } from './types';
import { pl as kz } from './kz/pl';
import { pl as of } from './of/pl';
import { pl as sl } from './sl/pl';

/** Card texts of all worlds in this locale (one chunk; each world's texts live in `<world>/pl.ts`). */
export const pl: LocaleContent = { ...kz, ...sl, ...of };
