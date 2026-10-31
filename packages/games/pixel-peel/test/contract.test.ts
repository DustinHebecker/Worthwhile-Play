// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import { loadAllArt } from '../src/catalogue';
import game from '../src/index';

// jsdom has no canvas: the view then draws nothing (as on a host without 2D canvas) and stays fully usable.
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;

// The host awaits `prepare` before each new game (it loads that picture's art); the contract starts games directly.
await loadAllArt();

runGameContract(game, {
  // With all slots free at the start, every lane front is legal at every difficulty: it is used up or parks.
  interact: (root) => {
    root.querySelector<HTMLButtonElement>('[data-testid="pp-lane-0"]')!.click();
  }
});
