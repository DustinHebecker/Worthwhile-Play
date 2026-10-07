// @ts-nocheck
// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const click = (root: HTMLElement, testId: string) => {
  const el = root.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  if (!el) throw new Error(`missing ${testId}`);
  el.click();
};

runGameContract(game, {
  // Select two open cells: enter a height in one, a pencil note in the other, then check.
  interact: (root) => {
    const open = [...root.querySelectorAll<HTMLElement>('[data-cell][data-given="false"]')];
    if (open.length < 2) throw new Error('expected open cells');
    open[0]?.click();
    click(root, 'sk-pad-1');
    click(root, 'sk-notes');
    open[1]?.click();
    click(root, 'sk-pad-2');
    click(root, 'sk-check');
  }
});
