import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isBriefingState, type BriefingState } from './rules';
import { createBriefingGame } from './view';

export type { BriefingState } from './rules';

export default defineGame<BriefingState>({
  metadata,
  create: createBriefingGame,
  isValidState: isBriefingState
});
