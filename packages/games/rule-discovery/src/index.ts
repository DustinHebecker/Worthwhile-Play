import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isRuleDiscoveryState, type RuleDiscoveryState } from './rules';
import { createRuleDiscovery } from './view';

export type { RuleDiscoveryState } from './rules';

export default defineGame<RuleDiscoveryState>({
  metadata,
  create: createRuleDiscovery,
  isValidState: isRuleDiscoveryState
});
