// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameInstance } from '@wp/game-core';
import { createTestContext, type TestContext } from '@wp/testing';
import game from '../src/index';
import type { LogicPathState } from '../src/rules';

let running: GameInstance<LogicPathState>[] = [];
afterEach(() => {
  for (const instance of running) instance.dispose();
  running = [];
  vi.useRealTimers();
});

function start(seed: number, difficulty: string, options: { reducedMotion?: boolean; locale?: 'ar' | 'de' } = {}) {
  const ctx: TestContext = createTestContext(game as never, options.locale ?? 'en');
  const context = { ...ctx.context, reducedMotion: options.reducedMotion ?? true };
  const instance = game.create(context);
  instance.newGame({ seed, difficulty });
  running.push(instance);
  const root = context.root;
  const get = (id: string) => {
    const el = root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
    if (!el) throw new Error(`missing ${id}`);
    return el;
  };
  const click = (...ids: string[]) => ids.forEach((id) => get(id).click());
  return { ctx, instance, root, get, click };
}

const robotAt = (get: (id: string) => HTMLElement) => {
  const robot = get('lp-robot');
  return `${robot.dataset.row},${robot.dataset.col},${robot.dataset.dir}`;
};

describe('Robot Program view', () => {
  it('renders the board, robot and palette for the level', () => {
    // Easy level 1: ['.....', '>...G', '.....'].
    const { get, root } = start(0, 'easy');
    expect(get('lp-level').textContent).toBe('Level 1 of 8');
    expect(root.querySelectorAll('[data-testid^="cell-"]')).toHaveLength(15);
    expect(get('cell-1-4').dataset.kind).toBe('goal');
    expect(get('cell-1-4').getAttribute('aria-label')).toBe('Row 2, column 5: flag (goal)');
    expect(get('cell-0-0').dataset.kind).toBe('floor');
    expect(get('cell-1-0').getAttribute('aria-label')).toBe('Row 2, column 1: floor; Robot, facing right');
    expect(robotAt(get)).toBe('1,0,right');
    expect(get('lp-robot').getAttribute('aria-label')).toBe('Robot, facing right');
    expect(get('cell-1-0').contains(get('lp-robot'))).toBe(true);
    expect(root.querySelector('[data-testid="cmd-repeat"]')).toBeNull();
    expect(root.querySelector('[data-testid="cmd-if"]')).toBeNull();
    expect(get('lp-status').dataset.state).toBe('idle');
    expect(get('lp-count').textContent).toBe('Commands: 0 of 6');
    expect((get('lp-run') as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows walls and stars and the hard palette', () => {
    // Hard level 8 has stars in three corners.
    const { get, root } = start(7, 'hard');
    expect(get('cell-0-0').dataset.kind).toBe('star');
    expect(get('cell-1-1').dataset.kind).toBe('wall');
    expect(get('cell-3-3').dataset.kind).toBe('goal');
    for (const id of ['forward', 'left', 'right', 'if', 'repeat', 'end']) expect(root.querySelector(`[data-testid="cmd-${id}"]`)).not.toBeNull();
    expect((get('cmd-end') as HTMLButtonElement).disabled).toBe(true);
  });

  it('builds, edits and undoes a program', () => {
    const { get, click, root, ctx } = start(0, 'easy');
    click('cmd-forward', 'cmd-left', 'cmd-forward');
    expect(get('lp-count').dataset.value).toBe('3');
    expect(get('prog-1').getAttribute('aria-label')).toBe('Remove: Turn left');
    click('prog-1');
    expect(root.querySelectorAll('[data-testid^="prog-"]')).toHaveLength(2);
    expect(get('prog-1').textContent).toContain('Forward');
    click('lp-undo');
    expect(get('prog-1').textContent).toContain('Turn left');
    click('lp-clear');
    expect(root.querySelector('[data-testid="prog-0"]')).toBeNull();
    click('lp-undo');
    expect(root.querySelectorAll('[data-testid^="prog-"]')).toHaveLength(3);
    expect(ctx.saveRequests()).toBe(7);
  });

  it('disables the palette at the command limit', () => {
    const { get, click } = start(0, 'easy');
    for (let k = 0; k < 6; k++) click('cmd-forward');
    expect((get('cmd-forward') as HTMLButtonElement).disabled).toBe(true);
    expect(get('lp-count').textContent).toBe('Commands: 6 of 6');
  });

  it('runs to the goal instantly with reduced motion and reports finished once', () => {
    const { get, click, ctx, instance } = start(0, 'easy');
    click('cmd-forward', 'cmd-forward', 'cmd-forward', 'cmd-forward', 'lp-run');
    expect(robotAt(get)).toBe('1,4,right');
    expect(get('lp-status').dataset.state).toBe('goal');
    expect(get('lp-status').textContent).toContain('The shortest possible program has 4 commands.');
    expect(ctx.results).toEqual([{ outcome: 'completed', stats: { runs: 1, length: 4, minimal: 4 } }]);
    expect(get('lp-runs').dataset.value).toBe('1');
    expect(get('lp-best').hidden).toBe(false);
    click('lp-run');
    expect(ctx.results).toHaveLength(1);
    expect((get('level-select') as HTMLSelectElement).options[0]?.textContent).toBe('Level 1 ✓ solved');
    // Restoring a solved game shows the result again without finishing again.
    const saved = instance.serialize();
    const other = start(5, 'easy');
    other.instance.restore(saved);
    expect(robotAt(other.get)).toBe('1,4,right');
    expect(other.get('lp-status').dataset.state).toBe('goal');
    expect(other.ctx.results).toEqual([]);
  });

  it('explains a crash and returns to the start after an edit', () => {
    const { get, click } = start(0, 'easy');
    click('cmd-left', 'cmd-forward', 'cmd-forward', 'lp-run');
    expect(get('lp-status').dataset.state).toBe('crash');
    expect(get('lp-status').textContent).toBe('Crash: the robot hit a wall at step 3. Change the program and try again.');
    expect(get('lp-robot').dataset.crashed).toBe('true');
    expect(robotAt(get)).toBe('0,0,up');
    click('cmd-right');
    expect(get('lp-status').dataset.state).toBe('idle');
    expect(robotAt(get)).toBe('1,0,right');
  });

  it('reports a program that ends early and missing stars', () => {
    // Easy level 5: ['*..', '...', '^.G'] — go straight right to the goal, skipping the star.
    const { get, click } = start(4, 'easy');
    click('cmd-right', 'cmd-forward', 'cmd-forward', 'lp-run');
    expect(get('lp-status').dataset.state).toBe('ended');
    expect(get('lp-status').textContent).toBe('The program ended before the robot reached the goal. Stars still missing: 1.');
  });

  it('builds repeat blocks: fill, count, close, remove', () => {
    // Medium level 1: ['.......', '>.....G', '.......'], limit 5.
    const { get, click, root, ctx } = start(0, 'medium');
    click('cmd-repeat', 'cmd-forward', 'cmd-forward');
    expect(get('prog-0').getAttribute('aria-label')).toBe('Remove: Repeat 2×');
    expect(get('prog-0-1').textContent).toContain('Forward');
    expect(root.querySelector('.lp-block')?.getAttribute('data-open')).toBe('true');
    click('prog-0-times');
    expect(get('prog-0-times').textContent).toBe('×3');
    click('cmd-end');
    expect(root.querySelector('.lp-block')?.getAttribute('data-open')).toBe('false');
    click('lp-run');
    expect(get('lp-status').dataset.state).toBe('goal');
    expect(ctx.results[0]?.stats).toEqual({ runs: 1, length: 3, minimal: 3 });
    click('prog-0-0');
    expect(root.querySelector('[data-testid="prog-0-1"]')).toBeNull();
    click('prog-0');
    expect(root.querySelector('[data-testid="prog-0"]')).toBeNull();
  });

  it('supports keyboard editing', () => {
    const { get, root } = start(0, 'easy');
    const container = root.firstElementChild as HTMLElement;
    const key = (k: string, extra: KeyboardEventInit = {}) => container.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, ...extra }));
    key('ArrowUp');
    key('ArrowLeft');
    key('ArrowRight');
    expect(get('lp-count').dataset.value).toBe('3');
    key('Backspace');
    expect(get('lp-count').dataset.value).toBe('2');
    key('z', { ctrlKey: true });
    expect(get('lp-count').dataset.value).toBe('3');
    key('x');
    expect(get('lp-count').dataset.value).toBe('3');
  });

  it('switches levels without losing drafts', () => {
    const { get, click, root } = start(0, 'easy');
    click('cmd-forward');
    const select = get('level-select') as HTMLSelectElement;
    select.value = '2';
    select.dispatchEvent(new Event('change'));
    expect(get('lp-level').textContent).toBe('Level 3 of 8');
    expect(root.querySelector('[data-testid="prog-0"]')).toBeNull();
    select.value = '0';
    select.dispatchEvent(new Event('change'));
    expect(get('prog-0').textContent).toContain('Forward');
  });

  it('animates a run step by step and can be interrupted by an edit', () => {
    vi.useFakeTimers();
    const { get, click, ctx } = start(0, 'easy', { reducedMotion: false });
    click('cmd-forward', 'cmd-forward', 'cmd-forward', 'cmd-forward', 'lp-run');
    // The logical result is committed at once; the animation is only presentation.
    expect(ctx.results).toHaveLength(1);
    expect(get('lp-status').dataset.state).toBe('running');
    expect(robotAt(get)).toBe('1,0,right');
    vi.advanceTimersByTime(300);
    expect(robotAt(get)).toBe('1,1,right');
    expect(get('prog-0').classList.contains('lp-active')).toBe(true);
    vi.advanceTimersByTime(3000);
    expect(robotAt(get)).toBe('1,4,right');
    expect(get('lp-status').dataset.state).toBe('goal');
    click('lp-run');
    vi.advanceTimersByTime(300);
    click('prog-3');
    expect(get('lp-status').dataset.state).toBe('idle');
    expect(robotAt(get)).toBe('1,0,right');
    vi.advanceTimersByTime(3000);
    expect(robotAt(get)).toBe('1,0,right');
  });

  it('pausing during an animation jumps to the result and blocks input', () => {
    vi.useFakeTimers();
    const { get, click, instance } = start(0, 'easy', { reducedMotion: false });
    click('cmd-forward', 'cmd-forward', 'lp-run');
    instance.pause();
    expect(get('lp-status').dataset.state).toBe('ended');
    click('cmd-forward');
    expect(get('lp-count').dataset.value).toBe('2');
    instance.resume();
    click('cmd-forward');
    expect(get('lp-count').dataset.value).toBe('3');
  });

  it('renders right-to-left with a left-to-right board', () => {
    const { root, get } = start(0, 'easy', { locale: 'ar' });
    expect((root.firstElementChild as HTMLElement).getAttribute('dir')).toBe('rtl');
    expect(get('lp-board').getAttribute('dir')).toBe('ltr');
  });
});
