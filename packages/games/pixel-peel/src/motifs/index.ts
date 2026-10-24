import type { Motif } from '../art/types';
import { cherryBlossom } from './cherry-blossom';
import { summerMeadow } from './summer-meadow';
import { autumnForest } from './autumn-forest';
import { winterVillage } from './winter-village';
import { desertDunes } from './desert-dunes';
import { fjord } from './fjord';
import { riceTerraces } from './rice-terraces';
import { coralReef } from './coral-reef';
import { aurora } from './aurora';
import { redFox } from './red-fox';
import { elephant } from './elephant';
import { koala } from './koala';
import { llama } from './llama';
import { tiger } from './tiger';
import { polarBear } from './polar-bear';
import { hummingbird } from './hummingbird';
import { emperorPenguin } from './emperor-penguin';
import { readingNook } from './reading-nook';
import { marketStall } from './market-stall';
import { kitchenWindow } from './kitchen-window';

/**
 * All motifs in start-screen order: seasons, landscapes, animals, scenes. Adding a motif = one file in this folder
 * plus one line here; the tests iterate over this list (design v2 § 10.3).
 */
export const MOTIFS: readonly Motif[] = [
  cherryBlossom,
  summerMeadow,
  autumnForest,
  winterVillage,
  desertDunes,
  fjord,
  riceTerraces,
  coralReef,
  aurora,
  redFox,
  elephant,
  koala,
  llama,
  tiger,
  polarBear,
  hummingbird,
  emperorPenguin,
  readingNook,
  marketStall,
  kitchenWindow
];

export const findMotif = (id: unknown): Motif | undefined => MOTIFS.find((m) => m.id === id);
