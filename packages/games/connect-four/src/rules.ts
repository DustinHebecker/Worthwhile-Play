/**
 * Four in a Row rules: pure, DOM-free board logic and the serializable game state.
 *
 * Variants (chosen before a round, stored in the state):
 *  - board size: 7 × 6 (standard), 8 × 7 or 9 × 7 (columns × rows);
 *  - goal: four or five discs in a line;
 *  - pull-out rule (optional): on your turn you either drop a disc or pull one of YOUR
 *    OWN discs out of the bottom row; every disc above it falls down one cell.
 *
 * Boards are stored as `cols * rows` cells in row-major order with row 0 at the TOP
 * (index = row * cols + col). Discs always rest on the bottom or on another disc
 * ("gravity"), also after a pull-out. Player 1 always moves first; the players alternate.
 *
 * The logical state stores the sequence of moves rather than the board, so undo is
 * trivial and the board can never disagree with the history (or float). A move is a
 * number: `col` for a drop into that column, `-(col + 1)` for pulling the bottom disc
 * out of that column (see `dropMove` / `pullMove`).
 *
 * End of the game, checked after every move in this order:
 *  1. Lines: if the mover now has a line of `connect`, the mover wins — also when the
 *     move (only a pull-out can do this) completed a line for the opponent at the same
 *     time. If only the opponent has a line (a pull-out can create one for them), the
 *     opponent wins. Source for the simultaneous case: the Hasbro Connect 4 instruction
 *     sheet with the pull-out game ("In the rare case a [pop] results in both players
 *     creating a 4-in-a-row at the same time, the win goes [to the player] whose turn it
 *     is"); a pull that only completes the opponent's line hands them the win (common
 *     published rule, e.g. rarepike.com/four/variants).
 *  2. Repetition (only possible with pull-outs): the same board with the same side to
 *     move for the third time is a draw.
 *  3. Move limit (pull-out only): after `moveLimit` moves (4 × the number of cells) the
 *     game is a calm draw, so no round can go on for ever.
 *  4. Full board without the pull-out rule: the classic draw. With the pull-out rule a
 *     full board is NOT the end: the side to move can always pull, because a bottom row
 *     without any of their discs would be a complete line of the opponent (every board is
 *     at least 7 wide and the goal at most 5), and the game would already be over.
 *
 * How the computer chooses its moves lives in `ai.ts`.
 */
import { isArrayOf, isInt, isOneOf, isRecord, isUint32 } from '@wp/game-core';

export type Player = 1 | 2;
export type Cell = 0 | Player;
export type Board = readonly Cell[];
/** `col` (>= 0) drops into `col`; `-(col + 1)` pulls the bottom disc of `col` out. */
export type Move = number;

export const SIZES = ['7x6', '8x7', '9x7'] as const;
export type Size = (typeof SIZES)[number];
export const CONNECTS = [4, 5] as const;
export type Connect = (typeof CONNECTS)[number];

export interface Variant {
  size: Size;
  connect: Connect;
  pullOut: boolean;
}

export const STANDARD_VARIANT: Readonly<Variant> = Object.freeze({ size: '7x6', connect: 4, pullOut: false });

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

export const OPPONENTS = ['computer', 'human'] as const;
export type Opponent = (typeof OPPONENTS)[number];

/** Who plays disc 1 (and therefore moves first) when playing against the computer. */
export const STARTERS = ['human', 'computer'] as const;
export type Starter = (typeof STARTERS)[number];

/* ------------------------------------------------------------------------ */
/* Geometry                                                                   */
/* ------------------------------------------------------------------------ */

export interface Geometry {
  readonly cols: number;
  readonly rows: number;
  readonly connect: Connect;
  readonly cellCount: number;
  /**
   * All windows of `connect` cells: horizontal, vertical, then each diagonal direction
   * (down-right, then down-left). Each line lists its cells in walking order.
   */
  readonly lines: readonly (readonly number[])[];
}

export const sizeOf = (size: Size): { cols: number; rows: number } => {
  const [cols, rows] = size.split('x').map(Number) as [number, number];
  return { cols, rows };
};

const geometries = new Map<string, Geometry>();

/** Board geometry of a variant (cached; the pull-out rule does not change it). */
export function geometryOf(variant: Pick<Variant, 'size' | 'connect'>): Geometry {
  const key = `${variant.size}/${variant.connect}`;
  const cached = geometries.get(key);
  if (cached) return cached;
  const { cols, rows } = sizeOf(variant.size);
  const connect = variant.connect;
  const lines: number[][] = [];
  const directions: readonly (readonly [number, number])[] = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];
  for (const [dr, dc] of directions) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const endRow = row + dr * (connect - 1);
        const endCol = col + dc * (connect - 1);
        if (endRow >= rows || endCol < 0 || endCol >= cols) continue;
        lines.push(Array.from({ length: connect }, (_, k) => (row + dr * k) * cols + col + dc * k));
      }
    }
  }
  const geometry: Geometry = { cols, rows, connect, cellCount: cols * rows, lines };
  geometries.set(key, geometry);
  return geometry;
}

export const cellIndex = (geo: Geometry, row: number, col: number): number => row * geo.cols + col;
export const rowOf = (geo: Geometry, index: number): number => Math.floor(index / geo.cols);
export const colOf = (geo: Geometry, index: number): number => index % geo.cols;

export function emptyBoard(geo: Geometry): Cell[] {
  return Array.from({ length: geo.cellCount }, () => 0 as Cell);
}

/** Most moves a game can have: pull-out games end in a draw after this many moves; classic games end when the board is full. */
export const moveLimit = (variant: Variant): number => (variant.pullOut ? 4 : 1) * geometryOf(variant).cellCount;

/* ------------------------------------------------------------------------ */
/* Moves                                                                      */
/* ------------------------------------------------------------------------ */

export const other = (player: Player): Player => (player === 1 ? 2 : 1);

/** Player of the n-th move (0-based): player 1 moves first, then the players alternate. */
export const playerOfMove = (moveIndex: number): Player => (moveIndex % 2 === 0 ? 1 : 2);

export const dropMove = (col: number): Move => col;
export const pullMove = (col: number): Move => -col - 1;
export const isPull = (move: Move): boolean => move < 0;
/** Column a move acts on. */
export const moveColumn = (move: Move): number => (move < 0 ? -move - 1 : move);

/** Row a disc dropped into `col` lands in, or -1 if the column is full or does not exist. */
export function dropRow(geo: Geometry, board: Board, col: number): number {
  if (!Number.isInteger(col) || col < 0 || col >= geo.cols) return -1;
  for (let row = geo.rows - 1; row >= 0; row--) if (board[row * geo.cols + col] === 0) return row;
  return -1;
}

/** True if `player` may pull the bottom disc of `col` (it must be their own). */
export function canPull(geo: Geometry, board: Board, col: number, player: Player): boolean {
  if (!Number.isInteger(col) || col < 0 || col >= geo.cols) return false;
  return board[(geo.rows - 1) * geo.cols + col] === player;
}

export function isLegalMove(variant: Variant, board: Board, move: Move, player: Player): boolean {
  const geo = geometryOf(variant);
  if (!Number.isInteger(move)) return false;
  if (isPull(move)) return variant.pullOut && canPull(geo, board, moveColumn(move), player);
  return dropRow(geo, board, move) >= 0;
}

/** Legal moves of `player`: drops by ascending column, then (pull-out only) pulls by ascending column. */
export function legalMoves(variant: Variant, board: Board, player: Player): Move[] {
  const geo = geometryOf(variant);
  const moves: Move[] = [];
  for (let col = 0; col < geo.cols; col++) if (board[col] === 0) moves.push(dropMove(col));
  if (variant.pullOut) for (let col = 0; col < geo.cols; col++) if (canPull(geo, board, col, player)) moves.push(pullMove(col));
  return moves;
}

/** Returns a new board after `player` made `move`. Throws on an illegal move. */
export function applyToBoard(variant: Variant, board: Board, move: Move, player: Player): Cell[] {
  if (!isLegalMove(variant, board, move, player)) throw new RangeError(`Illegal move ${move}`);
  const geo = geometryOf(variant);
  const next = [...board];
  const col = moveColumn(move);
  if (!isPull(move)) {
    next[dropRow(geo, board, col) * geo.cols + col] = player;
    return next;
  }
  // Pull: every disc above the bottom one falls down one cell; the top cell empties.
  for (let row = geo.rows - 1; row > 0; row--) next[row * geo.cols + col] = board[(row - 1) * geo.cols + col] as Cell;
  next[col] = 0;
  return next;
}

/** True if no disc floats: every disc rests on the bottom row or on another disc. */
export function hasGravity(geo: Geometry, board: Board): boolean {
  if (board.length !== geo.cellCount) return false;
  for (let row = 0; row < geo.rows - 1; row++) {
    for (let col = 0; col < geo.cols; col++) {
      if (board[row * geo.cols + col] !== 0 && board[(row + 1) * geo.cols + col] === 0) return false;
    }
  }
  return true;
}

/* ------------------------------------------------------------------------ */
/* Lines and outcome                                                          */
/* ------------------------------------------------------------------------ */

/** Every complete line of the geometry, in `lines` order. */
export function completeLines(geo: Geometry, board: Board): { player: Player; line: readonly number[] }[] {
  const found: { player: Player; line: readonly number[] }[] = [];
  for (const line of geo.lines) {
    const owner = board[line[0] as number];
    if (owner && line.every((i) => board[i] === owner)) found.push({ player: owner, line });
  }
  return found;
}

export interface Win {
  player: Player;
  /** All cells belonging to any of the winner's lines, ascending. */
  cells: number[];
}

const winOf = (lines: { player: Player; line: readonly number[] }[], player: Player): Win | null => {
  const cells = new Set<number>();
  for (const found of lines) if (found.player === player) for (const i of found.line) cells.add(i);
  return cells.size > 0 ? { player, cells: [...cells].sort((a, b) => a - b) } : null;
};

/**
 * The winner after `mover` moved, with all cells of their lines, or `null`. The mover
 * wins if they have a line (even if the opponent got one at the same time); otherwise
 * the opponent wins if they have one.
 */
export function winAfter(geo: Geometry, board: Board, mover: Player): Win | null {
  const lines = completeLines(geo, board);
  return winOf(lines, mover) ?? winOf(lines, other(mover));
}

export type DrawReason = 'full' | 'repetition' | 'limit';
export type Outcome = { kind: 'playing' } | { kind: 'won'; win: Win } | { kind: 'draw'; reason: DrawReason };

/** Repetition key of a position: the board and the side to move. */
export const positionKey = (board: Board, turn: Player): string => `${board.join('')}${turn}`;

/** A game replayed from its moves. */
export interface Game {
  readonly variant: Variant;
  readonly geo: Geometry;
  readonly cells: Cell[];
  /** Side to move next (also after the end). */
  readonly turn: Player;
  /** Number of moves played. */
  readonly ply: number;
  /** How often each position (`positionKey`) has occurred, including the current one. */
  readonly seen: Map<string, number>;
  readonly outcome: Outcome;
}

export function startGame(variant: Variant): Game {
  const geo = geometryOf(variant);
  const cells = emptyBoard(geo);
  return { variant, geo, cells, turn: 1, ply: 0, seen: new Map([[positionKey(cells, 1), 1]]), outcome: { kind: 'playing' } };
}

function outcomeAfter(variant: Variant, geo: Geometry, cells: Board, mover: Player, ply: number, repeats: number): Outcome {
  const win = winAfter(geo, cells, mover);
  if (win) return { kind: 'won', win };
  if (repeats >= 3) return { kind: 'draw', reason: 'repetition' };
  if (variant.pullOut && ply >= moveLimit(variant)) return { kind: 'draw', reason: 'limit' };
  if (legalMoves(variant, cells, other(mover)).length === 0) return { kind: 'draw', reason: 'full' };
  return { kind: 'playing' };
}

/** Plays one move. With `reuse`, the game's `seen` map is updated in place (for fast replays). Throws on illegal or post-game moves. */
export function advance(game: Game, move: Move, reuse = false): Game {
  if (game.outcome.kind !== 'playing') throw new RangeError('The game is already over');
  const cells = applyToBoard(game.variant, game.cells, move, game.turn);
  const turn = other(game.turn);
  const seen = reuse ? game.seen : new Map(game.seen);
  const key = positionKey(cells, turn);
  const repeats = (seen.get(key) ?? 0) + 1;
  seen.set(key, repeats);
  const ply = game.ply + 1;
  return { ...game, cells, turn, ply, seen, outcome: outcomeAfter(game.variant, game.geo, cells, game.turn, ply, repeats) };
}

/** Replays a list of moves. Throws on an illegal move or a move after the end. */
export function replay(variant: Variant, moves: readonly Move[]): Game {
  let game = startGame(variant);
  for (const move of moves) game = advance(game, move, true);
  return game;
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
  /** Board size, goal and pull-out rule of this round. */
  variant: Variant;
  /** Moves in order (see `Move`); move n belongs to `playerOfMove(n)`. */
  moves: Move[];
  /** PRNG state for the computer's tie-breaking (uint32). */
  rng: number;
}

export interface RoundOptions {
  seed: number;
  difficulty: Difficulty;
  opponent: Opponent;
  starter: Starter;
  variant: Variant;
}

/** An empty board for the given options. The computer's opening move (if any) is added by `ai.ts`. */
export function createRound({ seed, difficulty, opponent, starter, variant }: RoundOptions): ConnectFourState {
  return { seed, difficulty, opponent, starter, variant: { ...variant }, moves: [], rng: seed };
}

/** Player number of the person at the device in a game against the computer. */
export const humanPlayer = (starter: Starter): Player => (starter === 'human' ? 1 : 2);

export const computerPlayer = (starter: Starter): Player => other(humanPlayer(starter));

export const gameOf = (state: ConnectFourState): Game => replay(state.variant, state.moves);

/** True when it is the computer's turn in an unfinished game against the computer. */
export function isComputerTurn(state: ConnectFourState): boolean {
  if (state.opponent !== 'computer') return false;
  const game = gameOf(state);
  return game.outcome.kind === 'playing' && game.turn === computerPlayer(state.starter);
}

/** Adds one move to the state (no computer reply). Throws on an illegal or post-game move. */
export function applyMove(state: ConnectFourState, move: Move): ConnectFourState {
  advance(gameOf(state), move);
  return { ...state, moves: [...state.moves, move] };
}

/**
 * Undo is offered only while the game is still running.
 * Against the computer it needs at least one move by the person.
 */
export function canUndo(state: ConnectFourState): boolean {
  if (gameOf(state).outcome.kind !== 'playing') return false;
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

export function isValidVariant(value: unknown): value is Variant {
  if (!isRecord(value) || Object.keys(value).length !== 3) return false;
  return isOneOf(value.size, SIZES) && isOneOf(value.connect, CONNECTS) && typeof value.pullOut === 'boolean';
}

/** Thorough structural validation of untrusted data. Never throws. */
export function isValidState(value: unknown): value is ConnectFourState {
  if (!isRecord(value)) return false;
  if (Object.keys(value).length !== 7) return false;
  const { seed, difficulty, opponent, starter, variant, moves, rng } = value;
  if (!isUint32(seed) || !isUint32(rng)) return false;
  if (!isOneOf(difficulty, DIFFICULTIES) || !isOneOf(opponent, OPPONENTS) || !isOneOf(starter, STARTERS)) return false;
  if (!isValidVariant(variant)) return false;
  const { cols } = sizeOf(variant.size);
  const lowest = variant.pullOut ? -cols : 0;
  if (!isArrayOf(moves, (m): m is number => isInt(m, lowest, cols - 1)) || moves.length > moveLimit(variant)) return false;
  // Replay: every move must be legal (no overflow, pulls only of own bottom discs) and
  // no move may follow a finished game. Gravity holds by construction.
  let game = startGame(variant);
  for (const move of moves) {
    if (game.outcome.kind !== 'playing' || !isLegalMove(variant, game.cells, move, game.turn)) return false;
    game = advance(game, move, true);
  }
  // Against the computer the state is never "half a turn": the computer's reply is
  // always applied together with the person's move.
  if (opponent === 'computer' && game.outcome.kind === 'playing' && game.turn !== humanPlayer(starter)) return false;
  return true;
}

/**
 * Upgrades saves of earlier state versions. Version 1 had no variants: it was always
 * the standard game (7 × 6, four in a row, drops only) with the same move encoding.
 */
export function migrateState(value: unknown, fromVersion: number): ConnectFourState | undefined {
  if (fromVersion !== 1 || !isRecord(value) || 'variant' in value) return undefined;
  const candidate = { ...value, variant: { ...STANDARD_VARIANT } };
  return isValidState(candidate) ? candidate : undefined;
}
