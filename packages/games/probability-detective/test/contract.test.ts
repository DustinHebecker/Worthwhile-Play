// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

runGameContract(game, {
  // Move the belief one step, then commit the first clue (save/restore in the middle of a case).
  interact: (root) => {
    root.querySelector<HTMLElement>('[data-act="plus"]')?.click();
    root.querySelector<HTMLElement>('[data-testid="pd-commit"]')?.click();
  }
});
