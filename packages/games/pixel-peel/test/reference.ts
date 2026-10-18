import { stationLines } from '../src/engine';

/**
 * The v1 string-array rules (v1 design § 4.2–4.3), kept as the test oracle for the fast engine (v2 design § 3.1):
 * simple, slow and obviously correct. Cells are palette keys or `.`.
 */

export const EMPTY = '.';

/** The front of a station: the first present cell of its line, or -1. */
export function front(cells: readonly string[], line: readonly number[]): number {
  for (const index of line) if (cells[index] !== EMPTY) return index;
  return -1;
}

/** Exposed cells: the front of at least one station, in ascending index order. */
export function exposedCells(cells: readonly string[], w: number, h: number): number[] {
  const set = new Set<number>();
  for (const line of stationLines(w, h)) {
    const f = front(cells, line);
    if (f >= 0) set.add(f);
  }
  return [...set].sort((a, b) => a - b);
}

export interface RefHit {
  cell: number;
  station: number;
}

/**
 * The reference launch: laps of the track while a lap hits something and shots are left. Each station fires at most
 * once per lap, at its front at the moment the shooter passes. Returns a new cells array.
 */
export function launch(cells: readonly string[], w: number, h: number, shooter: { c: string; n: number }): { cells: string[]; hits: RefHit[]; left: number } {
  const out = cells.slice();
  const hits: RefHit[] = [];
  let left = shooter.n;
  if (left <= 0) return { cells: out, hits, left: Math.max(0, left) };
  const lines = stationLines(w, h);
  for (;;) {
    let lapHits = 0;
    for (let i = 0; i < lines.length; i++) {
      const f = front(out, lines[i] as number[]);
      if (f >= 0 && out[f] === shooter.c) {
        out[f] = EMPTY;
        hits.push({ cell: f, station: i });
        left -= 1;
        lapHits += 1;
        if (left === 0) return { cells: out, hits, left };
      }
    }
    if (lapHits === 0) return { cells: out, hits, left };
  }
}

export interface RefPosition {
  w: number;
  h: number;
  cells: string[];
  lanes: { c: string; n: number }[][];
  laneFront: number[];
  slots: ({ c: string; n: number; lane: number; index: number } | null)[];
}

/** The reference move (v1 § 4.4): returns the same object when illegal. */
export function refApply(pos: RefPosition, move: string): RefPosition {
  const m = /^([LS])(\d)$/.exec(move);
  if (!m) return pos;
  const index = Number(m[2]);
  if (m[1] === 'L') {
    const lane = pos.lanes[index];
    if (!lane) return pos;
    const k = pos.laneFront[index] as number;
    const s = lane[k];
    if (!s) return pos;
    const r = launch(pos.cells, pos.w, pos.h, s);
    const free = pos.slots.indexOf(null);
    if (r.left > 0 && free < 0) return pos;
    const slots = pos.slots.slice();
    if (r.left > 0) slots[free] = { c: s.c, n: r.left, lane: index, index: k };
    const laneFront = pos.laneFront.slice();
    laneFront[index] = k + 1;
    return { ...pos, cells: r.cells, slots, laneFront };
  }
  const parked = pos.slots[index];
  if (!parked) return pos;
  const r = launch(pos.cells, pos.w, pos.h, parked);
  if (r.hits.length === 0) return pos;
  const slots = pos.slots.slice();
  slots[index] = r.left > 0 ? { ...parked, n: r.left } : null;
  return { ...pos, cells: r.cells, slots };
}
