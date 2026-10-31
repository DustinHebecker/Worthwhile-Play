// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const click = (root: HTMLElement, selector: string) => root.querySelector<HTMLElement>(selector)?.click();

runGameContract(game, {
  // Change something and commit one step in whatever item the contract sampled (save/restore mid-round): an order item
  // moves its first card down first (the draft changes before the save); then "Skip — just show me" and "Next".
  interact: (root) => {
    click(root, '[data-testid="tl-down-0"]');
    click(root, '[data-testid="tl-skip"]');
    click(root, '[data-testid="tl-next"]');
  }
});
