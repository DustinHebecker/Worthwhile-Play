import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isSlitherlinkState, type SlitherlinkState } from './rules';
import { createSlitherlink } from './view';

export type { SlitherlinkState } from './rules';

export default defineGame<SlitherlinkState>({
  metadata,
  create: createSlitherlink,
  isValidState: isSlitherlinkState
});
