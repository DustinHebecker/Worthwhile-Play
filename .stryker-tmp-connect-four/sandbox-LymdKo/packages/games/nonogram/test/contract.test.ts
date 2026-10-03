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
  // Fill two cells, switch to cross mode, cross a third, then use the check.
  interact: (root) => {
    click(root, 'cell-0-0');
    click(root, 'cell-1-1');
    click(root, 'ng-mode-cross');
    click(root, 'cell-2-2');
    click(root, 'ng-check');
  }
});
