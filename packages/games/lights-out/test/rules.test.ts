// @ts-nocheck
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { metadata } from '../src/metadata';
import {
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  GENERATION_ATTEMPTS,
  MAX_HINTS,
  MAX_PRESSES,
  PRESS_RANGE,
  SIZES,
  applyPresses,
  canUndo,
  countOn,
  createInitialState,
  currentBoard,
  emptyBoard,
  generatePuzzle,
  hintFor,
  isCell,
  isFinished,
  isLightsOutState,
  isSolved,
  minPresses,
  press,
  pressCell,
  pressMask,
  requestHint,
  restartState,
  sizeOf,
  solve,
  stateSize,
  toDifficulty,
  undo,
  type Difficulty,
  type Light,
  type LightsOutState
} from '../src/rules';

/* ---------- Independent oracle: bitmask toggling + exhaustive search ---------- */

/** Bitmask of the cells toggled by pressing `index`, computed from coordinates (not via pressMask). */
function toggleBits(size: number, index: number): number {
  const r = Math.floor(index / size);
  const c = index % size;
  let bits = 0;
  for (const [dr, dc] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    const rr = r + dr;
    const cc = c + dc;
    if (rr >= 0 && rr < size && cc >= 0 && cc < size) bits |= 1 << (rr * size + cc);
  }
  return bits;
}

const popcount = (x: number) => {
  let n = 0;
  for (let v = x; v; v &= v - 1) n++;
  return n;
};

/** For every board (as bitmask), the fewest presses that clear it, or -1 when unreachable. */
function bruteForceMinimum(size: number): Int8Array {
  const n = size * size;
  const best = new Int8Array(1 << n).fill(-1);
  const toggles = Array.from({ length: n }, (_, i) => toggleBits(size, i));
  for (let presses = 0; presses < 1 << n; presses++) {
    let board = 0;
    for (let i = 0; i < n; i++) if ((presses >> i) & 1) board ^= toggles[i]!;
    const w = popcount(presses);
    if (best[board] === -1 || w < best[board]!) best[board] = w;
  }
  return best;
}

const boardFromBits = (bits: number, n: number): Light[] => Array.from({ length: n }, (_, i) => ((bits >> i) & 1) as Light);
const pressSetToBoard = (size: number, set: readonly number[]): Light[] => applyPresses(emptyBoard(size), size, set);

const lightArb = (n: number) => fc.array(fc.constantFrom<Light>(0, 1), { minLength: n, maxLength: n });
const sizeArb = fc.integer({ min: 1, max: 7 });
const difficultyArb = fc.constantFrom<Difficulty>(...DIFFICULTIES);
const seedArb = fc.integer({ min: 0, max: 0xffff_ffff });

describe('configuration', () => {
  it('maps difficulties to 3×3, 5×5 and 7×7 in easy → hard order', () => {
    expect(DIFFICULTIES).toEqual(['easy', 'medium', 'hard']);
    expect(metadata.difficulties).toEqual(DIFFICULTIES);
    expect(SIZES).toEqual({ easy: 3, medium: 5, hard: 7 });
    expect(DIFFICULTIES.map(sizeOf)).toEqual([3, 5, 7]);
    expect(DEFAULT_DIFFICULTY).toBe('easy');
    for (const d of DIFFICULTIES) {
      const [lo, hi] = PRESS_RANGE[d];
      expect(lo).toBeGreaterThan(0);
      expect(hi).toBeGreaterThanOrEqual(lo);
      expect(hi).toBeLessThanOrEqual(sizeOf(d) ** 2);
    }
  });

  it('toDifficulty accepts known ids and falls back to the default', () => {
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('easy')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
    expect(toDifficulty('HARD')).toBe('easy');
    expect(toDifficulty(3)).toBe('easy');
  });
});

describe('board basics', () => {
  it('emptyBoard, countOn, isSolved', () => {
    expect(emptyBoard(3)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(emptyBoard(1)).toEqual([0]);
    expect(countOn([0, 1, 1, 0, 1])).toBe(3);
    expect(countOn([])).toBe(0);
    expect(isSolved([0, 0, 0])).toBe(true);
    expect(isSolved([0, 0, 1])).toBe(false);
    expect(isSolved([1, 0, 0])).toBe(false);
  });

  it('isCell checks the range and integrality', () => {
    expect(isCell(3, 0)).toBe(true);
    expect(isCell(3, 8)).toBe(true);
    expect(isCell(3, 9)).toBe(false);
    expect(isCell(3, -1)).toBe(false);
    expect(isCell(3, 1.5)).toBe(false);
    expect(isCell(3, '1')).toBe(false);
  });

  it('pressMask lists the cell and its orthogonal neighbours in ascending order', () => {
    expect(pressMask(3, 0)).toEqual([0, 1, 3]);
    expect(pressMask(3, 2)).toEqual([1, 2, 5]);
    expect(pressMask(3, 4)).toEqual([1, 3, 4, 5, 7]);
    expect(pressMask(3, 6)).toEqual([3, 6, 7]);
    expect(pressMask(3, 8)).toEqual([5, 7, 8]);
    expect(pressMask(3, 1)).toEqual([0, 1, 2, 4]);
    expect(pressMask(3, 3)).toEqual([0, 3, 4, 6]);
    expect(pressMask(3, 5)).toEqual([2, 4, 5, 8]);
    expect(pressMask(3, 7)).toEqual([4, 6, 7, 8]);
    expect(pressMask(5, 4)).toEqual([3, 4, 9]);
    expect(pressMask(5, 5)).toEqual([0, 5, 6, 10]);
    expect(pressMask(5, 12)).toEqual([7, 11, 12, 13, 17]);
    expect(pressMask(1, 0)).toEqual([0]);
  });

  it('pressMask agrees with the coordinate oracle and is symmetric', () => {
    fc.assert(
      fc.property(sizeArb, fc.nat(), fc.nat(), (size, a, b) => {
        const i = a % (size * size);
        const j = b % (size * size);
        const mask = pressMask(size, i);
        const bits = mask.reduce((acc, cell) => acc | (1 << cell), 0);
        expect(bits).toBe(toggleBits(size, i));
        expect(mask).toEqual([...mask].sort((x, y) => x - y));
        expect(mask.includes(j)).toBe(pressMask(size, j).includes(i));
      })
    );
  });

  it('press toggles exactly the masked cells and does not mutate its input', () => {
    const board = emptyBoard(3);
    expect(press(board, 3, 4)).toEqual([0, 1, 0, 1, 1, 1, 0, 1, 0]);
    expect(board).toEqual(emptyBoard(3));
    expect(press([1, 1, 0, 1, 0, 0, 0, 0, 0], 3, 0)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(applyPresses(emptyBoard(3), 3, [0, 8])).toEqual([1, 1, 0, 1, 0, 1, 0, 1, 1]);
    expect(applyPresses(emptyBoard(2), 2, [])).toEqual([0, 0, 0, 0]);
  });

  it('press rejects cells outside the board', () => {
    expect(() => press(emptyBoard(3), 3, -1)).toThrow(RangeError);
    expect(() => press(emptyBoard(3), 3, 9)).toThrow('No cell 9 on a 3×3 board');
    expect(() => press(emptyBoard(3), 3, 9)).toThrow(RangeError);
    expect(() => press(emptyBoard(3), 3, 0.5)).toThrow(RangeError);
    expect(() => press(emptyBoard(3), 3, 8)).not.toThrow();
  });
});

describe('toggle algebra (property-based)', () => {
  const caseArb = sizeArb.chain((size) => fc.tuple(fc.constant(size), lightArb(size * size), fc.nat(size * size - 1), fc.nat(size * size - 1)));

  it('pressing a cell twice is the identity', () => {
    fc.assert(
      fc.property(caseArb, ([size, board, i]) => {
        expect(press(press(board, size, i), size, i)).toEqual(board);
      })
    );
  });

  it('presses commute', () => {
    fc.assert(
      fc.property(caseArb, ([size, board, i, j]) => {
        expect(press(press(board, size, i), size, j)).toEqual(press(press(board, size, j), size, i));
      })
    );
  });

  it('only the parity of each cell’s presses matters, in any order', () => {
    fc.assert(
      fc.property(
        sizeArb.chain((size) => fc.tuple(fc.constant(size), lightArb(size * size), fc.array(fc.nat(size * size - 1), { maxLength: 30 }))),
        fc.integer(),
        ([size, board, presses], salt) => {
          const shuffled = [...presses].sort((a, b) => ((a * 31 + salt) % 7) - ((b * 31 + salt) % 7) || a - b);
          const odd = [...new Set(presses)].filter((p) => presses.filter((q) => q === p).length % 2 === 1);
          const expected = applyPresses(board, size, odd);
          expect(applyPresses(board, size, presses)).toEqual(expected);
          expect(applyPresses(board, size, shuffled)).toEqual(expected);
        }
      )
    );
  });

  it('a press changes exactly the cells in its mask', () => {
    fc.assert(
      fc.property(caseArb, ([size, board, i]) => {
        const next = press(board, size, i);
        const changed = next.flatMap((v, k) => (v !== board[k] ? [k] : []));
        expect(changed).toEqual(pressMask(size, i));
      })
    );
  });
});

describe('GF(2) solver', () => {
  it('matches brute force for every one of the 512 boards of 3×3', { timeout: 30_000 }, () => {
    const oracle = bruteForceMinimum(3);
    for (let bits = 0; bits < 512; bits++) {
      const board = boardFromBits(bits, 9);
      const solution = solve(board, 3);
      expect(oracle[bits]).toBeGreaterThanOrEqual(0); // 3×3 is fully solvable
      expect(solution).not.toBeNull();
      expect(solution!.nullity).toBe(0);
      expect(solution!.presses.length).toBe(oracle[bits]);
      expect(applyPresses(board, 3, solution!.presses)).toEqual(emptyBoard(3));
    }
  });

  it('matches brute force on 4×4 (null space of dimension 4, unsolvable boards exist)', { timeout: 30_000 }, () => {
    const oracle = bruteForceMinimum(4);
    let unsolvable = 0;
    for (let bits = 0; bits < 1 << 16; bits += 37) {
      const board = boardFromBits(bits, 16);
      const solution = solve(board, 4);
      if (oracle[bits] === -1) {
        unsolvable++;
        expect(solution).toBeNull();
        expect(minPresses(board, 4)).toBeNull();
        expect(hintFor(board, 4)).toBeNull();
      } else {
        expect(solution!.nullity).toBe(4);
        expect(solution!.presses.length).toBe(oracle[bits]);
        expect(applyPresses(board, 4, solution!.presses)).toEqual(emptyBoard(4));
      }
    }
    expect(unsolvable).toBeGreaterThan(0);
  });

  it('matches brute force on 2×2 and 1×1', () => {
    const oracle = bruteForceMinimum(2);
    for (let bits = 0; bits < 16; bits++) {
      expect(minPresses(boardFromBits(bits, 4), 2)).toBe(oracle[bits]);
    }
    expect(solve([1], 1)).toEqual({ presses: [0], nullity: 0 });
    expect(solve([0], 1)).toEqual({ presses: [], nullity: 0 });
  });

  it('returns sorted cells and an empty solution for the solved board', () => {
    expect(solve(emptyBoard(5), 5)).toEqual({ presses: [], nullity: 2 });
    expect(solve(emptyBoard(7), 7)).toEqual({ presses: [], nullity: 0 });
    expect(solve(press(emptyBoard(5), 5, 12), 5)).toEqual({ presses: [12], nullity: 2 });
    expect(solve(applyPresses(emptyBoard(3), 3, [8, 0, 4]), 3)).toEqual({ presses: [0, 4, 8], nullity: 0 });
  });

  it('rejects a board that does not match the size', () => {
    expect(() => solve(emptyBoard(3), 4)).toThrow('Board does not match size');
    expect(() => solve([0, 0], 1)).toThrow(RangeError);
    expect(() => solve([], 0)).toThrow(RangeError);
    expect(() => solve([0, 0, 0, 0], 2.5 as number)).toThrow(RangeError);
  });

  // The two independent "quiet patterns" of 5×5: pressing them changes nothing.
  const QUIET_5 = [
    [0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0],
    [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1]
  ].map((v) => v.flatMap((bit, i) => (bit ? [i] : [])));

  it('5×5 has a 2-dimensional null space: the quiet patterns leave any board unchanged', () => {
    for (const quiet of QUIET_5) expect(pressSetToBoard(5, quiet)).toEqual(emptyBoard(5));
    expect(solve(emptyBoard(5), 5)!.nullity).toBe(2);
    // A single lit corner is not solvable on 5×5.
    const corner = emptyBoard(5);
    corner[0] = 1;
    expect(solve(corner, 5)).toBeNull();
  });

  it('5×5: the solution is the minimum over all four equivalent press sets', { timeout: 30_000 }, () => {
    const [q1, q2] = QUIET_5 as [number[], number[]];
    const xor = (a: readonly number[], b: readonly number[]) => [...a.filter((x) => !b.includes(x)), ...b.filter((x) => !a.includes(x))];
    fc.assert(
      fc.property(fc.uniqueArray(fc.nat(24), { maxLength: 25 }), (set) => {
        const board = pressSetToBoard(5, set);
        const solution = solve(board, 5)!;
        const candidates = [set, xor(set, q1), xor(set, q2), xor(xor(set, q1), q2)];
        expect(solution.presses.length).toBe(Math.min(...candidates.map((c) => c.length)));
        expect(solution.presses.length).toBeLessThanOrEqual(set.length);
        expect(applyPresses(board, 5, solution.presses)).toEqual(emptyBoard(5));
      })
    );
  });

  it('5×5: ties between equally short solutions resolve deterministically to the first found', () => {
    const [q1] = QUIET_5 as [number[]];
    const half = q1.slice(0, 8);
    const other = q1.slice(8);
    // Both halves of a quiet pattern produce the same board and are equally short.
    expect(pressSetToBoard(5, half)).toEqual(pressSetToBoard(5, other));
    expect(solve(pressSetToBoard(5, half), 5)).toEqual({ presses: [1, 2, 3, 5, 7, 9, 10, 11], nullity: 2 });
  });

  it('7×7 and 3×3 are full rank: the unique solution is exactly the set of cells pressed', () => {
    fc.assert(
      fc.property(fc.constantFrom(3, 7), fc.array(fc.nat(48)), (size, raw) => {
        const set = [...new Set(raw.map((x) => x % (size * size)))].sort((a, b) => a - b);
        expect(solve(pressSetToBoard(size, set), size)).toEqual({ presses: set, nullity: 0 });
      })
    );
  });

  it('any solution it returns clears the board (random boards, sizes 1–7)', () => {
    fc.assert(
      fc.property(sizeArb.chain((size) => fc.tuple(fc.constant(size), lightArb(size * size))), ([size, board]) => {
        const solution = solve(board, size);
        if (solution) expect(isSolved(applyPresses(board, size, solution.presses))).toBe(true);
      })
    );
  });
});

describe('puzzle generation', () => {
  it('is deterministic per seed and difficulty', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, (seed, d) => {
        expect(generatePuzzle(seed, d)).toEqual(generatePuzzle(seed, d));
      }),
      { numRuns: 50 }
    );
  });

  it('always produces solvable, lit puzzles whose shortest solution lies in the difficulty range', { timeout: 30_000 }, () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, (seed, d) => {
        const size = sizeOf(d);
        const [lo, hi] = PRESS_RANGE[d];
        const { board, presses } = generatePuzzle(seed, d);
        expect(board).toHaveLength(size * size);
        expect(isSolved(board)).toBe(false);
        expect(board).toEqual(pressSetToBoard(size, presses));
        expect(new Set(presses).size).toBe(presses.length);
        expect(presses).toEqual([...presses].sort((a, b) => a - b));
        expect(presses.length).toBeGreaterThanOrEqual(lo);
        expect(presses.length).toBeLessThanOrEqual(hi);
        const solution = solve(board, size);
        expect(solution).not.toBeNull();
        expect(applyPresses(board, size, solution!.presses)).toEqual(emptyBoard(size));
        expect(solution!.presses.length).toBeLessThanOrEqual(presses.length);
        expect(solution!.presses.length).toBeGreaterThanOrEqual(lo);
      }),
      { numRuns: 300 }
    );
  });

  it('accepts the first candidate on the full-rank grids (3×3, 7×7), whose minimum equals the presses made', () => {
    fc.assert(
      fc.property(seedArb, fc.constantFrom<Difficulty>('easy', 'hard'), (seed, d) => {
        const first = generatePuzzle(seed, d, 1);
        expect(generatePuzzle(seed, d)).toEqual(first);
        expect(minPresses(first.board, sizeOf(d))).toBe(first.presses.length);
      }),
      { numRuns: 100 }
    );
  });

  it('uses the seed: different seeds give different puzzles', () => {
    for (const d of DIFFICULTIES) {
      const boards = new Set(Array.from({ length: 20 }, (_, seed) => generatePuzzle(seed, d).board.join('')));
      expect(boards.size).toBeGreaterThan(d === 'easy' ? 10 : 18);
    }
  });

  it('retries medium candidates that are too easy, up to the attempt limit', { timeout: 30_000 }, () => {
    const [lo] = PRESS_RANGE.medium;
    let seed = 0;
    while (minPresses(generatePuzzle(seed, 'medium', 1).board, 5)! >= lo) seed++;
    const single = generatePuzzle(seed, 'medium', 1);
    const full = generatePuzzle(seed, 'medium');
    expect(minPresses(full.board, 5)).toBeGreaterThanOrEqual(lo);
    expect(full.board).not.toEqual(single.board);
    expect(GENERATION_ATTEMPTS).toBeGreaterThan(1);

    // With a single attempt the (too easy) candidate is accepted as is.
    expect(minPresses(single.board, 5)).toBeLessThan(lo);
    expect(single.board).toEqual(pressSetToBoard(5, single.presses));
    expect(generatePuzzle(seed, 'medium', 2)).toEqual(full);
    expect(() => generatePuzzle(1, 'easy', 0)).toThrow('attempts must be a positive integer');
    expect(() => generatePuzzle(1, 'easy', 1.5)).toThrow(RangeError);
    expect(generatePuzzle(1, 'easy', 1)).toEqual(generatePuzzle(1, 'easy'));
  });
});

describe('game state', () => {
  it('createInitialState stores seed, difficulty and the generated board', () => {
    const state = createInitialState(42, 'medium');
    expect(state).toEqual({ seed: 42, difficulty: 'medium', start: generatePuzzle(42, 'medium').board, presses: [], hints: 0, hint: null });
    expect(createInitialState(-1).seed).toBe(0xffff_ffff);
    expect(createInitialState(5).difficulty).toBe('easy');
    expect(stateSize(state)).toBe(5);
    expect(currentBoard(state)).toEqual(state.start);
    expect(isFinished(state)).toBe(false);
    expect(canUndo(state)).toBe(false);
  });

  it('pressCell appends a press, clears the hint and leaves the input untouched', () => {
    const s0 = requestHint(createInitialState(3));
    expect(s0.hint).not.toBeNull();
    const s1 = pressCell(s0, 4);
    expect(s1.presses).toEqual([4]);
    expect(s1.hint).toBeNull();
    expect(s1.hints).toBe(1);
    expect(s0.presses).toEqual([]);
    expect(currentBoard(s1)).toEqual(press(s0.start, 3, 4));
    expect(canUndo(s1)).toBe(true);
    expect(pressCell(s1, 9)).toBe(s1);
    expect(pressCell(s1, -1)).toBe(s1);
  });

  it('undo takes back exactly the last press', () => {
    const s = pressCell(pressCell(createInitialState(8, 'hard'), 10), 20);
    const u = undo(s);
    expect(u.presses).toEqual([10]);
    expect(currentBoard(u)).toEqual(press(u.start, 7, 10));
    expect(undo(undo(u)).presses).toEqual([]);
    const fresh = createInitialState(8, 'hard');
    expect(undo(fresh)).toBe(fresh);
    const hinted = requestHint(s);
    expect(undo(hinted).hint).toBeNull();
  });

  it('a solved game accepts no further presses, undo or hints', () => {
    const state = createInitialState(11);
    const solution = solve(state.start, 3)!.presses;
    let s = state;
    for (const cell of solution) s = pressCell(s, cell);
    expect(isFinished(s)).toBe(true);
    expect(pressCell(s, 0)).toBe(s);
    expect(canUndo(s)).toBe(false);
    expect(undo(s)).toBe(s);
    expect(requestHint(s)).toBe(s);
    expect(hintFor(currentBoard(s), 3)).toBeNull();
    expect(isLightsOutState(s)).toBe(true);
  });

  it('requestHint marks a cell of a shortest solution and counts once per shown hint', () => {
    const s = createInitialState(21, 'medium');
    const h1 = requestHint(s);
    expect(h1.hints).toBe(1);
    expect(h1.hint).toBe(solve(s.start, 5)!.presses[0]);
    expect(requestHint(h1)).toBe(h1);
    const h2 = requestHint(pressCell(h1, h1.hint!));
    expect(h2.hints).toBe(2);
    expect(s.hints).toBe(0);
  });

  it('following hints solves any puzzle in exactly the minimal number of presses', { timeout: 30_000 }, () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, fc.array(fc.nat(48), { maxLength: 6 }), (seed, d, detour) => {
        const size = sizeOf(d);
        let s = createInitialState(seed, d);
        for (const cell of detour) if (!isFinished(s)) s = pressCell(s, cell % (size * size));
        const minimum = minPresses(currentBoard(s), size)!;
        let steps = 0;
        while (!isFinished(s)) {
          s = requestHint(s);
          expect(minPresses(currentBoard(pressCell(s, s.hint!)), size)).toBe(minimum - steps - 1);
          s = pressCell(s, s.hint!);
          steps++;
        }
        expect(steps).toBe(minimum);
        expect(s.hints).toBe(minimum);
        expect(isLightsOutState(s)).toBe(true);
      }),
      { numRuns: 60 }
    );
  });

  it('restartState returns to the seeded start', () => {
    const s0 = createInitialState(99, 'hard');
    const played = requestHint(pressCell(pressCell(s0, 1), 2));
    expect(restartState(played)).toEqual(s0);
  });
});

describe('isLightsOutState', () => {
  const valid = (): LightsOutState => pressCell(pressCell(createInitialState(5, 'easy'), 0), 4);
  const variant = (patch: Record<string, unknown>) => ({ ...valid(), ...patch });

  it('accepts states reached by play', { timeout: 30_000 }, () => {
    expect(isLightsOutState(valid())).toBe(true);
    expect(isLightsOutState(createInitialState(0xffff_ffff, 'hard'))).toBe(true);
    expect(isLightsOutState(requestHint(valid()))).toBe(true);
    fc.assert(
      fc.property(seedArb, difficultyArb, fc.array(fc.oneof(fc.nat(48), fc.constant(-1), fc.constant(-2))), (seed, d, actions) => {
        let s = createInitialState(seed, d);
        for (const a of actions) s = a === -1 ? undo(s) : a === -2 ? requestHint(s) : pressCell(s, a % sizeOf(d) ** 2);
        expect(isLightsOutState(JSON.parse(JSON.stringify(s)))).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects malformed fields', () => {
    const bad: Record<string, unknown>[] = [
      { seed: -1 },
      { seed: 2 ** 32 },
      { seed: 1.5 },
      { seed: '5' },
      { difficulty: 'expert' },
      { difficulty: undefined },
      { start: valid().start.slice(1) },
      { start: [...valid().start, 0] },
      { start: valid().start.map((v, i) => (i === 0 ? 2 : v)) },
      { start: valid().start.map((v, i) => (i === 0 ? true : v)) },
      { start: 'nope' },
      { presses: [9] },
      { presses: [-1] },
      { presses: [0.5] },
      { presses: 'x' },
      { presses: Array.from({ length: MAX_PRESSES + 2 }, () => 0) },
      { hints: -1 },
      { hints: 0.5 },
      { hints: MAX_HINTS + 1 },
      { hints: '1' },
      { hint: 9 },
      { hint: -1 },
      { hint: undefined },
      { hint: '0' }
    ];
    for (const patch of bad) expect(isLightsOutState(variant(patch)), JSON.stringify(patch).slice(0, 60)).toBe(false);
    expect(isLightsOutState(variant({ hints: MAX_HINTS }))).toBe(true);
    expect(isLightsOutState(variant({ hint: 8 }))).toBe(true);
    expect(isLightsOutState(variant({ hint: 0 }))).toBe(true);
    expect(isLightsOutState(variant({ presses: Array.from({ length: MAX_PRESSES }, () => 0) }))).toBe(true);
    const { hint: _hint, ...withoutHint } = valid();
    expect(isLightsOutState(withoutHint)).toBe(false);
  });

  it('rejects inconsistent states', () => {
    // An already solved start is not a puzzle.
    expect(isLightsOutState(variant({ start: emptyBoard(3), presses: [] }))).toBe(false);
    // An unsolvable 5×5 start.
    const corner = emptyBoard(5);
    corner[0] = 1;
    expect(isLightsOutState({ ...createInitialState(1, 'medium'), start: corner })).toBe(false);
    // A start whose length matches another difficulty.
    expect(isLightsOutState({ ...createInitialState(1, 'medium'), start: createInitialState(1, 'easy').start })).toBe(false);
    // Presses after the puzzle was solved.
    const s = createInitialState(2);
    const solution = solve(s.start, 3)!.presses;
    expect(isLightsOutState({ ...s, presses: solution })).toBe(true);
    expect(isLightsOutState({ ...s, presses: [...solution, 0, 0] })).toBe(false);
    // A hint on a solved board.
    expect(isLightsOutState({ ...s, presses: solution, hint: 0 })).toBe(false);
  });

  it('never throws on arbitrary data', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => isLightsOutState(value)).not.toThrow();
      })
    );
    for (const junk of [null, undefined, 0, 'x', [], {}, [[1, 2]]]) expect(isLightsOutState(junk)).toBe(false);
  });
});
