/**
 * Computer opponent for Order & Chaos (either role): a static evaluation of all five-cell windows plus a
 * shallow alpha-beta search. Deterministic: ties and slips are decided by the seeded PRNG stored in the state.
 *
 * Evaluation (from Order's point of view): every window of five consecutive cells on a line is still "alive"
 * for a symbol when it holds no other symbol and the cells just before and after it (on the same line) do not
 * hold that symbol (else completing it would make six, which does not count). Each alive window adds
 * `WEIGHTS[k]` for the k symbols already in it. Order maximises, Chaos minimises.
 *
 * Levels (`OC_LEVELS`, per role): search depth in plies, beam = moves searched further at each node after
 * ordering by the evaluation, a probability of random slips, and a deterministic work cap counted in position
 * scans (never wall-clock time):
 *  - easy:   one ply with frequent slips.
 *  - medium: Order two plies with a few slips, Chaos three plies (Order is favoured at equal depth).
 *  - perfect ("hard" in the UI): Order four plies, Chaos five plies, narrow beams, no slips.
 */
import { createRngFromState, type Rng } from '@wp/game-core';
import type { Cell, Difficulty } from './rules';
import {
  OC_CELLS,
  OC_LINES,
  RUN,
  applyOcMove,
  createOcRound,
  isOcComputerTurn,
  ocBoardOf,
  ocOutcome,
  roleOfMove,
  type OcMove,
  type OrderChaosOptions,
  type OrderChaosState,
  type Role
} from './order-chaos';

export interface OcLevel {
  /** Search depth in plies (1 = judge each own move by the evaluation). */
  depth: number;
  /** Moves searched further at inner nodes (after ordering by the evaluation). */
  beam: number;
  /** Probability of a random move instead of searching. */
  slip: number;
  /**
   * Work cap: the number of position scans one move may use (a scan is one pass over all 32 windows).
   * Deterministic, unlike a time limit: when a root move's share is used up, its search stops at the best
   * reply found so far (replies are searched best-first).
   */
  nodes: number;
  /** Optional window weights for this level's evaluation (default `WEIGHTS`). */
  weights?: readonly number[];
}

export const OC_EASY_SLIP = 0.3;

/**
 * Levels per difficulty and role. Order is clearly favoured at equal search depth, so at easy and medium the
 * computer's Chaos searches deeper or slips less than its Order; measured with random openings, equal levels then
 * give Order roughly half of the games (see the tests). Hard plays both roles at full strength. Even depths suit
 * Order (its own last move is answered), odd depths suit Chaos. Worst case per move: about 50 000 scans.
 */
export const OC_LEVELS: Readonly<Record<Difficulty, Readonly<Record<Role, OcLevel>>>> = {
  easy: {
    order: { depth: 1, beam: 72, slip: OC_EASY_SLIP, nodes: 1_000 },
    chaos: { depth: 1, beam: 72, slip: 0.2, nodes: 1_000 }
  },
  medium: {
    order: { depth: 2, beam: 72, slip: 0.15, nodes: 20_000 },
    chaos: { depth: 3, beam: 16, slip: 0, nodes: 20_000 }
  },
  perfect: {
    order: { depth: 4, beam: 8, slip: 0, nodes: 50_000 },
    chaos: { depth: 5, beam: 6, slip: 0, nodes: 50_000 }
  }
};

/** Scans used so far by the current search. */
let scans = 0;

/** Weight of an alive window holding k equal symbols (k = 0 … 4). */
export const WEIGHTS = [1, 3, 12, 60, 400] as const;
/** Window weights of the search in progress (a level may bring its own). */
let weights: readonly number[] = WEIGHTS;
/** Value of a decided game (Order won: +WIN, Chaos won: -WIN), adjusted by depth to prefer quick wins. */
export const WIN = 1_000_000;

interface Window {
  cells: readonly number[];
  before: number;
  after: number;
}

const WINDOWS: readonly Window[] = OC_LINES.flatMap((line) =>
  Array.from({ length: line.length - RUN + 1 }, (_, start) => ({
    cells: line.slice(start, start + RUN),
    before: start > 0 ? line[start - 1]! : -1,
    after: start + RUN < line.length ? line[start + RUN]! : -1
  }))
);

const LINES_THROUGH: readonly (readonly (readonly number[])[])[] = Array.from({ length: OC_CELLS }, (_, cell) => OC_LINES.filter((line) => line.includes(cell)));

/** Board codes: 0 empty, 1 X, 2 O. */
type Board = Int8Array;

export function toCodes(board: readonly Cell[]): Board {
  return Int8Array.from(board, (c) => (c === 'X' ? 1 : c === 'O' ? 2 : 0));
}

/** Value of a position where Order threatens five and Chaos cannot stop every threat with one move. */
export const DOUBLE_THREAT = 20_000;
/** Value of a position where Order is to move and can complete five at once. */
export const THREAT_TO_MOVE = 100_000;

interface Scan {
  score: number;
  /** Cells whose occupation may stop a threat (gaps of fours, and the cells just outside them). */
  blockers: number[];
}

/** Window weights plus the threats: alive windows with four equal symbols, completable to exactly five. */
function scan(board: Board): Scan {
  scans++;
  let score = 0;
  const blockers: number[] = [];
  for (const { cells, before, after } of WINDOWS) {
    let x = 0;
    let o = 0;
    let gap = -1;
    for (const c of cells) {
      const v = board[c];
      if (v === 1) x++;
      else if (v === 2) o++;
      else gap = c;
    }
    const aliveX = o === 0 && (before < 0 || board[before] !== 1) && (after < 0 || board[after] !== 1);
    const aliveO = x === 0 && (before < 0 || board[before] !== 2) && (after < 0 || board[after] !== 2);
    if (aliveX) score += weights[x] ?? 0;
    if (aliveO) score += weights[o] ?? 0;
    if ((aliveX && x === RUN - 1) || (aliveO && o === RUN - 1)) blockers.push(gap, before, after);
  }
  return { score, blockers };
}

/** Can Chaos (to move) stop every current threat with a single move that does not itself make five? */
function chaosCanStopAll(board: Board, blockers: readonly number[]): boolean {
  for (const cell of new Set(blockers)) {
    if (cell < 0 || board[cell] !== 0) continue;
    for (let code = 1; code <= 2; code++) {
      board[cell] = code;
      const ok = !fiveThrough(board, cell) && scan(board).blockers.length === 0;
      board[cell] = 0;
      if (ok) return true;
    }
  }
  return false;
}

/**
 * Static evaluation from Order's point of view (higher is better for Order). `orderToMove` tells who moves next:
 * a four that can be completed wins at once for Order to move; for Chaos to move, threats that no single move
 * stops are nearly as good for Order.
 */
export function evaluate(board: Board, orderToMove: boolean): number {
  const { score, blockers } = scan(board);
  if (blockers.length === 0) return score;
  if (orderToMove) return THREAT_TO_MOVE + score;
  return chaosCanStopAll(board, blockers) ? score : DOUBLE_THREAT + score;
}

/** Does any line through `cell` hold a run of exactly five equal symbols? */
export function fiveThrough(board: Board, cell: number): boolean {
  for (const line of LINES_THROUGH[cell]!) {
    let run = 0;
    let prev = 0;
    for (let i = 0; i <= line.length; i++) {
      const v = i < line.length ? board[line[i]!]! : -1;
      if (v === prev && v !== 0) run++;
      else {
        if (prev !== 0 && run === RUN) return true;
        prev = v;
        run = 1;
      }
    }
  }
  return false;
}

/** Encoded move: cell * 2 + (0 for X, 1 for O). */
const encode = (cell: number, code: number) => cell * 2 + (code - 1);

function search(board: Board, empty: number, order: boolean, depth: number, beam: number, limit: number, alpha: number, beta: number): number {
  if (depth === 0) return evaluate(board, order);
  const children: { move: number; value: number }[] = [];
  for (let cell = 0; cell < OC_CELLS; cell++) {
    if (board[cell] !== 0) continue;
    for (let code = 1; code <= 2; code++) {
      board[cell] = code;
      let value: number;
      if (fiveThrough(board, cell)) value = WIN + depth;
      else if (empty === 1) value = -WIN - depth;
      else value = depth === 1 ? evaluate(board, !order) : NaN;
      board[cell] = 0;
      // A decided child settles the node at once when it is the mover's best possible result.
      if (order && value > WIN / 2) return value;
      if (!order && value < -WIN / 2) return value;
      children.push({ move: encode(cell, code), value });
    }
  }
  if (depth === 1) {
    let best = order ? -Infinity : Infinity;
    for (const { value } of children) best = order ? Math.max(best, value) : Math.min(best, value);
    return best;
  }
  // Order children by static evaluation, keep the most promising ones and search them.
  for (const child of children) {
    if (!Number.isNaN(child.value)) continue;
    const cell = child.move >> 1;
    board[cell] = (child.move & 1) + 1;
    child.value = evaluate(board, !order);
    board[cell] = 0;
  }
  children.sort((a, b) => (order ? b.value - a.value : a.value - b.value) || a.move - b.move);
  let best = order ? -Infinity : Infinity;
  for (const { move, value } of children.slice(0, beam)) {
    let v = value;
    if (Math.abs(value) < WIN / 2) {
      const cell = move >> 1;
      board[cell] = (move & 1) + 1;
      v = search(board, empty - 1, !order, depth - 1, beam, limit, alpha, beta);
      board[cell] = 0;
    }
    if (order) {
      best = Math.max(best, v);
      alpha = Math.max(alpha, v);
    } else {
      best = Math.min(best, v);
      beta = Math.min(beta, v);
    }
    if (beta <= alpha || scans >= limit) break;
  }
  return best;
}

/**
 * Value of the legal moves for the role to move (from Order's point of view). Decided moves are scored at once;
 * the others are ordered by the evaluation and searched `depth` plies deep, each with an equal share of the
 * `nodes` budget (the first, most promising one is always searched). Moves left unsearched once the budget is
 * spent are not returned.
 */
export function scoreOcMoves(board: readonly Cell[], role: Role, depth: number, beam = 72, nodes = Infinity): Map<number, number> {
  const codes = toCodes(board);
  let empty = 0;
  for (const v of codes) if (v === 0) empty++;
  const order = role === 'order';
  const scores = new Map<number, number>();
  const open: { move: number; value: number }[] = [];
  scans = 0;
  for (let cell = 0; cell < OC_CELLS; cell++) {
    if (codes[cell] !== 0) continue;
    for (let code = 1; code <= 2; code++) {
      const move = encode(cell, code);
      codes[cell] = code;
      if (fiveThrough(codes, cell)) scores.set(move, WIN + depth);
      else if (empty === 1) scores.set(move, -WIN - depth);
      else open.push({ move, value: evaluate(codes, !order) });
      codes[cell] = 0;
    }
  }
  if (depth === 1) {
    for (const { move, value } of open) scores.set(move, value);
    return scores;
  }
  open.sort((a, b) => (order ? b.value - a.value : a.value - b.value) || a.move - b.move);
  const searched = open.slice(0, beam);
  const share = (nodes - scans) / Math.max(1, searched.length);
  searched.forEach(({ move }, i) => {
    if (i > 0 && scans >= nodes) return;
    const cell = move >> 1;
    codes[cell] = (move & 1) + 1;
    scores.set(move, search(codes, empty - 1, !order, depth - 1, beam, scans + share, -Infinity, Infinity));
    codes[cell] = 0;
  });
  return scores;
}

/** Scans used by the last `scoreOcMoves` call (for tests and measurements). */
export const lastScans = (): number => scans;

const decode = (move: number): OcMove => ({ cell: move >> 1, mark: (move & 1) === 0 ? 'X' : 'O' });

/** All legal moves for the role to move, ordered by cell, X before O. */
export function ocLegalMoves(board: readonly Cell[]): OcMove[] {
  const moves: OcMove[] = [];
  board.forEach((c, cell) => {
    if (c === '') moves.push({ cell, mark: 'X' }, { cell, mark: 'O' });
  });
  return moves;
}

/** Chooses a move for `role` (the role to move) with explicit settings. Throws if the game is over. */
export function chooseOcMoveWith(board: readonly Cell[], role: Role, level: OcLevel, rng: Rng): OcMove {
  if (ocOutcome(board).kind !== 'playing') throw new RangeError('No move: the game is over');
  if (level.slip > 0 && rng.next() < level.slip) return rng.pick(ocLegalMoves(board));
  weights = level.weights ?? WEIGHTS;
  const scores = scoreOcMoves(board, role, level.depth, level.beam, level.nodes);
  weights = WEIGHTS;
  const values = [...scores.values()];
  const best = role === 'order' ? Math.max(...values) : Math.min(...values);
  return decode(rng.pick([...scores].filter(([, v]) => v === best).map(([m]) => m)));
}

/** Chooses the computer's move for `role` (which must be the role to move). Throws if the game is over. */
export function chooseOcMove(board: readonly Cell[], role: Role, difficulty: Difficulty, rng: Rng): OcMove {
  return chooseOcMoveWith(board, role, OC_LEVELS[difficulty][role], rng);
}

/* ---------- State helpers ---------- */

export function ocComputerReply(state: OrderChaosState): OrderChaosState {
  if (!isOcComputerTurn(state)) return state;
  const rng = createRngFromState(state.rng);
  const move = chooseOcMove(ocBoardOf(state), roleOfMove(state.moves.length), state.difficulty, rng);
  return { ...applyOcMove(state, move), rng: rng.state() };
}

export function startOcRound(options: OrderChaosOptions): OrderChaosState {
  return ocComputerReply(createOcRound(options));
}

export function playOcTurn(state: OrderChaosState, move: OcMove): OrderChaosState {
  if (isOcComputerTurn(state)) throw new RangeError('It is the computer’s turn');
  return ocComputerReply(applyOcMove(state, move));
}
