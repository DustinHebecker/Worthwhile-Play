import type { GameContext, GameLibrary, GameModule, GameResult } from '@wp/game-core';
import { COMMON_MESSAGES, createTranslator, type SupportedLocale } from '@wp/localization';
import { createGameLibrary, createMemoryLibraryStore, type LibraryStore } from '@wp/persistence';

export interface TestContext {
  context: GameContext;
  saveRequests: () => number;
  results: GameResult[];
  missingKeys: string[];
  /** Difficulties the game reported via `setDifficulty`, in order. */
  difficulties: string[];
  /** Backing map of `context.preferences` (keys as passed by the game). */
  preferences: Map<string, unknown>;
  /** `context.library`: in memory, with the app's bounds, unless the test passed its own (or `library: undefined`). */
  library: GameLibrary | undefined;
}

/**
 * Optional host services a test can provide (content languages from Settings, the user's decks, learning records,
 * launch options, the game's library). Pass a `createTestLibrary` result to share a library between contexts
 * (e.g. to check that a map saved in one session can be loaded in the next), or `library: undefined` to test a
 * host without one.
 */
export type TestContextExtras = Partial<Pick<GameContext, 'contentLanguages' | 'userDecks' | 'learning' | 'launch'>> & { library?: GameLibrary | undefined };

/**
 * An in-memory `GameContext.library` for one game, with the same validation and bounds as the app (ADR 0012).
 * `store` is the backing store (all games), e.g. to inspect raw rows or put junk in for validation tests.
 */
export function createTestLibrary(gameId: string, store: LibraryStore = createMemoryLibraryStore()): { library: GameLibrary; store: LibraryStore } {
  return { library: createGameLibrary(store, gameId), store };
}

/** Builds a `GameContext` for unit tests (requires a DOM, e.g. `// @vitest-environment jsdom`). */
export function createTestContext(
  module: GameModule<unknown>,
  locale: SupportedLocale = 'en',
  root: HTMLElement = document.createElement('div'),
  extras: TestContextExtras = {}
): TestContext {
  let saves = 0;
  const results: GameResult[] = [];
  const missingKeys: string[] = [];
  document.body.appendChild(root);
  const t = createTranslator({
    locale,
    sources: [module.metadata.messages, COMMON_MESSAGES],
    onMissing: (key) => missingKeys.push(key)
  });
  const difficulties: string[] = [];
  const preferences = new Map<string, unknown>();
  const { library: requested, ...services } = extras;
  // A fresh in-memory library per context by default; `library: undefined` leaves it out.
  const library = 'library' in extras ? requested : createTestLibrary(module.metadata.id).library;
  return {
    context: {
      root,
      t,
      reducedMotion: true,
      requestSave: () => void saves++,
      finished: (result) => void results.push(result),
      setDifficulty: (difficulty) => void difficulties.push(difficulty),
      preferences: {
        // JSON round trip, like the app's storage, so games cannot rely on object identity.
        get: (key) => (preferences.has(key) ? (JSON.parse(JSON.stringify(preferences.get(key))) as unknown) : undefined),
        set: (key, value) => void (value === undefined ? preferences.delete(key) : preferences.set(key, JSON.parse(JSON.stringify(value)) as unknown))
      },
      ...services,
      ...(library ? { library } : {})
    },
    saveRequests: () => saves,
    results,
    missingKeys,
    difficulties,
    preferences,
    library
  };
}
