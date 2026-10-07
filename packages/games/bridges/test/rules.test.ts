// @ts-nocheck
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import {
  DIFFICULTIES,
  FALLBACK,
  ISLAND_RANGE,
  MAX_ATTEMPTS,
  MAX_COUNTER,
  MAX_HISTORY,
  SIZES,
  attemptSeed,
  blockingEdge,
  canUndo,
  candidate,
  check,
  createInitialState,
  crossingsOf,
  cycleBridge,
  cycleOutcome,
  degrees,
  edgeBetween,
  edgesCross,
  edgesOf,
  generatePuzzle,
  growNetwork,
  incidence,
  isBridgesState,
  isConnected,
  isLogicSolvable,
  isSolution,
  isSolved,
  isValidLayout,
  islandDegrees,
  nearestIsland,
  neighbourIn,
  nextCount,
  puzzleFromNetwork,
  puzzleOf,
  satisfiedCount,
  solve,
  toDifficulty,
  undo,
  wrongBridges,
  type BridgesState,
  type Direction,
  type Edge,
  type Island,
  type Puzzle
} from '../src/rules';
import { countSolutions } from './oracle';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const SLOW = 120_000;

/** Bridges per edge (rules order) of an oracle solution keyed by coordinates. */
function oracleVector(puzzle: Puzzle, solution: Map<string, number>): number[] {
  const edges = edgesOf(puzzle.size, puzzle.islands);
  const keys = edges.map((e) => {
    const [r1, c1] = puzzle.islands[e.a] as Island;
    const [r2, c2] = puzzle.islands[e.b] as Island;
    return `${r1},${c1}-${r2},${c2}`;
  });
  for (const key of solution.keys()) expect(keys).toContain(key);
  return keys.map((key) => solution.get(key) ?? 0);
}

/** A game state for a hand-made puzzle (rules do not require it to be generated). */
function stateFor(size: number, islands: Island[], solution: number[]): BridgesState {
  return { seed: 1, difficulty: 'easy', size, islands, solution, bridges: solution.map(() => 0), history: [], moves: 0, checks: 0, lastCheck: null };
}

// Hand-made puzzles --------------------------------------------------------------------------

/**
 * Crossing puzzle (5 × 5):      . . T . .
 *                               L . + . R      (T–B would cross L–R)
 *                               X . B . Y
 * Edges: 0 T–B, 1 L–R, 2 L–X, 3 R–Y, 4 X–B, 5 B–Y.
 */
const CROSS_ISLANDS: Island[] = [[0, 2, 1], [2, 0, 1], [2, 4, 1], [4, 0, 2], [4, 2, 3], [4, 4, 2]];
const CROSS_SOLUTION = [1, 0, 1, 1, 1, 1];
const crossPuzzle = (): Puzzle => ({ size: 5, islands: clone(CROSS_ISLANDS) });

/** Two 1-islands may not be joined to each other (they would be cut off). Edges: A–B, A–C, B–D, C–D. */
const PAIR_ISLANDS: Island[] = [[0, 0, 1], [0, 2, 1], [2, 0, 2], [2, 2, 2]];
/** Four 2-islands in a square: two double bridges would form two closed pairs. */
const SQUARE_ISLANDS: Island[] = [[0, 1, 2], [0, 3, 2], [2, 1, 2], [2, 3, 2]];
/** Valid numbers with two different solutions. */
const AMBIGUOUS: Puzzle = { size: 5, islands: [[1, 1, 1], [1, 4, 2], [3, 1, 2], [3, 4, 3]] };

describe('geometry', () => {
  it('finds edges to the nearest island to the right and below, in island order', () => {
    const islands: Island[] = [[0, 0, 1], [0, 2, 1], [0, 4, 1], [2, 0, 1], [4, 0, 1], [4, 4, 1]];
    expect(edgesOf(5, islands)).toEqual([
      { a: 0, b: 1, horizontal: true },
      { a: 0, b: 3, horizontal: false },
      { a: 1, b: 2, horizontal: true },
      { a: 2, b: 5, horizontal: false },
      { a: 3, b: 4, horizontal: false },
      { a: 4, b: 5, horizontal: true }
    ]);
    expect(edgesOf(5, [[2, 2, 1]])).toEqual([]);
    // Far apart in one line still counts; the last row/column is scanned too.
    expect(edgesOf(7, [[0, 6, 1], [6, 6, 1]])).toEqual([{ a: 0, b: 1, horizontal: false }]);
    expect(edgesOf(7, [[6, 0, 1], [6, 6, 1]])).toEqual([{ a: 0, b: 1, horizontal: true }]);
  });

  it('agrees with a brute-force definition of line-neighbours', () => {
    const layout = fc.uniqueArray(fc.tuple(fc.integer({ min: 0, max: 5 }), fc.integer({ min: 0, max: 5 })), {
      minLength: 0,
      maxLength: 12,
      selector: ([r, c]) => r * 6 + c
    });
    fc.assert(
      fc.property(layout, (cells) => {
        const islands = cells.map(([r, c]): Island => [r, c, 1]).sort((x, y) => x[0] * 6 + x[1] - (y[0] * 6 + y[1]));
        const expected: string[] = [];
        islands.forEach(([r1, c1], i) =>
          islands.forEach(([r2, c2], j) => {
            if (j <= i || (r1 !== r2 && c1 !== c2)) return;
            const between = islands.some(([r, c]) => (r1 === r2 ? r === r1 && c > c1 && c < c2 : c === c1 && r > r1 && r < r2));
            if (!between) expected.push(`${i}-${j}-${r1 === r2}`);
          })
        );
        const actual = edgesOf(6, islands).map((e) => `${e.a}-${e.b}-${e.horizontal}`);
        expect([...actual].sort()).toEqual([...expected].sort());
      })
    );
  });

  it('detects crossings only strictly between end points', () => {
    const crosses = (h: [number, number, number], v: [number, number, number]) => {
      const islands: Island[] = [[h[0], h[1], 1], [h[0], h[2], 1], [v[1], v[0], 1], [v[2], v[0], 1]];
      const he: Edge = { a: 0, b: 1, horizontal: true };
      const ve: Edge = { a: 2, b: 3, horizontal: false };
      const result = edgesCross(islands, he, ve);
      expect(edgesCross(islands, ve, he)).toBe(result);
      return result;
    };
    // h = [row, c1, c2]; v = [column, r1, r2]
    expect(crosses([2, 0, 4], [2, 0, 4])).toBe(true);
    expect(crosses([2, 0, 4], [1, 0, 4])).toBe(true);
    expect(crosses([2, 0, 4], [3, 0, 4])).toBe(true);
    expect(crosses([2, 0, 4], [2, 1, 3])).toBe(true);
    expect(crosses([2, 0, 4], [2, 2, 4])).toBe(false);
    expect(crosses([2, 0, 4], [2, 0, 2])).toBe(false);
    expect(crosses([2, 0, 4], [0, 0, 4])).toBe(false);
    expect(crosses([2, 0, 4], [4, 0, 4])).toBe(false);
    expect(crosses([2, 0, 4], [5, 0, 4])).toBe(false);
    expect(crosses([2, 0, 4], [2, 3, 5])).toBe(false);
    const islands: Island[] = [[0, 0, 1], [0, 4, 1], [2, 0, 1], [2, 4, 1]];
    expect(edgesCross(islands, { a: 0, b: 1, horizontal: true }, { a: 2, b: 3, horizontal: true })).toBe(false);
    expect(edgesCross(islands, { a: 0, b: 2, horizontal: false }, { a: 1, b: 3, horizontal: false })).toBe(false);
  });

  it('lists crossings symmetrically and matches shared interior cells', () => {
    const p = crossPuzzle();
    const edges = edgesOf(p.size, p.islands);
    expect(crossingsOf(p.islands, edges)).toEqual([[1], [0], [], [], [], []]);
    const layout = fc.uniqueArray(fc.tuple(fc.integer({ min: 0, max: 6 }), fc.integer({ min: 0, max: 6 })), {
      minLength: 2,
      maxLength: 14,
      selector: ([r, c]) => r * 7 + c
    });
    fc.assert(
      fc.property(layout, (cells) => {
        const islands = cells.map(([r, c]): Island => [r, c, 1]).sort((x, y) => x[0] * 7 + x[1] - (y[0] * 7 + y[1]));
        const list = edgesOf(7, islands);
        const cellsOf = (e: Edge) => {
          const [r1, c1] = islands[e.a] as Island;
          const [r2, c2] = islands[e.b] as Island;
          const out: string[] = [];
          for (let r = r1, c = c1; ; ) {
            if (r === r2 && c === c2) break;
            if (!(r === r1 && c === c1)) out.push(`${r},${c}`);
            if (e.horizontal) c++;
            else r++;
          }
          return out;
        };
        const crossings = crossingsOf(islands, list);
        list.forEach((e, i) =>
          list.forEach((f, j) => {
            const shared = i !== j && cellsOf(e).some((cell) => cellsOf(f).includes(cell));
            expect(crossings[i]?.includes(j)).toBe(shared);
          })
        );
      })
    );
  });

  it('computes incidence and degrees', () => {
    const p = crossPuzzle();
    const edges = edgesOf(p.size, p.islands);
    expect(incidence(6, edges)).toEqual([[0], [1, 2], [1, 3], [2, 4], [0, 4, 5], [3, 5]]);
    expect(degrees(6, edges, CROSS_SOLUTION)).toEqual([1, 1, 1, 2, 3, 2]);
    expect(degrees(6, edges, [0, 2, 0, 0, 1, 0])).toEqual([0, 2, 2, 1, 1, 0]);
    expect(degrees(2, [], [])).toEqual([0, 0]);
  });

  it('checks connectivity like a breadth-first search', () => {
    const graph = fc.integer({ min: 1, max: 7 }).chain((n) =>
      fc.tuple(
        fc.constant(n),
        fc.array(fc.tuple(fc.integer({ min: 0, max: n - 1 }), fc.integer({ min: 0, max: n - 1 }), fc.integer({ min: 0, max: 2 })), { maxLength: 12 })
      )
    );
    fc.assert(
      fc.property(graph, ([n, list]) => {
        const edges = list.map(([a, b]): Edge => ({ a, b, horizontal: true }));
        const counts = list.map(([, , k]) => k);
        const seen = new Set([0]);
        const queue = [0];
        while (queue.length > 0) {
          const at = queue.shift() as number;
          list.forEach(([a, b, k]) => {
            if (k === 0) return;
            for (const [x, y] of [[a, b], [b, a]] as const) {
              if (x === at && !seen.has(y)) {
                seen.add(y);
                queue.push(y);
              }
            }
          });
        }
        expect(isConnected(n, edges, counts)).toBe(seen.size === n);
      })
    );
    expect(isConnected(0, [], [])).toBe(true);
    expect(isConnected(1, [], [])).toBe(true);
    expect(isConnected(2, [{ a: 0, b: 1, horizontal: true }], [0])).toBe(false);
    expect(isConnected(2, [{ a: 0, b: 1, horizontal: true }], [1])).toBe(true);
  });

  it('finds the bridge that blocks an edge', () => {
    const p = crossPuzzle();
    const edges = edgesOf(p.size, p.islands);
    expect(blockingEdge(p.islands, edges, [0, 0, 0, 0, 0, 0], 0)).toBe(-1);
    expect(blockingEdge(p.islands, edges, [0, 2, 0, 0, 0, 0], 0)).toBe(1);
    expect(blockingEdge(p.islands, edges, [1, 0, 0, 0, 0, 0], 1)).toBe(0);
    expect(blockingEdge(p.islands, edges, [1, 0, 1, 1, 1, 1], 2)).toBe(-1);
    expect(blockingEdge(p.islands, edges, [0, 1, 0, 0, 0, 0], 9)).toBe(-1);
  });

  it('recognises complete valid answers only', () => {
    const p = crossPuzzle();
    expect(isSolution(p, CROSS_SOLUTION)).toBe(true);
    expect(isSolution(p, [1, 0, 1, 1, 1])).toBe(false);
    expect(isSolution(p, [1, 0, 1, 1, 1, 3])).toBe(false);
    expect(isSolution(p, [1, 0, 1, 1, 1, -1])).toBe(false);
    expect(isSolution(p, [1, 0, 1, 1, 2, 1])).toBe(false);
    expect(isSolution(p, [0, 0, 1, 1, 1, 1])).toBe(false);
    // Numbers met but crossing: T–B and L–R both built.
    const crossing: Puzzle = { size: 5, islands: [[0, 2, 1], [2, 0, 1], [2, 4, 1], [4, 2, 1]] };
    expect(isSolution(crossing, [1, 1])).toBe(false);
    // Numbers met but two separate groups.
    expect(isSolution({ size: 5, islands: clone(PAIR_ISLANDS) }, [1, 0, 0, 2])).toBe(false);
    expect(isSolution({ size: 5, islands: clone(PAIR_ISLANDS) }, [0, 1, 1, 1])).toBe(true);
  });

  it('finds line-neighbours, edges between islands and the nearest island for focus', () => {
    // 0 (0,4) · 1 (2,6) · 2 (4,0) · 3 (4,4) · 4 (4,8) · 5 (5,6)
    const islands: Island[] = [[0, 4, 1], [2, 6, 1], [4, 0, 1], [4, 4, 1], [4, 8, 1], [5, 6, 1]];
    expect(neighbourIn(9, islands, 3, 'right')).toBe(4);
    expect(neighbourIn(9, islands, 3, 'left')).toBe(2);
    expect(neighbourIn(9, islands, 3, 'up')).toBe(0);
    expect(neighbourIn(9, islands, 3, 'down')).toBe(-1);
    expect(neighbourIn(9, islands, 2, 'right')).toBe(3);
    expect(neighbourIn(9, islands, 1, 'down')).toBe(5);
    expect(neighbourIn(9, islands, 5, 'up')).toBe(1);
    expect(neighbourIn(9, islands, 4, 'right')).toBe(-1);
    expect(neighbourIn(9, islands, 0, 'up')).toBe(-1);
    expect(neighbourIn(9, islands, 9, 'up')).toBe(-1);

    const edges = edgesOf(9, islands);
    expect(edgeBetween(edges, 2, 3)).toBe(edges.findIndex((e) => e.a === 2 && e.b === 3));
    expect(edgeBetween(edges, 3, 2)).toBe(edgeBetween(edges, 2, 3));
    expect(edgeBetween(edges, 2, 3)).toBeGreaterThanOrEqual(0);
    expect(edgeBetween(edges, 2, 4)).toBe(-1);
    expect(edgeBetween(edges, 0, 5)).toBe(-1);

    // Ties (4,8) vs (5,6) at score 4 go to the lower index; sideways offset counts double.
    expect(nearestIsland(islands, 3, 'right')).toBe(4);
    expect(nearestIsland(islands, 3, 'up')).toBe(0);
    expect(nearestIsland(islands, 3, 'left')).toBe(2);
    expect(nearestIsland(islands, 3, 'down')).toBe(5);
    expect(nearestIsland(islands, 4, 'right')).toBe(-1);
    expect(nearestIsland(islands, 2, 'left')).toBe(-1);
    expect(nearestIsland(islands, 0, 'up')).toBe(-1);
    expect(nearestIsland(islands, 0, 'down')).toBe(3);
    expect(nearestIsland(islands, 5, 'up')).toBe(1);
    expect(nearestIsland(islands, 1, 'left')).toBe(0);
    expect(nearestIsland(islands, 42, 'left')).toBe(-1);
  });

  it('moves focus to every island eventually and never to itself', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5000 }), fc.constantFrom<Direction>('up', 'down', 'left', 'right'), (seed, dir) => {
        const g = generatePuzzle(seed, 'easy');
        const islands = g.puzzle.islands;
        islands.forEach(([r, c], i) => {
          const j = nearestIsland(islands, i, dir);
          if (j < 0) return;
          expect(j).not.toBe(i);
          const [r2, c2] = islands[j] as Island;
          if (dir === 'up') expect(r2).toBeLessThan(r);
          if (dir === 'down') expect(r2).toBeGreaterThan(r);
          if (dir === 'left') expect(c2).toBeLessThan(c);
          if (dir === 'right') expect(c2).toBeGreaterThan(c);
        });
      }),
      { numRuns: 30 }
    );
  });
});

describe('logic solver', () => {
  it('solves by capacity: single neighbours and full islands', () => {
    expect(solve({ size: 5, islands: [[0, 4, 1], [2, 4, 2], [4, 4, 1]] })).toEqual({ min: [1, 1], max: [1, 1], solved: true, contradiction: false });
    expect(solve({ size: 5, islands: [[0, 0, 2], [0, 2, 4], [0, 4, 2]] }).min).toEqual([2, 2]);
    // Two islands that need one bridge each: the only group is everything, so no isolation cut.
    expect(solve({ size: 5, islands: [[0, 0, 1], [0, 2, 1]] })).toEqual({ min: [1], max: [1], solved: true, contradiction: false });
    expect(solve({ size: 5, islands: [[0, 0, 2], [0, 3, 2]] })).toEqual({ min: [2], max: [2], solved: true, contradiction: false });
  });

  it('bounds edges by the smaller number and by what the rest can carry', () => {
    // A 3 between a 1 and a 2: the 1 caps its edge, so the other edge needs two bridges.
    const result = solve({ size: 5, islands: [[0, 0, 1], [0, 2, 3], [0, 4, 2]] }, { connectivity: false });
    expect(result.min).toEqual([1, 2]);
    expect(result.max).toEqual([1, 2]);
    const loose = solve({ size: 5, islands: clone(SQUARE_ISLANDS) }, { connectivity: false });
    expect(loose.min).toEqual([0, 0, 0, 0]);
    expect(loose.max).toEqual([2, 2, 2, 2]);
    expect(loose.solved).toBe(false);
    expect(loose.contradiction).toBe(false);
  });

  it('uses crossings: a certain bridge forbids the edges it crosses', () => {
    const result = solve(crossPuzzle(), { connectivity: false });
    expect(result.solved).toBe(true);
    expect(result.min).toEqual(CROSS_SOLUTION);
    expect(result.max).toEqual(CROSS_SOLUTION);
    // Two forced bridges that cross: no solution.
    const both = solve({ size: 5, islands: [[0, 2, 1], [2, 0, 1], [2, 4, 1], [4, 2, 1]] });
    expect(both.contradiction).toBe(true);
    expect(both.solved).toBe(false);
  });

  it('uses isolation: never closes a group while other islands remain', () => {
    const pair = { size: 5, islands: clone(PAIR_ISLANDS) };
    expect(solve(pair, { connectivity: false }).solved).toBe(false);
    expect(solve(pair)).toEqual({ min: [0, 1, 1, 1], max: [0, 1, 1, 1], solved: true, contradiction: false });
    const square = { size: 5, islands: clone(SQUARE_ISLANDS) };
    expect(solve(square, { connectivity: false }).solved).toBe(false);
    expect(solve(square)).toEqual({ min: [1, 1, 1, 1], max: [1, 1, 1, 1], solved: true, contradiction: false });
    expect(isLogicSolvable(square)).toBe(true);
  });

  it('reports a closed group as a contradiction before the rest is decided', () => {
    // A 1–1 pair that can only join each other, plus an undecided square elsewhere.
    const puzzle: Puzzle = { size: 7, islands: [[0, 0, 1], [0, 2, 1], [2, 4, 2], [2, 6, 2], [4, 4, 2], [4, 6, 2]] };
    expect(solve(puzzle).contradiction).toBe(true);
    const noConnectivity = solve(puzzle, { connectivity: false });
    expect(noConnectivity.contradiction).toBe(false);
    expect(noConnectivity.solved).toBe(false);
    // Fully decided by capacity but split into two groups.
    const split = solve({ size: 7, islands: [[0, 0, 1], [0, 2, 1], [2, 4, 1], [4, 4, 1]] }, { connectivity: false });
    expect(split).toMatchObject({ solved: false, contradiction: true });
  });

  it('detects impossible numbers', () => {
    expect(solve({ size: 5, islands: [[0, 0, 3], [0, 2, 1]] }).contradiction).toBe(true);
    expect(solve({ size: 5, islands: [[0, 0, 1], [0, 2, 2]] }).contradiction).toBe(true);
    expect(solve({ size: 5, islands: [[0, 0, 1], [0, 2, 3], [0, 4, 1]] }).contradiction).toBe(true);
  });

  it('does not decide ambiguous puzzles', () => {
    const result = solve(AMBIGUOUS);
    expect(result.solved).toBe(false);
    expect(result.contradiction).toBe(false);
    expect(countSolutions(AMBIGUOUS.size, AMBIGUOUS.islands, 5).count).toBe(2);
  });

  const checkAgainstOracle = (puzzle: Puzzle) => {
    const result = solve(puzzle);
    const oracle = countSolutions(puzzle.size, puzzle.islands, 200);
    const vectors = oracle.solutions.map((s) => oracleVector(puzzle, s));
    if (result.contradiction) expect(oracle.count).toBe(0);
    for (const v of vectors) {
      v.forEach((k, e) => {
        expect(k).toBeGreaterThanOrEqual(result.min[e] as number);
        expect(k).toBeLessThanOrEqual(result.max[e] as number);
      });
      expect(isSolution(puzzle, v)).toBe(true);
    }
    if (result.solved) {
      expect(oracle.count).toBe(1);
      expect(vectors[0]).toEqual(result.min);
    }
    return { result, oracle };
  };

  it('is sound on random valid puzzles (every oracle solution stays within the bounds)', { timeout: SLOW }, () => {
    let solved = 0;
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.integer({ min: 4, max: 6 }), fc.integer({ min: 3, max: 8 }), (seed, size, target) => {
        const { puzzle, solution } = puzzleFromNetwork(growNetwork(createRng(seed), size, target));
        const { result, oracle } = checkAgainstOracle(puzzle);
        expect(oracle.count).toBeGreaterThanOrEqual(1);
        expect(oracle.solutions.map((s) => oracleVector(puzzle, s))).toContainEqual(solution);
        expect(result.contradiction).toBe(false);
        if (result.solved) solved++;
      }),
      { numRuns: 300 }
    );
    expect(solved).toBeGreaterThan(0);
  });

  it('is sound on random numbers (including unsolvable ones)', { timeout: SLOW }, () => {
    const spaced = fc
      .uniqueArray(fc.tuple(fc.integer({ min: 0, max: 2 }), fc.integer({ min: 0, max: 2 })), { minLength: 2, maxLength: 7, selector: ([r, c]) => r * 3 + c })
      .map((cells) => cells.map(([r, c]) => [2 * r, 2 * c] as const).sort((x, y) => x[0] * 5 + x[1] - (y[0] * 5 + y[1])));
    let contradictions = 0;
    fc.assert(
      fc.property(spaced, fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 7, maxLength: 7 }), (cells, needs) => {
        const puzzle: Puzzle = { size: 5, islands: cells.map(([r, c], i): Island => [r, c, needs[i] as number]) };
        if (checkAgainstOracle(puzzle).result.contradiction) contradictions++;
      }),
      { numRuns: 400 }
    );
    expect(contradictions).toBeGreaterThan(0);
  });

  it('is sound when a valid puzzle has one number changed', { timeout: SLOW }, () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.nat(), fc.constantFrom(-1, 1), (seed, pick, delta) => {
        const { puzzle } = puzzleFromNetwork(growNetwork(createRng(seed), 6, 7));
        const i = pick % puzzle.islands.length;
        const island = puzzle.islands[i] as Island;
        if (island[2] + delta < 1) return;
        island[2] += delta;
        checkAgainstOracle(puzzle);
      }),
      { numRuns: 200 }
    );
  });
});

describe('generation', () => {
  it('derives distinct, deterministic attempt seeds', () => {
    expect(attemptSeed(1, 0)).toBe(attemptSeed(1, 0));
    const seeds = new Set<number>();
    for (let a = 0; a < 200; a++) seeds.add(attemptSeed(12345, a));
    expect(seeds.size).toBe(200);
    expect(attemptSeed(1, 0)).not.toBe(attemptSeed(2, 0));
    for (const s of seeds) expect(Number.isInteger(s) && s >= 0 && s <= 0xffffffff).toBe(true);
    // Pinned values guard against accidental changes to puzzle generation.
    expect([attemptSeed(0, 0), attemptSeed(1, 1), attemptSeed(0xffffffff, 7)]).toEqual([1364076727, 664193924, 3797438073]);
    // Neighbouring seeds must not share attempt sequences.
    const first = new Set<number>();
    for (let a = 0; a < 50; a++) first.add(attemptSeed(0, a));
    for (let a = 0; a < 50; a++) expect(first.has(attemptSeed(1, a))).toBe(false);
  });

  it('turns a network into row-major islands with derived numbers', () => {
    const { puzzle, solution } = puzzleFromNetwork({
      size: 5,
      positions: [[2, 2], [0, 2], [2, 4]],
      links: [[0, 1, 2], [0, 2, 1]]
    });
    expect(puzzle).toEqual({ size: 5, islands: [[0, 2, 2], [2, 2, 3], [2, 4, 1]] });
    expect(solution).toEqual([2, 1]);
  });

  it('grows connected networks whose islands never touch and whose bridges never cross', () => {
    let doubles = 0;
    let loops = 0;
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.integer({ min: 5, max: 11 }), fc.integer({ min: 2, max: 30 }), (seed, size, target) => {
        const network = growNetwork(createRng(seed), size, target);
        expect(growNetwork(createRng(seed), size, target)).toEqual(network);
        expect(network.size).toBe(size);
        expect(network.positions.length).toBeGreaterThanOrEqual(1);
        expect(network.positions.length).toBeLessThanOrEqual(target);
        expect(network.links.length).toBeGreaterThanOrEqual(network.positions.length - 1);
        for (const [a, b, k] of network.links) {
          expect(a).not.toBe(b);
          expect([1, 2]).toContain(k);
          if (k === 2) doubles++;
        }
        if (network.links.length > network.positions.length - 1) loops++;
        if (network.positions.length < 2) return;
        const { puzzle, solution } = puzzleFromNetwork(network);
        expect(isValidLayout(size, puzzle.islands)).toBe(true);
        expect(isSolution(puzzle, solution)).toBe(true);
        expect(solution.filter((k) => k > 0).length).toBe(network.links.length);
      }),
      { numRuns: 300 }
    );
    expect(doubles).toBeGreaterThan(0);
    expect(loops).toBeGreaterThan(0);
  });

  it('reaches the target when there is room and starts anywhere on the board', () => {
    const starts = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const network = growNetwork(createRng(seed), 7, 4);
      expect(network.positions.length).toBe(4);
      starts.add(String(network.positions[0]));
    }
    expect(starts.size).toBeGreaterThan(10);
  });

  it('is deterministic per seed and difficulty', () => {
    for (const difficulty of DIFFICULTIES) {
      for (const seed of [0, 1, 99, 0xffffffff]) expect(generatePuzzle(seed, difficulty)).toEqual(generatePuzzle(seed, difficulty));
    }
    expect(generatePuzzle(1, 'easy')).not.toEqual(generatePuzzle(2, 'easy'));
  });

  it('keeps the first accepted attempt and rejects all earlier ones', { timeout: SLOW }, () => {
    for (const difficulty of DIFFICULTIES) {
      for (let seed = 1; seed <= 4; seed++) {
        const g = generatePuzzle(seed, difficulty);
        expect(g.attempt).toBeGreaterThanOrEqual(0);
        expect(candidate(attemptSeed(seed, g.attempt), difficulty)).toEqual({ puzzle: g.puzzle, solution: g.solution });
        for (let a = 0; a < g.attempt; a++) expect(candidate(attemptSeed(seed, a), difficulty)).toBeNull();
      }
    }
  });

  it('produces puzzles of the right size that are unique (oracle) and solvable by logic', { timeout: SLOW }, () => {
    const counts = new Set<number>();
    for (const difficulty of DIFFICULTIES) {
      const [lo, hi] = ISLAND_RANGE[difficulty];
      for (let seed = 1; seed <= 12; seed++) {
        const { puzzle, solution } = generatePuzzle(seed * 7919, difficulty);
        expect(puzzle.size).toBe(SIZES[difficulty]);
        expect(puzzle.islands.length).toBeGreaterThanOrEqual(lo);
        expect(puzzle.islands.length).toBeLessThanOrEqual(hi);
        expect(isValidLayout(puzzle.size, puzzle.islands)).toBe(true);
        expect(isSolution(puzzle, solution)).toBe(true);
        const oracle = countSolutions(puzzle.size, puzzle.islands, 2);
        expect(oracle.count).toBe(1);
        expect(oracleVector(puzzle, oracle.solutions[0] as Map<string, number>)).toEqual(solution);
        expect(solve(puzzle).min).toEqual(solution);
        // Easy puzzles yield to counting alone.
        if (difficulty === 'easy') expect(solve(puzzle, { connectivity: false }).solved).toBe(true);
        counts.add(puzzle.islands.length);
      }
    }
    expect(counts.size).toBeGreaterThan(3);
  });

  it('includes medium/hard puzzles that need connectivity reasoning', { timeout: SLOW }, () => {
    let needs = 0;
    for (let seed = 1; seed <= 30 && needs === 0; seed++) {
      if (!solve(generatePuzzle(seed, 'medium').puzzle, { connectivity: false }).solved) needs++;
    }
    expect(needs).toBeGreaterThan(0);
  });

  it('is fast enough for phones (bounded generation time)', { timeout: SLOW }, () => {
    for (const difficulty of DIFFICULTIES) {
      const started = performance.now();
      for (let seed = 100; seed < 120; seed++) generatePuzzle(seed, difficulty);
      // ~7 ms per hard puzzle on a laptop; generous margin for slow phones and CI.
      expect(performance.now() - started).toBeLessThan(4000);
    }
  });

  it('falls back to frozen original puzzles that are unique and solvable by logic', () => {
    for (const difficulty of DIFFICULTIES) {
      const g = generatePuzzle(5, difficulty, 0);
      expect(g.attempt).toBe(-1);
      expect(g.puzzle).toEqual({ size: SIZES[difficulty], islands: FALLBACK[difficulty].islands });
      expect(g.solution).toEqual(FALLBACK[difficulty].solution);
      // Copies, so a game can never alter the frozen data.
      expect(g.puzzle.islands).not.toBe(FALLBACK[difficulty].islands);
      expect(g.puzzle.islands[0]).not.toBe(FALLBACK[difficulty].islands[0]);
      expect(g.solution).not.toBe(FALLBACK[difficulty].solution);
      const [lo, hi] = ISLAND_RANGE[difficulty];
      expect(g.puzzle.islands.length).toBeGreaterThanOrEqual(lo);
      expect(g.puzzle.islands.length).toBeLessThanOrEqual(hi);
      expect(isValidLayout(g.puzzle.size, g.puzzle.islands)).toBe(true);
      expect(isSolution(g.puzzle, g.solution)).toBe(true);
      expect(countSolutions(g.puzzle.size, g.puzzle.islands).count).toBe(1);
      expect(solve(g.puzzle, { connectivity: difficulty !== 'easy' }).min).toEqual(g.solution);
      expect(solve(g.puzzle, { connectivity: difficulty !== 'easy' }).solved).toBe(true);
    }
    expect(MAX_ATTEMPTS).toBeGreaterThanOrEqual(300);
  });
});

describe('game state', () => {
  it('creates the initial state from seed and difficulty', () => {
    const s = createInitialState(42, 'medium');
    const g = generatePuzzle(42, 'medium');
    expect(s).toEqual({
      seed: 42,
      difficulty: 'medium',
      size: 9,
      islands: g.puzzle.islands,
      solution: g.solution,
      bridges: g.solution.map(() => 0),
      history: [],
      moves: 0,
      checks: 0,
      lastCheck: null
    });
    expect(createInitialState(-1).seed).toBe(0xffffffff);
    expect(createInitialState(7).difficulty).toBe('easy');
    expect(createInitialState(7)).toEqual(createInitialState(7, 'easy'));
  });

  it('maps unknown difficulties to easy', () => {
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('extreme')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
  });

  it('cycles 0 → 1 → 2 → 0 and records moves and history', () => {
    expect([0, 1, 2].map(nextCount)).toEqual([1, 2, 0]);
    let s = stateFor(5, clone(CROSS_ISLANDS), [...CROSS_SOLUTION]);
    s = { ...s, lastCheck: 3 };
    const a = cycleBridge(s, 1);
    expect(a.bridges).toEqual([0, 1, 0, 0, 0, 0]);
    expect(a.moves).toBe(1);
    expect(a.history).toEqual([[1, 0]]);
    expect(a.lastCheck).toBeNull();
    expect(s.bridges).toEqual([0, 0, 0, 0, 0, 0]);
    const b = cycleBridge(a, 1);
    const c = cycleBridge(b, 1);
    expect(b.bridges[1]).toBe(2);
    expect(c.bridges[1]).toBe(0);
    expect(c.moves).toBe(3);
    expect(c.history).toEqual([[1, 0], [1, 1], [1, 2]]);
  });

  it('refuses crossing bridges, unknown edges and changes after solving', () => {
    const s = stateFor(5, clone(CROSS_ISLANDS), [...CROSS_SOLUTION]);
    const withLR = cycleBridge(s, 1);
    expect(cycleOutcome(withLR, 0)).toBe('blocked');
    expect(cycleBridge(withLR, 0)).toBe(withLR);
    // Raising an existing bridge is never blocked.
    const twice = cycleBridge(withLR, 1);
    expect(twice.bridges[1]).toBe(2);
    expect(cycleOutcome(s, 0)).toBe('ok');
    for (const bad of [-1, 6, 1.5, Number.NaN]) {
      expect(cycleOutcome(s, bad)).toBe('noEdge');
      expect(cycleBridge(s, bad)).toBe(s);
    }
    let solved = s;
    CROSS_SOLUTION.forEach((k, e) => {
      if (k > 0) solved = cycleBridge(solved, e);
    });
    expect(isSolved(solved)).toBe(true);
    expect(cycleOutcome(solved, 2)).toBe('finished');
    expect(cycleBridge(solved, 2)).toBe(solved);
    expect(canUndo(solved)).toBe(false);
    expect(undo(solved)).toBe(solved);
    expect(check(solved)).toBe(solved);
  });

  it('keeps at most MAX_HISTORY undo entries, dropping the oldest', () => {
    let s = stateFor(5, clone(CROSS_ISLANDS), [...CROSS_SOLUTION]);
    for (let k = 0; k <= MAX_HISTORY; k++) s = cycleBridge(s, 1);
    expect(s.history).toHaveLength(MAX_HISTORY);
    expect(s.history[0]).toEqual([1, 1]);
    expect(s.history[MAX_HISTORY - 1]).toEqual([1, MAX_HISTORY % 3]);
    expect(s.moves).toBe(MAX_HISTORY + 1);
  });

  it('undoes the latest change without counting a move', () => {
    const s = stateFor(5, clone(CROSS_ISLANDS), [...CROSS_SOLUTION]);
    expect(canUndo(s)).toBe(false);
    expect(undo(s)).toBe(s);
    const a = cycleBridge(cycleBridge(cycleBridge(s, 2), 3), 3);
    const checked = check(a);
    const b = undo(checked);
    expect(b.bridges).toEqual([0, 0, 1, 1, 0, 0]);
    expect(b.history).toEqual([[2, 0], [3, 0]]);
    expect(b.moves).toBe(3);
    expect(b.lastCheck).toBeNull();
    expect(undo(undo(b)).bridges).toEqual([0, 0, 0, 0, 0, 0]);
    expect(canUndo(b)).toBe(true);
  });

  it('counts wrong bridges on check without revealing them', () => {
    const s = stateFor(5, clone(CROSS_ISLANDS), [...CROSS_SOLUTION]);
    const fresh = check(s);
    expect(fresh.lastCheck).toBe(0);
    expect(fresh.checks).toBe(1);
    const wrong = cycleBridge(cycleBridge(cycleBridge(s, 1), 2), 2);
    expect(wrongBridges(wrong)).toBe(2);
    expect(check(wrong).lastCheck).toBe(2);
    expect(wrongBridges({ bridges: [1, 0, 1, 1, 1, 1], solution: CROSS_SOLUTION })).toBe(0);
    expect(wrongBridges({ bridges: [1, 0, 1, 1, 2, 0], solution: CROSS_SOLUTION })).toBe(1);
  });

  it('solves only with all numbers met and one connected group', () => {
    const pair = stateFor(5, clone(PAIR_ISLANDS), [0, 1, 1, 1]);
    const split = { ...pair, bridges: [1, 0, 0, 2] };
    expect(satisfiedCount(split)).toBe(4);
    expect(isSolved(split)).toBe(false);
    expect(isSolved({ ...pair, bridges: [0, 1, 1, 1] })).toBe(true);
    expect(islandDegrees({ ...pair, bridges: [0, 1, 1, 2] })).toEqual([1, 1, 3, 3]);
    expect(satisfiedCount({ ...pair, bridges: [0, 1, 1, 2] })).toBe(2);
    expect(satisfiedCount(pair)).toBe(0);
    expect(puzzleOf(pair)).toEqual({ size: 5, islands: PAIR_ISLANDS });
  });

  it('reaches a solved state by building the stored solution from any generated game', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom(...DIFFICULTIES), (seed, difficulty) => {
        let s = createInitialState(seed, difficulty);
        s.solution.forEach((k, e) => {
          for (let i = 0; i < k; i++) {
            expect(isSolved(s)).toBe(false);
            s = cycleBridge(s, e);
          }
        });
        expect(isSolved(s)).toBe(true);
        expect(s.moves).toBe(s.solution.reduce((x, y) => x + y, 0));
        expect(isBridgesState(clone(s))).toBe(true);
      }),
      { numRuns: 15 }
    );
  });

  it('never creates crossings or values outside 0–2 through random play', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 5000 }), fc.array(fc.nat(), { maxLength: 60 }), (seed, picks) => {
        let s = createInitialState(seed, 'easy');
        const edges = edgesOf(s.size, s.islands);
        for (const p of picks) {
          s = p % 7 === 0 ? undo(s) : cycleBridge(s, p % edges.length);
          expect(s.bridges.every((k) => k >= 0 && k <= 2)).toBe(true);
          s.bridges.forEach((k, e) => {
            if (k > 0) expect(blockingEdge(s.islands, edges, s.bridges, e)).toBe(-1);
          });
        }
        expect(isBridgesState(clone(s))).toBe(true);
      }),
      { numRuns: 60 }
    );
  });
});

describe('validation', () => {
  const base = () => {
    let s = createInitialState(11, 'easy');
    s = cycleBridge(s, 0);
    return clone(check(s));
  };

  it('accepts generated states of every difficulty', () => {
    for (const difficulty of DIFFICULTIES) expect(isBridgesState(clone(createInitialState(3, difficulty)))).toBe(true);
    expect(isBridgesState(base())).toBe(true);
  });

  it('validates layouts', () => {
    expect(isValidLayout(5, clone(PAIR_ISLANDS))).toBe(true);
    expect(isValidLayout(5, [[0, 0, 1]])).toBe(false);
    expect(isValidLayout(5, 'x')).toBe(false);
    expect(isValidLayout(5, [[0, 0, 1], [0, 2]])).toBe(false);
    expect(isValidLayout(5, [[0, 0, 1], 'x'])).toBe(false);
    expect(isValidLayout(5, [[0, 0, 1], [0, 1, 1]])).toBe(false);
    expect(isValidLayout(5, [[0, 0, 1], [1, 1, 1]])).toBe(false);
    expect(isValidLayout(5, [[1, 1, 1], [0, 3, 1]])).toBe(false);
    expect(isValidLayout(5, [[0, 0, 1], [0, 0, 1]])).toBe(false);
    expect(isValidLayout(5, [[0, 0, 1], [0, 5, 1]])).toBe(false);
    expect(isValidLayout(5, [[0, 0, 1], [5, 0, 1]])).toBe(false);
    expect(isValidLayout(5, [[0, 0, 1], [-2, 0, 1]])).toBe(false);
    expect(isValidLayout(5, [[0, 0, 0], [0, 2, 1]])).toBe(false);
    expect(isValidLayout(5, [[0, 0, 9], [0, 2, 1]])).toBe(false);
    expect(isValidLayout(5, [[0, 0, 8], [0, 4, 1]])).toBe(true);
    expect(isValidLayout(5, [[0, 0, 1], [2, 2, 1], [4, 4, 1]])).toBe(true);
    expect(isValidLayout(5, [[0, 0, 1], [2, 2, 1], [3, 3, 1]])).toBe(false);
    expect(isValidLayout(5, [[0, 2, 1], [1, 0, 1]])).toBe(true);
    expect(isValidLayout(5, [[0, 2, 1], [1, 1, 1]])).toBe(false);
  });

  it('rejects inconsistent or out-of-range states', () => {
    const bad: ((s: Record<string, unknown>) => void)[] = [
      (s) => (s.seed = -1),
      (s) => (s.seed = 1.5),
      (s) => (s.difficulty = 'extreme'),
      (s) => (s.size = 9),
      (s) => (s.islands = []),
      (s) => ((s.islands as Island[])[0]![2] = 0),
      (s) => (s.islands = [...(s.islands as Island[])].reverse()),
      (s) => (s.solution = (s.solution as number[]).slice(1)),
      (s) => (s.solution = (s.solution as number[]).map(() => 0)),
      (s) => ((s.solution as number[])[0] = 3),
      (s) => (s.solution = 'none'),
      (s) => (s.bridges = (s.bridges as number[]).slice(1)),
      (s) => ((s.bridges as number[])[0] = 3),
      (s) => ((s.bridges as number[])[0] = -1),
      (s) => (s.bridges = 'none'),
      (s) => (s.history = 'none'),
      (s) => (s.history = [[0]]),
      (s) => (s.history = [[0, 3]]),
      (s) => (s.history = [[-1, 0]]),
      (s) => (s.history = [[999, 0]]),
      (s) => (s.history = [[0, 0], [0, 1]]),
      (s) => (s.history = new Array(MAX_HISTORY + 1).fill([0, 0])),
      (s) => (s.moves = -1),
      (s) => (s.moves = MAX_COUNTER + 1),
      (s) => (s.checks = 0.5),
      (s) => (s.lastCheck = -1),
      (s) => (s.lastCheck = 999),
      (s) => (s.lastCheck = '0')
    ];
    bad.forEach((mutate, i) => {
      const s = base() as unknown as Record<string, unknown>;
      mutate(s);
      expect(isBridgesState(s), `mutation ${i}`).toBe(false);
    });
    const ok = base() as unknown as Record<string, unknown>;
    ok.lastCheck = null;
    expect(isBridgesState(ok)).toBe(true);
    ok.moves = MAX_COUNTER;
    expect(isBridgesState(ok)).toBe(true);
  });

  it('rejects bridges that cross and puzzles that are not uniquely solvable by logic', () => {
    const cross: BridgesState = { ...stateFor(5, clone(CROSS_ISLANDS), [...CROSS_SOLUTION]), size: 7 };
    // Re-centre on a 7 × 7 board (easy) so only the property under test differs.
    expect(isBridgesState(cross)).toBe(true);
    expect(isBridgesState({ ...cross, bridges: [1, 1, 0, 0, 0, 0] })).toBe(false);
    expect(isBridgesState({ ...cross, bridges: [1, 0, 0, 0, 0, 0] })).toBe(true);
    const ambiguous: BridgesState = { ...stateFor(7, clone(AMBIGUOUS.islands), [1, 0, 1, 2]) };
    expect(isSolution({ size: 7, islands: AMBIGUOUS.islands }, [1, 0, 1, 2])).toBe(true);
    expect(isBridgesState(ambiguous)).toBe(false);
  });

  it('never throws on arbitrary or corrupted data', () => {
    fc.assert(
      fc.property(fc.constantFrom('seed', 'difficulty', 'size', 'islands', 'solution', 'bridges', 'history', 'moves', 'checks', 'lastCheck'), fc.anything(), (key, value) => {
        const s = base() as unknown as Record<string, unknown>;
        s[key] = value;
        expect(() => isBridgesState(s)).not.toThrow();
      }),
      { numRuns: 300 }
    );
    const s = base() as unknown as Record<string, unknown>;
    Object.defineProperty(s, 'islands', { get: () => { throw new Error('boom'); } });
    expect(isBridgesState(s)).toBe(false);
  });
});
