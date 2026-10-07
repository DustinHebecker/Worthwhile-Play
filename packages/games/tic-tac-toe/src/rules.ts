/**
 * Tic-Tac-Toe rules: pure, DOM-free board logic and the serializable game state.
 *
 * The board is 9 cells in row-major order (index = row * 3 + column).
 * X always moves first. The logical state stores the move sequence rather than
 * the board, so undo is trivial and the board can never disagree with the history.
 * How the computer chooses its moves lives in `ai.ts`.
 */
import { isArrayOf, isInt, isOneOf, isRecord, isUint32 } from '@wp/game-core';

export type Mark = 'X' | 'O';
export type Cell = Mark | '';
export type Board = readonly Cell[];

export const SIZE = 3;
export const CELL_COUNT = 9;

export const DIFFICULTIES = ['easy', 'medium', 'perfect'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'medium';

export const OPPONENTS = ['computer', 'human'] as const;
export type Opponent = (typeof OPPONENTS)[number];

/** Who plays X (and therefore moves first) when playing against the computer. */
export const STARTERS = ['human', 'computer'] as const;
export type Starter = (typeof STARTERS)[number];

/** All eight lines of three: rows, columns, then the two diagonals. */
export const LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

export function emptyBoard(): Cell[] {
  return Array.from({ length: CELL_COUNT }, () => '' as Cell);
}

export const other = (mark: Mark): Mark => (mark === 'X' ? 'O' : 'X');

/** Mark of the n-th move (0-based): X moves first, then the players alternate. */
export const markOfMove = (moveIndex: number): Mark => (moveIndex % 2 === 0 ? 'X' : 'O');

export function countMarks(board: Board): { X: number; O: number } {
  let x = 0;
  let o = 0;
  for (const cell of board) {
    if (cell === 'X') x++;
    else if (cell === 'O') o++;
  }
  return { X: x, O: o };
}

/** Side to move on a board reached by legal play. */
export function toMove(board: Board): Mark {
  const { X, O } = countMarks(board);
  return X === O ? 'X' : 'O';
}

export function legalMoves(board: Board): number[] {
  const moves: number[] = [];
  for (let i = 0; i < CELL_COUNT; i++) if (board[i] === '') moves.push(i);
  return moves;
}

export function isLegalMove(board: Board, index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < CELL_COUNT && board[index] === '';
}

/** Returns a new board with `mark` placed at `index`. Throws on an illegal move. */
export function place(board: Board, index: number, mark: Mark): Cell[] {
  if (!isLegalMove(board, index)) throw new RangeError(`Illegal move ${index}`);
  const next = [...board];
  next[index] = mark;
  return next;
}

export interface Win {
  mark: Mark;
  line: readonly [number, number, number];
}

/** The first completed line (in `LINES` order), or `null`. */
export function findWin(board: Board): Win | null {
  for (const line of LINES) {
    const [a, b, c] = line;
    const mark = board[a];
    if (mark !== '' && mark !== undefined && mark === board[b] && mark === board[c]) return { mark, line };
  }
  return null;
}

export type Outcome = { kind: 'playing' } | { kind: 'won'; win: Win } | { kind: 'draw' };

export function outcomeOf(board: Board): Outcome {
  const win = findWin(board);
  if (win) return { kind: 'won', win };
  return legalMoves(board).length === 0 ? { kind: 'draw' } : { kind: 'playing' };
}

export function boardFromMoves(moves: readonly number[]): Cell[] {
  let board = emptyBoard();
  moves.forEach((index, n) => {
    board = place(board, index, markOfMove(n));
  });
  return board;
}

/* ------------------------------------------------------------------------ */
/* Game state                                                                 */
/* ------------------------------------------------------------------------ */

/** Serialized logical state. Plain JSON. */
export interface TicTacToeState {
  /** Seed of the current game (uint32). A fresh round restarts the PRNG from it. */
  seed: number;
  /** Computer strength. Kept in human-vs-human mode so switching back restores it. */
  difficulty: Difficulty;
  opponent: Opponent;
  /** Who plays X and moves first against the computer. Ignored in human-vs-human mode. */
  starter: Starter;
  /** Cell indices in the order they were played; move n is `markOfMove(n)`. */
  moves: number[];
  /** PRNG state for the computer's choices (uint32). */
  rng: number;
}

export interface RoundOptions {
  seed: number;
  difficulty: Difficulty;
  opponent: Opponent;
  starter: Starter;
}

/** An empty board for the given options. The computer's opening move (if any) is added by `ai.ts`. */
export function createRound({ seed, difficulty, opponent, starter }: RoundOptions): TicTacToeState {
  return { seed, difficulty, opponent, starter, moves: [], rng: seed };
}

/** Mark played by the person at the device in a game against the computer. */
export const humanMark = (starter: Starter): Mark => (starter === 'human' ? 'X' : 'O');

export const computerMark = (starter: Starter): Mark => other(humanMark(starter));

export const boardOf = (state: TicTacToeState): Cell[] => boardFromMoves(state.moves);

export const outcomeOfState = (state: TicTacToeState): Outcome => outcomeOf(boardOf(state));

/** True when it is the computer's turn in an unfinished game against the computer. */
export function isComputerTurn(state: TicTacToeState): boolean {
  if (state.opponent !== 'computer') return false;
  const board = boardOf(state);
  return outcomeOf(board).kind === 'playing' && toMove(board) === computerMark(state.starter);
}

/** Adds one move to the state (no computer reply). Throws on an illegal or post-game move. */
export function applyMove(state: TicTacToeState, index: number): TicTacToeState {
  const board = boardOf(state);
  if (outcomeOf(board).kind !== 'playing') throw new RangeError('The game is already over');
  place(board, index, toMove(board));
  return { ...state, moves: [...state.moves, index] };
}

/**
 * Undo is offered only while the game is still running.
 * Against the computer it needs at least one move by the person.
 */
export function canUndo(state: TicTacToeState): boolean {
  if (outcomeOfState(state).kind !== 'playing') return false;
  if (state.opponent === 'human') return state.moves.length > 0;
  const firstHumanMove = state.starter === 'human' ? 0 : 1;
  return state.moves.length > firstHumanMove;
}

/**
 * Takes back the last move; against the computer, takes back the person's last move
 * together with the computer's reply. The PRNG is not rewound.
 */
export function undo(state: TicTacToeState): TicTacToeState {
  if (!canUndo(state)) return state;
  const moves = [...state.moves];
  if (state.opponent === 'human') {
    moves.pop();
  } else {
    const mine = humanMark(state.starter);
    while (moves.length > 0 && markOfMove(moves.length - 1) !== mine) moves.pop();
    moves.pop();
  }
  return { ...state, moves };
}

/** Thorough structural validation of untrusted data. Never throws. */
export function isValidState(value: unknown): value is TicTacToeState {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value);
  if (keys.length !== 6) return false;
  const { seed, difficulty, opponent, starter, moves, rng } = value;
  if (!isUint32(seed) || !isUint32(rng)) return false;
  if (!isOneOf(difficulty, DIFFICULTIES) || !isOneOf(opponent, OPPONENTS) || !isOneOf(starter, STARTERS)) return false;
  if (!isArrayOf(moves, (m): m is number => isInt(m, 0, CELL_COUNT - 1)) || moves.length > CELL_COUNT) return false;
  if (new Set(moves).size !== moves.length) return false;
  // No move may follow a finished game.
  let board = emptyBoard();
  for (let n = 0; n < moves.length; n++) {
    if (findWin(board)) return false;
    board = place(board, moves[n] as number, markOfMove(n));
  }
  // Against the computer the state is never "half a turn": the computer's reply is
  // always applied together with the person's move.
  if (opponent === 'computer' && outcomeOf(board).kind === 'playing' && toMove(board) !== humanMark(starter)) return false;
  return true;
}
