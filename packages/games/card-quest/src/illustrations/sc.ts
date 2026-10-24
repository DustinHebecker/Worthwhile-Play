import { SC_ENCOUNTER } from './sc-encounter';
import { SC_ITEMS1 } from './sc-items1';
import { SC_ITEMS2 } from './sc-items2';
import { SC_LOOT } from './sc-loot';
import { SC_MONSTERS1 } from './sc-monsters1';
import { SC_MONSTERS2 } from './sc-monsters2';

/** All Break Time illustrations (one lazily loaded chunk). */
export const SC: Readonly<Record<string, string>> = { ...SC_MONSTERS1, ...SC_MONSTERS2, ...SC_ITEMS1, ...SC_ITEMS2, ...SC_ENCOUNTER, ...SC_LOOT };
