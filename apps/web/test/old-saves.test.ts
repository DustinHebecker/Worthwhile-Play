// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hostSettings, resolveSettings, type GameContext, type GameModule, type NewGameOptions, type SettingValue } from '@wp/game-core';
import { createMemoryDeckStore, createMemoryLearningStore, createMemoryLibraryStore, createMemoryStore, createSave, type SaveStore } from '@wp/persistence';
import type { AppContext, UiTranslator } from '../src/app';
import { renderGamePage } from '../src/pages/game';
import { settingsSummary } from '../src/pages/setup-form';
import { gameTranslator } from '../src/pages/shared';

// Build-time constants normally injected by vite.config.ts.
vi.hoisted(() => {
  Object.assign(globalThis, { __WP_VERSION__: 'test', __WP_LEGAL__: { name: '', address: [], email: '' } });
});
const registry = vi.hoisted(() => ({ entries: new Map<string, { metadata: unknown; load: () => Promise<unknown> }>() }));
vi.mock('../src/registry', () => ({ findGame: (id: string) => registry.entries.get(id) }));
window.matchMedia ??= ((query: string) => ({ matches: false, media: query, addEventListener: () => undefined, removeEventListener: () => undefined })) as never;

const t = Object.assign((key: string) => key, { locale: 'en', direction: 'ltr' as const }) as unknown as UiTranslator;
const app = (saves: SaveStore): AppContext => ({
  locale: 'en',
  t,
  store: Promise.resolve(Object.assign(saves, { persistent: true })),
  decks: Promise.resolve(createMemoryDeckStore()),
  learning: Promise.resolve(createMemoryLearningStore()),
  library: Promise.resolve(createMemoryLibraryStore()),
  navigate: () => undefined,
  setLocale: async () => undefined,
  announce: () => undefined
});

/** Registers a real game, recording the options of every `newGame` the host calls and the context it got. */
function register(module: GameModule<unknown>): { starts: NewGameOptions[]; contexts: GameContext[] } {
  const starts: NewGameOptions[] = [];
  const contexts: GameContext[] = [];
  const wrapped: GameModule<unknown> = {
    ...module,
    create: (context) => {
      contexts.push(context);
      const instance = module.create(context);
      const newGame = instance.newGame.bind(instance);
      instance.newGame = (options) => {
        starts.push(options);
        newGame(options);
      };
      return instance;
    }
  };
  registry.entries.set(module.metadata.id, { metadata: module.metadata, load: async () => wrapped });
  return { starts, contexts };
}

const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
  document.body.innerHTML = '';
  registry.entries.clear();
  localStorage.clear();
});

const q = (main: HTMLElement, id: string) => main.querySelector<HTMLElement>(`[data-testid="${id}"]`);

/** Opens the game page with `saves` and presses Continue. */
async function continueSave(id: string, saves: SaveStore): Promise<HTMLElement> {
  const main = document.createElement('main');
  document.body.append(main);
  cleanups.push(renderGamePage(main, app(saves), { name: 'game', id }));
  await vi.waitFor(() => expect(q(main, 'continue')).not.toBeNull(), { timeout: 5000 });
  q(main, 'continue')!.click();
  await vi.waitFor(() => expect(q(main, 'new-game')).not.toBeNull(), { timeout: 5000 });
  return main;
}

/** Remembered start-screen choices that differ from every setup below, so a fallback to them would show. */
const REMEMBERED = { difficulty: 'easy', game: 'computer', opponent: 'computer', mode: 'computer', variant: 'classic', opponents: 1, cards: 'symbols', language: 'en', strict: false, series: 3, scoring: 'simple', ramsch: false, pace: 'self', deck: 'first-words', direction: 'forward', map: 'random' };

/** A non-default setup per game, as chosen on the start screen (difficulty under `difficulty`). */
const SETUPS: Record<string, Record<string, SettingValue>> = {
  chess: { game: 'human' },
  'connect-four': { opponent: 'computer', starter: 'computer', difficulty: 'hard', size: '9x7', goal: 5, rule: 'pullOut' },
  'tic-tac-toe': { variant: 'order-chaos', opponent: 'computer', role: 'chaos', difficulty: 'perfect' },
  'stack-duel': { mode: 'solo', difficulty: 'hard' },
  'node-conquest': { difficulty: 'master', map: '5', opponents: 3 },
  memory: { difficulty: 'large', cards: 'flag-country' },
  'word-guess': { difficulty: 'hard', language: 'de', strict: true },
  poker: { difficulty: 'hard', opponents: 5 },
  skat: { difficulty: 'hard', series: 12, scoring: 'seeger', ramsch: true },
  'n-back': { difficulty: 'n3', variant: 'dual', pace: 'timed' },
  review: { deck: 'flags', direction: 'backward', mode: 'practice' }
};

const load = async (id: string): Promise<GameModule<unknown>> => {
  const module = ((await import(`../../../packages/games/${id}/src/index.ts`)) as { default: GameModule<unknown> }).default;
  await module.preload?.('en');
  return module;
};

describe('saves written before the envelope kept the settings (ADR 0017)', () => {
  for (const [id, setup] of Object.entries(SETUPS)) {
    it(`${id}: the summary and "Another round" follow the saved game, not the remembered settings`, async () => {
      const module = await load(id);
      const registered = register(module);
      // The game as it was started (seed 1), saved the old way: no settings, only the envelope's difficulty.
      // Like the host, which provides learning records to games that use them (so Review offers its mode).
      const learning = { today: () => '2026-01-01', list: () => [], record: () => undefined };
      const gt = gameTranslator(module.metadata, 'en');
      const extras = module.metadata.usesLearningRecords ? { learning } : {};
      const specs = hostSettings(module, { t: gt, ...extras });
      const chosen = resolveSettings(specs, module.metadata, setup);
      const root = document.createElement('div');
      const instance = module.create({ root, t: gt, reducedMotion: true, requestSave: () => undefined, finished: () => undefined, ...extras });
      instance.newGame({ seed: 1, ...(chosen.difficulty !== undefined ? { difficulty: chosen.difficulty } : {}), settings: chosen.settings, begin: true });
      const state = instance.serialize();
      instance.dispose();
      const saves = createMemoryStore();
      await saves.write(createSave(module, 1, state, 'easy'));
      localStorage.setItem(`wp:pref:${id}:@settings`, JSON.stringify(REMEMBERED));

      const main = await continueSave(id, saves);
      const expected = settingsSummary(specs, chosen, gt, t);
      expect(expected).not.toBe('');
      expect(q(main, 'settings-summary')?.textContent).toBe(expected);

      // After a natural end, "Another round" starts the same setup again.
      const { starts, contexts } = registered;
      expect(starts).toEqual([]);
      contexts.at(-1)!.finished({ outcome: 'completed' });
      await vi.waitFor(() => expect(q(main, 'another-round')).not.toBeNull());
      q(main, 'another-round')!.click();
      await vi.waitFor(() => expect(starts).toHaveLength(1));
      expect(starts[0]).toEqual({ seed: expect.any(Number), ...(chosen.difficulty !== undefined ? { difficulty: chosen.difficulty } : {}), settings: chosen.settings, begin: true });
    });
  }
});

describe('laser-circuit version-1 saves (the envelope names the difficulty the old way)', () => {
  const v1Save = async (difficulty: string) => {
    const module = await load('laser-circuit');
    const registered = register(module);
    const saves = createMemoryStore();
    // Envelope and state of version 1 say `difficulty`; the migration renames the level set (medium → easy).
    await saves.write({ ...createSave(module, 7, { seed: 7, difficulty, level: 2, pieces: [], moves: 0, undo: [] }, difficulty), stateVersion: 1 });
    return { module, registered, saves };
  };

  it('takes the difficulty from the migrated state: summary and "Another round"', async () => {
    const { module, registered, saves } = await v1Save('medium');
    const main = await continueSave('laser-circuit', saves);
    expect(q(main, 'settings-summary')?.textContent).toBe(gameTranslator(module.metadata, 'en')('difficulty.easy'));
    registered.contexts.at(-1)!.finished({ outcome: 'won' });
    await vi.waitFor(() => expect(q(main, 'another-round')).not.toBeNull());
    q(main, 'another-round')!.click();
    await vi.waitFor(() => expect(registered.starts).toHaveLength(1));
    expect(registered.starts[0]).toMatchObject({ difficulty: 'easy', begin: true });
  });

  it('the old introduction levels are no difficulty: no summary, only "Change settings"', async () => {
    const { registered, saves } = await v1Save('easy');
    const main = await continueSave('laser-circuit', saves);
    expect(q(main, 'settings-summary')).toBeNull();
    expect(main.textContent).not.toContain('difficulty.');
    registered.contexts.at(-1)!.finished({ outcome: 'won' });
    await vi.waitFor(() => expect(q(main, 'change-settings')).not.toBeNull());
    expect(q(main, 'another-round')).toBeNull();
  });
});
