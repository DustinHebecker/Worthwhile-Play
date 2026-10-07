// @ts-nocheck
import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'laser-circuit',
  stateVersion: 1,
  skills: ['spatial', 'systems'],
  typicalMinutes: [2, 12],
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
