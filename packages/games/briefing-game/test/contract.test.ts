// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const el = <T extends HTMLElement = HTMLElement>(root: HTMLElement, selector: string): T => {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(`missing ${selector}`);
  return found;
};

/** Chooses `value` in the n-th section menu, as a person would. */
function sortCard(root: HTMLElement, index: number, value: string) {
  const select = root.querySelectorAll<HTMLSelectElement>('select[data-testid^="bg-select-"]')[index]!;
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

runGameContract(game, {
  interact: (root) => {
    // Sort every card (first two as facts, the rest left out), check, and pick a decision.
    const count = root.querySelectorAll('select[data-testid^="bg-select-"]').length;
    for (let i = 0; i < count; i++) sortCard(root, i, i < 2 ? 'facts' : 'leave');
    el(root, '[data-testid="bg-check-sort"]').click();
    el<HTMLInputElement>(root, '[data-testid="bg-decision-1"]').click();
  }
});
