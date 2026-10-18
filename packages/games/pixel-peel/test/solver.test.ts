import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createInitial } from '../src/generate';
import { EMPTY, apply, initialPosition, isSolved, play, positionAt, replay, undoTo, type Position } from '../src/rules';
import { launch } from './reference';
import { fastLaunchFrom, hint, obviousPlay, solve } from '../src/solver';
import { gridArb, nestedArb, pictureOf, puzzleArb, stateOf } from './helpers';
import { oracleSolvable } from './oracle';

const positionOf = (rows: string[], lanes: { c: string; n: number }[][], slots: number): Position => initialPosition({ picture: pictureOf(rows), lanes, slots });

describe('fast internal launch', () => {
  it('equals the pure reference launch on random positions (property)', () => {
    fc.assert(
      fc.property(gridArb(8, 8), fc.constantFrom('a', 'b', 'c'), fc.integer({ min: 1, max: 40 }), fc.integer({ min: 0, max: 5 }), ({ w, h, cells }, c, n, pre) => {
        // Start from a partly peeled grid so that front pointers have to skip removed cells.
        let start = cells;
        for (let k = 0; k < pre; k++) start = launch(start, w, h, { c: 'abc'[k % 3]!, n: 2 }).cells;
        const pos: Position = { w, h, cells: start, lanes: [], laneFront: [], slots: [], launches: 0, parks: 0 };
        const fast = fastLaunchFrom(pos, c, n);
        const ref = launch(start, w, h, { c, n });
        expect(fast.left).toBe(ref.left);
        expect(fast.hits).toBe(ref.hits.length);
        expect(fast.present).toEqual(ref.cells.map((x) => x !== EMPTY));
      }),
      { numRuns: 400 }
    );
  });
});

describe('solver against an independent oracle', () => {
  it('solvable only by parking: b must step aside before the ring can go', () => {
    const pos = positionOf(['aaa', 'aba', 'aaa'], [[{ c: 'b', n: 1 }, { c: 'a', n: 8 }]], 1);
    const r = solve(pos);
    expect(r).toEqual({ solution: ['L0', 'L0', 'S0'] });
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
    // Both outcomes are exercised.
    expect(solvable).toBeGreaterThan(100);
    expect(unsolvable).toBeGreaterThan(15);
  });

  it('reports unknown when the budget runs out, never a wrong answer', () => {
    const state = createInitial(9, 'hard', 'summer-meadow');
    const r = solve(initialPosition(state), 1);
    expect('unsolvable' in r).toBe(false);
  });
});

describe('obvious play', () => {
  it('solves the base deal on easy (no parking needed)', () => {
    for (const motif of ['red-fox', 'fjord', 'winter-village']) {
      const state = createInitial(1, 'easy', motif);
      const r = obviousPlay(initialPosition(state));
      expect(r.solved).toBe(true);
      expect(isSolved(replay(initialPosition(state), r.moves)!)).toBe(true);
    }
  });

  it('stops when stuck', () => {
    const pos = positionOf(['aaaa', 'abba', 'aaaa'], [[{ c: 'b', n: 1 }, { c: 'b', n: 1 }, { c: 'a', n: 10 }]], 1);
    expect(obviousPlay(pos)).toEqual({ solved: false, moves: ['L0'] });
  });
});

describe('hint (design § 4.7)', () => {
  it('on the witness path, suggests the next witness move', () => {
    const state = createInitial(6, 'medium', 'koala');
    expect(hint(state)).toEqual({ kind: 'move', move: state.witness[0] });
    const s1 = play(state, state.witness[0]!);
    expect(hint(s1)).toEqual({ kind: 'move', move: state.witness[1] });
  });

  it('off the witness path, suggests a move that keeps the picture solvable', () => {
    for (let seed = 1; seed <= 6; seed++) {
      let s = createInitial(seed, 'medium', 'tiger');
      // Leave the witness with some legal move, then ask.
      const legal = ['L0', 'L1', 'L2', 'S0', 'S1', 'S2'].filter((m) => m !== s.witness[0] && play(s, m) !== s);
      if (!legal.length) continue;
      s = play(s, legal[0]!);
      const h = hint(s);
      if (h.kind === 'move') {
        const after = positionAt(play(s, h.move), s.moves.length + 1);
        expect('solution' in solve(after, 50_000)).toBe(true);
      } else {
        expect('solution' in solve(positionAt(s, h.k), 50_000)).toBe(true);
      }
    }
  });

  it('on a doomed position, names a solvable move number to go back to', () => {
    // 1 slot; lane 0: b1, a10; lane 1: b1. Launching lane 1 first parks b and blocks lane 0 for good.
    const state = stateOf(['aaaa', 'abba', 'aaaa'], [[{ c: 'b', n: 1 }, { c: 'a', n: 10 }], [{ c: 'b', n: 1 }]], 1);
    const doomed = play(state, 'L1');
    const h = hint(doomed);
    expect(h).toEqual({ kind: 'undo', k: 0, proven: true });
    expect('solution' in solve(positionAt(undoTo(doomed, 0), 0))).toBe(true);
  });

  it('the latest solvable ancestor is preferred over the witness prefix', () => {
    // 2 slots: the first parking move is fine, the second (lane 1 too) makes it impossible.
    const state = stateOf(['aaaaa', 'abbba', 'aaaaa'], [[{ c: 'b', n: 1 }, { c: 'a', n: 12 }], [{ c: 'b', n: 1 }, { c: 'b', n: 1 }]], 2);
    expect(state.witness[0]).toBe('L0');
    let s = state;
    for (const m of ['L1', 'L1']) s = play(s, m);
    const h = hint(s);
    expect(h.kind).toBe('undo');
    if (h.kind === 'undo') {
      expect(h).toEqual({ kind: 'undo', k: 1, proven: true });
      expect('solution' in solve(positionAt(s, h.k))).toBe(true);
    }
  });
});
