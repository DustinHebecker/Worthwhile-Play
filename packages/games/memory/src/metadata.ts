import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'memory',
  // 2: card variants (symbols, words, flags, own decks) and recorded content languages; v1 saves are migrated.
  stateVersion: 2,
  skills: ['memory', 'learning'],
  typicalMinutes: [2, 6],
  inputMethods: ['pointer', 'touch', 'keyboard'],
  capabilities: {
    offline: true,
    // Optional best-effort "read aloud" (speech synthesis); never required.
    audio: 'optional',
    aiOptional: false,
    webgpu: 'none',
    network: 'none',
    pauseable: true
  },
  messages,
  // Keep in sync with DIFFICULTIES in rules.ts (checked by a unit test).
  difficulties: ['small', 'medium', 'large'],
  // The host provides the user's imported decks (GameContext.userDecks) for "own deck" games.
  usesUserDecks: true
};
