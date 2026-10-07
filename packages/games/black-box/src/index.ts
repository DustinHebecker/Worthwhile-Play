// @ts-nocheck
import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isBlackBoxState, type BlackBoxState } from './rules';
import { createBlackBox } from './view';

export type { BlackBoxState } from './rules';

export default defineGame<BlackBoxState>({
  metadata,
  create: createBlackBox,
  isValidState: isBlackBoxState
});
