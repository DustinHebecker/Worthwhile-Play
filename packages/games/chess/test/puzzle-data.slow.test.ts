import { describe, expect, it } from 'vitest';
import { MateSolver, verifyMatePuzzle } from '../src/ai';
import { MATE_PUZZLES } from '../src/puzzle-data';
import { moveToUci, parseFen, replay, uciToMove } from '../src/rules';
import { defineBestLineChecks } from './best-lines';
import { oracleForcesMate, oracleSolutions } from './oracle';

/**
 * Re-verifies the shipped puzzles. The full check (every mate puzzle and every move of every
 * best-move line, a few minutes) runs with CHESS_VERIFY_PUZZLES=1, as its own CI job; the regular
 * run verifies every eighth mate puzzle here and a sample of the best-move lines in
 * puzzle-lines.slow.test.ts (in parallel), so local runs stay fast. Mutation testing leaves
 * *.slow.test.ts files out (ADR 0021); the shape checks are in puzzle-data.test.ts.
 */
const pos = (fen: string) => parseFen(fen)!;
const full = Boolean(process.env.CHESS_VERIFY_PUZZLES);
const subset = <T>(list: readonly T[]): readonly T[] => (full ? list : list.filter((_, i) => i % 8 === 0));

describe('shipped puzzles (re-verified)', { timeout: 600_000 }, () => {
  it('every mate puzzle is re-verified by the solver: exact length, unique first move, same main line', () => {
    for (const p of subset(MATE_PUZZLES)) expect(verifyMatePuzzle(p.fen, p.n, new MateSolver(20_000_000)), p.fen).toEqual(p);
  });

  it('the independent oracle confirms mates in one and two exactly, and the first move of longer mates', () => {
    for (const p of subset(MATE_PUZZLES)) {
      const start = pos(p.fen);
      const first = uciToMove(start, p.line[0]!);
      if (p.n <= 2) {
        expect(oracleSolutions(start, p.n).map(moveToUci), p.fen).toEqual([p.line[0]]);
        if (p.n === 2) expect(oracleSolutions(start, 1), p.fen).toEqual([]);
      } else {
        // Longer mates: the oracle checks the main line move by move (each attacker move
        // still forces mate in the remaining number of moves against every defence).
        const game = replay(p.fen, []);
        const moves: string[] = [];
        for (let i = 0; i < p.line.length; i += 2) {
          const here = replay(p.fen, moves)!.pos;
          expect(oracleForcesMate(here, uciToMove(here, p.line[i]!), p.n - i / 2), `${p.fen} @${i}`).toBe(true);
          moves.push(p.line[i]!, ...(p.line[i + 1] ? [p.line[i + 1]!] : []));
        }
        expect(game).not.toBeNull();
        expect(first).not.toBe(0);
      }
    }
  });
});

if (full) defineBestLineChecks(true);
