import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { GameLibraryError, isGameLibraryError, isJsonData, isLibraryId, libraryDataSize, LIBRARY_LIMITS, normalizeLibraryName, utf8Length } from '../src';

/** Structural equality as JSON sees it, except that it compares every own key (also symbols, non-enumerable) and treats -0 as 0. */
function sameAsJson(a: unknown, b: unknown): boolean {
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Reflect.ownKeys(a);
  const keysB = Reflect.ownKeys(b);
  return keysA.length === keysB.length && keysA.every((key) => keysB.includes(key) && sameAsJson((a as Record<PropertyKey, unknown>)[key], (b as Record<PropertyKey, unknown>)[key]));
}

describe('library helpers (ADR 0012)', () => {
  it('accepts exactly the values that survive a JSON round trip', () => {
    fc.assert(
      fc.property(fc.jsonValue(), (value) => {
        expect(isJsonData(value)).toBe(true);
        expect(sameAsJson(JSON.parse(JSON.stringify(value)), value)).toBe(true);
      }),
      { numRuns: 300 }
    );
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => isJsonData(value)).not.toThrow();
        // Whatever is accepted can be stored as JSON and reads back equal.
        if (isJsonData(value)) expect(sameAsJson(JSON.parse(JSON.stringify(value)), value)).toBe(true);
      }),
      { numRuns: 500 }
    );
  });

  it('refuses functions, non-finite numbers, undefined, cycles, holes, class instances and getters', () => {
    const cyclic: unknown[] = [];
    cyclic.push(cyclic);
    const extra = Object.assign([1], { name: 'x' });
    const sparse = [1, 2, 3];
    delete sparse[1];
    const getter = Object.defineProperty({}, 'x', { get: () => 1, enumerable: true });
    let deep: unknown = 1;
    for (let i = 0; i < 70; i++) deep = [deep];
    for (const bad of [undefined, () => 1, Number.NaN, -Infinity, 1n, Symbol('s'), { a: undefined }, [undefined], cyclic, sparse, extra, new Date(0), new Map(), /x/, getter, { [Symbol('k')]: 1 }, deep]) {
      expect(isJsonData(bad), String(bad)).toBe(false);
    }
    const shared = { a: 1 };
    expect(isJsonData({ left: shared, right: shared })).toBe(true);
    expect(isJsonData(Object.assign(Object.create(null) as object, { a: [1, 'b', null, true] }))).toBe(true);
    expect(isJsonData(new Proxy({}, { ownKeys: () => { throw new Error('trap'); } }))).toBe(false);
  });

  it('measures UTF-8 bytes like TextEncoder', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'binary' }), (text) => {
        expect(utf8Length(text)).toBe(new TextEncoder().encode(text).length);
      }),
      { numRuns: 300 }
    );
    expect(utf8Length('\ud800')).toBe(3); // lone surrogate → U+FFFD
    expect(libraryDataSize({ a: 'ä' })).toBe(10);
    expect(libraryDataSize(() => 1)).toBeUndefined();
  });

  it('normalizes names and checks ids', () => {
    expect(normalizeLibraryName('  Ridge ')).toBe('Ridge');
    expect(normalizeLibraryName('x'.repeat(LIBRARY_LIMITS.maxNameLength))).toHaveLength(60);
    for (const bad of ['', '  ', 'x'.repeat(61), 'a\tb', 'a\u0000', 3, null]) expect(normalizeLibraryName(bad)).toBeUndefined();
    expect(isLibraryId('slot-1')).toBe(true);
    expect(isLibraryId('0b6c1a52-3e1e-4b3a-9f43-2f1c3c0e6a11')).toBe(true);
    for (const bad of ['', 'a b', 'ä', 'x'.repeat(65), 1, undefined]) expect(isLibraryId(bad)).toBe(false);
  });

  it('identifies library errors by reason', () => {
    const error = new GameLibraryError('full');
    expect(error.reason).toBe('full');
    expect(error.message).toBe('full');
    expect(isGameLibraryError(error)).toBe(true);
    expect(isGameLibraryError({ name: 'GameLibraryError', reason: 'too-large' })).toBe(true);
    for (const reason of ['full', 'too-large', 'invalid', 'unavailable', 'exists'] as const) {
      expect(isGameLibraryError({ name: 'GameLibraryError', reason })).toBe(true);
      expect(new GameLibraryError(reason, 'x').reason).toBe(reason);
    }
    for (const other of [new Error('full'), { name: 'GameLibraryError', reason: 'nope' }, null, 'full']) expect(isGameLibraryError(other)).toBe(false);
  });
});
