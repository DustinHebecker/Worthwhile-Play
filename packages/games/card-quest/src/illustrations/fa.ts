import { FA_ENCOUNTER } from './fa-encounter';
import { FA_ITEMS1 } from './fa-items1';
import { FA_ITEMS2 } from './fa-items2';
import { FA_LOOT } from './fa-loot';
import { FA_MONSTERS1 } from './fa-monsters1';
import { FA_MONSTERS2 } from './fa-monsters2';

/** All Big Top illustrations (one lazily loaded chunk). */
export const FA: Readonly<Record<string, string>> = { ...FA_MONSTERS1, ...FA_MONSTERS2, ...FA_ITEMS1, ...FA_ITEMS2, ...FA_ENCOUNTER, ...FA_LOOT };
