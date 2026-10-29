import { createRng, type Rng } from '@wp/game-core';
import { childrenOf, cloneCursor, parseMove, startCursor, step, type Child, type Cursor, type Table } from '../src/engine';
import { identitiesOf } from '../src/hint';
import { picker, run, runPolicy, type Budget, type PolicyId } from '../src/policies';
import { keyOf } from '../src/solver';
import { tableOfState, type Move, type PeelState } from '../src/rules';

/**
 * The doom measurement of design v3 § 1.1, shared by the benchmark (`scripts/doom-report.ts`) and the CI guard in
 * `generator.slow.test.ts`. Exact solvability is out of reach on real games, so a position counts as solvable when a
 * one-sided oracle finds a solution: "follow the plan", the policies P1–P4, noisy rollouts, then a plan-guided
 * depth-first search with a failure memo. Otherwise it counts as doomed (proven when the search was exhausted). Delays
 * are therefore upper bounds; every variant is measured with the same oracle.
 */

export interface OracleOptions {
  /** Noisy rollouts (noise 5–30 %, around the plan, tidy and cautious). */
  rollouts: number;
  /** Expanded nodes of the final search. */
  nodes: number;
}

export const ORACLE: OracleOptions = { rollouts: 40, nodes: 4000 };
export const QUICK_ORACLE: OracleOptions = { rollouts: 8, nodes: 600 };

export type Verdict = 'solvable' | 'doomed' | 'proven';

/** A plan picker that follows the actual chosen children (so noise does not desynchronise it). */
function planRanker(witnessIds: readonly string[], playedIds: readonly string[]) {
  const at = new Map<string, number[]>();
  witnessIds.forEach((id, i) => at.set(id, [...(at.get(id) ?? []), i]));
  const used = new Map<string, number>();
  for (const id of playedIds) used.set(id, (used.get(id) ?? 0) + 1);
  const idOf = (c: Child) => `${c.lane}.${c.shooterIndex}`;
  const rank = (c: Child) => at.get(idOf(c))?.[used.get(idOf(c)) ?? 0] ?? Infinity;
  const record = (c: Child, delta = 1) => used.set(idOf(c), (used.get(idOf(c)) ?? 0) + delta);
  return { rank, record };
}

const tidy = picker('tidy');
const cautious = picker('cautious');

function planPick(ranker: ReturnType<typeof planRanker>, children: readonly Child[]): Child {
  let best = Infinity;
  let pool: Child[] = [];
  for (const c of children) {
    const r = ranker.rank(c);
    if (r < best) {
      best = r;
      pool = [c];
    } else if (r === best) pool.push(c);
  }
  return best < Infinity && pool.length > 0 ? (pool.length === 1 ? (pool[0] as Child) : tidy.pick(pool)) : tidy.pick(children);
}

function noisy(rng: Rng, noise: number, base: 'plan' | 'tidy' | 'cautious', witnessIds: readonly string[], playedIds: readonly string[]) {
  const ranker = planRanker(witnessIds, playedIds);
  return (children: readonly Child[]): Child => {
    let c: Child;
    if (rng.next() < noise) c = children[rng.int(0, children.length - 1)] as Child;
    else if (base === 'plan') c = planPick(ranker, children);
    else c = (base === 'tidy' ? tidy : cautious).pick(children);
    ranker.record(c);
    return c;
  };
}

/** Plan-guided depth-first search with a memo of failed positions. */
function search(table: Table, from: Cursor, witnessIds: readonly string[], playedIds: readonly string[], nodes: number): Verdict {
  const ranker = planRanker(witnessIds, playedIds);
  const failed = new Set<string>();
  let expanded = 0;
  let exhausted = false;
  const dfs = (n: Cursor): boolean => {
    if (n.cells.left === 0) return true;
    const key = keyOf(n);
    if (failed.has(key)) return false;
    if (expanded >= nodes) {
      exhausted = true;
      return false;
    }
    expanded++;
    const children = childrenOf(table, n).sort((a, b) => ranker.rank(a) - ranker.rank(b) || Number(b.usedUp) - Number(a.usedUp) || b.hits - a.hits);
    for (const child of children) {
      ranker.record(child);
      const ok = dfs(child.cursor);
      ranker.record(child, -1);
      if (ok) return true;
      if (exhausted) return false;
    }
    failed.add(key);
    return false;
  };
  if (dfs(from)) return 'solvable';
  return exhausted ? 'doomed' : 'proven';
}

/** Whether a solution from `cur` is found (the position after `played`). */
export function oracle(table: Table, cur: Cursor, witnessIds: readonly string[], playedIds: readonly string[], options: OracleOptions = ORACLE, seed = 1): Verdict {
  if (cur.cells.left === 0) return 'solvable';
  const big = (): Budget => ({ left: 1e7 });
  const ranker = planRanker(witnessIds, playedIds);
  if (run(table, (c) => {
    const x = planPick(ranker, c);
    ranker.record(x);
    return x;
  }, big(), cur).result === 'solved') return 'solvable';
  for (const id of ['obvious', 'tidy', 'slotsFirst', 'cautious'] as const) if (runPolicy(table, id, seed, big(), cur).result === 'solved') return 'solvable';
  const rng = createRng((seed * 2654435761) >>> 0);
  const bases = ['plan', 'tidy', 'cautious'] as const;
  for (let k = 0; k < options.rollouts; k++) {
    const noise = 0.05 + (0.25 * k) / Math.max(1, options.rollouts - 1);
    if (run(table, noisy(rng, noise, bases[k % 3] as 'plan' | 'tidy' | 'cautious', witnessIds, playedIds), big(), cur).result === 'solved') return 'solvable';
  }
  return search(table, cur, witnessIds, playedIds, options.nodes);
}

export interface Doom {
  /** Moves played until stuck. */
  length: number;
  /** 1-based number of the fatal move (the first move after the latest solvable position). */
  fatal: number;
  /** Moves made after the fatal move until the dead end showed. */
  delay: number;
  proven: boolean;
}

/**
 * For a run that ended stuck after `moves`: the latest solvable position `k` (found by stepping back 1, 2, 4 … moves
 * and then bisecting), the fatal move `k + 1` and the delay `length − (k + 1)`.
 */
export function doomOf(state: PeelState, moves: readonly Move[], options: OracleOptions = ORACLE): Doom {
  const table = tableOfState(state);
  const witnessIds = identitiesOf(table, state.witness);
  const ids = identitiesOf(table, moves);
  const cursors: Cursor[] = [];
  const walk = startCursor(table);
  cursors.push(cloneCursor(walk));
  for (const m of moves) {
    const p = parseMove(m)!;
    step(table, walk, p.kind, p.index, true);
    cursors.push(cloneCursor(walk));
  }
  const t = moves.length;
  let prefix = 0;
  while (prefix < t && prefix < state.witness.length && moves[prefix] === state.witness[prefix]) prefix++;
  const memo = new Map<number, Verdict>();
  const verdictAt = (k: number): Verdict => {
    if (k <= prefix) return 'solvable';
    let v = memo.get(k);
    if (!v) {
      v = oracle(table, cursors[k] as Cursor, witnessIds, ids.slice(0, k), options, k + 1);
      memo.set(k, v);
    }
    return v;
  };
  // Stuck at t: unsolvable. Step back until a solvable position is found.
  let bad = t;
  let good = -1;
  for (let back = 1; ; back *= 2) {
    const k = Math.max(0, t - back);
    if (verdictAt(k) === 'solvable') {
      good = k;
      break;
    }
    bad = k;
    if (k === 0) break;
  }
  if (good < 0) return { length: t, fatal: 0, delay: t, proven: false };
  while (bad - good > 1) {
    const mid = (good + bad) >> 1;
    if (verdictAt(mid) === 'solvable') good = mid;
    else bad = mid;
  }
  return { length: t, fatal: good + 1, delay: t - (good + 1), proven: bad === t || memo.get(bad) === 'proven' };
}

export const PLAYERS: readonly PolicyId[] = ['obvious', 'tidy', 'cautious', 'noisyTidy'];

export interface PuzzleReport {
  runs: { player: PolicyId; result: 'solved' | 'stuck' | 'unknown'; doom?: Doom }[];
  /** First moves (other than the witness's) and whether the oracle finds a solution after them. */
  firsts: { move: Move; verdict: Verdict }[];
}

/** Runs the players on a game and measures every dead end, plus the first-move check. */
export function measurePuzzle(state: PeelState, options: OracleOptions = ORACLE, players: readonly PolicyId[] = PLAYERS, firstMoves = true): PuzzleReport {
  const table = tableOfState(state);
  const witnessIds = identitiesOf(table, state.witness);
  const runs: PuzzleReport['runs'] = [];
  for (const player of players) {
    const r = runPolicy(table, player, state.seed, { left: 1e8 });
    runs.push(r.result === 'stuck' ? { player, result: r.result, doom: doomOf(state, r.moves, options) } : { player, result: r.result });
  }
  const firsts: PuzzleReport['firsts'] = [];
  if (firstMoves) {
    const start = startCursor(table);
    for (const child of childrenOf(table, start)) {
      if (child.move === state.witness[0]) continue;
      firsts.push({ move: child.move, verdict: oracle(table, child.cursor, witnessIds, identitiesOf(table, [child.move]), options, 7) });
    }
  }
  return { runs, firsts };
}
