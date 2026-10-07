// @ts-nocheck
// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const clickFirstEmpty = (root: HTMLElement, preferred: number) => {
  const cell =
    root.querySelector<HTMLButtonElement>(`[data-testid="cell-${preferred}"][data-mark=""]`) ??
    root.querySelector<HTMLButtonElement>('[data-cell][data-mark=""]');
  cell?.click();
};

runGameContract(game, {
  interact: (root) => {
    clickFirstEmpty(root, 4);
    clickFirstEmpty(root, 0);
  }
});
