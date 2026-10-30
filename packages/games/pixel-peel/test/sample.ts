import { heightOf, widthFor } from '../src/art/sizes';
import type { Motif } from '../src/art/types';
import { MOTIFS } from '../src/motifs/index';

/**
 * A small, fixed sample of motifs for the fast tests and the wall-clock budgets, however many motifs there are: the
 * first motif of each group and of each aspect, and the one with the most cells on hard. The `*.slow.test.ts` files
 * check every motif.
 */
const cells = (m: Motif) => widthFor(m, 'hard') * heightOf(m, widthFor(m, 'hard'));
const largest = MOTIFS.reduce((a, b) => (cells(b) > cells(a) ? b : a));

export const SAMPLE: readonly Motif[] = MOTIFS.filter((m, i) => MOTIFS.findIndex((x) => x.group === m.group) === i || MOTIFS.findIndex((x) => x.aspect === m.aspect) === i || m === largest);
