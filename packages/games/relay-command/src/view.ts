import type { GameContext, GameInstance, GameResult, NewGameOptions } from '@wp/game-core';
import { normalizeSeed } from '@wp/game-core';
import {
  archetypeOf,
  cellOf,
  computeNetwork,
  nodeRadius,
  RETREAT_THRESHOLDS,
  TARGET_PRIORITIES,
  type Doctrine,
  type Entity,
  type Network,
  type Order,
  type World
} from '@wp/strategy-engine';
import { announce, clear, h } from '@wp/ui';
import {
  cancelOrder,
  concede,
  doctrineFor,
  doctrineRefusal,
  draftFor,
  lockTurn,
  newGame,
  OPPONENT,
  orderRefusal,
  orderSlots,
  outcome,
  picture,
  planDoctrine,
  planOrder,
  PLAYER,
  reportTurn,
  RULESET,
  scenarioById,
  sideValue,
  unitById,
  type RcState
} from './rules';
import './styles.css';

/** Map cell size in CSS pixels (the 44 px minimum touch target). */
export const CELL = 44;

const TERRAIN_NAMES: Readonly<Record<string, string>> = {
  '.': 'plain',
  '=': 'road',
  f: 'forest',
  h: 'hill',
  u: 'urban',
  s: 'swamp',
  '~': 'water',
  '^': 'ridge'
};

/** Automatic order ends worth telling the player (arrivals and regroups are expected outcomes). */
const REPORTED_ENDS: ReadonlySet<string> = new Set(['occupied', 'unreachable', 'blocked', 'lost-target', 'retreat']);

let instanceCounter = 0;

export function createRelayCommand(context: GameContext): GameInstance<RcState> {
  const { t, root } = context;
  const uid = `rc-${++instanceCounter}`;
  let state: RcState = newGame(0);
  let selected: number | null = null;
  let cursor = { x: 0, y: 0 };
  let confirming = false;
  /** Whether `finished()` was already reported for the current game. */
  let reported = false;

  /* ---------- Text helpers ---------- */
  /** The world as the player knows it (fog, D7); rule checks use the true world in `rules.ts`. */
  const world = (): World => picture(state.world).world;
  /** Tick of the last report for units shown at their last known position, else `undefined`. */
  const ghostTick = (e: Pick<Entity, 'id'>): number | undefined => picture(state.world).ghosts.get(e.id);
  const isGhost = (e: Pick<Entity, 'id'>): boolean => ghostTick(e) !== undefined;
  const known = (id: number): Entity | undefined => world().entities.find((e) => e.id === id);
  const unitName = (e: Pick<Entity, 'kind' | 'id'>) => t('unit.name', { name: t(`unit.${e.kind}`), id: e.id });
  const sideName = (side: number) => t(side === PLAYER ? 'side.own' : 'side.enemy');
  const terrainName = (x: number, y: number) => t(`terrain.${TERRAIN_NAMES[world().map.terrain[y * world().map.w + x] ?? '.'] ?? 'plain'}`);
  const isMobile = (e: Entity) => (archetypeOf(RULESET, e.kind)?.speed ?? 0) > 0;
  const needsDeploy = (e: Entity) => archetypeOf(RULESET, e.kind)?.comms?.needsDeploy === true;
  /** The player's network, computed once per state (not per unit or per drawing call). */
  let cachedNet: { state: RcState; net: Network } | undefined;
  const network = (): Network => {
    if (cachedNet?.state !== state) cachedNet = { state, net: computeNetwork(world(), RULESET, PLAYER) };
    return cachedNet.net;
  };
  const inContact = (e: Entity) => !isGhost(e) && network().coverage[cellOf(world().map, e.x, e.y)] === 1;
  const isSetUpOrPending = (e: Entity) =>
    (e.deploy ?? 0) >= RULESET.ticksPerTurn || e.order.type === 'deploy' || draftFor(state, e.id)?.type === 'deploy';
  const deployText = (e: Entity): string => {
    if ((e.deploy ?? 0) >= RULESET.ticksPerTurn) return t('deploy.active');
    if (e.order.type === 'deploy' || draftFor(state, e.id)?.type === 'deploy') return t('deploy.pending');
    return t('deploy.idle');
  };

  const describeOrder = (e: Entity, order: Order): string => {
    if (!isMobile(e) && order.type === 'hold') return t('order.static');
    switch (order.type) {
      case 'move':
        return t('order.move', { x: order.x + 1, y: order.y + 1 });
      case 'attack': {
        const target = known(order.target);
        return t('order.attack', { target: target ? unitName(target) : `#${order.target}` });
      }
      case 'deploy':
        return t('order.deploy');
      case 'escort': {
        const charge = known(order.target);
        return t('order.escort', { target: charge ? unitName(charge) : `#${order.target}` });
      }
      case 'patrol':
        return t('order.patrol', { x: order.x + 1, y: order.y + 1, rx: order.rx + 1, ry: order.ry + 1 });
      case 'regroup':
        return t('order.regroup');
      default:
        return t('order.hold');
    }
  };

  const describeUnit = (e: Entity): string => {
    const max = archetypeOf(RULESET, e.kind)?.hp ?? e.hp;
    const ghost = ghostTick(e);
    if (ghost !== undefined && e.side !== PLAYER) {
      // Enemies out of sight: only where and how strong they were when last reported.
      const where = t('unit.lastSeen', { name: unitName(e), side: sideName(e.side), x: e.x + 1, y: e.y + 1, hp: e.hp, max });
      return `${where} ${ghost === 0 ? t('unit.ghostStart') : t('unit.ghost', { turn: reportTurn(ghost) })}`;
    }
    let text = t('unit.summary', { name: unitName(e), side: sideName(e.side), x: e.x + 1, y: e.y + 1, hp: e.hp, max, order: describeOrder(e, e.order) });
    if (ghost !== undefined) text = `${text} ${ghost === 0 ? t('unit.ghostStart') : t('unit.ghost', { turn: reportTurn(ghost) })}`;
    if (e.side !== PLAYER) return text;
    if (isMobile(e)) text = `${text} (${t(inContact(e) ? 'contact.in' : 'contact.out')})`;
    if (needsDeploy(e)) text = `${text} ${deployText(e)}`;
    const planned = draftFor(state, e.id);
    return planned ? `${text} ${t('unit.planned', { order: describeOrder(e, planned) })}` : text;
  };

  const unitsAt = (x: number, y: number) => world().entities.filter((e) => e.x === x && e.y === y);

  const describeCell = (x: number, y: number): string => {
    const units = unitsAt(x, y);
    if (units.length === 0) return t('cell.describe', { x: x + 1, y: y + 1, terrain: terrainName(x, y) });
    return t('cell.describeUnit', { x: x + 1, y: y + 1, terrain: terrainName(x, y), unit: units.map(describeUnit).join(' ') });
  };

  /* ---------- DOM ---------- */
  const live = h('p', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'rc-live' });
  const turnEl = h('p', { class: 'rc-turn', 'data-testid': 'rc-turn' });
  const statusEl = h('p', { class: 'rc-status', 'data-testid': 'rc-status', role: 'status', tabindex: -1 });
  const slotsEl = h('p', { class: 'rc-slots', 'data-testid': 'rc-slots' });
  /** Visible reason for a refused order (the live region alone only reaches screen readers). */
  const noticeEl = h('p', { class: 'rc-notice', 'data-testid': 'rc-notice', hidden: true });
  const lockBtn = h('button', { type: 'button', class: 'primary', 'data-testid': 'rc-lock', onclick: () => onLock() }, t('action.lock'));
  const concedeBtn = h('button', { type: 'button', 'data-testid': 'rc-concede', onclick: () => setConfirming(true) }, t('action.concede'));
  const confirmBox = h(
    'div',
    { class: 'rc-confirm', 'data-testid': 'rc-confirm', role: 'group', 'aria-label': t('action.concedeConfirm') },
    h('span', {}, t('action.concedeConfirm')),
    h('button', { type: 'button', 'data-testid': 'rc-concede-yes', onclick: () => onConcede() }, t('action.concedeYes')),
    h('button', { type: 'button', 'data-testid': 'rc-concede-no', onclick: () => setConfirming(false) }, t('action.concedeNo'))
  );

  const cursorDesc = h('p', { id: `${uid}-cursor`, class: 'rc-cursor', 'data-testid': 'rc-cursor' });
  const canvas = h('canvas', {
    class: 'rc-map',
    'data-testid': 'rc-map',
    tabindex: 0,
    'data-autofocus': true,
    role: 'application',
    'aria-label': t('map.label'),
    'aria-describedby': `${uid}-cursor`
  });
  const mapWrap = h('div', { class: 'rc-mapwrap', dir: 'ltr' }, canvas);

  const selectionTitle = h('h3', {}, t('panel.selection'));
  const selectionText = h('p', { 'data-testid': 'rc-selection-text' });
  const holdBtn = h('button', { type: 'button', 'data-testid': 'rc-hold', onclick: () => onHold() }, t('action.hold'));
  const deployBtn = h('button', { type: 'button', 'data-testid': 'rc-deploy', onclick: () => orderSelected({ type: 'deploy' }) }, t('action.deploy'));
  const regroupBtn = h('button', { type: 'button', 'data-testid': 'rc-regroup', onclick: () => orderSelected({ type: 'regroup' }) }, t('action.regroup'));
  const cancelBtn = h('button', { type: 'button', 'data-testid': 'rc-cancel', onclick: () => onCancel() }, t('action.cancel'));

  /** What the next map click means for the selected unit. */
  type ClickMode = 'move' | 'patrol' | 'escort';
  let mode: ClickMode = 'move';
  const modeButtons = (['move', 'patrol', 'escort'] as const).map((m) =>
    h('button', { type: 'button', 'data-testid': `rc-mode-${m}`, 'aria-pressed': 'false', onclick: () => setMode(m) }, t(`mode.${m}`))
  );
  const modeHint = h('p', { class: 'rc-hint', 'data-testid': 'rc-mode-hint' });
  const modeGroup = h('div', { class: 'rc-actions', role: 'group', 'aria-label': t('mode.label') }, h('span', { class: 'rc-label' }, t('mode.label')), ...modeButtons);

  const retreatSelect = h('select', { 'data-testid': 'rc-doctrine-retreat', onchange: () => onDoctrine() });
  for (const n of RETREAT_THRESHOLDS) retreatSelect.append(h('option', { value: String(n) }, n === 0 ? t('doctrine.never') : t('doctrine.percent', { n })));
  const prioritySelect = h('select', { 'data-testid': 'rc-doctrine-priority', onchange: () => onDoctrine() });
  for (const p of TARGET_PRIORITIES) prioritySelect.append(h('option', { value: p }, t(`doctrine.priority.${p}`)));
  const coverBox = h('input', { type: 'checkbox', 'data-testid': 'rc-doctrine-cover', onchange: () => onDoctrine() });
  const holdFireBox = h('input', { type: 'checkbox', 'data-testid': 'rc-doctrine-holdfire', onchange: () => onDoctrine() });
  const doctrineBox = h(
    'fieldset',
    { class: 'rc-doctrine', 'data-testid': 'rc-doctrine' },
    h('legend', {}, t('doctrine.title')),
    h('label', {}, h('span', {}, t('doctrine.retreat')), retreatSelect),
    h('label', {}, h('span', {}, t('doctrine.priority')), prioritySelect),
    h('label', { class: 'rc-check' }, coverBox, h('span', {}, t('doctrine.seekCover'))),
    h('label', { class: 'rc-check' }, holdFireBox, h('span', {}, t('doctrine.holdFire')))
  );
  const selectionActions = h('div', { class: 'rc-orders' }, h('div', { class: 'rc-actions' }, holdBtn, regroupBtn, deployBtn, cancelBtn), modeGroup, modeHint, doctrineBox);
  const selectionPanel = h('section', { class: 'rc-panel', 'data-testid': 'rc-selection' }, selectionTitle, selectionText, noticeEl, selectionActions);

  const ownList = h('ul', { class: 'rc-units', 'data-testid': 'rc-own' });
  const enemyList = h('ul', { class: 'rc-units', 'data-testid': 'rc-enemy' });
  const summaryList = h('ul', { class: 'rc-summary', 'data-testid': 'rc-summary' });

  const help = h(
    'details',
    { class: 'rc-help' },
    h('summary', {}, t('help.title')),
    ...['help.turns', 'help.orders', 'help.network', 'help.fog', 'help.doctrine', 'help.combat', 'help.goal', 'help.shapes', 'help.access'].map((k) => h('p', {}, t(k)))
  );

  const shell = h(
    'div',
    { class: 'wp-relay-command', 'data-testid': 'rc-root' },
    h('div', { class: 'rc-bar' }, turnEl, statusEl, slotsEl, h('div', { class: 'rc-actions' }, lockBtn, concedeBtn), confirmBox),
    h(
      'div',
      { class: 'rc-main' },
      h('div', { class: 'rc-board' }, mapWrap, cursorDesc),
      h(
        'div',
        { class: 'rc-side' },
        selectionPanel,
        h('section', { class: 'rc-panel' }, h('h3', {}, t('list.own')), ownList),
        h('section', { class: 'rc-panel' }, h('h3', {}, t('list.enemy')), enemyList),
        h('section', { class: 'rc-panel' }, h('h3', {}, t('summary.title')), summaryList)
      )
    ),
    help,
    live
  );
  root.append(shell);

  /* ---------- Rendering ---------- */
  function render(): void {
    const w = world();
    const finished = state.phase === 'finished';
    turnEl.textContent = t('status.turn', { turn: Math.min(w.turn + 1, state.turnLimit), limit: state.turnLimit });
    statusEl.textContent = statusText();
    statusEl.setAttribute('data-phase', state.phase);
    slotsEl.hidden = finished;
    slotsEl.textContent = t('status.slots', { n: state.draft.length, slots: orderSlots(state) });
    lockBtn.disabled = finished;
    concedeBtn.disabled = finished;
    concedeBtn.hidden = confirming;
    confirmBox.hidden = !confirming || finished;
    cursorDesc.textContent = describeCell(cursor.x, cursor.y);
    renderSelection();
    renderLists();
    renderSummary();
    draw();
  }

  function statusText(): string {
    if (state.phase === 'plan') return t('status.plan', { n: state.draft.length });
    if (state.conceded) return t('status.conceded');
    const own = sideValue(world(), PLAYER);
    const enemy = sideValue(world(), OPPONENT);
    const decidedByPost = outcome({ ...world(), turn: 0 }, state.turnLimit) !== null;
    if (state.result === 'won') return decidedByPost ? t('status.won') : t('status.wonScore', { own, enemy });
    if (state.result === 'lost') return decidedByPost ? t('status.lost') : t('status.lostScore', { own, enemy });
    return t('status.draw', { own, enemy });
  }

  function renderSelection(): void {
    const unit = selected === null ? undefined : known(selected);
    const reachable = !!unit && unit.side === PLAYER && inContact(unit);
    const canOrder = !!unit && unit.side === PLAYER && isMobile(unit) && reachable && state.phase === 'plan';
    if (!unit) {
      selectionText.textContent = t('panel.none');
    } else if (!isMobile(unit)) {
      selectionText.textContent = `${describeUnit(unit)} ${t('panel.static')}`;
    } else if (unit.side === PLAYER && !reachable) {
      selectionText.textContent = `${describeUnit(unit)} ${t('panel.outOfContact')}`;
    } else {
      selectionText.textContent = `${describeUnit(unit)} ${canOrder ? t('panel.hint') : ''}`.trim();
    }
    selectionActions.hidden = !canOrder;
    deployBtn.hidden = !unit || !needsDeploy(unit) || isSetUpOrPending(unit);
    for (const b of modeButtons) b.setAttribute('aria-pressed', String(b.getAttribute('data-testid') === `rc-mode-${mode}`));
    modeHint.textContent = mode === 'patrol' ? t('mode.hintPatrol') : mode === 'escort' ? t('mode.hintEscort') : '';
    modeHint.hidden = mode === 'move';
    if (unit && canOrder) {
      const d = doctrineFor(state, unit.id);
      retreatSelect.value = String(d.retreatBelow);
      prioritySelect.value = d.priority;
      coverBox.checked = d.seekCover;
      holdFireBox.checked = d.holdFire;
    }
    cancelBtn.disabled = !unit || !draftFor(state, unit.id);
  }

  function renderLists(): void {
    clear(ownList);
    clear(enemyList);
    const own = world().entities.filter((e) => e.side === PLAYER);
    const enemies = world().entities.filter((e) => e.side !== PLAYER);
    for (const e of own) {
      const btn = h(
        'button',
        { type: 'button', class: 'rc-unit', 'data-testid': `rc-unit-${e.id}`, 'aria-pressed': selected === e.id ? 'true' : 'false', onclick: () => select(e.id) },
        describeUnit(e)
      );
      ownList.append(h('li', {}, btn));
    }
    if (own.length === 0) ownList.append(h('li', {}, t('list.empty')));
    const attacker = selected === null ? undefined : known(selected);
    const canAttack =
      !!attacker && attacker.side === PLAYER && isMobile(attacker) && inContact(attacker) && !!archetypeOf(RULESET, attacker.kind)?.weapon && state.phase === 'plan';
    for (const e of enemies) {
      const item = h('li', { 'data-testid': `rc-enemy-${e.id}` }, h('span', {}, describeUnit(e)));
      if (canAttack && !isGhost(e)) {
        item.append(h('button', { type: 'button', 'data-testid': `rc-attack-${e.id}`, onclick: () => orderSelected({ type: 'attack', target: e.id }) }, t('action.attack', { name: unitName(e) })));
      }
      enemyList.append(item);
    }
    if (enemies.length === 0) enemyList.append(h('li', {}, t('list.empty')));
  }

  function renderSummary(): void {
    clear(summaryList);
    const events = state.events;
    if (events.length === 0) {
      summaryList.append(h('li', {}, t('summary.none')));
      return;
    }
    let dealt = 0;
    let taken = 0;
    let bumps = 0;
    const lines: string[] = [];
    const told = new Set<string>();
    for (const e of events) {
      if (e.t === 'hit') {
        if (e.side === PLAYER) taken += e.damage;
        else dealt += e.damage;
      } else if (e.t === 'bump') {
        if (unitById(state, e.id)?.side !== OPPONENT) bumps += 1;
      } else if (e.t === 'destroyed') {
        lines.push(t(e.side === PLAYER ? 'summary.lostUnit' : 'summary.destroyedUnit', { name: unitName(e) }));
      } else if (e.t === 'order-ended' && REPORTED_ENDS.has(e.reason) && !told.has(`${e.id}:${e.reason}`)) {
        // Orders the engine ended on its own are reported for the player's units, once per
        // unit and reason in a turn.
        const unit = unitById(state, e.id);
        told.add(`${e.id}:${e.reason}`);
        if (unit?.side === PLAYER) lines.push(t(`summary.ended.${e.reason}`, { name: unitName(unit) }));
      }
    }
    summaryList.append(h('li', {}, t('summary.damage', { dealt, taken })));
    for (const line of lines) summaryList.append(h('li', {}, line));
    if (bumps > 0) summaryList.append(h('li', {}, t('summary.bumps', { n: bumps })));
  }

  /* ---------- Canvas ---------- */
  // Colours come from CSS custom properties on the game container (light/dark aware).
  const css = (name: string, fallback: string) => getComputedStyle(shell).getPropertyValue(name).trim() || fallback;

  function draw(): void {
    const w = world();
    const width = w.map.w * CELL;
    const height = w.map.h * CELL;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.setAttribute('data-cols', String(w.map.w));
    canvas.setAttribute('data-rows', String(w.map.h));
    let g: CanvasRenderingContext2D | null = null;
    try {
      g = canvas.getContext('2d');
    } catch {
      g = null;
    }
    if (!g) return; // No canvas support (e.g. jsdom): the DOM lists remain fully usable.
    const ratio = Math.max(1, Math.min(3, globalThis.devicePixelRatio || 1));
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    g.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawTerrain(g, w);
    drawFog(g, w);
    drawCoverage(g, w);
    drawOrders(g, w);
    drawEvents(g);
    for (const e of w.entities) drawUnit(g, e);
    drawCursor(g);
  }

  /** Hatches cells outside the own command coverage and rings the connected network nodes. */
  function drawCoverage(g: CanvasRenderingContext2D, w: World): void {
    const net = network();
    g.save();
    g.strokeStyle = css('--rc-nocover', 'rgba(29, 29, 27, 0.35)');
    g.lineWidth = 1;
    g.beginPath();
    for (let y = 0; y < w.map.h; y++) {
      for (let x = 0; x < w.map.w; x++) {
        if (net.coverage[cellOf(w.map, x, y)] === 1) continue;
        const px = x * CELL;
        const py = y * CELL;
        for (let k = 0; k < CELL; k += 11) {
          g.moveTo(px + k, py);
          g.lineTo(px, py + k);
          g.moveTo(px + CELL, py + k);
          g.lineTo(px + k, py + CELL);
        }
      }
    }
    g.stroke();
    g.strokeStyle = css('--wp-p1', '#24508f');
    g.setLineDash([3, 6]);
    for (const id of net.nodes) {
      const node = unitById(state, id);
      const r = node ? nodeRadius(w, RULESET, node) : 0;
      if (!node || r === 0) continue;
      const [cx, cy] = centre(node.x, node.y);
      g.beginPath();
      g.arc(cx, cy, r * CELL + CELL / 2, 0, Math.PI * 2);
      g.stroke();
    }
    g.restore();
  }

  /** Veils cells the player does not see now: a translucent wash plus a dot (not colour alone). */
  function drawFog(g: CanvasRenderingContext2D, w: World): void {
    const observed = picture(state.world).observed;
    g.save();
    g.fillStyle = css('--rc-fog', 'rgba(29, 29, 27, 0.18)');
    for (let y = 0; y < w.map.h; y++) {
      for (let x = 0; x < w.map.w; x++) {
        if (observed[cellOf(w.map, x, y)] === 1) continue;
        g.fillRect(x * CELL, y * CELL, CELL, CELL);
        g.beginPath();
        g.arc(x * CELL + CELL - 7, y * CELL + CELL - 7, 2, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.restore();
  }

  function drawTerrain(g: CanvasRenderingContext2D, w: World): void {
    const line = css('--rc-grid', '#00000022');
    for (let y = 0; y < w.map.h; y++) {
      for (let x = 0; x < w.map.w; x++) {
        const code = w.map.terrain[y * w.map.w + x] ?? '.';
        const name = TERRAIN_NAMES[code] ?? 'plain';
        const px = x * CELL;
        const py = y * CELL;
        g.fillStyle = css(`--rc-${name}`, '#ddd');
        g.fillRect(px, py, CELL, CELL);
        g.strokeStyle = css('--rc-mark', '#00000055');
        g.fillStyle = css('--rc-mark', '#00000055');
        g.lineWidth = 1.5;
        drawTerrainMark(g, name, px, py);
        g.strokeStyle = line;
        g.lineWidth = 1;
        g.strokeRect(px + 0.5, py + 0.5, CELL - 1, CELL - 1);
      }
    }
  }

  /** Pattern marks so that terrain is never told apart by colour alone. */
  function drawTerrainMark(g: CanvasRenderingContext2D, name: string, px: number, py: number): void {
    const c = CELL;
    g.beginPath();
    switch (name) {
      case 'road':
        g.moveTo(px, py + c / 2);
        g.lineTo(px + c, py + c / 2);
        g.setLineDash([4, 4]);
        g.stroke();
        g.setLineDash([]);
        return;
      case 'forest':
        for (const [dx, dy] of [[0.25, 0.3], [0.7, 0.25], [0.45, 0.7]] as const) {
          g.moveTo(px + dx * c + 4, py + dy * c);
          g.arc(px + dx * c, py + dy * c, 4, 0, Math.PI * 2);
        }
        g.fill();
        return;
      case 'hill':
        g.moveTo(px + c * 0.2, py + c * 0.75);
        g.lineTo(px + c * 0.5, py + c * 0.3);
        g.lineTo(px + c * 0.8, py + c * 0.75);
        g.stroke();
        return;
      case 'urban':
        g.rect(px + c * 0.2, py + c * 0.2, c * 0.22, c * 0.22);
        g.rect(px + c * 0.55, py + c * 0.5, c * 0.22, c * 0.22);
        g.stroke();
        return;
      case 'swamp':
        for (const dy of [0.35, 0.65]) {
          g.moveTo(px + c * 0.2, py + dy * c);
          g.lineTo(px + c * 0.45, py + dy * c);
          g.moveTo(px + c * 0.55, py + dy * c);
          g.lineTo(px + c * 0.8, py + dy * c);
        }
        g.stroke();
        return;
      case 'water':
        for (const dy of [0.35, 0.65]) {
          g.moveTo(px + c * 0.15, py + dy * c);
          g.quadraticCurveTo(px + c * 0.32, py + dy * c - 6, px + c * 0.5, py + dy * c);
          g.quadraticCurveTo(px + c * 0.68, py + dy * c + 6, px + c * 0.85, py + dy * c);
        }
        g.stroke();
        return;
      case 'ridge':
        for (let i = 0; i < 4; i++) {
          g.moveTo(px + (i * c) / 4, py + c);
          g.lineTo(px + ((i + 1) * c) / 4, py);
        }
        g.stroke();
        return;
      default:
        return;
    }
  }

  const centre = (x: number, y: number) => [x * CELL + CELL / 2, y * CELL + CELL / 2] as const;

  function drawOrders(g: CanvasRenderingContext2D, w: World): void {
    for (const e of w.entities) {
      if (e.side !== PLAYER) continue;
      const planned = draftFor(state, e.id);
      const order = planned ?? e.order;
      const [ax, ay] = centre(e.x, e.y);
      let target: readonly [number, number] | undefined;
      if (order.type === 'move') target = centre(order.x, order.y);
      if (order.type === 'attack' || order.type === 'escort') {
        const other = known(order.target);
        if (other) target = centre(other.x, other.y);
      }
      if (order.type === 'patrol') target = centre(order.x, order.y);
      if (!target) continue;
      g.save();
      g.globalAlpha = planned ? 1 : 0.4;
      g.strokeStyle = css('--wp-p1', '#24508f');
      g.lineWidth = planned ? 3 : 2;
      // Move: dashed · attack: solid with a cross · escort: dotted · patrol: dashed with rings at both ends.
      g.setLineDash(order.type === 'move' || order.type === 'patrol' ? [6, 5] : order.type === 'escort' ? [2, 4] : []);
      if (order.type === 'patrol') {
        const [rx, ry] = centre(order.rx, order.ry);
        g.beginPath();
        g.moveTo(rx, ry);
        g.lineTo(ax, ay);
        g.stroke();
        for (const [px, py] of [target, [rx, ry] as const]) {
          g.beginPath();
          g.arc(px, py, 6, 0, Math.PI * 2);
          g.stroke();
        }
      }
      g.beginPath();
      g.moveTo(ax, ay);
      g.lineTo(target[0], target[1]);
      g.stroke();
      g.setLineDash([]);
      if (order.type === 'attack') {
        g.beginPath();
        g.moveTo(target[0] - 8, target[1] - 8);
        g.lineTo(target[0] + 8, target[1] + 8);
        g.moveTo(target[0] + 8, target[1] - 8);
        g.lineTo(target[0] - 8, target[1] + 8);
        g.stroke();
      }
      g.restore();
    }
  }

  /** Marks where units were destroyed in the last turn (a small ring with a cross). */
  function drawEvents(g: CanvasRenderingContext2D): void {
    g.save();
    g.strokeStyle = css('--wp-danger', '#a1271b');
    g.lineWidth = 2;
    for (const e of state.events) {
      if (e.t !== 'destroyed') continue;
      const [cx, cy] = centre(e.x, e.y);
      g.beginPath();
      g.arc(cx, cy, CELL * 0.3, 0, Math.PI * 2);
      g.moveTo(cx - 6, cy - 6);
      g.lineTo(cx + 6, cy + 6);
      g.moveTo(cx + 6, cy - 6);
      g.lineTo(cx - 6, cy + 6);
      g.stroke();
    }
    g.restore();
  }

  function drawUnit(g: CanvasRenderingContext2D, e: Entity): void {
    const [cx, cy] = centre(e.x, e.y);
    const own = e.side === PLAYER;
    const colour = css(own ? '--wp-p1' : '--wp-p2', own ? '#24508f' : '#9a3412');
    const surface = css('--wp-surface', '#ffffff');
    const r = CELL * 0.34;
    const ghost = isGhost(e);
    g.save();
    g.lineWidth = 3;
    g.strokeStyle = colour;
    g.fillStyle = own ? colour : surface;
    // Last known position: faded, dashed outline and a question mark (not colour alone).
    if (ghost) {
      g.globalAlpha = 0.55;
      g.setLineDash([4, 3]);
      g.fillStyle = surface;
    }
    g.beginPath();
    if (e.kind === 'command-post') g.rect(cx - r, cy - r, r * 2, r * 2);
    else if (own) g.arc(cx, cy, r, 0, Math.PI * 2);
    else {
      g.moveTo(cx, cy - r - 2);
      g.lineTo(cx + r + 2, cy);
      g.lineTo(cx, cy + r + 2);
      g.lineTo(cx - r - 2, cy);
      g.closePath();
    }
    g.fill();
    g.stroke();
    g.setLineDash([]);
    // Kind glyph, drawn in the contrasting colour.
    g.strokeStyle = own && !ghost ? surface : colour;
    g.fillStyle = own && !ghost ? surface : colour;
    g.lineWidth = 2;
    drawGlyph(g, e.kind, cx, cy);
    // Health bar under the unit.
    const max = RULESET.archetypes[e.kind]?.hp ?? e.hp;
    const bw = CELL * 0.7;
    g.fillStyle = css('--wp-border', '#cfcdc4');
    g.fillRect(cx - bw / 2, cy + CELL * 0.38, bw, 4);
    g.fillStyle = colour;
    g.fillRect(cx - bw / 2, cy + CELL * 0.38, (bw * e.hp) / max, 4);
    if (ghost) {
      g.globalAlpha = 1;
      g.fillStyle = colour;
      g.font = `bold ${Math.round(CELL * 0.3)}px sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('?', e.x * CELL + 9, e.y * CELL + 10);
    }
    if (own && isMobile(e) && !inContact(e)) {
      // "No contact" badge: a small crossed-out signal in the corner (not colour alone).
      const bx = e.x * CELL + CELL - 10;
      const by = e.y * CELL + 10;
      g.strokeStyle = css('--wp-danger', '#a1271b');
      g.lineWidth = 2;
      g.beginPath();
      g.arc(bx, by, 6, Math.PI * 1.15, Math.PI * 1.85);
      g.moveTo(bx - 6, by + 6);
      g.lineTo(bx + 6, by - 6);
      g.stroke();
    }
    if (selected === e.id) {
      g.strokeStyle = css('--wp-focus', '#b4530a');
      g.lineWidth = 3;
      g.strokeRect(e.x * CELL + 2, e.y * CELL + 2, CELL - 4, CELL - 4);
    }
    g.restore();
  }

  function drawGlyph(g: CanvasRenderingContext2D, kind: string, cx: number, cy: number): void {
    g.beginPath();
    switch (kind) {
      case 'rifles':
        for (const dx of [-6, 0, 6]) {
          g.moveTo(cx + dx + 2, cy);
          g.arc(cx + dx, cy, 2, 0, Math.PI * 2);
        }
        g.fill();
        return;
      case 'lancer':
        g.moveTo(cx - 7, cy + 7);
        g.lineTo(cx + 7, cy - 7);
        g.moveTo(cx + 7, cy - 7);
        g.lineTo(cx + 1, cy - 7);
        g.moveTo(cx + 7, cy - 7);
        g.lineTo(cx + 7, cy - 1);
        g.stroke();
        return;
      case 'warden':
        g.rect(cx - 7, cy - 3, 11, 7);
        g.moveTo(cx + 4, cy);
        g.lineTo(cx + 9, cy);
        g.stroke();
        return;
      case 'howitzer':
        g.arc(cx, cy + 4, 7, Math.PI, Math.PI * 2);
        g.moveTo(cx, cy + 4);
        g.lineTo(cx + 6, cy - 6);
        g.stroke();
        return;
      case 'mast-truck':
        g.moveTo(cx, cy + 7);
        g.lineTo(cx, cy - 6);
        g.moveTo(cx - 5, cy - 3);
        g.arc(cx, cy - 6, 5, Math.PI * 0.85, Math.PI * 0.15, true);
        g.stroke();
        return;
      case 'command-post':
        g.moveTo(cx - 5, cy + 7);
        g.lineTo(cx - 5, cy - 7);
        g.lineTo(cx + 6, cy - 4);
        g.lineTo(cx - 5, cy - 1);
        g.stroke();
        return;
      default:
        g.arc(cx, cy, 3, 0, Math.PI * 2);
        g.fill();
    }
  }

  function drawCursor(g: CanvasRenderingContext2D): void {
    if (document.activeElement !== canvas) return;
    g.save();
    g.strokeStyle = css('--wp-focus', '#b4530a');
    g.lineWidth = 2;
    g.setLineDash([5, 4]);
    g.strokeRect(cursor.x * CELL + 4, cursor.y * CELL + 4, CELL - 8, CELL - 8);
    g.restore();
  }

  /* ---------- Interaction ---------- */
  function commit(next: RcState, message?: string): void {
    state = next;
    context.requestSave();
    if (state.phase === 'finished' && !reported && state.result) {
      reported = true;
      context.finished(resultOf(state));
    }
    render();
    if (message) announce(live, message);
  }

  function resultOf(s: RcState): GameResult {
    return { outcome: s.result ?? 'lost', stats: { turns: s.world.turn } };
  }

  function select(id: number | null): void {
    selected = id;
    mode = 'move';
    noticeEl.hidden = true;
    const unit = id === null ? undefined : known(id);
    if (unit) cursor = { x: unit.x, y: unit.y };
    render();
    if (unit) announce(live, t('announce.selected', { name: unitName(unit) }));
  }

  function orderSelected(order: Order): void {
    if (selected === null) return;
    const unit = known(selected);
    const refusal = orderRefusal(state, selected, order);
    const next = refusal === null ? planOrder(state, selected, order) : undefined;
    if (!unit || !next) {
      showRefusal(refusal);
      return;
    }
    noticeEl.hidden = true;
    mode = 'move';
    commit(next, t('announce.planned', { name: unitName(unit), order: describeOrder(unit, order) }));
  }

  /** Shows why an order was refused, visibly and for screen readers. */
  function showRefusal(refusal: string | null): void {
    const specific = refusal === 'out-of-contact' || refusal === 'no-slots' || refusal === 'impassable' || refusal === 'not-visible';
    const message = specific ? t(`refuse.${refusal}`, { slots: orderSlots(state) }) : t('announce.refused');
    noticeEl.textContent = message;
    noticeEl.hidden = false;
    announce(live, message);
  }

  function setMode(next: ClickMode): void {
    mode = next;
    render();
  }

  /** Doctrine controls changed: plan the new doctrine (one order slot), or explain why not. */
  function onDoctrine(): void {
    if (selected === null) return;
    const unit = known(selected);
    if (!unit) return;
    const doctrine: Doctrine = {
      retreatBelow: Number(retreatSelect.value) as Doctrine['retreatBelow'],
      priority: prioritySelect.value as Doctrine['priority'],
      seekCover: coverBox.checked,
      holdFire: holdFireBox.checked
    };
    const refusal = doctrineRefusal(state, unit.id, doctrine);
    const next = refusal === null ? planDoctrine(state, unit.id, doctrine) : undefined;
    if (!next) {
      showRefusal(refusal);
      render(); // restores the controls to the doctrine that still applies
      return;
    }
    noticeEl.hidden = true;
    commit(next, t('announce.doctrine', { name: unitName(unit) }));
  }

  function onHold(): void {
    orderSelected({ type: 'hold' });
  }

  function onCancel(): void {
    if (selected === null) return;
    const unit = known(selected);
    if (!unit || !draftFor(state, unit.id)) return;
    commit(cancelOrder(state, unit.id), t('announce.cancelled', { name: unitName(unit) }));
  }

  /** Pointer or Enter on a map cell. */
  function activateCell(x: number, y: number): void {
    cursor = { x, y };
    const here = unitsAt(x, y);
    const ownHere = here.find((e) => e.side === PLAYER);
    // A ghost marks where an enemy was, not where it is: its cell takes a move order.
    const enemyHere = here.find((e) => e.side !== PLAYER && !isGhost(e));
    const current = selected === null ? undefined : known(selected);
    const canOrder = !!current && current.side === PLAYER && isMobile(current) && state.phase === 'plan';
    if (canOrder && mode === 'escort' && ownHere && ownHere.id !== selected) {
      orderSelected({ type: 'escort', target: ownHere.id });
      return;
    }
    if (ownHere && ownHere.id !== selected) {
      select(ownHere.id);
      return;
    }
    if (canOrder && mode === 'patrol' && current && !ownHere && !enemyHere) {
      orderSelected({ type: 'patrol', x, y, rx: current.x, ry: current.y });
      return;
    }
    if (canOrder && enemyHere) {
      orderSelected({ type: 'attack', target: enemyHere.id });
      return;
    }
    if (canOrder && (!ownHere || isGhost(ownHere))) {
      orderSelected({ type: 'move', x, y });
      return;
    }
    render();
    announce(live, describeCell(x, y));
  }

  function onLock(): void {
    if (state.phase !== 'plan') return;
    confirming = false;
    const next = lockTurn(state);
    if (selected !== null && !unitById(next, selected)) selected = null;
    commit(next);
    // render() has rebuilt the summary list; announce its fresh text.
    announce(live, `${t('announce.resolved', { turn: next.world.turn })} ${[...summaryList.querySelectorAll('li')].map((li) => li.textContent).join(' ')}`);
  }

  /** Shows or hides the give-up confirmation and keeps keyboard focus on a visible control. */
  function setConfirming(value: boolean): void {
    confirming = value;
    render();
    (value ? confirmBox.querySelector<HTMLElement>('[data-testid="rc-concede-no"]') : concedeBtn)?.focus();
  }

  function onConcede(): void {
    confirming = false;
    commit(concede(state), t('status.conceded'));
    // The game buttons are now disabled; move focus to the result instead of losing it.
    statusEl.focus();
  }

  const onCanvasClick = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * world().map.w);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * world().map.h);
    if (x < 0 || y < 0 || x >= world().map.w || y >= world().map.h) return;
    activateCell(x, y);
  };

  const onCanvasKey = (event: KeyboardEvent) => {
    const { w, h: rows } = world().map;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const delta = moves[event.key];
    if (delta) {
      event.preventDefault();
      cursor = { x: Math.max(0, Math.min(w - 1, cursor.x + delta[0])), y: Math.max(0, Math.min(rows - 1, cursor.y + delta[1])) };
      render();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activateCell(cursor.x, cursor.y);
    } else if (event.key === 'Escape') {
      select(null);
    } else if (event.key === 'h' || event.key === 'H') {
      onHold();
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      onCancel();
    }
  };

  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('keydown', onCanvasKey);
  canvas.addEventListener('focus', () => draw());
  canvas.addEventListener('blur', () => draw());

  const homeCursor = () => {
    const post = world().entities.find((e) => e.side === PLAYER && e.kind === 'command-post');
    cursor = post ? { x: post.x, y: post.y } : { x: 0, y: 0 };
  };

  /* ---------- Instance ---------- */
  return {
    newGame(options: NewGameOptions) {
      state = newGame(normalizeSeed(options.seed));
      selected = null;
      confirming = false;
      reported = false;
      homeCursor();
      render();
    },
    restore(saved: RcState) {
      const spec = scenarioById(saved.scenario);
      state = spec ? structuredClone(saved) : newGame(saved.seed);
      selected = null;
      confirming = false;
      reported = state.phase === 'finished';
      homeCursor();
      render();
    },
    serialize: () => structuredClone(state),
    pause() {},
    resume() {},
    reset() {
      state = newGame(state.seed);
      selected = null;
      confirming = false;
      reported = false;
      homeCursor();
      context.requestSave();
      render();
    },
    dispose() {
      canvas.removeEventListener('click', onCanvasClick);
      canvas.removeEventListener('keydown', onCanvasKey);
      clear(root);
    }
  };
}
