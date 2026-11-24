import type { Compiled } from '../compile';
import type { Action } from '../types';
import { keyOf, moves, openGoals, startState, type AState } from './interpret';

export interface Exploration {
  /** Reachable abstract states in breadth-first order (index 0 = start). */
  readonly states: readonly AState[];
  /** Outgoing edges per state: [action, target index]. */
  readonly edges: readonly (readonly (readonly [Action, number])[])[];
  /** Breadth-first parent of each state (start: -1), for shortest paths. */
  readonly parent: readonly (readonly [number, Action] | null)[];
  /** Every text key a rule produced somewhere. */
  readonly fired: ReadonlySet<string>;
  /** True if the state budget stopped the search (all other results are then incomplete). */
  readonly truncated: boolean;
  /** First move that hit the scene-change limit: [from state, action], or null. */
  readonly overflow: readonly [number, Action] | null;
}

/** Breadth-first search over all abstract states reachable from the start, up to `budget` states. */
export function explore(c: Compiled, budget: number): Exploration {
  const start = startState(c);
  const states: AState[] = [start.state];
  const index = new Map<string, number>([[keyOf(start.state), 0]]);
  const edges: [Action, number][][] = [];
  const parent: ([number, Action] | null)[] = [null];
  const fired = new Set(start.fired);
  let truncated = false;
  let overflow: [number, Action] | null = null;
  for (let i = 0; i < states.length; i++) {
    const out: [Action, number][] = [];
    for (const m of moves(c, states[i] as AState)) {
      m.fired.forEach((k) => fired.add(k));
      if (m.overflow && !overflow) overflow = [i, m.action];
      const key = keyOf(m.next);
      let j = index.get(key);
      if (j === undefined) {
        if (states.length >= budget) {
          truncated = true;
          continue;
        }
        j = states.length;
        index.set(key, j);
        states.push(m.next);
        parent.push([i, m.action]);
      }
      out.push([m.action, j]);
    }
    edges.push(out);
  }
  return { states, edges, parent, fired, truncated, overflow };
}

/** The actions leading from the start to state `i` (a shortest path). */
export function pathTo(x: Exploration, i: number): Action[] {
  const path: Action[] = [];
  for (let p = x.parent[i]; p; p = x.parent[p[0]]) path.unshift(p[1]);
  return path;
}

/** States from which some ending is reachable (reverse reachability from the ended states). */
export function canFinish(x: Exploration): boolean[] {
  const ok = x.states.map((s) => s.ended !== null);
  const into: number[][] = x.states.map(() => []);
  x.edges.forEach((out, i) => out.forEach(([, j]) => into[j]?.push(i)));
  const queue = ok.flatMap((v, i) => (v ? [i] : []));
  while (queue.length > 0) {
    const j = queue.pop() as number;
    for (const i of into[j] ?? []) {
      if (!ok[i]) {
        ok[i] = true;
        queue.push(i);
      }
    }
  }
  return ok;
}

export { openGoals };
