import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'distractor-control',
  stateVersion: 1,
  skills: ['attention'],
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
  // Keep in sync with DIFFICULTIES in rules.ts (checked by a unit test). Fewer distractions first.
  difficulties: ['calm', 'busy']
};
