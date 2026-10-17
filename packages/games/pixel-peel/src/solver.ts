import { EMPTY, isSolved, positionAt, stationLines, type Move, type PeelState, type Position } from './rules';

/**
 * Solver and "obvious play" (design § 9.3, § 9.4). Internally a position is a byte array of present cells plus one
 * lazily advanced front pointer per station (cells are only ever removed, so pointers only move forward). Children
 * are copies, so there is no revert step to get wrong. The pure `launch` in rules.ts stays the reference; a property
 * test checks that both agree. Budgets count expanded nodes, never time, so results are the same on every device.
 */

interface Board {
  w: number;
  h: number;
  /** Station lines, flattened: line i is `cellsOf[start[i] … start[i+1])`. */
  cellsOf: Int16Array;
  start: Int32Array;
  stations: number;
  /** Colour code per cell (0 = transparent, 1… = palette position + 1). */
  colour: Uint8Array;
  /** Colour code of each lane shooter, and its shots. */
  lanes: { c: number; n: number }[][];
  slotCount: number;
}

interface Slot {
  c: number;
  n: number;
  lane: number;
  index: number;
}

interface Node {
  present: Uint8Array;
  ptr: Int16Array;
  laneFront: Uint8Array;
  slots: (Slot | null)[];
  left: number;
}

interface Child {
  move: Move;
  node: Node;
  hits: number;
  usedUp: boolean;
  slotMove: boolean;
  index: number;
}

function boardOf(pos: Position): { board: Board; node: Node } {
  const keys = new Map<string, number>();
  const code = (c: string) => {
    let k = keys.get(c);
    if (k === undefined) {
      k = keys.size + 1;
      keys.set(c, k);
    }
    return k;
  };
  const lines = stationLines(pos.w, pos.h);
  const start = new Int32Array(lines.length + 1);
  let total = 0;
  lines.forEach((line, i) => {
    start[i] = total;
    total += line.length;
  });
  start[lines.length] = total;
  const cellsOf = new Int16Array(total);
  lines.forEach((line, i) => cellsOf.set(line, start[i] as number));
  const colour = new Uint8Array(pos.cells.length);
  const present = new Uint8Array(pos.cells.length);
  pos.cells.forEach((c, i) => {
    if (c !== EMPTY) {
      colour[i] = code(c);
      present[i] = 1;
    }
  });
  const lanes = pos.lanes.map((lane) => lane.map((s) => ({ c: code(s.c), n: s.n })));
  const slots = pos.slots.map((s) => (s ? { c: code(s.c), n: s.n, lane: s.lane, index: s.index } : null));
  const board: Board = { w: pos.w, h: pos.h, cellsOf, start, stations: lines.length, colour, lanes, slotCount: pos.slots.length };
  const node: Node = { present, ptr: new Int16Array(lines.length), laneFront: Uint8Array.from(pos.laneFront), slots, left: present.reduce((a, b) => a + b, 0) };
  return { board, node };
}

/** Front cell of station i in `node` (advancing its pointer), or -1. */
function frontOf(board: Board, node: Node, i: number): number {
  const end = (board.start[i + 1] as number) - (board.start[i] as number);
  let p = node.ptr[i] as number;
  const base = board.start[i] as number;
  while (p < end && node.present[board.cellsOf[base + p] as number] === 0) p++;
  node.ptr[i] = p;
  return p < end ? (board.cellsOf[base + p] as number) : -1;
}

/** The fast launch: mutates `node` (cells and pointers); returns hits and shots left. */
function fastLaunch(board: Board, node: Node, c: number, n: number): { hits: number; left: number } {
  let left = n;
  let hits = 0;
  if (left <= 0) return { hits, left: 0 };
  for (;;) {
    let lap = 0;
    for (let i = 0; i < board.stations; i++) {
      const f = frontOf(board, node, i);
      if (f >= 0 && board.colour[f] === c) {
        node.present[f] = 0;
        node.left -= 1;
        left -= 1;
        lap += 1;
        if (left === 0) return { hits: hits + lap, left };
      }
    }
    hits += lap;
    if (lap === 0) return { hits, left };
  }
}

const copy = (node: Node): Node => ({ present: node.present.slice(), ptr: node.ptr.slice(), laneFront: node.laneFront.slice(), slots: node.slots.slice(), left: node.left });

/** Legal children of a node in the order of the obvious play: most hits, used up first, slots before lanes, low index. */
function children(board: Board, node: Node): Child[] {
  const out: Child[] = [];
  const free = node.slots.indexOf(null);
  node.slots.forEach((s, j) => {
    if (!s) return;
    const next = copy(node);
    const r = fastLaunch(board, next, s.c, s.n);
    if (r.hits === 0) return;
    next.slots[j] = r.left > 0 ? { ...s, n: r.left } : null;
    out.push({ move: `S${j}`, node: next, hits: r.hits, usedUp: r.left === 0, slotMove: true, index: j });
  });
  board.lanes.forEach((lane, i) => {
    const k = node.laneFront[i] as number;
    const s = lane[k];
    if (!s) return;
    const next = copy(node);
    const r = fastLaunch(board, next, s.c, s.n);
    if (r.left > 0 && free < 0) return;
    next.laneFront[i] = k + 1;
    if (r.left > 0) next.slots[free] = { c: s.c, n: r.left, lane: i, index: k };
    out.push({ move: `L${i}`, node: next, hits: r.hits, usedUp: r.left === 0, slotMove: false, index: i });
  });
  out.sort((a, b) => b.hits - a.hits || Number(b.usedUp) - Number(a.usedUp) || Number(b.slotMove) - Number(a.slotMove) || a.index - b.index);
  return out;
}

/** Position key: lane fronts, the slot contents as a multiset, the present-cell bitset. */
function keyOf(node: Node): string {
  const slots = node.slots
    .filter((s): s is Slot => s !== null)
    .map((s) => `${s.lane}.${s.index}.${s.n}`)
    .sort()
    .join(',');
  let bits = '';
  let acc = 0;
  let k = 0;
  for (let i = 0; i < node.present.length; i++) {
    acc = (acc << 1) | (node.present[i] as number);
    if (++k === 15) {
      bits += String.fromCharCode(acc + 48);
      acc = 0;
      k = 0;
    }
  }
  if (k) bits += String.fromCharCode(acc + 48);
  return `${node.laneFront.join('.')}|${slots}|${bits}`;
}

export type SolveResult = { solution: Move[] } | { unsolvable: true } | { unknown: true };

/**
 * Depth-first search with a memo of failed positions. The first dive is the obvious play. `budget` is the number
 * of expanded nodes; `unsolvable` is only reported when the whole space was searched within it.
 */
export function solve(pos: Position, budget = 4000): SolveResult {
  const { board, node } = boardOf(pos);
  const failed = new Set<string>();
  let expanded = 0;
  let exhausted = false;
  const path: Move[] = [];
  const dfs = (n: Node): boolean => {
    if (n.left === 0) return true;
    const key = keyOf(n);
    if (failed.has(key)) return false;
    if (expanded >= budget) {
      exhausted = true;
      return false;
    }
    expanded++;
    for (const child of children(board, n)) {
      path.push(child.move);
      if (dfs(child.node)) return true;
      path.pop();
      if (exhausted) return false;
    }
    failed.add(key);
    return false;
  };
  if (dfs(node)) return { solution: path.slice() };
  return exhausted ? { unknown: true } : { unsolvable: true };
}

/** The obvious play (design § 9.3): always the first child; solved or stuck. */
export function obviousPlay(pos: Position): { solved: boolean; moves: Move[] } {
  const { board, node } = boardOf(pos);
  const moves: Move[] = [];
  let n = node;
  while (n.left > 0) {
    const first = children(board, n)[0];
    if (!first) return { solved: false, moves };
    moves.push(first.move);
    n = first.node;
  }
  return { solved: true, moves };
}

/** For tests: the fast launch from a position, as removed-cell flags and shots left. */
export function fastLaunchFrom(pos: Position, c: string, n: number): { present: boolean[]; left: number; hits: number } {
  const { board, node } = boardOf(pos);
  let code = 0;
  pos.cells.forEach((ch, i) => {
    if (ch === c) code = board.colour[i] as number;
  });
  const r = code ? fastLaunch(board, node, code, n) : { hits: 0, left: n };
  return { present: [...node.present].map((p) => p === 1), left: r.left, hits: r.hits };
}

// --- Hint (design § 4.7) ---------------------------------------------------------------------------------------

export type HintResult =
  | { kind: 'move'; move: Move }
  /** `proven`: the current position was proven unsolvable; otherwise the check ran out of budget. */
  | { kind: 'undo'; k: number; proven: boolean };

export const HINT_BUDGET = 20_000;
export const ANCESTOR_BUDGET = 2_000;
export const ANCESTORS = 8;

const commonPrefix = (a: readonly Move[], b: readonly Move[]): number => {
  let k = 0;
  while (k < a.length && k < b.length && a[k] === b[k]) k++;
  return k;
};

/** A proven suggestion from the current position, or a safe move number to go back to. */
export function hint(state: PeelState): HintResult {
  const k0 = commonPrefix(state.moves, state.witness);
  // On the witness path the next witness move is a proven answer, at no cost.
  if (k0 === state.moves.length && k0 < state.witness.length) return { kind: 'move', move: state.witness[k0] as Move };
  const pos = positionAt(state, state.moves.length);
  if (isSolved(pos)) return { kind: 'undo', k: state.moves.length, proven: false };
  const result = solve(pos, HINT_BUDGET);
  if ('solution' in result) return { kind: 'move', move: result.solution[0] as Move };
  if ('unsolvable' in result) {
    for (let k = state.moves.length - 1; k >= Math.max(k0 + 1, state.moves.length - ANCESTORS); k--) {
      if ('solution' in solve(positionAt(state, k), ANCESTOR_BUDGET)) return { kind: 'undo', k, proven: true };
    }
    return { kind: 'undo', k: k0, proven: true };
  }
  return { kind: 'undo', k: k0, proven: false };
}
