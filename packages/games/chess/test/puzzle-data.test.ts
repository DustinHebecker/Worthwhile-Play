import { describe, expect, it } from 'vitest';
import { BEST_MOVE_GAP, MateSolver, analyse, verifyBestMovePuzzle, verifyMatePuzzle, PUZZLE_LEVEL } from '../src/ai';
import { BEST_MOVE_PUZZLES, MATE_PUZZLES } from '../src/puzzle-data';
import { moveToUci, parseFen, puzzlesFor, replay, uciToMove } from '../src/rules';
import { oracleForcesMate, oracleSolutions } from './oracle';

/**
 * Re-verifies every shipped puzzle (about 3 minutes on one core). Mutation testing sets
 * CHESS_SKIP_PUZZLE_DATA=1 to skip this file; the regular test run always executes it.
 */
const pos = (fen: string) => parseFen(fen)!;
const run = process.env.CHESS_SKIP_PUZZLE_DATA ? describe.skip : describe;

run('shipped puzzles', { timeout: 600_000 }, () => {
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
    for (const p of BEST_MOVE_PUZZLES) expect(uciToMove(pos(p.fen), p.move), p.fen).not.toBe(0);
  });

  it('every mate puzzle is re-verified by the solver: exact length, unique first move, same main line', () => {
    for (const p of MATE_PUZZLES) expect(verifyMatePuzzle(p.fen, p.n, new MateSolver(20_000_000)), p.fen).toEqual(p);
  });

  it('the independent oracle confirms mates in one and two exactly, and the first move of longer mates', () => {
    for (const p of MATE_PUZZLES) {
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

  it('every best-move puzzle is re-verified by a deep search with a clear gap', () => {
    for (const p of BEST_MOVE_PUZZLES) expect(verifyBestMovePuzzle(p.fen), p.fen).toEqual(p);
    const sample = BEST_MOVE_PUZZLES[0]!;
    const deep = analyse(pos(sample.fen), PUZZLE_LEVEL, [], BEST_MOVE_GAP);
    expect(deep.candidates).toHaveLength(1);
  });
});

