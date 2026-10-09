import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';
import { capitalName } from '../../packages/learning-content/src/builtin/capitals';
import { isVocabularyLanguage } from '../../packages/learning-content/src/builtin/first-words';

interface SavedMemory {
  variant?: string;
  deckId?: string;
  languages?: { back?: string };
  cards: { item: string; side: string }[];
  matched: boolean[];
  revealed: number[];
  moves: number;
}

const card = (page: Page, position: number) => page.getByTestId(`card-${position}`);

test('memory: a game survives a reload exactly, including a pending mismatch', async ({ page }) => {
  await expectResumeAfterReload(page, 'memory', async (p) => {
    await card(p, 0).click();
    await card(p, 1).click();
    await expect(card(p, 1)).not.toHaveAttribute('data-state', 'hidden');
  });

  // The restored board visibly matches the saved logical state.
  const state = ((await readSave(page, 'memory')) as { state: SavedMemory }).state;
  expect(state.moves).toBe(1);
  for (let i = 0; i < state.cards.length; i++) {
    const expected = state.matched[i] ? 'matched' : state.revealed.includes(i) ? 'revealed' : 'hidden';
    await expect(card(page, i)).toHaveAttribute('data-state', expected);
  }
  await expect(card(page, 0)).not.toHaveAttribute('data-state', 'hidden');
  await expect(card(page, 2)).toHaveAttribute('data-state', 'hidden');
  await expect(card(page, 2)).toHaveAttribute('aria-label', /3/);
  // A pending mismatch keeps its Continue button after reload; a found pair does not.
  await expect(page.getByTestId('memory-continue')).toBeVisible({ visible: state.revealed.length === 2 });
});

test('memory: the Capitals deck pairs a country with its capital and survives a reload', async ({ page }) => {
  // Choose the deck where people find it: the deck library ("Play" remembers the choice for new games).
  await page.goto('/decks/capitals');
  await page.getByTestId('play-country-capital').click();
  await expect(page).toHaveURL(/\/games\/memory$/);
  await expect.poll(async () => ((await readSave(page, 'memory')) as { state?: SavedMemory } | undefined)?.state?.variant).toBe('country-capital');

  let back = -1;
  let capital = '';
  await expectResumeAfterReload(page, 'memory', async (p) => {
    await expect.poll(async () => ((await readSave(p, 'memory')) as { state?: SavedMemory } | undefined)?.state?.deckId).toBe('capitals');
    const state = ((await readSave(p, 'memory')) as { state: SavedMemory }).state;
    const language = state.languages?.back ?? '';
    expect(isVocabularyLanguage(language)).toBe(true);
    back = state.cards.findIndex((c) => c.side === 'back');
    const item = state.cards[back]?.item ?? '';
    capital = capitalName(item, language as 'en') ?? '';
    expect(capital).not.toBe('');
    await card(p, back).click();
    await expect(card(p, back)).toHaveText(capital);
    // Its partner is the country, named by the browser (CLDR) in the same language.
    const front = state.cards.findIndex((c) => c.side === 'front' && c.item === item);
    const country = await p.evaluate(([code, lang]) => new Intl.DisplayNames([lang as string], { type: 'region' }).of(code as string), [item.toUpperCase(), language]);
    await card(p, front).click();
    await expect(card(p, front)).toHaveText(country as string);
    await expect(card(p, front)).toHaveAttribute('data-state', 'matched');
  });

  // After the reload the found pair is still face up with the same capital.
  await expect(card(page, back)).toHaveAttribute('data-state', 'matched');
  await expect(card(page, back)).toHaveText(capital);
  await expect(page.getByTestId('memory-cards')).toHaveValue('country-capital');
});
