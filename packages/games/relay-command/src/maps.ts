import { isRecord } from '@wp/game-core';
import { cellOf, findPath, STRATEGY_RULESET as RULESET, type Scenario } from '@wp/strategy-engine';
import { DEPOSIT_SUPPLY, type ScenarioSpec } from './scenarios';

/**
 * Player-made maps (map editor, owner request after PR #14). A map is plain JSON: size, terrain
 * row by row, deposits and the starting units of both sides. Maps are kept per device in the
 * game's preferences (one share code per slot, so they survive "New game"); a game played on one
 * carries its scenario in the save, so deleting the map never breaks a running game.
 */
export interface EditMap {
  readonly name: string;
  readonly w: number;
  readonly h: number;
  /** One terrain code per cell, row by row (see TERRAIN_CODES). */
  readonly terrain: string;
  readonly deposits: readonly { readonly x: number; readonly y: number }[];
  readonly units: readonly MapUnit[];
}

export interface MapUnit {
  readonly side: number;
  readonly kind: string;
  readonly x: number;
  readonly y: number;
}

/** Terrain codes in palette order: plain, road, forest, hill, urban, swamp, water, ridge. */
export const TERRAIN_CODES = ['.', '=', 'f', 'h', 'u', 's', '~', '^'] as const;
/** What can be placed: the Command Post, structures, then units (palette order). */
export const MAP_KINDS = ['command-post', 'muster', 'motor-pool', 'extractor', 'relay-mast', 'rifles', 'lancer', 'outrider', 'warden', 'howitzer', 'mast-truck', 'field-post', 'jammer', 'tracer'] as const;
export const MAP_WIDTHS = [10, 12, 14, 16, 18, 20, 22, 24] as const;
export const MAP_HEIGHTS = [8, 10, 12, 14, 16] as const;
/** Bounds that keep a map playable on a phone and every save small. */
export const MAX_UNITS_PER_SIDE = 24;
export const MAX_DEPOSITS = 12;
export const MAX_NAME = 40;
/** Maps a device keeps (one preference value each). */
export const MAP_SLOTS = 8;

/** A blank map: open ground, nothing on it. */
export const blankMap = (w: number, h: number, name = ''): EditMap => ({ name, w, h, terrain: '.'.repeat(w * h), deposits: [], units: [] });

/** The editable form of a built-in scenario (to start from). */
export function fromScenario(spec: ScenarioSpec, name = ''): EditMap {
  const { map, entities } = spec.scenario;
  return {
    name,
    w: map.w,
    h: map.h,
    terrain: map.terrain,
    deposits: (map.deposits ?? []).map((d) => ({ x: d.x, y: d.y })),
    units: entities.map((e) => ({ side: e.side, kind: e.kind, x: e.x, y: e.y }))
  };
}

/** The engine scenario of a map (every deposit full). */
export function toScenario(map: EditMap): Scenario {
  return {
    map: { w: map.w, h: map.h, terrain: map.terrain, deposits: map.deposits.map((d) => ({ x: d.x, y: d.y, left: DEPOSIT_SUPPLY })) },
    sides: 2,
    entities: map.units.map((u) => ({ side: u.side, kind: u.kind, x: u.x, y: u.y })),
    seed: 0
  };
}

/** The scenario spec a game on `map` runs on (id 'custom'; the turn limit is chosen in the setup). */
export const customSpec = (map: EditMap): ScenarioSpec => ({ id: 'custom', turnLimit: 12, scenario: toScenario(map) });

/** What an edit does at one cell. */
export type Tool = { readonly type: 'terrain'; readonly code: string } | { readonly type: 'deposit' } | { readonly type: 'unit'; readonly kind: string; readonly side: number } | { readonly type: 'erase' };

const inside = (map: EditMap, x: number, y: number) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < map.w && y < map.h;
const blocks = (code: string) => code === '~' || code === '^';

/** The map after applying `tool` at (x, y) (and at the point-mirrored cell, side swapped, when `mirror`). Never throws. */
export function applyTool(map: EditMap, tool: Tool, x: number, y: number, mirror: boolean): EditMap {
  if (!inside(map, x, y)) return map;
  let next = applyAt(map, tool, x, y);
  const mx = map.w - 1 - x;
  const my = map.h - 1 - y;
  if (mirror && (mx !== x || my !== y)) next = applyAt(next, tool.type === 'unit' ? { ...tool, side: 1 - tool.side } : tool, mx, my);
  return next;
}

function applyAt(map: EditMap, tool: Tool, x: number, y: number): EditMap {
  const cell = y * map.w + x;
  const without = <T extends { x: number; y: number }>(list: readonly T[]) => list.filter((e) => e.x !== x || e.y !== y);
  switch (tool.type) {
    case 'terrain': {
      if (!(TERRAIN_CODES as readonly string[]).includes(tool.code)) return map;
      const terrain = map.terrain.slice(0, cell) + tool.code + map.terrain.slice(cell + 1);
      // Water and ridges take nothing: what stood there goes.
      return blocks(tool.code) ? { ...map, terrain, units: without(map.units), deposits: without(map.deposits) } : { ...map, terrain };
    }
    case 'deposit': {
      if (blocks(map.terrain[cell] ?? '.') || map.deposits.length >= MAX_DEPOSITS) return map;
      if (map.deposits.some((d) => d.x === x && d.y === y)) return map;
      // A deposit takes only an Extractor.
      return { ...map, deposits: [...map.deposits, { x, y }], units: map.units.filter((u) => u.x !== x || u.y !== y || u.kind === 'extractor') };
    }
    case 'unit': {
      if (!(MAP_KINDS as readonly string[]).includes(tool.kind) || (tool.side !== 0 && tool.side !== 1) || blocks(map.terrain[cell] ?? '.')) return map;
      const onDeposit = map.deposits.some((d) => d.x === x && d.y === y);
      if (onDeposit !== (tool.kind === 'extractor')) return map;
      const units = without(map.units);
      // One Command Post per side: placing one moves it.
      const others = tool.kind === 'command-post' ? units.filter((u) => !(u.kind === 'command-post' && u.side === tool.side)) : units;
      if (others.filter((u) => u.side === tool.side).length >= MAX_UNITS_PER_SIDE) return map;
      return { ...map, units: sortUnits([...others, { side: tool.side, kind: tool.kind, x, y }]) };
    }
    case 'erase':
      return { ...map, units: without(map.units), deposits: map.units.some((u) => u.x === x && u.y === y) ? map.deposits : without(map.deposits) };
  }
}

/** Units in a stable order (side, then cell): the same map always gives the same ids. */
const sortUnits = (units: readonly MapUnit[]): MapUnit[] => [...units].sort((a, b) => a.side - b.side || a.y - b.y || a.x - b.x);

/** The same map at a new size: what lies outside is cut off, new cells are open ground. */
export function resize(map: EditMap, w: number, h: number): EditMap {
  let terrain = '';
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) terrain += x < map.w && y < map.h ? (map.terrain[y * map.w + x] ?? '.') : '.';
  const fits = (p: { x: number; y: number }) => p.x < w && p.y < h;
  return { ...map, w, h, terrain, units: map.units.filter(fits), deposits: map.deposits.filter(fits) };
}

/** Why a map cannot be played (message keys with arguments); empty when it can. */
export type MapIssue = { readonly key: 'map.posts' | 'map.path' | 'map.units'; readonly side?: number };

export function mapIssues(map: EditMap): MapIssue[] {
  const issues: MapIssue[] = [];
  const posts = [0, 1].map((side) => map.units.filter((u) => u.side === side && u.kind === 'command-post'));
  for (const side of [0, 1]) if (posts[side]!.length !== 1) issues.push({ key: 'map.posts', side });
  for (const side of [0, 1]) if (map.units.filter((u) => u.side === side && u.kind !== 'command-post').length === 0) issues.push({ key: 'map.units', side });
  const a = posts[0]![0];
  const b = posts[1]![0];
  if (a && b && posts[0]!.length === 1 && posts[1]!.length === 1) {
    // The posts must be connected over ground (units do not count: they move).
    const scenario = toScenario(map);
    const path = findPath(scenario.map, RULESET, cellOf(scenario.map, a.x, a.y), cellOf(scenario.map, b.x, b.y), { layer: 'ground', side: 0 });
    if (!path) issues.push({ key: 'map.path' });
  }
  return issues;
}

/** Whether the map is point-symmetric (terrain, deposits, units with sides swapped): told, not required. */
export function isFair(map: EditMap): boolean {
  const n = map.w * map.h;
  for (let c = 0; c < n; c++) if (map.terrain[c] !== map.terrain[n - 1 - c]) return false;
  const mirror = (p: { x: number; y: number }) => ({ x: map.w - 1 - p.x, y: map.h - 1 - p.y });
  if (!map.deposits.every((d) => map.deposits.some((o) => o.x === mirror(d).x && o.y === mirror(d).y))) return false;
  return map.units.every((u) => map.units.some((o) => o.kind === u.kind && o.side === 1 - u.side && o.x === mirror(u).x && o.y === mirror(u).y));
}

/** Whether `value` is a well-formed map (bounds, codes, kinds, cells). Never throws. */
export function isValidMap(value: unknown): value is EditMap {
  if (!isRecord(value)) return false;
  const { name, w, h, terrain, deposits, units } = value;
  if (typeof name !== 'string' || name.length > MAX_NAME) return false;
  if (!(MAP_WIDTHS as readonly unknown[]).includes(w) || !(MAP_HEIGHTS as readonly unknown[]).includes(h)) return false;
  const width = w as number;
  const height = h as number;
  if (typeof terrain !== 'string' || terrain.length !== width * height || [...terrain].some((c) => !(TERRAIN_CODES as readonly string[]).includes(c))) return false;
  if (!Array.isArray(deposits) || deposits.length > MAX_DEPOSITS || !Array.isArray(units) || units.length > 2 * MAX_UNITS_PER_SIDE) return false;
  const cellOk = (p: unknown): p is { x: number; y: number } => isRecord(p) && Number.isInteger(p.x) && Number.isInteger(p.y) && (p.x as number) >= 0 && (p.y as number) >= 0 && (p.x as number) < width && (p.y as number) < height && !blocks(terrain[(p.y as number) * width + (p.x as number)] ?? '.');
  if (!deposits.every(cellOk) || new Set(deposits.map((d) => `${d.x},${d.y}`)).size !== deposits.length) return false;
  const unitOk = (u: unknown): boolean => isRecord(u) && (u.side === 0 || u.side === 1) && (MAP_KINDS as readonly unknown[]).includes(u.kind) && cellOk(u);
  if (!units.every(unitOk)) return false;
  const typed = units as MapUnit[];
  if (new Set(typed.map((u) => `${u.x},${u.y}`)).size !== typed.length) return false;
  if ([0, 1].some((side) => typed.filter((u) => u.side === side).length > MAX_UNITS_PER_SIDE)) return false;
  // Extractors stand on deposits, and nothing else does.
  return typed.every((u) => deposits.some((d) => d.x === u.x && d.y === u.y) === (u.kind === 'extractor'));
}

// --- Share codes -----------------------------------------------------------------------------

const PREFIX = 'RC1.';

/** A short text that carries the whole map (copy, paste, keep). */
export function encodeMap(map: EditMap): string {
  const json = JSON.stringify([map.name, map.w, map.h, map.terrain, map.deposits.map((d) => [d.x, d.y]), map.units.map((u) => [u.side, MAP_KINDS.indexOf(u.kind as (typeof MAP_KINDS)[number]), u.x, u.y])]);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return PREFIX + btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** The map in a share code, or `undefined` for anything that is not a valid one. Never throws. */
export function decodeMap(code: unknown): EditMap | undefined {
  if (typeof code !== 'string' || !code.startsWith(PREFIX) || code.length > 4000) return undefined;
  try {
    const b64 = code.slice(PREFIX.length).replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    const json = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
    const data = JSON.parse(json) as unknown;
    if (!Array.isArray(data) || data.length !== 6) return undefined;
    const [name, w, h, terrain, deposits, units] = data as unknown[];
    if (!Array.isArray(deposits) || !Array.isArray(units)) return undefined;
    const map = {
      name,
      w,
      h,
      terrain,
      deposits: deposits.map((d: unknown) => (Array.isArray(d) ? { x: d[0], y: d[1] } : null)),
      units: units.map((u: unknown) => (Array.isArray(u) ? { side: u[0], kind: MAP_KINDS[u[1] as number] ?? '', x: u[2], y: u[3] } : null))
    };
    return isValidMap(map) ? { ...map, units: sortUnits(map.units) } : undefined;
  } catch {
    return undefined;
  }
}

// --- Library (per device) ----------------------------------------------------------------------

/** Where a device keeps its maps: the game's preferences (one share code per slot), or memory. */
export interface MapStore {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
}

/** The maps in the library, slot by slot (`undefined` = free or unreadable). Never throws. */
export function loadLibrary(store: MapStore | undefined): (EditMap | undefined)[] {
  return Array.from({ length: MAP_SLOTS }, (_, slot) => {
    try {
      return decodeMap(store?.get(`map:${slot}`));
    } catch {
      return undefined;
    }
  });
}

/** Saves `map` into `slot` (or the first free slot when `slot` is null); the slot used, or null when all are taken or the store did not keep it. */
export function saveToLibrary(store: MapStore | undefined, map: EditMap, slot: number | null): number | null {
  const library = loadLibrary(store);
  const target = slot !== null && slot >= 0 && slot < MAP_SLOTS ? slot : library.findIndex((m) => m === undefined);
  if (target < 0) return null;
  const code = encodeMap(map);
  try {
    store?.set(`map:${target}`, code);
    // A store may drop a value silently (size limit, private window, quota): read it back.
    if (!store || store.get(`map:${target}`) !== code) return null;
  } catch {
    return null;
  }
  return target;
}

export function removeFromLibrary(store: MapStore | undefined, slot: number): void {
  try {
    store?.set(`map:${slot}`, undefined);
  } catch {
    /* not removed */
  }
}

/** A store in memory (tests, and hosts without preferences: maps then last for the session). */
export function memoryStore(): MapStore {
  const values = new Map<string, unknown>();
  return { get: (key) => values.get(key), set: (key, value) => (value === undefined ? values.delete(key) : values.set(key, value)) };
}

// --- Map library (asynchronous): the host's per-game library (ADR 0012), else preferences ----------

/** Why a map was not saved (the host library's reasons; `full` also when every place is taken). */
export type SaveFailure = 'full' | 'too-large' | 'invalid' | 'unavailable';
export type SaveResult = { readonly ok: true; readonly slot: number } | { readonly ok: false; readonly reason: SaveFailure };

/** The device's maps by place (0…MAP_SLOTS-1), whatever keeps them. */
export interface MapLibrary {
  list(): Promise<(EditMap | undefined)[]>;
  save(map: EditMap, slot: number | null): Promise<SaveResult>;
  remove(slot: number): Promise<void>;
}

/** The host library as consumed here (structurally `GameContext.library`). */
export interface HostLibrary {
  list(): Promise<readonly { readonly id: string }[]>;
  get(id: string): Promise<{ readonly data: unknown } | undefined>;
  put(item: { id?: string; name: string; data: unknown }): Promise<unknown>;
  delete(id: string): Promise<void>;
}

const FAILURES: readonly SaveFailure[] = ['full', 'too-large', 'invalid', 'unavailable'];
const reasonOf = (error: unknown): SaveFailure => {
  const reason = typeof error === 'object' && error !== null ? (error as { reason?: unknown }).reason : undefined;
  return FAILURES.includes(reason as SaveFailure) ? (reason as SaveFailure) : 'unavailable';
};
const slotId = (slot: number) => `slot-${slot}`;

/** Maps in the host's library: one item per place (`slot-<n>`), the map itself as data (validated when read). */
export function hostMapLibrary(host: HostLibrary, nameOf: (map: EditMap) => string): MapLibrary {
  const list = async (): Promise<(EditMap | undefined)[]> => {
    let ids: Set<string>;
    try {
      ids = new Set((await host.list()).map((e) => e.id));
    } catch {
      return Array.from({ length: MAP_SLOTS }, () => undefined);
    }
    return Promise.all(
      Array.from({ length: MAP_SLOTS }, async (_, slot) => {
        if (!ids.has(slotId(slot))) return undefined;
        try {
          const item = await host.get(slotId(slot));
          return isValidMap(item?.data) ? (item.data as EditMap) : undefined;
        } catch {
          return undefined;
        }
      })
    );
  };
  return {
    list,
    async save(map, slot) {
      const target = slot !== null && slot >= 0 && slot < MAP_SLOTS ? slot : (await list()).findIndex((m) => m === undefined);
      if (target < 0) return { ok: false, reason: 'full' };
      try {
        await host.put({ id: slotId(target), name: nameOf(map).slice(0, 60) || 'Map', data: JSON.parse(JSON.stringify(map)) as unknown });
        return { ok: true, slot: target };
      } catch (error) {
        return { ok: false, reason: reasonOf(error) };
      }
    },
    async remove(slot) {
      try {
        await host.delete(slotId(slot));
      } catch {
        /* not removed: the list still shows it */
      }
    }
  };
}

/** Maps in the game's preferences (hosts without a library): the synchronous slots above. */
export function preferenceMapLibrary(store: MapStore | undefined): MapLibrary {
  return {
    list: () => Promise.resolve(loadLibrary(store)),
    save: (map, slot) => {
      const full = slot === null && loadLibrary(store).every((m) => m !== undefined);
      const saved = saveToLibrary(store, map, slot);
      return Promise.resolve(saved === null ? { ok: false, reason: full ? 'full' : 'unavailable' } : { ok: true, slot: saved });
    },
    remove: (slot) => {
      removeFromLibrary(store, slot);
      return Promise.resolve();
    }
  };
}

/**
 * Moves maps kept in preferences (before the host library existed) into the library, each into a
 * free place; the preference values are cleared only after every move succeeded, so a failure
 * loses nothing (the next start tries again). Resolves to the number of maps moved.
 */
export async function migratePreferenceMaps(store: MapStore | undefined, library: MapLibrary): Promise<number> {
  const old = loadLibrary(store);
  const waiting = old.map((m, slot) => ({ m, slot })).filter((e): e is { m: EditMap; slot: number } => e.m !== undefined);
  if (waiting.length === 0) return 0;
  // A map already moved by an earlier, interrupted attempt is not moved twice.
  const there = new Set((await library.list()).filter((m): m is EditMap => m !== undefined).map(encodeMap));
  for (const { m } of waiting) {
    if (there.has(encodeMap(m))) continue;
    const result = await library.save(m, null);
    if (!result.ok) return 0;
    there.add(encodeMap(m));
  }
  for (const { slot } of waiting) removeFromLibrary(store, slot);
  return waiting.length;
}
