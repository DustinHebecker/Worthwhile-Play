// @vitest-environment jsdom
import type { GameInstance } from '@wp/game-core';
import { runGameContract } from '@wp/testing';
import game from '../src/index';
import type { SignalState } from '../src/rules';

const byTestId = (root: HTMLElement, id: string) => root.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`);

/** Starts the session and responds once to the first stimulus through the DOM. */
function startAndRespond(root: HTMLElement, _instance: GameInstance<SignalState>) {
  byTestId(root, 'sw-start')?.click();
  byTestId(root, 'sw-respond')?.click();
}

runGameContract(game, { interact: startAndRespond });
