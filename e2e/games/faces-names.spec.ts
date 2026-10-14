import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

interface SavedFacesNames {
  difficulty: string;
  phase: string;
  index: number;
  people: { name: string }[];
  notes: string[];
  standout: (string | null)[];
  questions: { type: string; person: number; options: unknown[] }[];
  answers: number[];
  hints: boolean[];
}

const savedState = async (page: Page) => ((await readSave(page, 'faces-names')) as { state: SavedFacesNames } | undefined)?.state;

/** What the person sees in the test phase: question, cue, options and the feedback of an answered question. */
async function visibleQuestion(page: Page) {
  const options = page.locator('[data-testid^="fn-option-"]');
  return {
    status: await page.getByTestId('fn-status').textContent(),
    question: await page.getByTestId('fn-question').textContent(),
    cue: await page.getByTestId('fn-cue').getAttribute('data-person'),
    options: await options.evaluateAll((els) => els.map((el) => [el.getAttribute('data-value'), el.getAttribute('data-result'), el.getAttribute('data-chosen')])),
    feedback: await page.getByTestId('fn-feedback').textContent()
  };
}

test('faces-names: the test phase resumes after a reload with the answered question still shown as answered', async ({ page }) => {
  let before: Awaited<ReturnType<typeof visibleQuestion>> | undefined;
  await expectResumeAfterReload(page, 'faces-names', async (p) => {
    await expect(p.getByTestId('fn-status')).toHaveText('Person 1 of 4');
    await expect(p.getByTestId('fn-face')).toHaveAttribute('aria-label', /^Face: /);
    await p.locator('[data-testid^="fn-standout-"]').first().click();
    await expect(p.locator('[data-testid^="fn-standout-"]').first()).toHaveAttribute('aria-pressed', 'true');
    await p.getByTestId('fn-note').fill('Sarah → Sahara');
    // Enter in the note field moves on; Next for the remaining people.
    await p.getByTestId('fn-note').press('Enter');
    await expect(p.getByTestId('fn-status')).toHaveText('Person 2 of 4');
    for (let i = 2; i <= 4; i++) await p.getByTestId('fn-next').click();
    await expect(p.getByTestId('fn-test')).toBeVisible();
    await expect(p.getByTestId('fn-status')).toHaveText('Question 1 of 12');
    // A number key answers question 1; the feedback stays until "Next question".
    await p.keyboard.press('2');
    await expect(p.getByTestId('fn-feedback')).toBeVisible();
    await expect(p.getByTestId('fn-continue')).toBeFocused();
    await p.keyboard.press('Enter');
    await expect(p.getByTestId('fn-status')).toHaveText('Question 2 of 12');
    await p.getByTestId('fn-option-0').click();
    await expect(p.getByTestId('fn-feedback')).toBeVisible();
    await expect.poll(async () => (await savedState(p))?.answers.length).toBe(2);
    before = await visibleQuestion(p);
  });

  const state = (await savedState(page)) as SavedFacesNames;
  expect(state).toMatchObject({ difficulty: 'easy', phase: 'test', index: 1 });
  expect(state.answers).toEqual([1, 0]);
  expect(state.notes[0]).toBe('Sarah → Sahara');
  expect(state.standout[0]).not.toBeNull();
  // The restored question is visibly the same one, answered, with the same marks and feedback.
  const after = await visibleQuestion(page);
  expect(after).toEqual(before);
  expect(after.feedback).toMatch(/^(✓ Correct|✗ Not quite)/);
  expect(after.options[0]?.[2]).toBe('true');
  expect(after.options.filter((o) => o[1] === 'correct')).toHaveLength(1);
  await expect(page.getByTestId('fn-continue')).toBeVisible();
  await page.getByTestId('fn-continue').click();
  await expect(page.getByTestId('fn-status')).toHaveText('Question 3 of 12');
  await expect(page.getByTestId('fn-feedback')).toBeHidden();
});

test('faces-names: a full short session on a phone, with a hint, ends in a summary', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  await page.goto('/games/faces-names');
  await page.getByTestId('new-game').click();
  for (let i = 0; i < 4; i++) {
    await page.getByTestId('fn-note').fill(`link ${i + 1}`);
    await page.getByTestId('fn-next').click();
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.getByTestId('fn-hint')).toBeVisible();
  await page.getByTestId('fn-hint').click();
  await expect(page.getByTestId('fn-hint-text')).toContainText('Your note: link');
  for (let i = 1; i <= 12; i++) {
    await expect(page.getByTestId('fn-status')).toHaveText(`Question ${i} of 12`);
    await page.getByTestId('fn-option-0').click();
    await page.getByTestId('fn-continue').click();
  }
  await expect(page.getByTestId('fn-summary')).toBeVisible();
  await expect(page.getByTestId('fn-score')).toContainText('of 12');
  await expect(page.getByTestId('fn-hints-used')).toContainText('1');
  await expect(page.getByTestId('fn-summary-person-0')).toContainText('Your note: link 1');
  await expect.poll(async () => (await savedState(page))?.phase).toBe('finished');
});
