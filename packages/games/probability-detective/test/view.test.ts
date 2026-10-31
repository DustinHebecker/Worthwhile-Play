// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import type { GameContext } from '@wp/game-core';
import { COMMON_MESSAGES, createTranslator, type SupportedLocale } from '@wp/localization';
import { preloadContent } from '../src/content';
import { createRound } from '../src/generate';
import { cmp, posteriorAfter, roundPercents, type CheckCase, type ClueCase, type TrapCase } from '../src/rules';
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
    const c = s.cases[0] as ClueCase;
    expect(root.querySelector('[data-testid="pd-truth"]')).toBeNull();
    expect(root.innerHTML).not.toContain('truth');
    click(root, 'pd-commit');
    expect(root.querySelector('[data-testid="pd-truth"]')).toBeNull();
    click(root, 'pd-commit');
    expect(root.querySelector('[data-testid="pd-truth"]')).not.toBeNull();
    expect((game.serialize().cases[0] as ClueCase).answers).toHaveLength(c.clues.length);
  });

  it('labels the range and buttons, keeps the draft and saves on change', async () => {
    const { root, game, saves } = await mount();
    game.newGame({ seed: 5, difficulty: 'medium' });
    const range = root.querySelector<HTMLInputElement>('[data-testid="pd-range"]')!;
    expect(range.getAttribute('aria-label')).toMatch(/Your estimate for/);
    expect(range.getAttribute('aria-valuetext')).toContain('%');
    const before = (game.serialize().cases[0] as ClueCase).draft[0]!;
    click(root, 'pd-plus');
    expect((game.serialize().cases[0] as ClueCase).draft[0]).toBe(Math.min(100, before + 1));
    expect(saves.length).toBeGreaterThan(0);
    expect(document.activeElement?.getAttribute('data-testid')).toBe('pd-plus');
    expect(root.querySelector('[data-testid="pd-skip"]')).not.toBeNull();
    expect(root.querySelector('.pd-hint summary')).not.toBeNull();
  });

  it('three hypotheses use spinbuttons that rebalance', async () => {
    const { root, game } = await mount();
    let seed = 0;
    do game.newGame({ seed: ++seed, difficulty: 'hard' });
    while ((game.serialize().cases[0] as ClueCase).hyps !== 3);
    const spin = root.querySelector<HTMLElement>('[data-testid="pd-spin-0"]')!;
    expect(spin.getAttribute('role')).toBe('spinbutton');
    spin.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect((game.serialize().cases[0] as ClueCase).draft).toEqual([100, 0, 0]);
    click(root, 'pd-even');
    expect((game.serialize().cases[0] as ClueCase).draft).toEqual([34, 33, 33]);
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
    game.restore({ ...s, index: 5, reported: true, cases: (s.cases as ClueCase[]).map((c) => ({ ...c, answers: ['skip', 'skip'] })) });
    expect(root.querySelectorAll('.pd-calib-list li')).toHaveLength(2);
  });

  it('checks: run a check, decide with a belief, review with the investigation, the plan and the formulas', async () => {
    const { root, game, prefs } = await mount();
    game.newGame({ seed: 21, difficulty: 'medium', settings: { mode: 'checks' } });
    const c = game.serialize().cases[0] as CheckCase;
    expect(root.querySelectorAll('[data-testid^="pd-run-"]')).toHaveLength(c.checks.length);
    expect(root.innerHTML).not.toContain('truth');
    click(root, 'pd-run-1');
    expect(root.querySelector('[data-testid="pd-result-1"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="pd-run-1"]')).toBeNull();
    expect(root.querySelector('[data-testid="pd-truth"]')).toBeNull();
    click(root, 'pd-ready');
    expect(root.querySelector('[data-testid="pd-run-0"]')).toBeNull();
    click(root, 'pd-decide');
    expect((game.serialize().cases[0] as CheckCase).decision).toBeNull();
    click(root, 'pd-choice-0');
    click(root, 'pd-plus');
    click(root, 'pd-decide');
    const after = game.serialize().cases[0] as CheckCase;
    expect(after.decision).toBe(0);
    expect(root.querySelector('[data-testid="pd-truth"]')).not.toBeNull();
    expect(root.querySelectorAll('[data-testid="pd-investigation"] li')).toHaveLength(2);
    expect(root.querySelector('[data-testid="pd-plan"]')).not.toBeNull();
    expect(root.querySelectorAll('[data-testid="pd-worth"] li')).toHaveLength(c.checks.length);
    expect(root.querySelector('[data-testid="pd-decision"]')!.textContent!.length).toBeGreaterThan(10);
    expect(root.textContent).toContain('\u2212');
    expect((prefs.get('calibration') as unknown[]).length).toBe(2);
  });

  it('traps: answer, check, see the explanation and its visual', async () => {
    for (const locale of ['en', 'ar'] as const) {
      const { root, game } = await mount(locale);
      for (let seed = 1; seed <= 6; seed++) {
        game.newGame({ seed, difficulty: 'hard', settings: { mode: 'traps' } });
        for (let i = 0; i < 5; i++) {
          const c = game.serialize().cases[i] as TrapCase;
          expect(root.querySelector('[data-testid="pd-trap-story"]')!.textContent).not.toMatch(/\{\w+\}/);
          const radio = root.querySelector<HTMLInputElement>('[data-testid="pd-q0-o0"]');
          if (radio) radio.click();
          else click(root, 'pd-q0-plus');
          click(root, 'pd-trap-check');
          const done = game.serialize().cases[i] as TrapCase;
          expect(done.answers).not.toBeNull();
          expect(done.answers![0]).not.toBe('skip');
          expect(root.querySelector('[data-testid="pd-explain"]')!.textContent).not.toMatch(/\{\w+\}/);
          expect(root.querySelector('[data-visual]'), c.template).not.toBeNull();
          click(root, i < 4 ? 'pd-next' : 'pd-summary-btn');
        }
        expect(root.querySelector('[data-testid="pd-sum-traps"]')).not.toBeNull();
      }
    }
  });

  it('a mixed round goes through all three kinds to the summary', async () => {
    const { root, game, finished } = await mount('de');
    game.newGame({ seed: 8, difficulty: 'easy', settings: { mode: 'mixed' } });
    for (let i = 0; i < 5; i++) {
      const c = game.serialize().cases[i]!;
      if (c.kind === 'clues') {
        click(root, 'pd-skip');
        click(root, 'pd-skip');
      } else if (c.kind === 'checks') {
        click(root, 'pd-ready');
        click(root, 'pd-choice-1');
        click(root, 'pd-decide-skip');
      } else click(root, 'pd-skip');
      click(root, i < 4 ? 'pd-next' : 'pd-summary-btn');
    }
    expect(finished).toHaveLength(1);
    expect(root.querySelectorAll('[data-testid="pd-summary-list"] > li')).toHaveLength(5);
    expect(root.querySelector('[data-testid="pd-sum-checks"]')).not.toBeNull();
  });
});

describe('view: the compact round summary', () => {
  /** Plays a mixed round with real answers: the default belief for clues, the first option for traps, one check. */
  function playMixed(root: HTMLElement, game: Awaited<ReturnType<typeof mount>>['game']) {
    game.newGame({ seed: 8, difficulty: 'easy', settings: { mode: 'mixed' } });
    for (let i = 0; i < 5; i++) {
      const c = game.serialize().cases[i]!;
      if (c.kind === 'clues') c.clues.forEach(() => click(root, 'pd-commit'));
      else if (c.kind === 'checks') {
        click(root, 'pd-run-0');
        click(root, 'pd-ready');
        click(root, 'pd-choice-0');
        click(root, 'pd-decide');
      } else {
        c.drafts.forEach((_, qi) => {
          const radio = root.querySelector<HTMLInputElement>(`[data-testid="pd-q${qi}-o0"]`);
          if (radio) radio.click();
          else click(root, `pd-q${qi}-plus`);
        });
        click(root, 'pd-trap-check');
      }
      click(root, i < 4 ? 'pd-next' : 'pd-summary-btn');
    }
  }

  it('shows the lines and the tip first, then one collapsed entry per case with a verdict line', async () => {
    const { root, game } = await mount();
    playMixed(root, game);
    expect(document.activeElement?.id).toBe('pd-summary-heading');
    const main = root.querySelector('.pd-main')!;
    // Reading order: heading, the round's lines, the tip, the notebook, then the cases.
    expect([...main.children].map((el) => el.getAttribute('data-testid') ?? el.className)).toEqual(['pd-heading', 'pd-sum-lines', 'pd-tip', 'pd-calibration', 'pd-cases']);
    const entries = [...root.querySelectorAll<HTMLDetailsElement>('[data-testid="pd-summary-list"] > li > details.pd-case')];
    expect(entries).toHaveLength(5);
    const cases = game.serialize().cases;
    entries.forEach((d, i) => {
      expect(d.open, `entry ${i}`).toBe(false);
      const summary = d.querySelector(':scope > summary')!;
      expect(summary.querySelector('.pd-case-title')!.textContent!.length).toBeGreaterThan(3);
      const line = summary.querySelector('.pd-case-line')!.textContent!;
      // Its accessible text reads "title: verdict".
      expect(summary.textContent).toBe(`${summary.querySelector('.pd-case-title')!.textContent}: ${line}`);
      const c = cases[i]!;
      if (c.kind === 'trap') expect(line).toMatch(/^matching the exact answer: \d of \d$/);
      else expect(line).toMatch(/^You: ● \d+.% · Exact: ● [\d.]+.% · [●○]{3} /);
      if (c.kind === 'checks') expect(line).toMatch(/best decision ✓|another option was better on average/);
      // Nothing is lost: the full explanation is inside, without ids (it may repeat) and with headings one level down.
      const body = d.querySelector('.pd-case-body')!;
      expect(body.querySelector('[id]')).toBeNull();
      expect(body.querySelector('h2, h3')).toBeNull();
      if (c.kind === 'trap') {
        expect(body.querySelector('[data-testid="pd-explain"]')).not.toBeNull();
        expect(body.querySelector('[data-visual]')).not.toBeNull();
        expect(body.querySelectorAll('.pd-question')).toHaveLength(c.drafts.length);
      } else {
        expect(body.querySelector('[data-testid="pd-truth"]')!.textContent).toMatch(/^. It was: /);
        expect(body.querySelector('[data-testid="pd-forecast"]')).not.toBeNull();
        expect(body.querySelector('[data-testid="pd-formulas"]')).not.toBeNull();
        expect(body.querySelectorAll('h4').length).toBeGreaterThan(1);
      }
      if (c.kind === 'clues') expect(body.querySelector('[data-testid="pd-ledger"]')).not.toBeNull();
      if (c.kind === 'checks') expect(body.querySelector('[data-testid="pd-plan"]')).not.toBeNull();
    });
    expect(root.querySelector('#pd-cases-h')!.tagName).toBe('H3');
    expect(root.querySelector('.pd-cases')!.getAttribute('aria-labelledby')).toBe('pd-cases-h');
  });

  it('says "skipped" in the verdict line of a skipped case, and renders in every locale without raw keys', async () => {
    for (const locale of ['ar', 'de', 'ja', 'hi'] as const) {
      const { root, game } = await mount(locale);
      game.newGame({ seed: 4, difficulty: 'easy' });
      for (let i = 0; i < 5; i++) {
        const c = game.serialize().cases[i] as ClueCase;
        c.clues.forEach(() => click(root, i === 0 ? 'pd-skip' : 'pd-commit'));
        click(root, i < 4 ? 'pd-next' : 'pd-summary-btn');
      }
      const lines = [...root.querySelectorAll('.pd-case-line')].map((el) => el.textContent);
      expect(lines).toHaveLength(5);
      expect(root.textContent).not.toMatch(/\b(summary|review|ledger|board)\.[a-z]/);
      expect(lines.slice(1).every((l) => l!.includes('●'))).toBe(true);
      expect(lines[0]).not.toContain('●');
      root.remove();
    }
  });
});

describe('view: the "another way" note', () => {
  it('appears only when the truth was not the most likely explanation', async () => {
    const seen = { leading: 0, behind: 0 };
    for (let seed = 1; seed <= 400 && (seen.leading < 2 || seen.behind < 2); seed++) {
      const s = createRound(seed, 'hard', 'clues');
      for (let i = 0; i < s.cases.length; i++) {
        const c = s.cases[i] as ClueCase;
        const pn = posteriorAfter(c, c.clues.length);
        const p = pn[c.truth]!;
        if (!(p.n * 2n < p.d) || p.n === 0n) continue;
        const leading = !pn.some((x, h) => h !== c.truth && cmp(x, p) > 0);
        const answers = c.clues.map((_, k) => roundPercents(posteriorAfter(c, k + 1)));
        const { root, game } = await mount();
        game.restore({ ...s, index: i, cases: s.cases.map((x, j) => (j < i ? { ...(x as ClueCase), answers: (x as ClueCase).clues.map(() => 'skip' as const) } : j === i ? { ...c, answers } : x)) });
        expect(root.querySelector('[data-testid="pd-review"]')).not.toBeNull();
        expect(root.querySelector('[data-testid="pd-luck"]') !== null).toBe(!leading);
        seen[leading ? 'leading' : 'behind']++;
        root.remove();
      }
    }
    expect(seen.leading).toBeGreaterThan(0);
    expect(seen.behind).toBeGreaterThan(0);
  });
});
