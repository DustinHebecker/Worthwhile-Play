import { SL_ENCOUNTER } from './sl-encounter';
import { SL_ITEMS1 } from './sl-items1';
import { SL_ITEMS2 } from './sl-items2';
import { SL_LOOT } from './sl-loot';
import { SL_MONSTERS1 } from './sl-monsters1';
import { SL_MONSTERS2 } from './sl-monsters2';

/** All Spaceloot illustrations (one lazily loaded chunk). */
export const SL: Readonly<Record<string, string>> = { ...SL_MONSTERS1, ...SL_MONSTERS2, ...SL_ITEMS1, ...SL_ITEMS2, ...SL_ENCOUNTER, ...SL_LOOT };
