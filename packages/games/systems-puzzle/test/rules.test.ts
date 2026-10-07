import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  DIFFICULTIES,
  MAX_ACTIONS,
  MAX_TICKS,
  TICK,
  canUndo,
  choosePuzzle,
  createInitialState,
  floatRaised,
  getPuzzle,
  goalMet,
  initialSim,
  isFlowState,
  progressOf,
  puzzleCount,
  puzzleOf,
  replay,
  resetState,
  restartPuzzle,
  runToEnd,
  step,
  tick,
  toDifficulty,
  toggleValve,
  totalWater,
  undo,
  valvesLocked,
  type Action,
  type Difficulty,
  type FlowState,
  type PuzzleDef,
  type Sim
} from '../src/rules';
import { PUZZLES } from '../src/puzzles';
import { allConfigs, fixedSolutionCount, oracleSolve, oracleStart, oracleTick, runPlan } from './oracle';

const SLOW = 60_000;

/** A small hand-made puzzle for focused unit tests (not part of the game's puzzle list). */
const LAB: PuzzleDef = {
  id: 'lab',
  ticks: 4,
  tanks: [
    { cap: 9, level: 5, col: 0, row: 0 },
    { cap: 3, level: 0, col: 1, row: 0 },
    { cap: 9, level: 0, col: 2, row: 0 }
  ],
  pipes: [
    { from: 0, to: 1, rate: 2 },
    { from: 0, to: 2, rate: 4 },
    { from: 1, to: 2, rate: 1, delay: 2 }
  ],
  targets: [{ tank: 2, level: 1 }],
  minChanges: 1
};

const simOf = (puzzle: PuzzleDef, levels: number[], valves: boolean[], transit?: number[]): Sim => ({
  levels,
  transit: transit ?? puzzle.pipes.map(() => 0),
  spilled: 0,
  tick: 0,
  valves
});

const allPuzzles = () => DIFFICULTIES.flatMap((difficulty) => PUZZLES[difficulty].map((puzzle, index) => ({ difficulty, index, puzzle })));

/** Converts an oracle plan (valve configuration per tick) into game actions. */
function planToActions(plan: readonly (readonly boolean[])[], valves: number): Action[] {
  const actions: Action[] = [];
  let current = Array.from({ length: valves }, () => false);
  for (const open of plan) {
    open.forEach((v, i) => {
      if (v !== current[i]) actions.push(i);
    });
    current = [...open];
    actions.push(TICK);
  }
  return actions;
}

const stateOf = (difficulty: Difficulty, puzzle: number, actions: Action[] = []): FlowState => ({ seed: puzzle, difficulty, puzzle, actions });

describe('step (one tick)', () => {
  it('moves up to the rate from open pipes only', () => {
    const { sim, report } = step(LAB, simOf(LAB, [5, 0, 0], [true, false, false]));
    expect(sim.levels).toEqual([3, 2, 0]);
    expect(report.moved).toEqual([2, 0, 0]);
    expect(report.spills).toEqual([0, 0, 0]);
    expect(report.held).toEqual([]);
    expect(sim.tick).toBe(1);
    expect(sim.spilled).toBe(0);
  });

  it('serves lower-numbered pipes first when a tank runs short', () => {
    const { sim, report } = step(LAB, simOf(LAB, [5, 0, 0], [true, true, false]));
    expect(report.moved).toEqual([2, 3, 0]);
    expect(sim.levels).toEqual([0, 2, 3]);
    const short = step(LAB, simOf(LAB, [1, 0, 0], [true, true, false]));
    expect(short.report.moved).toEqual([1, 0, 0]);
    expect(short.sim.levels).toEqual([0, 1, 0]);
  });

  it('spills what exceeds the capacity and counts it as lost', () => {
    const { sim, report } = step(LAB, simOf(LAB, [5, 2, 0], [true, false, false]));
    expect(sim.levels).toEqual([3, 3, 0]);
    expect(report.spills).toEqual([0, 1, 0]);
    expect(sim.spilled).toBe(1);
    const again = step(LAB, { ...sim, levels: [3, 3, 0] });
    expect(again.sim.spilled).toBe(3);
    expect(again.report.spills).toEqual([0, 2, 0]);
  });

  it('uses start-of-tick levels: water arriving this tick cannot move on in the same tick', () => {
    const { sim } = step(LAB, simOf(LAB, [5, 0, 0], [true, false, true]));
    expect(sim.levels).toEqual([3, 2, 0]);
    expect(sim.transit).toEqual([0, 0, 0]);
  });

  it('a slow pipe delivers one tick later, even after its valve was closed', () => {
    const first = step(LAB, simOf(LAB, [0, 3, 0], [false, false, true]));
    expect(first.sim.levels).toEqual([0, 2, 0]);
    expect(first.sim.transit).toEqual([0, 0, 1]);
    expect(first.report.moved).toEqual([0, 0, 1]);
    const second = step(LAB, { ...first.sim, valves: [false, false, false] });
    expect(second.sim.levels).toEqual([0, 2, 1]);
    expect(second.sim.transit).toEqual([0, 0, 0]);
    expect(second.report.moved).toEqual([0, 0, 0]);
  });

  it('a raised float switch holds its valve shut, judged by the level at the start of the tick', () => {
    const puzzle: PuzzleDef = {
      ...LAB,
      tanks: [{ cap: 9, level: 9, col: 0, row: 0 }, { cap: 9, level: 0, col: 1, row: 0 }],
      pipes: [{ from: 0, to: 1, rate: 3, float: { tank: 1, at: 4 } }],
      targets: [{ tank: 1, level: 6 }]
    };
    const a = step(puzzle, simOf(puzzle, [9, 3], [true]));
    expect(a.sim.levels).toEqual([6, 6]);
    expect(a.report.held).toEqual([]);
    const b = step(puzzle, a.sim);
    expect(b.sim.levels).toEqual([6, 6]);
    expect(b.report.held).toEqual([0]);
    expect(b.report.moved).toEqual([0]);
    expect(floatRaised(puzzle.pipes[0]!, [6, 4])).toBe(true);
    expect(floatRaised(puzzle.pipes[0]!, [6, 3])).toBe(false);
    expect(floatRaised(LAB.pipes[0]!, [9, 9, 9])).toBe(false);
    const closed = step(puzzle, { ...a.sim, valves: [false] });
    expect(closed.report.held).toEqual([]);
  });

  it('is pure: does not mutate its input and is deterministic', () => {
    const input = simOf(LAB, [5, 1, 0], [true, true, true], [0, 0, 1]);
    const copy = JSON.parse(JSON.stringify(input)) as Sim;
    const a = step(LAB, input);
    const b = step(LAB, input);
    expect(input).toEqual(copy);
    expect(a).toEqual(b);
    expect(a.sim.valves).not.toBe(input.valves);
  });

  it('agrees with the independent oracle tick on random valve plans (fast-check)', () => {
    const puzzles = allPuzzles();
    fc.assert(
      fc.property(fc.integer({ min: 0, max: puzzles.length - 1 }), fc.array(fc.array(fc.boolean(), { minLength: 5, maxLength: 5 }), { maxLength: 12 }), (pi, plan) => {
        const { puzzle } = puzzles[pi]!;
        let sim = initialSim(puzzle);
        let oracle = oracleStart(puzzle);
        for (const raw of plan) {
          const open = raw.slice(0, puzzle.pipes.length);
          sim = step(puzzle, { ...sim, valves: open }).sim;
          oracle = oracleTick(puzzle, oracle, open);
          expect(sim.levels).toEqual(oracle.levels);
          expect(sim.transit).toEqual(oracle.pipes);
          expect(sim.spilled).toBe(oracle.spilled);
        }
      }),
      { numRuns: 300 }
    );
  });

  it('conserves water: tanks + pipes + spilled equals the start amount (fast-check)', () => {
    const puzzles = allPuzzles();
    fc.assert(
      fc.property(fc.integer({ min: 0, max: puzzles.length - 1 }), fc.array(fc.integer({ min: -1, max: 4 }), { maxLength: 40 }), (pi, raw) => {
        const { puzzle } = puzzles[pi]!;
        const start = puzzle.tanks.reduce((sum, tank) => sum + tank.level, 0);
        let sim = initialSim(puzzle);
        expect(totalWater(sim)).toBe(start);
        for (const action of raw) {
          if (action === TICK) {
            const { sim: next, report } = step(puzzle, sim);
            const spilledNow = report.spills.reduce((a, b) => a + b, 0);
            expect(next.spilled - sim.spilled).toBe(spilledNow);
            sim = next;
          } else if (action < puzzle.pipes.length) {
            sim = { ...sim, valves: sim.valves.map((v, i) => (i === action ? !v : v)) };
          }
          expect(totalWater(sim)).toBe(start);
          sim.levels.forEach((level, t) => {
            expect(level).toBeGreaterThanOrEqual(0);
            expect(level).toBeLessThanOrEqual(puzzle.tanks[t]!.cap);
          });
        }
      }),
      { numRuns: 300 }
    );
  });
});

describe('puzzle catalogue', () => {
  it('has 8 well-formed puzzles per difficulty', () => {
    for (const difficulty of DIFFICULTIES) {
      expect(puzzleCount(difficulty)).toBe(8);
      const ids = new Set<string>();
      for (const puzzle of PUZZLES[difficulty]) {
        ids.add(puzzle.id);
        expect(puzzle.ticks).toBeGreaterThan(0);
        expect(puzzle.ticks).toBeLessThanOrEqual(MAX_TICKS);
        expect(puzzle.pipes.length).toBeGreaterThan(0);
        expect(puzzle.pipes.length).toBeLessThanOrEqual(9);
        const cells = new Set(puzzle.tanks.map((tank) => `${tank.col},${tank.row}`));
        expect(cells.size).toBe(puzzle.tanks.length);
        for (const tank of puzzle.tanks) {
          expect(tank.level).toBeGreaterThanOrEqual(0);
          expect(tank.level).toBeLessThanOrEqual(tank.cap);
          expect(tank.col).toBeLessThanOrEqual(2);
          expect(tank.row).toBeLessThanOrEqual(1);
        }
        for (const pipe of puzzle.pipes) {
          expect(pipe.from).not.toBe(pipe.to);
          expect(puzzle.tanks[pipe.from]).toBeDefined();
          expect(puzzle.tanks[pipe.to]).toBeDefined();
          expect(pipe.rate).toBeGreaterThan(0);
          if (pipe.float) expect(pipe.float.at).toBeLessThanOrEqual(puzzle.tanks[pipe.float.tank]!.cap);
        }
        for (const target of puzzle.targets) expect(target.level).toBeLessThanOrEqual(puzzle.tanks[target.tank]!.cap);
        // The goal is not already met at the start.
        expect(goalMet(puzzle, initialSim(puzzle))).toBe(false);
      }
      expect(ids.size).toBe(8);
    }
  });

  it('hard puzzles all contain feedback (float switch) or delay (slow pipe); easy and medium do not', () => {
    for (const difficulty of DIFFICULTIES) {
      for (const puzzle of PUZZLES[difficulty]) {
        const special = puzzle.pipes.some((pipe) => pipe.float !== undefined || pipe.delay === 2);
        expect(special).toBe(difficulty === 'hard');
      }
    }
  });

  it('easy: every valve setting settles before the last tick (run until stable)', () => {
    for (const puzzle of PUZZLES.easy) {
      for (const open of allConfigs(puzzle.pipes.length)) {
        const end = runPlan(puzzle, Array.from({ length: puzzle.ticks }, () => open));
        const more = oracleTick(puzzle, end, open);
        expect(more.levels, puzzle.id).toEqual(end.levels);
        expect(more.spilled, puzzle.id).toBe(end.spilled);
      }
    }
  });

  it('easy: solvable with one fixed setting; minChanges matches the brute-force oracle', () => {
    for (const puzzle of PUZZLES.easy) {
      const solution = oracleSolve(puzzle, true);
      expect(solution, puzzle.id).not.toBeNull();
      expect(solution!.minChanges, puzzle.id).toBe(puzzle.minChanges);
      expect(fixedSolutionCount(puzzle), puzzle.id).toBeGreaterThan(0);
      expect(puzzle.minChanges).toBeGreaterThanOrEqual(2);
    }
  });

  it('medium and hard: solvable, minChanges matches the oracle, and no fixed setting suffices', { timeout: SLOW }, () => {
    for (const difficulty of ['medium', 'hard'] as const) {
      for (const puzzle of PUZZLES[difficulty]) {
        const solution = oracleSolve(puzzle, false);
        expect(solution, puzzle.id).not.toBeNull();
        expect(solution!.minChanges, puzzle.id).toBe(puzzle.minChanges);
        expect(oracleSolve(puzzle, true), puzzle.id).toBeNull();
        expect(fixedSolutionCount(puzzle), puzzle.id).toBe(0);
      }
    }
  });

  it('the oracle plan, played as game actions, solves every puzzle with exactly minChanges', { timeout: SLOW }, () => {
    for (const { difficulty, index, puzzle } of allPuzzles()) {
      const solution = oracleSolve(puzzle, difficulty === 'easy')!;
      const actions = planToActions(solution.plan, puzzle.pipes.length);
      const progress = replay(puzzle, difficulty, actions);
      expect(progress, puzzle.id).not.toBeNull();
      expect(progress!.solved, puzzle.id).toBe(true);
      expect(progress!.over).toBe(true);
      expect(progress!.changes).toBe(puzzle.minChanges);
      expect(isFlowState(stateOf(difficulty, index, actions))).toBe(true);
    }
  });

  it('getPuzzle throws for unknown indices', () => {
    expect(() => getPuzzle('easy', 8)).toThrow(RangeError);
    expect(() => getPuzzle('hard', -1)).toThrow(RangeError);
    expect(getPuzzle('medium', 0)).toBe(PUZZLES.medium[0]);
  });
});

describe('goal and locking', () => {
  it('goalMet checks every target and the no-overflow rule', () => {
    const puzzle: PuzzleDef = { ...LAB, targets: [{ tank: 1, level: 2 }, { tank: 2, level: 3 }], noSpill: true };
    expect(goalMet(puzzle, simOf(puzzle, [0, 2, 3], [false, false, false]))).toBe(true);
    expect(goalMet(puzzle, simOf(puzzle, [0, 2, 2], [false, false, false]))).toBe(false);
    expect(goalMet(puzzle, simOf(puzzle, [0, 1, 3], [false, false, false]))).toBe(false);
    expect(goalMet(puzzle, { ...simOf(puzzle, [0, 2, 3], [false, false, false]), spilled: 1 })).toBe(false);
    expect(goalMet({ ...puzzle, noSpill: false }, { ...simOf(puzzle, [0, 2, 3], [false, false, false]), spilled: 1 })).toBe(true);
  });

  it('valves lock after the first tick on easy only', () => {
    const sim = initialSim(LAB);
    expect(valvesLocked('easy', sim)).toBe(false);
    expect(valvesLocked('easy', { ...sim, tick: 1 })).toBe(true);
    expect(valvesLocked('medium', { ...sim, tick: 1 })).toBe(false);
    expect(valvesLocked('hard', { ...sim, tick: 3 })).toBe(false);
  });

  it('initialSim starts with all valves closed and empty pipes', () => {
    const sim = initialSim(LAB);
    expect(sim).toEqual({ levels: [5, 0, 0], transit: [0, 0, 0], spilled: 0, tick: 0, valves: [false, false, false] });
  });
});

describe('replay', () => {
  it('derives valves, changes, ticks and the last report', () => {
    const progress = replay(LAB, 'medium', [0, TICK, 0, 1, TICK])!;
    expect(progress.sim.valves).toEqual([false, true, false]);
    expect(progress.changes).toBe(3);
    expect(progress.sim.tick).toBe(2);
    expect(progress.sim.levels).toEqual([0, 2, 3]);
    expect(progress.last?.moved).toEqual([0, 3, 0]);
    expect(progress.solved).toBe(false);
    expect(progress.over).toBe(false);
    expect(replay(LAB, 'medium', [])).toEqual({ sim: initialSim(LAB), last: null, changes: 0, solved: false, over: false });
  });

  it('rejects valve changes after the first tick on easy, but allows them on medium', () => {
    expect(replay(LAB, 'easy', [0, TICK, 1])).toBeNull();
    expect(replay(LAB, 'easy', [0, 1, 1, TICK])).not.toBeNull();
    expect(replay(LAB, 'medium', [0, TICK, 1])).not.toBeNull();
  });

  it('rejects unknown valves and anything after the last tick or after solving', () => {
    expect(replay(LAB, 'medium', [3])).toBeNull();
    expect(replay(LAB, 'medium', [-2])).toBeNull();
    expect(replay(LAB, 'medium', [0.5])).toBeNull();
    const fourTicks = [TICK, TICK, TICK, TICK];
    expect(replay(LAB, 'medium', fourTicks)!.over).toBe(true);
    expect(replay(LAB, 'medium', [...fourTicks, TICK])).toBeNull();
    expect(replay(LAB, 'medium', [...fourTicks, 0])).toBeNull();
    // LAB goal: tank C holds exactly 1 after tick 4 — slow pipe from B delivers it.
    const solved = [1, TICK, 1, 0, TICK, 0, 2, TICK, 2, TICK];
    const progress = replay(LAB, 'medium', solved)!;
    expect(progress.sim.levels[2]).toBe(4);
    const exact = replay(LAB, 'medium', [0, TICK, 0, 2, TICK, 2, TICK, TICK])!;
    expect(exact.sim.levels).toEqual([3, 1, 1]);
    expect(exact.solved).toBe(true);
    expect(replay(LAB, 'medium', [0, TICK, 0, 2, TICK, 2, TICK, TICK, 0])).toBeNull();
  });

  it('only checks the goal after the last tick', () => {
    const puzzle: PuzzleDef = { ...LAB, targets: [{ tank: 1, level: 2 }] };
    const early = replay(puzzle, 'medium', [0, TICK, 0])!;
    expect(goalMet(puzzle, early.sim)).toBe(true);
    expect(early.solved).toBe(false);
    expect(replay(puzzle, 'medium', [0, TICK, 0, TICK, TICK, TICK])!.solved).toBe(true);
  });
});

describe('state actions', () => {
  it('createInitialState picks the puzzle from the seed', () => {
    expect(createInitialState(11, 'medium')).toEqual({ seed: 11, difficulty: 'medium', puzzle: 3, actions: [] });
    expect(createInitialState(8)).toEqual({ seed: 8, difficulty: 'easy', puzzle: 0, actions: [] });
    expect(createInitialState(-1).seed).toBe(0xffffffff);
  });

  it('toDifficulty accepts known ids only', () => {
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('extreme')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
  });

  it('toggleValve appends the valve and refuses when locked, unknown, over or solved', () => {
    const state = stateOf('easy', 0);
    const opened = toggleValve(state, 1);
    expect(opened.refused).toBeUndefined();
    expect(opened.state.actions).toEqual([1]);
    expect(state.actions).toEqual([]);
    expect(toggleValve(state, 3)).toEqual({ state, refused: 'noValve' });
    expect(toggleValve(state, -1)).toEqual({ state, refused: 'noValve' });
    const ticked = stateOf('easy', 0, [0, TICK]);
    expect(toggleValve(ticked, 1)).toEqual({ state: ticked, refused: 'locked' });
    const medium = stateOf('medium', 0, [0, TICK]);
    expect(toggleValve(medium, 1).state.actions).toEqual([0, TICK, 1]);
    const over = stateOf('medium', 0, [TICK, TICK, TICK, TICK]);
    expect(toggleValve(over, 0)).toEqual({ state: over, refused: 'over' });
  });

  it('tick adds one tick, clamps counts, and runToEnd finishes the run', () => {
    const state = stateOf('medium', 0, [0]);
    expect(tick(state).state.actions).toEqual([0, TICK]);
    expect(tick(state, 0).state.actions).toEqual([0, TICK]);
    expect(tick(state, 2).state.actions).toEqual([0, TICK, TICK]);
    const ran = runToEnd(state).state;
    expect(ran.actions).toEqual([0, TICK, TICK, TICK, TICK]);
    expect(progressOf(ran).over).toBe(true);
    expect(tick(ran)).toEqual({ state: ran, refused: 'over' });
    const nearly = stateOf('medium', 0, [TICK, TICK, TICK]);
    expect(runToEnd(nearly).state.actions).toHaveLength(4);
  });

  it('refuses everything once solved and reports it', () => {
    const puzzle = getPuzzle('medium', 0);
    const solution = oracleSolve(puzzle, false)!;
    const solved = stateOf('medium', 0, planToActions(solution.plan, puzzle.pipes.length));
    expect(progressOf(solved).solved).toBe(true);
    expect(toggleValve(solved, 0)).toEqual({ state: solved, refused: 'solved' });
    expect(tick(solved)).toEqual({ state: solved, refused: 'solved' });
    expect(canUndo(solved)).toBe(false);
    expect(undo(solved)).toBe(solved);
  });

  it('undo takes back the latest action, valve change or tick', () => {
    const state = stateOf('medium', 0, [0, TICK, 1]);
    expect(canUndo(state)).toBe(true);
    const a = undo(state);
    expect(a.actions).toEqual([0, TICK]);
    const b = undo(a);
    expect(b.actions).toEqual([0]);
    expect(progressOf(b).sim.tick).toBe(0);
    expect(progressOf(b).sim.valves[0]).toBe(true);
    const c = undo(b);
    expect(c.actions).toEqual([]);
    expect(canUndo(c)).toBe(false);
    expect(undo(c)).toBe(c);
    // An undone easy tick unlocks the valves again.
    const easy = stateOf('easy', 0, [0, TICK]);
    expect(toggleValve(undo(easy), 1).refused).toBeUndefined();
  });

  it('undo reverses toggles exactly (fast-check)', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 2 }), { maxLength: 20 }), (valves) => {
        let state = stateOf('medium', 0);
        const history: FlowState[] = [state];
        for (const v of valves) {
          state = toggleValve(state, v % puzzleOf(state).pipes.length).state;
          history.push(state);
        }
        for (let i = history.length - 1; i > 0; i--) {
          state = undo(state);
          expect(state).toEqual(history[i - 1]);
        }
      })
    );
  });

  it('restartPuzzle clears actions; resetState returns to the seeded puzzle', () => {
    const state: FlowState = { seed: 9, difficulty: 'hard', puzzle: 4, actions: [0, TICK] };
    expect(restartPuzzle(state)).toEqual({ seed: 9, difficulty: 'hard', puzzle: 4, actions: [] });
    expect(resetState(state)).toEqual({ seed: 9, difficulty: 'hard', puzzle: 1, actions: [] });
  });

  it('choosePuzzle switches puzzles and ignores invalid or no-op choices', () => {
    const state = stateOf('easy', 2, [0]);
    expect(choosePuzzle(state, 5)).toEqual({ ...state, puzzle: 5, actions: [] });
    expect(choosePuzzle(state, 2)).toEqual({ ...state, actions: [] });
    const fresh = stateOf('easy', 2);
    expect(choosePuzzle(fresh, 2)).toBe(fresh);
    expect(choosePuzzle(fresh, 8)).toBe(fresh);
    expect(choosePuzzle(fresh, -1)).toBe(fresh);
    expect(choosePuzzle(fresh, 7)).toEqual({ ...fresh, puzzle: 7 });
  });

  it('progressOf throws for an impossible history', () => {
    expect(() => progressOf(stateOf('easy', 0, [0, TICK, 1]))).toThrow();
  });
});

describe('isFlowState', () => {
  it('accepts valid states', () => {
    expect(isFlowState(stateOf('easy', 0))).toBe(true);
    expect(isFlowState(stateOf('medium', 7, [0, TICK, 1, TICK]))).toBe(true);
    expect(isFlowState({ seed: 0xffffffff, difficulty: 'hard', puzzle: 0, actions: [] })).toBe(true);
  });

  it('rejects malformed or inconsistent data', () => {
    const ok = stateOf('easy', 0, [0, TICK]);
    const bad: unknown[] = [
      null,
      [],
      { ...ok, seed: -1 },
      { ...ok, seed: 1.5 },
      { ...ok, seed: 2 ** 32 },
      { ...ok, difficulty: 'extreme' },
      { ...ok, puzzle: 8 },
      { ...ok, puzzle: -1 },
      { ...ok, puzzle: '0' },
      { ...ok, actions: 'x' },
      { ...ok, actions: [0, 'tick'] },
      { ...ok, actions: [-2] },
      { ...ok, actions: [65] },
      { ...ok, actions: [0, TICK, 1] },
      { ...ok, actions: [3] },
      { ...ok, actions: Array.from({ length: MAX_ACTIONS + 2 }, (_, i) => i % 2) },
      { seed: 1, difficulty: 'easy', puzzle: 0 }
    ];
    for (const value of bad) expect(isFlowState(value)).toBe(false);
    expect(isFlowState({ ...ok, actions: Array.from({ length: MAX_ACTIONS }, (_, i) => i % 2) })).toBe(true);
  });

  it('never throws on arbitrary input (fast-check)', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => isFlowState(value)).not.toThrow();
      })
    );
    fc.assert(
      fc.property(fc.record({ seed: fc.nat(), difficulty: fc.constantFrom(...DIFFICULTIES), puzzle: fc.integer({ min: 0, max: 7 }), actions: fc.array(fc.integer({ min: -1, max: 4 }), { maxLength: 30 }) }), (value) => {
        const valid = isFlowState(value);
        expect(valid).toBe(replay(getPuzzle(value.difficulty, value.puzzle), value.difficulty, value.actions) !== null);
      })
    );
  });
});
