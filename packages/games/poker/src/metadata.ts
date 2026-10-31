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
  // The level and number of opponents are chosen on the host's start screen (ADR 0017, settings.ts).
  difficulties: ['easy', 'medium', 'hard']
};
