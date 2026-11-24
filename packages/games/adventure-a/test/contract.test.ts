// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const click = (root: HTMLElement, id: string) => root.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`)?.click();

runGameContract(game, {
  // Take the lamp from its post through the text view.
  interact: (root) => {
    click(root, 'hs-lamp');
    click(root, 'act-take-lamp');
  }
});
