import { describe, expect, it } from 'vitest';
import { LINE, edgeInfo, generatePuzzle, type Difficulty } from '../src/rules';
import { countSolutions, oracleIsSolution } from './oracle';

// Generated puzzles counted by the independent oracle (split from rules.test.ts): 70 exhaustive
// solution counts, so mutation testing leaves this *.slow.test.ts file out (ADR 0021); `pnpm test`
// and CI run it.
const SLOW = 120_000;

/** Oracle key of a rules edge index. */
const keyOf = (n: number, e: number) => {
  const info = edgeInfo(n, e);
  return `${info.horizontal ? 'h' : 'v'}-${info.r}-${info.c}`;
};
const lineKeys = (n: number, edges: readonly number[]) => new Set(edges.flatMap((m, e) => (m === LINE ? [keyOf(n, e)] : [])));

describe('generation (independent oracle)', () => {
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
});
