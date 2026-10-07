// @ts-nocheck
import { beforeEach, describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import {
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  EXTRA_GIVENS,
  MAX_COUNTER,
  SIDES,
  SIZES,
  arrangements,
  bitCount,
  check,
  clearCell,
  cluesOf,
  countSolutions,
  createInitialState,
  enterDigit,
  filledCount,
  fullMask,
  generatePuzzle,
  isLatinSquare,
  isLogicSolvable,
  isSkyscrapersState,
  isSolved,
  lineCells,
  lineClues,
  markedCells,
  maskDigits,
  propagate,
  randomLatinSquare,
  repeatedCells,
  setPencil,
  setValue,
  solveByLogic,
  toDifficulty,
  toggleNote,
  visibleCount,
  wrongCells,
  type Clues,
  type Puzzle,
  type SkyscrapersState
} from '../src/rules';
import { allPermutations, oracleCount, oracleSolutions, satisfies, seenFromStart } from './oracle';

/** Generous per-test limit: generation-heavy tests run much slower under mutation instrumentation. */
const SLOW = { timeout: 120_000 };
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const toRows = (grid: readonly number[], n: number) => Array.from({ length: n }, (_, r) => grid.slice(r * n, r * n + n));
const noClues = (n: number): Clues => ({ top: Array(n).fill(0), bottom: Array(n).fill(0), left: Array(n).fill(0), right: Array(n).fill(0) });
const zeros = (n: number) => new Array<number>(n * n).fill(0);

/** Symmetric cyclic 4×4 square with hand-computed clues. */
const CYCLIC = [1, 2, 3, 4, 2, 3, 4, 1, 3, 4, 1, 2, 4, 1, 2, 3];
const CYCLIC_CLUES: Clues = { top: [4, 3, 2, 1], bottom: [1, 2, 2, 2], left: [4, 3, 2, 1], right: [1, 2, 2, 2] };

const sizeArb = fc.integer({ min: 1, max: 6 });
const permArb = (n: number) => fc.shuffledSubarray(Array.from({ length: n }, (_, i) => i + 1), { minLength: n, maxLength: n });
const seedArb = fc.integer({ min: 0, max: 0xffff_ffff });

/** A random puzzle (not necessarily unique) from a random square and a random subset of clues and givens. */
const puzzleArb = (n: number) =>
  fc
    .record({
      seed: seedArb,
      clueKeep: fc.array(fc.boolean(), { minLength: 4 * n, maxLength: 4 * n }),
      givenKeep: fc.array(fc.integer({ min: 0, max: 9 }), { minLength: n * n, maxLength: n * n })
    })
    .map(({ seed, clueKeep, givenKeep }) => {
      const solution = randomLatinSquare(createRng(seed), n);
      const full = cluesOf(solution, n);
      const clues = noClues(n);
      SIDES.forEach((side, s) => {
        for (let i = 0; i < n; i++) if (clueKeep[s * n + i]) clues[side][i] = full[side][i] as number;
      });
      const givens = solution.map((v, i) => ((givenKeep[i] as number) === 0 ? v : 0));
      return { solution, puzzle: { size: n, clues, givens } as Puzzle };
    });

function stateWith(state: SkyscrapersState, patch: Partial<SkyscrapersState>): SkyscrapersState {
  return { ...clone(state), ...patch };
}

const firstOpen = (s: SkyscrapersState) => s.givens.findIndex((g) => g === 0);
const wrongDigit = (s: SkyscrapersState, i: number) => ((s.solution[i] as number) % s.size) + 1;

/** Fills every open cell with its solution digit. */
function solveState(state: SkyscrapersState): SkyscrapersState {
  let s = state;
  s.solution.forEach((v, i) => (s = setValue(s, i, v)));
  return s;
}

describe('visibility', () => {
  it('counts buildings taller than all before them', () => {
    expect(visibleCount([])).toBe(0);
    expect(visibleCount([3])).toBe(1);
    expect(visibleCount([1, 2, 3, 4])).toBe(4);
    expect(visibleCount([4, 3, 2, 1])).toBe(1);
    expect(visibleCount([2, 1, 4, 3])).toBe(2);
    expect(visibleCount([1, 3, 2, 5, 4, 6])).toBe(4);
    // Equal heights do not count twice; empty cells (0) are never visible.
    expect(visibleCount([2, 2, 2])).toBe(1);
    expect(visibleCount([0, 0, 1])).toBe(1);
  });

  it('agrees with the oracle on every permutation and on arbitrary lines', () => {
    for (let n = 1; n <= 6; n++) for (const p of allPermutations(n)) expect(visibleCount(p)).toBe(seenFromStart(p));
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 1, max: 9 }), { maxLength: 10 }), (line) => {
        expect(visibleCount(line)).toBe(seenFromStart(line));
      })
    );
  });

  it('is between 1 and n for permutations, n only when ascending', () => {
    fc.assert(
      fc.property(sizeArb.chain((n) => permArb(n)), (p) => {
        const v = visibleCount(p);
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(p.length);
        expect(v === p.length).toBe(p.every((h, i) => h === i + 1));
        expect(v === 1).toBe(p[0] === p.length);
      })
    );
  });
});

describe('lines and clues', () => {
  it('enumerates row and column cells in reading order', () => {
    expect(lineCells(3, 0)).toEqual([0, 1, 2]);
    expect(lineCells(3, 2)).toEqual([6, 7, 8]);
    expect(lineCells(3, 3)).toEqual([0, 3, 6]);
    expect(lineCells(3, 5)).toEqual([2, 5, 8]);
    expect(lineCells(4, 1)).toEqual([4, 5, 6, 7]);
    expect(lineCells(4, 5)).toEqual([1, 5, 9, 13]);
  });

  it('pairs clues with lines (left/right for rows, top/bottom for columns)', () => {
    const clues: Clues = { top: [1, 2], bottom: [3, 4], left: [5, 6], right: [7, 8] };
    expect(lineClues(clues, 2, 0)).toEqual([5, 7]);
    expect(lineClues(clues, 2, 1)).toEqual([6, 8]);
    expect(lineClues(clues, 2, 2)).toEqual([1, 3]);
    expect(lineClues(clues, 2, 3)).toEqual([2, 4]);
  });

  it('computes all clues of a hand-checked square', () => {
    expect(cluesOf(CYCLIC, 4)).toEqual(CYCLIC_CLUES);
    // Asymmetric example: rows and columns differ.
    const grid = [2, 1, 3, 3, 2, 1, 1, 3, 2];
    expect(cluesOf(grid, 3)).toEqual({ top: [2, 3, 1], bottom: [2, 1, 2], left: [2, 1, 2], right: [1, 3, 2] });
  });

  it('agrees with the oracle on random Latin squares', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 6 }), seedArb, (n, seed) => {
        const grid = randomLatinSquare(createRng(seed), n);
        const rows = toRows(grid, n);
        const clues = cluesOf(grid, n);
        for (let k = 0; k < n; k++) {
          const row = rows[k] as number[];
          const col = rows.map((r) => r[k] as number);
          expect(clues.left[k]).toBe(seenFromStart(row));
          expect(clues.right[k]).toBe(seenFromStart([...row].reverse()));
          expect(clues.top[k]).toBe(seenFromStart(col));
          expect(clues.bottom[k]).toBe(seenFromStart([...col].reverse()));
        }
        expect(satisfies(rows, clues, zeros(n))).toBe(true);
      }),
      { numRuns: 60 }
    );
  });
});

describe('Latin squares', () => {
  it('accepts valid squares and rejects broken ones', () => {
    expect(isLatinSquare(CYCLIC, 4)).toBe(true);
    expect(isLatinSquare([1], 1)).toBe(true);
    expect(isLatinSquare([1, 2, 2, 1], 2)).toBe(true);
    expect(isLatinSquare([1, 2, 1, 2], 2)).toBe(false); // column repeat
    expect(isLatinSquare([1, 1, 2, 2], 2)).toBe(false); // row repeat
    expect(isLatinSquare([1, 2, 2], 2)).toBe(false); // length
    expect(isLatinSquare([1, 2, 2, 1, 1], 2)).toBe(false); // trailing extra cell
    expect(isLatinSquare([0, 1, 1, 0], 2)).toBe(false); // out of range
    expect(isLatinSquare([1, 3, 3, 1], 2)).toBe(false); // out of range
    expect(isLatinSquare([1, 2.5, 2.5, 1], 2)).toBe(false);
    const broken = [...CYCLIC];
    [broken[0], broken[1]] = [broken[1] as number, broken[0] as number]; // rows fine, columns broken
    expect(isLatinSquare(broken, 4)).toBe(false);
  });

  it('generates valid, seed-deterministic squares of every size', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 7 }), seedArb, (n, seed) => {
        const a = randomLatinSquare(createRng(seed), n);
        expect(isLatinSquare(a, n)).toBe(true);
        expect(randomLatinSquare(createRng(seed), n)).toEqual(a);
      }),
      { numRuns: 80 }
    );
  });

  it('varies with the seed', () => {
    const squares = new Set(Array.from({ length: 30 }, (_, s) => randomLatinSquare(createRng(s), 5).join()));
    expect(squares.size).toBeGreaterThan(25);
  });
});

describe('candidate masks', () => {
  it('encodes heights as bits', () => {
    expect(fullMask(1)).toBe(0b10);
    expect(fullMask(4)).toBe(0b11110);
    expect(fullMask(6)).toBe(0b1111110);
    expect(bitCount(0)).toBe(0);
    expect(bitCount(0b1011010)).toBe(4);
    expect(maskDigits(0)).toEqual([]);
    expect(maskDigits(0b10)).toEqual([1]);
    expect(maskDigits(0b1010100)).toEqual([2, 4, 6]);
    expect(maskDigits(fullMask(5))).toEqual([1, 2, 3, 4, 5]);
  });

  it('round-trips digit sets', () => {
    fc.assert(
      fc.property(fc.uniqueArray(fc.integer({ min: 1, max: 9 })), (digits) => {
        const mask = digits.reduce((m, d) => m | (1 << d), 0);
        expect(maskDigits(mask)).toEqual([...digits].sort((a, b) => a - b));
        expect(bitCount(mask)).toBe(digits.length);
      })
    );
  });

  it('lists every arrangement once with its visibility, cached per size', () => {
    for (let n = 1; n <= 6; n++) {
      const all = arrangements(n);
      expect(all).toHaveLength(allPermutations(n).length);
      expect(new Set(all.map((a) => a.heights.join())).size).toBe(all.length);
      for (const a of all) {
        expect(a.front).toBe(seenFromStart(a.heights));
        expect(a.back).toBe(seenFromStart([...a.heights].reverse()));
      }
      expect(arrangements(n)).toBe(all);
    }
    expect(arrangements(3).map((a) => a.heights.join(''))).toEqual(['123', '132', '213', '231', '312', '321']);
  });
});

describe('solver', SLOW, () => {
  it('fully solves a puzzle with all clues of the cyclic square', () => {
    const puzzle: Puzzle = { size: 4, clues: CYCLIC_CLUES, givens: zeros(4) };
    expect(solveByLogic(puzzle)).toEqual(CYCLIC);
    expect(isLogicSolvable(puzzle)).toBe(true);
    expect(countSolutions(puzzle)).toBe(1);
  });

  it('reads single clues exactly (n means ascending, 1 means the tallest first)', () => {
    const clues = noClues(4);
    clues.left[0] = 4;
    clues.top[3] = 1;
    const cand = propagate({ size: 4, clues, givens: zeros(4) }) as number[];
    expect(cand.slice(0, 4).map(maskDigits)).toEqual([[1], [2], [3], [4]]);
    expect(maskDigits(cand[3] as number)).toEqual([4]);
    expect(maskDigits(cand[7] as number)).toEqual([1, 2, 3]);
    // Untouched cells keep every candidate except those excluded by the Latin rule.
    expect(maskDigits(cand[5] as number)).toEqual([1, 3, 4]);
    expect(maskDigits(cand[10] as number)).toEqual([1, 2, 4]);
  });

  it('honours givens and bottom/right clues', () => {
    const clues = noClues(3);
    clues.right[1] = 3; // row 1 reads 3 2 1
    clues.bottom[1] = 3; // column 1 reads 3 2 1 from the top
    expect(solveByLogic({ size: 3, clues, givens: zeros(3) })).toEqual([1, 3, 2, 3, 2, 1, 2, 1, 3]);
    const one = noClues(3);
    one.right[1] = 3;
    const open = propagate({ size: 3, clues: one, givens: zeros(3) }) as number[];
    expect([3, 4, 5].map((i) => maskDigits(open[i] as number))).toEqual([[3], [2], [1]]);
    expect(maskDigits(open[0] as number)).toEqual([1, 2]);
    expect(maskDigits(open[6] as number)).toEqual([1, 2]);
    const givens = zeros(3);
    givens[0] = 1;
    const fixed = propagate({ size: 3, clues: one, givens }) as number[];
    expect(maskDigits(fixed[0] as number)).toEqual([1]);
    expect(maskDigits(fixed[6] as number)).toEqual([2]);
    expect(maskDigits(fixed[1] as number)).toEqual([3]); // column 1 already has 2 in row 1
    expect(maskDigits(fixed[2] as number)).toEqual([2]);
  });

  it('reports contradictions', () => {
    const clues = noClues(4);
    clues.left[0] = 4;
    clues.right[0] = 4;
    expect(propagate({ size: 4, clues, givens: zeros(4) })).toBeNull();
    expect(countSolutions({ size: 4, clues, givens: zeros(4) })).toBe(0);
    expect(isLogicSolvable({ size: 4, clues, givens: zeros(4) })).toBe(false);
    expect(solveByLogic({ size: 4, clues, givens: zeros(4) })).toBeNull();
    // A given that hides everything behind it contradicts a clue of 2.
    const c2 = noClues(3);
    c2.left[0] = 2;
    const givens = zeros(3);
    givens[0] = 3;
    expect(propagate({ size: 3, clues: c2, givens })).toBeNull();
    // Contradiction discovered only through a crossing line.
    const c3 = noClues(3);
    c3.left[0] = 3; // row 0 = 1 2 3
    c3.top[0] = 1; // column 0 starts with 3
    expect(propagate({ size: 3, clues: c3, givens: zeros(3) })).toBeNull();
  });

  it('leaves an empty puzzle open', () => {
    const puzzle: Puzzle = { size: 3, clues: noClues(3), givens: zeros(3) };
    expect((propagate(puzzle) as number[]).every((m) => m === fullMask(3))).toBe(true);
    expect(isLogicSolvable(puzzle)).toBe(false);
    expect(solveByLogic(puzzle)).toBeNull();
    expect(countSolutions(puzzle)).toBe(2);
    expect(countSolutions(puzzle, 5)).toBe(5);
    expect(countSolutions({ size: 2, clues: noClues(2), givens: zeros(2) }, 10)).toBe(2);
    expect(countSolutions({ size: 3, clues: noClues(3), givens: zeros(3) }, 100)).toBe(12);
  });

  it('continues from given candidate masks', () => {
    const puzzle: Puzzle = { size: 2, clues: noClues(2), givens: zeros(2) };
    const start = [0b10, 0b110, 0b110, 0b110];
    expect((propagate(puzzle, start) as number[]).map(maskDigits)).toEqual([[1], [2], [2], [1]]);
  });

  it('never removes a candidate of the true solution', () => {
    for (const n of [3, 4, 5]) {
      fc.assert(
        fc.property(puzzleArb(n), ({ solution, puzzle }) => {
          const cand = propagate(puzzle);
          expect(cand).not.toBeNull();
          (cand as number[]).forEach((m, i) => expect(m & (1 << (solution[i] as number))).not.toBe(0));
          const solved = solveByLogic(puzzle);
          if (solved) expect(solved).toEqual(solution);
        }),
        { numRuns: 60 }
      );
    }
  });

  it('stops at a fixpoint: propagating again changes nothing', () => {
    for (const n of [4, 5]) {
      fc.assert(
        fc.property(puzzleArb(n), ({ puzzle }) => {
          const once = propagate(puzzle) as number[];
          expect(propagate(puzzle, once)).toEqual(once);
        }),
        { numRuns: 40 }
      );
    }
  });

  it('counts solutions like the brute-force oracle', () => {
    for (const n of [3, 4]) {
      fc.assert(
        fc.property(puzzleArb(n), ({ puzzle }) => {
          const expected = oracleCount(n, puzzle.clues, puzzle.givens, 3);
          expect(countSolutions(puzzle, 3)).toBe(expected);
          if (isLogicSolvable(puzzle)) expect(expected).toBe(1);
        }),
        { numRuns: 80 }
      );
    }
  });

  it('agrees with the oracle on sparse 5×5 puzzles', () => {
    fc.assert(
      fc.property(puzzleArb(5), ({ puzzle }) => {
        expect(countSolutions(puzzle)).toBe(oracleCount(5, puzzle.clues, puzzle.givens));
      }),
      { numRuns: 15 }
    );
  });
});

describe('generation', SLOW, () => {
  const SEEDS: Record<string, number[]> = {
    easy: Array.from({ length: 40 }, (_, i) => i * 104_729 + 1),
    medium: Array.from({ length: 25 }, (_, i) => i * 7919 + 3),
    hard: Array.from({ length: 12 }, (_, i) => i * 65_537 + 5)
  };

  for (const difficulty of DIFFICULTIES) {
    it(`creates ${difficulty} puzzles with exactly one solution (oracle)`, () => {
      const n = SIZES[difficulty];
      for (const seed of SEEDS[difficulty] as number[]) {
        const p = generatePuzzle(seed, difficulty);
        expect(p.size).toBe(n);
        expect(isLatinSquare(p.solution, n)).toBe(true);
        const solutions = oracleSolutions(n, p.clues, p.givens);
        expect(solutions).toHaveLength(1);
        expect((solutions[0] as number[][]).flat()).toEqual(p.solution);
        // Every remaining clue is true; givens are solution digits.
        const full = cluesOf(p.solution, n);
        for (const side of SIDES) p.clues[side].forEach((v, i) => expect(v === 0 || v === full[side][i]).toBe(true));
        p.givens.forEach((g, i) => expect(g === 0 || g === p.solution[i]).toBe(true));
        expect(solveByLogic(p)).toEqual(p.solution);
      }
    });
  }

  it('removes clues greedily: no remaining clue can go without losing pure deduction', () => {
    for (const difficulty of ['medium', 'hard'] as const) {
      for (const seed of [1, 2, 3]) {
        const p = generatePuzzle(seed, difficulty);
        for (const side of SIDES) {
          p.clues[side].forEach((v, i) => {
            if (v === 0) return;
            const trial = clone(p.clues);
            trial[side][i] = 0;
            expect(isLogicSolvable({ size: p.size, clues: trial, givens: p.givens })).toBe(false);
          });
        }
        // Clues really are removed.
        expect(SIDES.flatMap((s) => p.clues[s]).filter((v) => v !== 0).length).toBeLessThan(4 * p.size);
      }
    }
  });

  it('only reveals digits when the full clue set is not enough (plus extras for easy)', () => {
    for (const difficulty of DIFFICULTIES) {
      let sawNoGivens = false;
      for (let seed = 0; seed < 20; seed++) {
        const p = generatePuzzle(seed, difficulty);
        const n = p.size;
        const givenCount = p.givens.filter((g) => g !== 0).length;
        expect(givenCount).toBeGreaterThanOrEqual(EXTRA_GIVENS[difficulty]);
        if (isLogicSolvable({ size: n, clues: cluesOf(p.solution, n), givens: zeros(n) })) {
          expect(givenCount).toBe(EXTRA_GIVENS[difficulty]);
          if (givenCount === 0) sawNoGivens = true;
        }
        expect(givenCount).toBeLessThan(n * n);
      }
      expect(sawNoGivens).toBe(EXTRA_GIVENS[difficulty] === 0);
    }
    expect(EXTRA_GIVENS).toEqual({ easy: 2, medium: 0, hard: 0 });
  });

  it('reveals the easy extra digits in cells that were not given yet', () => {
    let needed = 0;
    for (let seed = 0; seed < 200; seed++) {
      const p = generatePuzzle(seed, 'easy');
      if (isLogicSolvable({ size: 4, clues: cluesOf(p.solution, 4), givens: zeros(4) })) continue;
      needed++;
      // At least one digit was needed for the full clue set, plus two distinct extras.
      expect(p.givens.filter((g) => g !== 0).length).toBeGreaterThanOrEqual(1 + EXTRA_GIVENS.easy);
    }
    expect(needed).toBeGreaterThan(10);
  });

  it('is deterministic per seed and varies between seeds', () => {
    fc.assert(
      fc.property(seedArb, fc.constantFrom(...DIFFICULTIES), (seed, difficulty) => {
        expect(generatePuzzle(seed, difficulty)).toEqual(generatePuzzle(seed, difficulty));
      }),
      { numRuns: 20 }
    );
    const different = new Set(Array.from({ length: 10 }, (_, s) => JSON.stringify(generatePuzzle(s, 'medium'))));
    expect(different.size).toBe(10);
  });

  it('is fast enough for a phone (generous bound)', () => {
    const start = performance.now();
    for (let seed = 100; seed < 110; seed++) generatePuzzle(seed, 'hard');
    expect((performance.now() - start) / 10).toBeLessThan(1500);
  });
});

describe('game state', SLOW, () => {
  it('starts with an empty grid apart from the givens', () => {
    const s = createInitialState(42);
    expect(s.difficulty).toBe(DEFAULT_DIFFICULTY);
    expect(s.size).toBe(4);
    expect(s.seed).toBe(42);
    expect(s.cells).toEqual(s.givens);
    expect(s.notes).toEqual(zeros(4));
    expect(s.pencil).toBe(false);
    expect([s.moves, s.checks, s.lastCheck]).toEqual([0, 0, null]);
    const p = generatePuzzle(42, 'easy');
    expect([s.solution, s.clues, s.givens]).toEqual([p.solution, p.clues, p.givens]);
    expect(createInitialState(1, 'hard').size).toBe(6);
    expect(createInitialState(-1, 'medium').seed).toBe(0xffff_ffff);
    expect(isSkyscrapersState(s)).toBe(true);
  });

  it('maps unknown difficulties to the default', () => {
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('bogus')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
  });

  it('sets, replaces and clears heights in open cells only', () => {
    const s0 = createInitialState(9, 'medium');
    const i = firstOpen(s0);
    const s1 = setValue(s0, i, 3);
    expect(s1.cells[i]).toBe(3);
    expect(s1.moves).toBe(1);
    expect(s0.cells[i]).toBe(0); // immutability
    expect(setValue(s1, i, 3)).toBe(s1);
    const s2 = setValue(s1, i, 5);
    expect([s2.cells[i], s2.moves]).toEqual([5, 2]);
    for (const bad of [0, 6, -1, 2.5, Number.NaN]) expect(setValue(s1, i, bad)).toBe(s1);
    for (const bad of [-1, 25, 1.5]) expect(setValue(s1, bad, 2)).toBe(s1);
    const s3 = clearCell(s2, i);
    expect([s3.cells[i], s3.moves]).toEqual([0, 3]);
    expect(clearCell(s3, i)).toBe(s3);
    expect(clearCell(s3, -1)).toBe(s3);
  });

  it('never changes given cells', () => {
    let s = createInitialState(3, 'easy');
    const g = s.givens.findIndex((v) => v !== 0);
    expect(g).toBeGreaterThanOrEqual(0);
    expect(setValue(s, g, wrongDigit(s, g))).toBe(s);
    expect(clearCell(s, g)).toBe(s);
    s = setPencil(s, true);
    expect(toggleNote(s, g, 1)).toBe(s);
  });

  it('toggles notes in empty cells and keeps them under a height', () => {
    let s = createInitialState(9, 'medium');
    const i = firstOpen(s);
    s = toggleNote(s, i, 2);
    s = toggleNote(s, i, 5);
    expect(maskDigits(s.notes[i] as number)).toEqual([2, 5]);
    expect(s.moves).toBe(2);
    s = toggleNote(s, i, 2);
    expect(maskDigits(s.notes[i] as number)).toEqual([5]);
    for (const bad of [0, 6, 1.5]) expect(toggleNote(s, i, bad)).toBe(s);
    s = setValue(s, i, 4);
    expect(s.notes[i]).toBe(1 << 5);
    expect(toggleNote(s, i, 3)).toBe(s); // no notes on filled cells
    s = clearCell(s, i); // clears the height, notes reappear
    expect([s.cells[i], s.notes[i]]).toEqual([0, 1 << 5]);
    s = clearCell(s, i); // then clears the notes
    expect([s.cells[i], s.notes[i], s.moves]).toEqual([0, 0, 6]);
  });

  it('routes number input by pencil mode', () => {
    let s = createInitialState(9, 'medium');
    const i = firstOpen(s);
    expect(setPencil(s, false)).toBe(s);
    s = setPencil(s, true);
    expect(s.pencil).toBe(true);
    expect(s.moves).toBe(0);
    s = enterDigit(s, i, 4);
    expect([s.cells[i], s.notes[i]]).toEqual([0, 1 << 4]);
    s = setPencil(s, false);
    s = enterDigit(s, i, 4);
    expect([s.cells[i], s.notes[i]]).toEqual([4, 1 << 4]);
  });

  it('counts wrong and repeated digits on check, without revealing more', () => {
    let s = createInitialState(9, 'medium');
    const n = s.size;
    const open = s.givens.map((g, i) => (g === 0 ? i : -1)).filter((i) => i >= 0);
    const a = open[0] as number;
    s = setValue(s, a, s.solution[a] as number);
    expect(check(s).lastCheck).toEqual({ wrong: 0, repeated: 0 });
    // Put the same wrong digit into two open cells of one row.
    const row = Math.floor(a / n);
    const rowOpen = open.filter((i) => Math.floor(i / n) === row && i !== a);
    if (rowOpen.length > 0) {
      const b = rowOpen[0] as number;
      s = setValue(s, b, s.solution[a] as number);
      expect(repeatedCells(s.cells, s.givens, n)).toEqual([a, b].sort((x, y) => x - y));
      expect(markedCells(s)).toEqual([]);
      const c = check(s);
      expect(c.lastCheck).toEqual({ wrong: 1, repeated: 2 });
      expect(c.checks).toBe(1);
      expect(c.moves).toBe(s.moves);
      expect(markedCells(c)).toEqual([a, b].sort((x, y) => x - y));
      const changed = clearCell(c, b);
      expect(changed.lastCheck).toBeNull();
      expect(markedCells(changed)).toEqual([]);
    }
  });

  it('marks only player digits that repeat in a row or a column', () => {
    // 3×3, givens: cell 0 = 1.
    const givens = [1, 0, 0, 0, 0, 0, 0, 0, 0];
    expect(repeatedCells([1, 1, 0, 0, 0, 0, 0, 0, 0], givens, 3)).toEqual([1]);
    expect(repeatedCells([1, 0, 0, 1, 0, 0, 0, 0, 0], givens, 3)).toEqual([3]);
    expect(repeatedCells([0, 2, 0, 0, 2, 0, 0, 0, 0], givens, 3)).toEqual([1, 4]);
    expect(repeatedCells([0, 2, 0, 0, 0, 2, 0, 0, 0], givens, 3)).toEqual([]);
    expect(repeatedCells([0, 0, 0, 3, 0, 3, 3, 0, 0], givens, 3)).toEqual([3, 5, 6]);
    expect(repeatedCells(zeros(3), givens, 3)).toEqual([]);
  });

  it('lists wrong cells and counts filled cells', () => {
    const solution = [1, 2, 2, 1];
    expect(wrongCells({ solution, cells: [0, 2, 1, 0] })).toEqual([2]);
    expect(wrongCells({ solution, cells: [2, 1, 1, 2] })).toEqual([0, 1, 2, 3]);
    expect(wrongCells({ solution, cells: [0, 0, 0, 0] })).toEqual([]);
    expect(filledCount([0, 2, 1, 0])).toBe(2);
    expect(filledCount([0, 0])).toBe(0);
  });

  it('is solved exactly when the grid equals the solution, then frozen', () => {
    const s0 = createInitialState(5, 'easy');
    expect(isSolved(s0)).toBe(false);
    const solved = solveState(s0);
    expect(isSolved(solved)).toBe(true);
    expect(solved.moves).toBe(s0.givens.filter((g) => g === 0).length);
    const i = firstOpen(s0);
    expect(setValue(solved, i, wrongDigit(solved, i))).toBe(solved);
    expect(clearCell(solved, i)).toBe(solved);
    expect(toggleNote(setPencil(solved, true), i, 1).cells).toEqual(solved.cells);
    expect(check(solved)).toBe(solved);
    const almost = setValue(s0, i, wrongDigit(s0, i));
    expect(isSolved(solveState(almost))).toBe(true); // a wrong digit can be overwritten
  });

  it('keeps every reachable state valid', () => {
    const action = fc.oneof(
      fc.record({ kind: fc.constant('set' as const), i: fc.integer({ min: 0, max: 24 }), d: fc.integer({ min: 0, max: 6 }) }),
      fc.record({ kind: fc.constant('note' as const), i: fc.integer({ min: 0, max: 24 }), d: fc.integer({ min: 0, max: 6 }) }),
      fc.record({ kind: fc.constant('clear' as const), i: fc.integer({ min: 0, max: 24 }), d: fc.constant(0) }),
      fc.record({ kind: fc.constant('check' as const), i: fc.constant(0), d: fc.constant(0) }),
      fc.record({ kind: fc.constant('pencil' as const), i: fc.constant(0), d: fc.integer({ min: 0, max: 1 }) })
    );
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 50 }), fc.array(action, { maxLength: 40 }), (seed, actions) => {
        let s = createInitialState(seed, 'medium');
        for (const a of actions) {
          const before = s;
          if (a.kind === 'set') s = setValue(s, a.i, a.d);
          else if (a.kind === 'note') s = toggleNote(s, a.i, a.d);
          else if (a.kind === 'clear') s = clearCell(s, a.i);
          else if (a.kind === 'check') s = check(s);
          else s = setPencil(s, a.d === 1);
          expect(isSkyscrapersState(clone(s))).toBe(true);
          expect(s.moves - before.moves).toBe(s.cells.join() === before.cells.join() && s.notes.join() === before.notes.join() ? 0 : 1);
          s.givens.forEach((g, i) => g !== 0 && expect(s.cells[i]).toBe(g));
        }
      }),
      { numRuns: 40 }
    );
  });
});

describe('isSkyscrapersState', SLOW, () => {
  // Built inside each test (not at collection time) so mutation testing can attribute coverage.
  let base: SkyscrapersState;
  let open: number;
  let given: number;
  beforeEach(() => {
    base = createInitialState(77, 'medium');
    open = firstOpen(base);
    given = base.givens.findIndex((g) => g !== 0);
  });
  const variants: Array<[string, () => Partial<SkyscrapersState> | Record<string, unknown>]> = [
    ['negative seed', () => ({ seed: -1 })],
    ['huge seed', () => ({ seed: 2 ** 32 })],
    ['unknown difficulty', () => ({ difficulty: 'expert' as never })],
    ['size mismatch', () => ({ size: 4 })],
    ['short solution', () => ({ solution: base.solution.slice(1) })],
    ['non-Latin solution', () => ({ solution: base.solution.map((v, i) => (i === 0 ? (base.solution[1] as number) : v)) })],
    ['solution out of range', () => ({ solution: base.solution.map((v) => v + 1) })],
    ['clues missing a side', () => ({ clues: { ...clone(base.clues), top: undefined } as never })],
    ['clue list too short', () => ({ clues: { ...clone(base.clues), left: base.clues.left.slice(1) } })],
    ['false clue', () => ({ clues: { ...clone(base.clues), right: base.clues.right.map((_, i) => (i === 0 ? (cluesOf(base.solution, 5).right[0] as number) % 5 + 1 : 0)) } })],
    ['clue out of range', () => ({ clues: { ...clone(base.clues), bottom: [9, 0, 0, 0, 0] } })],
    ['clues not a record', () => ({ clues: [] as never })],
    ['short givens', () => ({ givens: base.givens.slice(1) })],
    ['wrong given', () => ({ givens: base.givens.map((g, i) => (i === open ? wrongDigit(base, open) : g)), cells: base.cells.map((c, i) => (i === open ? wrongDigit(base, open) : c)) })],
    ['cells out of range', () => ({ cells: base.cells.map((c, i) => (i === open ? 6 : c)) })],
    ['cells not integers', () => ({ cells: base.cells.map((c, i) => (i === open ? 1.5 : c)) })],
    ['short cells', () => ({ cells: base.cells.slice(1) })],
    ['negative note', () => ({ notes: base.notes.map((m, i) => (i === 0 ? -2 : m)) })],
    ['note bit 0', () => ({ notes: base.notes.map((m, i) => (i === 0 ? 1 : m)) })],
    ['note too high', () => ({ notes: base.notes.map((m, i) => (i === 0 ? 1 << 6 : m)) })],
    ['short notes', () => ({ notes: base.notes.slice(1) })],
    ['pencil not boolean', () => ({ pencil: 1 as never })],
    ['negative moves', () => ({ moves: -1 })],
    ['huge checks', () => ({ checks: MAX_COUNTER + 1 })],
    ['fractional moves', () => ({ moves: 1.5 })],
    ['bad lastCheck', () => ({ lastCheck: { wrong: -1, repeated: 0 } })],
    ['lastCheck too large', () => ({ lastCheck: { wrong: 0, repeated: 26 } })],
    ['lastCheck missing field', () => ({ lastCheck: { wrong: 0 } as never })],
    ['lastCheck not a record', () => ({ lastCheck: 3 as never })]
  ];

  it('accepts real states, including edge values', () => {
    expect(isSkyscrapersState(clone(base))).toBe(true);
    expect(isSkyscrapersState(stateWith(base, { notes: base.notes.map(() => fullMask(5)), moves: MAX_COUNTER, checks: MAX_COUNTER }))).toBe(true);
    expect(isSkyscrapersState(stateWith(base, { lastCheck: { wrong: 25, repeated: 25 }, pencil: true }))).toBe(true);
    expect(isSkyscrapersState(stateWith(base, { clues: { top: [0, 0, 0, 0, 0], bottom: [0, 0, 0, 0, 0], left: [0, 0, 0, 0, 0], right: [0, 0, 0, 0, 0] } }))).toBe(true);
    expect(isSkyscrapersState(stateWith(base, { clues: cluesOf(base.solution, 5), seed: 0xffff_ffff }))).toBe(true);
    for (const d of DIFFICULTIES) expect(isSkyscrapersState(createInitialState(1, d))).toBe(true);
  });

  it.each(variants)('rejects %s', (_, patch) => {
    expect(isSkyscrapersState(stateWith(base, patch() as Partial<SkyscrapersState>))).toBe(false);
  });

  it('rejects malformed clue lists and non-Latin solutions on their own', () => {
    const empty = { top: [0, 0, 0, 0, 0], bottom: [0, 0, 0, 0, 0], left: [0, 0, 0, 0, 0], right: [0, 0, 0, 0, 0] };
    const blank = stateWith(base, { clues: empty, givens: zeros(5), cells: zeros(5) });
    expect(isSkyscrapersState(blank)).toBe(true);
    expect(isSkyscrapersState({ ...blank, clues: { ...empty, top: [0, 0, 0, 0] } })).toBe(false);
    expect(isSkyscrapersState({ ...blank, clues: { ...empty, bottom: [0, 0, 0, 0, 0, 0] } })).toBe(false);
    expect(isSkyscrapersState({ ...blank, clues: { ...empty, left: '00000' } })).toBe(false);
    // Rows are permutations but columns repeat: only the Latin check can reject this.
    const rowsOnly = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5];
    expect(isSkyscrapersState({ ...blank, solution: rowsOnly })).toBe(false);
  });

  it('rejects a given cell whose entry differs from the given', () => {
    if (given >= 0) expect(isSkyscrapersState(stateWith(base, { cells: base.cells.map((c, i) => (i === given ? 0 : c)) }))).toBe(false);
    const withGiven = stateWith(base, { givens: base.givens.map((g, i) => (i === open ? (base.solution[open] as number) : g)) });
    expect(isSkyscrapersState(withGiven)).toBe(false); // cell not filled with the new given
    expect(isSkyscrapersState({ ...withGiven, cells: withGiven.cells.map((c, i) => (i === open ? (base.solution[open] as number) : c)) })).toBe(true);
  });

  it('rejects missing fields and junk without throwing', () => {
    for (const key of Object.keys(base)) {
      const copy = clone(base) as unknown as Record<string, unknown>;
      delete copy[key];
      expect(isSkyscrapersState(copy), key).toBe(false);
    }
    const getterBomb = Object.defineProperty({}, 'seed', { get: () => { throw new Error('boom'); }, enumerable: true });
    expect(isSkyscrapersState(getterBomb)).toBe(false);
    fc.assert(
      fc.property(fc.anything(), (v) => {
        expect(isSkyscrapersState(v)).toBe(false);
      })
    );
  });
});
