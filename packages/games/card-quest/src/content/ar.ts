import type { LocaleContent } from './types';
import { ar as fd } from './fd/ar';
import { ar as kz } from './kz/ar';
import { ar as of } from './of/ar';
import { ar as rw } from './rw/ar';
import { ar as sl } from './sl/ar';

/** Card texts of all worlds in this locale (one chunk; each world's texts live in `<world>/ar.ts`). */
export const ar: LocaleContent = { ...kz, ...sl, ...of, ...fd, ...rw };
