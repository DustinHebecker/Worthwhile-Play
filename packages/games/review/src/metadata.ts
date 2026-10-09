import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'review',
  stateVersion: 1,
  skills: ['learning', 'memory'],
  typicalMinutes: [2, 8],
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
  // The host provides the user's imported decks (GameContext.userDecks) …
  usesUserDecks: true,
  // … and the spaced-repetition records (GameContext.learning).
  usesLearningRecords: true
};
