// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const byTestId = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`);

/** Picks a feature, writes a note, meets all four people (easy), answers two questions and leaves the second answered. */
function studyAndAnswer(root: HTMLElement) {
  root.querySelector<HTMLElement>('[data-testid^="fn-standout-"]')?.click();
  const note = byTestId(root, 'fn-note') as HTMLInputElement;
  note.value = 'Sarah → Sahara';
  note.dispatchEvent(new Event('input', { bubbles: true }));
  for (let i = 0; i < 4; i++) byTestId(root, 'fn-next')?.click();
  byTestId(root, 'fn-option-0')?.click();
  byTestId(root, 'fn-continue')?.click();
  byTestId(root, 'fn-option-1')?.click();
}

runGameContract(game, { interact: studyAndAnswer });
