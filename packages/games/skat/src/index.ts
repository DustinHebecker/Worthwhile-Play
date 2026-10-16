import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidState, type SkatState } from './rules';
import { skatSettings, skatSettingsOf } from './settings';
import { createSkat } from './view';

export type { SkatState } from './rules';

export default defineGame<SkatState>({
  metadata,
  settings: (env) => skatSettings(env),
  settingsOf: skatSettingsOf,
  create: createSkat,
  isValidState
});
