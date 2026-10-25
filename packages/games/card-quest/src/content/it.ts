import type { LocaleContent } from './types';
import { it as bg } from './bg/it';
import { it as fa } from './fa/it';
import { it as sc } from './sc/it';
import { it as fd } from './fd/it';
import { it as kz } from './kz/it';
import { it as of } from './of/it';
import { it as rw } from './rw/it';
import { it as sl } from './sl/it';

/** Card texts of all worlds in this locale (one chunk; each world's texts live in `<world>/it.ts`). */
export const it: LocaleContent = { ...kz, ...sl, ...of, ...fd, ...rw, ...bg, ...sc, ...fa };
