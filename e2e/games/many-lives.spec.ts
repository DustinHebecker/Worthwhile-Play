import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');

test('many lives: decisions and passed time survive a reload exactly', async ({ page }) => {
  await expectResumeAfterReload(page, 'many-lives', async (p) => {
    await expect(root(p).getByTestId('ml-event-title')).toHaveText('First day of school');
    await root(p).getByTestId('ml-choice-curious').click();
    await root(p).getByTestId('ml-next-event').click();
    await expect(root(p).getByTestId('ml-event-title')).toHaveText('The school recommendation');
  }, { settings: { household: 'de' } });
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

test('many lives: a life in the South Asian region starts at school with its own choices', async ({ page }) => {
  await startGame(page, 'many-lives', { settings: { household: 'street' } });
  await expect(root(page).getByTestId('ml-region')).toHaveText('A large country in South Asia (calibrated on India)');
  await expect(root(page).getByTestId('ml-event-title')).toHaveText('Starting school');
  await root(page).getByTestId('ml-choice-government').click();
  const saved = (await readSave(page, 'many-lives')) as { state: { life: { profileId: string; householdId: string } } };
  expect(saved.state.life.profileId).toBe('in');
  expect(saved.state.life.householdId).toBe('street');
});

test('many lives: other UI languages show the preview badge and the game in English', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('worthwhile-play:ui-locale', 'fr'));
  await startGame(page, 'many-lives');
  await expect(page.locator('[data-testid="preview-badge"]').first()).toBeVisible();
  await expect(page.getByTestId('shown-in-english')).toBeVisible();
  await expect(root(page)).toHaveAttribute('lang', 'en');
});
