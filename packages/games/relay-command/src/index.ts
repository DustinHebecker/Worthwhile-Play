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
  // ADR 0017 opt-out (owner decision 2026-10-16): no host settings, not even the difficulty; the level is chosen
  // in the game's own setup next to the map, reported via `setDifficulty` and read back from a save here.
  settings: [],
  settingsOf: (state) => (metadata.difficulties?.includes(state.difficulty) ? { difficulty: state.difficulty } : {})
});
