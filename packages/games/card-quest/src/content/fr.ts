import type { LocaleContent } from './types';
import { fr as bg } from './bg/fr';
import { fr as fa } from './fa/fr';
import { fr as sc } from './sc/fr';
import { fr as fd } from './fd/fr';
import { fr as kz } from './kz/fr';
import { fr as of } from './of/fr';
import { fr as rw } from './rw/fr';
import { fr as sl } from './sl/fr';

/** Card texts of all worlds in this locale (one chunk; each world's texts live in `<world>/fr.ts`). */
export const fr: LocaleContent = { ...kz, ...sl, ...of, ...fd, ...rw, ...bg, ...sc, ...fa };
