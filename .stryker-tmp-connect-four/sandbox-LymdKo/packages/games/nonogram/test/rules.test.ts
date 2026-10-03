// @ts-nocheck
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  CROSSED,
  DIFFICULTIES,
  FILLED,
  MAX_COUNTER,
  MAX_DENSITY,
  MIN_DENSITY,
  SIZES,
  UNKNOWN,
  applyCell,
  attemptSeed,
  canShowMistakes,
  check,
  cluesOf,
  colOf,
  createInitialState,
  generatePuzzle,
  indexOf,
  isLineSolvable,
  isNonogramState,
  isSolved,
  lineClue,
  lineSatisfied,
  nextMark,
  randomPicture,
  repairPicture,
  rowOf,
  setMode,
  showMistakes,
  solveByLines,
  solveLine,
  tapAction,
  toDifficulty,
  wrongCells,
  type Knowledge,
  type NonogramState
} from '../src/rules';
import { bruteSolveLine, cluesFromGrid, countSolutionsBacktracking, countSolutionsExhaustive, runsOf } from './oracle';

const bit = fc.integer({ min: 0, max: 1 });
const lineArb = fc.array(bit, { minLength: 0, maxLength: 12 });
const gridArb = (size: number) => fc.array(bit, { minLength: size * size, maxLength: size * size });
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** Solves a state by filling exactly the solution cells (row-major order). */
function solveState(state: NonogramState): NonogramState {
  let s = state;
  s.solution.forEach((v, i) => {
    if (v === 1) s = applyCell(s, i, 'fill');
  });
  return s;
}

const firstEmpty = (s: NonogramState) => s.solution.indexOf(0);
const firstFilled = (s: NonogramState) => s.solution.indexOf(1);

describe('clues', () => {
  it('computes runs for hand-written examples', () => {
    expect(lineClue([])).toEqual([]);
    expect(lineClue([0, 0, 0])).toEqual([]);
    expect(lineClue([1, 1, 1])).toEqual([3]);
    expect(lineClue([1, 0, 1, 1, 0])).toEqual([1, 2]);
    expect(lineClue([0, 1, 1, 0, 0, 1])).toEqual([2, 1]);
    expect(lineClue([1, 0, 0, 0, 1])).toEqual([1, 1]);
    // Only the value 1 counts as filled.
    expect(lineClue([2, 1, 2, 1])).toEqual([1, 1]);
  });

  it('agrees with the independent string-based oracle', () => {
    fc.assert(fc.property(lineArb, (line) => {
      expect(lineClue(line)).toEqual(runsOf(line));
    }));
  });

  it('has positive runs that fit the line and sum to the filled count', () => {
    fc.assert(
      fc.property(lineArb, (line) => {
        const clue = lineClue(line);
        expect(clue.every((run) => run > 0)).toBe(true);
        const filled = line.filter((v) => v === 1).length;
        expect(clue.reduce((a, b) => a + b, 0)).toBe(filled);
        expect(filled + Math.max(0, clue.length - 1)).toBeLessThanOrEqual(line.length);
      })
    );
  });

  it('is invariant under reversal up to order', () => {
    fc.assert(fc.property(lineArb, (line) => {
      expect(lineClue([...line].reverse())).toEqual(lineClue(line).reverse());
    }));
  });

  it('extracts rows and columns of a row-major grid', () => {
    const grid = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    expect(rowOf(grid, 3, 0)).toEqual([1, 2, 3]);
    expect(rowOf(grid, 3, 2)).toEqual([7, 8, 9]);
    expect(colOf(grid, 3, 0)).toEqual([1, 4, 7]);
    expect(colOf(grid, 3, 2)).toEqual([3, 6, 9]);
    expect(indexOf(3, 2, 1)).toBe(7);
  });

  it('computes row and column clues for a grid', () => {
    // 1 1 0
    // 0 0 0
    // 1 0 1
    expect(cluesOf([1, 1, 0, 0, 0, 0, 1, 0, 1], 3)).toEqual({ rows: [[2], [], [1, 1]], cols: [[1, 1], [1], [1]] });
    fc.assert(fc.property(gridArb(4), (grid) => {
      expect(cluesOf(grid, 4)).toEqual(cluesFromGrid(grid, 4));
    }));
  });

  it('recognises satisfied lines from filled marks only', () => {
    expect(lineSatisfied([2], [FILLED, FILLED, UNKNOWN])).toBe(true);
    expect(lineSatisfied([2], [FILLED, FILLED, CROSSED])).toBe(true);
    expect(lineSatisfied([2], [CROSSED, FILLED, FILLED])).toBe(true);
    expect(lineSatisfied([2], [FILLED, CROSSED, FILLED])).toBe(false);
    expect(lineSatisfied([1, 1], [FILLED, CROSSED, FILLED])).toBe(true);
    expect(lineSatisfied([], [CROSSED, UNKNOWN, CROSSED])).toBe(true);
    expect(lineSatisfied([], [FILLED, UNKNOWN, CROSSED])).toBe(false);
    expect(lineSatisfied([3], [FILLED, FILLED, UNKNOWN])).toBe(false);
  });
});

describe('line solver (single line)', () => {
  it('handles classic overlap and empty cases', () => {
    expect(solveLine([3], [-1, -1, -1, -1])).toEqual([-1, 1, 1, -1]);
    expect(solveLine([4], [-1, -1, -1, -1])).toEqual([1, 1, 1, 1]);
    expect(solveLine([], [-1, -1, -1])).toEqual([0, 0, 0]);
    expect(solveLine([1, 1], [-1, -1, -1])).toEqual([1, 0, 1]);
    expect(solveLine([1], [-1, -1, -1])).toEqual([-1, -1, -1]);
    expect(solveLine([2], [-1, 1, -1, -1, -1])).toEqual([-1, 1, -1, 0, 0]);
    expect(solveLine([1], [0, -1, 0])).toEqual([0, 1, 0]);
    expect(solveLine([2, 1], [-1, -1, -1, -1, 0])).toEqual([1, 1, 0, 1, 0]);
  });

  it('detects contradictions', () => {
    expect(solveLine([4], [-1, -1, -1])).toBeNull();
    expect(solveLine([], [-1, 1, -1])).toBeNull();
    expect(solveLine([2], [1, 0, 1])).toBeNull();
    expect(solveLine([1, 1], [1, 1, -1])).toBeNull();
    expect(solveLine([2], [0, -1, 0, -1])).toBeNull();
    expect(solveLine([1], [1, -1, 1])).toBeNull();
  });

  it('keeps already known cells', () => {
    expect(solveLine([1], [-1, 1, -1])).toEqual([0, 1, 0]);
    expect(solveLine([1, 1], [1, 0, 1, 0])).toEqual([1, 0, 1, 0]);
  });

  it('equals the brute-force intersection of all consistent placements', () => {
    const arb = fc.integer({ min: 1, max: 10 }).chain((n) =>
      fc.record({
        truth: fc.array(bit, { minLength: n, maxLength: n }),
        known: fc.array(fc.constantFrom<Knowledge>(-1, -1, 0, 1), { minLength: n, maxLength: n }),
        // Sometimes use a clue from an unrelated line, so contradictions are exercised too.
        other: fc.array(bit, { minLength: n, maxLength: n }),
        useOther: fc.boolean()
      })
    );
    fc.assert(
      fc.property(arb, ({ truth, known, other, useOther }) => {
        const clue = runsOf(useOther ? other : truth);
        expect(solveLine(clue, known)).toEqual(bruteSolveLine(clue, known));
      }),
      { numRuns: 1500 }
    );
  });

  it('never contradicts the true line when the knowledge is consistent with it', () => {
    const arb = fc.integer({ min: 1, max: 12 }).chain((n) =>
      fc.record({ truth: fc.array(bit, { minLength: n, maxLength: n }), reveal: fc.array(fc.boolean(), { minLength: n, maxLength: n }) })
    );
    fc.assert(
      fc.property(arb, ({ truth, reveal }) => {
        const known = truth.map((v, i): Knowledge => (reveal[i] ? (v as Knowledge) : -1));
        const solved = solveLine(runsOf(truth), known);
        expect(solved).not.toBeNull();
        solved?.forEach((v, i) => {
          if (v !== -1) expect(v).toBe(truth[i]);
          if (known[i] !== -1) expect(v).toBe(known[i]);
        });
      })
    );
  });
});

describe('grid line solver', () => {
  it('solves a small puzzle completely', () => {
    // 1 1 1
    // 1 0 0
    // 1 0 0  — clues row [3],[1],[1]; cols [3],[1],[1] → unique and line-solvable.
    const solution = [1, 1, 1, 1, 0, 0, 1, 0, 0];
    const result = solveByLines(cluesOf(solution, 3));
    expect(result).toEqual({ grid: solution, solved: true, contradiction: false });
    expect(isLineSolvable(solution, 3)).toBe(true);
  });

  it('stops without guessing on an ambiguous puzzle', () => {
    // Diagonal 2×2: both diagonals fit clues [1],[1] / [1],[1].
    const result = solveByLines(cluesOf([1, 0, 0, 1], 2));
    expect(result).toEqual({ grid: [-1, -1, -1, -1], solved: false, contradiction: false });
    expect(isLineSolvable([1, 0, 0, 1], 2)).toBe(false);
  });

  it('propagates deductions across rows and columns until the fixpoint', () => {
    // A single independent sweep over rows and columns fixes only 7 of 25 cells here;
    // the rest needs knowledge to flow back and forth between lines.
    const solution = [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0];
    const clues = cluesOf(solution, 5);
    const blank: Knowledge[] = [-1, -1, -1, -1, -1];
    const sweep = new Set<number>();
    for (let i = 0; i < 5; i++) {
      solveLine(clues.rows[i] as number[], blank)?.forEach((v, j) => v !== -1 && sweep.add(i * 5 + j));
      solveLine(clues.cols[i] as number[], blank)?.forEach((v, j) => v !== -1 && sweep.add(j * 5 + i));
    }
    expect(sweep.size).toBe(7);
    const result = solveByLines(clues);
    expect(result.solved).toBe(true);
    expect(result.grid).toEqual(solution);
  });

  it('reports contradictions for impossible clues', () => {
    const result = solveByLines({ rows: [[2], [2]], cols: [[], []] });
    expect(result.contradiction).toBe(true);
    expect(result.solved).toBe(false);
  });

  it('respects starting knowledge', () => {
    const solution = [1, 0, 0, 1];
    const start: Knowledge[] = [1, -1, -1, -1];
    expect(solveByLines(cluesOf(solution, 2), start).grid).toEqual(solution);
    expect(start).toEqual([1, -1, -1, -1]);
  });

  it('never contradicts the true solution, even from partial knowledge', () => {
    const arb = fc.integer({ min: 2, max: 7 }).chain((n) =>
      fc.record({ n: fc.constant(n), truth: gridArb(n), reveal: fc.array(fc.boolean(), { minLength: n * n, maxLength: n * n }) })
    );
    fc.assert(
      fc.property(arb, ({ n, truth, reveal }) => {
        const start = truth.map((v, i): Knowledge => (reveal[i] ? (v as Knowledge) : -1));
        const result = solveByLines(cluesOf(truth, n), start);
        expect(result.contradiction).toBe(false);
        result.grid.forEach((v, i) => {
          if (v !== -1) expect(v).toBe(truth[i]);
        });
        expect(result.solved).toBe(result.grid.every((v) => v !== -1));
      }),
      { numRuns: 300 }
    );
  });

  it('only claims line-solvability for puzzles with a unique solution (oracle)', () => {
    fc.assert(
      fc.property(gridArb(4), (grid) => {
        if (isLineSolvable(grid, 4)) expect(countSolutionsExhaustive(cluesFromGrid(grid, 4))).toBe(1);
      }),
      { numRuns: 300 }
    );
  });
});

describe('independent oracle self-check', () => {
  it('counts solutions consistently with both strategies', () => {
    fc.assert(
      fc.property(gridArb(5), (grid) => {
        const clues = cluesFromGrid(grid, 5);
        const exhaustive = countSolutionsExhaustive(clues, 3);
        expect(exhaustive).toBeGreaterThanOrEqual(1);
        expect(countSolutionsBacktracking(clues, 3)).toBe(exhaustive);
      }),
      { numRuns: 120 }
    );
  });

  it('finds multiple solutions for a known ambiguous puzzle', () => {
    expect(countSolutionsExhaustive(cluesFromGrid([1, 0, 0, 1], 2))).toBe(2);
    expect(countSolutionsBacktracking(cluesFromGrid([1, 0, 0, 1], 2))).toBe(2);
  });
});

describe('generation', () => {
  it('derives distinct, deterministic attempt seeds', () => {
    expect(attemptSeed(1, 0)).toBe(attemptSeed(1, 0));
    const seeds = new Set<number>();
    for (let a = 0; a < 50; a++) seeds.add(attemptSeed(12345, a));
    for (let s = 0; s < 50; s++) seeds.add(attemptSeed(s, 0));
    expect(seeds.size).toBe(100);
    for (const s of seeds) expect(Number.isInteger(s) && s >= 0 && s <= 0xffffffff).toBe(true);
  });

  it('draws random pictures within the density range', () => {
    for (const size of [5, 8, 10]) {
      for (let seed = 0; seed < 40; seed++) {
        const picture = randomPicture(seed, size);
        expect(picture).toHaveLength(size * size);
        expect(picture.every((v) => v === 0 || v === 1)).toBe(true);
        const filled = picture.filter((v) => v === 1).length;
        expect(filled).toBeGreaterThanOrEqual(Math.ceil(size * size * MIN_DENSITY));
        expect(filled).toBeLessThanOrEqual(Math.floor(size * size * MAX_DENSITY));
      }
    }
    expect(randomPicture(9, 8)).toEqual(randomPicture(9, 8));
    expect(randomPicture(9, 8)).not.toEqual(randomPicture(10, 8));
  });

  it('repairs an ambiguous picture into a line-solvable one by filling cells only', () => {
    const ambiguous = [1, 0, 0, 1];
    const repaired = repairPicture(ambiguous, 2);
    expect(isLineSolvable(repaired, 2)).toBe(true);
    ambiguous.forEach((v, i) => {
      if (v === 1) expect(repaired[i]).toBe(1);
    });
    expect(repairPicture([1, 1, 1, 1], 2)).toEqual([1, 1, 1, 1]);
    fc.assert(
      fc.property(gridArb(5), (grid) => {
        const fixed = repairPicture(grid, 5);
        expect(isLineSolvable(fixed, 5)).toBe(true);
        grid.forEach((v, i) => v === 1 && expect(fixed[i]).toBe(1));
        if (isLineSolvable(grid, 5)) expect(fixed).toEqual(grid);
      }),
      { numRuns: 100 }
    );
  });

  it('is deterministic per seed and differs between seeds', () => {
    for (const difficulty of DIFFICULTIES) {
      expect(generatePuzzle(77, difficulty)).toEqual(generatePuzzle(77, difficulty));
      expect(generatePuzzle(77, difficulty)).not.toEqual(generatePuzzle(78, difficulty));
    }
  });

  it('produces 5×5 puzzles that are line-solvable and unique (exhaustive oracle) across many seeds', () => {
    for (let seed = 0; seed < 300; seed++) {
      const puzzle = generatePuzzle(seed * 7919 + 13, 'easy');
      expect(puzzle).toHaveLength(25);
      const result = solveByLines(cluesOf(puzzle, 5));
      expect(result.solved).toBe(true);
      expect(result.grid).toEqual(puzzle);
      expect(countSolutionsExhaustive(cluesFromGrid(puzzle, 5))).toBe(1);
    }
  });

  it('produces 8×8 and 10×10 puzzles that are line-solvable and unique (backtracking oracle)', () => {
    for (const difficulty of ['medium', 'hard'] as const) {
      const size = SIZES[difficulty];
      for (let seed = 0; seed < 25; seed++) {
        const puzzle = generatePuzzle(seed * 104729 + 1, difficulty);
        expect(puzzle).toHaveLength(size * size);
        const filled = puzzle.filter((v) => v === 1).length;
        expect(filled / (size * size)).toBeGreaterThanOrEqual(MIN_DENSITY);
        expect(filled / (size * size)).toBeLessThanOrEqual(MAX_DENSITY);
        expect(solveByLines(cluesOf(puzzle, size)).grid).toEqual(puzzle);
        expect(countSolutionsBacktracking(cluesFromGrid(puzzle, size))).toBe(1);
      }
    }
  });

  it('generates a 10×10 puzzle fast enough for a phone', () => {
    const runs = 30;
    const start = performance.now();
    let slowest = 0;
    for (let seed = 0; seed < runs; seed++) {
      const t0 = performance.now();
      generatePuzzle(seed * 31 + 5, 'hard');
      slowest = Math.max(slowest, performance.now() - t0);
    }
    // Typical is well below 1 ms on a desktop; generous bounds absorb slow CI and phones.
    expect((performance.now() - start) / runs).toBeLessThan(50);
    expect(slowest).toBeLessThan(200);
  });
});

describe('game state', () => {
  it('creates an empty board for the seeded puzzle', () => {
    const s = createInitialState(42, 'medium');
    expect(s).toMatchObject({ seed: 42, difficulty: 'medium', size: 8, mode: 'fill', moves: 0, checks: 0, mistakes: 0, lastCheck: null, marked: [] });
    expect(s.cells).toEqual(new Array(64).fill(UNKNOWN));
    expect(s.solution).toEqual(generatePuzzle(42, 'medium'));
    expect(createInitialState(42, 'medium')).toEqual(s);
    expect(createInitialState(5).difficulty).toBe('easy');
    expect(createInitialState(-1).seed).toBe(0xffffffff);
    expect(isNonogramState(s)).toBe(true);
  });

  it('maps unknown difficulties to the default', () => {
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('nope')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
  });

  it('computes next marks for every action', () => {
    expect([UNKNOWN, FILLED, CROSSED].map((m) => nextMark(m, 'toggleFill'))).toEqual([FILLED, UNKNOWN, FILLED]);
    expect([UNKNOWN, FILLED, CROSSED].map((m) => nextMark(m, 'toggleCross'))).toEqual([CROSSED, CROSSED, UNKNOWN]);
    expect([UNKNOWN, FILLED, CROSSED].map((m) => nextMark(m, 'fill'))).toEqual([FILLED, FILLED, FILLED]);
    expect([UNKNOWN, FILLED, CROSSED].map((m) => nextMark(m, 'cross'))).toEqual([CROSSED, CROSSED, CROSSED]);
    expect([UNKNOWN, FILLED, CROSSED].map((m) => nextMark(m, 'clear'))).toEqual([UNKNOWN, UNKNOWN, UNKNOWN]);
    expect(tapAction('fill')).toBe('toggleFill');
    expect(tapAction('cross')).toBe('toggleCross');
  });

  it('applies cell actions immutably and counts moves and wrong fills', () => {
    const s0 = createInitialState(3);
    const empty = firstEmpty(s0);
    const full = firstFilled(s0);
    const s1 = applyCell(s0, full, 'toggleFill');
    expect(s1.cells[full]).toBe(FILLED);
    expect(s1).toMatchObject({ moves: 1, mistakes: 0 });
    expect(s0.cells[full]).toBe(UNKNOWN);
    const s2 = applyCell(s1, empty, 'fill');
    expect(s2).toMatchObject({ moves: 2, mistakes: 1 });
    const s3 = applyCell(s2, empty, 'cross');
    expect(s3.cells[empty]).toBe(CROSSED);
    expect(s3).toMatchObject({ moves: 3, mistakes: 1 });
    const s4 = applyCell(s3, empty, 'clear');
    expect(s4.cells[empty]).toBe(UNKNOWN);
    expect(s4.moves).toBe(4);
    // Crossing a filled solution cell is not counted as a mistake (only wrong fills are).
    expect(applyCell(s4, full, 'cross').mistakes).toBe(1);
  });

  it('ignores no-op, out-of-range and post-solution actions', () => {
    const s = createInitialState(4);
    expect(applyCell(s, 0, 'clear')).toBe(s);
    expect(applyCell(s, -1, 'fill')).toBe(s);
    expect(applyCell(s, s.cells.length, 'fill')).toBe(s);
    expect(applyCell(s, 1.5, 'fill')).toBe(s);
    const solved = solveState(s);
    expect(isSolved(solved)).toBe(true);
    expect(applyCell(solved, 0, 'toggleFill')).toBe(solved);
    expect(check(solved)).toBe(solved);
  });

  it('is solved exactly when filled cells match the solution, ignoring crosses', () => {
    const s = createInitialState(8);
    expect(isSolved(s)).toBe(false);
    let crossed = s;
    s.solution.forEach((v, i) => {
      if (v === 0) crossed = applyCell(crossed, i, 'cross');
    });
    expect(isSolved(crossed)).toBe(false);
    const solved = solveState(crossed);
    expect(isSolved(solved)).toBe(true);
    expect(isSolved(solveState(s))).toBe(true);
    // One extra filled cell breaks it, one missing cell too.
    expect(isSolved({ ...solved, cells: solved.cells.map((m, i) => (i === firstEmpty(s) ? FILLED : m)) })).toBe(false);
    expect(isSolved({ ...solved, cells: solved.cells.map((m, i) => (i === firstFilled(s) ? CROSSED : m)) })).toBe(false);
  });

  it('checks count wrong fills without revealing them, then shows them on request', () => {
    let s = createInitialState(9, 'medium');
    expect(canShowMistakes(s)).toBe(false);
    expect(showMistakes(s)).toBe(s);
    const wrong = s.solution.flatMap((v, i) => (v === 0 ? [i] : [])).slice(0, 2);
    s = applyCell(s, firstFilled(s), 'fill');
    for (const i of wrong) s = applyCell(s, i, 'fill');
    expect(wrongCells(s)).toEqual(wrong);
    s = check(s);
    expect(s).toMatchObject({ checks: 1, lastCheck: 2, marked: [] });
    expect(canShowMistakes(s)).toBe(true);
    s = showMistakes(s);
    expect(s.marked).toEqual(wrong);
    expect(canShowMistakes(s)).toBe(false);
    expect(showMistakes(s)).toBe(s);
    // Fixing one marked cell unmarks only it and clears the check result.
    s = applyCell(s, wrong[0] as number, 'cross');
    expect(s.marked).toEqual([wrong[1]]);
    expect(s.lastCheck).toBeNull();
    // A new check clears all marks.
    s = check(s);
    expect(s).toMatchObject({ checks: 2, lastCheck: 1, marked: [] });
    expect(isNonogramState(s)).toBe(true);
  });

  it('reports zero wrong cells on a correct partial board', () => {
    let s = createInitialState(10);
    s = applyCell(s, firstFilled(s), 'fill');
    s = check(s);
    expect(s.lastCheck).toBe(0);
    expect(canShowMistakes(s)).toBe(false);
    expect(showMistakes(s)).toBe(s);
  });

  it('switches the tap mode', () => {
    const s = createInitialState(1);
    expect(setMode(s, 'fill')).toBe(s);
    const crossed = setMode(s, 'cross');
    expect(crossed.mode).toBe('cross');
    expect(s.mode).toBe('fill');
  });

  it('keeps every reachable state valid (random play)', () => {
    const actions = ['toggleFill', 'toggleCross', 'fill', 'cross', 'clear', 'check', 'show', 'mode'] as const;
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 0xffffffff }),
        fc.constantFrom(...DIFFICULTIES),
        fc.array(fc.record({ action: fc.constantFrom(...actions), cell: fc.nat(99) }), { maxLength: 60 }),
        (seed, difficulty, steps) => {
          let s = createInitialState(seed, difficulty);
          for (const { action, cell } of steps) {
            const before = s;
            if (action === 'check') s = check(s);
            else if (action === 'show') s = showMistakes(s);
            else if (action === 'mode') s = setMode(s, s.mode === 'fill' ? 'cross' : 'fill');
            else s = applyCell(s, cell % s.cells.length, action);
            expect(isNonogramState(clone(s))).toBe(true);
            expect(s.moves).toBeGreaterThanOrEqual(before.moves);
            expect(s.moves - before.moves).toBeLessThanOrEqual(1);
            expect(s.solution).toBe(before.solution);
          }
        }
      ),
      { numRuns: 60 }
    );
  });
});

describe('isNonogramState', () => {
  const valid = () => {
    let s = createInitialState(21, 'easy');
    s = applyCell(s, firstEmpty(s), 'fill');
    s = applyCell(s, firstFilled(s), 'cross');
    s = showMistakes(check(s));
    return clone(s);
  };

  it('accepts a valid state', () => {
    expect(isNonogramState(valid())).toBe(true);
    expect(valid().marked).toHaveLength(1);
  });

  it.each([
    ['not an object', () => null],
    ['an array', () => []],
    ['bad seed', (s: NonogramState) => ({ ...s, seed: -1 })],
    ['fractional seed', (s: NonogramState) => ({ ...s, seed: 1.5 })],
    ['unknown difficulty', (s: NonogramState) => ({ ...s, difficulty: 'expert' })],
    ['size mismatch', (s: NonogramState) => ({ ...s, size: 8 })],
    ['short solution', (s: NonogramState) => ({ ...s, solution: s.solution.slice(1) })],
    ['solution value 2', (s: NonogramState) => ({ ...s, solution: [2, ...s.solution.slice(1)] })],
    ['solution not an array', (s: NonogramState) => ({ ...s, solution: 'x' })],
    ['short cells', (s: NonogramState) => ({ ...s, cells: s.cells.slice(1) })],
    ['cell value 3', (s: NonogramState) => ({ ...s, cells: [3, ...s.cells.slice(1)] })],
    ['cell value string', (s: NonogramState) => ({ ...s, cells: ['1', ...s.cells.slice(1)] })],
    ['cells not an array', (s: NonogramState) => ({ ...s, cells: {} })],
    ['bad mode', (s: NonogramState) => ({ ...s, mode: 'erase' })],
    ['negative moves', (s: NonogramState) => ({ ...s, moves: -1 })],
    ['huge moves', (s: NonogramState) => ({ ...s, moves: MAX_COUNTER + 1 })],
    ['bad checks', (s: NonogramState) => ({ ...s, checks: 0.5 })],
    ['bad mistakes', (s: NonogramState) => ({ ...s, mistakes: -2 })],
    ['more mistakes than moves', (s: NonogramState) => ({ ...s, mistakes: s.moves + 1 })],
    ['bad lastCheck', (s: NonogramState) => ({ ...s, lastCheck: 'x' })],
    ['lastCheck too large', (s: NonogramState) => ({ ...s, lastCheck: 26 })],
    ['marked not an array', (s: NonogramState) => ({ ...s, marked: 3 })],
    ['marked out of range', (s: NonogramState) => ({ ...s, marked: [25] })],
    ['marked duplicate', (s: NonogramState) => ({ ...s, marked: [...s.marked, ...s.marked] })],
    ['marked a correct cell', (s: NonogramState) => ({ ...s, marked: [s.solution.indexOf(1)] })],
    ['marked an unfilled wrong cell', (s: NonogramState) => ({ ...s, marked: [s.solution.findIndex((v, i) => v === 0 && s.cells[i] !== FILLED)] })],
    ['ambiguous puzzle', (s: NonogramState) => ({ ...s, solution: new Array(25).fill(0).map((_, i) => (i === 0 || i === 6 ? 1 : 0)), cells: new Array(25).fill(0), marked: [], mistakes: 0 })]
  ])('rejects %s', (_label, mutate) => {
    expect(isNonogramState(mutate(valid()))).toBe(false);
  });

  it('accepts lastCheck at the bounds and unsorted marks are rejected', () => {
    expect(isNonogramState({ ...valid(), lastCheck: 0 })).toBe(true);
    expect(isNonogramState({ ...valid(), lastCheck: 25 })).toBe(true);
    expect(isNonogramState({ ...valid(), lastCheck: null, moves: MAX_COUNTER, checks: MAX_COUNTER })).toBe(true);
    const s = createInitialState(30, 'easy');
    const empties = s.solution.flatMap((v, i) => (v === 0 ? [i] : [])).slice(0, 2);
    let t = s;
    for (const i of empties) t = applyCell(t, i, 'fill');
    t = showMistakes(check(t));
    expect(isNonogramState(clone(t))).toBe(true);
    expect(isNonogramState({ ...clone(t), marked: [...t.marked].reverse() })).toBe(false);
  });

  it('never throws on arbitrary input', () => {
    fc.assert(fc.property(fc.anything(), (value) => void expect(() => isNonogramState(value)).not.toThrow()));
    const hostile = { get seed(): number { throw new Error('boom'); } };
    expect(isNonogramState(hostile)).toBe(false);
  });
});
