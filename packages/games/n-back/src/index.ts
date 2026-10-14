import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidNBackState, type NBackState } from './rules';
import { createNBack } from './view';

export type { NBackState } from './rules';

export default defineGame<NBackState>({
  metadata,
  create: createNBack,
  isValidState: isValidNBackState
});
