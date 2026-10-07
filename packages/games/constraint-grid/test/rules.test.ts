import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import {
  ATTRIBUTE_KINDS,
  CLUE_TYPES,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  FLOOR,
  MARK_NO,
  MARK_UNKNOWN,
  MARK_YES,
  MAX_CLUES,
  MAX_COUNTER,
  MAX_HISTORY,
  NAME_COUNT,
  PERSON,
  SHAPES,
  TYPE_WEIGHTS,
  VOCABULARY,
  assignmentOf,
  bitCount,
  candidateClues,
  candidateCount,
  cellIndex,
  cellPosition,
  check,
  clueHolds,
  confirmedCount,
  contradictions,
  createInitialState,
  cycleMark,
  floorRelation,
  generatePuzzle,
  initialCandidates,
  inverse,
  isClue,
  isComplete,
  isConstraintGridState,
  isOrdinal,
  isPermutation,
  isSolved,
  lowestBit,
  markCount,
  minimizeClues,
  nextMark,
  pairs,
  propagate,
  range,
  setAutoExclude,
  setMark,
  solve,
  toDifficulty,
  toggleUsed,
  truthTable,
  undo,
  type Clue,
  type ConstraintGridState,
  type Difficulty
} from '../src/rules';
import { oracleCount, oracleHolds, oracleSolutions, permutations } from './oracle';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** Fills in every ✓ of the solution (auto-✗ marks the rest). */
function solveState(state: ConstraintGridState): ConstraintGridState {
  const truth = truthTable(state);
  let s = state;
  truth.forEach((t, k) => {
    if (t) s = setMark(s, k, MARK_YES);
  });
  return s;
}

const ref = (cat: number, item: number) => ({ cat, item });

// A fixed 3×3 world: people 0,1,2; floors: p0→2, p1→0, p2→1; pets: p0→1, p1→2, p2→0.
const WORLD = [[0, 1, 2], [2, 0, 1], [1, 2, 0]];

describe('difficulty and shapes', () => {
  it('maps difficulties to sizes, easy → hard, defaulting to easy', () => {
    expect(DIFFICULTIES).toEqual(['easy', 'medium', 'hard']);
    expect(SHAPES).toEqual({ easy: { categories: 3, items: 3 }, medium: { categories: 3, items: 4 }, hard: { categories: 4, items: 5 } });
    expect(DEFAULT_DIFFICULTY).toBe('easy');
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('nope')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
  });

  it('has enough vocabulary for the largest puzzle', () => {
    for (const kind of ATTRIBUTE_KINDS) expect(VOCABULARY[kind].length).toBeGreaterThanOrEqual(SHAPES.hard.items);
    expect(NAME_COUNT).toBeGreaterThanOrEqual(SHAPES.hard.items);
    expect(ATTRIBUTE_KINDS.length).toBeGreaterThanOrEqual(SHAPES.hard.categories - 2);
  });

  it('weights every clue type positively', () => {
    for (const d of DIFFICULTIES) for (const type of CLUE_TYPES) expect(TYPE_WEIGHTS[d][type]).toBeGreaterThan(0);
  });
});

describe('helpers', () => {
  it('range, bitCount, lowestBit', () => {
    expect(range(0)).toEqual([]);
    expect(range(3)).toEqual([0, 1, 2]);
    expect(bitCount(0)).toBe(0);
    expect(bitCount(0b1011)).toBe(3);
    expect(bitCount(0xffffffff)).toBe(32);
    expect(bitCount(0x80000000)).toBe(1);
    expect(bitCount(0x0f0f0f0f)).toBe(16);
    fc.assert(fc.property(fc.integer({ min: 0, max: 0xffffffff }), (m) => {
      expect(bitCount(m)).toBe(m.toString(2).split('').filter((d) => d === '1').length);
    }));
    expect(lowestBit(0b1000)).toBe(3);
    expect(lowestBit(0b110)).toBe(1);
    expect(lowestBit(1)).toBe(0);
  });

  it('inverts permutations', () => {
    expect(inverse(WORLD)).toEqual([[0, 1, 2], [1, 2, 0], [2, 0, 1]]);
  });

  it('recognises permutations', () => {
    expect(isPermutation([2, 0, 1], 3)).toBe(true);
    expect(isPermutation([0, 0, 1], 3)).toBe(false);
    expect(isPermutation([0, 1], 3)).toBe(false);
    expect(isPermutation([0, 1, 3], 3)).toBe(false);
    expect(isPermutation([0, 1, -1], 3)).toBe(false);
    expect(isPermutation('012', 3)).toBe(false);
  });

  it('floor relations', () => {
    expect(floorRelation('directlyAbove', 2, 1)).toBe(true);
    expect(floorRelation('directlyAbove', 3, 1)).toBe(false);
    expect(floorRelation('directlyAbove', 1, 2)).toBe(false);
    expect(floorRelation('above', 3, 1)).toBe(true);
    expect(floorRelation('above', 1, 1)).toBe(false);
    expect(floorRelation('above', 0, 1)).toBe(false);
    expect(floorRelation('nextTo', 1, 2)).toBe(true);
    expect(floorRelation('nextTo', 2, 1)).toBe(true);
    expect(floorRelation('nextTo', 3, 1)).toBe(false);
    expect(floorRelation('nextTo', 1, 1)).toBe(false);
    expect(floorRelation('same', 1, 1)).toBe(false);
    expect(isOrdinal('nextTo')).toBe(true);
    expect(isOrdinal('above')).toBe(true);
    expect(isOrdinal('directlyAbove')).toBe(true);
    expect(isOrdinal('same')).toBe(false);
    expect(isOrdinal('eitherOr')).toBe(false);
  });

  it('pairs, cell indices and positions round-trip', () => {
    expect(pairs(3)).toEqual([[0, 1], [0, 2], [1, 2]]);
    expect(pairs(4)).toEqual([[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]);
    expect(markCount(3, 3)).toBe(27);
    expect(markCount(4, 5)).toBe(150);
    expect(cellIndex(3, 3, 0, 2, 1, 2)).toBe(9 + 3 + 2);
    expect(cellIndex(3, 3, 2, 0, 0, 0)).toBe(-1);
    expect(cellIndex(3, 3, 0, 1, 3, 0)).toBe(-1);
    expect(cellIndex(3, 3, 0, 1, 0, -1)).toBe(-1);
    for (let k = 0; k < markCount(4, 5); k++) {
      const { a, b, i, j, block } = cellPosition(4, 5, k);
      expect(cellIndex(4, 5, a, b, i, j)).toBe(k);
      expect(block).toBe(Math.floor(k / 25));
    }
  });

  it('truth table marks exactly one cell per row and column of each block', () => {
    const truth = truthTable({ size: 3, solution: WORLD });
    // Block 0 (names × floors): person i has floor WORLD[1][i].
    expect(truth.slice(0, 9)).toEqual([false, false, true, true, false, false, false, true, false]);
    // Block 2 (floors × pets): floor 0 is person 1, who has pet 2.
    expect(truth[18 + 0 * 3 + 2]).toBe(true);
    expect(truth.filter(Boolean)).toHaveLength(9);
  });

  it('cycles marks empty → ✗ → ✓ → empty', () => {
    expect(nextMark(MARK_UNKNOWN)).toBe(MARK_NO);
    expect(nextMark(MARK_NO)).toBe(MARK_YES);
    expect(nextMark(MARK_YES)).toBe(MARK_UNKNOWN);
  });
});

describe('clue semantics', () => {
  it('evaluates each type on a fixed world', () => {
    // person 0: floor 2, pet 1; person 1: floor 0, pet 2; person 2: floor 1, pet 0.
    const cases: [Clue, boolean][] = [
      [{ type: 'same', a: ref(0, 0), b: ref(1, 2) }, true],
      [{ type: 'same', a: ref(0, 0), b: ref(1, 1) }, false],
      [{ type: 'same', a: ref(1, 0), b: ref(2, 2) }, true],
      [{ type: 'notSame', a: ref(0, 0), b: ref(2, 2) }, true],
      [{ type: 'notSame', a: ref(0, 1), b: ref(2, 2) }, false],
      [{ type: 'directlyAbove', a: ref(0, 0), b: ref(0, 2) }, true],
      [{ type: 'directlyAbove', a: ref(0, 0), b: ref(0, 1) }, false],
      [{ type: 'directlyAbove', a: ref(2, 0), b: ref(2, 2) }, true],
      [{ type: 'above', a: ref(0, 0), b: ref(0, 1) }, true],
      [{ type: 'above', a: ref(0, 1), b: ref(0, 0) }, false],
      [{ type: 'above', a: ref(0, 0), b: ref(2, 1) }, false],
      [{ type: 'nextTo', a: ref(0, 1), b: ref(0, 2) }, true],
      [{ type: 'nextTo', a: ref(0, 2), b: ref(0, 1) }, true],
      [{ type: 'nextTo', a: ref(0, 0), b: ref(0, 1) }, false],
      [{ type: 'eitherOr', a: ref(0, 0), b: ref(2, 0), c: ref(2, 1) }, true],
      [{ type: 'eitherOr', a: ref(0, 0), b: ref(2, 1), c: ref(2, 2) }, true],
      [{ type: 'eitherOr', a: ref(0, 0), b: ref(2, 0), c: ref(2, 2) }, false]
    ];
    for (const [clue, expected] of cases) {
      expect(clueHolds(clue, WORLD), JSON.stringify(clue)).toBe(expected);
      expect(oracleHolds(clue, WORLD), JSON.stringify(clue)).toBe(expected);
    }
  });

  it('candidate clues are all true (checked by the oracle) and complete per type', () => {
    for (const d of DIFFICULTIES) {
      const { categories, items } = SHAPES[d];
      const rng = createRng(5);
      const solution = [range(items), ...range(categories - 1).map(() => rng.shuffle(range(items)))];
      const pool = candidateClues(solution);
      for (const type of CLUE_TYPES) {
        expect(pool[type].length, `${d} ${type}`).toBeGreaterThan(0);
        for (const clue of pool[type]) {
          expect(clue.type).toBe(type);
          expect(oracleHolds(clue, solution)).toBe(true);
          expect(isClue(clue, categories, items)).toBe(true);
        }
      }
      // Every pair of items from different categories appears as exactly one same/notSame clue.
      const pairCount = (categories * (categories - 1)) / 2;
      expect(pool.same.length).toBe(pairCount * items);
      expect(pool.same.length + pool.notSame.length).toBe(pairCount * items * items);
      // Every true either-or: each ref × other category × wrong item.
      expect(pool.eitherOr.length).toBe(categories * items * (categories - 1) * (items - 1));
      // Ordinal clues never name a floor; "above" covers both directions of every pair once.
      for (const type of ['directlyAbove', 'above', 'nextTo'] as const) {
        for (const clue of pool[type]) expect(clue.a.cat !== FLOOR && clue.b.cat !== FLOOR).toBe(true);
      }
      const nonFloorRefs = (categories - 1) * items;
      const differentPeople = nonFloorRefs * (nonFloorRefs - (categories - 1));
      expect(pool.above.length).toBe(differentPeople / 2);
      expect(pool.nextTo.length).toBe(((categories - 1) ** 2 * (items - 1) * 2) / 2);
      expect(pool.directlyAbove.length).toBe((categories - 1) ** 2 * (items - 1));
    }
  });

  it('either-or clues list the two options in item order within one other category', () => {
    for (const clue of candidateClues(WORLD).eitherOr) {
      if (clue.type !== 'eitherOr') throw new Error('type');
      expect(clue.b.cat).toBe(clue.c.cat);
      expect(clue.b.cat).not.toBe(clue.a.cat);
      expect(clue.b.item).toBeLessThan(clue.c.item);
    }
  });
});

describe('oracle self-check', () => {
  it('enumerates permutations', () => {
    expect(permutations(3)).toEqual([[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]);
    expect(permutations(5)).toHaveLength(120);
  });

  it('counts all assignments without clues and exactly one with all "same" clues', () => {
    expect(oracleCount(3, 3, [], 100)).toBe(36);
    expect(oracleCount(3, 3, candidateClues(WORLD).same)).toBe(1);
    expect(oracleSolutions(3, 3, candidateClues(WORLD).same)[0]).toEqual(WORLD);
  });
});

describe('solver', () => {
  it('starts open with names fixed', () => {
    expect(initialCandidates(3, 3)).toEqual([[1, 2, 4], [7, 7, 7], [7, 7, 7]]);
    const r = solve(3, 3, []);
    expect(r.status).toBe('stuck');
    expect(candidateCount(r.candidates)).toBe(3 + 9 + 9);
  });

  it('solves the world from all "same" clues and reads the assignment', () => {
    const r = solve(3, 3, candidateClues(WORLD).same);
    expect(r.status).toBe('solved');
    expect(isComplete(r.candidates)).toBe(true);
    expect(assignmentOf(r.candidates)).toEqual(WORLD);
  });

  it('uses each rule: same, notSame, ordinal, nextTo, eitherOr', () => {
    // same(person 0, floor 2) fixes floor of 0 and removes floor 2 elsewhere.
    let r = solve(3, 3, [{ type: 'same', a: ref(0, 0), b: ref(1, 2) }]);
    expect(r.candidates[1]).toEqual([4, 3, 3]);
    // same between two attributes: pet 1 ⇔ floor 2, with floor 2 only possible for person 0.
    r = solve(3, 3, [{ type: 'same', a: ref(0, 0), b: ref(1, 2) }, { type: 'same', a: ref(1, 2), b: ref(2, 1) }]);
    expect(r.candidates[2]).toEqual([2, 5, 5]);
    // notSame with a certain person removes the item.
    r = solve(3, 3, [{ type: 'notSame', a: ref(0, 1), b: ref(2, 0) }]);
    expect(r.candidates[2]).toEqual([7, 6, 7]);
    r = solve(3, 3, [{ type: 'notSame', a: ref(2, 0), b: ref(0, 2) }]);
    expect(r.candidates[2]).toEqual([7, 7, 6]);
    // notSame between attributes after the first becomes certain.
    r = solve(3, 3, [{ type: 'same', a: ref(0, 0), b: ref(1, 2) }, { type: 'notSame', a: ref(1, 2), b: ref(2, 0) }]);
    expect(r.candidates[2]).toEqual([6, 7, 7]);
    r = solve(3, 3, [{ type: 'same', a: ref(0, 0), b: ref(1, 2) }, { type: 'notSame', a: ref(2, 0), b: ref(1, 2) }]);
    expect(r.candidates[2]).toEqual([6, 7, 7]);
    // directlyAbove(person 0, person 1): 0 not on floor 0, 1 not on top floor.
    r = solve(3, 3, [{ type: 'directlyAbove', a: ref(0, 0), b: ref(0, 1) }]);
    expect(r.candidates[1]).toEqual([6, 3, 7]);
    // above with three people in a chain fixes everything.
    r = solve(3, 3, [{ type: 'above', a: ref(0, 0), b: ref(0, 2) }, { type: 'above', a: ref(0, 2), b: ref(0, 1) }]);
    expect(r.status).toBe('stuck');
    expect(r.candidates[1]).toEqual([4, 1, 2]);
    // nextTo with one person on the bottom floor forces the other onto floor index 1 (the middle).
    r = solve(3, 3, [{ type: 'same', a: ref(0, 0), b: ref(1, 0) }, { type: 'nextTo', a: ref(0, 0), b: ref(0, 1) }]);
    expect(r.candidates[1]).toEqual([1, 2, 4]);
    r = solve(3, 3, [{ type: 'same', a: ref(0, 1), b: ref(1, 0) }, { type: 'nextTo', a: ref(0, 0), b: ref(0, 1) }]);
    expect(r.candidates[1]).toEqual([2, 1, 4]);
    // An attribute that must be on the bottom floor cannot be "above" anyone.
    r = solve(3, 3, [{ type: 'above', a: ref(2, 0), b: ref(0, 0) }]);
    expect(r.candidates[2]?.[0]).toBe(6);
    r = solve(3, 3, [{ type: 'above', a: ref(0, 0), b: ref(2, 1) }]);
    expect(r.candidates[2]?.[0]).toBe(5);
    expect(r.candidates[1]?.[0]).toBe(6);
    // eitherOr with the subject certain restricts to the two options.
    r = solve(3, 3, [{ type: 'eitherOr', a: ref(0, 0), b: ref(2, 0), c: ref(2, 1) }]);
    expect(r.candidates[2]?.[0]).toBe(3);
    // eitherOr where one option is impossible acts like "same" with the other.
    r = solve(3, 3, [{ type: 'notSame', a: ref(0, 0), b: ref(2, 0) }, { type: 'eitherOr', a: ref(0, 0), b: ref(2, 0), c: ref(2, 1) }]);
    expect(r.candidates[2]).toEqual([2, 5, 5]);
    r = solve(3, 3, [{ type: 'notSame', a: ref(0, 0), b: ref(2, 1) }, { type: 'eitherOr', a: ref(0, 0), b: ref(2, 0), c: ref(2, 1) }]);
    expect(r.candidates[2]).toEqual([1, 6, 6]);
    // eitherOr subject that is an attribute: a person who can be neither option cannot be the subject.
    r = solve(3, 3, [{ type: 'same', a: ref(0, 2), b: ref(2, 2) }, { type: 'eitherOr', a: ref(1, 0), b: ref(0, 0), c: ref(0, 1) }]);
    expect(r.candidates[1]?.[2]).toBe(6);
    // eitherOr with options across names: subject certain person 2 who is neither → contradiction.
    expect(solve(3, 3, [{ type: 'eitherOr', a: ref(0, 2), b: ref(0, 0), c: ref(0, 1) }]).status).toBe('contradiction');
  });

  it('eitherOr between a certain person and one impossible option assigns the other', () => {
    const r = solve(3, 3, [
      { type: 'same', a: ref(0, 1), b: ref(1, 0) },
      { type: 'eitherOr', a: ref(0, 0), b: ref(1, 0), c: ref(1, 2) }
    ]);
    expect(r.candidates[1]).toEqual([4, 1, 2]);
    const s = solve(3, 3, [
      { type: 'same', a: ref(0, 1), b: ref(1, 2) },
      { type: 'eitherOr', a: ref(0, 0), b: ref(1, 0), c: ref(1, 2) }
    ]);
    expect(s.candidates[1]).toEqual([1, 4, 2]);
  });

  it('detects contradictions', () => {
    expect(solve(3, 3, [{ type: 'same', a: ref(0, 0), b: ref(1, 0) }, { type: 'notSame', a: ref(0, 0), b: ref(1, 0) }]).status).toBe('contradiction');
    expect(solve(3, 3, [{ type: 'same', a: ref(0, 0), b: ref(1, 0) }, { type: 'same', a: ref(0, 1), b: ref(1, 0) }]).status).toBe('contradiction');
    expect(solve(3, 3, [{ type: 'directlyAbove', a: ref(0, 0), b: ref(0, 1) }, { type: 'directlyAbove', a: ref(0, 1), b: ref(0, 0) }]).status).toBe('contradiction');
    expect(solve(3, 3, [{ type: 'above', a: ref(0, 0), b: ref(0, 0) }]).status).toBe('contradiction');
    expect(solve(3, 3, [{ type: 'same', a: ref(0, 0), b: ref(2, 0) }, { type: 'nextTo', a: ref(0, 0), b: ref(2, 0) }]).status).toBe('contradiction');
    expect(solve(3, 3, [
      { type: 'notSame', a: ref(0, 0), b: ref(2, 0) },
      { type: 'notSame', a: ref(0, 0), b: ref(2, 1) },
      { type: 'eitherOr', a: ref(0, 0), b: ref(2, 0), c: ref(2, 1) }
    ]).status).toBe('contradiction');
    // A permutation hole: nobody can hold floor 0.
    expect(solve(3, 3, [
      { type: 'notSame', a: ref(0, 0), b: ref(1, 0) },
      { type: 'notSame', a: ref(0, 1), b: ref(1, 0) },
      { type: 'notSame', a: ref(0, 2), b: ref(1, 0) }
    ]).status).toBe('contradiction');
    const cands = initialCandidates(3, 3);
    expect(propagate(cands, 3, [{ type: 'same', a: ref(0, 0), b: ref(0, 1) } as Clue])).toBe(false);
  });

  it('does not mutate a given start', () => {
    const start = initialCandidates(3, 3);
    solve(3, 3, candidateClues(WORLD).same, start);
    expect(start).toEqual(initialCandidates(3, 3));
  });

  it('is sound: never removes the true item for any subset of true clues (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom<Difficulty>(...DIFFICULTIES), fc.array(fc.nat(), { maxLength: 14 }), (seed, d, picks) => {
        const { categories, items } = SHAPES[d];
        const rng = createRng(seed);
        const solution = [range(items), ...range(categories - 1).map(() => rng.shuffle(range(items)))];
        const pool = Object.values(candidateClues(solution)).flat();
        const clues = picks.map((k) => pool[k % pool.length] as Clue);
        const r = solve(categories, items, clues);
        expect(r.status).not.toBe('contradiction');
        for (let c = 0; c < categories; c++) {
          for (let p = 0; p < items; p++) expect(((r.candidates[c]?.[p] ?? 0) >> (solution[c]?.[p] ?? 0)) & 1).toBe(1);
        }
        if (r.status === 'solved') expect(assignmentOf(r.candidates)).toEqual(solution);
      }),
      { numRuns: 300 }
    );
  });

  it('agrees with the oracle: whenever it solves, there is exactly one assignment (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.array(fc.nat(), { minLength: 1, maxLength: 8 }), (seed, picks) => {
        const rng = createRng(seed);
        const solution = [range(4), rng.shuffle(range(4)), rng.shuffle(range(4))];
        const pool = Object.values(candidateClues(solution)).flat();
        const clues = picks.map((k) => pool[k % pool.length] as Clue);
        const r = solve(3, 4, clues);
        const count = oracleCount(3, 4, clues, 2);
        expect(count).toBeGreaterThanOrEqual(1);
        if (r.status === 'solved') expect(count).toBe(1);
      }),
      { numRuns: 150 }
    );
  });
});

describe('generation', { timeout: 120_000 }, () => {
  const seeds = (n: number, salt: number) => range(n).map((i) => (i * 2654435761 + salt) >>> 0);

  for (const d of DIFFICULTIES) {
    it(`${d}: unique solution (oracle), all clues true, every clue needed by the solver`, () => {
      const { categories, items } = SHAPES[d];
      for (const seed of seeds(d === 'hard' ? 25 : 60, 17)) {
        const p = generatePuzzle(seed, d);
        expect(p.size).toBe(items);
        expect(p.kinds).toHaveLength(categories);
        expect(p.kinds.slice(0, 2)).toEqual(['person', 'floor']);
        expect(new Set(p.kinds).size).toBe(categories);
        expect(p.solution[PERSON]).toEqual(range(items));
        for (const perm of p.solution) expect(isPermutation(perm, items)).toBe(true);
        expect(p.vocab[FLOOR]).toEqual(range(items));
        for (const row of p.vocab) {
          expect(row).toHaveLength(items);
          expect([...row].sort((x, y) => x - y)).toEqual(row);
          expect(new Set(row).size).toBe(items);
        }
        for (const clue of p.clues) {
          expect(oracleHolds(clue, p.solution), JSON.stringify(clue)).toBe(true);
          expect(isClue(clue, categories, items)).toBe(true);
        }
        const solutions = oracleSolutions(categories, items, p.clues, 2);
        expect(solutions).toHaveLength(1);
        expect(solutions[0]).toEqual(p.solution);
        const solved = solve(categories, items, p.clues);
        expect(solved.status).toBe('solved');
        expect(assignmentOf(solved.candidates)).toEqual(p.solution);
        for (const clue of p.clues) {
          expect(solve(categories, items, p.clues.filter((k) => k !== clue)).status).not.toBe('solved');
        }
      }
    });
  }

  it('is deterministic per seed and varies between seeds', () => {
    for (const d of DIFFICULTIES) {
      expect(generatePuzzle(99, d)).toEqual(generatePuzzle(99, d));
      const distinct = new Set(seeds(8, 3).map((s) => JSON.stringify(generatePuzzle(s, d).clues)));
      expect(distinct.size).toBeGreaterThan(5);
    }
    expect(generatePuzzle(4)).toEqual(generatePuzzle(4, 'easy'));
  });

  it('produces a varied mix of clue types and attribute categories', () => {
    const types = new Set<string>();
    const kinds = new Set<string>();
    for (const s of seeds(30, 5)) {
      const p = generatePuzzle(s, 'hard');
      for (const c of p.clues) types.add(c.type);
      for (const k of p.kinds) kinds.add(k);
    }
    expect([...types].sort()).toEqual([...CLUE_TYPES].sort());
    expect([...kinds].sort()).toEqual(['colour', 'drink', 'floor', 'person', 'pet']);
  });

  it('keeps clue counts reasonable per difficulty', () => {
    for (const d of DIFFICULTIES) {
      const counts = seeds(30, 9).map((s) => generatePuzzle(s, d).clues.length);
      expect(Math.min(...counts)).toBeGreaterThanOrEqual(2);
      expect(Math.max(...counts)).toBeLessThanOrEqual(d === 'hard' ? 20 : 10);
    }
  });

  it('is fast enough for phones (generous bound for slow CI)', () => {
    const start = performance.now();
    for (const s of seeds(20, 1)) generatePuzzle(s, 'hard');
    expect((performance.now() - start) / 20).toBeLessThan(250);
  });

  it('minimizeClues keeps a solvable set and drops redundant duplicates', () => {
    const same = candidateClues(WORLD).same;
    const kept = minimizeClues(createRng(1), 3, 3, [...same, ...same]);
    expect(solve(3, 3, kept).status).toBe('solved');
    expect(kept.length).toBeLessThanOrEqual(4);
  });
});

describe('marks', () => {
  const fresh = (seed = 21, d: Difficulty = 'easy', auto = true) => createInitialState(seed, d, auto);

  it('creates an unmarked initial state', () => {
    const s = fresh();
    expect(s.seed).toBe(21);
    expect(s.difficulty).toBe('easy');
    expect(s.marks).toHaveLength(27);
    expect(s.marks.every((m) => m === MARK_UNKNOWN)).toBe(true);
    expect(s.used).toEqual(s.clues.map(() => false));
    expect(s.autoExclude).toBe(true);
    expect(s.history).toEqual([]);
    expect(s.moves).toBe(0);
    expect(s.checks).toBe(0);
    expect(s.lastCheck).toBeNull();
    expect(createInitialState(-1).seed).toBe(0xffffffff);
    expect(fresh(1, 'easy', false).autoExclude).toBe(false);
    expect(createInitialState(3).difficulty).toBe('easy');
    expect(isConstraintGridState(s)).toBe(true);
  });

  it('cycles a cell and records moves and history', () => {
    let s = fresh(21, 'easy', false);
    s = cycleMark(s, 4);
    expect(s.marks[4]).toBe(MARK_NO);
    s = cycleMark(s, 4);
    expect(s.marks[4]).toBe(MARK_YES);
    expect(s.marks.filter((m) => m !== MARK_UNKNOWN)).toHaveLength(1);
    s = cycleMark(s, 4);
    expect(s.marks[4]).toBe(MARK_UNKNOWN);
    expect(s.moves).toBe(3);
    expect(s.history).toEqual([[4, MARK_UNKNOWN], [4, MARK_NO], [4, MARK_YES]]);
  });

  it('auto-✗ marks the open cells of the row and column within the block only', () => {
    let s = fresh();
    s = setMark(s, 9 + 3 + 0, MARK_YES); // block 1, row 1, column 0 → set some other cell first
    s = undo(s);
    s = setMark(s, 9 + 0 + 2, MARK_YES); // block 1 cell (0,2) ✓ pre-existing in row 0
    s = setMark(s, 9 + 3 + 1, MARK_YES); // block 1 cell (1,1)
    const block = s.marks.slice(9, 18);
    expect(block).toEqual([
      MARK_NO, MARK_NO, MARK_YES,
      MARK_NO, MARK_YES, MARK_NO,
      MARK_UNKNOWN, MARK_NO, MARK_NO
    ]);
    expect(s.marks.slice(0, 9).every((m) => m === MARK_UNKNOWN)).toBe(true);
    expect(s.marks.slice(18).every((m) => m === MARK_UNKNOWN)).toBe(true);
    expect(s.moves).toBe(3); // undo does not count as a move
    // Undo restores exactly the marks of the last action, including the auto marks.
    const back = undo(s);
    expect(back.marks.slice(9, 18)).toEqual([MARK_NO, MARK_NO, MARK_YES, MARK_UNKNOWN, MARK_UNKNOWN, MARK_NO, MARK_UNKNOWN, MARK_UNKNOWN, MARK_NO]);
    expect(back.history).toHaveLength(s.history.length - 1);
    expect(back.moves).toBe(s.moves);
  });

  it('auto-✗ never overwrites existing marks and is off when disabled', () => {
    let s = fresh();
    s = setMark(s, 1, MARK_YES);
    s = setMark(s, 3, MARK_YES); // conflicts in column 0? no: (1,0); row 1 and column 0
    expect(s.marks[1]).toBe(MARK_YES);
    expect(s.marks[0]).toBe(MARK_NO);
    const off = setMark(setAutoExclude(fresh(), false), 4, MARK_YES);
    expect(off.marks.filter((m) => m !== MARK_UNKNOWN)).toHaveLength(1);
    // ✗ placement never triggers auto marks.
    const no = setMark(fresh(), 4, MARK_NO);
    expect(no.marks.filter((m) => m !== MARK_UNKNOWN)).toHaveLength(1);
  });

  it('ignores invalid or no-op changes', () => {
    const s = fresh();
    expect(setMark(s, -1, MARK_YES)).toBe(s);
    expect(setMark(s, s.marks.length, MARK_YES)).toBe(s);
    expect(setMark(s, 0, 3)).toBe(s);
    expect(setMark(s, 0, -1)).toBe(s);
    expect(setMark(s, 0, MARK_UNKNOWN)).toBe(s);
    expect(setMark(s, 1.5, MARK_YES)).toBe(s);
    expect(undo(s)).toBe(s);
    expect(toggleUsed(s, -1)).toBe(s);
    expect(toggleUsed(s, s.clues.length)).toBe(s);
    expect(setAutoExclude(s, true)).toBe(s);
  });

  it('caps the undo history', () => {
    let s = fresh(2, 'hard', false);
    for (let k = 0; k < MAX_HISTORY + 5; k++) s = cycleMark(s, k % 150);
    expect(s.history).toHaveLength(MAX_HISTORY);
    expect(s.moves).toBe(MAX_HISTORY + 5);
    expect(s.history[0]).toEqual([5, MARK_UNKNOWN]);
  });

  it('a change clears the last check result; undo too', () => {
    const s = check(cycleMark(fresh(), 0));
    expect(s.lastCheck).not.toBeNull();
    expect(cycleMark(s, 1).lastCheck).toBeNull();
    expect(undo(s).lastCheck).toBeNull();
  });

  it('toggles used clues and the auto-✗ option', () => {
    let s = toggleUsed(fresh(), 0);
    expect(s.used[0]).toBe(true);
    s = toggleUsed(s, 0);
    expect(s.used[0]).toBe(false);
    expect(setAutoExclude(fresh(), false).autoExclude).toBe(false);
  });

  it('check counts contradictions without revealing which', () => {
    const s = fresh(8);
    const truth = truthTable(s);
    const t = truth.indexOf(true);
    const f = truth.indexOf(false);
    expect(contradictions(s)).toBe(0);
    let x = setMark(setAutoExclude(s, false), t, MARK_NO); // ✗ on a true cell
    x = setMark(x, f, MARK_YES); // ✓ on a false cell
    x = setMark(x, truth.indexOf(true, t + 1), MARK_YES); // correct ✓
    x = setMark(x, truth.indexOf(false, f + 1), MARK_NO); // correct ✗
    expect(contradictions(x)).toBe(2);
    const checked = check(x);
    expect(checked.lastCheck).toBe(2);
    expect(checked.checks).toBe(1);
    expect(check(checked).checks).toBe(2);
    expect(check(s).lastCheck).toBe(0);
  });

  it('is solved exactly when the ✓ marks equal the solution', () => {
    for (const d of DIFFICULTIES) {
      const s = fresh(31, d);
      expect(isSolved(s)).toBe(false);
      const done = solveState(s);
      expect(isSolved(done)).toBe(true);
      expect(confirmedCount(done.marks)).toBe(pairs(SHAPES[d].categories).length * SHAPES[d].items);
      expect(contradictions(done)).toBe(0);
      // Solved boards are read-only.
      expect(setMark(done, 0, MARK_UNKNOWN)).toBe(done);
      expect(undo(done)).toBe(done);
      expect(check(done)).toBe(done);
      // One missing ✓ is not solved; one extra ✓ is not solved either.
      const truth = truthTable(s);
      const missing = { ...done, marks: done.marks.map((m, k) => (k === truth.indexOf(true) ? MARK_NO : m)) };
      expect(isSolved(missing)).toBe(false);
      const extra = { ...done, marks: done.marks.map((m, k) => (k === truth.indexOf(false) ? MARK_YES : m)) };
      expect(isSolved(extra)).toBe(false);
    }
    expect(isSolved({ size: 3, solution: WORLD, marks: [] })).toBe(false);
  });

  it('✗ marks do not matter for the win; unknown false cells are fine', () => {
    const s = fresh(12, 'easy', false);
    const truth = truthTable(s);
    let x = s;
    truth.forEach((t, k) => {
      if (t) x = setMark(x, k, MARK_YES);
    });
    expect(isSolved(x)).toBe(true);
    expect(x.marks.filter((m) => m === MARK_NO)).toHaveLength(0);
  });

  it('confirmedCount counts ✓ only', () => {
    expect(confirmedCount([0, 1, 2, 2, 1])).toBe(2);
  });
});

describe('isConstraintGridState', () => {
  const base = () => cycleMark(toggleUsed(createInitialState(77, 'medium'), 1), 5);

  it('accepts real states of every difficulty, also mid-game and solved', () => {
    for (const d of DIFFICULTIES) {
      const s = createInitialState(13, d);
      expect(isConstraintGridState(clone(s))).toBe(true);
      expect(isConstraintGridState(clone(check(solveState(s))))).toBe(true);
    }
    expect(isConstraintGridState(clone(check(base())))).toBe(true);
  });

  const corruptions: [string, (s: Record<string, unknown>) => void][] = [
    ['seed', (s) => (s.seed = -1)],
    ['seed float', (s) => (s.seed = 1.5)],
    ['difficulty', (s) => (s.difficulty = 'extreme')],
    ['size', (s) => (s.size = 3)],
    ['kinds length', (s) => (s.kinds = ['person', 'floor'])],
    ['kinds order', (s) => (s.kinds = ['floor', 'person', 'pet'])],
    ['kinds second', (s) => (s.kinds = ['person', 'pet', 'drink'])],
    ['kinds unknown', (s) => (s.kinds = ['person', 'floor', 'car'])],
    ['kinds not array', (s) => (s.kinds = 'person')],
    ['vocab rows', (s) => (s.vocab = (s.vocab as number[][]).slice(1))],
    ['vocab not array', (s) => (s.vocab = {})],
    ['vocab floor', (s) => ((s.vocab as number[][])[1] = [1, 0, 2, 3])],
    ['vocab duplicate', (s) => ((s.vocab as number[][])[0] = [0, 0, 1, 2])],
    ['vocab name range', (s) => ((s.vocab as number[][])[0] = [0, 1, 2, NAME_COUNT])],
    ['vocab attr range', (s) => ((s.vocab as number[][])[2] = [0, 1, 2, 6])],
    ['vocab row short', (s) => ((s.vocab as number[][])[2] = [0, 1, 2])],
    ['vocab row not array', (s) => ((s.vocab as unknown[])[2] = 5)],
    ['solution length', (s) => (s.solution = (s.solution as number[][]).slice(1))],
    ['solution not perm', (s) => ((s.solution as number[][])[2] = [0, 0, 1, 2])],
    ['solution persons', (s) => ((s.solution as number[][])[0] = [1, 0, 2, 3])],
    ['solution not array', (s) => (s.solution = null)],
    ['clues empty', (s) => ((s.clues = []), (s.used = []))],
    ['clues not array', (s) => (s.clues = {})],
    ['clues too many', (s) => {
      const c = s.clues as unknown[];
      s.clues = range(MAX_CLUES + 1).map((k) => c[k % c.length]);
      s.used = (s.clues as unknown[]).map(() => false);
    }],
    ['clue false', (s) => ((s.clues as Clue[])[0] = negate((s.clues as Clue[])[0] as Clue, s.solution as number[][]))],
    ['clue type', (s) => ((s.clues as Record<string, unknown>[])[0]!.type = 'maybe')],
    ['clue ref', (s) => ((s.clues as Record<string, unknown>[])[0]!.a = { cat: 9, item: 0 })],
    ['used length', (s) => (s.used = [true])],
    ['used type', (s) => ((s.used as unknown[])[0] = 1)],
    ['marks length', (s) => (s.marks = (s.marks as number[]).slice(1))],
    ['marks value', (s) => ((s.marks as number[])[0] = 3)],
    ['marks not array', (s) => (s.marks = 'x')],
    ['autoExclude', (s) => (s.autoExclude = 'yes')],
    ['history not array', (s) => (s.history = {})],
    ['history odd entry', (s) => (s.history = [[1]])],
    ['history empty entry', (s) => (s.history = [[]])],
    ['history cell', (s) => (s.history = [[999, 0]])],
    ['history mark', (s) => (s.history = [[0, 3]])],
    ['history entry not array', (s) => (s.history = [5])],
    ['history too long', (s) => (s.history = range(MAX_HISTORY + 1).map(() => [0, 0]))],
    ['moves', (s) => (s.moves = -1)],
    ['moves huge', (s) => (s.moves = MAX_COUNTER + 1)],
    ['checks', (s) => (s.checks = 'a')],
    ['lastCheck', (s) => (s.lastCheck = -1)],
    ['lastCheck big', (s) => (s.lastCheck = 1000)],
    ['lastCheck type', (s) => (s.lastCheck = '1')]
  ];

  function negate(clue: Clue, solution: number[][]): Clue {
    const pool = candidateClues(solution).notSame[0] as Clue;
    return clue.type === 'same' || clue.type === 'eitherOr' || clue.type === 'notSame'
      ? { type: 'same', a: pool.a, b: pool.b }
      : { type: clue.type, a: clue.b, b: clue.a };
  }

  for (const [name, corrupt] of corruptions) {
    it(`rejects corrupted ${name}`, () => {
      const s = clone(base()) as unknown as Record<string, unknown>;
      expect(isConstraintGridState(s)).toBe(true);
      corrupt(s);
      expect(isConstraintGridState(s)).toBe(false);
    });
  }

  it('accepts boundary values', () => {
    const s = clone(base());
    expect(isConstraintGridState({ ...s, lastCheck: markCount(3, 4) })).toBe(true);
    expect(isConstraintGridState({ ...s, lastCheck: 0 })).toBe(true);
    expect(isConstraintGridState({ ...s, moves: MAX_COUNTER, checks: MAX_COUNTER })).toBe(true);
    expect(isConstraintGridState({ ...s, history: range(MAX_HISTORY).map(() => [0, 2, 47, 1]) })).toBe(true);
    expect(isConstraintGridState({ ...s, autoExclude: false })).toBe(true);
  });

  it('rejects malformed clues', () => {
    const a = ref(0, 0);
    expect(isClue({ type: 'same', a, b: ref(0, 1) }, 3, 3)).toBe(false);
    expect(isClue({ type: 'notSame', a, b: ref(0, 1) }, 3, 3)).toBe(false);
    expect(isClue({ type: 'same', a, b: ref(1, 1) }, 3, 3)).toBe(true);
    expect(isClue({ type: 'above', a, b: ref(1, 1) }, 3, 3)).toBe(false);
    expect(isClue({ type: 'above', a: ref(1, 0), b: ref(0, 1) }, 3, 3)).toBe(false);
    expect(isClue({ type: 'above', a, b: a }, 3, 3)).toBe(false);
    expect(isClue({ type: 'above', a, b: ref(0, 1) }, 3, 3)).toBe(true);
    expect(isClue({ type: 'nextTo', a, b: ref(2, 0) }, 3, 3)).toBe(true);
    expect(isClue({ type: 'eitherOr', a, b: ref(2, 0), c: ref(2, 1) }, 3, 3)).toBe(true);
    expect(isClue({ type: 'eitherOr', a, b: ref(2, 0), c: ref(2, 0) }, 3, 3)).toBe(false);
    expect(isClue({ type: 'eitherOr', a, b: ref(2, 0), c: ref(1, 1) }, 3, 3)).toBe(false);
    expect(isClue({ type: 'eitherOr', a, b: ref(0, 1), c: ref(0, 2) }, 3, 3)).toBe(false);
    expect(isClue({ type: 'eitherOr', a, b: ref(2, 0) }, 3, 3)).toBe(false);
    expect(isClue({ type: 'same', a, b: ref(1, 3) }, 3, 3)).toBe(false);
    expect(isClue({ type: 'same', a, b: ref(3, 0) }, 3, 3)).toBe(false);
    expect(isClue({ type: 'same', a: 'x', b: ref(1, 0) }, 3, 3)).toBe(false);
    expect(isClue(null, 3, 3)).toBe(false);
  });

  it('never throws on arbitrary data', () => {
    fc.assert(fc.property(fc.anything(), (v) => {
      expect(isConstraintGridState(v)).toBe(false);
    }), { numRuns: 300 });
    const throwing = new Proxy({}, { get: () => { throw new Error('boom'); }, has: () => true, ownKeys: () => { throw new Error('boom'); } });
    expect(isConstraintGridState(throwing)).toBe(false);
  });

  it('random mark sequences keep the state valid (property)', () => {
    fc.assert(
      fc.property(fc.array(fc.tuple(fc.nat(26), fc.integer({ min: 0, max: 3 })), { maxLength: 40 }), fc.boolean(), (ops, auto) => {
        let s = createInitialState(5, 'easy', auto);
        for (const [cell, op] of ops) s = op === 3 ? undo(s) : setMark(s, cell, op);
        expect(isConstraintGridState(clone(s))).toBe(true);
        expect(s.marks.every((m) => m >= 0 && m <= 2)).toBe(true);
        // Undoing everything returns to an empty board.
        let u = s;
        while (u.history.length > 0 && !isSolved(u)) u = undo(u);
        if (!isSolved(s)) expect(u.marks.every((m) => m === MARK_UNKNOWN)).toBe(true);
      }),
      { numRuns: 200 }
    );
  });
});
