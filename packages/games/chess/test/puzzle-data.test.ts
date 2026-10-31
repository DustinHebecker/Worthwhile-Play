import { describe, expect, it } from 'vitest';
import { MAX_LINE_MOVES } from '../src/ai';
import { BEST_MOVE_PUZZLES, MATE_PUZZLES } from '../src/puzzle-data';
import { puzzlesFor, replay } from '../src/rules';

/**
 * Shape of the shipped puzzles (fast). Their re-verification by the solver, the independent oracle
 * and the deep search is in puzzle-data.slow.test.ts and puzzle-lines.slow.test.ts.
 */
describe('shipped puzzles', () => {
  it('has enough distinct, well-formed puzzles in every category', () => {
    const fens = new Set([...MATE_PUZZLES, ...BEST_MOVE_PUZZLES].map((p) => p.fen.split(' ').slice(0, 2).join(' ')));
    expect(fens.size).toBe(MATE_PUZZLES.length + BEST_MOVE_PUZZLES.length);
    for (const n of [1, 2, 3, 4]) expect(puzzlesFor('mate', n).length, `mate in ${n}`).toBeGreaterThanOrEqual(30);
    expect(BEST_MOVE_PUZZLES.length).toBeGreaterThanOrEqual(30);
    for (const p of MATE_PUZZLES) {
      expect(p.line).toHaveLength(2 * p.n - 1);
      const game = replay(p.fen, p.line);
      expect(game?.status.kind, p.fen).toBe('checkmate');
    }
    for (const p of BEST_MOVE_PUZZLES) {
      // Lines of 1–3 moves of the person (with the engine's replies in between), all legal.
      expect(p.line.length % 2, p.fen).toBe(1);
      expect(p.line.length, p.fen).toBeLessThanOrEqual(2 * MAX_LINE_MOVES - 1);
      expect(replay(p.fen, p.line), p.fen).not.toBeNull();
    }
    // A good share of the lines are longer than one move.
    expect(BEST_MOVE_PUZZLES.filter((p) => p.line.length > 1).length).toBeGreaterThanOrEqual(BEST_MOVE_PUZZLES.length / 3);
  });
});
