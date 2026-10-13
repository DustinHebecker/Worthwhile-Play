/**
 * Shared, pure parts of `GameContext.library` (ADR 0012): bounds, the error type and the JSON checks the host
 * applies to every `put`. Games may use them to check data before saving (e.g. to show "too large" early).
 */

/** Bounds of `GameContext.library`, per game. */
export const LIBRARY_LIMITS = {
  /** Items per game. */
  maxItems: 50,
  /** UTF-8 bytes of `JSON.stringify(data)` per item. */
  maxBytes: 64 * 1024,
  /** Characters (code points) of a name, after trimming. */
  maxNameLength: 60
} as const;

/** Item ids: host-made UUIDs or ids a game chooses itself (e.g. `slot-1`). */
export const LIBRARY_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Why a library call was refused: `full` (already `maxItems` items), `too-large` (data over `maxBytes`),
 * `invalid` (empty or too long name, malformed id, data that is not plain JSON), `unavailable` (storage failed).
 */
export type LibraryErrorReason = 'full' | 'too-large' | 'invalid' | 'unavailable';
const REASONS: readonly string[] = ['full', 'too-large', 'invalid', 'unavailable'];

/** Rejection value of every `GameLibrary` method. Check `reason`, not the message (which is not translated). */
export class GameLibraryError extends Error {
  readonly reason: LibraryErrorReason;
  constructor(reason: LibraryErrorReason, message: string = reason) {
    super(message);
    this.name = 'GameLibraryError';
    this.reason = reason;
  }
}

/** True for a `GameLibraryError` (checks the shape too, so it also works across bundles). */
export function isGameLibraryError(value: unknown): value is GameLibraryError {
  if (value instanceof GameLibraryError) return true;
  if (typeof value !== 'object' || value === null) return false;
  const { name, reason } = value as { name?: unknown; reason?: unknown };
  return name === 'GameLibraryError' && typeof reason === 'string' && REASONS.includes(reason);
}

/** Deeper nesting is refused (guards the recursive checks; real game data is far flatter). */
const MAX_DEPTH = 64;
/** More values are refused (guards against shared references that would expand enormously in JSON). */
const MAX_VALUES = 1_000_000;

/**
 * True if `value` is plain JSON data that survives `JSON.stringify` → `JSON.parse` unchanged: null, booleans,
 * finite numbers, strings, dense arrays and plain objects (prototype `Object.prototype` or null) of such values,
 * without cycles, at most 64 levels deep. Never throws (getters are not invoked: accessor properties are refused).
 */
export function isJsonData(value: unknown): boolean {
  const path = new Set<object>();
  let values = 0;
  const visit = (v: unknown, depth: number): boolean => {
    if (++values > MAX_VALUES) return false;
    if (v === null || typeof v === 'boolean' || typeof v === 'string') return true;
    if (typeof v === 'number') return Number.isFinite(v);
    if (typeof v !== 'object' || depth >= MAX_DEPTH || path.has(v)) return false;
    path.add(v);
    let ok: boolean;
    try {
      ok = Array.isArray(v) ? visitArray(v, depth) : visitObject(v, depth);
    } catch {
      // Proxies and exotic objects can throw from reflection traps.
      ok = false;
    }
    path.delete(v);
    return ok;
  };
  const visitArray = (array: unknown[], depth: number): boolean => {
    // No extra (non-index) properties: JSON would drop them.
    if (Object.getPrototypeOf(array) !== Array.prototype || Reflect.ownKeys(array).length !== array.length + 1) return false;
    for (let i = 0; i < array.length; i++) {
      const own = Object.getOwnPropertyDescriptor(array, i);
      if (!own || !('value' in own) || !visit(own.value, depth + 1)) return false;
    }
    return true;
  };
  const visitObject = (object: object, depth: number): boolean => {
    const proto = Object.getPrototypeOf(object) as unknown;
    if (proto !== Object.prototype && proto !== null) return false;
    if (Object.getOwnPropertySymbols(object).length > 0) return false;
    for (const key of Object.getOwnPropertyNames(object)) {
      const own = Object.getOwnPropertyDescriptor(object, key);
      if (!own || !('value' in own) || !own.enumerable || !visit(own.value, depth + 1)) return false;
    }
    return true;
  };
  return visit(value, 0);
}

/** UTF-8 length of a string (counts code points like `TextEncoder`, without needing it). */
export function utf8Length(text: string): number {
  let bytes = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length && (text.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
      bytes += 4;
      i++;
    } else bytes += 3;
  }
  return bytes;
}

/** Stored size of library data: UTF-8 bytes of its JSON (`undefined` if it is not plain JSON data). */
export function libraryDataSize(data: unknown): number | undefined {
  return isJsonData(data) ? utf8Length(JSON.stringify(data)) : undefined;
}

/** The trimmed name if it is acceptable (1 … `maxNameLength` code points, no control characters), else undefined. */
export function normalizeLibraryName(name: unknown): string | undefined {
  if (typeof name !== 'string') return undefined;
  const trimmed = name.trim();
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) return undefined;
  const length = [...trimmed].length;
  return length >= 1 && length <= LIBRARY_LIMITS.maxNameLength ? trimmed : undefined;
}

export const isLibraryId = (id: unknown): id is string => typeof id === 'string' && LIBRARY_ID_PATTERN.test(id);
