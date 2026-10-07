import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidState, type TicTacToeState } from './rules';
import { createTicTacToe } from './view';

export type { TicTacToeState } from './rules';

export default defineGame<TicTacToeState>({
  metadata,
  create: createTicTacToe,
  isValidState
});
