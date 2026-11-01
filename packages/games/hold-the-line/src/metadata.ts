import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'hold-the-line',
  stateVersion: 1,
  skills: ['strategy', 'planning', 'spatial'],
  typicalMinutes: [15, 30],
  inputMethods: ['pointer', 'touch', 'keyboard'],
  capabilities: {
    offline: true,
    audio: 'none',
    aiOptional: false,
    webgpu: 'none',
    network: 'none',
    pauseable: true
  },
  difficulties: ['easy', 'normal', 'hard'],
  messages
};
