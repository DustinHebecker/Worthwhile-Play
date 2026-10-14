// @vitest-environment jsdom
import type { GameInstance } from '@wp/game-core';
import { runGameContract } from '@wp/testing';
import game from '../src/index';
import type { NBackState } from '../src/rules';

const byTestId = (root: HTMLElement, id: string) => root.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`);

/** Starts the block, passes the first (warm-up) item and answers the second through the DOM. */
function startAndAnswer(root: HTMLElement, _instance: GameInstance<NBackState>) {
  byTestId(root, 'nb-start')?.click();
  byTestId(root, 'nb-next')?.click();
  byTestId(root, 'nb-match')?.click();
}

runGameContract(game, { interact: startAndAnswer });
