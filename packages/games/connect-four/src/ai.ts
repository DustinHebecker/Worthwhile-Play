/**
 * Deterministic computer opponent: depth-limited negamax with alpha-beta pruning.
 *
 * The search works on a compact, mutable copy of the board (an Int8Array of 42 cells
 * plus column heights) and only checks the four directions through a newly dropped
 * disc for wins, so even the hard level stays well below a few hundred milliseconds
 * on a phone. Moves are tried centre-first, which makes alpha-beta prune well.
 *
 * Scores are from the point of view of the side to move:
 *  - a win available right now is worth WIN_SCORE + remaining depth (sooner is better,
 *    so losses that come later are preferred to losses that come sooner);
 *  - a full board without a line is 0;
 *  - at the depth limit, `evaluate` scores open lines (threes and twos that the
 *    opponent has not blocked) and discs in the centre column.
 *
 * All moves whose exact value equals the best value are collected and one of them is
 * picked with the seeded PRNG whose state lives in the game state, so every game is
 * reproducible from seed + actions while the computer does not always play the same
 * game.
 *
 * Difficulty semantics (plies searched; an immediate win is always seen one ply further):
 *  - easy:   2 — takes wins, blocks direct threats, otherwise plays positionally.
 *  - medium: 5 — also sees most short combinations.
 *  - hard:   8 — sees double threats several moves ahead.
 */
import { createRngFromState, type Rng } from '@wp/game-core';
import {
  COLS,
  CONNECT,
  LINES,
  ROWS,
  applyMove,
  boardOf,
  computerPlayer,
  createRound,
  drop,
  isComputerTurn,
  other,
  outcomeOf,
  toMove,
  type Board,
  type ConnectFourState,
  type Difficulty,
  type Player,
  type RoundOptions
} from './rules';

export const SEARCH_DEPTH: Readonly<Record<Difficulty, number>> = { easy: 2, medium: 5, hard: 8 };

/** Value of a win that is available right now (plus the remaining depth). */
export const WIN_SCORE = 1_000_000;
const INFINITE = 4 * WIN_SCORE;

/** Heuristic weights for `evaluate`. */
export const THREE_WEIGHT = 50;
export const TWO_WEIGHT = 5;
export const CENTRE_WEIGHT = 3;

/** Columns in the order they are searched: centre first, then outwards (left before right). */
export const MOVE_ORDER: readonly number[] = [3, 2, 4, 1, 5, 0, 6];

const CENTRE_COL = (COLS - 1) / 2;
const LINE_COUNT = LINES.length;
const LINE_CELLS = Int8Array.from(LINES.flat());

/** Ids of the lines through each cell (at most 13 per cell). */
const CELL_LINES: readonly Int8Array[] = Array.from({ length: COLS * ROWS }, (_, cell) =>
  Int8Array.from(LINES.flatMap((line, id) => (line.includes(cell) ? [id] : [])))
);

/** Heuristic value of one window holding `mine` and `theirs` discs, for the owner of `mine`. */
function windowValue(mine: number, theirs: number): number {
  if (theirs === 0) return mine === 3 ? THREE_WEIGHT : mine === 2 ? TWO_WEIGHT : 0;
  if (mine === 0) return theirs === 3 ? -THREE_WEIGHT : theirs === 2 ? -TWO_WEIGHT : 0;
  return 0;
}

/** WINDOW_VALUE[a * 5 + b]: value of a window with `a` discs of player 1 and `b` of player 2, for player 1. */
const WINDOW_VALUE = Int16Array.from({ length: 25 }, (_, i) => windowValue(Math.floor(i / 5), i % 5));

/**
 * Static score of a position for `player` (positive = good for `player`).
 * Every window of four that holds discs of only one side counts: three discs with an
 * empty fourth cell weigh THREE_WEIGHT, two discs TWO_WEIGHT. Each disc in the centre
 * column adds CENTRE_WEIGHT. Symmetric: evaluate(b, 1) === -evaluate(b, 2).
 * (The search keeps the same score up to date incrementally.)
 */
export function evaluate(cells: ArrayLike<number>, player: Player): number {
  let score = 0;
  for (let i = 0; i < LINE_CELLS.length; i += CONNECT) {
    let mine = 0;
    let theirs = 0;
    for (let k = 0; k < CONNECT; k++) {
      const cell = cells[LINE_CELLS[i + k] as number];
      if (cell === player) mine++;
      else if (cell !== 0) theirs++;
    }
    score += windowValue(mine, theirs);
  }
  for (let row = 0; row < ROWS; row++) {
    const cell = cells[row * COLS + CENTRE_COL];
    if (cell === player) score += CENTRE_WEIGHT;
    else if (cell !== 0) score -= CENTRE_WEIGHT;
  }
  return score;
}

/**
 * Mutable search position. Besides the cells it keeps, per line, how many discs each
 * player has in it, and the running `evaluate` score for player 1, so a win check costs
 * at most 13 lookups and a leaf evaluation is free.
 */
class Search {
  readonly cells: Int8Array;
  /** Discs per column. */
  readonly heights = new Int8Array(COLS);
  /** counts[(player - 1) * LINE_COUNT + line]: discs of `player` in `line`. */
  readonly counts = new Int8Array(2 * LINE_COUNT);
  /** `evaluate(cells, 1)`, maintained incrementally. */
  score = 0;
  nodes = 0;

  constructor(board: Board) {
    this.cells = new Int8Array(COLS * ROWS);
    for (let col = 0; col < COLS; col++) {
      for (let row = ROWS - 1; row >= 0 && board[row * COLS + col] !== 0; row--) this.play(col, board[row * COLS + col] as Player);
    }
  }

  /** Row the next disc in `col` lands in (-1 if full). */
  row(col: number): number {
    return ROWS - 1 - (this.heights[col] as number);
  }

  /** True if `player` would complete a line of four by dropping into `col`. */
  winsNow(col: number, player: Player): boolean {
    const row = this.row(col);
    if (row < 0) return false;
    const offset = (player - 1) * LINE_COUNT;
    for (const line of CELL_LINES[row * COLS + col] as Int8Array) if (this.counts[offset + line] === CONNECT - 1) return true;
    return false;
  }

  play(col: number, player: Player): void {
    this.update(this.row(col) * COLS + col, col, player, 1);
    this.heights[col] = (this.heights[col] as number) + 1;
  }

  unplay(col: number): void {
    this.heights[col] = (this.heights[col] as number) - 1;
    const cell = this.row(col) * COLS + col;
    this.update(cell, col, this.cells[cell] as Player, -1);
  }

  private update(cell: number, col: number, player: Player, delta: 1 | -1): void {
    this.cells[cell] = delta > 0 ? player : 0;
    const counts = this.counts;
    for (const line of CELL_LINES[cell] as Int8Array) {
      const one = counts[line] as number;
      const two = counts[LINE_COUNT + line] as number;
      const before = WINDOW_VALUE[one * 5 + two] as number;
      if (player === 1) counts[line] = one + delta;
      else counts[LINE_COUNT + line] = two + delta;
      this.score += (WINDOW_VALUE[(counts[line] as number) * 5 + (counts[LINE_COUNT + line] as number)] as number) - before;
    }
    if (col === CENTRE_COL) this.score += (player === 1 ? CENTRE_WEIGHT : -CENTRE_WEIGHT) * delta;
  }

  /** Negamax value for `player` to move; the previous move did not end the game. */
  negamax(depth: number, alpha: number, beta: number, player: Player): number {
    this.nodes++;
    let canMove = false;
    for (const col of MOVE_ORDER) {
      if (this.row(col) < 0) continue;
      canMove = true;
      if (this.winsNow(col, player)) return WIN_SCORE + depth;
    }
    if (!canMove) return 0;
    if (depth === 0) return player === 1 ? this.score : -this.score;
    const opponent = other(player);
    // Forced moves: any move that leaves an immediate win for the opponent scores the
    // minimum, -(WIN_SCORE + depth - 1). With one threat only the block can do better;
    // with two or more threats nothing can. Skipping the other moves keeps the value exact.
    let threat = -1;
    for (const col of MOVE_ORDER) {
      if (this.row(col) < 0 || !this.winsNow(col, opponent)) continue;
      if (threat >= 0) return -(WIN_SCORE + depth - 1);
      threat = col;
    }
    let best = -INFINITE;
    for (const col of MOVE_ORDER) {
      if (this.row(col) < 0 || (threat >= 0 && col !== threat)) continue;
      this.play(col, player);
      const value = -this.negamax(depth - 1, -beta, -alpha, opponent);
      this.unplay(col);
      if (value > best) best = value;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  }
}

export interface Analysis {
  /** All columns with the best value, ascending. */
  best: number[];
  /** The best value for the side to move. */
  value: number;
  /** Positions visited (for performance tests). */
  nodes: number;
}

/**
 * Searches `depth` plies (>= 1) for the side to move and returns every optimal column.
 * Each root move is searched with a window that still proves ties exactly.
 * Throws if the game is already over.
 */
export function analyse(board: Board, depth: number): Analysis {
  if (outcomeOf(board).kind !== 'playing') throw new RangeError('No move: the game is over');
  if (!Number.isInteger(depth) || depth < 1) throw new RangeError('Depth must be a positive integer');
  const search = new Search(board);
  const player = toMove(board);
  const legal = MOVE_ORDER.filter((col) => search.row(col) >= 0);
  const wins = legal.filter((col) => search.winsNow(col, player));
  if (wins.length > 0) return { best: wins.sort((a, b) => a - b), value: WIN_SCORE + depth, nodes: 1 };
  let bestValue = -INFINITE;
  let best: number[] = [];
  for (const col of legal) {
    search.play(col, player);
    // Window (bestValue - 1, ∞): a result above bestValue - 1 is exact, so ties are found.
    const value = -search.negamax(depth - 1, -INFINITE, 1 - bestValue, other(player));
    search.unplay(col);
    if (value > bestValue) {
      bestValue = value;
      best = [col];
    } else if (value === bestValue) {
      best.push(col);
    }
  }
  return { best: best.sort((a, b) => a - b), value: bestValue, nodes: search.nodes + 1 };
}

/** Optimal columns for the side to move at the given difficulty. */
export function bestMoves(board: Board, difficulty: Difficulty): number[] {
  return analyse(board, SEARCH_DEPTH[difficulty]).best;
}

/** Chooses the computer's column for the side to move. Throws if the game is already over. */
export function chooseMove(board: Board, difficulty: Difficulty, rng: Rng): number {
  return rng.pick(bestMoves(board, difficulty));
}

/**
 * If it is the computer's turn, plays its move and advances the stored PRNG state.
 * Otherwise returns the state unchanged. After this, a game against the computer is
 * always either finished or waiting for the person — never "half a turn".
 */
export function computerReply(state: ConnectFourState): ConnectFourState {
  if (!isComputerTurn(state)) return state;
  const board = boardOf(state);
  const rng = createRngFromState(state.rng);
  const col = chooseMove(board, state.difficulty, rng);
  // Defensive: chooseMove only returns legal moves (property-tested); drop() throws otherwise.
  drop(board, col, computerPlayer(state.starter));
  return { ...state, moves: [...state.moves, col], rng: rng.state() };
}

/** Starts a fresh round from the seed, including the computer's opening move if it starts. */
export function startRound(options: RoundOptions): ConnectFourState {
  return computerReply(createRound(options));
}

/** The person's move followed by the computer's reply (if the opponent is the computer). */
export function playTurn(state: ConnectFourState, col: number): ConnectFourState {
  if (isComputerTurn(state)) throw new RangeError('It is the computer’s turn');
  return computerReply(applyMove(state, col));
}
