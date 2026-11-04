import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { MAPS } from './maps';
import { DEFAULT_LENGTH, isValidState, LENGTHS, migrateState, type TdState } from './rules';
import { createTowerDefense } from './view';

export type { TdState } from './rules';

export default defineGame<TdState>({
  metadata,
  create: createTowerDefense,
  isValidState,
  migrateState,
  settings: [
    {
      kind: 'choice',
      id: 'map',
      labelKey: 'map.label',
      valueKey: 'map',
      values: MAPS.map((m) => m.id),
      default: 'training',
      display: 'radio',
      hintKey: 'map.hint'
    },
    { kind: 'choice', id: 'length', labelKey: 'length.label', valueKey: 'length', values: [...LENGTHS], default: DEFAULT_LENGTH, display: 'radio', hintKey: 'length.hint' },
    { kind: 'difficulty', default: 'standard' }
  ],
  settingsOf: (state) => ({ map: state.mapId, length: state.length ?? 'waves', difficulty: state.difficulty })
});
