import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';
import { aiTerm } from '../../packages/learning-content/src/builtin/ai-basics';
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

test('memory: the AI basics deck pairs a term with its definition, fits a 360 px phone and survives a reload', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/decks/ai-basics');
  await page.getByTestId('play-ai-term-definition').click();
  await expect(page).toHaveURL(/\/games\/memory$/);
  await expect.poll(async () => ((await readSave(page, 'memory')) as { state?: SavedMemory } | undefined)?.state?.variant).toBe('ai-term-definition');

  let back = -1;
  let definition = '';
  await expectResumeAfterReload(page, 'memory', async (p) => {
    await expect.poll(async () => ((await readSave(p, 'memory')) as { state?: SavedMemory } | undefined)?.state?.deckId).toBe('ai-basics');
    const state = ((await readSave(p, 'memory')) as { state: SavedMemory }).state;
    const language = state.languages?.back ?? '';
    expect(isVocabularyLanguage(language)).toBe(true);
    const lang = language as 'en';
    // Turn over the longest definition on the board: the hardest case for the card layout.
    const backs = state.cards.flatMap((c, i) => (c.side === 'back' ? [i] : []));
    back = backs.reduce((a, b) => ((aiTerm(state.cards[b]!.item, lang)?.definition.length ?? 0) > (aiTerm(state.cards[a]!.item, lang)?.definition.length ?? 0) ? b : a));
    const item = state.cards[back]?.item ?? '';
    definition = aiTerm(item, lang)?.definition ?? '';
    expect(definition.length).toBeGreaterThan(40);
    await card(p, back).click();
    await expect(card(p, back)).toHaveText(definition);
    // The whole definition is visible: nothing is cut off, the card keeps a usable size, the page does not scroll sideways.
    const fit = await card(p, back).evaluate((el) => ({
      clippedY: el.scrollHeight - el.clientHeight,
      clippedX: el.scrollWidth - el.clientWidth,
      width: el.getBoundingClientRect().width,
      height: el.getBoundingClientRect().height,
      pageOverflow: document.documentElement.scrollWidth - window.innerWidth
    }));
    expect(fit.clippedY).toBeLessThanOrEqual(1);
    expect(fit.clippedX).toBeLessThanOrEqual(1);
    expect(fit.width).toBeGreaterThanOrEqual(44);
    expect(fit.height).toBeGreaterThanOrEqual(44);
    expect(fit.pageOverflow).toBeLessThanOrEqual(0);
    // Its partner is the term, in the same language.
    const front = state.cards.findIndex((c) => c.side === 'front' && c.item === item);
    await card(p, front).click();
    await expect(card(p, front)).toHaveText(aiTerm(item, lang)?.term ?? '');
    await expect(card(p, front)).toHaveAttribute('data-state', 'matched');
  });

  // After the reload the found pair is still face up with the same definition.
  await expect(card(page, back)).toHaveAttribute('data-state', 'matched');
  await expect(card(page, back)).toHaveText(definition);
  await expect(page.getByTestId('memory-cards')).toHaveValue('ai-term-definition');
});
