import type { LocaleContent } from './types';
import { tr as bg } from './bg/tr';
import { tr as fa } from './fa/tr';
import { tr as sc } from './sc/tr';
import { tr as fd } from './fd/tr';
import { tr as kz } from './kz/tr';
import { tr as of } from './of/tr';
import { tr as rw } from './rw/tr';
import { tr as sl } from './sl/tr';

/** Card texts of all worlds in this locale (one chunk; each world's texts live in `<world>/tr.ts`). */
export const tr: LocaleContent = { ...kz, ...sl, ...of, ...fd, ...rw, ...bg, ...sc, ...fa };
