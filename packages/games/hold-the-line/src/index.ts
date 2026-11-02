import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { DEFAULT_LENGTH, DEFAULT_WAVES, isValidState, LENGTHS, WAVE_SOURCES, type HoldState } from './rules';
import { createHoldTheLine, MODE_CHOICES } from './view';

export type { HoldState } from './rules';

export default defineGame<HoldState>({
  metadata,
  create: createHoldTheLine,
  isValidState,
  // Saves of versions 1 (before endless and solo), 2 (before production) and 3 (before defenders) are
  // valid as they are: without `length` ten-round games, without `waves` (1, 2) Duels with the shop.
  migrateState: (state, fromVersion) => {
    if (!(fromVersion >= 1 && fromVersion <= 3) || !isValidState(state)) return undefined;
    return fromVersion < 3 && (state as { waves?: unknown }).waves !== undefined ? undefined : state;
  },
  settings: [
    { kind: 'choice', id: 'mode', labelKey: 'mode.label', valueKey: 'mode', values: [...MODE_CHOICES], default: 'vs-small', display: 'radio', hintKey: 'mode.hint' },
    { kind: 'choice', id: 'waves', labelKey: 'waves.label', valueKey: 'waves', values: [...WAVE_SOURCES], default: DEFAULT_WAVES, display: 'radio', hintKey: 'waves.hint', when: { mode: ['vs-small'] } },
    { kind: 'choice', id: 'length', labelKey: 'length.label', valueKey: 'length', values: [...LENGTHS], default: DEFAULT_LENGTH, display: 'radio', hintKey: 'length.hint' },
    // Alone, nobody plans against you and the force is fixed: there is no difficulty to choose.
    { kind: 'difficulty', default: 'normal', when: { mode: ['vs-small', 'external-small'] } }
  ],
  settingsOf: (state) => ({
    mode: state.solo ? 'external-solo' : state.mode,
    ...(state.mode === 'vs-small' && { waves: state.waves ?? 'shop' }),
    length: state.length ?? 'rounds',
    difficulty: state.difficulty
  })
});
