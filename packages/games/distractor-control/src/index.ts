import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidDistractorState, type DistractorState } from './rules';
import { createDistractorControl } from './view';

export type { DistractorState } from './rules';

export default defineGame<DistractorState>({
  metadata,
  create: createDistractorControl,
  isValidState: isValidDistractorState
});
