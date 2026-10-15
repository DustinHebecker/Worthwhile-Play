// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

runGameContract(game, {
  interact: (root) => {
    // Start from the setup screen, then take the main action once (open the door, or whatever is due).
    root.querySelector<HTMLButtonElement>('[data-testid="start"]')?.click();
    for (const id of ['open', 'rummage', 'pass', 'roll', 'end']) {
      const b = root.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`);
      if (b && !b.disabled) {
        b.click();
        break;
      }
    }
  }
});
