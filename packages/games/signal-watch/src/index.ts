import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidSignalState, type SignalState } from './rules';
import { createSignalWatch } from './view';

export type { SignalState } from './rules';

export default defineGame<SignalState>({
  metadata,
  create: createSignalWatch,
  isValidState: isValidSignalState
});
