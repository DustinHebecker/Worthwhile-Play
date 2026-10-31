import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isConstraintGridState, type ConstraintGridState } from './rules';
import { createConstraintGrid } from './view';

export type { ConstraintGridState } from './rules';

export default defineGame<ConstraintGridState>({
  metadata,
  create: createConstraintGrid,
  isValidState: isConstraintGridState
});
