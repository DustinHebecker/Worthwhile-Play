import { createRng, type Rng } from '@wp/game-core';
import { childrenOf, type Child, type Cursor, type Table } from './engine';
import { picker, run, type Budget } from './policies';
import { keyOf } from './solver';

/**
 * Finding a way to finish from a position near the stored plan (design v3 § 2.3): "follow the plan" with a little
 * noise, and a plan-guided depth-first search with a memo of failed positions. One-sided: a found solution proves
 * the position can be finished; finding none proves nothing. Used by the generator's opening guard and by the doom
 * measurement (test/doom.ts). Budgets count launches (one per child computed), never time.
 */

/** Ranks children by where their shooter comes next in the witness, counting the launches actually made. */
export function planRanker(witnessIds: readonly string[], playedIds: readonly string[]) {
  const at = new Map<string, number[]>();
  witnessIds.forEach((id, i) => at.set(id, [...(at.get(id) ?? []), i]));
  const used = new Map<string, number>();
  for (const id of playedIds) used.set(id, (used.get(id) ?? 0) + 1);
  const idOf = (c: Child) => `${c.lane}.${c.shooterIndex}`;
  return {
    rank: (c: Child): number => at.get(idOf(c))?.[used.get(idOf(c)) ?? 0] ?? Infinity,
    record: (c: Child, delta = 1): void => void used.set(idOf(c), (used.get(idOf(c)) ?? 0) + delta)
  };
}

export type PlanRanker = ReturnType<typeof planRanker>;

const tidy = picker('tidy');
const cautious = picker('cautious');

/** The child the plan launches next (ties and unplanned positions: the tidy rule). */
export function planPick(ranker: PlanRanker, children: readonly Child[]): Child {
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

export type NoisyBase = 'plan' | 'tidy' | 'cautious';

/** A picker that follows `base` and, with probability `noise`, picks a random legal move instead. */
export function noisyPicker(rng: Rng, noise: number, base: NoisyBase, witnessIds: readonly string[], playedIds: readonly string[]): (children: readonly Child[]) => Child {
  const ranker = planRanker(witnessIds, playedIds);
  return (children) => {
    let c: Child;
    if (rng.next() < noise) c = children[rng.int(0, children.length - 1)] as Child;
    else if (base === 'plan') c = planPick(ranker, children);
    else c = (base === 'tidy' ? tidy : cautious).pick(children);
    ranker.record(c);
    return c;
  };
}

/**
 * Plan-guided depth-first search with a memo of failed positions: 'solved', 'unsolvable' (the whole space was
 * searched) or 'unknown' (node or launch budget used up).
 */
export function planSearch(table: Table, from: Cursor, witnessIds: readonly string[], playedIds: readonly string[], nodes: number, budget: Budget = { left: Infinity }, path: string[] = []): 'solved' | 'unsolvable' | 'unknown' {
  const ranker = planRanker(witnessIds, playedIds);
  const failed = new Set<string>();
  let expanded = 0;
  let exhausted = false;
  path.length = 0;
  const dfs = (n: Cursor): boolean => {
    if (n.cells.left === 0) return true;
    const key = keyOf(n);
    if (failed.has(key)) return false;
    if (expanded >= nodes || budget.left <= 0) {
      exhausted = true;
      return false;
    }
    expanded++;
    const children = childrenOf(table, n);
    budget.left -= children.length;
    children.sort((a, b) => ranker.rank(a) - ranker.rank(b) || Number(b.usedUp) - Number(a.usedUp) || b.hits - a.hits);
    for (const child of children) {
      ranker.record(child);
      path.push(child.move);
      const ok = dfs(child.cursor);
      ranker.record(child, -1);
      if (ok) return true;
      path.pop();
      if (exhausted) return false;
    }
    failed.add(key);
    return false;
  };
  if (dfs(from)) return 'solved';
  return exhausted ? 'unknown' : 'unsolvable';
}

/** Noise of rollout `k` of `count`: from 5 % up to `top`. */
export const noiseOf = (k: number, count: number, top = 0.3): number => 0.05 + ((top - 0.05) * k) / Math.max(1, count - 1);

export interface ProveOptions {
  rollouts: number;
  nodes: number;
  seed: number;
}

/**
 * A way to finish from `from` (the position after `playedIds`), or null when none is found: "follow the plan", then
 * `rollouts` noisy rollouts around the plan, the tidy and the cautious rule, then the plan-guided search with `nodes`
 * nodes. The moves returned solve the picture from `from` (checked by the tests with an independent replay).
 */
export function prove(table: Table, from: Cursor, witnessIds: readonly string[], playedIds: readonly string[], budget: Budget, options: ProveOptions): string[] | null {
  const ranker = planRanker(witnessIds, playedIds);
  const plan = (children: readonly Child[]) => {
    const c = planPick(ranker, children);
    ranker.record(c);
    return c;
  };
  const first = run(table, plan, budget, from);
  if (first.result === 'solved') return first.moves;
  const rng = createRng((options.seed * 2654435761) >>> 0);
  const bases: readonly NoisyBase[] = ['plan', 'plan', 'tidy', 'cautious'];
  for (let k = 0; k < options.rollouts && budget.left > 0; k++) {
    const r = run(table, noisyPicker(rng, noiseOf(k, options.rollouts, 0.2), bases[k % bases.length] as NoisyBase, witnessIds, playedIds), budget, from);
    if (r.result === 'solved') return r.moves;
  }
  const path: string[] = [];
  return budget.left > 0 && options.nodes > 0 && planSearch(table, from, witnessIds, playedIds, options.nodes, budget, path) === 'solved' ? path : null;
}

export const provable = (table: Table, from: Cursor, witnessIds: readonly string[], playedIds: readonly string[], budget: Budget, options: ProveOptions): boolean =>
  prove(table, from, witnessIds, playedIds, budget, options) !== null;
