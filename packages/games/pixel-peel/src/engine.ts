/**
 * The fast Pixel Peel engine (design v2 § 3.1): pure, DOM-free and shared by rules, generator, policies, hint and
 * view. A picture becomes flat typed arrays once; a position is a cursor of typed arrays that is cloned in a few
 * microseconds. The rules are exactly those of v1 § 4 (the reference string-array launch lives in
 * `test/reference.ts`; a property test checks that both agree).
 *
 * Track: stations run from the bottom-left corner: right along the bottom (columns, scanning upwards), up the right
 * side (rows, scanning leftwards), left along the top (columns, scanning downwards) and down the left side (rows,
 * scanning rightwards). A station's front is the first present cell of its line. Cells are only ever removed, so a
 * per-station pointer only moves forward: all fronts together cost O(4·W·H) over a whole game.
 */

export interface PictureLike {
  w: number;
  h: number;
  rows: readonly string[];
  palette: readonly { key: string }[];
}

export interface Engine {
  w: number;
  h: number;
  /** Number of stations, 2W + 2H. */
  stations: number;
  /** Line i is `lineCells[lineStart[i] … lineStart[i + 1])`. */
  lineStart: Int32Array;
  lineCells: Int16Array;
  /** Per cell: palette index + 1, or 0 for transparent. */
  colour: Uint8Array;
  /** Palette index → key. */
  keys: readonly string[];
  /** Key → colour code (palette index + 1). */
  codes: ReadonlyMap<string, number>;
  /** Filled cells of the picture. */
  filled: number;
}

/** The present cells of a position, with the lazily advanced front pointers. */
export interface Cells {
  present: Uint8Array;
  ptr: Int16Array;
  left: number;
}

const lineCache = new Map<string, { start: Int32Array; cells: Int16Array }>();

/** Station lines for a W × H grid (memoised per size). */
export function trackOf(w: number, h: number): { start: Int32Array; cells: Int16Array } {
  const key = `${w}x${h}`;
  const cached = lineCache.get(key);
  if (cached) return cached;
  const stations = 2 * w + 2 * h;
  const start = new Int32Array(stations + 1);
  const cells = new Int16Array(4 * w * h);
  let k = 0;
  for (let i = 0; i < stations; i++) {
    start[i] = k;
    if (i < w) for (let y = h - 1; y >= 0; y--) cells[k++] = y * w + i;
    else if (i < w + h) {
      const y = h - 1 - (i - w);
      for (let x = w - 1; x >= 0; x--) cells[k++] = y * w + x;
    } else if (i < 2 * w + h) {
      const x = w - 1 - (i - w - h);
      for (let y = 0; y < h; y++) cells[k++] = y * w + x;
    } else {
      const y = i - 2 * w - h;
      for (let x = 0; x < w; x++) cells[k++] = y * w + x;
    }
  }
  start[stations] = k;
  const out = { start, cells };
  lineCache.set(key, out);
  return out;
}

/** The cell indices of every station, as arrays (for tests and drawing). */
export function stationLines(w: number, h: number): number[][] {
  const { start, cells } = trackOf(w, h);
  const lines: number[][] = [];
  for (let i = 0; i + 1 < start.length; i++) lines.push(Array.from(cells.subarray(start[i] as number, start[i + 1] as number)));
  return lines;
}

const engineCache = new WeakMap<object, Engine>();

/** The engine of a picture (memoised per picture object). Unknown keys count as transparent. */
export function engineOf(picture: PictureLike): Engine {
  const cached = engineCache.get(picture);
  if (cached) return cached;
  const { w, h } = picture;
  const keys = picture.palette.map((p) => p.key);
  const codes = new Map(keys.map((k, i) => [k, i + 1] as const));
  const colour = new Uint8Array(w * h);
  let filled = 0;
  for (let y = 0; y < h; y++) {
    const row = picture.rows[y] ?? '';
    for (let x = 0; x < w; x++) {
      const c = codes.get(row[x] ?? '.') ?? 0;
      colour[y * w + x] = c;
      if (c) filled++;
    }
  }
  const { start, cells } = trackOf(w, h);
  const engine: Engine = { w, h, stations: 2 * w + 2 * h, lineStart: start, lineCells: cells, colour, keys, codes, filled };
  engineCache.set(picture, engine);
  return engine;
}

export function fullCells(engine: Engine): Cells {
  const present = new Uint8Array(engine.colour.length);
  for (let i = 0; i < present.length; i++) present[i] = engine.colour[i] ? 1 : 0;
  return { present, ptr: new Int16Array(engine.stations), left: engine.filled };
}

export const cloneCells = (c: Cells): Cells => ({ present: c.present.slice(), ptr: c.ptr.slice(), left: c.left });

/** The front cell of station i (advancing its pointer), or -1. */
export function frontOf(engine: Engine, cells: Cells, i: number): number {
  const base = engine.lineStart[i] as number;
  const end = (engine.lineStart[i + 1] as number) - base;
  let p = cells.ptr[i] as number;
  const { present } = cells;
  const line = engine.lineCells;
  while (p < end && present[line[base + p] as number] === 0) p++;
  cells.ptr[i] = p;
  return p < end ? (line[base + p] as number) : -1;
}

/**
 * One launch of a shooter of colour code `c` with `n` shots (v1 § 4.3): laps of the track while a lap hits something
 * and shots are left; each station fires at most once per lap, at its front at the moment the shooter passes.
 * Mutates `cells`; returns the number of hits. `onHit(cell, station)` reports each hit in order.
 */
export function launch(engine: Engine, cells: Cells, c: number, n: number, onHit?: (cell: number, station: number) => void): number {
  let left = n;
  let hits = 0;
  if (left <= 0 || c <= 0) return 0;
  const { stations, colour } = engine;
  for (;;) {
    let lap = 0;
    for (let i = 0; i < stations; i++) {
      const f = frontOf(engine, cells, i);
      if (f >= 0 && colour[f] === c) {
        cells.present[f] = 0;
        cells.left -= 1;
        onHit?.(f, i);
        left -= 1;
        lap += 1;
        if (left === 0) return hits + lap;
      }
    }
    hits += lap;
    if (lap === 0) return hits;
  }
}

const trialHits: number[] = [];
const recordTrial = (f: number) => {
  trialHits.push(f);
};
const savedPtrs = new Map<number, Int16Array>();

/**
 * Hits a launch would make, without changing `cells`: it launches in place and undoes it (hit cells restored,
 * station pointers reset), so nothing is copied but the station pointers.
 */
export function hitsOf(engine: Engine, cells: Cells, c: number, n: number): number {
  let saved = savedPtrs.get(cells.ptr.length);
  if (!saved) {
    saved = new Int16Array(cells.ptr.length);
    savedPtrs.set(cells.ptr.length, saved);
  }
  saved.set(cells.ptr);
  trialHits.length = 0;
  const hits = launch(engine, cells, c, n, recordTrial);
  for (const f of trialHits) cells.present[f] = 1;
  cells.left += trialHits.length;
  trialHits.length = 0;
  cells.ptr.set(saved);
  return hits;
}

/** The exposed cells (the front of at least one station), ascending. */
export function exposedOf(engine: Engine, cells: Cells): number[] {
  const seen = new Uint8Array(engine.colour.length);
  const out: number[] = [];
  for (let i = 0; i < engine.stations; i++) {
    const f = frontOf(engine, cells, i);
    if (f >= 0 && !seen[f]) {
      seen[f] = 1;
      out.push(f);
    }
  }
  return out.sort((a, b) => a - b);
}

/** Per colour code: exposed cells now (index 0 unused). */
export function exposedCounts(engine: Engine, cells: Cells): Int32Array {
  const counts = new Int32Array(engine.keys.length + 1);
  const seen = new Uint8Array(engine.colour.length);
  for (let i = 0; i < engine.stations; i++) {
    const f = frontOf(engine, cells, i);
    if (f >= 0 && !seen[f]) {
      seen[f] = 1;
      counts[engine.colour[f] as number]! += 1;
    }
  }
  return counts;
}

// --- Lanes, slots and moves ------------------------------------------------------------------------------------

/** A shooter by colour code. */
export interface CodeShooter {
  c: number;
  n: number;
}

/** The fixed part of a game: the engine, the lanes (colour codes) and the number of slots. */
export interface Table {
  engine: Engine;
  lanes: readonly (readonly CodeShooter[])[];
  slotCount: number;
}

export interface SlotShooter extends CodeShooter {
  /** Where it came from (its identity). */
  lane: number;
  index: number;
}

export interface Cursor {
  cells: Cells;
  laneFront: Uint8Array;
  slots: (SlotShooter | null)[];
  launches: number;
  parks: number;
}

export function tableOf(engine: Engine, lanes: readonly (readonly { c: string; n: number }[])[], slotCount: number): Table {
  return { engine, lanes: lanes.map((lane) => lane.map((s) => ({ c: engine.codes.get(s.c) ?? 0, n: s.n }))), slotCount };
}

export const startCursor = (table: Table): Cursor => ({
  cells: fullCells(table.engine),
  laneFront: new Uint8Array(table.lanes.length),
  slots: Array.from({ length: table.slotCount }, () => null),
  launches: 0,
  parks: 0
});

export const cloneCursor = (c: Cursor): Cursor => ({ cells: cloneCells(c.cells), laneFront: c.laneFront.slice(), slots: c.slots.slice(), launches: c.launches, parks: c.parks });

export type Reason = 'invalid' | 'empty' | 'noSlot' | 'nothing';

export interface Outcome {
  legal: boolean;
  reason: Reason | null;
  /** The shooter the move launches (null for an empty lane or slot, or an invalid move). */
  shooter: SlotShooter | null;
  hits: number;
  left: number;
  /** Slot the shooter waits in afterwards (-1 when used up or illegal). */
  slot: number;
  /** A lane launch that hits nothing. */
  parks: boolean;
}

export const freeSlotOf = (cur: Cursor): number => cur.slots.indexOf(null);

/**
 * Plays move `kind`/`index` on `cur` in place when it is legal (`commit`), otherwise leaves it untouched. With
 * `commit = false` the cells are launched on a copy. Returns what happened.
 */
export function step(table: Table, cur: Cursor, kind: 'L' | 'S', index: number, commit: boolean, onHit?: (cell: number, station: number) => void): Outcome {
  const none = (reason: Reason, shooter: SlotShooter | null = null, hits = 0, left = 0): Outcome => ({ legal: false, reason, shooter, hits, left, slot: -1, parks: false });
  if (kind === 'L') {
    const lane = table.lanes[index];
    if (!lane) return none('invalid');
    const k = cur.laneFront[index] as number;
    const s = lane[k];
    if (!s) return none('empty');
    const shooter: SlotShooter = { c: s.c, n: s.n, lane: index, index: k };
    // With a free slot a lane launch is always legal, so it may work in place; otherwise on a copy.
    const cells = commit && freeSlotOf(cur) >= 0 ? cur.cells : cloneCells(cur.cells);
    const hits = launch(table.engine, cells, s.c, s.n, onHit);
    const left = s.n - hits;
    const slot = left > 0 ? freeSlotOf(cur) : -1;
    if (left > 0 && slot < 0) return none('noSlot', shooter, hits, left);
    if (commit) {
      cur.cells = cells;
      cur.laneFront[index] = k + 1;
      if (left > 0) cur.slots[slot] = { ...shooter, n: left };
      cur.launches += 1;
      if (hits === 0) cur.parks += 1;
    }
    return { legal: true, reason: null, shooter, hits, left, slot, parks: hits === 0 };
  }
  if (index < 0 || index >= cur.slots.length) return none('invalid');
  const parked = cur.slots[index];
  if (!parked) return none('empty');
  // A relaunch without hits changes nothing, so a committing relaunch may work in place.
  const cells = commit ? cur.cells : cloneCells(cur.cells);
  const hits = launch(table.engine, cells, parked.c, parked.n, onHit);
  if (hits === 0) return none('nothing', parked, 0, parked.n);
  const left = parked.n - hits;
  if (commit) {
    cur.cells = cells;
    cur.slots[index] = left > 0 ? { ...parked, n: left } : null;
    cur.launches += 1;
  }
  return { legal: true, reason: null, shooter: parked, hits, left, slot: left > 0 ? index : -1, parks: false };
}

const MOVE = /^([LS])([0-9])$/;

export function parseMove(move: unknown): { kind: 'L' | 'S'; index: number } | undefined {
  if (typeof move !== 'string') return undefined;
  const m = MOVE.exec(move);
  return m ? { kind: m[1] as 'L' | 'S', index: Number(m[2]) } : undefined;
}

/** Plays `moves` from the start; undefined when one is illegal. */
export function replayCursor(table: Table, moves: readonly string[], from: Cursor = startCursor(table)): Cursor | undefined {
  const cur = from;
  for (const move of moves) {
    const p = parseMove(move);
    if (!p || !step(table, cur, p.kind, p.index, true).legal) return undefined;
  }
  return cur;
}

/** A legal move with its result (for policies, hint and solver). */
export interface Child {
  move: string;
  /**
   * The position after the move. Computed on first access from the parent cursor, so it must be read before the
   * parent changes (policies and the solver read it right after choosing).
   */
  readonly cursor: Cursor;
  hits: number;
  usedUp: boolean;
  slotMove: boolean;
  /** Lane or slot index. */
  index: number;
  /** Free slots after the move. */
  freeAfter: number;
  /** The launched shooter's identity. */
  lane: number;
  shooterIndex: number;
}

/**
 * All legal moves of a position: slots first, then lanes (each in index order). Each candidate is launched on the
 * parent's cells in place and undone (hit cells restored, station pointers reset), so no cells are copied; only the
 * child cursor that is actually read is built (design v2 § 6.5, start time on phones).
 */
export function childrenOf(table: Table, cur: Cursor): Child[] {
  const { engine } = table;
  const cells = cur.cells;
  let free = 0;
  for (const s of cur.slots) if (!s) free++;
  const out: Child[] = [];
  const add = (kind: 'L' | 'S', i: number, c: number, n: number, lane: number, shooterIndex: number) => {
    const hits = hitsOf(engine, cells, c, n);
    const left = n - hits;
    if (kind === 'S' ? hits === 0 : left > 0 && free === 0) return;
    let built: Cursor | null = null;
    out.push({
      move: `${kind}${i}`,
      get cursor(): Cursor {
        if (!built) {
          built = cloneCursor(cur);
          step(table, built, kind, i, true);
        }
        return built;
      },
      hits,
      usedUp: left === 0,
      slotMove: kind === 'S',
      index: i,
      freeAfter: kind === 'S' ? free + (left === 0 ? 1 : 0) : free - (left > 0 ? 1 : 0),
      lane,
      shooterIndex
    });
  };
  for (let j = 0; j < cur.slots.length; j++) {
    const s = cur.slots[j];
    if (s) add('S', j, s.c, s.n, s.lane, s.index);
  }
  for (let i = 0; i < table.lanes.length; i++) {
    const k = cur.laneFront[i] as number;
    const s = table.lanes[i]?.[k];
    if (s) add('L', i, s.c, s.n, i, k);
  }
  return out;
}

/** Shooters still to play: lanes from their fronts, then slots. */
export function shotsLeft(table: Table, cur: Cursor): Int32Array {
  const shots = new Int32Array(table.engine.keys.length + 1);
  table.lanes.forEach((lane, i) => {
    for (let k = cur.laneFront[i] as number; k < lane.length; k++) shots[(lane[k] as CodeShooter).c]! += (lane[k] as CodeShooter).n;
  });
  for (const s of cur.slots) if (s) shots[s.c]! += s.n;
  return shots;
}

// --- Incremental exposed set (design v2 § 6.5) ------------------------------------------------------------------

/** The front of every station and, per cell, how many stations see it as their front (> 0 = exposed). */
export interface Exposure {
  front: Int32Array;
  seenBy: Uint8Array;
}

/** A full scan. */
export function exposureOf(engine: Engine, cells: Cells): Exposure {
  const front = new Int32Array(engine.stations);
  const seenBy = new Uint8Array(engine.colour.length);
  for (let i = 0; i < engine.stations; i++) {
    const f = frontOf(engine, cells, i);
    front[i] = f;
    if (f >= 0) seenBy[f] = (seenBy[f] as number) + 1;
  }
  return { front, seenBy };
}

/** The 4 stations whose lines contain cell `c` (bottom, right, top, left). */
export function stationsOfCell(engine: Engine, c: number): [number, number, number, number] {
  const { w, h } = engine;
  const x = c % w;
  const y = (c - x) / w;
  return [x, w + (h - 1 - y), w + h + (w - 1 - x), 2 * w + h + y];
}

/**
 * Updates `exposure` after the `removed` cells left `cells`: only stations whose front was removed are re-advanced
 * (at most 4 per removed cell). Returns the cells that became exposed.
 */
export function updateExposure(engine: Engine, cells: Cells, exposure: Exposure, removed: readonly number[]): number[] {
  const added: number[] = [];
  for (const r of removed) {
    for (const i of stationsOfCell(engine, r)) {
      if (exposure.front[i] !== r) continue;
      exposure.seenBy[r] = (exposure.seenBy[r] as number) - 1;
      const f = frontOf(engine, cells, i);
      exposure.front[i] = f;
      if (f >= 0) {
        if (exposure.seenBy[f] === 0) added.push(f);
        exposure.seenBy[f] = (exposure.seenBy[f] as number) + 1;
      }
    }
  }
  return added;
}
