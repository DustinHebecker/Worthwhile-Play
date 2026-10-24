import { defineGame, type SettingSpec } from '@wp/game-core';
import { preloadContent } from './content';
import { metadata } from './metadata';
import { isPdState, settingsOf, type PdState } from './rules';
import { createProbabilityDetective } from './view';

export type { PdState } from './rules';

/** The start screen (ADR 0017): the difficulty. The modes "Choose the checks" and "Thinking traps" are not built yet. */
export const settings: readonly SettingSpec[] = [{ kind: 'difficulty' }];

export default defineGame<PdState>({
  metadata,
  settings,
  settingsOf,
  create: createProbabilityDetective,
  isValidState: isPdState,
  preload: preloadContent
});
