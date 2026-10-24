import { defineGame, type SettingSpec } from '@wp/game-core';
import { preloadContent } from './content';
import { metadata } from './metadata';
import { MODES, isPdState, settingsOf, type PdState } from './rules';
import { createProbabilityDetective } from './view';

export type { PdState } from './rules';

/** The start screen (ADR 0017, design § 13): the mode and the difficulty. */
export const settings: readonly SettingSpec[] = [
  { kind: 'choice', id: 'mode', labelKey: 'mode.label', valueKey: 'mode', values: MODES, default: 'clues', hintKey: 'mode.hint' },
  { kind: 'difficulty' }
];

export default defineGame<PdState>({
  metadata,
  settings,
  settingsOf,
  create: createProbabilityDetective,
  isValidState: isPdState,
  preload: preloadContent
});
