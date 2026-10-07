import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, clear, gridKeyboard, h } from '@wp/ui';
import {
  DIRECTIONS,
  E,
  N,
  S,
  W,
  canUndo,
  countLoose,
  createInitialState,
  degree,
  isSolved,
  kindOf,
  looseEnds,
  poweredSet,
  rotateTile,
  rotationOf,
  toDifficulty,
  toggleLock,
  undo,
  type CircuitState,
  type Direction
} from './rules';
import './styles.css';

/** Touch/pen hold duration that turns a tile counter-clockwise instead. */
const LONG_PRESS_MS = 450;
const SVG_NS = 'http://www.w3.org/2000/svg';

const DIR_KEYS: Readonly<Record<Direction, string>> = { [N]: 'n', [E]: 'e', [S]: 's', [W]: 'w' };
/** Edge point of each wire stub and the loose-end ring position (viewBox 0–100). */
const EDGE: Readonly<Record<Direction, readonly [number, number]>> = { [N]: [50, 0], [E]: [100, 50], [S]: [50, 100], [W]: [0, 50] };
const RING: Readonly<Record<Direction, readonly [number, number]>> = { [N]: [50, 14], [E]: [86, 50], [S]: [50, 86], [W]: [14, 50] };

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  return el;
}

/** Draws one tile: wires, centre symbol, loose-end rings and lock marker. */
function drawTile(mask: number, powered: boolean, loose: number, isSource: boolean, locked: boolean): SVGSVGElement {
  const root = svg('svg', { viewBox: '0 0 100 100', class: 'cp-svg', 'aria-hidden': 'true', focusable: 'false' });
  const wireClass = powered ? 'cp-wire is-on' : 'cp-wire';
  for (const d of DIRECTIONS) {
    if (!(mask & d)) continue;
    const [x, y] = EDGE[d];
    if (powered) root.appendChild(svg('line', { x1: 50, y1: 50, x2: x, y2: y, class: 'cp-glow' }));
    root.appendChild(svg('line', { x1: 50, y1: 50, x2: x, y2: y, class: wireClass }));
  }
  if (isSource) {
    root.appendChild(svg('rect', { x: 28, y: 28, width: 44, height: 44, rx: 6, class: 'cp-source' }));
    root.appendChild(svg('path', { d: 'M50 37 V63 M37 50 H63', class: 'cp-source-mark' }));
  } else if (degree(mask) === 1) {
    root.appendChild(svg('circle', { cx: 50, cy: 50, r: 16, class: powered ? 'cp-lamp is-on' : 'cp-lamp' }));
    if (powered) root.appendChild(svg('path', { d: 'M41 50 L48 57 L60 43', class: 'cp-lamp-mark' }));
  } else {
    root.appendChild(svg('circle', { cx: 50, cy: 50, r: powered ? 9 : 6, class: powered ? 'cp-hub is-on' : 'cp-hub' }));
  }
  for (const d of DIRECTIONS) {
    if (!(loose & d)) continue;
    const [cx, cy] = RING[d];
    root.appendChild(svg('circle', { cx, cy, r: 10, class: 'cp-loose' }));
  }
  if (locked) root.appendChild(svg('path', { d: 'M0 0 H30 L0 30 Z', class: 'cp-lock' }));
  return root;
}

export function createCircuit(context: GameContext): GameInstance<CircuitState> {
  const { t } = context;
  let state = createInitialState(0);
  let paused = false;
  let focusIndex = 0;
  let tileEls: HTMLElement[] = [];
  let disposeKeyboard: () => void = () => undefined;
  let pressTimer: ReturnType<typeof setTimeout> | undefined;
  let pressStart = { x: 0, y: 0 };
  let pressHandled = false;

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'cp-live' });
  const status = h('p', { class: 'wp-status cp-status', 'data-testid': 'cp-status' });
  const board = h('div', { class: 'cp-board', role: 'grid', dir: 'ltr', 'data-testid': 'cp-board' });
  const undoButton = h('button', { type: 'button', 'data-testid': 'cp-undo', onclick: () => runUndo() }, t('common.undo'));
  const controls = h('div', { class: 'wp-row cp-controls' }, undoButton);
  const help = h('div', { class: 'cp-help wp-muted' }, h('p', {}, t('legend.help')), h('p', {}, t('touch.help')), h('p', {}, t('keys.help')));
  const container = h('div', { class: 'wp-circuit-puzzle', dir: t.direction, lang: t.locale }, status, board, controls, help, live);

  // --- Labels --------------------------------------------------------------------------------

  const tileLabel = (i: number, powered: boolean, loose: number) => {
    const mask = state.masks[i] as number;
    const dirs = DIRECTIONS.filter((d) => mask & d)
      .map((d) => t(`dir.${DIR_KEYS[d]}`))
      .join(t('list.separator'));
    const parts = [
      t('tile.label', { row: Math.floor(i / state.size) + 1, col: (i % state.size) + 1, kind: t(`kind.${kindOf(mask) ?? 'end'}`), dirs })
    ];
    if (i === state.source) parts.push(t('tile.source'));
    parts.push(t(powered ? 'tile.powered' : 'tile.unpowered'));
    if (loose) parts.push(t('tile.loose', { n: degree(loose) }));
    if (state.locked[i]) parts.push(t('tile.locked'));
    return parts.join(t('part.separator'));
  };

  // --- State changes -------------------------------------------------------------------------

  const commit = (next: CircuitState, announceIndex?: number) => {
    if (next === state) return;
    const wasSolved = isSolved(state);
    state = next;
    update();
    context.requestSave();
    if (!wasSolved && isSolved(state)) {
      announce(live, t('status.solved', { moves: state.moves }));
      context.finished({ outcome: 'completed', stats: { moves: state.moves } });
    } else if (announceIndex !== undefined) {
      announce(live, tileEls[announceIndex]?.getAttribute('aria-label') ?? '');
    }
  };

  const turn = (index: number, clockwise: boolean) => {
    if (paused) return;
    focusIndex = index;
    commit(rotateTile(state, index, clockwise), index);
  };

  const lock = (index: number) => {
    if (paused) return;
    focusIndex = index;
    commit(toggleLock(state, index), index);
  };

  const runUndo = () => {
    if (paused) return;
    const last = state.history[state.history.length - 1];
    commit(undo(state), last === undefined ? undefined : Math.abs(last) - 1);
  };

  // --- Rendering -----------------------------------------------------------------------------

  const build = () => {
    disposeKeyboard();
    clear(board);
    const n = state.size;
    focusIndex = Math.min(focusIndex, n * n - 1);
    board.style.setProperty('--cp-n', String(n));
    board.dataset.size = String(n);
    board.setAttribute('aria-label', t('board.label', { size: n }));
    tileEls = [];
    for (let r = 0; r < n; r++) {
      const row = h('div', { class: 'cp-row', role: 'row' });
      for (let c = 0; c < n; c++) {
        const i = r * n + c;
        const tile = h('div', { class: 'cp-tile', role: 'gridcell', 'data-cell': i, 'data-testid': `tile-${r}-${c}`, tabindex: -1 });
        tileEls.push(tile);
        row.appendChild(tile);
      }
      board.appendChild(row);
    }
    disposeKeyboard = gridKeyboard(board, n);
  };

  const update = () => {
    const solved = isSolved(state);
    const powered = poweredSet(state.masks, state.size, state.source);
    const loose = looseEnds(state.masks, state.size);
    board.classList.toggle('is-solved', solved);
    board.setAttribute('aria-readonly', solved ? 'true' : 'false');
    tileEls.forEach((tile, i) => {
      const mask = state.masks[i] as number;
      const on = powered[i] === true;
      const ends = loose[i] ?? 0;
      tile.dataset.type = kindOf(mask) ?? 'end';
      tile.dataset.rot = String(rotationOf(mask));
      tile.dataset.mask = String(mask);
      tile.dataset.powered = String(on);
      tile.dataset.loose = String(degree(ends));
      tile.dataset.locked = String(state.locked[i] === true);
      tile.classList.toggle('is-on', on);
      tile.classList.toggle('is-source', i === state.source);
      tile.tabIndex = i === focusIndex ? 0 : -1;
      tile.setAttribute('aria-label', tileLabel(i, on, ends));
      clear(tile);
      tile.appendChild(drawTile(mask, on, ends, i === state.source, state.locked[i] === true));
    });
    const poweredCount = powered.filter(Boolean).length;
    status.textContent = solved
      ? t('status.solved', { moves: state.moves })
      : t('status.progress', { powered: poweredCount, total: state.masks.length, loose: countLoose(state.masks, state.size), moves: state.moves });
    status.dataset.status = solved ? 'solved' : 'playing';
    undoButton.disabled = !canUndo(state);
    controls.hidden = solved;
    help.hidden = solved;
  };

  // --- Input ---------------------------------------------------------------------------------

  const tileIndexOf = (target: EventTarget | null): number | null => {
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
    const i = tileIndexOf(event.target);
    if (i === null) return;
    if (pressHandled) {
      pressHandled = false;
      return;
    }
    turn(i, true);
  };

  const onContextMenu = (event: MouseEvent) => {
    const i = tileIndexOf(event.target);
    if (i === null) return;
    event.preventDefault();
    if (pressHandled) return;
    turn(i, false);
  };

  const onPointerDown = (event: PointerEvent) => {
    pressHandled = false;
    cancelPress();
    if (event.pointerType === 'mouse') return;
    const i = tileIndexOf(event.target);
    if (i === null) return;
    pressStart = { x: event.clientX, y: event.clientY };
    // Purely an input gesture: state only changes when the hold completes.
    pressTimer = setTimeout(() => {
      pressTimer = undefined;
      pressHandled = true;
      turn(i, false);
    }, LONG_PRESS_MS);
  };

  function cancelOnMove(event: Event) {
    const { clientX = 0, clientY = 0 } = event as PointerEvent;
    if (event.type === 'pointermove' && Math.hypot(clientX - pressStart.x, clientY - pressStart.y) < 10) return;
    cancelPress();
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const i = tileIndexOf(event.target);
    if (i === null) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      turn(i, !event.shiftKey);
    } else if (event.key === 'l' || event.key === 'L') {
      event.preventDefault();
      lock(i);
    }
  };

  const onFocusIn = (event: FocusEvent) => {
    const i = tileIndexOf(event.target);
    if (i !== null) focusIndex = i;
  };

  const pointerEnds = ['pointerup', 'pointercancel', 'pointerleave', 'pointermove'] as const;
  board.addEventListener('click', onClick);
  board.addEventListener('contextmenu', onContextMenu);
  board.addEventListener('pointerdown', onPointerDown);
  for (const type of pointerEnds) board.addEventListener(type, cancelOnMove);
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
    restore(saved: CircuitState) {
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
      for (const type of pointerEnds) board.removeEventListener(type, cancelOnMove);
      board.removeEventListener('keydown', onKeyDown);
      board.removeEventListener('focusin', onFocusIn);
      clear(context.root);
    }
  };
}
