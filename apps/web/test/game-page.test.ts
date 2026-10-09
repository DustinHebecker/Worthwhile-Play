// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameContext, GameMetadata, GameModule } from '@wp/game-core';
import { createMemoryStore } from '@wp/persistence';
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

/** A game whose `preload` is controlled by the test and which renders the locale it was preloaded for. */
function fakeGame(id: string, preload?: (locale: string) => Promise<void>) {
  const log: string[] = [];
  let content = '(none)';
  const module: GameModule<{ n: number }> = {
    metadata: metadata(id),
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
      return {
        newGame: () => {
          log.push('newGame');
          context.root.replaceChildren(Object.assign(document.createElement('p'), { textContent: content }));
        },
        restore: () => undefined,
        serialize: () => ({ n: 1 }),
        pause: () => undefined,
        resume: () => undefined,
        reset: () => undefined,
        dispose: () => context.root.replaceChildren()
      };
    }
  };
  registry.entries.set(id, { metadata: module.metadata, load: async () => module });
  return log;
}

function app(locale: AppContext['locale']): AppContext {
  const t = Object.assign((key: string) => key, { locale, direction: 'ltr' as const }) as unknown as UiTranslator;
  return {
    locale,
    t,
    store: Promise.resolve(Object.assign(createMemoryStore(), { persistent: true })),
    decks: new Promise(() => undefined),
    learning: new Promise(() => undefined),
    navigate: () => undefined,
    setLocale: async () => undefined,
    announce: () => undefined
  };
}

const cleanups: (() => Promise<void>)[] = [];
function open(id: string, locale: AppContext['locale']) {
  const main = document.createElement('main');
  document.body.append(main);
  cleanups.push(renderGamePage(main, app(locale), { name: 'game', id, seed: 7 } as never));
  return main;
}

afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
  document.body.innerHTML = '';
  registry.entries.clear();
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
    await vi.waitFor(() => expect(main.querySelector('[data-testid="game-root"]')?.textContent).toBe('content:de'));
    expect(log).toEqual(['preload:de', 'create:de', 'newGame']);
  });

  it('works unchanged for games without preload', async () => {
    const log = fakeGame('plain');
    const main = open('plain', 'ja');
    await vi.waitFor(() => expect(log).toEqual(['create:ja', 'newGame']));
    expect(main.querySelector('[data-testid="game-root"]')?.textContent).toBe('(none)');
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
