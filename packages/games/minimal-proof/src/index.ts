import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isMinimalProofState, type MinimalProofState } from './rules';
import { createMinimalProof } from './view';

export type { MinimalProofState } from './rules';

export default defineGame<MinimalProofState>({
  metadata,
  create: createMinimalProof,
  isValidState: isMinimalProofState
});
