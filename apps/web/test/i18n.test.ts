import { describe, expect, it, vi } from 'vitest';
import { SUPPORTED_LOCALES } from '@wp/localization';
import { gameCatalogueMessages, isLocaleLoaded, LEARNING_UI_MESSAGES, LOCALE_LOADERS, loadLocale, UI_MESSAGES } from '../src/i18n';
import { GAMES } from '../src/registry';

// Runs in its own module instance (Vitest isolates test files), so it starts with no locale loaded.
describe('per-locale message loading', () => {
  it('starts empty: the main chunk carries no translations', () => {
    expect(UI_MESSAGES).toEqual({});
    expect(LEARNING_UI_MESSAGES).toEqual({});
    for (const { metadata } of GAMES) expect(metadata.messages).toEqual({});
  });

  it('loads the requested locale plus the English fallback, and nothing else', async () => {
    await expect(loadLocale('de')).resolves.toBe('de');
    expect(Object.keys(UI_MESSAGES).sort()).toEqual(['de', 'en']);
    expect(Object.keys(LEARNING_UI_MESSAGES).sort()).toEqual(['de', 'en']);
    for (const { metadata } of GAMES) {
      expect(Object.keys(metadata.messages).sort(), metadata.id).toEqual(['de', 'en']);
      expect(metadata.messages.de?.title, metadata.id).toBeTruthy();
      expect(gameCatalogueMessages(metadata.id)).toBe(metadata.messages);
    }
    expect(isLocaleLoaded('de')).toBe(true);
    expect(isLocaleLoaded('fr')).toBe(false);
  });

  it('loads each locale once', async () => {
    const before = UI_MESSAGES.de;
    await loadLocale('de');
    expect(UI_MESSAGES.de).toBe(before);
  });

  it('falls back to English for an unknown locale', async () => {
    await expect(loadLocale('xx-YY')).resolves.toBe('en');
    await expect(loadLocale('')).resolves.toBe('en');
  });

  it('loads every locale with the complete key sets of English', async () => {
    const en = await LOCALE_LOADERS.en();
    for (const locale of SUPPORTED_LOCALES) {
      await expect(loadLocale(locale)).resolves.toBe(locale);
      const messages = await LOCALE_LOADERS[locale]();
      expect(Object.keys(messages.ui).sort(), locale).toEqual(Object.keys(en.ui).sort());
      expect(Object.keys(messages.learning).sort(), locale).toEqual(Object.keys(en.learning).sort());
      expect(Object.keys(messages.games).sort(), locale).toEqual(Object.keys(en.games).sort());
      for (const [id, table] of Object.entries(en.games)) expect(Object.keys(messages.games[id] ?? {}).sort(), `${locale}/${id}`).toEqual(Object.keys(table).sort());
    }
    expect(Object.keys(UI_MESSAGES).sort()).toEqual([...SUPPORTED_LOCALES].sort());
  });
});

describe('loading failures', () => {
  it('uses English when a locale cannot be loaded, and retries that locale later', async () => {
    vi.resetModules();
    const i18n = await import('../src/i18n');
    const loaders = i18n.LOCALE_LOADERS as Record<string, () => Promise<unknown>>;
    const original = loaders.fr!;
    loaders.fr = () => Promise.reject(new Error('offline'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      await expect(i18n.loadLocale('fr')).resolves.toBe('en');
      expect(i18n.isLocaleLoaded('fr')).toBe(false);
      expect(i18n.isLocaleLoaded('en')).toBe(true);
      expect(error).toHaveBeenCalled();
    } finally {
      error.mockRestore();
      loaders.fr = original;
    }
    await expect(i18n.loadLocale('fr')).resolves.toBe('fr');
  });

  it('rejects only when not even English can be loaded', async () => {
    vi.resetModules();
    const i18n = await import('../src/i18n');
    const loaders = i18n.LOCALE_LOADERS as Record<string, () => Promise<unknown>>;
    loaders.en = () => Promise.reject(new Error('offline'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      await expect(i18n.loadLocale('en')).rejects.toThrow('offline');
      await expect(i18n.loadLocale('it')).resolves.toBe('it');
    } finally {
      error.mockRestore();
    }
  });
});
