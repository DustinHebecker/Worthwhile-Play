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
    // Two experiments (the default difficulty uses a single number x), then an open test with one prediction.
    el(root, 'bb-run').click();
    type(el<HTMLInputElement>(root, 'bb-input-0'), '7');
    el(root, 'bb-run').click();
    el(root, 'bb-inc-0').click();
    el(root, 'bb-test').click();
    type(el<HTMLInputElement>(root, 'bb-predict-0'), '12');
  }
});
