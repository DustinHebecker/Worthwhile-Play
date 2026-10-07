/**
 * Original puzzle generator (used offline by `scripts/generate-puzzles.ts`; not loaded by the game).
 *
 * 1. Seeded random placement (`createRng`) of the star block in row 3 plus 10–14 other blocks
 *    (fewer blocks give huge, mostly shallow clusters; clusters above 60 000 positions are skipped).
 * 2. Breadth-first search over every position reachable from that placement (its "cluster";
 *    moves are reversible, so the cluster is the same from any of its positions).
 * 3. Multi-source breadth-first search backwards from all solved positions of the cluster gives
 *    every position's exact fewest-moves distance.
 * 4. A position at a distance drawn uniformly from the difficulty's band is chosen (for `hard`,
 *    the farthest one, if at least 21 moves away). Rejected placements are retried with
 *    deterministically derived seeds.
 *
 * Hard puzzles (21+ moves) need on average a few hundred placements — about 15 s per puzzle on a
 * desktop, far too slow for a phone at the moment of pressing "New game" (medium: about 3 s).
 * Hence the shipped, pre-generated list, which the tests re-verify with an independent solver.
 */
import { createRng, seedFromString, type Rng } from '@wp/game-core';
import {
  BANDS,
  EXIT_COL,
  SIZE,
  isSolvedAt,
  layoutProblem,
  layoutString,
  legalMoves,
  parseLayout,
  startPositions,
  type Block,
  type Difficulty,
  type Positions
} from './rules';

export interface GeneratedPuzzle {
  layout: string;
  optimum: number;
}

/** Row of the star block in generated puzzles (0-based; the third row, as is customary). */
export const TARGET_ROW = 2;

/** A random, non-overlapping placement (always passes `layoutProblem`). */
export function randomPlacement(rng: Rng): Block[] {
  const blocks: Block[] = [{ row: TARGET_ROW, col: rng.int(0, EXIT_COL - 1), len: 2, orient: 'h' }];
  const taken = new Set<number>([TARGET_ROW * SIZE + (blocks[0] as Block).col, TARGET_ROW * SIZE + (blocks[0] as Block).col + 1]);
  const wanted = rng.int(10, 14);
  for (let attempt = 0; attempt < 200 && blocks.length <= wanted; attempt++) {
    const orient = rng.next() < 0.5 ? 'h' : 'v';
    const len = rng.next() < 0.25 ? 3 : 2;
    const row = orient === 'h' ? rng.int(0, SIZE - 1) : rng.int(0, SIZE - len);
    const col = orient === 'h' ? rng.int(0, SIZE - len) : rng.int(0, SIZE - 1);
    // A horizontal block in the star block's row could never let it pass.
    if (orient === 'h' && row === TARGET_ROW) continue;
    const cells = Array.from({ length: len }, (_, i) => (orient === 'h' ? row * SIZE + col + i : (row + i) * SIZE + col));
    if (cells.some((cell) => taken.has(cell))) continue;
    for (const cell of cells) taken.add(cell);
    blocks.push({ row, col, len, orient });
  }
  return blocks;
}

const keyOf = (positions: Positions) => String.fromCharCode(...positions.map((p) => 48 + p));

export interface Cluster {
  positions: Positions[];
  /** Fewest moves to a solved position for each entry of `positions`; -1 if none is reachable. */
  distance: number[];
}

/** Every position reachable from the starting layout and its exact distance to the goal. */
export function exploreCluster(blocks: readonly Block[], limit = 60_000): Cluster | null {
  const index = new Map<string, number>();
  const positions: Positions[] = [];
  const neighbours: number[][] = [];
  const add = (p: Positions) => {
    const key = keyOf(p);
    let i = index.get(key);
    if (i === undefined) {
      i = positions.length;
      index.set(key, i);
      positions.push(p);
    }
    return i;
  };
  add(startPositions(blocks));
  for (let i = 0; i < positions.length; i++) {
    if (positions.length > limit) return null;
    const p = positions[i] as Positions;
    neighbours[i] = legalMoves(blocks, p).map(({ id, delta }) => {
      const next = [...p];
      next[id] = (next[id] as number) + delta;
      return add(next);
    });
  }
  const distance = new Array<number>(positions.length).fill(-1);
  const queue: number[] = [];
  positions.forEach((p, i) => {
    if (isSolvedAt(p)) {
      distance[i] = 0;
      queue.push(i);
    }
  });
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head] as number;
    for (const j of neighbours[i] as number[]) {
      if (distance[j] !== -1) continue;
      distance[j] = (distance[i] as number) + 1;
      queue.push(j);
    }
  }
  return { positions, distance };
}

/** Same blocks, renumbered by first appearance at `positions` (the shipped text format). */
export const layoutAt = (blocks: readonly Block[], positions: Positions): string => layoutString(parseLayout(layoutString(blocks, positions)));

/**
 * One puzzle of the difficulty from `seed`, trying derived seeds `seed/0`, `seed/1`, … until a
 * placement yields a position in the band. `null` after `maxAttempts` failed placements.
 */
export function generatePuzzle(seed: number, difficulty: Difficulty, maxAttempts = 5_000): GeneratedPuzzle | null {
  const [lo, hi] = BANDS[difficulty];
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const rng = createRng(seedFromString(`sliding-blocks/${seed}/${attempt}`));
    const blocks = randomPlacement(rng);
    if (layoutProblem(blocks)) continue;
    const cluster = exploreCluster(blocks);
    if (!cluster) continue;
    const inBand = cluster.distance.map((d, i) => ({ d, i })).filter(({ d }) => d >= lo && d <= hi);
    if (inBand.length === 0) continue;
    let chosen: number;
    if (difficulty === 'hard') {
      const deepest = inBand.reduce((max, { d }) => Math.max(max, d), 0);
      chosen = rng.pick(inBand.filter(({ d }) => d === deepest)).i;
    } else {
      // A distance drawn uniformly from the band (so optima spread evenly), then a position at it.
      const d = rng.int(lo, hi);
      const atDistance = inBand.filter((entry) => entry.d === d);
      if (atDistance.length === 0) continue;
      chosen = rng.pick(atDistance).i;
    }
    return { layout: layoutAt(blocks, cluster.positions[chosen] as Positions), optimum: cluster.distance[chosen] as number };
  }
  return null;
}
