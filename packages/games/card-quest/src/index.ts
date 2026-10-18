import { defineGame } from '@wp/game-core';
import { preloadContent } from './content';
import { loadIllustrations } from './illustrations';
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
  // Card texts of the UI locale, and the pictures of the default world (others load with the game that uses them).
  preload: (locale) => Promise.all([preloadContent(locale), loadIllustrations(['kz'])]).then(() => undefined),
  settings: (env) => cardQuestSettings(env),
  settingsOf: cardQuestSettingsOf
});
