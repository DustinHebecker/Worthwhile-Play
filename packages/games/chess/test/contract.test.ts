// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const click = (root: HTMLElement, id: string) => root.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`)!.click();

runGameContract(game, {
  interact: (root) => {
    // 1. e4 (the computer answers in the same step), then a knight move.
    click(root, 'sq-e2');
    click(root, 'sq-e4');
    click(root, 'sq-g1');
    click(root, 'sq-f3');
    // An open variation board with a move on it is part of the state that must resume.
    click(root, 'variation-open');
    click(root, 'var-sq-b1');
    click(root, 'var-sq-c3');
  }
});
