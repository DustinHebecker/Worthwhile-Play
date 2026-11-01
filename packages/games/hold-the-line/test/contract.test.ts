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
    // Build a Gun in the own half, buy two units and take one back.
    click(root, 'cell-5-12');
    click(root, 'build-gun');
    click(root, 'buy-walker');
    click(root, 'buy-runner');
    click(root, 'unbuy-0');
  }
});
