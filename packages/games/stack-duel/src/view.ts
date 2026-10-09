import type { GameContext, GameInstance, GameResult, NewGameOptions } from '@wp/game-core';
import { isOneOf, normalizeSeed } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import { playTurn, type TurnResult } from './ai';
import { PATTERNS, PIECE_KINDS, type Pattern } from './pieces';
import {
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  MODES,
  PLATFORM_DEPTH,
  PLATFORM_HALF,
  RECORD_EVERY,
  ROT_STEPS,
  SOLO_GOALS,
  X_LIMIT,
  cloneState,
  newState,
  piecesLeft,
  playerToMove,
  spawnPose,
  towerHeight,
  withCursor,
  type Cursor,
  type Mode,
  type Placed,
  type StackDuelState
} from './rules';
import './styles.css';

const SVG_NS = 'http://www.w3.org/2000/svg';
/** Keyboard / button step in world units (Shift: fine step). */
export const MOVE_STEP = 0.25;
export const FINE_STEP = 0.05;
/** Playback speed of the recorded drop (frames are 1/30 s apart). */
const FRAME_MS = (1000 / 60) * RECORD_EVERY;
/** Pause on the computer's hovering stone before it is released, so its choice is visible. */
const HOVER_MS = 450;
const VIEW_WIDTH = 10;
const VIEW_BOTTOM = -1.8;
const MIN_VIEW_TOP = 8.7;

let instanceCounter = 0;

const svg = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] => {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  return el;
};

const pathOf = (outline: readonly (readonly [number, number])[]): string =>
  outline.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(4)} ${y.toFixed(4)}`).join(' ') + ' Z';

const transformOf = (x: number, y: number, a: number): string => `translate(${x.toFixed(4)} ${y.toFixed(4)}) rotate(${((a * 180) / Math.PI).toFixed(3)})`;

/** Pattern tiles (world units) drawn over the base colour; every kind has a pattern so colour is never the only cue. */
function patternElement(id: string, pattern: Pattern): SVGPatternElement {
  const size = 0.3;
  const p = svg('pattern', { id, patternUnits: 'userSpaceOnUse', width: size, height: size, class: 'sd-pat' });
  const line = (x1: number, y1: number, x2: number, y2: number) => p.append(svg('line', { x1, y1, x2, y2 }));
  switch (pattern) {
    case 'stripes':
      line(0, 0, size, size);
      line(-size / 2, size / 2, size / 2, size * 1.5);
      line(size / 2, -size / 2, size * 1.5, size / 2);
      break;
    case 'dots':
      p.append(svg('circle', { cx: size / 2, cy: size / 2, r: 0.05, class: 'sd-dot' }));
      break;
    case 'grid':
      line(0, 0, size, 0);
      line(0, 0, 0, size);
      break;
    case 'waves':
      p.append(svg('path', { d: `M0 ${size / 2} Q ${size / 4} ${size / 5} ${size / 2} ${size / 2} T ${size} ${size / 2}`, fill: 'none' }));
      break;
    case 'checks':
      p.append(svg('rect', { x: 0, y: 0, width: size / 2, height: size / 2, class: 'sd-dot' }));
      p.append(svg('rect', { x: size / 2, y: size / 2, width: size / 2, height: size / 2, class: 'sd-dot' }));
      break;
    case 'rings':
      p.append(svg('circle', { cx: size / 2, cy: size / 2, r: 0.09, fill: 'none' }));
      break;
    case 'cross':
      line(0, 0, size, size);
      line(size, 0, 0, size);
      break;
  }
  return p;
}

/** Number of frames worth showing: trailing frames that no longer differ visibly from the final pose are skipped. */
export function visibleFrames(frames: readonly (readonly number[])[]): number {
  const last = frames[frames.length - 1];
  if (!last) return 0;
  for (let i = frames.length - 2; i >= 0; i--) {
    const f = frames[i]!;
    for (let j = 0; j < last.length; j++) if (Math.abs(f[j]! - last[j]!) > 0.004) return i + 2;
  }
  return 1;
}

interface Animation {
  turn: TurnResult;
  drop: number;
  start: number;
  handle: number | undefined;
}

export function createStackDuel(context: GameContext): GameInstance<StackDuelState> {
  const { t, root } = context;
  const uid = `sd${++instanceCounter}`;
  const number = new Intl.NumberFormat(t.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const fmt = (value: number) => number.format(Math.round(value * 10) / 10);
  const position = new Intl.NumberFormat(t.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let state: StackDuelState = newState(0, DEFAULT_DIFFICULTY, 'computer');
  let anim: Animation | undefined;
  let dragging = false;

  /* ---------- DOM ---------- */
  const modeSelect = h('select', { 'data-testid': 'option-mode', onchange: () => onMode(modeSelect.value) });
  for (const m of MODES) modeSelect.append(h('option', { value: m }, t(`mode.${m}`)));
  const status = h('p', { class: 'wp-status sd-status', 'data-testid': 'status' });
  const progress = h('p', { class: 'sd-progress', 'data-testid': 'progress' });
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'announcer' });

  const board = svg('svg', { class: 'sd-svg', 'aria-hidden': 'true', focusable: 'false' });
  const defs = svg('defs');
  PATTERNS.forEach((p) => defs.append(patternElement(`${uid}-${p}`, p)));
  board.append(defs);
  const world = svg('g', { transform: 'scale(1 -1)' });
  board.append(world);
  const pedestal = svg('path', {
    class: 'sd-platform',
    d: pathOf([
      [-PLATFORM_HALF, 0],
      [-PLATFORM_HALF, -PLATFORM_DEPTH],
      [-PLATFORM_HALF * 0.55, -PLATFORM_DEPTH],
      [-PLATFORM_HALF * 0.4, VIEW_BOTTOM - 5],
      [PLATFORM_HALF * 0.4, VIEW_BOTTOM - 5],
      [PLATFORM_HALF * 0.55, -PLATFORM_DEPTH],
      [PLATFORM_HALF, -PLATFORM_DEPTH],
      [PLATFORM_HALF, 0]
    ]),
    'data-testid': 'platform'
  });
  const goalLine = svg('line', { class: 'sd-goal', x1: -VIEW_WIDTH, x2: VIEW_WIDTH, 'data-testid': 'goal-line' });
  const goalLabel = svg('text', { class: 'sd-goal-label', 'text-anchor': 'start' });
  const guide = svg('line', { class: 'sd-guide', 'data-testid': 'guide' });
  const piecesLayer = svg('g');
  const heldLayer = svg('g', { class: 'sd-held', 'data-testid': 'held' });
  world.append(pedestal, goalLine, guide, piecesLayer, heldLayer);
  board.append(goalLabel);

  const boardBox = h('div', {
    class: 'sd-board',
    tabindex: 0,
    role: 'group',
    'data-testid': 'board',
    'data-autofocus': '',
    'aria-describedby': `${uid}-help`
  });
  boardBox.append(board);

  const button = (id: string, label: string, symbol: string, onclick: () => void, extra = '') =>
    h('button', { type: 'button', class: `sd-btn ${extra}`.trim(), 'data-testid': id, 'aria-label': label, title: label, onclick }, h('span', { 'aria-hidden': 'true' }, symbol));
  const leftButton = button('move-left', t('moveLeft'), '◀', () => nudge(-MOVE_STEP, 0));
  const ccwButton = button('rotate-ccw', t('rotateCcw'), '⟲', () => nudge(0, 1));
  const dropButton = h('button', { type: 'button', class: 'primary sd-drop', 'data-testid': 'drop', onclick: () => onDrop() }, t('drop'));
  const cwButton = button('rotate-cw', t('rotateCw'), '⟳', () => nudge(0, -1));
  const rightButton = button('move-right', t('moveRight'), '▶', () => nudge(MOVE_STEP, 0));
  // Physical directions: the playing field is never mirrored, so the controls keep LTR order.
  const controls = h('div', { class: 'sd-controls', dir: 'ltr' }, leftButton, ccwButton, dropButton, cwButton, rightButton);

  const nextSvg = svg('svg', { class: 'sd-next-svg', viewBox: '-1.6 -1.6 3.2 3.2', 'aria-hidden': 'true', focusable: 'false' });
  const nextGroup = svg('g', { transform: 'scale(1 -1)' });
  nextSvg.append(nextGroup);
  const nextText = h('span', { 'data-testid': 'next' });
  const nextBox = h('p', { class: 'sd-next' }, nextSvg, nextText);
  const help = h('p', { class: 'wp-muted sd-help', id: `${uid}-help` }, t('help'));
  const restartButton = h('button', { type: 'button', 'data-testid': 'restart', onclick: () => restart() }, t('restart'));

  const container = h(
    'div',
    { class: 'wp-stack-duel', dir: t.direction },
    h('div', { class: 'sd-toolbar' }, h('label', { class: 'sd-field' }, h('span', {}, t('mode')), modeSelect)),
    status,
    progress,
    boardBox,
    controls,
    nextBox,
    h('div', { class: 'sd-actions' }, restartButton),
    help,
    live
  );
  root.append(container);

  /* ---------- Rendering ---------- */
  const pieceName = (kind: number) => t(`piece.${PIECE_KINDS[kind]!.id}`);

  const drawPiece = (parent: SVGGElement, p: Placed, testid?: string) => {
    const kind = PIECE_KINDS[p.k]!;
    const g = svg('g', { class: `sd-piece sd-h${kind.hue}`, transform: transformOf(p.x, p.y, p.a), 'data-kind': kind.id });
    if (testid) {
      g.setAttribute('data-testid', testid);
      g.setAttribute('data-pose', `${p.x.toFixed(3)},${p.y.toFixed(3)},${p.a.toFixed(3)}`);
    }
    const d = pathOf(kind.outline);
    g.append(svg('path', { d, class: 'sd-fill' }), svg('path', { d, class: 'sd-pattern', fill: `url(#${uid}-${kind.pattern})` }));
    parent.append(g);
    return g;
  };

  let viewTop = MIN_VIEW_TOP;
  const setView = (bodies: readonly Placed[]) => {
    const goal = state.mode === 'solo' ? SOLO_GOALS[state.difficulty].height : 0;
    viewTop = Math.max(MIN_VIEW_TOP, towerHeight(bodies) + 4.2, goal + 2);
    const height = viewTop - VIEW_BOTTOM;
    const width = Math.max(VIEW_WIDTH, height * (VIEW_WIDTH / (MIN_VIEW_TOP - VIEW_BOTTOM)));
    board.setAttribute('viewBox', `${(-width / 2).toFixed(3)} ${(-viewTop).toFixed(3)} ${width.toFixed(3)} ${height.toFixed(3)}`);
    goalLine.toggleAttribute('hidden', goal === 0);
    goalLabel.toggleAttribute('hidden', goal === 0);
    goalLine.setAttribute('y1', String(goal));
    goalLine.setAttribute('y2', String(goal));
    goalLabel.setAttribute('x', String((-width / 2 + 0.15).toFixed(3)));
    goalLabel.setAttribute('y', String((-goal - 0.15).toFixed(3)));
    goalLabel.textContent = `${t('goal')} ${fmt(goal)}`;
  };

  const drawBodies = (bodies: readonly Placed[]) => {
    clear(piecesLayer);
    bodies.forEach((b, i) => drawPiece(piecesLayer, b, `piece-${i}`));
  };

  const drawHeld = (kind: number | undefined, cursor: Cursor, bodies: readonly Placed[]) => {
    clear(heldLayer);
    if (kind === undefined) {
      guide.setAttribute('hidden', '');
      return;
    }
    const pose = spawnPose(bodies, kind, cursor);
    drawPiece(heldLayer, pose);
    guide.removeAttribute('hidden');
    guide.setAttribute('x1', String(pose.x));
    guide.setAttribute('x2', String(pose.x));
    guide.setAttribute('y1', String(pose.y));
    guide.setAttribute('y2', String(-PLATFORM_DEPTH));
  };

  const drawNext = () => {
    clear(nextGroup);
    const kind = state.result === null ? state.queue[1] : undefined;
    nextBox.hidden = kind === undefined;
    if (kind === undefined) return;
    drawPiece(nextGroup, { k: kind, x: 0, y: 0, a: 0 });
    const r = Math.max(...PIECE_KINDS[kind]!.outline.map(([x, y]) => Math.hypot(x, y))) + 0.1;
    nextSvg.setAttribute('viewBox', `${(-r).toFixed(3)} ${(-r).toFixed(3)} ${(2 * r).toFixed(3)} ${(2 * r).toFixed(3)}`);
    nextText.textContent = t('next', { piece: pieceName(kind) });
  };

  const endText = (): string => {
    const r = state.result!;
    if (r.kind === 'fell') {
      if (state.mode === 'solo') return t('end.fell.solo');
      if (state.mode === 'computer') return t(r.by === 0 ? 'end.fell.you' : 'end.fell.computer');
      return t('end.fell.player', { n: r.by + 1, m: 2 - r.by });
    }
    if (r.kind === 'height') return t('end.height');
    if (r.kind === 'short') return t('end.short', { height: fmt(towerHeight(state.bodies)), target: fmt(SOLO_GOALS[state.difficulty].height) });
    return t('end.full', { count: state.bodies.length });
  };

  const turnText = (): string => {
    const piece = pieceName(state.queue[0]);
    if (state.mode === 'solo') return t('turn.solo', { piece });
    if (state.mode === 'computer') return t('turn.you', { piece });
    return t('turn.player', { n: playerToMove(state) + 1, piece });
  };

  const progressText = (): string => {
    const height = fmt(towerHeight(state.bodies));
    if (state.mode === 'solo') return t('progress.solo', { height, target: fmt(SOLO_GOALS[state.difficulty].height), left: piecesLeft(state) });
    return t('progress.duel', { height, count: state.bodies.filter((b) => b.y >= -1).length });
  };

  const boardLabel = (): string =>
    t('board', {
      count: state.bodies.length,
      height: fmt(towerHeight(state.bodies)),
      piece: pieceName(state.queue[0]),
      pos: position.format(state.cursor.x),
      deg: Math.round((state.cursor.rot * 360) / ROT_STEPS)
    });

  const placedText = (by: 0 | 1, kind: number): string => {
    const piece = pieceName(kind);
    if (state.mode === 'solo') return t('placed.you', { piece });
    if (state.mode === 'computer') return by === 0 ? t('placed.you', { piece }) : t('placed.computer', { piece });
    return t('placed.player', { n: by + 1, piece });
  };

  const setControlsEnabled = (enabled: boolean) => {
    for (const b of [leftButton, rightButton, ccwButton, cwButton, dropButton]) b.disabled = !enabled;
  };

  /** Renders the full logical state (no animation in progress). */
  const render = () => {
    const playing = state.result === null;
    setView(state.bodies);
    drawBodies(state.bodies);
    drawHeld(playing ? state.queue[0] : undefined, state.cursor, state.bodies);
    drawNext();
    status.textContent = playing ? turnText() : endText();
    progress.textContent = progressText();
    boardBox.setAttribute('aria-label', boardLabel());
    modeSelect.value = state.mode;
    setControlsEnabled(playing);
    container.dataset.mode = state.mode;
    container.dataset.outcome = playing ? 'playing' : state.result!.kind;
    container.dataset.animating = 'false';
  };

  /** Updates only the held stone (cheap; used while moving it). */
  const renderCursor = () => {
    drawHeld(state.queue[0], state.cursor, state.bodies);
    boardBox.setAttribute('aria-label', boardLabel());
  };

  /* ---------- Animation (purely visual; the logical state is already final) ---------- */
  const cancelAnimation = () => {
    if (anim?.handle !== undefined) {
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(anim.handle);
      else clearTimeout(anim.handle);
    }
    anim = undefined;
  };

  const schedule = (fn: (time: number) => void): number =>
    typeof requestAnimationFrame === 'function' ? requestAnimationFrame(fn) : (setTimeout(() => fn(performance.now()), 16) as unknown as number);

  const finishAnimation = (announcement: string) => {
    cancelAnimation();
    render();
    announce(live, `${announcement} ${status.textContent ?? ''}`.trim());
  };

  const animate = (turn: TurnResult, announcement: string) => {
    cancelAnimation();
    const a: Animation = { turn, drop: 0, start: -1, handle: undefined };
    anim = a;
    container.dataset.animating = 'true';
    setControlsEnabled(false);
    clear(heldLayer);
    guide.setAttribute('hidden', '');
    let groups: SVGGElement[] = [];
    let prepared = -1;
    let length = 0;
    const tick = (time: number) => {
      if (anim !== a) return;
      const d = turn.drops[a.drop]!;
      const frames = d.outcome.frames ?? [];
      if (prepared !== a.drop) {
        prepared = a.drop;
        length = visibleFrames(frames);
        a.start = time;
        setView(d.outcome.bodies);
        clear(piecesLayer);
        groups = d.outcome.bodies.map((b, i) => drawPiece(piecesLayer, b, `piece-${i}`));
        status.textContent = placedText(d.by, d.kind);
      }
      const hover = d.by === 1 && state.mode === 'computer' ? HOVER_MS : 0;
      const index = Math.max(0, Math.floor((time - a.start - hover) / FRAME_MS));
      const frame = index >= length - 1 ? frames[frames.length - 1] : frames[index];
      if (frame) groups.forEach((g, i) => g.setAttribute('transform', transformOf(frame[3 * i]!, frame[3 * i + 1]!, frame[3 * i + 2]!)));
      if (index >= length - 1) {
        if (a.drop + 1 < turn.drops.length) a.drop++;
        else return finishAnimation(announcement);
      }
      a.handle = schedule(tick);
    };
    a.handle = schedule(tick);
  };

  /* ---------- Transitions ---------- */
  const resultOf = (): GameResult => {
    const r = state.result!;
    const stats = { pieces: state.bodies.length, height: Math.round(towerHeight(state.bodies.filter((b) => b.y >= -1)) * 10) / 10 };
    if (r.kind === 'full') return { outcome: 'draw', stats };
    if (state.mode === 'solo') return { outcome: r.kind === 'height' ? 'won' : r.kind === 'fell' ? 'lost' : 'completed', stats };
    if (state.mode === 'computer') return { outcome: r.kind === 'fell' && r.by === 0 ? 'lost' : 'won', stats };
    return { outcome: 'completed', stats };
  };

  const setCursor = (cursor: Cursor) => {
    if (anim || state.result !== null) return;
    const next = withCursor(state, cursor);
    if (next.cursor.x === state.cursor.x && next.cursor.rot === state.cursor.rot) return;
    state = next;
    context.requestSave();
    renderCursor();
  };

  const nudge = (dx: number, drot: number) => setCursor({ x: state.cursor.x + dx, rot: state.cursor.rot + drot });

  const onDrop = () => {
    if (anim || state.result !== null) return;
    const turn = playTurn(state, state.cursor, !context.reducedMotion);
    if (!turn) return;
    const before = state;
    state = turn.state;
    context.requestSave();
    if (state.result !== null) context.finished(resultOf());
    const announcement = turn.drops.map((d) => (before.mode === 'computer' && d.by === 1 ? t('placed.computer', { piece: pieceName(d.kind) }) : placedText(d.by, d.kind))).join(' ');
    if (context.reducedMotion) finishAnimation(announcement);
    else animate(turn, announcement);
  };

  const start = (seed: number, difficulty: StackDuelState['difficulty'], mode: Mode) => {
    cancelAnimation();
    state = newState(seed, difficulty, mode);
    render();
  };

  const onMode = (value: string) => {
    if (!isOneOf(value, MODES)) return;
    start(state.seed, state.difficulty, value);
    context.requestSave();
    announce(live, `${t(`mode.${value}`)}. ${status.textContent ?? ''}`);
  };

  const restart = () => {
    start(state.seed, state.difficulty, state.mode);
    context.requestSave();
    announce(live, status.textContent ?? '');
  };

  /* ---------- Input ---------- */
  const onKey = (event: KeyboardEvent) => {
    const fine = event.shiftKey ? FINE_STEP : MOVE_STEP;
    const actions: Record<string, () => void> = {
      ArrowLeft: () => nudge(-fine, 0),
      ArrowRight: () => nudge(fine, 0),
      q: () => nudge(0, 1),
      Q: () => nudge(0, 1),
      e: () => nudge(0, -1),
      E: () => nudge(0, -1),
      r: () => nudge(0, -1),
      R: () => nudge(0, -1),
      ArrowUp: () => nudge(0, -1),
      Home: () => setCursor({ x: -X_LIMIT, rot: state.cursor.rot }),
      End: () => setCursor({ x: X_LIMIT, rot: state.cursor.rot }),
      Enter: () => onDrop(),
      ' ': () => onDrop()
    };
    const action = actions[event.key];
    if (!action || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    action();
  };
  boardBox.addEventListener('keydown', onKey);

  const worldX = (clientX: number): number => {
    const rect = board.getBoundingClientRect();
    const [vx, , vw] = (board.getAttribute('viewBox') ?? '').split(' ').map(Number);
    if (!rect.width || vx === undefined || !vw) return state.cursor.x;
    return vx + ((clientX - rect.left) / rect.width) * vw;
  };
  const onPointerDown = (event: PointerEvent) => {
    if (anim || state.result !== null) return;
    dragging = true;
    boardBox.setPointerCapture?.(event.pointerId);
    setCursor({ x: worldX(event.clientX), rot: state.cursor.rot });
  };
  const onPointerMove = (event: PointerEvent) => {
    if (!dragging && event.pointerType !== 'mouse') return;
    setCursor({ x: worldX(event.clientX), rot: state.cursor.rot });
  };
  const onPointerUp = () => {
    dragging = false;
  };
  boardBox.addEventListener('pointerdown', onPointerDown);
  boardBox.addEventListener('pointermove', onPointerMove);
  boardBox.addEventListener('pointerup', onPointerUp);
  boardBox.addEventListener('pointercancel', onPointerUp);

  /* ---------- Instance ---------- */
  return {
    newGame(options: NewGameOptions) {
      const difficulty = isOneOf(options.difficulty, DIFFICULTIES) ? options.difficulty : DEFAULT_DIFFICULTY;
      // The mode is an in-game preference and carries over to a new game.
      start(normalizeSeed(options.seed), difficulty, state.mode);
    },
    restore(saved: StackDuelState) {
      cancelAnimation();
      state = cloneState(saved);
      render();
    },
    serialize: () => cloneState(state),
    pause() {
      // Never leave the picture behind the logical state.
      if (anim) finishAnimation('');
    },
    resume() {},
    reset() {
      start(state.seed, state.difficulty, state.mode);
      context.requestSave();
    },
    dispose() {
      cancelAnimation();
      boardBox.removeEventListener('keydown', onKey);
      boardBox.removeEventListener('pointerdown', onPointerDown);
      boardBox.removeEventListener('pointermove', onPointerMove);
      boardBox.removeEventListener('pointerup', onPointerUp);
      boardBox.removeEventListener('pointercancel', onPointerUp);
      clear(root);
    }
  };
}
