import type { LocaleContent } from './types';
import { pl as bg } from './bg/pl';
import { pl as fa } from './fa/pl';
import { pl as sc } from './sc/pl';
import { pl as fd } from './fd/pl';
import { pl as kz } from './kz/pl';
import { pl as of } from './of/pl';
import { pl as rw } from './rw/pl';
import { pl as sl } from './sl/pl';

/** Card texts of all worlds in this locale (one chunk; each world's texts live in `<world>/pl.ts`). */
export const pl: LocaleContent = { ...kz, ...sl, ...of, ...fd, ...rw, ...bg, ...sc, ...fa };
