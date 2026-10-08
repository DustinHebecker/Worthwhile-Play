import { describe, expect, it } from 'vitest';
import {
  BEST_MOVE_GAP,
  BudgetExceeded,
  MateSolver,
  analyse,
  puzzleHint,
  puzzleTurn,
  verifyBestMovePuzzle,
  verifyMatePuzzle,
  PUZZLE_LEVEL
} from '../src/ai';
import { BEST_MOVE_PUZZLES, MATE_PUZZLES } from '../src/puzzle-data';
import { createGame, isValidState, legalMoves, moveToUci, parseFen, puzzlesFor, replay, uciToMove, type ChessState } from '../src/rules';
import { oracleForcesMate, oracleSolutions } from './oracle';

const pos = (fen: string) => parseFen(fen)!;
const puzzleState = (mode: 'best' | 'mate', mateN: number, puzzle: number): ChessState =>
  createGame({ seed: 1, difficulty: 'beginner', opponent: 'human', humanColor: 'w', mode, mateN, puzzle });

describe('mate solver', () => {
  it('finds mates of the right length and nothing faster', () => {
    const solver = new MateSolver();
    const backRank = pos('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1');
    expect(solver.distance(backRank, 3)).toBe(1);
    expect(solver.solutions(backRank, 1).map(moveToUci)).toEqual(['a1a8']);
    // Two rooks: a ladder mate in two (no mate in one).
    const ladder = pos('7k/8/8/8/8/8/R7/1R4K1 w - - 0 1');
    expect(solver.canMate(ladder, 1)).toBe(false);
    expect(solver.distance(ladder, 3)).toBe(2);
    // No mate at all.
    expect(solver.distance(pos('4k3/8/8/8/8/8/8/4K3 w - - 0 1'), 2)).toBe(0);
    // A stalemating move is not a mate: Qf7 would stalemate, Qe8 mates.
    expect(new MateSolver().solutions(pos('7k/8/4Q1K1/8/8/8/8/8 w - - 0 1'), 1).map(moveToUci).sort()).toEqual(['e6c8', 'e6e8']);
  });

  it('chooses the most stubborn defence', () => {
    const solver = new MateSolver();
    // After Ra7 (ladder), black's only moves all allow Rb8#; bestDefence must be a legal move.
    const p = pos('7k/R7/8/8/8/8/8/1R4K1 b - - 0 1');
    const reply = solver.bestDefence(p, 1);
    expect(legalMoves(p)).toContain(reply);
  });

  it('respects its node budget', () => {
    expect(() => new MateSolver(10).distance(pos('r1b2k1r/ppp1bppp/8/1B1Q4/5q2/2P5/PPP2PPP/R3R1K1 w - - 1 1'), 3)).toThrow(BudgetExceeded);
  });

  it('agrees with the independent oracle on small cases', () => {
    const p = pos('r1b2k1r/ppp1bppp/8/1B1Q4/5q2/2P5/PPP2PPP/R3R1K1 w - - 1 1');
    const solver = new MateSolver();
    expect(solver.solutions(p, 2).map(moveToUci)).toEqual(oracleSolutions(p, 2).map(moveToUci));
    expect(solver.solutions(p, 2).map(moveToUci)).toEqual(['d5d8']);
    expect(verifyMatePuzzle('r1b2k1r/ppp1bppp/8/1B1Q4/5q2/2P5/PPP2PPP/R3R1K1 w - - 1 1', 2)?.line).toEqual(['d5d8', 'e7d8', 'e1e8']);
    expect(verifyMatePuzzle('r1b2k1r/ppp1bppp/8/1B1Q4/5q2/2P5/PPP2PPP/R3R1K1 w - - 1 1', 3)).toBeNull(); // mate in 2 exists
    expect(verifyMatePuzzle('7k/8/8/8/8/8/R7/1R4K1 w - - 0 1', 2)).toBeNull(); // several first moves mate in 2
    expect(verifyMatePuzzle('bad', 1)).toBeNull();
  });
});

describe('shipped puzzles', { timeout: 600_000 }, () => {
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

describe('puzzle play', { timeout: 120_000 }, () => {
  it('accepts only the best move in "find the best move" and explains wrong tries', () => {
    const state = puzzleState('best', 1, 0);
    const ref = puzzlesFor('best', 1)[0]!;
    expect(state.start).toBe(ref.fen);
    expect(state.opponent).toBe('computer');
    const wrongMove = legalMoves(pos(ref.fen)).map(moveToUci).find((m) => m !== ref.line[0])!;
    const wrong = puzzleTurn(state, wrongMove);
    expect(wrong.correct).toBe(false);
    expect(wrong.state).toBe(state);
    expect(wrong.refutation).toBeTypeOf('number');
    const right = puzzleTurn(state, ref.line[0]!);
    expect(right.correct).toBe(true);
    expect(right.state.moves).toEqual([ref.line[0]]);
    expect(isValidState(right.state)).toBe(true);
    expect(isValidState({ ...state, moves: [wrongMove] })).toBe(false);
    expect(puzzleHint(state)).toBe(uciToMove(pos(ref.fen), ref.line[0]!));
    expect(puzzleHint(right.state)).toBeNull();
    expect(() => puzzleTurn(state, 'a1a1')).toThrow();
    expect(() => puzzleTurn(createGame({ seed: 1, difficulty: 'beginner', opponent: 'human', humanColor: 'w' }), 'e2e4')).toThrow();
  });

  it('plays the mating line with the engine defending, and rejects other first moves', () => {
    for (const n of [1, 2, 3]) {
      let state = puzzleState('mate', n, 0);
      const ref = puzzlesFor('mate', n)[0]!;
      const other = legalMoves(pos(ref.fen)).map(moveToUci).find((m) => m !== ref.line[0])!;
      expect(puzzleTurn(state, other).correct).toBe(false);
      for (let i = 0; i < ref.line.length; i += 2) {
        expect(puzzleHint(state)).toBe(uciToMove(replay(state.start, state.moves)!.pos, ref.line[i]!));
        const turn = puzzleTurn(state, ref.line[i]!);
        expect(turn.correct).toBe(true);
        state = turn.state;
        expect(isValidState(state)).toBe(true);
      }
      expect(replay(state.start, state.moves)!.status.kind).toBe('checkmate');
      expect(state.moves).toEqual(ref.line);
    }
  });

  it('accepts any second move that still forces mate in time (mate in two, checked against the oracle)', () => {
    const list = puzzlesFor('mate', 2);
    for (let index = 0; index < Math.min(10, list.length); index++) {
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

  it('picks puzzles by index modulo the category size and validates puzzle states', () => {
    const size = puzzlesFor('mate', 1).length;
    expect(puzzleState('mate', 1, size + 2).puzzle).toBe(2);
    const s = puzzleState('mate', 1, 0);
    expect(isValidState(s)).toBe(true);
    expect(isValidState({ ...s, start: puzzlesFor('mate', 1)[1]!.fen })).toBe(false);
    expect(isValidState({ ...s, mateN: 5 })).toBe(false);
    expect(isValidState({ ...s, mode: 'quiz' })).toBe(false);
    expect(isValidState({ ...s, opponent: 'human' })).toBe(false);
    expect(isValidState({ ...s, puzzle: size + 5 })).toBe(false);
    expect(isValidState({ ...createGame({ seed: 1, difficulty: 'beginner', opponent: 'human', humanColor: 'w' }), puzzle: 3 })).toBe(false);
    // Play mode stays play mode even with puzzle options.
    expect(createGame({ seed: 1, difficulty: 'beginner', opponent: 'human', humanColor: 'w', mode: 'play', puzzle: 4 }).puzzle).toBe(0);
  });
});
