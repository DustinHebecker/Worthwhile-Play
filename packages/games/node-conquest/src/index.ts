import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isValidState, migrateState, type NcState } from './rules';
import { nodeConquestSettings, nodeConquestSettingsOf } from './settings';
import { createNodeConquest } from './view';

export type { NcState } from './rules';

export default defineGame<NcState>({
  metadata,
  settings: (env) => nodeConquestSettings(env),
  settingsOf: nodeConquestSettingsOf,
  create: createNodeConquest,
  isValidState,
  migrateState
});
