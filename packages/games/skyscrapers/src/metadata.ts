// @ts-nocheck
import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'skyscrapers',
  stateVersion: 1,
  skills: ['deduction', 'spatial'],
  typicalMinutes: [3, 20],
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
