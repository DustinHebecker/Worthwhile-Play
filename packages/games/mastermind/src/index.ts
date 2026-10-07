import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isMastermindState, type MastermindState } from './rules';
import { createMastermind } from './view';

export type { MastermindState } from './rules';

export default defineGame<MastermindState>({
  metadata,
  create: createMastermind,
  isValidState: isMastermindState
});
