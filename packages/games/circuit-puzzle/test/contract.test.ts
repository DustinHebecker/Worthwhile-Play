// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const tile = (root: HTMLElement, r: number, c: number) => {
  const el = root.querySelector<HTMLElement>(`[data-testid="tile-${r}-${c}"]`);
  if (!el) throw new Error(`missing tile-${r}-${c}`);
  return el;
};

runGameContract(game, {
  // Turn two tiles clockwise, one counter-clockwise (right-click), then undo once.
  interact: (root) => {
    tile(root, 0, 0).click();
    tile(root, 1, 2).click();
    tile(root, 2, 1).dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    root.querySelector<HTMLElement>('[data-testid="cp-undo"]')?.click();
  }
});
