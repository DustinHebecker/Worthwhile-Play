import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { metadata } from '../src/metadata';
import { PUZZLES } from '../src/puzzles';
import {
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  ENTITY_KINDS,
  MAX_HISTORY,
  RESTART,
  SIDES,
  applyCrossing,
  bankViolation,
  boatViolation,
  canRestart,
  canUndo,
  choosePuzzle,
  createInitialState,
  cross,
  crossingViolation,
  entityIndex,
  getPuzzle,
  isRiverState,
  isSolvedPosition,
  otherSide,
  positionViolation,
  progressOf,
  puzzleCount,
  puzzleOf,
  replay,
  resetState,
  restart,
  ruleComplete,
  ruleRefs,
  startPosition,
  toDifficulty,
  toggleBoat,
  tripsLeft,
  undo,
  validatePuzzle,
  weightOf,
  type Difficulty,
  type HistoryEntry,
  type Position,
  type PuzzleDef,
  type RiverState,
  type Side
} from '../src/rules';
import { bankOk, oracleCross, oracleSolve, positionOk, type OracleState } from './oracle';

/* ---------- Helpers and fixtures ---------- */

const allPuzzles = () => DIFFICULTIES.flatMap((difficulty) => PUZZLES[difficulty].map((puzzle, index) => ({ difficulty, index, puzzle })));
const stateOf = (difficulty: Difficulty, puzzle: number, history: HistoryEntry[] = [], boat: number[] = []): RiverState => ({
  seed: puzzle,
  difficulty,
  puzzle,
  history,
  boat
});

/** Easy 7, "Garden ferry": gardener 0 (rows), dog 1, goose 2, seeds 3; the goose is never with dog or seeds without the gardener. */
const GARDEN = 6;
const GARDEN_PLAN = [[0, 2], [0], [0, 1], [0, 2], [0, 3], [0], [0, 2]];
/** Easy 1, "Parcel run": courier 0 (rows), parcel 1, parcel 2; no company rules. */
const PARCELS = 0;

/** Loads exactly `group` into the boat through toggles (taking others out first), then crosses. */
function crossWith(state: RiverState, group: readonly number[]): RiverState {
  let s = state;
  for (const i of [...s.boat]) if (!group.includes(i)) s = toggleBoat(s, i).state;
  for (const i of group) if (!s.boat.includes(i)) s = toggleBoat(s, i).state;
  const result = cross(s);
  if (result.violation) throw new Error(`illegal crossing ${group.join('+')}: ${result.violation.kind}`);
  return result.state;
}
const playPlan = (state: RiverState, plan: readonly (readonly number[])[]) => plan.reduce((s, group) => crossWith(s, group), state);

/** Company rules: goose (2) never with dog (1) or seeds (3) unless keeper (0) or helper (4); dog and seeds never share the boat. */
const FIX_A: PuzzleDef = {
  id: 'fix-a',
  entities: [
    { id: 'k', kind: 'keeper', rower: true, weight: 60, trips: 4 },
    { id: 'dog', kind: 'dog', weight: 30 },
    { id: 'goose', kind: 'goose', weight: 20 },
    { id: 'seeds', kind: 'seeds', weight: 10 },
    { id: 'h', kind: 'assistant', rower: true, weight: 40 }
  ],
  capacity: 3,
  maxWeight: 100,
  maxCrossings: 6,
  rules: [
    { kind: 'apart', a: 'goose', b: ['dog', 'seeds'], unless: ['k', 'h'] },
    { kind: 'boatApart', a: 'dog', b: 'seeds' }
  ],
  minCrossings: 1
};

/** Rangers 0–1 must not be outnumbered by monkeys 2–3; children 5–6 need teacher 4. */
const FIX_B: PuzzleDef = {
  id: 'fix-b',
  entities: [
    { id: 'ranger-1', kind: 'ranger', n: 1, rower: true },
    { id: 'ranger-2', kind: 'ranger', n: 2, rower: true },
    { id: 'monkey-1', kind: 'monkey', n: 1 },
    { id: 'monkey-2', kind: 'monkey', n: 2 },
    { id: 'teacher', kind: 'teacher', rower: true },
    { id: 'child-1', kind: 'child', n: 1 },
    { id: 'child-2', kind: 'child', n: 2 }
  ],
  capacity: 2,
  rules: [
    { kind: 'outnumber', group: ['ranger-1', 'ranger-2'], by: ['monkey-1', 'monkey-2'] },
    { kind: 'needs', who: ['child-1', 'child-2'], any: ['teacher'] }
  ],
  minCrossings: 1
};

/** Sides with the given entity indices on the right. */
const rightOnly = (count: number, right: readonly number[]): Side[] => Array.from({ length: count }, (_, i) => (right.includes(i) ? 'right' : 'left'));
const positionOf = (count: number, right: readonly number[], boat: Side, extra: Partial<Position> = {}): Position => ({
  sides: rightOnly(count, right),
  boat,
  trips: Array.from({ length: count }, () => 0),
  crossings: 0,
  ...extra
});

/* ---------- Configuration and puzzle set ---------- */

describe('configuration', () => {
  it('declares difficulties easy → hard, 8 puzzles each, and the constants', () => {
    expect(DIFFICULTIES).toEqual(['easy', 'medium', 'hard']);
    expect(metadata.difficulties).toEqual(DIFFICULTIES);
    expect(DEFAULT_DIFFICULTY).toBe('easy');
    expect(SIDES).toEqual(['left', 'right']);
    expect(RESTART).toBe('restart');
    expect(MAX_HISTORY).toBe(10_000);
    for (const d of DIFFICULTIES) expect(puzzleCount(d)).toBe(8);
  });

  it('declares the metadata the spec asks for', () => {
    expect(metadata.id).toBe('river-crossing');
    expect(metadata.skills).toEqual(['planning', 'deduction']);
    expect(metadata.typicalMinutes).toEqual([2, 10]);
    expect(metadata.inputMethods).toEqual(['pointer', 'touch', 'keyboard']);
    expect(metadata.capabilities.offline).toBe(true);
    expect(metadata.messages.en?.title).toBe('River Crossing');
    expect(metadata.messages.de?.title).toBe('Flussüberquerung');
  });

  it('toDifficulty accepts known ids and falls back to easy', () => {
    expect(toDifficulty('easy')).toBe('easy');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('HARD')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
    expect(toDifficulty(1)).toBe('easy');
  });

  it('otherSide flips the bank', () => {
    expect(otherSide('left')).toBe('right');
    expect(otherSide('right')).toBe('left');
  });

  it('has valid puzzles with unique ids, ordered by optimum within the advertised ranges', () => {
    const bounds: Record<Difficulty, [number, number]> = { easy: [3, 7], medium: [7, 9], hard: [9, 13] };
    const all = allPuzzles();
    expect(new Set(all.map(({ puzzle }) => puzzle.id)).size).toBe(24);
    for (const { puzzle } of all) expect(validatePuzzle(puzzle), puzzle.id).toEqual([]);
    for (const d of DIFFICULTIES) {
      const optimum = PUZZLES[d].map((p) => p.minCrossings);
      expect([...optimum].sort((a, b) => a - b)).toEqual(optimum);
      expect(Math.min(...optimum)).toBe(bounds[d][0]);
      expect(Math.max(...optimum)).toBe(bounds[d][1]);
    }
  });

  it('uses every rule feature somewhere: all rule kinds, weights, trips, crossing limits and non-rowers', () => {
    const all = allPuzzles().map(({ puzzle }) => puzzle);
    const kinds = new Set(all.flatMap((p) => p.rules.map((r) => r.kind)));
    expect([...kinds].sort()).toEqual(['apart', 'boatApart', 'needs', 'outnumber']);
    expect(all.some((p) => p.maxWeight !== undefined)).toBe(true);
    expect(all.some((p) => p.maxCrossings !== undefined)).toBe(true);
    expect(all.some((p) => p.entities.some((e) => e.trips !== undefined))).toBe(true);
    expect(all.some((p) => p.entities.some((e) => e.rower !== true))).toBe(true);
    expect(new Set(all.flatMap((p) => p.entities.map((e) => e.kind))).size).toBe(ENTITY_KINDS.length);
  });

  it('getPuzzle returns the data and rejects unknown indices', () => {
    expect(getPuzzle('easy', GARDEN).id).toBe('garden');
    expect(getPuzzle('hard', 7)).toBe(PUZZLES.hard[7]);
    expect(() => getPuzzle('easy', 8)).toThrow(RangeError);
    expect(() => getPuzzle('medium', -1)).toThrow('No puzzle -1 in medium');
  });

  it('entityIndex finds ids and returns -1 for unknown ones', () => {
    expect(entityIndex(FIX_A, 'k')).toBe(0);
    expect(entityIndex(FIX_A, 'h')).toBe(4);
    expect(entityIndex(FIX_A, 'nobody')).toBe(-1);
  });
});

/* ---------- Solver proof ---------- */

describe('solver proof: every puzzle is solvable in exactly its recorded minimum of crossings', () => {
  it('the independent BFS oracle finds the recorded optimum, and its plan solves the puzzle through the real rules', () => {
    for (const { difficulty, index, puzzle } of allPuzzles()) {
      const solution = oracleSolve(puzzle);
      expect(solution?.crossings, puzzle.id).toBe(puzzle.minCrossings);
      const solved = playPlan(stateOf(difficulty, index), solution!.plan);
      const progress = progressOf(solved);
      expect(progress.solved, puzzle.id).toBe(true);
      expect(progress.position.crossings).toBe(puzzle.minCrossings);
      expect(progress.position.boat).toBe('right');
      expect(isRiverState(solved)).toBe(true);
    }
  }, 60_000);

  it('a crossing limit equal to the optimum leaves no slack: one wasted crossing makes the puzzle unsolvable', () => {
    const limited = allPuzzles().filter(({ puzzle }) => puzzle.maxCrossings !== undefined);
    expect(limited.map(({ puzzle }) => puzzle.id)).toEqual(['lab-night', 'monkeys-fuel', 'raft-long']);
    for (const { puzzle } of limited) {
      expect(puzzle.maxCrossings).toBe(puzzle.minCrossings);
      expect(oracleSolve({ ...puzzle, maxCrossings: puzzle.minCrossings - 1 })).toBeNull();
    }
  }, 30_000);
});

/* ---------- Constraint checker ---------- */

describe('bankViolation / positionViolation', () => {
  it('apart: reports the first present partner, and any "unless" entity lifts the rule', () => {
    const n = FIX_A.entities.length;
    expect(bankViolation(FIX_A, rightOnly(n, [1, 2]), 'right')).toEqual({ kind: 'apart', bank: 'right', rule: 0, a: 2, b: 1 });
    expect(bankViolation(FIX_A, rightOnly(n, [2, 3]), 'right')).toEqual({ kind: 'apart', bank: 'right', rule: 0, a: 2, b: 3 });
    expect(bankViolation(FIX_A, rightOnly(n, [1, 2, 3]), 'right')).toEqual({ kind: 'apart', bank: 'right', rule: 0, a: 2, b: 1 });
    expect(bankViolation(FIX_A, rightOnly(n, [1, 2, 3]), 'left')).toBeNull();
    expect(bankViolation(FIX_A, rightOnly(n, [0, 1, 2, 3]), 'right')).toBeNull();
    expect(bankViolation(FIX_A, rightOnly(n, [1, 2, 3, 4]), 'right')).toBeNull();
    expect(bankViolation(FIX_A, rightOnly(n, [1, 3]), 'right')).toBeNull();
    expect(bankViolation(FIX_A, rightOnly(n, [2]), 'right')).toBeNull();
    expect(bankViolation(FIX_A, rightOnly(n, [0, 4]), 'left')).toEqual({ kind: 'apart', bank: 'left', rule: 0, a: 2, b: 1 });
  });

  it('outnumber: only where the group is present, and equal numbers are fine', () => {
    const n = FIX_B.entities.length;
    expect(bankViolation(FIX_B, rightOnly(n, [0, 2, 3]), 'right')).toEqual({ kind: 'outnumber', bank: 'right', rule: 0, group: 1, by: 2 });
    expect(bankViolation(FIX_B, rightOnly(n, [2, 3]), 'right')).toBeNull();
    expect(bankViolation(FIX_B, rightOnly(n, [0, 2]), 'right')).toBeNull();
    expect(bankViolation(FIX_B, rightOnly(n, [0, 1, 2, 3]), 'right')).toBeNull();
    expect(bankViolation(FIX_B, rightOnly(n, [1, 4, 5, 6]), 'left')).toEqual({ kind: 'outnumber', bank: 'left', rule: 0, group: 1, by: 2 });
  });

  it('needs: lists every needy entity present when none of the helpers is there', () => {
    const n = FIX_B.entities.length;
    expect(bankViolation(FIX_B, rightOnly(n, [5]), 'right')).toEqual({ kind: 'needs', bank: 'right', rule: 1, who: [5] });
    expect(bankViolation(FIX_B, rightOnly(n, [5, 6]), 'right')).toEqual({ kind: 'needs', bank: 'right', rule: 1, who: [5, 6] });
    expect(bankViolation(FIX_B, rightOnly(n, [4, 5, 6]), 'right')).toBeNull();
    expect(bankViolation(FIX_B, rightOnly(n, [4]), 'right')).toBeNull();
    expect(bankViolation(FIX_B, rightOnly(n, [4, 6]), 'left')).toEqual({ kind: 'needs', bank: 'left', rule: 1, who: [5] });
  });

  it('reports rules in order and checks the requested bank first', () => {
    const n = FIX_B.entities.length;
    // Left: ranger-2, monkeys, children without teacher → both rules broken; rule 0 comes first.
    expect(bankViolation(FIX_B, rightOnly(n, [0, 4]), 'left')).toMatchObject({ kind: 'outnumber', rule: 0 });
    // Right: ranger-1 + both monkeys (outnumbered); left: children without teacher? teacher on left → fine.
    const both = rightOnly(n, [0, 2, 3, 4]);
    expect(positionViolation(FIX_B, both)).toMatchObject({ kind: 'needs', bank: 'left' });
    expect(positionViolation(FIX_B, both, 'left')).toMatchObject({ kind: 'needs', bank: 'left' });
    expect(positionViolation(FIX_B, both, 'right')).toMatchObject({ kind: 'outnumber', bank: 'right' });
    expect(positionViolation(FIX_B, rightOnly(n, [0, 2]))).toBeNull();
    expect(positionViolation(FIX_B, rightOnly(n, []))).toBeNull();
  });

  it('boat rules do not apply to banks', () => {
    expect(bankViolation(FIX_A, rightOnly(5, [1, 3]), 'right')).toBeNull();
  });
});

describe('boatViolation', () => {
  it('checks seats, rower, weight and boat rules in that order', () => {
    expect(boatViolation(FIX_A, [])).toEqual({ kind: 'empty' });
    expect(boatViolation(FIX_A, [0, 1, 2, 4])).toEqual({ kind: 'full', capacity: 3 });
    expect(boatViolation(FIX_A, [1, 2])).toEqual({ kind: 'noRower' });
    expect(boatViolation(FIX_A, [1, 2, 3])).toEqual({ kind: 'noRower' });
    expect(boatViolation(FIX_A, [0, 1, 2])).toEqual({ kind: 'weight', weight: 110, max: 100 });
    expect(boatViolation(FIX_A, [0, 4, 3])).toEqual({ kind: 'weight', weight: 110, max: 100 });
    expect(boatViolation(FIX_A, [0, 1, 3])).toEqual({ kind: 'boatApart', rule: 1, a: 1, b: 3 });
    expect(boatViolation(FIX_A, [4, 1, 3])).toEqual({ kind: 'boatApart', rule: 1, a: 1, b: 3 });
  });

  it('accepts legal loads, including exactly the weight limit and a full boat', () => {
    expect(boatViolation(FIX_A, [0, 4])).toBeNull();
    expect(boatViolation(FIX_A, [0])).toBeNull();
    expect(boatViolation(FIX_A, [4, 1, 2])).toBeNull();
    expect(boatViolation(FIX_A, [0, 1])).toBeNull();
    expect(boatViolation(FIX_B, [0, 1])).toBeNull();
    expect(boatViolation(FIX_B, [2, 3])).toEqual({ kind: 'noRower' });
    expect(boatViolation(FIX_A, [99, 0])).toBeNull();
    expect(boatViolation(FIX_A, [99])).toEqual({ kind: 'noRower' });
  });

  it('ignores weights without a weight limit', () => {
    expect(boatViolation({ ...FIX_A, maxWeight: undefined } as unknown as PuzzleDef, [0, 1, 2])).toBeNull();
  });

  it('weightOf sums known weights and treats missing ones as 0', () => {
    expect(weightOf(FIX_A, [])).toBe(0);
    expect(weightOf(FIX_A, [0, 1, 2, 3, 4])).toBe(160);
    expect(weightOf(FIX_B, [0, 1])).toBe(0);
    expect(weightOf(FIX_A, [0, 99])).toBe(60);
  });
});

describe('crossings', () => {
  it('startPosition puts everybody and the boat on the left', () => {
    expect(startPosition(FIX_A)).toEqual({ sides: ['left', 'left', 'left', 'left', 'left'], boat: 'left', trips: [0, 0, 0, 0, 0], crossings: 0 });
  });

  it('applyCrossing moves the passengers and the boat, counting trips, without mutating the input', () => {
    const start = startPosition(FIX_A);
    const next = applyCrossing(start, [0, 2]);
    expect(next).toEqual({ sides: ['right', 'left', 'right', 'left', 'left'], boat: 'right', trips: [1, 0, 1, 0, 0], crossings: 1 });
    expect(start).toEqual(startPosition(FIX_A));
    expect(applyCrossing(next, [0])).toEqual({ sides: ['left', 'left', 'right', 'left', 'left'], boat: 'left', trips: [2, 0, 1, 0, 0], crossings: 2 });
  });

  it('tripsLeft counts down for limited entities and is unlimited otherwise', () => {
    const pos = positionOf(5, [], 'left', { trips: [3, 0, 0, 0, 7] });
    expect(tripsLeft(FIX_A, pos, 0)).toBe(1);
    expect(tripsLeft(FIX_A, startPosition(FIX_A), 0)).toBe(4);
    expect(tripsLeft(FIX_A, pos, 4)).toBe(Infinity);
    expect(tripsLeft(FIX_A, pos, 99)).toBe(Infinity);
  });

  it('isSolvedPosition needs everybody on the right', () => {
    expect(isSolvedPosition(positionOf(3, [0, 1, 2], 'right'))).toBe(true);
    expect(isSolvedPosition(positionOf(3, [0, 1], 'right'))).toBe(false);
  });

  it('crossingViolation checks solved, bank, boat, trips, limit, then the bank left behind and the bank arrived at', () => {
    const start = startPosition(FIX_A);
    expect(crossingViolation(FIX_A, positionOf(5, [0, 1, 2, 3, 4], 'right'), [0])).toEqual({ kind: 'solved' });
    expect(crossingViolation(FIX_A, positionOf(5, [1], 'left'), [0, 1])).toEqual({ kind: 'notHere', entity: 1 });
    expect(crossingViolation(FIX_A, positionOf(5, [1], 'right'), [0, 1])).toEqual({ kind: 'notHere', entity: 0 });
    expect(crossingViolation(FIX_A, start, [])).toEqual({ kind: 'empty' });
    expect(crossingViolation(FIX_A, start, [1, 2])).toEqual({ kind: 'noRower' });
    expect(crossingViolation(FIX_A, positionOf(5, [], 'left', { trips: [4, 0, 0, 0, 0] }), [0, 4])).toEqual({ kind: 'trips', entity: 0, max: 4 });
    expect(crossingViolation(FIX_A, positionOf(5, [], 'left', { trips: [3, 0, 0, 0, 0] }), [0, 2])).toBeNull();
    expect(crossingViolation(FIX_A, positionOf(5, [], 'left', { crossings: 6 }), [0, 2])).toEqual({ kind: 'limit', max: 6 });
    expect(crossingViolation(FIX_A, positionOf(5, [], 'left', { crossings: 5 }), [0, 2])).toBeNull();
    // Keeper and helper leave goose with dog and seeds behind.
    expect(crossingViolation(FIX_A, start, [0, 4])).toEqual({ kind: 'apart', bank: 'left', rule: 0, a: 2, b: 1 });
    // Ranger-1 joins two monkeys on the right: broken on arrival.
    expect(crossingViolation(FIX_B, positionOf(7, [2, 3], 'left'), [0])).toEqual({ kind: 'outnumber', bank: 'right', rule: 0, group: 1, by: 2 });
    // Both banks broken: the bank left behind is reported first.
    expect(crossingViolation(FIX_B, positionOf(7, [2, 3], 'left'), [0, 4])).toEqual({ kind: 'needs', bank: 'left', rule: 1, who: [5, 6] });
    // Ranger-1 and the teacher row back, leaving only monkeys (no rangers to outnumber) behind.
    expect(crossingViolation(FIX_B, positionOf(7, [0, 2, 3, 4], 'right'), [0, 4])).toBeNull();
  });

  it('a crossing limit and a missing limit', () => {
    const noLimit = { ...FIX_A, maxCrossings: undefined } as unknown as PuzzleDef;
    expect(crossingViolation(noLimit, positionOf(5, [], 'left', { crossings: 500 }), [0, 2])).toBeNull();
  });
});

/* ---------- Agreement with the independent oracle ---------- */

describe('the rule checker agrees with the oracle', () => {
  const puzzleArb = fc.constantFrom(...DIFFICULTIES.flatMap((d) => [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [d, i] as const)));

  it('on random bank assignments (both banks and each bank)', () => {
    fc.assert(
      fc.property(puzzleArb, fc.array(fc.boolean(), { minLength: 12, maxLength: 12 }), ([d, i], bits) => {
        const puzzle = getPuzzle(d, i);
        const sides: Side[] = puzzle.entities.map((_, k) => (bits[k] ? 'right' : 'left'));
        const mask = sides.reduce((m, side, k) => (side === 'right' ? m | (1 << k) : m), 0);
        expect(positionViolation(puzzle, sides) === null).toBe(positionOk(puzzle, mask));
        for (const bank of SIDES) {
          const present = new Set(puzzle.entities.filter((_, k) => sides[k] === bank).map((e) => e.id));
          expect(bankViolation(puzzle, sides, bank) === null).toBe(bankOk(puzzle, present));
        }
      }),
      { numRuns: 1500 }
    );
  });

  it('on random crossings from random positions (including wrong-bank passengers, used trips and crossing counts)', () => {
    fc.assert(
      fc.property(
        puzzleArb,
        fc.array(fc.boolean(), { minLength: 12, maxLength: 12 }),
        fc.boolean(),
        fc.array(fc.integer({ min: 0, max: 6 }), { minLength: 12, maxLength: 12 }),
        fc.integer({ min: 0, max: 14 }),
        fc.subarray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
        ([d, i], bits, boatRight, used, crossings, group) => {
          const puzzle = getPuzzle(d, i);
          const n = puzzle.entities.length;
          const passengers = group.filter((k) => k < n);
          const position: Position = {
            sides: puzzle.entities.map((_, k) => (bits[k] ? 'right' : 'left')),
            boat: boatRight ? 'right' : 'left',
            trips: used.slice(0, n),
            crossings
          };
          if (isSolvedPosition(position)) return;
          const oracleState: OracleState = {
            right: position.sides.reduce((m, side, k) => (side === 'right' ? m | (1 << k) : m), 0),
            boatRight,
            used: used.slice(0, n),
            crossings
          };
          const ours = crossingViolation(puzzle, position, passengers);
          const theirs = oracleCross(puzzle, oracleState, passengers);
          expect(ours === null).toBe(theirs !== null);
          if (theirs) {
            const next = applyCrossing(position, passengers);
            expect(next.sides.map((side) => side === 'right')).toEqual(puzzle.entities.map((_, k) => ((theirs.right >> k) & 1) === 1));
            expect(next.boat === 'right').toBe(theirs.boatRight);
            expect(next.trips).toEqual(theirs.used);
            expect(next.crossings).toBe(theirs.crossings);
          }
        }
      ),
      { numRuns: 2000 }
    );
  });
});

/* ---------- Puzzle validation ---------- */

describe('validatePuzzle', () => {
  const base: PuzzleDef = {
    id: 'base',
    entities: [
      { id: 'keeper', kind: 'keeper', rower: true, weight: 50, trips: 3 },
      { id: 'dog', kind: 'dog', weight: 20 },
      { id: 'goose', kind: 'goose', weight: 10 }
    ],
    capacity: 2,
    maxWeight: 80,
    maxCrossings: 9,
    rules: [{ kind: 'apart', a: 'dog', b: ['goose'], unless: ['keeper'] }],
    minCrossings: 3
  };
  const withEntity = (patch: object, index = 0): PuzzleDef => ({ ...base, entities: base.entities.map((e, i) => (i === index ? { ...e, ...patch } : e)) });

  it('accepts a valid puzzle', () => {
    expect(validatePuzzle(base)).toEqual([]);
  });

  it('checks the entity list', () => {
    expect(validatePuzzle({ ...base, entities: base.entities.slice(0, 1), capacity: 1, rules: [] })).toEqual(['a puzzle needs 2–12 entities']);
    const thirteen = Array.from({ length: 13 }, (_, i) => ({ id: `robot-${i + 1}`, kind: 'robot' as const, rower: true }));
    expect(validatePuzzle({ ...base, entities: thirteen, maxWeight: undefined, rules: [] } as unknown as PuzzleDef)).toEqual(['a puzzle needs 2–12 entities']);
    expect(validatePuzzle(withEntity({ id: 'dog' }, 2))).toContain('entity ids must be unique');
    expect(validatePuzzle(withEntity({ id: 'Bad_Id' }, 1))).toContain('entity id "Bad_Id" must be kebab-case');
    expect(validatePuzzle(withEntity({ id: 'robot-2x' }, 1))).not.toContain('entity id "robot-2x" must be kebab-case');
    expect(validatePuzzle(withEntity({ id: '1robot' }, 1))).toContain('entity id "1robot" must be kebab-case');
    expect(validatePuzzle(withEntity({ kind: 'dragon' }, 1))).toEqual(['unknown kind "dragon"']);
    expect(validatePuzzle(withEntity({ id: 'dog_x' }, 1))).toContain('entity id "dog_x" must be kebab-case');
    expect(validatePuzzle({ ...base, entities: base.entities.slice(0, 2), rules: [] })).toEqual([]);
    const twelve = Array.from({ length: 12 }, (_, i) => ({ id: `robot-${i + 1}`, kind: 'robot' as const, rower: true }));
    expect(validatePuzzle({ ...base, entities: twelve, maxWeight: undefined, rules: [] } as unknown as PuzzleDef)).toEqual([]);
  });

  it('checks trips, weights and rowers', () => {
    expect(validatePuzzle(withEntity({ trips: 2 }, 1))).toEqual(['trip limit of "dog" needs a rower and 1–99 trips']);
    expect(validatePuzzle(withEntity({ trips: 0 }))).toEqual(['trip limit of "keeper" needs a rower and 1–99 trips']);
    expect(validatePuzzle(withEntity({ trips: 99 }))).toEqual([]);
    expect(validatePuzzle(withEntity({ trips: 100 }))).toEqual(['trip limit of "keeper" needs a rower and 1–99 trips']);
    expect(validatePuzzle(withEntity({ weight: 0 }, 1))).toEqual(['weight of "dog" needs a weight limit and 1–999 kg']);
    expect(validatePuzzle(withEntity({ weight: 999 }, 1))).toEqual([]);
    expect(validatePuzzle(withEntity({ weight: 1000 }, 1))).toEqual(['weight of "dog" needs a weight limit and 1–999 kg']);
    const noLimit = { ...base, maxWeight: undefined } as unknown as PuzzleDef;
    expect(validatePuzzle(noLimit)).toEqual([
      'weight of "keeper" needs a weight limit and 1–999 kg',
      'weight of "dog" needs a weight limit and 1–999 kg',
      'weight of "goose" needs a weight limit and 1–999 kg'
    ]);
    expect(validatePuzzle(withEntity({ rower: false, trips: undefined }))).toEqual(['nobody can row']);
  });

  it('checks the boat settings', () => {
    expect(validatePuzzle({ ...base, capacity: 0 })).toEqual(['capacity must be 1…entities']);
    expect(validatePuzzle({ ...base, capacity: 3 })).toEqual([]);
    expect(validatePuzzle({ ...base, capacity: 4 })).toEqual(['capacity must be 1…entities']);
    expect(validatePuzzle({ ...base, capacity: 1.5 })).toEqual(['capacity must be 1…entities']);
    expect(validatePuzzle({ ...base, maxWeight: 0 })).toEqual(['maxWeight must be a positive integer']);
    expect(validatePuzzle({ ...base, maxCrossings: 0 })).toEqual(['maxCrossings must be a positive integer']);
    expect(validatePuzzle({ ...base, maxCrossings: 999 })).toEqual([]);
    expect(validatePuzzle({ ...base, maxCrossings: 1000 })).toEqual(['maxCrossings must be a positive integer']);
  });

  it('checks rule references and completeness', () => {
    expect(validatePuzzle({ ...base, rules: [{ kind: 'boatApart', a: 'dog', b: 'cat' }] })).toEqual(['rule 1 refers to an unknown entity']);
    expect(validatePuzzle({ ...base, rules: [{ kind: 'boatApart', a: 'dog', b: 'dog' }] })).toEqual(['rule 1 repeats an entity']);
    expect(validatePuzzle({ ...base, rules: [{ kind: 'boatApart', a: 'dog', b: 'goose' }] })).toEqual([]);
    expect(validatePuzzle({ ...base, rules: [...base.rules, { kind: 'apart', a: 'dog', b: [], unless: ['keeper'] }] })).toEqual(['rule 2 is incomplete']);
    expect(validatePuzzle({ ...base, rules: [{ kind: 'needs', who: ['dog'], any: [] }] })).toEqual(['rule 1 is incomplete']);
    expect(validatePuzzle({ ...base, rules: [{ kind: 'outnumber', group: [], by: ['dog'] }] })).toEqual(['rule 1 is incomplete']);
  });

  it('rejects a starting position that already breaks a rule (only when everything else is fine)', () => {
    const crowded: PuzzleDef = { ...base, rules: [{ kind: 'outnumber', group: ['keeper'], by: ['dog', 'goose'] }] };
    expect(validatePuzzle(crowded)).toEqual(['the starting position breaks a rule']);
    expect(validatePuzzle({ ...crowded, capacity: 0 })).toEqual(['capacity must be 1…entities']);
  });

  it('ruleRefs and ruleComplete cover every rule kind', () => {
    expect(ruleRefs({ kind: 'apart', a: 'a', b: ['b', 'c'], unless: ['d'] })).toEqual(['a', 'b', 'c', 'd']);
    expect(ruleRefs({ kind: 'needs', who: ['a'], any: ['b', 'c'] })).toEqual(['a', 'b', 'c']);
    expect(ruleRefs({ kind: 'outnumber', group: ['a', 'b'], by: ['c'] })).toEqual(['a', 'b', 'c']);
    expect(ruleRefs({ kind: 'boatApart', a: 'a', b: 'b' })).toEqual(['a', 'b']);
    expect(ruleComplete({ kind: 'apart', a: 'a', b: ['b'], unless: ['c'] })).toBe(true);
    expect(ruleComplete({ kind: 'apart', a: 'a', b: ['b'], unless: [] })).toBe(false);
    expect(ruleComplete({ kind: 'apart', a: 'a', b: [], unless: ['c'] })).toBe(false);
    expect(ruleComplete({ kind: 'needs', who: ['a'], any: ['b'] })).toBe(true);
    expect(ruleComplete({ kind: 'needs', who: [], any: ['b'] })).toBe(false);
    expect(ruleComplete({ kind: 'needs', who: ['a'], any: [] })).toBe(false);
    expect(ruleComplete({ kind: 'outnumber', group: ['a'], by: ['b'] })).toBe(true);
    expect(ruleComplete({ kind: 'outnumber', group: ['a'], by: [] })).toBe(false);
    expect(ruleComplete({ kind: 'outnumber', group: [], by: ['b'] })).toBe(false);
    expect(ruleComplete({ kind: 'boatApart', a: 'a', b: 'b' })).toBe(true);
  });
});

/* ---------- History replay ---------- */

describe('replay', () => {
  const garden = () => getPuzzle('easy', GARDEN);

  it('starts at the start position', () => {
    expect(replay(garden(), [])).toEqual({ position: startPosition(garden()), solved: false, last: [] });
  });

  it('replays crossings and remembers the last crossing of the current attempt', () => {
    const progress = replay(garden(), [[0, 2], [0]]);
    expect(progress?.position).toEqual({ sides: ['left', 'left', 'right', 'left'], boat: 'left', trips: [2, 0, 1, 0], crossings: 2 });
    expect(progress?.last).toEqual([0]);
    expect(progress?.solved).toBe(false);
    expect(replay(garden(), GARDEN_PLAN)?.solved).toBe(true);
  });

  it('a restart returns to the start; the attempt before it is forgotten', () => {
    const progress = replay(garden(), [[0, 2], RESTART]);
    expect(progress).toEqual({ position: startPosition(garden()), solved: false, last: [] });
    expect(replay(garden(), [[0, 2], RESTART, [0, 2], [0]])?.position.crossings).toBe(2);
    expect(replay(garden(), [[0, 2], [0], RESTART, [0, 2]])?.last).toEqual([0, 2]);
  });

  it('rejects histories the rules cannot produce', () => {
    expect(replay(garden(), [RESTART])).toBeNull();
    expect(replay(garden(), [[0, 2], RESTART, RESTART])).toBeNull();
    expect(replay(garden(), [[0]])).toBeNull();
    expect(replay(garden(), [[]])).toBeNull();
    expect(replay(garden(), [[2, 0]])).toBeNull();
    expect(replay(garden(), [[0, 0]])).toBeNull();
    expect(replay(garden(), [[0.5]])).toBeNull();
    expect(replay(garden(), ['undo' as HistoryEntry])).toBeNull();
    expect(replay(garden(), [[0, 2], [0, 1]])).toBeNull();
    expect(replay(garden(), [...GARDEN_PLAN, [0]])).toBeNull();
    expect(replay(garden(), [...GARDEN_PLAN, RESTART])).toBeNull();
  });
});

/* ---------- Game state ---------- */

describe('game state', () => {
  it('createInitialState picks the puzzle from the seed and starts empty', () => {
    expect(createInitialState(13)).toEqual({ seed: 13, difficulty: 'easy', puzzle: 5, history: [], boat: [] });
    expect(createInitialState(8, 'hard')).toEqual({ seed: 8, difficulty: 'hard', puzzle: 0, history: [], boat: [] });
    expect(createInitialState(-1, 'medium')).toEqual({ seed: 0xffffffff, difficulty: 'medium', puzzle: 7, history: [], boat: [] });
    expect(createInitialState(42)).toEqual(createInitialState(42));
    expect(puzzleOf(createInitialState(6)).id).toBe('garden');
  });

  it('resetState returns to the seeded start', () => {
    const played = playPlan(stateOf('easy', GARDEN), GARDEN_PLAN.slice(0, 3));
    expect(resetState({ ...played, seed: 22, puzzle: 2 })).toEqual(createInitialState(22, 'easy'));
  });

  it('toggleBoat boards entities from the boat’s bank (kept sorted) and takes them out again', () => {
    const start = stateOf('easy', GARDEN);
    const a = toggleBoat(start, 2);
    expect(a).toEqual({ state: { ...start, boat: [2] }, refused: null });
    const b = toggleBoat(a.state, 0);
    expect(b).toEqual({ state: { ...start, boat: [0, 2] }, refused: null });
    expect(toggleBoat(b.state, 2)).toEqual({ state: { ...start, boat: [0] }, refused: null });
    expect(start.boat).toEqual([]);
  });

  it('toggleBoat refuses a full boat, the other bank, unknown entities and a solved puzzle', () => {
    const full = stateOf('easy', GARDEN, [], [0, 2]);
    expect(toggleBoat(full, 1)).toEqual({ state: full, refused: 'full' });
    expect(toggleBoat(full, 1).state).toBe(full);
    const crossed = stateOf('easy', GARDEN, [[0, 2]], [0, 2]);
    expect(toggleBoat(crossed, 1)).toEqual({ state: crossed, refused: 'notHere' });
    expect(toggleBoat(crossed, 99)).toEqual({ state: crossed, refused: 'notHere' });
    expect(toggleBoat(crossed, 2).state.boat).toEqual([0]);
    const solved = playPlan(stateOf('easy', GARDEN), GARDEN_PLAN);
    expect(toggleBoat(solved, 0)).toEqual({ state: solved, refused: 'solved' });
    // One seat left: the second passenger still fits.
    expect(toggleBoat(stateOf('easy', GARDEN, [], [0]), 1).refused).toBeNull();
  });

  it('cross applies a legal crossing; the passengers stay in the boat', () => {
    const loaded = stateOf('easy', GARDEN, [], [0, 2]);
    const result = cross(loaded);
    expect(result.violation).toBeNull();
    expect(result.state).toEqual(stateOf('easy', GARDEN, [[0, 2]], [0, 2]));
    expect(result.state.history[0]).not.toBe(loaded.boat);
    expect(result.state.boat).not.toBe(loaded.boat);
    expect(progressOf(result.state).position.boat).toBe('right');
  });

  it('cross does not apply an illegal crossing and explains it', () => {
    const empty = stateOf('easy', GARDEN);
    expect(cross(empty)).toEqual({ state: empty, violation: { kind: 'empty' } });
    expect(cross(empty).state).toBe(empty);
    const alone = stateOf('easy', GARDEN, [], [0]);
    expect(cross(alone)).toEqual({ state: alone, violation: { kind: 'apart', bank: 'left', rule: 0, a: 2, b: 1 } });
    const goose = stateOf('easy', GARDEN, [], [2]);
    expect(cross(goose).violation).toEqual({ kind: 'noRower' });
    const solved = playPlan(stateOf('easy', GARDEN), GARDEN_PLAN);
    expect(cross(solved)).toEqual({ state: solved, violation: { kind: 'solved' } });
  });

  it('cross stops at the history limit', () => {
    const history: HistoryEntry[] = Array.from({ length: MAX_HISTORY }, () => [0]);
    const long = stateOf('easy', PARCELS, history, [0]);
    expect(isRiverState(long)).toBe(true);
    expect(cross(long)).toEqual({ state: long, violation: { kind: 'limit', max: MAX_HISTORY } });
    expect(cross({ ...long, history: history.slice(1) }).violation).toBeNull();
    expect(restart(long)).toBe(long);
    expect(restart({ ...long, history: history.slice(1) }).history).toHaveLength(MAX_HISTORY);
  });

  it('undo takes back a crossing, putting its passengers back in the boat', () => {
    const start = stateOf('easy', GARDEN);
    expect(canUndo(start)).toBe(false);
    expect(undo(start)).toBe(start);
    const two = playPlan(start, GARDEN_PLAN.slice(0, 2));
    expect(two.boat).toEqual([0]);
    expect(canUndo(two)).toBe(true);
    const one = undo(two);
    expect(one).toEqual(stateOf('easy', GARDEN, [[0, 2]], [0]));
    expect(progressOf(one).position.boat).toBe('right');
    expect(undo(one)).toEqual(stateOf('easy', GARDEN, [], [0, 2]));
  });

  it('restart is recorded and undoable; undo brings back the last crossing’s boat load', () => {
    const start = stateOf('easy', GARDEN);
    expect(canRestart(start)).toBe(false);
    expect(restart(start)).toBe(start);
    const three = playPlan(start, GARDEN_PLAN.slice(0, 3));
    expect(canRestart(three)).toBe(true);
    const restarted = restart(three);
    expect(restarted).toEqual({ ...three, history: [...three.history, RESTART], boat: [] });
    expect(progressOf(restarted).position).toEqual(startPosition(puzzleOf(start)));
    expect(canRestart(restarted)).toBe(false);
    expect(canUndo(restarted)).toBe(true);
    expect(undo(restarted)).toEqual({ ...three, boat: [0, 1] });
  });

  it('a solved puzzle cannot be undone or restarted', () => {
    const solved = playPlan(stateOf('easy', GARDEN), GARDEN_PLAN);
    expect(progressOf(solved).solved).toBe(true);
    expect(canUndo(solved)).toBe(false);
    expect(undo(solved)).toBe(solved);
    expect(canRestart(solved)).toBe(false);
    expect(restart(solved)).toBe(solved);
  });

  it('choosePuzzle switches to a fresh puzzle of the same difficulty', () => {
    const start = stateOf('easy', GARDEN);
    expect(choosePuzzle(start, 2)).toEqual({ ...start, puzzle: 2 });
    expect(choosePuzzle(start, GARDEN)).toBe(start);
    expect(choosePuzzle(start, -1)).toBe(start);
    expect(choosePuzzle(start, 8)).toBe(start);
    expect(choosePuzzle(start, 1.5)).toBe(start);
    expect(choosePuzzle(start, 7).puzzle).toBe(7);
    const loaded = stateOf('easy', GARDEN, [], [0]);
    expect(choosePuzzle(loaded, GARDEN)).toEqual(start);
    const played = stateOf('easy', GARDEN, [[0, 2]], [0, 2]);
    expect(choosePuzzle(played, GARDEN)).toEqual(start);
    const unloaded = stateOf('easy', GARDEN, [[0, 2], [0]], []);
    expect(choosePuzzle(unloaded, GARDEN)).toEqual(start);
  });

  it('progressOf throws for an invalid history', () => {
    expect(() => progressOf(stateOf('easy', GARDEN, [[0]]))).toThrow('Invalid history');
  });

  it('random play through the real API keeps every state valid and the checker’s verdicts consistent', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...DIFFICULTIES),
        fc.integer({ min: 0, max: 7 }),
        fc.array(fc.oneof(fc.integer({ min: 0, max: 11 }), fc.constantFrom('cross', 'undo', 'restart')), { maxLength: 60 }),
        (difficulty, index, actions) => {
          let state = stateOf(difficulty, index);
          for (const action of actions) {
            const before = state;
            if (typeof action === 'number') state = toggleBoat(state, action).state;
            else if (action === 'cross') {
              const result = cross(state);
              state = result.state;
              if (result.violation) expect(state).toBe(before);
              else expect(state.history).toHaveLength(before.history.length + 1);
            } else if (action === 'undo') state = undo(state);
            else state = restart(state);
            expect(isRiverState(JSON.parse(JSON.stringify(state)))).toBe(true);
            const { position } = progressOf(state);
            expect(state.boat.every((i) => position.sides[i] === position.boat)).toBe(true);
            expect(state.boat.length).toBeLessThanOrEqual(puzzleOf(state).capacity);
          }
        }
      ),
      { numRuns: 300 }
    );
  });
});

/* ---------- Validation of untrusted saves ---------- */

describe('isRiverState', () => {
  const valid = () => stateOf('easy', GARDEN, [[0, 2], [0], RESTART, [0, 2]], [0, 2]);

  it('accepts valid states', () => {
    expect(isRiverState(valid())).toBe(true);
    expect(isRiverState(createInitialState(0xffffffff, 'hard'))).toBe(true);
    expect(isRiverState(playPlan(stateOf('easy', GARDEN), GARDEN_PLAN))).toBe(true);
    expect(isRiverState(stateOf('medium', 7))).toBe(true);
  });

  it('rejects bad fields', () => {
    const bad = (patch: Record<string, unknown>) => isRiverState({ ...valid(), ...patch });
    expect(isRiverState(null)).toBe(false);
    expect(isRiverState([])).toBe(false);
    expect(bad({ seed: -1 })).toBe(false);
    expect(bad({ seed: 2 ** 32 })).toBe(false);
    expect(bad({ seed: '1' })).toBe(false);
    expect(bad({ difficulty: 'expert' })).toBe(false);
    expect(bad({ puzzle: 8 })).toBe(false);
    expect(bad({ puzzle: -1 })).toBe(false);
    expect(bad({ puzzle: 1.5 })).toBe(false);
    expect(bad({ puzzle: 1 })).toBe(false);
    expect(bad({ history: 'none' })).toBe(false);
    expect(bad({ history: [[0, 2], 'undo'] })).toBe(false);
    expect(bad({ history: [[2, 0]] })).toBe(false);
    expect(bad({ history: [[0, '2']] })).toBe(false);
    expect(bad({ history: [[0]] })).toBe(false);
    expect(bad({ history: Array.from({ length: MAX_HISTORY + 1 }, () => [0]) , puzzle: PARCELS, boat: [] })).toBe(false);
    expect(bad({ boat: 'x' })).toBe(false);
    expect(bad({ boat: [2, 0] })).toBe(false);
    expect(bad({ boat: [0, 0] })).toBe(false);
    expect(bad({ boat: [1] })).toBe(false);
    expect(bad({ boat: [-1] })).toBe(false);
    expect(bad({ boat: [0, 1, 2] })).toBe(false);
    expect(bad({ history: [], boat: [0, 1, 2] })).toBe(false);
    expect(bad({ history: [], boat: [0, 1] })).toBe(true);
    expect(bad({ puzzle: '1' })).toBe(false);
    expect(bad({ boat: [0, 2] })).toBe(true);
    expect(bad({ boat: [] })).toBe(true);
    const { boat: _boat, ...noBoat } = valid();
    expect(isRiverState(noBoat)).toBe(false);
  });

  it('never throws, even for hostile objects', () => {
    const hostile = { ...valid() };
    Object.defineProperty(hostile, 'history', {
      enumerable: true,
      get() {
        throw new Error('boom');
      }
    });
    expect(isRiverState(hostile)).toBe(false);
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => isRiverState(value)).not.toThrow();
      }),
      { numRuns: 300 }
    );
  });
});
