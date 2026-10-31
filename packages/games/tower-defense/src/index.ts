import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { MAPS } from './maps';
import { isValidState, type TdState } from './rules';
import { createTowerDefense } from './view';

export type { TdState } from './rules';

export default defineGame<TdState>({
  metadata,
  create: createTowerDefense,
  isValidState,
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
    { kind: 'difficulty', default: 'standard' }
  ],
  settingsOf: (state) => ({ map: state.mapId, difficulty: state.difficulty })
});
