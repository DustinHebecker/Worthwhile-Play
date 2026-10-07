import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import {
  BOARDS,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  FLAGGED,
  HIDDEN,
  MAX_ATTEMPTS,
  MAX_COMPONENT,
  MAX_COUNTER,
  REVEALED,
  adjacentCounts,
  canAct,
  chord,
  countAt,
  createInitialState,
  deriveSeed,
  enumerateRule,
  flagCount,
  floodCells,
  generateMines,
  isMinesState,
  isOver,
  isWon,
  mineMap,
  neighbours,
  pairRule,
  randomLayout,
  reveal,
  revealedCount,
  safeCellsLeft,
  setMode,
  showBoard,
  singleRule,
  solve,
  tap,
  toDifficulty,
  toggleFlag,
  undoReveal,
  type Difficulty,
  type MinesState,
  type SolverRule
} from '../src/rules';
import { forcedCells, numbersOf, oracleCount, oracleFlood, oracleNeighbours, oracleSolvable } from './oracle';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const sorted = (values: Iterable<number>) => [...values].sort((a, b) => a - b);

/** A small board: dimensions, a first click and a layout that keeps the opening mine-free. */
const smallBoard = fc
  .record({ rows: fc.integer({ min: 4, max: 5 }), cols: fc.integer({ min: 4, max: 5 }) })
  .chain(({ rows, cols }) =>
    fc.integer({ min: 0, max: rows * cols - 1 }).chain((first) => {
      const banned = new Set([first, ...oracleNeighbours(rows, cols, first)]);
      const candidates = [...Array(rows * cols).keys()].filter((i) => !banned.has(i));
      return fc
        .shuffledSubarray(candidates, { minLength: 1, maxLength: Math.min(5, candidates.length) })
        .map((mines) => ({ rows, cols, first, mines: sorted(mines) }));
    })
  );

/** Any layout on a small board (the first click may be anything). */
const anyLayout = fc
  .record({ rows: fc.integer({ min: 1, max: 7 }), cols: fc.integer({ min: 1, max: 7 }) })
  .chain(({ rows, cols }) =>
    fc.record({
      rows: fc.constant(rows),
      cols: fc.constant(cols),
      mines: fc.subarray([...Array(rows * cols).keys()]),
      start: fc.integer({ min: 0, max: rows * cols - 1 })
    })
  );

function started(seed: number, difficulty: Difficulty = 'easy', first = 0): MinesState {
  return reveal(createInitialState(seed, difficulty), first);
}

/** Reveals every remaining safe cell in index order. */
function clearBoard(state: MinesState): MinesState {
  let s = state;
  const mines = s.mines as number[];
  for (let i = 0; i < s.marks.length; i++) if (!mines.includes(i) && s.marks[i] !== REVEALED) s = reveal(s.marks[i] === FLAGGED ? toggleFlag(s, i) : s, i);
  return s;
}

const hiddenSafe = (s: MinesState) => s.marks.findIndex((m, i) => m === HIDDEN && !(s.mines as number[]).includes(i));
const hiddenMine = (s: MinesState) => (s.mines as number[]).find((m) => s.marks[m] === HIDDEN) as number;

describe('geometry', () => {
  it('lists neighbours of corners, edges and interior cells in ascending order', () => {
    expect(neighbours(3, 3, 0)).toEqual([1, 3, 4]);
    expect(neighbours(3, 3, 8)).toEqual([4, 5, 7]);
    expect(neighbours(3, 3, 1)).toEqual([0, 2, 3, 4, 5]);
    expect(neighbours(3, 3, 4)).toEqual([0, 1, 2, 3, 5, 6, 7, 8]);
    expect(neighbours(2, 4, 3)).toEqual([2, 6, 7]);
    expect(neighbours(1, 1, 0)).toEqual([]);
    expect(neighbours(1, 3, 1)).toEqual([0, 2]);
    expect(neighbours(3, 1, 1)).toEqual([0, 2]);
  });

  it('matches the oracle and is symmetric', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 9 }), fc.integer({ min: 1, max: 9 }), (rows, cols) => {
        for (let i = 0; i < rows * cols; i++) {
          const list = neighbours(rows, cols, i);
          expect(list).toEqual(oracleNeighbours(rows, cols, i));
          for (const n of list) expect(neighbours(rows, cols, n)).toContain(i);
        }
      })
    );
  });

  it('builds mine maps', () => {
    expect(mineMap(4, [1, 3])).toEqual([false, true, false, true]);
    expect(mineMap(2, [])).toEqual([false, false]);
  });

  it('counts adjacent mines exactly like the oracle', () => {
    expect(adjacentCounts(3, 3, [4])).toEqual([1, 1, 1, 1, 0, 1, 1, 1, 1]);
    expect(adjacentCounts(2, 3, [0, 5])).toEqual([0, 2, 1, 1, 2, 0]);
    fc.assert(
      fc.property(anyLayout, ({ rows, cols, mines }) => {
        const set = new Set(mines);
        expect(adjacentCounts(rows, cols, mines)).toEqual([...Array(rows * cols).keys()].map((i) => oracleCount(rows, cols, set, i)));
      })
    );
  });
});

describe('flood fill', () => {
  it('opens a single numbered cell, or a whole zero region with its border', () => {
    // 1×4 strip with a mine at the end: counts [0, 0, 1, 0(mine)].
    const counts = adjacentCounts(1, 4, [3]);
    expect(floodCells(1, 4, counts, 2)).toEqual([2]);
    expect(floodCells(1, 4, counts, 0)).toEqual([0, 1, 2]);
    expect(floodCells(1, 4, counts, 0, (i) => i === 1)).toEqual([0]);
    expect(floodCells(3, 3, adjacentCounts(3, 3, []), 4)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('equals the oracle flood and never opens a mine from a safe start', () => {
    fc.assert(
      fc.property(anyLayout, ({ rows, cols, mines, start }) => {
        fc.pre(!mines.includes(start));
        const counts = adjacentCounts(rows, cols, mines);
        const opened = floodCells(rows, cols, counts, start);
        expect(opened).toEqual(sorted(oracleFlood(rows, cols, new Set(mines), start)));
        expect(opened).toContain(start);
        for (const cell of opened) {
          expect(mines).not.toContain(cell);
          // Every zero cell's neighbours are all opened.
          if (counts[cell] === 0) for (const n of neighbours(rows, cols, cell)) expect(opened).toContain(n);
          // Every other opened cell was reached from an opened zero cell.
          if (cell !== start) expect(neighbours(rows, cols, cell).some((n) => opened.includes(n) && counts[n] === 0)).toBe(true);
        }
      })
    );
  });
});

describe('layout generation', () => {
  it('derives distinct deterministic seeds per game seed, first cell and attempt', () => {
    expect(deriveSeed(1, 2, 3)).toBe(deriveSeed(1, 2, 3));
    const all = new Set([deriveSeed(1, 2, 3), deriveSeed(2, 2, 3), deriveSeed(1, 3, 3), deriveSeed(1, 2, 4), deriveSeed(1, 2, 0)]);
    expect(all.size).toBe(5);
    expect(deriveSeed(-1, 0, 0)).toBe(deriveSeed(0xffffffff, 0, 0));
  });

  it('draws sorted, unique layouts of the right size that keep the opening free', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.integer({ min: 0, max: 63 }), (seed, first) => {
        const mines = randomLayout(8, 8, 10, first, createRng(seed));
        expect(mines).toHaveLength(10);
        expect(mines).toEqual(sorted(new Set(mines)));
        expect(mines.every((m) => m >= 0 && m < 64)).toBe(true);
        for (const c of [first, ...neighbours(8, 8, first)]) expect(mines).not.toContain(c);
        expect(randomLayout(8, 8, 10, first, createRng(seed))).toEqual(mines);
      })
    );
  });

  it('can place mines on every cell outside the opening', () => {
    const seen = new Set<number>();
    for (let seed = 0; seed < 200; seed++) for (const m of randomLayout(4, 4, 7, 0, createRng(seed))) seen.add(m);
    expect(sorted(seen)).toEqual([2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  });

  describe('no-guess boards', { timeout: 120_000 }, () => {
    it('is solvable by logic alone from the first click for many seeds, clicks and difficulties', () => {
      for (const difficulty of DIFFICULTIES) {
        const { rows, cols, mines: count } = BOARDS[difficulty];
        for (let seed = 1; seed <= 40; seed++) {
          const first = (seed * 37 + 11) % (rows * cols);
          const generated = generateMines(rows, cols, count, first, seed);
          expect(generated.solvable).toBe(true);
          expect(generated.mines).toHaveLength(count);
          expect(generated.mines).toEqual(randomLayout(rows, cols, count, first, createRng(deriveSeed(seed, first, generated.attempt))));
          expect(solve(rows, cols, generated.mines, first).solved).toBe(true);
          for (const c of [first, ...neighbours(rows, cols, first)]) expect(generated.mines).not.toContain(c);
        }
      }
    });

    it('generates corner and edge openings too', () => {
      const { rows, cols, mines } = BOARDS.hard;
      for (const first of [0, cols - 1, rows * cols - 1, (rows - 1) * cols, 4, 7 * cols]) {
        expect(generateMines(rows, cols, mines, first, 99).solvable).toBe(true);
      }
    });

    it('is deterministic and depends on the first click', () => {
      const a = generateMines(10, 10, 18, 44, 1234);
      expect(generateMines(10, 10, 18, 44, 1234)).toEqual(a);
      expect(generateMines(10, 10, 18, 45, 1234).mines).not.toEqual(a.mines);
      expect(generateMines(10, 10, 18, 44, 1235).mines).not.toEqual(a.mines);
    });

    it('generates quickly enough for phones', () => {
      const start = performance.now();
      for (let seed = 0; seed < 20; seed++) generateMines(15, 10, 30, 75, seed);
      // Generous bound (slow CI, mutation runs): typical is a few milliseconds per board.
      expect((performance.now() - start) / 20).toBeLessThan(300);
    });

    it('falls back to the layout the solver got furthest with when no attempt is solvable', () => {
      // 1×7 strip with two mines, opening at 0: the first mine is forced, the second one is a
      // guess unless it sits at the very end. The solver gets as far as the first mine.
      const layoutsFor = (seed: number) => [0, 1, 2, 3, 4, 5].map((k) => randomLayout(1, 7, 2, 0, createRng(deriveSeed(seed, 0, k))));
      const resultsFor = (seed: number) => layoutsFor(seed).map((mines) => solve(1, 7, mines, 0));
      // Pick a seed with no solvable attempt whose best attempt is not the first one.
      const seed = [...Array(200).keys()].find((k) => {
        const results = resultsFor(k);
        return results.every((r) => !r.solved) && (results[0] as { revealedCount: number }).revealedCount < Math.max(...results.map((r) => r.revealedCount));
      }) as number;
      expect(seed).toBeDefined();
      const reached = resultsFor(seed).map((r) => r.revealedCount);
      const best = reached.indexOf(Math.max(...reached));
      expect(generateMines(1, 7, 2, 0, seed, 6)).toEqual({ mines: layoutsFor(seed)[best], attempt: best, solvable: false });
      // With zero attempts the first derived layout is returned.
      expect(generateMines(4, 4, 3, 0, 8, 0)).toEqual({ mines: randomLayout(4, 4, 3, 0, createRng(deriveSeed(8, 0, 0))), attempt: 0, solvable: false });
    });
  });
});

describe('solver rules', () => {
  it('single-cell rule finds all-safe and all-mine numbers', () => {
    const [safe, mines] = singleRule([
      { cells: [1, 2], need: 0 },
      { cells: [3, 4], need: 2 },
      { cells: [5, 6], need: 1 }
    ]);
    expect(sorted(safe)).toEqual([1, 2]);
    expect(sorted(mines)).toEqual([3, 4]);
  });

  it('pair rule handles subsets and the 1-2 pattern', () => {
    // Subset: {1,2} has one mine, so does {1,2,3}: cell 3 is safe.
    let [safe, mines] = pairRule([
      { cells: [1, 2], need: 1 },
      { cells: [1, 2, 3], need: 1 }
    ]);
    expect(sorted(safe)).toEqual([3]);
    expect(sorted(mines)).toEqual([]);
    // 1-2 pattern: {1,2,3} needs 2, {2,3,4} needs 1 → 1 is a mine, 4 is safe.
    [safe, mines] = pairRule([
      { cells: [1, 2, 3], need: 2 },
      { cells: [2, 3, 4], need: 1 }
    ]);
    expect(sorted(safe)).toEqual([4]);
    expect(sorted(mines)).toEqual([1]);
    // Subset with more mines in the superset: {2,3} has 1, {1,2,3} has 2 → 1 is a mine.
    [safe, mines] = pairRule([
      { cells: [2, 3], need: 1 },
      { cells: [1, 2, 3], need: 2 }
    ]);
    expect(sorted(safe)).toEqual([]);
    expect(sorted(mines)).toEqual([1]);
    // No conclusion from undetermined overlaps or disjoint numbers.
    [safe, mines] = pairRule([
      { cells: [1, 2], need: 1 },
      { cells: [2, 3], need: 1 },
      { cells: [7, 8], need: 1 }
    ]);
    expect(safe.size + mines.size).toBe(0);
  });

  it('enumeration combines frontier components with the remaining mine total', () => {
    const frontier = [{ cells: [1, 2], need: 1 }];
    let [safe, mines] = enumerateRule(frontier, [1, 2, 5, 6], 1);
    expect(sorted(safe)).toEqual([5, 6]);
    expect(sorted(mines)).toEqual([]);
    [safe, mines] = enumerateRule(frontier, [1, 2, 5, 6], 3);
    expect(sorted(safe)).toEqual([]);
    expect(sorted(mines)).toEqual([5, 6]);
    [safe, mines] = enumerateRule(frontier, [1, 2, 5, 6], 2);
    expect(safe.size + mines.size).toBe(0);
    // A pure 50/50 stays undecided.
    [safe, mines] = enumerateRule(frontier, [1, 2], 1);
    expect(safe.size + mines.size).toBe(0);
    // No frontier at all: only the count decides.
    [safe, mines] = enumerateRule([], [3, 4], 0);
    expect(sorted(safe)).toEqual([3, 4]);
    [safe, mines] = enumerateRule([], [3, 4], 2);
    expect(sorted(mines)).toEqual([3, 4]);
    [safe, mines] = enumerateRule([], [3, 4], 1);
    expect(safe.size + mines.size).toBe(0);
  });

  it('enumeration uses the mine total across two components', () => {
    // Two independent 50/50 pairs plus two interior cells and 2 mines left: interior is safe.
    const cons = [
      { cells: [1, 2], need: 1 },
      { cells: [7, 8], need: 1 }
    ];
    let [safe, mines] = enumerateRule(cons, [1, 2, 7, 8, 20, 21], 2);
    expect(sorted(safe)).toEqual([20, 21]);
    expect(mines.size).toBe(0);
    // Component {3,4,5} needs "at most" reasoning: {3,4} has 1, {4,5} has 1, only 1 mine left overall → 4 is the mine.
    [safe, mines] = enumerateRule(
      [
        { cells: [3, 4], need: 1 },
        { cells: [4, 5], need: 1 }
      ],
      [3, 4, 5, 9],
      1
    );
    expect(sorted(safe)).toEqual([3, 5, 9]);
    expect(sorted(mines)).toEqual([4]);
    // Same numbers with 2 mines left: either {4} + interior, or {3,5}. 9 undecided, nothing forced.
    [safe, mines] = enumerateRule(
      [
        { cells: [3, 4], need: 1 },
        { cells: [4, 5], need: 1 }
      ],
      [3, 4, 5, 9],
      2
    );
    expect(safe.size + mines.size).toBe(0);
  });

  it('enumeration skips oversized components soundly (weaker, never wrong)', () => {
    const cells = (n: number) => [...Array(n).keys()];
    // Within the size limit: the component holds exactly one mine, so the interior cell is safe.
    let [safe, mines] = enumerateRule([{ cells: cells(MAX_COMPONENT), need: 1 }], [...cells(MAX_COMPONENT), 100], 1);
    expect(sorted(safe)).toEqual([100]);
    expect(mines.size).toBe(0);
    // One cell more is not enumerated: anything from 0 to its size is assumed, so nothing follows.
    [safe, mines] = enumerateRule([{ cells: cells(MAX_COMPONENT + 1), need: 1 }], [...cells(MAX_COMPONENT + 1), 100], 1);
    expect(safe.size + mines.size).toBe(0);
    // A component whose search exceeds the node budget is treated the same way.
    [safe, mines] = enumerateRule([{ cells: cells(40), need: 20 }], [...cells(40), 100], 20);
    expect(safe.size + mines.size).toBe(0);
    // A small one next to a skipped one is still decided.
    [safe, mines] = enumerateRule(
      [
        { cells: cells(40), need: 20 },
        { cells: [60], need: 1 }
      ],
      [...cells(40), 60],
      21
    );
    expect(sorted(mines)).toEqual([60]);
    expect(safe.size).toBe(0);
  });

  it('enumeration deduces inside one component without global help', () => {
    // {1,2,3} needs 1, {3,4} needs 1, {4} alone needs 1 → 4 mine, 3 safe; 1/2 and the interior stay open.
    const [safe, mines] = enumerateRule(
      [
        { cells: [1, 2, 3], need: 1 },
        { cells: [3, 4], need: 1 },
        { cells: [4], need: 1 }
      ],
      [1, 2, 3, 4, 10, 11, 12],
      3
    );
    expect(sorted(mines)).toEqual([4]);
    expect(sorted(safe)).toEqual([3]);
  });
});

describe('solver', () => {
  it('clears an easy board in one flood and reports no steps', () => {
    // 3×5 with the only mine in the far corner: the opening floods everything else.
    const result = solve(3, 5, [14], 0, true);
    expect(result).toEqual({ solved: true, revealedCount: 14, steps: [] });
  });

  it('cannot solve a forced 50/50 and stops', () => {
    // 2×5, opening at the top-left, one mine at 4: cells 4 and 9 are indistinguishable.
    const result = solve(2, 5, [4], 0, true);
    expect(result.solved).toBe(false);
    expect(result.revealedCount).toBe(8);
    expect(result.steps).toEqual([]);
  });

  it('records the rule, the basis and the deductions of each step', () => {
    // 1×6 strip with a mine at 3: the opening shows 0,1,2 ("1" at 2) → 3 is a mine, then the total frees 4 and 5.
    const result = solve(1, 6, [3], 0, true);
    expect(result.solved).toBe(true);
    expect(result.revealedCount).toBe(5);
    expect(result.steps).toEqual([
      { rule: 'single', revealed: [0, 1, 2], safe: [], mines: [3] },
      { rule: 'enumerate', revealed: [0, 1, 2], safe: [4, 5], mines: [] }
    ]);
    expect(solve(1, 6, [3], 0).steps).toEqual([]);
  });

  it('reports a mine on the first click as unsolved', () => {
    expect(solve(2, 2, [0], 0).solved).toBe(false);
    expect(solve(2, 2, [0], 0).revealedCount).toBe(0);
  });

  it('only makes deductions that hold in every consistent layout (oracle) and solves exactly the oracle-solvable boards', { timeout: 120_000 }, () => {
    const rulesSeen = new Set<SolverRule>();
    fc.assert(
      fc.property(smallBoard, ({ rows, cols, first, mines }) => {
        const result = solve(rows, cols, mines, first, true);
        const mineSet = new Set(mines);
        const known = new Set<number>();
        for (const step of result.steps) {
          rulesSeen.add(step.rule);
          expect(step.safe.length + step.mines.length).toBeGreaterThan(0);
          const forced = forcedCells(rows, cols, mines.length, numbersOf(rows, cols, mineSet, step.revealed));
          for (const s of step.safe) expect(forced.safe.has(s), `safe ${s} at ${step.rule}`).toBe(true);
          for (const m of step.mines) expect(forced.mines.has(m), `mine ${m} at ${step.rule}`).toBe(true);
          if (step.rule === 'enumerate') {
            // The exact rule finds everything that is forced and not yet known.
            expect(step.safe).toEqual(sorted(forced.safe));
            expect(step.mines).toEqual(sorted([...forced.mines].filter((m) => !known.has(m))));
          }
          for (const m of step.mines) known.add(m);
        }
        expect(result.solved).toBe(oracleSolvable(rows, cols, mines, first));
      }),
      { numRuns: 250, seed: 20261007 }
    );
    expect(rulesSeen).toEqual(new Set(['single', 'pair', 'enumerate']));
  });

  it('agrees with the oracle on larger generated boards step by step', { timeout: 120_000 }, () => {
    for (let seed = 1; seed <= 12; seed++) {
      const g = generateMines(5, 6, 6, seed % 30, seed);
      const result = solve(5, 6, g.mines, seed % 30, true);
      expect(result.solved).toBe(g.solvable);
      for (const step of result.steps) {
        const forced = forcedCells(5, 6, 6, numbersOf(5, 6, new Set(g.mines), step.revealed));
        for (const s of step.safe) expect(forced.safe.has(s)).toBe(true);
        for (const m of step.mines) expect(forced.mines.has(m)).toBe(true);
      }
    }
  });
});

describe('game state', () => {
  it('starts empty with no layout', () => {
    const s = createInitialState(7, 'medium');
    expect(s).toEqual({
      seed: 7,
      difficulty: 'medium',
      rows: 10,
      cols: 10,
      mineCount: 18,
      first: null,
      attempt: null,
      mines: null,
      marks: new Array(100).fill(HIDDEN),
      exploded: null,
      shown: false,
      mode: 'reveal',
      moves: 0,
      undos: 0
    });
    expect(createInitialState(-1).seed).toBe(0xffffffff);
    expect(createInitialState(1).difficulty).toBe(DEFAULT_DIFFICULTY);
    expect(isMinesState(s)).toBe(true);
    expect(revealedCount(s)).toBe(0);
    expect(countAt(s, 5)).toBe(0);
    expect(isWon(s)).toBe(false);
    expect(canAct(s)).toBe(true);
  });

  it('maps difficulties and board sizes', () => {
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('nope')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
    for (const d of DIFFICULTIES) {
      const s = createInitialState(1, d);
      expect(s.marks).toHaveLength(BOARDS[d].rows * BOARDS[d].cols);
      // Cells stay ≥ 28 px on a 360 px phone (328 px content width).
      expect(BOARDS[d].cols).toBeLessThanOrEqual(10);
      expect(BOARDS[d].mines).toBeLessThan(BOARDS[d].rows * BOARDS[d].cols - 9);
    }
  });

  it('creates the layout on the first reveal and opens the opening', () => {
    const s = started(3, 'easy', 27);
    expect(s.first).toBe(27);
    expect(s.mines).toEqual(generateMines(8, 8, 10, 27, 3).mines);
    expect(s.attempt).toBe(generateMines(8, 8, 10, 27, 3).attempt);
    expect(s.moves).toBe(1);
    expect(s.marks[27]).toBe(REVEALED);
    for (const n of neighbours(8, 8, 27)) expect(s.marks[n]).toBe(REVEALED);
    expect(countAt(s, 27)).toBe(0);
    const expected = floodCells(8, 8, adjacentCounts(8, 8, s.mines as number[]), 27);
    expect(s.marks.flatMap((m, i) => (m === REVEALED ? [i] : []))).toEqual(expected);
    expect(revealedCount(s)).toBe(expected.length);
    expect(safeCellsLeft(s)).toBe(64 - 10 - expected.length);
    expect(isMinesState(s)).toBe(true);
  });

  it('never regenerates once the layout exists', () => {
    const s = started(3);
    const i = hiddenSafe(s);
    const next = reveal(s, i);
    expect(next.mines).toBe(s.mines);
    expect(next.first).toBe(s.first);
    expect(next.marks[i]).toBe(REVEALED);
    expect(next.moves).toBe(2);
  });

  it('ignores reveals on revealed, flagged or invalid cells', () => {
    const s = started(4);
    expect(reveal(s, 0)).toBe(s);
    expect(reveal(s, -1)).toBe(s);
    expect(reveal(s, 64)).toBe(s);
    expect(reveal(s, 1.5)).toBe(s);
    const i = hiddenSafe(s);
    const flagged = toggleFlag(s, i);
    expect(reveal(flagged, i)).toBe(flagged);
  });

  it('turns a revealed mine into a pending mistake that can be undone', () => {
    const s = started(5);
    const m = hiddenMine(s);
    const boom = reveal(s, m);
    expect(boom.exploded).toBe(m);
    expect(boom.marks).toEqual(s.marks);
    expect(boom.moves).toBe(s.moves + 1);
    expect(canAct(boom)).toBe(false);
    expect(isOver(boom)).toBe(false);
    expect(isMinesState(boom)).toBe(true);
    // Everything else is blocked until the mistake is resolved.
    expect(reveal(boom, hiddenSafe(boom))).toBe(boom);
    expect(toggleFlag(boom, hiddenSafe(boom))).toBe(boom);
    const back = undoReveal(boom);
    expect(back).toEqual({ ...boom, exploded: null, undos: 1 });
    expect(undoReveal(back)).toBe(back);
    expect(canAct(back)).toBe(true);
  });

  it('can show the whole board after a mistake, which ends the game', () => {
    const s = started(5);
    expect(showBoard(s)).toBe(s);
    const boom = reveal(s, hiddenMine(s));
    const shown = showBoard(boom);
    expect(shown.shown).toBe(true);
    expect(isOver(shown)).toBe(true);
    expect(isWon(shown)).toBe(false);
    expect(canAct(shown)).toBe(false);
    expect(showBoard(shown)).toBe(shown);
    expect(undoReveal(shown)).toBe(shown);
    expect(isMinesState(shown)).toBe(true);
  });

  it('toggles flags on covered cells only and counts them', () => {
    const s = started(6);
    const i = hiddenSafe(s);
    const f = toggleFlag(s, i);
    expect(f.marks[i]).toBe(FLAGGED);
    expect(flagCount(f)).toBe(1);
    expect(f.moves).toBe(s.moves + 1);
    const g = toggleFlag(f, i);
    expect(g.marks[i]).toBe(HIDDEN);
    expect(flagCount(g)).toBe(0);
    expect(toggleFlag(s, s.first as number)).toBe(s);
    expect(toggleFlag(s, 99)).toBe(s);
    // Flags may be placed before the layout exists; they do not influence it.
    const pre = toggleFlag(createInitialState(9), 5);
    expect(pre.marks[5]).toBe(FLAGGED);
    expect(isMinesState(pre)).toBe(true);
  });

  it('opening a zero region removes wrong flags inside it', () => {
    const pre = toggleFlag(createInitialState(9), 1);
    const s = reveal(pre, 0);
    expect(s.marks[1]).toBe(REVEALED);
    expect(s.mines).toEqual(generateMines(8, 8, 10, 0, 9).mines);
  });

  it('chords a satisfied number and refuses unsatisfied ones', () => {
    let s = started(11, 'medium', 55);
    const mines = s.mines as number[];
    // Find a revealed number with covered neighbours.
    const target = s.marks.findIndex((m, i) => m === REVEALED && countAt(s, i) > 0 && neighbours(10, 10, i).some((n) => s.marks[n] === HIDDEN && !mines.includes(n)));
    expect(target).toBeGreaterThanOrEqual(0);
    expect(chord(s, target)).toBe(s);
    const around = neighbours(10, 10, target);
    for (const n of around) if (mines.includes(n)) s = toggleFlag(s, n);
    const done = chord(s, target);
    expect(done.moves).toBe(s.moves + 1);
    for (const n of around) expect(done.marks[n]).toBe(mines.includes(n) ? FLAGGED : REVEALED);
    expect(tap(s, target)).toEqual(done);
    // Nothing left to open: no-op.
    expect(chord(done, target)).toBe(done);
    expect(chord(done, mines[0] as number)).toBe(done);
    expect(chord(createInitialState(1), 0)).toEqual(createInitialState(1));
  });

  it('a chord with a wrong flag opens nothing and records the mine it hit', () => {
    let s = started(11, 'medium', 55);
    const mines = s.mines as number[];
    const target = s.marks.findIndex(
      (m, i) => m === REVEALED && countAt(s, i) > 0 && neighbours(10, 10, i).filter((n) => s.marks[n] === HIDDEN && !mines.includes(n)).length >= 1
    );
    const around = neighbours(10, 10, target);
    const safeHidden = around.filter((n) => s.marks[n] === HIDDEN && !mines.includes(n));
    const mineHidden = around.filter((n) => mines.includes(n));
    // Flag one safe cell instead of one of the mines (same count, wrong place).
    s = toggleFlag(s, safeHidden[0] as number);
    for (const m of mineHidden.slice(1)) s = toggleFlag(s, m);
    const boom = chord(s, target);
    expect(boom.exploded).toBe(mineHidden[0]);
    expect(boom.marks).toEqual(s.marks);
    expect(isMinesState(boom)).toBe(true);
  });

  it('taps reveal or flag depending on the mode', () => {
    const s0 = createInitialState(12);
    const flagMode = setMode(s0, 'flag');
    expect(flagMode.mode).toBe('flag');
    expect(setMode(flagMode, 'flag')).toBe(flagMode);
    expect(setMode(s0, 'bogus' as never)).toBe(s0);
    expect(tap(flagMode, 3).marks[3]).toBe(FLAGGED);
    expect(tap(s0, 3)).toEqual(reveal(s0, 3));
  });

  it('is won once every safe cell is open; then nothing changes', () => {
    const s = clearBoard(started(13, 'easy', 9));
    expect(isWon(s)).toBe(true);
    expect(isOver(s)).toBe(true);
    expect(safeCellsLeft(s)).toBe(0);
    expect(canAct(s)).toBe(false);
    expect(reveal(s, (s.mines as number[])[0] as number)).toBe(s);
    expect(toggleFlag(s, (s.mines as number[])[0] as number)).toBe(s);
    expect(isMinesState(s)).toBe(true);
  });

  it('keeps invariants under random play', () => {
    const action = fc.record({ kind: fc.constantFrom('tap', 'reveal', 'flag', 'chord', 'undo', 'mode', 'show'), cell: fc.integer({ min: 0, max: 63 }) });
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), fc.array(action, { maxLength: 40 }), (seed, actions) => {
        let s = createInitialState(seed);
        for (const { kind, cell } of actions) {
          const before = s;
          if (kind === 'tap') s = tap(s, cell);
          else if (kind === 'reveal') s = reveal(s, cell);
          else if (kind === 'flag') s = toggleFlag(s, cell);
          else if (kind === 'chord') s = chord(s, cell);
          else if (kind === 'undo') s = undoReveal(s);
          else if (kind === 'mode') s = setMode(s, s.mode === 'reveal' ? 'flag' : 'reveal');
          else s = showBoard(s);
          expect(isMinesState(clone(s))).toBe(true);
          expect(s.moves).toBeGreaterThanOrEqual(before.moves);
          expect(s.undos).toBeGreaterThanOrEqual(before.undos);
          if (before.mines) expect(s.mines).toEqual(before.mines);
          if (s.mines) for (const m of s.mines) expect(s.marks[m]).not.toBe(REVEALED);
        }
      }),
      { numRuns: 60 }
    );
  });
});

describe('isMinesState', () => {
  const base = started(21, 'easy', 18);
  const boom = reveal(base, hiddenMine(base));
  const variants: [string, (s: Record<string, unknown>) => void, MinesState?][] = [
    ['seed', (s) => (s.seed = -1)],
    ['seed float', (s) => (s.seed = 1.5)],
    ['difficulty', (s) => (s.difficulty = 'insane')],
    ['rows', (s) => (s.rows = 9)],
    ['cols', (s) => (s.cols = 9)],
    ['mineCount', (s) => (s.mineCount = 11)],
    ['marks length', (s) => (s.marks = (s.marks as number[]).slice(1))],
    ['marks value', (s) => ((s.marks as number[])[5] = 3)],
    ['marks type', (s) => (s.marks = 'x')],
    ['marks sparse', (s) => (s.marks = new Array(64))],
    ['mode', (s) => (s.mode = 'dig')],
    ['shown type', (s) => (s.shown = 'yes')],
    ['moves', (s) => (s.moves = -1)],
    ['moves huge', (s) => (s.moves = MAX_COUNTER + 1)],
    ['undos', (s) => (s.undos = 0.5)],
    ['mines count', (s) => (s.mines = (s.mines as number[]).slice(1))],
    ['mines range', (s) => ((s.mines as number[])[9] = 64)],
    ['mines unsorted', (s) => (s.mines = [...(s.mines as number[])].reverse())],
    ['mines type', (s) => (s.mines = 'abc')],
    ['mines sparse', (s) => (s.mines = new Array(10))],
    ['first missing', (s) => (s.first = null)],
    ['first range', (s) => (s.first = 64)],
    ['attempt', (s) => (s.attempt = MAX_ATTEMPTS + 1)],
    ['attempt null', (s) => (s.attempt = null)],
    ['first covered', (s) => ((s.marks as number[])[s.first as number] = HIDDEN)],
    ['revealed mine', (s) => ((s.marks as number[])[(s.mines as number[])[0] as number] = REVEALED)],
    ['opening mine', (s) => {
      const first = s.first as number;
      const n = neighbours(8, 8, first)[0] as number;
      const mines = (s.mines as number[]).slice(1);
      mines.push(n);
      s.mines = sorted(mines);
    }],
    ['exploded safe cell', (s) => (s.exploded = s.first)],
    ['exploded range', (s) => (s.exploded = 70)],
    ['shown without mistake', (s) => (s.shown = true)],
    ['exploded flagged', (s) => ((s.marks as number[])[s.exploded as number] = FLAGGED), boom],
    ['pre-layout reveal', (s) => {
      Object.assign(s, createInitialState(1));
      (s.marks as number[])[0] = REVEALED;
    }],
    ['pre-layout first', (s) => Object.assign(s, createInitialState(1), { first: 0 })],
    ['pre-layout attempt', (s) => Object.assign(s, createInitialState(1), { attempt: 0 })],
    ['pre-layout exploded', (s) => Object.assign(s, createInitialState(1), { exploded: 0 })],
    ['pre-layout shown', (s) => Object.assign(s, createInitialState(1), { shown: true })]
  ];

  it('accepts real states', () => {
    expect(isMinesState(base)).toBe(true);
    expect(isMinesState(boom)).toBe(true);
    expect(isMinesState(createInitialState(1, 'hard'))).toBe(true);
  });

  it.each(variants)('rejects a corrupted %s', (_name, corrupt, from = base) => {
    const s = clone(from) as unknown as Record<string, unknown>;
    corrupt(s);
    expect(isMinesState(s)).toBe(false);
  });

  it('rejects junk without throwing', () => {
    for (const junk of [null, undefined, 1, 'x', [], {}, { marks: [] }]) expect(isMinesState(junk)).toBe(false);
    const hostile = { ...clone(base) } as Record<string, unknown>;
    Object.defineProperty(hostile, 'marks', {
      get() {
        throw new Error('boom');
      },
      enumerable: true
    });
    expect(isMinesState(hostile)).toBe(false);
  });
});
