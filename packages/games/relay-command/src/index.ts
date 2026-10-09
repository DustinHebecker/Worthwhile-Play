import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidState, type RcState } from './rules';
import { createRelayCommand } from './view';

export type { RcState } from './rules';

export default defineGame<RcState>({
  metadata,
  create: createRelayCommand,
  isValidState
});
