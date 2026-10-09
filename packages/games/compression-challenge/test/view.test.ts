// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { GameInstance } from '@wp/game-core';
import { SUPPORTED_LOCALES } from '@wp/localization';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { createInitialState, type CompressionState, type Difficulty } from '../src/rules';

let running: GameInstance<CompressionState>[] = [];
afterEach(() => {
  for (const instance of running) instance.dispose();
  running = [];
  document.body.innerHTML = '';
});

function seedFor(piece: string, difficulty: Difficulty): number {
  for (let seed = 1; seed < 2000; seed++) if (createInitialState(seed, difficulty).piece === piece) return seed;
  throw new Error(`no seed for ${piece}`);
}

function setup(piece = 'launch', difficulty: Difficulty = 'easy', locale: Parameters<typeof createTestContext>[1] = 'en') {
  const ctx = createTestContext(game as never, locale);
  const instance = game.create(ctx.context);
  running.push(instance);
  const seed = seedFor(piece, difficulty);
  instance.newGame({ seed, difficulty });
  return { ctx, instance, root: ctx.context.root, seed };
}

const byId = <T extends HTMLElement = HTMLElement>(root: HTMLElement, id: string) => {
  const el = root.querySelector<T>(`[data-testid="${id}"]`);
  if (!el) throw new Error(`missing ${id}`);
  return el;
};
const maybe = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const step = (root: HTMLElement) => byId(root, 'cc-step').dataset.step;
const checked = (root: HTMLElement) => byId(root, 'cc-step').dataset.checked;

/** Index of the candidate whose text contains `needle`. */
function indexOf(root: HTMLElement, prefix: string, needle: string): number {
  const items = [...root.querySelectorAll<HTMLElement>(`[data-testid^="${prefix}"]`)];
  const i = items.findIndex((el) => (el.closest('label') ?? el).textContent?.includes(needle));
  if (i < 0) throw new Error(`no ${prefix} with ${needle}`);
  return Number(items[i]!.dataset.testid!.slice(prefix.length));
}

/** Plays steps 1–3 of the launch piece with the gold answers. */
function playToDetails(root: HTMLElement) {
  for (const id of ['s2', 's3', 's8', 's9']) byId(root, `cc-sentence-${id}`).click();
  byId(root, 'cc-check').click();
  byId(root, 'cc-next').click();
  for (const text of ['2 April to 14 May', 'certification is not finished', 'by Friday']) byId(root, `cc-bullet-${indexOf(root, 'cc-bullet-', text)}`).click();
  byId(root, 'cc-check').click();
  byId(root, 'cc-next').click();
  byId(root, `cc-summary-${indexOf(root, 'cc-summary-', 'marketing must decide on the new campaign start by Friday')}`).click();
  byId(root, 'cc-check').click();
}

describe('Compression Challenge view', () => {
  it('shows the piece, the step chips and unticked sentences', () => {
    const { root } = setup();
    expect(byId(root, 'cc-intro').dataset.piece).toBe('launch');
    expect(byId(root, 'cc-intro').textContent).toContain('App launch update');
    expect(byId(root, 'cc-stepper-core').dataset.status).toBe('current');
    expect(byId(root, 'cc-stepper-bullets').dataset.status).toBe('next');
    expect(step(root)).toBe('core');
    expect(root.querySelectorAll('[data-testid^="cc-sentence-"]')).toHaveLength(8);
    expect(root.querySelector('[data-autofocus]')).not.toBeNull();
    expect(byId(root, 'cc-count').textContent).toBe('Ticked: 0');
    expect(byId(root, 'cc-sentences').textContent).toContain('Words: ');
  });

  it('asks for a sentence before checking and saves each change', () => {
    const { root, ctx } = setup();
    byId(root, 'cc-check').click();
    expect(byId(root, 'cc-notice').textContent).toBe('Tick at least one sentence first.');
    expect(ctx.saveRequests()).toBe(0);
    byId(root, 'cc-sentence-s2').click();
    byId(root, 'cc-sentence-s1').click();
    expect(byId(root, 'cc-count').textContent).toBe('Ticked: 2');
    expect(maybe(root, 'cc-notice')).toBeNull();
    byId(root, 'cc-check').click();
    expect(checked(root)).toBe('true');
    expect(ctx.saveRequests()).toBe(3);
  });

  it('explains every sentence after checking step 1, with symbols and word counts', () => {
    const { root } = setup();
    byId(root, 'cc-sentence-s2').click();
    byId(root, 'cc-sentence-s1').click();
    byId(root, 'cc-check').click();
    expect(byId(root, 'cc-core-result').textContent).toBe('Core sentences ticked: 1 of 4. Other sentences ticked: 1.');
    expect(byId(root, 'cc-verdict-s2').dataset.verdict).toBe('hit');
    expect(byId(root, 'cc-verdict-s3').dataset.verdict).toBe('miss');
    expect(byId(root, 'cc-verdict-s1').dataset.verdict).toBe('extra');
    expect(byId(root, 'cc-verdict-s4').dataset.verdict).toBe('skipped');
    expect(byId(root, 'cc-verdict-s3').textContent).toContain('✗');
    expect(byId(root, 'cc-verdict-s3').textContent).toContain('Core — missing');
    expect(byId(root, 'cc-verdict-s1').textContent).toContain('A side remark');
    expect(byId(root, 'cc-core-length').textContent).toMatch(/^Your sentences: \d+ words\. The core sentences: \d+ words\. The whole text: \d+ words\.$/);
    expect(root.querySelectorAll('input[data-testid^="cc-sentence-"]')).toHaveLength(0);
    expect(byId(root, 'cc-stepper-core').dataset.status).toBe('current');
  });

  it('refuses a fourth bullet with a hint and checks exactly three', () => {
    const { root } = setup('launch', 'hard');
    byId(root, 'cc-sentence-s2').click();
    byId(root, 'cc-check').click();
    byId(root, 'cc-next').click();
    expect(step(root)).toBe('bullets');
    expect(byId(root, 'cc-stepper-core').dataset.status).toBe('done');
    expect(byId(root, 'cc-source').textContent).toContain('14 May');
    expect(root.querySelectorAll('[data-testid^="cc-core-s"]')).toHaveLength(4);
    expect(root.querySelectorAll('input[data-testid^="cc-bullet-"]')).toHaveLength(7);
    for (const i of [0, 1]) byId(root, `cc-bullet-${i}`).click();
    byId(root, 'cc-check').click();
    expect(byId(root, 'cc-notice').textContent).toBe('Choose exactly three bullets.');
    byId(root, 'cc-bullet-2').click();
    expect(byId(root, 'cc-count').textContent).toBe('Chosen: 3 of 3');
    byId(root, 'cc-bullet-3').click();
    expect(byId(root, 'cc-notice').textContent).toBe('You already have three. Untick one to choose another.');
    expect(byId<HTMLInputElement>(root, 'cc-bullet-3').checked).toBe(false);
    byId(root, 'cc-check').click();
    expect(byId(root, 'cc-bullets-result').textContent).toMatch(/^Best bullets chosen: [0-3] of 3\.$/);
    expect(root.querySelectorAll('[data-testid^="cc-bullet-"][data-verdict]')).toHaveLength(7);
  });

  it('plays the whole game, reports the finish once and shows the summary', () => {
    const { root, ctx } = setup();
    playToDetails(root);
    expect(byId(root, 'cc-sentence-result').dataset.correct).toBe('true');
    expect(root.querySelectorAll('[data-testid^="cc-summary-"][data-best="true"]')).toHaveLength(1);
    expect(byId(root, 'cc-model').textContent).toContain('14 May');
    byId(root, 'cc-next').click();
    expect(step(root)).toBe('details');
    expect(byId(root, 'cc-oneliner').textContent).toContain('Move the launch to May.');
    for (const id of ['d1', 'd2', 'd3', 'd6']) byId(root, `cc-detail-${id}`).click();
    byId(root, 'cc-check').click();
    expect(byId(root, 'cc-details-result').textContent).toBe('Needed details ticked: 3 of 3. Others ticked: 1.');
    expect(byId(root, 'cc-detail-d6').dataset.verdict).toBe('extra');
    byId(root, 'cc-next').click();
    expect(step(root)).toBe('expand');
    byId(root, 'cc-check').click();
    expect(byId(root, 'cc-notice').textContent).toBe('Choose one version first.');
    byId(root, `cc-version-${indexOf(root, 'cc-version-', 'cancel the campaign')}`).click();
    byId(root, 'cc-check').click();
    expect(byId(root, 'cc-version-result').dataset.correct).toBe('false');
    expect(root.textContent).toContain('The new date is 14 May, not 1 May');
    expect(ctx.results).toHaveLength(0);
    byId(root, 'cc-next').click();
    expect(maybe(root, 'cc-step')).toBeNull();
    expect(byId(root, 'cc-summary').textContent).toContain('Summary');
    expect(byId(root, 'cc-end-core').textContent).toBe('Core sentences: 4 of 4 ticked, 0 others');
    expect(byId(root, 'cc-end-bullets').textContent).toBe('Best bullets: 3 of 3');
    expect(byId(root, 'cc-end-sentence').dataset.correct).toBe('true');
    expect(byId(root, 'cc-end-version').dataset.correct).toBe('false');
    expect(maybe(root, 'cc-end-own')).toBeNull();
    expect(ctx.results).toEqual([
      {
        outcome: 'completed',
        stats: { coreSentences: 4, coreTicked: 4, otherTicked: 0, bestBullets: 3, faithfulSentence: 1, neededDetails: 3, detailsTicked: 3, actionableVersion: 0 }
      }
    ]);
    expect(byId(root, 'cc-stepper-expand').dataset.status).toBe('done');
  });

  it('keeps the own sentence with a live word count and shows it in the summary', () => {
    const { root, instance, ctx } = setup();
    playToDetails(root);
    const draft = byId<HTMLTextAreaElement>(root, 'cc-draft');
    draft.value = 'The launch moves to 14 May.';
    draft.dispatchEvent(new Event('input'));
    expect(byId(root, 'cc-draft-count').textContent).toBe('Words: 6 (aim for about 25 or fewer)');
    expect(instance.serialize().draft).toBe('The launch moves to 14 May.');
    byId(root, 'cc-check-0').click();
    expect(instance.serialize().checks).toEqual([true, false, false]);
    expect(root.textContent).toContain('It is one sentence of about 25 words or fewer.');

    // Restoring in a new instance shows the same draft.
    const saved = instance.serialize();
    const ctx2 = createTestContext(game as never, 'en');
    const other = game.create(ctx2.context);
    running.push(other);
    other.restore(saved);
    expect(byId<HTMLTextAreaElement>(ctx2.context.root, 'cc-draft').value).toBe('The launch moves to 14 May.');
    expect(byId<HTMLInputElement>(ctx2.context.root, 'cc-check-0').checked).toBe(true);

    byId(root, 'cc-next').click();
    byId(root, 'cc-detail-d1').click();
    byId(root, 'cc-check').click();
    byId(root, 'cc-next').click();
    byId(root, 'cc-version-0').click();
    byId(root, 'cc-check').click();
    byId(root, 'cc-next').click();
    expect(byId(root, 'cc-end-own').textContent).toContain('The launch moves to 14 May.');
    expect(ctx.results).toHaveLength(1);
  });

  it('restores a checked step with its feedback', () => {
    const { root, instance } = setup();
    byId(root, 'cc-sentence-s3').click();
    byId(root, 'cc-check').click();
    const saved = instance.serialize();
    const ctx2 = createTestContext(game as never, 'en');
    const other = game.create(ctx2.context);
    running.push(other);
    other.restore(saved);
    expect(byId(ctx2.context.root, 'cc-step').dataset.checked).toBe('true');
    expect(byId(ctx2.context.root, 'cc-verdict-s3').dataset.verdict).toBe('hit');
    expect(other.serialize()).toEqual(saved);
  });

  it('does not report a restored finished game again', () => {
    const ctx = createTestContext(game as never, 'en');
    const instance = game.create(ctx.context);
    running.push(instance);
    let s = createInitialState(seedFor('club', 'medium'), 'medium');
    s = { ...s, step: 'done', checked: true, core: ['s2'], picks: ['gold1', 'gold2', 'gold3'], summary: 'faithful', needs: ['d1'], expanded: 'actionable' };
    expect(game.isValidState(s)).toBe(true);
    instance.restore(s);
    expect(byId(ctx.context.root, 'cc-summary')).toBeTruthy();
    expect(ctx.results).toHaveLength(0);
  });

  it('ignores input while paused and resets to the initial state', () => {
    const { root, instance, ctx, seed } = setup('bikes', 'medium');
    instance.pause();
    byId(root, 'cc-sentence-s2').click();
    byId(root, 'cc-check').click();
    expect(instance.serialize().core).toEqual([]);
    expect(maybe(root, 'cc-notice')).toBeNull();
    instance.resume();
    byId(root, 'cc-sentence-s2').click();
    expect(instance.serialize().core).toEqual(['s2']);
    const saves = ctx.saveRequests();
    instance.reset();
    expect(instance.serialize()).toEqual(createInitialState(seed, 'medium'));
    expect(ctx.saveRequests()).toBe(saves + 1);
    instance.newGame({ seed: 77, difficulty: 'hard' });
    expect(instance.serialize()).toEqual(createInitialState(77, 'hard'));
  });

  it('renders in every locale without missing keys, right to left for Arabic', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const ctx = createTestContext(game as never, locale);
      const instance = game.create(ctx.context);
      running.push(instance);
      instance.newGame({ seed: 3, difficulty: 'hard' });
      const root = ctx.context.root;
      root.querySelector<HTMLInputElement>('[data-testid^="cc-sentence-"]')!.click();
      byId(root, 'cc-check').click();
      byId(root, 'cc-next').click();
      expect(ctx.missingKeys, locale).toEqual([]);
      const box = root.querySelector<HTMLElement>('.wp-compression-challenge')!;
      expect(box.getAttribute('dir'), locale).toBe(locale === 'ar' ? 'rtl' : 'ltr');
      expect(box.getAttribute('lang'), locale).toBe(locale);
      for (const p of root.querySelectorAll('p')) expect(p.textContent?.includes('undefined'), locale).toBe(false);
    }
  }, 90_000);
});
