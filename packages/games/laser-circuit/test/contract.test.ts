// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const cells = (root: HTMLElement, element: string) => [...root.querySelectorAll<HTMLElement>(`[data-testid^="cell-"][data-element="${element}"]`)];

runGameContract(game, {
  interact: (root) => {
    // Pick the first piece, place it on an empty square, turn it, place another one,
    // then use Remove mode and Undo: pieces, orientations, moves and the undo stack must all
    // survive save → restore.
    root.querySelector<HTMLElement>('[data-testid^="inv-"]')!.click();
    const [first, second] = cells(root, 'empty');
    first!.click();
    first!.click();
    second!.click();
    root.querySelector<HTMLElement>('[data-testid="mode-remove"]')!.click();
    first!.click();
    root.querySelector<HTMLElement>('[data-testid="undo"]')!.click();
  }
});
