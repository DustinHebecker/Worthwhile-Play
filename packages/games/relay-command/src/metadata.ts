import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'relay-command',
  stateVersion: 4,
  skills: ['strategy', 'planning', 'spatial'],
  typicalMinutes: [10, 20],
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
