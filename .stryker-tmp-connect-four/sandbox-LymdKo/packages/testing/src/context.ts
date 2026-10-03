// @ts-nocheck
import type { GameContext, GameModule, GameResult } from '@wp/game-core';
import { COMMON_MESSAGES, createTranslator, type SupportedLocale } from '@wp/localization';

export interface TestContext {
  context: GameContext;
  saveRequests: () => number;
  results: GameResult[];
  missingKeys: string[];
}

/** Builds a `GameContext` for unit tests (requires a DOM, e.g. `// @vitest-environment jsdom`). */
export function createTestContext(module: GameModule<unknown>, locale: SupportedLocale = 'en', root: HTMLElement = document.createElement('div')): TestContext {
  let saves = 0;
  const results: GameResult[] = [];
  const missingKeys: string[] = [];
  document.body.appendChild(root);
  const t = createTranslator({
    locale,
    sources: [module.metadata.messages, COMMON_MESSAGES],
    onMissing: (key) => missingKeys.push(key)
  });
  return {
    context: {
      root,
      t,
      reducedMotion: true,
      requestSave: () => void saves++,
      finished: (result) => void results.push(result)
    },
    saveRequests: () => saves,
    results,
    missingKeys
  };
}
