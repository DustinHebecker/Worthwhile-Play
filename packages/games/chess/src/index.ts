import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidState, type ChessState } from './rules';
import { createChess } from './view';

export type { ChessState } from './rules';

export default defineGame<ChessState>({
  metadata,
  create: createChess,
  isValidState
});
