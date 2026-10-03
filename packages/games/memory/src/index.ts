import { defineGame } from '@wp/game-core';
import { lookupDeckItems } from './decks';
import { metadata } from './metadata';
import { isValidMemoryState, type MemoryState } from './rules';
import { createMemory } from './view';

export type { MemoryState } from './rules';

export default defineGame<MemoryState>({
  metadata,
  create: createMemory,
  isValidState: (value: unknown): value is MemoryState => isValidMemoryState(value, lookupDeckItems)
});
