import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'tower-defense',
  stateVersion: 1,
  skills: ['strategy', 'planning', 'spatial'],
  typicalMinutes: [5, 25],
  inputMethods: ['pointer', 'touch', 'keyboard'],
  capabilities: {
    offline: true,
    audio: 'none',
    aiOptional: false,
    webgpu: 'none',
    network: 'none',
    pauseable: true
  },
  difficulties: ['relaxed', 'standard', 'hard'],
  messages
};
