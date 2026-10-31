/**
 * The expert levels: each has exactly one solution (proven by the independent exact solver in
 * `oracle.ts`), needs at least two kinds of optical pieces and a bigger search than any hard level.
 * These are the slowest checks of the package: `expert-levels-*.slow.test.ts` run them for half of the
 * levels each, so that the two halves run in parallel.
 */
import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/levels';
import { PIECE_KINDS, boardOf, evaluate, getLevel, isSolved, remaining, type PieceKind } from '../src/rules';
import { generateExpertLevel } from './generator';
import { HARD_MAX_NODES, OPTICAL_KINDS, applySolution, pieceCount, stateOf } from './helpers';
import { parseSolution, solveByDecision } from './oracle';

/** The seed of the quickest expert level to regenerate (noted on the level in `levels.ts`). */
const REPRODUCED_SEED = 20194;

/** Colour filters and chromatic blockers of different colours count as one kind each. */
const family = (kind: PieceKind) => kind.replace(/[RGB]$/, '');

/** Generous: the slowest search takes ~20 s locally and several times that on a busy runner with coverage. */
const TIMEOUT = 300_000;

/** Defines the checks for expert levels `from` (inclusive) to `to` (exclusive); `reproduce` also regenerates one level. */
export function expertLevelTests(from: number, to: number, reproduce: boolean): void {
  describe(`expert levels ${from + 1}–${to}`, () => {
    for (const [index, source] of LEVELS.expert.entries()) {
      if (index < from || index >= to) continue;
      it(`expert ${index + 1}: exactly one solution, found by the exact solver, using at least two kinds of optical pieces`, { timeout: TIMEOUT }, () => {
        const level = getLevel('expert', index);
        const families = new Set(OPTICAL_KINDS.filter((kind) => level.inventory[kind] > 0).map(family));
        expect(families.size).toBeGreaterThanOrEqual(2);
        expect(pieceCount(source)).toBeGreaterThanOrEqual(6);
        expect(pieceCount(source)).toBeLessThanOrEqual(9);

        const search = solveByDecision(source.rows, source.inventory);
        expect(search.complete).toBe(true);
        expect(search.solutions).toHaveLength(1);
        expect(source.solutions).toBe(1);
        // A bigger search than every hard level.
        expect(search.nodes).toBeGreaterThan(HARD_MAX_NODES);

        const [solution] = search.solutions as [string];
        // The solution needs the whole inventory: every piece matters …
        expect(parseSolution(solution)).toHaveLength(pieceCount(source));
        const solved = applySolution(stateOf('expert', index), solution);
        expect(isSolved(solved)).toBe(true);
        expect(PIECE_KINDS.every((kind) => remaining(solved, kind) === 0)).toBe(true);
        // … and taking any one of them away breaks it again.
        const board = boardOf(solved);
        for (const piece of solved.pieces) {
          const cells = [...board.cells];
          cells[piece.cell] = { kind: 'empty' };
          expect(evaluate({ ...board, cells }).solved).toBe(false);
        }
        expect(isSolved(stateOf('expert', index))).toBe(false);
      });
    }

    if (!reproduce) return;
    it('the generator reproduces an expert level from the seed noted on it', { timeout: TIMEOUT }, () => {
      const generated = generateExpertLevel(REPRODUCED_SEED);
      expect(generated).toBeDefined();
      const tokens = (rows: readonly string[]) => rows.map((row) => row.trim().split(/\s+/).join(' ')).join('|');
      const source = LEVELS.expert.find((level) => tokens(level.rows) === tokens(generated!.source.rows));
      expect(source).toBeDefined();
      expect(source!.inventory).toEqual(generated!.source.inventory);
    });
  });
}
