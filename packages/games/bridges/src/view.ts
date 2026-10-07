// @ts-nocheck
import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import {
  canUndo,
  check,
  createInitialState,
  cycleBridge,
  cycleOutcome,
  edgeBetween,
  edgesOf,
  isConnected,
  isSolved,
  islandDegrees,
  nearestIsland,
  neighbourIn,
  satisfiedCount,
  toDifficulty,
  undo,
  type BridgesState,
  type Direction,
  type Edge
} from './rules';
import './styles.css';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const ARROWS: Readonly<Record<string, Direction>> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
const MIRROR: Readonly<Record<Direction, Direction>> = { up: 'up', down: 'down', left: 'right', right: 'left' };

type IslandState = 'open' | 'done' | 'over';

export function createBridges(context: GameContext): GameInstance<BridgesState> {
  const { t } = context;
  const rtl = t.direction === 'rtl';
  /** Logical direction (columns grow to the right) ↔ what the player sees (mirrored in RTL). */
  const mirror = (dir: Direction): Direction => (rtl ? MIRROR[dir] : dir);

  let state = createInitialState(0);
  let edges: Edge[] = edgesOf(state.size, state.islands);
  let paused = false;
  let focusIndex = 0;
  /** Island chosen by a tap/Enter, waiting for a partner (view-only, never saved). */
  let selected: number | null = null;
  let dragFrom: number | null = null;
  /** A drag already acted; the click that may follow must be ignored. */
  let suppressClick = false;
  let islandEls: HTMLButtonElement[] = [];
  let bridgeEls: HTMLElement[] = [];

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'br-live' });
  const status = h('p', { class: 'wp-status br-status', 'data-testid': 'br-status' });
  const board = h('div', { class: 'br-board', role: 'group', 'data-testid': 'br-board' });
  const undoButton = h('button', { type: 'button', 'data-testid': 'br-undo', onclick: () => runUndo() }, t('common.undo'));
  const checkButton = h('button', { type: 'button', 'data-testid': 'br-check', 'aria-describedby': 'br-check-help', onclick: () => runCheck() }, t('common.check'));
  const checkResult = h('p', { class: 'br-check-result', 'data-testid': 'br-check-result' });
  const help = h('div', { class: 'br-help wp-muted' },
    h('p', {}, t('touch.help')),
    h('p', {}, t('keys.help')),
    h('p', { id: 'br-check-help' }, t('check.help'))
  );
  const controls = h('div', { class: 'br-controls' }, h('div', { class: 'wp-row br-actions' }, undoButton, checkButton), checkResult);
  const container = h('div', { class: 'wp-bridges', dir: t.direction, lang: t.locale },
    status, h('div', { class: 'br-wrap' }, board), controls, help, live);

  // --- Labels --------------------------------------------------------------------------------

  const place = (i: number) => {
    const island = state.islands[i];
    return { row: (island?.[0] ?? 0) + 1, col: (island?.[1] ?? 0) + 1 };
  };

  const islandState = (need: number, have: number): IslandState => (have === need ? 'done' : have > need ? 'over' : 'open');

  const islandLabel = (i: number, have: number) => {
    const need = state.islands[i]?.[2] ?? 0;
    const kind = islandState(need, have);
    const links: string[] = [];
    for (const dir of ['up', 'right', 'down', 'left'] as const) {
      const other = neighbourIn(state.size, state.islands, i, dir);
      const e = other < 0 ? -1 : edgeBetween(edges, i, other);
      const count = e < 0 ? 0 : (state.bridges[e] ?? 0);
      if (count > 0) links.push(t(`link.${mirror(dir)}`, { n: count }));
    }
    return t('island.label', {
      ...place(i),
      need,
      have,
      status: kind === 'open' ? t('island.open', { left: need - have }) : t(`island.${kind}`),
      links: links.length > 0 ? links.join(t('list.separator')) : t('link.none')
    });
  };

  const bridgeMessage = (e: number, s: BridgesState) => {
    const edge = edges[e] as Edge;
    const a = place(edge.a);
    const b = place(edge.b);
    return t('announce.bridge', { r1: a.row, c1: a.col, r2: b.row, c2: b.col, n: s.bridges[e] ?? 0 });
  };

  // --- State changes -------------------------------------------------------------------------

  const commit = (next: BridgesState, message?: string) => {
    if (next === state) return false;
    const wasSolved = isSolved(state);
    state = next;
    update();
    context.requestSave();
    if (!wasSolved && isSolved(state)) {
      announce(live, t('status.solved', { moves: state.moves }));
      context.finished({ outcome: 'completed', stats: { moves: state.moves, checks: state.checks } });
    } else if (message) {
      announce(live, message);
    }
    return true;
  };

  /** Cycles the bridges between two islands, explaining when that is impossible. */
  const build = (from: number, to: number) => {
    const e = from === to ? -1 : edgeBetween(edges, from, to);
    const outcome = cycleOutcome(state, e);
    if (outcome === 'noEdge') return announce(live, t('announce.notInLine'));
    if (outcome === 'blocked') return announce(live, t('announce.blocked'));
    if (outcome !== 'ok') return;
    const next = cycleBridge(state, e);
    commit(next, bridgeMessage(e, next));
  };

  const select = (i: number | null) => {
    selected = i;
    update();
    if (i !== null) announce(live, t('announce.selected', place(i)));
  };

  /** A tap, click or Enter on an island. */
  const tap = (i: number) => {
    if (paused || isSolved(state)) return;
    focusIndex = i;
    if (selected === null) return select(i);
    if (selected === i) {
      select(null);
      return announce(live, t('announce.deselected'));
    }
    const from = selected;
    if (edgeBetween(edges, from, i) < 0) return select(i);
    selected = null;
    update();
    build(from, i);
  };

  /** Shift+arrow or Enter-then-arrow: bridge from island `i` towards a (logical) direction. */
  const buildToward = (i: number, dir: Direction) => {
    selected = null;
    update();
    const other = neighbourIn(state.size, state.islands, i, dir);
    if (other < 0) return announce(live, t('announce.noNeighbour'));
    build(i, other);
  };

  const runUndo = () => {
    if (paused) return;
    selected = null;
    commit(undo(state), t('announce.undone'));
  };

  const runCheck = () => {
    if (paused) return;
    if (commit(check(state))) announce(live, checkResult.textContent ?? '');
  };

  // --- Rendering -----------------------------------------------------------------------------

  const setPos = (el: HTMLElement, name: string, value: number) => el.style.setProperty(name, String(value));

  /** Builds the board skeleton for the current puzzle. */
  const mountBoard = () => {
    clear(board);
    edges = edgesOf(state.size, state.islands);
    focusIndex = Math.min(focusIndex, state.islands.length - 1);
    board.style.setProperty('--br-n', String(state.size));
    board.dataset.size = String(state.size);
    board.setAttribute('aria-label', t('board.label', { size: state.size, count: state.islands.length }));
    bridgeEls = edges.map((edge) => {
      const [r1, c1] = state.islands[edge.a] as [number, number, number];
      const [r2, c2] = state.islands[edge.b] as [number, number, number];
      const el = h('div', {
        class: 'br-bridge',
        'aria-hidden': 'true',
        'data-testid': `bridge-${r1}-${c1}-${r2}-${c2}`,
        'data-orientation': edge.horizontal ? 'horizontal' : 'vertical'
      });
      setPos(el, '--r', r1);
      setPos(el, '--c', c1);
      setPos(el, '--len', edge.horizontal ? c2 - c1 : r2 - r1);
      board.appendChild(el);
      return el;
    });
    islandEls = state.islands.map(([r, c, need], i) => {
      const el = h('button', {
        type: 'button',
        class: 'br-island',
        'data-index': i,
        'data-testid': `island-${r}-${c}`,
        'data-need': need,
        tabindex: -1
      },
      h('span', { class: 'br-disc', 'aria-hidden': 'true' },
        h('span', { class: 'br-num' }, need),
        h('span', { class: 'br-badge' })
      ));
      setPos(el, '--r', r);
      setPos(el, '--c', c);
      board.appendChild(el);
      return el;
    });
  };

  /** Syncs every dynamic attribute with `state` (no structural changes, so focus is kept). */
  const update = () => {
    const solved = isSolved(state);
    const have = islandDegrees(state);
    board.classList.toggle('is-solved', solved);
    bridgeEls.forEach((el, e) => {
      el.dataset.count = String(state.bridges[e] ?? 0);
    });
    islandEls.forEach((el, i) => {
      const need = state.islands[i]?.[2] ?? 0;
      const count = have[i] ?? 0;
      const kind = islandState(need, count);
      el.dataset.have = String(count);
      el.dataset.state = kind;
      el.setAttribute('aria-pressed', String(selected === i));
      el.setAttribute('aria-label', islandLabel(i, count));
      el.tabIndex = i === focusIndex ? 0 : -1;
      const badge = el.querySelector('.br-badge') as HTMLElement;
      badge.textContent = kind === 'done' ? '✓' : kind === 'over' ? '!' : count > 0 ? String(need - count) : '';
    });
    const done = satisfiedCount(state);
    const total = state.islands.length;
    if (solved) status.textContent = t('status.solved', { moves: state.moves });
    else if (done === total && !isConnected(total, edges, state.bridges)) status.textContent = t('status.disconnected');
    else status.textContent = t('status.progress', { done, total });
    status.dataset.status = solved ? 'solved' : 'playing';
    undoButton.disabled = !canUndo(state);
    controls.hidden = solved;
    help.hidden = solved;
    const result = state.lastCheck === null ? '' : state.lastCheck === 0 ? t('check.none') : t('check.some', { n: state.lastCheck });
    checkResult.textContent = result;
    checkResult.hidden = result === '';
  };

  // --- Input ---------------------------------------------------------------------------------

  const islandOf = (target: EventTarget | null): number | null => {
    const el = target instanceof Element ? target.closest<HTMLElement>('.br-island') : null;
    if (!el || !board.contains(el)) return null;
    const i = Number(el.dataset.index);
    return Number.isInteger(i) ? i : null;
  };

  const onClick = (event: MouseEvent) => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    const i = islandOf(event.target);
    if (i !== null) tap(i);
  };

  const onPointerDown = (event: PointerEvent) => {
    suppressClick = false;
    dragFrom = islandOf(event.target);
  };

  const onPointerUp = (event: PointerEvent) => {
    const from = dragFrom;
    dragFrom = null;
    if (from === null || paused || typeof document.elementFromPoint !== 'function') return;
    const to = islandOf(document.elementFromPoint(event.clientX, event.clientY));
    if (to === null || to === from || isSolved(state)) return;
    suppressClick = true;
    selected = null;
    focusIndex = to;
    update();
    build(from, to);
  };

  const onPointerCancel = () => {
    dragFrom = null;
  };

  const moveFocus = (i: number) => {
    if (i < 0) return;
    focusIndex = i;
    for (const el of islandEls) el.tabIndex = -1;
    const el = islandEls[i];
    if (!el) return;
    el.tabIndex = 0;
    el.focus();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const i = islandOf(event.target);
    if (i === null) return;
    suppressClick = false;
    if ((event.ctrlKey || event.metaKey) && (event.key === 'z' || event.key === 'Z')) {
      event.preventDefault();
      return runUndo();
    }
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Escape' && selected !== null) {
      event.preventDefault();
      select(null);
      return announce(live, t('announce.deselected'));
    }
    const seen = ARROWS[event.key];
    if (!seen) return;
    event.preventDefault();
    const dir = mirror(seen);
    if (event.shiftKey || selected === i) {
      if (paused || isSolved(state)) return;
      return buildToward(i, dir);
    }
    moveFocus(nearestIsland(state.islands, i, dir));
  };

  const onFocusIn = (event: FocusEvent) => {
    const i = islandOf(event.target);
    if (i !== null) focusIndex = i;
  };

  board.addEventListener('click', onClick);
  board.addEventListener('pointerdown', onPointerDown);
  board.addEventListener('pointerup', onPointerUp);
  board.addEventListener('pointercancel', onPointerCancel);
  board.addEventListener('keydown', onKeyDown);
  board.addEventListener('focusin', onFocusIn);

  // --- GameInstance --------------------------------------------------------------------------

  const mount = () => {
    selected = null;
    dragFrom = null;
    suppressClick = false;
    mountBoard();
    update();
    if (!container.isConnected) context.root.appendChild(container);
  };

  return {
    newGame(options: NewGameOptions) {
      state = createInitialState(options.seed, toDifficulty(options.difficulty));
      focusIndex = 0;
      mount();
    },
    restore(saved: BridgesState) {
      state = clone(saved);
      focusIndex = 0;
      mount();
    },
    serialize: () => clone(state),
    pause() {
      paused = true;
      dragFrom = null;
    },
    resume() {
      paused = false;
    },
    reset() {
      state = createInitialState(state.seed, state.difficulty);
      focusIndex = 0;
      mount();
      context.requestSave();
    },
    dispose() {
      board.removeEventListener('click', onClick);
      board.removeEventListener('pointerdown', onPointerDown);
      board.removeEventListener('pointerup', onPointerUp);
      board.removeEventListener('pointercancel', onPointerCancel);
      board.removeEventListener('keydown', onKeyDown);
      board.removeEventListener('focusin', onFocusIn);
      clear(context.root);
    }
  };
}
