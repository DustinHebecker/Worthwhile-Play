import { defineGame, type SettingSpec } from '@wp/game-core';
import { preloadContent } from './content';
import { metadata } from './metadata';
import { CATEGORY_CHOICES, MODEL_MODES, isFermiState, migrateState, settingsOf, type FermiState } from './rules';
import { createFermiLab } from './view';

export type { FermiState } from './rules';

/** The start screen (ADR 0017): difficulty, topic and the path (guided factor model or free estimate). */
export const settings: readonly SettingSpec[] = [
  { kind: 'difficulty' },
  { kind: 'choice', id: 'category', labelKey: 'category.label', valueKey: 'category', values: CATEGORY_CHOICES, default: 'all' },
  { kind: 'choice', id: 'model', labelKey: 'model.label', valueKey: 'model', values: MODEL_MODES, default: 'guided', hintKey: 'model.hint' }
];

export default defineGame<FermiState>({
  metadata,
  settings,
  settingsOf,
  create: createFermiLab,
  isValidState: isFermiState,
  migrateState,
  preload: preloadContent
});
