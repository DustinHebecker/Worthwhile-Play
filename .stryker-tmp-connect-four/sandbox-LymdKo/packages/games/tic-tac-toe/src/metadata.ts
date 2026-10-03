// @ts-nocheck
import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'tic-tac-toe',
  stateVersion: 1,
  skills: ['planning', 'strategy'],
  typicalMinutes: [1, 3],
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
  // Strength of the built-in (deterministic, minimax-based) computer opponent.
  difficulties: ['easy', 'medium', 'perfect']
};
