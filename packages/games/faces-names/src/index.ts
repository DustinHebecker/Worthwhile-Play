import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidFacesNamesState, type FacesNamesState } from './rules';
import { createFacesNames } from './view';

export type { FacesNamesState } from './rules';

export default defineGame<FacesNamesState>({
  metadata,
  create: createFacesNames,
  isValidState: isValidFacesNamesState
});
