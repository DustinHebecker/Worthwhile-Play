// @ts-nocheck
// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const click = (root: HTMLElement, selector: string) => root.querySelector<HTMLElement | SVGElement>(selector)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

/** Selects something on the current task: the first point/connection, or the number 1. */
function select(root: HTMLElement) {
  const type = root.querySelector<HTMLElement>('[data-testid="gd-task"]')!.dataset.type;
  if (type === 'mincut') click(root, '[data-testid="gd-choice-1"]');
  else click(root, '.gd-diagram [role="button"]');
}

runGameContract(game, {
  interact: (root) => {
    // Select and check an answer (right or wrong), reveal the solution, move on, and leave a
    // half-made selection on the second task: attempts, answers and the selection must survive.
    select(root);
    if (root.querySelector<HTMLButtonElement>('[data-testid="gd-submit"]')!.disabled) select(root);
    click(root, '[data-testid="gd-submit"]');
    click(root, '[data-testid="gd-solution"]');
    click(root, '[data-testid="gd-next"]');
    select(root);
  }
});
