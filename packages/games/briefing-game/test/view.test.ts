// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { GameInstance } from '@wp/game-core';
import { SUPPORTED_LOCALES } from '@wp/localization';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { cardDef, createInitialState, situationOf, type BriefingState, type Difficulty } from '../src/rules';
import { SITUATIONS, type Slot } from '../src/situations';

let running: GameInstance<BriefingState>[] = [];
afterEach(() => {
  for (const instance of running) instance.dispose();
  running = [];
  document.body.innerHTML = '';
});

function seedFor(situation: string, difficulty: Difficulty): number {
  for (let seed = 1; seed < 5000; seed++) if (createInitialState(seed, difficulty).situation === situation) return seed;
  throw new Error(`no seed for ${situation}`);
}

function setup(situation = 'supplierDelay', difficulty: Difficulty = 'easy', locale: Parameters<typeof createTestContext>[1] = 'en') {
  const ctx = createTestContext(game as never, locale);
  const instance = game.create(ctx.context);
  running.push(instance);
  instance.newGame({ seed: seedFor(situation, difficulty), difficulty });
  return { ctx, instance, root: ctx.context.root };
}

const byId = <T extends HTMLElement = HTMLElement>(root: HTMLElement, id: string) => {
  const el = root.querySelector<T>(`[data-testid="${id}"]`);
  if (!el) throw new Error(`missing ${id}`);
  return el;
};
const maybe = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const step = (root: HTMLElement) => byId(root, 'bg-step').dataset.step;

function sortCard(root: HTMLElement, cardId: string, value: Slot | '') {
  const select = byId<HTMLSelectElement>(root, `bg-select-${cardId}`);
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

/** Sorts every card through the DOM with `pick` (default: the model answer) and checks. */
function sortAndCheck(root: HTMLElement, instance: GameInstance<BriefingState>, pick?: (id: string) => Slot) {
  const state = instance.serialize();
  const def = situationOf(state);
  for (const id of state.cards) sortCard(root, id, pick ? pick(id) : (cardDef(def, id)!.gold[0] as Slot));
  byId(root, 'bg-check-sort').click();
}

const indexOf = <T>(order: readonly T[], id: T) => order.indexOf(id);

describe('Briefing Game view', () => {
  it('shows the situation, recipient, steps and an unsorted inbox with section menus', () => {
    const { root } = setup();
    expect(byId(root, 'bg-situation').dataset.situation).toBe('supplierDelay');
    expect(byId(root, 'bg-situation').textContent).toContain('desk lamp');
    expect(byId(root, 'bg-recipient').textContent).toBe('Briefing for: the head of product');
    expect(byId(root, 'bg-progress-sort').dataset.status).toBe('current');
    expect(byId(root, 'bg-progress-decide').dataset.status).toBe('next');
    const selects = root.querySelectorAll<HTMLSelectElement>('select[data-testid^="bg-select-"]');
    expect(selects).toHaveLength(7);
    expect(selects[0]!.options).toHaveLength(8);
    expect(selects[0]!.getAttribute('aria-label')).toBe('Section for card 1');
    expect(selects[0]!.value).toBe('');
    expect(byId(root, 'bg-count').textContent).toBe('Sorted: 0 of 7');
    expect(root.querySelector('[data-autofocus]')).not.toBeNull();
    expect(root.querySelector('details.bg-guide')!.hasAttribute('open')).toBe(true);
  });

  it('keeps the section guide closed on harder levels', () => {
    const { root } = setup('supplierDelay', 'hard');
    expect(root.querySelector('details.bg-guide')!.hasAttribute('open')).toBe(false);
    expect(root.querySelectorAll('select[data-testid^="bg-select-"]')).toHaveLength(12);
  });

  it('saves each sorting change and asks for every card before checking', () => {
    const { root, ctx, instance } = setup();
    sortCard(root, 'c1', 'context');
    expect(byId<HTMLSelectElement>(root, 'bg-select-c1').value).toBe('context');
    expect(byId(root, 'bg-card-c1').dataset.placed).toBe('context');
    expect(byId(root, 'bg-count').textContent).toBe('Sorted: 1 of 7');
    expect(ctx.saveRequests()).toBe(1);
    byId(root, 'bg-check-sort').click();
    expect(byId(root, 'bg-notice').textContent).toBe('Sort every card first. Still open: 6');
    expect(ctx.saveRequests()).toBe(1);
    sortCard(root, 'c1', '');
    expect(instance.serialize().placement.every((p) => p === null)).toBe(true);
    expect(ctx.saveRequests()).toBe(2);
  });

  it('shows per-card verdicts with symbols, text and reasons, per-section counts and patterns', () => {
    const { root, instance } = setup('supplierDelay', 'hard');
    const wrong: Record<string, Slot> = { c4: 'facts', c5: 'facts', c12: 'context' };
    const state = instance.serialize();
    const def = situationOf(state);
    sortAndCheck(root, instance, (id) => wrong[id] ?? (cardDef(def, id)!.gold[0] as Slot));
    expect(step(root)).toBe('decide');
    expect(byId(root, 'bg-progress-sort').dataset.status).toBe('done');
    const c2 = byId(root, 'bg-verdict-c2');
    expect(c2.dataset.verdict).toBe('correct');
    expect(c2.textContent).toContain('✓');
    expect(c2.textContent).toContain('Fits: Relevant facts');
    expect(c2.textContent).toContain('A confirmed fact');
    const c5 = byId(root, 'bg-verdict-c5');
    expect(c5.dataset.verdict).toBe('wrong');
    expect(c5.textContent).toContain('✗');
    expect(c5.textContent).toContain('Your choice: Relevant facts. Better: Uncertainty');
    expect(c5.textContent).toContain('“expects”');
    expect(byId(root, 'bg-feedback-summary').textContent).toBe('Cards in a fitting section: 9 of 12');
    expect(byId(root, 'bg-section-uncertainty').textContent).toContain('Uncertainty: 0 of 2');
    expect(byId(root, 'bg-section-facts').dataset.correct).toBe('2');
    const patterns = byId(root, 'bg-patterns').querySelectorAll('li');
    expect(patterns[0]!.textContent).toBe('Uncertainty sorted as Relevant facts: 2');
    expect(patterns[1]!.textContent).toBe('Leave out sorted as Context: 1');
  });

  it('mentions the second fitting section of a two-section card', () => {
    const { root, instance } = setup('basement', 'easy');
    sortAndCheck(root, instance, (id) => (id === 'c6' ? 'uncertainty' : (cardDef(situationOf(instance.serialize()), id)!.gold[0] as Slot)));
    const c6 = byId(root, 'bg-verdict-c6');
    expect(c6.dataset.verdict).toBe('correct');
    expect(c6.textContent).toContain('Fits: Uncertainty');
    expect(c6.textContent).toContain('Also fits: Risks');
    expect(byId(root, 'bg-patterns').textContent).toBe('Every card is in a fitting section.');
  });

  it('checks decision and next action, reveals explanations and compares the briefings', () => {
    const { root, ctx, instance } = setup();
    sortAndCheck(root, instance, (id) => (id === 'c2' ? 'leave' : (cardDef(situationOf(instance.serialize()), id)!.gold[0] as Slot)));
    byId(root, 'bg-check-choices').click();
    expect(byId(root, 'bg-notice').textContent).toBe('Choose a decision and a next action first.');
    const state = instance.serialize();
    const right = indexOf(state.decisionOrder, 'right');
    const vague = indexOf(state.actionOrder, 'vague');
    byId(root, `bg-decision-${right}`).click();
    byId(root, `bg-action-${vague}`).click();
    expect(instance.serialize()).toMatchObject({ decision: 'right', action: 'vague' });
    const saves = ctx.saveRequests();
    byId(root, 'bg-check-choices').click();
    expect(ctx.saveRequests()).toBe(saves + 1);
    expect(step(root)).toBe('review');
    const d = byId(root, `bg-decision-${right}`);
    expect(d.dataset.fit).toBe('true');
    expect(d.dataset.chosen).toBe('true');
    expect(d.textContent).toContain('Your choice');
    expect(d.textContent).toContain('only the recipient can settle');
    const a = byId(root, `bg-action-${vague}`);
    expect(a.dataset.fit).toBe('false');
    expect(a.textContent).toContain('Too vague');
    expect(byId(root, `bg-action-${indexOf(state.actionOrder, 'concrete')}`).dataset.fit).toBe('true');
    // Your briefing lacks the fact card; the model has it. Both show the chosen / model decision and action.
    const yours = byId(root, 'bg-yours');
    const model = byId(root, 'bg-model');
    expect(yours.querySelector('[data-section="facts"]')!.textContent).toContain('(nothing here)');
    expect(model.querySelector('[data-section="facts"]')!.textContent).toContain('only 200 of the 500');
    expect(yours.querySelector('[data-section="next"]')!.textContent).toContain('keep an eye on the supplier');
    expect(model.querySelector('[data-section="next"]')!.textContent).toContain('Jonas calls the supplier');
    expect(model.querySelector('[data-section="decision"]')!.textContent).toContain('Keep the launch on 14 May');
    expect(model.querySelectorAll('.bg-briefing-section')).toHaveLength(6);
  });

  it('keeps notes and self-checks, finishes once and shows the summary, also after restore', () => {
    const { root, ctx, instance } = setup('release', 'medium');
    sortAndCheck(root, instance);
    const state = instance.serialize();
    byId(root, `bg-decision-${indexOf(state.decisionOrder, 'right')}`).click();
    byId(root, `bg-action-${indexOf(state.actionOrder, 'concrete')}`).click();
    byId(root, 'bg-check-choices').click();
    const notes = byId<HTMLTextAreaElement>(root, 'bg-notes');
    notes.value = 'My own briefing';
    notes.dispatchEvent(new Event('input', { bubbles: true }));
    byId(root, 'bg-check-0').click();
    expect(instance.serialize()).toMatchObject({ notes: 'My own briefing', checks: [true, false, false] });
    expect(ctx.results).toHaveLength(0);
    byId(root, 'bg-finish').click();
    expect(maybe(root, 'bg-step')).toBeNull();
    const summary = byId(root, 'bg-summary-list');
    expect(summary.dataset.correct).toBe('9');
    expect(summary.textContent).toContain('Decision: as in the model briefing');
    expect(summary.textContent).toContain('Self-check ticked: 1 of 3');
    expect(byId(root, 'bg-notes-final').textContent).toContain('My own briefing');
    expect(maybe(root, 'bg-compare')).not.toBeNull();
    expect(ctx.results).toEqual([{ outcome: 'completed', stats: { cards: 9, fittingCards: 9, decision: 1, nextAction: 1 } }]);
    expect(byId(root, 'bg-progress-review').dataset.status).toBe('done');

    const saved = instance.serialize();
    const ctx2 = createTestContext(game as never, 'en');
    const restored = game.create(ctx2.context);
    running.push(restored);
    restored.restore(saved);
    expect(maybe(ctx2.context.root, 'bg-summary')).not.toBeNull();
    expect(ctx2.results).toHaveLength(0);
  });

  it('restores every phase visibly', () => {
    const { root, instance } = setup('volunteers', 'medium');
    const snapshots: BriefingState[] = [instance.serialize()];
    sortCard(root, 'c1', 'risks');
    snapshots.push(instance.serialize());
    sortAndCheck(root, instance);
    snapshots.push(instance.serialize());
    byId(root, 'bg-decision-0').click();
    byId(root, 'bg-action-2').click();
    snapshots.push(instance.serialize());
    byId(root, 'bg-check-choices').click();
    byId(root, 'bg-check-2').click();
    snapshots.push(instance.serialize());
    byId(root, 'bg-finish').click();
    snapshots.push(instance.serialize());
    for (const snap of snapshots) {
      const ctx = createTestContext(game as never, 'en');
      const other = game.create(ctx.context);
      running.push(other);
      other.restore(snap);
      expect(other.serialize()).toEqual(snap);
      const r = ctx.context.root;
      if (snap.step === 'done') {
        expect(maybe(r, 'bg-summary')).not.toBeNull();
        continue;
      }
      expect(byId(r, 'bg-step').dataset.step).toBe(snap.step);
      if (snap.step === 'sort') expect(byId<HTMLSelectElement>(r, 'bg-select-c1').value).toBe(snap.placement[snap.cards.indexOf('c1')] ?? '');
      if (snap.step === 'decide') {
        expect(byId(r, 'bg-verdict-c1').dataset.verdict).toBe('correct');
        expect(byId<HTMLInputElement>(r, 'bg-decision-0').checked).toBe(snap.decision !== null);
        expect(byId<HTMLInputElement>(r, 'bg-action-2').checked).toBe(snap.action !== null);
      }
      if (snap.step === 'review') {
        expect(byId<HTMLInputElement>(r, 'bg-check-2').checked).toBe(true);
        expect(maybe(r, 'bg-compare')).not.toBeNull();
      }
    }
  });

  it('ignores input while paused, and reset and new games start over', () => {
    const { root, instance, ctx } = setup();
    instance.pause();
    sortCard(root, 'c1', 'facts');
    byId(root, 'bg-check-sort').click();
    expect(instance.serialize().placement.every((p) => p === null)).toBe(true);
    expect(maybe(root, 'bg-notice')).toBeNull();
    instance.resume();
    sortCard(root, 'c1', 'facts');
    expect(instance.serialize().placement.filter((p) => p !== null)).toEqual(['facts']);
    const saves = ctx.saveRequests();
    instance.reset();
    expect(ctx.saveRequests()).toBe(saves + 1);
    expect(instance.serialize().placement.every((p) => p === null)).toBe(true);
    instance.newGame({ seed: seedFor('tournament', 'hard'), difficulty: 'hard' });
    expect(byId(root, 'bg-situation').dataset.situation).toBe('tournament');
    expect(root.querySelectorAll('select[data-testid^="bg-select-"]')).toHaveLength(12);
  });

  it('renders every situation in every locale without missing text, and RTL for Arabic', () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const def of SITUATIONS) {
        const { root, ctx, instance } = setup(def.id, 'hard', locale);
        sortAndCheck(root, instance, (id) => (id === 'c2' ? 'risks' : (cardDef(def, id)!.gold.at(-1) as Slot)));
        byId(root, 'bg-decision-0').click();
        byId(root, 'bg-action-0').click();
        byId(root, 'bg-check-choices').click();
        expect(ctx.missingKeys, `${locale}/${def.id}`).toEqual([]);
        for (const p of root.querySelectorAll('.bg-reason, .bg-card-text, .bg-briefing li, .bg-briefing-lead')) {
          expect(p.textContent?.trim(), `${locale}/${def.id}`).not.toBe('');
        }
        expect(root.querySelector('.wp-briefing-game')!.getAttribute('dir')).toBe(locale === 'ar' ? 'rtl' : 'ltr');
        instance.dispose();
      }
    }
  }, 90_000);
});
