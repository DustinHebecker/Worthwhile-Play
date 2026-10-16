import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidState, type SkatState } from './rules';
import { settings } from './settings';
import { createSkat } from './view';

export type { SkatState } from './rules';

export default defineGame<SkatState>({
  metadata,
  settings,
  create: createSkat,
  isValidState
});
