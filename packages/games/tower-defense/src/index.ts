import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidState, type TdState } from './rules';
import { createTowerDefense } from './view';

export type { TdState } from './rules';

export default defineGame<TdState>({
  metadata,
  create: createTowerDefense,
  isValidState,
  settings: [{ kind: 'difficulty', default: 'standard' }],
  settingsOf: (state) => ({ difficulty: state.difficulty })
});
