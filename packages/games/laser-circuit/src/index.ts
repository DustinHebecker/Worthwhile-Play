import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isLaserState, migrateLaserState, type LaserState } from './rules';
import { createLaserCircuit } from './view';

export type { LaserState } from './rules';

export default defineGame<LaserState>({
  metadata,
  create: createLaserCircuit,
  isValidState: isLaserState,
  migrateState: migrateLaserState,
  // The level set is the difficulty; a migrated version-1 save names it here, not in its envelope (ADR 0017).
  settingsOf: (state) => (metadata.difficulties?.includes(state.difficulty) ? { difficulty: state.difficulty } : {})
});
