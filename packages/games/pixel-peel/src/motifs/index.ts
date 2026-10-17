import type { Motif } from './types';
import { cherryBlossom } from './cherry-blossom';
import { summerMeadow } from './summer-meadow';
import { autumnForest } from './autumn-forest';
import { winterVillage } from './winter-village';
import { desertDunes } from './desert-dunes';
import { fjord } from './fjord';
import { riceTerraces } from './rice-terraces';
import { redFox } from './red-fox';
import { elephant } from './elephant';
import { koala } from './koala';
import { llama } from './llama';
import { tiger } from './tiger';

/**
 * All motifs in start-screen order: seasons, then landscapes, then animals. Adding a motif = one file in this folder
 * plus one line here; the tests iterate over this list (design § 6).
 */
export const MOTIFS: readonly Motif[] = [cherryBlossom, summerMeadow, autumnForest, winterVillage, desertDunes, fjord, riceTerraces, redFox, elephant, koala, llama, tiger];

export const findMotif = (id: unknown): Motif | undefined => MOTIFS.find((m) => m.id === id);
