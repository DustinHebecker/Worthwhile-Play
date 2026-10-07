/**
 * Deterministic computer opponent.
 *
 * Tic-Tac-Toe has fewer than 6 000 reachable positions, so the AI uses a full,
 * memoised negamax search. All randomness (tie-breaking, deliberate slips) comes
 * from the seeded PRNG whose state is stored in the game state, so every game is
 * reproducible from seed + actions.
 *
 * Difficulty semantics:
 *  - perfect: always picks a game-theoretically optimal move (never loses).
 *  - medium:  optimal, except that with probability MEDIUM_SLIP it plays a random
 *             legal move (and may then miss a win or a block).
 *  - easy:    takes an immediate win when one exists, otherwise plays randomly.
 */
// @ts-nocheck

import { createRngFromState, type Rng } from '@wp/game-core';
import {
  applyMove,
  computerMark,
  createRound,
  isComputerTurn,
  legalMoves,
  outcomeOf,
  place,
  toMove,
  boardOf,
  findWin,
  type Board,
  type Difficulty,
  type Mark,
  type RoundOptions,
  type TicTacToeState
} from './rules';

/** Probability that the medium computer ignores the search and plays a random move. */
export const MEDIUM_SLIP = 0.3;

const memo = new Map<string, number>();

/** Negation that never produces -0 (keeps draw values a plain 0). */
const negate = (value: number): number => 0 - value;

/**
 * Value of `board` for the side to move, under perfect play by both sides.
 * Positive = the side to move wins, negative = it loses, 0 = draw.
 * Faster wins (and slower losses) have larger magnitude: |value| = 1 + empty cells left.
 */
export function negamax(board: Board): number {
  const key = board.map((c) => c || '-').join('');
  const cached = memo.get(key);
  if (cached !== undefined) return cached;
  let value: number;
  const moves = legalMoves(board);
  if (findWin(board)) {
    // The previous mover completed a line, so the side to move has lost.
    value = -(1 + moves.length);
  } else if (moves.length === 0) {
    value = 0;
  } else {
    const mark = toMove(board);
    value = -Infinity;
    for (const move of moves) value = Math.max(value, negate(negamax(place(board, move, mark))));
  }
  memo.set(key, value);
  return value;
}

/** Score of every legal move for the side to move (higher is better for the mover). */
export function scoreMoves(board: Board): Map<number, number> {
  const mark = toMove(board);
  const scores = new Map<number, number>();
  for (const move of legalMoves(board)) scores.set(move, negate(negamax(place(board, move, mark))));
  return scores;
}

/** All optimal moves for the side to move, ascending by index. Empty if the game is over. */
export function bestMoves(board: Board): number[] {
  if (outcomeOf(board).kind !== 'playing') return [];
  const scores = scoreMoves(board);
  const best = Math.max(...scores.values());
  return [...scores].filter(([, score]) => score === best).map(([move]) => move);
}

/** Moves that complete a line for `mark` immediately. */
export function winningMoves(board: Board, mark: Mark): number[] {
  return legalMoves(board).filter((move) => findWin(place(board, move, mark))?.mark === mark);
}

/** Chooses the computer's move for the side to move. Throws if the game is already over. */
export function chooseMove(board: Board, difficulty: Difficulty, rng: Rng): number {
  if (outcomeOf(board).kind !== 'playing') throw new RangeError('No move: the game is over');
  const legal = legalMoves(board);
  switch (difficulty) {
    case 'perfect':
      return rng.pick(bestMoves(board));
    case 'medium':
      return rng.next() < MEDIUM_SLIP ? rng.pick(legal) : rng.pick(bestMoves(board));
    case 'easy': {
      const wins = winningMoves(board, toMove(board));
      return rng.pick(wins.length > 0 ? wins : legal);
    }
  }
}

/**
 * If it is the computer's turn, plays its move and advances the stored PRNG state.
 * Otherwise returns the state unchanged. After this, a game against the computer is
 * always either finished or waiting for the person — never "half a turn".
 */
export function computerReply(state: TicTacToeState): TicTacToeState {
  if (!isComputerTurn(state)) return state;
  const board = boardOf(state);
  const rng = createRngFromState(state.rng);
  const move = chooseMove(board, state.difficulty, rng);
  // Defensive: chooseMove only returns legal moves (property-tested); place() throws otherwise.
  place(board, move, computerMark(state.starter));
  return { ...state, moves: [...state.moves, move], rng: rng.state() };
}

/** Starts a fresh round from the seed, including the computer's opening move if it starts. */
export function startRound(options: RoundOptions): TicTacToeState {
  return computerReply(createRound(options));
}

/** The person's move followed by the computer's reply (if the opponent is the computer). */
export function playTurn(state: TicTacToeState, index: number): TicTacToeState {
  if (isComputerTurn(state)) throw new RangeError('It is the computer’s turn');
  return computerReply(applyMove(state, index));
}
