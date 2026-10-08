import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidState, type NcState } from './rules';
import { createNodeConquest } from './view';

export type { NcState } from './rules';

export default defineGame<NcState>({
  metadata,
  create: createNodeConquest,
  isValidState
});
