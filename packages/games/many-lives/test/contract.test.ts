// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const click = (root: HTMLElement, selector: string) => {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`missing ${selector}`);
  el.click();
};

// English and German first (owner decision O28); the other locales follow before the full release.
runGameContract(game, {
  locales: ['en', 'de'],
  // Decide the first event (first option), then let time run to the next event.
  interact: (root) => {
    click(root, '.ml-choices button');
    const next = root.querySelector<HTMLElement>('[data-testid="ml-next-event"]');
    next?.click();
  }
});
