import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';
import { de } from '../../packages/games/deep-read/src/content/de';
import { ja } from '../../packages/games/deep-read/src/content/ja';
import { uk } from '../../packages/games/deep-read/src/content/uk';

const root = (page: Page) => page.getByTestId('game-root');

test('deep-read: an answered question and its explanation survive a reload', async ({ page }) => {
  await expectResumeAfterReload(page, 'deep-read', async (p) => {
    await expect(root(p).getByTestId('dr-reading')).toBeVisible();
    await root(p).getByTestId('dr-done-reading').click();
    await root(p).getByTestId('dr-option-a').click();
    await root(p).getByTestId('dr-check').click();
    await expect(root(p).getByTestId('dr-feedback')).toHaveAttribute('data-answer', 'a');
  });

  // The restored game shows the same answered question with its feedback and explanations.
  const feedback = root(page).getByTestId('dr-feedback');
  await expect(feedback).toBeVisible();
  await expect(feedback).toHaveAttribute('data-answer', 'a');
  await expect(root(page).getByTestId('dr-question')).toHaveAttribute('data-question', 'q1');
  await expect(root(page).getByTestId('dr-explain-a')).toHaveAttribute('data-chosen', 'true');
  await expect(root(page).locator('[data-gold="true"]')).toHaveCount(1);
  await expect(root(page).getByTestId('dr-see')).toBeVisible();
  await expect(root(page).getByTestId('dr-next')).toBeVisible();
});

test('deep-read: the text can be re-opened while answering and is noted as looked back', async ({ page }) => {
  await page.goto('/games/deep-read');
  await page.getByTestId('new-game').click();
  await root(page).getByTestId('dr-done-reading').click();
  await expect(root(page).getByTestId('dr-text')).toHaveCount(0);
  await root(page).getByTestId('dr-toggle-text').click();
  await expect(root(page).getByTestId('dr-text')).toBeVisible();
  await root(page).getByTestId('dr-option-b').click();
  await root(page).getByTestId('dr-check').click();
  await expect(root(page).getByTestId('dr-looked-back')).toBeVisible();
});

/** Id of the text in the current save, once the autosave has written it. */
async function savedTextId(page: Page): Promise<string> {
  let id: string | undefined;
  await expect.poll(async () => (id = ((await readSave(page, 'deep-read')) as { state?: { textId?: string } } | undefined)?.state?.textId)).toBeTruthy();
  return id as string;
}

/** Switches the UI language through the header menu (re-renders the current page). */
async function switchLanguage(page: Page, locale: string): Promise<void> {
  await page.getByTestId('language-menu').locator('summary').click();
  await page.getByTestId('header-language').selectOption(locale);
  await expect(page.locator('html')).toHaveAttribute('lang', locale);
}

test('deep-read: texts load in the UI language and a running game continues in a newly chosen language', async ({ page }) => {
  await page.goto('/games/deep-read');
  await switchLanguage(page, 'de');
  await page.getByTestId('new-game').click();
  const textId = await savedTextId(page);
  await expect(root(page).getByTestId('dr-title')).toHaveText(de[textId]!.title);
  await expect(root(page).getByTestId('dr-text')).toContainText(de[textId]!.paragraphs[0]!);

  await root(page).getByTestId('dr-done-reading').click();
  await root(page).getByTestId('dr-option-a').click();
  await root(page).getByTestId('dr-check').click();
  await expect(root(page).getByTestId('dr-feedback')).toHaveAttribute('data-answer', 'a');
  await expect(root(page).getByTestId('dr-question')).toContainText(de[textId]!.questions.q1!.q);

  // The game page re-renders in Japanese (loading the Japanese texts); the saved game continues there.
  await switchLanguage(page, 'ja');
  await page.getByTestId('continue').click();
  await expect(root(page).getByTestId('dr-question')).toHaveAttribute('data-question', 'q1');
  await expect(root(page).getByTestId('dr-feedback')).toHaveAttribute('data-answer', 'a');
  await expect(root(page).getByTestId('dr-question')).toContainText(ja[textId]!.questions.q1!.q);
  await expect(root(page).getByTestId('dr-title')).toHaveText(ja[textId]!.title);
  expect(await savedTextId(page)).toBe(textId);
});

test('deep-read: texts of a language never loaded before are available offline (precached)', async ({ page, context }) => {
  await page.goto('/games/deep-read');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.getByTestId('new-game').click();
  const textId = await savedTextId(page);
  await context.setOffline(true);
  await switchLanguage(page, 'uk');
  await page.getByTestId('continue').click();
  await expect(root(page).getByTestId('dr-title')).toHaveText(uk[textId]!.title);
  await context.setOffline(false);
});
