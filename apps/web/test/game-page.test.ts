// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameContext, GameMetadata, GameModule, NewGameOptions } from '@wp/game-core';
import { createMemoryLibraryStore, createMemoryStore, createSave, type LibraryStore, type SaveStore } from '@wp/persistence';
import type { AppContext, UiTranslator } from '../src/app';
import { renderGamePage } from '../src/pages/game';

// Build-time constants normally injected by vite.config.ts.
vi.hoisted(() => {
  Object.assign(globalThis, { __WP_VERSION__: 'test', __WP_LEGAL__: { name: '', address: [], email: '' } });
});
const registry = vi.hoisted(() => ({ entries: new Map<string, { metadata: unknown; load: () => Promise<unknown> }>() }));
// The real registry needs the build-time catalogue; the host only uses `findGame`.
vi.mock('../src/registry', () => ({ findGame: (id: string) => registry.entries.get(id) }));

const metadata = (id: string): GameMetadata => ({
  id,
  stateVersion: 1,
  skills: ['attention'],
  typicalMinutes: [1, 2],
  inputMethods: ['pointer'],
  capabilities: { offline: true, audio: 'none', aiOptional: false, webgpu: 'none', network: 'none', pauseable: true },
  messages: { en: { title: `Title ${id}`, tagline: 'Tagline', rules: 'Rules' } }
});

/** The context each fake game was created with, by game id. */
const contexts = new Map<string, GameContext>();
/** Every `newGame` options object, by game id. */
const starts = new Map<string, NewGameOptions[]>();

/** A game whose `preload` is controlled by the test and which renders the locale it was preloaded for. */
function fakeGame(id: string, preload?: (locale: string) => Promise<void>, extra: Partial<GameMetadata> = {}, moduleExtra: Partial<Pick<GameModule<{ n: number }>, 'settings' | 'settingsOf'>> = {}) {
  const log: string[] = [];
  let content = '(none)';
  const module: GameModule<{ n: number }> = {
    metadata: { ...metadata(id), ...extra },
    ...moduleExtra,
    isValidState: (value): value is { n: number } => typeof (value as { n?: unknown })?.n === 'number',
    ...(preload
      ? {
          preload: async (locale: string) => {
            log.push(`preload:${locale}`);
            await preload(locale);
            content = `content:${locale}`;
          }
        }
      : {}),
    create: (context: GameContext) => {
      log.push(`create:${context.t.locale}`);
      contexts.set(id, context);
      const render = () => {
        const setup = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Map' });
        context.root.replaceChildren(Object.assign(document.createElement('p'), { textContent: content }), setup);
      };
      return {
        newGame: (options) => {
          log.push(options.difficulty === undefined ? 'newGame' : `newGame:${options.difficulty}`);
          starts.set(id, [...(starts.get(id) ?? []), options]);
          render();
        },
        restore: () => {
          log.push('restore');
          render();
        },
        serialize: () => ({ n: 1 }),
        pause: () => void log.push('pause'),
        resume: () => void log.push('resume'),
        reset: () => undefined,
        dispose: () => context.root.replaceChildren()
      };
    }
  };
  registry.entries.set(id, { metadata: module.metadata, load: async () => module });
  return log;
}

function app(locale: AppContext['locale'], library: LibraryStore = createMemoryLibraryStore(), saves: SaveStore = createMemoryStore()): AppContext {
  const t = Object.assign((key: string) => key, { locale, direction: 'ltr' as const }) as unknown as UiTranslator;
  return {
    locale,
    t,
    store: Promise.resolve(Object.assign(saves, { persistent: true })),
    decks: new Promise(() => undefined),
    learning: new Promise(() => undefined),
    library: Promise.resolve(library),
    navigate: () => undefined,
    setLocale: async () => undefined,
    announce: () => undefined
  };
}

const cleanups: (() => Promise<void>)[] = [];
function open(id: string, locale: AppContext['locale'], library?: LibraryStore) {
  const main = document.createElement('main');
  document.body.append(main);
  cleanups.push(renderGamePage(main, app(locale, library), { name: 'game', id, seed: 7 } as never));
  return main;
}

/** Opens `/games/<id>` as a person would: no seed, no `?new=1` (or with the given route extras). */
function openPlain(id: string, saves?: SaveStore, extras: { difficulty?: string; seed?: number } = {}) {
  const main = document.createElement('main');
  document.body.append(main);
  cleanups.push(renderGamePage(main, app('en', undefined, saves), { name: 'game', id, ...extras }));
  return main;
}

afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
  document.body.innerHTML = '';
  registry.entries.clear();
  contexts.clear();
  starts.clear();
  localStorage.clear();
});

window.matchMedia ??= ((query: string) => ({ matches: false, media: query, addEventListener: () => undefined, removeEventListener: () => undefined })) as never;

describe('game page: optional per-locale preload (ADR 0011)', () => {
  it('awaits preload for the UI locale before creating the game', async () => {
    let release!: () => void;
    const log = fakeGame('slow', () => new Promise<void>((resolve) => (release = resolve)));
    const main = open('slow', 'de');
    await vi.waitFor(() => expect(log).toEqual(['preload:de']));
    // Still loading: nothing created yet.
    await new Promise((r) => setTimeout(r, 10));
    expect(log).toEqual(['preload:de']);
    expect(main.querySelector('[data-testid="loading"]')).not.toBeNull();
    release();
    await vi.waitFor(() => expect(main.querySelector('[data-testid="game-root"] p')?.textContent).toBe('content:de'));
    expect(log).toEqual(['preload:de', 'create:de', 'newGame']);
  });

  it('works unchanged for games without preload', async () => {
    const log = fakeGame('plain');
    const main = open('plain', 'ja');
    await vi.waitFor(() => expect(log).toEqual(['create:ja', 'newGame']));
    expect(main.querySelector('[data-testid="game-root"] p')?.textContent).toBe('(none)');
  });

  it('shows the generic load error when preload fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const log = fakeGame('broken', () => Promise.reject(new Error('offline')));
      const main = open('broken', 'fr');
      await vi.waitFor(() => expect(main.querySelector('[role="alert"]')?.textContent).toBe('game.loadError'));
      expect(log).toEqual(['preload:fr']);
      expect(error).toHaveBeenCalledWith(new Error('offline'));
    } finally {
      error.mockRestore();
    }
  });
});

describe('game page: library for player creations (ADR 0012)', () => {
  it('gives every game a library scoped to its id, backed by the app library store', async () => {
    const store = createMemoryLibraryStore();
    fakeGame('maps-a');
    fakeGame('maps-b');
    open('maps-a', 'en', store);
    open('maps-b', 'en', store);
    await vi.waitFor(() => expect(contexts.size).toBe(2));
    const a = contexts.get('maps-a')!.library!;
    const b = contexts.get('maps-b')!.library!;
    await a.put({ id: 'ridge', name: 'Ridge', data: { cells: [0, 1] } });
    expect(await b.get('ridge')).toBeUndefined();
    expect(await b.list()).toEqual([]);
    expect((await a.list()).map((e) => e.name)).toEqual(['Ridge']);
    expect(await store.counts()).toEqual(new Map([['maps-a', 1]]));
    await expect(a.put({ name: 'Too big', data: 'x'.repeat(70_000) })).rejects.toMatchObject({ reason: 'too-large' });
  });
});

describe('game page: games whose first screen is their own setup (ADR 0015)', () => {
  const diffMessages = { en: { title: 't', tagline: 't', rules: 'r', 'difficulty.easy': 'Easy', 'difficulty.hard': 'Hard' } };
  /** A setup game with difficulties that declares no settings: the difficulty is chosen on the host's start screen. */
  const setupGame = (id: string) => fakeGame(id, undefined, { setupInGame: true, difficulties: ['easy', 'hard'], messages: diffMessages });
  /** A setup game with nothing for the host's start screen. */
  const bareSetupGame = (id: string) => fakeGame(id, undefined, { setupInGame: true });

  it('without a save and with nothing to choose, starts a fresh game directly: the game has focus, New game stays available', async () => {
    const log = bareSetupGame('setup-first');
    const main = openPlain('setup-first');
    await vi.waitFor(() => expect(log).toEqual(['create:en', 'newGame']));
    expect(main.querySelector('.start')).toBeNull();
    expect(main.querySelector('[data-testid="continue"]')).toBeNull();
    expect(main.querySelector<HTMLElement>('[data-testid="game-root"]')!.hidden).toBe(false);
    await vi.waitFor(() => expect(document.activeElement?.textContent).toBe('Map'));
    main.querySelector<HTMLButtonElement>('[data-testid="new-game"]')!.click();
    await vi.waitFor(() => expect(main.querySelector('[data-testid="start-game"]')).not.toBeNull());
    expect(main.querySelector('[data-testid="start-screen"] fieldset, [data-testid="start-screen"] select')).toBeNull();
    main.querySelector<HTMLButtonElement>('[data-testid="start-game"]')!.click();
    await vi.waitFor(() => expect(log).toEqual(['create:en', 'newGame', 'pause', 'resume', 'newGame']));
    expect(starts.get('setup-first')![1]).toEqual({ seed: expect.any(Number), begin: true });
  });

  it('without a save but with difficulties: the start screen has the difficulty; Start passes it and begin, then the game shows its setup', async () => {
    const log = setupGame('setup-diff');
    const main = openPlain('setup-diff');
    await vi.waitFor(() => expect(main.querySelector('[data-testid="difficulty"]')).not.toBeNull());
    expect(log).toEqual([]);
    expect(main.querySelector('[data-testid="continue"]')).toBeNull();
    const hard = main.querySelector<HTMLInputElement>('[data-testid="difficulty"] input[value="hard"]')!;
    hard.checked = true;
    main.querySelector<HTMLFormElement>('[data-testid="start-form"]')!.requestSubmit();
    await vi.waitFor(() => expect(log).toEqual(['create:en', 'newGame:hard']));
    expect(starts.get('setup-diff')![0]).toEqual({ seed: expect.any(Number), difficulty: 'hard', begin: true });
    await vi.waitFor(() => expect(document.activeElement?.textContent).toBe('Map'));
    expect(main.querySelector('[data-testid="settings-summary"]')!.textContent).toBe('Hard');
  });

  it('preselects a valid ?difficulty= on the start screen', async () => {
    setupGame('setup-linked');
    const main = openPlain('setup-linked', undefined, { difficulty: 'hard' });
    await vi.waitFor(() => expect(main.querySelector('[data-testid="difficulty"]')).not.toBeNull());
    expect(main.querySelector<HTMLInputElement>('[data-testid="difficulty"] input:checked')!.value).toBe('hard');
  });

  it('with a save: Continue (and the difficulty for a new game); Continue restores without starting anything', async () => {
    const log = setupGame('setup-saved');
    const saves = createMemoryStore();
    const module = (await registry.entries.get('setup-saved')!.load()) as GameModule<{ n: number }>;
    await saves.write(createSave(module, 3, { n: 1 }, 'hard'));
    const main = openPlain('setup-saved', saves);
    await vi.waitFor(() => expect(main.querySelector('[data-testid="continue"]')).not.toBeNull());
    expect(log).toEqual([]);
    expect(main.querySelector<HTMLInputElement>('[data-testid="difficulty"] input:checked')!.value).toBe('hard');
    expect(main.querySelector<HTMLElement>('[data-testid="game-root"]')!.hidden).toBe(true);
    main.querySelector<HTMLButtonElement>('[data-testid="continue"]')!.click();
    await vi.waitFor(() => expect(log).toEqual(['create:en', 'restore']));
    // The game has focus after Continue, not the page.
    expect(document.activeElement?.textContent).toBe('Map');
    expect(main.querySelector('[data-testid="settings-summary"]')!.textContent).toBe('Hard');
  });

  it('without the flag, shows the start panel unchanged', async () => {
    const log = fakeGame('no-flag');
    const main = openPlain('no-flag');
    await vi.waitFor(() => expect(main.querySelector('.start [data-testid="start-game"]')).not.toBeNull());
    expect(log).toEqual([]);
    expect(main.querySelector<HTMLElement>('[data-testid="game-root"]')!.hidden).toBe(true);
  });

  it('never starts another game after a natural end', async () => {
    const log = bareSetupGame('setup-end');
    const main = openPlain('setup-end');
    await vi.waitFor(() => expect(log).toEqual(['create:en', 'newGame']));
    contexts.get('setup-end')!.finished({ outcome: 'won' });
    await vi.waitFor(() => expect(main.querySelector('[data-testid="finished"]')).not.toBeNull());
    await new Promise((r) => setTimeout(r, 20));
    expect(log).toEqual(['create:en', 'newGame']);
  });
});

describe('game page: setupInGame games that choose the difficulty in their own setup (ADR 0017 amendment)', () => {
  const diffMessages = { en: { title: 't', tagline: 't', rules: 'r', 'difficulty.easy': 'Easy', 'difficulty.hard': 'Hard' } };
  /** Like Relay Command: difficulties, but `settings: []` — the start screen shows only Continue / New game. */
  const ownGame = (id: string, moduleExtra: Partial<Pick<GameModule<{ n: number }>, 'settingsOf'>> = {}) =>
    fakeGame(id, undefined, { setupInGame: true, difficulties: ['easy', 'hard'], messages: diffMessages }, { settings: [], ...moduleExtra });
  const q = <T extends HTMLElement = HTMLElement>(main: HTMLElement, testId: string) => main.querySelector<T>(`[data-testid="${testId}"]`);
  const saveWith = async (id: string, difficulty: string) => {
    const saves = createMemoryStore();
    const module = (await registry.entries.get(id)!.load()) as GameModule<{ n: number }>;
    await saves.write(createSave(module, 3, { n: 1 }, difficulty));
    return saves;
  };

  it('without a save, opens straight into the game\'s own setup (no host difficulty)', async () => {
    const log = ownGame('own-fresh');
    const main = openPlain('own-fresh');
    await vi.waitFor(() => expect(log).toEqual(['create:en', 'newGame']));
    expect(q(main, 'start-screen')).toBeNull();
    expect(q(main, 'difficulty')).toBeNull();
    expect(starts.get('own-fresh')![0]).toEqual({ seed: expect.any(Number) });
    await vi.waitFor(() => expect(document.activeElement?.textContent).toBe('Map'));
  });

  it('setDifficulty reaches the save envelope and the summary; Another round passes it back with begin', async () => {
    ownGame('own-report');
    const saves = createMemoryStore();
    const main = openPlain('own-report', saves);
    await vi.waitFor(() => expect(contexts.has('own-report')).toBe(true));
    const context = contexts.get('own-report')!;
    context.setDifficulty!('zzz');
    context.setDifficulty!('hard');
    context.requestSave();
    await vi.waitFor(async () => expect(await saves.read('own-report')).toMatchObject({ difficulty: 'hard' }));
    expect(q(main, 'settings-summary')!.textContent).toBe('Hard');
    context.finished({ outcome: 'won' });
    await vi.waitFor(() => expect(q(main, 'another-round')).not.toBeNull());
    q(main, 'another-round')!.click();
    await vi.waitFor(() => expect(starts.get('own-report')).toHaveLength(2));
    expect(starts.get('own-report')![1]).toEqual({ seed: expect.any(Number), difficulty: 'hard', begin: true });
  });

  it('during play, New game shows Continue and a New game button (no empty form); it starts the own setup with the difficulty and begin', async () => {
    const log = ownGame('own-toolbar');
    const main = openPlain('own-toolbar');
    await vi.waitFor(() => expect(contexts.has('own-toolbar')).toBe(true));
    contexts.get('own-toolbar')!.setDifficulty!('easy');
    q(main, 'new-game')!.click();
    await vi.waitFor(() => expect(q(main, 'start-game')).not.toBeNull());
    expect(q(main, 'start-form')).toBeNull();
    expect(q(main, 'start-game')!.textContent).toBe('game.newGame');
    expect(q(main, 'continue')).not.toBeNull();
    q(main, 'start-game')!.click();
    await vi.waitFor(() => expect(starts.get('own-toolbar')).toHaveLength(2));
    expect(starts.get('own-toolbar')![1]).toEqual({ seed: expect.any(Number), difficulty: 'easy', begin: true });
    expect(log).toEqual(['create:en', 'newGame', 'pause', 'resume', 'newGame:easy']);
  });

  it('with a save: Continue restores it (difficulty from the envelope); New game passes it and begin', async () => {
    const log = ownGame('own-saved');
    const saves = await saveWith('own-saved', 'hard');
    const main = openPlain('own-saved', saves);
    await vi.waitFor(() => expect(q(main, 'continue')).not.toBeNull());
    expect(log).toEqual([]);
    expect(q(main, 'start-form')).toBeNull();
    expect(q(main, 'difficulty')).toBeNull();
    expect(document.activeElement).toBe(q(main, 'continue'));
    q(main, 'continue')!.click();
    await vi.waitFor(() => expect(log).toEqual(['create:en', 'restore']));
    expect(q(main, 'settings-summary')!.textContent).toBe('Hard');
  });

  it('with a save: New game starts the own setup with the save\'s difficulty and begin', async () => {
    const log = ownGame('own-saved-new');
    const saves = await saveWith('own-saved-new', 'hard');
    const main = openPlain('own-saved-new', saves);
    await vi.waitFor(() => expect(q(main, 'start-game')).not.toBeNull());
    q(main, 'start-game')!.click();
    await vi.waitFor(() => expect(log).toEqual(['create:en', 'newGame:hard']));
    expect(starts.get('own-saved-new')![0]).toEqual({ seed: expect.any(Number), difficulty: 'hard', begin: true });
  });

  it('takes the difficulty of a save from settingsOf(state) over the envelope', async () => {
    ownGame('own-derived', { settingsOf: () => ({ difficulty: 'easy' }) });
    const saves = await saveWith('own-derived', 'hard');
    const main = openPlain('own-derived', saves);
    await vi.waitFor(() => expect(q(main, 'continue')).not.toBeNull());
    q(main, 'continue')!.click();
    await vi.waitFor(() => expect(contexts.has('own-derived')).toBe(true));
    expect(q(main, 'settings-summary')!.textContent).toBe('Easy');
    contexts.get('own-derived')!.finished({ outcome: 'won' });
    await vi.waitFor(() => expect(q(main, 'another-round')).not.toBeNull());
    q(main, 'another-round')!.click();
    await vi.waitFor(() => expect(starts.get('own-derived')).toHaveLength(1));
    expect(starts.get('own-derived')![0]).toMatchObject({ difficulty: 'easy', begin: true });
  });

  it('a ?difficulty= link passes a valid difficulty to newGame (on opening and as a seed deep link); junk is dropped', async () => {
    ownGame('own-link');
    openPlain('own-link', undefined, { difficulty: 'hard' });
    await vi.waitFor(() => expect(starts.get('own-link')).toHaveLength(1));
    expect(starts.get('own-link')![0]).toEqual({ seed: expect.any(Number), difficulty: 'hard' });

    ownGame('own-deep');
    openPlain('own-deep', undefined, { seed: 5, difficulty: 'easy' });
    await vi.waitFor(() => expect(starts.get('own-deep')).toHaveLength(1));
    expect(starts.get('own-deep')![0]).toEqual({ seed: 5, difficulty: 'easy' });

    ownGame('own-junk');
    openPlain('own-junk', undefined, { difficulty: 'zzz' });
    await vi.waitFor(() => expect(starts.get('own-junk')).toHaveLength(1));
    expect(starts.get('own-junk')![0]).toEqual({ seed: expect.any(Number) });
  });
});

describe('game page: one start screen with host-drawn settings (ADR 0017)', () => {
  const en = {
    title: 'Demo', tagline: 't', rules: 'r',
    'difficulty.easy': 'Easy', 'difficulty.hard': 'Hard',
    'set.mode': 'Opponent', 'mode.computer': 'Computer', 'mode.person': 'Person',
    'set.size': 'Board', 'size.4': 'Four', 'size.5': 'Five', 'size.6': 'Six', 'size.7': 'Seven', 'size.8': 'Eight',
    'set.hints': 'Hints', 'hint.hints': 'Shows a hint after each move.', 'set.rounds': 'Rounds'
  };
  const declare = (id: string, extra: Partial<Pick<GameModule<{ n: number }>, 'settingsOf'>> = {}) =>
    fakeGame(id, undefined, { difficulties: ['easy', 'hard'], messages: { en } }, {
      ...extra,
      settings: [
        { kind: 'choice', id: 'mode', labelKey: 'set.mode', values: ['computer', 'person'], valueKey: 'mode', default: 'computer' },
        { kind: 'difficulty', when: { mode: ['computer'] } },
        { kind: 'choice', id: 'size', labelKey: 'set.size', values: [4, 5, 6, 7, 8], valueKey: 'size', default: 6 },
        { kind: 'toggle', id: 'hints', labelKey: 'set.hints', default: false, hintKey: 'hint.hints' },
        { kind: 'number', id: 'rounds', labelKey: 'set.rounds', min: 1, max: 9, default: 3 }
      ]
    });
  const q = <T extends HTMLElement = HTMLElement>(main: HTMLElement, testId: string) => main.querySelector<T>(`[data-testid="${testId}"]`);
  const ready = (main: HTMLElement) => vi.waitFor(() => expect(q(main, 'start-game')).not.toBeNull());
  const pick = (main: HTMLElement, testId: string, value: string) => {
    const radio = q(main, testId)!.querySelector<HTMLInputElement>(`input[value="${value}"]`)!;
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const submit = (main: HTMLElement) => q<HTMLFormElement>(main, 'start-form')!.requestSubmit();

  it('draws every setting in a labelled form: radios for short lists, a select for long ones, checkbox, number; Start has focus', async () => {
    declare('demo');
    const main = openPlain('demo');
    await ready(main);
    const form = q(main, 'start-form')!;
    expect(form.getAttribute('aria-labelledby')).toBe(form.querySelector('h2')!.id);
    expect(q(main, 'setting-mode')!.tagName).toBe('FIELDSET');
    expect(q(main, 'setting-mode')!.querySelector('legend')!.textContent).toBe('Opponent');
    expect([...q(main, 'difficulty')!.querySelectorAll('label')].map((l) => l.textContent)).toEqual(['Easy', 'Hard']);
    expect(q<HTMLSelectElement>(main, 'setting-size')!.tagName).toBe('SELECT');
    expect(q<HTMLSelectElement>(main, 'setting-size')!.value).toBe('6');
    expect(main.querySelector(`label[for="setting-size"]`)!.textContent).toBe('Board');
    const hints = q<HTMLInputElement>(main, 'setting-hints')!;
    expect(hints.type).toBe('checkbox');
    expect(document.getElementById(hints.getAttribute('aria-describedby')!)!.textContent).toBe('Shows a hint after each move.');
    expect(q<HTMLInputElement>(main, 'setting-rounds')!.type).toBe('number');
    expect(q(main, 'continue')).toBeNull();
    expect(document.activeElement).toBe(q(main, 'start-game'));
  });

  it('hides (and skips) settings whose condition does not hold', async () => {
    const log = declare('cond');
    const main = openPlain('cond');
    await ready(main);
    pick(main, 'setting-mode', 'person');
    expect(q(main, 'difficulty')!.hidden).toBe(true);
    expect(q(main, 'difficulty')!.querySelector('input')!.disabled).toBe(true);
    submit(main);
    await vi.waitFor(() => expect(log).toContain('newGame'));
    expect(starts.get('cond')).toEqual([{ seed: expect.any(Number), settings: { mode: 'person', size: 6, hints: false, rounds: 3 }, begin: true }]);
  });

  it('Start passes difficulty, settings and begin, remembers them and shows a summary in the toolbar', async () => {
    declare('start');
    const main = openPlain('start');
    await ready(main);
    pick(main, 'difficulty', 'hard');
    q<HTMLSelectElement>(main, 'setting-size')!.value = '8';
    q<HTMLInputElement>(main, 'setting-hints')!.checked = true;
    q<HTMLInputElement>(main, 'setting-rounds')!.value = '5';
    submit(main);
    await vi.waitFor(() => expect(starts.get('start')).toHaveLength(1));
    expect(starts.get('start')![0]).toEqual({ seed: expect.any(Number), difficulty: 'hard', settings: { mode: 'computer', size: 8, hints: true, rounds: 5 }, begin: true });
    expect(q(main, 'settings-summary')!.textContent).toBe('Computer · Hard · Eight · Hints · Rounds: 5');
    // During play: only "New game" (no difficulty select).
    expect(main.querySelector('.host-panel select, .host-panel fieldset')).toBeNull();
    expect(JSON.parse(localStorage.getItem('wp:pref:start:@settings')!)).toEqual({ mode: 'computer', size: 8, hints: true, rounds: 5, difficulty: 'hard' });
    // The next visit preselects them.
    const again = openPlain('start');
    await ready(again);
    expect(q(again, 'difficulty')!.querySelector<HTMLInputElement>('input:checked')!.value).toBe('hard');
    expect(q<HTMLSelectElement>(again, 'setting-size')!.value).toBe('8');
    expect(q<HTMLInputElement>(again, 'setting-rounds')!.value).toBe('5');
  });

  it('ignores remembered junk and out-of-range values', async () => {
    declare('junk');
    localStorage.setItem('wp:pref:junk:@settings', JSON.stringify({ size: 11, rounds: 'many', difficulty: 'brutal', extra: true, mode: 'person' }));
    const main = openPlain('junk');
    await ready(main);
    expect(q<HTMLSelectElement>(main, 'setting-size')!.value).toBe('6');
    expect(q<HTMLInputElement>(main, 'setting-rounds')!.value).toBe('3');
    expect(q(main, 'setting-mode')!.querySelector<HTMLInputElement>('input:checked')!.value).toBe('person');
    expect(q(main, 'difficulty')!.querySelector<HTMLInputElement>('input:checked')!.value).toBe('easy');
  });

  it('New game during play opens the start screen; Continue returns to the same running game', async () => {
    const log = declare('back');
    const main = openPlain('back');
    await ready(main);
    submit(main);
    await vi.waitFor(() => expect(q(main, 'new-game')).not.toBeNull());
    q(main, 'new-game')!.click();
    await vi.waitFor(() => expect(q(main, 'continue')).not.toBeNull());
    expect(q(main, 'game-root')!.hidden).toBe(true);
    expect(document.activeElement).toBe(q(main, 'continue'));
    q(main, 'continue')!.click();
    expect(q(main, 'game-root')!.hidden).toBe(false);
    expect(log).toEqual(['create:en', 'newGame:easy', 'pause', 'resume']);
    expect(q(main, 'new-game')).not.toBeNull();
  });

  it('after a natural end: Another round repeats the settings, Change settings opens the start screen', async () => {
    declare('end');
    const main = openPlain('end');
    await ready(main);
    pick(main, 'difficulty', 'hard');
    submit(main);
    await vi.waitFor(() => expect(starts.get('end')).toHaveLength(1));
    contexts.get('end')!.finished({ outcome: 'won' });
    await vi.waitFor(() => expect(q(main, 'another-round')).not.toBeNull());
    q(main, 'another-round')!.click();
    await vi.waitFor(() => expect(starts.get('end')).toHaveLength(2));
    expect(starts.get('end')![1]).toEqual({ seed: expect.any(Number), difficulty: 'hard', settings: { mode: 'computer', size: 6, hints: false, rounds: 3 }, begin: true });
    contexts.get('end')!.finished({ outcome: 'lost' });
    await vi.waitFor(() => expect(q(main, 'change-settings')).not.toBeNull());
    q(main, 'change-settings')!.click();
    await vi.waitFor(() => expect(q(main, 'start-game')).not.toBeNull());
    expect(q(main, 'finished')!.closest<HTMLElement>('.finished-slot')!.hidden).toBe(true);
  });

  it('stores the settings in the save; a resumed game repeats them on Another round', async () => {
    declare('saved');
    const saves = createMemoryStore();
    const module = (await registry.entries.get('saved')!.load()) as GameModule<{ n: number }>;
    await saves.write(createSave(module, 3, { n: 1 }, { difficulty: 'hard', settings: { mode: 'computer', size: 7, hints: true, rounds: 9 } }));
    const main = openPlain('saved', saves);
    await vi.waitFor(() => expect(q(main, 'continue')).not.toBeNull());
    // The start screen preselects the save's settings when nothing is remembered.
    expect(q<HTMLSelectElement>(main, 'setting-size')!.value).toBe('7');
    q(main, 'continue')!.click();
    await vi.waitFor(() => expect(contexts.has('saved')).toBe(true));
    contexts.get('saved')!.finished({ outcome: 'won' });
    await vi.waitFor(() => expect(q(main, 'another-round')).not.toBeNull());
    q(main, 'another-round')!.click();
    await vi.waitFor(() => expect(starts.get('saved')).toHaveLength(1));
    expect(starts.get('saved')![0]).toMatchObject({ difficulty: 'hard', settings: { size: 7, hints: true, rounds: 9 } });
    await vi.waitFor(async () => expect(await saves.read('saved')).toMatchObject({ difficulty: 'hard', settings: { mode: 'computer', size: 7, hints: true, rounds: 9 } }));
  });

  it('remembers by merging: a setting hidden at Start keeps its last value for the next time it is shown', async () => {
    declare('merge');
    const main = openPlain('merge');
    await ready(main);
    pick(main, 'difficulty', 'hard');
    submit(main);
    await vi.waitFor(() => expect(starts.get('merge')).toHaveLength(1));
    // Two people: the strength is hidden and not passed, but stays remembered.
    q(main, 'new-game')!.click();
    await ready(main);
    pick(main, 'setting-mode', 'person');
    submit(main);
    await vi.waitFor(() => expect(starts.get('merge')).toHaveLength(2));
    expect(starts.get('merge')![1]!.difficulty).toBeUndefined();
    expect(JSON.parse(localStorage.getItem('wp:pref:merge:@settings')!)).toMatchObject({ mode: 'person', difficulty: 'hard' });
    // Back to the computer: Hard is still selected.
    q(main, 'new-game')!.click();
    await ready(main);
    pick(main, 'setting-mode', 'computer');
    expect(q(main, 'difficulty')!.querySelector<HTMLInputElement>('input:checked')!.value).toBe('hard');
    const again = openPlain('merge');
    await ready(again);
    pick(again, 'setting-mode', 'computer');
    expect(q(again, 'difficulty')!.querySelector<HTMLInputElement>('input:checked')!.value).toBe('hard');
  });

  describe('saves written before the envelope kept the settings', () => {
    /** An old save (no `settings`) whose state holds the setup; `settingsOf` reads it. */
    const oldSave = async (id: string, state: Record<string, unknown>, difficulty?: string) => {
      const saves = createMemoryStore();
      const module = (await registry.entries.get(id)!.load()) as GameModule<{ n: number }>;
      await saves.write(createSave(module, 3, { n: 1, ...state } as { n: number }, difficulty));
      return saves;
    };
    const fromState = (state: { n: number }) => {
      const { n: _n, ...setup } = state as { n: number } & Record<string, string | number | boolean>;
      return setup;
    };

    it('uses settingsOf: the summary and Another round follow the state, not the remembered settings', async () => {
      declare('old', { settingsOf: fromState });
      localStorage.setItem('wp:pref:old:@settings', JSON.stringify({ mode: 'computer', size: 4, difficulty: 'easy' }));
      const saves = await oldSave('old', { mode: 'person', size: 8, hints: true, rounds: 7 });
      const main = openPlain('old', saves);
      await vi.waitFor(() => expect(q(main, 'continue')).not.toBeNull());
      q(main, 'continue')!.click();
      await vi.waitFor(() => expect(q(main, 'settings-summary')).not.toBeNull());
      expect(q(main, 'settings-summary')!.textContent).toBe('Person · Eight · Hints · Rounds: 7');
      contexts.get('old')!.finished({ outcome: 'won' });
      await vi.waitFor(() => expect(q(main, 'another-round')).not.toBeNull());
      q(main, 'another-round')!.click();
      await vi.waitFor(() => expect(starts.get('old')).toHaveLength(1));
      expect(starts.get('old')![0]).toEqual({ seed: expect.any(Number), settings: { mode: 'person', size: 8, hints: true, rounds: 7 }, begin: true });
    });

    it('takes the difficulty from the state over the envelope (renamed by a migration)', async () => {
      declare('renamed', { settingsOf: fromState });
      const saves = await oldSave('renamed', { mode: 'computer', size: 6, hints: false, rounds: 3, difficulty: 'easy' }, 'hard');
      const main = openPlain('renamed', saves);
      await vi.waitFor(() => expect(q(main, 'continue')).not.toBeNull());
      q(main, 'continue')!.click();
      await vi.waitFor(() => expect(q(main, 'settings-summary')).not.toBeNull());
      expect(q(main, 'settings-summary')!.textContent).toBe('Computer · Easy · Six · Rounds: 3');
    });

    it('without settingsOf (or when it cannot tell everything): no summary, only Change settings', async () => {
      declare('untold', { settingsOf: () => ({ mode: 'computer', difficulty: 'hard' }) });
      localStorage.setItem('wp:pref:untold:@settings', JSON.stringify({ size: 4 }));
      const saves = await oldSave('untold', {}, 'easy');
      const main = openPlain('untold', saves);
      await vi.waitFor(() => expect(q(main, 'continue')).not.toBeNull());
      q(main, 'continue')!.click();
      await vi.waitFor(() => expect(q(main, 'new-game')).not.toBeNull());
      expect(q(main, 'settings-summary')).toBeNull();
      contexts.get('untold')!.finished({ outcome: 'won' });
      await vi.waitFor(() => expect(q(main, 'change-settings')).not.toBeNull());
      expect(q(main, 'another-round')).toBeNull();
      // The save keeps not pretending to know the settings.
      await vi.waitFor(async () => expect(await saves.read('untold')).toMatchObject({ difficulty: 'hard' }));
      expect((await saves.read('untold'))!.settings).toBeUndefined();
      // Change settings: the start screen with what is known (difficulty) over the remembered settings.
      q(main, 'change-settings')!.click();
      await ready(main);
      expect(q(main, 'difficulty')!.querySelector<HTMLInputElement>('input:checked')!.value).toBe('hard');
      expect(q<HTMLSelectElement>(main, 'setting-size')!.value).toBe('4');
    });

    it('a game with only the difficulty: a valid envelope difficulty is enough; junk is never shown', async () => {
      fakeGame('only-diff', undefined, { difficulties: ['easy', 'hard'], messages: { en } });
      const saves = await oldSave('only-diff', {}, 'hard');
      const main = openPlain('only-diff', saves);
      await vi.waitFor(() => expect(q(main, 'continue')).not.toBeNull());
      q(main, 'continue')!.click();
      await vi.waitFor(() => expect(q(main, 'settings-summary')).not.toBeNull());
      expect(q(main, 'settings-summary')!.textContent).toBe('Hard');

      fakeGame('junk-diff', undefined, { difficulties: ['easy', 'hard'], messages: { en } });
      const junk = await oldSave('junk-diff', {}, 'brutal');
      const other = openPlain('junk-diff', junk);
      await vi.waitFor(() => expect(q(other, 'continue')).not.toBeNull());
      expect(q(other, 'difficulty')!.querySelector<HTMLInputElement>('input:checked')!.value).toBe('easy');
      q(other, 'continue')!.click();
      await vi.waitFor(() => expect(contexts.has('junk-diff')).toBe(true));
      expect(other.textContent).not.toContain('difficulty.');
      expect(q(other, 'settings-summary')).toBeNull();
      contexts.get('junk-diff')!.finished({ outcome: 'won' });
      await vi.waitFor(() => expect(q(other, 'change-settings')).not.toBeNull());
      expect(q(other, 'another-round')).toBeNull();
    });

    it('a throwing settingsOf counts as telling nothing', async () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      try {
        declare('throws', { settingsOf: () => { throw new Error('x'); } });
        const saves = await oldSave('throws', {}, 'hard');
        const main = openPlain('throws', saves);
        await vi.waitFor(() => expect(q(main, 'continue')).not.toBeNull());
        q(main, 'continue')!.click();
        await vi.waitFor(() => expect(q(main, 'new-game')).not.toBeNull());
        expect(q(main, 'settings-summary')).toBeNull();
      } finally {
        error.mockRestore();
      }
    });
  });

  it('a deep link starts at once with the remembered settings, overridden by ?difficulty=', async () => {
    declare('deep');
    localStorage.setItem('wp:pref:deep:@settings', JSON.stringify({ size: 4, difficulty: 'easy' }));
    openPlain('deep', undefined, { seed: 5, difficulty: 'hard' });
    await vi.waitFor(() => expect(starts.get('deep')).toHaveLength(1));
    expect(starts.get('deep')![0]).toEqual({ seed: 5, difficulty: 'hard', settings: { mode: 'computer', size: 4, hints: false, rounds: 3 } });
  });

  it('games without declared settings get the difficulty only', async () => {
    fakeGame('plain-diff', undefined, { difficulties: ['easy', 'hard'], messages: { en: { title: 't', tagline: 't', rules: 'r', 'difficulty.easy': 'Easy', 'difficulty.hard': 'Hard' } } });
    const main = openPlain('plain-diff');
    await ready(main);
    expect(main.querySelectorAll('.setting')).toHaveLength(1);
    expect(q(main, 'difficulty')!.querySelector('legend')!.textContent).toBe('game.difficulty');
  });
});
