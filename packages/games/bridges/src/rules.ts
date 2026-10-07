import { createRng, isInt, isOneOf, isRecord, isUint32, type Rng } from '@wp/game-core';

/**
 * Pure, DOM-free rules for Bridges (Hashiwokakero).
 *
 * Generation pipeline (spec "Puzzle generation"): a seeded random bridge network is grown
 * on the grid → island numbers are derived from it → the propagation solver below, which
 * never looks at the network, must determine every bridge by logic alone → otherwise the
 * attempt is discarded and a derived seed is tried. A complete solve by sound deductions
 * proves the solution is unique; the tests re-check uniqueness with an independent
 * backtracking oracle.
 *
 * Islands never touch each other, not even diagonally (Chebyshev distance ≥ 2). That keeps
 * puzzles readable and lets every island get a 44 px touch target on a 360 px phone even on
 * the 11 × 11 board, where a grid cell is only about 30 px wide.
 */

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

/** Board edge length per difficulty (square boards). */
export const SIZES: Readonly<Record<Difficulty, number>> = { easy: 7, medium: 9, hard: 11 };

/** Inclusive island-count range per difficulty. */
export const ISLAND_RANGE: Readonly<Record<Difficulty, readonly [number, number]>> = {
  easy: [8, 12],
  medium: [15, 20],
  hard: [22, 30]
};

/** Most bridges between one pair of islands. */
export const MAX_BRIDGES = 2;

/** Random networks tried before the frozen fallback puzzle is used. */
export const MAX_ATTEMPTS = 600;

/** Upper bound for counters in untrusted saves. */
export const MAX_COUNTER = 1_000_000;

/** Undo entries kept in the save (oldest are dropped). */
export const MAX_HISTORY = 400;

/** One island: `[row, column, number of bridges it needs]`. */
export type Island = [number, number, number];

export interface Puzzle {
  size: number;
  /** Islands in row-major order. */
  islands: Island[];
}

/** A place where bridges may be built: two islands in one line with no island between. */
export interface Edge {
  /** Island indices, `a < b`; `b` is to the right of or below `a`. */
  a: number;
  b: number;
  horizontal: boolean;
}

export interface BridgesState {
  seed: number;
  difficulty: Difficulty;
  size: number;
  islands: Island[];
  /** Bridges per edge (`edgesOf(islands)` order) of the unique solution. */
  solution: number[];
  /** Player's bridges per edge (0, 1 or 2). */
  bridges: number[];
  /** Undo stack of `[edgeIndex, previousCount]`. */
  history: [number, number][];
  /** Bridge changes made (undo is not counted). */
  moves: number;
  /** Times "Check" was used. */
  checks: number;
  /** Wrong bridges reported by the last check, or `null` once the board changed. */
  lastCheck: number | null;
}

export type Direction = 'up' | 'down' | 'left' | 'right';
export const DIRECTIONS: readonly Direction[] = ['up', 'down', 'left', 'right'];
const STEP: Readonly<Record<Direction, readonly [number, number]>> = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1]
};

export function toDifficulty(value: unknown): Difficulty {
  return isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY;
}

// --- Geometry ------------------------------------------------------------------------------

/**
 * All edges between line-neighbours (the nearest island to the right and below each island),
 * ordered by `a`, the horizontal edge of an island first.
 */
export function edgesOf(size: number, islands: readonly Island[]): Edge[] {
  const at = new Map<number, number>();
  islands.forEach(([r, c], i) => at.set(r * size + c, i));
  const edges: Edge[] = [];
  islands.forEach(([r, c], a) => {
    for (let cc = c + 1; cc < size; cc++) {
      const b = at.get(r * size + cc);
      if (b !== undefined) {
        edges.push({ a, b, horizontal: true });
        break;
      }
    }
    for (let rr = r + 1; rr < size; rr++) {
      const b = at.get(rr * size + c);
      if (b !== undefined) {
        edges.push({ a, b, horizontal: false });
        break;
      }
    }
  });
  return edges;
}

/** True when a horizontal and a vertical edge would cross between their end points. */
export function edgesCross(islands: readonly Island[], e: Edge, f: Edge): boolean {
  if (e.horizontal === f.horizontal) return false;
  const h = e.horizontal ? e : f;
  const v = e.horizontal ? f : e;
  const [hr, hc1] = islands[h.a] as Island;
  const hc2 = (islands[h.b] as Island)[1];
  const [vr1, vc] = islands[v.a] as Island;
  const vr2 = (islands[v.b] as Island)[0];
  return vr1 < hr && hr < vr2 && hc1 < vc && vc < hc2;
}

/** For each edge, the indices of the edges it crosses (ascending). */
export function crossingsOf(islands: readonly Island[], edges: readonly Edge[]): number[][] {
  const result: number[][] = edges.map(() => []);
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      if (edgesCross(islands, edges[i] as Edge, edges[j] as Edge)) {
        (result[i] as number[]).push(j);
        (result[j] as number[]).push(i);
      }
    }
  }
  return result;
}

/** Edge indices incident to each island. */
export function incidence(islandCount: number, edges: readonly Edge[]): number[][] {
  const result: number[][] = Array.from({ length: islandCount }, () => []);
  edges.forEach((e, i) => {
    result[e.a]?.push(i);
    result[e.b]?.push(i);
  });
  return result;
}

/** Bridges currently attached to each island. */
export function degrees(islandCount: number, edges: readonly Edge[], counts: readonly number[]): number[] {
  const result = new Array<number>(islandCount).fill(0);
  edges.forEach((e, i) => {
    const k = counts[i] ?? 0;
    result[e.a] = (result[e.a] as number) + k;
    result[e.b] = (result[e.b] as number) + k;
  });
  return result;
}

/** Union–find over islands joined by edges whose count is positive. Returns a root per island. */
function componentRoots(islandCount: number, edges: readonly Edge[], counts: readonly number[]): number[] {
  const parent = Array.from({ length: islandCount }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x] as number] as number;
      x = parent[x] as number;
    }
    return x;
  };
  edges.forEach((e, i) => {
    if ((counts[i] ?? 0) > 0) parent[find(e.a)] = find(e.b);
  });
  return parent.map((_, i) => find(i));
}

/** True when all islands form one group through bridges with a positive count. */
export function isConnected(islandCount: number, edges: readonly Edge[], counts: readonly number[]): boolean {
  if (islandCount <= 1) return true;
  const roots = componentRoots(islandCount, edges, counts);
  return roots.every((r) => r === roots[0]);
}

/** Index of an edge whose bridges would cross a bridge already built, or -1. */
export function blockingEdge(islands: readonly Island[], edges: readonly Edge[], counts: readonly number[], edge: number): number {
  const e = edges[edge];
  if (!e) return -1;
  for (let i = 0; i < edges.length; i++) {
    if ((counts[i] ?? 0) > 0 && edgesCross(islands, e, edges[i] as Edge)) return i;
  }
  return -1;
}

/** True when `counts` is a complete, valid answer: numbers met, no crossings, one group. */
export function isSolution(puzzle: Puzzle, counts: readonly number[]): boolean {
  const edges = edgesOf(puzzle.size, puzzle.islands);
  if (counts.length !== edges.length || !counts.every((k) => isInt(k, 0, MAX_BRIDGES))) return false;
  const deg = degrees(puzzle.islands.length, edges, counts);
  if (!puzzle.islands.every(([, , need], i) => deg[i] === need)) return false;
  for (let i = 0; i < edges.length; i++) {
    if ((counts[i] as number) > 0 && blockingEdge(puzzle.islands, edges, counts, i) >= 0) return false;
  }
  return isConnected(puzzle.islands.length, edges, counts);
}

/** The line-neighbour of island `from` in a direction, or -1. */
export function neighbourIn(size: number, islands: readonly Island[], from: number, dir: Direction): number {
  const island = islands[from];
  if (!island) return -1;
  const [dr, dc] = STEP[dir];
  let r = island[0] + dr;
  let c = island[1] + dc;
  while (r >= 0 && c >= 0 && r < size && c < size) {
    const hit = islands.findIndex(([ir, ic]) => ir === r && ic === c);
    if (hit >= 0) return hit;
    r += dr;
    c += dc;
  }
  return -1;
}

/** Index of the edge joining islands `x` and `y` (either order), or -1. */
export function edgeBetween(edges: readonly Edge[], x: number, y: number): number {
  return edges.findIndex((e) => (e.a === x && e.b === y) || (e.a === y && e.b === x));
}

/**
 * Keyboard focus target: the closest island in a direction. Islands in the same line win;
 * otherwise the one with the smallest distance along the direction plus twice the sideways
 * offset (ties: lower index). Returns -1 when there is none.
 */
export function nearestIsland(islands: readonly Island[], from: number, dir: Direction): number {
  const origin = islands[from];
  if (!origin) return -1;
  const [dr, dc] = STEP[dir];
  let best = -1;
  let bestScore = Infinity;
  islands.forEach(([r, c], i) => {
    const along = (r - origin[0]) * dr + (c - origin[1]) * dc;
    if (along <= 0) return;
    const side = Math.abs(dr !== 0 ? c - origin[1] : r - origin[0]);
    const score = along + 2 * side;
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return best;
}

// --- Logic solver --------------------------------------------------------------------------

export interface SolveOptions {
  /** Use the connectivity (isolation) rule (default `true`). */
  connectivity?: boolean;
}

export interface SolveResult {
  /** Lower bound of bridges per edge after propagation. */
  min: number[];
  /** Upper bound of bridges per edge after propagation. */
  max: number[];
  /** Every edge determined (and the result is a valid solution). */
  solved: boolean;
  /** The clues admit no solution (detected without guessing). */
  contradiction: boolean;
}

/**
 * Propagation solver (no guessing). Keeps bounds `[min, max]` per edge and applies until
 * nothing changes:
 *  - capacity: an island's remaining need forces / limits each of its edges;
 *  - crossing: a certain bridge forbids every edge it crosses;
 *  - isolation: a bridge that would leave a group of islands with no free capacity (while
 *    other islands remain) is impossible, and such a closed group is a contradiction.
 * Every rule only removes values that occur in no solution, so a full solve is unique.
 */
export function solve(puzzle: Puzzle, options: SolveOptions = {}): SolveResult {
  const { islands } = puzzle;
  const n = islands.length;
  const edges = edgesOf(puzzle.size, islands);
  const cross = crossingsOf(islands, edges);
  const inc = incidence(n, edges);
  const need = islands.map((island) => island[2]);
  const min = edges.map(() => 0);
  const max = edges.map((e) => Math.min(MAX_BRIDGES, need[e.a] as number, need[e.b] as number));
  const fail = (): SolveResult => ({ min, max, solved: false, contradiction: true });

  let changed = true;
  while (changed) {
    changed = false;

    // Capacity.
    for (let i = 0; i < n; i++) {
      const list = inc[i] as number[];
      let sumMin = 0;
      let sumMax = 0;
      for (const e of list) {
        sumMin += min[e] as number;
        sumMax += max[e] as number;
      }
      const target = need[i] as number;
      if (sumMin > target || sumMax < target) return fail();
      for (const e of list) {
        const lo = target - (sumMax - (max[e] as number));
        const hi = target - (sumMin - (min[e] as number));
        if (lo > (min[e] as number)) {
          min[e] = lo;
          changed = true;
        }
        if (hi < (max[e] as number)) {
          max[e] = hi;
          changed = true;
        }
      }
    }

    // Crossing.
    for (let e = 0; e < edges.length; e++) {
      if ((min[e] as number) > (max[e] as number)) return fail();
      if ((min[e] as number) === 0) continue;
      for (const f of cross[e] as number[]) {
        if ((min[f] as number) > 0) return fail();
        if ((max[f] as number) > 0) {
          max[f] = 0;
          changed = true;
        }
      }
    }
    if (changed || options.connectivity === false) continue;

    // Connectivity: groups of islands already joined by certain bridges.
    const roots = componentRoots(n, edges, min);
    const groupSize = new Array<number>(n).fill(0);
    const free = new Array<number>(n).fill(0);
    for (let i = 0; i < n; i++) {
      const root = roots[i] as number;
      let used = 0;
      for (const e of inc[i] as number[]) used += min[e] as number;
      groupSize[root] = (groupSize[root] as number) + 1;
      free[root] = (free[root] as number) + (need[i] as number) - used;
    }
    if (groupSize[roots[0] as number] === n) continue;
    // A group that cannot take another bridge is cut off from the other groups.
    for (let i = 0; i < n; i++) if (roots[i] === i && free[i] === 0) return fail();
    // Isolation: building `max` bridges must leave the joined group some free capacity.
    for (let e = 0; e < edges.length; e++) {
      const top = max[e] as number;
      const low = min[e] as number;
      if (top === low) continue;
      const ra = roots[(edges[e] as Edge).a] as number;
      const rb = roots[(edges[e] as Edge).b] as number;
      const joinedSize = (groupSize[ra] as number) + (ra === rb ? 0 : (groupSize[rb] as number));
      const joinedFree = (free[ra] as number) + (ra === rb ? 0 : (free[rb] as number)) - 2 * (top - low);
      if (joinedSize < n && joinedFree === 0) {
        max[e] = top - 1;
        changed = true;
      }
    }
  }

  const fixed = min.every((v, e) => v === max[e]);
  const solved = fixed && isConnected(n, edges, min);
  return { min, max, solved, contradiction: fixed && !solved };
}

/** True when the solver alone determines all bridges of the puzzle. */
export function isLogicSolvable(puzzle: Puzzle): boolean {
  return solve(puzzle).solved;
}

// --- Generation ----------------------------------------------------------------------------

/** murmur3 32-bit finaliser: a bijective avalanche mix. */
function fmix32(value: number): number {
  let h = value >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Deterministic per-attempt seed: the seed is mixed before the attempt number is added, so
 * neighbouring seeds do not share attempt sequences.
 */
export function attemptSeed(seed: number, attempt: number): number {
  return fmix32(fmix32(seed) + attempt + 1);
}

export interface Network {
  size: number;
  /** Island positions `[row, column]` in placement order. */
  positions: [number, number][];
  /** Bridges as `[islandA, islandB, count]` (placement indices). */
  links: [number, number, number][];
}

/** Probability that a newly built bridge is double. */
const DOUBLE_CHANCE = 0.35;
/** Probability of adding a loop-closing bridge between already placed line-neighbours. */
const LOOP_CHANCE = 0.3;

/**
 * Grows a random connected bridge network: starting from one island, repeatedly extends a
 * bridge of length ≥ 2 from an existing island to a new island. Bridges never cross or pass
 * through islands, and islands never touch (not even diagonally). Afterwards some extra
 * bridges between line-neighbours close loops.
 */
export function growNetwork(rng: Rng, size: number, target: number): Network {
  const islandAt = new Int16Array(size * size).fill(-1);
  const bridgeAt = new Uint8Array(size * size);
  const positions: [number, number][] = [];
  const links: [number, number, number][] = [];
  const inside = (r: number, c: number) => r >= 0 && c >= 0 && r < size && c < size;
  const crowded = (r: number, c: number) => {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (inside(r + dr, c + dc) && islandAt[(r + dr) * size + c + dc] !== -1) return true;
      }
    }
    return false;
  };
  const addIsland = (r: number, c: number) => {
    islandAt[r * size + c] = positions.length;
    positions.push([r, c]);
  };
  const lay = (a: number, b: number) => {
    const [r1, c1] = positions[a] as [number, number];
    const [r2, c2] = positions[b] as [number, number];
    const dr = Math.sign(r2 - r1);
    const dc = Math.sign(c2 - c1);
    for (let r = r1 + dr, c = c1 + dc; r !== r2 || c !== c2; r += dr, c += dc) bridgeAt[r * size + c] = 1;
    links.push([a, b, rng.next() < DOUBLE_CHANCE ? 2 : 1]);
  };

  addIsland(rng.int(0, size - 1), rng.int(0, size - 1));
  const budget = target * 80;
  for (let tries = 0; tries < budget && positions.length < target; tries++) {
    const from = rng.int(0, positions.length - 1);
    const [dr, dc] = STEP[rng.pick(DIRECTIONS)];
    const length = rng.int(2, size - 1);
    const [r0, c0] = positions[from] as [number, number];
    const r = r0 + dr * length;
    const c = c0 + dc * length;
    if (!inside(r, c) || bridgeAt[r * size + c] !== 0 || crowded(r, c)) continue;
    let clear = true;
    for (let k = 1; k < length && clear; k++) {
      const at = (r0 + dr * k) * size + c0 + dc * k;
      if (islandAt[at] !== -1 || bridgeAt[at] !== 0) clear = false;
    }
    if (!clear) continue;
    addIsland(r, c);
    lay(from, positions.length - 1);
  }

  // Close some loops between line-neighbours that are not yet joined.
  const linked = new Set(links.map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`));
  for (let a = 0; a < positions.length; a++) {
    for (const dir of ['right', 'down'] as const) {
      const [dr, dc] = STEP[dir];
      const [r0, c0] = positions[a] as [number, number];
      let r = r0 + dr;
      let c = c0 + dc;
      let free = true;
      while (inside(r, c) && islandAt[r * size + c] === -1) {
        if (bridgeAt[r * size + c] !== 0) free = false;
        r += dr;
        c += dc;
      }
      if (!inside(r, c)) continue;
      const b = islandAt[r * size + c] as number;
      if (!free || linked.has(`${Math.min(a, b)}-${Math.max(a, b)}`)) continue;
      if (rng.next() < LOOP_CHANCE) {
        linked.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
        lay(a, b);
      }
    }
  }
  return { size, positions, links };
}

/** Puzzle (row-major islands with derived numbers) and its bridges per edge. */
export function puzzleFromNetwork(network: Network): { puzzle: Puzzle; solution: number[] } {
  const { size, positions, links } = network;
  const order = positions.map((_, i) => i).sort((x, y) => {
    const [r1, c1] = positions[x] as [number, number];
    const [r2, c2] = positions[y] as [number, number];
    return r1 * size + c1 - (r2 * size + c2);
  });
  const rank = new Array<number>(positions.length);
  order.forEach((placed, i) => (rank[placed] = i));
  const need = new Array<number>(positions.length).fill(0);
  for (const [a, b, k] of links) {
    need[rank[a] as number] = (need[rank[a] as number] as number) + k;
    need[rank[b] as number] = (need[rank[b] as number] as number) + k;
  }
  const islands = order.map((placed, i): Island => {
    const [r, c] = positions[placed] as [number, number];
    return [r, c, need[i] as number];
  });
  const edges = edgesOf(size, islands);
  const solution = edges.map(() => 0);
  for (const [a, b, k] of links) solution[edgeBetween(edges, rank[a] as number, rank[b] as number)] = k;
  return { puzzle: { size, islands }, solution };
}

/**
 * Original fallback puzzles (produced once by this generator and frozen; checked by the
 * tests to be unique and logic-solvable). Used only if every seeded attempt fails.
 */
export const FALLBACK: Readonly<Record<Difficulty, { islands: Island[]; solution: number[] }>> = {
  easy: {
    islands: [[0, 0, 2], [0, 2, 3], [0, 5, 3], [2, 0, 2], [2, 3, 2], [5, 1, 1], [5, 3, 4], [5, 5, 3]],
    solution: [1, 1, 2, 1, 1, 1, 1, 2]
  },
  medium: {
    islands: [
      [0, 3, 1], [1, 0, 2], [1, 6, 1], [1, 8, 2], [3, 8, 4], [4, 0, 4], [4, 3, 5], [4, 6, 2],
      [6, 1, 2], [6, 3, 3], [6, 5, 4], [6, 7, 2], [8, 1, 2], [8, 5, 4], [8, 8, 4]
    ],
    solution: [1, 0, 2, 0, 1, 2, 2, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2]
  },
  hard: {
    islands: [
      [0, 5, 3], [0, 8, 3], [0, 10, 1], [1, 0, 3], [1, 2, 2], [2, 6, 1], [2, 8, 3], [2, 10, 1],
      [3, 1, 3], [3, 3, 2], [4, 9, 1], [5, 1, 3], [5, 5, 6], [5, 7, 1], [7, 0, 3], [7, 2, 4],
      [7, 5, 6], [7, 9, 2], [8, 7, 2], [9, 5, 2], [10, 0, 1], [10, 2, 3], [10, 7, 6], [10, 9, 2]
    ],
    solution: [1, 2, 1, 1, 0, 2, 1, 0, 1, 1, 2, 1, 1, 2, 1, 1, 0, 1, 1, 2, 1, 1, 2, 0, 2, 0, 2, 2]
  }
};

export interface Generated {
  puzzle: Puzzle;
  solution: number[];
  /** Attempt that succeeded, or -1 for the fallback. */
  attempt: number;
}

/** One candidate for `seed`: a grown network turned into a puzzle, or `null` if rejected. */
export function candidate(seed: number, difficulty: Difficulty): { puzzle: Puzzle; solution: number[] } | null {
  const size = SIZES[difficulty];
  const [lo, hi] = ISLAND_RANGE[difficulty];
  const rng = createRng(seed);
  const network = growNetwork(rng, size, rng.int(lo, hi));
  if (network.positions.length < lo) return null;
  const result = puzzleFromNetwork(network);
  // Difficulty analysis: easy puzzles must yield to counting alone (no connectivity reasoning).
  if (!solve(result.puzzle, { connectivity: difficulty !== 'easy' }).solved) return null;
  return result;
}

/** The seeded puzzle for a difficulty: unique and solvable without guessing. */
export function generatePuzzle(seed: number, difficulty: Difficulty, maxAttempts = MAX_ATTEMPTS): Generated {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const found = candidate(attemptSeed(seed >>> 0, attempt), difficulty);
    if (found) return { ...found, attempt };
  }
  const fallback = FALLBACK[difficulty];
  return {
    puzzle: { size: SIZES[difficulty], islands: fallback.islands.map((i) => [...i] as Island) },
    solution: [...fallback.solution],
    attempt: -1
  };
}

// --- Game state ----------------------------------------------------------------------------

export function createInitialState(seed: number, difficulty: Difficulty = DEFAULT_DIFFICULTY): BridgesState {
  const generated = generatePuzzle(seed >>> 0, difficulty);
  return {
    seed: seed >>> 0,
    difficulty,
    size: SIZES[difficulty],
    islands: generated.puzzle.islands,
    solution: generated.solution,
    bridges: generated.solution.map(() => 0),
    history: [],
    moves: 0,
    checks: 0,
    lastCheck: null
  };
}

export const puzzleOf = (state: Pick<BridgesState, 'size' | 'islands'>): Puzzle => ({ size: state.size, islands: state.islands });

/** Solved when every number is met, nothing crosses and all islands form one group. */
export function isSolved(state: Pick<BridgesState, 'size' | 'islands' | 'bridges'>): boolean {
  return isSolution(puzzleOf(state), state.bridges);
}

/** Bridges each island currently has. */
export function islandDegrees(state: Pick<BridgesState, 'size' | 'islands' | 'bridges'>): number[] {
  return degrees(state.islands.length, edgesOf(state.size, state.islands), state.bridges);
}

/** Number of islands whose bridge count equals their number. */
export function satisfiedCount(state: Pick<BridgesState, 'size' | 'islands' | 'bridges'>): number {
  const deg = islandDegrees(state);
  return state.islands.filter(([, , need], i) => deg[i] === need).length;
}

/** The next count when cycling: 0 → 1 → 2 → 0. */
export const nextCount = (count: number): number => (count + 1) % (MAX_BRIDGES + 1);

export type BridgeOutcome = 'ok' | 'finished' | 'noEdge' | 'blocked';

/** Why `cycleBridge` would refuse (or `ok`). */
export function cycleOutcome(state: BridgesState, edge: number): BridgeOutcome {
  if (isSolved(state)) return 'finished';
  const edges = edgesOf(state.size, state.islands);
  if (!Number.isInteger(edge) || edge < 0 || edge >= edges.length) return 'noEdge';
  if ((state.bridges[edge] as number) === 0 && blockingEdge(state.islands, edges, state.bridges, edge) >= 0) return 'blocked';
  return 'ok';
}

/** Cycles the bridges on an edge (0 → 1 → 2 → 0). Returns the same object when refused. */
export function cycleBridge(state: BridgesState, edge: number): BridgesState {
  if (cycleOutcome(state, edge) !== 'ok') return state;
  const previous = state.bridges[edge] as number;
  const bridges = [...state.bridges];
  bridges[edge] = nextCount(previous);
  const history: [number, number][] = [...state.history, [edge, previous]];
  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
  return { ...state, bridges, history, moves: state.moves + 1, lastCheck: null };
}

export const canUndo = (state: BridgesState): boolean => state.history.length > 0 && !isSolved(state);

/** Reverts the latest bridge change. */
export function undo(state: BridgesState): BridgesState {
  if (!canUndo(state)) return state;
  const history = state.history.slice(0, -1);
  const [edge, previous] = state.history[state.history.length - 1] as [number, number];
  const bridges = [...state.bridges];
  bridges[edge] = previous;
  return { ...state, bridges, history, lastCheck: null };
}

/** Edges carrying more bridges than the solution. */
export function wrongBridges(state: Pick<BridgesState, 'bridges' | 'solution'>): number {
  return state.bridges.filter((k, e) => k > (state.solution[e] as number)).length;
}

/** Counts wrong bridges without revealing where they are. */
export function check(state: BridgesState): BridgesState {
  if (isSolved(state)) return state;
  return { ...state, checks: state.checks + 1, lastCheck: wrongBridges(state) };
}

// --- Validation ----------------------------------------------------------------------------

const isCounter = (value: unknown): value is number => isInt(value, 0, MAX_COUNTER);

/** True when islands are row-major, in range, need 1–8 and never touch (Chebyshev ≥ 2). */
export function isValidLayout(size: number, islands: unknown): islands is Island[] {
  if (!Array.isArray(islands) || islands.length < 2 || islands.length > size * size) return false;
  let previous = -1;
  for (const island of islands) {
    if (!Array.isArray(island) || island.length !== 3) return false;
    const [r, c, need] = island as unknown[];
    if (!isInt(r, 0, size - 1) || !isInt(c, 0, size - 1) || !isInt(need, 1, 4 * MAX_BRIDGES)) return false;
    const at = r * size + c;
    if (at <= previous) return false;
    previous = at;
  }
  const list = islands as Island[];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const [r1, c1] = list[i] as Island;
      const [r2, c2] = list[j] as Island;
      if (Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2)) < 2) return false;
    }
  }
  return true;
}

const isCountList = (value: unknown, length: number): value is number[] =>
  Array.isArray(value) && value.length === length && value.every((k) => isInt(k, 0, MAX_BRIDGES));

/** Structural validation of untrusted saves. Never throws. */
export function isBridgesState(value: unknown): value is BridgesState {
  try {
    if (!isRecord(value)) return false;
    const v = value;
    if (!isUint32(v.seed) || !isOneOf(v.difficulty, DIFFICULTIES)) return false;
    const size = SIZES[v.difficulty];
    if (v.size !== size || !isValidLayout(size, v.islands)) return false;
    const islands = v.islands as Island[];
    const edges = edgesOf(size, islands);
    if (!isCountList(v.solution, edges.length) || !isCountList(v.bridges, edges.length)) return false;
    const bridges = v.bridges as number[];
    for (let e = 0; e < edges.length; e++) {
      if ((bridges[e] as number) > 0 && blockingEdge(islands, edges, bridges, e) >= 0) return false;
    }
    if (!Array.isArray(v.history) || v.history.length > MAX_HISTORY) return false;
    for (const entry of v.history as unknown[]) {
      if (!Array.isArray(entry) || entry.length !== 2 || !isInt(entry[0], 0, edges.length - 1) || !isInt(entry[1], 0, MAX_BRIDGES)) return false;
    }
    if (!isCounter(v.moves) || !isCounter(v.checks) || v.history.length > v.moves) return false;
    if (v.lastCheck !== null && !isInt(v.lastCheck, 0, edges.length)) return false;
    const puzzle = { size, islands };
    const solution = v.solution as number[];
    if (!isSolution(puzzle, solution)) return false;
    const solved = solve(puzzle);
    return solved.solved && solved.min.every((k, e) => k === solution[e]);
  } catch {
    return false;
  }
}
