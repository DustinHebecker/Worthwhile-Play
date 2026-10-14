// @vitest-environment jsdom
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { AI_TERMS, aiTerm, CAPITALS, DECK_LINK_MAX_CHARS, deckToJson, encodeDeckLinkData, type Deck } from '@wp/learning-content';
import { DECK_GUIDE_EXAMPLE } from '@wp/learning-content/ai-guide';
import { createTranslator, SUPPORTED_LOCALES } from '@wp/localization';
import { createMemoryDeckStore, createMemoryLearningStore, createMemoryLibraryStore, createMemoryStore, createSave, type DeckStore, type LearningStore } from '@wp/persistence';
import type { AppContext } from '../src/app';
import { UI_MESSAGES } from '../src/i18n';
import { renderAbout } from '../src/pages/about';
import { renderDeck, renderDeckImport, renderDecks } from '../src/pages/decks';
import { loadAllLocales } from './locales';

await loadAllLocales();

// Build-time constants normally injected by vite.config.ts.
vi.hoisted(() => {
  Object.assign(globalThis, { __WP_VERSION__: 'test', __WP_LEGAL__: { name: '', address: [], email: '' } });
});

const flush = async () => {
  for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0));
};

function app(locale: 'en' | 'de' = 'en', decks: DeckStore = createMemoryDeckStore(), learning: LearningStore = createMemoryLearningStore()) {
  const store = Object.assign(createMemoryStore(), { persistent: true });
  const context: AppContext = {
    locale,
    t: createTranslator({ locale, sources: [UI_MESSAGES] }) as AppContext['t'],
    store: Promise.resolve(store),
    decks: Promise.resolve(decks),
    learning: Promise.resolve(learning),
    library: Promise.resolve(createMemoryLibraryStore()),
    navigate: vi.fn(),
    setLocale: vi.fn(),
    announce: vi.fn()
  };
  const main = document.createElement('main');
  document.body.append(main);
  return { context, main, decks, store, learning };
}

const byId = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`);

afterEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
  vi.restoreAllMocks();
  history.replaceState(null, '', '/');
});

async function chooseFile(input: HTMLInputElement, text: string, name: string) {
  Object.defineProperty(input, 'files', { value: [new File([text], name)], configurable: true });
  input.dispatchEvent(new Event('change'));
  await flush();
}

const stubClipboard = (writeText: ((text: string) => Promise<void>) | undefined) => {
  const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperty(navigator, 'clipboard', { value: writeText ? { writeText } : undefined, configurable: true });
  onTestFinished(() => {
    if (original) Object.defineProperty(navigator, 'clipboard', original);
    else delete (navigator as { clipboard?: unknown }).clipboard;
  });
};

describe('create a deck with an AI', () => {
  it('offers the guide for the UI language as an absolute link and copies it', async () => {
    const writeText = vi.fn((_text: string) => Promise.resolve());
    stubClipboard(writeText);
    const { context, main } = app('de');
    renderDeckImport(main, context);
    const url = `${location.origin}/ai/deck-guide.de.md`;
    expect(byId(main, 'ai-guide')?.querySelector('h2')?.textContent).toBe('Mit einer KI erstellen');
    expect((byId(main, 'ai-guide-url') as HTMLInputElement).value).toBe(url);
    expect(byId(main, 'ai-guide-url')?.hasAttribute('readonly')).toBe(true);
    expect(main.querySelector('label[for="ai-guide-url"]')?.textContent).toContain('Anleitung für KIs');
    expect(byId(main, 'ai-guide-open')?.getAttribute('href')).toBe(url);
    expect(byId(main, 'ai-guide')?.textContent).toContain('ChatGPT');
    expect(byId(main, 'ai-guide')?.textContent).toContain('nur technisch');
    byId(main, 'ai-guide-copy')?.click();
    await flush();
    expect(writeText).toHaveBeenCalledWith(url);
    expect(byId(main, 'ai-guide-status')?.textContent).toBe('Link kopiert.');
  });

  it('selects the link when the clipboard is unavailable or refused', async () => {
    for (const writeText of [undefined, () => Promise.reject(new Error('denied'))]) {
      stubClipboard(writeText);
      const { context, main } = app('en');
      renderDeckImport(main, context);
      const input = byId(main, 'ai-guide-url') as HTMLInputElement;
      byId(main, 'ai-guide-copy')?.click();
      await flush();
      expect(document.activeElement).toBe(input);
      expect([input.selectionStart, input.selectionEnd]).toEqual([0, input.value.length]);
      expect(byId(main, 'ai-guide-status')?.textContent).toContain('The link is selected');
      document.body.innerHTML = '';
    }
  });

  it('is mentioned on the About page, with a link to the import page', () => {
    const { context, main } = app('en');
    renderAbout(main, context);
    expect(byId(main, 'about-ai-decks')?.textContent).toContain('never contacts an AI service');
    expect(byId(main, 'about-ai-decks')?.querySelector('a')?.getAttribute('href')).toBe('/decks/import');
  });

  it('has the texts in every locale', () => {
    const keys = ['import.ai.title', 'import.ai.intro', 'import.ai.how', 'import.ai.guideLabel', 'import.ai.copy', 'import.ai.copied', 'import.ai.copyFailed', 'import.ai.open', 'import.ai.note', 'import.link.loaded', 'import.link.invalid', 'import.link.tooLarge', 'import.link.errorsHint', 'about.aiDecks'] as const;
    for (const locale of SUPPORTED_LOCALES) {
      for (const key of keys) {
        expect(UI_MESSAGES[locale]?.[key]?.trim(), `${locale}/${key}`).toBeTruthy();
        if (locale !== 'en') expect(UI_MESSAGES[locale]?.[key], `${locale}/${key}`).not.toBe(UI_MESSAGES.en?.[key]);
      }
      expect(UI_MESSAGES[locale]?.['import.link.tooLarge'], locale).toContain('{size}');
    }
  });
});

describe('direct link import (#deck=…)', () => {
  const linkTo = (text: string) => history.replaceState(null, '', `/decks/import#deck=${encodeDeckLinkData(text)}`);

  it('opens the normal preview, clears the fragment and saves only after confirmation', async () => {
    linkTo(JSON.stringify(DECK_GUIDE_EXAMPLE));
    const { context, main, decks } = app('en');
    renderDeckImport(main, context);
    expect(location.hash).toBe('');
    expect(location.pathname).toBe('/decks/import');
    expect(byId(main, 'import-from-link')?.textContent).toContain('nothing is saved until you choose “Save deck”');
    expect(byId(main, 'deck-preview')?.textContent).toContain('la manzana');
    expect(main.textContent).toContain(`Preview: ${DECK_GUIDE_EXAMPLE.items.length} cards`);
    expect(document.activeElement?.id).toBe('import-preview-title');
    expect(await decks.list()).toEqual([]);
    byId(main, 'deck-save')?.click();
    await flush();
    const stored = (await decks.list()) as { id: string; deck: Deck }[];
    expect(stored).toHaveLength(1);
    expect(stored[0]?.id).toMatch(/^user-deck-[0-9a-f]{8}$/);
    expect(stored[0]?.deck.title).toEqual(DECK_GUIDE_EXAMPLE.title);
    expect(stored[0]?.deck.items.map((i) => i.id)).toEqual(DECK_GUIDE_EXAMPLE.items.map((i) => i.id));
    expect(context.navigate).toHaveBeenCalledWith(`/decks/${stored[0]?.id}`);
  });

  it('explains unreadable and too large links and suggests a JSON file', () => {
    const cases = [
      ['#deck=%%%not-base64', 'does not contain a readable deck'],
      ['#deck=', 'does not contain a readable deck'],
      [`#deck=${'A'.repeat(DECK_LINK_MAX_CHARS + 4)}`, 'larger than 2 MB']
    ] as const;
    for (const [hash, text] of cases) {
      history.replaceState(null, '', `/decks/import${hash}`);
      const { context, main } = app('en');
      renderDeckImport(main, context);
      expect(byId(main, 'import-link-error')?.textContent, hash.slice(0, 20)).toContain(text);
      expect(byId(main, 'import-link-error')?.textContent).toContain('JSON file');
      expect(document.activeElement).toBe(byId(main, 'import-link-error'));
      expect(byId(main, 'deck-save')).toBeNull();
      expect(location.hash).toBe('');
      document.body.innerHTML = '';
    }
  });

  it('a link with a broken deck shows the importer errors in the UI language, plus a hint for the AI', () => {
    linkTo('{"title":{"en":"x"},"items":[{"id":"a","front":{"text":"Hund"},"back":{}}]}');
    const { context, main } = app('de');
    renderDeckImport(main, context);
    expect(byId(main, 'import-errors')?.textContent).toContain('Karte 1: Die Rückseite ist leer.');
    expect(byId(main, 'import-errors')?.textContent).toContain('Bitte die KI');
    expect(byId(main, 'deck-save')).toBeNull();
  });

  it('a link always carries JSON: CSV in a link is not imported', () => {
    linkTo('front_text,back_text\nHund,dog');
    const { context, main } = app('en');
    renderDeckImport(main, context);
    expect(byId(main, 'import-errors')?.textContent).toContain('The JSON is not valid');
  });

  it('strips remote media from a link deck like from any import', () => {
    linkTo(JSON.stringify({ title: { en: 'x' }, items: [{ id: 'a', front: { text: 'cat', image: 'https://example.com/cat.png' }, back: { text: 'Katze' } }] }));
    const { context, main } = app('en');
    renderDeckImport(main, context);
    expect(byId(main, 'import-warnings')?.textContent).toContain('A link to another website was removed');
    expect(main.querySelector('img')).toBeNull();
  });

  it('reacts to a new link while the page is open, and stops listening once it is gone', () => {
    const { context, main } = app('en');
    renderDeckImport(main, context);
    expect(byId(main, 'deck-preview')).toBeNull();
    linkTo(JSON.stringify(DECK_GUIDE_EXAMPLE));
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(byId(main, 'deck-preview')?.textContent).toContain('la fresa');
    expect(location.hash).toBe('');
    main.remove();
    linkTo(JSON.stringify(DECK_GUIDE_EXAMPLE));
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(location.hash).not.toBe(''); // no longer handled by the old page
  });
});

describe('save and upload manually', () => {
  const own: Deck = {
    schemaVersion: 1,
    id: 'user-mixed-1',
    title: { en: 'Mixed', de: 'Gemischt' },
    description: { en: 'Everything a deck can hold' },
    license: 'CC0-1.0',
    source: 'Me',
    items: [
      { id: 'a', front: { text: 'Hund', lang: 'de', symbol: '🐕' }, back: { text: 'dog', lang: 'en' }, tags: ['animals', 'pets'], difficulty: 2, category: 'nouns' },
      { id: 'b', front: { symbol: '🐈', alt: 'cat' }, back: { text: 'say "hi",\nfriend', lang: 'en' } },
      { id: 'c', front: { image: 'data:image/png;base64,iVBORw0KGgo=' }, back: { text: 'Bild' } }
    ]
  };

  it('an exported own deck re-imports identically from its JSON file (apart from the fresh id)', async () => {
    const decks = createMemoryDeckStore();
    await decks.put({ id: own.id, importedAt: '2026-01-01T00:00:00Z', deck: own });
    const blobs: Blob[] = [];
    const original = { createObjectURL: URL.createObjectURL, revokeObjectURL: URL.revokeObjectURL };
    onTestFinished(() => void Object.assign(URL, original));
    Object.assign(URL, { createObjectURL: vi.fn((blob: Blob) => (blobs.push(blob), 'blob:deck')), revokeObjectURL: vi.fn() });
    const clicked: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this);
    });
    const first = app('en', decks);
    renderDeck(first.main, first.context, own.id);
    await flush();
    byId(first.main, 'export-deck')?.click();
    expect(clicked[0]?.download).toBe(`${own.id}.json`);
    const json = await blobs[0]!.text();
    expect(json).toBe(deckToJson(own));
    document.body.innerHTML = '';

    const second = app('en', decks);
    renderDeckImport(second.main, second.context);
    await chooseFile(byId(second.main, 'deck-file') as HTMLInputElement, json, `${own.id}.json`);
    expect(byId(second.main, 'import-warnings')).toBeNull();
    byId(second.main, 'deck-save')?.click();
    await flush();
    const stored = ((await decks.list()) as { id: string; deck: Deck }[]).find((d) => d.id !== own.id);
    expect(stored?.deck).toEqual({ ...own, id: stored?.id });
  });

  it('imports a CSV file, named after the file', async () => {
    const { context, main, decks } = app('en');
    renderDeckImport(main, context);
    await chooseFile(byId(main, 'deck-file') as HTMLInputElement, 'front_text,back_text,front_lang,back_lang,tags\nHund,dog,de,en,animals; pets\n', 'German animals.csv');
    expect(byId(main, 'deck-preview')?.textContent).toContain('Hund');
    byId(main, 'deck-save')?.click();
    await flush();
    const [stored] = (await decks.list()) as { deck: Deck }[];
    expect(stored?.deck.title).toEqual({ en: 'German animals' });
    expect(stored?.deck.items[0]).toMatchObject({ front: { text: 'Hund', lang: 'de' }, back: { text: 'dog', lang: 'en' }, tags: ['animals', 'pets'] });
  });
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
    expect(byId(main, 'deck-card-capitals')?.textContent).toContain('Hauptstädte');
    expect(byId(main, 'deck-card-capitals')?.textContent).toContain(`${CAPITALS.length} Karten`);
    expect(byId(main, 'deck-card-ai-basics')?.textContent).toContain('KI-Grundbegriffe');
    expect(byId(main, 'deck-card-ai-basics')?.textContent).toContain(`${AI_TERMS.length} Karten`);
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

  it('shows the capitals deck: country ↔ capital in one language, playable in Memory and reviewable', async () => {
    const { context, main } = app('de');
    renderDeck(main, context, 'capitals');
    expect(main.querySelector('h1')?.textContent).toBe('Hauptstädte');
    const rows = [...(byId(main, 'deck-preview')?.querySelectorAll('tbody tr') ?? [])].map((tr) => [...tr.querySelectorAll('td')].slice(1).map((td) => td.textContent?.trim()));
    expect(rows).toContainEqual(['Polen', 'Warschau']);
    expect(rows).toContainEqual(['Frankreich', 'Paris']);
    expect(rows).toHaveLength(CAPITALS.length);
    expect(byId(main, 'deck-count')?.textContent).toBe(`${CAPITALS.length} Karten`);
    expect(main.textContent).toContain('Sprachen: Deutsch');
    expect(main.textContent).not.toContain('Deutsch ↔ Deutsch');
    expect(byId(main, 'review-deck')?.getAttribute('href')).toBe('/games/review?deck=capitals');
    byId(main, 'play-country-capital')?.click();
    await flush();
    expect(JSON.parse(localStorage.getItem('wp:pref:memory:cards') ?? 'null')).toBe('country-capital');
    expect(context.navigate).toHaveBeenLastCalledWith('/games/memory?new=1');
  });

  it('the capitals description states the real number of countries in every locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const about = UI_MESSAGES[locale]?.['decks.capitals.about'] ?? '';
      expect(about, locale).toContain(String(CAPITALS.length));
      expect(UI_MESSAGES[locale]?.['decks.playCapitals'], locale).toBeTruthy();
    }
  });

  it('shows the AI basics deck: term ↔ definition in one language, playable in Memory and reviewable', async () => {
    const { context, main } = app('de');
    renderDeck(main, context, 'ai-basics');
    expect(main.querySelector('h1')?.textContent).toBe('KI-Grundbegriffe');
    const rows = [...(byId(main, 'deck-preview')?.querySelectorAll('tbody tr') ?? [])].map((tr) => [...tr.querySelectorAll('td')].slice(1).map((td) => td.textContent?.trim()));
    expect(rows).toContainEqual(['Token', aiTerm('token', 'de')?.definition]);
    expect(rows).toContainEqual(['Halluzination', aiTerm('hallucination', 'de')?.definition]);
    expect(rows).toHaveLength(AI_TERMS.length);
    expect(byId(main, 'deck-count')?.textContent).toBe(`${AI_TERMS.length} Karten`);
    expect(main.textContent).toContain('Sprachen: Deutsch');
    expect(main.textContent).not.toContain('Deutsch ↔ Deutsch');
    expect(byId(main, 'delete-deck')).toBeNull();
    expect(byId(main, 'review-deck')?.getAttribute('href')).toBe('/games/review?deck=ai-basics');
    byId(main, 'play-ai-term-definition')?.click();
    await flush();
    expect(JSON.parse(localStorage.getItem('wp:pref:memory:cards') ?? 'null')).toBe('ai-term-definition');
    expect(context.navigate).toHaveBeenLastCalledWith('/games/memory?new=1');
  });

  it('the AI basics description states the real number of terms in every locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const about = UI_MESSAGES[locale]?.['decks.aiBasics.about'] ?? '';
      expect(about, locale).toContain(String(AI_TERMS.length));
      expect(UI_MESSAGES[locale]?.['decks.aiBasics'], locale).toBeTruthy();
      expect(UI_MESSAGES[locale]?.['decks.playAiBasics'], locale).toBeTruthy();
    }
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

  it('deleting an own deck also deletes its learning records', async () => {
    const decks = createMemoryDeckStore();
    await decks.put(stored);
    const learning = createMemoryLearningStore();
    await learning.putMany([recordFor('user-pets-1', 'a'), recordFor('flags', 'de')]);
    const { context, main } = app('en', decks, learning);
    renderDeck(main, context, 'user-pets-1');
    await flush();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    byId(main, 'delete-deck')?.click();
    await flush();
    expect(((await learning.list()) as { deckId: string }[]).map((r) => r.deckId)).toEqual(['flags']);
  });
});

/** A valid record that is due on any day after 2000-01-03. */
const recordFor = (deckId: string, itemId: string, direction: 'forward' | 'backward' = 'forward') => ({
  deckId, itemId, direction, box: 1, due: '2000-01-03', lastDay: '2000-01-02', last: 'again', reviews: 1, lapses: 1, session: 'old'
});

describe('items worth reviewing', () => {
  const stored = { id: 'user-pets-1', importedAt: '2026-01-02T00:00:00Z', deck: { schemaVersion: 1, id: 'user-pets-1', title: { en: 'Pets' }, items: [{ id: 'a', front: { text: 'Hund', lang: 'de' }, back: { text: 'dog', lang: 'en' } }, { id: 'b', front: { text: 'Katze', lang: 'de' }, back: { text: 'cat', lang: 'en' } }] } };

  it('says calmly that nothing is waiting and explains the schedule', async () => {
    const { context, main } = app();
    renderDecks(main, context);
    await flush();
    expect(byId(main, 'review-none')?.hidden).toBe(false);
    expect(byId(main, 'review-none')?.textContent).toBe('Nothing is waiting for review right now.');
    expect(byId(main, 'review-overview')?.childElementCount).toBe(0);
    expect(byId(main, 'review-how')?.textContent).toContain('only a suggestion');
    expect(byId(main, 'deck-due')).toBeNull();
  });

  it('lists decks with cards worth reviewing (items, any direction) with a Review link', async () => {
    const decks = createMemoryDeckStore();
    await decks.put(stored);
    const learning = createMemoryLearningStore();
    // English UI → "First words" records are kept per learning language (here: English).
    await learning.putMany([
      recordFor('user-pets-1', 'a'),
      recordFor('user-pets-1', 'a', 'backward'),
      recordFor('user-pets-1', 'b'),
      recordFor('first-words:en', 'apple'),
      recordFor('first-words:ja', 'dog'),
      recordFor('flags', 'gone'),
      { deckId: 'flags', itemId: 'de', direction: 'forward', junk: true }
    ]);
    const { context, main } = app('en', decks, learning);
    renderDecks(main, context);
    await flush();
    expect(byId(main, 'review-none')?.hidden).toBe(true);
    const items = [...(byId(main, 'review-overview')?.querySelectorAll('li') ?? [])].map((li) => li.textContent);
    expect(items).toEqual(['Pets2 worth reviewingReview', 'First words1 worth reviewingReview']);
    const link = byId(main, 'review-user-pets-1') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/games/review?deck=user-pets-1');
    expect(link.getAttribute('aria-label')).toBe('Review Pets');
    expect(byId(main, 'deck-card-user-pets-1')?.querySelector('[data-testid="deck-due"]')?.textContent).toBe('2 worth reviewing');
    expect(byId(main, 'deck-card-flags')?.querySelector('[data-testid="deck-due"]')).toBeNull();
  });

  it('a deck page offers "Review with flash cards" and neutral counts (not for symbols)', async () => {
    const learning = createMemoryLearningStore();
    await learning.putMany([recordFor('flags', 'de')]);
    const { context, main } = app('en', createMemoryDeckStore(), learning);
    renderDeck(main, context, 'flags');
    await flush();
    expect(byId(main, 'review-deck')?.getAttribute('href')).toBe('/games/review?deck=flags');
    expect(byId(main, 'deck-review')?.textContent).toBe('1 worth reviewing · Rated so far: 1 of 60 cards');
    document.body.innerHTML = '';
    const other = app();
    renderDeck(other.main, other.context, 'symbols');
    await flush();
    expect(byId(other.main, 'review-deck')).toBeNull();
    expect(byId(other.main, 'deck-review')?.hidden).toBe(true);
  });
});
