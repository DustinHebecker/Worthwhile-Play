// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createTestContext } from '@wp/testing';
import type { GameModule } from '@wp/game-core';
import game from '../src/index';
import { knownList, type MinimalProofState } from '../src/rules';

const start = (seed = 9, difficulty = 'medium', locale: Parameters<typeof createTestContext>[1] = 'en') => {
  const ctx = createTestContext(game as GameModule<unknown>, locale);
  const instance = game.create(ctx.context);
  instance.newGame({ seed, difficulty });
  const root = ctx.context.root;
  const q = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const ready = () => root.querySelector<HTMLElement>('[data-testid^="rule-"][data-applicable="true"]');
  return { ctx, instance, root, q, ready };
};

describe('Proof Chain view', () => {
  it('shows goal, facts and rules with accessible labels', () => {
    const { instance, root, q } = start();
    const s = instance.serialize();
    expect(q('mp-goal')?.dataset.reached).toBe('false');
    expect(q('mp-goal')?.getAttribute('aria-label')).toMatch(/^Goal: prove [A-Z] \(/);
    expect(root.querySelectorAll('[data-testid^="fact-"]')).toHaveLength(s.puzzle.facts.length);
    for (const f of s.puzzle.facts) expect(q(`fact-${f}`)).not.toBeNull();
    expect(root.querySelectorAll('[data-testid^="rule-"]')).toHaveLength(s.puzzle.rules.length);
    const label = q('rule-0')?.getAttribute('aria-label') ?? '';
    expect(label).toMatch(/^Rule 1: If .+, then .+\. (can be applied now|conclusion already known|premises not yet known)$/);
    expect(q('mp-status')?.textContent).toBe('Steps so far: 0');
    expect((q('mp-undo') as HTMLButtonElement).disabled).toBe(true);
    // Roving tabindex: exactly one rule is in the tab order.
    expect(root.querySelectorAll('[data-testid^="rule-"][tabindex="0"]')).toHaveLength(1);
  });

  it('refuses a rule with unknown premises and explains why, without saving', () => {
    const { ctx, root, q, instance } = start();
    const before = instance.serialize();
    const blocked = [...root.querySelectorAll<HTMLElement>('[data-testid^="rule-"][data-state="missing"]')][0];
    expect(blocked).toBeDefined();
    blocked?.click();
    expect(instance.serialize()).toEqual(before);
    expect(ctx.saveRequests()).toBe(0);
    expect(q('mp-feedback')?.hidden).toBe(false);
    expect(q('mp-feedback')?.textContent).toMatch(/^Not yet\. (Still needed|Needed): /);
  });

  it('applies rules, undoes, resets the proof, and finishes exactly once with stats', () => {
    const { ctx, q, ready, instance } = start(4, 'hard');
    ready()?.click();
    expect(instance.serialize().applied).toHaveLength(1);
    expect(q('mp-status')?.textContent).toBe('Steps so far: 1');
    expect(q('mp-feedback')?.textContent).toMatch(/^Derived .+ with rule \d+\.$/);
    q('mp-undo')?.click();
    expect(instance.serialize().applied).toEqual([]);
    ready()?.click();
    ready()?.click();
    q('mp-reset')?.click();
    expect(instance.serialize().applied).toEqual([]);
    const saves = ctx.saveRequests();
    expect(saves).toBe(5);

    // Greedy forward chaining always reaches the goal.
    for (let guard = 0; guard < 20 && ctx.results.length === 0; guard++) ready()?.click();
    const s: MinimalProofState = instance.serialize();
    expect(knownList(s.puzzle, s.applied)).toContain(s.puzzle.goal);
    expect(ctx.results).toEqual([{ outcome: 'completed', stats: { steps: s.applied.length, minimal: s.puzzle.minimal } }]);
    expect(q('mp-goal')?.dataset.reached).toBe('true');
    expect(q('mp-status')?.dataset.state).toBe('solved');
    expect(q('mp-status')?.textContent).toContain(`Steps used: ${s.applied.length}. Shortest possible: ${s.puzzle.minimal}.`);
    expect(ready()).toBeNull();
    q('rule-0')?.click();
    q('mp-undo')?.click();
    expect(instance.serialize()).toEqual(s);
    expect(ctx.results).toHaveLength(1);

    // Restoring a finished game does not finish again.
    const ctx2 = createTestContext(game as GameModule<unknown>);
    const again = game.create(ctx2.context);
    again.restore(s);
    expect(ctx2.results).toHaveLength(0);
    expect(ctx2.context.root.querySelector('[data-testid="mp-status"]')?.getAttribute('data-state')).toBe('solved');
  });

  it('ignores input while paused and supports a fresh new game on the same instance', () => {
    const { instance, ready } = start(2, 'easy');
    instance.pause();
    ready()?.click();
    expect(instance.serialize().applied).toEqual([]);
    instance.resume();
    ready()?.click();
    expect(instance.serialize().applied).toHaveLength(1);
    instance.newGame({ seed: 2, difficulty: 'easy' });
    expect(instance.serialize().applied).toEqual([]);
  });

  it('animates a new statement only without reduced motion', () => {
    const ctx = createTestContext(game as GameModule<unknown>);
    const instance = game.create({ ...ctx.context, reducedMotion: false });
    instance.newGame({ seed: 1, difficulty: 'easy' });
    ctx.context.root.querySelector<HTMLElement>('[data-applicable="true"]')?.click();
    expect(ctx.context.root.querySelectorAll('.mp-fact.is-new')).toHaveLength(1);
    const { root, ready } = start(1, 'easy');
    ready()?.click();
    expect(root.querySelectorAll('.mp-fact.is-new')).toHaveLength(0);
  });

  it('renders right-to-left with left-to-right formulas', () => {
    const { root } = start(3, 'hard', 'ar');
    expect(root.querySelector('.wp-minimal-proof')?.getAttribute('dir')).toBe('rtl');
    expect(root.querySelector('.mp-formula')?.getAttribute('dir')).toBe('ltr');
    expect(root.querySelector('[data-testid="mp-goal"]')?.getAttribute('aria-label')).toMatch(/^الهدف: أثبت /);
  });
});
