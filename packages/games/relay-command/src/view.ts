import type { GameContext, GameInstance, GameResult, NewGameOptions } from '@wp/game-core';
import { normalizeSeed } from '@wp/game-core';
import {
  archetypeOf,
  depositAt,
  isReady,
  repairPrice,
  incomeOfSide,
  ARMOR_CLASSES,
  cellOf,
  computeNetwork,
  NEUTRAL,
  jammedCells,
  needsDeploy as needsDeployArch,
  nodeRadius,
  RETREAT_THRESHOLDS,
  TARGET_PRIORITIES,
  LOST_CONTACT,
  type LostContact,
  type Doctrine,
  type Entity,
  type Network,
  type Order,
  type World
} from '@wp/strategy-engine';
import { announce, clear, h } from '@wp/ui';
import {
  cancelJob,
  cancelOrder,
  canSettle,
  confirmHandover,
  isHotSeat,
  personsLeft,
  type Seat,
  concede,
  settle,
  settleResult,
  MAX_TURNS,
  STALL_TURNS,
  stalemateTurns,
  doctrineFor,
  doctrineRefusal,
  draftFor,
  lockTurn,
  newGame,
  opponentValue,
  orderRefusal,
  rulesOf,
  orderSlots,
  outcome,
  picture,
  planDoctrine,
  planOrder,
  plannedJobs,
  plannedSaleRefund,
  plannedSupply,
  commandPost as commandPostOf,
  lastSentOrder,
  reportTurn,
  RULESET,
  scenarioById,
  specOf,
  sideValue,
  TURN_LIMITS,
  unitById,
  type RcState
} from './rules';
import { DIFFICULTIES, type Difficulty } from './ai';
import { drawIcon } from './icons';
import { createEditor } from './editor';
import { blankMap, hostMapLibrary, mapIssues, memoryStore, migratePreferenceMaps, preferenceMapLibrary, type EditMap, type MapLibrary, type MapStore } from './maps';
import { CELL, drawDeposit, drawTerrainMark, TERRAIN_NAMES } from './draw';
import { FIELD_EXERCISE, opponentCounts, SCENARIOS, scenarioFor } from './scenarios';
import './styles.css';

/** Letters of the sides (A = the player), shown on every unit and row when there are several sides. */
const SIDE_MARKS = 'ABCDEFGH';
/** Colour tokens of the sides (and fallbacks): the first two are the shared player colours. */
const SIDE_COLOURS: readonly (readonly [string, string])[] = [
  ['--wp-p1', '#24508f'],
  ['--wp-p2', '#9a3412'],
  ['--rc-p3', '#6b21a8'],
  ['--rc-p4', '#0f5f57'],
  ['--rc-p5', '#854d0e'],
  ['--rc-p6', '#9d174d'],
  ['--rc-p7', '#3f6212'],
  ['--rc-p8', '#1e3a8a']
];

/** Milliseconds after arming a two-press confirmation in which a second press does not count. */
const CONFIRM_GAP = 400;
/** Open end: from this many quiet turns on the turn line says that strength will decide. */
const QUIET_NOTICE = 3;

/** Kinds the game uses, in the legend's order: fighters, support, structures. */
const LEGEND_KINDS = ['rifles', 'lancer', 'outrider', 'warden', 'howitzer', 'mast-truck', 'field-post', 'jammer', 'tracer', 'command-post', 'muster', 'motor-pool', 'extractor', 'relay-mast'] as const;

/** Map cell size in CSS pixels (the 44 px minimum touch target). */
export { CELL };

/** Automatic order ends worth telling the player (arrivals and regroups are expected outcomes). */
const REPORTED_ENDS: ReadonlySet<string> = new Set(['occupied', 'unreachable', 'blocked', 'lost-target', 'retreat', 'outpaced', 'lost-contact']);

let instanceCounter = 0;

const isDifficulty = (v: unknown): v is Difficulty => (DIFFICULTIES as readonly unknown[]).includes(v);

const SVG_NS = 'http://www.w3.org/2000/svg';
/** Small line pictograms of the unit card (20-unit box, current colour; hand-drawn, no third-party art). */
const PICTOGRAMS = {
  health: ['M10 4v12M4 10h12', 'M6 2h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z'],
  attack: ['M10 4a6 6 0 1 0 0 12a6 6 0 1 0 0-12z', 'M10 1.5v4M10 14.5v4M1.5 10h4M14.5 10h4'],
  range: ['M2.5 10h11M10.5 6.5 14 10l-3.5 3.5M17 4.5v11'],
  move: ['M4 5l5 5-5 5M10 5l5 5-5 5'],
  sight: ['M1.5 10Q10 2 18.5 10Q10 18 1.5 10Z', 'M10 8.2a1.8 1.8 0 1 0 0 3.6a1.8 1.8 0 1 0 0-3.6z'],
  radio: ['M10 18V8M6.6 5.2a4.5 4.5 0 0 0 0 5.6M13.4 5.2a4.5 4.5 0 0 1 0 5.6M4.2 2.8a8 8 0 0 0 0 10.4M15.8 2.8a8 8 0 0 1 0 10.4'],
  noweapon: ['M10 4a6 6 0 1 0 0 12a6 6 0 1 0 0-12z', 'M10 1.5v4M10 14.5v4M1.5 10h4M14.5 10h4M3 17 17 3']
} as const;

/** A pictogram as inline SVG (decorative: the word next to it carries the meaning). */
function pictogram(name: keyof typeof PICTOGRAMS): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  for (const [k, v] of Object.entries({ class: 'rc-pict', viewBox: '0 0 20 20', width: '18', height: '18', 'aria-hidden': 'true', focusable: 'false', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })) svg.setAttribute(k, v);
  for (const d of PICTOGRAMS[name]) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

export function createRelayCommand(context: GameContext): GameInstance<RcState> {
  const { t, root } = context;
  const uid = `rc-${++instanceCounter}`;
  let state: RcState = newGame(0);
  let selected: number | null = null;
  let cursor = { x: 0, y: 0 };
  let confirming = false;
  /** The side whose view is shown: the player's, or in a hot-seat game the person planning (D10). */
  const me = (): number => state.planning;
  /** Whether `finished()` was already reported for the current game. */
  let reported = false;

  /* ---------- Text helpers ---------- */
  /** The world as the player knows it (fog, D7); rule checks use the true world in `rules.ts`. */
  // Once the game is over everything is revealed: the map and the result show the true world.
  // Hot-seat: never (no side may see the others' positions, not even afterwards — D10).
  const revealed = (): boolean => state.phase === 'finished' && !isHotSeat(state);
  const world = (): World => (revealed() ? state.world : picture(state.world, me()).world);
  /** Tick of the last report for units shown at their last known position, else `undefined`. */
  const ghostTick = (e: Pick<Entity, 'id'>): number | undefined => (revealed() ? undefined : picture(state.world, me()).ghosts.get(e.id));
  const observedAt = (x: number, y: number): boolean => revealed() || picture(state.world, me()).observed[cellOf(state.world.map, x, y)] === 1;
  const isGhost = (e: Pick<Entity, 'id'>): boolean => ghostTick(e) !== undefined;
  const known = (id: number): Entity | undefined => world().entities.find((e) => e.id === id);
  const unitName = (e: Pick<Entity, 'kind' | 'id'>) => t('unit.name', { name: t(`unit.${e.kind}`), id: e.id });
  /** Several sides: every side has a letter (A = you) and a name besides its colour (never colour alone). */
  // A fixed property of the game (its opponents and rules), never of what is left on the map: whether
  // a neutral post still stands must not show in the interface (review of PR #23).
  const several = (): boolean => state.opponents > 1 || rulesOf(state).capture === true;
  const sideMark = (side: number): string => (side === NEUTRAL ? 'N' : (SIDE_MARKS[side] ?? '?'));
  const sideName = (side: number): string =>
    side === me() ? t('side.own') : side === NEUTRAL ? t('side.neutral') : several() ? t('side.opponent', { mark: sideMark(side) }) : t('side.enemy');
  const sideColour = (side: number): string => {
    if (side === NEUTRAL) return css('--rc-neutral', '#4b5563');
    const token = SIDE_COLOURS[side] ?? SIDE_COLOURS[1]!;
    return css(token[0], token[1]);
  };
  const terrainName = (x: number, y: number) => t(`terrain.${TERRAIN_NAMES[world().map.terrain[y * world().map.w + x] ?? '.'] ?? 'plain'}`);
  const isMobile = (e: Entity) => (archetypeOf(RULESET, e.kind)?.speed ?? 0) > 0;
  /** Structures never move: drawn as squares, told apart from vehicles that merely stand still. */
  const isStructure = (e: Pick<Entity, 'kind'>) => (archetypeOf(RULESET, e.kind)?.speed ?? 0) === 0;
  const isSetUp = (e: Entity) => (e.deploy ?? 0) >= RULESET.ticksPerTurn;
  const needsDeploy = (e: Entity) => needsDeployArch(archetypeOf(RULESET, e.kind));
  /** Message key prefix: relays and posts set up as network nodes, jammers as jammers. */
  const deployKind = (e: Pick<Entity, 'kind'>): 'deploy' | 'deployJammer' => (archetypeOf(RULESET, e.kind)?.ew?.role === 'jammer' ? 'deployJammer' : 'deploy');
  /** The player's network, computed once per state (not per unit or per drawing call). */
  let cachedNet: { state: RcState; net: Network } | undefined;
  const network = (): Network => {
    // From the true world: the player's own radio net is felt directly, enemy jamming included
    // (the picture strips enemy set-up state, so it cannot tell a working jammer).
    if (cachedNet?.state !== state) cachedNet = { state, net: computeNetwork(state.world, RULESET, me()) };
    return cachedNet.net;
  };
  /** Cells where the player's radio is jammed (the player notices the interference). */
  // Only cells the own net would cover without jamming: the player notices radio silence where
  // there should be contact, not the jammer's whole disc (that would give its position away).
  let cachedJam: { state: RcState; jam: Uint8Array } | undefined;
  const jammed = (x: number, y: number): boolean => {
    if (cachedJam?.state !== state) {
      // Expected reach: the discs of the nodes that really are connected now. A silenced post
      // then shows no marks at all (the status line explains it) instead of the jammer's disc.
      const jam = jammedCells(state.world, RULESET, me());
      const { w: mw, h: mh } = state.world.map;
      const expected = new Uint8Array(mw * mh);
      for (const id of network().nodes) {
        const node = unitById(state, id);
        const r = node ? nodeRadius(state.world, RULESET, node) : 0;
        if (!node) continue;
        for (let y = Math.max(0, node.y - r); y <= Math.min(mh - 1, node.y + r); y++) {
          for (let x = Math.max(0, node.x - r); x <= Math.min(mw - 1, node.x + r); x++) {
            if ((x - node.x) ** 2 + (y - node.y) ** 2 <= r * r) expected[y * mw + x] = 1;
          }
        }
      }
      cachedJam = { state, jam: jam.map((j, c) => (j === 1 && expected[c] === 1 ? 1 : 0)) };
    }
    return cachedJam.jam[cellOf(state.world.map, x, y)] === 1;
  };
  /** Whether the unit's weapon can damage the target's armour at all (no button otherwise). */
  const canHurt = (shooter: Entity, target: Entity): boolean => {
    const armor = archetypeOf(RULESET, target.kind)?.armor;
    return !!armor && (archetypeOf(RULESET, shooter.kind)?.weapon?.vs[armor] ?? 0) > 0;
  };
  const inContact = (e: Entity) => !isGhost(e) && network().coverage[cellOf(world().map, e.x, e.y)] === 1;
  const isSetUpOrPending = (e: Entity) =>
    (e.deploy ?? 0) >= RULESET.ticksPerTurn || e.order.type === 'deploy' || draftFor(state, e.id)?.type === 'deploy';
  const deployText = (e: Entity): string => {
    const k = deployKind(e);
    if ((e.deploy ?? 0) >= RULESET.ticksPerTurn) return t(`${k}.active`);
    if (e.order.type === 'deploy' || draftFor(state, e.id)?.type === 'deploy') return t(`${k}.pending`);
    return t(`${k}.idle`);
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
        return t(deployKind(e) === 'deployJammer' ? 'order.deployJammer' : 'order.deploy');
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
    if (ghost !== undefined && e.side !== me()) {
      // Enemies out of sight: only where and how strong they were when last reported.
      const where = t('unit.lastSeen', { name: unitName(e), side: sideName(e.side), x: e.x + 1, y: e.y + 1, hp: e.hp, max });
      return `${where} ${ghost === 0 ? t('unit.ghostStart') : t('unit.ghost', { turn: reportTurn(ghost) })}`;
    }
    // Enemy orders are never known, not even for enemies in sight.
    if (e.side !== me()) return t('unit.enemySummary', { name: unitName(e), side: sideName(e.side), x: e.x + 1, y: e.y + 1, hp: e.hp, max });
    // Own units out of contact: the last order sent, which the player cannot confirm.
    const order = ghost !== undefined ? t('unit.unconfirmed', { order: describeOrder(e, lastSentOrder(state, e.id) ?? { type: 'hold' }) }) : describeOrder(e, e.order);
    let text = t('unit.summary', { name: unitName(e), side: sideName(e.side), x: e.x + 1, y: e.y + 1, hp: e.hp, max, order });
    if (ghost !== undefined) text = `${text} ${ghost === 0 ? t('unit.ghostStart') : t('unit.ghost', { turn: reportTurn(ghost) })}`;
    if (isMobile(e)) text = `${text} (${t(inContact(e) ? 'contact.in' : !isGhost(e) && jammed(e.x, e.y) ? 'contact.jammed' : 'contact.out')})`;
    if (needsDeploy(e)) text = `${text} ${deployText(e)}`;
    if (e.build !== undefined) text = `${text} (${t('list.site', { n: e.build })})`;
    else if (e.queue && e.queue.length > 0) text = `${text} (${t('list.queue', { n: e.queue.map((q) => t(`unit.${q.kind}`)).join(', ') })})`;
    const planned = draftFor(state, e.id);
    return planned ? `${text} ${t('unit.planned', { order: describeOrder(e, planned) })}` : text;
  };

  const unitsAt = (x: number, y: number) => world().entities.filter((e) => e.x === x && e.y === y);

  const describeCell = (x: number, y: number): string => {
    const units = unitsAt(x, y);
    // The veil is told in words too (screen readers).
    let terrain = observedAt(x, y) ? terrainName(x, y) : `${terrainName(x, y)} ${t('cell.unobserved')}`;
    if (!revealed() && jammed(x, y)) terrain = `${terrain} ${t('cell.jammed')}`;
    // Deposits are told in words as well; how much is left only while the cell is observed.
    const deposit = depositAt(world().map, x, y);
    if (deposit) terrain = `${terrain} ${observedAt(x, y) ? t('cell.deposit', { n: deposit.left }) : t('cell.depositUnknown')}`;
    if (units.length === 0) return t('cell.describe', { x: x + 1, y: y + 1, terrain });
    return t('cell.describeUnit', { x: x + 1, y: y + 1, terrain, unit: units.map(describeUnit).join(' ') });
  };

  /* ---------- DOM ---------- */
  let live = h('p', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'rc-live' });
  /** Hot-seat: whose plan is open (letter, colour and words). */
  const seatEl = h('p', { class: 'rc-seat', 'data-testid': 'rc-seat', hidden: true });
  const turnEl = h('p', { class: 'rc-turn', 'data-testid': 'rc-turn' });
  const statusEl = h('p', { class: 'rc-status', 'data-testid': 'rc-status', role: 'status', tabindex: -1 });
  const slotsEl = h('p', { class: 'rc-slots', 'data-testid': 'rc-slots' });
  const supplyEl = h('p', { class: 'rc-supply', 'data-testid': 'rc-supply' });
  /** Quick match only: the stalemate warning, in a slot of its own (the bar never reflows). */
  const stalemateText = h('span', { 'data-testid': 'rc-stalemate-text' });
  // Plain open end, stalled: the player may end on strength (two presses: the result is final).
  let settleArmed = false;
  const settleBtn = h('button', { type: 'button', 'data-testid': 'rc-settle', onclick: () => onSettle() }) as HTMLButtonElement;
  settleBtn.addEventListener('blur', () => {
    if (!settleArmed) return;
    settleArmed = false;
    render();
  });
  const stalemateEl = h('div', { class: 'rc-stalemate', 'data-testid': 'rc-stalemate', 'aria-live': 'polite' }, stalemateText, settleBtn);
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

  /** Game setup, until the first turn is locked: scenario and turn limit (open end by default). */
  const scenarioSelect = h('select', { 'data-testid': 'rc-scenario', onchange: () => onSetup() });
  for (const spec of SCENARIOS) scenarioSelect.append(h('option', { value: spec.id }, t(`scenario.${spec.id}`)));
  const limitSelect = h('select', { 'data-testid': 'rc-turn-limit', onchange: () => onSetup() });
  /** Opponents: only the counts the chosen map declares (two-side maps: one). */
  const opponentsSelect = h('select', { 'data-testid': 'rc-opponents', onchange: () => onSetup() });
  // Lengths: open end (default), quick match (strength decides once the side behind stops gaining
  // ground), or a fixed number of turns.
  for (const limit of TURN_LIMITS) {
    limitSelect.append(h('option', { value: limit === null ? 'open' : String(limit) }, limit === null ? t('setup.open') : t('setup.turns', { n: limit })));
    if (limit === null) limitSelect.append(h('option', { value: 'quick' }, t('setup.quick')));
  }
  /**
   * Hot-seat (D10): who plays each side, person or computer (side A is always you). Rows follow
   * the opponent count; several persons pass the device on each turn.
   */
  const seatsBox = h('fieldset', { class: 'rc-seats', 'data-testid': 'rc-seats' });
  /** Several persons with an open end: such a game ends only by sides being out or giving up. */
  const hotSeatHint = h('p', { class: 'rc-hint', 'data-testid': 'rc-hotseat-hint', hidden: true }, t('setup.hotSeatOpen'));
  // The map editor opens from the setup (also after the first turn, through the fold).
  const editorBtn = h('button', { type: 'button', class: 'rc-editor-open', 'data-testid': 'rc-editor-open', onclick: () => openEditor() }, t('editor.open'));
  const setupBox = h(
    'fieldset',
    { class: 'rc-setup', 'data-testid': 'rc-setup' },
    h('legend', {}, t('setup.title')),
    h('label', {}, h('span', {}, t('setup.scenario')), scenarioSelect),
    h('label', {}, h('span', {}, t('setup.limit')), limitSelect),
    h('label', { 'data-testid': 'rc-opponents-label' }, h('span', {}, t('setup.opponents')), opponentsSelect),
    seatsBox,
    hotSeatHint,
    editorBtn
  );
  // After the first turn the setup folds into one line (map, length, level) that opens on demand:
  // on a phone the locked choices would otherwise push the map a screen down.
  const setupSummary = h('summary', { 'data-testid': 'rc-setup-summary' });
  const setupFold = h('details', { class: 'rc-setup-fold', 'data-testid': 'rc-setup-fold' }, setupSummary) as HTMLDetailsElement;
  const setupSlot = h('div', { class: 'rc-setup-slot' }, setupBox);

  const selectionTitle = h('h3', {}, t('panel.selection'));
  const selectionText = h('p', { 'data-testid': 'rc-selection-text' });
  /** Uniform stat card of the selected unit (own or known enemy). */
  const cardEl = h('div', { class: 'rc-card', 'data-testid': 'rc-card', hidden: true });
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
  /** Without radio contact: return after a turn, carry the order out and then return, or carry on. */
  const lostContactSelect = h('select', { 'data-testid': 'rc-doctrine-lostcontact', onchange: () => onDoctrine() });
  // From the most careful to the boldest.
  for (const v of ['regroup', 'finish', 'keep'] as const) lostContactSelect.append(h('option', { value: v }, t(`doctrine.lost.${v}`)));
  const doctrineBox = h(
    'fieldset',
    { class: 'rc-doctrine', 'data-testid': 'rc-doctrine' },
    h('legend', {}, t('doctrine.title')),
    h('label', {}, h('span', {}, t('doctrine.retreat')), retreatSelect),
    h('label', {}, h('span', {}, t('doctrine.priority')), prioritySelect),
    h('label', { class: 'rc-check' }, coverBox, h('span', {}, t('doctrine.seekCover'))),
    h('label', { class: 'rc-check' }, holdFireBox, h('span', {}, t('doctrine.holdFire'))),
    h('label', {}, h('span', {}, t('doctrine.lostContact')), lostContactSelect)
  );
  const selectionActions = h('div', { class: 'rc-orders' }, h('div', { class: 'rc-actions' }, holdBtn, regroupBtn, deployBtn, cancelBtn), modeGroup, modeHint, doctrineBox);
  /** Production (yards) and placement (command sources) of the selected structure (I6a). */
  const jobsEl = h('div', { class: 'rc-jobs', 'data-testid': 'rc-jobs', hidden: true });
  /** Structure kind the next map click places, or null. */
  let placing: string | null = null;
  const selectionPanel = h('section', { class: 'rc-panel', 'data-testid': 'rc-selection' }, selectionTitle, selectionText, cardEl, noticeEl, selectionActions, jobsEl);
  const legendEl = h('details', { class: 'rc-legend', 'data-testid': 'rc-legend' }, h('summary', {}, t('legend.title')));

  const ownList = h('ul', { class: 'rc-units', 'data-testid': 'rc-own' });
  const enemyList = h('ul', { class: 'rc-units', 'data-testid': 'rc-enemy' });
  /** Maps with empty seats: the neutral posts in a list of their own (not among the enemies). */
  const neutralList = h('ul', { class: 'rc-units', 'data-testid': 'rc-neutral' });
  const neutralPanel = h('section', { class: 'rc-panel', 'data-testid': 'rc-neutral-panel', hidden: true }, h('h3', {}, t('list.neutral')), neutralList);
  const summaryList = h('ul', { class: 'rc-summary', 'data-testid': 'rc-summary' });

  const help = h(
    'details',
    { class: 'rc-help' },
    h('summary', {}, t('help.title')),
    ...['help.turns', 'help.bar', 'help.orders', 'help.network', 'help.fog', 'help.ew', 'help.doctrine', 'help.economy', 'help.repair', 'help.editor', 'help.sides', 'help.hotSeat', 'help.combat', 'help.goal', 'help.shapes', 'help.access'].map((k) => h('p', {}, t(k)))
  );

  /* ---------- Map editor ---------- */
  // Maps are kept by the host's library for this game (ADR 0012: Settings counts and deletes them
  // as the player's own content); without one, in the game's preferences; without those, for
  // this session only. Maps kept in preferences before the library existed move over once.
  const store: MapStore = context.preferences ?? memoryStore();
  const mapLabel = (m: EditMap) => m.name.trim() || t('editor.untitled');
  const mapLibrary: MapLibrary = context.library ? hostMapLibrary(context.library, mapLabel) : preferenceMapLibrary(store);
  const library = () => editor.maps();
  const editor = createEditor({
    t,
    css: (name, fallback) => css(name, fallback),
    icon: (kind, own) => unitIcon(kind, own),
    library: mapLibrary,
    libraryChanged: () => {
      if (!state.edit) render(); // the setup lists the device's maps
    },
    draft: () => state.edit ?? { map: blankMap(16, 12), slot: null, mirror: true },
    change: (draft, message) => commit({ ...state, edit: draft }, message),
    close: () => closeEditor(),
    play: (m) => playMap(m),
    playEndsGame: () => state.phase === 'plan' && state.log.length > 0,
    announce: (text) => announce(live, text)
  });

  if (context.library) void migratePreferenceMaps(context.preferences, mapLibrary).then((moved) => moved > 0 && editor.refresh());

  function openEditor(): void {
    editor.forget();
    // Start from the map being played (a player-made one), else an empty map; mirrored edits by default.
    if (!state.edit) commit({ ...state, edit: { map: state.map ?? blankMap(16, 12), slot: null, mirror: true } });
    render();
    editor.el.querySelector<HTMLElement>('[data-testid="ed-map"]')?.focus();
  }
  function closeEditor(): void {
    editor.forget();
    commit({ ...state, edit: null });
    render();
    editorBtn.focus();
  }
  function playMap(m: EditMap): void {
    if (mapIssues(m).length > 0) return;
    editor.forget();
    selected = null;
    const limit = state.turnLimit;
    commit(newGame(normalizeSeed(state.seed + 1), FIELD_EXERCISE, state.difficulty, limit, state.quick, m), t('announce.setup', { scenario: mapLabel(m) }));
    homeCursor();
    render();
    canvas.focus();
  }

  const mainEl = h(
    'div',
    { class: 'rc-main', 'data-testid': 'rc-main' },
    h('div', { class: 'rc-board' }, mapWrap, cursorDesc, legendEl),
    h(
      'div',
      { class: 'rc-side' },
      selectionPanel,
      h('section', { class: 'rc-panel' }, h('h3', {}, t('list.own')), ownList),
      h('section', { class: 'rc-panel' }, h('h3', {}, t('list.enemy')), enemyList),
      neutralPanel,
      h('section', { class: 'rc-panel' }, h('h3', {}, t('summary.title')), summaryList)
    )
  );
  /** Hot-seat result: only what every side was told — the winner and the sides that are out (no map). */
  const resultEl = h('section', { class: 'rc-panel rc-result', 'data-testid': 'rc-result', hidden: true });
  /**
   * Hot-seat hand-over (D10): the device goes to the next person. While it shows, nothing of any
   * side is in the document — no map, list, summary or live text — until that person confirms.
   */
  const handoverTitle = h('h2', { id: `${uid}-handover` });
  const handoverText = h('p', {});
  const handoverBtn = h('button', { type: 'button', class: 'primary', 'data-testid': 'rc-handover-confirm', onclick: () => onHandover() }) as HTMLButtonElement;
  const handoverEl = h('section', { class: 'rc-handover', 'data-testid': 'rc-handover', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': `${uid}-handover` }, handoverTitle, handoverText, handoverBtn);
  const shell = h(
    'div',
    { class: 'wp-relay-command', 'data-testid': 'rc-root' },
    h(
      'div',
      { class: 'rc-bar' },
      h('div', { class: 'rc-bar-facts' }, seatEl, turnEl, supplyEl, slotsEl),
      statusEl,
      stalemateEl,
      h('div', { class: 'rc-actions rc-bar-actions' }, lockBtn, concedeBtn, confirmBox)
    ),
    setupSlot,
    mainEl,
    resultEl,
    help,
    editor.el,
    live
  );
  root.append(shell);
  // While the editor is open, the game waits behind it (state kept, nothing lost).
  const gameParts = [...shell.children].filter((el) => el !== editor.el && el !== live) as HTMLElement[];

  /**
   * Hot-seat: behind the hand-over the game's parts leave the document (not just hidden), and the
   * live region is emptied, so nothing of the previous side can be read, heard or focused.
   */
  function showHandover(on: boolean): void {
    if (on) {
      for (const part of gameParts) part.remove();
      // A fresh, empty live region: an announcement still pending for the previous person (they
      // are written a moment later) lands in the old one, which has left the document.
      const fresh = h('p', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'rc-live' });
      live.replaceWith(fresh);
      live = fresh;
      if (!handoverEl.isConnected) shell.prepend(handoverEl);
      const mark = sideMark(me());
      handoverTitle.textContent = t('handover.title', { mark });
      handoverText.textContent = t('handover.text', { turn: state.world.turn + 1, mark });
      handoverBtn.textContent = t('handover.confirm', { mark });
      return;
    }
    handoverEl.remove();
    // Back in their places, in order (the result screen takes the map's part out as well).
    let next: Element = editor.el;
    for (let i = gameParts.length - 1; i >= 0; i--) {
      const part = gameParts[i]!;
      if (!part.isConnected) shell.insertBefore(part, next);
      next = part;
    }
  }

  /* ---------- Rendering ---------- */
  let legendDrawn = false;
  function render(): void {
    if (!legendDrawn) {
      legendDrawn = true;
      renderLegend();
    }
    const editing = state.edit !== null;
    const handing = !editing && state.phase === 'plan' && state.handover;
    showHandover(handing);
    if (handing) {
      editor.el.hidden = true;
      return;
    }
    for (const part of gameParts) part.hidden = editing || (part === resultEl && !(isHotSeat(state) && state.phase === 'finished'));
    editor.el.hidden = !editing;
    if (editing) {
      editor.render();
      return;
    }
    // A finished hot-seat game shows no map, list or summary of any side: the result only.
    const hotEnd = isHotSeat(state) && state.phase === 'finished';
    // Out of the document and not drawn at all: no lists, reports, cursor text or map of any side.
    if (hotEnd) {
      mainEl.remove();
      renderResult();
    }
    seatEl.hidden = !isHotSeat(state) || state.phase !== 'plan';
    clear(seatEl);
    if (!seatEl.hidden) {
      seatEl.append(h('span', { class: 'rc-row-mark', style: `color:${sideColour(me())}` }, sideMark(me())), ' ', t('hot.planning', { mark: sideMark(me()) }));
    }
    const w = world();
    const finished = state.phase === 'finished';
    turnEl.textContent =
      state.turnLimit === null ? t('status.turnOpen', { turn: w.turn + 1 }) : t('status.turn', { turn: Math.min(w.turn + 1, state.turnLimit), limit: state.turnLimit });
    // Open end: a stalled game is heading for a decision on strength (STALL_TURNS); say so early.
    const stalemate = state.quick && state.turnLimit === null && state.phase === 'plan' && stalemateTurns(state) >= QUIET_NOTICE;
    const settleable = canSettle(state);
    stalemateText.textContent = stalemate ? t('status.quiet', { turn: w.turn + STALL_TURNS - stalemateTurns(state) }) : settleable ? t('status.settleOffer', { n: stalemateTurns(state) }) : '';
    settleBtn.hidden = !settleable;
    if (!settleable) settleArmed = false;
    // Strength figures only while the offer stands (never left behind in the document).
    settleBtn.textContent = !settleable
      ? ''
      : settleArmed
        ? t('action.settleConfirm')
        : t(`action.settle.${settleResult(state)}`, { own: sideValue(state.world, me()), enemy: opponentValue(state.world) });
    stalemateEl.toggleAttribute('data-empty', !stalemate && !settleable);
    // Scenario and turn limit can be changed until the first turn is locked.
    // Kept in place after the first turn (disabled), so the map does not jump up.
    const setupLocked = state.phase !== 'plan' || state.log.length > 0;
    scenarioSelect.disabled = setupLocked;
    limitSelect.disabled = setupLocked;
    opponentsSelect.disabled = setupLocked;
    syncSeatRows(setupLocked);
    setupBox.toggleAttribute('data-locked', setupLocked);
    // Unlocked: the setup stands open on its own; locked: it moves into the fold (closed until opened).
    if (setupLocked && setupBox.parentElement !== setupFold) {
      setupFold.open = false;
      setupFold.append(setupBox);
      setupSlot.replaceChildren(setupFold);
    } else if (!setupLocked && setupBox.parentElement !== setupSlot) setupSlot.replaceChildren(setupBox);
    syncScenarioOptions();
    scenarioSelect.value = state.map ? 'custom' : state.scenario;
    limitSelect.value = state.turnLimit !== null ? String(state.turnLimit) : state.quick ? 'quick' : 'open';
    syncOpponentOptions();
    opponentsSelect.value = String(state.opponents);
    const mapText = state.map ? mapLabel(state.map) : t(`scenario.${state.scenario}`);
    const length = limitSelect.selectedOptions[0]?.textContent ?? '';
    setupSummary.textContent = state.opponents > 1 ? t('setup.summaryOpponents', { map: mapText, length, n: state.opponents }) : t('setup.summary', { map: mapText, length });
    statusEl.textContent = statusText();
    statusEl.setAttribute('data-phase', state.phase);
    slotsEl.hidden = finished;
    const slots = orderSlots(state);
    slotsEl.textContent = postJammed() ? t('status.jammed') : t('status.slots', { n: state.draft.length, slots });
    // Full plan (or no orders possible): highlighted, so the player notices without reading.
    slotsEl.toggleAttribute('data-full', state.draft.length >= slots);
    // Supply and income (economy): what the planned jobs leave is shown while any are planned.
    const supply = w.supply?.[me()] ?? 0;
    const left = plannedSupply(state);
    const income = incomeOfSide(state.world, RULESET, me());
    supplyEl.hidden = w.supply === undefined || hotEnd;
    supplyEl.textContent = left === supply ? t('status.supply', { n: supply, income }) : t('status.supplyPlanned', { n: supply, left, income });
    supplyEl.title = t('status.supplyHint');
    lockBtn.disabled = finished;
    // Hot-seat: the lock hands the device on, or (the last person) resolves the turn; it is final.
    lockBtn.textContent = !isHotSeat(state) ? t('action.lock') : personsLeft(state).some((x) => x > me()) ? t('action.lockHandOver') : t('action.lockResolve');
    concedeBtn.disabled = finished;
    concedeBtn.hidden = confirming;
    confirmBox.hidden = !confirming || finished;
    if (hotEnd) {
      // No counters of the side that planned last either.
      supplyEl.textContent = '';
      slotsEl.textContent = '';
      return;
    }
    cursorDesc.textContent = describeCell(cursor.x, cursor.y);
    renderSelection();
    renderLists();
    renderSummary();
    draw();
  }

  /** Hot-seat result: the winner and the sides that are out, in words and letters (no positions). */
  function renderResult(): void {
    clear(resultEl);
    resultEl.append(h('h3', {}, t('result.title')), h('p', { 'data-testid': 'rc-result-winner' }, statusOf(state)));
    const out = state.world.out ?? [];
    if (out.length > 0) resultEl.append(h('p', { 'data-testid': 'rc-result-out' }, t('result.out', { sides: out.map(sideMark).join(', ') })));
  }

  /** The seat rows of the setup: one per side of the chosen count (A: you, a person). */
  function syncSeatRows(locked: boolean): void {
    const sides = state.seats.length;
    if (seatsBox.childElementCount !== sides + 1) {
      clear(seatsBox);
      seatsBox.append(h('legend', {}, t('setup.players')));
      for (let side = 0; side < sides; side++) {
        const mark = sideMark(side);
        const badge = h('span', { class: 'rc-row-mark', style: `color:${sideColour(side)}` }, mark);
        if (side === 0) {
          seatsBox.append(h('div', { class: 'rc-seat-row', 'data-testid': 'rc-seat-0' }, badge, ' ', h('span', {}, t('setup.seat.you', { mark }))));
          continue;
        }
        const name = `${uid}-seat-${side}`;
        const choice = (seat: Seat) =>
          h('label', { class: 'rc-seat-choice' }, h('input', { type: 'radio', name, value: seat, 'data-testid': `rc-seat-${side}-${seat}`, onchange: () => onSetup() }), h('span', {}, t(`setup.seat.${seat}`)));
        seatsBox.append(
          h('div', { class: 'rc-seat-row', role: 'radiogroup', 'aria-label': t('setup.seat.label', { mark }), 'data-testid': `rc-seat-${side}` }, badge, ' ', h('span', {}, t('setup.seat.label', { mark })), choice('computer'), choice('person'))
        );
      }
    }
    for (const input of seatsBox.querySelectorAll<HTMLInputElement>('input[type="radio"]')) {
      const side = Number(input.name.slice(input.name.lastIndexOf('-') + 1));
      input.checked = state.seats[side] === input.value;
      input.disabled = locked;
    }
    const hot = isHotSeat(state);
    hotSeatHint.hidden = !hot || state.turnLimit !== null || locked;
    // Several persons have no quick match (an open end is decided by the posts or giving up).
    const quick = limitSelect.querySelector<HTMLOptionElement>('option[value="quick"]');
    if (quick) quick.disabled = hot;
  }

  /** The seats chosen in the setup rows (missing rows: the computer). */
  function chosenSeats(): Seat[] {
    const seats: Seat[] = ['person'];
    for (const input of seatsBox.querySelectorAll<HTMLInputElement>('input[type="radio"]:checked')) {
      const side = Number(input.name.slice(input.name.lastIndexOf('-') + 1));
      seats[side] = input.value === 'person' ? 'person' : 'computer';
    }
    return seats;
  }

  /** Hot-seat: the person who now has the device confirms; their own map and summary show. */
  function onHandover(): void {
    if (!state.handover) return;
    // Nothing of the previous person carries over: no selection, placing mode, notice or armed sale.
    select(null);
    commit(confirmHandover(state));
    homeCursor();
    render();
    canvas.focus();
    announce(live, `${t('hot.planning', { mark: sideMark(me()) })} ${[...summaryList.querySelectorAll('li')].map((li) => li.textContent).join(' ')}`);
  }

  /** The own Command Post is jammed: no orders this turn (the post knows its own radio; reveals nothing else). */
  function postJammed(): boolean {
    if (state.phase !== 'plan' || orderSlots(state) > 0) return false;
    const post = commandPostOf(state.world, me());
    return !!post && jammedCells(state.world, RULESET, me())[cellOf(state.world.map, post.x, post.y)] === 1;
  }

  const statusText = (): string => statusOf(state);

  /** The status line of `s`: empty while planning (the counter in the top bar says it all), the result at the end. */
  function statusOf(s: RcState): string {
    if (s.phase === 'plan') return '';
    if (isHotSeat(s)) return s.winner === null ? t('result.drawSides') : t('result.winner', { mark: sideMark(s.winner) });
    if (s.conceded) return t('status.conceded');
    // The result is decided on the true world, so it is told from it (not from the picture).
    const args = { own: sideValue(s.world, me()), enemy: opponentValue(s.world), limit: STALL_TURNS };
    const result = s.result ?? 'draw';
    const decidedByPost = outcome({ ...s.world, turn: 0 }, s.turnLimit) !== null;
    if (decidedByPost) return result === 'won' ? t('status.won') : result === 'lost' ? t('status.lost') : t('status.draw', args);
    if (s.settled) return t(`status.settled.${result}`, args);
    if (s.turnLimit !== null) return t(result === 'won' ? 'status.wonScore' : result === 'lost' ? 'status.lostScore' : 'status.draw', args);
    // Open end: the turn cap, or else the stalemate rule (a quick match, or an older save that had it).
    if (s.world.turn >= MAX_TURNS) return t(`status.cap.${result}`, args);
    return t(result === 'won' ? 'status.wonQuiet' : result === 'lost' ? 'status.lostQuiet' : 'status.drawQuiet', args);
  }


  /** The selection text: the short hint for the eye, the full description for screen readers (the card shows the rest). */
  function setSelectionText(unit: Entity, hint: string): void {
    clear(selectionText);
    selectionText.append(h('span', { class: 'sr-only' }, `${describeUnit(unit)} `), h('span', {}, hint || shortState(unit)));
  }

  function renderSelection(): void {
    const unit = selected === null ? undefined : known(selected);
    const reachable = !!unit && unit.side === me() && inContact(unit);
    const canOrder = !!unit && unit.side === me() && isMobile(unit) && reachable && state.phase === 'plan';
    if (!unit) {
      selectionText.textContent = t('panel.none');
    } else if (!isMobile(unit)) {
      setSelectionText(unit, structureHint(unit));
    } else if (unit.side === me() && !reachable) {
      setSelectionText(unit, t('panel.outOfContact'));
    } else {
      const hint = !canOrder ? '' : archetypeOf(RULESET, unit.kind)?.weapon ? t('panel.hint') : t('panel.hintUnarmed');
      setSelectionText(unit, hint);
    }
    renderCard(unit);
    renderJobs(unit);
    selectionActions.hidden = !canOrder;
    deployBtn.hidden = !unit || !needsDeploy(unit) || isSetUpOrPending(unit);
    deployBtn.textContent = unit && deployKind(unit) === 'deployJammer' ? t('action.deployJammer') : t('action.deploy');
    for (const b of modeButtons) b.setAttribute('aria-pressed', String(b.getAttribute('data-testid') === `rc-mode-${mode}`));
    modeHint.textContent = mode === 'patrol' ? t('mode.hintPatrol') : mode === 'escort' ? t('mode.hintEscort') : '';
    modeHint.hidden = mode === 'move';
    if (unit && canOrder) {
      const d = doctrineFor(state, unit.id);
      retreatSelect.value = String(d.retreatBelow);
      prioritySelect.value = d.priority;
      coverBox.checked = d.seekCover;
      holdFireBox.checked = d.holdFire;
      lostContactSelect.value = d.lostContact;
    }
    cancelBtn.disabled = !unit || !draftFor(state, unit.id);
  }

  /** What a selected structure is for (economy): yard, command source, site or Extractor. */
  function structureHint(unit: Entity): string {
    const arch = archetypeOf(RULESET, unit.kind);
    if (!arch) return t('panel.structure');
    if (unit.build !== undefined) return t('panel.site', { n: unit.build });
    if (unit.side !== me()) return t('panel.structure');
    if (arch.production) return t('panel.yard');
    if (arch.comms?.role === 'source' && RULESET.economy) return `${unit.kind === 'command-post' ? t('panel.static') : ''} ${t('panel.source')}`.trim();
    if (arch.extractor) return t('panel.extractor', { n: arch.income });
    return t('panel.structure');
  }

  /** The buildable structures a command source may place (finished structures with a build time). */
  const BUILDABLE = Object.values(RULESET.archetypes).filter((a) => a.speed === 0 && a.buildTurns > 0).map((a) => a.id);

  /** Production sheet of a yard, or the placement sheet of a command source: the planned jobs with cancel buttons. */
  function renderJobs(unit: Entity | undefined): void {
    clear(jobsEl);
    const arch = unit && archetypeOf(RULESET, unit.kind);
    const own = !!unit && unit.side === me() && state.phase === 'plan' && RULESET.economy && inContact(unit) && unit.build === undefined;
    const yard = own && !!arch?.production;
    const source = own && arch?.comms?.role === 'source' && (!needsDeploy(unit) || isSetUp(unit));
    // Any finished own structure but a command source can be sold (not while disabled).
    const sellable = own && arch?.speed === 0 && arch.comms?.role !== 'source' && isReady(unit);
    const salePlanned = !!unit && plannedJobs(state, unit.id).some((c) => c.order.type === 'sell');
    jobsEl.hidden = !unit || !arch || (!yard && !source && !sellable);
    if (!unit || !arch || (!yard && !source && !sellable)) {
      placing = null;
      settleSell = null;
      return;
    }
    if (settleSell !== unit.id) settleSell = null;
    // Planned for sale: nothing more to produce, repair or place there (cancel the sale to change it).
    const kinds = salePlanned ? [] : yard ? (arch.production ?? []) : source ? BUILDABLE : [];
    const list = h('div', { class: 'rc-tiles', role: 'group', 'aria-label': t(yard ? 'jobs.produce' : 'jobs.build') });
    const left = plannedSupply(state);
    for (const kind of kinds) {
      const a = archetypeOf(RULESET, kind);
      if (!a) continue;
      const short = a.cost > left;
      const label = short ? `${t('jobs.item', { name: t(`unit.${kind}`), cost: a.cost, turns: a.buildTurns })} (${t('tile.short')})` : t('jobs.item', { name: t(`unit.${kind}`), cost: a.cost, turns: a.buildTurns });
      const onclick = yard ? () => orderJob({ type: 'produce', kind }) : () => startPlacing(kind);
      // A tile: the picture of what is made, its name, and cost and time as numbers (the label says it all in words).
      list.append(
        h(
          'button',
          { type: 'button', class: 'rc-tile', 'data-testid': `rc-job-${kind}`, 'aria-pressed': placing === kind ? 'true' : 'false', 'aria-label': label, 'data-short': short ? 'true' : 'false', onclick },
          h('span', { class: 'rc-tile-pic', 'aria-hidden': 'true' }, unitIcon(kind, true)),
          h('span', { class: 'rc-tile-name', 'aria-hidden': 'true' }, t(`unit.${kind}`)),
          h('span', { class: 'rc-tile-meta', 'aria-hidden': 'true' }, t('jobs.costTime', { cost: a.cost, turns: a.buildTurns })),
          ...(short ? [h('span', { class: 'rc-tile-short', 'aria-hidden': 'true' }, t('tile.short'))] : [])
        )
      );
    }
    const rows = h('ul', { class: 'rc-joblist' });
    // A finished unit that found no free cell waits inside: say so instead of "0 turns left".
    for (const q of unit.queue ?? []) rows.append(h('li', {}, q.left === 0 ? t('jobs.waiting', { name: t(`unit.${q.kind}`) }) : t('jobs.queue', { name: t(`unit.${q.kind}`), n: q.left })));
    plannedJobs(state, unit.id).forEach((job, index) => {
      const o = job.order;
      const target = o.type === 'repair' ? state.world.entities.find((e) => e.id === o.target) : undefined;
      const name = o.type === 'produce' || o.type === 'build' ? t(`unit.${o.kind}`) : target ? unitName(target) : unitName(unit);
      const text =
        o.type === 'build'
          ? t('jobs.plannedAt', { name, x: o.x + 1, y: o.y + 1 })
          : o.type === 'repair'
            ? t('jobs.plannedRepair', { name })
            : o.type === 'sell'
              ? t('jobs.plannedSell', { n: plannedSaleRefund(state, unit.id) })
              : t('jobs.planned', { name });
      rows.append(h('li', {}, h('span', {}, text), h('button', { type: 'button', 'data-testid': `rc-job-cancel-${index}`, onclick: () => commit(cancelJob(state, unit.id, index), t('announce.cancelled', { name })) }, t('jobs.cancel', { name }))));
    });
    if ((yard || source) && !salePlanned) jobsEl.append(h('h4', {}, t(yard ? 'jobs.produce' : 'jobs.build')), list);
    if (yard && !salePlanned) jobsEl.append(repairSection(unit, arch));
    jobsEl.append(rows);
    if (sellable && !salePlanned) {
      const refund = plannedSaleRefund(state, unit.id);
      jobsEl.append(
        h(
          'button',
          { type: 'button', class: 'rc-sell', 'data-testid': 'rc-sell', onclick: (event: Event) => onSell(unit.id, event as MouseEvent) },
          settleSell === unit.id ? t('jobs.sellConfirm', { n: refund }) : t('jobs.sell', { n: refund })
        )
      );
    }
    if (placing) {
      const a = archetypeOf(RULESET, placing);
      jobsEl.append(
        h('p', { class: 'rc-hint', 'data-testid': 'rc-placing' }, t(a?.extractor ? 'jobs.chooseDeposit' : 'jobs.chooseCell', { name: t(`unit.${placing}`) })),
        h('button', { type: 'button', 'data-testid': 'rc-placing-stop', onclick: () => stopPlacing() }, t('jobs.stop'))
      );
    }
  }

  /** Own damaged units of the kinds a yard makes, standing next to it: one button each (price in Supply). */
  function repairSection(yard: Entity, arch: NonNullable<ReturnType<typeof archetypeOf>>): HTMLElement {
    const box = h('div', { class: 'rc-repair', 'data-testid': 'rc-repair' }, h('h4', {}, t('jobs.repair')));
    const left = plannedSupply(state);
    const candidates = state.world.entities.filter((e) => {
      const a = archetypeOf(RULESET, e.kind);
      const planned = plannedJobs(state, yard.id).some((c) => c.order.type === 'repair' && c.order.target === e.id);
      return e.side === me() && a && !planned && arch.production?.includes(e.kind) && e.hp < a.hp && Math.max(Math.abs(e.x - yard.x), Math.abs(e.y - yard.y)) <= 1;
    });
    if (candidates.length === 0) box.append(h('p', { class: 'rc-muted' }, t('jobs.repairNone')));
    for (const e of candidates) {
      const a = archetypeOf(RULESET, e.kind)!;
      const price = repairPrice(a, e.hp);
      const short = price > left;
      const label = t('jobs.repairLabel', { name: unitName(e), hp: e.hp, max: a.hp, cost: price });
      box.append(
        h(
          'button',
          { type: 'button', class: 'rc-repair-item', 'data-testid': `rc-repair-${e.id}`, 'data-short': short ? 'true' : 'false', 'aria-label': short ? `${label} (${t('tile.short')})` : label, onclick: () => orderJob({ type: 'repair', target: e.id }) },
          unitIcon(e.kind, true),
          h(
            'span',
            { class: 'rc-repair-text', 'aria-hidden': 'true' },
            h('span', {}, unitName(e)),
            h('span', { class: 'rc-repair-meta' }, t('jobs.repairItem', { hp: e.hp, max: a.hp, cost: price })),
            ...(short ? [h('span', { class: 'rc-tile-short' }, t('tile.short'))] : [])
          )
        )
      );
    }
    return box;
  }

  /** Selling takes two presses: the first shows the refund on the button, the second plans it. */
  let settleSell: number | null = null;
  function onSell(id: number, event?: MouseEvent): void {
    // The second click of a double-click (or double tap) is not a second, deliberate press.
    if ((event?.detail ?? 0) > 1) return;
    if (settleSell !== id) {
      settleSell = id;
      armedAt = performance.now();
      render();
      jobsEl.querySelector<HTMLElement>('[data-testid="rc-sell"]')?.focus();
      return;
    }
    if (tooSoon()) return;
    settleSell = null;
    orderJob({ type: 'sell' });
  }

  /**
   * Two-press confirmations (sale, end on strength): a second press within CONFIRM_GAP ms of
   * arming is not deliberate (a quick double tap, a held Enter's auto-repeat) and is ignored.
   * A timestamp, not a timer: nothing waits.
   */
  let armedAt = 0;
  const tooSoon = (): boolean => performance.now() - armedAt < CONFIRM_GAP;

  /** Queues a one-shot job (production) for the selected structure, or explains why not. */
  function orderJob(order: Order): void {
    if (selected === null) return;
    const unit = known(selected);
    const refusal = orderRefusal(state, selected, order);
    const next = refusal === null ? planOrder(state, selected, order) : undefined;
    if (!unit || !next) {
      showRefusal(refusal);
      return;
    }
    noticeEl.hidden = true;
    if (order.type === 'repair' || order.type === 'sell') {
      const target = order.type === 'repair' ? state.world.entities.find((e) => e.id === order.target) : unit;
      commit(next, t(order.type === 'repair' ? 'announce.repair' : 'announce.sell', { name: target ? unitName(target) : '' }));
      return;
    }
    const name = t(`unit.${order.type === 'produce' || order.type === 'build' ? order.kind : unit.kind}`);
    commit(next, order.type === 'build' ? t('announce.site', { name, x: order.x + 1, y: order.y + 1 }) : t('announce.job', { name }));
  }

  function startPlacing(kind: string): void {
    placing = placing === kind ? null : kind;
    noticeEl.hidden = true;
    render();
    if (placing) announce(live, t(archetypeOf(RULESET, kind)?.extractor ? 'jobs.chooseDeposit' : 'jobs.chooseCell', { name: t(`unit.${kind}`) }));
  }

  function stopPlacing(): void {
    placing = null;
    render();
  }

  /* ---------- Unit card and legend ---------- */
  /** Roster maxima, so every bar uses the same scale for all units. */
  const ROSTER = Object.values(RULESET.archetypes);
  const MAX = {
    hp: Math.max(...ROSTER.map((a) => a.hp)),
    damage: Math.max(...ROSTER.map((a) => a.weapon?.damage ?? 0)),
    range: Math.max(...ROSTER.map((a) => a.weapon?.range ?? 0)),
    speed: Math.max(...ROSTER.map((a) => a.speed)),
    vision: Math.max(...ROSTER.map((a) => a.vision)),
    radius: Math.max(...ROSTER.map((a) => a.comms?.radius ?? 0))
  };
  /** The armour classes drawn as the kind that stands for each (one picture vocabulary for map and card). */
  const ARMOR_ICON: Record<(typeof ARMOR_CLASSES)[number], string> = { infantry: 'rifles', light: 'outrider', heavy: 'warden', structure: 'command-post', air: 'kite' };

  /** Segments (of 5) for a value on the roster scale: at least one for anything above zero. */
  const segments = (value: number, max: number): number => (value <= 0 || max <= 0 ? 0 : Math.max(1, Math.ceil((value / max) * 5 - 1e-9)));

  /**
   * One meter of the unit card (Proposal 2): pictogram and word in the term, five segments and
   * the exact value in the description. The segments are decoration (aria-hidden); the value is
   * always text, never the bar alone.
   */
  function meterRow(icon: keyof typeof PICTOGRAMS, label: string, filled: number, value: string, testId?: string): HTMLElement[] {
    const seg = h('span', { class: 'rc-seg', 'aria-hidden': 'true' }, ...Array.from({ length: 5 }, (_, i) => h('i', { class: i < filled ? 'on' : '' })));
    return [
      h('dt', {}, pictogram(icon), h('span', {}, label)),
      h('dd', testId ? { 'data-testid': testId } : {}, seg, h('bdi', { class: 'rc-meter-value' }, value))
    ];
  }

  /** A fact of the "More" fold: term and value. */
  const fact = (label: string, value: string, testId?: string): HTMLElement[] => [h('dt', {}, label), h('dd', testId ? { 'data-testid': testId } : {}, value)];

  /** Small icon of a unit kind: the map shape (circle / diamond / square) with its glyph. */
  function unitIcon(kind: string, own: boolean, side: number = own ? me() : 1): HTMLElement {
    const icon = h('canvas', { class: 'rc-icon', width: CELL, height: CELL, 'aria-hidden': 'true' }) as HTMLCanvasElement;
    let g: CanvasRenderingContext2D | null = null;
    try {
      g = icon.getContext('2d');
    } catch {
      g = null;
    }
    if (!g) return icon;
    const colour = sideColour(side);
    const surface = css('--wp-surface', '#ffffff');
    if (drawIcon(g, kind, 0, 0, CELL / 44, { own, colour, surface })) return icon;
    const c = CELL / 2;
    const r = CELL * 0.34;
    g.lineWidth = 3;
    g.strokeStyle = colour;
    g.fillStyle = own ? colour : surface;
    g.beginPath();
    if (isStructure({ kind })) g.rect(c - r, c - r, r * 2, r * 2);
    else if (own) g.arc(c, c, r, 0, Math.PI * 2);
    else {
      g.moveTo(c, c - r - 2);
      g.lineTo(c + r + 2, c);
      g.lineTo(c, c + r + 2);
      g.lineTo(c - r - 2, c);
      g.closePath();
    }
    g.fill();
    g.stroke();
    g.strokeStyle = own ? surface : colour;
    g.fillStyle = own ? surface : colour;
    g.lineWidth = 2;
    drawGlyph(g, kind, c, c);
    return icon;
  }

  /** Card sections the player opened stay open while the card is redrawn (every render). */
  const cardOpen = new Set<string>();
  function section(id: string, title: string): HTMLDetailsElement {
    const el = h('details', { class: 'rc-fold', 'data-testid': `rc-card-${id}` }, h('summary', {}, title)) as HTMLDetailsElement;
    el.open = cardOpen.has(id);
    el.addEventListener('toggle', () => (el.open ? cardOpen.add(id) : cardOpen.delete(id)));
    return el;
  }

  function renderCard(unit: Entity | undefined): void {
    clear(cardEl);
    const arch = unit && archetypeOf(RULESET, unit.kind);
    cardEl.hidden = !unit || !arch;
    if (!unit || !arch) return;
    const own = unit.side === me();
    const cells = (n: number) => t('card.cells', { n });
    cardEl.append(
      h(
        'div',
        { class: 'rc-card-head' },
        unitIcon(unit.kind, own, unit.side),
        h('div', { class: 'rc-card-who' }, h('strong', {}, unitName(unit)), h('span', { class: 'rc-muted' }, `${sideName(unit.side)} · ${shortState(unit)}`))
      )
    );
    // The meters (owner's choice, Proposal 2): one row per stat on the roster scale.
    const meters = h('dl', { class: 'rc-meters', 'data-testid': 'rc-card-meters' });
    meters.append(...meterRow('health', t('card.health'), segments(unit.hp, arch.hp), `${unit.hp} / ${arch.hp}`, 'rc-card-health'));
    const w = arch.weapon;
    if (w) {
      meters.append(
        ...meterRow('attack', t('card.damage'), segments(w.damage, MAX.damage), String(w.damage), 'rc-card-damage'),
        ...meterRow('range', t('card.range'), segments(w.range, MAX.range), w.minRange > 0 ? t('card.rangeBetween', { min: w.minRange, max: w.range }) : cells(w.range))
      );
    } else if (arch.comms && arch.comms.radius > 0) {
      meters.append(...meterRow('radio', t('card.radio'), segments(arch.comms.radius, MAX.radius), cells(arch.comms.radius)));
    }
    meters.append(
      ...meterRow('move', t('card.speed'), segments(arch.speed, MAX.speed), arch.speed > 0 ? t('card.perTurn', { n: Math.round((arch.speed * RULESET.ticksPerTurn) / 4) }) : t('card.static')),
      ...meterRow('sight', t('card.vision'), segments(arch.vision, MAX.vision), cells(arch.vision))
    );
    cardEl.append(meters);
    // What the weapon is good against, in words with the armour pictograms (never colour alone).
    if (w) {
      const groups: [string, (v: number) => boolean][] = [
        ['card.strongVs', (v) => v >= 100],
        ['card.weakerVs', (v) => v > 0 && v < 100],
        ['card.cantHit', (v) => v === 0]
      ];
      const matchup = h('dl', { class: 'rc-matchup', 'data-testid': 'rc-card-matchup' });
      for (const [key, test] of groups) {
        const classes = ARMOR_CLASSES.filter((cls) => test(w.vs[cls]));
        if (classes.length === 0) continue;
        matchup.append(
          h(
            'div',
            {},
            h('dt', {}, t(key)),
            ...classes.map((cls) => h('dd', {}, unitIcon(ARMOR_ICON[cls], false, me() === 0 ? 1 : 0), h('span', {}, t(`armor.${cls}`)), ' ', h('small', { class: 'rc-muted' }, `${w.vs[cls]} %`)))
          )
        );
      }
      cardEl.append(matchup);
    } else {
      cardEl.append(h('p', { class: 'rc-hint', 'data-testid': 'rc-card-noweapon' }, pictogram('noweapon'), h('span', {}, `${t('card.weapon')}: ${t('card.noWeapon')}`)));
    }
    // Everything else behind "More" (folded by default; stays open across redraws once opened).
    const more = section('more', t('card.more'));
    const facts = h('dl', { class: 'rc-facts' });
    facts.append(...fact(t('card.armor'), t(`armor.${arch.armor}`)));
    if (w) {
      facts.append(...fact(t('card.rate'), `${w.cooldown <= 1 ? t('card.everyTick') : t('card.everyTicks', { n: w.cooldown })} · ${t(`card.delivery.${w.delivery}`)}`));
      if (w.stationary) facts.append(...fact(t('card.weapon'), t('card.stationary')));
    }
    if (arch.comms) {
      const text = arch.comms.role === 'source' ? t('card.source', { r: arch.comms.radius, slots: arch.comms.orderSlots }) : t('card.relay', { r: arch.comms.radius });
      facts.append(...fact(t('card.radio'), arch.comms.needsDeploy ? `${text} ${t('card.needsSetUp')}` : text));
    }
    if (arch.ew) {
      const text = arch.ew.role === 'jammer' ? t('card.jammer', { r: arch.ew.radius }) : t('card.tracer', { r: arch.ew.radius, b: arch.ew.burnThrough });
      facts.append(...fact(t('card.ew'), arch.ew.needsDeploy ? `${text} ${t('card.needsSetUp')}` : text));
    }
    // Economy: what it costs and takes, what it yields or produces.
    if (RULESET.economy) {
      if (arch.buildTurns > 0) facts.append(...fact(t('card.cost'), t('card.supply', { n: arch.cost }), 'rc-card-cost'), ...fact(t('card.buildTime'), t('card.turns', { n: arch.buildTurns })));
      if (arch.income > 0) facts.append(...fact(t('card.income'), t('card.incomeValue', { n: arch.income }), 'rc-card-income'));
      if (arch.production) facts.append(...fact(t('card.produces'), arch.production.map((k) => t(`unit.${k}`)).join(', ')));
      const repairers = Object.values(RULESET.archetypes).filter((a) => a.production?.includes(arch.id)).map((a) => t(`unit.${a.id}`));
      if (arch.speed > 0 && repairers.length > 0) facts.append(...fact(t('card.repair'), t('card.repairAt', { yards: repairers.join(', ') }), 'rc-card-repair'));
      if (unit.side === me() && arch.speed === 0 && arch.comms?.role !== 'source' && arch.buildTurns > 0) facts.append(...fact(t('card.sell'), t('card.sellValue', { n: plannedSaleRefund(state, unit.id) }), 'rc-card-sell'));
    }
    more.append(facts);
    // The full effect table: one row per armour class with the exact %.
    if (w) {
      more.append(
        h(
          'table',
          { class: 'rc-vs-table', 'data-testid': 'rc-card-vs' },
          h('caption', {}, t('card.vs')),
          // One row per armour class (fits a phone in every language; words never break).
          ...ARMOR_CLASSES.map((cls) => h('tr', {}, h('th', { scope: 'row' }, unitIcon(ARMOR_ICON[cls], false, me() === 0 ? 1 : 0), h('span', {}, t(`armor.${cls}`))), h('td', {}, `${w.vs[cls]} %`)))
        )
      );
    }
    cardEl.append(more);
  }

  /** Swatch canvas painted by `paint`; the legend pairs each with its text. */
  function swatch(paint: (g: CanvasRenderingContext2D) => void): HTMLElement {
    const el = h('canvas', { class: 'rc-swatch', width: CELL, height: CELL, 'aria-hidden': 'true' }) as HTMLCanvasElement;
    let g: CanvasRenderingContext2D | null = null;
    try {
      g = el.getContext('2d');
    } catch {
      g = null;
    }
    if (g) paint(g);
    return el;
  }

  function renderLegend(): void {
    const rows = h('ul', { class: 'rc-legend-list' });
    const row = (el: HTMLElement, text: string) => rows.append(h('li', {}, el, h('span', {}, text)));
    // Terrain: the same fill and pattern as on the map, with the numbers that matter.
    for (const [code, spec] of Object.entries(RULESET.terrain)) {
      const name = TERRAIN_NAMES[code] ?? 'plain';
      const effect =
        spec.cost === null
          ? t('legend.impassable')
          : [t('legend.move', { n: spec.cost }), spec.cover > 0 ? t('legend.cover', { n: spec.cover }) : '', spec.rangeBonus > 0 ? t('legend.rangeBonus', { n: spec.rangeBonus }) : '']
              .filter(Boolean)
              .join(' · ');
      row(
        swatch((g) => {
          g.fillStyle = css(`--rc-${name}`, '#ddd');
          g.fillRect(0, 0, CELL, CELL);
          g.strokeStyle = css('--rc-mark', '#00000055');
          g.fillStyle = css('--rc-mark', '#00000055');
          g.lineWidth = 1.5;
          drawTerrainMark(g, name, 0, 0);
        }),
        `${t(`terrain.${name}`)}: ${effect}`
      );
    }
    // Shapes and overlays.
    const colourOwn = css('--wp-p1', '#24508f');
    const colourEnemy = css('--wp-p2', '#9a3412');
    const shape = (own: boolean, kind: string) => unitIcon(kind, own);
    row(shape(true, 'rifles'), t('legend.own'));
    row(shape(false, 'rifles'), t('legend.enemy'));
    row(shape(true, 'command-post'), t('legend.structure'));
    // One row per kind in the game: its picture and its name (what the symbols on the map mean).
    const kinds = h('ul', { class: 'rc-legend-list rc-legend-kinds', 'data-testid': 'rc-legend-kinds' });
    for (const kind of LEGEND_KINDS) kinds.append(h('li', {}, unitIcon(kind, true), h('span', {}, t(`unit.${kind}`))));
    legendEl.append(h('h4', {}, t('legend.kinds')), kinds);
    if (RULESET.economy) {
      row(
        swatch((g) => {
          g.fillStyle = css('--rc-plain', '#ddd');
          g.fillRect(0, 0, CELL, CELL);
          g.strokeStyle = css('--rc-mark', '#00000055');
          g.fillStyle = css('--rc-mark', '#00000055');
          drawDeposit(g, 0, 0);
        }),
        t('legend.deposit')
      );
      row(swatch((g) => drawIcon(g, 'muster', 0, 0, CELL / 44, { own: true, colour: colourOwn, surface: css('--wp-surface', '#ffffff'), site: 2 })), t('legend.site'));
    }
    row(swatch((g) => drawIcon(g, 'mast-truck', 0, 0, CELL / 44, { own: true, colour: colourOwn, surface: css('--wp-surface', '#ffffff'), deployed: true })), t('legend.setUp'));
    row(swatch((g) => drawIcon(g, 'rifles', 0, 0, CELL / 44, { own: false, colour: colourEnemy, surface: css('--wp-surface', '#ffffff'), ghost: true })), t('legend.ghost'));
    row(
      swatch((g) => {
        g.fillStyle = css('--rc-plain', '#e7e3d4');
        g.fillRect(0, 0, CELL, CELL);
        g.strokeStyle = css('--rc-nocover', 'rgba(29, 29, 27, 0.35)');
        g.beginPath();
        for (let k = 0; k < CELL; k += 11) {
          g.moveTo(k, 0);
          g.lineTo(0, k);
          g.moveTo(CELL, k);
          g.lineTo(k, CELL);
        }
        g.stroke();
      }),
      t('legend.noCover')
    );
    row(
      swatch((g) => {
        g.fillStyle = css('--rc-plain', '#e7e3d4');
        g.fillRect(0, 0, CELL, CELL);
        g.strokeStyle = css('--wp-danger', '#a1271b');
        g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(4, CELL / 2);
        for (let k = 1; k <= 4; k++) g.lineTo(4 + (k * (CELL - 8)) / 4, CELL / 2 + (k % 2 === 1 ? -5 : 5));
        g.stroke();
      }),
      t('legend.jammed')
    );
    row(
      swatch((g) => {
        g.fillStyle = css('--rc-plain', '#e7e3d4');
        g.fillRect(0, 0, CELL, CELL);
        g.fillStyle = css('--rc-fog', 'rgba(29, 29, 27, 0.18)');
        g.fillRect(0, 0, CELL, CELL);
        g.beginPath();
        g.arc(CELL - 7, CELL - 7, 2, 0, Math.PI * 2);
        g.fill();
      }),
      t('legend.fog')
    );
    legendEl.append(rows);
  }

  /** A compact list row: the map icon, the name, a health bar and one short state; the full description for screen readers. */
  function unitRow(e: Entity, short: string): HTMLElement[] {
    const arch = archetypeOf(RULESET, e.kind);
    const max = arch?.hp ?? e.hp;
    return [
      h(
        'span',
        { class: 'rc-row', 'aria-hidden': 'true', 'data-side': e.side === me() ? 'own' : 'enemy' },
        unitIcon(e.kind, e.side === me(), e.side),
        several() && e.side !== me() ? h('span', { class: 'rc-row-mark', 'data-testid': `rc-mark-${e.id}`, style: `color:${sideColour(e.side)}` }, sideMark(e.side)) : null,
        h('span', { class: 'rc-row-name' }, unitName(e)),
        h('span', { class: 'rc-row-hp' }, h('span', { class: 'rc-stat-bar' }, h('span', { class: 'rc-stat-fill', style: `width:${Math.round((100 * e.hp) / max)}%` })), h('span', {}, `${e.hp}/${max}`)),
        h('span', { class: 'rc-row-state' }, short)
      ),
      h('span', { class: 'sr-only' }, describeUnit(e))
    ];
  }

  /** One short phrase for a list row: what matters most about the unit right now. */
  function shortState(e: Entity): string {
    if (e.side !== me()) return !isGhost(e) ? t('row.inSight') : ghostTick(e) === 0 ? t('row.knownStart') : t('row.lastSeen', { turn: reportTurn(ghostTick(e) ?? 0) });
    if (e.build !== undefined) return t('list.site', { n: e.build });
    if (e.queue && e.queue.length > 0) return t('list.queue', { n: e.queue.map((q) => t(`unit.${q.kind}`)).join(', ') });
    if (isMobile(e) && !inContact(e)) return t(!isGhost(e) && jammed(e.x, e.y) ? 'contact.jammed' : 'contact.out');
    const planned = draftFor(state, e.id);
    return planned ? `→ ${describeOrder(e, planned)}` : describeOrder(e, e.order);
  }

  function renderLists(): void {
    clear(ownList);
    clear(enemyList);
    clear(neutralList);
    const own = world().entities.filter((e) => e.side === me());
    // The neutral list stands whenever the game has empty seats (a fixed property: whether a neutral
    // post is still known or was taken must not show by a heading appearing or vanishing).
    const neutralSeats = hasNeutralSeats();
    neutralPanel.hidden = !neutralSeats;
    const enemies = world().entities.filter((e) => e.side !== me() && !(neutralSeats && e.side === NEUTRAL));
    for (const e of own) {
      const btn = h(
        'button',
        { type: 'button', class: 'rc-unit', 'data-testid': `rc-unit-${e.id}`, 'aria-pressed': selected === e.id ? 'true' : 'false', 'data-planned': draftFor(state, e.id) ? 'true' : 'false', onclick: () => select(e.id) },
        ...unitRow(e, shortState(e))
      );
      ownList.append(h('li', {}, btn));
    }
    if (own.length === 0) ownList.append(h('li', {}, t('list.empty')));
    const attacker = selected === null ? undefined : known(selected);
    const canAttack =
      !!attacker && attacker.side === me() && isMobile(attacker) && inContact(attacker) && !!archetypeOf(RULESET, attacker.kind)?.weapon && state.phase === 'plan';
    for (const e of enemies) {
      const item = h('li', { 'data-testid': `rc-enemy-${e.id}`, class: 'rc-enemy-row' }, ...unitRow(e, shortState(e)));
      if (canAttack && !isGhost(e) && canHurt(attacker, e)) {
        item.append(h('button', { type: 'button', 'data-testid': `rc-attack-${e.id}`, onclick: () => orderSelected({ type: 'attack', target: e.id }) }, t('action.attack', { name: unitName(e) })));
      }
      enemyList.append(item);
    }
    if (enemies.length === 0) enemyList.append(h('li', {}, t('list.empty')));
    if (!neutralSeats) return;
    const neutral = world().entities.filter((e) => e.side === NEUTRAL);
    for (const e of neutral) {
      const item = h('li', { 'data-testid': `rc-neutral-${e.id}`, class: 'rc-enemy-row' }, ...unitRow(e, shortState(e)));
      // A neutral post can be fired on like any post (it does not fire back), also from the list.
      if (canAttack && !isGhost(e) && canHurt(attacker, e)) {
        item.append(h('button', { type: 'button', 'data-testid': `rc-attack-${e.id}`, onclick: () => orderSelected({ type: 'attack', target: e.id }) }, t('action.attack', { name: unitName(e) })));
      }
      neutralList.append(item);
    }
    if (neutral.length === 0) neutralList.append(h('li', {}, t('list.empty')));
  }

  /** Whether the game's map leaves seats empty (their posts start neutral): from the setup, never from the board. */
  function hasNeutralSeats(): boolean {
    const spec = specOf(state);
    return !!spec && (scenarioFor(spec, state.opponents)?.entities.some((e) => e.side === NEUTRAL) ?? false);
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
        if (e.side === me()) taken += e.damage;
        else dealt += e.damage;
      } else if (e.t === 'bump') {
        // As before several sides: every bump told to the player except a known enemy's (own units, also lost ones).
        const side = unitById(state, e.id)?.side;
        if (side === undefined || side === me()) bumps += 1;
      } else if (e.t === 'destroyed') {
        lines.push(t(e.side === me() ? 'summary.lostUnit' : 'summary.destroyedUnit', { name: unitName(e) }));
      } else if (e.t === 'income') {
        if (e.side === me()) lines.push(t('summary.income', { n: e.amount }));
      } else if (e.t === 'produced') {
        if (e.side === me()) lines.push(t('summary.produced', { name: unitName(e), yard: unitName(unitById(state, e.by) ?? { kind: 'muster', id: e.by }) }));
      } else if (e.t === 'built') {
        const site = unitById(state, e.id);
        if (site?.side === me()) lines.push(t('summary.built', { name: unitName(site) }));
      } else if (e.t === 'site') {
        if (e.side !== me()) lines.push(t('summary.enemySite', { name: unitName(e) }));
      } else if (e.t === 'captured') {
        const post = { kind: e.kind, id: e.id };
        lines.push(e.to === me() ? t('summary.captured', { name: unitName(post) }) : e.from === me() ? t('summary.postLost', { name: unitName(post), side: sideName(e.to) }) : t('summary.capturedBy', { name: unitName(post), side: sideName(e.to) }));
      } else if (e.t === 'eliminated') {
        lines.push(t(e.side === me() ? 'summary.youOut' : 'summary.sideOut', { side: sideName(e.side) }));
      } else if (e.t === 'missing') {
        lines.push(t('summary.missing', { name: unitName(e) }));
      } else if (e.t === 'repaired') {
        const unit = unitById(state, e.id);
        if (unit?.side === me()) lines.push(t('summary.repaired', { name: unitName(unit), hp: e.hp }));
      } else if (e.t === 'sold') {
        lines.push(e.side === me() ? t('summary.sold', { name: unitName(e), n: e.refund ?? 0 }) : t('summary.enemySold', { name: unitName(e) }));
      } else if (e.t === 'site-blocked') {
        if (e.side === me()) lines.push(t('summary.siteBlocked', { name: t(`unit.${e.kind}`), x: e.x + 1, y: e.y + 1 }));
      } else if (e.t === 'order-ended' && REPORTED_ENDS.has(e.reason) && !told.has(`${e.id}:${e.reason}`)) {
        // Orders the engine ended on its own are reported for the player's units, once per
        // unit and reason in a turn.
        const unit = unitById(state, e.id);
        told.add(`${e.id}:${e.reason}`);
        if (unit?.side === me()) lines.push(t(`summary.ended.${e.reason}`, { name: unitName(unit) }));
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
    // Jammed cells: a zigzag across the cell (pattern, not colour alone).
    g.strokeStyle = css('--wp-danger', '#a1271b');
    g.lineWidth = 1.5;
    g.beginPath();
    for (let y = 0; y < w.map.h; y++) {
      for (let x = 0; x < w.map.w; x++) {
        if (!jammed(x, y)) continue;
        const py = y * CELL + CELL / 2;
        g.moveTo(x * CELL + 4, py);
        for (let k = 1; k <= 4; k++) g.lineTo(x * CELL + 4 + (k * (CELL - 8)) / 4, py + (k % 2 === 1 ? -5 : 5));
      }
    }
    g.stroke();
    g.lineWidth = 1;
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
    if (revealed()) return;
    const observed = picture(state.world, me()).observed;
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
        if (depositAt(w.map, x, y)) drawDeposit(g, px, py);
        g.strokeStyle = line;
        g.lineWidth = 1;
        g.strokeRect(px + 0.5, py + 0.5, CELL - 1, CELL - 1);
      }
    }
  }

  /** Diagonal hatching inside a structure under construction, and the turns left as a number. */
  function drawSiteHatch(g: CanvasRenderingContext2D, x: number, y: number, size: number, colour: string, left: number): void {
    g.save();
    g.strokeStyle = colour;
    g.lineWidth = 1.5;
    g.beginPath();
    for (let k = 6; k < size * 2; k += 6) {
      g.moveTo(x + Math.min(k, size), y + Math.max(0, k - size));
      g.lineTo(x + Math.max(0, k - size), y + Math.min(k, size));
    }
    g.stroke();
    g.fillStyle = colour;
    g.font = `bold ${Math.round(CELL * 0.32)}px sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(String(left), x + size / 2, y + size / 2);
    g.restore();
  }


  const centre = (x: number, y: number) => [x * CELL + CELL / 2, y * CELL + CELL / 2] as const;

  function drawOrders(g: CanvasRenderingContext2D, w: World): void {
    for (const e of w.entities) {
      if (e.side !== me()) continue;
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
    const own = e.side === me();
    const colour = sideColour(e.side);
    const surface = css('--wp-surface', '#ffffff');
    const r = CELL * 0.34;
    const ghost = isGhost(e);
    g.save();
    // Icon set A: frame for category and side, mark for function (icons.ts); the old token is the
    // fallback where Path2D is missing.
    const drawn = drawIcon(g, e.kind, e.x * CELL, e.y * CELL, CELL / 44, { own, colour, surface, ghost, deployed: isSetUp(e) && !ghost, ...(e.build !== undefined && { site: e.build }) });
    if (!drawn) {
      g.lineWidth = 3;
      g.strokeStyle = colour;
      g.fillStyle = own ? colour : surface;
      // Last known position: hollow, dashed outline and a question mark (not colour alone).
      if (ghost) {
        g.setLineDash([4, 3]);
        g.fillStyle = surface;
      }
      // A set-up vehicle (relay, post, jammer) stands on a plate: it works like a structure now.
      if (isSetUp(e) && !ghost) {
        g.fillStyle = css('--wp-border', '#cfcdc4');
        g.fillRect(cx - r - 4, cy - r - 4, r * 2 + 8, r * 2 + 8);
        g.fillStyle = own ? colour : surface;
      }
      g.beginPath();
      if (isStructure(e)) g.rect(cx - r, cy - r, r * 2, r * 2);
      else if (own) g.arc(cx, cy, r, 0, Math.PI * 2);
      else {
        g.moveTo(cx, cy - r - 2);
        g.lineTo(cx + r + 2, cy);
        g.lineTo(cx, cy + r + 2);
        g.lineTo(cx - r - 2, cy);
        g.closePath();
      }
      if (e.build !== undefined) {
        // A site: outlined and hatched, with the turns left instead of the glyph.
        g.fillStyle = surface;
        g.fill();
        g.stroke();
        g.setLineDash([]);
        drawSiteHatch(g, cx - r, cy - r, r * 2, colour, e.build);
      } else {
        g.fill();
        g.stroke();
        g.setLineDash([]);
        // Kind glyph, drawn in the contrasting colour.
        g.strokeStyle = own && !ghost ? surface : colour;
        g.fillStyle = own && !ghost ? surface : colour;
        g.lineWidth = 2;
        drawGlyph(g, e.kind, cx, cy);
      }
    }
    // Health bar under the unit, only when it is damaged (less clutter on the map).
    const max = RULESET.archetypes[e.kind]?.hp ?? e.hp;
    if (e.hp < max) {
      const bw = CELL * 0.7;
      g.globalAlpha = 1;
      g.fillStyle = surface;
      g.fillRect(cx - bw / 2 - 1, cy + CELL * 0.38 - 1, bw + 2, 6);
      g.fillStyle = css('--wp-border', '#cfcdc4');
      g.fillRect(cx - bw / 2, cy + CELL * 0.38, bw, 4);
      g.fillStyle = colour;
      g.fillRect(cx - bw / 2, cy + CELL * 0.38, (bw * e.hp) / max, 4);
    }
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
    if (several()) {
      // Several sides: the side's letter in a corner badge (colour is never the only cue).
      const bx = e.x * CELL + 9;
      const by = e.y * CELL + CELL - 9;
      g.globalAlpha = 1;
      g.setLineDash([]);
      g.fillStyle = surface;
      g.strokeStyle = colour;
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(bx, by, 7.5, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.fillStyle = colour;
      g.font = `bold ${Math.round(CELL * 0.24)}px sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(sideMark(e.side), bx, by + 0.5);
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
      case 'jammer':
        // Lightning zigzag: the jamming signal.
        g.moveTo(cx - 7, cy - 6);
        g.lineTo(cx + 1, cy - 1);
        g.lineTo(cx - 2, cy + 1);
        g.lineTo(cx + 7, cy + 7);
        g.stroke();
        return;
      case 'tracer':
        // Listening arcs: direction finding.
        g.arc(cx - 4, cy + 4, 4, -Math.PI / 2, 0);
        g.moveTo(cx - 4, cy - 5);
        g.arc(cx - 4, cy + 4, 9, -Math.PI / 2, 0);
        g.stroke();
        return;
      case 'command-post':
        g.moveTo(cx - 5, cy + 7);
        g.lineTo(cx - 5, cy - 7);
        g.lineTo(cx + 6, cy - 4);
        g.lineTo(cx - 5, cy - 1);
        g.stroke();
        return;
      case 'outrider':
        // Two chevrons: fast.
        for (const dx of [-5, 2]) {
          g.moveTo(cx + dx - 3, cy - 6);
          g.lineTo(cx + dx + 3, cy);
          g.lineTo(cx + dx - 3, cy + 6);
        }
        g.stroke();
        return;
      case 'field-post':
        // A small flag with a plus: a mobile command post.
        g.moveTo(cx - 6, cy + 7);
        g.lineTo(cx - 6, cy - 7);
        g.lineTo(cx + 3, cy - 4);
        g.lineTo(cx - 6, cy - 1);
        g.moveTo(cx + 2, cy + 4);
        g.lineTo(cx + 8, cy + 4);
        g.moveTo(cx + 5, cy + 1);
        g.lineTo(cx + 5, cy + 7);
        g.stroke();
        return;
      case 'muster':
        // A tent: where infantry musters.
        g.moveTo(cx - 8, cy + 6);
        g.lineTo(cx, cy - 7);
        g.lineTo(cx + 8, cy + 6);
        g.closePath();
        g.moveTo(cx, cy - 7);
        g.lineTo(cx, cy + 6);
        g.stroke();
        return;
      case 'motor-pool':
        // A wheel: where vehicles are built.
        g.arc(cx, cy, 7, 0, Math.PI * 2);
        g.moveTo(cx + 2.5, cy);
        g.arc(cx, cy, 2.5, 0, Math.PI * 2);
        for (const [dx, dy] of [[0, -7], [6, 3.5], [-6, 3.5]] as const) {
          g.moveTo(cx, cy);
          g.lineTo(cx + dx, cy + dy);
        }
        g.stroke();
        return;
      case 'extractor':
        // A derrick over a drop: it draws Supply from a deposit.
        g.moveTo(cx - 6, cy + 7);
        g.lineTo(cx, cy - 7);
        g.lineTo(cx + 6, cy + 7);
        g.moveTo(cx - 3, cy);
        g.lineTo(cx + 3, cy);
        g.stroke();
        return;
      case 'relay-mast':
        // A mast with waves on both sides.
        g.moveTo(cx, cy + 7);
        g.lineTo(cx, cy - 4);
        g.moveTo(cx - 4, cy - 7);
        g.arc(cx, cy - 4, 5, Math.PI * 1.15, Math.PI * 1.45);
        g.moveTo(cx + 4, cy - 7);
        g.arc(cx, cy - 4, 5, Math.PI * 1.85, Math.PI * 1.55, true);
        g.stroke();
        return;
      default:
        // Anything without its own glyph (towers): a ring with a cross.
        g.arc(cx, cy, 6, 0, Math.PI * 2);
        g.moveTo(cx - 4, cy);
        g.lineTo(cx + 4, cy);
        g.moveTo(cx, cy - 4);
        g.lineTo(cx, cy + 4);
        g.stroke();
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
    settleSell = null; // an armed sale never survives a change (a planned order, a locked turn)
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
    placing = null;
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
    const specific = ['out-of-contact', 'no-slots', 'impassable', 'not-visible', 'no-weapon', 'no-supply', 'cannot-produce', 'queue-full', 'cannot-build', 'not-buildable', 'cannot-repair', 'cannot-sell'].includes(refusal ?? '');
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
      holdFire: holdFireBox.checked,
      lostContact: (LOST_CONTACT as readonly string[]).includes(lostContactSelect.value) ? (lostContactSelect.value as LostContact) : 'regroup'
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

  /** Scenario or turn limit changed before the first turn: start the game afresh with them. */
  /** The map select: the built-in maps, the map being played if it is player-made, and the device's maps. */
  function syncScenarioOptions(): void {
    for (const opt of [...scenarioSelect.querySelectorAll('option')]) if (opt.value === 'custom' || opt.value.startsWith('slot:')) opt.remove();
    if (state.map) scenarioSelect.append(h('option', { value: 'custom' }, mapLabel(state.map)));
    library().forEach((m, slot) => {
      if (m && mapIssues(m).length === 0) scenarioSelect.append(h('option', { value: `slot:${slot}` }, `${t('setup.myMaps')}: ${mapLabel(m)}`));
    });
  }

  /** The opponent counts the map in the select offers (player-made maps: one). */
  function syncOpponentOptions(): void {
    const value = scenarioSelect.value;
    const spec = scenarioById(value);
    const counts = spec ? opponentCounts(spec) : [1];
    const current = [...opponentsSelect.querySelectorAll('option')].map((o) => o.value).join(',');
    if (current !== counts.join(',')) {
      clear(opponentsSelect);
      for (const n of counts) opponentsSelect.append(h('option', { value: String(n) }, t('setup.opponentCount', { n })));
    }
    // A single choice is no choice: the row is shown only for maps with several.
    const label = opponentsSelect.parentElement;
    if (label) label.hidden = counts.length < 2;
  }

  function onSetup(): void {
    if (state.phase !== 'plan' || state.log.length > 0) return;
    const value = scenarioSelect.value;
    const own = value.startsWith('slot:') ? library()[Number(value.slice(5))] : value === 'custom' ? state.map : null;
    const spec = scenarioById(value) ?? FIELD_EXERCISE;
    const limit = limitSelect.value === 'open' || limitSelect.value === 'quick' ? null : Number(limitSelect.value);
    selected = null;
    const map = own && mapIssues(own).length === 0 ? own : null;
    syncOpponentOptions();
    const opponents = map ? 1 : Number(opponentsSelect.value) || 1;
    commit(newGame(state.seed, spec, state.difficulty, limit, limitSelect.value === 'quick', map, opponents, chosenSeats()), t('announce.setup', { scenario: map ? mapLabel(map) : t(`scenario.${spec.id}`) }));
    homeCursor();
    render();
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
    const ownHere = here.find((e) => e.side === me());
    // A ghost marks where an enemy was, not where it is: its cell takes a move order.
    const enemyHere = here.find((e) => e.side !== me() && !isGhost(e));
    const current = selected === null ? undefined : known(selected);
    const canOrder = !!current && current.side === me() && isMobile(current) && state.phase === 'plan';
    // Placing a structure: the clicked cell is where it goes (the source stays selected).
    if (placing && current && current.side === me() && state.phase === 'plan') {
      const kind = placing;
      orderJob({ type: 'build', kind, x, y });
      if (!noticeEl.hidden) {
        render(); // refused: stay in placing mode with the reason shown, cursor on the cell
        return;
      }
      placing = null;
      render();
      return;
    }
    if (canOrder && mode === 'escort' && ownHere && ownHere.id !== selected) {
      orderSelected({ type: 'escort', target: ownHere.id });
      return;
    }
    // An own ghost marks where a unit out of contact was last reported, not where it is: with a
    // unit selected, its cell takes a move order (the ghost stays selectable in the list).
    if (canOrder && mode === 'move' && ownHere && isGhost(ownHere) && !here.some((e) => e.side === me() && !isGhost(e))) {
      orderSelected({ type: 'move', x, y });
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
    // Hot-seat: the device goes on; only the hand-over is announced (no side's summary).
    if (next.handover) {
      selected = null;
      announce(live, handoverTitle.textContent ?? '');
      handoverBtn.focus();
      return;
    }
    // render() has rebuilt the summary list; announce its fresh text.
    announce(live, `${t('announce.resolved', { turn: next.world.turn })} ${[...summaryList.querySelectorAll('li')].map((li) => li.textContent).join(' ')}`);
  }

  /** Shows or hides the give-up confirmation and keeps keyboard focus on a visible control. */
  function setConfirming(value: boolean): void {
    confirming = value;
    render();
    (value ? confirmBox.querySelector<HTMLElement>('[data-testid="rc-concede-no"]') : concedeBtn)?.focus();
  }

  function onSettle(): void {
    if (!canSettle(state)) return;
    if (!settleArmed) {
      settleArmed = true;
      armedAt = performance.now();
      render();
      return;
    }
    if (tooSoon()) return;
    settleArmed = false;
    const next = settle(state);
    commit(next, statusOf(next));
    statusEl.focus();
  }

  function onConcede(): void {
    confirming = false;
    const next = concede(state);
    if (next.handover) {
      selected = null;
      commit(next);
      announce(live, handoverTitle.textContent ?? '');
      handoverBtn.focus();
      return;
    }
    commit(next, isHotSeat(next) ? statusOf(next) : t('status.conceded'));
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
    const post = world().entities.find((e) => e.side === me() && e.kind === 'command-post');
    cursor = post ? { x: post.x, y: post.y } : { x: 0, y: 0 };
  };

  /* ---------- Instance ---------- */
  return {
    newGame(options: NewGameOptions) {
      // An open map draft survives "New game" (it is the player's work, not the game's).
      const draft = state.edit;
      editor.forget();
      state = { ...newGame(normalizeSeed(options.seed), FIELD_EXERCISE, isDifficulty(options.difficulty) ? options.difficulty : 'normal', null), edit: draft };
      context.setDifficulty?.(state.difficulty); // an unknown host value fell back to 'normal'
      selected = null;
      confirming = false;
      reported = false;
      homeCursor();
      render();
    },
    restore(saved: RcState) {
      settleSell = null;
      editor.forget();
      const spec = specOf(saved);
      state = spec ? structuredClone(saved) : newGame(saved.seed, FIELD_EXERCISE, saved.difficulty, null);
      // Hot-seat: whoever opens the game first passes it to the person planning (nobody's plan shows).
      if (state.phase === 'plan' && isHotSeat(state) && personsLeft(state).length > 1) state = { ...state, handover: true };
      context.setDifficulty?.(state.difficulty); // the save decides the level, not the host's select
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
      state = { ...newGame(state.seed, scenarioById(state.scenario) ?? FIELD_EXERCISE, state.difficulty, state.turnLimit, state.quick, state.map, state.opponents, state.seats), edit: state.edit };
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
