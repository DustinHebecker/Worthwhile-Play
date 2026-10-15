import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidState, migrateState, type TicTacToeState } from './state';
import { createTicTacToe } from './view';

export type { TicTacToeState } from './state';

export default defineGame<TicTacToeState>({
  metadata,
  create: createTicTacToe,
  isValidState,
  migrateState
});
