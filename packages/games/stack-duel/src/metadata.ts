import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'stack-duel',
  stateVersion: 1,
  skills: ['spatial', 'planning', 'strategy'],
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
  // Computer skill and piece irregularity (easy → hard); never time pressure.
  difficulties: ['easy', 'medium', 'hard']
};
