import { createRng, type Rng } from '@wp/game-core';
import { childrenOf, cloneCursor, startCursor, type Child, type Cursor, type Table } from './engine';

/**
 * The reference policies (design v2 § 3.3): the rules of thumb a player tries first. Each picks one child from the
 * legal children of a position; a run applies it until the picture is solved or no legal move is left. They define
 * the difficulty levels (§ 2.2) and are the baseline the hint improves on (§ 4). All deterministic.
 */

export type PolicyId = 'obvious' | 'tidy' | 'slotsFirst' | 'cautious' | 'noisyTidy';
export const POLICIES: readonly PolicyId[] = ['obvious', 'tidy', 'slotsFirst', 'cautious', 'noisyTidy'];

type Order = (a: Child, b: Child) => number;

/** Final tie-break everywhere: slot moves before lane moves, then the lower index. */
const lastly: Order = (a, b) => Number(b.slotMove) - Number(a.slotMove) || a.index - b.index;
const byHits: Order = (a, b) => b.hits - a.hits;
const byUsedUp: Order = (a, b) => Number(b.usedUp) - Number(a.usedUp);

const ORDERS: Readonly<Record<Exclude<PolicyId, 'noisyTidy'>, Order>> = {
  obvious: (a, b) => byHits(a, b) || byUsedUp(a, b) || lastly(a, b),
  tidy: (a, b) => byUsedUp(a, b) || byHits(a, b) || lastly(a, b),
  slotsFirst: (a, b) => Number(b.slotMove && b.hits > 0) - Number(a.slotMove && a.hits > 0) || byUsedUp(a, b) || byHits(a, b) || lastly(a, b),
  cautious: (a, b) => Number(b.usedUp || b.slotMove) - Number(a.usedUp || a.slotMove) || Number(b.freeAfter >= 1) - Number(a.freeAfter >= 1) || byHits(a, b) || lastly(a, b)
};

const best = (children: readonly Child[], order: Order): Child => children.reduce((x, c) => (order(c, x) < 0 ? c : x));

/** When nothing hits, every policy parks the lowest-index lane front (v1's rule). */
function parkIfNothingHits(children: readonly Child[]): Child | undefined {
  if (children.some((c) => c.hits > 0)) return undefined;
  return best(children, lastly);
}

export interface Picker {
  pick(children: readonly Child[]): Child;
}

export function picker(id: PolicyId, seed = 0): Picker {
  if (id === 'noisyTidy') {
    const rng: Rng = createRng((seed ^ 0x9e3779b9) >>> 0);
    return {
      pick(children) {
        const parked = parkIfNothingHits(children);
        if (parked) return parked;
        if (rng.next() < 0.3) return children[rng.int(0, children.length - 1)] as Child;
        return best(children, ORDERS.tidy);
      }
    };
  }
  const order = ORDERS[id];
  return { pick: (children) => parkIfNothingHits(children) ?? best(children, order) };
}

/** A launch counter shared by construction, policy runs and the hint (budgets count launches, never time). */
export interface Budget {
  left: number;
}

export type RunResult = { result: 'solved' | 'stuck' | 'unknown'; moves: string[]; cursor: Cursor };

/** Runs `pick` from `from` until solved, stuck or out of budget (every child computed costs one launch). */
export function run(table: Table, pick: (children: readonly Child[]) => Child, budget: Budget, from: Cursor = startCursor(table), maxMoves = 2500): RunResult {
  let cur = cloneCursor(from);
  const moves: string[] = [];
  while (cur.cells.left > 0) {
    let options = 0;
    for (const s of cur.slots) if (s) options++;
    table.lanes.forEach((lane, i) => (options += (cur.laneFront[i] as number) < lane.length ? 1 : 0));
    if (budget.left < options || moves.length >= maxMoves) return { result: 'unknown', moves, cursor: cur };
    budget.left -= options;
    const children = childrenOf(table, cur);
    if (children.length === 0) return { result: 'stuck', moves, cursor: cur };
    const child = pick(children);
    moves.push(child.move);
    cur = child.cursor;
  }
  return { result: 'solved', moves, cursor: cur };
}

export function runPolicy(table: Table, id: PolicyId, seed: number, budget: Budget, from?: Cursor): RunResult {
  const p = picker(id, seed);
  return run(table, (c) => p.pick(c), budget, from);
}
