// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { GameContext, GameInstance, GameModule } from '@wp/game-core';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { expectedResponse, generateBlock, generateItems, ITEM_COUNT, type Item, type ProspectiveState } from '../src/rules';

const instances: GameInstance<ProspectiveState>[] = [];

function setup(options: { reducedMotion?: boolean; seed?: number; difficulty?: string; locale?: 'en' | 'ar' } = {}) {
  const ctx = createTestContext(game as GameModule<unknown>, options.locale ?? 'en');
  const finished: unknown[] = [];
  const context: GameContext = { ...ctx.context, reducedMotion: options.reducedMotion ?? true, finished: (r) => finished.push(r) };
  const instance = game.create(context);
  instances.push(instance);
  const root = context.root;
  const el = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const click = (id: string) => (el(id) as HTMLButtonElement).click();
  const key = (k: string, target: EventTarget = document.body) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  if (options.seed !== undefined) instance.newGame({ seed: options.seed, ...(options.difficulty ? { difficulty: options.difficulty } : {}) });
  return { ctx, context, instance, root, el, click, key, finished };
}

afterEach(() => {
  for (const instance of instances.splice(0)) instance.dispose();
});

describe('Keep in Mind view', () => {
  it('states the task and the intentions before the start; nothing runs on its own', () => {
    const g = setup({ seed: 1 });
    expect(g.el('pm-intro')?.hidden).toBe(false);
    expect(g.el('pm-intentions')?.textContent).toBe('When a star ★ appears, press Note instead of sorting it.');
    expect(g.el('pm-length')?.textContent).toBe('Block: 40 shapes at your own pace, about 3 minutes. There is no timer.');
    expect(g.el('pm-keys')?.textContent).toBe('Keys: F = Round, J = Corners, N = Note.');
    expect(g.el('pm-start')?.hasAttribute('data-autofocus')).toBe(true);
    expect(g.el('pm-status')?.textContent).toBe('Read your intentions, then start whenever you are ready.');
    expect(g.instance.serialize()).toMatchObject({ phase: 'ready', index: 0 });
    // Keys do nothing before the start.
    g.key('f');
    expect(g.instance.serialize().index).toBe(0);
  });

  it('hard lists both intentions and offers Check in; easy does not', () => {
    const hard = setup({ seed: 1, difficulty: 'hard' });
    const list = hard.el('pm-intentions') as HTMLElement;
    expect([...list.querySelectorAll('li')].map((li) => li.dataset.intention)).toEqual(['dot', 'checkIn']);
    expect(list.textContent).toContain('After you have sorted 20 shapes, press Check in once');
    hard.click('pm-start');
    expect(hard.el('pm-checkIn')?.hidden).toBe(false);
    const easy = setup({ seed: 1 });
    easy.click('pm-start');
    expect(easy.el('pm-checkIn')?.hidden).toBe(true);
    easy.key('c');
    expect(easy.instance.serialize().checkIns).toEqual([]);
  });

  it('shows the seeded shapes with text names, saves after every answer, cue marked by shape not colour', () => {
    const g = setup({ seed: 9, difficulty: 'medium' });
    const items = generateItems(9, 'medium');
    g.click('pm-start');
    const saves = g.ctx.saveRequests();
    for (let i = 0; i < 20; i++) {
      const item = g.el('pm-item') as HTMLElement;
      const expected = items[i] as Item;
      expect(item.dataset.index).toBe(String(i));
      expect(item.dataset.shape).toBe(expected.shape);
      expect(item.dataset.dot).toBe(String(expected.dot));
      expect(item.getAttribute('role')).toBe('img');
      const name = expected.shape.charAt(0).toUpperCase() + expected.shape.slice(1);
      expect(item.getAttribute('aria-label')).toBe(expected.dot ? `${name} with a dot` : name);
      expect(item.querySelectorAll('.wp-pm__dot')).toHaveLength(expected.dot ? 1 : 0);
      expect(g.el('pm-status')?.textContent).toBe(`Shape ${i + 1} of ${ITEM_COUNT}`);
      g.click(`pm-${expectedResponse(expected)}`);
    }
    expect(g.ctx.saveRequests()).toBe(saves + 20);
    expect(g.instance.serialize().answers).toEqual(items.slice(0, 20).map(expectedResponse));
  });

  it('answers with F / J / N / C from the keyboard, but not from host controls or text fields', () => {
    const g = setup({ seed: 4, difficulty: 'hard' });
    g.click('pm-start');
    g.key('f');
    g.key('J');
    g.key('c');
    expect(g.el('pm-ack')?.textContent).toBe('Check-in recorded.');
    g.key('n');
    expect(g.el('pm-ack')?.textContent).toBe('Note recorded.');
    expect(g.instance.serialize()).toMatchObject({ index: 3, answers: ['round', 'angular', 'note'], checkIns: [2] });
    const input = document.createElement('input');
    document.body.append(input);
    g.key('f', input);
    const hostButton = document.createElement('button');
    document.body.append(hostButton);
    g.key('f', hostButton);
    expect(g.instance.serialize().index).toBe(3);
    input.remove();
    hostButton.remove();
  });

  it('pause holds the block behind Continue, shows the intentions again and keeps the state', () => {
    const g = setup({ seed: 2, difficulty: 'hard' });
    g.click('pm-start');
    g.click('pm-round');
    const before = g.instance.serialize();
    g.instance.pause();
    expect(g.el('pm-continue')?.hidden).toBe(false);
    expect(g.el('pm-reminder')?.hidden).toBe(false);
    expect(g.el('pm-reminder-list')?.querySelectorAll('li')).toHaveLength(2);
    expect(g.el('pm-item')?.dataset.shape).toBeUndefined();
    expect(g.el('pm-status')?.textContent).toContain('Paused');
    g.key('f');
    g.instance.resume();
    g.key('f');
    g.click('pm-round');
    expect(g.instance.serialize()).toEqual(before);
    g.click('pm-continue');
    expect(g.el('pm-continue')?.hidden).toBe(true);
    expect(g.el('pm-reminder')?.hidden).toBe(true);
    expect(g.el('pm-item')?.dataset.index).toBe('1');
    g.key('j');
    expect(g.instance.serialize().index).toBe(2);
  });

  it('restores mid-block at the same shape, including recorded check-ins', () => {
    const g = setup({ seed: 6, difficulty: 'hard' });
    const items = generateItems(6, 'hard');
    g.click('pm-start');
    for (let i = 0; i < 5; i++) g.click('pm-angular');
    g.click('pm-checkIn');
    const saved = g.instance.serialize();
    expect(saved.checkIns).toEqual([5]);
    const r = setup();
    r.instance.restore(saved);
    expect(r.el('pm-continue')?.hidden).toBe(false);
    r.click('pm-continue');
    expect(r.el('pm-item')?.dataset.index).toBe('5');
    expect(r.el('pm-item')?.dataset.shape).toBe(items[5]?.shape);
    expect(r.instance.serialize()).toEqual(saved);
    // Check in once per shape only.
    r.click('pm-checkIn');
    expect(r.instance.serialize().checkIns).toEqual([5]);
  });

  it('finishes once with a neutral summary, background and everyday strategies', () => {
    const g = setup({ seed: 5 });
    const { items, cues } = generateBlock(5, 'easy');
    g.click('pm-start');
    for (let i = 0; i < ITEM_COUNT; i++) {
      const item = items[i] as Item;
      // Miss the first cue, note everything else correctly.
      g.click(i === cues[0] ? 'pm-round' : `pm-${expectedResponse(item)}`);
    }
    expect(g.finished).toEqual([
      { outcome: 'completed', stats: { correct: 35, total: 35, cues: 5, onTime: 4, late: 0, missed: 1, falseAlarms: 0 } }
    ]);
    const summary = g.el('pm-summary') as HTMLElement;
    expect(summary.hidden).toBe(false);
    const text = summary.textContent ?? '';
    expect(text).toContain('Shapes sorted correctly: 35 of 35');
    expect(text).toContain('Noted at the right moment: 4');
    expect(text).toContain('Noted a little later (within 2 shapes): 0');
    expect(text).toContain('Not noted: 1');
    expect(text).toContain('Note pressed without a signal: 0');
    expect(text).toContain('About prospective memory');
    expect(text).toContain('when–then plan');
    expect(text).not.toContain('Check-in');
    expect(text.toLowerCase()).not.toMatch(/record|best|improve|brain/);
    expect(g.el('pm-status')?.textContent).toBe('Block complete.');
    // Restoring a finished block does not report it again.
    const r = setup();
    r.instance.restore(g.instance.serialize());
    expect(r.finished).toEqual([]);
    expect(r.el('pm-summary')?.hidden).toBe(false);
  });

  it('reports the check-in outcome on hard', () => {
    const g = setup({ seed: 3, difficulty: 'hard' });
    const items = generateItems(3, 'hard');
    g.click('pm-start');
    for (let i = 0; i < ITEM_COUNT; i++) {
      if (i === 24 || i === 10) g.click('pm-checkIn');
      g.click(`pm-${expectedResponse(items[i] as Item)}`);
    }
    const text = g.el('pm-summary')?.textContent ?? '';
    expect(text).toContain('Check-in: later than planned (at shape 25).');
    expect(text).toContain('Other check-in presses: 1');
    expect(g.finished).toEqual([expect.objectContaining({ stats: expect.objectContaining({ checkInOnTime: 0 }) })]);
  });

  it('shapes are static with reduced motion; the locale direction is applied', () => {
    expect(setup({ seed: 1, reducedMotion: true }).root.firstElementChild?.classList.contains('wp-pm--motion')).toBe(false);
    expect(setup({ seed: 1, reducedMotion: false }).root.firstElementChild?.classList.contains('wp-pm--motion')).toBe(true);
    expect(setup({ seed: 1, locale: 'ar' }).root.firstElementChild?.getAttribute('dir')).toBe('rtl');
  });

  it('reset and newGame return to the seeded start', () => {
    const g = setup({ seed: 3, difficulty: 'hard' });
    const initial = g.instance.serialize();
    g.click('pm-start');
    g.click('pm-round');
    g.instance.reset();
    expect(g.instance.serialize()).toEqual(initial);
    expect(g.el('pm-intro')?.hidden).toBe(false);
    g.click('pm-start');
    g.click('pm-round');
    g.instance.newGame({ seed: 8, difficulty: 'medium' });
    expect(g.instance.serialize()).toEqual({ seed: 8, difficulty: 'medium', phase: 'ready', index: 0, answers: [], checkIns: [] });
    expect(g.el('pm-intentions')?.textContent).toContain('small dot');
  });
});
