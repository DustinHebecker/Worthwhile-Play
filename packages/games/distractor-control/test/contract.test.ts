// @vitest-environment jsdom
import type { GameInstance } from '@wp/game-core';
import { runGameContract } from '@wp/testing';
import game from '../src/index';
import type { DistractorState } from '../src/rules';

const byTestId = (root: HTMLElement, id: string) => root.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`);

/** Starts the session and sorts the first two numbers through the DOM. */
function startAndAnswer(root: HTMLElement, _instance: GameInstance<DistractorState>) {
  byTestId(root, 'dc-start')?.click();
  byTestId(root, 'dc-answer-even')?.click();
  byTestId(root, 'dc-answer-odd')?.click();
}

runGameContract(game, { interact: startAndAnswer });
