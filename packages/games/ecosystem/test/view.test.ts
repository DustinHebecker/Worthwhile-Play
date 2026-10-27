// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createTestContext } from '@wp/testing';
import type { GameModule, GameResult } from '@wp/game-core';
import game from '../src/index';
import { applyTool, choiceOf, commit, newGameState, questionOf, runGoalWeeks, setDraft, type Answer, type EcoState, type GoalState, type PredictState } from '../src/rules';

const module = game as GameModule<unknown>;
type Locale = 'en' | 'de' | 'ar' | 'ja';
const LOCALES: readonly Locale[] = ['en', 'de', 'ar', 'ja'];

beforeAll(async () => {
  for (const l of LOCALES) await game.preload!(l);
});
afterEach(() => {
  document.body.innerHTML = '';
});

function mount(state: EcoState, locale: Locale = 'en') {
  const ctx = createTestContext(module, locale);
  const finished: GameResult[] = [];
  const instance = game.create({ ...ctx.context, finished: (r) => void finished.push(r) });
  instance.restore(state);
  const root = ctx.context.root;
  const q = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  return { ctx, instance, root, q, finished, state: () => instance.serialize() };
}

/** A predict state whose first item is a given challenge. */
function predictWith(challenge: string, difficulty: 'easy' | 'medium' | 'hard', question = 0): PredictState {
  const base = newGameState(1, { ...choiceOf(difficulty, {}), mode: 'predict' }) as PredictState;
  const others = base.items.filter((i) => i.challenge !== challenge).slice(0, 3);
  return { ...base, items: [{ challenge, question, draft: null, answer: null, marks: null, ran: false }, ...others] };
}

describe('predict screens', () => {
  for (const locale of LOCALES) {
    it(`question, review and summary render in ${locale}; diagrams and charts stay LTR`, () => {
      const m = mount(predictWith('slow-runoff', 'medium'), locale);
      expect(m.q('eco-root')!.getAttribute('dir')).toBe(locale === 'ar' ? 'rtl' : 'ltr');
      expect(m.q('eco-root')!.dataset.phase).toBe('question');
      expect(m.q('eco-scene')!.getAttribute('dir')).toBe('ltr');
      expect(m.q('eco-focus-chart')!.querySelector('.eco-chart')!.getAttribute('dir')).toBe('ltr');
      expect(m.ctx.missingKeys).toEqual([]);
      (m.root.querySelector('.eco-options input') as HTMLInputElement).click();
      m.q('eco-run')!.click();
      expect(m.q('eco-root')!.dataset.phase).toBe('review');
      expect(m.q('eco-verdict')!.textContent).toMatch(/^[●○]{3} /);
      expect(m.q('eco-cld')!.querySelector('.eco-cld-box')!.getAttribute('dir')).toBe('ltr');
      expect(m.q('eco-cld-list')!.querySelectorAll('li').length).toBeGreaterThan(0);
      for (let k = 0; k < 3; k++) {
        m.q('eco-next')!.click();
        m.q('eco-skip')!.click();
      }
      m.q('eco-summary-btn')!.click();
      expect(m.q('eco-root')!.dataset.phase).toBe('summary');
      expect(m.q('eco-summary-list')!.querySelectorAll('li').length).toBe(4);
      expect(m.finished).toHaveLength(1);
      expect(m.ctx.missingKeys).toEqual([]);
      // Reopening a finished round shows the summary and does not finish again.
      const again = mount(m.state() as EcoState, locale);
      expect(again.q('eco-root')!.dataset.phase).toBe('summary');
      expect(again.finished).toHaveLength(0);
    });
  }

  it('before the run no element carries the model answer; the future is not drawn', () => {
    const m = mount(predictWith('slow-runoff', 'medium'));
    expect(m.q('eco-verdict')).toBeNull();
    expect(m.q('eco-happened')).toBeNull();
    expect(m.q('eco-explain')).toBeNull();
    const path = m.q('eco-focus-chart')!.querySelector('.eco-line-model')!.getAttribute('d')!;
    expect(path.split('L').length - 1).toBeLessThanOrEqual(8); // history only
    expect(m.root.textContent).not.toContain('disappears ✓');
  });

  it('the easy question shows the loops first and the level options; a commit stores ●●●', () => {
    const m = mount(predictWith('fish-stocked', 'easy'));
    expect(m.root.querySelector('.eco-loops-first .eco-cld')).not.toBeNull();
    (m.q('eco-band-2') as HTMLInputElement).click();
    expect((m.state() as PredictState).items[0]!.draft).toEqual({ kind: 'level', band: 2 });
    m.q('eco-run')!.click();
    expect(m.q('eco-verdict')!.textContent).toBe('●●● Just like the model');
    expect(m.q('eco-band')).not.toBeNull();
  });

  it('hard: six slider handles with value texts; arrows move a handle and save the draft', () => {
    const m = mount(predictWith('fleas-arrive', 'hard'));
    const handles = m.root.querySelectorAll<HTMLElement>('[role="slider"]');
    expect(handles).toHaveLength(6);
    expect(handles[0]!.getAttribute('aria-valuetext')).toMatch(/^week 4: about /);
    const before = Number(handles[0]!.getAttribute('aria-valuenow'));
    handles[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    const draft = (m.state() as PredictState).items[0]!.draft;
    expect(draft?.kind).toBe('sketch');
    expect((draft as { points: number[] }).points[0]).toBe(before - 10_000);
    expect(m.q('eco-sketch-shape')!.textContent).toMatch(/^Your sketch: /);
    m.q('eco-run')!.click();
    expect(m.q('eco-sketch-result')!.textContent).toMatch(/^Your sketch: .* · The model: falls$/);
    expect(m.root.querySelectorAll('[role="slider"][aria-readonly="true"]')).toHaveLength(6);
  });

  it('a level question needs an answer before running (announced), skipping always works', () => {
    const m = mount(predictWith('shade', 'easy'));
    m.q('eco-run')!.click();
    expect(m.q('eco-root')!.dataset.phase).toBe('question');
    m.q('eco-skip')!.click();
    expect(m.q('eco-verdict')!.textContent).toBe('Not predicted — here is what happened');
  });

  it('the scene names what lives there and the water state; the numbers table has rows', () => {
    const m = mount(predictWith('slow-runoff', 'medium'));
    const label = m.q('eco-scene')!.querySelector('svg')!.getAttribute('aria-label')!;
    expect(label).toMatch(/^In the pond: Pondweed 327, /);
    expect(label).toContain('Water: clear');
    expect(m.q('eco-table')!.querySelectorAll('tbody tr').length).toBeGreaterThan(1);
    expect(m.q('eco-status')!.textContent).toBe('Week 0 · Pond · Water: clear');
  });

  it('the chart cursor reads weeks out with the arrow keys', async () => {
    let s = predictWith('fish-stocked', 'medium');
    s = commit(setDraft(s, { kind: 'shape', option: 0 }));
    const m = mount(s);
    const chart = m.q('eco-focus-chart')!;
    chart.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    chart.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await new Promise((r) => setTimeout(r, 60));
    expect(m.q('eco-cursor-live')!.textContent).toMatch(/^Week -7: /);
  });

  const VERDICTS: Readonly<Record<'en' | 'de', readonly string[]>> = {
    en: ['The model went another way', 'Partly', 'Close', 'Just like the model'],
    de: ['Das Modell ging einen anderen Weg', 'Teilweise', 'Nah dran', 'Genau wie das Modell']
  };
  for (const locale of ['en', 'de'] as const) {
    it(`summary marks are symbols for the eye and verdict words for screen readers (${locale})`, () => {
      const base = newGameState(1, { ...choiceOf('medium', {}), mode: 'predict' }) as PredictState;
      const marks = [3, 2, 1, 0] as const;
      const items = base.items.slice(0, 4).map((it, k) => {
        const q = questionOf(base, it);
        const answer: Answer = q.kind === 'level' ? { kind: 'level', band: 1 } : q.kind === 'shape' ? { kind: 'shape', option: 0 } : { kind: 'sketch', points: [0, 0, 0, 0, 0, 0] };
        return { ...it, answer, marks: marks[k]!, ran: true };
      });
      const m = mount({ ...base, items, index: items.length, reported: true }, locale);
      expect(m.q('eco-root')!.dataset.phase).toBe('summary');
      const lis = [...m.q('eco-summary-list')!.querySelectorAll('li')];
      expect(lis).toHaveLength(4);
      lis.forEach((li, k) => {
        const name = accessibleText(li);
        expect(name).toContain(VERDICTS[locale][marks[k]!]);
        expect(name).not.toMatch(/[●○]/);
        expect(li.textContent).toMatch(/^[●○]{3}/); // the symbols stay visible
      });
      const counts = accessibleText(m.q('eco-summary-counts')!);
      for (const v of VERDICTS[locale]) expect(counts).toContain(v);
      expect(counts).not.toMatch(/[●○]/);
      expect(m.q('eco-summary-counts')!.querySelectorAll('[aria-hidden="true"]')).toHaveLength(4);
      expect(m.ctx.missingKeys).toEqual([]);
    });
  }
});

/** The text a screen reader reads: the text content without `aria-hidden` subtrees. */
function accessibleText(el: Element): string {
  const c = el.cloneNode(true) as Element;
  for (const x of c.querySelectorAll('[aria-hidden="true"]')) x.remove();
  return (c.textContent ?? '').replace(/\s+/g, ' ').trim();
}

describe('goal screens', () => {
  const goal = (id: string, d: 'easy' | 'medium' | 'hard' = 'easy') => newGameState(2, choiceOf(d, { mode: 'goal', goal: id })) as GoalState;

  it('running, a failure with undo and back, then reached with the review and finished once', () => {
    const m = mount(goal('save-pondweed'));
    expect(m.q('eco-root')!.dataset.phase).toBe('running');
    expect(m.q('eco-hint')!.hasAttribute('open')).toBe(true);
    for (let k = 0; k < 4; k++) m.q('eco-run-26')!.click();
    expect(m.q('eco-root')!.dataset.phase).toBe('failed');
    expect(m.q('eco-outcome')!.textContent).toMatch(/^Pondweed fell below the line in week \d+\.$/);
    m.q('eco-back-start')!.click();
    expect((m.state() as GoalState).notebook.week).toBe(0);
    m.q('eco-tool-buffer')!.click();
    expect((m.state() as GoalState).notebook.log).toHaveLength(1);
    for (let k = 0; k < 5 && m.q('eco-root')!.dataset.phase === 'running'; k++) m.q('eco-run-26')!.click();
    expect(m.q('eco-root')!.dataset.phase).toBe('reached');
    expect(m.q('eco-outcome')!.textContent).toBe('Reached in week 104.');
    expect(m.finished).toEqual([{ outcome: 'won', stats: { week: 104, changes: 1 } }]);
    expect(m.q('eco-legend')!.textContent).toContain('if you had done nothing');
  });

  it('hard: no hint; budget 4; "Show me a way" ends as completed with the plan', () => {
    let s = goal('clear-pond', 'hard');
    const m0 = mount(s);
    expect(m0.q('eco-hint')).toBeNull();
    s = runGoalWeeks(s, 156).state;
    const m = mount(s);
    expect(m.q('eco-root')!.dataset.phase).toBe('failed');
    m.q('eco-show-way')!.click();
    expect(m.q('eco-root')!.dataset.phase).toBe('shown');
    expect(m.q('eco-plan')!.textContent!.length).toBeGreaterThan(20);
    expect(m.finished).toEqual([{ outcome: 'completed', stats: { week: 156, changes: 0 } }]);
  });

  it('"Does it hold?" is answered for a reached clear-pond goal', () => {
    let s = goal('clear-pond');
    for (const t of ['ditch', 'dredge', 'plant', 'fish-out']) s = applyTool(s, t);
    s = runGoalWeeks(s, 156).state;
    const m = mount(s, 'de');
    expect(m.q('eco-holds')).not.toBeNull();
    expect(m.ctx.missingKeys).toEqual([]);
  });
});

describe('explore screens', () => {
  const explore = (habitat: 'pond' | 'meadow') => newGameState(3, choiceOf(undefined, { mode: 'explore', habitat })) as EcoState;

  it('tabs, a change, a run, the ghost line, the comparison and the food web', () => {
    const m = mount(explore('pond'));
    (m.q('eco-species') as HTMLSelectElement).value = 'pike';
    m.q('eco-species')!.dispatchEvent(new Event('change'));
    m.q('eco-add')!.click();
    expect(m.state()).toMatchObject({ notebook: { log: [{ week: 0, kind: 'add', species: 'pike' }] } });
    m.q('eco-run-26')!.click();
    expect(m.q('eco-status')!.textContent).toMatch(/^Week 26 · Pond · /);
    expect(m.q('eco-compare')!.textContent).toMatch(/^Without your last change, Green algae would now be /);
    (m.q('eco-ghost') as HTMLInputElement).click();
    expect(m.root.querySelector('.eco-line-ghost')).not.toBeNull();
    m.q('eco-tab-web')!.click();
    expect(m.q('eco-web-list')!.querySelectorAll('li').length).toBe(9);
    m.q('eco-tab-log')!.click();
    expect(m.q('eco-log')!.textContent).toContain('Pike: added');
    m.q('eco-undo')!.click();
    expect((m.state() as { notebook: { log: unknown[] } }).notebook.log).toHaveLength(0);
  });

  it('meadow conditions are selects; a change of rain is logged', () => {
    const m = mount(explore('meadow'), 'ar');
    const rain = m.q('eco-cond-rain') as HTMLSelectElement;
    rain.value = '1';
    rain.dispatchEvent(new Event('change'));
    expect(m.state()).toMatchObject({ notebook: { log: [{ week: 0, kind: 'set', cond: 0, level: 1 }] } });
    expect(m.ctx.missingKeys).toEqual([]);
  });

  it('display preferences: one shared chart and numbers in the scene', () => {
    const m = mount(explore('meadow'));
    (m.q('eco-pref-shared') as HTMLInputElement).click();
    expect(m.q('eco-shared')).not.toBeNull();
    expect(m.q('eco-rows')).toBeNull();
    (m.q('eco-pref-numbers') as HTMLInputElement).click();
    expect(m.root.querySelectorAll('.eco-tag').length).toBeGreaterThan(3);
  });
});

