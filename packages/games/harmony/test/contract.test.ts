// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const click = (root: HTMLElement, selector: string) => root.querySelector<HTMLElement>(selector)?.click();

runGameContract(game, {
  // Whatever the contract sampled: choose the first option and check (quiz), toggle a key and check (build), or hold
  // a key (free keyboard). jsdom has no Web Audio, so by-ear questions show their picture (design § 5.1).
  interact: (root) => {
    const option = root.querySelector<HTMLInputElement>('[data-testid="hm-opt-0"]');
    if (option) {
      option.checked = true;
      option.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const key = [...root.querySelectorAll<HTMLElement>('.hm-key')].find((k) => k.getAttribute('aria-disabled') !== 'true' && k.getAttribute('aria-pressed') === 'false');
    key?.click();
    click(root, '[data-testid="hm-check"]');
  }
});
