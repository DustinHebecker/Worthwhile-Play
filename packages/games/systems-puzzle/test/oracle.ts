/**
 * Independent brute-force oracle for Flow Lab puzzles. It re-implements the tick rules from the
 * written specification (not by calling rules.ts) and enumerates every valve setting per tick.
 */
import type { PuzzleDef } from '../src/rules';

export interface OracleState {
  levels: number[];
  pipes: number[];
  spilled: number;
}

/** One tick with valve configuration `open` (independent re-implementation). */
export function oracleTick(puzzle: PuzzleDef, state: OracleState, open: readonly boolean[]): OracleState {
  const start = state.levels;
  const remaining = start.slice();
  const arriving = new Array<number>(puzzle.tanks.length).fill(0);
  const pipes = new Array<number>(puzzle.pipes.length).fill(0);
  for (let i = 0; i < puzzle.pipes.length; i++) {
    const p = puzzle.pipes[i]!;
    let flows = open[i] === true;
    if (p.float && start[p.float.tank]! >= p.float.at) flows = false;
    let take = 0;
    if (flows) take = remaining[p.from]! < p.rate ? remaining[p.from]! : p.rate;
    remaining[p.from] = remaining[p.from]! - take;
    if (p.delay === 2) {
      arriving[p.to] = arriving[p.to]! + state.pipes[i]!;
      pipes[i] = take;
    } else {
      arriving[p.to] = arriving[p.to]! + take;
    }
  }
  let spilled = state.spilled;
  const levels = remaining.map((level, t) => {
    let next = level + arriving[t]!;
    const cap = puzzle.tanks[t]!.cap;
    if (next > cap) {
      spilled += next - cap;
      next = cap;
    }
    return next;
  });
  return { levels, pipes, spilled };
}

export const oracleStart = (puzzle: PuzzleDef): OracleState => ({
  levels: puzzle.tanks.map((t) => t.level),
  pipes: puzzle.pipes.map(() => 0),
  spilled: 0
});

export const oracleGoal = (puzzle: PuzzleDef, state: OracleState): boolean =>
  puzzle.targets.every((t) => state.levels[t.tank] === t.level) && !(puzzle.noSpill && state.spilled > 0);

/** All 2^n valve configurations. */
export function allConfigs(n: number): boolean[][] {
  const out: boolean[][] = [];
  for (let mask = 0; mask < 1 << n; mask++) out.push(Array.from({ length: n }, (_, i) => ((mask >> i) & 1) === 1));
  return out;
}

const hamming = (a: readonly boolean[], b: readonly boolean[]) => a.reduce((n, v, i) => n + (v === b[i] ? 0 : 1), 0);

export interface OracleSolution {
  minChanges: number;
  /** Valve configuration used for each tick. */
  plan: boolean[][];
}

/** Runs a full plan (one configuration per tick) and returns the end state. */
export function runPlan(puzzle: PuzzleDef, plan: readonly (readonly boolean[])[]): OracleState {
  let state = oracleStart(puzzle);
  for (const open of plan) state = oracleTick(puzzle, state, open);
  return state;
}

/**
 * Fewest valve changes (starting from all valves closed) that reach the goal after exactly
 * `puzzle.ticks` ticks. With `fixed`, the configuration chosen before the first tick is kept.
 */
export function oracleSolve(puzzle: PuzzleDef, fixed: boolean): OracleSolution | null {
  const configs = allConfigs(puzzle.pipes.length);
  const closed = configs[0]!;
  if (fixed) {
    let best: OracleSolution | null = null;
    for (const open of configs) {
      const plan = Array.from({ length: puzzle.ticks }, () => open);
      const end = runPlan(puzzle, plan);
      const cost = hamming(closed, open);
      if (oracleGoal(puzzle, end) && (!best || cost < best.minChanges)) best = { minChanges: cost, plan };
    }
    return best;
  }
  interface Node { state: OracleState; config: boolean[]; cost: number; plan: boolean[][] }
  let layer = new Map<string, Node>([['start', { state: oracleStart(puzzle), config: closed, cost: 0, plan: [] }]]);
  for (let t = 0; t < puzzle.ticks; t++) {
    const next = new Map<string, Node>();
    for (const node of layer.values()) {
      for (const open of configs) {
        const state = oracleTick(puzzle, node.state, open);
        if (puzzle.noSpill && state.spilled > 0) continue;
        const cost = node.cost + hamming(node.config, open);
        const key = `${state.levels.join(',')}|${state.pipes.join(',')}|${state.spilled}|${open.map(Number).join('')}`;
        const known = next.get(key);
        if (!known || cost < known.cost) next.set(key, { state, config: open, cost, plan: [...node.plan, open] });
      }
    }
    layer = next;
  }
  let best: OracleSolution | null = null;
  for (const node of layer.values()) {
    if (oracleGoal(puzzle, node.state) && (!best || node.cost < best.minChanges)) best = { minChanges: node.cost, plan: node.plan };
  }
  return best;
}

/** Number of fixed configurations that solve the puzzle. */
export const fixedSolutionCount = (puzzle: PuzzleDef): number =>
  allConfigs(puzzle.pipes.length).filter((open) => oracleGoal(puzzle, runPlan(puzzle, Array.from({ length: puzzle.ticks }, () => open)))).length;
