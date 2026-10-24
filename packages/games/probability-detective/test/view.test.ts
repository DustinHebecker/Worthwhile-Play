// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import type { GameContext } from '@wp/game-core';
import { COMMON_MESSAGES, createTranslator, type SupportedLocale } from '@wp/localization';
import { preloadContent } from '../src/content';
import { createRound } from '../src/generate';
import { metadata } from '../src/metadata';
import { createProbabilityDetective } from '../src/view';

async function mount(locale: SupportedLocale = 'en', prefs = new Map<string, unknown>()) {
  await preloadContent(locale);
  const root = document.createElement('div');
  document.body.append(root);
  const saves: number[] = [];
  const finished: unknown[] = [];
  const context = {
    root,
    t: createTranslator({ locale, sources: [metadata.messages, COMMON_MESSAGES], onMissing: (key) => { throw new Error(`missing ${key}`); } }),
    reducedMotion: true,
    requestSave: () => saves.push(1),
    finished: (r: unknown) => finished.push(r),
    preferences: { get: (k: string) => prefs.get(k), set: (k: string, v: unknown) => prefs.set(k, v) }
  } as unknown as GameContext;
  const game = createProbabilityDetective(context);
  return { root, game, saves, finished, prefs };
}

const click = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`)!.click();

describe('view', () => {
  it('never shows the truth before the review', async () => {
    const { root, game } = await mount();
    game.newGame({ seed: 77, difficulty: 'easy' });
    const s = game.serialize();
    const c = s.cases[0]!;
    expect(root.querySelector('[data-testid="pd-truth"]')).toBeNull();
    expect(root.innerHTML).not.toContain('truth');
    click(root, 'pd-commit');
    expect(root.querySelector('[data-testid="pd-truth"]')).toBeNull();
    click(root, 'pd-commit');
    expect(root.querySelector('[data-testid="pd-truth"]')).not.toBeNull();
    expect(game.serialize().cases[0]!.answers).toHaveLength(c.clues.length);
  });

  it('labels the range and buttons, keeps the draft and saves on change', async () => {
    const { root, game, saves } = await mount();
    game.newGame({ seed: 5, difficulty: 'medium' });
    const range = root.querySelector<HTMLInputElement>('[data-testid="pd-range"]')!;
    expect(range.getAttribute('aria-label')).toMatch(/Your estimate for/);
    expect(range.getAttribute('aria-valuetext')).toContain('%');
    const before = game.serialize().cases[0]!.draft[0]!;
    click(root, 'pd-plus');
    expect(game.serialize().cases[0]!.draft[0]).toBe(Math.min(100, before + 1));
    expect(saves.length).toBeGreaterThan(0);
    expect(document.activeElement?.getAttribute('data-testid')).toBe('pd-plus');
    expect(root.querySelector('[data-testid="pd-skip"]')).not.toBeNull();
    expect(root.querySelector('.pd-hint summary')).not.toBeNull();
  });

  it('three hypotheses use spinbuttons that rebalance', async () => {
    const { root, game } = await mount();
    let seed = 0;
    do game.newGame({ seed: ++seed, difficulty: 'hard' });
    while (game.serialize().cases[0]!.hyps !== 3);
    const spin = root.querySelector<HTMLElement>('[data-testid="pd-spin-0"]')!;
    expect(spin.getAttribute('role')).toBe('spinbutton');
    spin.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(game.serialize().cases[0]!.draft).toEqual([100, 0, 0]);
    click(root, 'pd-even');
    expect(game.serialize().cases[0]!.draft).toEqual([34, 33, 33]);
  });

  it('renders right to left in Arabic, Japanese and German without missing text', async () => {
    for (const locale of ['ar', 'ja', 'de'] as const) {
      const { root, game } = await mount(locale);
      game.newGame({ seed: 3, difficulty: 'easy' });
      const el = root.querySelector<HTMLElement>('.wp-probability-detective')!;
      expect(el.getAttribute('dir')).toBe(locale === 'ar' ? 'rtl' : 'ltr');
      click(root, 'pd-skip');
      click(root, 'pd-skip');
      expect(root.querySelector('.pd-formula')!.getAttribute('dir')).toBe('ltr');
      expect(root.textContent).not.toMatch(/\b(review|board|ledger|belief)\.[a-z]/);
    }
  });

  it('a whole round reports finished once, and the notebook fills and clears', async () => {
    const { root, game, finished, prefs } = await mount();
    game.newGame({ seed: 11, difficulty: 'easy' });
    for (let i = 0; i < 5; i++) {
      click(root, 'pd-commit');
      click(root, 'pd-commit');
      click(root, i < 4 ? 'pd-next' : 'pd-summary-btn');
    }
    expect(finished).toHaveLength(1);
    expect((prefs.get('calibration') as unknown[]).length).toBe(10);
    expect(root.querySelector('[data-testid="pd-calibration"]')!.textContent).toMatch(/after 20 forecasts/);
    const saved = game.serialize();
    game.restore(saved);
    expect(finished).toHaveLength(1);
    click(root, 'pd-calib-clear');
    expect(prefs.get('calibration')).toEqual([]);
  });

  it('shows the calibration bins once there are 20 forecasts', async () => {
    const prefs = new Map<string, unknown>([['calibration', Array.from({ length: 30 }, (_, i) => [i % 2 ? 70 : 30, i % 3 ? 1 : 0])]]);
    const { root, game } = await mount('en', prefs);
    const s = createRound(1, 'easy');
    game.restore({ ...s, index: 5, reported: true, cases: s.cases.map((c) => ({ ...c, answers: ['skip', 'skip'] })) });
    expect(root.querySelectorAll('.pd-calib-list li')).toHaveLength(2);
  });
});
