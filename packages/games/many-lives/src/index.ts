import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { SETTINGS, isManyLivesState, settingsOf, type ManyLivesState } from './rules';
import { createManyLives } from './view';

export type { ManyLivesState } from './rules';

export default defineGame<ManyLivesState>({
  metadata,
  settings: SETTINGS,
  settingsOf,
  create: createManyLives,
  isValidState: isManyLivesState
});
