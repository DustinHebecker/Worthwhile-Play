import { isLibraryId, isRecord, libraryDataSize, LIBRARY_LIMITS, normalizeLibraryName } from '@wp/game-core';
import type { LibraryRow, LibraryStore } from './library';

/**
 * Export and import of the player's own content (ADR 0012, "Export and import"): one JSON file with the items of
 * every game, made and read on the device only. Imported files are untrusted: every item is checked like a game's
 * `put`, items of games the app does not know are skipped, and games still validate `data` when they read it.
 */

export const LIBRARY_EXPORT_FORMAT = 'worthwhile-play/library';
export const LIBRARY_EXPORT_VERSION = 1;
/**
 * Files above this size are refused before they are read. The export is compact JSON, so one game at its bounds
 * (50 items × 64 KiB) takes at most about 3.2 MiB: this leaves room for ten such games, far above real use (a Relay
 * Command map is about 1 KB).
 */
export const LIBRARY_IMPORT_MAX_BYTES = 32 * 1024 * 1024;

export interface LibraryExportItem {
  readonly gameId: string;
  readonly id: string;
  readonly name: string;
  readonly updatedAt: string;
  readonly data: unknown;
}

export interface LibraryExport {
  readonly format: typeof LIBRARY_EXPORT_FORMAT;
  readonly version: typeof LIBRARY_EXPORT_VERSION;
  readonly exportedAt: string;
  readonly items: LibraryExportItem[];
}

/** `YYYY-MM-DDTHH:MM…` (what `toISOString` writes); looser date strings are refused. */
const ISO_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/**
 * A stored or imported row as a checked item, or undefined (bad envelope, name, id or data, data too large, or a
 * time that is not ISO 8601). A time after `now` becomes `now`, so an item cannot stay first in a list for ever.
 */
function toItem(row: unknown, now: Date, gameId?: string): LibraryExportItem | undefined {
  if (!isRecord(row) || typeof row.gameId !== 'string' || (gameId !== undefined && row.gameId !== gameId)) return undefined;
  if (!isLibraryId(row.gameId) || !isLibraryId(row.id) || !('data' in row)) return undefined;
  const name = normalizeLibraryName(row.name);
  const size = libraryDataSize(row.data);
  if (name === undefined || size === undefined || size > LIBRARY_LIMITS.maxBytes) return undefined;
  const time = typeof row.updatedAt === 'string' && ISO_TIME.test(row.updatedAt) ? Date.parse(row.updatedAt) : Number.NaN;
  if (!Number.isFinite(time)) return undefined;
  return { gameId: row.gameId, id: row.id, name, updatedAt: new Date(Math.min(time, now.getTime())).toISOString(), data: row.data };
}

/** Every readable item of every game (or of `gameIds`), sorted by game and id so equal libraries give equal files. */
export async function exportLibrary(store: LibraryStore, now: Date = new Date(), gameIds?: readonly string[]): Promise<LibraryExport> {
  const games = gameIds ?? [...(await store.counts()).keys()];
  const items: LibraryExportItem[] = [];
  for (const gameId of [...games].sort()) {
    for (const row of await store.list(gameId)) {
      const item = toItem(row, now, gameId);
      if (item) items.push(item);
    }
  }
  items.sort((a, b) => (a.gameId === b.gameId ? (a.id < b.id ? -1 : a.id > b.id ? 1 : 0) : a.gameId < b.gameId ? -1 : 1));
  return { format: LIBRARY_EXPORT_FORMAT, version: LIBRARY_EXPORT_VERSION, exportedAt: now.toISOString(), items };
}

/**
 * The export as file text: compact JSON (so its size stays close to the stored sizes the bounds are measured on),
 * one item per line so it stays readable and diffable.
 */
export function libraryExportToJson(file: LibraryExport): string {
  const { items, ...envelope } = file;
  const head = JSON.stringify(envelope).slice(0, -1);
  if (items.length === 0) return `${head},"items":[]}\n`;
  return `${head},"items":[\n${items.map((item) => JSON.stringify(item)).join(',\n')}\n]}\n`;
}

/** Why a file cannot be imported at all: not JSON, not a library export, or from a newer app version. */
export type LibraryImportProblem = 'not-json' | 'wrong-format' | 'newer-version';

export type ParsedLibraryImport =
  | { readonly ok: true; readonly rows: LibraryRow[]; readonly skipped: number }
  | { readonly ok: false; readonly problem: LibraryImportProblem };

/**
 * Reads an export file. `rows` are the importable items; `skipped` counts items that were unreadable, belonged to a
 * game `isKnownGame` rejects, repeated an earlier item's game and id, or came after the first `maxItems` items of
 * their game (a real export never has more; this keeps crafted files with many tiny items cheap). Never throws.
 */
export function parseLibraryExport(text: string, isKnownGame: (gameId: string) => boolean, now: Date = new Date()): ParsedLibraryImport {
  let file: unknown;
  try {
    file = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, problem: 'not-json' };
  }
  if (!isRecord(file) || file.format !== LIBRARY_EXPORT_FORMAT || !Number.isSafeInteger(file.version) || (file.version as number) < 1 || !Array.isArray(file.items)) {
    return { ok: false, problem: 'wrong-format' };
  }
  if ((file.version as number) > LIBRARY_EXPORT_VERSION) return { ok: false, problem: 'newer-version' };
  const rows: LibraryRow[] = [];
  const seen = new Set<string>();
  const perGame = new Map<string, number>();
  let skipped = 0;
  for (const raw of file.items as unknown[]) {
    const item = toItem(raw, now);
    const key = item ? JSON.stringify([item.gameId, item.id]) : '';
    if (!item || !isKnownGame(item.gameId) || seen.has(key) || (perGame.get(item.gameId) ?? 0) >= LIBRARY_LIMITS.maxItems) {
      skipped++;
      continue;
    }
    seen.add(key);
    perGame.set(item.gameId, (perGame.get(item.gameId) ?? 0) + 1);
    const data = JSON.parse(JSON.stringify(item.data)) as unknown;
    rows.push({ ...item, data, size: libraryDataSize(data) as number });
  }
  return { ok: true, rows, skipped };
}

/** What an import did, item by item. */
export interface LibraryImportResult {
  /** New items. */
  added: number;
  /** Existing items overwritten (only with `replace`). */
  replaced: number;
  /** Items already stored with the same name and data. */
  unchanged: number;
  /** Existing items left as they were because the file had a different item with the same game and id. */
  kept: number;
  /** New items not added because their game already has the maximum number of items. */
  full: number;
}

/**
 * Writes parsed rows into the store. Without `replace`, an existing item (same game and id) is never changed;
 * with it, the file's item overwrites it. Rows are written one by one (each atomic, like a game's `put`), so a
 * storage failure rejects after the earlier rows were kept.
 */
export async function importLibrary(store: LibraryStore, rows: readonly LibraryRow[], options: { replace?: boolean } = {}): Promise<LibraryImportResult> {
  const result: LibraryImportResult = { added: 0, replaced: 0, unchanged: 0, kept: 0, full: 0 };
  // Each game's stored items are read once (name and data JSON by id); games found full skip further new items.
  const stored = new Map<string, Map<string, string | undefined>>();
  const fullGames = new Set<string>();
  const storedOf = async (gameId: string) => {
    let byId = stored.get(gameId);
    if (!byId) {
      byId = new Map();
      for (const row of await store.list(gameId)) {
        if (!isRecord(row) || typeof row.id !== 'string') continue;
        byId.set(row.id, fingerprint(row.name, row.data));
      }
      stored.set(gameId, byId);
    }
    return byId;
  };
  for (const row of rows) {
    const byId = await storedOf(row.gameId);
    const exists = byId.has(row.id);
    const print = fingerprint(row.name, row.data);
    if (exists && print !== undefined && byId.get(row.id) === print) {
      result.unchanged++;
      continue;
    }
    if (!exists && fullGames.has(row.gameId)) {
      result.full++;
      continue;
    }
    const outcome = await store.put(row, LIBRARY_LIMITS.maxItems, options.replace ? undefined : { ifAbsent: true });
    if (outcome === 'created' || outcome === 'replaced') byId.set(row.id, print);
    if (outcome === 'created') result.added++;
    else if (outcome === 'replaced') result.replaced++;
    else if (outcome === 'exists') result.kept++;
    else {
      result.full++;
      fullGames.add(row.gameId);
    }
  }
  return result;
}

/** Name and data as one comparable string, or undefined when stored data cannot be serialized (corrupt rows). */
function fingerprint(name: unknown, data: unknown): string | undefined {
  try {
    return JSON.stringify([name, data]);
  } catch {
    return undefined;
  }
}
