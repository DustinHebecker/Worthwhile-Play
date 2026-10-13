import { isLibraryId, isRecord, libraryDataSize, LIBRARY_LIMITS, normalizeLibraryName } from '@wp/game-core';
import type { LibraryRow, LibraryStore } from './library';

/**
 * Export and import of the player's own content (ADR 0012, "Export and import"): one JSON file with the items of
 * every game, made and read on the device only. Imported files are untrusted: every item is checked like a game's
 * `put`, items of games the app does not know are skipped, and games still validate `data` when they read it.
 */

export const LIBRARY_EXPORT_FORMAT = 'worthwhile-play/library';
export const LIBRARY_EXPORT_VERSION = 1;
/** Files above this size are refused before they are read (50 items × 64 KiB per game leaves room for many games). */
export const LIBRARY_IMPORT_MAX_BYTES = 8 * 1024 * 1024;

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

/** A stored or imported row as a checked item, or undefined (bad envelope, name, id or data, or data too large). */
function toItem(row: unknown, gameId?: string): LibraryExportItem | undefined {
  if (!isRecord(row) || typeof row.gameId !== 'string' || (gameId !== undefined && row.gameId !== gameId)) return undefined;
  if (!isLibraryId(row.gameId) || !isLibraryId(row.id) || !('data' in row)) return undefined;
  const name = normalizeLibraryName(row.name);
  const size = libraryDataSize(row.data);
  if (name === undefined || size === undefined || size > LIBRARY_LIMITS.maxBytes) return undefined;
  const time = typeof row.updatedAt === 'string' ? Date.parse(row.updatedAt) : Number.NaN;
  if (!Number.isFinite(time)) return undefined;
  return { gameId: row.gameId, id: row.id, name, updatedAt: new Date(time).toISOString(), data: row.data };
}

/** Every readable item of every game (or of `gameIds`), sorted by game and id so equal libraries give equal files. */
export async function exportLibrary(store: LibraryStore, now: Date = new Date(), gameIds?: readonly string[]): Promise<LibraryExport> {
  const games = gameIds ?? [...(await store.counts()).keys()];
  const items: LibraryExportItem[] = [];
  for (const gameId of [...games].sort()) {
    for (const row of await store.list(gameId)) {
      const item = toItem(row, gameId);
      if (item) items.push(item);
    }
  }
  items.sort((a, b) => (a.gameId === b.gameId ? (a.id < b.id ? -1 : a.id > b.id ? 1 : 0) : a.gameId < b.gameId ? -1 : 1));
  return { format: LIBRARY_EXPORT_FORMAT, version: LIBRARY_EXPORT_VERSION, exportedAt: now.toISOString(), items };
}

/** The export as file text (pretty-printed, so it stays readable and diffable). */
export const libraryExportToJson = (file: LibraryExport): string => `${JSON.stringify(file, null, 2)}\n`;

/** Why a file cannot be imported at all: not JSON, not a library export, or from a newer app version. */
export type LibraryImportProblem = 'not-json' | 'wrong-format' | 'newer-version';

export type ParsedLibraryImport =
  | { readonly ok: true; readonly rows: LibraryRow[]; readonly skipped: number }
  | { readonly ok: false; readonly problem: LibraryImportProblem };

/**
 * Reads an export file. `rows` are the importable items; `skipped` counts items that were unreadable, belonged to a
 * game `isKnownGame` rejects, or repeated an earlier item's game and id. Never throws.
 */
export function parseLibraryExport(text: string, isKnownGame: (gameId: string) => boolean): ParsedLibraryImport {
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
  let skipped = 0;
  for (const raw of file.items as unknown[]) {
    const item = toItem(raw);
    const key = item ? JSON.stringify([item.gameId, item.id]) : '';
    if (!item || !isKnownGame(item.gameId) || seen.has(key)) {
      skipped++;
      continue;
    }
    seen.add(key);
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
  // Games found full: their further new items are counted without asking the store again (a file may hold many).
  const fullGames = new Set<string>();
  for (const row of rows) {
    const existing = await store.get(row.gameId, row.id);
    if (isRecord(existing) && existing.name === row.name && JSON.stringify(existing.data) === JSON.stringify(row.data)) {
      result.unchanged++;
      continue;
    }
    if (existing === undefined && fullGames.has(row.gameId)) {
      result.full++;
      continue;
    }
    const outcome = await store.put(row, LIBRARY_LIMITS.maxItems, options.replace ? undefined : { ifAbsent: true });
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
