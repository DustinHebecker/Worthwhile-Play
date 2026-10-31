// @vitest-environment jsdom
import { runGameContract } from '@wp/testing';
import { applyReview, builtinItemIds, createLearningRecords, type LearningRecord } from '@wp/learning-content';
import game from '../src/index';

const click = (root: HTMLElement, testId: string) => root.querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`)?.click();

/** Reveal and rate two cards. */
const interact = (root: HTMLElement) => {
  for (const rating of ['good', 'again']) {
    click(root, 'review-reveal');
    click(root, `review-rate-${rating}`);
  }
};

// Without learning records (practice only) …
runGameContract(game, { interact });

// … and with learning records where six "First words" (English, the test UI language) are due.
const dueRecords = (): LearningRecord[] =>
  (builtinItemIds('first-words') ?? []).slice(0, 6).map(
    (itemId) => applyReview(undefined, { deckId: 'first-words:en', itemId, direction: 'forward', rating: 'hard', session: 'earlier', day: '2026-03-01' }) as LearningRecord
  );
runGameContract(game, {
  interact,
  extras: () => ({ learning: createLearningRecords(dueRecords(), { today: () => '2026-03-10' }) })
});
