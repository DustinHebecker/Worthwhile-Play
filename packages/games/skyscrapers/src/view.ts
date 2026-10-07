import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, clear, gridKeyboard, h } from '@wp/ui';
import {
  check,
  clearCell,
  createInitialState,
  enterDigit,
  filledCount,
  isSolved,
  markedCells,
  maskDigits,
  setPencil,
  toDifficulty,
  type Side,
  type SkyscrapersState
} from './rules';
import './styles.css';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createSkyscrapers(context: GameContext): GameInstance<SkyscrapersState> {
  const { t } = context;
  let state = createInitialState(0);
  let paused = false;
  /** Selected cell (view-only; holds the roving tabindex). */
  let selected = 0;
  let cellEls: HTMLElement[] = [];
  let padButtons: HTMLButtonElement[] = [];
  let disposeKeyboard: () => void = () => undefined;

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'sk-live' });
  const status = h('p', { class: 'wp-status sk-status', 'data-testid': 'sk-status' });
  // The board is always left-to-right so that "left"/"right" clues stay literally true.
  const board = h('div', { class: 'sk-board', role: 'grid', dir: 'ltr', 'data-testid': 'sk-board' });
  const pad = h('div', { class: 'sk-pad', role: 'group', 'aria-label': t('pad.label'), 'data-testid': 'sk-pad' });
  const notesButton = h('button', { type: 'button', class: 'sk-notes-toggle', 'data-testid': 'sk-notes', onclick: () => togglePencil() },
    h('span', { class: 'sk-notes-icon', 'aria-hidden': 'true' }, '✎'),
    t('action.notes')
  );
  const eraseButton = h('button', { type: 'button', 'data-testid': 'sk-erase', onclick: () => erase(selected) },
    h('span', { 'aria-hidden': 'true' }, '⌫'),
    t('action.erase')
  );
  const checkButton = h('button', { type: 'button', 'data-testid': 'sk-check', 'aria-describedby': 'sk-check-help', onclick: () => runCheck() }, t('common.check'));
  const checkResult = h('p', { class: 'sk-check-result', 'data-testid': 'sk-check-result' });
  const keysHelp = h('p', {});
  const help = h('div', { class: 'sk-help wp-muted' },
    h('p', {}, t('notes.help')),
    h('p', { id: 'sk-check-help' }, t('check.help')),
    keysHelp
  );
  const controls = h('div', { class: 'sk-controls' }, pad, h('div', { class: 'wp-row sk-actions' }, notesButton, eraseButton, checkButton), checkResult);
  const container = h('div', { class: 'wp-skyscrapers', dir: t.direction, lang: t.locale }, status, h('div', { class: 'sk-scroll' }, board), controls, help, live);

  // --- Labels --------------------------------------------------------------------------------

  const cellLabel = (i: number, s: SkyscrapersState = state, repeated = markedCells(s)) => {
    const row = Math.floor(i / s.size) + 1;
    const col = (i % s.size) + 1;
    const value = s.cells[i] as number;
    if (s.givens[i] !== 0) return t('cell.given', { row, col, value });
    if (value !== 0) return t(repeated.includes(i) ? 'cell.repeated' : 'cell.value', { row, col, value });
    const notes = maskDigits(s.notes[i] as number);
    return notes.length > 0 ? t('cell.notes', { row, col, notes: notes.join(', ') }) : t('cell.empty', { row, col });
  };

  // --- State changes -------------------------------------------------------------------------

  const commit = (next: SkyscrapersState, message?: string) => {
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

  const input = (index: number, digit: number) => {
    if (paused) return;
    const next = enterDigit(state, index, digit);
    commit(next, cellLabel(index, next));
  };

  const erase = (index: number) => {
    if (paused) return;
    const next = clearCell(state, index);
    commit(next, cellLabel(index, next));
  };

  const togglePencil = () => {
    if (paused) return;
    commit(setPencil(state, !state.pencil));
  };

  const runCheck = () => {
    if (paused) return;
    if (commit(check(state))) announce(live, checkResult.textContent ?? '');
  };

  const select = (index: number, focus: boolean) => {
    if (index < 0 || index >= cellEls.length) return;
    selected = index;
    update();
    if (focus) cellEls[index]?.focus();
  };

  // --- Rendering -----------------------------------------------------------------------------

  const clueEl = (side: Side, i: number, role: string) => {
    const value = state.clues[side][i] as number;
    const n = i + 1;
    return h('div', {
      class: `sk-clue sk-clue-${side}`,
      role,
      'data-testid': `clue-${side}-${i}`,
      'data-value': value,
      'aria-label': value === 0 ? null : t(`clue.${side}`, { n, count: value }),
      'aria-hidden': value === 0 ? 'true' : null
    }, value === 0 ? '' : String(value));
  };

  const corner = () => h('div', { class: 'sk-corner', role: 'presentation', 'aria-hidden': 'true' });

  /** Builds board skeleton and number pad for the current puzzle. */
  const build = () => {
    disposeKeyboard();
    clear(board);
    clear(pad);
    const n = state.size;
    selected = Math.min(selected, n * n - 1);
    board.style.setProperty('--sk-n', String(n));
    board.dataset.size = String(n);
    board.setAttribute('aria-label', t('board.label', { size: n }));
    cellEls = [];

    const edgeRow = (side: 'top' | 'bottom') => {
      const row = h('div', { class: 'sk-row', role: 'row' }, corner());
      for (let c = 0; c < n; c++) row.appendChild(clueEl(side, c, 'columnheader'));
      row.appendChild(corner());
      return row;
    };

    board.appendChild(edgeRow('top'));
    for (let r = 0; r < n; r++) {
      const row = h('div', { class: 'sk-row', role: 'row' }, clueEl('left', r, 'rowheader'));
      for (let c = 0; c < n; c++) {
        const i = r * n + c;
        const notes = h('span', { class: 'sk-cell-notes', 'aria-hidden': 'true' });
        for (let d = 1; d <= n; d++) notes.appendChild(h('span', { class: 'sk-note', 'data-digit': d }));
        const cell = h('div', { class: c === n - 1 ? 'sk-cell sk-last-col' : 'sk-cell', role: 'gridcell', 'data-cell': i, 'data-testid': `cell-${r}-${c}`, tabindex: -1 },
          h('span', { class: 'sk-value', 'aria-hidden': 'true' }),
          notes,
          h('span', { class: 'sk-flag', 'aria-hidden': 'true' }, '!')
        );
        cellEls.push(cell);
        row.appendChild(cell);
      }
      row.appendChild(clueEl('right', r, 'rowheader'));
      board.appendChild(row);
    }
    board.appendChild(edgeRow('bottom'));

    padButtons = [];
    for (let d = 1; d <= n; d++) {
      const button = h('button', { type: 'button', class: 'sk-pad-button', 'data-testid': `sk-pad-${d}`, onclick: () => input(selected, d) }, String(d));
      padButtons.push(button);
      pad.appendChild(button);
    }
    keysHelp.textContent = t('keys.help', { max: n });
    disposeKeyboard = gridKeyboard(board, n);
  };

  /** Syncs every dynamic attribute with `state` (no structural changes, so focus is kept). */
  const update = () => {
    const n = state.size;
    const solved = isSolved(state);
    const repeated = markedCells(state);
    const selRow = Math.floor(selected / n);
    const selCol = selected % n;
    board.classList.toggle('is-solved', solved);
    board.setAttribute('aria-readonly', solved ? 'true' : 'false');
    cellEls.forEach((cell, i) => {
      const value = state.cells[i] as number;
      const given = state.givens[i] !== 0;
      const isRepeated = repeated.includes(i);
      cell.dataset.value = String(value);
      cell.dataset.given = String(given);
      cell.dataset.notes = maskDigits(state.notes[i] as number).join(',');
      cell.classList.toggle('is-given', given);
      cell.classList.toggle('is-repeated', isRepeated);
      cell.classList.toggle('is-selected', i === selected && !solved);
      cell.classList.toggle('is-peer', i !== selected && !solved && (Math.floor(i / n) === selRow || i % n === selCol));
      cell.setAttribute('aria-selected', String(i === selected));
      cell.setAttribute('aria-label', cellLabel(i, state, repeated));
      cell.tabIndex = i === selected ? 0 : -1;
      const [valueEl, notesEl] = [cell.children[0] as HTMLElement, cell.children[1] as HTMLElement];
      valueEl.textContent = value === 0 ? '' : String(value);
      notesEl.hidden = value !== 0;
      [...notesEl.children].forEach((note, k) => {
        note.textContent = (state.notes[i] as number) & (1 << (k + 1)) ? String(k + 1) : '';
      });
    });

    const filled = filledCount(state.cells);
    status.textContent = solved ? t('status.solved', { moves: state.moves }) : t('status.progress', { filled, total: n * n });
    status.dataset.status = solved ? 'solved' : 'playing';

    notesButton.setAttribute('aria-pressed', String(state.pencil));
    pad.classList.toggle('is-notes', state.pencil);
    padButtons.forEach((button, k) => button.setAttribute('aria-label', t(state.pencil ? 'pad.note' : 'pad.enter', { digit: k + 1 })));
    controls.hidden = solved;
    help.hidden = solved;
    const result = state.lastCheck === null
      ? ''
      : state.lastCheck.wrong === 0 && state.lastCheck.repeated === 0
        ? t('check.none')
        : t('check.result', { wrong: state.lastCheck.wrong, repeated: state.lastCheck.repeated });
    checkResult.textContent = result;
    checkResult.hidden = result === '';
  };

  // --- Input ---------------------------------------------------------------------------------

  const cellIndexOf = (target: EventTarget | null): number | null => {
    const el = target instanceof Element ? target.closest<HTMLElement>('[data-cell]') : null;
    if (!el || !board.contains(el)) return null;
    const i = Number(el.dataset.cell);
    return Number.isInteger(i) ? i : null;
  };

  const onClick = (event: MouseEvent) => {
    const i = cellIndexOf(event.target);
    if (i !== null) select(i, true);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const i = cellIndexOf(event.target);
    if (i === null) return;
    const digit = /^[0-9]$/.test(event.key) ? Number(event.key) : NaN;
    if (digit >= 1 && digit <= state.size) input(i, digit);
    else if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') erase(i);
    else if (event.key === 'n' || event.key === 'N') togglePencil();
    else return;
    event.preventDefault();
  };

  const onFocusIn = (event: FocusEvent) => {
    const i = cellIndexOf(event.target);
    if (i !== null && i !== selected) select(i, false);
  };

  board.addEventListener('click', onClick);
  board.addEventListener('keydown', onKeyDown);
  board.addEventListener('focusin', onFocusIn);

  // --- GameInstance --------------------------------------------------------------------------

  const firstOpen = () => Math.max(0, state.givens.findIndex((g) => g === 0));

  const mount = () => {
    selected = firstOpen();
    build();
    update();
    if (!container.isConnected) context.root.appendChild(container);
  };

  return {
    newGame(options: NewGameOptions) {
      state = createInitialState(options.seed, toDifficulty(options.difficulty));
      mount();
    },
    restore(saved: SkyscrapersState) {
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
      disposeKeyboard();
      board.removeEventListener('click', onClick);
      board.removeEventListener('keydown', onKeyDown);
      board.removeEventListener('focusin', onFocusIn);
      clear(context.root);
    }
  };
}

