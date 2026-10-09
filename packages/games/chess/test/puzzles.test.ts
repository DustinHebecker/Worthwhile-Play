import { describe, expect, it } from 'vitest';
import { BudgetExceeded, MateSolver, puzzleHint, puzzleTurn, verifyMatePuzzle } from '../src/ai';
import { createGame, isValidState, legalMoves, moveToUci, outcomeOf, parseFen, puzzlesFor, replay, uciToMove, type ChessState } from '../src/rules';
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
    expect(right.state.moves).toEqual(ref.line.slice(0, 2));
    expect(isValidState(right.state)).toBe(true);
    expect(isValidState({ ...state, moves: [wrongMove] })).toBe(false);
    expect(puzzleHint(state)).toBe(uciToMove(pos(ref.fen), ref.line[0]!));
    if (ref.line.length === 1) expect(puzzleHint(right.state)).toBeNull();
    expect(() => puzzleTurn(state, 'a1a1')).toThrow();
    expect(() => puzzleTurn(createGame({ seed: 1, difficulty: 'beginner', opponent: 'human', humanColor: 'w' }), 'e2e4')).toThrow();
  });

  it('plays a multi-move best line: the engine answers with the stored reply, every step has a hint and wrong tries are not stored', () => {
    const list = puzzlesFor('best', 1);
    const index = list.findIndex((p) => p.line.length >= 3);
    const ref = list[index]!;
    let state = puzzleState('best', 1, index);
    for (let k = 0; k < ref.line.length; k += 2) {
      const here = replay(state.start, state.moves)!.pos;
      expect(puzzleHint(state), `hint ${k}`).toBe(uciToMove(here, ref.line[k]!));
      const wrongMove = legalMoves(here).map(moveToUci).find((m) => m !== ref.line[k])!;
      const wrong = puzzleTurn(state, wrongMove);
      expect(wrong.correct).toBe(false);
      expect(wrong.state).toBe(state);
      const turn = puzzleTurn(state, ref.line[k]!);
      expect(turn.correct).toBe(true);
      // The person's move together with the engine's stored reply (none after the last move).
      expect(turn.state.moves).toEqual(ref.line.slice(0, k + 2));
      state = turn.state;
      expect(isValidState(state)).toBe(true);
    }
    expect(state.moves).toEqual(ref.line);
    expect(outcomeOf(state).kind).toBe('solved');
    expect(puzzleHint(state)).toBeNull();
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
