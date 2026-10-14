import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import {
  LINE,
  NO_CLUE,
  canUndo,
  cellLineCounts,
  check,
  clueStatuses,
  clueTotal,
  createInitialState,
  cycleEdge,
  dotEdge,
  edgeInfo,
  isSolved,
  satisfiedCount,
  toDifficulty,
  toggleCross,
  undo,
  type Direction,
  type SlitherlinkState
} from './rules';
import './styles.css';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const ARROWS: Readonly<Record<string, Direction>> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
const MIRROR: Readonly<Record<Direction, Direction>> = { up: 'up', down: 'down', left: 'right', right: 'left' };
const STEP: Readonly<Record<Direction, readonly [number, number]>> = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
const MARK_NAMES = ['unknown', 'line', 'cross'] as const;

/**
 * Board view. Pointer/touch: every edge owns the diamond between the two cell centres next to
 * it (a 45°-rotated transparent button), so the whole board is hit area and each edge gets the
 * largest target the geometry allows; a tap anywhere near a line picks that line.
 * Keyboard: a roving focus moves between the points (dots); Shift+arrow (or Space, then an
 * arrow) cycles the line leaving the focused point in that direction.
 */
export function createSlitherlink(context: GameContext): GameInstance<SlitherlinkState> {
  const { t } = context;
  const rtl = t.direction === 'rtl';
  /** Logical direction (columns grow to the right) ↔ what the player sees (mirrored in RTL). */
  const mirror = (dir: Direction): Direction => (rtl ? MIRROR[dir] : dir);

  let state = createInitialState(0);
  let paused = false;
  /** Focused dot `[row, column]`. */
  let focus: [number, number] = [0, 0];
  /** Space/Enter pressed on a dot: the next arrow cycles a line instead of moving. */
  let armed = false;
  let edgeEls: HTMLButtonElement[] = [];
  let dotEls: HTMLButtonElement[] = [];
  let clueEls: (HTMLElement | null)[] = [];

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'sl-live' });
  const status = h('p', { class: 'wp-status sl-status', 'data-testid': 'sl-status' });
  const board = h('div', { class: 'sl-board', role: 'group', 'data-testid': 'sl-board' });
  const undoButton = h('button', { type: 'button', 'data-testid': 'sl-undo', onclick: () => runUndo() }, t('common.undo'));
  const checkButton = h('button', { type: 'button', 'data-testid': 'sl-check', 'aria-describedby': 'sl-check-help', onclick: () => runCheck() }, t('common.check'));
  const checkResult = h('p', { class: 'sl-check-result', 'data-testid': 'sl-check-result' });
  const help = h('div', { class: 'sl-help wp-muted' },
    h('p', {}, t('touch.help')),
    h('p', {}, t('keys.help')),
    h('p', { id: 'sl-check-help' }, t('check.help'))
  );
  const controls = h('div', { class: 'sl-controls' }, h('div', { class: 'wp-row sl-actions' }, undoButton, checkButton), checkResult);
  const container = h('div', { class: 'wp-slitherlink', dir: t.direction, lang: t.locale },
    status, h('div', { class: 'sl-wrap' }, board), controls, help, live);

  // --- Labels --------------------------------------------------------------------------------

  const markName = (e: number) => t(`mark.${MARK_NAMES[state.edges[e] ?? 0] ?? 'unknown'}`);

  const edgeLabel = (e: number) => {
    const info = edgeInfo(state.size, e);
    const r2 = info.horizontal ? info.r : info.r + 1;
    const c2 = info.horizontal ? info.c + 1 : info.c;
    return t('edge.label', { r1: info.r + 1, c1: info.c + 1, r2: r2 + 1, c2: c2 + 1, state: markName(e) });
  };

  const dotLabel = (r: number, c: number) => {
    const side = (seen: Direction) => {
      const e = dotEdge(state.size, r, c, mirror(seen));
      return e < 0 ? t('dot.border') : markName(e);
    };
    return t('dot.label', { row: r + 1, col: c + 1, up: side('up'), right: side('right'), down: side('down'), left: side('left') });
  };

  // --- State changes -------------------------------------------------------------------------

  /** Applies a new state; `message` is built afterwards so it describes the new state. */
  const commit = (next: SlitherlinkState, message?: () => string) => {
    if (next === state) return false;
    const wasSolved = isSolved(state);
    state = next;
    update();
    context.requestSave();
    if (!wasSolved && isSolved(state)) {
      announce(live, t('status.solved', { moves: state.moves }));
      context.finished({ outcome: 'completed', stats: { moves: state.moves, checks: state.checks } });
    } else if (message) {
      announce(live, message());
    }
    return true;
  };

  const mark = (e: number, cross = false) => {
    if (paused || e < 0) return;
    const next = cross ? toggleCross(state, e) : cycleEdge(state, e);
    commit(next, () => edgeLabel(e));
  };

  const runUndo = () => {
    if (paused) return;
    commit(undo(state), () => t('announce.undone'));
  };

  const runCheck = () => {
    if (paused) return;
    if (commit(check(state))) announce(live, checkResult.textContent ?? '');
  };

  // --- Rendering -----------------------------------------------------------------------------

  const place = (el: HTMLElement, y: number, x: number) => {
    el.style.setProperty('--y', String(y));
    el.style.setProperty('--x', String(x));
  };

  /** Builds the board skeleton for the current puzzle. */
  const mountBoard = () => {
    clear(board);
    const n = state.size;
    board.style.setProperty('--n', String(n));
    board.dataset.size = String(n);
    board.setAttribute('aria-label', t('board.label', { size: n, clues: clueTotal(state) }));
    clueEls = state.clues.map((k, i) => {
      if (k === NO_CLUE) return null;
      const r = Math.floor(i / n);
      const c = i % n;
      const el = h('div', { class: 'sl-clue', role: 'img', 'data-testid': `clue-${r}-${c}`, 'data-value': k },
        h('span', { class: 'sl-num', 'aria-hidden': 'true' }, k),
        h('span', { class: 'sl-badge', 'aria-hidden': 'true' })
      );
      place(el, 2 * r + 1, 2 * c + 1);
      board.appendChild(el);
      return el;
    });
    edgeEls = state.edges.map((_, e) => {
      const info = edgeInfo(n, e);
      const el = h('button', {
        type: 'button',
        class: 'sl-edge',
        tabindex: -1,
        'data-edge': e,
        'data-orientation': info.horizontal ? 'horizontal' : 'vertical',
        'data-testid': `edge-${info.horizontal ? 'h' : 'v'}-${info.r}-${info.c}`
      }, h('span', { class: 'sl-seg', 'aria-hidden': 'true' }));
      place(el, info.horizontal ? 2 * info.r : 2 * info.r + 1, info.horizontal ? 2 * info.c + 1 : 2 * info.c);
      board.appendChild(el);
      return el;
    });
    dotEls = [];
    for (let r = 0; r <= n; r++) {
      for (let c = 0; c <= n; c++) {
        const el = h('button', { type: 'button', class: 'sl-dot', tabindex: -1, 'data-r': r, 'data-c': c, 'data-testid': `dot-${r}-${c}` });
        place(el, 2 * r, 2 * c);
        board.appendChild(el);
        dotEls.push(el);
      }
    }
  };

  const dotEl = (r: number, c: number) => dotEls[r * (state.size + 1) + c];

  /** Syncs every dynamic attribute with `state` (no structural changes, so focus is kept). */
  const update = () => {
    const solved = isSolved(state);
    const n = state.size;
    board.classList.toggle('is-solved', solved);
    edgeEls.forEach((el, e) => {
      el.dataset.state = MARK_NAMES[state.edges[e] ?? 0] ?? 'unknown';
      el.setAttribute('aria-label', edgeLabel(e));
    });
    const statuses = clueStatuses(state);
    const counts = cellLineCounts(n, state.edges);
    clueEls.forEach((el, i) => {
      if (!el) return;
      const s = statuses[i] ?? 'open';
      el.dataset.status = s;
      el.setAttribute('aria-label', t('clue.label', {
        value: state.clues[i] ?? 0,
        row: Math.floor(i / n) + 1,
        col: (i % n) + 1,
        have: counts[i] ?? 0,
        status: t(`clue.${s === 'none' ? 'open' : s}`)
      }));
      (el.querySelector('.sl-badge') as HTMLElement).textContent = s === 'done' ? '✓' : s === 'over' ? '!' : '';
    });
    dotEls.forEach((el) => {
      const r = Number(el.dataset.r);
      const c = Number(el.dataset.c);
      const focused = r === focus[0] && c === focus[1];
      el.tabIndex = focused ? 0 : -1;
      el.setAttribute('aria-pressed', String(focused && armed));
      el.setAttribute('aria-label', dotLabel(r, c));
    });
    const done = satisfiedCount(state);
    const total = clueTotal(state);
    if (solved) status.textContent = t('status.solved', { moves: state.moves });
    else if (done === total && state.edges.some((m) => m === LINE)) status.textContent = t('status.notLoop');
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

  const edgeOf = (target: EventTarget | null): number => {
    const el = target instanceof Element ? target.closest<HTMLElement>('.sl-edge') : null;
    if (!el || !board.contains(el)) return -1;
    const e = Number(el.dataset.edge);
    return Number.isInteger(e) ? e : -1;
  };

  const onClick = (event: MouseEvent) => mark(edgeOf(event.target));

  /** Right click (or a long press that opens the context menu) toggles a cross. */
  const onContextMenu = (event: MouseEvent) => {
    const e = edgeOf(event.target);
    if (e < 0) return;
    event.preventDefault();
    mark(e, true);
  };

  const setArmed = (value: boolean) => {
    armed = value;
    update();
  };

  const moveFocus = (r: number, c: number) => {
    const n = state.size;
    if (r < 0 || c < 0 || r > n || c > n) return;
    focus = [r, c];
    armed = false;
    update();
    dotEl(r, c)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const el = event.target instanceof Element ? event.target.closest<HTMLElement>('.sl-dot') : null;
    if (!el) return;
    const r = Number(el.dataset.r);
    const c = Number(el.dataset.c);
    focus = [r, c];
    if ((event.ctrlKey || event.metaKey) && (event.key === 'z' || event.key === 'Z')) {
      event.preventDefault();
      return runUndo();
    }
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (paused || isSolved(state)) return;
      setArmed(!armed);
      return announce(live, t(armed ? 'announce.armed' : 'announce.disarmed'));
    }
    if (event.key === 'Escape' && armed) {
      event.preventDefault();
      setArmed(false);
      return announce(live, t('announce.disarmed'));
    }
    const seen = ARROWS[event.key];
    if (!seen) return;
    event.preventDefault();
    const dir = mirror(seen);
    if (event.shiftKey || armed) {
      armed = false;
      update();
      const e = dotEdge(state.size, r, c, dir);
      if (e < 0) return announce(live, t('announce.border'));
      return mark(e);
    }
    const [dr, dc] = STEP[dir];
    moveFocus(r + dr, c + dc);
  };

  const onFocusIn = (event: FocusEvent) => {
    const el = event.target instanceof Element ? event.target.closest<HTMLElement>('.sl-dot') : null;
    if (!el) return;
    const r = Number(el.dataset.r);
    const c = Number(el.dataset.c);
    if (r === focus[0] && c === focus[1]) return;
    focus = [r, c];
    armed = false;
    update();
  };

  board.addEventListener('click', onClick);
  board.addEventListener('contextmenu', onContextMenu);
  board.addEventListener('keydown', onKeyDown);
  board.addEventListener('focusin', onFocusIn);

  // --- GameInstance --------------------------------------------------------------------------

  const mount = () => {
    focus = [0, 0];
    armed = false;
    mountBoard();
    update();
    if (!container.isConnected) context.root.appendChild(container);
  };

  return {
    newGame(options: NewGameOptions) {
      state = createInitialState(options.seed, toDifficulty(options.difficulty));
      mount();
    },
    restore(saved: SlitherlinkState) {
      state = clone(saved);
      mount();
    },
    serialize: () => clone(state),
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    reset() {
      state = createInitialState(state.seed, state.difficulty);
      mount();
      context.requestSave();
    },
    dispose() {
      board.removeEventListener('click', onClick);
      board.removeEventListener('contextmenu', onContextMenu);
      board.removeEventListener('keydown', onKeyDown);
      board.removeEventListener('focusin', onFocusIn);
      clear(context.root);
    }
  };
}
