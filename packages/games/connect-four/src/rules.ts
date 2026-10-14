/**
 * Four in a Row rules: pure, DOM-free board logic and the serializable game state.
 *
 * The board has 7 columns and 6 rows, stored as 42 cells in row-major order with
 * row 0 at the TOP (index = row * COLS + col). Discs fall to the lowest free cell
 * of a column, i.e. to the largest free row number. Player 1 always moves first.
 *
 * The logical state stores the sequence of dropped columns rather than the board, so
 * undo is trivial and the board can never disagree with the history (or float).
 * How the computer chooses its moves lives in `ai.ts`.
 */
import { isArrayOf, isInt, isOneOf, isRecord, isUint32 } from '@wp/game-core';

export type Player = 1 | 2;
export type Cell = 0 | Player;
export type Board = readonly Cell[];

export const COLS = 7;
export const ROWS = 6;
export const CELL_COUNT = COLS * ROWS;
/** Discs needed in a line to win. */
export const CONNECT = 4;

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

export const OPPONENTS = ['computer', 'human'] as const;
export type Opponent = (typeof OPPONENTS)[number];

/** Who plays disc 1 (and therefore moves first) when playing against the computer. */
export const STARTERS = ['human', 'computer'] as const;
export type Starter = (typeof STARTERS)[number];

export type Line = readonly [number, number, number, number];

export const cellIndex = (row: number, col: number): number => row * COLS + col;
export const rowOf = (index: number): number => Math.floor(index / COLS);
export const colOf = (index: number): number => index % COLS;

/**
 * All 69 windows of four cells: 24 horizontal, 21 vertical, then 12 per diagonal
 * direction (down-right, then down-left). Each line lists its cells in walking order.
 */
export const LINES: readonly Line[] = (() => {
  const lines: Line[] = [];
  const directions: readonly (readonly [number, number])[] = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];
  for (const [dr, dc] of directions) {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const endRow = row + dr * (CONNECT - 1);
        const endCol = col + dc * (CONNECT - 1);
        if (endRow >= ROWS || endCol < 0 || endCol >= COLS) continue;
        lines.push([0, 1, 2, 3].map((k) => cellIndex(row + dr * k, col + dc * k)) as unknown as Line);
      }
    }
  }
  return lines;
})();

export function emptyBoard(): Cell[] {
  return Array.from({ length: CELL_COUNT }, () => 0 as Cell);
}

export const other = (player: Player): Player => (player === 1 ? 2 : 1);

/** Player of the n-th move (0-based): player 1 moves first, then the players alternate. */
export const playerOfMove = (moveIndex: number): Player => (moveIndex % 2 === 0 ? 1 : 2);

export function countDiscs(board: Board): { 1: number; 2: number } {
  let one = 0;
  let two = 0;
  for (const cell of board) {
    if (cell === 1) one++;
    else if (cell === 2) two++;
  }
  return { 1: one, 2: two };
}

/** Side to move on a board reached by legal play. */
export function toMove(board: Board): Player {
  const counts = countDiscs(board);
  return counts[1] === counts[2] ? 1 : 2;
}

/** Row a disc dropped into `col` lands in, or -1 if the column is full or does not exist. */
export function dropRow(board: Board, col: number): number {
  if (!Number.isInteger(col) || col < 0 || col >= COLS) return -1;
  for (let row = ROWS - 1; row >= 0; row--) if (board[cellIndex(row, col)] === 0) return row;
  return -1;
}

export function isLegalMove(board: Board, col: number): boolean {
  return dropRow(board, col) >= 0;
}

/** Columns that still have room, ascending. */
export function legalMoves(board: Board): number[] {
  const moves: number[] = [];
  for (let col = 0; col < COLS; col++) if (board[col] === 0) moves.push(col);
  return moves;
}

/** Returns a new board with `player`'s disc dropped into `col`. Throws on an illegal move. */
export function drop(board: Board, col: number, player: Player): Cell[] {
  const row = dropRow(board, col);
  if (row < 0) throw new RangeError(`Illegal move ${col}`);
  const next = [...board];
  next[cellIndex(row, col)] = player;
  return next;
}

/** Every line of four fully occupied by one player, in `LINES` order. */
export function fours(board: Board): { player: Player; line: Line }[] {
  const found: { player: Player; line: Line }[] = [];
  for (const line of LINES) {
    const [a, b, c, d] = line;
    const owner = board[a];
    if (owner && owner === board[b] && owner === board[c] && owner === board[d]) found.push({ player: owner, line });
  }
  return found;
}

export interface Win {
  player: Player;
  /** All cells belonging to any of the winner's lines of four, ascending. */
  cells: number[];
}

/**
 * The winner and all cells of their completed lines, or `null`. On boards reached by
 * legal play at most one player can have a line; otherwise the owner of the first line
 * in `LINES` order is reported.
 */
export function findWin(board: Board): Win | null {
  const all = fours(board);
  const first = all[0];
  if (!first) return null;
  const cells = new Set<number>();
  for (const { player, line } of all) if (player === first.player) for (const i of line) cells.add(i);
  return { player: first.player, cells: [...cells].sort((x, y) => x - y) };
}

export type Outcome = { kind: 'playing' } | { kind: 'won'; win: Win } | { kind: 'draw' };

export function outcomeOf(board: Board): Outcome {
  const win = findWin(board);
  if (win) return { kind: 'won', win };
  return legalMoves(board).length === 0 ? { kind: 'draw' } : { kind: 'playing' };
}

/** Replays a list of dropped columns. Throws if a column overflows. */
export function boardFromMoves(moves: readonly number[]): Cell[] {
  let board = emptyBoard();
  moves.forEach((col, n) => {
    board = drop(board, col, playerOfMove(n));
  });
  return board;
}

/* ------------------------------------------------------------------------ */
/* Game state                                                                 */
/* ------------------------------------------------------------------------ */

/** Serialized logical state. Plain JSON. */
export interface ConnectFourState {
  /** Seed of the current game (uint32). A fresh round restarts the PRNG from it. */
  seed: number;
  /** Computer strength. Kept in human-vs-human mode so switching back restores it. */
  difficulty: Difficulty;
  opponent: Opponent;
  /** Who plays disc 1 and moves first against the computer. Ignored in human-vs-human mode. */
  starter: Starter;
  /** Columns in the order discs were dropped; move n belongs to `playerOfMove(n)`. */
  moves: number[];
  /** PRNG state for the computer's tie-breaking (uint32). */
  rng: number;
}

export interface RoundOptions {
  seed: number;
  difficulty: Difficulty;
  opponent: Opponent;
  starter: Starter;
}

/** An empty board for the given options. The computer's opening move (if any) is added by `ai.ts`. */
export function createRound({ seed, difficulty, opponent, starter }: RoundOptions): ConnectFourState {
  return { seed, difficulty, opponent, starter, moves: [], rng: seed };
}

/** Player number of the person at the device in a game against the computer. */
export const humanPlayer = (starter: Starter): Player => (starter === 'human' ? 1 : 2);

export const computerPlayer = (starter: Starter): Player => other(humanPlayer(starter));

export const boardOf = (state: ConnectFourState): Cell[] => boardFromMoves(state.moves);

export const outcomeOfState = (state: ConnectFourState): Outcome => outcomeOf(boardOf(state));

/** True when it is the computer's turn in an unfinished game against the computer. */
export function isComputerTurn(state: ConnectFourState): boolean {
  if (state.opponent !== 'computer') return false;
  const board = boardOf(state);
  return outcomeOf(board).kind === 'playing' && toMove(board) === computerPlayer(state.starter);
}

/** Adds one move to the state (no computer reply). Throws on an illegal or post-game move. */
export function applyMove(state: ConnectFourState, col: number): ConnectFourState {
  const board = boardOf(state);
  if (outcomeOf(board).kind !== 'playing') throw new RangeError('The game is already over');
  drop(board, col, toMove(board));
  return { ...state, moves: [...state.moves, col] };
}

/**
 * Undo is offered only while the game is still running.
 * Against the computer it needs at least one move by the person.
 */
export function canUndo(state: ConnectFourState): boolean {
  if (outcomeOfState(state).kind !== 'playing') return false;
  if (state.opponent === 'human') return state.moves.length > 0;
  const firstHumanMove = state.starter === 'human' ? 0 : 1;
  return state.moves.length > firstHumanMove;
}

/**
 * Takes back the last move; against the computer, takes back the person's last move
 * together with the computer's reply. The PRNG is not rewound.
 */
export function undo(state: ConnectFourState): ConnectFourState {
  if (!canUndo(state)) return state;
  const moves = [...state.moves];
  if (state.opponent === 'human') {
    moves.pop();
  } else {
    const mine = humanPlayer(state.starter);
    while (moves.length > 0 && playerOfMove(moves.length - 1) !== mine) moves.pop();
    moves.pop();
  }
  return { ...state, moves };
}

/** Thorough structural validation of untrusted data. Never throws. */
export function isValidState(value: unknown): value is ConnectFourState {
  if (!isRecord(value)) return false;
  if (Object.keys(value).length !== 6) return false;
  const { seed, difficulty, opponent, starter, moves, rng } = value;
  if (!isUint32(seed) || !isUint32(rng)) return false;
  if (!isOneOf(difficulty, DIFFICULTIES) || !isOneOf(opponent, OPPONENTS) || !isOneOf(starter, STARTERS)) return false;
  if (!isArrayOf(moves, (m): m is number => isInt(m, 0, COLS - 1)) || moves.length > CELL_COUNT) return false;
  // Replay: no column may overflow and no move may follow a finished game.
  let board = emptyBoard();
  for (let n = 0; n < moves.length; n++) {
    const col = moves[n] as number;
    if (findWin(board) || !isLegalMove(board, col)) return false;
    board = drop(board, col, playerOfMove(n));
  }
  // Against the computer the state is never "half a turn": the computer's reply is
  // always applied together with the person's move.
  if (opponent === 'computer' && outcomeOf(board).kind === 'playing' && toMove(board) !== humanPlayer(starter)) return false;
  return true;
}
