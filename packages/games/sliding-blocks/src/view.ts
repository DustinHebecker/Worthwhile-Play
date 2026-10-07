import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import {
  SIZE,
  canRestart,
  canUndo,
  createInitialState,
  deltaToCell,
  move,
  placeAt,
  progressOf,
  resetState,
  restart,
  slideRange,
  toDifficulty,
  undo,
  type Block,
  type Orientation,
  type Positions,
  type SlidingBlocksState
} from './rules';
import './styles.css';

type Direction = 'up' | 'down' | 'left' | 'right';

const DIRECTIONS: readonly { dir: Direction; key: string; arrow: string; orient: Orientation; delta: number }[] = [
  { dir: 'up', key: 'slide.up', arrow: '▲', orient: 'v', delta: -1 },
  { dir: 'left', key: 'slide.left', arrow: '◀', orient: 'h', delta: -1 },
  { dir: 'right', key: 'slide.right', arrow: '▶', orient: 'h', delta: 1 },
  { dir: 'down', key: 'slide.down', arrow: '▼', orient: 'v', delta: 1 }
];

const KEY_DIRECTION: Readonly<Record<string, Direction>> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };

/** Pointer travel (px) after which a press on a block counts as a drag rather than a tap. */
const DRAG_THRESHOLD = 6;

const cloneState = (state: SlidingBlocksState): SlidingBlocksState => ({
  seed: state.seed,
  difficulty: state.difficulty,
  puzzle: { blocks: state.puzzle.blocks.map((b) => ({ ...b })), optimum: state.puzzle.optimum },
  history: [...state.history]
});

interface Drag {
  id: number;
  pointerId: number;
  startX: number;
  startY: number;
  cell: number;
  min: number;
  max: number;
  offset: number;
  moved: boolean;
}

export function createSlidingBlocks(context: GameContext): GameInstance<SlidingBlocksState> {
  const { t, root } = context;
  let state = createInitialState(0);
  let paused = false;
  /** Selected block (view-only, not saved): the one taps, arrow keys and the slide buttons move. */
  let selected = -1;
  /** The block holding the board's single tab stop (roving tabindex). */
  let focusId = 0;
  let blockEls: HTMLButtonElement[] = [];
  let cellEls: HTMLElement[] = [];
  let drag: Drag | null = null;
  let suppressClick = false;

  const goal = h('p', { class: 'sb-goal' }, t('goal'));
  const moves = h('p', { class: 'sb-moves', 'data-testid': 'moves' });
  const status = h('p', { class: 'wp-status sb-status', 'data-testid': 'status', hidden: true });
  const exit = h('div', { class: 'sb-exit', role: 'img', 'aria-label': t('exit'), 'data-testid': 'sb-exit' }, h('span', { 'aria-hidden': 'true' }, '→'));
  const board = h('div', {
    class: 'sb-board',
    role: 'group',
    dir: 'ltr',
    'aria-label': t('board'),
    'aria-describedby': 'sb-help-keys',
    'data-testid': 'sb-board',
    onclick: (event: Event) => onBoardClick(event),
    onkeydown: (event: Event) => onBoardKey(event as KeyboardEvent),
    onpointerdown: (event: Event) => onPointerDown(event as PointerEvent),
    onpointermove: (event: Event) => onPointerMove(event as PointerEvent),
    onpointerup: (event: Event) => onPointerUp(event as PointerEvent),
    onpointercancel: () => cancelDrag()
  });

  const slideButtons = DIRECTIONS.map(({ dir, key, arrow, orient, delta }) => {
    const button = h('button', {
      type: 'button',
      class: `sb-slide-${dir}`,
      'aria-label': t(key),
      title: t(key),
      'data-testid': `slide-${dir}`,
      onclick: () => onSlideButton(orient, delta)
    }, h('span', { 'aria-hidden': 'true' }, arrow));
    return { button, orient };
  });
  const pad = h('div', { class: 'sb-pad', role: 'group', 'aria-label': t('slide.group'), dir: 'ltr' }, ...slideButtons.map((s) => s.button));
  const undoButton = h('button', { type: 'button', 'data-testid': 'undo', onclick: () => onUndo() }, t('common.undo'));
  const restartButton = h('button', { type: 'button', 'data-testid': 'restart', onclick: () => onRestart() }, t('common.restart'));
  const controls = h('div', { class: 'sb-controls' }, pad, h('div', { class: 'sb-actions' }, undoButton, restartButton));
  const help = h('div', { class: 'sb-help wp-muted' }, h('p', { id: 'sb-help-keys' }, t('help.keys')), h('p', {}, t('help.touch')));
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'announcer' });

  const container = h(
    'div',
    { class: 'wp-sliding-blocks', dir: t.direction, lang: t.locale, onkeydown: (event: Event) => onKey(event as KeyboardEvent) },
    goal,
    moves,
    status,
    board,
    controls,
    help,
    live
  );

  /* ---------- Rendering ---------- */

  const blocks = (): readonly Block[] => state.puzzle.blocks;
  const nameOf = (id: number) => (id === 0 ? t('name.target') : t('name.block', { n: id }));
  const axisOf = (id: number) => t(blocks()[id]?.orient === 'v' ? 'axis.v' : 'axis.h');
  const whereOf = (id: number, positions: Positions) => {
    const block = blocks()[id] as Block;
    const { row, col } = placeAt(block, positions[id] as number);
    return block.orient === 'h'
      ? t('where.h', { row: row + 1, from: col + 1, to: col + block.len })
      : t('where.v', { col: col + 1, from: row + 1, to: row + block.len });
  };

  /** Creates the cells, the exit and one button per block for the current puzzle. */
  const build = () => {
    clear(board);
    cellEls = [];
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        const cell = h('div', { class: 'sb-cell', 'aria-hidden': 'true', 'data-row': row, 'data-col': col, 'data-testid': `cell-${row}-${col}` });
        cell.style.gridArea = `${row + 1} / ${col + 1}`;
        cellEls.push(cell);
      }
    }
    blockEls = blocks().map((block, id) =>
      h('button', {
        type: 'button',
        class: 'sb-block',
        'data-id': id,
        'data-testid': `block-${id}`,
        'data-len': block.len,
        'data-orient': block.orient,
        'data-target': id === 0 ? 'true' : undefined
      }, h('span', { class: 'sb-mark', 'aria-hidden': 'true' }, id === 0 ? '★' : String(id)))
    );
    exit.style.gridRow = String((blocks()[0] as Block).row + 1);
    board.append(...cellEls, exit, ...blockEls);
  };

  const solvedText = (movesMade: number) => t('status.solved', { moves: movesMade, optimum: state.puzzle.optimum });

  const render = () => {
    const progress = progressOf(state);
    const { positions, solved } = progress;
    if (solved) selected = -1;
    blockEls.forEach((el, id) => {
      const block = blocks()[id] as Block;
      const { row, col } = placeAt(block, positions[id] as number);
      el.style.gridArea = block.orient === 'h' ? `${row + 1} / ${col + 1} / span 1 / span ${block.len}` : `${row + 1} / ${col + 1} / span ${block.len} / span 1`;
      el.dataset.row = String(row);
      el.dataset.col = String(col);
      el.tabIndex = id === focusId ? 0 : -1;
      el.setAttribute('aria-pressed', String(id === selected));
      el.setAttribute('aria-label', t('block.label', { name: nameOf(id), axis: axisOf(id), where: whereOf(id, positions) }));
    });
    moves.textContent = t('stats.moves', { n: progress.moves });
    moves.dataset.value = String(progress.moves);
    container.dataset.solved = String(solved);
    status.hidden = !solved;
    status.textContent = solved ? solvedText(progress.moves) : '';
    undoButton.disabled = !canUndo(state);
    restartButton.disabled = !canRestart(state);
    const orient = blocks()[selected]?.orient;
    for (const { button, orient: axis } of slideButtons) button.disabled = solved || orient !== axis;
  };

  /* ---------- State changes ---------- */

  /** Applies a new state; returns false when nothing changed. */
  const commit = (next: SlidingBlocksState, message: () => string): boolean => {
    if (next === state) return false;
    const wasSolved = progressOf(state).solved;
    state = next;
    render();
    context.requestSave();
    const progress = progressOf(state);
    if (progress.solved && !wasSolved) {
      announce(live, `${message()} ${solvedText(progress.moves)}`);
      context.finished({ outcome: 'completed', stats: { moves: progress.moves, optimum: state.puzzle.optimum } });
    } else {
      announce(live, message());
    }
    return true;
  };

  const doMove = (id: number, delta: number) => {
    if (!commit(move(state, id, delta), () => t('announce.moved', { name: nameOf(id), where: whereOf(id, progressOf(state).positions) }))) {
      announce(live, t('announce.blocked'));
    }
  };

  const select = (id: number) => {
    selected = id;
    focusId = id < 0 ? focusId : id;
    render();
  };

  const locked = () => paused || progressOf(state).solved;

  /* ---------- Input ---------- */

  const blockIdOf = (target: EventTarget | null): number => {
    const el = (target as Element | null)?.closest?.<HTMLElement>('.sb-block');
    return el && board.contains(el) ? Number(el.dataset.id) : -1;
  };

  const onBlockActivate = (id: number) => {
    if (selected === id) {
      select(-1);
      announce(live, t('announce.deselected'));
    } else {
      select(id);
      announce(live, t('announce.selected', { name: nameOf(id), axis: axisOf(id) }));
    }
  };

  const onBoardClick = (event: Event) => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    if (locked()) return;
    const id = blockIdOf(event.target);
    if (id >= 0) {
      onBlockActivate(id);
      return;
    }
    const cell = (event.target as Element | null)?.closest?.<HTMLElement>('.sb-cell');
    if (!cell || !board.contains(cell)) return;
    if (selected < 0) {
      announce(live, t('announce.selectFirst'));
      return;
    }
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const block = blocks()[selected] as Block;
    const delta = deltaToCell(blocks(), progressOf(state).positions, selected, row, col);
    if (delta === null) announce(live, t(block.orient === 'h' ? 'announce.offLine.h' : 'announce.offLine.v'));
    else doMove(selected, delta);
  };

  const onSlideButton = (orient: Orientation, delta: number) => {
    if (locked() || blocks()[selected]?.orient !== orient) return;
    doMove(selected, delta);
  };

  const focusBlock = (id: number) => {
    focusId = id;
    for (const [i, el] of blockEls.entries()) el.tabIndex = i === id ? 0 : -1;
    blockEls[id]?.focus();
  };

  /** Nearest block whose centre lies in `dir` from block `from` (spatial arrow-key navigation). */
  const neighbour = (from: number, dir: Direction): number => {
    const { positions } = progressOf(state);
    const centre = (id: number) => {
      const block = blocks()[id] as Block;
      const { row, col } = placeAt(block, positions[id] as number);
      const width = block.orient === 'h' ? block.len : 1;
      const height = block.orient === 'v' ? block.len : 1;
      return { x: col + width / 2, y: row + height / 2 };
    };
    const a = centre(from);
    let best = -1;
    let bestScore = Infinity;
    blocks().forEach((_, id) => {
      if (id === from) return;
      const b = centre(id);
      const along = dir === 'left' ? a.x - b.x : dir === 'right' ? b.x - a.x : dir === 'up' ? a.y - b.y : b.y - a.y;
      const across = dir === 'left' || dir === 'right' ? Math.abs(b.y - a.y) : Math.abs(b.x - a.x);
      if (along <= 0) return;
      const score = along + 2 * across;
      if (score < bestScore) {
        bestScore = score;
        best = id;
      }
    });
    return best;
  };

  const onBoardKey = (event: KeyboardEvent) => {
    const id = blockIdOf(event.target);
    if (id < 0 || paused || event.altKey || event.ctrlKey || event.metaKey) return;
    const dir = KEY_DIRECTION[event.key];
    if (dir) {
      event.preventDefault();
      if (selected === id && !locked()) {
        const step = DIRECTIONS.find((d) => d.dir === dir) as (typeof DIRECTIONS)[number];
        const block = blocks()[id] as Block;
        if (step.orient === block.orient) doMove(id, step.delta);
        else announce(live, t(block.orient === 'h' ? 'announce.onlyH' : 'announce.onlyV'));
      } else {
        const next = neighbour(id, dir);
        if (next >= 0) focusBlock(next);
      }
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      focusBlock(event.key === 'Home' ? 0 : blockEls.length - 1);
    } else if (event.key === 'Escape' && selected >= 0) {
      event.preventDefault();
      select(-1);
      announce(live, t('announce.deselected'));
    }
  };

  const onPointerDown = (event: PointerEvent) => {
    suppressClick = false;
    if (event.button !== 0 || locked()) return;
    const id = blockIdOf(event.target);
    if (id < 0) return;
    const { min, max } = slideRange(blocks(), progressOf(state).positions, id);
    const cell = cellEls[0]?.getBoundingClientRect().width || 48;
    drag = { id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, cell, min, max, offset: 0, moved: false };
    try {
      (blockEls[id] as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // Capture is a nicety (keeps the drag when the pointer leaves the block); not needed for correctness.
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const horizontal = blocks()[drag.id]?.orient === 'h';
    const raw = horizontal ? event.clientX - drag.startX : event.clientY - drag.startY;
    if (!drag.moved && Math.abs(raw) < DRAG_THRESHOLD) return;
    drag.moved = true;
    drag.offset = Math.max(drag.min * drag.cell, Math.min(drag.max * drag.cell, raw));
    const el = blockEls[drag.id] as HTMLElement;
    el.classList.add('sb-dragging');
    el.style.transform = horizontal ? `translate(${drag.offset}px, 0)` : `translate(0, ${drag.offset}px)`;
  };

  const cancelDrag = () => {
    if (!drag) return;
    const el = blockEls[drag.id];
    if (el) {
      el.style.transform = '';
      el.classList.remove('sb-dragging');
    }
    drag = null;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const { id, moved, offset, cell } = drag;
    cancelDrag();
    if (!moved) return;
    // The click that follows a drag must not toggle the selection.
    suppressClick = true;
    selected = id;
    focusId = id;
    const delta = Math.round(offset / cell);
    if (delta === 0) render();
    else doMove(id, delta);
  };

  const onUndo = () => {
    if (paused) return;
    commit(undo(state), () => t('announce.undone'));
  };

  const onRestart = () => {
    if (paused) return;
    commit(restart(state), () => t('announce.restarted'));
  };

  const onKey = (event: KeyboardEvent) => {
    if (paused || event.altKey || event.defaultPrevented) return;
    if (event.ctrlKey || event.metaKey) {
      if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        onUndo();
      }
      return;
    }
    if (event.key === 'Backspace' || event.key === 'u' || event.key === 'U') {
      event.preventDefault();
      onUndo();
    }
  };

  const show = (next: SlidingBlocksState) => {
    state = next;
    selected = -1;
    focusId = 0;
    drag = null;
    suppressClick = false;
    if (!container.isConnected) root.appendChild(container);
    build();
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      show(createInitialState(options.seed, toDifficulty(options.difficulty)));
    },
    restore(saved: SlidingBlocksState) {
      show(cloneState(saved));
    },
    serialize: () => cloneState(state),
    pause() {
      paused = true;
      cancelDrag();
    },
    resume() {
      paused = false;
    },
    reset() {
      show(resetState(state));
      context.requestSave();
    },
    dispose() {
      cancelDrag();
      clear(root);
    }
  };
}
