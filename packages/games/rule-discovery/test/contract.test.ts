// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const el = <T extends HTMLElement = HTMLElement>(root: HTMLElement, testId: string): T => {
  const found = root.querySelector<T>(`[data-testid="${testId}"]`);
  if (!found) throw new Error(`missing ${testId}`);
  return found;
};

const type = (field: HTMLInputElement, value: string) => {
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
};

runGameContract(game, {
  interact: (root) => {
    // Two tests with triples that can never equal each other, then a partly edited draft.
    type(el<HTMLInputElement>(root, 'rd-input-0'), '20');
    type(el<HTMLInputElement>(root, 'rd-input-1'), '20');
    type(el<HTMLInputElement>(root, 'rd-input-2'), '19');
    el(root, 'rd-test').click();
    type(el<HTMLInputElement>(root, 'rd-input-2'), '18');
    el(root, 'rd-test').click();
    type(el<HTMLInputElement>(root, 'rd-input-0'), '3');
  }
});
