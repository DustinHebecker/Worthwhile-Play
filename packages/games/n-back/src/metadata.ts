import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'n-back',
  stateVersion: 1,
  skills: ['memory', 'attention'],
  typicalMinutes: [2, 6],
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
  // Keep in sync with DIFFICULTIES in rules.ts (checked by a unit test): N = 1, 2, 3 (3 adds look-alikes).
  difficulties: ['n1', 'n2', 'n3']
};
