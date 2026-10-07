// @ts-nocheck
// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const click = (root: HTMLElement, position: number) => root.querySelector<HTMLButtonElement>(`[data-testid="card-${position}"]`)?.click();

runGameContract(game, {
  // Turn over three cards: the third either starts a new move or clears a pending mismatch.
  interact: (root) => {
    click(root, 0);
    click(root, 1);
    click(root, 2);
  }
});
