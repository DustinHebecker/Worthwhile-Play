import type { GameContext, GameModule, GameResult } from '@wp/game-core';
import { COMMON_MESSAGES, createTranslator, type SupportedLocale } from '@wp/localization';

export interface TestContext {
  context: GameContext;
  saveRequests: () => number;
  results: GameResult[];
  missingKeys: string[];
  /** Difficulties the game reported via `setDifficulty`, in order. */
  difficulties: string[];
  /** Backing map of `context.preferences` (keys as passed by the game). */
  preferences: Map<string, unknown>;
}

/** Optional host services a test can provide (content languages from Settings, the user's decks, learning records, launch options). */
export type TestContextExtras = Partial<Pick<GameContext, 'contentLanguages' | 'userDecks' | 'learning' | 'launch'>>;

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
      ...extras
    },
    saveRequests: () => saves,
    results,
    missingKeys,
    difficulties,
    preferences
  };
}
