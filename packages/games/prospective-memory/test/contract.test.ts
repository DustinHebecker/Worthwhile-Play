// @vitest-environment jsdom
import type { GameInstance } from '@wp/game-core';
import { runGameContract } from '@wp/testing';
import game from '../src/index';
import type { ProspectiveState } from '../src/rules';

const byTestId = (root: HTMLElement, id: string) => root.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`);

/** Starts the block and answers the first shapes through the DOM. */
function startAndAnswer(root: HTMLElement, _instance: GameInstance<ProspectiveState>) {
  byTestId(root, 'pm-start')?.click();
  byTestId(root, 'pm-round')?.click();
  byTestId(root, 'pm-angular')?.click();
  byTestId(root, 'pm-note')?.click();
}

runGameContract(game, { interact: startAndAnswer });
