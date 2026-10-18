import type { LocaleContent } from './types';
import { ko as fd } from './fd/ko';
import { ko as kz } from './kz/ko';
import { ko as of } from './of/ko';
import { ko as rw } from './rw/ko';
import { ko as sl } from './sl/ko';

/** Card texts of all worlds in this locale (one chunk; each world's texts live in `<world>/ko.ts`). */
export const ko: LocaleContent = { ...kz, ...sl, ...of, ...fd, ...rw };
