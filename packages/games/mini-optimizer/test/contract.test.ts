// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

runGameContract(game, {
  // Whatever kind was generated: build the first road, add the first customer, or make one more of the first product.
  interact: (root) => {
    root.querySelector<Element>('[data-link], [data-stop], [data-testid^="plus-"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }
});
