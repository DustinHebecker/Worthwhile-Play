import { defineGame, type SettingSpec } from '@wp/game-core';
import { anyOf, CATALOGUE, CHOICES, GROUPS_SHOWN, prepare } from './catalogue';
import { metadata } from './metadata';
import { isPeelState, migrateState, settingsOf, type PeelState } from './rules';
import { createPixelPeel } from './view';

export type { PeelState } from './rules';

/**
 * The start screen (ADR 0017): the difficulty, then the picture: "Any picture", then one group per kind of picture,
 * each starting with "Any <kind>" (drawn from the seed) and listing its pictures.
 */
export const settings: readonly SettingSpec[] = [
  { kind: 'difficulty', hintKey: 'difficulty.hint' },
  {
    kind: 'choice',
    id: 'motif',
    labelKey: 'setting.motif',
    valueKey: 'motif',
    values: CHOICES,
    groups: GROUPS_SHOWN.map((group) => ({ labelKey: `group.${group}`, values: [anyOf(group), ...CATALOGUE.filter((card) => card.group === group).map((card) => card.id)] })),
    default: 'any',
    display: 'select',
    hintKey: 'setting.motifHint',
    remember: false
  }
];

export default defineGame<PeelState>({
  metadata,
  settings,
  settingsOf,
  create: createPixelPeel,
  prepare,
  isValidState: isPeelState,
  migrateState
});
