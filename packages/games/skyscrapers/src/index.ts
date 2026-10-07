// @ts-nocheck
import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isSkyscrapersState, type SkyscrapersState } from './rules';
import { createSkyscrapers } from './view';

export type { SkyscrapersState } from './rules';

export default defineGame<SkyscrapersState>({
  metadata,
  create: createSkyscrapers,
  isValidState: isSkyscrapersState
});
