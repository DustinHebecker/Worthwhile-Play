import type { Motif } from '../../art/types';
import { bakeryWindow } from '../bakery-window';
import { campfire } from '../campfire';
import { canalBicycle } from '../canal-bicycle';
import { greenhouse } from '../greenhouse';
import { hotAirBalloons } from '../hot-air-balloons';
import { nightMarket } from '../night-market';
import { pizza } from '../pizza';
import { rooftopGarden } from '../rooftop-garden';
import { teaCeremony } from '../tea-ceremony';
import { viaductTrain } from '../viaduct-train';

/** Everyday scenes: markets, travel, food and gardens (batch 14). */
export const BATCH: readonly Motif[] = [nightMarket, canalBicycle, campfire, hotAirBalloons, greenhouse, bakeryWindow, viaductTrain, teaCeremony, rooftopGarden, pizza];
