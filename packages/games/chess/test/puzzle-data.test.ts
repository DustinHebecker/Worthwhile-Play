import { describe, expect, it } from 'vitest';
import { BEST_MOVE_GAP, DECISIVE_LEAD, MAX_LINE_MOVES, MateSolver, analyse, uniqueBestMove, verifyBestMovePuzzle, verifyMatePuzzle, PUZZLE_LEVEL } from '../src/ai';
import { BEST_MOVE_PUZZLES, MATE_PUZZLES } from '../src/puzzle-data';
import { moveToUci, parseFen, puzzlesFor, replay, uciToMove } from '../src/rules';
import { oracleForcesMate, oracleSolutions } from './oracle';

/**
 * Re-verifies the shipped puzzles. The full check (every puzzle, about 3 minutes on one core)
 * runs with CHESS_VERIFY_PUZZLES=1, as its own CI job; the regular run verifies every eighth
 * puzzle so local runs stay fast. Mutation testing sets CHESS_SKIP_PUZZLE_DATA=1 to skip this file.
 */
const pos = (fen: string) => parseFen(fen)!;
const run = process.env.CHESS_SKIP_PUZZLE_DATA ? describe.skip : describe;
const full = Boolean(process.env.CHESS_VERIFY_PUZZLES);
const subset = <T>(list: readonly T[]): readonly T[] => (full ? list : list.filter((_, i) => i % 8 === 0));

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
    for (const p of BEST_MOVE_PUZZLES) {
      // Lines of 1–3 moves of the person (with the engine's replies in between), all legal.
      expect(p.line.length % 2, p.fen).toBe(1);
      expect(p.line.length, p.fen).toBeLessThanOrEqual(2 * MAX_LINE_MOVES - 1);
      expect(replay(p.fen, p.line), p.fen).not.toBeNull();
    }
    // A good share of the lines are longer than one move.
    expect(BEST_MOVE_PUZZLES.filter((p) => p.line.length > 1).length).toBeGreaterThanOrEqual(BEST_MOVE_PUZZLES.length / 3);
  });

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

  it('every move of every best-move line is re-verified by a deep search with a clear gap', () => {
    // verifyBestMovePuzzle re-derives the whole line: each move of the person passes the
    // unique-best test, each reply is the engine's deep-search best move, and the stopping rule
    // gives exactly the stored length.
    for (const p of subset(BEST_MOVE_PUZZLES)) expect(verifyBestMovePuzzle(p.fen), p.fen).toEqual(p);
    const sample = BEST_MOVE_PUZZLES[0]!;
    const deep = analyse(pos(sample.fen), PUZZLE_LEVEL, [], BEST_MOVE_GAP);
    expect(deep.candidates).toHaveLength(1);
  });

  it('checks each later move of a multi-move line on its own (unique best, reply is the engine’s best, lead not yet decisive)', () => {
    const lines = BEST_MOVE_PUZZLES.filter((p) => p.line.length > 1);
    for (const p of full ? lines : lines.slice(0, 1)) {
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

