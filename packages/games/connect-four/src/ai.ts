/**
 * Deterministic computer opponent: depth-limited negamax with alpha-beta pruning, for
 * every variant (7 × 6, 8 × 7, 9 × 7; four or five in a row; with or without pull-outs).
 *
 * The search works on a compact, mutable copy of the board (an Int8Array plus column
 * heights) and keeps per-line disc counts up to date, so a drop's win check only looks
 * at the lines through the new disc and a pull-out (which shifts a whole column) is
 * judged by the number of complete lines per player. Moves are tried centre-first
 * (drops before pulls), which makes alpha-beta prune well.
 *
 * Scores are from the point of view of the side to move:
 *  - a win available right now is worth WIN_SCORE + remaining depth (sooner is better,
 *    so losses that come later are preferred to losses that come sooner); a pull-out
 *    that completes only the opponent's line loses at once (-(WIN_SCORE + depth));
 *  - a position without a legal move is a draw (0);
 *  - at the depth limit, `evaluate` scores open lines (windows with `connect - 1` and
 *    `connect - 2` discs that the opponent has not blocked) and discs in the centre
 *    column(s).
 * Repetition and the move limit are only judged at the root (a root move that repeats a
 * position for the third time, or reaches the move limit without winning, is worth 0).
 *
 * All moves whose exact value equals the best value are collected and one of them is
 * picked with the seeded PRNG whose state lives in the game state, so every game is
 * reproducible from seed + actions while the computer does not always play the same
 * game.
 *
 * Difficulty semantics (plies searched on the standard board, see `searchDepth` for the
 * other variants; an immediate win is always seen one ply further), see LEVEL_POLICY for
 * the deliberate imperfections of the lower levels:
 *  - easy:   2 — always takes a win, but overlooks a direct threat fairly often and
 *              plays a casual (yet never gift-giving) move about half the time.
 *              Meant to be beatable by a casual adult player.
 *  - medium: 5 — sees short combinations; now and then plays a casual safe move.
 *  - hard:   8 — always plays the searched move; sees double threats several moves ahead.
 */
import { createRngFromState, type Rng } from '@wp/game-core';
import {
  applyMove,
  createRound,
  gameOf,
  geometryOf,
  isComputerTurn,
  isPull,
  moveColumn,
  moveLimit,
  other,
  positionKey,
  pullMove,
  type Board,
  type ConnectFourState,
  type Difficulty,
  type Geometry,
  type Move,
  type Player,
  type RoundOptions,
  type Variant
} from './rules';

/** Plies searched on the standard board (7 × 6, four in a row, no pull-outs). */
export const SEARCH_DEPTH: Readonly<Record<Difficulty, number>> = { easy: 2, medium: 5, hard: 8 };

/** Plies of the hard level per variant ("size/goal"), with drops only and with pull-outs. */
const HARD_DEPTH: Readonly<Record<'drop' | 'pull', Readonly<Record<string, number>>>> = {
  drop: { '7x6/4': 8, '7x6/5': 8, '8x7/4': 8, '8x7/5': 8, '9x7/4': 7, '9x7/5': 7 },
  pull: { '7x6/4': 7, '7x6/5': 7, '8x7/4': 7, '8x7/5': 6, '9x7/4': 6, '9x7/5': 5 }
};

/**
 * Plies searched for a variant. Easy always searches 2 plies. Medium searches 5, except
 * 4 with pull-outs on the wider boards. Hard searches 8 on the standard board and as
 * listed in HARD_DEPTH elsewhere: wider boards and pull-outs have more moves per position
 * (and a pull-out shifts a whole column), so hard searches less there to keep a move fast
 * on a phone. The node counts are pinned in test/ai.test.ts ("stays fast") and the level
 * margins per variant in test/strength.test.ts.
 */
export function searchDepth(variant: Variant, difficulty: Difficulty): number {
  if (difficulty === 'easy') return SEARCH_DEPTH.easy;
  if (difficulty === 'medium') return variant.pullOut && variant.size !== '7x6' ? SEARCH_DEPTH.medium - 1 : SEARCH_DEPTH.medium;
  return HARD_DEPTH[variant.pullOut ? 'pull' : 'drop'][`${variant.size}/${variant.connect}`] ?? SEARCH_DEPTH.hard;
}

/** Value of a win that is available right now (plus the remaining depth). */
export const WIN_SCORE = 1_000_000;
const INFINITE = 4 * WIN_SCORE;

/** Heuristic weights for `evaluate`: windows one disc short of a line, two short, and centre discs. */
export const THREE_WEIGHT = 50;
export const TWO_WEIGHT = 5;
export const CENTRE_WEIGHT = 3;

/** A position for the search: board and side to move. */
export interface Position {
  readonly variant: Variant;
  readonly cells: Board;
  readonly turn: Player;
}

/** Columns in the order they are searched: centre first, then outwards (left before right). */
export function moveOrder(cols: number): number[] {
  const centre = (cols - 1) / 2;
  return Array.from({ length: cols }, (_, col) => col).sort((a, b) => Math.abs(a - centre) - Math.abs(b - centre) || a - b);
}

/** The centre column, or both middle columns on an even-width board. */
export const centreColumns = (cols: number): number[] => (cols % 2 === 1 ? [(cols - 1) / 2] : [cols / 2 - 1, cols / 2]);

/** Heuristic value of one window holding `mine` and `theirs` discs, for the owner of `mine`. */
function windowValue(mine: number, theirs: number, connect: number): number {
  if (theirs === 0) return mine === connect - 1 ? THREE_WEIGHT : mine === connect - 2 ? TWO_WEIGHT : 0;
  if (mine === 0) return theirs === connect - 1 ? -THREE_WEIGHT : theirs === connect - 2 ? -TWO_WEIGHT : 0;
  return 0;
}

/** Precomputed search tables of one geometry. */
interface Tables {
  readonly geo: Geometry;
  readonly order: readonly number[];
  readonly isCentre: Uint8Array;
  /** Ids of the lines through each cell. */
  readonly cellLines: readonly Int16Array[];
  /** windowValue[a * (connect + 1) + b] for `a` discs of player 1 and `b` of player 2, for player 1. */
  readonly windowValue: Int16Array;
}

const tablesCache = new Map<Geometry, Tables>();

function tablesOf(geo: Geometry): Tables {
  const cached = tablesCache.get(geo);
  if (cached) return cached;
  const isCentre = new Uint8Array(geo.cols);
  for (const col of centreColumns(geo.cols)) isCentre[col] = 1;
  const cellLines: Int16Array[] = Array.from({ length: geo.cellCount }, () => new Int16Array(0));
  const perCell: number[][] = Array.from({ length: geo.cellCount }, () => []);
  geo.lines.forEach((line, id) => line.forEach((cell) => perCell[cell]?.push(id)));
  perCell.forEach((ids, cell) => (cellLines[cell] = Int16Array.from(ids)));
  const n = geo.connect + 1;
  const tables: Tables = {
    geo,
    order: moveOrder(geo.cols),
    isCentre,
    cellLines,
    windowValue: Int16Array.from({ length: n * n }, (_, i) => windowValue(Math.floor(i / n), i % n, geo.connect))
  };
  tablesCache.set(geo, tables);
  return tables;
}

/**
 * Static score of a board for `player` (positive = good for `player`).
 * Every window that holds discs of only one side counts: `connect - 1` discs weigh
 * THREE_WEIGHT, `connect - 2` discs TWO_WEIGHT. Each disc in a centre column adds
 * CENTRE_WEIGHT. Symmetric: evaluate(b, 1) === -evaluate(b, 2), and mirror-symmetric.
 * (The search keeps the same score up to date incrementally.)
 */
export function evaluate(variant: Variant, cells: ArrayLike<number>, player: Player): number {
  const geo = geometryOf(variant);
  let score = 0;
  for (const line of geo.lines) {
    let mine = 0;
    let theirs = 0;
    for (const i of line) {
      const cell = cells[i];
      if (cell === player) mine++;
      else if (cell !== 0) theirs++;
    }
    score += windowValue(mine, theirs, geo.connect);
  }
  for (const col of centreColumns(geo.cols)) {
    for (let row = 0; row < geo.rows; row++) {
      const cell = cells[row * geo.cols + col];
      if (cell === player) score += CENTRE_WEIGHT;
      else if (cell !== 0) score -= CENTRE_WEIGHT;
    }
  }
  return score;
}

/**
 * Mutable search position. Besides the cells it keeps, per line, how many discs each
 * player has in it, how many complete lines each player has, and the running
 * `evaluate` score for player 1, so win checks are cheap and a leaf evaluation is free.
 */
class Search {
  readonly t: Tables;
  readonly cols: number;
  readonly rows: number;
  readonly connect: number;
  readonly lineCount: number;
  readonly pullOut: boolean;
  readonly cells: Int8Array;
  /** Discs per column. */
  readonly heights: Int8Array;
  /** counts[(player - 1) * lineCount + line]: discs of `player` in `line`. */
  readonly counts: Int8Array;
  /** complete[player]: complete lines of `player` (index 0 unused). */
  readonly complete = [0, 0, 0];
  /** `evaluate(cells, 1)`, maintained incrementally. */
  score = 0;
  nodes = 0;
  /** Scratch buffer for column contents during pulls. */
  private readonly column: Int8Array;

  constructor(variant: Variant, board: Board) {
    const geo = geometryOf(variant);
    this.t = tablesOf(geo);
    this.cols = geo.cols;
    this.rows = geo.rows;
    this.connect = geo.connect;
    this.lineCount = geo.lines.length;
    this.pullOut = variant.pullOut;
    this.cells = new Int8Array(geo.cellCount);
    this.heights = new Int8Array(geo.cols);
    this.counts = new Int8Array(2 * this.lineCount);
    this.column = new Int8Array(geo.rows);
    for (let col = 0; col < this.cols; col++) {
      for (let row = this.rows - 1; row >= 0 && board[row * this.cols + col] !== 0; row--) this.put(col, board[row * this.cols + col] as Player);
    }
  }

  /** Row the next disc in `col` lands in (-1 if full). */
  row(col: number): number {
    return this.rows - 1 - (this.heights[col] as number);
  }

  canPull(col: number, player: Player): boolean {
    return this.pullOut && this.cells[(this.rows - 1) * this.cols + col] === player;
  }

  /** True if `player` would complete a line by dropping into `col`. */
  dropWins(col: number, player: Player): boolean {
    const row = this.row(col);
    if (row < 0) return false;
    const offset = (player - 1) * this.lineCount;
    for (const line of this.t.cellLines[row * this.cols + col] as Int16Array) if (this.counts[offset + line] === this.connect - 1) return true;
    return false;
  }

  /**
   * Cheap necessary condition for `pullWins`: a pull only shifts this column, so a new
   * line of `player` must run through one of its occupied cells and lack exactly one
   * disc now (vertical lines cannot newly complete: a shifted run was complete before).
   */
  private mayPullWin(col: number, player: Player): boolean {
    const offset = (player - 1) * this.lineCount;
    const top = this.rows - (this.heights[col] as number);
    for (let row = this.rows - 1; row >= top; row--) {
      for (const line of this.t.cellLines[row * this.cols + col] as Int16Array) if (this.counts[offset + line] === this.connect - 1) return true;
    }
    return false;
  }

  /** True if `player` would win at once by pulling the bottom disc of `col` (assumes it is legal). */
  pullWins(col: number, player: Player): boolean {
    if (!this.mayPullWin(col, player)) return false;
    this.pull(col);
    const wins = (this.complete[player] as number) > 0;
    this.unpull(col, player);
    return wins;
  }

  /** True if `move` by `player` completes only the opponent's line (possible for pull-outs only). */
  losesAtOnce(move: Move, player: Player): boolean {
    if (!isPull(move)) return false;
    this.play(move, player);
    const lost = (this.complete[other(player)] as number) > 0 && (this.complete[player] as number) === 0;
    this.unplay(move, player);
    return lost;
  }

  /** True if `player` (to move) has a move that wins at once. */
  hasWin(player: Player): boolean {
    for (let col = 0; col < this.cols; col++) {
      if (this.dropWins(col, player)) return true;
      if (this.canPull(col, player) && this.pullWins(col, player)) return true;
    }
    return false;
  }

  /** Legal moves of `player` in search order: drops centre-first, then pulls centre-first. */
  moves(player: Player): Move[] {
    const moves: Move[] = [];
    for (const col of this.t.order) if (this.row(col) >= 0) moves.push(col);
    if (this.pullOut) for (const col of this.t.order) if (this.canPull(col, player)) moves.push(pullMove(col));
    return moves;
  }

  play(move: Move, player: Player): void {
    if (isPull(move)) this.pull(moveColumn(move));
    else this.put(move, player);
  }

  unplay(move: Move, player: Player): void {
    if (isPull(move)) this.unpull(moveColumn(move), player);
    else this.take(move);
  }

  /** Drops `player`'s disc into `col`. */
  private put(col: number, player: Player): void {
    this.update(this.row(col) * this.cols + col, col, player, 1);
    this.heights[col] = (this.heights[col] as number) + 1;
  }

  /** Removes the top disc of `col`. */
  private take(col: number): void {
    this.heights[col] = (this.heights[col] as number) - 1;
    const cell = this.row(col) * this.cols + col;
    this.update(cell, col, this.cells[cell] as Player, -1);
  }

  /** Reads the column bottom-up into the scratch buffer and empties it; returns the height. */
  private lift(col: number): number {
    const height = this.heights[col] as number;
    for (let k = 0; k < height; k++) this.column[k] = this.cells[(this.rows - 1 - k) * this.cols + col] as number;
    for (let k = 0; k < height; k++) this.take(col);
    return height;
  }

  private pull(col: number): void {
    const height = this.lift(col);
    for (let k = 1; k < height; k++) this.put(col, this.column[k] as Player);
  }

  private unpull(col: number, player: Player): void {
    const height = this.lift(col);
    this.put(col, player);
    for (let k = 0; k < height; k++) this.put(col, this.column[k] as Player);
  }

  private update(cell: number, col: number, player: Player, delta: 1 | -1): void {
    this.cells[cell] = delta > 0 ? player : 0;
    const { counts, lineCount, connect } = this;
    const n = connect + 1;
    const table = this.t.windowValue;
    const offset = (player - 1) * lineCount;
    for (const line of this.t.cellLines[cell] as Int16Array) {
      const one = counts[line] as number;
      const two = counts[lineCount + line] as number;
      const before = table[one * n + two] as number;
      const mine = (counts[offset + line] as number) + delta;
      counts[offset + line] = mine;
      if (delta > 0 && mine === connect) this.complete[player] = (this.complete[player] as number) + 1;
      else if (delta < 0 && mine === connect - 1) this.complete[player] = (this.complete[player] as number) - 1;
      this.score += (table[(counts[line] as number) * n + (counts[lineCount + line] as number)] as number) - before;
    }
    if (this.t.isCentre[col]) this.score += (player === 1 ? CENTRE_WEIGHT : -CENTRE_WEIGHT) * delta;
  }

  /** Negamax value for `player` to move; the previous move did not end the game. */
  negamax(depth: number, alpha: number, beta: number, player: Player): number {
    this.nodes++;
    if (this.hasWin(player)) return WIN_SCORE + depth;
    const moves = this.moves(player);
    if (moves.length === 0) return 0;
    if (depth === 0) return player === 1 ? this.score : -this.score;
    const opponent = other(player);
    let candidates = moves;
    if (!this.pullOut) {
      // Forced moves (drops only): any move that leaves an immediate win for the opponent
      // scores the minimum, -(WIN_SCORE + depth - 1). With one threat only the block can do
      // better; with two or more nothing can. Skipping the other moves keeps the value exact.
      // (With pull-outs a move can also remove a threat, so this shortcut is not used there.)
      let threat = -1;
      for (const col of moves) {
        if (!this.dropWins(col, opponent)) continue;
        if (threat >= 0) return -(WIN_SCORE + depth - 1);
        threat = col;
      }
      if (threat >= 0) candidates = [threat];
    }
    let best = -INFINITE;
    for (const move of candidates) {
      this.play(move, player);
      // A pull-out that completes only the opponent's line loses at once (own wins were handled above).
      const value = (this.complete[opponent] as number) > 0 ? -(WIN_SCORE + depth) : -this.negamax(depth - 1, -beta, -alpha, opponent);
      this.unplay(move, player);
      if (value > best) best = value;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  }
}

export interface Analysis {
  /** All moves with the best value, ascending (pulls, being negative, first). */
  best: Move[];
  /** The best value for the side to move. */
  value: number;
  /** Positions visited (for performance tests). */
  nodes: number;
}

/** Game history the root search needs to judge repetition and the move limit. */
export interface History {
  /** Occurrences of each `positionKey` so far, including the current position. */
  seen: ReadonlyMap<string, number>;
  /** Moves played so far. */
  ply: number;
}

/** Winning moves for `player` (as if they were to move), ascending. */
function winningMoves(search: Search, player: Player): Move[] {
  const wins: Move[] = [];
  for (let col = 0; col < search.cols; col++) {
    if (search.dropWins(col, player)) wins.push(col);
    if (search.canPull(col, player) && search.pullWins(col, player)) wins.push(pullMove(col));
  }
  return wins.sort((a, b) => a - b);
}

/**
 * Searches `depth` plies (>= 1) for the side to move and returns every optimal move.
 * Each root move is searched with a window that still proves ties exactly.
 * Throws if the side to move has no legal move or the depth is invalid.
 */
export function analyse(position: Position, depth: number, history?: History): Analysis {
  if (!Number.isInteger(depth) || depth < 1) throw new RangeError('Depth must be a positive integer');
  const search = new Search(position.variant, position.cells);
  const player = position.turn;
  const opponent = other(player);
  if ((search.complete[1] as number) + (search.complete[2] as number) > 0) throw new RangeError('No move: the game is over');
  const legal = search.moves(player);
  if (legal.length === 0) throw new RangeError('No move: no legal move');
  const wins = winningMoves(search, player);
  if (wins.length > 0) return { best: wins, value: WIN_SCORE + depth, nodes: 1 };
  const limit = history ? moveLimit(position.variant) : Infinity;
  let bestValue = -INFINITE;
  let best: Move[] = [];
  for (const move of legal) {
    search.play(move, player);
    let value: number;
    if ((search.complete[opponent] as number) > 0) value = -(WIN_SCORE + depth);
    else if (history && ((history.seen.get(positionKey(Array.from(search.cells) as Board, opponent)) ?? 0) >= 2 || history.ply + 1 >= limit)) value = 0;
    // Window (bestValue - 1, ∞): a result above bestValue - 1 is exact, so ties are found.
    else value = -search.negamax(depth - 1, -INFINITE, 1 - bestValue, opponent) + 0;
    search.unplay(move, player);
    if (value > bestValue) {
      bestValue = value;
      best = [move];
    } else if (value === bestValue) {
      best.push(move);
    }
  }
  return { best: best.sort((a, b) => a - b), value: bestValue, nodes: search.nodes + 1 };
}

/** Optimal moves for the side to move at the given difficulty. */
export function bestMoves(position: Position, difficulty: Difficulty, history?: History): Move[] {
  return analyse(position, searchDepth(position.variant, difficulty), history).best;
}

/**
 * How each level plays, beyond its search depth. Probabilities are drawn from the
 * seeded PRNG stored in the game state, so games stay reproducible.
 *  - `missBlock`: chance of overlooking a single immediate threat (the level then plays
 *    as if it were not there). Immediate wins are always taken.
 *  - `loose`: chance of a casual move instead of the searched one: any move that does
 *    not lose at once or hand the opponent an immediate win (never an absurd gift).
 */
export interface LevelPolicy {
  missBlock: number;
  loose: number;
}

export const LEVEL_POLICY: Readonly<Record<Difficulty, LevelPolicy>> = {
  easy: { missBlock: 0.4, loose: 0.5 },
  medium: { missBlock: 0, loose: 0.15 },
  hard: { missBlock: 0, loose: 0 }
};

/** Moves of `player` that win right now (as if `player` were to move), ascending. */
export function immediateWins(variant: Variant, board: Board, player: Player): Move[] {
  return winningMoves(new Search(variant, board), player);
}

/** Legal moves after which the side to move has not lost and the opponent has no immediate win (ascending). */
export function safeMoves(position: Position): Move[] {
  const search = new Search(position.variant, position.cells);
  const player = position.turn;
  const opponent = other(player);
  const safe: Move[] = [];
  for (const move of search.moves(player)) {
    if (search.losesAtOnce(move, player)) continue;
    search.play(move, player);
    if (!search.hasWin(opponent)) safe.push(move);
    search.unplay(move, player);
  }
  return safe.sort((a, b) => a - b);
}

/**
 * Chooses the computer's move for the side to move according to the level's policy.
 * Throws if the side to move has no legal move or the game is already over.
 */
export function chooseMove(position: Position, difficulty: Difficulty, rng: Rng, history?: History): Move {
  const policy = LEVEL_POLICY[difficulty];
  const player = position.turn;
  const wins = immediateWins(position.variant, position.cells, player);
  if (wins.length > 0) return rng.pick(wins);
  if (policy.missBlock > 0 || policy.loose > 0) {
    const threats = immediateWins(position.variant, position.cells, other(player));
    if (threats.length === 1 && policy.missBlock > 0 && rng.next() < policy.missBlock) {
      // Overlooks the threat: plays a casual move other than the obvious block (but never
      // a pull-out that completes the opponent's line on the spot).
      const search = new Search(position.variant, position.cells);
      const others = search
        .moves(player)
        .filter((move) => move !== threats[0] && !search.losesAtOnce(move, player))
        .sort((a, b) => a - b);
      if (others.length > 0) return rng.pick(others);
    }
    if (threats.length === 0 && policy.loose > 0 && rng.next() < policy.loose) {
      const safe = safeMoves(position);
      if (safe.length > 0) return rng.pick(safe);
    }
  }
  return rng.pick(bestMoves(position, difficulty, history));
}

/**
 * If it is the computer's turn, plays its move and advances the stored PRNG state.
 * Otherwise returns the state unchanged. After this, a game against the computer is
 * always either finished or waiting for the person — never "half a turn".
 */
export function computerReply(state: ConnectFourState): ConnectFourState {
  if (!isComputerTurn(state)) return state;
  const game = gameOf(state);
  const rng = createRngFromState(state.rng);
  const move = chooseMove(game, state.difficulty, rng, game);
  // Defensive: chooseMove only returns legal moves (property-tested); applyMove throws otherwise.
  return { ...applyMove(state, move), rng: rng.state() };
}

/** Starts a fresh round from the seed, including the computer's opening move if it starts. */
export function startRound(options: RoundOptions): ConnectFourState {
  return computerReply(createRound(options));
}

/** The person's move followed by the computer's reply (if the opponent is the computer). */
export function playTurn(state: ConnectFourState, move: Move): ConnectFourState {
  if (isComputerTurn(state)) throw new RangeError('It is the computer’s turn');
  return computerReply(applyMove(state, move));
}
