/**
 * Independent reference implementation for the tests: its own constraint evaluation and a
 * breadth-first solver over river-crossing states. It deliberately shares no code with
 * `src/rules.ts` — it only reads the declarative puzzle data.
 *
 * State: a bit mask of the entities on the far (right) bank, the boat's bank, and — only for
 * entities with a trip limit — how many crossings each of them has made. Breadth-first order
 * over crossings makes the first solved state found crossing-optimal.
 */
// @ts-nocheck


interface OracleEntity {
  readonly id: string;
  readonly rower?: boolean;
  readonly weight?: number;
  readonly trips?: number;
}

type OracleRule =
  | { readonly kind: 'apart'; readonly a: string; readonly b: readonly string[]; readonly unless: readonly string[] }
  | { readonly kind: 'outnumber'; readonly group: readonly string[]; readonly by: readonly string[] }
  | { readonly kind: 'needs'; readonly who: readonly string[]; readonly any: readonly string[] }
  | { readonly kind: 'boatApart'; readonly a: string; readonly b: string };

export interface OraclePuzzle {
  readonly entities: readonly OracleEntity[];
  readonly capacity: number;
  readonly maxWeight?: number;
  readonly maxCrossings?: number;
  readonly rules: readonly OracleRule[];
}

/**
 * Is a bank holding exactly the entity ids in `present` acceptable under the bank rules?
 * (The boat, when docked, belongs to the bank it is at.)
 */
export function bankOk(puzzle: OraclePuzzle, present: ReadonlySet<string>): boolean {
  for (const rule of puzzle.rules) {
    if (rule.kind === 'apart') {
      if (present.has(rule.a) && rule.b.some((id) => present.has(id)) && !rule.unless.some((id) => present.has(id))) return false;
    } else if (rule.kind === 'outnumber') {
      let guards = 0;
      let others = 0;
      for (const id of present) {
        if (rule.group.includes(id)) guards += 1;
        if (rule.by.includes(id)) others += 1;
      }
      if (guards > 0 && others > guards) return false;
    } else if (rule.kind === 'needs') {
      const needy = rule.who.filter((id) => present.has(id)).length;
      const helpers = rule.any.filter((id) => present.has(id)).length;
      if (needy > 0 && helpers === 0) return false;
    }
  }
  return true;
}

/** Can exactly these entity ids share one crossing (seats, weight, rower, boat rules)? Ignores trip limits. */
export function boatOk(puzzle: OraclePuzzle, ids: readonly string[]): boolean {
  if (ids.length < 1 || ids.length > puzzle.capacity) return false;
  const chosen = puzzle.entities.filter((e) => ids.includes(e.id));
  if (!chosen.some((e) => e.rower === true)) return false;
  if (puzzle.maxWeight !== undefined) {
    let total = 0;
    for (const e of chosen) total += e.weight ?? 0;
    if (total > puzzle.maxWeight) return false;
  }
  for (const rule of puzzle.rules) {
    if (rule.kind === 'boatApart' && ids.includes(rule.a) && ids.includes(rule.b)) return false;
  }
  return true;
}

export interface OracleState {
  /** Bit i set = entity i is on the right bank. */
  right: number;
  boatRight: boolean;
  /** Crossings made per entity (index-aligned with the entities). */
  used: number[];
  crossings: number;
}

export const oracleStart = (puzzle: OraclePuzzle): OracleState => ({
  right: 0,
  boatRight: false,
  used: puzzle.entities.map(() => 0),
  crossings: 0
});

const membersOf = (puzzle: OraclePuzzle, mask: number): Set<string> => {
  const set = new Set<string>();
  puzzle.entities.forEach((e, i) => {
    if ((mask >> i) & 1) set.add(e.id);
  });
  return set;
};

/** Is the whole position acceptable (both banks)? */
export function positionOk(puzzle: OraclePuzzle, rightMask: number): boolean {
  const all = (1 << puzzle.entities.length) - 1;
  return bankOk(puzzle, membersOf(puzzle, rightMask)) && bankOk(puzzle, membersOf(puzzle, all & ~rightMask));
}

/** Applies one crossing of the entity indices `group`, or returns null if any rule forbids it. */
export function oracleCross(puzzle: OraclePuzzle, state: OracleState, group: readonly number[]): OracleState | null {
  if (puzzle.maxCrossings !== undefined && state.crossings >= puzzle.maxCrossings) return null;
  for (const i of group) {
    if (i < 0 || i >= puzzle.entities.length) return null;
    if ((((state.right >> i) & 1) === 1) !== state.boatRight) return null;
    const limit = puzzle.entities[i]!.trips;
    if (limit !== undefined && state.used[i]! >= limit) return null;
  }
  if (new Set(group).size !== group.length) return null;
  if (!boatOk(puzzle, group.map((i) => puzzle.entities[i]!.id))) return null;
  let right = state.right;
  for (const i of group) right ^= 1 << i;
  if (!positionOk(puzzle, right)) return null;
  const used = [...state.used];
  for (const i of group) used[i] = used[i]! + 1;
  return { right, boatRight: !state.boatRight, used, crossings: state.crossings + 1 };
}

export const oracleSolved = (puzzle: OraclePuzzle, state: OracleState): boolean => state.right === (1 << puzzle.entities.length) - 1;

/** Every non-empty subset of `items` with at most `max` elements. */
function subsets(items: readonly number[], max: number): number[][] {
  const out: number[][] = [];
  const walk = (start: number, current: number[]) => {
    if (current.length > 0) out.push([...current]);
    if (current.length === max) return;
    for (let k = start; k < items.length; k++) {
      current.push(items[k]!);
      walk(k + 1, current);
      current.pop();
    }
  };
  walk(0, []);
  return out;
}

export interface OracleSolution {
  crossings: number;
  /** One optimal plan: entity indices per crossing. */
  plan: number[][];
  /** Distinct states visited. */
  states: number;
}

const keyOf = (puzzle: OraclePuzzle, s: OracleState) =>
  `${s.right}|${s.boatRight ? 1 : 0}|${puzzle.entities.map((e, i) => (e.trips === undefined ? '' : s.used[i])).join(',')}`;

/** Fewest crossings that bring everyone to the right bank, or null if impossible. */
export function oracleSolve(puzzle: OraclePuzzle): OracleSolution | null {
  const start = oracleStart(puzzle);
  if (!positionOk(puzzle, 0)) return null;
  const seen = new Map<string, { parent: string | null; group: number[] }>([[keyOf(puzzle, start), { parent: null, group: [] }]]);
  const queue: OracleState[] = [start];
  for (let head = 0; head < queue.length; head++) {
    const state = queue[head]!;
    const key = keyOf(puzzle, state);
    if (oracleSolved(puzzle, state)) {
      const plan: number[][] = [];
      for (let at: string | null = key; at !== null; ) {
        const node: { parent: string | null; group: number[] } = seen.get(at)!;
        if (node.parent !== null) plan.unshift(node.group);
        at = node.parent;
      }
      return { crossings: state.crossings, plan, states: seen.size };
    }
    const here = puzzle.entities.map((_, i) => i).filter((i) => (((state.right >> i) & 1) === 1) === state.boatRight);
    for (const group of subsets(here, puzzle.capacity)) {
      const next = oracleCross(puzzle, state, group);
      if (!next) continue;
      const nextKey = keyOf(puzzle, next);
      if (seen.has(nextKey)) continue;
      seen.set(nextKey, { parent: key, group });
      queue.push(next);
    }
  }
  return null;
}

/** Number of distinct optimal plans (capped), to judge how "forced" a puzzle is. */
export function countOptimalPlans(puzzle: OraclePuzzle, cap = 1_000_000): number {
  const memo = new Map<string, number>();
  const best = oracleSolve(puzzle);
  if (!best) return 0;
  // Plans of at most `left` more crossings from `state` to the goal (memoised on state + depth).
  const count = (state: OracleState, left: number): number => {
    if (oracleSolved(puzzle, state)) return 1;
    if (left === 0) return 0;
    const key = `${keyOf(puzzle, state)}#${left}`;
    const cached = memo.get(key);
    if (cached !== undefined) return cached;
    let total = 0;
    const here = puzzle.entities.map((_, i) => i).filter((i) => (((state.right >> i) & 1) === 1) === state.boatRight);
    for (const group of subsets(here, puzzle.capacity)) {
      const next = oracleCross(puzzle, state, group);
      if (next) total = Math.min(cap, total + count(next, left - 1));
    }
    memo.set(key, total);
    return total;
  };
  return count(oracleStart(puzzle), best.crossings);
}
