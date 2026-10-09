// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

runGameContract(game, {
  // Apply an applicable rule, tap an inapplicable one (refused), then apply another.
  interact: (root) => {
    const ready = () => root.querySelector<HTMLElement>('[data-testid^="rule-"][data-applicable="true"]');
    const first = ready();
    if (!first) throw new Error('expected an applicable rule');
    first.click();
    root.querySelector<HTMLElement>('[data-testid^="rule-"][data-applicable="false"]')?.click();
    ready()?.click();
  }
});
