// @vitest-environment jsdom
import type { GameInstance } from '@wp/game-core';
import { runGameContract } from '@wp/testing';
import game from '../src/index';
import type { SearchState } from '../src/rules';

const byTestId = (root: HTMLElement, id: string) => root.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`);

/** Starts the round, answers the first board by selecting a shape and moves on to the second. */
function startAndAnswer(root: HTMLElement, _instance: GameInstance<SearchState>) {
  byTestId(root, 'vs-start')?.click();
  byTestId(root, 'vs-item-0')?.click();
  byTestId(root, 'vs-next')?.click();
  byTestId(root, 'vs-item-1')?.click();
}

runGameContract(game, { interact: startAndAnswer });
