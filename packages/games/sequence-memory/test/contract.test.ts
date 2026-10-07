// @ts-nocheck
// @vitest-environment jsdom
import type { GameInstance } from '@wp/game-core';
import { runGameContract } from '@wp/testing';
import game from '../src/index';
import { expectedAnswer, type SequenceState } from '../src/rules';

const byTestId = (root: HTMLElement, id: string) => root.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`);

/** Plays one round in Step mode (the default with reduced motion) through the DOM. */
async function playRoundInStepMode(root: HTMLElement, instance: GameInstance<SequenceState>) {
  byTestId(root, 'seq-start')?.click();
  const next = byTestId(root, 'seq-next');
  for (let guard = 0; next && !next.hidden && guard < 20; guard++) next.click();
  const state = instance.serialize();
  for (const tile of expectedAnswer(state.sequence, state.difficulty)) byTestId(root, `tile-${tile}`)?.click();
}

runGameContract(game, { interact: playRoundInStepMode });
