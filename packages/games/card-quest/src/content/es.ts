import type { LocaleContent } from './types';
import { es as kz } from './kz/es';
import { es as of } from './of/es';
import { es as sl } from './sl/es';

/** Card texts of all worlds in this locale (one chunk; each world's texts live in `<world>/es.ts`). */
export const es: LocaleContent = { ...kz, ...sl, ...of };
