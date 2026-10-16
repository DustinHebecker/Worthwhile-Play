import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isWordGuessState, type WordGuessState } from './rules';
import { settings, wordGuessSettingsOf } from './settings';
import { createWordGuess } from './view';

export type { WordGuessState } from './rules';

export default defineGame<WordGuessState>({
  metadata,
  settings,
  settingsOf: wordGuessSettingsOf,
  create: createWordGuess,
  isValidState: isWordGuessState
});
