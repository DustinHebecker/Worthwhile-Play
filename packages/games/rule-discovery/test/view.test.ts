// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createTestContext } from '@wp/testing';
import type { GameModule } from '@wp/game-core';
import game from '../src/index';
import { fits, type RuleDiscoveryState } from '../src/rules';

const start = (seed = 42, difficulty?: string, locale: 'en' | 'ar' = 'en') => {
  const ctx = createTestContext(game as GameModule<unknown>, locale);
  const instance = game.create(ctx.context);
  instance.newGame(difficulty ? { seed, difficulty } : { seed });
  const root = ctx.context.root;
  const q = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>(`[data-testid="${id}"]`);
  return { ctx, instance, root, q };
};

const type = (field: HTMLInputElement | null, value: string) => {
  if (!field) throw new Error('missing field');
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
};

const candidateIndex = (state: RuleDiscoveryState, wantTrue: boolean) => state.candidates.findIndex((id) => (id === state.rule) === wantTrue);

describe('Rule Hunt view', () => {
  it('shows the example and logs a test with Yes/No as text and symbol', () => {
    const { instance, q, ctx } = start();
    const s = instance.serialize();
    expect(q('rd-example')?.dataset.triple).toBe(s.example.join(','));
    type(q('rd-input-0'), '20');
    type(q('rd-input-1'), '1');
    type(q('rd-input-2'), '7');
    q('rd-test')?.click();
    const row = q('rd-log-row-0');
    const expected = fits(s.rule, [20, 1, 7]);
    expect(row?.dataset.fits).toBe(String(expected));
    expect(row?.textContent).toContain(expected ? '✓ Yes' : '✗ No');
    expect(q('rd-stats')?.dataset.tests).toBe('1');
    expect(ctx.saveRequests()).toBeGreaterThan(0);
  });

  it('does not log a duplicate and explains why; invalid input is reported', () => {
    const { instance, q, root } = start();
    q('rd-test')?.click();
    q('rd-test')?.click();
    expect(root.querySelectorAll('[data-testid^="rd-log-row-"]')).toHaveLength(1);
    expect(q('rd-notice')?.textContent).toContain('already tested');
    type(q('rd-input-1'), '99');
    q('rd-test')?.click();
    expect(instance.serialize().log).toHaveLength(1);
    expect(q('rd-notice')?.textContent).toContain('from 1 to 20');
  });

  it('a wrong guess shows a counter-example and reflection; the right one finishes once', () => {
    const { instance, q, ctx } = start(5, 'medium');
    const s = instance.serialize();
    const wrong = candidateIndex(s, false);
    q(`rd-candidate-${wrong}`)?.click();
    expect(q('rd-log-row-0')?.dataset.source).toBe('counter');
    expect(q('rd-insight')?.dataset.kind).toBe('untested');
    expect(q<HTMLButtonElement>(`rd-candidate-${wrong}`)?.disabled).toBe(true);
    expect(q(`rd-candidate-${wrong}`)?.textContent).toContain('ruled out');
    expect(ctx.results).toHaveLength(0);

    q(`rd-candidate-${candidateIndex(s, true)}`)?.click();
    expect(ctx.results).toEqual([{ outcome: 'won', stats: { tests: 0, guesses: 2 } }]);
    expect(q('rd-status')?.dataset.phase).toBe('solved');
    expect(q('rd-test')).toBeNull();
    expect(q('rd-insight')).not.toBeNull();
    q(`rd-candidate-${candidateIndex(s, true)}`)?.click();
    expect(ctx.results).toHaveLength(1);

    const saved = instance.serialize();
    const again = start();
    again.instance.restore(saved);
    expect(again.ctx.results).toHaveLength(0);
    expect(again.q('rd-status')?.dataset.phase).toBe('solved');
  });

  it('ignores input while paused and resets to the seeded start', () => {
    const { instance, q } = start(8);
    const initial = instance.serialize();
    instance.pause();
    q('rd-candidate-0')?.click();
    type(q('rd-input-0'), '19');
    instance.serialize();
    q('rd-test')?.click();
    expect(instance.serialize().log).toHaveLength(0);
    instance.resume();
    q('rd-test')?.click();
    expect(instance.serialize().log).toHaveLength(1);
    instance.reset();
    expect(instance.serialize()).toEqual(initial);
  });

  it('renders right-to-left with numbers kept left-to-right', () => {
    const { root, q } = start(3, 'hard', 'ar');
    expect(root.querySelector('.wp-rule-discovery')?.getAttribute('dir')).toBe('rtl');
    expect(q('rd-example')?.querySelector('[dir="ltr"]')).not.toBeNull();
  });
});
