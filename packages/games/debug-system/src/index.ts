import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isDebugState, type DebugState } from './rules';
import { createDebugSystem } from './view';

export type { DebugState } from './rules';

export default defineGame<DebugState>({
  metadata,
  create: createDebugSystem,
  isValidState: isDebugState
});
