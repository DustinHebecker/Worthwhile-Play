// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import { fixtureGame } from './game';

const click = (root: HTMLElement, id: string) => root.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`)?.click();

runGameContract(fixtureGame(), {
  // Take the rope through the text view: open the place, choose "Take".
  interact: (root) => {
    click(root, 'hs-rope');
    click(root, 'act-take-rope');
  }
});
