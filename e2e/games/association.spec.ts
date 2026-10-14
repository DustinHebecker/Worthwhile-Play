import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

interface SavedQuestion {
  pair: number;
  cueSide: 0 | 1;
  options: string[];
}

interface SavedAssociation {
  difficulty: string;
  phase: string;
  index: number;
  pairs: [string, string][];
  notes: string[];
  questions: SavedQuestion[];
  answers: string[];
}

const savedState = async (page: Page) => ((await readSave(page, 'association')) as { state: SavedAssociation } | undefined)?.state;

/** What the person sees in recall: question number, cue picture and the offered options. */
async function visibleQuestion(page: Page) {
  const options = page.locator('[data-testid^="as-option-"]');
  return {
    status: await page.getByTestId('as-status').textContent(),
    cue: await page.getByTestId('as-cue').getAttribute('data-item'),
    options: await options.evaluateAll((els) => els.map((el) => el.getAttribute('data-item')))
  };
}

test('association: a round resumes at the same recall question after a reload (keyboard answers)', async ({ page }) => {
  let before: Awaited<ReturnType<typeof visibleQuestion>> | undefined;
  await expectResumeAfterReload(page, 'association', async (p) => {
    await expect(p.getByTestId('as-status')).toHaveText('Pair 1 of 5');
    await p.getByTestId('as-note').fill('the two dance together');
    // Enter in the note field moves on; Next for the remaining pairs.
    await p.getByTestId('as-note').press('Enter');
    await expect(p.getByTestId('as-status')).toHaveText('Pair 2 of 5');
    for (let i = 2; i <= 5; i++) await p.getByTestId('as-next').click();
    await expect(p.getByTestId('as-recall')).toBeVisible();
    await expect(p.getByTestId('as-option-0')).toBeFocused();
    // Number key answers question 1; arrow + Enter answers question 2.
    await p.keyboard.press('2');
    await expect(p.getByTestId('as-status')).toHaveText('Question 2 of 5');
    await expect(p.getByTestId('as-option-0')).toBeFocused();
    await p.keyboard.press('ArrowDown');
    await expect(p.getByTestId('as-option-1')).toBeFocused();
    await p.keyboard.press('Enter');
    await expect(p.getByTestId('as-status')).toHaveText('Question 3 of 5');
    await expect.poll(async () => (await savedState(p))?.answers.length).toBe(2);
    before = await visibleQuestion(p);
  });

  const state = (await savedState(page)) as SavedAssociation;
  expect(state).toMatchObject({ difficulty: 'easy', phase: 'recall', index: 2 });
  expect(state.notes[0]).toBe('the two dance together');
  expect(state.answers).toEqual([state.questions[0]?.options[1], state.questions[1]?.options[1]]);
  // The restored question is visibly the same one, with the same options in the same order.
  const after = await visibleQuestion(page);
  expect(after).toEqual(before);
  const question = state.questions[2] as SavedQuestion;
  expect(after.cue).toBe((state.pairs[question.pair] as [string, string])[question.cueSide]);
  expect(after.options).toEqual(question.options);
  await page.keyboard.press('1');
  await expect(page.getByTestId('as-status')).toHaveText('Question 4 of 5');
});

test('association: medium has an untimed counting break, then recall; the summary shows the note', async ({ page }) => {
  await page.goto('/games/association');
  await page.getByTestId('difficulty').selectOption('medium');
  await page.getByTestId('new-game').click();
  await page.getByTestId('as-note').fill('my scene');
  for (let i = 0; i < 8; i++) await page.getByTestId('as-next').click();
  await expect(page.getByTestId('as-filler')).toBeVisible();
  await expect(page.getByTestId('as-status')).toHaveText('Break 1 of 2');
  await page.keyboard.press('3');
  await expect(page.getByTestId('as-status')).toHaveText('Break 2 of 2');
  await page.getByTestId('as-count-4').click();
  await expect(page.getByTestId('as-recall')).toBeVisible();
  for (let i = 1; i <= 8; i++) {
    await expect(page.getByTestId('as-status')).toHaveText(`Question ${i} of 8`);
    await page.keyboard.press('1');
  }
  await expect(page.getByTestId('as-summary')).toBeVisible();
  await expect(page.getByTestId('as-score')).toContainText('of 8');
  await expect(page.getByTestId('as-summary-pair-0')).toContainText('Your note: my scene');
  await expect.poll(async () => (await savedState(page))?.phase).toBe('finished');
});
