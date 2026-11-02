import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'hold-the-line',
  // 2: endless games and playing alone (an older client must not read them as ten-round games).
  // 3: the Duel with production buildings and research.
  // 4: defenders against the outside force (buildings and research there, defenders in a battle).
  stateVersion: 4,
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
