import { RW_ENCOUNTER } from './rw-encounter';
import { RW_ITEMS1 } from './rw-items1';
import { RW_ITEMS2 } from './rw-items2';
import { RW_LOOT } from './rw-loot';
import { RW_MONSTERS1 } from './rw-monsters1';
import { RW_MONSTERS2 } from './rw-monsters2';

/** All Railway illustrations (one lazily loaded chunk). */
export const RW: Readonly<Record<string, string>> = { ...RW_MONSTERS1, ...RW_MONSTERS2, ...RW_ITEMS1, ...RW_ITEMS2, ...RW_ENCOUNTER, ...RW_LOOT };
