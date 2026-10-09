// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTranslator } from '@wp/localization';
import { createMemoryDeckStore, createMemoryStore, createSave, type DeckStore } from '@wp/persistence';
import type { AppContext } from '../src/app';
import { UI_MESSAGES } from '../src/i18n/ui';
import { renderDeck, renderDeckImport, renderDecks } from '../src/pages/decks';

// Build-time constants normally injected by vite.config.ts.
vi.hoisted(() => {
  Object.assign(globalThis, { __WP_VERSION__: 'test', __WP_LEGAL__: { name: '', address: [], email: '' } });
});

const flush = async () => {
  for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0));
};

function app(locale: 'en' | 'de' = 'en', decks: DeckStore = createMemoryDeckStore()) {
  const store = Object.assign(createMemoryStore(), { persistent: true });
  const context: AppContext = {
    locale,
    t: createTranslator({ locale, sources: [UI_MESSAGES] }) as AppContext['t'],
    store: Promise.resolve(store),
    decks: Promise.resolve(decks),
    navigate: vi.fn(),
    setLocale: vi.fn(),
    announce: vi.fn()
  };
  const main = document.createElement('main');
  document.body.append(main);
  return { context, main, decks, store };
}

const byId = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`);

afterEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('deck import page', () => {
  it('checks pasted CSV, shows a preview and saves the deck locally', async () => {
    const { context, main, decks } = app();
    renderDeckImport(main, context);
    (byId(main, 'deck-text') as HTMLTextAreaElement).value = 'front_text,back_text\nHund,dog\nKatze,cat\n';
    (byId(main, 'deck-name') as HTMLInputElement).value = 'Pets';
    main.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(byId(main, 'deck-preview')?.textContent).toContain('Katze');
    expect(main.textContent).toContain('Preview: 2 cards');
    byId(main, 'deck-save')?.click();
    await flush();
    const stored = (await decks.list()) as { id: string; deck: { title: unknown } }[];
    expect(stored).toHaveLength(1);
    expect(stored[0]?.id).toMatch(/^user-pets-[0-9a-f]{8}$/);
    expect(stored[0]?.deck.title).toEqual({ en: 'Pets' });
    expect(context.navigate).toHaveBeenCalledWith(`/decks/${stored[0]?.id}`);
    expect(context.announce).toHaveBeenCalledWith('Deck “Pets” saved.');
  });

  it('lists translated, located errors and offers no save button', () => {
    const { context, main } = app('de');
    renderDeckImport(main, context);
    (byId(main, 'deck-text') as HTMLTextAreaElement).value = 'front_text,back_text\nHund,\n';
    main.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(byId(main, 'import-errors')?.textContent).toContain('Zeile 2 (Karte 1): Die Rückseite ist leer.');
    expect(byId(main, 'deck-save')).toBeNull();
    expect(document.activeElement).toBe(byId(main, 'import-errors'));
  });

  it('refuses to store more than the allowed number of decks', async () => {
    const decks = createMemoryDeckStore();
    for (let i = 0; i < 100; i++) await decks.put({ id: `user-d-${i}`, importedAt: '2026-01-01T00:00:00Z', deck: { schemaVersion: 1, id: `user-d-${i}`, title: { en: 'd' }, items: [{ id: 'a', front: { text: 'a' }, back: { text: 'b' } }] } });
    const { context, main } = app('en', decks);
    renderDeckImport(main, context);
    (byId(main, 'deck-text') as HTMLTextAreaElement).value = 'a,b';
    main.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    byId(main, 'deck-save')?.click();
    await flush();
    expect((await decks.list()).length).toBe(100);
    expect(main.textContent).toContain('You already have 100 decks.');
    expect(context.navigate).not.toHaveBeenCalled();
  });
});

describe('deck library pages', () => {
  const stored = { id: 'user-pets-1', importedAt: '2026-01-02T00:00:00Z', deck: { schemaVersion: 1, id: 'user-pets-1', title: { en: 'Pets', de: 'Haustiere' }, items: [{ id: 'a', front: { text: 'Hund', lang: 'de' }, back: { text: 'dog', lang: 'en' } }, { id: 'b', front: { text: 'Katze', lang: 'de' }, back: { text: 'cat', lang: 'en' } }] } };

  it('lists built-in decks and own decks with title in the UI language, count and languages', async () => {
    const decks = createMemoryDeckStore();
    await decks.put(stored);
    const { context, main } = app('de', decks);
    renderDecks(main, context);
    await flush();
    const own = byId(main, 'deck-card-user-pets-1');
    expect(own?.textContent).toContain('Haustiere');
    expect(own?.textContent).toContain('2 Karten');
    expect(own?.textContent).toContain('Deutsch ↔ Englisch');
    expect(byId(main, 'builtin-decks')?.textContent).toContain('Erste Wörter');
    expect(byId(main, 'deck-card-flags')?.textContent).toContain('60 Karten');
    expect(byId(main, 'own-decks-empty')?.hidden).toBe(true);
  });

  it('shows a built-in deck with country names in the UI language', () => {
    const { context, main } = app('de');
    renderDeck(main, context, 'flags');
    expect(main.querySelector('h1')?.textContent).toBe('Flaggen & Länder');
    expect(byId(main, 'deck-preview')?.textContent).toContain('Deutschland');
    expect(byId(main, 'delete-deck')).toBeNull();
    expect(byId(main, 'play-flag-country')).not.toBeNull();
  });

  it('plays an own deck: remembers the choice and asks before replacing an unfinished game', async () => {
    const decks = createMemoryDeckStore();
    await decks.put(stored);
    const { context, main, store } = app('en', decks);
    renderDeck(main, context, 'user-pets-1');
    await flush();
    byId(main, 'play-own-user-pets-1')?.click();
    await flush();
    expect(context.navigate).toHaveBeenLastCalledWith('/games/memory?new=1');
    expect(JSON.parse(localStorage.getItem('wp:pref:memory:cards') ?? 'null')).toBe('own:user-pets-1');

    await store.write(createSave({ metadata: { id: 'memory', stateVersion: 2 } } as never, 1, {}));
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    byId(main, 'play-own-user-pets-1')?.click();
    await flush();
    expect(confirm).toHaveBeenCalledWith('This starts a new Memory game and replaces your unfinished one. Continue?');
    expect(context.navigate).toHaveBeenLastCalledWith('/games/memory');
  });

  it('deletes an own deck only after confirmation', async () => {
    const decks = createMemoryDeckStore();
    await decks.put(stored);
    const { context, main } = app('en', decks);
    renderDeck(main, context, 'user-pets-1');
    await flush();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    byId(main, 'delete-deck')?.click();
    await flush();
    expect(await decks.list()).toHaveLength(1);
    byId(main, 'delete-deck')?.click();
    await flush();
    expect(confirm).toHaveBeenCalledWith('Delete the deck “Pets” from this device? This cannot be undone.');
    expect(await decks.list()).toHaveLength(0);
    expect(context.navigate).toHaveBeenCalledWith('/decks');
  });

  it('explains a missing deck', async () => {
    const { context, main } = app();
    renderDeck(main, context, 'user-gone-1');
    await flush();
    expect(byId(main, 'deck-not-found')?.textContent).toBe('This deck does not exist on this device. It may have been deleted.');
  });
});
