// @ts-nocheck
// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const button = (root: HTMLElement, testId: string) => {
  const el = root.querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`);
  if (!el) throw new Error(`missing ${testId}`);
  return el;
};

runGameContract(game, {
  interact: (root) => {
    // Select blocks one by one and press the first enabled slide button until two blocks have
    // moved, then restart and undo the restart: moves, merges and the restart marker must all
    // survive save → restore.
    const blocks = [...root.querySelectorAll<HTMLElement>('[data-testid^="block-"]')];
    const moves = () => Number(button(root, 'moves').dataset.value);
    for (const block of blocks) {
      if (moves() >= 2) break;
      block.click();
      for (const dir of ['up', 'down', 'left', 'right']) {
        const before = moves();
        const slide = button(root, `slide-${dir}`);
        if (slide.disabled) continue;
        slide.click();
        if (moves() > before) break;
      }
    }
    if (moves() < 1) throw new Error('no block could move');
    button(root, 'restart').click();
    button(root, 'undo').click();
  }
});
