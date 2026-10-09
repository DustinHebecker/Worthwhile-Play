import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidSearchState, type SearchState } from './rules';
import { createVisualSearch } from './view';

export type { SearchState } from './rules';

export default defineGame<SearchState>({
  metadata,
  create: createVisualSearch,
  isValidState: isValidSearchState
});
