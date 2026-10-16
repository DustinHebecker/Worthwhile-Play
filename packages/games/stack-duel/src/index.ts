import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { DEFAULT_MODE, MODES, isValidState, type StackDuelState } from './rules';
import { createStackDuel } from './view';

export type { StackDuelState } from './rules';

export default defineGame<StackDuelState>({
  metadata,
  // Start-screen settings (ADR 0017): the mode, then the difficulty (piece mix; tower goal in solo).
  settings: [{ kind: 'choice', id: 'mode', labelKey: 'mode', valueKey: 'mode', values: MODES, default: DEFAULT_MODE }, { kind: 'difficulty' }],
  create: createStackDuel,
  isValidState
});
