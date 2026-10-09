import './styles.css';
import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import { opponents } from './ai';
import { reviewOf, type Moment } from './review';
import {
  BOARD,
  cloneState,
  createGame,
  getMap,
  INTRO_MAP,
  mapForSeed,
  MAPS_PER_SET,
  mapOf,
  maxPaths,
  nodeCount,
  OPPONENT_COUNTS,
  seconds,
  stationRange,
  stepMut,
  TICKS_PER_SECOND,
  toDifficulty,
  toggleMut,
  toOpponents,
  UNIT_SPEED,
  type FactionCount,
  type GameMap,
  type NcState,
  type OpponentCount,
  type StepEvents
} from './rules';

const SVG_NS = 'http://www.w3.org/2000/svg';
type SvgAttrs = Record<string, string | number>;

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: SvgAttrs = {}, ...children: (SVGElement | string)[]): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  for (const child of children) el.append(child);
  return el;
}

/** Real milliseconds per tick at speed 1×. */
export const TICK_MS = 100;
/** Autosave cadence while running (ticks of game time). */
export const SAVE_EVERY = 30;
const NODE_R = 25;
const PICK_R = 46;
const DRAG_START = 16;
/** Sideways offset of a stream from the lane centre (each direction keeps to its own side). */
const STREAM_OFFSET = 6;

/** Faction marker shapes: 0 circle (player), 1 triangle, 2 square, 3 diamond. */
export function shapePath(faction: number, r: number): string {
  const f = (n: number) => Math.round(n * 10) / 10;
  switch (faction) {
    case 1:
      return `M0 ${f(-r * 1.1)}L${f(r)} ${f(r * 0.75)}L${f(-r)} ${f(r * 0.75)}Z`;
    case 2:
      return `M${f(-r * 0.85)} ${f(-r * 0.85)}H${f(r * 0.85)}V${f(r * 0.85)}H${f(-r * 0.85)}Z`;
    case 3:
      return `M0 ${f(-r * 1.15)}L${f(r * 1.15)} 0L0 ${f(r * 1.15)}L${f(-r * 1.15)} 0Z`;
    default:
      return `M${f(-r)} 0A${f(r)} ${f(r)} 0 1 0 ${f(r)} 0A${f(r)} ${f(r)} 0 1 0 ${f(-r)} 0Z`;
  }
}

const hexagon = (x: number, y: number, r: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    return `${i === 0 ? 'M' : 'L'}${Math.round(x + r * Math.cos(a))} ${Math.round(y + r * Math.sin(a))}`;
  }).join('') + 'Z';

const crosshair = (x: number, y: number, r1: number, r2: number) =>
  `M${x} ${y - r2}V${y - r1}M${x} ${y + r1}V${y + r2}M${x - r2} ${y}H${x - r1}M${x + r1} ${y}H${x + r2}`;

/** Bastion outline: a square wall with three battlements on every side. */
export function battlements(x: number, y: number, r: number): string {
  const q = Math.round(r / 3);
  const t = Math.max(3, Math.round(r / 4));
  const side = (sx: number, sy: number, dx: number, dy: number, nx: number, ny: number) => {
    let d = '';
    for (let i = 0; i < 3; i++) {
      const ax = sx + dx * (2 * i) * q;
      const ay = sy + dy * (2 * i) * q;
      d += `L${ax + nx * t} ${ay + ny * t}L${ax + dx * q + nx * t} ${ay + dy * q + ny * t}L${ax + dx * q} ${ay + dy * q}L${ax + dx * 2 * q} ${ay + dy * 2 * q}`;
    }
    return d;
  };
  const s = 3 * q;
  return (
    `M${x - s} ${y - s}` +
    side(x - s, y - s, 1, 0, 0, -1) +
    side(x + s, y - s, 0, 1, 1, 0) +
    side(x + s, y + s, -1, 0, 0, 1) +
    side(x - s, y + s, 0, -1, -1, 0) +
    'Z'
  );
}

/** Stroke pattern per faction in the review chart (lines differ by pattern, not only colour). */
const DASHES = ['', '9 5', '2 5', '12 4 2 4'];
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;

const isTextEntry = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

const formatTime = (total: number) => `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;

interface NodeView {
  g: SVGGElement;
  body: SVGCircleElement;
  badge: SVGPathElement;
  label: SVGTextElement;
  pips: SVGCircleElement[];
}

interface LaneView {
  g: SVGGElement;
  /** Stream overlays: [a→b, b→a]. */
  flows: [SVGGElement, SVGGElement];
}

interface Board {
  map: GameMap;
  root: SVGGElement;
  nodes: NodeView[];
  lanes: LaneView[];
  ring: SVGCircleElement;
  preview: SVGLineElement;
  units: SVGGElement;
  shots: SVGGElement;
  pool: SVGPathElement[];
}

export function createNodeConquest(context: GameContext): GameInstance<NcState> {
  const { root, t } = context;
  let state: NcState = createGame(0);
  let board: Board | null = null;
  let running = false;
  let reported = false;
  let selected: number | null = null;
  let focusIndex = 0;
  let frameHandle = 0;
  let frameKind: 'raf' | 'timeout' | null = null;
  let last = 0;
  let acc = 0;
  let sinceSave = 0;
  let sinceList = 0;
  let controller = opponents();
  let drag: { from: number; x: number; y: number; active: boolean } | null = null;
  let suppressClick = false;
  /** View only (never saved): zoom factor and the board point shown in the middle. */
  const camera = { zoom: 1, cx: BOARD / 2, cy: BOARD / 2 };
  /** Active touch/pen/mouse pointers on the board (client coordinates). */
  const pointers = new Map<number, { x: number; y: number }>();
  let pinch: { distance: number; zoom: number; mid: [number, number]; centre: [number, number] } | null = null;
  let pan: { x: number; y: number; cx: number; cy: number } | null = null;
  let lastTouchTap = -Infinity;
  /** A map/opponent change waiting for confirmation. */
  let pending: { map: number; opponents: OpponentCount } | null = null;

  const nodeName = (v: number) => t('node.name', { id: v + 1 });
  const ownerName = (o: number) => (o < 0 ? t('faction.neutral') : t(`faction.${o}`));
  const typeName = (v: number) => t(`type.${mapOf(state).nodes[v]!.type}`);

  /* ---------- Static DOM ---------- */

  const statusEl = h('p', { class: 'wp-status nc-status', 'data-testid': 'nc-status' });
  const countsEl = h('p', { class: 'nc-counts', 'data-testid': 'nc-counts' });
  const pauseBtn = h('button', { type: 'button', class: 'primary nc-pause', 'data-testid': 'nc-pause', onclick: () => togglePause() });
  const speedBtn = h('button', { type: 'button', class: 'nc-speed', 'data-testid': 'nc-speed', onclick: () => toggleSpeed() });
  const mapSelect = h('select', { 'data-testid': 'nc-map-select', id: 'nc-map-select', onchange: () => requestSetup() });
  const mapLabel = h('label', { for: 'nc-map-select', class: 'nc-map-label' }, t('map.label'));
  const oppSelect = h(
    'select',
    { 'data-testid': 'nc-opponents', id: 'nc-opponents', onchange: () => requestSetup() },
    ...OPPONENT_COUNTS.map((n) => h('option', { value: n }, String(n)))
  );
  const oppLabel = h('label', { for: 'nc-opponents', class: 'nc-map-label' }, t('opponents.label'));
  const retryBtn = h('button', { type: 'button', class: 'primary', 'data-testid': 'nc-retry', hidden: true, onclick: () => retry() });
  const toolbar = h(
    'div',
    { class: 'nc-toolbar' },
    pauseBtn,
    speedBtn,
    h('span', { class: 'nc-map' }, mapLabel, mapSelect),
    h('span', { class: 'nc-map' }, oppLabel, oppSelect),
    retryBtn
  );
  const confirmText = h('p', { id: 'nc-confirm-text', class: 'nc-confirm-text', 'data-testid': 'nc-confirm-text' });
  const confirmYes = h('button', { type: 'button', class: 'primary', 'data-testid': 'nc-confirm-yes', onclick: () => confirmSetup(true) }, t('confirm.yes'));
  const confirmNo = h('button', { type: 'button', 'data-testid': 'nc-confirm-no', onclick: () => confirmSetup(false) }, t('confirm.no'));
  const confirmBox = h(
    'div',
    { class: 'nc-confirm', role: 'group', 'aria-labelledby': 'nc-confirm-text', 'data-testid': 'nc-confirm', hidden: true },
    confirmText,
    h('div', { class: 'nc-confirm-actions' }, confirmYes, confirmNo)
  );
  const messageEl = h('p', { class: 'nc-message', 'data-testid': 'nc-message' });
  const hintEl = h('p', { class: 'nc-hint', 'data-testid': 'nc-hint', hidden: true });

  const svgEl = svg('svg', { class: 'nc-board', viewBox: `0 0 ${BOARD} ${BOARD}`, role: 'group', 'data-testid': 'nc-board' });
  svgEl.addEventListener('click', (event) => onBoardClick(event));
  svgEl.addEventListener('keydown', (event) => onBoardKey(event));
  svgEl.addEventListener('pointerdown', (event) => onPointerDown(event));
  svgEl.addEventListener('pointermove', (event) => onPointerMove(event));
  svgEl.addEventListener('pointerup', (event) => onPointerUp(event));
  svgEl.addEventListener('pointercancel', (event) => onPointerCancel(event));
  svgEl.addEventListener('touchstart', (event) => onTouchStart(event), { passive: false });
  svgEl.addEventListener('wheel', (event) => onWheel(event), { passive: false });

  const zoomBtn = (id: string, label: string, text: string, action: () => void) =>
    h('button', { type: 'button', class: 'nc-zoom-btn', 'data-testid': `nc-zoom-${id}`, 'aria-label': t(label), title: t(label), onclick: action }, text);
  const zoomBar = h(
    'div',
    { class: 'nc-zoom', role: 'group', 'aria-label': t('zoom.label') },
    zoomBtn('in', 'zoom.in', '+', () => zoomBy(1.5)),
    zoomBtn('out', 'zoom.out', '−', () => zoomBy(1 / 1.5)),
    zoomBtn('fit', 'zoom.fit', '⤢', () => fit())
  );
  const boardWrap = h('div', { class: 'nc-board-wrap' }, zoomBar, svgEl);

  const reviewChart = h('div', { class: 'nc-review-chart' });
  const reviewSummary = h('p', { 'data-testid': 'nc-review-summary' });
  const reviewMoments = h('ol', { class: 'nc-moments', 'data-testid': 'nc-moments' });
  const reviewBox = h(
    'section',
    { class: 'nc-review', 'data-testid': 'nc-review', hidden: true, 'aria-labelledby': 'nc-review-title' },
    h('h3', { id: 'nc-review-title' }, t('review.title')),
    reviewChart,
    reviewSummary,
    reviewMoments
  );

  const legend = h('ul', { class: 'nc-legend', 'aria-label': t('legend.title') });
  const listEl = h('ul', { class: 'nc-list', 'data-testid': 'nc-list' });
  const listBox = h('details', { class: 'nc-details' }, h('summary', {}, t('list.title')), listEl);
  const helpBox = h(
    'details',
    { class: 'nc-details nc-help' },
    h('summary', {}, t('help.title')),
    ...['help.tap', 'help.levels', 'help.capture', 'help.types', 'help.bastion', 'help.zoom', 'help.keys'].map((key) => h('p', {}, t(key)))
  );
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'nc-live' });
  const container = h(
    'div',
    { class: `wp-nc${context.reducedMotion ? ' nc-reduced' : ''}`, dir: t.direction, lang: t.locale },
    statusEl,
    countsEl,
    toolbar,
    confirmBox,
    hintEl,
    messageEl,
    boardWrap,
    reviewBox,
    legend,
    helpBox,
    listBox,
    live
  );

  /* ---------- Board construction ---------- */

  const build = (map: GameMap) => {
    clear(svgEl);
    svgEl.setAttribute('aria-label', t('board.label', { count: map.nodes.length }));
    const lanes = map.lanes.map(([a, b]) => {
      const A = map.nodes[a]!;
      const B = map.nodes[b]!;
      const len = Math.hypot(B.x - A.x, B.y - A.y) || 1;
      const flow = (from: typeof A, to: typeof A, dir: 'fwd' | 'bwd') => {
        const nx = (-(to.y - from.y) / len) * STREAM_OFFSET;
        const ny = ((to.x - from.x) / len) * STREAM_OFFSET;
        const ux = (to.x - from.x) / len;
        const uy = (to.y - from.y) / len;
        const mx = (from.x + to.x) / 2 + nx;
        const my = (from.y + to.y) / 2 + ny;
        const arrow = `M${(mx - ux * 7 + nx * 1.4).toFixed(1)} ${(my - uy * 7 + ny * 1.4).toFixed(1)}L${(mx + ux * 5).toFixed(1)} ${(my + uy * 5).toFixed(1)}L${(mx - ux * 7 - nx * 1.4).toFixed(1)} ${(my - uy * 7 - ny * 1.4).toFixed(1)}`;
        return svg(
          'g',
          { class: `nc-flow nc-${dir}`, visibility: 'hidden' },
          svg('line', { class: 'nc-flow-line', x1: (from.x + nx).toFixed(1), y1: (from.y + ny).toFixed(1), x2: (to.x + nx).toFixed(1), y2: (to.y + ny).toFixed(1) }),
          svg('path', { class: 'nc-arrow', d: arrow })
        );
      };
      const flows: [SVGGElement, SVGGElement] = [flow(A, B, 'fwd'), flow(B, A, 'bwd')];
      const g = svg(
        'g',
        { class: 'nc-lane', 'data-testid': `lane-${a}-${b}`, 'data-active': '', 'aria-hidden': 'true' },
        svg('line', { class: 'nc-lane-line', x1: A.x, y1: A.y, x2: B.x, y2: B.y }),
        ...flows
      );
      return { g, flows };
    });
    const ring = svg('circle', { class: 'nc-range', cx: 0, cy: 0, r: 1, visibility: 'hidden' });
    const preview = svg('line', { class: 'nc-preview', x1: 0, y1: 0, x2: 0, y2: 0, visibility: 'hidden' });
    const nodes = map.nodes.map((node, v) => {
      const { x, y } = node;
      const deco =
        node.type === 'shipyard'
          ? svg('path', { class: 'nc-deco', d: hexagon(x, y, NODE_R + 9) })
          : node.type === 'station'
            ? svg('path', { class: 'nc-deco', d: crosshair(x, y, NODE_R + 3, NODE_R + 11) })
            : node.type === 'bastion'
              ? svg('path', { class: 'nc-deco nc-deco-wall', d: battlements(x, y, NODE_R + 7) })
              : svg('circle', { class: 'nc-deco nc-deco-thin', cx: x, cy: y, r: NODE_R + 5 });
      const body = svg('circle', { class: 'nc-body', cx: x, cy: y, r: NODE_R });
      const badge = svg('path', { class: 'nc-badge', d: '', transform: `translate(${x + NODE_R - 2} ${y - NODE_R + 2})` });
      const label = svg('text', { class: 'nc-level', x, y: y + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central' });
      const pips = [0, 1, 2].map((i) => svg('circle', { class: 'nc-pip', cx: x - 10 + i * 10, cy: y + NODE_R + 14, r: 4 }));
      const g = svg(
        'g',
        { class: 'nc-node', role: 'button', tabindex: -1, 'data-node': v, 'data-testid': `node-${v}`, 'data-type': node.type },
        svg('circle', { class: 'nc-focus', cx: x, cy: y, r: NODE_R + 15 }),
        svg('circle', { class: 'nc-sel', cx: x, cy: y, r: NODE_R + 10 }),
        deco,
        body,
        label,
        badge,
        ...pips
      );
      return { g, body, badge, label, pips };
    });
    const units = svg('g', { class: 'nc-units', 'aria-hidden': 'true' });
    const shots = svg('g', { class: 'nc-shots', 'aria-hidden': 'true' });
    const rootG = svg(
      'g',
      {},
      svg('rect', { class: 'nc-bg', x: 0, y: 0, width: BOARD, height: BOARD, rx: 16 }),
      ring,
      svg('g', { class: 'nc-lanes' }, ...lanes.map((l) => l.g)),
      units,
      shots,
      preview,
      svg('g', { class: 'nc-nodes' }, ...nodes.map((n) => n.g))
    );
    svgEl.append(rootG);
    board = { map, root: rootG, nodes, lanes, ring, preview, units, shots, pool: [] };
    fit();

    clear(legend);
    for (let f = 0; f < map.factions; f++) {
      legend.append(
        h('li', { 'data-faction': f }, legendIcon(svg('path', { class: 'nc-legend-shape', d: shapePath(f, 7), transform: 'translate(10 10)' })), t(`faction.${f}`))
      );
    }
    legend.append(
      h('li', {}, legendIcon(svg('circle', { class: 'nc-legend-type', cx: 10, cy: 10, r: 7 })), t('type.standard')),
      h('li', {}, legendIcon(svg('path', { class: 'nc-legend-type', d: hexagon(10, 10, 8) })), t('type.shipyard')),
      h('li', {}, legendIcon(svg('path', { class: 'nc-legend-type', d: crosshair(10, 10, 3, 9) })), t('type.station')),
      h('li', { 'data-type': 'bastion' }, legendIcon(svg('path', { class: 'nc-legend-type', d: battlements(10, 10, 6) })), t('type.bastion'))
    );
    fillMapOptions(state.opponents);
  };

  const fillMapOptions = (opponentCount: OpponentCount) => {
    clear(mapSelect);
    mapSelect.append(h('option', { value: INTRO_MAP }, t('map.intro')));
    for (let i = 0; i < MAPS_PER_SET; i++) {
      const count = getMap((opponentCount + 1) as FactionCount, i, state.layout).nodes.length;
      mapSelect.append(h('option', { value: i }, t('map.option', { n: i + 1, count })));
    }
  };

  const legendIcon = (shape: SVGElement): Node => svg('svg', { viewBox: '0 0 20 20', width: 20, height: 20, 'aria-hidden': 'true', class: 'nc-legend-icon' }, shape);

  /* ---------- Rendering ---------- */

  const renderNodes = () => {
    const view = board!;
    view.nodes.forEach((n, v) => {
      const owner = state.owner[v]!;
      const level = state.level[v]!;
      const paths = state.out[v]!.length;
      const max = maxPaths(level);
      n.g.dataset.owner = owner < 0 ? 'neutral' : String(owner);
      n.g.dataset.level = String(level);
      n.g.setAttribute('aria-pressed', String(selected === v));
      n.g.classList.toggle('is-selected', selected === v);
      n.g.setAttribute('aria-label', t('node.label', { name: nodeName(v), owner: ownerName(owner), type: typeName(v), level, paths, max }));
      if (n.label.textContent !== String(level)) n.label.textContent = String(level);
      n.badge.setAttribute('d', owner < 0 ? '' : shapePath(owner, 9));
      n.pips.forEach((pip, i) => {
        pip.setAttribute('visibility', owner >= 0 && i < max ? 'visible' : 'hidden');
        pip.classList.toggle('is-used', i < paths);
      });
      n.g.setAttribute('tabindex', v === focusIndex ? '0' : '-1');
    });
    view.lanes.forEach((lane, i) => {
      const [a, b] = view.map.lanes[i]!;
      const fwd = state.out[a]!.includes(b);
      const bwd = state.out[b]!.includes(a);
      lane.g.dataset.active = [fwd ? `${a}-${b}` : '', bwd ? `${b}-${a}` : ''].filter(Boolean).join(' ');
      lane.flows[0].setAttribute('visibility', fwd ? 'visible' : 'hidden');
      lane.flows[1].setAttribute('visibility', bwd ? 'visible' : 'hidden');
      lane.flows[0].dataset.faction = String(state.owner[a]);
      lane.flows[1].dataset.faction = String(state.owner[b]);
    });
    const ringNode = selected ?? (container.contains(document.activeElement) && document.activeElement instanceof SVGGElement ? focusIndex : null);
    if (ringNode !== null && view.map.nodes[ringNode]!.type === 'station') {
      const node = view.map.nodes[ringNode]!;
      view.ring.setAttribute('cx', String(node.x));
      view.ring.setAttribute('cy', String(node.y));
      view.ring.setAttribute('r', String(stationRange(state.level[ringNode]!)));
      view.ring.setAttribute('visibility', 'visible');
    } else view.ring.setAttribute('visibility', 'hidden');
  };

  /** Draws units; `alpha` (0–1) interpolates between ticks for smooth motion. */
  const renderUnits = (alpha: number) => {
    const view = board!;
    const map = view.map;
    const { pool, units } = view;
    state.units.forEach((u, i) => {
      let el = pool[i];
      if (!el) {
        el = svg('path', { class: 'nc-unit' });
        pool.push(el);
        units.append(el);
      }
      const key = `${u.f}:${u.k}`;
      if (el.dataset.key !== key) {
        el.dataset.key = key;
        el.dataset.faction = String(u.f);
        el.setAttribute('d', shapePath(u.f, u.k === 1 ? 10 : 6.5));
        el.classList.toggle('is-heavy', u.k === 1);
      }
      const A = map.nodes[u.a]!;
      const B = map.nodes[u.b]!;
      const len = map.lanes[map.laneOf[u.a]![u.b]!]![2];
      const d = Math.min(len, u.d + UNIT_SPEED[u.k] * alpha);
      const ux = (B.x - A.x) / len;
      const uy = (B.y - A.y) / len;
      const x = A.x + ux * d - uy * STREAM_OFFSET;
      const y = A.y + uy * d + ux * STREAM_OFFSET;
      el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
      if (el.style.display) el.style.display = '';
    });
    for (let i = state.units.length; i < pool.length; i++) if (pool[i]!.style.display !== 'none') pool[i]!.style.display = 'none';
  };

  const renderShots = (events: StepEvents | null) => {
    const view = board!;
    clear(view.shots);
    if (!events || context.reducedMotion) return;
    for (const [v, x, y] of events.shots) {
      const node = view.map.nodes[v]!;
      view.shots.append(svg('line', { class: 'nc-shot', 'data-faction': state.owner[v]!, x1: node.x, y1: node.y, x2: x, y2: y }));
    }
  };

  const renderStatus = () => {
    const time = formatTime(seconds(state));
    const finished = state.result !== 'playing';
    if (state.result === 'won') statusEl.textContent = t('status.won', { time });
    else if (state.result === 'lost') statusEl.textContent = t('status.lost', { time });
    else if (running) statusEl.textContent = t('status.running', { time });
    else if (state.tick === 0) statusEl.textContent = t('status.ready');
    else statusEl.textContent = t('status.paused', { time });
    statusEl.dataset.state = finished ? state.result : running ? 'running' : 'paused';
    let rivals = 0;
    for (let f = 1; f < board!.map.factions; f++) rivals += nodeCount(state, f);
    countsEl.textContent = t('status.counts', { own: nodeCount(state, 0), rivals, neutral: nodeCount(state, -1) });
    pauseBtn.textContent = running ? t('action.pause') : state.tick === 0 ? t('action.start') : t('action.resume');
    pauseBtn.hidden = finished;
    pauseBtn.setAttribute('aria-pressed', String(!running));
    speedBtn.textContent = t('action.speed', { n: state.speed });
    speedBtn.dataset.speed = String(state.speed);
    if (!pending) {
      mapSelect.value = String(state.map);
      oppSelect.value = String(state.opponents);
    }
    oppSelect.disabled = Number(mapSelect.value) === INTRO_MAP;
    retryBtn.hidden = !finished;
    retryBtn.textContent = state.result === 'won' ? t('action.replay') : t('action.retry');
    container.classList.toggle('is-running', running);
    container.dataset.result = state.result;
  };

  const renderList = () => {
    clear(listEl);
    state.owner.forEach((owner, v) => {
      const targets = state.out[v]!.map(nodeName).join(', ') || t('list.none');
      listEl.append(h('li', {}, t('list.item', { name: nodeName(v), owner: ownerName(owner), type: typeName(v), level: state.level[v]!, targets })));
    });
    sinceList = 0;
  };

  /** Step-by-step hints on the introduction map, derived from the position (nothing extra is saved). */
  const renderHint = () => {
    let key = '';
    if (state.map === INTRO_MAP && state.result === 'playing') {
      const paths = state.out.some((o, v) => o.length > 0 && state.owner[v] === 0);
      if (state.stats.captured === 0) key = paths ? 'intro.start' : selected === null ? 'intro.select' : 'intro.target';
      else key = state.stats.captured < 3 ? 'intro.levels' : 'intro.win';
    }
    const text = key ? t(key) : '';
    if (hintEl.textContent !== text) {
      hintEl.textContent = text;
      hintEl.hidden = !key;
      if (key) announce(live, text);
    }
  };

  const momentText = (m: Moment): string => {
    const time = formatTime(Math.floor(m.tick / TICKS_PER_SECOND));
    if (m.kind === 'centre') return m.faction === 0 ? t('review.centreYou', { time }) : t('review.centreOther', { time, owner: ownerName(m.faction) });
    if (m.kind === 'gain' || m.kind === 'loss') return t(`review.${m.kind}`, { time, n: m.value });
    return t(`review.${m.kind}`, { time });
  };

  /** Post-game review: node counts per faction over time (SVG) with a text summary and key moments. */
  const renderReview = () => {
    const finished = state.result !== 'playing';
    reviewBox.hidden = !finished;
    clear(reviewChart);
    clear(reviewMoments);
    if (!finished) {
      reviewSummary.textContent = '';
      return;
    }
    const map = mapOf(state);
    const review = reviewOf(state, map.factions);
    const [W, H, L, R, T, B] = [320, 150, 30, 12, 10, 24];
    const first = review.points[0]!.tick;
    const span = Math.max(1, state.tick - first);
    const maxY = Math.max(1, ...review.points.flatMap((p) => p.counts));
    const px = (tick: number) => L + ((tick - first) / span) * (W - L - R);
    const py = (count: number) => T + (1 - count / maxY) * (H - T - B);
    const chart = svg(
      'svg',
      { viewBox: `0 0 ${W} ${H}`, class: 'nc-chart', role: 'img', 'aria-label': t('review.chart'), 'data-testid': 'nc-chart' },
      svg('line', { class: 'nc-axis', x1: L, y1: H - B, x2: W - R, y2: H - B }),
      svg('line', { class: 'nc-axis', x1: L, y1: T, x2: L, y2: H - B }),
      svg('text', { class: 'nc-axis-label', x: L - 4, y: T + 4, 'text-anchor': 'end' }, String(maxY)),
      svg('text', { class: 'nc-axis-label', x: L - 4, y: H - B + 4, 'text-anchor': 'end' }, '0'),
      svg('text', { class: 'nc-axis-label', x: L, y: H - 6, 'text-anchor': 'start' }, formatTime(Math.floor(first / TICKS_PER_SECOND))),
      svg('text', { class: 'nc-axis-label', x: W - R, y: H - 6, 'text-anchor': 'end' }, formatTime(seconds(state)))
    );
    review.moments.forEach((m, i) => {
      const x = px(m.tick).toFixed(1);
      chart.append(
        svg('line', { class: 'nc-moment-line', x1: x, y1: T, x2: x, y2: H - B }),
        svg('text', { class: 'nc-axis-label', x, y: T + 2, 'text-anchor': 'middle' }, String(i + 1))
      );
    });
    for (let f = map.factions - 1; f >= 0; f--) {
      const pts = review.points.map((p) => `${px(p.tick).toFixed(1)},${py(p.counts[f]!).toFixed(1)}`).join(' ');
      const last = review.points[review.points.length - 1]!;
      chart.append(
        svg('polyline', { class: 'nc-series', 'data-faction': f, points: pts, 'stroke-dasharray': DASHES[f]! }),
        svg('path', { class: 'nc-series-mark', 'data-faction': f, d: shapePath(f, 5), transform: `translate(${px(last.tick).toFixed(1)} ${py(last.counts[f]!).toFixed(1)})` })
      );
    }
    reviewChart.append(chart);
    const final = review.points[review.points.length - 1]!.counts;
    reviewSummary.textContent = t('review.summary', {
      time: formatTime(seconds(state)),
      own: final[0]!,
      best: review.best.count,
      at: formatTime(Math.floor(review.best.tick / TICKS_PER_SECOND))
    });
    review.moments.forEach((m) => reviewMoments.append(h('li', {}, momentText(m))));
  };

  const render = () => {
    if (!board || board.map !== mapOf(state)) build(mapOf(state));
    renderNodes();
    renderUnits(0);
    renderStatus();
    renderList();
    renderHint();
    renderReview();
  };

  const say = (text: string) => {
    messageEl.textContent = text;
    announce(live, text);
  };

  /* ---------- Simulation loop (view only drives time; rules decide everything) ---------- */

  const schedule = () => {
    if (typeof requestAnimationFrame === 'function') {
      frameKind = 'raf';
      frameHandle = requestAnimationFrame(frame);
    } else {
      frameKind = 'timeout';
      frameHandle = setTimeout(() => frame(performance.now()), 16) as unknown as number;
    }
  };

  const cancelFrame = () => {
    if (frameKind === 'raf') cancelAnimationFrame(frameHandle);
    else if (frameKind === 'timeout') clearTimeout(frameHandle);
    frameKind = null;
  };

  const tick = (): StepEvents => {
    const events = stepMut(state, board!.map, controller);
    sinceSave++;
    sinceList++;
    const notes: string[] = [];
    for (const [v, now, before] of events.captures) {
      if (now === 0) notes.push(t('event.captured', { name: nodeName(v) }));
      else if (before === 0) notes.push(t('event.lost', { name: nodeName(v), owner: ownerName(now) }));
      if (selected === v && now !== 0) selected = null;
    }
    if (notes.length > 0) announce(live, notes.join(' '));
    return events;
  };

  const frame = (now: number) => {
    if (!running) return;
    const elapsed = Math.min(250, Math.max(0, now - last));
    last = now;
    acc += elapsed * state.speed;
    let events: StepEvents | null = null;
    let steps = 0;
    while (acc >= TICK_MS && steps < 8 && state.result === 'playing') {
      events = tick();
      acc -= TICK_MS;
      steps++;
    }
    if (steps === 8) acc = 0;
    if (steps > 0) {
      renderNodes();
      renderStatus();
      if (state.map === INTRO_MAP) renderHint();
      renderShots(events);
      if (sinceList >= 10) renderList();
      if (sinceSave >= SAVE_EVERY) {
        sinceSave = 0;
        context.requestSave();
      }
    }
    if (state.result !== 'playing') {
      finish();
      return;
    }
    renderUnits(context.reducedMotion ? 0 : acc / TICK_MS);
    schedule();
  };

  const finish = () => {
    running = false;
    cancelFrame();
    selected = null;
    render();
    renderShots(null);
    context.requestSave();
    if (reported) return;
    reported = true;
    const won = state.result === 'won';
    announce(live, t(won ? 'result.won' : 'result.lost'));
    context.finished({ outcome: won ? 'won' : 'lost', stats: { seconds: seconds(state), nodesCaptured: state.stats.captured } });
    retryBtn.focus({ preventScroll: true });
  };

  const start = () => {
    if (running || state.result !== 'playing') return;
    running = true;
    last = performance.now();
    acc = 0;
    messageEl.textContent = '';
    renderStatus();
    schedule();
  };

  const stop = () => {
    if (!running) return;
    running = false;
    cancelFrame();
    renderUnits(0);
    renderShots(null);
    renderStatus();
    renderList();
    context.requestSave();
  };

  const togglePause = () => {
    if (state.result !== 'playing') return;
    if (running) {
      stop();
      announce(live, statusEl.textContent ?? '');
    } else {
      start();
      announce(live, t('action.resume'));
    }
  };

  const toggleSpeed = () => {
    state.speed = state.speed === 1 ? 2 : 1;
    renderStatus();
    context.requestSave();
  };

  /* ---------- Player commands ---------- */

  const select = (v: number | null, quiet = false) => {
    selected = v;
    renderNodes();
    renderHint();
    if (!quiet) say(v === null ? t('select.cleared') : t('select.source', { name: nodeName(v) }));
  };

  const command = (from: number, to: number) => {
    const map = board!.map;
    const { outcome } = toggleMut(state, map, 0, from, to);
    if (outcome === 'on' || outcome === 'off') {
      selected = null;
      renderNodes();
      renderList();
      renderHint();
      say(t(outcome === 'on' ? 'path.on' : 'path.off', { from: nodeName(from), to: nodeName(to) }));
      context.requestSave();
      return;
    }
    if (outcome === 'self') select(null);
    else if (outcome === 'limit') say(t('refuse.limit', { level: state.level[from]!, max: maxPaths(state.level[from]!) }));
    else say(t(`refuse.${outcome}`));
  };

  const activateNode = (v: number) => {
    if (state.result !== 'playing') {
      say(t('refuse.finished'));
      return;
    }
    const map = board!.map;
    if (selected === null) {
      if (state.owner[v] === 0) select(v);
      else say(t('select.pickOwn'));
      return;
    }
    if (v === selected) select(null);
    else if (map.laneOf[selected]![v]! >= 0) command(selected, v);
    else if (state.owner[v] === 0) select(v);
    else say(t('refuse.notAdjacent'));
  };

  /* ---------- Pointer and keyboard input ---------- */

  const clientToBoard = (x: number, y: number): [number, number] | null => {
    const matrix = svgEl.getScreenCTM?.();
    if (!matrix) return null;
    const inv = matrix.inverse();
    return [inv.a * x + inv.c * y + inv.e, inv.b * x + inv.d * y + inv.f];
  };
  const boardPoint = (event: MouseEvent): [number, number] | null => clientToBoard(event.clientX, event.clientY);

  const nearestNode = (p: [number, number] | null): number | null => {
    if (!p || !board) return null;
    let best: number | null = null;
    let bestD = PICK_R;
    board.map.nodes.forEach((node, v) => {
      const d = Math.hypot(node.x - p[0], node.y - p[1]);
      if (d <= bestD) [best, bestD] = [v, d];
    });
    return best;
  };

  const nodeFromEvent = (event: MouseEvent): number | null => {
    const picked = event.detail === 0 ? null : nearestNode(boardPoint(event));
    if (picked !== null) return picked;
    const el = (event.target as Element | null)?.closest?.('[data-node]');
    return el ? Number((el as SVGGElement).dataset.node) : null;
  };

  const focusNode = (v: number) => {
    focusIndex = v;
    reveal(v);
    renderNodes();
    board?.nodes[v]?.g.focus({ preventScroll: true });
  };

  const onBoardClick = (event: MouseEvent) => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    // Ignore a compatibility click right after a touch tap that was already handled.
    if (event.detail > 0 && performance.now() - lastTouchTap < 800) return;
    const v = nodeFromEvent(event);
    if (v === null) {
      if (selected !== null) select(null);
      return;
    }
    focusIndex = v;
    activateNode(v);
  };

  /* Gesture rules (touch): a touch that starts on or near a node never scrolls the page; one finger
   * then taps (select / target) or drags a path. A one-finger touch that starts on empty board space
   * scrolls the page vertically (CSS touch-action: pan-y). Two fingers pinch-zoom and pan the board.
   * Mouse: ctrl/⌘ + wheel (or a trackpad pinch) zooms at the pointer, plain wheel scrolls the page,
   * dragging empty board space pans when zoomed in. Buttons + / − / fit work for every input. */

  const applyCamera = () => {
    const size = BOARD / camera.zoom;
    const half = size / 2;
    camera.cx = Math.min(BOARD - half, Math.max(half, camera.cx));
    camera.cy = Math.min(BOARD - half, Math.max(half, camera.cy));
    svgEl.setAttribute('viewBox', `${(camera.cx - half).toFixed(1)} ${(camera.cy - half).toFixed(1)} ${size.toFixed(1)} ${size.toFixed(1)}`);
    svgEl.dataset.zoom = camera.zoom.toFixed(2);
    container.classList.toggle('is-zoomed', camera.zoom > MIN_ZOOM);
  };

  /** Zooms by `factor`, keeping board point `at` (default: the view centre) under the same screen spot. */
  const zoomBy = (factor: number, at?: [number, number]) => {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, camera.zoom * factor));
    const [ax, ay] = at ?? [camera.cx, camera.cy];
    const ratio = camera.zoom / next;
    camera.cx = ax + (camera.cx - ax) * ratio;
    camera.cy = ay + (camera.cy - ay) * ratio;
    camera.zoom = next;
    applyCamera();
  };

  const fit = () => {
    camera.zoom = MIN_ZOOM;
    camera.cx = BOARD / 2;
    camera.cy = BOARD / 2;
    applyCamera();
  };

  /** Keeps a keyboard-focused node inside the zoomed view. */
  const reveal = (v: number) => {
    if (!board || camera.zoom <= MIN_ZOOM) return;
    const node = board.map.nodes[v]!;
    const half = BOARD / camera.zoom / 2 - NODE_R * 2;
    if (Math.abs(node.x - camera.cx) > half || Math.abs(node.y - camera.cy) > half) {
      camera.cx = node.x;
      camera.cy = node.y;
      applyCamera();
    }
  };

  const onWheel = (event: WheelEvent) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    zoomBy(Math.exp(-Math.max(-50, Math.min(50, event.deltaY)) / 120), boardPoint(event) ?? undefined);
  };

  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    if (event.touches.length >= 2) {
      event.preventDefault();
      return;
    }
    if (touch && nearestNode(clientToBoard(touch.clientX, touch.clientY)) !== null) event.preventDefault();
  };

  const startPinch = () => {
    const [a, b] = [...pointers.values()];
    if (!a || !b) return;
    endDrag();
    pan = null;
    const mid: [number, number] = [(a.x + b.x) / 2, (a.y + b.y) / 2];
    pinch = { distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), zoom: camera.zoom, mid, centre: [camera.cx, camera.cy] };
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || event.button === 0) pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size >= 2) {
      startPinch();
      return;
    }
    if (event.button !== 0) return;
    const p = boardPoint(event);
    const v = nearestNode(p);
    if (!p) return;
    if (v === null) {
      // Mouse/pen drag on empty space pans a zoomed board (touch scrolls the page instead).
      if (event.pointerType !== 'touch' && camera.zoom > MIN_ZOOM) {
        pan = { x: event.clientX, y: event.clientY, cx: camera.cx, cy: camera.cy };
        try {
          svgEl.setPointerCapture(event.pointerId);
        } catch {
          /* not supported */
        }
      }
      return;
    }
    if (state.result !== 'playing' && event.pointerType !== 'touch') return;
    drag = { from: v, x: p[0], y: p[1], active: false };
    try {
      svgEl.setPointerCapture(event.pointerId);
    } catch {
      /* not supported */
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    if (pointers.has(event.pointerId)) pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const rect = svgEl.getBoundingClientRect();
      const scale = rect.width > 0 ? BOARD / rect.width : 1;
      const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, (pinch.zoom * Math.hypot(a!.x - b!.x, a!.y - b!.y)) / pinch.distance));
      camera.zoom = zoom;
      camera.cx = pinch.centre[0] - (((a!.x + b!.x) / 2 - pinch.mid[0]) * scale) / zoom;
      camera.cy = pinch.centre[1] - (((a!.y + b!.y) / 2 - pinch.mid[1]) * scale) / zoom;
      applyCamera();
      return;
    }
    if (pan) {
      const rect = svgEl.getBoundingClientRect();
      const scale = rect.width > 0 ? BOARD / rect.width / camera.zoom : 1;
      camera.cx = pan.cx - (event.clientX - pan.x) * scale;
      camera.cy = pan.cy - (event.clientY - pan.y) * scale;
      applyCamera();
      return;
    }
    if (!drag || !board) return;
    const p = boardPoint(event);
    if (!p) return;
    if (!drag.active && Math.hypot(p[0] - drag.x, p[1] - drag.y) < DRAG_START) return;
    if (!drag.active && state.owner[drag.from] !== 0) return;
    drag.active = true;
    const node = board.map.nodes[drag.from]!;
    const preview = board.preview;
    preview.setAttribute('x1', String(node.x));
    preview.setAttribute('y1', String(node.y));
    preview.setAttribute('x2', p[0].toFixed(1));
    preview.setAttribute('y2', p[1].toFixed(1));
    preview.setAttribute('visibility', 'visible');
  };

  const endDrag = () => {
    drag = null;
    board?.preview.setAttribute('visibility', 'hidden');
  };

  const onPointerCancel = (event: PointerEvent) => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinch = null;
    pan = null;
    endDrag();
  };

  const onPointerUp = (event: PointerEvent) => {
    pointers.delete(event.pointerId);
    if (pinch) {
      if (pointers.size < 2) pinch = null;
      suppressClick = event.pointerType !== 'touch';
      return;
    }
    if (pan) {
      pan = null;
      return;
    }
    const current = drag;
    endDrag();
    if (!current) return;
    if (!current.active) {
      // A touch tap on a node: the page's own click is suppressed by touchstart, so handle it here.
      if (event.pointerType === 'touch') {
        lastTouchTap = performance.now();
        focusIndex = current.from;
        activateNode(current.from);
      }
      return;
    }
    suppressClick = event.pointerType !== 'touch';
    const target = nearestNode(boardPoint(event));
    if (target !== null && target !== current.from) command(current.from, target);
  };

  const ARROWS: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };

  /** Nearest node roughly in the arrow's direction (screen geometry; the map is not mirrored in RTL). */
  const neighbourInDirection = (v: number, [ux, uy]: [number, number]): number | null => {
    const nodes = board!.map.nodes;
    const from = nodes[v]!;
    let best: number | null = null;
    let bestScore = Infinity;
    nodes.forEach((node, w) => {
      if (w === v) return;
      const dx = node.x - from.x;
      const dy = node.y - from.y;
      const along = dx * ux + dy * uy;
      const across = Math.abs(dx * uy - dy * ux);
      if (along <= 0 || across > along * 1.5) return;
      const score = along + 2 * across;
      if (score < bestScore) [best, bestScore] = [w, score];
    });
    return best;
  };

  const onBoardKey = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || !board) return;
    const el = (event.target as Element | null)?.closest?.('[data-node]') as SVGGElement | null;
    if (!el) return;
    const v = Number(el.dataset.node);
    if (event.key === 'Enter') {
      event.preventDefault();
      focusIndex = v;
      activateNode(v);
      return;
    }
    if (event.key === 'Escape') {
      if (selected !== null) {
        event.preventDefault();
        select(null);
      }
      return;
    }
    const last = board.map.nodes.length - 1;
    let next: number | null = null;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else if (ARROWS[event.key]) next = neighbourInDirection(v, ARROWS[event.key]!);
    else return;
    event.preventDefault();
    if (next !== null) focusNode(next);
  };

  /** P (and Space outside buttons) pauses; works from the page body or from inside the game. */
  const onDocumentKey = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || isTextEntry(event.target)) return;
    const isP = event.key === 'p' || event.key === 'P';
    if (!isP && event.key !== ' ') return;
    const target = event.target as Node | null;
    if (target && target !== document.body && target !== document.documentElement && !container.contains(target)) return;
    if (!isP && target instanceof HTMLElement && ['BUTTON', 'SUMMARY', 'A'].includes(target.tagName)) return;
    if (!container.isConnected || state.result !== 'playing') return;
    event.preventDefault();
    togglePause();
  };
  document.addEventListener('keydown', onDocumentKey);

  /* ---------- Lifecycle ---------- */

  const load = (next: NcState) => {
    if (running) {
      running = false;
      cancelFrame();
    }
    state = next;
    controller = opponents();
    selected = null;
    pending = null;
    confirmBox.hidden = true;
    pointers.clear();
    pinch = null;
    pan = null;
    drag = null;
    sinceSave = 0;
    reported = next.result !== 'playing';
    messageEl.textContent = '';
    focusIndex = Math.max(0, next.owner.indexOf(0));
    if (!container.isConnected || container.parentElement !== root) {
      clear(root);
      root.append(container);
    }
    board = null;
    render();
    renderShots(null);
  };

  /** A match counts as untouched before the first tick when the player has no active path. */
  const untouched = () => state.result !== 'playing' || (state.tick === 0 && state.out.every((o, v) => o.length === 0 || state.owner[v] !== 0));

  const setupText = (map: number, count: OpponentCount) =>
    map === INTRO_MAP ? t('confirm.intro') : t('confirm.text', { n: map + 1, opponents: count });

  const startSetup = (map: number, count: OpponentCount) => {
    pending = null;
    confirmBox.hidden = true;
    load(createGame(state.seed, { difficulty: state.difficulty, map, opponents: count }));
    context.requestSave();
  };

  /** Map or opponent count changed in the toolbar: start at once, or ask first if a match is under way. */
  const requestSetup = () => {
    const map = Number(mapSelect.value);
    const count = map === INTRO_MAP ? 1 : toOpponents(Number(oppSelect.value));
    if (!Number.isInteger(map) || map < INTRO_MAP || map >= MAPS_PER_SET) return;
    if (map !== INTRO_MAP && count !== state.opponents) fillMapOptions(count);
    mapSelect.value = String(map);
    oppSelect.value = String(count);
    oppSelect.disabled = map === INTRO_MAP;
    if (map === state.map && count === state.opponents) {
      pending = null;
      confirmBox.hidden = true;
      return;
    }
    if (untouched()) {
      startSetup(map, count);
      return;
    }
    stop();
    pending = { map, opponents: count };
    confirmText.textContent = setupText(map, count);
    confirmBox.hidden = false;
    announce(live, confirmText.textContent);
  };

  const confirmSetup = (yes: boolean) => {
    const choice = pending;
    pending = null;
    confirmBox.hidden = true;
    if (yes && choice) {
      startSetup(choice.map, choice.opponents);
      pauseBtn.focus({ preventScroll: true });
      return;
    }
    fillMapOptions(state.opponents);
    renderStatus();
    mapSelect.focus({ preventScroll: true });
  };

  const retry = () => {
    load(createGame(state.seed, { difficulty: state.difficulty, map: state.map, opponents: state.opponents, layout: state.layout }));
    context.requestSave();
    pauseBtn.focus({ preventScroll: true });
  };

  return {
    newGame(options: NewGameOptions) {
      // The opponent count is a game setting: a new match keeps it (the introduction is a one-off).
      load(createGame(options.seed, { difficulty: toDifficulty(options.difficulty), map: mapForSeed(options.seed), opponents: state.opponents }));
      context.requestSave();
    },
    restore(saved: NcState) {
      // A restored match always waits paused until the player resumes.
      load(cloneState(saved));
    },
    serialize: () => cloneState(state),
    pause() {
      stop();
    },
    resume() {
      // Deliberately stays paused: the player resumes when ready.
    },
    reset() {
      load(createGame(state.seed, { difficulty: state.difficulty, map: state.map, opponents: state.opponents, layout: state.layout }));
      context.requestSave();
    },
    dispose() {
      running = false;
      cancelFrame();
      document.removeEventListener('keydown', onDocumentKey);
      clear(root);
      board = null;
    }
  };
}
