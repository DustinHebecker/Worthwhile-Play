import type { LocaleContent } from './types';
import { pt as bg } from './bg/pt';
import { pt as fa } from './fa/pt';
import { pt as sc } from './sc/pt';
import { pt as fd } from './fd/pt';
import { pt as kz } from './kz/pt';
import { pt as of } from './of/pt';
import { pt as rw } from './rw/pt';
import { pt as sl } from './sl/pt';

/** Card texts of all worlds in this locale (one chunk; each world's texts live in `<world>/pt.ts`). */
export const pt: LocaleContent = { ...kz, ...sl, ...of, ...fd, ...rw, ...bg, ...sc, ...fa };
