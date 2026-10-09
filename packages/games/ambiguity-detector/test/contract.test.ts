// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import game from '../src/index';

const el = (root: HTMLElement, testId: string): HTMLElement => {
  const found = root.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  if (!found) throw new Error(`missing ${testId}`);
  return found;
};

runGameContract(game, {
  interact: (root) => {
    // Tick two dimensions, write an own question, check, then pick the clear reply.
    el(root, 'ad-dim-what').click();
    el(root, 'ad-dim-where').click();
    const note = el(root, 'ad-note') as HTMLTextAreaElement;
    note.value = 'What exactly do you need?';
    note.dispatchEvent(new Event('input', { bubbles: true }));
    el(root, 'ad-check').click();
    el(root, 'ad-reply-clear').click();
  }
});
