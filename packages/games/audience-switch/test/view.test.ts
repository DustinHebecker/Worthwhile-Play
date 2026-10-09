// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { GameInstance } from '@wp/game-core';
import { SUPPORTED_LOCALES } from '@wp/localization';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { createInitialState, type AudienceSwitchState, type Difficulty } from '../src/rules';
import { SCENARIOS } from '../src/scenarios';

let running: GameInstance<AudienceSwitchState>[] = [];
afterEach(() => {
  for (const instance of running) instance.dispose();
  running = [];
  document.body.innerHTML = '';
});

function seedFor(scenario: string, difficulty: Difficulty): number {
  for (let seed = 1; seed < 2000; seed++) if (createInitialState(seed, difficulty).scenario === scenario) return seed;
  throw new Error(`no seed for ${scenario}`);
}

function setup(scenario = 'migration', difficulty: Difficulty = 'easy', locale: Parameters<typeof createTestContext>[1] = 'en') {
  const ctx = createTestContext(game as never, locale);
  const instance = game.create(ctx.context);
  running.push(instance);
  instance.newGame({ seed: seedFor(scenario, difficulty), difficulty });
  return { ctx, instance, root: ctx.context.root };
}

const byId = <T extends HTMLElement = HTMLElement>(root: HTMLElement, id: string) => {
  const el = root.querySelector<T>(`[data-testid="${id}"]`);
  if (!el) throw new Error(`missing ${id}`);
  return el;
};
const maybe = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const step = (root: HTMLElement) => byId(root, 'as-round').dataset.step;

/** Plays the current round through the DOM. */
function play(root: HTMLElement, facts: readonly string[], lead: string) {
  for (const f of facts) byId(root, `as-fact-${f}`).click();
  byId(root, 'as-continue').click();
  byId(root, `as-lead-${lead}`).click();
  byId(root, 'as-check-selection').click();
}

describe('Audience Switch view', () => {
  it('shows the situation, audiences and unticked fact cards', () => {
    const { root } = setup();
    expect(byId(root, 'as-situation').dataset.scenario).toBe('migration');
    expect(byId(root, 'as-situation').textContent).toContain('customer database');
    expect(byId(root, 'as-audience-0').dataset.status).toBe('current');
    expect(byId(root, 'as-audience-1').dataset.status).toBe('next');
    expect(byId(root, 'as-round').dataset.audience).toBe('developer');
    expect(root.querySelectorAll('[data-testid^="as-fact-"]')).toHaveLength(6);
    expect(root.querySelector('[data-autofocus]')).not.toBeNull();
    expect(byId(root, 'as-count').textContent).toBe('Ticked: 0');
  });

  it('asks for a fact before continuing, then for an opening, and saves each step', () => {
    const { root, ctx } = setup();
    byId(root, 'as-continue').click();
    expect(byId(root, 'as-notice').textContent).toBe('Tick at least one fact first.');
    expect(ctx.saveRequests()).toBe(0);
    byId(root, 'as-fact-encoding').click();
    byId(root, 'as-fact-cause').click();
    expect(byId(root, 'as-count').textContent).toBe('Ticked: 2');
    expect(maybe(root, 'as-notice')).toBeNull();
    byId(root, 'as-continue').click();
    expect(step(root)).toBe('lead');
    expect(root.querySelectorAll('[data-testid^="as-lead-"]')).toHaveLength(2);
    byId(root, 'as-check-selection').click();
    expect(byId(root, 'as-notice').textContent).toBe('Choose the fact that comes first.');
    byId(root, 'as-back').click();
    expect(step(root)).toBe('select');
    expect(byId<HTMLInputElement>(root, 'as-fact-encoding').checked).toBe(true);
    expect(ctx.saveRequests()).toBe(4);
  });

  it('shows per-card verdicts with symbols, text and reasons after checking', () => {
    const { root } = setup();
    play(root, ['encoding', 'apology'], 'encoding');
    expect(step(root)).toBe('message');
    const verdict = (id: string) => byId(root, `as-verdict-${id}`);
    expect(verdict('encoding').dataset.verdict).toBe('hit');
    expect(verdict('encoding').textContent).toContain('✓');
    expect(verdict('encoding').textContent).toContain('Needed — included');
    expect(verdict('encoding').textContent).toContain('root cause');
    expect(verdict('cause').dataset.verdict).toBe('miss');
    expect(verdict('cause').textContent).toContain('Needed — missing');
    expect(verdict('apology').dataset.verdict).toBe('extra');
    expect(verdict('apology').textContent).toContain('✗');
    expect(verdict('newDate').dataset.verdict).toBe('optional');
    expect(verdict('newDate').textContent).toContain('can do without it');
    expect(byId(root, 'as-feedback-summary').textContent).toBe('Needed facts included: 1 of 3. Not-needed facts included: 1.');
    expect(byId(root, 'as-lead-result').dataset.correct).toBe('true');
  });

  it('names the model opening when a different one was chosen', () => {
    const { root } = setup();
    play(root, ['cause', 'encoding'], 'cause');
    expect(byId(root, 'as-lead-result').dataset.correct).toBe('false');
    expect(byId(root, 'as-lead-result').textContent).toContain('Model opening: The import script reads text');
  });

  it('reveals message explanations, keeps the own version and self-checks, and moves on', () => {
    const { root, ctx, instance } = setup();
    play(root, ['encoding'], 'encoding');
    byId(root, 'as-check-message').click();
    expect(byId(root, 'as-notice').textContent).toBe('Choose a message first.');
    const state = instance.serialize();
    const fitIndex = state.rounds[0]!.order.indexOf('fit');
    byId(root, `as-message-${fitIndex}`).click();
    byId(root, 'as-check-message').click();
    expect(step(root)).toBe('reflect');
    const fit = byId(root, `as-message-${fitIndex}`);
    expect(fit.dataset.fit).toBe('true');
    expect(fit.dataset.chosen).toBe('true');
    expect(fit.textContent).toContain('Your choice');
    expect(root.querySelectorAll('[data-fit="false"]')).toHaveLength(2);
    expect(byId(root, 'as-model').textContent).toContain('Heads-up');
    const draft = byId<HTMLTextAreaElement>(root, 'as-draft');
    draft.value = 'My version';
    draft.dispatchEvent(new Event('input', { bubbles: true }));
    byId(root, 'as-check-1').click();
    expect(instance.serialize().rounds[0]).toMatchObject({ draft: 'My version', checks: [false, true, false], chosen: 'fit' });
    const saves = ctx.saveRequests();
    byId(root, 'as-next').click();
    expect(ctx.saveRequests()).toBe(saves + 1);
    expect(byId(root, 'as-round').dataset.audience).toBe('customer');
    expect(byId(root, 'as-audience-0').dataset.status).toBe('done');
  });

  it('shows the summary and reports completion exactly once, also not again after restore', () => {
    const { root, ctx, instance } = setup();
    for (const [facts, lead] of [[['encoding', 'regression'], 'encoding'], [['noLoss', 'cause'], 'noLoss']] as const) {
      play(root, facts, lead);
      root.querySelector<HTMLInputElement>('[data-testid="as-message-0"]')!.click();
      byId(root, 'as-check-message').click();
      byId(root, 'as-next').click();
    }
    expect(maybe(root, 'as-round')).toBeNull();
    expect(byId(root, 'as-summary-0').dataset.hits).toBe('2');
    expect(byId(root, 'as-summary-0').dataset.needed).toBe('3');
    expect(byId(root, 'as-summary-1').dataset.extras).toBe('1');
    expect(ctx.results).toHaveLength(1);
    expect(ctx.results[0]!.outcome).toBe('completed');
    expect(ctx.results[0]!.stats).toMatchObject({ neededFacts: 5, includedFacts: 3, notNeededIncluded: 1, openings: 2 });

    const saved = instance.serialize();
    const ctx2 = createTestContext(game as never, 'en');
    const restored = game.create(ctx2.context);
    running.push(restored);
    restored.restore(saved);
    expect(maybe(ctx2.context.root, 'as-summary')).not.toBeNull();
    expect(ctx2.results).toHaveLength(0);
  });

  it('restores every phase visibly', () => {
    const { root, instance } = setup('migration', 'medium');
    const snapshots: AudienceSwitchState[] = [instance.serialize()];
    byId(root, 'as-fact-encoding').click();
    snapshots.push(instance.serialize());
    byId(root, 'as-continue').click();
    byId(root, 'as-lead-encoding').click();
    snapshots.push(instance.serialize());
    byId(root, 'as-check-selection').click();
    snapshots.push(instance.serialize());
    root.querySelector<HTMLInputElement>('[data-testid="as-message-2"]')!.click();
    byId(root, 'as-check-message').click();
    snapshots.push(instance.serialize());
    for (const snap of snapshots) {
      const ctx = createTestContext(game as never, 'en');
      const other = game.create(ctx.context);
      running.push(other);
      other.restore(snap);
      expect(other.serialize()).toEqual(snap);
      const r = snap.rounds[0]!;
      expect(byId(ctx.context.root, 'as-round').dataset.step).toBe(r.step);
      if (r.step === 'select') expect(byId<HTMLInputElement>(ctx.context.root, 'as-fact-encoding').checked).toBe(r.selected.includes('encoding'));
      if (r.step === 'lead') expect(byId<HTMLInputElement>(ctx.context.root, 'as-lead-encoding').checked).toBe(true);
      if (r.step === 'message') expect(byId(ctx.context.root, 'as-verdict-encoding').dataset.verdict).toBe('hit');
      if (r.step === 'reflect') expect(maybe(ctx.context.root, 'as-draft')).not.toBeNull();
    }
  });

  it('ignores input while paused and new games reset everything', () => {
    const { root, instance } = setup();
    instance.pause();
    byId(root, 'as-fact-encoding').click();
    byId(root, 'as-continue').click();
    expect(instance.serialize().rounds[0]!.selected).toEqual([]);
    instance.resume();
    byId(root, 'as-fact-encoding').click();
    expect(instance.serialize().rounds[0]!.selected).toEqual(['encoding']);
    instance.newGame({ seed: seedFor('skyBlue', 'hard'), difficulty: 'hard' });
    expect(byId(root, 'as-situation').dataset.scenario).toBe('skyBlue');
    expect(root.querySelectorAll('[data-testid^="as-fact-"]')).toHaveLength(8);
    expect(instance.serialize().rounds.every((r) => r.selected.length === 0)).toBe(true);
  });

  it('renders every scenario in every locale without missing text, and RTL for Arabic', () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const scenario of SCENARIOS.map((d) => d.id)) {
        const { root, ctx } = setup(scenario, 'hard', locale);
        const first = root.querySelector<HTMLInputElement>('[data-testid^="as-fact-"]')!;
        first.click();
        byId(root, 'as-continue').click();
        root.querySelector<HTMLInputElement>('[data-testid^="as-lead-"]')!.click();
        byId(root, 'as-check-selection').click();
        root.querySelector<HTMLInputElement>('[data-testid="as-message-0"]')!.click();
        byId(root, 'as-check-message').click();
        expect(ctx.missingKeys, `${locale}/${scenario}`).toEqual([]);
        for (const p of root.querySelectorAll('.as-reason, .as-message-text, .as-fact-text')) expect(p.textContent?.trim(), `${locale}/${scenario}`).not.toBe('');
        expect(root.querySelector('.wp-audience-switch')!.getAttribute('dir')).toBe(locale === 'ar' ? 'rtl' : 'ltr');
      }
    }
  });
});
