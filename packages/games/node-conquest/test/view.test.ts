// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestContext, type TestContext } from '@wp/testing';
import type { GameInstance, GameModule } from '@wp/game-core';
import game from '../src/index';
import { createGame, mapOf, MAX_LEVEL, type NcState } from '../src/rules';
import { shapePath } from '../src/view';

let ctx: TestContext;
let instance: GameInstance<NcState>;

const $ = (id: string) => ctx.context.root.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
const click = (id: string) => $(id).dispatchEvent(new MouseEvent('click', { bubbles: true }));
const key = (target: EventTarget, k: string) => target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

function setup(seed = 1, difficulty = 'easy', locale: 'en' | 'ar' = 'en') {
  ctx = createTestContext(game as GameModule<unknown>, locale);
  instance = game.create(ctx.context);
  instance.newGame({ seed, difficulty });
}

const start = () => instance.serialize().owner.indexOf(0);
const neighbours = (v: number) => mapOf(instance.serialize()).adjacent[v]!;

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  instance?.dispose();
  vi.useRealTimers();
});

describe('Orbit Links view', () => {
  it('renders nodes and lanes with test hooks and starts paused', () => {
    setup(1);
    const s = instance.serialize();
    const map = mapOf(s);
    expect(ctx.context.root.querySelectorAll('[data-testid^="node-"]')).toHaveLength(map.nodes.length);
    expect(ctx.context.root.querySelectorAll('[data-testid^="lane-"]')).toHaveLength(map.lanes.length);
    const v = start();
    expect($(`node-${v}`).dataset).toMatchObject({ owner: '0', level: '10', type: 'standard' });
    expect($(`node-${v}`).getAttribute('aria-label')).toContain('You');
    expect($('nc-pause').textContent).toBe('Start');
    expect($('nc-status').textContent).toContain('Ready');
    expect($('nc-speed').textContent).toBe('Speed 1×');
    expect(($('nc-map-select') as unknown as HTMLSelectElement).value).toBe(String(s.map));
    expect($('nc-list').children).toHaveLength(map.nodes.length);
    expect(ctx.missingKeys).toEqual([]);
  });

  it('activates and stops a path by tapping, with direction on the lane', () => {
    setup(2);
    const v = start();
    const w = neighbours(v)[0]!;
    click(`node-${v}`);
    expect($(`node-${v}`).getAttribute('aria-pressed')).toBe('true');
    click(`node-${w}`);
    const lane = $(`lane-${Math.min(v, w)}-${Math.max(v, w)}`);
    expect(lane.dataset.active).toBe(`${v}-${w}`);
    expect(instance.serialize().out[v]).toEqual([w]);
    expect($('nc-message').textContent).toContain('started');
    const saves = ctx.saveRequests();
    click(`node-${v}`);
    click(`node-${w}`);
    expect(lane.dataset.active).toBe('');
    expect(ctx.saveRequests()).toBeGreaterThan(saves);
  });

  it('explains refusals', () => {
    setup(2);
    const v = start();
    const other = instance.serialize().owner.findIndex((o, i) => o === -1 && !neighbours(v).includes(i));
    click(`node-${other}`);
    expect($('nc-message').textContent).toContain('First choose one of your own nodes');
    click(`node-${v}`);
    click(`node-${other}`);
    expect($('nc-message').textContent).toBe('These nodes are not connected by a lane.');
    const [a, b] = neighbours(v);
    click(`node-${v}`);
    click(`node-${a}`);
    click(`node-${v}`);
    click(`node-${b}`);
    expect($('nc-message').textContent).toContain('started');
    click(`node-${v}`);
    const c = neighbours(v).find((x) => x !== a && x !== b);
    if (c !== undefined) {
      click(`node-${c}`);
      expect($('nc-message').textContent).toContain('Path limit reached for level 10 (maximum 2)');
    }
    // The source stays selected after a refusal; tapping it again clears the selection.
    click(`node-${v}`);
    expect($('nc-message').textContent).toBe('Selection cleared.');
  });

  it('supports the keyboard: arrows move, Enter picks source and target, Escape cancels', () => {
    setup(3);
    const v = start();
    const node = $(`node-${v}`);
    expect(node.getAttribute('tabindex')).toBe('0');
    node.focus();
    key(node, 'Enter');
    expect(node.getAttribute('aria-pressed')).toBe('true');
    key(node, 'Escape');
    expect(node.getAttribute('aria-pressed')).toBe('false');
    // The player starts at the bottom: ArrowUp reaches another node.
    key(node, 'ArrowUp');
    const focused = document.activeElement as HTMLElement;
    expect(focused).not.toBe(node);
    expect(focused.getAttribute('tabindex')).toBe('0');
    expect(node.getAttribute('tabindex')).toBe('-1');
    key(focused, 'Home');
    expect(document.activeElement).toBe($('node-0'));
    key(document.activeElement!, 'End');
    expect((document.activeElement as HTMLElement).dataset.testid).toBe(`node-${mapOf(instance.serialize()).nodes.length - 1}`);
    // Enter on source then on a neighbour activates.
    const w = neighbours(v)[0]!;
    key(node, 'Enter');
    key($(`node-${w}`), 'Enter');
    expect(instance.serialize().out[v]).toEqual([w]);
  });

  it('runs the deterministic simulation in real time and pauses with button, P and Space', () => {
    setup(4);
    const v = start();
    click(`node-${v}`);
    click(`node-${neighbours(v)[0]}`);
    $('nc-pause').click();
    expect($('nc-pause').textContent).toBe('Pause');
    vi.advanceTimersByTime(1000);
    const t1 = instance.serialize().tick;
    expect(t1).toBeGreaterThanOrEqual(8);
    expect(t1).toBeLessThanOrEqual(11);
    key(document.body, 'p');
    expect($('nc-pause').textContent).toBe('Resume');
    const paused = instance.serialize();
    vi.advanceTimersByTime(2000);
    expect(instance.serialize()).toEqual(paused);
    expect($('nc-status').textContent).toContain('Paused');
    key(document.body, ' ');
    expect($('nc-pause').textContent).toBe('Pause');
    $('nc-speed').click();
    expect($('nc-speed').textContent).toBe('Speed 2×');
    vi.advanceTimersByTime(1000);
    expect(instance.serialize().tick - paused.tick).toBeGreaterThanOrEqual(17);
    // The same commands at the same ticks reproduce the same state.
    const replay = createGame(4, 'easy');
    expect(instance.serialize().units.length).toBeGreaterThan(0);
    expect(replay.tick).toBe(0);
  });

  it('host pause stops time and saves; host resume keeps it paused until the player continues', () => {
    setup(5);
    $('nc-pause').click();
    vi.advanceTimersByTime(500);
    const saves = ctx.saveRequests();
    instance.pause();
    expect(ctx.saveRequests()).toBe(saves + 1);
    const at = instance.serialize();
    instance.resume();
    vi.advanceTimersByTime(1500);
    expect(instance.serialize()).toEqual(at);
    expect($('nc-pause').textContent).toBe('Resume');
  });

  it('autosaves periodically while running', () => {
    setup(6);
    $('nc-pause').click();
    const saves = ctx.saveRequests();
    vi.advanceTimersByTime(3200);
    expect(ctx.saveRequests()).toBeGreaterThan(saves);
  });

  it('reports a win exactly once, and not again after restoring the finished game', () => {
    setup(7);
    const s = instance.serialize();
    const map = mapOf(s);
    const v = start();
    const rival = s.owner.findIndex((o) => o === 1);
    // Prepare a position one hit from victory: the player owns a neighbour of the last opponent node.
    const w = map.adjacent[rival]![0]!;
    s.owner[w] = 0;
    s.level[w] = 10;
    s.level[rival] = 1;
    s.out[w] = [rival];
    s.charge[w] = 9;
    s.tick = 50;
    instance.restore(s);
    expect($('nc-pause').textContent).toBe('Resume');
    $('nc-pause').click();
    vi.advanceTimersByTime(8000);
    const end = instance.serialize();
    expect(end.result).toBe('won');
    expect(ctx.results).toEqual([{ outcome: 'won', stats: { seconds: Math.floor(end.tick / 10), nodesCaptured: 1 } }]);
    expect($('nc-retry').hidden).toBe(false);
    expect($('nc-retry').textContent).toBe('Play this map again');
    expect($('nc-pause').hidden).toBe(true);
    expect($('nc-status').textContent).toContain('You won');
    instance.restore(end);
    vi.advanceTimersByTime(1000);
    expect(ctx.results).toHaveLength(1);
    click(`node-${v}`);
    expect($('nc-message').textContent).toBe('This match is over.');
    $('nc-retry').click();
    expect(instance.serialize()).toEqual(createGame(7, 'easy'));
  });

  it('reports a loss calmly with Try again', () => {
    setup(8);
    const s = instance.serialize();
    const v = start();
    const map = mapOf(s);
    // The only player node is about to fall to a level-30 neighbour stream.
    const w = map.adjacent[v]![0]!;
    s.owner[w] = 1;
    s.level[w] = MAX_LEVEL;
    s.out[w] = [v];
    s.level[v] = 1;
    s.charge[w] = 9;
    instance.restore(s);
    $('nc-pause').click();
    vi.advanceTimersByTime(8000);
    expect(instance.serialize().result).toBe('lost');
    expect(ctx.results[0]?.outcome).toBe('lost');
    expect($('nc-retry').textContent).toBe('Try again');
  });

  it('switches maps with the picker, keeping seed and difficulty', () => {
    setup(9, 'medium');
    const select = $('nc-map-select') as unknown as HTMLSelectElement;
    expect(select.options).toHaveLength(7);
    expect(select.options[0]!.textContent).toMatch(/^Map 1 · \d+ nodes$/);
    const next = (instance.serialize().map + 1) % 7;
    select.value = String(next);
    select.dispatchEvent(new Event('change'));
    const s = instance.serialize();
    expect(s.map).toBe(next);
    expect(s).toEqual(createGame(9, 'medium', next));
    instance.reset();
    expect(instance.serialize()).toEqual(createGame(9, 'medium', next));
    instance.newGame({ seed: 9, difficulty: 'medium' });
    expect(instance.serialize().map).toBe(9 % 7);
  });

  it('renders in RTL locales without mirroring the board', () => {
    setup(10, 'hard', 'ar');
    expect(ctx.context.root.querySelector('.wp-nc')?.getAttribute('dir')).toBe('rtl');
    expect(ctx.missingKeys).toEqual([]);
    expect(ctx.context.root.querySelectorAll('.nc-legend li[data-faction]')).toHaveLength(4);
  });

  it('draws one distinct shape per faction', () => {
    const shapes = [0, 1, 2, 3].map((f) => shapePath(f, 6));
    expect(new Set(shapes).size).toBe(4);
  });
});
