// @ts-nocheck
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng, createRngFromState, type Rng } from '@wp/game-core';
import { MEDIUM_SLIP, bestMoves, chooseMove, computerReply, negamax, playTurn, scoreMoves, startRound, winningMoves } from '../src/ai';
import {
  DIFFICULTIES,
  boardFromMoves,
  boardOf,
  emptyBoard,
  findWin,
  isLegalMove,
  isValidState,
  legalMoves,
  outcomeOf,
  place,
  toMove,
  type Board,
  type Cell,
  type Difficulty,
  type Mark,
  type TicTacToeState
} from '../src/rules';

const B = (picture: string): Cell[] => [...picture.replace(/\s/g, '')].map((c) => (c === '.' ? '' : (c as Mark)));

/** Rng stub with a fixed `next()` value that records what `pick` was offered. */
function stubRng(value: number): Rng & { offered: number[][] } {
  const offered: number[][] = [];
  const int = (min: number, max: number) => min + Math.floor(value * (max - min + 1));
  return {
    offered,
    next: () => value,
    int,
    pick: <T>(items: readonly T[]) => {
      offered.push([...(items as readonly number[])]);
      return items[int(0, items.length - 1)] as T;
    },
    shuffle: <T>(items: readonly T[]) => [...items],
    state: () => 0
  };
}

/** Independent plain minimax (no memo, no depth weighting): +1 win / 0 draw / -1 loss for the side to move. */
const oracleCache = new Map<string, number>();
function oracleValue(board: Board): number {
  const key = board.join(',');
  const cached = oracleCache.get(key);
  if (cached !== undefined) return cached;
  let value: number;
  const moves = legalMoves(board);
  if (findWin(board)) value = -1;
  else if (moves.length === 0) value = 0;
  else {
    const mark = toMove(board);
    value = Math.max(...moves.map((m) => 0 - oracleValue(place(board, m, mark))));
  }
  oracleCache.set(key, value);
  return value;
}

const arbPlayingBoard = fc
  .array(fc.nat(), { maxLength: 8 })
  .map((choices) => {
    const moves: number[] = [];
    for (const choice of choices) {
      const board = boardFromMoves(moves);
      if (outcomeOf(board).kind !== 'playing') break;
      const legal = legalMoves(board);
      const next = legal[choice % legal.length] as number;
      if (outcomeOf(place(board, next, toMove(board))).kind !== 'playing') break;
      moves.push(next);
    }
    return boardFromMoves(moves);
  });

describe('negamax search', () => {
  it('values the empty board as a draw', () => {
    expect(negamax(emptyBoard())).toBe(0);
  });

  it('values finished positions from the side to move', () => {
    // X completed the top row; O is to move and has lost with 4 empty cells left.
    expect(negamax(B('XXX OO. ...'))).toBe(-5);
    expect(negamax(B('XOX OXO OXO'))).toBe(0);
    expect(negamax(B('XXO OOX XO.'))).toBe(0);
  });

  it('prefers faster wins', () => {
    // X to move can win at once in cell 2.
    const board = B('XX. OO. ...');
    const scores = scoreMoves(board);
    expect(scores.get(2)).toBe(5);
    expect(Math.max(...scores.values())).toBe(5);
    expect(bestMoves(board)).toEqual([2]);
  });

  it('agrees in sign with an independent minimax oracle', () => {
    fc.assert(
      fc.property(arbPlayingBoard, (board) => {
        expect(Math.sign(negamax(board))).toBe(oracleValue(board));
      }),
      { numRuns: 300 }
    );
  });

  it('blocks the opponent’s immediate threat', () => {
    // O to move; X threatens 0-1-2.
    expect(bestMoves(B('XX. .O. ...'))).toEqual([2]);
  });

  it('returns no best moves when the game is over', () => {
    expect(bestMoves(B('XXX OO. ...'))).toEqual([]);
    expect(bestMoves(B('XOX OXO OXO'))).toEqual([]);
  });

  it('every optimal move keeps the game value', () => {
    fc.assert(
      fc.property(arbPlayingBoard, (board) => {
        const value = oracleValue(board);
        const mark = toMove(board);
        for (const move of bestMoves(board)) expect(0 - oracleValue(place(board, move, mark))).toBe(value);
      }),
      { numRuns: 200 }
    );
  });
});

describe('winningMoves', () => {
  it('finds all immediate wins for a mark', () => {
    expect(winningMoves(B('XX. X.. ...'), 'X')).toEqual([2, 6]);
    expect(winningMoves(B('XX. X.. ...'), 'O')).toEqual([]);
    expect(winningMoves(B('OO. ... ...'), 'O')).toEqual([2]);
    expect(winningMoves(emptyBoard(), 'X')).toEqual([]);
  });
});

describe('chooseMove', () => {
  it('refuses to move in a finished game', () => {
    for (const difficulty of DIFFICULTIES) {
      expect(() => chooseMove(B('XXX OO. ...'), difficulty, createRng(1))).toThrow(RangeError);
      expect(() => chooseMove(B('XOX OXO OXO'), difficulty, createRng(1))).toThrow(RangeError);
    }
  });

  it('property: every AI move is legal, for every difficulty', () => {
    fc.assert(
      fc.property(arbPlayingBoard, fc.constantFrom(...DIFFICULTIES), fc.integer({ min: 0, max: 0xffffffff }), (board, difficulty, seed) => {
        expect(isLegalMove(board, chooseMove(board, difficulty, createRng(seed)))).toBe(true);
      }),
      { numRuns: 1000 }
    );
  });

  it('perfect picks among optimal moves only', () => {
    const rng = stubRng(0.99);
    const board = B('XX. .O. ...');
    expect(chooseMove(board, 'perfect', rng)).toBe(2);
    expect(rng.offered).toEqual([[2]]);
  });

  it('medium plays an optimal move unless the PRNG draws below MEDIUM_SLIP', () => {
    const board = B('XX. .O. ...');
    const steady = stubRng(MEDIUM_SLIP);
    expect(chooseMove(board, 'medium', steady)).toBe(2);
    expect(steady.offered).toEqual([[2]]);
    const slip = stubRng(MEDIUM_SLIP - 0.001);
    chooseMove(board, 'medium', slip);
    expect(slip.offered).toEqual([legalMoves(board)]);
    expect(MEDIUM_SLIP).toBeGreaterThan(0);
    expect(MEDIUM_SLIP).toBeLessThan(0.5);
  });

  it('easy always takes an immediate win', () => {
    fc.assert(
      fc.property(arbPlayingBoard, fc.integer({ min: 0, max: 0xffffffff }), (board, seed) => {
        const wins = winningMoves(board, toMove(board));
        fc.pre(wins.length > 0);
        expect(wins).toContain(chooseMove(board, 'easy', createRng(seed)));
      }),
      { numRuns: 300 }
    );
  });

  it('easy plays any legal move when it cannot win at once', () => {
    const rng = stubRng(0);
    const board = B('XX. .O. ...'); // O to move, no immediate win for O
    expect(chooseMove(board, 'easy', rng)).toBe(2);
    expect(rng.offered).toEqual([legalMoves(board)]);
    const winRng = stubRng(0.99);
    expect(chooseMove(B('XX. OO. X..'), 'easy', winRng)).toBe(5);
    expect(winRng.offered).toEqual([[5]]);
  });

  it('easy and medium sometimes play sub-optimally, perfect never does', () => {
    const board = B('XX. .O. ...'); // O must block at 2
    const pickedNonOptimal = (difficulty: Difficulty) =>
      Array.from({ length: 200 }, (_, seed) => chooseMove(board, difficulty, createRng(seed))).filter((m) => m !== 2).length;
    expect(pickedNonOptimal('perfect')).toBe(0);
    const medium = pickedNonOptimal('medium');
    expect(medium).toBeGreaterThan(10);
    expect(medium).toBeLessThan(100);
    expect(pickedNonOptimal('easy')).toBeGreaterThan(100);
  });

  it('is deterministic for a given PRNG state', () => {
    fc.assert(
      fc.property(arbPlayingBoard, fc.constantFrom(...DIFFICULTIES), fc.integer({ min: 0, max: 0xffffffff }), (board, difficulty, seed) => {
        expect(chooseMove(board, difficulty, createRng(seed))).toBe(chooseMove(board, difficulty, createRng(seed)));
      }),
      { numRuns: 200 }
    );
  });
});

describe('perfect play never loses', () => {
  /**
   * Exhaustive: the opponent tries every legal move, and the AI is allowed every move it
   * considers optimal (a superset of what `chooseMove('perfect')` can return for any PRNG state).
   */
  function exhaustiveNeverLoses(board: Cell[], ai: Mark): number {
    const outcome = outcomeOf(board);
    if (outcome.kind === 'won') {
      expect(outcome.win.mark).toBe(ai);
      return 1;
    }
    if (outcome.kind === 'draw') return 1;
    const mark = toMove(board);
    const options = mark === ai ? bestMoves(board) : legalMoves(board);
    expect(options.length).toBeGreaterThan(0);
    let leaves = 0;
    for (const move of options) leaves += exhaustiveNeverLoses(place(board, move, mark), ai);
    return leaves;
  }

  it('as X (moving first) against every opponent strategy', () => {
    expect(exhaustiveNeverLoses(emptyBoard(), 'X')).toBeGreaterThan(100);
  });

  it('as O (moving second) against every opponent strategy', () => {
    expect(exhaustiveNeverLoses(emptyBoard(), 'O')).toBeGreaterThan(100);
  });

  it('property: full games via the state API never end in a computer loss', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 0xffffffff }),
        fc.constantFrom('human' as const, 'computer' as const),
        fc.array(fc.nat(), { minLength: 5, maxLength: 5 }),
        (seed, starter, choices) => {
          let s = startRound({ seed, difficulty: 'perfect', opponent: 'computer', starter });
          for (const choice of choices) {
            if (outcomeOf(boardOf(s)).kind !== 'playing') break;
            const legal = legalMoves(boardOf(s));
            s = playTurn(s, legal[choice % legal.length] as number);
          }
          const outcome = outcomeOf(boardOf(s));
          expect(outcome.kind).not.toBe('playing');
          if (outcome.kind === 'won') expect(outcome.win.mark).toBe(starter === 'computer' ? 'X' : 'O');
        }
      ),
      { numRuns: 500 }
    );
  });
});

describe('computer turns in the game state', () => {
  const base = (overrides: Partial<TicTacToeState> = {}): TicTacToeState => ({
    seed: 5,
    difficulty: 'perfect',
    opponent: 'computer',
    starter: 'human',
    moves: [],
    rng: 5,
    ...overrides
  });

  it('opens the round when the computer starts, and advances the stored PRNG', () => {
    const s = startRound({ seed: 5, difficulty: 'easy', opponent: 'computer', starter: 'computer' });
    expect(s.moves).toHaveLength(1);
    const rng = createRng(5);
    expect(s.moves[0]).toBe(chooseMove(emptyBoard(), 'easy', rng));
    expect(s.rng).toBe(rng.state());
    expect(s.rng).not.toBe(5);
    expect(isValidState(s)).toBe(true);
  });

  it('waits for the person when the person starts or plays against another person', () => {
    expect(startRound({ seed: 5, difficulty: 'easy', opponent: 'computer', starter: 'human' })).toEqual(base({ difficulty: 'easy' }));
    expect(startRound({ seed: 5, difficulty: 'easy', opponent: 'human', starter: 'computer' }).moves).toEqual([]);
  });

  it('computerReply is a no-op when it is not the computer’s turn', () => {
    const waiting = base({ moves: [4, 0] });
    expect(computerReply(waiting)).toBe(waiting);
    const people = base({ opponent: 'human', moves: [4] });
    expect(computerReply(people)).toBe(people);
    const over = base({ moves: [0, 3, 1, 4, 2] });
    expect(computerReply(over)).toBe(over);
  });

  it('computerReply continues the PRNG sequence from the stored state', () => {
    const s = computerReply(base({ moves: [4], rng: 1234, difficulty: 'easy' }));
    const rng = createRngFromState(1234);
    expect(s.moves).toEqual([4, chooseMove(boardFromMoves([4]), 'easy', rng)]);
    expect(s.rng).toBe(rng.state());
  });

  it('playTurn adds the person’s move and the computer’s reply together', () => {
    const s = playTurn(base(), 4);
    expect(s.moves).toHaveLength(2);
    expect(s.moves[0]).toBe(4);
    expect(isValidState(s)).toBe(true);
    const people = playTurn(base({ opponent: 'human' }), 4);
    expect(people.moves).toEqual([4]);
    expect(people.rng).toBe(5);
  });

  it('playTurn refuses illegal moves, finished games and the computer’s turn', () => {
    expect(() => playTurn(base({ moves: [4, 0] }), 4)).toThrow(RangeError);
    expect(() => playTurn(base({ moves: [0, 3, 1, 4, 2] }), 8)).toThrow(RangeError);
    expect(() => playTurn(base({ starter: 'computer' }), 4)).toThrow(/computer/);
  });

  it('property: replaying seed + actions reproduces the exact state, which is always valid', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 0xffffffff }),
        fc.constantFrom(...DIFFICULTIES),
        fc.constantFrom('human' as const, 'computer' as const),
        fc.array(fc.nat(), { maxLength: 6 }),
        (seed, difficulty, starter, choices) => {
          const run = () => {
            const states: TicTacToeState[] = [];
            let s = startRound({ seed, difficulty, opponent: 'computer', starter });
            states.push(s);
            for (const choice of choices) {
              const board = boardOf(s);
              if (outcomeOf(board).kind !== 'playing') break;
              const legal = legalMoves(board);
              s = playTurn(s, legal[choice % legal.length] as number);
              states.push(s);
            }
            return states;
          };
          const a = run();
          expect(run()).toEqual(a);
          for (const s of a) expect(isValidState(s)).toBe(true);
        }
      ),
      { numRuns: 300 }
    );
  });
});
