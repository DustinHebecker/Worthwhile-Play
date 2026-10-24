import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');

test('many lives: decisions and passed time survive a reload exactly', async ({ page }) => {
  await expectResumeAfterReload(page, 'many-lives', async (p) => {
    await expect(root(p).getByTestId('ml-event-title')).toHaveText('First day of school');
    await root(p).getByTestId('ml-choice-curious').click();
    await root(p).getByTestId('ml-next-event').click();
    await expect(root(p).getByTestId('ml-event-title')).toHaveText('The school recommendation');
  });
  await expect(root(page).getByTestId('ml-event-title')).toHaveText('The school recommendation');
  const saved = (await readSave(page, 'many-lives')) as { state: { life: { flags: string[] } } };
  expect(saved.state.life.flags).toContain('trait.curious');
});

test('many lives: the work-in-progress note and the household setting', async ({ page }) => {
  await startGame(page, 'many-lives', { settings: { household: 'basic-support' } });
  await expect(root(page).getByTestId('ml-wip')).toBeVisible();
  await expect(root(page).getByTestId('ml-event-title')).toHaveText('First day of school');
  const saved = (await readSave(page, 'many-lives')) as { state: { household: string; life: { householdId: string } } };
  expect(saved.state.life.householdId).toBe('basic-support');
});
