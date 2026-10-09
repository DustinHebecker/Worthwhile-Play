import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidProspectiveState, type ProspectiveState } from './rules';
import { createProspectiveMemory } from './view';

export type { ProspectiveState } from './rules';

export default defineGame<ProspectiveState>({
  metadata,
  create: createProspectiveMemory,
  isValidState: isValidProspectiveState
});
