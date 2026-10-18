import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { apply, cursorOf, initialPosition, isSolved, replay, type Position } from '../src/rules';
import { runPolicy } from '../src/policies';
import { nestedArb, pictureOf, puzzleArb, solve } from './helpers';
import { oracleSolvable } from './oracle';

const positionOf = (rows: string[], lanes: { c: string; n: number }[][], slots: number): Position => initialPosition({ picture: pictureOf(rows), lanes, slots });
const obvious = (pos: Position) => {
  const { table, cursor } = cursorOf(pos);
  const r = runPolicy(table, 'obvious', 0, { left: 1e9 }, cursor);
  return { solved: r.result === 'solved', moves: r.moves };
};

describe('exact solver (design v2 § 3.7) against an independent oracle', () => {
  it('solvable only by parking: b must step aside before the ring can go', () => {
    const pos = positionOf(['aaa', 'aba', 'aaa'], [[{ c: 'b', n: 1 }, { c: 'a', n: 8 }]], 1);
    expect(solve(pos)).toEqual({ solution: ['L0', 'L0', 'S0'] });
    expect(oracleSolvable(pos)).toBe(true);
    expect(apply(pos, 'L0').parks).toBe(1);
  });

  it('unsolvable because of too few slots, solvable with one more', () => {
    const lanes = [[{ c: 'b', n: 1 }, { c: 'b', n: 1 }, { c: 'a', n: 10 }]];
    const tight = positionOf(['aaaa', 'abba', 'aaaa'], lanes, 1);
    expect(solve(tight)).toEqual({ unsolvable: true });
    expect(oracleSolvable(tight)).toBe(false);
    const roomy = positionOf(['aaaa', 'abba', 'aaaa'], lanes, 2);
    expect('solution' in solve(roomy)).toBe(true);
    expect(oracleSolvable(roomy)).toBe(true);
  });

  it('agrees with the oracle on ≥ 200 random tiny puzzles; every solution replays to solved', () => {
    let solvable = 0;
    let unsolvable = 0;
    fc.assert(
      fc.property(fc.oneof(puzzleArb, nestedArb), ({ rows, lanes, slots }) => {
        const pos = positionOf(rows, lanes, slots);
        const r = solve(pos, 200_000);
        const truth = oracleSolvable(pos);
        expect('unknown' in r).toBe(false);
        if ('solution' in r) {
          solvable++;
          expect(truth).toBe(true);
          expect(isSolved(replay(pos, r.solution)!)).toBe(true);
        } else {
          unsolvable++;
          expect(truth).toBe(false);
        }
      }),
      { numRuns: 600 }
    );
    expect(solvable).toBeGreaterThan(100);
    expect(unsolvable).toBeGreaterThan(15);
  });

  it('reports unknown when the budget runs out, never a wrong answer', () => {
    const pos = positionOf(['aaaa', 'abba', 'aaaa'], [[{ c: 'b', n: 1 }, { c: 'b', n: 1 }, { c: 'a', n: 10 }]], 2);
    expect(solve(pos, 0)).toEqual({ unknown: true });
  });
});

describe('the obvious play (policy P1)', () => {
  it('stops when stuck', () => {
    const pos = positionOf(['aaaa', 'abba', 'aaaa'], [[{ c: 'b', n: 1 }, { c: 'b', n: 1 }, { c: 'a', n: 10 }]], 1);
    expect(obvious(pos)).toEqual({ solved: false, moves: ['L0'] });
  });

  it('solves a simple deal used up launch by launch', () => {
    const pos = positionOf(['aaaa', 'abba', 'aaaa'], [[{ c: 'a', n: 10 }, { c: 'b', n: 2 }]], 1);
    expect(obvious(pos)).toEqual({ solved: true, moves: ['L0', 'L0'] });
  });
});
