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
  interact: (root) => {
    // One full guess, then a partial draft that must survive save/restore.
    for (const s of [0, 1, 2, 3]) click(root, `mm-palette-${s}`);
    click(root, 'mm-submit');
    click(root, 'mm-palette-4');
    click(root, 'mm-palette-5');
  }
});
