import type { GameMetadata } from '@wp/game-core';
import { messages } from './messages';
import { PROLOGUE } from './structure';

export const metadata: GameMetadata = {
  id: 'adventure-a',
  // Equals the content version (defineAdventureGame checks it): a save-breaking content change bumps both.
  stateVersion: PROLOGUE.contentVersion,
  skills: ['deduction', 'spatial', 'planning'],
  typicalMinutes: [5, 15],
  inputMethods: ['pointer', 'touch', 'keyboard'],
  capabilities: { offline: true, audio: 'optional', aiOptional: false, webgpu: 'none', network: 'none', pauseable: true },
  messages,
  // Only the prologue exists so far (increment A1); the full adventure follows chapter by chapter.
  status: 'preview'
};
