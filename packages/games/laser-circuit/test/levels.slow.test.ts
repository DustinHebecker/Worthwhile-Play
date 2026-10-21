import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import type { LevelSource } from '../src/levels';
import { PIECE_KINDS, isSolved, remaining } from '../src/rules';
import { ALL, HARD_MAX_NODES, applySolution, isOriginal, pieceCount, stateOf } from './helpers';
import { parseSolution, solveByDecision, solveByLight, solveExhaustively, type DecisionSearch } from './oracle';

/*
 * The shipped levels proven by the independent oracles (exhaustive enumeration, the light-guided
 * and the exact decision search), split from rules.test.ts: the searches take seconds per level, so
 * mutation testing leaves this *.slow.test.ts file out (ADR 0021); `pnpm test` and CI run it.
 */
describe('level sets (independent oracles)', () => {
  const searches = new Map<LevelSource, DecisionSearch>();
  /** The exact decision search for a level (computed once per test run). */
  const decide = (source: LevelSource) => {
    let result = searches.get(source);
    if (!result) {
      result = solveByDecision(source.rows, source.inventory);
      searches.set(source, result);
    }
    return result;
  };
  /** Levels whose solution is checked here; the expert levels have their own test file (they take longest). */
  const CHECKED = ALL.filter((l) => l.set !== 'expert');

  describe('every level is solvable and has the recorded number of solutions (independent oracle)', { timeout: 120_000 }, () => {
    for (const { set, index, source } of CHECKED) {
      it(`${set} ${index + 1}`, () => {
        // The original levels are counted by the light-guided search; the big newer ones by the exact decision search.
        const search = isOriginal(set, index) ? undefined : decide(source);
        if (search) expect(search.complete).toBe(true);
        const solutions = search ? search.solutions : solveByLight(source.rows, source.inventory);
        expect(solutions.length).toBe(source.solutions);
        if (set === 'medium' || set === 'hard') expect(solutions.length).toBe(1);
        else expect(solutions.length).toBeLessThanOrEqual(2);
        for (const solution of solutions) {
          // The solution needs the whole inventory: every piece matters.
          expect(parseSolution(solution)).toHaveLength(pieceCount(source));
          // Playing it with the game's own actions solves the level.
          const solved = applySolution(stateOf(set, index), solution);
          expect(isSolved(solved)).toBe(true);
          expect(PIECE_KINDS.every((kind) => remaining(solved, kind) === 0)).toBe(true);
        }
        expect(isSolved(stateOf(set, index))).toBe(false);
      });
    }
  });

  it('light-guided search finds exactly what exhaustive enumeration finds (intro and easy)', { timeout: 120_000 }, () => {
    for (const { source } of ALL.filter((l) => l.set === 'intro' || l.set === 'easy')) {
      expect(solveExhaustively(source.rows, source.inventory)).toEqual(solveByLight(source.rows, source.inventory));
    }
  });

  it('the exact decision search finds exactly what the light-guided search finds (original levels)', { timeout: 120_000 }, () => {
    for (const { set, index, source } of ALL) {
      if (!isOriginal(set, index)) continue;
      const search = decide(source);
      expect(search.complete).toBe(true);
      expect(search.solutions).toEqual(solveByLight(source.rows, source.inventory));
    }
  });

  it('the decision search agrees with the light-guided search on small random puzzles with diodes, portals and optics (property)', { timeout: 60_000 }, () => {
    const puzzleArb = fc
      .tuple(
        fc.array(
          fc.array(
            fc.oneof(
              { weight: 8, arbitrary: fc.constant('.') },
              { weight: 3, arbitrary: fc.constantFrom('#', 'X', 'D^', 'D>', 'Dv', 'D<', '@1', 'TR', 'TM', 'TB', 'FM', 'P0', 'P45', 'N', '-R', 'TR2', 'TW4', 'TR:0', 'TB2:45', 'TM:90') }
            ),
            { minLength: 4, maxLength: 4 }
          ),
          { minLength: 4, maxLength: 4 }
        ),
        fc.constantFrom('>R', '>M', 'vB', '<W'),
        fc.integer({ min: 0, max: 3 }),
        fc.record({
          mirror: fc.integer({ min: 0, max: 2 }),
          splitter: fc.integer({ min: 0, max: 1 }),
          blocker: fc.integer({ min: 0, max: 1 }),
          polariser: fc.integer({ min: 0, max: 1 }),
          neutral: fc.integer({ min: 0, max: 1 }),
          filterR: fc.integer({ min: 0, max: 1 }),
          minusB: fc.integer({ min: 0, max: 1 })
        })
        // The light-guided oracle grows steeply with the piece count: 7 pieces on a 4x4 board can take 10+ s, which
        // made this property's runtime depend on the random seed. Five pieces keep every kind in play.
        .filter((inventory) => Object.values(inventory).reduce((sum, n) => sum + n, 0) <= 5)
      )
      .map(([grid, laser, row, inventory]) => {
        const copy: string[][] = grid.map((r) => [...r]);
        copy[row]![laser === '>R' || laser === '>M' ? 0 : laser === '<W' ? 3 : 1] = laser;
        return { rows: copy.map((r) => r.join(' ')), inventory };
      });
    fc.assert(
      fc.property(puzzleArb, ({ rows, inventory }) => {
        const search = solveByDecision(rows, inventory);
        expect(search.complete).toBe(true);
        expect(search.solutions).toEqual(solveByLight(rows, inventory));
      }),
      { numRuns: 120 }
    );
  });

  it('the newer levels need more pieces and a bigger exact search than the original medium levels', { timeout: 120_000 }, () => {
    const medium = ALL.filter((l) => l.set === 'medium');
    const original = medium.filter((l) => isOriginal('medium', l.index));
    const added = medium.filter((l) => !isOriginal('medium', l.index));
    const hard = ALL.filter((l) => l.set === 'hard');
    const maxOriginalNodes = Math.max(...original.map((l) => decide(l.source).nodes));
    const maxOriginalPieces = Math.max(...original.map((l) => pieceCount(l.source)));
    for (const { source } of [...added, ...hard]) {
      expect(decide(source).nodes).toBeGreaterThan(maxOriginalNodes);
      expect(pieceCount(source)).toBeGreaterThan(maxOriginalPieces);
    }
    for (const { source } of hard) expect(pieceCount(source)).toBeGreaterThan(Math.max(...added.map((l) => pieceCount(l.source))));
    // The expert test file compares its search trees with this bound.
    expect(Math.max(...hard.map((l) => decide(l.source).nodes))).toBe(HARD_MAX_NODES);
  });
});
