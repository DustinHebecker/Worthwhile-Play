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
    // D-pad steps (some may push a crate), a restart and its undo, then a tap-to-walk:
    // history, restart markers and the walk entry must all survive save → restore.
    click(root, 'move-down');
    click(root, 'move-up');
    click(root, 'move-right');
    click(root, 'restart');
    click(root, 'undo');
    click(root, 'move-left');
    click(root, 'tile-1-2');
  }
});
