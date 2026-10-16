import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidState, type PokerState } from './rules';
import { pokerSettings, pokerSettingsOf } from './settings';
import { createPoker } from './view';

export type { PokerState } from './rules';

export default defineGame<PokerState>({
  metadata,
  settings: (env) => pokerSettings(env),
  settingsOf: pokerSettingsOf,
  create: createPoker,
  isValidState
});
