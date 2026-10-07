// @ts-nocheck
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestContext } from '@wp/testing';
import type { GameModule } from '@wp/game-core';
import game from '../src/index';
import { previewPath } from '../src/view';
import {
  TASKS_PER_SESSION,
  articulationPoints,
  createInitialState,
  nodeLabel,
  pointSegmentDistance,
  separatingBridges,
  solutionOf,
  type GdState,
  type Task,
  type TaskType
} from '../src/rules';

const module = game as GameModule<unknown>;

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

/** A state whose current task is the first task of `type` in a generated session. */
function stateFirst(type: TaskType, seed = 5, difficulty = 'medium'): GdState {
  const state = createInitialState(seed, difficulty as GdState['difficulty']);
  const i = state.tasks.findIndex((t) => t.type === type);
  const order = [i, ...state.tasks.map((_, j) => j).filter((j) => j !== i)];
  return { ...state, tasks: order.map((j) => state.tasks[j]!), progress: order.map((j) => state.progress[j]!) };
}

function mount(state?: GdState, locale: 'en' | 'ar' | 'de' = 'en') {
  const ctx = createTestContext(module, locale);
  const instance = game.create(ctx.context);
  if (state) instance.restore(state);
  else instance.newGame({ seed: 5, difficulty: 'medium' });
  const root = ctx.context.root;
  const q = <T extends Element = HTMLElement>(id: string) => root.querySelector<T & HTMLElement>(`[data-testid="${id}"]`)!;
  const click = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
  return { ctx, instance, root, q, click, key };
}

const edgeId = (task: Task, e: number) => `edge-${nodeLabel(task.edges[e]![0])}-${nodeLabel(task.edges[e]![1])}`;

describe('view', () => {
  it('draws every point and connection with test ids, labels and the task text', () => {
    const state = stateFirst('path');
    const task = state.tasks[0]!;
    const { q, root } = mount(state);
    expect(root.querySelectorAll('[data-testid^="node-"]')).toHaveLength(task.n);
    expect(root.querySelectorAll('[data-testid^="edge-"]')).toHaveLength(task.edges.length);
    expect(q('gd-task').dataset.type).toBe('path');
    expect(q('gd-task').textContent).toBe(
      `Find the shortest route from ${nodeLabel(task.from)} to ${nodeLabel(task.to)}. The numbers are the lengths of the connections.`
    );
    expect(q('gd-progress').textContent).toBe(`Task 1 of ${TASKS_PER_SESSION}`);
    const first = q(edgeId(task, 0));
    expect(first.getAttribute('role')).toBe('button');
    expect(first.getAttribute('aria-label')).toBe(`Connection ${nodeLabel(task.edges[0]![0])}–${nodeLabel(task.edges[0]![1])}, length ${task.edges[0]![2]}`);
    expect(first.dataset.selected).toBe('false');
    expect(first.querySelector('.gd-weight')?.textContent).toBe(String(task.edges[0]![2]));
    // Endpoints are squares, other points circles.
    expect(q(`node-${nodeLabel(task.from)}`).querySelector('rect.gd-shape')).not.toBeNull();
    const other = Array.from({ length: task.n }, (_, v) => v).find((v) => v !== task.from && v !== task.to)!;
    expect(q(`node-${nodeLabel(other)}`).querySelector('circle.gd-shape')).not.toBeNull();
    // Points are not interactive in a route task; only connections take part in the tab order.
    expect(q(`node-${nodeLabel(other)}`).getAttribute('role')).toBeNull();
    expect(root.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    // The text alternative lists every connection with its length.
    const items = [...q('gd-list').querySelectorAll('li')].map((li) => li.textContent);
    expect(items).toHaveLength(task.edges.length);
    expect(items[0]).toBe(`${nodeLabel(task.edges[0]![0])}–${nodeLabel(task.edges[0]![1])}, length ${task.edges[0]![2]}`);
    expect(q('gd-choices').hidden).toBe(true);
  });

  it('marks a wrong route, then accepts the shortest one and offers the next task', () => {
    const state = stateFirst('path');
    const task = state.tasks[0]!;
    const { q, click, ctx, instance } = mount(state);
    const solution = solutionOf(task)!.edges;
    const extra = task.edges.findIndex((_, e) => !solution.includes(e));
    click(q(edgeId(task, extra)));
    expect(q(edgeId(task, extra)).dataset.selected).toBe('true');
    expect(q(edgeId(task, extra)).getAttribute('aria-pressed')).toBe('true');
    expect(q(edgeId(task, extra)).getAttribute('aria-label')).toMatch(/selected$/);
    expect(ctx.saveRequests()).toBe(1);
    click(q('gd-submit'));
    expect(q('gd-status').dataset.state).toBe('wrong');
    expect(q('gd-status').textContent).not.toBe('');
    click(q(edgeId(task, extra)));
    expect(q('gd-status').dataset.state).toBe('open');
    for (const e of solution) click(q(edgeId(task, e)));
    expect(q('gd-next').hidden).toBe(true);
    click(q('gd-submit'));
    expect(q('gd-status').dataset.state).toBe('correct');
    expect(q('gd-status').textContent).toMatch(/^Correct\. The marked route has length \d+; no route is shorter\.$/);
    expect(q('gd-submit').hidden).toBe(true);
    expect(q('gd-solution').hidden).toBe(true);
    expect(q('gd-next').hidden).toBe(false);
    // Answered tasks are locked.
    click(q(edgeId(task, extra)));
    expect(q(edgeId(task, extra)).dataset.selected).toBe('false');
    click(q('gd-next'));
    expect(q('gd-progress').textContent).toBe(`Task 2 of ${TASKS_PER_SESSION}`);
    expect(game.isValidState(JSON.parse(JSON.stringify(instance.serialize())))).toBe(true);
  });

  it('bridge task: wrong answers show a dotted detour, a separating bridge is accepted', () => {
    const state = stateFirst('bridge');
    const task = state.tasks[0]!;
    const { q, click, instance } = mount(state);
    const good = separatingBridges(task.n, task.edges, task.from, task.to);
    const bad = task.edges.findIndex((_, e) => !good.includes(e));
    click(q(edgeId(task, bad)));
    click(q('gd-submit'));
    expect(q('gd-status').textContent).toContain('still linked');
    const hinted = [...document.querySelectorAll('.gd-edge.is-hint')];
    expect(hinted.length).toBeGreaterThan(0);
    expect(hinted).not.toContain(q(edgeId(task, bad)));
    click(q(edgeId(task, good[good.length - 1]!)));
    expect(document.querySelectorAll('.gd-edge.is-hint')).toHaveLength(0);
    expect(document.querySelectorAll('.gd-edge[data-selected="true"]')).toHaveLength(1);
    click(q('gd-submit'));
    expect(q('gd-status').dataset.state).toBe('correct');
    expect(instance.serialize().progress[0]).toMatchObject({ status: 'solved', attempts: 2 });
  });

  it('augment task: two points, a curved dashed preview and a note for existing connections', () => {
    const state = stateFirst('augment');
    const task = state.tasks[0]!;
    const { q, click } = mount(state);
    const [a, b] = task.edges[0]!;
    click(q(`node-${nodeLabel(a)}`));
    click(q(`node-${nodeLabel(b)}`));
    expect(q(`node-${nodeLabel(a)}`).dataset.selected).toBe('true');
    expect(document.querySelector('.gd-preview')?.getAttribute('visibility')).toBe('visible');
    expect(q('gd-status').dataset.state).toBe('note');
    expect(q('gd-submit').disabled).toBe(true);
    click(q('gd-clear'));
    expect(document.querySelector('.gd-preview')?.getAttribute('visibility')).toBe('hidden');
    const [u, v] = solutionOf(task)!.nodes;
    click(q(`node-${nodeLabel(u!)}`));
    click(q(`node-${nodeLabel(v!)}`));
    expect(document.querySelector('.gd-preview')?.getAttribute('d')).toBe(previewPath(task, u!, v!));
    click(q('gd-submit'));
    expect(q('gd-status').textContent).toContain(`${nodeLabel(u!)}–${nodeLabel(v!)}`);
  });

  it('cutvertex task: a wrong point is shown as removed', () => {
    const state = stateFirst('cutvertex');
    const task = state.tasks[0]!;
    const { q, click } = mount(state);
    const aps = articulationPoints(task.n, task.edges);
    const wrong = Array.from({ length: task.n }, (_, v) => v).find((v) => !aps.includes(v))!;
    click(q(`node-${nodeLabel(wrong)}`));
    click(q('gd-submit'));
    expect(q(`node-${nodeLabel(wrong)}`).classList.contains('is-removed')).toBe(true);
    expect(document.querySelectorAll('.gd-edge.is-faded').length).toBeGreaterThan(0);
    expect(q('gd-status').textContent).toBe(`Not quite: without ${nodeLabel(wrong)}, all other points are still linked.`);
  });

  it('mincut task: number buttons, a "too few" hint and the cut after a right answer', () => {
    const state = stateFirst('mincut');
    const task = state.tasks[0]!;
    const { q, click, root } = mount(state);
    expect(q('gd-choices').hidden).toBe(false);
    expect(root.querySelector('.gd-diagram [role="button"]')).toBeNull();
    expect(q('gd-submit').disabled).toBe(true);
    click(q('gd-choice-1'));
    expect(q('gd-choice-1').getAttribute('aria-pressed')).toBe('true');
    click(q('gd-submit'));
    expect(q('gd-status').textContent).toMatch(/^Not enough: the 2 dotted routes/);
    expect(document.querySelectorAll('.gd-edge.is-hint').length).toBeGreaterThan(1);
    const answer = solutionOf(task)!.value;
    click(q(`gd-choice-${answer}`));
    expect(q('gd-choice-1').getAttribute('aria-pressed')).toBe('false');
    click(q('gd-submit'));
    expect(q('gd-status').dataset.state).toBe('correct');
    expect(document.querySelectorAll('.gd-edge[data-selected="true"]')).toHaveLength(answer);
    expect(q(`gd-choice-${answer}`).disabled).toBe(true);
  });

  it('keyboard: arrows move between items (reversed in RTL), Enter and Space select', () => {
    for (const locale of ['en', 'ar'] as const) {
      const state = stateFirst('cutvertex');
      const { q, key } = mount(state, locale);
      const a = q('node-A');
      const b = q('node-B');
      const last = q(`node-${nodeLabel(state.tasks[0]!.n - 1)}`);
      a.focus();
      key(a, locale === 'en' ? 'ArrowRight' : 'ArrowLeft');
      expect(document.activeElement).toBe(b);
      expect(b.getAttribute('tabindex')).toBe('0');
      expect(a.getAttribute('tabindex')).toBe('-1');
      key(b, 'ArrowUp');
      expect(document.activeElement).toBe(a);
      key(a, 'ArrowUp');
      expect(document.activeElement, 'wraps around').toBe(last);
      key(last, 'Home');
      expect(document.activeElement).toBe(a);
      key(a, 'End');
      expect(document.activeElement).toBe(last);
      key(last, 'ArrowDown');
      expect(document.activeElement).toBe(a);
      key(a, 'Enter');
      expect(a.dataset.selected).toBe('true');
      key(a, ' ');
      expect(a.dataset.selected).toBe('false');
      key(a, 'x');
      expect(document.activeElement).toBe(a);
      document.body.innerHTML = '';
    }
  });

  it('shows solutions, finishes once after the sixth task and summarises', () => {
    const { q, click, ctx, instance } = mount();
    for (let i = 0; i < TASKS_PER_SESSION; i++) {
      expect(q('gd-summary').hidden).toBe(true);
      click(q('gd-solution'));
      expect(q('gd-status').dataset.state).toBe('shown');
      expect(q('gd-status').textContent).toMatch(/^One solution: /);
      if (i < TASKS_PER_SESSION - 1) click(q('gd-next'));
    }
    expect(q('gd-next').hidden).toBe(true);
    expect(ctx.results).toEqual([{ outcome: 'completed', stats: { tasks: 6, attempts: 0, solutionsShown: 6 } }]);
    expect(q('gd-summary').hidden).toBe(false);
    expect(q('gd-summary').textContent).toBe('All 6 tasks done. Answers checked: 0. Solutions shown: 6.');
    // Restoring a finished session does not report it again.
    const saved = instance.serialize();
    const again = mount(saved);
    expect(again.ctx.results).toEqual([]);
    expect(again.q('gd-summary').hidden).toBe(false);
  });

  it('ignores input while paused and resets to the seeded start', () => {
    const state = stateFirst('bridge');
    const { q, click, instance, ctx } = mount(state);
    instance.pause();
    click(q(edgeId(state.tasks[0]!, 0)));
    click(q('gd-solution'));
    expect(instance.serialize()).toEqual(state);
    instance.resume();
    click(q(edgeId(state.tasks[0]!, 0)));
    expect(instance.serialize().progress[0]!.edges).toEqual([0]);
    instance.newGame({ seed: 77, difficulty: 'hard' });
    expect(instance.serialize()).toEqual(createInitialState(77, 'hard'));
    click(q('gd-solution'));
    const before = ctx.saveRequests();
    instance.reset();
    expect(instance.serialize()).toEqual(createInitialState(77, 'hard'));
    expect(ctx.saveRequests()).toBe(before + 1);
    instance.dispose();
    expect(ctx.context.root.childElementCount).toBe(0);
  });

  it('announces changes politely', () => {
    vi.useFakeTimers();
    const state = stateFirst('cutvertex');
    const { q, click } = mount(state);
    click(q('node-A'));
    vi.runAllTimers();
    expect(q('gd-announcer').textContent).toBe('Point A selected.');
    click(q('node-A'));
    vi.runAllTimers();
    expect(q('gd-announcer').textContent).toBe('Point A no longer selected.');
    click(q('gd-clear'));
    vi.runAllTimers();
    expect(q('gd-announcer').textContent).toBe('Point A no longer selected.');
  });

  it('uses the active language and direction', () => {
    const { root, q } = mount(stateFirst('mincut'), 'ar');
    const container = root.firstElementChild as HTMLElement;
    expect(container.getAttribute('dir')).toBe('rtl');
    expect(container.getAttribute('lang')).toBe('ar');
    expect(q('gd-submit').textContent).not.toBe('Check');
    expect(q('gd-diagram').getAttribute('aria-label')).toMatch(/\d/);
  });
});

describe('previewPath', () => {
  it('bends a proposed connection around other points', () => {
    const state = createInitialState(9, 'hard');
    for (const task of state.tasks) {
      for (let u = 0; u < task.n; u++) {
        for (let v = u + 1; v < task.n; v++) {
          const d = previewPath(task, u, v);
          const match = /^M(\d+) (\d+) Q(-?\d+) (-?\d+) (\d+) (\d+)$/.exec(d);
          expect(match).not.toBeNull();
          const [x1, y1, cx, cy, x2, y2] = match!.slice(1).map(Number) as [number, number, number, number, number, number];
          expect([x1, y1]).toEqual(task.pos[u]);
          expect([x2, y2]).toEqual(task.pos[v]);
          // The control point lies on the perpendicular bisector, 30–120 units away.
          const bend = pointSegmentDistance([cx, cy], [x1, y1], [x2, y2]);
          expect(bend).toBeGreaterThan(28);
          expect(bend).toBeLessThan(122);
        }
      }
    }
  });
});
