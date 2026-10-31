// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { GameInstance } from '@wp/game-core';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { isOver, type ManyLivesState } from '../src/rules';

let running: GameInstance<ManyLivesState>[] = [];
afterEach(() => {
  for (const instance of running) instance.dispose();
  running = [];
  document.body.innerHTML = '';
});

function setup(seed = 11, locale: Parameters<typeof createTestContext>[1] = 'en', household = 'de') {
  const ctx = createTestContext(game as never, locale);
  const instance = game.create(ctx.context);
  running.push(instance);
  instance.newGame({ seed, settings: { household } });
  return { ctx, instance, root: ctx.context.root };
}

const byId = <T extends HTMLElement = HTMLElement>(root: HTMLElement, id: string) => root.querySelector<T>(`[data-testid="${id}"]`);

describe('Many Lives view', () => {
  it('shows the work-in-progress note, the status, the scene and the first event', () => {
    const { root } = setup();
    expect(byId(root, 'ml-wip')?.textContent).toContain('Work in progress');
    expect(byId(root, 'ml-age')?.textContent).toBe('Age: 6');
    expect(root.querySelectorAll('.ml-stat meter')).toHaveLength(8);
    expect(byId(root, 'ml-scene')?.querySelector('svg')).not.toBeNull();
    expect(byId(root, 'ml-scene')?.querySelector('figcaption')?.textContent).toBe('Your life: living with the parents, at school');
    expect(byId(root, 'ml-event-title')?.textContent).toBe('First day of school');
    expect(byId(root, 'ml-budget')?.textContent).toContain('Your parents still pay for everything.');
  });

  it('a choice resolves the event and offers the time buttons; time moves to the next event', () => {
    const { root, instance, ctx } = setup();
    byId(root, 'ml-choice-friendly')!.click();
    expect(instance.serialize().life.flags).toContain('trait.social');
    expect(byId(root, 'ml-next-event')).not.toBeNull();
    const saves = ctx.saveRequests();
    byId(root, 'ml-next-event')!.click();
    expect(ctx.saveRequests()).toBeGreaterThan(saves);
    expect(byId(root, 'ml-event-title')?.textContent).toBe('The school recommendation');
    expect(byId(root, 'ml-log')?.textContent).toContain('The school recommendation');
  });

  it('renders in German', () => {
    const { root } = setup(11, 'de');
    expect(byId(root, 'ml-wip')?.textContent).toContain('In Arbeit');
    expect(byId(root, 'ml-event-title')?.textContent).toBe('Der erste Schultag');
  });

  it('shows the life review at the end and reports the natural end exactly once', () => {
    const { root, instance, ctx } = setup(4);
    for (let guard = 0; guard < 3000 && !isOver(instance.serialize()); guard++) {
      const choice = root.querySelector<HTMLElement>('.ml-choices button');
      (choice ?? byId(root, 'ml-next-event')!).click();
    }
    expect(isOver(instance.serialize())).toBe(true);
    expect(byId(root, 'ml-review-age')?.textContent).toContain('Lived to the age of');
    expect(byId(root, 'ml-review-dims')?.querySelectorAll('meter')).toHaveLength(7);
    expect(byId(root, 'ml-review-mobility')?.textContent).toMatch(/percentile \d+/);
    expect(root.querySelector('.ml-timeline')).not.toBeNull();
    expect(root.querySelectorAll('.ml-table tbody tr').length).toBeGreaterThan(3);
    expect(ctx.results).toEqual([{ outcome: 'completed', stats: { age: expect.any(Number) } }]);
    expect(instance.serialize().reported).toBe(true);
    // A restored finished life shows the review again but is not reported twice.
    instance.restore(instance.serialize());
    expect(ctx.results).toHaveLength(1);
  });

  it('shows the Indian region with its own scene, events and rupees', () => {
    const { root, instance } = setup(4, 'en', 'street');
    expect(byId(root, 'ml-region')?.textContent).toBe('A large country in South Asia (calibrated on India)');
    expect(byId(root, 'ml-event-title')?.textContent).toBe('Starting school');
    expect(root.querySelector('.ml-s-tarp')).not.toBeNull();
    byId(root, 'ml-choice-government')!.click();
    const s = instance.serialize();
    expect(s.life.flags).toContain('school.government');
    instance.restore({ ...s, life: { ...s.life, month: 16 * 12 + 1, ledger: { balances: { cash: 1_000_000 }, flows: {}, opening: 1_000_000 } } });
    expect(byId(root, 'ml-cash')?.textContent).toContain('₹');
  });

  it('reset returns to the seeded start of the same life', () => {
    const { root, instance } = setup(21);
    const start = instance.serialize();
    byId(root, 'ml-choice-curious')!.click();
    byId(root, 'ml-next-event')!.click();
    instance.reset();
    expect(instance.serialize()).toEqual(start);
  });
});
