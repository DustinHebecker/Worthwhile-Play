import type { Motif } from '../../art/types';
import { goldenGateBridge } from '../golden-gate-bridge';
import { grandCanyon } from '../grand-canyon';
import { icecubeLab } from '../icecube-lab';
import { southPoleStation } from '../south-pole-station';
import { tajMahal } from '../taj-mahal';
import { yosemiteValley } from '../yosemite-valley';

/** Landmarks requested by the owner: the South Pole, California, the Grand Canyon, India, Peru and Rome. */
export const BATCH: readonly Motif[] = [southPoleStation, icecubeLab, goldenGateBridge, yosemiteValley, grandCanyon, tajMahal];
