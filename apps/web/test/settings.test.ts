// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameModule } from '@wp/game-core';
import { createTranslator, type SupportedLocale } from '@wp/localization';
import {
  createGameLibrary,
  createMemoryDeckStore,
  createMemoryLearningStore,
  createMemoryLibraryStore,
  createMemoryStore,
  createSave,
  type LibraryStore
} from '@wp/persistence';
import type { AppContext } from '../src/app';
import { UI_MESSAGES } from '../src/i18n';
import { createPreferences } from '../src/lib/preferences';
import { renderSettings } from '../src/pages/settings';
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
    expect([...byId('library-games').querySelectorAll('li')].map((li) => li.textContent)).toEqual(['Relay Command: 2', 'retired-game: 1']);
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
