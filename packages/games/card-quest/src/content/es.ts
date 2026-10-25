import type { LocaleContent } from './types';
import { es as bg } from './bg/es';
import { es as fa } from './fa/es';
import { es as sc } from './sc/es';
import { es as fd } from './fd/es';
import { es as kz } from './kz/es';
import { es as of } from './of/es';
import { es as rw } from './rw/es';
import { es as sl } from './sl/es';

/** Card texts of all worlds in this locale (one chunk; each world's texts live in `<world>/es.ts`). */
export const es: LocaleContent = { ...kz, ...sl, ...of, ...fd, ...rw, ...bg, ...sc, ...fa };
