import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import {
  CANONICAL,
  DIFFICULTIES,
  DIRECTIONS,
  E,
  MAX_COUNTER,
  MAX_DEGREE,
  MAX_HISTORY,
  N,
  S,
  SIZES,
  TILE_KINDS,
  W,
  canRotate,
  canUndo,
  countLinks,
  countLoose,
  createInitialState,
  degree,
  generatePuzzle,
  isCircuitComplete,
  isCircuitState,
  isRotationOf,
  isSolved,
  kindOf,
  linked,
  looseEnds,
  neighbor,
  opposite,
  poweredSet,
  randomSpanningTree,
  rotateBy,
  rotateCCW,
  rotateCW,
  rotateTile,
  rotationOf,
  sourceIndex,
  toDifficulty,
  toggleLock,
  undo,
  type CircuitState
} from '../src/rules';
import { oracleCountSolutions, oracleKruskalTree, oracleLooseCount, oraclePowered, oracleSolved, oracleTurn } from './oracle';

const maskArb = fc.integer({ min: 0, max: 15 });
const nonEmptyMask = fc.integer({ min: 1, max: 15 });
const boardArb = (minSize: number, maxSize: number) =>
  fc.integer({ min: minSize, max: maxSize }).chain((size) =>
    fc.record({
      size: fc.constant(size),
      masks: fc.array(maskArb, { minLength: size * size, maxLength: size * size }),
      source: fc.integer({ min: 0, max: size * size - 1 })
    })
  );
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
/** A valid tile mask that is not a rotation of `m` (straight ↔ corner, end ↔ tee). */
const notRotation = (m: number) => (degree(m) === 2 ? (kindOf(m) === 'straight' ? N | E : N | S) : degree(m) === 1 ? N | E | S : N);
const notRotationIndex = (s: CircuitState) => s.masks.length - 1;

/** Turns every tile to the generated solution (clockwise turns only). */
function solve(state: CircuitState): CircuitState {
  let s = state;
  for (let i = 0; i < s.masks.length; i++) {
    for (let k = 0; k < 4 && s.masks[i] !== s.solution[i]; k++) s = rotateTile(s, i);
  }
  return s;
}

describe('tile algebra', () => {
  it('rotates clockwise N → E → S → W → N', () => {
    expect(rotateCW(N)).toBe(E);
    expect(rotateCW(E)).toBe(S);
    expect(rotateCW(S)).toBe(W);
    expect(rotateCW(W)).toBe(N);
    expect(rotateCW(N | E)).toBe(E | S);
    expect(rotateCW(W | N)).toBe(N | E);
    expect(rotateCCW(N)).toBe(W);
    expect(rotateCCW(W)).toBe(S);
    expect(rotateCCW(N | E | S)).toBe(W | N | E);
  });

  it('four turns are the identity and CCW inverts CW (property)', () => {
    fc.assert(
      fc.property(maskArb, fc.integer({ min: -12, max: 12 }), (m, k) => {
        expect(rotateCW(rotateCW(rotateCW(rotateCW(m))))).toBe(m);
        expect(rotateCCW(rotateCW(m))).toBe(m);
        expect(rotateCW(rotateCCW(m))).toBe(m);
        expect(rotateCW(m)).toBe(oracleTurn(m));
        expect(rotateBy(m, k + 4)).toBe(rotateBy(m, k));
        expect(rotateBy(m, -1)).toBe(rotateCCW(m));
        expect(degree(rotateCW(m))).toBe(degree(m));
        expect(kindOf(rotateCW(m))).toBe(kindOf(m));
      })
    );
  });

  it('rotateBy handles zero and multi-turns', () => {
    expect(rotateBy(N, 0)).toBe(N);
    expect(rotateBy(N, 1)).toBe(E);
    expect(rotateBy(N, 2)).toBe(S);
    expect(rotateBy(N, 3)).toBe(W);
    expect(rotateBy(N, -2)).toBe(S);
    expect(rotateBy(N, 5)).toBe(E);
  });

  it('opposite directions', () => {
    expect(opposite(N)).toBe(S);
    expect(opposite(E)).toBe(W);
    expect(opposite(S)).toBe(N);
    expect(opposite(W)).toBe(E);
  });

  it('classifies kinds and degrees', () => {
    expect(degree(0)).toBe(0);
    expect(degree(15)).toBe(4);
    expect(degree(N | S)).toBe(2);
    expect(kindOf(0)).toBeNull();
    expect(kindOf(N)).toBe('end');
    expect(kindOf(W)).toBe('end');
    expect(kindOf(N | S)).toBe('straight');
    expect(kindOf(E | W)).toBe('straight');
    expect(kindOf(N | E)).toBe('corner');
    expect(kindOf(S | W)).toBe('corner');
    expect(kindOf(N | W)).toBe('corner');
    expect(kindOf(E | S | W)).toBe('tee');
    expect(kindOf(15)).toBe('cross');
  });

  it('rotationOf recovers the turns from the canonical shape', () => {
    expect(TILE_KINDS).toEqual(['end', 'straight', 'corner', 'tee', 'cross']);
    for (const kind of TILE_KINDS) {
      for (let k = 0; k < 4; k++) {
        const m = rotateBy(CANONICAL[kind], k);
        expect(rotateBy(CANONICAL[kind], rotationOf(m))).toBe(m);
        expect(kindOf(m)).toBe(kind);
      }
    }
    expect(rotationOf(N)).toBe(0);
    expect(rotationOf(E)).toBe(1);
    expect(rotationOf(S)).toBe(2);
    expect(rotationOf(W)).toBe(3);
    expect(rotationOf(E | W)).toBe(1);
    expect(rotationOf(N | S)).toBe(0);
    expect(rotationOf(W | N)).toBe(3);
    expect(rotationOf(15)).toBe(0);
    expect(rotationOf(0)).toBe(-1);
  });

  it('isRotationOf', () => {
    expect(isRotationOf(N, W)).toBe(true);
    expect(isRotationOf(N | S, E | W)).toBe(true);
    expect(isRotationOf(N | S, N | E)).toBe(false);
    expect(isRotationOf(N, N | E)).toBe(false);
    expect(isRotationOf(7, 7)).toBe(true);
  });
});

describe('grid connectivity', () => {
  it('neighbours stay on the board', () => {
    // 3×3: index 4 is the centre.
    expect(neighbor(4, 3, N)).toBe(1);
    expect(neighbor(4, 3, S)).toBe(7);
    expect(neighbor(4, 3, E)).toBe(5);
    expect(neighbor(4, 3, W)).toBe(3);
    expect(neighbor(0, 3, N)).toBe(-1);
    expect(neighbor(0, 3, W)).toBe(-1);
    expect(neighbor(2, 3, E)).toBe(-1);
    expect(neighbor(3, 3, W)).toBe(-1);
    expect(neighbor(5, 3, E)).toBe(-1);
    expect(neighbor(6, 3, S)).toBe(-1);
    expect(neighbor(8, 3, S)).toBe(-1);
    expect(neighbor(8, 3, E)).toBe(-1);
    expect(neighbor(1, 3, N)).toBe(-1);
    expect(neighbor(7, 3, N)).toBe(4);
  });

  it('links need wires on both sides', () => {
    // 2×2: [E|S, W] / [N, 0]
    const masks = [E | S, W, N, N];
    expect(linked(masks, 2, 0, E)).toBe(true);
    expect(linked(masks, 2, 1, W)).toBe(true);
    expect(linked(masks, 2, 0, S)).toBe(true);
    expect(linked(masks, 2, 2, N)).toBe(true);
    expect(linked(masks, 2, 3, N)).toBe(false); // tile 1 has no S wire
    expect(linked(masks, 2, 0, N)).toBe(false); // off board
    expect(linked(masks, 2, 1, S)).toBe(false); // no wire
  });

  it('counts powered tiles, loose ends and links on a hand-made board', () => {
    const masks = [E | S, W, N, N];
    expect(poweredSet(masks, 2, 0)).toEqual([true, true, true, false]);
    expect(poweredSet(masks, 2, 3)).toEqual([false, false, false, true]);
    expect(looseEnds(masks, 2)).toEqual([0, 0, 0, N]);
    expect(countLoose(masks, 2)).toBe(1);
    expect(countLinks(masks, 2)).toBe(2);
    expect(isCircuitComplete(masks, 2, 0)).toBe(false);
    const fixed = [E | S, W | S, N, N];
    expect(isCircuitComplete(fixed, 2, 0)).toBe(true);
    expect(isCircuitComplete(fixed, 2, 3)).toBe(true);
    expect(poweredSet(fixed, 2, -1)).toEqual([false, false, false, false]);
    expect(poweredSet(fixed, 2, 4)).toEqual([false, false, false, false]);
    // A 1×2 strip is a valid tree, but not when the board is declared 2×2.
    expect(isCircuitComplete([E, W], 2, 0)).toBe(false);
  });

  it('rejects loops, off-board ends and wrong board sizes', () => {
    const loop = [E | S, W | S, N | E, N | W];
    expect(countLoose(loop, 2)).toBe(0);
    expect(poweredSet(loop, 2, 0).every(Boolean)).toBe(true);
    expect(countLinks(loop, 2)).toBe(4);
    expect(isCircuitComplete(loop, 2, 0)).toBe(false);
    const offBoard = [E | S | N, W | S, N, N];
    expect(isCircuitComplete(offBoard, 2, 0)).toBe(false);
    expect(isCircuitComplete([E | S, W | S, N], 2, 0)).toBe(false);
    expect(isCircuitComplete([], 0, 0)).toBe(false);
  });

  it('rejects a loop plus a separate tree even though the link count matches', () => {
    // 3×3: loop on tiles 0,1,3,4 and a separate chain 2-5-8-7-6; 8 links, no loose ends.
    const masks = [E | S, W | S, S, N | E, N | W, N | S, E, E | W, N | W];
    expect(countLoose(masks, 3)).toBe(0);
    expect(countLinks(masks, 3)).toBe(8);
    expect(poweredSet(masks, 3, 0).filter(Boolean)).toHaveLength(4);
    expect(isCircuitComplete(masks, 3, 0)).toBe(false);
    expect(oracleSolved(masks, 3, 0)).toBe(false);
  });

  it('powered set, loose ends and completeness agree with the oracle (property)', () => {
    fc.assert(
      fc.property(boardArb(1, 5), ({ size, masks, source }) => {
        expect(poweredSet(masks, size, source)).toEqual(oraclePowered(masks, size, source));
        expect(countLoose(masks, size)).toBe(oracleLooseCount(masks, size));
        expect(isCircuitComplete(masks, size, source)).toBe(oracleSolved(masks, size, source));
      }),
      { numRuns: 400 }
    );
  });

  it('counts complete rotations exactly like an exhaustive oracle on tiny boards', () => {
    fc.assert(
      fc.property(fc.array(nonEmptyMask, { minLength: 4, maxLength: 4 }), fc.integer({ min: 0, max: 3 }), (masks, source) => {
        let mine = 0;
        const visit = (i: number, current: number[]) => {
          if (i === masks.length) {
            if (isCircuitComplete(current, 2, source)) mine++;
            return;
          }
          const options = new Set([0, 1, 2, 3].map((k) => rotateBy(masks[i] as number, k)));
          for (const m of options) visit(i + 1, [...current.slice(0, i), m, ...current.slice(i + 1)]);
        };
        visit(0, [...masks]);
        expect(mine).toBe(oracleCountSolutions(masks, 2, source));
      }),
      { numRuns: 300 }
    );
  });

  it('accepts any spanning tree (independent Kruskal oracle) and rejects any single changed tile', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 7 }),
        fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 1, maxLength: 120 }),
        fc.nat(),
        fc.nat(),
        (size, weights, sourcePick, tilePick) => {
          const tree = oracleKruskalTree(size, weights);
          const source = sourcePick % (size * size);
          expect(isCircuitComplete(tree, size, source)).toBe(true);
          const i = tilePick % tree.length;
          const turned = [...tree];
          turned[i] = rotateCW(tree[i] as number);
          if (turned[i] !== tree[i]) expect(isCircuitComplete(turned, size, source)).toBe(false);
        }
      ),
      { numRuns: 300 }
    );
  });
});

describe('generation', { timeout: 60_000 }, () => {
  it('maps difficulties to 5, 7, 9 and centres the source', () => {
    expect(SIZES).toEqual({ easy: 5, medium: 7, hard: 9 });
    expect(sourceIndex(5)).toBe(12);
    expect(sourceIndex(7)).toBe(24);
    expect(sourceIndex(9)).toBe(40);
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('nope')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
  });

  it('random spanning trees are valid trees; the degree cap holds', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 9 }), fc.nat(), (size, seed) => {
        const rng = createRng(seed);
        const start = seed % (size * size);
        const free = randomSpanningTree(rng, size, start) as number[];
        expect(isCircuitComplete(free, size, start)).toBe(true);
        expect(oracleSolved(free, size, start)).toBe(true);
        const capped = randomSpanningTree(rng, size, start, MAX_DEGREE);
        if (capped !== null) {
          expect(oracleSolved(capped, size, start)).toBe(true);
          expect(capped.every((m) => degree(m) <= MAX_DEGREE)).toBe(true);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('degree cap 1 cannot span more than two tiles', () => {
    expect(randomSpanningTree(createRng(1), 3, 4, 1)).toBeNull();
    expect(randomSpanningTree(createRng(1), 2, 0, 2)).not.toBeNull();
  });

  it('generated puzzles: target is a complete circuit, scrambled board is not, tiles are rotations', () => {
    fc.assert(
      fc.property(fc.nat(), fc.constantFrom(...DIFFICULTIES), (seed, difficulty) => {
        const size = SIZES[difficulty];
        const p = generatePuzzle(seed, size);
        expect(p.source).toBe(sourceIndex(size));
        expect(p.solution).toHaveLength(size * size);
        expect(oracleSolved(p.solution, size, p.source)).toBe(true);
        expect(isCircuitComplete(p.solution, size, p.source)).toBe(true);
        expect(isCircuitComplete(p.masks, size, p.source)).toBe(false);
        p.masks.forEach((m, i) => expect(isRotationOf(p.solution[i] as number, m)).toBe(true));
        expect(p.solution.every((m) => degree(m) >= 1 && degree(m) <= MAX_DEGREE)).toBe(true);
      }),
      { numRuns: 120 }
    );
  });

  it('never hands out a completed board, even on tiny boards', () => {
    for (let seed = 0; seed < 300; seed++) {
      const p = generatePuzzle(seed, 2);
      expect(isCircuitComplete(p.solution, 2, p.source)).toBe(true);
      expect(isCircuitComplete(p.masks, 2, p.source)).toBe(false);
      p.masks.forEach((m, i) => expect(isRotationOf(p.solution[i] as number, m)).toBe(true));
    }
  });

  it('is deterministic per seed and differs between seeds', () => {
    expect(generatePuzzle(42, 7)).toEqual(generatePuzzle(42, 7));
    expect(createInitialState(9, 'hard')).toEqual(createInitialState(9, 'hard'));
    expect(generatePuzzle(1, 7).solution).not.toEqual(generatePuzzle(2, 7).solution);
  });

  it('creates a fresh initial state', () => {
    const s = createInitialState(123, 'medium');
    expect(s.seed).toBe(123);
    expect(s.difficulty).toBe('medium');
    expect(s.size).toBe(7);
    expect(s.source).toBe(24);
    expect(s.moves).toBe(0);
    expect(s.history).toEqual([]);
    expect(s.locked).toEqual(new Array(49).fill(false));
    expect(createInitialState(-1).seed).toBe(0xffffffff);
    expect(createInitialState(5).difficulty).toBe('easy');
    expect(isCircuitState(s)).toBe(true);
    expect(isSolved(s)).toBe(false);
  });
});

describe('moves', () => {
  it('rotates, counts and undoes', () => {
    const s0 = createInitialState(7);
    const s1 = rotateTile(s0, 3);
    expect(s1.masks[3]).toBe(rotateCW(s0.masks[3] as number));
    expect(s1.moves).toBe(1);
    expect(s1.history).toEqual([4]);
    const s2 = rotateTile(s1, 0, false);
    expect(s2.masks[0]).toBe(rotateCCW(s0.masks[0] as number));
    expect(s2.history).toEqual([4, -1]);
    expect(s2.moves).toBe(2);
    expect(s0.masks).toEqual(createInitialState(7).masks); // no mutation
    const u1 = undo(s2);
    expect(u1).toEqual(s1);
    expect(undo(u1)).toEqual(s0);
    expect(canUndo(s0)).toBe(false);
    expect(undo(s0)).toBe(s0);
  });

  it('undo restores any sequence of moves (property)', () => {
    fc.assert(
      fc.property(fc.array(fc.tuple(fc.integer({ min: 0, max: 24 }), fc.boolean()), { maxLength: 30 }), (moves) => {
        const start = createInitialState(11);
        let s = start;
        for (const [i, cw] of moves) if (!isSolved(s)) s = rotateTile(s, i, cw);
        if (isSolved(s)) return;
        while (canUndo(s)) s = undo(s);
        expect(s.masks).toEqual(start.masks);
        expect(s.moves).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('ignores invalid indices and locked tiles', () => {
    const s0 = createInitialState(3);
    expect(rotateTile(s0, -1)).toBe(s0);
    expect(rotateTile(s0, 25)).toBe(s0);
    expect(rotateTile(s0, 1.5)).toBe(s0);
    expect(canRotate(s0, 0)).toBe(true);
    const locked = toggleLock(s0, 2);
    expect(locked.locked[2]).toBe(true);
    expect(locked.moves).toBe(0);
    expect(canRotate(locked, 2)).toBe(false);
    expect(rotateTile(locked, 2)).toBe(locked);
    expect(toggleLock(locked, 2).locked[2]).toBe(false);
    expect(toggleLock(s0, 25)).toBe(s0);
    expect(toggleLock(s0, -1)).toBe(s0);
  });

  it('caps the undo history', () => {
    let s = createInitialState(5);
    // Spin a tile that cannot complete the board on its own: many full turns.
    const i = s.masks.findIndex((m) => rotateCW(m) !== m);
    for (let k = 0; k < MAX_HISTORY + 8 && !isSolved(s); k++) s = rotateTile(s, i);
    if (!isSolved(s)) {
      expect(s.history).toHaveLength(MAX_HISTORY);
      expect(s.moves).toBe(MAX_HISTORY + 8);
      expect(isCircuitState(s)).toBe(true);
    }
    const capped = rotateTile({ ...s, moves: MAX_COUNTER, history: [] }, i);
    if (!isSolved(s)) expect(capped.moves).toBe(MAX_COUNTER);
    const zero = undo({ ...s, moves: 0 });
    if (!isSolved(s)) expect(zero.moves).toBe(0);
  });

  it('solving freezes the board', () => {
    const solved = solve(createInitialState(21, 'easy'));
    expect(isSolved(solved)).toBe(true);
    expect(solved.moves).toBeGreaterThan(0);
    expect(canRotate(solved, 0)).toBe(false);
    expect(rotateTile(solved, 0)).toBe(solved);
    expect(canUndo(solved)).toBe(false);
    expect(undo(solved)).toBe(solved);
    expect(toggleLock(solved, 0)).toBe(solved);
  });

  it('every tile of a solved board is powered, with no loose ends', () => {
    const solved = solve(createInitialState(8, 'hard'));
    expect(poweredSet(solved.masks, 9, solved.source).every(Boolean)).toBe(true);
    expect(looseEnds(solved.masks, 9).every((m) => m === 0)).toBe(true);
  });
});

describe('isCircuitState', () => {
  const valid = () => rotateTile(rotateTile(createInitialState(77, 'easy'), 1), 2, false);

  it('accepts real states, including after JSON round trip', () => {
    expect(isCircuitState(valid())).toBe(true);
    expect(isCircuitState(clone(valid()))).toBe(true);
    expect(isCircuitState(createInitialState(1, 'hard'))).toBe(true);
    expect(isCircuitState(solve(createInitialState(1, 'easy')))).toBe(true);
  });

  it('rejects broken fields', () => {
    const base = valid();
    const bad: unknown[] = [
      null,
      [],
      'x',
      { ...base, seed: -1 },
      { ...base, seed: 1.5 },
      { ...base, difficulty: 'expert' },
      { ...base, size: 7 },
      { ...base, source: 0 },
      { ...base, solution: base.solution.slice(1) },
      { ...base, solution: 'x' },
      { ...base, solution: base.solution.map((m, i) => (i === 0 ? 0 : m)) },
      { ...base, masks: base.masks.slice(1) },
      { ...base, masks: null },
      { ...base, masks: base.masks.map((m, i) => (i === 0 ? 16 : m)) },
      { ...base, masks: base.masks.map((m, i) => (i === 0 ? 0 : m)) },
      { ...base, masks: base.masks.map(() => 15) },
      { ...base, solution: base.solution.map(() => 15), masks: base.masks.map(() => 15) },
      { ...base, locked: base.locked.slice(1) },
      { ...base, locked: base.locked.map(() => 1) },
      { ...base, locked: base.locked.map((b, i) => (i === 3 ? 1 : b)) },
      { ...base, masks: base.masks.map((m, i) => (i === 0 ? 16 : m)) },
      { ...base, solution: [...base.solution, 1], masks: [...base.masks, 1] },
      { ...base, difficulty: 'medium' },
      { ...base, source: 13 },
      { ...base, masks: base.masks.map((m, i) => (i === notRotationIndex(base) ? notRotation(base.solution[i] as number) : m)) },
      { ...base, locked: 'no' },
      { ...base, moves: -1 },
      { ...base, moves: MAX_COUNTER + 1 },
      { ...base, moves: 0 },
      { ...base, history: 'x' },
      { ...base, history: [0, 1] },
      { ...base, history: [26, 1] },
      { ...base, history: [-26, 1] },
      { ...base, history: [1.5, 1] },
      { ...base, moves: MAX_HISTORY + 5, history: new Array(MAX_HISTORY + 1).fill(1) }
    ];
    for (const value of bad) expect(isCircuitState(value)).toBe(false);
    expect(isCircuitState({ ...base, history: [25, -25] })).toBe(true);
    expect(isCircuitState({ ...base, moves: MAX_COUNTER })).toBe(true);
  });

  it('accepts a medium state but rejects it relabelled as easy', () => {
    const medium = createInitialState(4, 'medium');
    expect(isCircuitState(medium)).toBe(true);
    expect(isCircuitState({ ...medium, difficulty: 'easy' })).toBe(false);
    expect(isCircuitState({ ...medium, size: 5 })).toBe(false);
  });

  it('detects a solution that is not a single tree', () => {
    const base = valid();
    // Rotate one solution tile: masks must still be rotations of it, but the solution is broken.
    const i = base.solution.findIndex((m) => rotateCW(m) !== m);
    const solution = [...base.solution];
    solution[i] = rotateCW(solution[i] as number);
    expect(isCircuitState({ ...base, solution })).toBe(false);
  });

  it('never throws on arbitrary input', () => {
    fc.assert(fc.property(fc.anything(), (v) => void expect(() => isCircuitState(v)).not.toThrow()), { numRuns: 300 });
    const evil = { get seed(): number { throw new Error('boom'); } };
    expect(isCircuitState(evil)).toBe(false);
  });

  it('every direction constant is a single bit', () => {
    expect(DIRECTIONS.map(degree)).toEqual([1, 1, 1, 1]);
    expect(DIRECTIONS.reduce((a, b) => a | b, 0)).toBe(15);
  });
});
