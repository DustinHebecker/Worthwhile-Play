import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidState, type ConnectFourState } from './rules';
import { createConnectFour } from './view';

export type { ConnectFourState } from './rules';

export default defineGame<ConnectFourState>({
  metadata,
  create: createConnectFour,
  isValidState
});
