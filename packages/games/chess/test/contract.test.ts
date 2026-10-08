// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const click = (root: HTMLElement, square: string) => root.querySelector<HTMLButtonElement>(`[data-testid="sq-${square}"]`)!.click();

runGameContract(game, {
  interact: (root) => {
    // 1. e4 (the computer answers in the same step), then a knight move.
    click(root, 'e2');
    click(root, 'e4');
    click(root, 'g1');
    click(root, 'f3');
  }
});
