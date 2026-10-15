/**
 * Computer opponent for "Board in board": Monte Carlo tree search (UCT) with random playouts.
 *
 * Deterministic: every random choice (tree expansion, playouts, slips, tie-breaks) is drawn from the seeded
 * PRNG stored in the game state, and the search runs a fixed number of iterations (never wall-clock time),
 * so the same state and PRNG state always give the same move.
 *
 * Levels:
 *  - easy:   few iterations, and with probability EASY_SLIP a random legal move instead.
 *  - medium: more iterations; always takes a game-winning move and avoids moves that let the opponent win
 *            the game at once (when any other move exists).
 *  - perfect ("hard" in the UI): many iterations, plus the same win/block safety rules.
 *
 * The search works on a compact mutable copy of the position (typed arrays) for speed; the property tests
 * check that this copy follows exactly the rules in `nested.ts`.
 */
import { createRngFromState, type Rng } from '@wp/game-core';
import { LINES, computerMark, type Difficulty, type Mark } from './rules';
import {
  applyNestedMove,
  createNestedRound,
  isNestedComputerTurn,
  nestedLegalMoves,
  nestedOutcome,
  nestedPositionOf,
  playNested,
  type NestedOptions,
  type NestedPosition,
  type NestedState
} from './nested';

export interface NestedLevel {
  /** MCTS iterations per move. */
  iterations: number;
  /** Probability of playing a uniformly random legal move instead of searching. */
  slip: number;
  /** Always take a game-winning move and avoid handing the opponent one. */
  safety: boolean;
}

export const EASY_SLIP = 0.3;

export const NESTED_LEVELS: Readonly<Record<Difficulty, NestedLevel>> = {
  easy: { iterations: 60, slip: EASY_SLIP, safety: false },
  medium: { iterations: 600, slip: 0, safety: true },
  perfect: { iterations: 3000, slip: 0, safety: true }
};

/** UCT exploration constant. */
const EXPLORATION = 1.2;

/* ---------- Compact, mutable position for the search ---------- */

const EMPTY = 0;
const DRAW = 3;
/** Lines of a 3×3 board through each of its cells. */
const LINES_THROUGH: readonly (readonly (readonly [number, number, number])[])[] = Array.from({ length: 9 }, (_, c) => LINES.filter((line) => line.includes(c)));

/** Mutable search position. Players are 1 (X) and 2 (O); `result` is 0 while playing, 1/2 for a win, 3 for a draw. */
export class FastNested {
  cells = new Int8Array(81);
  claims = new Int8Array(9);
  forced = -1;
  toMove = 1;
  result = 0;

  static from(position: NestedPosition): FastNested {
    const fast = new FastNested();
    position.cells.forEach((cell, i) => (fast.cells[i] = cell === 'X' ? 1 : cell === 'O' ? 2 : EMPTY));
    position.claims.forEach((claim, i) => (fast.claims[i] = claim === 'X' ? 1 : claim === 'O' ? 2 : claim === 'draw' ? DRAW : EMPTY));
    fast.forced = position.forced ?? -1;
    fast.toMove = position.toMove === 'X' ? 1 : 2;
    const outcome = nestedOutcome(position);
    fast.result = outcome.kind === 'won' ? (outcome.mark === 'X' ? 1 : 2) : outcome.kind === 'draw' ? DRAW : 0;
    return fast;
  }

  copyFrom(other: FastNested): void {
    this.cells.set(other.cells);
    this.claims.set(other.claims);
    this.forced = other.forced;
    this.toMove = other.toMove;
    this.result = other.result;
  }

  /** Writes the legal moves into `out` and returns their count (ascending order). */
  legalMoves(out: Uint8Array | number[]): number {
    if (this.result !== 0) return 0;
    let n = 0;
    for (let b = 0; b < 9; b++) {
      if (this.forced >= 0 ? b !== this.forced : this.claims[b] !== EMPTY) continue;
      const base = b * 9;
      for (let i = 0; i < 9; i++) if (this.cells[base + i] === EMPTY) out[n++] = base + i;
    }
    return n;
  }

  /** Would playing `g` for the side to move win the whole game? (Does not change the position.) */
  winsGame(g: number): boolean {
    const board = (g / 9) | 0;
    const player = this.toMove;
    if (!this.claimsWith(g, player)) return false;
    for (const [a, b, c] of LINES_THROUGH[board]!) {
      const ca = a === board ? player : this.claims[a];
      const cb = b === board ? player : this.claims[b];
      const cc = c === board ? player : this.claims[c];
      if (ca === player && cb === player && cc === player) return true;
    }
    return false;
  }

  /** Would placing `player` at `g` complete a line in its small board? */
  private claimsWith(g: number, player: number): boolean {
    const base = ((g / 9) | 0) * 9;
    const local = g - base;
    for (const [a, b, c] of LINES_THROUGH[local]!) {
      const ca = a === local ? player : this.cells[base + a];
      const cb = b === local ? player : this.cells[base + b];
      const cc = c === local ? player : this.cells[base + c];
      if (ca === player && cb === player && cc === player) return true;
    }
    return false;
  }

  play(g: number): void {
    const player = this.toMove;
    const board = (g / 9) | 0;
    const base = board * 9;
    this.cells[g] = player;
    if (this.claimsWith(g, player)) {
      this.claims[board] = player;
      for (const [a, b, c] of LINES_THROUGH[board]!) {
        if (this.claims[a] === player && this.claims[b] === player && this.claims[c] === player) this.result = player;
      }
    } else {
      let full = true;
      for (let i = 0; i < 9; i++) if (this.cells[base + i] === EMPTY) full = false;
      if (full) this.claims[board] = DRAW;
    }
    if (this.result === 0) {
      let open = false;
      for (let b = 0; b < 9; b++) if (this.claims[b] === EMPTY) open = true;
      if (!open) this.result = DRAW;
    }
    const target = g - base;
    this.forced = this.claims[target] === EMPTY ? target : -1;
    this.toMove = 3 - player;
  }
}

/* ---------- Monte Carlo tree search ---------- */

interface Node {
  move: number;
  /** Player who made `move` (1 or 2); rewards are counted from this player's point of view. */
  mover: number;
  parent: Node | null;
  children: Node[];
  untried: number[];
  visits: number;
  reward: number;
}

const newNode = (move: number, mover: number, parent: Node | null, untried: number[]): Node => ({ move, mover, parent, children: [], untried, visits: 0, reward: 0 });

function legalList(position: FastNested): number[] {
  const out: number[] = [];
  position.legalMoves(out);
  return out;
}

/** Plays random legal moves to the end; returns the result code (1, 2 or 3 = draw). */
function playout(position: FastNested, rng: Rng, buffer: Uint8Array): number {
  while (position.result === 0) {
    const n = position.legalMoves(buffer);
    position.play(buffer[Math.floor(rng.next() * n)]!);
  }
  return position.result;
}

/**
 * Runs `iterations` UCT iterations from `root` restricted to `candidates` (legal moves of the root) and
 * returns the visit count of each candidate. Deterministic for a given PRNG state.
 */
export function mctsVisits(root: FastNested, candidates: readonly number[], iterations: number, rng: Rng): Map<number, number> {
  const rootPlayer = root.toMove;
  const tree = newNode(-1, 3 - rootPlayer, null, [...candidates]);
  const scratch = new FastNested();
  const buffer = new Uint8Array(81);
  for (let it = 0; it < iterations; it++) {
    scratch.copyFrom(root);
    let node = tree;
    // Selection
    while (node.untried.length === 0 && node.children.length > 0) {
      const logN = Math.log(node.visits);
      let best = node.children[0]!;
      let bestValue = -Infinity;
      for (const child of node.children) {
        const value = child.reward / child.visits + EXPLORATION * Math.sqrt(logN / child.visits);
        if (value > bestValue) {
          bestValue = value;
          best = child;
        }
      }
      node = best;
      scratch.play(node.move);
    }
    // Expansion
    if (node.untried.length > 0) {
      const index = Math.floor(rng.next() * node.untried.length);
      const move = node.untried[index]!;
      node.untried[index] = node.untried[node.untried.length - 1]!;
      node.untried.pop();
      const mover = scratch.toMove;
      scratch.play(move);
      const child = newNode(move, mover, node, legalList(scratch));
      node.children.push(child);
      node = child;
    }
    // Simulation
    const result = playout(scratch, rng, buffer);
    // Backpropagation
    for (let n: Node | null = node; n; n = n.parent) {
      n.visits++;
      n.reward += result === DRAW ? 0.5 : result === n.mover ? 1 : 0;
    }
  }
  const visits = new Map<number, number>(candidates.map((move) => [move, 0]));
  for (const child of tree.children) visits.set(child.move, child.visits);
  return visits;
}

/** Moves that win the whole game at once for the side to move. */
export function gameWinningMoves(position: NestedPosition): number[] {
  const fast = FastNested.from(position);
  return nestedLegalMoves(position).filter((g) => fast.winsGame(g));
}

/** Moves after which the opponent cannot win the game with their very next move. */
export function safeMoves(position: NestedPosition): number[] {
  const fast = FastNested.from(position);
  const after = new FastNested();
  const buffer = new Uint8Array(81);
  return nestedLegalMoves(position).filter((g) => {
    after.copyFrom(fast);
    after.play(g);
    if (after.result !== 0) return true;
    const n = after.legalMoves(buffer);
    for (let i = 0; i < n; i++) if (after.winsGame(buffer[i]!)) return false;
    return true;
  });
}

/** Chooses the computer's move for the side to move. Throws if the game is over. */
export function chooseNestedMove(position: NestedPosition, difficulty: Difficulty, rng: Rng): number {
  const legal = nestedLegalMoves(position);
  if (legal.length === 0) throw new RangeError('No move: the game is over');
  const level = NESTED_LEVELS[difficulty];
  if (level.slip > 0 && rng.next() < level.slip) return rng.pick(legal);
  let candidates = legal;
  if (level.safety) {
    const wins = gameWinningMoves(position);
    if (wins.length > 0) return rng.pick(wins);
    const safe = safeMoves(position);
    if (safe.length > 0) candidates = safe;
  }
  if (candidates.length === 1) return candidates[0]!;
  const visits = mctsVisits(FastNested.from(position), candidates, level.iterations, rng);
  const most = Math.max(...visits.values());
  return rng.pick(candidates.filter((move) => visits.get(move) === most));
}

/* ---------- State helpers ---------- */

export function nestedComputerReply(state: NestedState): NestedState {
  if (!isNestedComputerTurn(state)) return state;
  const position = nestedPositionOf(state);
  const rng = createRngFromState(state.rng);
  const move = chooseNestedMove(position, state.difficulty, rng);
  playNested(position, move); // defensive: throws on an illegal move
  return { ...state, moves: [...state.moves, move], rng: rng.state() };
}

export function startNestedRound(options: NestedOptions): NestedState {
  return nestedComputerReply(createNestedRound(options));
}

export function playNestedTurn(state: NestedState, g: number): NestedState {
  if (isNestedComputerTurn(state)) throw new RangeError('It is the computer’s turn');
  return nestedComputerReply(applyNestedMove(state, g));
}

export const nestedComputerMark = (state: NestedState): Mark => computerMark(state.starter);
