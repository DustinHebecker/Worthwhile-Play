/**
 * Independent brute-force oracle for Robot Program levels (shares no code with src/rules.ts).
 *
 * It enumerates every program in the language up to a length bound — but instead of listing
 * whole programs it explores them item by item: a program is a sequence of items (a simple
 * command, or a repeat block "n × body"), and executing an item only depends on the robot
 * (position, facing, collected stars) before it. So a uniform-cost search over robot states,
 * whose edges are all possible items weighted by their token count, visits exactly the
 * reachable effects of all programs, shortest first. A goal can also be reached in the middle
 * of an item (the run stops there), which the search handles step by step.
 */
export type OracleCmd = 'F' | 'L' | 'R' | 'C';
export type OracleItem = OracleCmd | { repeat: number; body: OracleCmd[] };

interface Board {
  w: number;
  h: number;
  wall: (r: number, c: number) => boolean;
  goal: [number, number];
  stars: [number, number][];
  start: { r: number; c: number; d: number };
}

function readBoard(map: readonly string[]): Board {
  const goal: [number, number] = [-1, -1];
  const stars: [number, number][] = [];
  let start = { r: -1, c: -1, d: -1 };
  map.forEach((line, r) =>
    [...line].forEach((ch, c) => {
      if (ch === 'G') goal.splice(0, 2, r, c);
      if (ch === '*') stars.push([r, c]);
      const d = { '^': 0, '>': 1, v: 2, '<': 3 }[ch];
      if (d !== undefined) start = { r, c, d };
    })
  );
  const h = map.length;
  const w = (map[0] ?? '').length;
  return { w, h, goal, stars, start, wall: (r, c) => r < 0 || c < 0 || r >= h || c >= w || map[r]?.[c] === '#' };
}

interface S {
  r: number;
  c: number;
  d: number;
  mask: number;
}

const MOVES = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1]
] as const;

/** One command; returns null on a crash. */
function exec(b: Board, s: S, cmd: OracleCmd): S | null {
  const [dr, dc] = MOVES[s.d] as readonly [number, number];
  const blocked = b.wall(s.r + dr, s.c + dc);
  if (cmd === 'L') return { ...s, d: (s.d + 3) % 4 };
  if (cmd === 'R' || (cmd === 'C' && blocked)) return { ...s, d: (s.d + 1) % 4 };
  if (blocked) return null;
  const r = s.r + dr;
  const c = s.c + dc;
  let mask = s.mask;
  b.stars.forEach(([sr, sc], i) => {
    if (sr === r && sc === c) mask |= 1 << i;
  });
  return { r, c, d: s.d, mask };
}

const done = (b: Board, s: S) => s.r === b.goal[0] && s.c === b.goal[1] && s.mask === (1 << b.stars.length) - 1;

/** Applies a sequence of commands; 'goal' if the goal is reached on the way, null on a crash. */
function execAll(b: Board, s: S, cmds: readonly OracleCmd[]): S | 'goal' | null {
  let cur = s;
  for (const cmd of cmds) {
    const next = exec(b, cur, cmd);
    if (!next) return null;
    if (done(b, next)) return 'goal';
    cur = next;
  }
  return cur;
}

function allBodies(cmds: readonly OracleCmd[], maxLen: number): OracleCmd[][] {
  const out: OracleCmd[][] = [];
  const grow = (prefix: OracleCmd[]) => {
    if (prefix.length > 0) out.push(prefix);
    if (prefix.length === maxLen) return;
    for (const c of cmds) grow([...prefix, c]);
  };
  grow([]);
  return out;
}

export interface OracleOptions {
  commands: readonly OracleCmd[];
  repeat: boolean;
  maxLength: number;
}

export interface OracleAnswer {
  /** Length of the shortest solving program, or null when none exists within maxLength. */
  minimal: number | null;
  /** One shortest program. */
  program: OracleItem[] | null;
}

/** Shortest program (by token count) that reaches the goal with all stars, up to maxLength. */
export function solve(map: readonly string[], options: OracleOptions): OracleAnswer {
  const b = readBoard(map);
  const items: { item: OracleItem; cost: number; cmds: OracleCmd[] }[] = options.commands.map((c) => ({ item: c, cost: 1, cmds: [c] }));
  if (options.repeat) {
    for (const body of allBodies(options.commands, 4)) {
      for (let n = 2; n <= 5; n++) {
        items.push({ item: { repeat: n, body }, cost: 1 + body.length, cmds: Array.from({ length: n }, () => body).flat() });
      }
    }
  }
  const key = (s: S) => `${s.r},${s.c},${s.d},${s.mask}`;
  const start: S = { r: b.start.r, c: b.start.c, d: b.start.d, mask: 0 };
  // Buckets by cost (uniform-cost search with small integer weights).
  const best = new Map<string, number>([[key(start), 0]]);
  const how = new Map<string, { prev: string; item: OracleItem }>();
  const states = new Map<string, S>([[key(start), start]]);
  const buckets: string[][] = [[key(start)]];
  let found = null as { total: number; program: OracleItem[] } | null;
  for (let cost = 0; cost <= options.maxLength; cost++) {
    for (const k of buckets[cost] ?? []) {
      if (best.get(k) !== cost) continue;
      const s = states.get(k) as S;
      for (const { item, cost: extra, cmds } of items) {
        const total = cost + extra;
        if (total > options.maxLength) continue;
        const next = execAll(b, s, cmds);
        if (next === null) continue;
        if (next === 'goal') {
          if (found && found.total <= total) continue;
          const program: OracleItem[] = [item];
          let back = k;
          while (how.has(back)) {
            const step = how.get(back) as { prev: string; item: OracleItem };
            program.unshift(step.item);
            back = step.prev;
          }
          found = { total, program };
          continue;
        }
        const nk = key(next);
        if ((best.get(nk) ?? Infinity) <= total) continue;
        best.set(nk, total);
        states.set(nk, next);
        how.set(nk, { prev: k, item });
        (buckets[total] ??= []).push(nk);
      }
    }
    // Every item costs at least 1, so later buckets can only find goals costing more than cost + 1.
    if (found && found.total <= cost + 1) break;
  }
  return found ? { minimal: found.total, program: found.program } : { minimal: null, program: null };
}

/** Independent reference interpreter: final robot and outcome of a program (for cross-checks). */
export function simulate(map: readonly string[], program: readonly OracleItem[], maxSteps: number): { outcome: string; r: number; c: number; d: number; steps: number } {
  const b = readBoard(map);
  let s: S = { r: b.start.r, c: b.start.c, d: b.start.d, mask: 0 };
  let steps = 0;
  const cmds = program.flatMap((item) => (typeof item === 'string' ? [item] : Array.from({ length: item.repeat }, () => item.body).flat()));
  for (const cmd of cmds) {
    if (steps === maxSteps) return { outcome: 'limit', r: s.r, c: s.c, d: s.d, steps };
    steps++;
    const next = exec(b, s, cmd);
    if (!next) return { outcome: 'crash', r: s.r, c: s.c, d: s.d, steps };
    s = next;
    if (done(b, s)) return { outcome: 'goal', r: s.r, c: s.c, d: s.d, steps };
  }
  return { outcome: 'ended', r: s.r, c: s.c, d: s.d, steps };
}
