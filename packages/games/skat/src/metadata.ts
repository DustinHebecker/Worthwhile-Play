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
  // The series (length, scoring, Ramsch) and the strength are chosen on the host's start screen (ADR 0017).
  difficulties: ['easy', 'normal', 'hard']
};
