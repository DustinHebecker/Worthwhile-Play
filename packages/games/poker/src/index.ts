import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidState, type PokerState } from './rules';
import { createPoker } from './view';

export type { PokerState } from './rules';

export default defineGame<PokerState>({
  metadata,
  create: createPoker,
  isValidState
});
