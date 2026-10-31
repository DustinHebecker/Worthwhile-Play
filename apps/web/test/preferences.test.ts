import { describe, expect, it } from 'vitest';
import { clearPreferences, createPreferences, type KeyValueStorage } from '../src/lib/preferences';

function memoryStorage(): KeyValueStorage & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    get length() {
      return map.size;
    },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k)
  };
}

describe('game preferences', () => {
  it('stores JSON values per game and key', () => {
    const storage = memoryStorage();
    const a = createPreferences(storage, 'node-conquest');
    const b = createPreferences(storage, 'chess');
    a.set('opponents', 3);
    b.set('opponents', { n: 1 });
    expect(a.get('opponents')).toBe(3);
    expect(b.get('opponents')).toEqual({ n: 1 });
    expect(a.get('missing')).toBeUndefined();
    expect(storage.map.get('wp:pref:node-conquest:opponents')).toBe('3');
    a.set('opponents', undefined);
    expect(a.get('opponents')).toBeUndefined();
    expect(storage.map.has('wp:pref:node-conquest:opponents')).toBe(false);
  });

  it('ignores oversized values, unreadable entries and failing or missing storage', () => {
    const storage = memoryStorage();
    const p = createPreferences(storage, 'g');
    p.set('big', 'x'.repeat(5000));
    expect(p.get('big')).toBeUndefined();
    storage.map.set('wp:pref:g:broken', '{not json');
    expect(p.get('broken')).toBeUndefined();
    const throwing: KeyValueStorage = {
      length: 1,
      key: () => {
        throw new Error('blocked');
      },
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      }
    };
    const q = createPreferences(throwing, 'g');
    expect(() => q.set('a', 1)).not.toThrow();
    expect(q.get('a')).toBeUndefined();
    expect(clearPreferences(throwing)).toBe(0);
    const none = createPreferences(undefined, 'g');
    none.set('a', 1);
    expect(none.get('a')).toBeUndefined();
    expect(clearPreferences(undefined)).toBe(0);
  });

  it('clears only game preferences', () => {
    const storage = memoryStorage();
    storage.setItem('wp:ui-locale', 'de');
    createPreferences(storage, 'a').set('x', 1);
    createPreferences(storage, 'b').set('y', true);
    expect(clearPreferences(storage)).toBe(2);
    expect([...storage.map.keys()]).toEqual(['wp:ui-locale']);
  });
});
