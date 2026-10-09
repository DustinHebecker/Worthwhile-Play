import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidAssociationState, type AssociationState } from './rules';
import { createAssociation } from './view';

export type { AssociationState } from './rules';

export default defineGame<AssociationState>({
  metadata,
  create: createAssociation,
  isValidState: isValidAssociationState
});
