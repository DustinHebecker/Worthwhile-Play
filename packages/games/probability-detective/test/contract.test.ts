// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const click = (root: HTMLElement, selector: string) => root.querySelector<HTMLElement>(selector)?.click();

runGameContract(game, {
  // Change something and commit one step in whatever mode the contract sampled (save/restore mid-round):
  // a clue case moves the belief and commits; a checks case runs a check; a trap answers its first question.
  interact: (root) => {
    click(root, '[data-act="plus"]');
    click(root, '[data-testid="pd-commit"]');
    click(root, '[data-testid="pd-run-0"]');
    click(root, '[data-testid="pd-q0-o0"]');
  }
});
