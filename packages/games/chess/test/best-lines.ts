import { describe, expect, it } from 'vitest';
import { BEST_MOVE_GAP, DECISIVE_LEAD, PUZZLE_LEVEL, analyse, uniqueBestMove, verifyBestMovePuzzle } from '../src/ai';
import { BEST_MOVE_PUZZLES } from '../src/puzzle-data';
import { parseFen, replay, uciToMove } from '../src/rules';

/**
 * Re-verification of every move of the shipped "find the best move" lines. `full`: every line
 * (CHESS_VERIFY_PUZZLES=1, run from puzzle-data.test.ts, which the CI job executes); otherwise
 * every 24th line (always including multi-move lines), run from puzzle-lines.test.ts in parallel
 * with the other files so local runs stay fast.
 */
export function defineBestLineChecks(full: boolean): void {
  const pos = (fen: string) => parseFen(fen)!;
  const sample = () => (full ? BEST_MOVE_PUZZLES : BEST_MOVE_PUZZLES.filter((_, i) => i % 24 === 0));
  describe('shipped best-move lines', { timeout: 900_000 }, () => {
    it('the default sample includes multi-move lines', () => {
      expect(sample().some((p) => p.line.length > 1)).toBe(true);
    });

    it('every move of every best-move line is re-verified by a deep search with a clear gap', () => {
      // verifyBestMovePuzzle re-derives the whole line: each move of the person passes the
      // unique-best test, each reply is the engine's deep-search best move, and the stopping rule
      // gives exactly the stored length.
      for (const p of sample()) expect(verifyBestMovePuzzle(p.fen), p.fen).toEqual(p);
    });

    it('checks each later move of a multi-move line on its own (unique best, reply is the engine’s best, lead not yet decisive)', () => {
      const lines = BEST_MOVE_PUZZLES.filter((p) => p.line.length > 1);
      for (const p of full ? lines : lines.slice(0, 1)) {
        // The first move: alone in the gap with the deep search.
        expect(analyse(pos(p.fen), PUZZLE_LEVEL, [], BEST_MOVE_GAP).candidates.map((c) => c.move), p.fen).toEqual([uciToMove(pos(p.fen), p.line[0]!)]);
        for (let i = 2; i < p.line.length; i += 2) {
          const before = replay(p.fen, p.line.slice(0, i - 1))!.pos;
          const reply = analyse(before, PUZZLE_LEVEL, [], 0).candidates[0]!;
          expect(reply.move, `${p.fen} reply ${i - 1}`).toBe(uciToMove(before, p.line[i - 1]!));
          expect(-reply.score < DECISIVE_LEAD || -reply.score > 29_000, `${p.fen} lead before ${i}`).toBe(true);
          const here = replay(p.fen, p.line.slice(0, i))!.pos;
          expect(uniqueBestMove(here, PUZZLE_LEVEL, false), `${p.fen} move ${i}`).toBe(uciToMove(here, p.line[i]!));
        }
      }
    });
  });
}
