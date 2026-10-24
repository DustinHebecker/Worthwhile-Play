// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const el = <T extends HTMLElement = HTMLElement>(root: HTMLElement, selector: string): T => {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(`missing ${selector}`);
  return found;
};

const type = (field: HTMLInputElement, value: string) => {
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
};

runGameContract(game, {
  // Type a first guess, commit it, then half-fill the model (save/restore in the middle of a question).
  interact: (root) => {
    type(el<HTMLInputElement>(root, '[data-testid="fl-est-input"]'), '3.5');
    el(root, '[data-testid="fl-est-exp-plus"]').click();
    el(root, '[data-testid="fl-guess"]').click();
    const field = root.querySelector<HTMLInputElement>('.fl-row [data-testid$="-input"]');
    if (field) type(field, '12');
  }
});
