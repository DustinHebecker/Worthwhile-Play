// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const byTestId = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`);

/** Writes a note, studies all five pairs (easy) and answers the first recall question through the DOM. */
function learnAndAnswer(root: HTMLElement) {
  const note = byTestId(root, 'as-note') as HTMLInputElement;
  note.value = 'a vivid scene';
  note.dispatchEvent(new Event('input', { bubbles: true }));
  for (let i = 0; i < 5; i++) byTestId(root, 'as-next')?.click();
  byTestId(root, 'as-option-1')?.click();
}

runGameContract(game, { interact: learnAndAnswer });
