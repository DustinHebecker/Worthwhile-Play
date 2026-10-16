import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isWordGuessState, type WordGuessState } from './rules';
import { settings } from './settings';
import { createWordGuess } from './view';

export type { WordGuessState } from './rules';

export default defineGame<WordGuessState>({
  metadata,
  settings,
  create: createWordGuess,
  isValidState: isWordGuessState
});
