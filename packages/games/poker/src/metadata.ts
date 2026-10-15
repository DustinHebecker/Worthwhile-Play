import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'poker',
  stateVersion: 1,
  skills: ['strategy', 'deduction', 'learning'],
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
  // Strength of the built-in computer opponents (seeded Monte Carlo equity); easy → hard.
  difficulties: ['easy', 'medium', 'hard'],
  // The table setup (number of opponents, their level) is the game's first screen (ADR 0015).
  setupInGame: true
};
