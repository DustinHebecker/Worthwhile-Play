import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'laser-circuit',
  // Version 2 renamed the level sets one step up (the old easy set is no longer offered); see migrateLaserState.
  stateVersion: 2,
  skills: ['spatial', 'systems'],
  typicalMinutes: [2, 12],
  inputMethods: ['pointer', 'touch', 'keyboard'],
  capabilities: {
    offline: true,
    audio: 'none',
    aiOptional: false,
    webgpu: 'none',
    network: 'none',
    pauseable: true
  },
  difficulties: ['easy', 'medium', 'hard', 'expert'],
  messages
};
