// @ts-nocheck
import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'sliding-blocks',
  stateVersion: 1,
  skills: ['planning', 'spatial'],
  typicalMinutes: [1, 10],
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
