import { ENCOUNTER } from './encounter';
import { ITEMS1 } from './items1';
import { ITEMS2 } from './items2';
import { LOOT } from './loot';
import { MONSTERS1 } from './monsters1';
import { MONSTERS2 } from './monsters2';
import { SAMPLE } from './sample';

/** All Kampfzwerge illustrations (one lazily loaded chunk). */
export const KZ: Readonly<Record<string, string>> = { ...SAMPLE, ...MONSTERS1, ...MONSTERS2, ...ITEMS1, ...ITEMS2, ...ENCOUNTER, ...LOOT };
