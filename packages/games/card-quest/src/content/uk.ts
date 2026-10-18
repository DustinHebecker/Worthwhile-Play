import type { LocaleContent } from './types';
import { uk as fd } from './fd/uk';
import { uk as kz } from './kz/uk';
import { uk as of } from './of/uk';
import { uk as rw } from './rw/uk';
import { uk as sl } from './sl/uk';

/** Card texts of all worlds in this locale (one chunk; each world's texts live in `<world>/uk.ts`). */
export const uk: LocaleContent = { ...kz, ...sl, ...of, ...fd, ...rw };
