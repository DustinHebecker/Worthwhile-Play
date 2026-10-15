import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'skat',
  stateVersion: 1,
  skills: ['strategy', 'memory', 'deduction', 'planning'],
  typicalMinutes: [10, 45],
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
  // Strength of the two computer players (easy → hard); never time pressure.
  difficulties: ['easy', 'normal', 'hard'],
  // The first screen is the series setup (length, scoring, Ramsch, card faces, strength).
  setupInGame: true
};
