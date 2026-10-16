import { defineGame } from '@wp/game-core';
import { preloadContent } from './content';
import { metadata } from './metadata';
import { isValidState, migrateState, type CardQuestState } from './rules';
import { cardQuestSettings, cardQuestSettingsOf } from './settings';
import { createCardQuest } from './view';

export type { CardQuestState } from './rules';

export default defineGame<CardQuestState>({
  metadata,
  create: createCardQuest,
  isValidState,
  migrateState,
  preload: preloadContent,
  settings: (env) => cardQuestSettings(env),
  settingsOf: cardQuestSettingsOf
});
