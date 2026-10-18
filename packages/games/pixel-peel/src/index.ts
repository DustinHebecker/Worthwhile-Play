import { defineGame, type SettingSpec } from '@wp/game-core';
import { metadata } from './metadata';
import { MOTIFS } from './motifs/index';
import { isPeelState, migrateState, settingsOf, type PeelState } from './rules';
import { createPixelPeel } from './view';

export type { PeelState } from './rules';

/** The start screen (ADR 0017): the difficulty, then the picture ("Any picture" is drawn from the seed). */
export const settings: readonly SettingSpec[] = [
  { kind: 'difficulty', hintKey: 'difficulty.hint' },
  { kind: 'choice', id: 'motif', labelKey: 'setting.motif', valueKey: 'motif', values: ['any', ...MOTIFS.map((m) => m.id)], default: 'any', display: 'select', hintKey: 'setting.motifHint', remember: false }
];

export default defineGame<PeelState>({
  metadata,
  settings,
  settingsOf,
  create: createPixelPeel,
  isValidState: isPeelState,
  migrateState
});
