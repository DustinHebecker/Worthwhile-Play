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
    // Select a pad, build a Gun, upgrade it to a Cannon and build a Laser on another pad.
    click(root, 'cell-2-2');
    click(root, 'build-gun');
    click(root, 'upgrade-cannon');
    click(root, 'cell-2-4');
    click(root, 'build-laser');
  }
});
