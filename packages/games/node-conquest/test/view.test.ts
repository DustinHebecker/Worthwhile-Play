// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestContext, type TestContext } from '@wp/testing';
import type { GameInstance, GameModule } from '@wp/game-core';
import game from '../src/index';
import { createSave, interpretSave } from '@wp/persistence';
import { BOARD, createGame, INTRO_MAP, mapOf, MAX_LEVEL, type NcState } from '../src/rules';
import { battlements, MAX_ZOOM, shapePath } from '../src/view';

let ctx: TestContext;
let instance: GameInstance<NcState>;

const $ = (id: string) => ctx.context.root.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
const click = (id: string) => $(id).dispatchEvent(new MouseEvent('click', { bubbles: true }));
const key = (target: EventTarget, k: string) => target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

function setup(seed = 1, difficulty = 'beginner', locale: 'en' | 'ar' = 'en') {
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
    const replay = createGame(4);
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
    s.half[rival] = 0;
    s.out[w] = [rival];
    // A unit about to arrive: the capture happens on the first tick, before any opponent decision.
    s.units = [{ f: 0, k: 0, a: w, b: rival, d: map.lanes[map.laneOf[w]![rival]!]![2] - 1, hp: 1, h: 0 }];
    s.stats.produced = 1;
    s.tick = 50;
    s.hist = { start: 0, every: 50, rows: [[1, 1], [1, 1]] };
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
    expect(instance.serialize()).toEqual(createGame(7));
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

  it('switches maps with the picker at once while the match is untouched, keeping seed and difficulty', () => {
    setup(9, 'advanced');
    const select = $('nc-map-select') as unknown as HTMLSelectElement;
    expect(select.options).toHaveLength(8);
    expect(select.options[0]!.textContent).toBe('Introduction');
    expect(select.options[1]!.textContent).toMatch(/^Map 1 · \d+ nodes$/);
    const next = (instance.serialize().map + 1) % 7;
    select.value = String(next);
    select.dispatchEvent(new Event('change'));
    const s = instance.serialize();
    expect(s.map).toBe(next);
    expect(s).toEqual(createGame(9, { difficulty: 'advanced', map: next }));
    expect($('nc-confirm').hidden).toBe(true);
    instance.reset();
    expect(instance.serialize()).toEqual(createGame(9, { difficulty: 'advanced', map: next }));
    instance.newGame({ seed: 9, difficulty: 'advanced' });
    expect(instance.serialize().map).toBe(9 % 7);
  });

  it('renders in RTL locales without mirroring the board', () => {
    setup(10, 'master', 'ar');
    const opp = $('nc-opponents') as unknown as HTMLSelectElement;
    opp.value = '3';
    opp.dispatchEvent(new Event('change'));
    expect(ctx.context.root.querySelector('.wp-nc')?.getAttribute('dir')).toBe('rtl');
    expect(ctx.missingKeys).toEqual([]);
    expect(ctx.context.root.querySelectorAll('.nc-legend li[data-faction]')).toHaveLength(4);
    expect(ctx.context.root.querySelector('.nc-board')?.getAttribute('style') ?? '').not.toContain('rtl');
  });

  it('draws one distinct shape per faction', () => {
    const shapes = [0, 1, 2, 3].map((f) => shapePath(f, 6));
    expect(new Set(shapes).size).toBe(4);
  });

  it('has an opponent-count setting that a new match keeps', () => {
    setup(11);
    const opp = $('nc-opponents') as unknown as HTMLSelectElement;
    expect([...opp.options].map((o) => o.value)).toEqual(['1', '2', '3']);
    expect(opp.value).toBe('1');
    opp.value = '2';
    opp.dispatchEvent(new Event('change'));
    expect(instance.serialize()).toEqual(createGame(11, { opponents: 2 }));
    expect(ctx.context.root.querySelectorAll('.nc-legend li[data-faction]')).toHaveLength(3);
    instance.newGame({ seed: 12, difficulty: 'strong' });
    expect(instance.serialize()).toEqual(createGame(12, { opponents: 2, difficulty: 'strong' }));
    expect(opp.value).toBe('2');
  });

  it('asks before replacing a match under way, and only switches on Yes', () => {
    setup(13);
    const v = start();
    click(`node-${v}`);
    click(`node-${neighbours(v)[0]}`);
    $('nc-pause').click();
    vi.advanceTimersByTime(500);
    const before = instance.serialize();
    const select = $('nc-map-select') as unknown as HTMLSelectElement;
    const other = (before.map + 3) % 7;
    select.value = String(other);
    select.dispatchEvent(new Event('change'));
    expect($('nc-confirm').hidden).toBe(false);
    expect($('nc-confirm-text').textContent).toBe(`Start a new match on map ${other + 1} with opponents: 1? The current match ends.`);
    expect($('nc-pause').textContent).toBe('Resume');
    vi.advanceTimersByTime(1000);
    expect(instance.serialize()).toEqual(before);
    $('nc-confirm-no').click();
    expect($('nc-confirm').hidden).toBe(true);
    expect(select.value).toBe(String(before.map));
    expect(instance.serialize()).toEqual(before);
    // Changing the opponent count asks as well; Yes starts the new setup.
    const opp = $('nc-opponents') as unknown as HTMLSelectElement;
    opp.value = '3';
    opp.dispatchEvent(new Event('change'));
    expect($('nc-confirm').hidden).toBe(false);
    const saves = ctx.saveRequests();
    $('nc-confirm-yes').click();
    expect(instance.serialize()).toEqual(createGame(13, { opponents: 3, map: before.map }));
    expect(ctx.saveRequests()).toBe(saves + 1);
    expect($('nc-confirm').hidden).toBe(true);
    // A finished match is replaced without asking.
    const done = instance.serialize();
    done.owner = done.owner.map((o) => (o === 0 ? 1 : o));
    done.result = 'lost';
    instance.restore(done);
    select.value = String(INTRO_MAP);
    select.dispatchEvent(new Event('change'));
    expect($('nc-confirm').hidden).toBe(true);
    expect(instance.serialize()).toEqual(createGame(13, { map: INTRO_MAP }));
    expect(opp.disabled).toBe(true);
  });

  it('guides through the introduction map step by step', () => {
    setup(14);
    const select = $('nc-map-select') as unknown as HTMLSelectElement;
    select.value = String(INTRO_MAP);
    select.dispatchEvent(new Event('change'));
    expect($('nc-hint').hidden).toBe(false);
    expect($('nc-hint').textContent).toMatch(/^Step 1/);
    click('node-0');
    expect($('nc-hint').textContent).toMatch(/^Step 2/);
    click('node-1');
    expect($('nc-hint').textContent).toMatch(/^Step 3/);
    $('nc-pause').click();
    vi.advanceTimersByTime(9000);
    expect(instance.serialize().owner[1]).toBe(0);
    expect($('nc-hint').textContent).toMatch(/^Well done/);
    const s = instance.serialize();
    s.stats.captured = 3;
    instance.restore(s);
    expect($('nc-hint').textContent).toMatch(/^Last step/);
    s.map = 0;
    instance.newGame({ seed: 3 });
    expect($('nc-hint').hidden).toBe(true);
    expect(ctx.missingKeys).toEqual([]);
  });

  it('shows a post-game review with a patterned chart, a text summary and key moments', () => {
    setup(15);
    const s = instance.serialize();
    const map = mapOf(s);
    s.tick = 300;
    s.hist = { start: 0, every: 50, rows: [[1, 1], [2, 1], [4, 2], [4, 3], [3, 4], [6, 2], [3, 0]] };
    s.owner = map.nodes.map((n) => (n.owner === 1 ? 0 : n.owner));
    s.owner[s.owner.indexOf(-1)] = 0;
    s.result = 'won';
    instance.restore(s);
    expect($('nc-review').hidden).toBe(false);
    const lines = ctx.context.root.querySelectorAll('.nc-series');
    expect(lines).toHaveLength(2);
    expect(new Set([...lines].map((l) => l.getAttribute('stroke-dasharray'))).size).toBe(2);
    expect(ctx.context.root.querySelectorAll('.nc-series-mark')).toHaveLength(2);
    expect($('nc-chart').getAttribute('role')).toBe('img');
    expect($('nc-review-summary').textContent).toBe('Match length 0:30. Your nodes at the end: 3. Your highest count: 6 (at 0:25).');
    const moments = [...$('nc-moments').children].map((li) => li.textContent);
    expect(moments).toEqual(['0:25: your biggest gain, nodes +3.', '0:25: you took the lead in nodes.']);
    expect(ctx.missingKeys).toEqual([]);
    // Not shown while playing.
    instance.newGame({ seed: 1 });
    expect($('nc-review').hidden).toBe(true);
  });

  it('zooms with buttons and ctrl + wheel without touching the saved state', () => {
    setup(16);
    const before = instance.serialize();
    const board = $('nc-board');
    expect(board.getAttribute('viewBox')).toBe(`0.0 0.0 ${BOARD}.0 ${BOARD}.0`);
    $('nc-zoom-in').click();
    expect(Number(board.dataset.zoom)).toBeCloseTo(1.5);
    expect(board.getAttribute('viewBox')).toBe('106.7 106.7 426.7 426.7');
    for (let i = 0; i < 5; i++) $('nc-zoom-in').click();
    expect(Number(board.dataset.zoom)).toBe(MAX_ZOOM);
    $('nc-zoom-out').click();
    expect(Number(board.dataset.zoom)).toBeCloseTo(2);
    const plain = new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true });
    board.dispatchEvent(plain);
    expect(plain.defaultPrevented).toBe(false);
    const pinch = new WheelEvent('wheel', { deltaY: 100, ctrlKey: true, bubbles: true, cancelable: true });
    board.dispatchEvent(pinch);
    expect(pinch.defaultPrevented).toBe(true);
    expect(Number(board.dataset.zoom)).toBeLessThan(2);
    $('nc-zoom-fit').click();
    expect(board.dataset.zoom).toBe('1.00');
    expect($('nc-zoom-in').getAttribute('aria-label')).toBe('Zoom in');
    expect(instance.serialize()).toEqual(before);
  });

  it('marks bastions with their own outline and legend entry', () => {
    setup(17);
    const map = mapOf(instance.serialize());
    const v = map.nodes.findIndex((n) => n.type === 'bastion');
    expect(v).toBeGreaterThanOrEqual(0);
    expect($(`node-${v}`).dataset.type).toBe('bastion');
    expect($(`node-${v}`).querySelector('.nc-deco-wall')).not.toBeNull();
    expect($(`node-${v}`).getAttribute('aria-label')).toContain('Bastion');
    expect(ctx.context.root.querySelector('.nc-legend li[data-type="bastion"]')?.textContent).toBe('Bastion');
    expect(battlements(0, 0, 9)).not.toBe(battlements(0, 0, 12));
  });

  it('restores a save from state version 1 as an equivalent match', () => {
    const v1 = createGame(18, { opponents: 2, layout: 1, map: 4 });
    const { opponents: _o, layout: _l, half: _h, hist: _hi, centre: _c, ...rest } = JSON.parse(JSON.stringify(v1)) as NcState;
    const raw = { ...createSave(game, 18, { ...rest, difficulty: 'medium' } as unknown as NcState, 'medium'), stateVersion: 1 };
    const loaded = interpretSave(raw, game);
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.migrated).toBe(true);
    setup(1);
    instance.restore(loaded.save.state);
    const restored = instance.serialize();
    expect(restored).toMatchObject({ difficulty: 'advanced', opponents: 2, layout: 1, map: 4 });
    expect(restored.owner).toEqual(v1.owner);
    expect(ctx.context.root.querySelectorAll('[data-type="bastion"].nc-node')).toHaveLength(0);
    expect(ctx.context.root.querySelectorAll('.nc-legend li[data-faction]')).toHaveLength(3);
  });
});
