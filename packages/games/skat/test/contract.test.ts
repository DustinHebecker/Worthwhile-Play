// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const click = (root: HTMLElement, selector: string): boolean => {
  const el = root.querySelector<HTMLElement>(selector);
  el?.click();
  return !!el;
};

/** Starts the series, then takes part in the bidding (passing) so the computers play on. */
runGameContract(game, {
  interact: (root) => {
    click(root, '[data-testid="start"]');
    click(root, '[data-testid="bid-pass"]');
    click(root, '[data-testid="my-hand"] button:not([aria-disabled="true"])');
  }
});
