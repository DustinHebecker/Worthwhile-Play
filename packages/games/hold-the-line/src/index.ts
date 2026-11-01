import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidState, type HoldState } from './rules';
import { createHoldTheLine } from './view';

export type { HoldState } from './rules';

export default defineGame<HoldState>({
  metadata,
  create: createHoldTheLine,
  isValidState,
  settings: [{ kind: 'difficulty', default: 'normal' }],
  settingsOf: (state) => ({ difficulty: state.difficulty })
});
