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
    // Open valves 1 and 2, close 2 again (undo), run one tick: valve history and tick must survive.
    click(root, '[data-testid="valve-1"]');
    click(root, '[data-testid="valve-2"]');
    click(root, '[data-testid="fl-undo"]');
    click(root, '[data-testid="fl-step"]');
  }
});
