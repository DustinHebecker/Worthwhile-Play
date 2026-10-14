import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isLightsOutState, type LightsOutState } from './rules';
import { createLightsOut } from './view';

export type { LightsOutState } from './rules';

export default defineGame<LightsOutState>({
  metadata,
  create: createLightsOut,
  isValidState: isLightsOutState
});
