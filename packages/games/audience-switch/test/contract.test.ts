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
    // Tick the first two fact cards, continue, pick the first as opening and check.
    const boxes = root.querySelectorAll<HTMLInputElement>('[data-testid^="as-fact-"]');
    boxes[0]!.click();
    root.querySelectorAll<HTMLInputElement>('[data-testid^="as-fact-"]')[1]!.click();
    el(root, '[data-testid="as-continue"]').click();
    el<HTMLInputElement>(root, '[data-testid^="as-lead-"]').click();
    el(root, '[data-testid="as-check-selection"]').click();
    el<HTMLInputElement>(root, '[data-testid="as-message-1"]').click();
  }
});
