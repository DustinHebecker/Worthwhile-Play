import type { Motif } from '../../art/types';
import { mountFuji } from '../mount-fuji';
import { toriiGate } from '../torii-gate';
import { empireStateBuilding } from '../empire-state-building';
import { brandenburgGate } from '../brandenburg-gate';
import { eiffelTower } from '../eiffel-tower';
import { sugarloafMountain } from '../sugarloaf-mountain';
import { uluru } from '../uluru';
import { greatWall } from '../great-wall';
import { dutchWindmill } from '../dutch-windmill';

/** Ten famous landmarks around the world (batch 15, landmarks). */
export const BATCH: readonly Motif[] = [mountFuji, toriiGate, empireStateBuilding, brandenburgGate, eiffelTower, sugarloafMountain, uluru, greatWall, dutchWindmill];
