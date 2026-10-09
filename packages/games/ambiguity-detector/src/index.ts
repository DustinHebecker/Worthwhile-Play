import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isAmbiguityState, type AmbiguityState } from './rules';
import { createAmbiguityDetector } from './view';

export type { AmbiguityState } from './rules';

export default defineGame<AmbiguityState>({
  metadata,
  create: createAmbiguityDetector,
  isValidState: isAmbiguityState
});
