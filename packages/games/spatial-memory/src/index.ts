import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidPatternState, type PatternState } from './rules';
import { createPatternMemory } from './view';

export type { PatternState } from './rules';

export default defineGame<PatternState>({
  metadata,
  create: createPatternMemory,
  isValidState: isValidPatternState
});
