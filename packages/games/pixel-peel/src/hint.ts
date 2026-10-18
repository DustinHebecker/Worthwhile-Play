import { parseMove, replayCursor, startCursor, step, type Child, type Cursor, type Table } from './engine';
import { picker, run, type Budget, type PolicyId } from './policies';
import { tableOfState, type Move, type PeelState } from './rules';
import { solveCursor } from './solver';

/**
 * The hint at scale (design v2 § 4). Offered without penalty, on an explicit press only, never plays for the player
 * and never claims what it has not checked:
 * 1. on the witness path, the next witness move;
 * 2. rollouts from the current position ("follow the plan", then the policies): the first that solves the picture
 *    gives a proven move;
 * 3. near the end, the exact search: a move, or a proven dead end;
 * 4. otherwise a safe move number to go back to, verified by a rollout or lying on the witness.
 * Budgets count launches (and search nodes), never time.
 */

export type HintResult =
  | { kind: 'move'; move: Move }
  /** `proven`: the current position was proven unsolvable by the exact search; otherwise the quick check found nothing. */
  | { kind: 'undo'; k: number; proven: boolean };

export const ROLLOUT_BUDGET = 4000;
export const SAFE_POINT_BUDGET = 4000;
export const ENDGAME = { cells: 300, shooters: 12, nodes: 5000 } as const;
export const ANCESTORS = 6;

export const commonPrefix = (a: readonly Move[], b: readonly Move[]): number => {
  let k = 0;
  while (k < a.length && k < b.length && a[k] === b[k]) k++;
  return k;
};

/** The shooter identity (`lane.index`) each move launches, by replaying them. */
export function identitiesOf(table: Table, moves: readonly Move[]): string[] {
  const cur = startCursor(table);
  const out: string[] = [];
  for (const m of moves) {
    const p = parseMove(m);
    if (!p) break;
    const o = step(table, cur, p.kind, p.index, true);
    if (!o.legal || !o.shooter) break;
    out.push(`${o.shooter.lane}.${o.shooter.index}`);
  }
  return out;
}

/**
 * P0, "follow the plan": the shooter whose identity comes earliest in the rest of the witness (each identity's
 * launches so far are counted, so a shooter launched twice in the witness is looked up at its next occurrence).
 * Ties: the tidy policy's order.
 */
export function followPlan(witnessIds: readonly string[], playedIds: readonly string[]): (children: readonly Child[]) => Child {
  const at = new Map<string, number[]>();
  witnessIds.forEach((id, i) => at.set(id, [...(at.get(id) ?? []), i]));
  const used = new Map<string, number>();
  for (const id of playedIds) used.set(id, (used.get(id) ?? 0) + 1);
  const tidy = picker('tidy');
  return (children) => {
    let bestRank = Infinity;
    let pool: Child[] = [];
    for (const c of children) {
      const id = `${c.lane}.${c.shooterIndex}`;
      const rank = at.get(id)?.[used.get(id) ?? 0] ?? Infinity;
      if (rank < bestRank) {
        bestRank = rank;
        pool = [c];
      } else if (rank === bestRank) pool.push(c);
    }
    const chosen = pool.length > 0 && bestRank < Infinity ? (pool.length === 1 ? (pool[0] as Child) : tidy.pick(pool)) : tidy.pick(children);
    const id = `${chosen.lane}.${chosen.shooterIndex}`;
    used.set(id, (used.get(id) ?? 0) + 1);
    return chosen;
  };
}

const ROLLOUT_POLICIES: readonly PolicyId[] = ['obvious', 'tidy', 'slotsFirst', 'cautious'];

/** Shooters left to play (lanes and slots). */
function shootersLeft(table: Table, cur: Cursor): number {
  let n = 0;
  table.lanes.forEach((lane, i) => (n += lane.length - (cur.laneFront[i] as number)));
  for (const s of cur.slots) if (s) n++;
  return n;
}

/** A proven next move from `cur`, or whether the position was proven unsolvable. */
function search(table: Table, cur: Cursor, witnessIds: readonly string[], playedIds: readonly string[], budget: Budget): { move?: Move; deadEnd: boolean } {
  const pickers = [followPlan(witnessIds, playedIds), ...ROLLOUT_POLICIES.map((id) => {
    const p = picker(id);
    return (c: readonly Child[]) => p.pick(c);
  })];
  for (const pick of pickers) {
    const r = run(table, pick, budget, cur);
    if (r.result === 'solved' && r.moves.length > 0) return { move: r.moves[0] as Move, deadEnd: false };
    if (budget.left <= 0) break;
  }
  if (cur.cells.left <= ENDGAME.cells && shootersLeft(table, cur) <= ENDGAME.shooters) {
    const r = solveCursor(table, cur, ENDGAME.nodes);
    if ('solution' in r && r.solution.length > 0) return { move: r.solution[0] as Move, deadEnd: false };
    if ('unsolvable' in r) return { deadEnd: true };
  }
  return { deadEnd: false };
}

/** A proven suggestion from the current position, or a safe move number to go back to. */
export function hint(state: PeelState): HintResult {
  const k0 = commonPrefix(state.moves, state.witness);
  if (k0 === state.moves.length && k0 < state.witness.length) return { kind: 'move', move: state.witness[k0] as Move };
  const table = tableOfState(state);
  const cur = replayCursor(table, state.moves);
  if (!cur || cur.cells.left === 0) return { kind: 'undo', k: Math.min(k0, state.moves.length), proven: false };
  const witnessIds = identitiesOf(table, state.witness);
  const found = search(table, cur, witnessIds, identitiesOf(table, state.moves), { left: ROLLOUT_BUDGET });
  if (found.move) return { kind: 'move', move: found.move };
  // A safe point: the latest ancestor (at most 6 back, after the witness prefix) from which a rollout solves it.
  const budget: Budget = { left: SAFE_POINT_BUDGET };
  for (let k = state.moves.length - 1; k >= Math.max(k0 + 1, state.moves.length - ANCESTORS) && budget.left > 0; k--) {
    const at = replayCursor(table, state.moves.slice(0, k));
    if (!at) continue;
    const played = identitiesOf(table, state.moves.slice(0, k));
    for (const pick of [followPlan(witnessIds, played), (c: readonly Child[]) => picker('obvious').pick(c)]) {
      if (run(table, pick, budget, at).result === 'solved') return { kind: 'undo', k, proven: found.deadEnd };
    }
  }
  return { kind: 'undo', k: k0, proven: found.deadEnd };
}
