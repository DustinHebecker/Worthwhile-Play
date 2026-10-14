import { defineGame } from '@wp/game-core';
import { metadata } from './metadata';
import { isLogicPathState, type LogicPathState } from './rules';
import { createLogicPath } from './view';

export type { LogicPathState } from './rules';

export default defineGame<LogicPathState>({
  metadata,
  create: createLogicPath,
  isValidState: isLogicPathState
});
