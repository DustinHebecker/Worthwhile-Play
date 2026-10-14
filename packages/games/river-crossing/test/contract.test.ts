// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const click = (root: HTMLElement, selector: string) => {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`missing ${selector}`);
  el.click();
};

runGameContract(game, {
  interact: (root) => {
    // The first entity of every easy puzzle can row: board it, cross, undo, board a second
    // entity too (where seats allow) and cross again — history and boat load must survive.
    click(root, '[data-testid^="entity-"][data-side="left"]');
    click(root, '[data-testid="rc-cross"]');
    click(root, '[data-testid="rc-undo"]');
    click(root, '[data-testid^="entity-"][data-side="left"]');
    click(root, '[data-testid="rc-cross"]');
  }
});
