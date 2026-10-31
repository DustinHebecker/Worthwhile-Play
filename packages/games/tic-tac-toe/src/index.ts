import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidState, migrateState, type TicTacToeState } from './state';
import { ticTacToeSettings, ticTacToeSettingsOf } from './settings';
import { createTicTacToe } from './view';

export type { TicTacToeState } from './state';

export default defineGame<TicTacToeState>({
  metadata,
  settings: (env) => ticTacToeSettings(env),
  settingsOf: ticTacToeSettingsOf,
  create: createTicTacToe,
  isValidState,
  migrateState
});
