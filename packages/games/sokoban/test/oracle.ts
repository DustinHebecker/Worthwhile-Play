/**
 * Independent reference implementation for the tests: its own level reader and a
 * push-optimal breadth-first solver. It deliberately shares no code with `src/rules.ts`.
 *
 * The solver searches over (crate set, player region) states: between two pushes the
 * player can walk anywhere in its reachable region, so a state is identified by the
 * crates plus the smallest cell of that region. Breadth-first order over pushes makes the
 * first solved state found push-optimal.
 */
export interface OracleLevel {
  w: number;
  h: number;
  /** true = the player/crates can never stand here (wall or out of the grid). */
  blocked: boolean[];
  goals: Set<number>;
  boxes: number[];
  player: number;
}

export function readLevel(map: string): OracleLevel {
  const lines = map.split('|');
  const w = lines.reduce((m, l) => Math.max(m, l.length), 0);
  const h = lines.length;
  const blocked: boolean[] = [];
  const goals = new Set<number>();
  const boxes: number[] = [];
  let player = -1;
  lines.forEach((line, r) => {
    for (let c = 0; c < w; c++) {
      const ch = line.charAt(c) || ' ';
      const i = r * w + c;
      blocked[i] = ch === '#';
      if (ch === '.' || ch === '*' || ch === '+') goals.add(i);
      if (ch === '$' || ch === '*') boxes.push(i);
      if (ch === '@' || ch === '+') player = i;
    }
  });
  return { w, h, blocked, goals, boxes: boxes.sort((a, b) => a - b), player };
}

const OFFSETS = (w: number) => [
  { d: -w, letter: 'u' },
  { d: w, letter: 'd' },
  { d: -1, letter: 'l' },
  { d: 1, letter: 'r' }
];

/** Cells the player reaches without pushing, with BFS parents for path reconstruction. */
function walkable(level: OracleLevel, from: number, boxes: ReadonlySet<number>): Map<number, [number, string]> {
  const parents = new Map<number, [number, string]>([[from, [-1, '']]]);
  const queue = [from];
  for (let head = 0; head < queue.length; head++) {
    const cell = queue[head]!;
    for (const { d, letter } of OFFSETS(level.w)) {
      const next = cell + d;
      if (next < 0 || next >= level.w * level.h || parents.has(next) || level.blocked[next] || boxes.has(next)) continue;
      parents.set(next, [cell, letter]);
      queue.push(next);
    }
  }
  return parents;
}

function walkPath(parents: Map<number, [number, string]>, to: number): string {
  let path = '';
  for (let at = to; ; ) {
    const [prev, letter] = parents.get(at)!;
    if (prev < 0) return path;
    path = letter + path;
    at = prev;
  }
}

const solvedBoxes = (level: OracleLevel, boxes: readonly number[]) => boxes.every((b) => level.goals.has(b));

export interface OracleSolution {
  pushes: number;
  /** A complete LURD solution (upper case = push) with the optimal number of pushes. */
  path: string;
  states: number;
}

/**
 * Cells from which a lone crate can still be pushed to some goal, found by "pulling" crates
 * backwards from every goal. Pruning crates outside this set keeps the search optimal.
 */
export function pullReachable(level: OracleLevel): Uint8Array {
  const ok = new Uint8Array(level.w * level.h);
  const queue = [...level.goals];
  for (const g of queue) ok[g] = 1;
  for (let head = 0; head < queue.length; head++) {
    const cell = queue[head]!;
    for (const { d } of OFFSETS(level.w)) {
      // Pull the crate from `cell` to `cell + d`; the player walks from `cell + d` to `cell + 2d`.
      const to = cell + d;
      const player = cell + 2 * d;
      if (to < 0 || player < 0 || player >= ok.length || ok[to] || level.blocked[to] || level.blocked[player]) continue;
      ok[to] = 1;
      queue.push(to);
    }
  }
  return ok;
}

/** Push-optimal solution, or `null` when the position cannot be solved. */
export function solve(
  level: OracleLevel,
  start: { player: number; boxes: readonly number[] } = level,
  options: { prune?: boolean; maxStates?: number } = {}
): OracleSolution | null {
  const { prune = true, maxStates = 2_000_000 } = options;
  interface Node {
    player: number;
    boxes: number[];
    parent: Node | null;
    /** Where the player stood for the push that led here, and its direction letter. */
    stand: number;
    letter: string;
  }
  const size = level.w * level.h;
  const live = prune ? pullReachable(level) : new Uint8Array(size).fill(1);
  const occupied = new Uint8Array(size);
  const mark = new Uint32Array(size);
  const stack = new Int32Array(size);
  let stamp = 0;
  /** Flood fills the player's region (cells marked with the new stamp); returns its smallest cell. */
  const fill = (player: number, boxes: readonly number[]) => {
    for (const b of boxes) occupied[b] = 1;
    stamp++;
    let top = 0;
    let min = player;
    stack[top++] = player;
    mark[player] = stamp;
    while (top > 0) {
      const cell = stack[--top]!;
      if (cell < min) min = cell;
      for (const next of [cell - level.w, cell + level.w, cell - 1, cell + 1]) {
        if (next < 0 || next >= size || mark[next] === stamp || level.blocked[next] || occupied[next]) continue;
        mark[next] = stamp;
        stack[top++] = next;
      }
    }
    for (const b of boxes) occupied[b] = 0;
    return min;
  };
  const first: Node = { player: start.player, boxes: [...start.boxes].sort((a, b) => a - b), parent: null, stand: -1, letter: '' };
  const seen = new Set([`${fill(first.player, first.boxes)}:${first.boxes.join(',')}`]);
  let frontier = [first];
  for (let pushes = 0; frontier.length > 0; pushes++) {
    const next: Node[] = [];
    for (const node of frontier) {
      if (solvedBoxes(level, node.boxes)) return { pushes, path: pathOf(level, node), states: seen.size };
      fill(node.player, node.boxes);
      const region = stamp;
      const boxSet = new Set(node.boxes);
      const candidates: Node[] = [];
      for (const box of node.boxes) {
        for (const { d, letter } of OFFSETS(level.w)) {
          const stand = box - d;
          const target = box + d;
          if (mark[stand] !== region || level.blocked[target] || boxSet.has(target) || !live[target]) continue;
          const boxes = node.boxes.map((b) => (b === box ? target : b)).sort((a, b) => a - b);
          candidates.push({ player: box, boxes, parent: node, stand, letter: letter.toUpperCase() });
        }
      }
      for (const candidate of candidates) {
        const key = `${fill(candidate.player, candidate.boxes)}:${candidate.boxes.join(',')}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (seen.size > maxStates) throw new Error('oracle state limit exceeded');
        next.push(candidate);
      }
    }
    frontier = next;
  }
  return null;

  function pathOf(lvl: OracleLevel, end: Node): string {
    const chain: Node[] = [];
    for (let n: Node | null = end; n?.parent; n = n.parent) chain.unshift(n);
    let path = '';
    for (const n of chain) {
      const parent = n.parent!;
      path += walkPath(walkable(lvl, parent.player, new Set(parent.boxes)), n.stand) + n.letter;
    }
    return path;
  }
}

/** Shortest walk length (no pushing) between two cells, or `null`. */
export function walkDistance(level: OracleLevel, from: number, to: number, boxes: readonly number[]): number | null {
  const parents = walkable(level, from, new Set(boxes));
  return parents.has(to) ? walkPath(parents, to).length : null;
}

/** Replays a LURD string with the oracle's own move rules; `null` on an illegal step. */
export function play(level: OracleLevel, path: string): { player: number; boxes: number[]; pushes: number } | null {
  let player = level.player;
  const boxes = new Set(level.boxes);
  let pushes = 0;
  for (const ch of path) {
    const offset = OFFSETS(level.w).find((o) => o.letter === ch.toLowerCase());
    if (!offset) return null;
    const next = player + offset.d;
    if (level.blocked[next]) return null;
    const isPush = boxes.has(next);
    if (isPush !== (ch !== ch.toLowerCase())) return null;
    if (isPush) {
      const target = next + offset.d;
      if (level.blocked[target] || boxes.has(target)) return null;
      boxes.delete(next);
      boxes.add(target);
      pushes++;
    }
    player = next;
  }
  return { player, boxes: [...boxes].sort((a, b) => a - b), pushes };
}

export const isSolved = (level: OracleLevel, boxes: readonly number[]): boolean => solvedBoxes(level, boxes);

/**
 * For every goal, the fewest pushes that bring a lone crate from each cell to that goal
 * (Infinity when impossible), found by pulling the crate away from the goal. Other crates and
 * the player's walk are ignored, so this never overestimates.
 */
export function goalDistances(level: OracleLevel): Float64Array[] {
  const size = level.w * level.h;
  return [...level.goals].map((goal) => {
    const dist = new Float64Array(size).fill(Infinity);
    dist[goal] = 0;
    const queue = [goal];
    for (let head = 0; head < queue.length; head++) {
      const cell = queue[head]!;
      for (const { d } of OFFSETS(level.w)) {
        const to = cell + d;
        const player = cell + 2 * d;
        if (to < 0 || player < 0 || player >= size || level.blocked[to] || level.blocked[player] || dist[to] !== Infinity) continue;
        dist[to] = dist[cell]! + 1;
        queue.push(to);
      }
    }
    return dist;
  });
}

/**
 * Admissible and consistent lower bound: the cheapest one-to-one assignment of crates to goals
 * under `goalDistances` (subset dynamic programming; levels have at most a handful of crates).
 */
export function assignmentBound(distances: readonly Float64Array[], boxes: readonly number[]): number {
  const n = boxes.length;
  const best = new Float64Array(1 << n).fill(Infinity);
  best[0] = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    const cost = best[mask]!;
    if (cost === Infinity) continue;
    // Crate number `popcount(mask)` picks any goal not yet used.
    let k = 0;
    for (let m = mask; m; m &= m - 1) k++;
    if (k >= n) continue;
    for (let g = 0; g < n; g++) {
      if (mask & (1 << g)) continue;
      const next = mask | (1 << g);
      const value = cost + distances[g]![boxes[k]!]!;
      if (value < best[next]!) best[next] = value;
    }
  }
  return best[(1 << n) - 1]!;
}

/**
 * Push-optimal A* search over (crate set, player region) states with `assignmentBound` as the
 * heuristic. Because the bound is consistent (one push changes it by at most one), the first
 * solved state taken from the queue is optimal; it typically visits far fewer states than the
 * breadth-first `solve`, which is what lets the tests prove the larger levels optimal quickly.
 */
export function solveAStar(level: OracleLevel, options: { maxStates?: number } = {}): OracleSolution | null {
  const { maxStates = 2_000_000 } = options;
  interface Node {
    player: number;
    boxes: number[];
    g: number;
    parent: Node | null;
    stand: number;
    letter: string;
  }
  const size = level.w * level.h;
  const distances = goalDistances(level);
  const occupied = new Uint8Array(size);
  const mark = new Uint32Array(size);
  const stack = new Int32Array(size);
  let stamp = 0;
  const fill = (player: number, boxes: readonly number[]) => {
    for (const b of boxes) occupied[b] = 1;
    stamp++;
    let top = 0;
    let min = player;
    stack[top++] = player;
    mark[player] = stamp;
    while (top > 0) {
      const cell = stack[--top]!;
      if (cell < min) min = cell;
      for (const next of [cell - level.w, cell + level.w, cell - 1, cell + 1]) {
        if (next < 0 || next >= size || mark[next] === stamp || level.blocked[next] || occupied[next]) continue;
        mark[next] = stamp;
        stack[top++] = next;
      }
    }
    for (const b of boxes) occupied[b] = 0;
    return min;
  };
  const buckets: Node[][] = [];
  const best = new Map<string, number>();
  const push = (node: Node, key: string) => {
    const h = assignmentBound(distances, node.boxes);
    if (h === Infinity) return;
    const known = best.get(key);
    if (known !== undefined && known <= node.g) return;
    best.set(key, node.g);
    if (best.size > maxStates) throw new Error('oracle state limit exceeded');
    (buckets[node.g + h] ??= []).push(node);
  };
  const first: Node = { player: level.player, boxes: [...level.boxes].sort((a, b) => a - b), g: 0, parent: null, stand: -1, letter: '' };
  push(first, `${fill(first.player, first.boxes)}:${first.boxes.join(',')}`);
  for (let f = 0; f < buckets.length; f++) {
    const bucket = buckets[f];
    while (bucket && bucket.length > 0) {
      const node = bucket.pop()!;
      const key = `${fill(node.player, node.boxes)}:${node.boxes.join(',')}`;
      if (best.get(key)! < node.g) continue;
      if (solvedBoxes(level, node.boxes)) return { pushes: node.g, path: pathOfChain(level, node), states: best.size };
      const region = stamp;
      const boxSet = new Set(node.boxes);
      const children: Node[] = [];
      for (const box of node.boxes) {
        for (const { d, letter } of OFFSETS(level.w)) {
          const stand = box - d;
          const target = box + d;
          if (mark[stand] !== region || level.blocked[target] || boxSet.has(target)) continue;
          const boxes = node.boxes.map((b) => (b === box ? target : b)).sort((a, b) => a - b);
          children.push({ player: box, boxes, g: node.g + 1, parent: node, stand, letter: letter.toUpperCase() });
        }
      }
      for (const child of children) push(child, `${fill(child.player, child.boxes)}:${child.boxes.join(',')}`);
    }
  }
  return null;
}

function pathOfChain(level: OracleLevel, end: { player: number; boxes: number[]; parent: unknown; stand: number; letter: string }): string {
  type Link = { player: number; boxes: number[]; parent: Link | null; stand: number; letter: string };
  const chain: Link[] = [];
  for (let n: Link | null = end as Link; n?.parent; n = n.parent) chain.unshift(n);
  let path = '';
  for (const n of chain) {
    const parent = n.parent!;
    path += walkPath(walkable(level, parent.player, new Set(parent.boxes)), n.stand) + n.letter;
  }
  return path;
}
