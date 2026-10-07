import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isGdState, type GdState } from './rules';
import { createGraphDetective } from './view';

export type { GdState } from './rules';

export default defineGame<GdState>({
  metadata,
  create: createGraphDetective,
  isValidState: isGdState
});
