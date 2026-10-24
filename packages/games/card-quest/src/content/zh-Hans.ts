import type { LocaleContent } from './types';
import { zhHans as fd } from './fd/zh-Hans';
import { zhHans as kz } from './kz/zh-Hans';
import { zhHans as of } from './of/zh-Hans';
import { zhHans as rw } from './rw/zh-Hans';
import { zhHans as sl } from './sl/zh-Hans';

/** Card texts of all worlds in this locale (one chunk; each world's texts live in `<world>/zh-Hans.ts`). */
export const zhHans: LocaleContent = { ...kz, ...sl, ...of, ...fd, ...rw };
