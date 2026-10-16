import { defineGame } from '@wp/game-core';
import { lookupDeckItems } from './decks';
import { metadata } from './metadata';
import { isValidMemoryState, migrateMemoryState, type MemoryState } from './rules';
import { memorySettingsOf, settings } from './settings';
import { createMemory } from './view';

export type { MemoryState } from './rules';

export default defineGame<MemoryState>({
  metadata,
  settings,
  settingsOf: memorySettingsOf,
  create: (context) => createMemory(context),
  isValidState: (value: unknown): value is MemoryState => isValidMemoryState(value, lookupDeckItems),
  migrateState: migrateMemoryState
});
