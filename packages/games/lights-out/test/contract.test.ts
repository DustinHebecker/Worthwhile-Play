// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const click = (root: HTMLElement, testId: string) => {
  const el = root.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  if (!el) throw new Error(`missing ${testId}`);
  el.click();
};

runGameContract(game, {
  interact: (root) => {
    // Two presses, an undo, another press and a hint: history, hint count and highlight must survive.
    click(root, 'cell-0-0');
    click(root, 'cell-1-1');
    click(root, 'undo');
    click(root, 'cell-2-2');
    click(root, 'hint');
  }
});
