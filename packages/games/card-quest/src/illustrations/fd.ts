import { FD_ENCOUNTER } from './fd-encounter';
import { FD_ITEMS1 } from './fd-items1';
import { FD_ITEMS2 } from './fd-items2';
import { FD_LOOT } from './fd-loot';
import { FD_MONSTERS1 } from './fd-monsters1';
import { FD_MONSTERS2 } from './fd-monsters2';

/** All Fridge illustrations (one lazily loaded chunk). */
export const FD: Readonly<Record<string, string>> = { ...FD_MONSTERS1, ...FD_MONSTERS2, ...FD_ITEMS1, ...FD_ITEMS2, ...FD_ENCOUNTER, ...FD_LOOT };
