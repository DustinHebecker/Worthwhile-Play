import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'compression-challenge',
  stateVersion: 1,
  skills: ['communication'],
  typicalMinutes: [8, 15],
  inputMethods: ['pointer', 'touch', 'keyboard'],
  capabilities: {
    offline: true,
    audio: 'none',
    aiOptional: false,
    webgpu: 'none',
    network: 'none',
    pauseable: true
  },
  difficulties: ['easy', 'medium', 'hard'],
  messages
};
