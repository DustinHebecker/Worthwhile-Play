import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { DEFAULT_LENGTH, isValidState, LENGTHS, type HoldState } from './rules';
import { createHoldTheLine, MODE_CHOICES } from './view';

export type { HoldState } from './rules';

export default defineGame<HoldState>({
  metadata,
  create: createHoldTheLine,
  isValidState,
  settings: [
    { kind: 'choice', id: 'mode', labelKey: 'mode.label', valueKey: 'mode', values: [...MODE_CHOICES], default: 'vs-small', display: 'radio', hintKey: 'mode.hint' },
    { kind: 'choice', id: 'length', labelKey: 'length.label', valueKey: 'length', values: [...LENGTHS], default: DEFAULT_LENGTH, display: 'radio', hintKey: 'length.hint' },
    { kind: 'difficulty', default: 'normal' }
  ],
  settingsOf: (state) => ({ mode: state.solo ? 'external-solo' : state.mode, length: state.length ?? 'rounds', difficulty: state.difficulty })
});
