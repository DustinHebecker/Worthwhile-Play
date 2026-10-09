// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const click = (root: HTMLElement, id: string) => root.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`)!.click();

runGameContract(game, {
  interact: (root) => {
    click(root, 'move-left');
    click(root, 'rotate-cw');
    click(root, 'drop');
  }
});
