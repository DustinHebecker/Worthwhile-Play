import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isAudienceSwitchState, type AudienceSwitchState } from './rules';
import { createAudienceSwitch } from './view';

export type { AudienceSwitchState } from './rules';

export default defineGame<AudienceSwitchState>({
  metadata,
  create: createAudienceSwitch,
  isValidState: isAudienceSwitchState
});
