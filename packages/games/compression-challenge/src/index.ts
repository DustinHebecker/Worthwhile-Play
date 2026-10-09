import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isCompressionState, type CompressionState } from './rules';
import { createCompressionChallenge } from './view';

export type { CompressionState } from './rules';

export default defineGame<CompressionState>({
  metadata,
  create: createCompressionChallenge,
  isValidState: isCompressionState
});
