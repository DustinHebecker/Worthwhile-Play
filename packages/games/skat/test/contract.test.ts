// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const click = (root: HTMLElement, selector: string): boolean => {
  const el = root.querySelector<HTMLElement>(selector);
  el?.click();
  return !!el;
};

/**
 * Starts the series, then takes part in the bidding (passing) so the computers play on. The computers' moves are
 * revealed one by one (presentation only); "skip" shows the decided state at once.
 */
const skip = (root: HTMLElement) => click(root, '[data-testid="reveal-skip"]');
runGameContract(game, {
  interact: (root) => {
    click(root, '[data-testid="start"]');
    skip(root);
    click(root, '[data-testid="bid-pass"]');
    skip(root);
    click(root, '[data-testid="my-hand"] button:not([aria-disabled="true"])');
    skip(root);
  }
});
