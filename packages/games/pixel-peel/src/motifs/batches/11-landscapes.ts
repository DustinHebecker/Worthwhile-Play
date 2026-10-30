import type { Motif } from '../../art/types';
import { haLongBay } from '../ha-long-bay';
import { salarDeUyuni } from '../salar-de-uyuni';
import { desertOasis } from '../desert-oasis';
import { icebergs } from '../icebergs';
import { cenote } from '../cenote';
import { tundra } from '../tundra';

/** Landscapes of water, ice, desert and jungle around the world (batch 11). */
export const BATCH: readonly Motif[] = [haLongBay, salarDeUyuni, desertOasis, icebergs, cenote, tundra];
