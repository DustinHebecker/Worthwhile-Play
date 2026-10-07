/**
 * Independent reference implementation for the tests: its own level reader and a
 * push-optimal breadth-first solver. It deliberately shares no code with `src/rules.ts`.
 *
 * The solver searches over (crate set, player region) states: between two pushes the
 * player can walk anywhere in its reachable region, so a state is identified by the
 * crates plus the smallest cell of that region. Breadth-first order over pushes makes the
 * first solved state found push-optimal.
 */
// @ts-nocheck

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
