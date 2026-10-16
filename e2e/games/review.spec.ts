import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, newGame, readSave, startGame } from '../../packages/testing/src/e2e';

test('Review resumes at the same card after a reload', async ({ page }) => {
  await expectResumeAfterReload(page, 'review', async (p) => {
    // A fresh device has nothing due: it says so and offers practice.
    await expect(p.getByTestId('review-empty')).toBeVisible();
    await p.getByTestId('review-practice').click();
    await p.getByTestId('review-reveal').click();
    await p.getByTestId('review-rate-good').click();
    await expect(p.getByTestId('review-progress')).toHaveText('Card 2 of 10');
  });
  await expect(page.getByTestId('review-progress')).toHaveText('Card 2 of 10');
  const save = (await readSave(page, 'review')) as { state: { mode: string; index: number } };
  expect(save.state).toMatchObject({ mode: 'practice', index: 1 });
});

const savedState = async (page: Page) => ((await readSave(page, 'review')) as { state?: unknown } | undefined)?.state;

test('Review: deck, direction and cards are chosen on the start screen only', async ({ page }) => {
  await startGame(page, 'review', { settings: { deck: 'flags', direction: 'forward', mode: 'practice' } });
  // Nothing of it is inside the game any more (ADR 0017).
  await expect(page.getByTestId('game-root').locator('select')).toHaveCount(0);
  await expect(page.getByTestId('review-progress')).toHaveText('Card 1 of 10');
  await expect(page.getByTestId('review-languages')).toHaveText('Country names in English');
  await expect.poll(() => savedState(page)).toMatchObject({ deckId: 'flags', direction: 'forward', mode: 'practice' });
  await expect(page.getByTestId('settings-summary')).toHaveText('Flags & countries · Front → back · Practice (schedule unchanged)');

  await newGame(page, { settings: { deck: 'capitals', direction: 'backward', mode: 'new' } });
  await expect(page.getByTestId('review-progress')).toHaveText('Card 1 of 10');
  await expect.poll(() => savedState(page)).toMatchObject({ deckId: 'capitals', direction: 'backward', mode: 'new' });
  const save = (await readSave(page, 'review')) as { settings: Record<string, unknown> };
  expect(save.settings).toEqual({ deck: 'capitals', direction: 'backward', mode: 'new' });
});
