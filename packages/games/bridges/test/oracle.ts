/**
 * Independent backtracking oracle for Bridges, sharing no code with `src/rules.ts`.
 * It discovers bridge slots by scanning the grid, detects crossings via shared cells and
 * enumerates all assignments (0–2 bridges per slot) with simple pruning, then checks
 * connectivity by flood fill. Exponential in the worst case, but fast for real puzzles.
 */

export interface OracleResult {
  /** Number of solutions found (stops at `limit`). */
  count: number;
  /** All solutions found, keyed `r1,c1-r2,c2` → bridges (only slots with bridges). */
  solutions: Map<string, number>[];
}

interface Slot {
  from: number;
  to: number;
  key: string;
  cells: string[];
}

export function countSolutions(size: number, rawIslands: readonly (readonly number[])[], limit = 2): OracleResult {
  const islands = [...rawIslands].map((i) => ({ r: i[0] as number, c: i[1] as number, need: i[2] as number }));
  islands.sort((x, y) => (x.r === y.r ? x.c - y.c : x.r - y.r));
  const index = new Map<string, number>();
  islands.forEach((isl, i) => index.set(`${isl.r},${isl.c}`, i));

  // Slots owned by each island: towards the next island to the right and below.
  const owned: Slot[][] = islands.map(() => []);
  islands.forEach((isl, i) => {
    for (const [dr, dc] of [[0, 1], [1, 0]] as const) {
      const cells: string[] = [];
      let r = isl.r + dr;
      let c = isl.c + dc;
      while (r < size && c < size) {
        const hit = index.get(`${r},${c}`);
        if (hit !== undefined) {
          owned[i]?.push({ from: i, to: hit, key: `${isl.r},${isl.c}-${r},${c}`, cells });
          break;
        }
        cells.push(`${r},${c}`);
        r += dr;
        c += dc;
      }
    }
  });
  const slots = owned.flat();
  const lastSlotOf = islands.map(() => -1);
  slots.forEach((s, k) => {
    lastSlotOf[s.from] = k;
    lastSlotOf[s.to] = Math.max(lastSlotOf[s.to] as number, k);
  });

  const degree = islands.map(() => 0);
  const value = slots.map(() => 0);
  const used = new Set<string>();
  const result: OracleResult = { count: 0, solutions: [] };

  const connected = (): boolean => {
    const seen = new Set<number>([0]);
    const queue = [0];
    while (queue.length > 0) {
      const at = queue.pop() as number;
      slots.forEach((s, k) => {
        if ((value[k] as number) === 0) return;
        const other = s.from === at ? s.to : s.to === at ? s.from : -1;
        if (other >= 0 && !seen.has(other)) {
          seen.add(other);
          queue.push(other);
        }
      });
    }
    return seen.size === islands.length;
  };

  // Islands whose every slot is decided once slot k is decided.
  const completes = slots.map(() => [] as number[]);
  islands.forEach((_, i) => {
    const k = lastSlotOf[i] as number;
    if (k >= 0) completes[k]?.push(i);
  });
  const isolatedOk = islands.every((isl, i) => lastSlotOf[i] !== -1 || isl.need === 0);
  if (!isolatedOk) return result;

  const search = (k: number): void => {
    if (result.count >= limit) return;
    if (k === slots.length) {
      if (islands.length > 1 && !connected()) return;
      result.count++;
      const solution = new Map<string, number>();
      slots.forEach((s, j) => {
        if ((value[j] as number) > 0) solution.set(s.key, value[j] as number);
      });
      result.solutions.push(solution);
      return;
    }
    const slot = slots[k] as Slot;
    for (let v = 0; v <= 2; v++) {
      if (v > 0 && slot.cells.some((cell) => used.has(cell))) break;
      const a = (degree[slot.from] as number) + v;
      const b = (degree[slot.to] as number) + v;
      if (a > (islands[slot.from]?.need as number) || b > (islands[slot.to]?.need as number)) break;
      degree[slot.from] = a;
      degree[slot.to] = b;
      value[k] = v;
      if (v > 0) for (const cell of slot.cells) used.add(cell);
      if ((completes[k] as number[]).every((i) => degree[i] === islands[i]?.need)) search(k + 1);
      if (v > 0) for (const cell of slot.cells) used.delete(cell);
      degree[slot.from] = a - v;
      degree[slot.to] = b - v;
      value[k] = 0;
    }
  };
  search(0);
  return result;
}
