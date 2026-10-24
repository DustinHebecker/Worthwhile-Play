import { childrenOf, type Cursor, type Table } from './engine';

/**
 * The exact solver (design v2 § 3.7): depth-first search with a memo of failed positions, on the fast engine. It is
 * only used on small positions: the BFS-oracle tests, the hint's endgame proof and test diagnostics; never on a full
 * 48 × 48 position. Budgets count expanded nodes, never time, so results are the same on every device.
 */

export type SolveResult = { solution: string[] } | { unsolvable: true } | { unknown: true };

/** Position key: lane fronts, the slot contents as a multiset, the present cells packed 8 per character. */
export function keyOf(cur: Cursor): string {
  const slots = cur.slots
    .filter((s) => s !== null)
    .map((s) => `${s!.lane}.${s!.index}.${s!.n}`)
    .sort()
    .join(',');
  let bits = '';
  const present = cur.cells.present;
  for (let i = 0; i < present.length; i += 8) {
    let acc = 0;
    for (let k = 0; k < 8; k++) acc = (acc << 1) | ((present[i + k] ?? 0) as number);
    bits += String.fromCharCode(acc);
  }
  return `${Array.from(cur.laneFront).join('.')}|${slots}|${bits}`;
}

/** Children in the obvious play's order: most hits, used up first, slots before lanes, lower index. */
const ordered = (table: Table, cur: Cursor) =>
  childrenOf(table, cur).sort((a, b) => b.hits - a.hits || Number(b.usedUp) - Number(a.usedUp) || Number(b.slotMove) - Number(a.slotMove) || a.index - b.index);

/** `unsolvable` is only reported when the whole space was searched within `budget` expanded nodes. */
export function solveCursor(table: Table, from: Cursor, budget = 4000): SolveResult {
  const failed = new Set<string>();
  let expanded = 0;
  let exhausted = false;
  const path: string[] = [];
  const dfs = (n: Cursor): boolean => {
    if (n.cells.left === 0) return true;
    const key = keyOf(n);
    if (failed.has(key)) return false;
    if (expanded >= budget) {
      exhausted = true;
      return false;
    }
    expanded++;
    for (const child of ordered(table, n)) {
      path.push(child.move);
      if (dfs(child.cursor)) return true;
      path.pop();
      if (exhausted) return false;
    }
    failed.add(key);
    return false;
  };
  if (dfs(from)) return { solution: path.slice() };
  return exhausted ? { unknown: true } : { unsolvable: true };
}
