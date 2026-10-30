import type { Motif } from '../../art/types';
import { campfire } from '../campfire';
import { canalBicycle } from '../canal-bicycle';
import { greenhouse } from '../greenhouse';
import { hotAirBalloons } from '../hot-air-balloons';
import { nightMarket } from '../night-market';

/** Everyday scenes: markets, travel, food and gardens (batch 14). */
export const BATCH: readonly Motif[] = [nightMarket, canalBicycle, campfire, hotAirBalloons, greenhouse];
