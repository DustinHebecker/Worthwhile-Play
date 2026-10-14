import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import {
  boxesOnGoals,
  canRestart,
  canUndo,
  chooseLevel,
  createInitialState,
  deadBoxes,
  levelCount,
  levelOf,
  minPushesOf,
  move,
  progressOf,
  resetState,
  restart,
  tapCell,
  toDifficulty,
  undo,
  type Direction,
  type Level,
  type Position,
  type SokobanState
} from './rules';
import './styles.css';

export type TileKind = 'wall' | 'outside' | 'floor' | 'goal' | 'box' | 'box-on-goal' | 'player' | 'player-on-goal';

const SVG_NS = 'http://www.w3.org/2000/svg';

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  return el;
}

/**
 * Tile pictures. Shape carries the meaning, colour only reinforces it: goals are a dashed
 * ring, crates have plank lines, a crate on a goal shows a check mark, the player is a figure.
 */
function glyph(kind: TileKind): SVGSVGElement | null {
  if (kind === 'wall' || kind === 'outside' || kind === 'floor') return null;
  const root = svg('svg', { viewBox: '0 0 24 24', class: 'sk-glyph', 'aria-hidden': 'true', focusable: 'false' });
  if (kind === 'goal' || kind === 'player-on-goal') root.append(svg('circle', { class: 'sk-goal-ring', cx: 12, cy: 12, r: 7 }));
  if (kind === 'box' || kind === 'box-on-goal') {
    root.append(svg('rect', { class: 'sk-crate', x: 3, y: 3, width: 18, height: 18, rx: 2.5 }));
    if (kind === 'box') root.append(svg('path', { class: 'sk-crate-lines', d: 'M7 7 L17 17 M17 7 L7 17' }));
    else root.append(svg('path', { class: 'sk-check', d: 'M7 12.5 L10.5 16 L17.5 8' }));
  }
  if (kind === 'player' || kind === 'player-on-goal') {
    root.append(svg('circle', { class: 'sk-player', cx: 12, cy: 7.5, r: 3.5 }));
    root.append(svg('path', { class: 'sk-player', d: 'M6 20.5 C6 14.5 8.5 12.5 12 12.5 C15.5 12.5 18 14.5 18 20.5 Z' }));
  }
  return root;
}

export function tileKind(level: Level, position: Position, cell: number): TileKind {
  const tile = level.tiles[cell];
  if (tile === 'wall' || tile === 'outside') return tile;
  const goal = level.goals.includes(cell);
  if (position.boxes.includes(cell)) return goal ? 'box-on-goal' : 'box';
  if (position.player === cell) return goal ? 'player-on-goal' : 'player';
  return goal ? 'goal' : 'floor';
}

const KIND_LABEL: Record<Exclude<TileKind, 'outside'>, string> = {
  wall: 'tile.wall',
  floor: 'tile.floor',
  goal: 'tile.goal',
  box: 'tile.box',
  'box-on-goal': 'tile.boxOnGoal',
  player: 'tile.player',
  'player-on-goal': 'tile.playerOnGoal'
};

const MOVE_KEYS: Readonly<Record<string, Direction>> = {
  ArrowUp: 'u',
  ArrowDown: 'd',
  ArrowLeft: 'l',
  ArrowRight: 'r',
  KeyW: 'u',
  KeyS: 'd',
  KeyA: 'l',
  KeyD: 'r'
};

const DPAD: readonly { direction: Direction; key: string; arrow: string; area: string }[] = [
  { direction: 'u', key: 'move.up', arrow: '▲', area: 'up' },
  { direction: 'l', key: 'move.left', arrow: '◀', area: 'left' },
  { direction: 'r', key: 'move.right', arrow: '▶', area: 'right' },
  { direction: 'd', key: 'move.down', arrow: '▼', area: 'down' }
];

const DIRECTION_NAMES: Readonly<Record<Direction, string>> = { u: 'up', d: 'down', l: 'left', r: 'right' };

const cloneState = (state: SokobanState): SokobanState => ({ ...state, history: [...state.history] });

export function createSokoban(context: GameContext): GameInstance<SokobanState> {
  const { t, root } = context;
  let state = createInitialState(0);
  let paused = false;
  let builtKey = '';
  let tiles: HTMLElement[] = [];

  const levelStatus = h('p', { class: 'sk-level', 'data-testid': 'level-status' });
  const levelSelect = h('select', { id: 'sk-level-select', 'data-testid': 'level-select' });
  const playButton = h('button', { type: 'button', 'data-testid': 'level-play', onclick: () => onChooseLevel() }, t('level.play'));
  const chooser = h('div', { class: 'wp-row sk-chooser' }, h('label', { for: 'sk-level-select' }, t('level.choose')), levelSelect, playButton);

  const moves = h('span', { 'data-testid': 'moves' });
  const pushes = h('span', { 'data-testid': 'pushes' });
  const goals = h('span', { 'data-testid': 'goals' });
  const stats = h('p', { class: 'sk-stats' }, moves, pushes, goals);
  const status = h('p', { class: 'wp-status sk-status', 'data-testid': 'status', hidden: true });

  const board = h('div', {
    class: 'sk-board',
    role: 'group',
    tabindex: 0,
    dir: 'ltr',
    'aria-label': t('board'),
    'aria-describedby': 'sk-help-keys',
    'data-testid': 'board',
    onclick: (event: Event) => onBoardClick(event)
  });

  const dpadButtons = DPAD.map(({ direction, key, arrow, area }) =>
    h('button', {
      type: 'button',
      class: `sk-dpad-${area}`,
      'aria-label': t(key),
      title: t(key),
      'data-testid': `move-${DIRECTION_NAMES[direction]}`,
      onclick: () => onMove(direction)
    }, h('span', { 'aria-hidden': 'true' }, arrow))
  );
  const dpad = h('div', { class: 'sk-dpad', role: 'group', 'aria-label': t('dpad'), dir: 'ltr' }, ...dpadButtons);
  const undoButton = h('button', { type: 'button', 'data-testid': 'undo', onclick: () => onUndo() }, t('common.undo'));
  const restartButton = h('button', { type: 'button', 'data-testid': 'restart', 'aria-describedby': 'sk-help-restart', onclick: () => onRestart() }, t('action.restart'));
  const controls = h('div', { class: 'sk-controls' }, dpad, h('div', { class: 'sk-actions' }, undoButton, restartButton));

  const legendItem = (kind: TileKind, key: string) =>
    h('span', { class: 'sk-legend-item' }, h('span', { class: 'sk-swatch', 'data-kind': kind }, glyph(kind)), t(key));
  const legend = h('p', { class: 'sk-legend wp-muted', 'aria-hidden': 'true' },
    legendItem('player', 'tile.player'),
    legendItem('box', 'tile.box'),
    legendItem('goal', 'tile.goal'),
    legendItem('box-on-goal', 'tile.boxOnGoal')
  );
  const help = h('div', { class: 'sk-help wp-muted' },
    h('p', { id: 'sk-help-keys' }, t('help.keys')),
    h('p', {}, t('help.touch')),
    h('p', { id: 'sk-help-restart' }, t('help.restart'))
  );
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'announcer' });

  const container = h(
    'div',
    { class: `wp-sokoban${context.reducedMotion ? ' sk-reduced' : ''}`, dir: t.direction, lang: t.locale, onkeydown: (event: Event) => onKey(event as KeyboardEvent) },
    // The board is the first focusable element, so the host's initial focus lands on it and the
    // arrow keys move the player straight away (the level list would otherwise capture them).
    levelStatus,
    stats,
    status,
    board,
    controls,
    chooser,
    legend,
    help,
    live
  );

  const coords = (level: Level, cell: number) => ({ row: Math.floor(cell / level.width) + 1, col: (cell % level.width) + 1 });

  /** (Re)creates the tiles and the level list when the level changes; keeps them otherwise. */
  const build = () => {
    const key = `${state.difficulty}/${state.level}`;
    if (key === builtKey) return;
    builtKey = key;
    const level = levelOf(state);
    clear(board);
    board.style.setProperty('--sk-cols', String(level.width));
    tiles = level.tiles.map((_, i) =>
      h('span', { class: 'sk-tile', 'data-index': i, 'data-testid': `tile-${Math.floor(i / level.width)}-${i % level.width}` })
    );
    board.append(...tiles);
    const count = levelCount(state.difficulty);
    clear(levelSelect);
    for (let i = 0; i < count; i++) levelSelect.append(h('option', { value: i }, t('level.option', { n: i + 1 })));
    levelSelect.value = String(state.level);
  };

  const render = () => {
    build();
    const level = levelOf(state);
    const progress = progressOf(state);
    const { position, solved } = progress;
    const dead = new Set(solved ? [] : deadBoxes(level, position));
    tiles.forEach((tile, i) => {
      const kind = tileKind(level, position, i);
      const stuck = dead.has(i);
      if (tile.dataset.kind !== kind || tile.dataset.stuck !== String(stuck)) {
        tile.dataset.kind = kind;
        tile.dataset.stuck = String(stuck);
        tile.replaceChildren(...[glyph(kind)].filter((g): g is SVGSVGElement => g !== null));
        if (kind === 'outside') {
          tile.removeAttribute('role');
          tile.removeAttribute('aria-label');
          tile.setAttribute('aria-hidden', 'true');
        } else {
          tile.setAttribute('role', 'img');
          tile.removeAttribute('aria-hidden');
          const content = t(stuck ? 'tile.boxStuck' : KIND_LABEL[kind]);
          tile.setAttribute('aria-label', t('tile.label', { ...coords(level, i), content }));
        }
      }
    });

    const total = levelCount(state.difficulty);
    levelStatus.textContent = t('level.status', { n: state.level + 1, total });
    moves.textContent = t('stats.moves', { n: progress.moves });
    moves.dataset.value = String(progress.moves);
    pushes.textContent = t('stats.pushes', { n: progress.pushes });
    pushes.dataset.value = String(progress.pushes);
    const done = boxesOnGoals(level, position);
    goals.textContent = t('stats.goals', { done, total: level.goals.length });
    goals.dataset.value = String(done);
    container.dataset.solved = String(solved);

    if (solved) {
      status.hidden = false;
      status.textContent = solvedText(progress.moves, progress.pushes);
    } else if (dead.size > 0) {
      status.hidden = false;
      status.textContent = t('status.stuck');
    } else {
      status.hidden = true;
      status.textContent = '';
    }
    status.dataset.state = solved ? 'solved' : dead.size > 0 ? 'stuck' : 'playing';

    undoButton.disabled = !canUndo(state);
    restartButton.disabled = !canRestart(state);
    for (const button of dpadButtons) button.disabled = solved;
  };

  const solvedText = (movesMade: number, pushesMade: number) =>
    t('status.solved', { moves: movesMade, pushes: pushesMade, minimum: minPushesOf(state.difficulty, state.level) });

  const where = () => coords(levelOf(state), progressOf(state).position.player);

  /** Applies a new state; returns false when nothing changed. */
  const commit = (next: SokobanState, message: () => string): boolean => {
    if (next === state) return false;
    const wasSolved = progressOf(state).solved;
    state = next;
    render();
    context.requestSave();
    const progress = progressOf(state);
    if (progress.solved && !wasSolved) {
      announce(live, `${message()} ${solvedText(progress.moves, progress.pushes)}`);
      context.finished({ outcome: 'completed', stats: { moves: progress.moves, pushes: progress.pushes } });
    } else {
      announce(live, message());
    }
    return true;
  };

  /** Announcement after a move or walk, depending on whether its last step pushed a crate. */
  const afterStep = () => {
    const last = state.history[state.history.length - 1] ?? '';
    const pushed = last !== last.toLowerCase();
    if (!pushed) return t('announce.moved', where());
    const level = levelOf(state);
    const { position } = progressOf(state);
    const pushedText = t('announce.pushed', { done: boxesOnGoals(level, position), total: level.goals.length, ...where() });
    return deadBoxes(level, position).length > 0 ? `${pushedText} ${t('status.stuck')}` : pushedText;
  };

  const onMove = (direction: Direction) => {
    if (paused || progressOf(state).solved) return;
    if (!commit(move(state, direction), afterStep)) announce(live, t('announce.blocked'));
  };

  const onBoardClick = (event: Event) => {
    if (paused) return;
    const tile = (event.target as Element | null)?.closest<HTMLElement>('.sk-tile');
    if (!tile || !board.contains(tile)) return;
    board.focus({ preventScroll: true });
    const cell = Number(tile.dataset.index);
    const { position, solved } = progressOf(state);
    if (solved || cell === position.player) return;
    const kind = tile.dataset.kind;
    if (kind === 'wall' || kind === 'outside') return;
    if (!commit(tapCell(state, cell), afterStep)) announce(live, t(position.boxes.includes(cell) ? 'announce.blocked' : 'announce.noPath'));
  };

  const onUndo = () => {
    if (paused) return;
    commit(undo(state), () => t('announce.undone', where()));
  };

  const onRestart = () => {
    if (paused) return;
    commit(restart(state), () => t('announce.restarted'));
  };

  const onChooseLevel = () => {
    if (paused) return;
    const index = Number(levelSelect.value);
    commit(chooseLevel(state, index), () => t('announce.level', { n: index + 1, total: levelCount(state.difficulty) }));
  };

  const onKey = (event: KeyboardEvent) => {
    if (paused || event.altKey) return;
    const target = event.target as Element | null;
    if (target instanceof HTMLSelectElement || target instanceof HTMLInputElement) return;
    if (event.ctrlKey || event.metaKey) {
      if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        onUndo();
      }
      return;
    }
    const direction = MOVE_KEYS[event.key] ?? MOVE_KEYS[event.code];
    if (direction) {
      event.preventDefault();
      onMove(direction);
    } else if (event.key === 'Backspace' || event.key === 'u' || event.key === 'U') {
      event.preventDefault();
      onUndo();
    }
  };

  const show = (next: SokobanState) => {
    state = next;
    if (!container.isConnected) root.appendChild(container);
    builtKey = '';
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      show(createInitialState(options.seed, toDifficulty(options.difficulty)));
    },
    restore(saved: SokobanState) {
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
      show(resetState(state));
      context.requestSave();
    },
    dispose() {
      clear(root);
    }
  };
}
