import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidState, migrateState, type ConnectFourState } from './rules';
import { settings } from './settings';
import { createConnectFour } from './view';

export type { ConnectFourState } from './rules';

export default defineGame<ConnectFourState>({
  metadata,
  settings,
  create: createConnectFour,
  isValidState,
  migrateState
});
