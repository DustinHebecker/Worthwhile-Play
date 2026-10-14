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
    // Two steps of the run, then suspect rule 1 and pick a replacement (no check yet).
    click(root, 'ds-step');
    click(root, 'ds-step');
    click(root, 'ds-rule-0');
    click(root, 'ds-fix-1');
  }
});
