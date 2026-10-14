import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import {
  CROSS,
  DIFFICULTIES,
  LINE,
  MAX_COUNTER,
  MAX_HISTORY,
  MIN_CLUE_SHARE,
  NO_CLUE,
  SIZES,
  UNKNOWN,
  attemptSeed,
  boundaryOf,
  canUndo,
  candidate,
  cellEdges,
  cellLineCounts,
  check,
  clueStatuses,
  clueTotal,
  cluesOf,
  createInitialState,
  cycleEdge,
  dotCount,
  dotEdge,
  dotEdges,
  dotIndex,
  edgeCount,
  edgeInfo,
  fallbackPuzzle,
  generatePuzzle,
  growRegion,
  hEdge,
  isLogicSolvable,
  isLoop,
  isSlitherlinkState,
  isSolution,
  isSolved,
  nextMark,
  satisfiedCount,
  setEdge,
  solve,
  thinClues,
  toDifficulty,
  toggleCross,
  undo,
  vEdge,
  wrongMarks,
  type Difficulty,
  type SlitherlinkState
} from '../src/rules';
import { countSolutions, oracleIsLoop, oracleIsSolution } from './oracle';

const SLOW = 120_000;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** Oracle key of a rules edge index. */
const keyOf = (n: number, e: number) => {
  const info = edgeInfo(n, e);
  return `${info.horizontal ? 'h' : 'v'}-${info.r}-${info.c}`;
};
const lineKeys = (n: number, edges: readonly number[]) => new Set(edges.flatMap((m, e) => (m === LINE ? [keyOf(n, e)] : [])));

/** Edge marks with LINE on the listed edges and UNKNOWN elsewhere. */
const withLines = (n: number, list: readonly number[], rest = UNKNOWN) => {
  const edges = new Array<number>(edgeCount(n)).fill(rest);
  for (const e of list) edges[e] = LINE;
  return edges;
};
const region = (n: number, cells: readonly [number, number][]) => {
  const inside = new Array<boolean>(n * n).fill(false);
  for (const [r, c] of cells) inside[r * n + c] = true;
  return inside;
};

/** A 3 × 3 board whose loop runs around the 2 × 2 block at the top left. */
const SQUARE_N = 3;
const squareSolution = () => boundaryOf(SQUARE_N, region(SQUARE_N, [[0, 0], [0, 1], [1, 0], [1, 1]]));
const squareState = (clues?: number[]): SlitherlinkState => {
  const solution = squareSolution();
  return {
    seed: 1,
    difficulty: 'easy',
    size: SQUARE_N,
    clues: clues ?? cluesOf(SQUARE_N, solution),
    solution,
    edges: new Array<number>(edgeCount(SQUARE_N)).fill(UNKNOWN),
    history: [],
    moves: 0,
    checks: 0,
    lastCheck: null
  };
};

describe('geometry', () => {
  it('numbers edges horizontal first, then vertical', () => {
    expect(edgeCount(1)).toBe(4);
    expect(edgeCount(5)).toBe(60);
    expect(edgeCount(10)).toBe(220);
    expect(dotCount(5)).toBe(36);
    expect(hEdge(3, 0, 0)).toBe(0);
    expect(hEdge(3, 1, 2)).toBe(5);
    expect(hEdge(3, 3, 2)).toBe(11);
    expect(vEdge(3, 0, 0)).toBe(12);
    expect(vEdge(3, 0, 3)).toBe(15);
    expect(vEdge(3, 2, 3)).toBe(23);
    expect(dotIndex(3, 2, 1)).toBe(9);
    expect(edgeInfo(3, 5)).toEqual({ horizontal: true, r: 1, c: 2, a: 6, b: 7 });
    expect(edgeInfo(3, 12)).toEqual({ horizontal: false, r: 0, c: 0, a: 0, b: 4 });
    expect(edgeInfo(3, 23)).toEqual({ horizontal: false, r: 2, c: 3, a: 11, b: 15 });
  });

  it('round-trips every edge through edgeInfo', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), (n) => {
        const seen = new Set<number>();
        for (let r = 0; r <= n; r++) {
          for (let c = 0; c <= n; c++) {
            if (c < n) {
              const e = hEdge(n, r, c);
              expect(edgeInfo(n, e)).toEqual({ horizontal: true, r, c, a: dotIndex(n, r, c), b: dotIndex(n, r, c + 1) });
              seen.add(e);
            }
            if (r < n) {
              const e = vEdge(n, r, c);
              expect(edgeInfo(n, e)).toEqual({ horizontal: false, r, c, a: dotIndex(n, r, c), b: dotIndex(n, r + 1, c) });
              seen.add(e);
            }
          }
        }
        expect(seen.size).toBe(edgeCount(n));
        expect(Math.min(...seen)).toBe(0);
        expect(Math.max(...seen)).toBe(edgeCount(n) - 1);
      })
    );
  });

  it('lists the sides of a cell and the edges at a dot', () => {
    expect(cellEdges(3, 1, 2)).toEqual([hEdge(3, 1, 2), hEdge(3, 2, 2), vEdge(3, 1, 2), vEdge(3, 1, 3)]);
    expect(dotEdge(3, 0, 0, 'up')).toBe(-1);
    expect(dotEdge(3, 0, 0, 'left')).toBe(-1);
    expect(dotEdge(3, 0, 0, 'right')).toBe(hEdge(3, 0, 0));
    expect(dotEdge(3, 0, 0, 'down')).toBe(vEdge(3, 0, 0));
    expect(dotEdge(3, 3, 3, 'down')).toBe(-1);
    expect(dotEdge(3, 3, 3, 'right')).toBe(-1);
    expect(dotEdge(3, 3, 3, 'up')).toBe(vEdge(3, 2, 3));
    expect(dotEdge(3, 3, 3, 'left')).toBe(hEdge(3, 3, 2));
    expect(dotEdge(3, 1, 1, 'up')).toBe(vEdge(3, 0, 1));
    expect(dotEdges(3, 0, 0)).toHaveLength(2);
    expect(dotEdges(3, 0, 1)).toHaveLength(3);
    expect(dotEdges(3, 3, 1)).toHaveLength(3);
    expect(dotEdges(3, 1, 3)).toHaveLength(3);
    expect(dotEdges(3, 1, 1)).toEqual([vEdge(3, 0, 1), vEdge(3, 1, 1), hEdge(3, 1, 0), hEdge(3, 1, 1)]);
  });

  it('counts lines around cells and derives clues from a region boundary', () => {
    const solution = squareSolution();
    expect(cellLineCounts(SQUARE_N, solution)).toEqual([2, 2, 1, 2, 2, 1, 1, 1, 0]);
    expect(cluesOf(SQUARE_N, solution)).toEqual([2, 2, 1, 2, 2, 1, 1, 1, 0]);
    expect(solution.filter((m) => m === LINE)).toHaveLength(8);
    expect(solution.every((m) => m === LINE || m === CROSS)).toBe(true);
    expect(boundaryOf(1, [true])).toEqual([LINE, LINE, LINE, LINE]);
    expect(boundaryOf(1, [false])).toEqual([CROSS, CROSS, CROSS, CROSS]);
    // Only the bottom-right cell of a 2 × 2 board.
    const corner = boundaryOf(2, region(2, [[1, 1]]));
    expect(corner.flatMap((m, e) => (m === LINE ? [e] : []))).toEqual([hEdge(2, 1, 1), hEdge(2, 2, 1), vEdge(2, 1, 1), vEdge(2, 1, 2)]);
  });
});

describe('loop validity', () => {
  it('accepts exactly one closed loop', () => {
    expect(isLoop(1, [LINE, LINE, LINE, LINE])).toBe(true);
    expect(isLoop(1, [LINE, LINE, LINE, CROSS])).toBe(false);
    expect(isLoop(1, [UNKNOWN, UNKNOWN, UNKNOWN, UNKNOWN])).toBe(false);
    expect(isLoop(1, [LINE, LINE, LINE])).toBe(false);
    expect(isLoop(SQUARE_N, squareSolution())).toBe(true);
    // Two separate loops.
    expect(isLoop(3, boundaryOf(3, region(3, [[0, 0], [2, 2]])))).toBe(false);
    // Two cells touching at a corner: one dot of degree 4.
    expect(isLoop(2, boundaryOf(2, region(2, [[0, 0], [1, 1]])))).toBe(false);
    // A ring with a hole: two loops.
    const ring = region(3, [[0, 0], [0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1], [2, 2]]);
    expect(isLoop(3, boundaryOf(3, ring))).toBe(false);
    // Crosses are ignored; unknown edges are not lines.
    const marks = squareSolution().map((m) => (m === CROSS ? UNKNOWN : m));
    expect(isLoop(SQUARE_N, marks)).toBe(true);
  });

  it('agrees with the oracle on region boundaries and random marks', () => {
    const n = 4;
    fc.assert(
      fc.property(fc.array(fc.boolean(), { minLength: n * n, maxLength: n * n }), (inside) => {
        const edges = boundaryOf(n, inside);
        expect(isLoop(n, edges)).toBe(oracleIsLoop(n, lineKeys(n, edges)));
      }),
      { numRuns: 400 }
    );
    fc.assert(
      fc.property(fc.array(fc.constantFrom(UNKNOWN, LINE, CROSS), { minLength: edgeCount(3), maxLength: edgeCount(3) }), (edges) => {
        expect(isLoop(3, edges)).toBe(oracleIsLoop(3, lineKeys(3, edges)));
      }),
      { numRuns: 300 }
    );
  });

  it('checks solutions (loop and clues) like the oracle', () => {
    const n = 4;
    const arb = fc.tuple(
      fc.array(fc.boolean(), { minLength: n * n, maxLength: n * n }),
      fc.array(fc.integer({ min: -2, max: 4 }), { minLength: n * n, maxLength: n * n })
    );
    fc.assert(
      fc.property(arb, ([inside, noise]) => {
        const edges = boundaryOf(n, inside);
        const truth = cellLineCounts(n, edges);
        // Mostly true clues, some removed and some wrong.
        const clues = truth.map((k, i) => ((noise[i] as number) === -2 ? NO_CLUE : (noise[i] as number) === 4 ? (k + 1) % 4 : k));
        expect(isSolution(n, clues, edges)).toBe(oracleIsSolution(n, clues, lineKeys(n, edges)));
      }),
      { numRuns: 400 }
    );
    expect(isSolution(SQUARE_N, cluesOf(SQUARE_N, squareSolution()), squareSolution())).toBe(true);
    expect(isSolution(SQUARE_N, cluesOf(SQUARE_N, squareSolution()).slice(1), squareSolution())).toBe(false);
    expect(isSolution(SQUARE_N, new Array<number>(9).fill(NO_CLUE), squareSolution())).toBe(true);
  });
});

describe('logic solver', () => {
  it('solves and rejects one-cell boards', () => {
    expect(solve(1, [4])).toEqual({ edges: [LINE, LINE, LINE, LINE], solved: true, contradiction: false });
    // A 1 × 1 board has exactly one loop, so a 3 is impossible (dead-end corners force lines).
    expect(solve(1, [3]).contradiction).toBe(true);
    expect(solve(1, [0]).contradiction).toBe(true);
    expect(solve(1, [3]).solved).toBe(false);
    // Without clues nothing can be deduced.
    expect(solve(1, [NO_CLUE])).toEqual({ edges: [UNKNOWN, UNKNOWN, UNKNOWN, UNKNOWN], solved: false, contradiction: false });
  });

  it('applies the cell rule', () => {
    const n = 3;
    // A 0 crosses all four sides.
    const zero = solve(n, [NO_CLUE, NO_CLUE, NO_CLUE, NO_CLUE, 0, NO_CLUE, NO_CLUE, NO_CLUE, NO_CLUE]).edges;
    for (const e of cellEdges(n, 1, 1)) expect(zero[e]).toBe(CROSS);
    // A 2 with two crossed sides draws the other two.
    const [top, bottom, left, right] = cellEdges(n, 1, 1);
    const start = withLines(n, []);
    start[top] = CROSS;
    start[left] = CROSS;
    const two = solve(n, [NO_CLUE, NO_CLUE, NO_CLUE, NO_CLUE, 2, NO_CLUE, NO_CLUE, NO_CLUE, NO_CLUE], start).edges;
    expect([two[bottom], two[right]]).toEqual([LINE, LINE]);
    // A met 1 crosses the rest.
    const one = solve(n, [NO_CLUE, NO_CLUE, NO_CLUE, NO_CLUE, 1, NO_CLUE, NO_CLUE, NO_CLUE, NO_CLUE], withLines(n, [top])).edges;
    expect([one[bottom], one[left], one[right]]).toEqual([CROSS, CROSS, CROSS]);
    // More lines than the clue: contradiction.
    expect(solve(n, [NO_CLUE, NO_CLUE, NO_CLUE, NO_CLUE, 1, NO_CLUE, NO_CLUE, NO_CLUE, NO_CLUE], withLines(n, [top, bottom])).contradiction).toBe(true);
  });

  it('applies the dot rule', () => {
    const n = 3;
    const none = new Array<number>(9).fill(NO_CLUE);
    // A line into a corner dot of the board must turn.
    const turn = solve(n, none, withLines(n, [hEdge(n, 0, 0)])).edges;
    expect(turn[vEdge(n, 0, 0)]).toBe(LINE);
    // Two lines at a dot cross the others.
    const straight = solve(n, none, withLines(n, [hEdge(n, 1, 0), hEdge(n, 1, 1)])).edges;
    expect([straight[vEdge(n, 0, 1)], straight[vEdge(n, 1, 1)]]).toEqual([CROSS, CROSS]);
    // A dot with one open edge and no line crosses it.
    const start = withLines(n, []);
    start[hEdge(n, 0, 0)] = CROSS;
    expect(solve(n, none, start).edges[vEdge(n, 0, 0)]).toBe(CROSS);
    // Three lines at a dot: contradiction.
    expect(solve(n, none, withLines(n, [hEdge(n, 1, 0), hEdge(n, 1, 1), vEdge(n, 0, 1)])).contradiction).toBe(true);
    // A dead end: contradiction.
    const dead = withLines(n, [hEdge(n, 1, 0)]);
    dead[hEdge(n, 1, 1)] = CROSS;
    dead[vEdge(n, 0, 1)] = CROSS;
    dead[vEdge(n, 1, 1)] = CROSS;
    expect(solve(n, none, dead).contradiction).toBe(true);
  });

  it('applies corner rules for 1 and 3', () => {
    const n = 3;
    const at = (k: number, cell: number) => {
      const clues = new Array<number>(9).fill(NO_CLUE);
      clues[cell] = k;
      return clues;
    };
    const [top, , left] = cellEdges(n, 0, 0);
    // A 3 in the board corner draws both border sides; a 1 crosses them.
    const three = solve(n, at(3, 0)).edges;
    expect([three[top], three[left]]).toEqual([LINE, LINE]);
    const one = solve(n, at(1, 0)).edges;
    expect([one[top], one[left]]).toEqual([CROSS, CROSS]);
    // A line entering a corner of a 3 from outside: the two far sides are lines.
    const [t, b, l, r] = cellEdges(n, 1, 1);
    const enter = solve(n, at(3, 4), withLines(n, [vEdge(n, 0, 1)])).edges;
    expect([enter[b], enter[r]]).toEqual([LINE, LINE]);
    expect(enter[hEdge(n, 1, 0)]).toBe(CROSS);
    expect([enter[t], enter[l]]).toEqual([UNKNOWN, UNKNOWN]);
    // A line entering a corner of a 1 whose other outside edge is crossed: far sides crossed.
    const start = withLines(n, [vEdge(n, 0, 1)]);
    start[hEdge(n, 1, 0)] = CROSS;
    const enterOne = solve(n, at(1, 4), start).edges;
    expect([enterOne[b], enterOne[r]]).toEqual([CROSS, CROSS]);
    // A 2 whose far sides hold exactly one line: the corner dot gets exactly one more line.
    const half = withLines(n, [b]);
    half[r] = CROSS;
    half[hEdge(n, 1, 0)] = CROSS;
    const two = solve(n, at(2, 4), half).edges;
    expect(two[vEdge(n, 0, 1)]).toBe(LINE);
  });

  it('never closes a loop early', () => {
    const n = 3;
    const none = new Array<number>(9).fill(NO_CLUE);
    // Three sides of the centre cell plus a stray line elsewhere: the fourth side is crossed.
    const [t, b, l, r] = cellEdges(n, 1, 1);
    const early = solve(n, none, withLines(n, [t, l, b, hEdge(n, 3, 2)])).edges;
    expect(early[r]).toBe(CROSS);
    // Closing would leave a clue unmet: crossed as well.
    const clues = [...none];
    clues[8] = 1;
    expect(solve(n, clues, withLines(n, [t, l, b])).edges[r]).toBe(CROSS);
    // Closing that meets every clue stays open (it might be the answer).
    expect(solve(n, none, withLines(n, [t, l, b])).edges[r]).toBe(UNKNOWN);
    // A closed loop crosses every other edge and is the solution.
    const closed = solve(n, none, withLines(n, [t, l, b, r]));
    expect(closed.solved).toBe(true);
    expect(closed.edges.filter((m) => m === CROSS)).toHaveLength(edgeCount(n) - 4);
    // A closed loop next to other lines: contradiction.
    expect(solve(n, none, withLines(n, [t, l, b, r, hEdge(n, 3, 0)])).contradiction).toBe(true);
  });

  it('is sound: never contradicts a real solution', () => {
    const arb = fc.tuple(fc.integer({ min: 2, max: 6 }), fc.integer({ min: 0, max: 0xffff_ffff }), fc.integer({ min: 0, max: 100 }));
    fc.assert(
      fc.property(arb, ([n, seed, keep]) => {
        const rng = createRng(seed);
        const solution = boundaryOf(n, growRegion(rng, n, rng.int(1, n * n - 1)));
        expect(isLoop(n, solution)).toBe(true);
        const clues = cluesOf(n, solution).map((k) => (rng.int(0, 99) < keep ? k : NO_CLUE));
        const result = solve(n, clues);
        expect(result.contradiction).toBe(false);
        result.edges.forEach((m, e) => {
          if (m !== UNKNOWN) expect(m).toBe(solution[e]);
        });
        if (result.solved) expect(result.edges).toEqual(solution);
      }),
      { numRuns: 200 }
    );
  });

  it('detects impossible clue sets', () => {
    expect(solve(2, [4, 4, 4, 4]).contradiction).toBe(true);
    expect(isLogicSolvable(2, [4, 4, 4, 4])).toBe(false);
    expect(isLogicSolvable(2, [4, NO_CLUE, NO_CLUE, NO_CLUE])).toBe(true);
    expect(solve(2, [4, NO_CLUE, NO_CLUE, NO_CLUE]).edges.filter((m) => m === LINE)).toHaveLength(4);
    expect(isLogicSolvable(2, [NO_CLUE, NO_CLUE, NO_CLUE, NO_CLUE])).toBe(false);
  });
});

describe('generation', () => {
  it('derives well-mixed attempt seeds', () => {
    expect(attemptSeed(1, 0)).toBe(attemptSeed(1, 0));
    expect(attemptSeed(1, 0)).not.toBe(attemptSeed(1, 1));
    expect(attemptSeed(1, 1)).not.toBe(attemptSeed(2, 0));
    expect(attemptSeed(0, 1)).not.toBe(attemptSeed(1, 0));
    const seeds = new Set<number>();
    for (let s = 0; s < 50; s++) for (let a = 0; a < 4; a++) seeds.add(attemptSeed(s, a));
    expect(seeds.size).toBe(200);
    for (const v of seeds) expect(Number.isInteger(v) && v >= 0 && v <= 0xffff_ffff).toBe(true);
  });

  it('grows regions whose boundary is one loop', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 8 }), fc.integer({ min: 0, max: 0xffff_ffff }), (n, seed) => {
        const target = Math.max(1, Math.floor((n * n) / 2));
        const inside = growRegion(createRng(seed), n, target);
        const size = inside.filter(Boolean).length;
        expect(size).toBeGreaterThanOrEqual(1);
        expect(size).toBeLessThanOrEqual(target);
        expect(isLoop(n, boundaryOf(n, inside))).toBe(true);
        expect(growRegion(createRng(seed), n, target)).toEqual(inside);
      }),
      { numRuns: 100 }
    );
    // Reaches its target when there is room.
    expect(growRegion(createRng(3), 6, 10).filter(Boolean)).toHaveLength(10);
    expect(growRegion(createRng(3), 4, 1).filter(Boolean)).toHaveLength(1);
  });

  it('thins clues only while the solver still solves, keeping the minimum', () => {
    const full = cluesOf(SQUARE_N, squareSolution());
    expect(thinClues(createRng(1), SQUARE_N, full, 9)).toEqual(full);
    const thin = thinClues(createRng(1), SQUARE_N, full, 0);
    expect(isLogicSolvable(SQUARE_N, thin)).toBe(true);
    expect(clueTotal({ clues: thin })).toBeLessThan(9);
    // Minimal: removing any remaining clue breaks the logic solve.
    thin.forEach((k, i) => {
      if (k === NO_CLUE) return;
      const fewer = [...thin];
      fewer[i] = NO_CLUE;
      expect(isLogicSolvable(SQUARE_N, fewer)).toBe(false);
    });
    expect(clueTotal({ clues: thinClues(createRng(1), SQUARE_N, full, 5) })).toBe(5);
  });

  it(
    'produces deterministic, valid puzzles of the right size and clue density',
    () => {
      for (const difficulty of DIFFICULTIES) {
        const n = SIZES[difficulty];
        for (const seed of [1, 99, 0xdeadbeef]) {
          const g = generatePuzzle(seed, difficulty);
          expect(generatePuzzle(seed, difficulty)).toEqual(g);
          expect(g.size).toBe(n);
          expect(g.attempt).toBeGreaterThanOrEqual(0);
          expect(g.clues).toHaveLength(n * n);
          expect(g.solution).toHaveLength(edgeCount(n));
          expect(isSolution(n, g.clues, g.solution)).toBe(true);
          const result = solve(n, g.clues);
          expect(result.solved).toBe(true);
          expect(result.edges).toEqual(g.solution);
          const count = clueTotal(g);
          expect(count).toBeGreaterThanOrEqual(Math.ceil(n * n * MIN_CLUE_SHARE[difficulty]));
          expect(count).toBeLessThan(n * n);
          const found = candidate(attemptSeed(seed, g.attempt), difficulty);
          expect(found).toEqual({ size: g.size, clues: g.clues, solution: g.solution });
        }
      }
      expect(generatePuzzle(1, 'easy')).not.toEqual(generatePuzzle(2, 'easy'));
    },
    SLOW
  );

  it(
    'leaves hard puzzles minimal for the solver',
    () => {
      const g = generatePuzzle(7, 'hard');
      g.clues.forEach((k, i) => {
        if (k === NO_CLUE) return;
        const fewer = [...g.clues];
        fewer[i] = NO_CLUE;
        expect(isLogicSolvable(g.size, fewer)).toBe(false);
      });
    },
    SLOW
  );

  it(
    'generates puzzles with exactly one solution according to the oracle',
    () => {
      const runs: [Difficulty, number][] = [['easy', 40], ['medium', 20], ['hard', 10]];
      for (const [difficulty, count] of runs) {
        for (let seed = 1; seed <= count; seed++) {
          const g = generatePuzzle(seed * 7919, difficulty);
          expect(countSolutions(g.size, g.clues), `${difficulty} seed ${seed * 7919}`).toBe(1);
          expect(oracleIsSolution(g.size, g.clues, lineKeys(g.size, g.solution))).toBe(true);
        }
      }
    },
    SLOW
  );

  it('has a valid, unique fallback', () => {
    for (const difficulty of DIFFICULTIES) {
      const fb = fallbackPuzzle(difficulty);
      expect(fb.size).toBe(SIZES[difficulty]);
      expect(isSolution(fb.size, fb.clues, fb.solution)).toBe(true);
      expect(solve(fb.size, fb.clues).solved).toBe(true);
      expect(countSolutions(fb.size, fb.clues)).toBe(1);
      expect(generatePuzzle(5, difficulty, 0)).toEqual({ ...fb, attempt: -1 });
    }
  });

  it(
    'generates fast enough for phones',
    () => {
      const start = performance.now();
      for (let seed = 100; seed < 104; seed++) generatePuzzle(seed, 'hard');
      expect((performance.now() - start) / 4).toBeLessThan(1500);
    },
    SLOW
  );

  it('oracle counts several solutions when clues are missing', () => {
    expect(countSolutions(2, [NO_CLUE, NO_CLUE, NO_CLUE, NO_CLUE])).toBe(2);
    // 2 × 2 board: 4 single cells, 4 dominoes, 4 L-trominoes and the full square.
    expect(countSolutions(2, [NO_CLUE, NO_CLUE, NO_CLUE, NO_CLUE], 50)).toBe(13);
    expect(countSolutions(2, [2, 2, 2, 2], 50)).toBe(1);
    expect(countSolutions(3, new Array<number>(9).fill(NO_CLUE), 1000)).toBeGreaterThan(13);
    expect(countSolutions(1, [3])).toBe(0);
    expect(countSolutions(1, [4])).toBe(1);
  });
});

describe('game state', () => {
  it('creates an empty board for a seed and difficulty', () => {
    const s = createInitialState(-1, 'medium');
    expect(s.seed).toBe(0xffff_ffff);
    expect(s.difficulty).toBe('medium');
    expect(s.size).toBe(7);
    expect(s.edges).toEqual(new Array<number>(edgeCount(7)).fill(UNKNOWN));
    expect(s).toMatchObject({ history: [], moves: 0, checks: 0, lastCheck: null });
    expect(createInitialState(4).difficulty).toBe('easy');
    expect(createInitialState(4).size).toBe(5);
    expect(isSlitherlinkState(s)).toBe(true);
  });

  it('maps unknown difficulties to easy', () => {
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('extreme')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
  });

  it('cycles marks unknown → line → cross → unknown with history', () => {
    expect([0, 1, 2].map(nextMark)).toEqual([1, 2, 0]);
    let s = squareState();
    s = cycleEdge(s, 4);
    expect(s.edges[4]).toBe(LINE);
    s = cycleEdge(s, 4);
    expect(s.edges[4]).toBe(CROSS);
    s = cycleEdge(s, 4);
    expect(s.edges[4]).toBe(UNKNOWN);
    expect(s.moves).toBe(3);
    expect(s.history).toEqual([[4, UNKNOWN], [4, LINE], [4, CROSS]]);
  });

  it('sets and toggles marks, refusing no-ops and bad input', () => {
    const s = squareState();
    expect(setEdge(s, 0, UNKNOWN)).toBe(s);
    expect(setEdge(s, -1, LINE)).toBe(s);
    expect(setEdge(s, edgeCount(SQUARE_N), LINE)).toBe(s);
    expect(setEdge(s, 1.5, LINE)).toBe(s);
    expect(setEdge(s, 0, 3)).toBe(s);
    expect(setEdge(s, 0, -1)).toBe(s);
    const crossed = toggleCross(s, 2);
    expect(crossed.edges[2]).toBe(CROSS);
    expect(toggleCross(crossed, 2).edges[2]).toBe(UNKNOWN);
    expect(toggleCross(setEdge(s, 2, LINE), 2).edges[2]).toBe(CROSS);
    const checked = check(s);
    expect(setEdge(checked, 0, LINE).lastCheck).toBeNull();
  });

  it('keeps at most MAX_HISTORY undo entries', () => {
    let s = squareState();
    for (let i = 0; i < MAX_HISTORY + 5; i++) s = cycleEdge(s, 20);
    expect(s.history).toHaveLength(MAX_HISTORY);
    expect(s.moves).toBe(MAX_HISTORY + 5);
    expect(s.history[0]).toEqual([20, (5 % 3) as number]);
  });

  it('undoes the latest change', () => {
    const s0 = squareState();
    expect(canUndo(s0)).toBe(false);
    expect(undo(s0)).toBe(s0);
    const s1 = setEdge(s0, 3, LINE);
    const s2 = setEdge(s1, 3, CROSS);
    expect(canUndo(s2)).toBe(true);
    const u = undo(s2);
    expect(u.edges).toEqual(s1.edges);
    expect(u.history).toEqual(s1.history);
    expect(u.moves).toBe(2);
    expect(undo(check(s2)).lastCheck).toBeNull();
    expect(undo(undo(s2)).edges).toEqual(s0.edges);
  });

  it('finishes when the lines form the loop, then locks the board', () => {
    let s = squareState();
    const solution = squareSolution();
    solution.forEach((m, e) => {
      if (m === LINE) s = setEdge(s, e, LINE);
    });
    expect(isSolved(s)).toBe(true);
    expect(setEdge(s, 20, CROSS)).toBe(s);
    expect(canUndo(s)).toBe(false);
    expect(undo(s)).toBe(s);
    expect(check(s)).toBe(s);
    // One line short is not solved.
    const short = squareState();
    short.edges = solution.map((m, e) => (m === LINE && e !== 0 ? LINE : UNKNOWN));
    expect(isSolved(short)).toBe(false);
  });

  it('reports clue status with ✓-ready states', () => {
    const s = squareState([0, 1, 2, 3, NO_CLUE, NO_CLUE, NO_CLUE, NO_CLUE, NO_CLUE]);
    expect(clueStatuses(s)).toEqual(['done', 'open', 'open', 'open', 'none', 'none', 'none', 'none', 'none']);
    expect(satisfiedCount(s)).toBe(1);
    expect(clueTotal(s)).toBe(4);
    const [t1, b1] = cellEdges(SQUARE_N, 0, 1);
    s.edges[t1] = LINE;
    s.edges[b1] = LINE;
    expect(clueStatuses(s)[1]).toBe('over');
    s.edges[b1] = CROSS;
    expect(clueStatuses(s)[1]).toBe('done');
    // Cell 2 needs 2 lines; three crosses make it impossible.
    const [t2, b2, l2] = cellEdges(SQUARE_N, 0, 2);
    s.edges[t2] = CROSS;
    s.edges[b2] = CROSS;
    expect(clueStatuses(s)[2]).toBe('open');
    s.edges[l2] = CROSS;
    expect(clueStatuses(s)[2]).toBe('over');
    // The 0 is over once a side is drawn.
    s.edges[cellEdges(SQUARE_N, 0, 0)[0]] = LINE;
    expect(clueStatuses(s)[0]).toBe('over');
    expect(satisfiedCount(s)).toBe(1);
  });

  it('counts wrong marks without revealing them', () => {
    const s = squareState();
    const solution = squareSolution();
    const lineEdge = solution.indexOf(LINE);
    const crossEdge = solution.indexOf(CROSS);
    let t = setEdge(s, lineEdge, LINE);
    expect(wrongMarks(t)).toBe(0);
    t = setEdge(t, crossEdge, LINE);
    expect(wrongMarks(t)).toBe(1);
    t = setEdge(t, solution.lastIndexOf(LINE), CROSS);
    expect(wrongMarks(t)).toBe(2);
    t = setEdge(t, solution.lastIndexOf(CROSS), CROSS);
    expect(wrongMarks(t)).toBe(2);
    const c = check(t);
    expect(c.checks).toBe(1);
    expect(c.lastCheck).toBe(2);
    expect(c.moves).toBe(t.moves);
    expect(check(c).checks).toBe(2);
  });
});

describe('save validation', () => {
  it('accepts real states and rejects tampered ones', () => {
    const base = createInitialState(12, 'easy');
    const played = check(cycleEdge(cycleEdge(base, 0), 7));
    expect(isSlitherlinkState(base)).toBe(true);
    expect(isSlitherlinkState(played)).toBe(true);
    const bad = (patch: (s: SlitherlinkState & Record<string, unknown>) => void) => {
      const s = clone(played) as SlitherlinkState & Record<string, unknown>;
      patch(s);
      return isSlitherlinkState(s);
    };
    expect(bad(() => undefined)).toBe(true);
    expect(bad((s) => (s.seed = -1))).toBe(false);
    expect(bad((s) => (s.seed = 2 ** 32))).toBe(false);
    expect(bad((s) => (s.difficulty = 'extreme' as Difficulty))).toBe(false);
    expect(bad((s) => (s.difficulty = 'medium'))).toBe(false);
    expect(bad((s) => (s.size = 6))).toBe(false);
    expect(bad((s) => s.clues.pop())).toBe(false);
    expect(bad((s) => (s.clues[0] = 5))).toBe(false);
    expect(bad((s) => (s.clues[0] = -2))).toBe(false);
    expect(bad((s) => (s.clues = s.clues.map(() => NO_CLUE)))).toBe(false);
    expect(bad((s) => (s.clues[s.clues.findIndex((k) => k !== NO_CLUE)] = 4))).toBe(false);
    expect(bad((s) => s.solution.pop())).toBe(false);
    expect(bad((s) => (s.solution[0] = UNKNOWN))).toBe(false);
    expect(bad((s) => (s.solution = s.solution.map(() => CROSS)))).toBe(false);
    expect(bad((s) => s.edges.pop())).toBe(false);
    expect(bad((s) => (s.edges[0] = 3))).toBe(false);
    expect(bad((s) => (s.edges[0] = 0.5))).toBe(false);
    expect(bad((s) => (s.history = 'x' as never))).toBe(false);
    expect(bad((s) => s.history.push([0] as never))).toBe(false);
    expect(bad((s) => s.history.push([edgeCount(5), 0]))).toBe(false);
    expect(bad((s) => s.history.push([0, 3]))).toBe(false);
    expect(bad((s) => s.history.push([-1, 0]))).toBe(false);
    expect(bad((s) => (s.history = Array.from({ length: MAX_HISTORY + 1 }, () => [0, 0] as [number, number])))).toBe(false);
    expect(bad((s) => (s.moves = 1))).toBe(false);
    expect(bad((s) => (s.moves = MAX_COUNTER + 1))).toBe(false);
    expect(bad((s) => (s.checks = -1))).toBe(false);
    expect(bad((s) => (s.lastCheck = -1))).toBe(false);
    expect(bad((s) => (s.lastCheck = edgeCount(5) + 1))).toBe(false);
    expect(bad((s) => (s.lastCheck = null))).toBe(true);
    expect(bad((s) => (s.lastCheck = edgeCount(5)))).toBe(true);
    expect(bad((s) => (s.moves = MAX_COUNTER))).toBe(true);
    expect(isSlitherlinkState(null)).toBe(false);
    expect(isSlitherlinkState([])).toBe(false);
    expect(isSlitherlinkState({})).toBe(false);
  });

  it('rejects a valid loop whose clues allow another answer', () => {
    // The easy board with every clue but one removed: the loop still fits, but is not unique.
    const base = createInitialState(3, 'easy');
    const ambiguous = clone(base);
    ambiguous.clues = ambiguous.clues.map((k, i) => (i === ambiguous.clues.findIndex((v) => v !== NO_CLUE) ? k : NO_CLUE));
    expect(isSolution(5, ambiguous.clues, ambiguous.solution)).toBe(true);
    expect(isSlitherlinkState(ambiguous)).toBe(false);
  });

  it('never throws on arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => isSlitherlinkState(value)).not.toThrow();
      }),
      { numRuns: 300 }
    );
  });
});
