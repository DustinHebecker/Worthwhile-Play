import type { LocaleContent } from './types';
import { ru as fd } from './fd/ru';
import { ru as kz } from './kz/ru';
import { ru as of } from './of/ru';
import { ru as rw } from './rw/ru';
import { ru as sl } from './sl/ru';

/** Card texts of all worlds in this locale (one chunk; each world's texts live in `<world>/ru.ts`). */
export const ru: LocaleContent = { ...kz, ...sl, ...of, ...fd, ...rw };
