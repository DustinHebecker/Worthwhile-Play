import type { Motif } from '../../art/types';
import { goldenGateBridge } from '../golden-gate-bridge';
import { icecubeLab } from '../icecube-lab';
import { southPoleStation } from '../south-pole-station';
import { yosemiteValley } from '../yosemite-valley';

/** Landmarks requested by the owner: the South Pole, California, the Grand Canyon, India, Peru and Rome. */
export const BATCH: readonly Motif[] = [southPoleStation, icecubeLab, goldenGateBridge, yosemiteValley];
