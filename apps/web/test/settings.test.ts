// @vitest-environment jsdom
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import type { GameModule } from '@wp/game-core';
import { createTranslator, type SupportedLocale } from '@wp/localization';
import {
  createGameLibrary,
  createMemoryDeckStore,
  createMemoryLearningStore,
  createMemoryLibraryStore,
  createMemoryStore,
  createSave,
  exportLibrary,
  LIBRARY_EXPORT_FORMAT,
  libraryExportToJson,
  type LibraryStore
} from '@wp/persistence';
import type { AppContext } from '../src/app';
import { UI_MESSAGES } from '../src/i18n';
import { createPreferences } from '../src/lib/preferences';
import { formatBytes, measureStorage, renderSettings } from '../src/pages/settings';
import { loadAllLocales } from './locales';

await loadAllLocales();

vi.hoisted(() => {
  Object.assign(globalThis, { __WP_VERSION__: 'test', __WP_LEGAL__: { name: '', address: [], email: '' } });
});

const flush = async () => {
  for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0));
};
const memoryGame = { metadata: { id: 'memory', stateVersion: 1 } } as unknown as GameModule<unknown>;

async function setup(locale: SupportedLocale = 'en', library: LibraryStore = createMemoryLibraryStore()) {
  const store = Object.assign(createMemoryStore(), { persistent: true });
  const decks = createMemoryDeckStore();
  const learning = createMemoryLearningStore();
  await store.write(createSave(memoryGame, 1, {}));
  await decks.put({ id: 'user-keep-1' });
  await learning.putMany([{ deckId: 'flags', itemId: 'de', direction: 'forward' }]);
  const context: AppContext = {
    locale,
    t: createTranslator({ locale, sources: [UI_MESSAGES] }) as AppContext['t'],
    store: Promise.resolve(store),
    decks: Promise.resolve(decks),
    learning: Promise.resolve(learning),
    library: Promise.resolve(library),
    navigate: vi.fn(),
    setLocale: vi.fn(),
    announce: vi.fn()
  };
  const main = document.createElement('main');
  document.body.append(main);
  renderSettings(main, context);
  await flush();
  const byId = <T extends HTMLElement = HTMLElement>(id: string) => main.querySelector<T>(`[data-testid="${id}"]`)!;
  return { context, main, store, decks, learning, library, byId };
}

async function seed(library: LibraryStore) {
  const relay = createGameLibrary(library, 'relay-command');
  await relay.put({ name: 'Ridge', data: { cells: [1] } });
  await relay.put({ name: 'Valley', data: { cells: [2] } });
  // A game that is no longer in the catalogue: still counted (and deleted), shown by its id.
  await createGameLibrary(library, 'retired-game').put({ name: 'Old', data: 1 });
}

afterEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('settings: delete my own content (ADR 0012)', () => {
  it('shows the count per game and deletes only after confirmation, separately from saves, decks and learning records', async () => {
    const library = createMemoryLibraryStore();
    await seed(library);
    const { context, store, decks, learning, byId } = await setup('en', library);
    expect(byId('library-info').textContent).toBe('Things you created in games (e.g. maps) on this device: 3');
    expect([...byId('library-games').querySelectorAll('.library-game')].map((span) => span.textContent)).toEqual(['Relay Command: 2', 'retired-game: 1']);
    expect(byId('library-games').hidden).toBe(false);
    const button = byId<HTMLButtonElement>('clear-library');
    expect(button.textContent).toBe('Delete my own content (e.g. maps)');
    expect(button.disabled).toBe(false);

    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    button.click();
    await flush();
    expect(await library.counts()).toEqual(new Map([['relay-command', 2], ['retired-game', 1]]));
    button.click();
    await flush();
    expect(confirm).toHaveBeenLastCalledWith('Delete everything you created in games on this device (e.g. maps)? Saved games, decks and learning records are not affected. This cannot be undone.');
    expect(await library.counts()).toEqual(new Map());
    expect(byId('library-info').textContent).toBe('Things you created in games (e.g. maps) on this device: 0');
    expect(byId('library-games').hidden).toBe(true);
    expect(button.disabled).toBe(true);
    expect(context.announce).toHaveBeenCalledWith('Your own content deleted.');
    expect(await store.keys()).toEqual(['memory']);
    expect(await decks.list()).toHaveLength(1);
    expect(await learning.list()).toHaveLength(1);
  });

  it('"Delete all saved games" keeps the library (but forgets preferences)', async () => {
    const library = createMemoryLibraryStore();
    await seed(library);
    createPreferences(localStorage, 'relay-command').set('opponents', 2);
    const { store, byId } = await setup('en', library);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    byId('clear-saves').click();
    await flush();
    expect(await store.keys()).toEqual([]);
    expect(createPreferences(localStorage, 'relay-command').get('opponents')).toBeUndefined();
    expect(await library.counts()).toEqual(new Map([['relay-command', 2], ['retired-game', 1]]));
    expect(byId('library-info').textContent).toBe('Things you created in games (e.g. maps) on this device: 3');
  });

  it('is disabled without items, translated, and survives a failing store', async () => {
    const empty = await setup('de');
    expect(empty.byId('library-info').textContent).toBe('Eigene Inhalte aus Spielen (z. B. selbst gebaute Karten) auf diesem Gerät: 0');
    expect(empty.byId<HTMLButtonElement>('clear-library').disabled).toBe(true);
    expect(empty.byId('library-games').hidden).toBe(true);
    document.body.innerHTML = '';
    const broken: LibraryStore = { ...createMemoryLibraryStore(), counts: () => Promise.reject(new Error('io')) };
    const failing = await setup('en', broken);
    expect(failing.byId('library-info').textContent).toBe('Things you created in games (e.g. maps) on this device: 0');
  });
});

/** Chooses `text` as the file of the import input (jsdom has no file dialog). */
async function chooseFile(input: HTMLInputElement, text: string, size = text.length) {
  const file = new File([text], 'own-content.json', { type: 'application/json' });
  if (size !== text.length) Object.defineProperty(file, 'size', { value: size });
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  input.dispatchEvent(new Event('change'));
  await flush();
}

describe('settings: delete per game, export and import my own content', () => {
  it('deletes the items of one game after confirmation and leaves the others', async () => {
    const library = createMemoryLibraryStore();
    await seed(library);
    const { context, byId } = await setup('en', library);
    const button = byId<HTMLButtonElement>('clear-library-relay-command');
    expect(button.textContent).toBe('Delete');
    expect(button.getAttribute('aria-label')).toBe('Delete own content of Relay Command');
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    button.click();
    await flush();
    expect(await library.counts()).toEqual(new Map([['relay-command', 2], ['retired-game', 1]]));
    button.click();
    await flush();
    expect(confirm).toHaveBeenLastCalledWith('Delete your own content of Relay Command (2)? Other games are not affected. This cannot be undone.');
    expect(await library.counts()).toEqual(new Map([['retired-game', 1]]));
    expect(context.announce).toHaveBeenCalledWith('Own content of Relay Command deleted.');
    expect(byId('library-info').textContent).toBe('Things you created in games (e.g. maps) on this device: 1');
    // The pressed button is gone; focus moves to the count instead of the page body.
    expect(document.activeElement).toBe(byId('library-info'));
  });

  it('says so when deleting or exporting fails', async () => {
    const library = createMemoryLibraryStore();
    await seed(library);
    Object.assign(library, { removeGame: () => Promise.reject(new Error('io')), list: () => Promise.reject(new Error('io')) });
    const { context, byId } = await setup('en', library);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    byId('clear-library-relay-command').click();
    await flush();
    expect(context.announce).toHaveBeenLastCalledWith('That did not work. Please try again.');
    byId('export-library').click();
    await flush();
    expect(context.announce).toHaveBeenCalledTimes(2);
    expect(context.announce).toHaveBeenLastCalledWith('That did not work. Please try again.');
  });

  it('offers "replace" before the file input, since choosing a file starts the import', async () => {
    const { main } = await setup('en');
    const order = [...main.querySelectorAll('[data-testid="library-replace"], [data-testid="library-file"]')].map((el) => el.getAttribute('data-testid'));
    expect(order).toEqual(['library-replace', 'library-file']);
  });

  it('exports a file named by the date, only when there is something to export', async () => {
    const empty = await setup('en');
    expect(empty.byId<HTMLButtonElement>('export-library').disabled).toBe(true);
    document.body.innerHTML = '';
    const library = createMemoryLibraryStore();
    await seed(library);
    const { byId } = await setup('en', library);
    const blobs: Blob[] = [];
    // jsdom has no object URLs: stub them for this test only.
    const original = { createObjectURL: URL.createObjectURL, revokeObjectURL: URL.revokeObjectURL };
    onTestFinished(() => void Object.assign(URL, original));
    Object.assign(URL, { createObjectURL: vi.fn((blob: Blob) => (blobs.push(blob), 'blob:own')), revokeObjectURL: vi.fn() });
    const clicked: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this);
    });
    const button = byId<HTMLButtonElement>('export-library');
    expect(button.disabled).toBe(false);
    button.click();
    await flush();
    expect(clicked[0]?.download).toMatch(/^worthwhile-play-own-content-\d{4}-\d{2}-\d{2}\.json$/);
    const file = JSON.parse(await blobs[0]!.text()) as { format: string; items: { gameId: string; name: string }[] };
    expect(file.format).toBe(LIBRARY_EXPORT_FORMAT);
    expect(file.items.map((i) => `${i.gameId}:${i.name}`).sort()).toEqual(['relay-command:Ridge', 'relay-command:Valley', 'retired-game:Old']);
  });

  it('imports a file: reports what happened, keeps existing items unless "replace" is ticked, skips unknown games', async () => {
    const source = createMemoryLibraryStore();
    await createGameLibrary(source, 'relay-command').put({ id: 'slot-0', name: 'Ridge', data: { cells: [1] } });
    await createGameLibrary(source, 'relay-command').put({ id: 'slot-1', name: 'Valley', data: { cells: [2] } });
    await createGameLibrary(source, 'retired-game').put({ id: 'x', name: 'Old', data: 1 });
    const text = libraryExportToJson(await exportLibrary(source));

    const library = createMemoryLibraryStore();
    await createGameLibrary(library, 'relay-command').put({ id: 'slot-1', name: 'My valley', data: { cells: [9] } });
    const { byId } = await setup('en', library);
    const input = byId<HTMLInputElement>('library-file');
    await chooseFile(input, text);
    expect(byId('library-import-status').textContent).toBe(
      'Import finished. New: 1 · Replaced: 0 · Already there: 0 · Kept, not replaced: 1 · No space left: 0 · Skipped (unreadable or unknown game): 1'
    );
    expect(((await library.get('relay-command', 'slot-1')) as { name: string }).name).toBe('My valley');
    expect(byId('library-info').textContent).toBe('Things you created in games (e.g. maps) on this device: 2');

    byId<HTMLInputElement>('library-replace').checked = true;
    await chooseFile(input, text);
    expect(byId('library-import-status').textContent).toBe(
      'Import finished. New: 0 · Replaced: 1 · Already there: 1 · Kept, not replaced: 0 · No space left: 0 · Skipped (unreadable or unknown game): 1'
    );
    expect(((await library.get('relay-command', 'slot-1')) as { name: string }).name).toBe('Valley');
  });

  it('explains files it cannot import, without changing anything', async () => {
    const library = createMemoryLibraryStore();
    const { byId } = await setup('de', library);
    const input = byId<HTMLInputElement>('library-file');
    const status = () => byId('library-import-status').textContent;
    await chooseFile(input, 'not json');
    expect(status()).toBe('Diese Datei ist kein Export eigener Inhalte aus Worthwhile Play.');
    await chooseFile(input, JSON.stringify({ format: LIBRARY_EXPORT_FORMAT, version: 99, items: [] }));
    expect(status()).toBe('Diese Datei stammt aus einer neueren Version von Worthwhile Play. Lade die App neu und versuche es noch einmal.');
    await chooseFile(input, '{}', 33 * 1024 * 1024);
    expect(status()).toBe('Diese Datei ist zu groß (höchstens 32 MB).');
    expect(input.disabled).toBe(false);
    expect(await library.counts()).toEqual(new Map());
    // Storage fails while writing (e.g. quota).
    Object.assign(library, { put: () => Promise.reject(new Error('quota')) });
    const text = JSON.stringify({ format: LIBRARY_EXPORT_FORMAT, version: 1, items: [{ gameId: 'relay-command', id: 'a', name: 'A', updatedAt: new Date().toISOString(), data: 1 }] });
    await chooseFile(input, text);
    expect(status()).toBe('Der Import konnte nicht abgeschlossen werden. Was vor dem Problem importiert wurde, bleibt erhalten.');
  });
});

describe('settings: storage used on this device', () => {
  const nav = (estimate: unknown) => ({ storage: { estimate: () => (estimate instanceof Error ? Promise.reject(estimate) : Promise.resolve(estimate)) } }) as unknown as Navigator;

  it('formats bytes in the UI language (decimal units)', () => {
    expect(formatBytes(7_780_000, 'en')).toBe('7.8 MB');
    expect(formatBytes(7_780_000, 'de')).toBe('7,8 MB');
    expect(formatBytes(830_000, 'en')).toBe('830 kB');
  });

  it('reads the estimate, splits app files from data where the browser reports details, and never throws', async () => {
    expect(await measureStorage(nav({ usage: 8_000_000, quota: 1e9 }))).toEqual({ used: 8_000_000 });
    expect(await measureStorage(nav({ usage: 8_000_000, usageDetails: { caches: 7_600_000, indexedDB: 400_000 } }))).toEqual({ used: 8_000_000, app: 7_600_000, data: 400_000 });
    expect(await measureStorage(nav({}))).toBeUndefined();
    expect(await measureStorage(nav(new Error('denied')))).toBeUndefined();
    expect(await measureStorage({} as Navigator)).toBeUndefined();
    expect(await measureStorage(undefined)).toBeUndefined();
  });

  it('shows the total and, where available, the split; says so when the browser reports nothing', async () => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'storage');
    onTestFinished(() => {
      if (original) Object.defineProperty(navigator, 'storage', original);
      else delete (navigator as unknown as Record<string, unknown>).storage;
    });
    Object.defineProperty(navigator, 'storage', { configurable: true, value: { estimate: () => Promise.resolve({ usage: 7_800_000, usageDetails: { caches: 7_500_000 } }) } });
    const { byId } = await setup('de');
    expect(byId('storage-usage').textContent).toBe('Von dieser App auf diesem Gerät belegter Speicher: 7,8 MB');
    expect(byId('storage-usage-detail').hidden).toBe(false);
    expect(byId('storage-usage-detail').textContent).toBe('App-Dateien für die Offline-Nutzung: 7,5 MB · Deine Daten: 300 kB');
    document.body.innerHTML = '';
    Object.defineProperty(navigator, 'storage', { configurable: true, value: undefined });
    const none = await setup('en');
    expect(none.byId('storage-usage').textContent).toBe('Your browser does not report how much storage this app uses.');
    expect(none.byId('storage-usage-detail').hidden).toBe(true);
  });
});
