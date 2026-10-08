import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'node-conquest',
  stateVersion: 1,
  skills: ['strategy', 'planning', 'systems'],
  typicalMinutes: [3, 15],
  inputMethods: ['pointer', 'touch', 'keyboard'],
  capabilities: {
    offline: true,
    audio: 'none',
    aiOptional: false,
    webgpu: 'none',
    network: 'none',
    pauseable: true
  },
  messages,
  // Keep in sync with DIFFICULTIES in maps.ts (checked by a unit test). Easiest first.
  difficulties: ['easy', 'medium', 'hard']
};
