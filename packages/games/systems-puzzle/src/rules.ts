/**
 * Flow Lab — pure, deterministic integer simulation of tanks, pipes and valves.
 *
 * One tick:
 *  1. A pipe flows when its valve is open and its float switch (if any) is not raised. A float switch
 *     is raised while its tank holds at least `at` litres at the start of the tick.
 *  2. Every flowing pipe draws up to `rate` litres from its source tank, using the level at the start
 *     of the tick. If a tank cannot serve all its pipes, lower-numbered pipes are served first.
 *  3. Water drawn by a normal pipe arrives at the end of the same tick; a slow pipe (`delay: 2`) holds
 *     it for one tick and delivers it at the end of the next tick (even if its valve was closed since).
 *  4. Arriving water is added to the destination tank. Whatever exceeds the tank's capacity spills over
 *     the rim and is lost for good (it is counted as spilled).
 * Water is conserved: tanks + pipes + spilled always equals the starting amount.
 *
 * The game state is the seed, difficulty, puzzle index and the list of player actions (valve toggles
 * and ticks); everything else is derived by replaying the actions. The goal is checked after the last tick.
 */
import { isArrayOf, isInt, isOneOf, isRecord, isUint32, normalizeSeed } from '@wp/game-core';
import { PUZZLES } from './puzzles';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

export interface TankDef {
  /** Capacity in litres. */
  cap: number;
  /** Starting level in litres. */
  level: number;
  /** Grid position in the schematic (0-based). */
  col: number;
  row: number;
}

export interface FloatDef {
  /** Tank index whose level raises the float. */
  tank: number;
  /** The pipe is held shut while that tank holds at least this many litres. */
  at: number;
}

export interface PipeDef {
  from: number;
  to: number;
  /** Litres per tick. */
  rate: number;
  /** Ticks until drawn water arrives (1 = same tick, 2 = one tick later). */
  delay?: 2;
  float?: FloatDef;
}

export interface TargetDef {
  tank: number;
  level: number;
}

export interface PuzzleDef {
  id: string;
  tanks: readonly TankDef[];
  pipes: readonly PipeDef[];
  /** Number of ticks the run lasts; the goal is checked after the last one. */
  ticks: number;
  targets: readonly TargetDef[];
  /** When true, no water may spill at any point. */
  noSpill?: boolean;
  /** Fewest valve changes that solve the puzzle (verified by the brute-force oracle in the tests). */
  minChanges: number;
}

/** Player action: a valve index (toggle that valve) or `TICK`. */
export const TICK = -1;
export type Action = number;

export interface FlowState {
  seed: number;
  difficulty: Difficulty;
  puzzle: number;
  actions: Action[];
}

export interface Sim {
  levels: number[];
  /** Water inside each pipe (only slow pipes ever hold water between ticks). */
  transit: number[];
  spilled: number;
  tick: number;
  valves: boolean[];
}

export interface TickReport {
  /** Litres moved by each pipe during the tick (drawn from the source). */
  moved: number[];
  /** Litres spilled by each tank during the tick. */
  spills: number[];
  /** Pipes whose open valve was held shut by a float switch. */
  held: number[];
}

export interface Progress {
  sim: Sim;
  /** Report of the latest tick, if any action so far was a tick. */
  last: TickReport | null;
  changes: number;
  solved: boolean;
  /** All ticks are used up. */
  over: boolean;
}

export type Refusal = 'solved' | 'over' | 'locked' | 'noValve';

export const MAX_TICKS = 12;
export const MAX_ACTIONS = 400;

export const puzzleCount = (difficulty: Difficulty): number => PUZZLES[difficulty].length;

export function getPuzzle(difficulty: Difficulty, index: number): PuzzleDef {
  const puzzle = PUZZLES[difficulty][index];
  if (!puzzle) throw new RangeError(`No puzzle ${index} for ${difficulty}`);
  return puzzle;
}

export const toDifficulty = (value: unknown): Difficulty => (isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY);

export const puzzleOf = (state: FlowState): PuzzleDef => getPuzzle(state.difficulty, state.puzzle);

export const totalWater = (sim: Sim): number =>
  sim.levels.reduce((a, b) => a + b, 0) + sim.transit.reduce((a, b) => a + b, 0) + sim.spilled;

export function initialSim(puzzle: PuzzleDef): Sim {
  return {
    levels: puzzle.tanks.map((tank) => tank.level),
    transit: puzzle.pipes.map(() => 0),
    spilled: 0,
    tick: 0,
    valves: puzzle.pipes.map(() => false)
  };
}

/** Whether a pipe's float switch currently holds it shut. */
export const floatRaised = (pipe: PipeDef, levels: readonly number[]): boolean =>
  pipe.float !== undefined && (levels[pipe.float.tank] ?? 0) >= pipe.float.at;

/** Pure tick function: returns the next simulation state and what happened. */
export function step(puzzle: PuzzleDef, sim: Sim): { sim: Sim; report: TickReport } {
  const left = [...sim.levels];
  const inflow = puzzle.tanks.map(() => 0);
  const moved: number[] = [];
  const held: number[] = [];
  const transit: number[] = [];
  puzzle.pipes.forEach((pipe, i) => {
    const raised = floatRaised(pipe, sim.levels);
    const flowing = sim.valves[i] === true && !raised;
    if (sim.valves[i] === true && raised) held.push(i);
    const drawn = flowing ? Math.min(pipe.rate, left[pipe.from] ?? 0) : 0;
    left[pipe.from] = (left[pipe.from] ?? 0) - drawn;
    moved.push(drawn);
    if (pipe.delay === 2) {
      inflow[pipe.to] = (inflow[pipe.to] ?? 0) + (sim.transit[i] ?? 0);
      transit.push(drawn);
    } else {
      inflow[pipe.to] = (inflow[pipe.to] ?? 0) + drawn;
      transit.push(0);
    }
  });
  const spills: number[] = [];
  const levels = puzzle.tanks.map((tank, t) => {
    const total = (left[t] ?? 0) + (inflow[t] ?? 0);
    spills.push(Math.max(0, total - tank.cap));
    return Math.min(tank.cap, total);
  });
  const spilled = sim.spilled + spills.reduce((a, b) => a + b, 0);
  return { sim: { levels, transit, spilled, tick: sim.tick + 1, valves: [...sim.valves] }, report: { moved, spills, held } };
}

/** Whether the goal holds in this simulation state (ignoring the tick count). */
export const goalMet = (puzzle: PuzzleDef, sim: Sim): boolean =>
  puzzle.targets.every((target) => sim.levels[target.tank] === target.level) && (puzzle.noSpill !== true || sim.spilled === 0);

/** Valves may only be changed before the first tick on easy, and between ticks otherwise. */
export const valvesLocked = (difficulty: Difficulty, sim: Sim): boolean => difficulty === 'easy' && sim.tick > 0;

/** Replays actions; returns null when an action is not allowed (invalid history). */
export function replay(puzzle: PuzzleDef, difficulty: Difficulty, actions: readonly Action[]): Progress | null {
  let sim = initialSim(puzzle);
  let last: TickReport | null = null;
  let changes = 0;
  let solved = false;
  for (const action of actions) {
    if (solved || sim.tick >= puzzle.ticks) return null;
    if (action === TICK) {
      const next = step(puzzle, sim);
      sim = next.sim;
      last = next.report;
      solved = sim.tick === puzzle.ticks && goalMet(puzzle, sim);
    } else {
      if (!isInt(action, 0, puzzle.pipes.length - 1) || valvesLocked(difficulty, sim)) return null;
      sim = { ...sim, valves: sim.valves.map((open, i) => (i === action ? !open : open)) };
      changes++;
    }
  }
  return { sim, last, changes, solved, over: sim.tick >= puzzle.ticks };
}

export function progressOf(state: FlowState): Progress {
  const progress = replay(puzzleOf(state), state.difficulty, state.actions);
  if (!progress) throw new Error('Invalid action history');
  return progress;
}

export function createInitialState(seed: number, difficulty: Difficulty = DEFAULT_DIFFICULTY): FlowState {
  const normalized = normalizeSeed(seed);
  return { seed: normalized, difficulty, puzzle: normalized % puzzleCount(difficulty), actions: [] };
}

/** The seeded starting state again. */
export const resetState = (state: FlowState): FlowState => createInitialState(state.seed, state.difficulty);

/** Restart the current puzzle (all valves closed, tick 0). */
export const restartPuzzle = (state: FlowState): FlowState => ({ ...state, actions: [] });

export function choosePuzzle(state: FlowState, index: number): FlowState {
  if (!isInt(index, 0, puzzleCount(state.difficulty) - 1)) return state;
  if (index === state.puzzle && state.actions.length === 0) return state;
  return { ...state, puzzle: index, actions: [] };
}

export type ActionResult = { state: FlowState; refused?: undefined } | { state: FlowState; refused: Refusal };

function blocked(state: FlowState): Refusal | undefined {
  const progress = progressOf(state);
  if (progress.solved) return 'solved';
  if (progress.over) return 'over';
  return undefined;
}

export function toggleValve(state: FlowState, valve: number): ActionResult {
  const reason = blocked(state);
  if (reason) return { state, refused: reason };
  if (!isInt(valve, 0, puzzleOf(state).pipes.length - 1)) return { state, refused: 'noValve' };
  if (valvesLocked(state.difficulty, progressOf(state).sim)) return { state, refused: 'locked' };
  return { state: { ...state, actions: [...state.actions, valve] } };
}

/** Runs `count` ticks (stopping at the end of the run). */
export function tick(state: FlowState, count = 1): ActionResult {
  const reason = blocked(state);
  if (reason) return { state, refused: reason };
  const remaining = puzzleOf(state).ticks - progressOf(state).sim.tick;
  const n = Math.max(1, Math.min(count, remaining));
  return { state: { ...state, actions: [...state.actions, ...Array.from({ length: n }, () => TICK)] } };
}

/** Runs all remaining ticks. */
export const runToEnd = (state: FlowState): ActionResult => tick(state, MAX_TICKS);

export const canUndo = (state: FlowState): boolean => state.actions.length > 0 && !progressOf(state).solved;

/** Takes back the latest action (a valve change or a tick). */
export function undo(state: FlowState): FlowState {
  if (!canUndo(state)) return state;
  return { ...state, actions: state.actions.slice(0, -1) };
}

/* ---------- Validation ---------- */

export function isFlowState(value: unknown): value is FlowState {
  try {
    if (!isRecord(value)) return false;
    const { seed, difficulty, puzzle, actions } = value;
    if (!isUint32(seed) || !isOneOf(difficulty, DIFFICULTIES)) return false;
    if (!isInt(puzzle, 0, puzzleCount(difficulty) - 1)) return false;
    if (!isArrayOf(actions, (a): a is number => isInt(a, TICK, 64)) || actions.length > MAX_ACTIONS) return false;
    return replay(getPuzzle(difficulty, puzzle), difficulty, actions) !== null;
  } catch {
    return false;
  }
}
