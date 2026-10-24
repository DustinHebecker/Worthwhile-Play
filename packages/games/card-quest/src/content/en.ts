import type { LocaleContent } from './types';
import { en as bg } from './bg/en';
import { en as fa } from './fa/en';
import { en as sc } from './sc/en';
import { en as fd } from './fd/en';
import { en as kz } from './kz/en';
import { en as of } from './of/en';
import { en as rw } from './rw/en';
import { en as sl } from './sl/en';

/** Card texts of all worlds in this locale (one chunk; each world's texts live in `<world>/en.ts`). */
export const en: LocaleContent = { ...kz, ...sl, ...of, ...fd, ...rw, ...bg, ...sc, ...fa };
