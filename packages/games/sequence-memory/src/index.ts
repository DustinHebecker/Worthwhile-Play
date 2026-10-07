import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidSequenceState, type SequenceState } from './rules';
import { createSequenceMemory } from './view';

export type { SequenceState } from './rules';

export default defineGame<SequenceState>({
  metadata,
  create: createSequenceMemory,
  isValidState: isValidSequenceState
});
