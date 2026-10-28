// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const click = (root: HTMLElement, testid: string) => root.querySelector<HTMLElement>(`[data-testid="${testid}"]`)?.click();

runGameContract(game, {
  // Whatever the contract sampled: choose the first option (predict) or place a tray part (build), then "Let go".
  interact: (root) => {
    const option = root.querySelector<HTMLInputElement>('[data-testid="bl-opt-0"]');
    if (option) {
      option.checked = true;
      option.dispatchEvent(new Event('change', { bubbles: true }));
    }
    click(root, 'bl-tray-0');
    click(root, 'bl-place');
    click(root, 'bl-step-right');
    click(root, 'bl-letgo');
  }
});
