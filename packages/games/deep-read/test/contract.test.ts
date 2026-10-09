// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const el = <T extends HTMLElement = HTMLElement>(root: HTMLElement, testId: string): T => {
  const found = root.querySelector<T>(`[data-testid="${testId}"]`);
  if (!found) throw new Error(`missing ${testId}`);
  return found;
};

runGameContract(game, {
  interact: (root) => {
    // Finish reading, answer the first question, move on, open the text and answer the second.
    el(root, 'dr-done-reading').click();
    el(root, 'dr-radio-a').click();
    el(root, 'dr-check').click();
    el(root, 'dr-next').click();
    el(root, 'dr-toggle-text').click();
    el(root, 'dr-radio-b').click();
    el(root, 'dr-check').click();
  }
});
