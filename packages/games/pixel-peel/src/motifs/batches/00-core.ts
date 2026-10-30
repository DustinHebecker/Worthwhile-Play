import type { Motif } from '../../art/types';
import { aurora } from '../aurora';
import { autumnForest } from '../autumn-forest';
import { cherryBlossom } from '../cherry-blossom';
import { coralReef } from '../coral-reef';
import { desertDunes } from '../desert-dunes';
import { elephant } from '../elephant';
import { emperorPenguin } from '../emperor-penguin';
import { fjord } from '../fjord';
import { hummingbird } from '../hummingbird';
import { kitchenWindow } from '../kitchen-window';
import { koala } from '../koala';
import { llama } from '../llama';
import { marketStall } from '../market-stall';
import { polarBear } from '../polar-bear';
import { readingNook } from '../reading-nook';
import { redFox } from '../red-fox';
import { riceTerraces } from '../rice-terraces';
import { summerMeadow } from '../summer-meadow';
import { tiger } from '../tiger';
import { winterVillage } from '../winter-village';

/** The 20 motifs of v2 (design v2 § 9), in their start-screen order. */
export const BATCH: readonly Motif[] = [
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
