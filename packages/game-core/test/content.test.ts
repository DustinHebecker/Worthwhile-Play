import { describe, expect, it, vi } from 'vitest';
import { createLocaleContent } from '../src/content';

type Loader = () => Promise<string>;

/** Loaders that resolve to `content:<locale>` and count their calls; locales in `failing` reject. */
function loaders(locales: readonly string[], failing: Set<string> = new Set()) {
  const calls: Record<string, number> = {};
  const table: Record<string, Loader> = {};
  for (const locale of locales) {
    table[locale] = () => {
      calls[locale] = (calls[locale] ?? 0) + 1;
      return failing.has(locale) ? Promise.reject(new Error(`offline: ${locale}`)) : Promise.resolve(`content:${locale}`);
    };
  }
  return { table, calls };
}

describe('createLocaleContent', () => {
  it('loads only the requested locale and the English fallback', async () => {
    const { table, calls } = loaders(['en', 'de', 'ja']);
    const store = createLocaleContent(table);
    await store.preload('de');
    expect(calls).toEqual({ en: 1, de: 1 });
    expect(store.get('de')).toBe('content:de');
    expect(store.isLoaded('de')).toBe(true);
    expect(store.isLoaded('en')).toBe(true);
    expect(store.isLoaded('ja')).toBe(false);
    // Not loaded (yet): the fallback.
    expect(store.get('ja')).toBe('content:en');
  });

  it('loads the fallback once when it is the requested locale', async () => {
    const { table, calls } = loaders(['en', 'de']);
    const store = createLocaleContent(table);
    await store.preload('en');
    expect(calls).toEqual({ en: 1 });
    expect(store.get('en')).toBe('content:en');
  });

  it('caches loaded locales and shares a pending load', async () => {
    const { table, calls } = loaders(['en', 'de']);
    const store = createLocaleContent(table);
    await Promise.all([store.preload('de'), store.preload('de')]);
    await store.preload('de');
    await store.preload('en');
    expect(calls).toEqual({ en: 1, de: 1 });
  });

  it('uses the fallback for a locale without a loader', async () => {
    const { table, calls } = loaders(['en', 'de']);
    const store = createLocaleContent(table);
    await store.preload('xx');
    expect(calls).toEqual({ en: 1 });
    expect(store.get('xx')).toBe('content:en');
    expect(store.isLoaded('xx')).toBe(false);
    // Inherited object keys are not loaders.
    await store.preload('toString');
    expect(store.get('toString')).toBe('content:en');
  });

  it('honours a custom fallback locale', async () => {
    const { table, calls } = loaders(['en', 'de']);
    const store = createLocaleContent(table, { fallback: 'de', onError: () => undefined });
    await store.preload('xx');
    expect(calls).toEqual({ de: 1 });
    expect(store.get('xx')).toBe('content:de');
  });

  it('falls back to English and reports when the requested locale fails, and retries it later', async () => {
    const failing = new Set(['de']);
    const { table, calls } = loaders(['en', 'de'], failing);
    const onError = vi.fn();
    const store = createLocaleContent(table, { onError });
    await store.preload('de');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(String(onError.mock.calls[0]?.[0])).toContain('offline: de');
    expect(store.get('de')).toBe('content:en');
    expect(store.isLoaded('de')).toBe(false);

    failing.delete('de');
    await store.preload('de');
    expect(calls).toEqual({ en: 1, de: 2 });
    expect(store.get('de')).toBe('content:de');
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('resolves with the requested locale and reports when only the fallback fails', async () => {
    const { table } = loaders(['en', 'de'], new Set(['en']));
    const onError = vi.fn();
    const store = createLocaleContent(table, { onError });
    await store.preload('de');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(store.get('de')).toBe('content:de');
    expect(() => store.get('ja')).toThrow(/not loaded/);
  });

  it('rejects when neither the locale nor the fallback can be loaded', async () => {
    const { table } = loaders(['en', 'de'], new Set(['en', 'de']));
    const onError = vi.fn();
    const store = createLocaleContent(table, { onError });
    await expect(store.preload('de')).rejects.toThrow('offline: de');
    await expect(store.preload('en')).rejects.toThrow('offline: en');
    expect(onError).not.toHaveBeenCalled();
  });

  it('reports via console.error by default', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const { table } = loaders(['en', 'de'], new Set(['de']));
      await createLocaleContent(table).preload('de');
      expect(spy).toHaveBeenCalledTimes(1);
    } finally {
      spy.mockRestore();
    }
  });

  it('throws a clear error when content is read before any preload', () => {
    const { table, calls } = loaders(['en']);
    const store = createLocaleContent(table);
    expect(() => store.get('en')).toThrow('Content for "en" is not loaded: await preload("en") before creating the game.');
    expect(calls).toEqual({});
  });
});
