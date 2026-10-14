import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isCircuitState, type CircuitState } from './rules';
import { createCircuit } from './view';

export type { CircuitState } from './rules';

export default defineGame<CircuitState>({
  metadata,
  create: createCircuit,
  isValidState: isCircuitState
});
