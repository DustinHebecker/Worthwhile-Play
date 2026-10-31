import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isMinesState, type MinesState } from './rules';
import { createMineLogic } from './view';

export type { MinesState } from './rules';

export default defineGame<MinesState>({
  metadata,
  create: createMineLogic,
  isValidState: isMinesState
});
