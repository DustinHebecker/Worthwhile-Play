// @ts-nocheck
import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isRiverState, type RiverState } from './rules';
import { createRiverCrossing } from './view';

export type { RiverState } from './rules';

export default defineGame<RiverState>({
  metadata,
  create: createRiverCrossing,
  isValidState: isRiverState
});
