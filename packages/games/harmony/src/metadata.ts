import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'harmony',
  stateVersion: 1,
  skills: ['attention', 'learning'],
  typicalMinutes: [5, 15],
  inputMethods: ['pointer', 'touch', 'keyboard'],
  capabilities: {
    offline: true,
    // Sound is optional: every question also exists as a picture (design § 8).
    audio: 'optional',
    aiOptional: false,
    webgpu: 'none',
    network: 'none',
    pauseable: true
  },
  difficulties: ['easy', 'medium', 'hard'],
  messages
};
