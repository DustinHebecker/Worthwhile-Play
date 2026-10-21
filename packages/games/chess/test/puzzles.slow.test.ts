import { describe, expect, it } from 'vitest';
import { puzzleTurn } from '../src/ai';
import { createGame, legalMoves, moveToUci, puzzlesFor, replay, type ChessState } from '../src/rules';
import { oracleForcesMate } from './oracle';

// Puzzle play checked move by move against the independent oracle (split from puzzles.test.ts):
// an oracle search per legal move, so mutation testing leaves this *.slow.test.ts file out
// (ADR 0021); `pnpm test` and CI run it.
const puzzleState = (mode: 'best' | 'mate', mateN: number, puzzle: number): ChessState =>
  createGame({ seed: 1, difficulty: 'beginner', opponent: 'human', humanColor: 'w', mode, mateN, puzzle });

describe('puzzle play (oracle)', { timeout: 120_000 }, () => {
  it('accepts any second move that still forces mate in time (mate in two, checked against the oracle)', () => {
    const list = puzzlesFor('mate', 2);
    for (let index = 0; index < Math.min(4, list.length); index++) {
      const ref = list[index]!;
      const afterFirst = puzzleTurn(puzzleState('mate', 2, index), ref.line[0]!).state;
      const here = replay(afterFirst.start, afterFirst.moves)!.pos;
      for (const m of legalMoves(here)) {
        const uci = moveToUci(m);
        const expected = oracleForcesMate(replay(afterFirst.start, afterFirst.moves)!.pos, m, 1);
        expect(puzzleTurn(afterFirst, uci).correct, `${ref.fen} ${uci}`).toBe(expected);
      }
    }
  });
});
