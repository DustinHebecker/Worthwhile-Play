import { describe } from 'vitest';
import { defineBestLineChecks } from './best-lines';

/**
 * Sampled re-verification of the best-move lines in the regular run (in parallel with the mate
 * checks). With CHESS_VERIFY_PUZZLES=1 the full check runs from puzzle-data.test.ts instead;
 * CHESS_SKIP_PUZZLE_DATA=1 skips it (mutation testing).
 */
if (process.env.CHESS_SKIP_PUZZLE_DATA || process.env.CHESS_VERIFY_PUZZLES) describe.skip('shipped best-move lines (sampled)', () => undefined);
else defineBestLineChecks(false);
