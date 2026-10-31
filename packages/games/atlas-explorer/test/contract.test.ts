// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const click = (root: HTMLElement, selector: string) => root.querySelector<HTMLElement>(selector)?.click();

runGameContract(game, {
  // Change something and commit one step in whatever item the contract sampled (save/restore mid-round): a compare
  // item chooses its first option and checks; any other item is skipped ("Skip — just show me"); then "Next".
  interact: (root) => {
    const option = root.querySelector<HTMLInputElement>('[data-testid="ae-opt-0"]');
    if (option) {
      option.checked = true;
      option.dispatchEvent(new Event('change'));
      click(root, '[data-testid="ae-check"]');
    } else click(root, '[data-testid="ae-skip"]');
    click(root, '[data-testid="ae-next"]');
  }
});
