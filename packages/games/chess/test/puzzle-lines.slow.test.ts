import { describe } from 'vitest';
import { defineBestLineChecks } from './best-lines';

/**
 * Sampled re-verification of the best-move lines in the regular run (in parallel with the mate
 * checks). With CHESS_VERIFY_PUZZLES=1 the full check runs from puzzle-data.slow.test.ts instead.
 * Mutation testing leaves *.slow.test.ts files out (ADR 0021).
 */
if (process.env.CHESS_VERIFY_PUZZLES) describe.skip('shipped best-move lines (sampled)', () => undefined);
else defineBestLineChecks(false);
