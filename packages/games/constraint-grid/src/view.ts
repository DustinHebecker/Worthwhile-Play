import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, clear, gridKeyboard, h } from '@wp/ui';
import {
  MARK_UNKNOWN,
  cellPosition,
  check,
  confirmedCount,
  createInitialState,
  cycleMark,
  isSolved,
  pairs,
  setAutoExclude,
  setMark,
  toDifficulty,
  toggleUsed,
  undo,
  type ConstraintGridState
} from './rules';
import { categoryLabel, clueText, itemLabel } from './text';
import './styles.css';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const MARK_NAMES = ['unknown', 'no', 'yes'] as const;
const MARK_SYMBOLS = ['', '✗', '✓'] as const;

export function createConstraintGrid(context: GameContext): GameInstance<ConstraintGridState> {
  const { t } = context;
  let state = createInitialState(0);
  let paused = false;
  /** Per block: the cell holding the roving tabindex (view-only). */
  let active: number[] = [];
  /** Focused cell for row/column highlighting, or -1. */
  let focused = -1;
  let cellEls: HTMLElement[] = [];
  let clueEls: HTMLButtonElement[] = [];
  let disposers: (() => void)[] = [];

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'cg-live' });
  const status = h('p', { class: 'wp-status cg-status', 'data-testid': 'cg-status' });
  const clueList = h('ol', { class: 'cg-clue-list', 'data-testid': 'cg-clues' });
  const blocks = h('div', { class: 'cg-blocks', 'data-testid': 'cg-blocks' });
  const undoButton = h('button', { type: 'button', 'data-testid': 'cg-undo', onclick: () => runUndo() },
    h('span', { 'aria-hidden': 'true' }, '↶ '), t('common.undo'));
  const checkButton = h('button', { type: 'button', 'data-testid': 'cg-check', 'aria-describedby': 'cg-check-help', onclick: () => runCheck() }, t('common.check'));
  const autoBox = h('input', { type: 'checkbox', 'data-testid': 'cg-auto', onchange: () => toggleAuto() });
  const autoLabel = h('label', { class: 'cg-auto' }, autoBox, h('span', {}, t('action.autoExclude')));
  const checkResult = h('p', { class: 'cg-check-result', 'data-testid': 'cg-check-result' });
  const controls = h('div', { class: 'cg-controls' },
    h('div', { class: 'wp-row cg-actions' }, undoButton, checkButton),
    autoLabel,
    checkResult
  );
  const help = h('div', { class: 'cg-help wp-muted' },
    h('p', { id: 'cg-check-help' }, t('check.help')),
    h('p', {}, t('keys.help'))
  );
  const container = h('div', { class: 'wp-constraint-grid', dir: t.direction, lang: t.locale },
    status,
    h('div', { class: 'cg-layout' },
      h('section', { class: 'cg-clues', 'aria-labelledby': 'cg-clues-heading' },
        h('h2', { id: 'cg-clues-heading' }, t('clues.heading')),
        h('p', { class: 'wp-muted cg-hint' }, t('clues.help')),
        clueList
      ),
      h('section', { class: 'cg-grids', 'aria-labelledby': 'cg-grids-heading' },
        h('h2', { id: 'cg-grids-heading' }, t('grids.heading')),
        h('p', { class: 'wp-muted cg-hint' }, t('grid.help')),
        blocks,
        controls
      )
    ),
    help,
    live
  );

  // --- Labels --------------------------------------------------------------------------------

  const cellLabel = (k: number, s: ConstraintGridState = state) => {
    const { a, b, i, j } = cellPosition(s.kinds.length, s.size, k);
    const mark = MARK_NAMES[s.marks[k] ?? MARK_UNKNOWN] ?? 'unknown';
    return t(`cell.${mark}`, { row: itemLabel(t, s, a, i), col: itemLabel(t, s, b, j) });
  };

  // --- State changes -------------------------------------------------------------------------

  const commit = (next: ConstraintGridState, message?: string) => {
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

  const mark = (k: number, value?: number) => {
    if (paused) return;
    const next = value === undefined ? cycleMark(state, k) : setMark(state, k, value);
    commit(next, cellLabel(k, next));
  };

  const runUndo = () => {
    if (paused) return;
    commit(undo(state), t('status.undone'));
  };

  const runCheck = () => {
    if (paused) return;
    const next = check(state);
    if (commit(next)) announce(live, checkResult.textContent ?? '');
  };

  const toggleAuto = () => {
    if (paused) {
      autoBox.checked = state.autoExclude;
      return;
    }
    commit(setAutoExclude(state, autoBox.checked));
  };

  const toggleClue = (index: number) => {
    if (paused) return;
    commit(toggleUsed(state, index));
  };

  // --- Rendering -----------------------------------------------------------------------------

  /** Builds clue list and grids for the current puzzle. */
  const build = () => {
    for (const dispose of disposers) dispose();
    disposers = [];
    clear(clueList);
    clear(blocks);
    const n = state.size;
    const s = state;

    clueEls = s.clues.map((clue, index) => {
      const button = h('button', { type: 'button', class: 'cg-clue', 'data-testid': `clue-${index}`, 'data-clue': index, onclick: () => toggleClue(index) },
        h('span', { class: 'cg-clue-mark', 'aria-hidden': 'true' }),
        h('span', { class: 'cg-clue-text' }, clueText(t, s, clue))
      );
      clueList.appendChild(h('li', {}, button));
      return button;
    });

    cellEls = [];
    active = [];
    pairs(s.kinds.length).forEach(([a, b], block) => {
      const captionId = `cg-block-${block}`;
      const caption = t('block.label', { rows: categoryLabel(t, s, a), columns: categoryLabel(t, s, b) });
      const matrix = h('div', { class: 'cg-matrix', role: 'grid', 'aria-labelledby': captionId, 'data-testid': `block-${a}-${b}` });
      matrix.style.setProperty('--cg-n', String(n));
      const head = h('div', { class: 'cg-row', role: 'row' }, h('div', { class: 'cg-corner', role: 'presentation' }));
      for (let j = 0; j < n; j++) {
        head.appendChild(h('div', { class: 'cg-colhead', role: 'columnheader' }, h('span', {}, itemLabel(t, s, b, j))));
      }
      matrix.appendChild(head);
      for (let i = 0; i < n; i++) {
        const row = h('div', { class: 'cg-row', role: 'row' }, h('div', { class: 'cg-rowhead', role: 'rowheader' }, itemLabel(t, s, a, i)));
        for (let j = 0; j < n; j++) {
          const k = cellEls.length;
          const cell = h('div', {
            class: 'cg-cell',
            role: 'gridcell',
            tabindex: -1,
            'data-cell': k,
            'data-block': block,
            'data-row': i,
            'data-col': j,
            'data-testid': `cell-${a}-${b}-${i}-${j}`
          }, h('span', { class: 'cg-symbol', 'aria-hidden': 'true' }));
          cellEls.push(cell);
          row.appendChild(cell);
        }
        matrix.appendChild(row);
      }
      active.push(block * n * n);
      blocks.appendChild(h('div', { class: 'cg-block' }, h('h3', { class: 'cg-caption', id: captionId }, caption), matrix));
      disposers.push(gridKeyboard(matrix, n));
    });
  };

  /** Syncs every dynamic attribute with `state` (no structural changes, so focus is kept). */
  const update = () => {
    const solved = isSolved(state);
    const n = state.size;
    const focus = focused >= 0 ? cellPosition(state.kinds.length, n, focused) : null;
    blocks.classList.toggle('is-solved', solved);
    cellEls.forEach((cell, k) => {
      const value = state.marks[k] ?? MARK_UNKNOWN;
      const name = MARK_NAMES[value] ?? 'unknown';
      cell.dataset.mark = name;
      (cell.firstChild as HTMLElement).textContent = MARK_SYMBOLS[value] ?? '';
      cell.setAttribute('aria-label', cellLabel(k));
      const block = Number(cell.dataset.block);
      cell.tabIndex = active[block] === k ? 0 : -1;
      const peer = focus !== null && focus.block === block && k !== focused &&
        (focus.i === Number(cell.dataset.row) || focus.j === Number(cell.dataset.col));
      cell.classList.toggle('is-peer', peer && !solved);
    });
    blocks.querySelectorAll('[role="grid"]').forEach((grid) => grid.setAttribute('aria-readonly', String(solved)));

    clueEls.forEach((button, index) => {
      const used = state.used[index] === true;
      button.dataset.used = String(used);
      button.setAttribute('aria-pressed', String(used));
      (button.firstChild as HTMLElement).textContent = used ? '✓' : '';
    });

    const total = pairs(state.kinds.length).length * n;
    status.textContent = solved ? t('status.solved', { moves: state.moves }) : t('status.progress', { count: confirmedCount(state.marks), total });
    status.dataset.status = solved ? 'solved' : 'playing';

    autoBox.checked = state.autoExclude;
    undoButton.disabled = solved || state.history.length === 0;
    controls.hidden = solved;
    help.hidden = solved;
    const result = state.lastCheck === null ? '' : state.lastCheck === 0 ? t('check.none') : t('check.result', { count: state.lastCheck });
    checkResult.textContent = result;
    checkResult.hidden = result === '';
  };

  // --- Input ---------------------------------------------------------------------------------

  const cellOf = (target: EventTarget | null): number | null => {
    const el = target instanceof Element ? target.closest<HTMLElement>('[data-cell]') : null;
    if (!el || !blocks.contains(el)) return null;
    const k = Number(el.dataset.cell);
    return Number.isInteger(k) ? k : null;
  };

  const activate = (k: number) => {
    const block = Math.floor(k / (state.size * state.size));
    active[block] = k;
  };

  const onClick = (event: MouseEvent) => {
    const k = cellOf(event.target);
    if (k === null) return;
    activate(k);
    cellEls[k]?.focus();
    mark(k);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const k = cellOf(event.target);
    if (k === null) return;
    if (event.key === ' ' || event.key === 'Enter') mark(k);
    else if (event.key === 'Delete' || event.key === 'Backspace') mark(k, MARK_UNKNOWN);
    else return;
    event.preventDefault();
  };

  const onFocusIn = (event: FocusEvent) => {
    const k = cellOf(event.target);
    if (k === null) return;
    activate(k);
    focused = k;
    update();
  };

  const onFocusOut = (event: FocusEvent) => {
    if (cellOf(event.relatedTarget) !== null) return;
    focused = -1;
    update();
  };

  blocks.addEventListener('click', onClick);
  blocks.addEventListener('keydown', onKeyDown);
  blocks.addEventListener('focusin', onFocusIn);
  blocks.addEventListener('focusout', onFocusOut);

  // --- GameInstance --------------------------------------------------------------------------

  const mount = () => {
    focused = -1;
    build();
    update();
    if (!container.isConnected) context.root.appendChild(container);
  };

  return {
    newGame(options: NewGameOptions) {
      state = createInitialState(options.seed, toDifficulty(options.difficulty), state.autoExclude);
      mount();
    },
    restore(saved: ConstraintGridState) {
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
      state = createInitialState(state.seed, state.difficulty, state.autoExclude);
      mount();
      context.requestSave();
    },
    dispose() {
      for (const dispose of disposers) dispose();
      disposers = [];
      blocks.removeEventListener('click', onClick);
      blocks.removeEventListener('keydown', onKeyDown);
      blocks.removeEventListener('focusin', onFocusIn);
      blocks.removeEventListener('focusout', onFocusOut);
      clear(context.root);
    }
  };
}
