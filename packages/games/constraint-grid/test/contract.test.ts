// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const click = (root: HTMLElement, testId: string) => {
  const el = root.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  if (!el) throw new Error(`missing ${testId}`);
  el.click();
};

runGameContract(game, {
  // Mark a cell ✗, another ✓ (with auto-✗), tick off a clue, then check.
  interact: (root) => {
    click(root, 'cell-0-1-0-0');
    click(root, 'cell-0-2-1-1');
    click(root, 'cell-0-2-1-1');
    click(root, 'clue-0');
    click(root, 'cg-check');
  }
});
