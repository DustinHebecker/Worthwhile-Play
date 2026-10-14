// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const el = <T extends HTMLElement = HTMLElement>(root: HTMLElement, selector: string): T => {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(`missing ${selector}`);
  return found;
};

runGameContract(game, {
  interact: (root) => {
    // Tick two sentences, check step 1, move on and pick a first bullet.
    root.querySelectorAll<HTMLInputElement>('[data-testid^="cc-sentence-"]')[1]!.click();
    root.querySelectorAll<HTMLInputElement>('[data-testid^="cc-sentence-"]')[2]!.click();
    el(root, '[data-testid="cc-check"]').click();
    el(root, '[data-testid="cc-next"]').click();
    el<HTMLInputElement>(root, '[data-testid="cc-bullet-0"]').click();
  }
});
