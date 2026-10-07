import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isSlidingBlocksState, type SlidingBlocksState } from './rules';
import { createSlidingBlocks } from './view';

export type { SlidingBlocksState } from './rules';

export default defineGame<SlidingBlocksState>({
  metadata,
  create: createSlidingBlocks,
  isValidState: isSlidingBlocksState
});
