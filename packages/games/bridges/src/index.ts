// @ts-nocheck
import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isBridgesState, type BridgesState } from './rules';
import { createBridges } from './view';

export type { BridgesState } from './rules';

export default defineGame<BridgesState>({
  metadata,
  create: createBridges,
  isValidState: isBridgesState
});
