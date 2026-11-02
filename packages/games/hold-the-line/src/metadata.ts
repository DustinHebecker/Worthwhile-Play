import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'hold-the-line',
  // 2: endless games and playing alone (an older client must not read them as ten-round games).
  stateVersion: 2,
  skills: ['strategy', 'planning', 'spatial'],
  // Ten rounds take about 15 minutes; an endless game lasts at most 47 rounds.
  typicalMinutes: [15, 60],
  inputMethods: ['pointer', 'touch', 'keyboard'],
  capabilities: {
    offline: true,
    audio: 'none',
    aiOptional: false,
    webgpu: 'none',
    network: 'none',
    pauseable: true
  },
  difficulties: ['easy', 'normal', 'hard'],
  messages
};
