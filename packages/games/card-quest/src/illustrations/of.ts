import { OF_ENCOUNTER } from './of-encounter';
import { OF_ITEMS1 } from './of-items1';
import { OF_ITEMS2 } from './of-items2';
import { OF_LOOT } from './of-loot';
import { OF_MONSTERS1 } from './of-monsters1';
import { OF_MONSTERS2 } from './of-monsters2';

/** All Office illustrations (one lazily loaded chunk). */
export const OF: Readonly<Record<string, string>> = { ...OF_MONSTERS1, ...OF_MONSTERS2, ...OF_ITEMS1, ...OF_ITEMS2, ...OF_ENCOUNTER, ...OF_LOOT };
