import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'spatial-memory',
  stateVersion: 1,
  skills: ['memory', 'spatial'],
  typicalMinutes: [2, 5],
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
  // Keep in sync with DIFFICULTIES in rules.ts (checked by a unit test). Easy → hard.
  difficulties: ['standard', 'rotated']
};
