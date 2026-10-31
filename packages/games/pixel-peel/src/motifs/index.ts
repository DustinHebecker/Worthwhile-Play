import type { Motif } from '../art/types';
import { orderMotifs } from './order';

/**
 * Every vector motif in start-screen order, for tests and authoring only: a game never imports this module (it plays
 * the baked art; `src/catalogue.ts`). Each batch file in ./batches exports `BATCH`; adding one needs no change here
 * (docs/design/pixel-peel-motifs.md § 2).
 */
const batches = import.meta.glob<readonly Motif[]>('./batches/*.ts', { eager: true, import: 'BATCH' });

export const MOTIFS: readonly Motif[] = orderMotifs(batches);

export const findMotif = (id: unknown): Motif | undefined => MOTIFS.find((m) => m.id === id);
