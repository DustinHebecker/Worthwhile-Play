import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'chess',
  stateVersion: 1,
  skills: ['strategy', 'planning', 'spatial'],
  typicalMinutes: [10, 40],
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
  // Strength of the built-in computer opponent (own engine, deterministic); easy → hard.
  difficulties: ['beginner', 'intermediate', 'strong']
};
