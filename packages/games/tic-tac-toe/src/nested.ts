/**
 * "Board in board" (nested tic-tac-toe): pure, DOM-free rules.
 *
 * Nine small 3×3 boards form a 3×3 big board. A cell is addressed by one global index
 * `g = board * 9 + cell` (0 … 80), where `board` is the small board's position on the big board and
 * `cell` the cell's position inside it, both in row-major order (index = row * 3 + column).
 *
 * Rules (the common international ones):
 *  - X moves first, then the players alternate.
 *  - The cell you play inside a small board sends the opponent to the small board at the same position
 *    on the big board. If that small board is already decided (won or full), the opponent may play in any
 *    open small board.
 *  - Three in a row inside a small board claims it. Decided small boards are closed: nobody plays there again.
 *  - A small board that fills up without a line is claimed by nobody (it counts for neither player).
 *  - Three claimed small boards in a row on the big board win the game. When no open small board is left and
 *    nobody has such a line, the game is a draw.
 *
 * The logical state stores only the move sequence, so the forced board and the claimed boards are always
 * derived from it and can never disagree with the cells.
 */
import { isArrayOf, isInt, isOneOf, isRecord, isUint32 } from '@wp/game-core';
import { DIFFICULTIES, LINES, OPPONENTS, STARTERS, humanMark, markOfMove, type Cell, type Difficulty, type Mark, type Opponent, type Starter } from './rules';

export const NESTED_CELLS = 81;
export const SMALL_BOARDS = 9;

/** Claim of a small board: `X`/`O` won it, `draw` = full without a line (counts for nobody), `''` = still open. */
export type Claim = Mark | 'draw' | '';

export const boardOfCell = (g: number): number => Math.floor(g / 9);
export const cellOfCell = (g: number): number => g % 9;
export const globalIndex = (board: number, cell: number): number => board * 9 + cell;

export interface NestedPosition {
  /** All 81 cells, indexed by global index. */
  readonly cells: readonly Cell[];
  /** Claim of each of the nine small boards. */
  readonly claims: readonly Claim[];
  /** Small board the next move must be played in, or `null` when any open small board may be chosen. */
  readonly forced: number | null;
  readonly toMove: Mark;
  /** Number of moves played so far. */
  readonly ply: number;
  /** The winning line of small boards, if any. */
  readonly win: { mark: Mark; line: readonly [number, number, number] } | null;
}

export type NestedOutcome = { kind: 'playing' } | { kind: 'won'; mark: Mark; line: readonly [number, number, number] } | { kind: 'draw' };

export function emptyNestedPosition(): NestedPosition {
  return {
    cells: Array.from({ length: NESTED_CELLS }, () => '' as Cell),
    claims: Array.from({ length: SMALL_BOARDS }, () => '' as Claim),
    forced: null,
    toMove: 'X',
    ply: 0,
    win: null
  };
}

/** Claim of small board `board` given all 81 cells. */
export function claimOf(cells: readonly Cell[], board: number): Claim {
  const base = board * 9;
  for (const [a, b, c] of LINES) {
    const mark = cells[base + a];
    if (mark && mark === cells[base + b] && mark === cells[base + c]) return mark;
  }
  for (let i = 0; i < 9; i++) if (cells[base + i] === '') return '';
  return 'draw';
}

/** The first line (in `LINES` order) of three small boards claimed by the same player, or `null`. */
export function bigWin(claims: readonly Claim[]): NestedPosition['win'] {
  for (const line of LINES) {
    const [a, b, c] = line;
    const mark = claims[a];
    if ((mark === 'X' || mark === 'O') && mark === claims[b] && mark === claims[c]) return { mark, line };
  }
  return null;
}

export function nestedOutcome(position: NestedPosition): NestedOutcome {
  if (position.win) return { kind: 'won', mark: position.win.mark, line: position.win.line };
  return position.claims.includes('') ? { kind: 'playing' } : { kind: 'draw' };
}

/** Small boards the side to move may play in (ascending); empty when the game is over. */
export function playableBoards(position: NestedPosition): number[] {
  if (nestedOutcome(position).kind !== 'playing') return [];
  if (position.forced !== null) return [position.forced];
  const boards: number[] = [];
  for (let b = 0; b < SMALL_BOARDS; b++) if (position.claims[b] === '') boards.push(b);
  return boards;
}

/** All legal global cell indices for the side to move, ascending. */
export function nestedLegalMoves(position: NestedPosition): number[] {
  const moves: number[] = [];
  for (const board of playableBoards(position)) {
    for (let i = 0; i < 9; i++) if (position.cells[board * 9 + i] === '') moves.push(board * 9 + i);
  }
  return moves;
}

export function isNestedLegal(position: NestedPosition, g: number): boolean {
  if (!Number.isInteger(g) || g < 0 || g >= NESTED_CELLS || position.cells[g] !== '') return false;
  return playableBoards(position).includes(boardOfCell(g));
}

/** Plays the side to move at global index `g`. Returns a new position; throws on an illegal move. */
export function playNested(position: NestedPosition, g: number): NestedPosition {
  if (!isNestedLegal(position, g)) throw new RangeError(`Illegal move ${g}`);
  const cells = [...position.cells];
  cells[g] = position.toMove;
  const claims = [...position.claims];
  const board = boardOfCell(g);
  claims[board] = claimOf(cells, board);
  const target = cellOfCell(g);
  return {
    cells,
    claims,
    forced: claims[target] === '' ? target : null,
    toMove: position.toMove === 'X' ? 'O' : 'X',
    ply: position.ply + 1,
    win: bigWin(claims)
  };
}

/** Replays a move list from the empty board. Throws on an illegal move. */
export function nestedFromMoves(moves: readonly number[]): NestedPosition {
  let position = emptyNestedPosition();
  for (const g of moves) position = playNested(position, g);
  return position;
}

/* ------------------------------------------------------------------------ */
/* Game state                                                                 */
/* ------------------------------------------------------------------------ */

export interface NestedState {
  variant: 'nested';
  seed: number;
  difficulty: Difficulty;
  opponent: Opponent;
  /** Who plays X (and moves first) against the computer. */
  starter: Starter;
  /** Global cell indices in the order played; move n is `markOfMove(n)`. */
  moves: number[];
  /** PRNG state for the computer's choices (uint32). */
  rng: number;
}

export interface NestedOptions {
  seed: number;
  difficulty: Difficulty;
  opponent: Opponent;
  starter: Starter;
}

export function createNestedRound({ seed, difficulty, opponent, starter }: NestedOptions): NestedState {
  return { variant: 'nested', seed, difficulty, opponent, starter, moves: [], rng: seed };
}

export const nestedPositionOf = (state: NestedState): NestedPosition => nestedFromMoves(state.moves);

export function isNestedComputerTurn(state: NestedState): boolean {
  if (state.opponent !== 'computer') return false;
  const position = nestedPositionOf(state);
  return nestedOutcome(position).kind === 'playing' && position.toMove !== humanMark(state.starter);
}

/** Adds one move (no computer reply). Throws on an illegal or post-game move. */
export function applyNestedMove(state: NestedState, g: number): NestedState {
  playNested(nestedPositionOf(state), g);
  return { ...state, moves: [...state.moves, g] };
}

export function canUndoNested(state: NestedState): boolean {
  if (nestedOutcome(nestedPositionOf(state)).kind !== 'playing') return false;
  if (state.opponent === 'human') return state.moves.length > 0;
  return state.moves.length > (state.starter === 'human' ? 0 : 1);
}

/** Takes back the last move, or against the computer the person's last move with the computer's reply. */
export function undoNested(state: NestedState): NestedState {
  if (!canUndoNested(state)) return state;
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

/**
 * Thorough validation of untrusted data. Never throws. Every move is replayed, so the forced board
 * of each move (the previous move's cell position, unless that small board is decided) and the claims
 * (derived from the small boards' contents) are checked by construction.
 */
export function isValidNestedState(value: unknown): value is NestedState {
  if (!isRecord(value)) return false;
  if (Object.keys(value).length !== 7 || value.variant !== 'nested') return false;
  const { seed, difficulty, opponent, starter, moves, rng } = value;
  if (!isUint32(seed) || !isUint32(rng)) return false;
  if (!isOneOf(difficulty, DIFFICULTIES) || !isOneOf(opponent, OPPONENTS) || !isOneOf(starter, STARTERS)) return false;
  if (!isArrayOf(moves, (m): m is number => isInt(m, 0, NESTED_CELLS - 1)) || moves.length > NESTED_CELLS) return false;
  let position = emptyNestedPosition();
  for (const g of moves) {
    if (!isNestedLegal(position, g)) return false;
    position = playNested(position, g);
  }
  if (opponent === 'computer' && nestedOutcome(position).kind === 'playing' && position.toMove !== humanMark(starter)) return false;
  return true;
}
