import type { LocaleContent } from './types';
import { de as bg } from './bg/de';
import { de as fa } from './fa/de';
import { de as sc } from './sc/de';
import { de as fd } from './fd/de';
import { de as kz } from './kz/de';
import { de as of } from './of/de';
import { de as rw } from './rw/de';
import { de as sl } from './sl/de';

/** Card texts of all worlds in this locale (one chunk; each world's texts live in `<world>/de.ts`). */
export const de: LocaleContent = { ...kz, ...sl, ...of, ...fd, ...rw, ...bg, ...sc, ...fa };
