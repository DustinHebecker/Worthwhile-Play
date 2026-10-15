import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';

export const metadata: GameMetadata = {
  id: 'tic-tac-toe',
  // 2: three variants (classic, nested "board in board", Order & Chaos); v1 saves migrate to classic.
  stateVersion: 2,
  skills: ['planning', 'strategy'],
  typicalMinutes: [1, 15],
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
  // Strength of the built-in deterministic computer opponent ("perfect" is shown as "Hard").
  difficulties: ['easy', 'medium', 'perfect']
};
