import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { DEFAULT_LENGTH, isValidState, LENGTHS, type HoldState } from './rules';
import { createHoldTheLine, MODE_CHOICES } from './view';

export type { HoldState } from './rules';

export default defineGame<HoldState>({
  metadata,
  create: createHoldTheLine,
  isValidState,
  // Version 1 saves (before endless and solo) are valid as they are: without `length` they are ten-round games.
  migrateState: (state, fromVersion) => (fromVersion === 1 && isValidState(state) ? state : undefined),
  settings: [
    { kind: 'choice', id: 'mode', labelKey: 'mode.label', valueKey: 'mode', values: [...MODE_CHOICES], default: 'vs-small', display: 'radio', hintKey: 'mode.hint' },
    { kind: 'choice', id: 'length', labelKey: 'length.label', valueKey: 'length', values: [...LENGTHS], default: DEFAULT_LENGTH, display: 'radio', hintKey: 'length.hint' },
    // Alone, nobody plans against you and the force is fixed: there is no difficulty to choose.
    { kind: 'difficulty', default: 'normal', when: { mode: ['vs-small', 'external-small'] } }
  ],
  settingsOf: (state) => ({ mode: state.solo ? 'external-solo' : state.mode, length: state.length ?? 'rounds', difficulty: state.difficulty })
});
