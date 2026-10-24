import { BG_ENCOUNTER } from './bg-encounter';
import { BG_ITEMS1 } from './bg-items1';
import { BG_ITEMS2 } from './bg-items2';
import { BG_LOOT } from './bg-loot';
import { BG_MONSTERS1 } from './bg-monsters1';
import { BG_MONSTERS2 } from './bg-monsters2';

/** All Creepy Crawlies illustrations (one lazily loaded chunk). */
export const BG: Readonly<Record<string, string>> = { ...BG_MONSTERS1, ...BG_MONSTERS2, ...BG_ITEMS1, ...BG_ITEMS2, ...BG_ENCOUNTER, ...BG_LOOT };
