// @vitest-environment jsdom
import type { GameInstance } from '@wp/game-core';
import { runGameContract } from '@wp/testing';
import game from '../src/index';
import { expectedCells, gridSide, type PatternState } from '../src/rules';

const byTestId = (root: HTMLElement, id: string) => root.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`);

/** Plays one round in Step mode (the default with reduced motion) through the DOM. */
function playRoundInStepMode(root: HTMLElement, instance: GameInstance<PatternState>) {
  byTestId(root, 'pm-show')?.click();
  byTestId(root, 'pm-memorised')?.click();
  const state = instance.serialize();
  for (const cell of expectedCells(state.pattern, gridSide(state.size), state.difficulty)) byTestId(root, `cell-${cell}`)?.click();
  byTestId(root, 'pm-done')?.click();
}

runGameContract(game, { interact: playRoundInStepMode });
