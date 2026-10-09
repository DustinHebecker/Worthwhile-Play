import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isDeepReadState, type DeepReadState } from './rules';
import { createDeepRead } from './view';

export type { DeepReadState } from './rules';

export default defineGame<DeepReadState>({
  metadata,
  create: createDeepRead,
  isValidState: isDeepReadState
});
