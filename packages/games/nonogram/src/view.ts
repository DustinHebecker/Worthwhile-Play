// @ts-nocheck
import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, clear, gridKeyboard, h } from '@wp/ui';
import {
  CROSSED,
  applyCell,
  canShowMistakes,
  check,
  cluesOf,
  colOf,
  createInitialState,
  isSolved,
  lineSatisfied,
  rowOf,
  setMode,
  showMistakes,
  tapAction,
  toDifficulty,
  type CellAction,
  type Clues,
  type Mode,
  type NonogramState
} from './rules';
import './styles.css';

/** Touch/pen hold duration that crosses a cell out instead of filling it. */
const LONG_PRESS_MS = 450;

const STATE_NAMES = ['unknown', 'filled', 'crossed'] as const;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createNonogram(context: GameContext): GameInstance<NonogramState> {
  const { t } = context;
  let state = createInitialState(0);
  let clues: Clues = cluesOf(state.solution, state.size);
  let paused = false;
  /** Cell index that holds the roving tabindex. */
  let focusIndex = 0;
  let cellEls: HTMLElement[] = [];
  let rowClueEls: HTMLElement[] = [];
  let colClueEls: HTMLElement[] = [];
  let disposeKeyboard: () => void = () => undefined;
  let pressTimer: ReturnType<typeof setTimeout> | undefined;
  let pressStart = { x: 0, y: 0 };
  /** Set when a long press already acted, so the following click/contextmenu is ignored. */
  let pressHandled = false;

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'ng-live' });
  const status = h('p', { class: 'wp-status ng-status', 'data-testid': 'ng-status' });
  const modeButtons = {
    fill: h('button', { type: 'button', class: 'ng-mode-button', 'data-testid': 'ng-mode-fill', onclick: () => chooseMode('fill') }, h('span', { class: 'ng-mode-icon ng-mode-icon-fill', 'aria-hidden': 'true' }), t('mode.fill')),
    cross: h('button', { type: 'button', class: 'ng-mode-button', 'data-testid': 'ng-mode-cross', onclick: () => chooseMode('cross') }, h('span', { class: 'ng-mode-icon', 'aria-hidden': 'true' }, '✕'), t('mode.cross'))
  };
  const modeLabelId = 'ng-mode-label';
  const modeGroup = h('div', { class: 'ng-mode', role: 'group', 'aria-labelledby': modeLabelId },
    h('span', { class: 'ng-mode-label', id: modeLabelId }, t('mode.label')),
    modeButtons.fill,
    modeButtons.cross
  );
  const board = h('div', { class: 'ng-board', role: 'grid', 'data-testid': 'ng-board' });
  const scroller = h('div', { class: 'ng-scroll' }, board);
  const checkButton = h('button', { type: 'button', 'data-testid': 'ng-check', 'aria-describedby': 'ng-check-help', onclick: () => runCheck() }, t('common.check'));
  const showButton = h('button', { type: 'button', 'data-testid': 'ng-show-mistakes', onclick: () => revealMistakes() }, t('action.showMistakes'));
  const checkResult = h('p', { class: 'ng-check-result', 'data-testid': 'ng-check-result' });
  const help = h('div', { class: 'ng-help wp-muted' },
    h('p', { id: 'ng-check-help' }, t('check.help')),
    h('p', {}, t('touch.help')),
    h('p', {}, t('keys.help'))
  );
  const controls = h('div', { class: 'ng-controls' }, modeGroup, h('div', { class: 'wp-row ng-actions' }, checkButton, showButton), checkResult);
  const container = h('div', { class: 'wp-nonogram', dir: t.direction, lang: t.locale }, status, scroller, controls, help, live);

  // --- Labels --------------------------------------------------------------------------------

  const clueText = (clue: readonly number[]) => (clue.length === 0 ? '0' : clue.join(t('clue.separator')));
  const cellLabel = (i: number, s: NonogramState = state) => {
    const row = Math.floor(i / s.size) + 1;
    const col = (i % s.size) + 1;
    if (s.marked.includes(i)) return t('cell.wrong', { row, col });
    return t('cell.label', { row, col, state: t(`state.${STATE_NAMES[s.cells[i] as number] ?? 'unknown'}`) });
  };

  // --- State changes -------------------------------------------------------------------------

  const commit = (next: NonogramState, message?: string) => {
    if (next === state) return false;
    const wasSolved = isSolved(state);
    state = next;
    update();
    context.requestSave();
    const solvedNow = !wasSolved && isSolved(state);
    if (solvedNow) {
      announce(live, t('status.solved', { moves: state.moves }));
      context.finished({ outcome: 'completed', stats: { moves: state.moves, checks: state.checks, mistakes: state.mistakes } });
    } else if (message) {
      announce(live, message);
    }
    return true;
  };

  const act = (index: number, action: CellAction) => {
    if (paused) return;
    focusIndex = index;
    const next = applyCell(state, index, action);
    commit(next, cellLabel(index, next));
  };

  const chooseMode = (mode: Mode) => {
    if (paused) return;
    commit(setMode(state, mode));
  };

  const runCheck = () => {
    if (paused) return;
    if (commit(check(state))) announce(live, checkResult.textContent ?? '');
  };

  const revealMistakes = () => {
    if (paused) return;
    if (commit(showMistakes(state))) announce(live, t('mistakes.shown'));
  };

  // --- Rendering -----------------------------------------------------------------------------

  /** Builds the board skeleton for the current puzzle (size and clues). */
  const build = () => {
    disposeKeyboard();
    clear(board);
    const n = state.size;
    clues = cluesOf(state.solution, n);
    focusIndex = Math.min(focusIndex, n * n - 1);
    board.style.setProperty('--ng-n', String(n));
    board.dataset.size = String(n);
    board.setAttribute('aria-label', t('board.label', { size: n }));
    cellEls = [];
    rowClueEls = [];
    colClueEls = [];

    const header = h('div', { class: 'ng-row', role: 'row' }, h('div', { class: 'ng-corner', role: 'presentation' }));
    for (let c = 0; c < n; c++) {
      const clue = clues.cols[c] as number[];
      const el = h('div', { class: 'ng-clue ng-col-clue', role: 'columnheader', 'data-testid': `col-clue-${c}` },
        h('span', { class: 'ng-done-mark', 'aria-hidden': 'true' }, '✓'),
        ...(clue.length === 0 ? [0] : clue).map((v) => h('span', { class: 'ng-num', 'aria-hidden': 'true' }, v))
      );
      colClueEls.push(el);
      header.appendChild(el);
    }
    board.appendChild(header);

    for (let r = 0; r < n; r++) {
      const clue = clues.rows[r] as number[];
      const clueEl = h('div', { class: 'ng-clue ng-row-clue', role: 'rowheader', 'data-testid': `row-clue-${r}` },
        h('span', { class: 'ng-done-mark', 'aria-hidden': 'true' }, '✓'),
        ...(clue.length === 0 ? [0] : clue).map((v) => h('span', { class: 'ng-num', 'aria-hidden': 'true' }, v))
      );
      rowClueEls.push(clueEl);
      const row = h('div', { class: 'ng-row', role: 'row' }, clueEl);
      for (let c = 0; c < n; c++) {
        const i = r * n + c;
        const classes = ['ng-cell'];
        if (c % 5 === 4 && c < n - 1) classes.push('ng-major-col');
        if (r % 5 === 4 && r < n - 1) classes.push('ng-major-row');
        const cell = h('div', { class: classes.join(' '), role: 'gridcell', 'data-cell': i, 'data-testid': `cell-${r}-${c}`, tabindex: -1 },
          h('span', { class: 'ng-glyph', 'aria-hidden': 'true' })
        );
        cellEls.push(cell);
        row.appendChild(cell);
      }
      board.appendChild(row);
    }
    disposeKeyboard = gridKeyboard(board, n);
  };

  /** Syncs every dynamic attribute with `state` (no structural changes, so focus is kept). */
  const update = () => {
    const n = state.size;
    const solved = isSolved(state);
    board.classList.toggle('is-solved', solved);
    board.setAttribute('aria-readonly', solved ? 'true' : 'false');
    cellEls.forEach((cell, i) => {
      const mark = state.cells[i] as number;
      const wrong = state.marked.includes(i);
      cell.dataset.state = STATE_NAMES[mark] ?? 'unknown';
      cell.classList.toggle('is-wrong', wrong);
      cell.setAttribute('aria-label', cellLabel(i));
      cell.tabIndex = i === focusIndex ? 0 : -1;
      const glyph = cell.firstElementChild as HTMLElement;
      glyph.textContent = wrong ? '!' : mark === CROSSED && !solved ? '✕' : '';
    });
    let done = 0;
    for (let k = 0; k < n; k++) {
      const rowDone = lineSatisfied(clues.rows[k] as number[], rowOf(state.cells, n, k));
      const colDone = lineSatisfied(clues.cols[k] as number[], colOf(state.cells, n, k));
      done += (rowDone ? 1 : 0) + (colDone ? 1 : 0);
      setClue(rowClueEls[k], rowDone, t(rowDone ? 'clue.rowDone' : 'clue.row', { n: k + 1, clue: clueText(clues.rows[k] as number[]) }));
      setClue(colClueEls[k], colDone, t(colDone ? 'clue.colDone' : 'clue.col', { n: k + 1, clue: clueText(clues.cols[k] as number[]) }));
    }
    status.textContent = solved ? t('status.solved', { moves: state.moves }) : t('status.lines', { done, total: 2 * n });
    status.dataset.status = solved ? 'solved' : 'playing';

    for (const mode of ['fill', 'cross'] as const) modeButtons[mode].setAttribute('aria-pressed', String(state.mode === mode));
    controls.hidden = solved;
    help.hidden = solved;
    showButton.hidden = !canShowMistakes(state);
    let result = '';
    if (state.marked.length > 0) result = t('mistakes.shown');
    else if (state.lastCheck !== null) result = state.lastCheck === 0 ? t('check.none') : t('check.some', { n: state.lastCheck });
    checkResult.textContent = result;
    checkResult.hidden = result === '';
  };

  const setClue = (el: HTMLElement | undefined, done: boolean, label: string) => {
    if (!el) return;
    el.classList.toggle('is-done', done);
    el.dataset.done = String(done);
    el.setAttribute('aria-label', label);
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
    act(i, tapAction(state.mode));
  };

  const onContextMenu = (event: MouseEvent) => {
    const i = cellIndexOf(event.target);
    if (i === null) return;
    event.preventDefault();
    if (pressHandled) return;
    act(i, 'toggleCross');
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
      act(i, 'toggleCross');
    }, LONG_PRESS_MS);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const i = cellIndexOf(event.target);
    if (i === null) return;
    const actions: Record<string, CellAction> = {
      ' ': 'toggleFill',
      Enter: tapAction(state.mode),
      x: 'toggleCross',
      X: 'toggleCross',
      Backspace: 'clear',
      Delete: 'clear'
    };
    const action = actions[event.key];
    if (!action) return;
    event.preventDefault();
    act(i, action);
  };

  const onFocusIn = (event: FocusEvent) => {
    const i = cellIndexOf(event.target);
    if (i !== null) focusIndex = i;
  };

  board.addEventListener('click', onClick);
  board.addEventListener('contextmenu', onContextMenu);
  board.addEventListener('pointerdown', onPointerDown);
  for (const type of ['pointerup', 'pointercancel', 'pointerleave', 'pointermove'] as const) board.addEventListener(type, cancelOnMove);
  board.addEventListener('keydown', onKeyDown);
  board.addEventListener('focusin', onFocusIn);

  function cancelOnMove(event: Event) {
    // Small finger jitter must not cancel a long press; a real drag or lift does.
    const { clientX = 0, clientY = 0 } = event as PointerEvent;
    if (event.type === 'pointermove' && Math.hypot(clientX - pressStart.x, clientY - pressStart.y) < 10) return;
    cancelPress();
  }

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
    restore(saved: NonogramState) {
      state = clone(saved);
      focusIndex = 0;
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
      for (const type of ['pointerup', 'pointercancel', 'pointerleave', 'pointermove'] as const) board.removeEventListener(type, cancelOnMove);
      board.removeEventListener('keydown', onKeyDown);
      board.removeEventListener('focusin', onFocusIn);
      clear(context.root);
    }
  };
}
