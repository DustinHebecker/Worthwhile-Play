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
    // One full guess via the on-screen keyboard, then a partial word that must survive save/restore.
    for (const letter of 'qzqzq') click(root, `wg-key-${letter}`);
    click(root, 'wg-enter');
    click(root, 'wg-key-a');
    click(root, 'wg-key-b');
  }
});
