// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';
import type { SlitherlinkState } from '../src/rules';

const click = (root: HTMLElement, testId: string) => {
  const el = root.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  if (!el) throw new Error(`missing ${testId}`);
  el.click();
};

runGameContract<SlitherlinkState>(game, {
  // Draw the top-left edge, cross the one below the first row, then use Check.
  interact: (root) => {
    click(root, 'edge-h-0-0');
    click(root, 'edge-v-0-0');
    click(root, 'edge-v-0-0');
    click(root, 'sl-check');
  }
});
