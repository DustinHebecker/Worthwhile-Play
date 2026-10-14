/**
 * Offline level generator for Crate Pusher — a test helper, never imported by `src/` and so
 * never part of the game bundle. It produced the levels appended in `src/levels.ts` (levels 9+
 * of easy/medium/hard and all of expert); `level-generator.test.ts` keeps it working.
 *
 * Method ("reverse play"):
 * 1. Draw a random room inside a 7 × 9 frame (interior up to 5 × 7, so it fits a 360 px phone):
 *    open floor, up to two corner bites, random wall cells and short wall segments; keep the
 *    largest connected floor area.
 * 2. Put the crates on randomly chosen goals and run an exhaustive breadth-first *pull* search
 *    from every solved position (the player in each free region). Pull-BFS depth is exactly the
 *    optimal push count of a position, so the deepest layers hold the hardest starts.
 * 3. Take a start from the deepest layer (or one of the three before it) with no crate on a goal,
 *    then confirm its push count with the independent forward solver of `oracle.ts`. Its number
 *    of visited states serves as a measure of how much planning the level needs.
 *
 * Curation (spread over push counts, rejecting near-duplicates of existing rooms) happened by
 * hand on top of the candidates; see `isNearDuplicate`.
 */
import type { Rng } from '@wp/game-core';
import { readLevel, solve } from './oracle';

export interface GeneratorTier {
  /** Inclusive ranges. */
  crates: readonly [number, number];
  pushes: readonly [number, number];
  innerWidth: readonly [number, number];
  innerHeight: readonly [number, number];
  walls: readonly [number, number];
  /** Minimum states the forward solver must visit (rejects trivial levels). */
  minStates: number;
  /** Give up on a room whose pull search grows beyond this many states. */
  cap: number;
}

/** The settings used for the shipped levels. */
export const TIERS = {
  easy: { crates: [1, 2], pushes: [12, 16], innerWidth: [3, 5], innerHeight: [3, 5], walls: [1, 5], minStates: 40, cap: 300_000 },
  medium: { crates: [2, 3], pushes: [17, 24], innerWidth: [4, 5], innerHeight: [4, 6], walls: [2, 7], minStates: 300, cap: 1_000_000 },
  hard: { crates: [4, 5], pushes: [29, 42], innerWidth: [5, 5], innerHeight: [5, 7], walls: [4, 11], minStates: 2000, cap: 1_500_000 },
  /** Used with `climbCandidates`. */
  expert: { crates: [4, 6], pushes: [36, 120], innerWidth: [5, 5], innerHeight: [6, 7], walls: [4, 12], minStates: 3000, cap: 1_500_000 }
} as const satisfies Record<string, GeneratorTier>;

export interface Candidate {
  map: string;
  crates: number;
  pushes: number;
  /** States visited by the forward push-optimal solver. */
  states: number;
  /** A push-optimal LURD solution. */
  path: string;
}

interface Room {
  w: number;
  h: number;
  floor: Uint8Array;
}

function makeRoom(tier: GeneratorTier, rng: Rng): Room {
  const iw = rng.int(tier.innerWidth[0], tier.innerWidth[1]);
  const ih = rng.int(tier.innerHeight[0], tier.innerHeight[1]);
  const w = iw + 2;
  const h = ih + 2;
  const floor = new Uint8Array(w * h);
  for (let r = 1; r <= ih; r++) for (let c = 1; c <= iw; c++) floor[r * w + c] = 1;
  const bites = rng.int(0, 2);
  for (let b = 0; b < bites; b++) {
    const bw = rng.int(1, 2);
    const bh = rng.int(1, 2);
    const right = rng.next() < 0.5;
    const bottom = rng.next() < 0.5;
    for (let r = 0; r < bh; r++) for (let c = 0; c < bw; c++) floor[(bottom ? ih - r : 1 + r) * w + (right ? iw - c : 1 + c)] = 0;
  }
  const walls = rng.int(tier.walls[0], tier.walls[1]);
  for (let k = 0; k < walls; k++) {
    const r = rng.int(1, ih);
    const c = rng.int(1, iw);
    floor[r * w + c] = 0;
    if (rng.next() < 0.3) {
      const horizontal = rng.next() < 0.5;
      floor[(horizontal ? r : Math.min(ih, r + 1)) * w + (horizontal ? Math.min(iw, c + 1) : c)] = 0;
    }
  }
  // Keep only the largest connected floor area.
  const component = new Int32Array(w * h).fill(-1);
  let best = -1;
  let bestSize = 0;
  for (let i = 0, id = 0; i < w * h; i++) {
    if (!floor[i] || component[i]! >= 0) continue;
    const stack = [i];
    component[i] = id;
    let size = 0;
    while (stack.length > 0) {
      const x = stack.pop()!;
      size++;
      for (const n of [x - w, x + w, x - 1, x + 1]) {
        if (floor[n] && component[n]! < 0) {
          component[n] = id;
          stack.push(n);
        }
      }
    }
    if (size > bestSize) {
      bestSize = size;
      best = id;
    }
    id++;
  }
  for (let i = 0; i < w * h; i++) if (component[i] !== best) floor[i] = 0;
  return { w, h, floor };
}

interface PullState {
  boxes: number[];
  player: number;
}

/** Exhaustive pull search from the solved positions; a deep start without crates on goals. */
function deepestStart(room: Room, goals: readonly number[], tier: GeneratorTier, rng: Rng): (PullState & { depth: number; onGoals: number; score: number }) | null {
  const { w, floor } = room;
  const size = room.w * room.h;
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
      const x = stack[--top]!;
      if (x < min) min = x;
      for (const n of [x - w, x + w, x - 1, x + 1]) {
        if (mark[n] === stamp || !floor[n] || occupied[n]) continue;
        mark[n] = stamp;
        stack[top++] = n;
      }
    }
    for (const b of boxes) occupied[b] = 0;
    return min;
  };
  const key = (min: number, boxes: readonly number[]) => String.fromCharCode(min, ...boxes);
  const seen = new Set<string>();
  const solved = [...goals].sort((a, b) => a - b);
  let layer: PullState[] = [];
  for (let p = 0; p < size; p++) {
    if (!floor[p] || goals.includes(p)) continue;
    const k = key(fill(p, solved), solved);
    if (seen.has(k)) continue;
    seen.add(k);
    layer.push({ boxes: solved, player: p });
  }
  const previous: PullState[][] = [];
  let depth = 0;
  for (;;) {
    const next: PullState[] = [];
    for (const state of layer) {
      fill(state.player, state.boxes);
      const region = stamp;
      const boxSet = new Set(state.boxes);
      const children: PullState[] = [];
      for (const b of state.boxes) {
        for (const d of [-w, w, -1, 1]) {
          // The player stands next to the crate and steps away from it, pulling it along.
          const stand = b + d;
          const to = b + 2 * d;
          if (mark[stand] !== region || !floor[to] || boxSet.has(to)) continue;
          children.push({ boxes: state.boxes.map((x) => (x === b ? stand : x)).sort((x, y) => x - y), player: to });
        }
      }
      for (const child of children) {
        const k = key(fill(child.player, child.boxes), child.boxes);
        if (seen.has(k)) continue;
        seen.add(k);
        next.push(child);
      }
      if (seen.size > tier.cap) return null;
    }
    if (next.length === 0) break;
    previous.push(layer);
    if (previous.length > 3) previous.shift();
    layer = next;
    depth++;
  }
  // Score = depth − 8 × (crates left on goals): the deepest layer with a start that has no crate
  // on a goal wins; otherwise the result still tells the hill climber how close it came.
  const onGoals = (s: PullState) => s.boxes.filter((b) => goals.includes(b)).length;
  const layers = [...previous, layer];
  let best: (PullState & { depth: number; onGoals: number; score: number }) | null = null;
  for (let back = 0; back < layers.length; back++) {
    const states = layers[layers.length - 1 - back]!;
    const fewest = Math.min(...states.map(onGoals));
    const score = depth - back - 8 * fewest;
    if (best && score <= best.score) continue;
    best = { ...rng.pick(states.filter((s) => onGoals(s) === fewest)), depth: depth - back, onGoals: fewest, score };
  }
  return best;
}

/** XSB text of a room, cropped to the room plus its wall ring (other cells stay blank). */
export function formatRoom(room: Room, goals: readonly number[], boxes: readonly number[], player: number): string {
  const { w, h, floor } = room;
  let r0 = h;
  let r1 = 0;
  let c0 = w;
  let c1 = 0;
  for (let i = 0; i < w * h; i++) {
    if (!floor[i]) continue;
    const r = Math.floor(i / w);
    const c = i % w;
    r0 = Math.min(r0, r);
    r1 = Math.max(r1, r);
    c0 = Math.min(c0, c);
    c1 = Math.max(c1, c);
  }
  const rows: string[] = [];
  for (let r = r0 - 1; r <= r1 + 1; r++) {
    let line = '';
    for (let c = c0 - 1; c <= c1 + 1; c++) {
      const i = r * w + c;
      if (!floor[i]) {
        let touches = false;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const rr = r + dr;
            const cc = c + dc;
            if (rr >= 0 && rr < h && cc >= 0 && cc < w && floor[rr * w + cc]) touches = true;
          }
        }
        line += touches ? '#' : ' ';
        continue;
      }
      const goal = goals.includes(i);
      if (boxes.includes(i)) line += goal ? '*' : '$';
      else if (i === player) line += goal ? '+' : '@';
      else line += goal ? '.' : ' ';
    }
    rows.push(line.trimEnd());
  }
  return rows.join('|');
}

/** Runs `attempts` random rooms and returns the accepted, solver-verified candidates. */
export function generateCandidates(tier: GeneratorTier, rng: Rng, attempts: number): Candidate[] {
  const out: Candidate[] = [];
  const rooms = new Set<string>();
  for (let a = 0; a < attempts; a++) {
    const room = makeRoom(tier, rng);
    const cells = [...room.floor.keys()].filter((i) => room.floor[i]);
    const crates = rng.int(tier.crates[0], tier.crates[1]);
    if (cells.length < crates * 3 + 5) continue;
    const goals = rng.shuffle(cells).slice(0, crates);
    const start = deepestStart(room, goals, tier, rng);
    const candidate = start && accept(tier, room, goals, start, rooms);
    if (candidate) out.push(candidate);
  }
  return out;
}

function accept(
  tier: GeneratorTier,
  room: Room,
  goals: readonly number[],
  start: PullState & { depth: number; onGoals: number },
  rooms: Set<string>
): Candidate | null {
  if (start.onGoals > 0 || start.depth < tier.pushes[0] || start.depth > tier.pushes[1]) return null;
  const map = formatRoom(room, goals, start.boxes, start.player);
  const walls = map.replace(/[.$*@+]/g, ' ');
  if (rooms.has(walls)) return null;
  const level = readLevel(map);
  const forward = solve(level, level, { prune: true, maxStates: 5_000_000 });
  if (!forward || forward.pushes !== start.depth) throw new Error(`pull and push search disagree on ${map}`);
  if (forward.states < tier.minStates) return null;
  rooms.add(walls);
  return { map, crates: goals.length, pushes: forward.pushes, states: forward.states, path: forward.path };
}

/** A goal from which a crate can be pulled at least one step (corner goals would stay filled). */
const pullable = (room: Room, cell: number) => [-room.w, room.w, -1, 1].some((d) => room.floor[cell + d] && room.floor[cell + 2 * d]);

function isConnected(room: Room): boolean {
  const cells = [...room.floor.keys()].filter((i) => room.floor[i]);
  const seen = new Set([cells[0]]);
  const stack = [cells[0]!];
  while (stack.length > 0) {
    const x = stack.pop()!;
    for (const n of [x - room.w, x + room.w, x - 1, x + 1]) {
      if (room.floor[n] && !seen.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return seen.size === cells.length;
}

/**
 * Hill climbing for the expert tier, where purely random rooms almost never reach 36+ pushes:
 * start from a random room with goals on pullable cells, then repeatedly move one goal or toggle
 * one wall cell (keeping the room connected) and keep the change when the pull-search score
 * does not drop. The final room is accepted like any other candidate.
 */
export function climbCandidates(tier: GeneratorTier, rng: Rng, climbs: number, steps: number): Candidate[] {
  const out: Candidate[] = [];
  const rooms = new Set<string>();
  for (let a = 0; a < climbs; a++) {
    let room = makeRoom(tier, rng);
    const crates = rng.int(tier.crates[0], tier.crates[1]);
    const floorCells = (r: Room) => [...r.floor.keys()].filter((i) => r.floor[i]);
    if (floorCells(room).length < crates * 3 + 5) continue;
    let goals = rng.shuffle(floorCells(room).filter((c) => pullable(room, c))).slice(0, crates);
    if (goals.length < crates) continue;
    let best = deepestStart(room, goals, tier, rng);
    for (let s = 0; s < steps; s++) {
      const next: Room = { ...room, floor: new Uint8Array(room.floor) };
      const nextGoals = [...goals];
      if (rng.next() < 0.5) {
        const free = floorCells(room).filter((c) => !goals.includes(c) && pullable(room, c));
        if (free.length === 0) continue;
        nextGoals[rng.int(0, crates - 1)] = rng.pick(free);
      } else {
        const cell = rng.int(1, room.h - 2) * room.w + rng.int(1, room.w - 2);
        if (goals.includes(cell)) continue;
        next.floor[cell] = next.floor[cell] ? 0 : 1;
        if (floorCells(next).length < crates * 3 + 5 || !isConnected(next)) continue;
      }
      const result = deepestStart(next, nextGoals, tier, rng);
      if (result && (!best || result.score >= best.score)) {
        best = result;
        room = next;
        goals = nextGoals;
      }
    }
    const candidate = best && accept(tier, room, goals, best, rooms);
    if (candidate) out.push(candidate);
  }
  return out;
}

const grid = (map: string) => {
  const rows = map.split('|');
  const width = Math.max(...rows.map((row) => row.length));
  return rows.map((row) => row.padEnd(width, ' '));
};

/**
 * True when two maps have the same size and differ in fewer than `threshold` cells of their
 * wall and goal layout (crate and player positions are ignored).
 */
export function isNearDuplicate(a: string, b: string, threshold = 5): boolean {
  const A = grid(a);
  const B = grid(b);
  if (A.length !== B.length || A[0]!.length !== B[0]!.length) return false;
  let differences = 0;
  for (let r = 0; r < A.length; r++) {
    for (let c = 0; c < A[0]!.length; c++) {
      const x = A[r]![c]!;
      const y = B[r]![c]!;
      if ((x === '#') !== (y === '#') || '.*+'.includes(x) !== '.*+'.includes(y)) differences++;
    }
  }
  return differences < threshold;
}
