import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidState, migrateState, type RcState } from './rules';
import { createRelayCommand } from './view';

export type { RcState } from './rules';

export default defineGame<RcState>({
  metadata,
  create: createRelayCommand,
  isValidState,
  migrateState,
  // ADR 0017: the start screen's only setting is the difficulty; the map setup stays in the game.
  settingsOf: (state) => (metadata.difficulties?.includes(state.difficulty) ? { difficulty: state.difficulty } : {})
});
