// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

runGameContract(game, {
  // Change something in whatever the contract sampled, so that save/restore is checked mid-game: in predict the first
  // answer option becomes the draft; in goal and explore mode "4 weeks" runs the notebook on.
  interact: (root) => {
    root.querySelector<HTMLInputElement>('.eco-options input')?.click();
    root.querySelector<HTMLElement>('[data-testid="eco-run-4"]')?.click();
  }
});
