// @ts-nocheck
import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isSokobanState, type SokobanState } from './rules';
import { createSokoban } from './view';

export type { SokobanState } from './rules';

export default defineGame<SokobanState>({
  metadata,
  create: createSokoban,
  isValidState: isSokobanState
});
