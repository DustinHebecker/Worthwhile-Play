import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidState, type StackDuelState } from './rules';
import { createStackDuel } from './view';

export type { StackDuelState } from './rules';

export default defineGame<StackDuelState>({
  metadata,
  create: createStackDuel,
  isValidState
});
