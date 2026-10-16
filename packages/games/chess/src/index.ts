import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidState, type ChessState } from './rules';
import { chessSettings, chessSettingsOf } from './settings';
import { createChess } from './view';

export type { ChessState } from './rules';

export default defineGame<ChessState>({
  metadata,
  settings: (env) => chessSettings(env),
  settingsOf: chessSettingsOf,
  create: createChess,
  isValidState
});
