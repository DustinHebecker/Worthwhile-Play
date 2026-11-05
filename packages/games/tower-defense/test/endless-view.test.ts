// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { newGame, resolveWave, startWave, WEAR_FROM, type TdState } from '../src/rules';

/** The endless game in the view (design § 15.11; review of PR #114). */
const at = (wave: number, core: number, phase: TdState['phase'] = 'build'): TdState => ({ ...newGame(5, 'standard', 'training', 'endless'), wave, core, phase, log: Array.from({ length: wave + 1 }, () => []) });
const text = (root: HTMLElement, id: string) => root.querySelector(`[data-testid="${id}"]`)!.textContent ?? '';
const click = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`)!.click();

function mount(state: TdState) {
  const ctx = createTestContext(game as never);
  const instance = game.create(ctx.context);
  instance.restore(state);
  return { ctx, root: ctx.context.root, instance };
}

// "Instant" runs in slices on timeouts; a clock that moves 5 ms per reading makes the slices the same every run.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  let now = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => (now += 5));
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('endless in the view', () => {
  it('the HUD says endless and announces the wear-down five waves ahead, then each wave’s loss', () => {
    const early = mount(at(WEAR_FROM - 6, 20));
    expect(text(early.root, 'wave')).toContain('endless');
    expect(text(early.root, 'interest')).not.toContain('wears down');
    early.instance.dispose();
    const soon = mount(at(WEAR_FROM - 5, 20));
    expect(text(soon.root, 'interest')).toContain(`From wave ${WEAR_FROM + 1}`);
    soon.instance.dispose();
    const wear = mount(at(WEAR_FROM + 2, 20));
    expect(text(wear.root, 'interest')).toContain('core −3');
    wear.instance.dispose();
  });

  it('worn down: the game finishes once as completed, with how many waves were held', () => {
    const s = startWave(at(WEAR_FROM + 2, 3));
    s.run!.pending = [];
    const { ctx, root, instance } = mount(s);
    click(root, 'instant');
    vi.runAllTimers();
    expect(ctx.results).toHaveLength(1);
    expect(ctx.results[0]).toMatchObject({ outcome: 'completed', stats: { waves: WEAR_FROM + 3 } });
    expect(text(root, 'status')).toContain(`Waves held: ${WEAR_FROM + 3}`);
    instance.dispose();
  });

  it('ending after the core fell: completed in endless, lost otherwise', () => {
    const endless = mount(at(30, 0, 'lost'));
    click(endless.root, 'give-up');
    expect(endless.ctx.results[0]).toMatchObject({ outcome: 'completed', stats: { waves: 30 } });
    expect(text(endless.root, 'status')).toContain('Waves held: 30');
    endless.instance.dispose();
    const plain = mount({ ...newGame(5), wave: 3, core: 0, phase: 'lost', log: [[], [], [], []] });
    click(plain.root, 'give-up');
    expect(plain.ctx.results[0]).toMatchObject({ outcome: 'lost' });
    plain.instance.dispose();
  });
});

describe('"Instant" in slices (review of PR #115: a long wave blocked the page for half a minute)', () => {
  const running = (): TdState => startWave(newGame(9, 'standard', 'training', 'endless'));
  const tick = (root: HTMLElement) => Number(root.querySelector<HTMLElement>('.wp-tower-defense')!.dataset.tick);

  it('gives the page a turn between slices and ends exactly as resolveWave', () => {
    const s = running();
    const expected = resolveWave(s).state;
    const { root, instance } = mount(s);
    click(root, 'instant');
    // Nothing yet: the first slice comes on a timeout.
    expect(tick(root)).toBe(0);
    expect(text(root, 'phase')).toContain('Resolving');
    expect(root.querySelector<HTMLButtonElement>('[data-testid="instant"]')!.disabled).toBe(true);
    vi.advanceTimersToNextTimer();
    const first = tick(root);
    expect(first).toBeGreaterThan(0);
    // One slice is a few steps of 20 ticks, not the wave.
    expect(first).toBeLessThanOrEqual(100);
    expect(root.querySelector<HTMLElement>('.wp-tower-defense')!.dataset.phase).toBe('wave');
    vi.runAllTimers();
    expect(instance.serialize()).toEqual(expected);
    // The wave's whole count, not the last slice's.
    expect(expected.stats.leaked).toBeGreaterThan(0);
    expect(text(root, 'status')).toContain(`Destroyed: ${expected.stats.killed}. Got through: ${expected.stats.leaked}.`);
    instance.dispose();
  });

  it('stops at a host pause and goes on after it; Pause in the game stops it too; closing cancels it', () => {
    const s = running();
    const expected = resolveWave(s).state;
    const { root, instance } = mount(s);
    click(root, 'instant');
    vi.advanceTimersToNextTimer();
    instance.pause();
    const held = tick(root);
    vi.runAllTimers();
    expect(tick(root)).toBe(held);
    expect(text(root, 'phase')).toContain('paused');
    instance.resume();
    vi.runAllTimers();
    expect(instance.serialize()).toEqual(expected);
    instance.dispose();

    const again = mount(running());
    click(again.root, 'instant');
    vi.advanceTimersToNextTimer();
    click(again.root, 'play');
    const stopped = tick(again.root);
    vi.runAllTimers();
    expect(tick(again.root)).toBe(stopped);
    expect(text(again.root, 'phase')).toContain('paused');
    click(again.root, 'instant');
    vi.advanceTimersToNextTimer();
    again.instance.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });
});
