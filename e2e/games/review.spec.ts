import { expect, test } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

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
