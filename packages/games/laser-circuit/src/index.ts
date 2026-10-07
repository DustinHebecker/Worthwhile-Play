import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isLaserState, type LaserState } from './rules';
import { createLaserCircuit } from './view';

export type { LaserState } from './rules';

export default defineGame<LaserState>({
  metadata,
  create: createLaserCircuit,
  isValidState: isLaserState
});
