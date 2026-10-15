// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const click = (root: HTMLElement, testid: string) => {
  const el = root.querySelector<HTMLButtonElement>(`[data-testid="${testid}"]`);
  el?.click();
  return el !== null;
};

runGameContract(game, {
  interact: (root) => {
    click(root, 'pk-start');
    // One action in the first hand: check if free, else call.
    if (!click(root, 'pk-check')) click(root, 'pk-call');
  }
});
