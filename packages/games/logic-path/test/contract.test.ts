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
    // Build a program, remove a step, undo the removal and run it: the draft, undo stack
    // and run stats must all survive save → restore.
    click(root, 'cmd-forward');
    click(root, 'cmd-right');
    click(root, 'cmd-forward');
    click(root, 'prog-1');
    click(root, 'lp-undo');
    click(root, 'lp-run');
    click(root, 'cmd-left');
  }
});
