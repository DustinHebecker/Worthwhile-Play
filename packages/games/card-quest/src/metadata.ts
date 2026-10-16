import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'card-quest',
  stateVersion: 1,
  skills: ['strategy', 'communication'],
  typicalMinutes: [15, 45],
  inputMethods: ['pointer', 'touch', 'keyboard'],
  capabilities: {
    offline: true,
    audio: 'none',
    aiOptional: false,
    webgpu: 'none',
    network: 'none',
    pauseable: true
  },
  // How cunning the computer players are (design § 5.7).
  difficulties: ['easy', 'normal', 'sharp'],
  messages
};
