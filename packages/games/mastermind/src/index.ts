import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { DEFAULT_DIFFICULTY, isMastermindState, type MastermindState } from './rules';
import { createMastermind } from './view';

export type { MastermindState } from './rules';

export default defineGame<MastermindState>({
  metadata,
  // The start screen preselects the game's own default (ADR 0017).
  settings: [{ kind: 'difficulty', default: DEFAULT_DIFFICULTY }],
  create: createMastermind,
  isValidState: isMastermindState
});
