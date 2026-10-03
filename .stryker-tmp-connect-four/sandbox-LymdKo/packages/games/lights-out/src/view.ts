// @ts-nocheck
import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, clear, gridKeyboard, h } from '@wp/ui';
import {
  canUndo,
  countOn,
  createInitialState,
  currentBoard,
  isFinished,
  minPresses,
  pressCell,
  requestHint,
  restartState,
  stateSize,
  toDifficulty,
  undo,
  type LightsOutState
} from './rules';
import './styles.css';

const SVG_NS = 'http://www.w3.org/2000/svg';

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  return el;
}

/** Lit bulb = filled disc with rays; unlit = hollow ring. Shape, not colour, carries the state. */
function bulb(on: boolean): SVGSVGElement {
  const root = svg('svg', { viewBox: '0 0 24 24', class: `lo-bulb ${on ? 'lo-bulb-on' : 'lo-bulb-off'}`, 'aria-hidden': 'true', focusable: 'false' });
  root.append(svg('circle', { cx: 12, cy: 12, r: on ? 5.5 : 5 }));
  if (on) {
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      const [c, s] = [Math.cos(a), Math.sin(a)];
      root.append(svg('line', { x1: (12 + 7.5 * c).toFixed(2), y1: (12 + 7.5 * s).toFixed(2), x2: (12 + 10.5 * c).toFixed(2), y2: (12 + 10.5 * s).toFixed(2) }));
    }
  }
  return root;
}

const cloneState = (state: LightsOutState): LightsOutState => ({ ...state, start: [...state.start], presses: [...state.presses] });

export function createLightsOut(context: GameContext): GameInstance<LightsOutState> {
  const { t, root } = context;
  let state = createInitialState(0);
  let paused = false;
  let cells: HTMLButtonElement[] = [];
  let builtSize = 0;
  let disposeKeyboard: () => void = () => {};

  const moves = h('span', { 'data-testid': 'moves' });
  const lightsOn = h('span', { 'data-testid': 'lights-on' });
  const hintsUsed = h('span', { 'data-testid': 'hints-used' });
  const progress = h('p', { class: 'lo-progress' }, moves, lightsOn, hintsUsed);
  const status = h('p', { class: 'wp-status lo-status', 'data-testid': 'status', hidden: true });
  const legend = h('p', { class: 'lo-legend wp-muted', 'aria-hidden': 'true' },
    h('span', { class: 'lo-legend-item' }, h('span', { class: 'lo-swatch is-on' }, bulb(true)), t('legend.on')),
    h('span', { class: 'lo-legend-item' }, h('span', { class: 'lo-swatch' }, bulb(false)), t('legend.off'))
  );
  const board = h('div', { class: 'lo-board', role: 'group', 'aria-label': t('board'), dir: 'ltr', 'data-testid': 'board' });
  const undoButton = h('button', { type: 'button', 'data-testid': 'undo', onclick: () => onUndo() }, t('common.undo'));
  const hintButton = h('button', { type: 'button', 'data-testid': 'hint', 'aria-describedby': 'lo-hint-help', onclick: () => onHint() }, t('common.hint'));
  const hintText = h('p', { class: 'lo-hint-text', 'data-testid': 'hint-text', hidden: true });
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'announcer' });

  const container = h(
    'div',
    { class: `wp-lights-out${context.reducedMotion ? ' lo-reduced' : ''}`, dir: t.direction, lang: t.locale },
    progress,
    status,
    legend,
    board,
    h('div', { class: 'wp-row lo-actions' }, undoButton, hintButton),
    hintText,
    h('p', { class: 'lo-help wp-muted', id: 'lo-hint-help' }, t('hint.help')),
    h('p', { class: 'lo-help wp-muted' }, t('keys.help')),
    live
  );

  const position = (index: number) => ({ row: Math.floor(index / builtSize) + 1, col: (index % builtSize) + 1 });

  /** (Re)creates the cell buttons when the grid size changes; keeps them (and focus) otherwise. */
  const buildBoard = (size: number) => {
    if (size === builtSize) return;
    disposeKeyboard();
    clear(board);
    builtSize = size;
    board.style.setProperty('--lo-n', String(size));
    cells = Array.from({ length: size * size }, (_, i) =>
      h('button', {
        type: 'button',
        class: 'lo-cell',
        'data-cell': '',
        'data-testid': `cell-${Math.floor(i / size)}-${i % size}`,
        tabindex: i === 0 ? 0 : -1,
        onclick: () => onCell(i)
      })
    );
    board.append(...cells);
    disposeKeyboard = gridKeyboard(board, size);
  };

  const render = () => {
    buildBoard(stateSize(state));
    const lights = currentBoard(state);
    const solved = isFinished(state);
    cells.forEach((cell, i) => {
      const on = lights[i] === 1;
      if (cell.dataset.on !== String(on)) {
        cell.dataset.on = String(on);
        cell.replaceChildren(bulb(on));
      }
      const hinted = state.hint === i;
      cell.dataset.hint = String(hinted);
      cell.classList.toggle('is-hint', hinted);
      const label = t(on ? 'cell.on' : 'cell.off', position(i));
      cell.setAttribute('aria-label', hinted ? t('cell.suggested', { cell: label }) : label);
      cell.setAttribute('aria-disabled', String(solved));
    });

    moves.textContent = t('status.moves', { n: state.presses.length });
    lightsOn.textContent = t('status.lightsOn', { n: countOn(lights) });
    hintsUsed.textContent = t('status.hints', { n: state.hints });
    moves.dataset.value = String(state.presses.length);
    container.dataset.solved = String(solved);

    status.hidden = !solved;
    status.textContent = solved ? solvedText() : '';
    progress.hidden = solved;

    if (state.hint !== null) {
      hintText.hidden = false;
      hintText.textContent = t('hint.show', position(state.hint));
    } else {
      hintText.hidden = true;
      hintText.textContent = '';
    }
    undoButton.disabled = !canUndo(state);
    hintButton.disabled = solved;
  };

  const minimum = () => minPresses(state.start, stateSize(state)) ?? 0;
  const solvedText = () => t('status.solved', { moves: state.presses.length, minimum: minimum() });

  const commit = (next: LightsOutState, message: string) => {
    if (next === state) return;
    state = next;
    render();
    context.requestSave();
    announce(live, message);
  };

  const onCell = (index: number) => {
    if (paused) return;
    const next = pressCell(state, index);
    if (next === state) return;
    for (const cell of cells) cell.tabIndex = -1;
    if (cells[index]) cells[index].tabIndex = 0;
    const on = countOn(currentBoard(next));
    const pressed = t('announce.pressed', { ...position(index), on });
    commit(next, isFinished(next) ? `${pressed} ${t('status.solved', { moves: next.presses.length, minimum: minimum() })}` : pressed);
    if (isFinished(state)) context.finished({ outcome: 'won', stats: { moves: state.presses.length, hints: state.hints, minimum: minimum() } });
  };

  const onUndo = () => {
    if (paused) return;
    const next = undo(state);
    commit(next, t('announce.undone', { on: countOn(currentBoard(next)) }));
  };

  const onHint = () => {
    if (paused) return;
    const next = requestHint(state);
    if (next === state) {
      // A hint is already showing: repeat it without counting it again.
      if (state.hint !== null) announce(live, t('hint.show', position(state.hint)));
      return;
    }
    commit(next, t('hint.show', position(next.hint ?? 0)));
  };

  const show = (next: LightsOutState) => {
    state = next;
    if (!container.isConnected) root.appendChild(container);
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      show(createInitialState(options.seed, toDifficulty(options.difficulty)));
    },
    restore(saved: LightsOutState) {
      show(cloneState(saved));
    },
    serialize: () => cloneState(state),
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    reset() {
      show(restartState(state));
      context.requestSave();
    },
    dispose() {
      disposeKeyboard();
      clear(root);
    }
  };
}
