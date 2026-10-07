// @ts-nocheck
// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const click = (root: HTMLElement, selector: string) => {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`missing ${selector}`);
  el.click();
};

runGameContract(game, {
  // Open the first cell (creates the layout), switch to flag mode and flag a covered cell.
  interact: (root) => {
    click(root, '[data-testid="cell-0-0"]');
    click(root, '[data-testid="ms-mode-flag"]');
    click(root, '[data-cell][data-state="hidden"]');
  }
});
