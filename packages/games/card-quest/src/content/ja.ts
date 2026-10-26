import type { LocaleContent } from './types';
import { ja as bg } from './bg/ja';
import { ja as fa } from './fa/ja';
import { ja as sc } from './sc/ja';
import { ja as fd } from './fd/ja';
import { ja as kz } from './kz/ja';
import { ja as of } from './of/ja';
import { ja as rw } from './rw/ja';
import { ja as sl } from './sl/ja';

/** Card texts of all worlds in this locale (one chunk; each world's texts live in `<world>/ja.ts`). */
export const ja: LocaleContent = { ...kz, ...sl, ...of, ...fd, ...rw, ...bg, ...sc, ...fa };
