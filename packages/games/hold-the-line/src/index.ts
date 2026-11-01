import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidState, MODES, type HoldState } from './rules';
import { createHoldTheLine } from './view';

export type { HoldState } from './rules';

export default defineGame<HoldState>({
  metadata,
  create: createHoldTheLine,
  isValidState,
  settings: [
    { kind: 'choice', id: 'mode', labelKey: 'mode.label', valueKey: 'mode', values: [...MODES], default: 'vs-small', display: 'radio', hintKey: 'mode.hint' },
    { kind: 'difficulty', default: 'normal' }
  ],
  settingsOf: (state) => ({ mode: state.mode, difficulty: state.difficulty })
});
