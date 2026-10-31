import { defineGame, type SettingSpec } from '@wp/game-core';
import { metadata } from './metadata';
import { CHOICES, DEFAULT_CHOICE, isMoState, settingsOf, type MoState } from './rules';
import { createMiniOptimizer } from './view';

export type { MoState } from './rules';

/** The start screen (ADR 0017): which problem, then the difficulty. */
export const settings: readonly SettingSpec[] = [
  { kind: 'choice', id: 'problem', labelKey: 'problem.label', valueKey: 'problem', values: CHOICES, default: DEFAULT_CHOICE, hintKey: 'problem.hint' },
  { kind: 'difficulty' }
];

export default defineGame<MoState>({
  metadata,
  settings,
  settingsOf,
  create: createMiniOptimizer,
  isValidState: isMoState
});
