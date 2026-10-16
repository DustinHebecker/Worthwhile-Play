import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidState, migrateState, type NcState } from './rules';
import { settings } from './settings';
import { createNodeConquest } from './view';

export type { NcState } from './rules';

export default defineGame<NcState>({
  metadata,
  settings,
  create: createNodeConquest,
  isValidState,
  migrateState
});
