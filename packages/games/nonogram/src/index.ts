// @ts-nocheck
import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isNonogramState, type NonogramState } from './rules';
import { createNonogram } from './view';

export type { NonogramState } from './rules';

export default defineGame<NonogramState>({
  metadata,
  create: createNonogram,
  isValidState: isNonogramState
});
