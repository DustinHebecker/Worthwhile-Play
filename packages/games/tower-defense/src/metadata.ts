import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'tower-defense',
  // 2: twenty waves on the full maps, eight on the Training ground (version 1 saves are migrated).
  stateVersion: 2,
  skills: ['strategy', 'planning', 'spatial'],
  typicalMinutes: [8, 40],
  inputMethods: ['pointer', 'touch', 'keyboard'],
  capabilities: {
    offline: true,
    audio: 'none',
    aiOptional: false,
    webgpu: 'none',
    network: 'none',
    pauseable: true
  },
  difficulties: ['relaxed', 'standard', 'hard'],
  messages
};
