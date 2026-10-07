// @ts-nocheck
import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'connect-four',
  stateVersion: 1,
  skills: ['planning', 'strategy'],
  typicalMinutes: [3, 10],
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
  // Search depth of the built-in (deterministic, alpha-beta) computer opponent; easy → hard.
  difficulties: ['easy', 'medium', 'hard']
};
