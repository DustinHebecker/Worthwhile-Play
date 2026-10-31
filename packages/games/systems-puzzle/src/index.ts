import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isFlowState, type FlowState } from './rules';
import { createSystemsPuzzle } from './view';

export type { FlowState } from './rules';

export default defineGame<FlowState>({
  metadata,
  create: createSystemsPuzzle,
  isValidState: isFlowState
});
