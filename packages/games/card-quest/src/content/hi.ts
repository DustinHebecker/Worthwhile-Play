import type { LocaleContent } from './types';
import { hi as kz } from './kz/hi';
import { hi as of } from './of/hi';
import { hi as sl } from './sl/hi';

/** Card texts of all worlds in this locale (one chunk; each world's texts live in `<world>/hi.ts`). */
export const hi: LocaleContent = { ...kz, ...sl, ...of };
