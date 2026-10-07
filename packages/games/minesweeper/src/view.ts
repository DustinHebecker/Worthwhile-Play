import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, clear, gridKeyboard, h } from '@wp/ui';
import {
  FLAGGED,
  REVEALED,
  adjacentCounts,
  chord,
  createInitialState,
  flagCount,
  isOver,
  isWon,
  reveal,
  revealedCount,
  safeCellsLeft,
  setMode,
  showBoard,
  tap,
  toDifficulty,
  toggleFlag,
  undoReveal,
  type MinesState,
  type Mode
} from './rules';
import './styles.css';

/** Touch/pen hold duration that flags a cell instead of revealing it. */
const LONG_PRESS_MS = 450;
const SVG_NS = 'http://www.w3.org/2000/svg';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

type CellView = 'hidden' | 'flagged' | 'revealed' | 'mine';

/** Small inline icons (no font dependency). Both use currentColor. */
function icon(kind: 'flag' | 'mine'): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('class', `ms-icon ms-icon-${kind}`);
  const add = (tag: string, attrs: Record<string, string>) => {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    svg.appendChild(el);
  };
  if (kind === 'flag') {
    add('rect', { x: '5', y: '3', width: '2', height: '14', fill: 'currentColor' });
    add('polygon', { points: '7,3 16,7 7,11', fill: 'currentColor' });
    add('rect', { x: '3', y: '16', width: '8', height: '2', fill: 'currentColor' });
  } else {
    add('circle', { cx: '10', cy: '10', r: '5', fill: 'currentColor' });
    add('path', { d: 'M10 2v16M2 10h16M4.3 4.3l11.4 11.4M15.7 4.3L4.3 15.7', stroke: 'currentColor', 'stroke-width': '1.6', 'stroke-linecap': 'round' });
  }
  return svg;
}

export function createMineLogic(context: GameContext): GameInstance<MinesState> {
  const { t } = context;
  let state = createInitialState(0);
  let counts: number[] = [];
  let paused = false;
  /** Cell index that holds the roving tabindex. */
  let focusIndex = 0;
  let cellEls: HTMLElement[] = [];
  let disposeKeyboard: () => void = () => undefined;
  let pressTimer: ReturnType<typeof setTimeout> | undefined;
  let pressStart = { x: 0, y: 0 };
  /** Set when a long press or context menu already acted, so the following click is ignored. */
  let pressHandled = false;

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'ms-live' });
  const status = h('p', { class: 'wp-status ms-status', 'data-testid': 'ms-status' });
  const minesCounter = h('span', { class: 'ms-counter', 'data-testid': 'ms-mines' });
  const flagsCounter = h('span', { class: 'ms-counter', 'data-testid': 'ms-flags' });
  const counters = h('p', { class: 'ms-counters' }, minesCounter, flagsCounter);
  const undoButton = h('button', { type: 'button', class: 'primary', 'data-testid': 'ms-undo', onclick: () => runUndo() }, t('action.undoReveal'));
  const showButton = h('button', { type: 'button', 'data-testid': 'ms-show', onclick: () => runShow() }, t('action.showBoard'));
  const mistake = h('div', { class: 'ms-mistake', 'data-testid': 'ms-mistake' }, undoButton, showButton);
  const modeButtons: Record<Mode, HTMLButtonElement> = {
    reveal: h('button', { type: 'button', class: 'ms-mode-button', 'data-testid': 'ms-mode-reveal', onclick: () => chooseMode('reveal') }, h('span', { class: 'ms-mode-cell', 'aria-hidden': 'true' }), t('mode.reveal')),
    flag: h('button', { type: 'button', class: 'ms-mode-button', 'data-testid': 'ms-mode-flag', onclick: () => chooseMode('flag') }, icon('flag'), t('mode.flag'))
  };
  const modeLabelId = 'ms-mode-label';
  const modeGroup = h('div', { class: 'ms-mode', role: 'group', 'aria-labelledby': modeLabelId },
    h('span', { class: 'ms-mode-label', id: modeLabelId }, t('mode.label')),
    modeButtons.reveal,
    modeButtons.flag
  );
  const board = h('div', { class: 'ms-board', role: 'grid', 'data-testid': 'ms-board' });
  const scroller = h('div', { class: 'ms-scroll' }, board);
  const help = h('div', { class: 'ms-help wp-muted' },
    h('p', {}, t('help.logic')),
    h('p', {}, t('help.touch')),
    h('p', {}, t('help.keys'))
  );
  const container = h('div', { class: 'wp-minesweeper', dir: t.direction, lang: t.locale }, status, counters, mistake, scroller, modeGroup, help, live);

  // --- Labels --------------------------------------------------------------------------------

  const isMine = (i: number) => state.mines?.includes(i) ?? false;

  const viewOf = (i: number): CellView => {
    const mark = state.marks[i];
    if (mark === REVEALED) return 'revealed';
    if (i === state.exploded || (state.shown && isMine(i))) return 'mine';
    if (mark === FLAGGED || (isWon(state) && isMine(i))) return 'flagged';
    return 'hidden';
  };

  const cellLabel = (i: number) => {
    const params = { row: Math.floor(i / state.cols) + 1, col: (i % state.cols) + 1 };
    const view = viewOf(i);
    if (view === 'revealed') {
      const count = counts[i] ?? 0;
      return count === 0 ? t('cell.open', params) : t('cell.number', { ...params, count });
    }
    if (view === 'flagged') return state.shown && !isMine(i) ? t('cell.wrongFlag', params) : t('cell.flagged', params);
    return t(view === 'mine' ? 'cell.mine' : 'cell.hidden', params);
  };

  // --- State changes -------------------------------------------------------------------------

  const commit = (next: MinesState, focusCell?: number) => {
    if (next === state) return;
    const before = state;
    state = next;
    if (state.mines && !before.mines) counts = adjacentCounts(state.rows, state.cols, state.mines);
    update();
    context.requestSave();
    if (!isOver(before) && isOver(state)) {
      announce(live, isWon(state) ? t('status.won', { moves: state.moves, undos: state.undos }) : t('status.shown'));
      context.finished({ outcome: isWon(state) ? 'won' : 'lost', stats: { moves: state.moves, undos: state.undos } });
      return;
    }
    if (state.exploded !== null && before.exploded === null) {
      announce(live, t('status.mistake'));
      undoButton.focus();
      return;
    }
    if (before.exploded !== null && state.exploded === null) {
      // Back to the cell that was revealed by mistake.
      focusIndex = before.exploded;
      cellEls.forEach((el, i) => (el.tabIndex = i === focusIndex ? 0 : -1));
      cellEls[focusIndex]?.focus();
      announce(live, cellLabel(focusIndex));
      return;
    }
    const opened = revealedCount(state) - revealedCount(before);
    if (focusCell === undefined) return;
    announce(live, opened > 1 ? `${t('announce.opened', { n: opened })} ${cellLabel(focusCell)}` : cellLabel(focusCell));
  };

  const act = (index: number, run: (s: MinesState, i: number) => MinesState) => {
    if (paused) return;
    focusIndex = index;
    commit(run(state, index), index);
  };

  const chooseMode = (mode: Mode) => {
    if (paused) return;
    commit(setMode(state, mode));
  };

  const runUndo = () => {
    if (!paused) commit(undoReveal(state));
  };

  const runShow = () => {
    if (!paused) commit(showBoard(state));
  };

  // --- Rendering -----------------------------------------------------------------------------

  /** Builds the board skeleton for the current dimensions. */
  const build = () => {
    disposeKeyboard();
    clear(board);
    const { rows, cols } = state;
    counts = state.mines ? adjacentCounts(rows, cols, state.mines) : new Array<number>(rows * cols).fill(0);
    focusIndex = Math.min(focusIndex, rows * cols - 1);
    board.style.setProperty('--ms-cols', String(cols));
    board.dataset.cols = String(cols);
    board.dataset.rows = String(rows);
    board.setAttribute('aria-label', t('board.label', { cols, rows }));
    cellEls = [];
    for (let r = 0; r < rows; r++) {
      const row = h('div', { class: 'ms-row', role: 'row' });
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const cell = h('div', { class: 'ms-cell', role: 'gridcell', 'data-cell': i, 'data-testid': `cell-${r}-${c}`, tabindex: -1 }, h('span', { class: 'ms-glyph', 'aria-hidden': 'true' }));
        cellEls.push(cell);
        row.appendChild(cell);
      }
      board.appendChild(row);
    }
    disposeKeyboard = gridKeyboard(board, cols);
  };

  /** Syncs every dynamic attribute with `state` (no structural changes, so focus is kept). */
  const update = () => {
    const over = isOver(state);
    cellEls.forEach((cell, i) => {
      const view = viewOf(i);
      cell.dataset.state = view;
      const count = counts[i] ?? 0;
      if (view === 'revealed') cell.dataset.count = String(count);
      else delete cell.dataset.count;
      cell.classList.toggle('is-exploded', i === state.exploded);
      cell.classList.toggle('is-wrong-flag', state.shown && view === 'flagged' && !isMine(i));
      cell.setAttribute('aria-label', cellLabel(i));
      cell.tabIndex = i === focusIndex ? 0 : -1;
      const glyph = cell.firstElementChild as HTMLElement;
      clear(glyph);
      if (view === 'revealed' && count > 0) glyph.textContent = String(count);
      else if (view === 'flagged') glyph.appendChild(icon('flag'));
      else if (view === 'mine') glyph.appendChild(icon('mine'));
    });

    let key = 'playing';
    if (state.mines === null) key = 'start';
    else if (isWon(state)) key = 'won';
    else if (state.shown) key = 'shown';
    else if (state.exploded !== null) key = 'mistake';
    status.dataset.status = key;
    status.textContent = t(`status.${key}`, { n: safeCellsLeft(state), moves: state.moves, undos: state.undos });
    minesCounter.textContent = t('counter.mines', { n: state.mineCount });
    flagsCounter.textContent = t('counter.flags', { n: flagCount(state) });

    board.classList.toggle('is-over', over);
    board.setAttribute('aria-readonly', over ? 'true' : 'false');
    mistake.hidden = state.exploded === null || state.shown;
    modeGroup.hidden = over;
    help.hidden = over;
    for (const mode of ['reveal', 'flag'] as const) modeButtons[mode].setAttribute('aria-pressed', String(state.mode === mode));
  };

  // --- Input ---------------------------------------------------------------------------------

  const cellIndexOf = (target: EventTarget | null): number | null => {
    const el = target instanceof Element ? target.closest<HTMLElement>('[data-cell]') : null;
    if (!el || !board.contains(el)) return null;
    const i = Number(el.dataset.cell);
    return Number.isInteger(i) ? i : null;
  };

  const cancelPress = () => {
    if (pressTimer !== undefined) clearTimeout(pressTimer);
    pressTimer = undefined;
  };

  const onClick = (event: MouseEvent) => {
    const i = cellIndexOf(event.target);
    if (i === null) return;
    if (pressHandled) {
      pressHandled = false;
      return;
    }
    act(i, tap);
  };

  const onContextMenu = (event: MouseEvent) => {
    const i = cellIndexOf(event.target);
    if (i === null) return;
    event.preventDefault();
    // Some touch browsers fire contextmenu on long press as well: act only once per press.
    if (pressHandled) return;
    cancelPress();
    pressHandled = true;
    act(i, toggleFlag);
  };

  const onPointerDown = (event: PointerEvent) => {
    pressHandled = false;
    cancelPress();
    if (event.pointerType === 'mouse') return;
    const i = cellIndexOf(event.target);
    if (i === null) return;
    pressStart = { x: event.clientX, y: event.clientY };
    // Purely an input gesture: state only changes when the hold completes.
    pressTimer = setTimeout(() => {
      pressTimer = undefined;
      pressHandled = true;
      act(i, toggleFlag);
    }, LONG_PRESS_MS);
  };

  function cancelOnMove(event: Event) {
    // Small finger jitter must not cancel a long press; a real drag or lift does.
    const { clientX = 0, clientY = 0 } = event as PointerEvent;
    if (event.type === 'pointermove' && Math.hypot(clientX - pressStart.x, clientY - pressStart.y) < 10) return;
    cancelPress();
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const i = cellIndexOf(event.target);
    if (i === null) return;
    let run: ((s: MinesState, i: number) => MinesState) | undefined;
    if (event.key === ' ' || event.key === 'Spacebar') run = (s, k) => (s.marks[k] === REVEALED ? chord(s, k) : reveal(s, k));
    else if (event.key === 'Enter') run = tap;
    else if (event.key === 'f' || event.key === 'F') run = toggleFlag;
    if (!run) return;
    event.preventDefault();
    act(i, run);
  };

  const onFocusIn = (event: FocusEvent) => {
    const i = cellIndexOf(event.target);
    if (i !== null) focusIndex = i;
  };

  const pointerEnd = ['pointerup', 'pointercancel', 'pointerleave', 'pointermove'] as const;
  board.addEventListener('click', onClick);
  board.addEventListener('contextmenu', onContextMenu);
  board.addEventListener('pointerdown', onPointerDown);
  for (const type of pointerEnd) board.addEventListener(type, cancelOnMove);
  board.addEventListener('keydown', onKeyDown);
  board.addEventListener('focusin', onFocusIn);

  // --- GameInstance --------------------------------------------------------------------------

  const mount = () => {
    cancelPress();
    pressHandled = false;
    build();
    update();
    if (!container.isConnected) context.root.appendChild(container);
  };

  return {
    newGame(options: NewGameOptions) {
      state = createInitialState(options.seed, toDifficulty(options.difficulty));
      focusIndex = 0;
      mount();
    },
    restore(saved: MinesState) {
      state = clone(saved);
      focusIndex = state.first ?? 0;
      mount();
    },
    serialize: () => clone(state),
    pause() {
      paused = true;
      cancelPress();
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
      cancelPress();
      disposeKeyboard();
      board.removeEventListener('click', onClick);
      board.removeEventListener('contextmenu', onContextMenu);
      board.removeEventListener('pointerdown', onPointerDown);
      for (const type of pointerEnd) board.removeEventListener(type, cancelOnMove);
      board.removeEventListener('keydown', onKeyDown);
      board.removeEventListener('focusin', onFocusIn);
      clear(context.root);
    }
  };
}
