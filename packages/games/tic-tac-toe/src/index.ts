import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidState, migrateState, type TicTacToeState } from './state';
import { settings } from './settings';
import { createTicTacToe } from './view';

export type { TicTacToeState } from './state';

export default defineGame<TicTacToeState>({
  metadata,
  settings,
  create: createTicTacToe,
  isValidState,
  migrateState
});
