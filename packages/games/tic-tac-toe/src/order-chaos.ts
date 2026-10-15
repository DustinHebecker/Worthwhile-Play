/**
 * Order & Chaos: pure, DOM-free rules.
 *
 * A 6×6 board (cell index = row * 6 + column). On every turn the player to move places EITHER an X or an O
 * on any empty cell. Order moves first.
 *  - Order wins as soon as the board shows exactly five equal symbols in an unbroken line (across, down or
 *    diagonally). Following the inventor's balancing suggestion, a line of six does not count.
 *  - Chaos wins when the board is full without such a line.
 * A line of five counts no matter who placed its last symbol.
 */
import { isArrayOf, isInt, isOneOf, isRecord, isUint32 } from '@wp/game-core';
import { DIFFICULTIES, OPPONENTS, type Cell, type Difficulty, type Mark, type Opponent } from './rules';

export const OC_SIZE = 6;
export const OC_CELLS = 36;
export const RUN = 5;

export const ROLES = ['order', 'chaos'] as const;
export type Role = (typeof ROLES)[number];
export const otherRole = (role: Role): Role => (role === 'order' ? 'chaos' : 'order');

/** Order moves on even plies (0, 2, …), Chaos on odd plies. */
export const roleOfMove = (ply: number): Role => (ply % 2 === 0 ? 'order' : 'chaos');

export interface OcMove {
  cell: number;
  mark: Mark;
}

/**
 * Every maximal straight line of at least five cells: 6 rows, 6 columns, and for each diagonal direction the
 * long diagonal (6 cells) plus its two neighbours (5 cells each). 18 lines, cells in order along the line.
 */
export const OC_LINES: readonly (readonly number[])[] = (() => {
  const lines: number[][] = [];
  const at = (r: number, c: number) => r * OC_SIZE + c;
  const range = (n: number) => Array.from({ length: n }, (_, i) => i);
  for (let r = 0; r < OC_SIZE; r++) lines.push(range(OC_SIZE).map((c) => at(r, c)));
  for (let c = 0; c < OC_SIZE; c++) lines.push(range(OC_SIZE).map((r) => at(r, c)));
  for (const [r0, c0, n] of [[0, 0, 6], [0, 1, 5], [1, 0, 5]] as const) lines.push(range(n).map((i) => at(r0 + i, c0 + i)));
  for (const [r0, c0, n] of [[0, 5, 6], [0, 4, 5], [1, 5, 5]] as const) lines.push(range(n).map((i) => at(r0 + i, c0 - i)));
  return lines;
})();

export function emptyOcBoard(): Cell[] {
  return Array.from({ length: OC_CELLS }, () => '' as Cell);
}

export interface Five {
  mark: Mark;
  cells: readonly number[];
}

/** The first run of exactly five equal symbols (runs of six are ignored), or `null`. */
export function findFive(board: readonly Cell[]): Five | null {
  for (const line of OC_LINES) {
    let start = 0;
    while (start < line.length) {
      const mark = board[line[start]!];
      let end = start + 1;
      while (end < line.length && board[line[end]!] === mark) end++;
      if (mark && end - start === RUN) return { mark, cells: line.slice(start, end) };
      start = end;
    }
  }
  return null;
}

export type OcOutcome = { kind: 'playing' } | { kind: 'order'; five: Five } | { kind: 'chaos' };

export function ocOutcome(board: readonly Cell[]): OcOutcome {
  const five = findFive(board);
  if (five) return { kind: 'order', five };
  return board.includes('') ? { kind: 'playing' } : { kind: 'chaos' };
}

export function ocBoardFromMoves(moves: readonly OcMove[]): Cell[] {
  const board = emptyOcBoard();
  for (const { cell, mark } of moves) {
    if (!isOcCellFree(board, cell)) throw new RangeError(`Illegal move ${cell}`);
    board[cell] = mark;
  }
  return board;
}

export function isOcCellFree(board: readonly Cell[], cell: number): boolean {
  return Number.isInteger(cell) && cell >= 0 && cell < OC_CELLS && board[cell] === '';
}

/* ------------------------------------------------------------------------ */
/* Game state                                                                 */
/* ------------------------------------------------------------------------ */

export interface OrderChaosState {
  variant: 'order-chaos';
  seed: number;
  difficulty: Difficulty;
  opponent: Opponent;
  /** The person's role against the computer (the computer plays the other). Ignored between two people. */
  role: Role;
  /** Moves in order; move n is played by `roleOfMove(n)`. */
  moves: OcMove[];
  /** PRNG state for the computer's choices (uint32). */
  rng: number;
}

export interface OrderChaosOptions {
  seed: number;
  difficulty: Difficulty;
  opponent: Opponent;
  role: Role;
}

export function createOcRound({ seed, difficulty, opponent, role }: OrderChaosOptions): OrderChaosState {
  return { variant: 'order-chaos', seed, difficulty, opponent, role, moves: [], rng: seed };
}

export const ocBoardOf = (state: OrderChaosState): Cell[] => ocBoardFromMoves(state.moves);

export function isOcComputerTurn(state: OrderChaosState): boolean {
  if (state.opponent !== 'computer') return false;
  return ocOutcome(ocBoardOf(state)).kind === 'playing' && roleOfMove(state.moves.length) !== state.role;
}

/** Adds one move (no computer reply). Throws on an occupied cell or a finished game. */
export function applyOcMove(state: OrderChaosState, move: OcMove): OrderChaosState {
  const board = ocBoardOf(state);
  if (ocOutcome(board).kind !== 'playing') throw new RangeError('The game is already over');
  if (!isOcCellFree(board, move.cell) || (move.mark !== 'X' && move.mark !== 'O')) throw new RangeError(`Illegal move ${move.cell}`);
  return { ...state, moves: [...state.moves, { cell: move.cell, mark: move.mark }] };
}

export function canUndoOc(state: OrderChaosState): boolean {
  if (ocOutcome(ocBoardOf(state)).kind !== 'playing') return false;
  if (state.opponent === 'human') return state.moves.length > 0;
  return state.moves.length > (state.role === 'order' ? 0 : 1);
}

/** Takes back the last move, or against the computer the person's last move with the computer's reply. */
export function undoOc(state: OrderChaosState): OrderChaosState {
  if (!canUndoOc(state)) return state;
  const moves = state.moves.map((m) => ({ ...m }));
  if (state.opponent === 'human') {
    moves.pop();
  } else {
    while (moves.length > 0 && roleOfMove(moves.length - 1) !== state.role) moves.pop();
    moves.pop();
  }
  return { ...state, moves };
}

const isOcMove = (value: unknown): value is OcMove =>
  isRecord(value) && Object.keys(value).length === 2 && isInt(value.cell, 0, OC_CELLS - 1) && (value.mark === 'X' || value.mark === 'O');

/** Thorough validation of untrusted data. Never throws. */
export function isValidOcState(value: unknown): value is OrderChaosState {
  if (!isRecord(value)) return false;
  if (Object.keys(value).length !== 7 || value.variant !== 'order-chaos') return false;
  const { seed, difficulty, opponent, role, moves, rng } = value;
  if (!isUint32(seed) || !isUint32(rng)) return false;
  if (!isOneOf(difficulty, DIFFICULTIES) || !isOneOf(opponent, OPPONENTS) || !isOneOf(role, ROLES)) return false;
  if (!isArrayOf(moves, isOcMove) || moves.length > OC_CELLS) return false;
  const board = emptyOcBoard();
  for (const { cell, mark } of moves) {
    // No move may follow a finished game, and every cell is used at most once.
    if (board[cell] !== '' || findFive(board)) return false;
    board[cell] = mark;
  }
  if (opponent === 'computer' && ocOutcome(board).kind === 'playing' && roleOfMove(moves.length) !== role) return false;
  return true;
}
