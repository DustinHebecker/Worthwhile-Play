import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidState, migrateState, type ConnectFourState } from './rules';
import { connectFourSettings, connectFourSettingsOf } from './settings';
import { createConnectFour } from './view';

export type { ConnectFourState } from './rules';

export default defineGame<ConnectFourState>({
  metadata,
  settings: (env) => connectFourSettings(env),
  settingsOf: connectFourSettingsOf,
  create: createConnectFour,
  isValidState,
  migrateState
});
