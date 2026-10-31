import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'many-lives',
  stateVersion: 1,
  skills: ['planning', 'systems'],
  // A whole life takes hours and is meant to be played over several days (owner decision O3).
  typicalMinutes: [20, 300],
  inputMethods: ['pointer', 'touch', 'keyboard'],
  capabilities: {
    offline: true,
    audio: 'none',
    aiOptional: false,
    webgpu: 'none',
    network: 'none',
    pauseable: true
  },
  // Early release in English and German (owner decision O28); the other locales show English.
  locales: ['en', 'de'],
  status: 'preview',
  messages
};
