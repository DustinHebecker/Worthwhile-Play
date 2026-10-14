import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'node-conquest',
  stateVersion: 2,
  skills: ['strategy', 'planning', 'systems'],
  typicalMinutes: [3, 15],
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
  // Opponent intelligence, easiest first. Keep in sync with DIFFICULTIES in rules.ts (checked by a unit test).
  // The number of opponents is a separate in-game setting.
  difficulties: ['beginner', 'advanced', 'strong', 'master']
};
