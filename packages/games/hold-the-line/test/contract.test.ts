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
    // Duel with production (the default): a Gun and a Drill yard in the own half.
    click(root, 'cell-5-12');
    click(root, 'build-gun');
    click(root, 'cell-1-13');
    click(root, 'build-barracks');
  }
});
