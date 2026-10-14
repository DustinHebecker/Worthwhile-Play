// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const dropInto = (root: HTMLElement, preferred: number) => {
  const column =
    root.querySelector<HTMLButtonElement>(`[data-testid="column-${preferred}"][aria-disabled="false"]`) ??
    root.querySelector<HTMLButtonElement>('[data-column][aria-disabled="false"]');
  column?.click();
};

runGameContract(game, {
  interact: (root) => {
    dropInto(root, 3);
    dropInto(root, 2);
  }
});
