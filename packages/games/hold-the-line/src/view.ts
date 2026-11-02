import { bcp47Tag, normalizeSeed, type GameContext, type GameInstance, type NewGameOptions } from '@wp/game-core';
import { archetypeOf, type Entity, type SimEvent } from '@wp/strategy-engine';
import { BASE_TOWERS, drawFrame, drawTerrain, Motion, readPalette, TD_RULESET, TICKS_PER_SECOND, TOWER_PRIORITIES, TOWERS, type EnemyKind, type Palette, type TowerPriority } from '@wp/td-core';
import { announce, clear, gridKeyboard, h } from '@wp/ui';
import { planRound } from './ai';
import { mapForMode, ownPad } from './maps';
import {
  applyPlan,
  capacityOf,
  checkPlan,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  EXTRACTOR_INCOME,
  EXTRACTOR_PRICE,
  externalWave,
  incomeOf,
  levyOf,
  MAX_PRESSURE,
  MAX_ROUNDS,
  wearOf,
  WEAR_FROM,
  DEFAULT_LENGTH,
  LENGTHS,
  INTEREST_PERCENT,
  lockRound,
  mapOf,
  MAX_WORKSHOPS,
  newGame,
  refundAt,
  resolveBattle,
  ROUNDS,
  seenBy,
  SHOP,
  stepBattle,
  UNIT_PRICES,
  WORKSHOP_CAPACITY,
  WORKSHOP_PRICE,
  type Difficulty,
  type HoldState,
  type GameOptions,
  type Length,
  type Mode,
  type PlanCommand
} from './rules';
import './styles.css';

/** Ticks between autosaves while a battle runs (5 simulated seconds). */
const SAVE_EVERY = 5 * TICKS_PER_SECOND;
const SPEEDS = [1, 2, 4] as const;
const PLAYER = 0;

/** Start-screen choice of mode: the two modes, and the outside force played alone. */
export const MODE_CHOICES = ['vs-small', 'external-small', 'external-solo'] as const;
const toChoice = (m: unknown): (typeof MODE_CHOICES)[number] => ((MODE_CHOICES as readonly unknown[]).includes(m) ? (m as (typeof MODE_CHOICES)[number]) : 'vs-small');
const toLength = (l: unknown): Length => ((LENGTHS as readonly unknown[]).includes(l) ? (l as Length) : DEFAULT_LENGTH);
/** The game a start-screen choice asks for. */
export const startOf = (choice: unknown, length: unknown): { mapId: string; options: GameOptions } => {
  const c = toChoice(choice);
  const mode: Mode = c === 'vs-small' ? 'vs-small' : 'external-small';
  return { mapId: mapForMode(mode).id, options: { length: toLength(length), ...(c === 'external-solo' && { solo: true }) } };
};
const toDifficulty = (d: string | undefined): Difficulty => ((DIFFICULTIES as readonly string[]).includes(d ?? '') ? (d as Difficulty) : DEFAULT_DIFFICULTY);
const hpMax = (kind: string): number => archetypeOf(TD_RULESET, kind)?.hp ?? 1;
const splashOf = (kind: string): number => archetypeOf(TD_RULESET, kind)?.weapon?.splash ?? 0;

/** Rounds ahead of the wear-down that the HUD announces it (review of PR #107). */
const WEAR_NOTICE = 5;

export function createHoldTheLine(context: GameContext): GameInstance<HoldState> {
  const { t, root } = context;
  let state: HoldState = newGame(0, DEFAULT_DIFFICULTY);
  let initial: HoldState = state;
  let hostPaused = false;
  let playing = false;
  let speed: (typeof SPEEDS)[number] = 1;
  let selected: { x: number; y: number } | null = null;
  let frameId = 0;
  let lastTime = 0;
  let acc = 0;
  let sinceSave = 0;
  const motion = new Motion();
  let hits = new Set<number>();
  let beams: [number, number][] = [];
  let blasts: [number, number, number][] = [];
  let palette: Palette | null = null;
  let disposeKeyboard: () => void = () => {};
  let builtFor = '';
  let reported = false;

  const raf: ((cb: (t: number) => void) => number) | undefined = typeof requestAnimationFrame === 'function' ? requestAnimationFrame.bind(globalThis) : undefined;
  const caf: ((id: number) => void) | undefined = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame.bind(globalThis) : undefined;

  // --- DOM -------------------------------------------------------------------------------------
  const round = h('span', { 'data-testid': 'round' });
  const phase = h('span', { 'data-testid': 'phase' });
  const credits = h('span', { 'data-testid': 'credits' });
  const coreOwn = h('span', { 'data-testid': 'core-own' });
  const coreFoe = h('span', { 'data-testid': 'core-foe' });
  const income = h('span', { 'data-testid': 'income' });
  const wear = h('span', { 'data-testid': 'wear' });
  const hud = h('p', { class: 'td-hud' }, round, phase, credits, coreOwn, coreFoe, income, wear);
  const status = h('p', { class: 'wp-status td-status', 'data-testid': 'status', hidden: true });
  const canvas = h('canvas', { class: 'td-canvas', 'aria-hidden': 'true' });
  const cells = h('div', { class: 'td-cells', role: 'group', 'aria-label': t('board'), 'data-testid': 'board' });
  const board = h('div', { class: 'td-board', dir: 'ltr' }, canvas, cells);
  const panel = h('section', { class: 'td-panel wp-card', 'aria-label': t('panel.title'), 'data-testid': 'panel' });
  const shop = h('section', { class: 'td-panel wp-card', 'aria-label': t('shop.title'), 'data-testid': 'shop' });
  const intel = h('section', { class: 'td-preview', 'data-testid': 'intel' });
  const outside = h('section', { class: 'td-preview', 'data-testid': 'outside' });
  const lockButton = h('button', { type: 'button', class: 'wp-primary', 'data-testid': 'lock', onclick: () => onLock() }, t('controls.lock'));
  const playButton = h('button', { type: 'button', 'data-testid': 'play', onclick: () => togglePlay() });
  const speedButton = h('button', { type: 'button', 'data-testid': 'speed', onclick: () => cycleSpeed() });
  const instantButton = h('button', { type: 'button', 'data-testid': 'instant', onclick: () => onInstant() }, t('controls.instant'));
  const controls = h('div', { class: 'wp-row td-controls' }, lockButton, playButton, speedButton, instantButton);
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'announcer' });
  const container = h(
    'div',
    { class: `wp-hold-the-line${context.reducedMotion ? ' td-reduced' : ''}`, dir: t.direction, lang: bcp47Tag(t.locale) },
    hud,
    status,
    controls,
    h('div', { class: 'td-layout' }, board, h('div', { class: 'td-side' }, panel, outside, shop, intel)),
    h('p', { class: 'wp-muted td-help' }, t('keys.help')),
    h('p', { class: 'wp-muted td-help' }, t('access.note')),
    live
  );

  // --- Helpers ---------------------------------------------------------------------------------
  const nameOf = (kind: string): string => (kind === 'extractor' ? t('structure.extractor') : t(`tower.${kind}`));
  const unitName = (kind: string): string => t(`enemy.${kind}`);
  const about = (kind: string): string =>
    kind === 'extractor'
      ? t('about.extractor', { n: EXTRACTOR_INCOME })
      : kind === 'amplifier-2'
        ? t('about.amplifier') // its text already says what level 3 adds (and that it reaches own units)
        : TOWERS[kind]?.level === 3
          ? t('about.level3')
          : t(`about.${kind}`);
  const where = (x: number, y: number) => ({ row: y + 1, col: x + 1 });
  const me = () => state.sides[PLAYER];
  const map = () => mapOf(state);
  const structureAt = (x: number, y: number) => state.world.entities.find((e) => e.x === x && e.y === y && (Object.hasOwn(TOWERS, e.kind) || e.kind === 'extractor'));
  const listOf = (wave: readonly EnemyKind[]): string => {
    if (wave.length === 0) return t('intel.none');
    const counts = new Map<EnemyKind, number>();
    for (const k of wave) counts.set(k, (counts.get(k) ?? 0) + 1);
    return [...counts].map(([k, n]) => t('intel.item', { n, enemy: unitName(k) })).join(', ');
  };
  const commit = (next: HoldState, message?: string): void => {
    if (next === state) return;
    state = next;
    render();
    context.requestSave();
    if (message) announce(live, message);
  };

  const cellLabel = (x: number, y: number): string => {
    const m = map();
    const p = where(x, y);
    const s = structureAt(x, y);
    let label: string;
    const [ox, oy] = m.lanes[1]!.points.at(-1)!;
    const [fx, fy] = m.lanes[0]!.points.at(-1)!;
    if (s) label = t(s.side === PLAYER ? 'cell.tower.own' : 'cell.tower.foe', { ...p, tower: nameOf(s.kind), hp: s.hp, max: hpMax(s.kind) });
    else if (x === ox && y === oy) label = t('cell.core.own', p);
    else if (x === fx && y === fy) label = t(state.solo ? 'cell.core.idle' : 'cell.core.foe', p);
    else {
      const code = m.rows[y]![x];
      label = code === '=' ? t('cell.road', p) : code === 'b' ? t(ownPad(m, PLAYER, x, y) ? 'cell.pad.own' : state.solo ? 'cell.pad.idle' : 'cell.pad.foe', p) : t('cell.rock', p);
    }
    const n = state.world.entities.filter((e) => e.x === x && e.y === y && !Object.hasOwn(TOWERS, e.kind) && e.kind !== 'extractor').length;
    return n > 0 ? t('cell.units', { cell: label, n }) : label;
  };

  const buildCells = (): void => {
    const key = `${state.world.map.w}x${state.world.map.h}`;
    if (key === builtFor) return;
    builtFor = key;
    disposeKeyboard();
    clear(cells);
    const { w, h: rows } = state.world.map;
    board.style.setProperty('--td-w', String(w));
    board.style.setProperty('--td-h', String(rows));
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < w; x++) {
        cells.append(
          h('button', {
            type: 'button',
            class: 'td-cell',
            'data-cell': '',
            'data-testid': `cell-${x}-${y}`,
            tabindex: x === 0 && y === 0 ? 0 : -1,
            onclick: () => select(x, y),
            onkeydown: (event: Event) => onCellKey(event as KeyboardEvent),
            onkeyup: (event: Event) => {
              if ((event as KeyboardEvent).key === ' ') event.preventDefault();
            }
          })
        );
      }
    }
    disposeKeyboard = gridKeyboard(cells, w);
  };

  // --- Rendering -------------------------------------------------------------------------------
  const renderHud = (): void => {
    round.textContent = (state.length ?? 'rounds') === 'endless' ? t('hud.roundEndless', { n: state.round + 1, total: MAX_ROUNDS }) : t('hud.round', { n: state.round + 1, total: ROUNDS });
    phase.textContent = state.phase === 'plan' ? t('hud.plan') : state.phase === 'battle' ? t(playing && !hostPaused ? 'hud.battle' : 'hud.paused') : '';
    credits.textContent = t('hud.credits', { n: me().credits });
    credits.dataset.value = String(me().credits);
    coreOwn.textContent = t('hud.core.own', { n: me().core });
    coreOwn.dataset.value = String(me().core);
    coreFoe.hidden = state.solo === true;
    coreFoe.textContent = t('hud.core.foe', { n: state.sides[1].core });
    coreFoe.dataset.value = String(state.sides[1].core);
    income.hidden = state.phase !== 'plan';
    income.textContent = t('hud.income', { n: incomeOf(state, PLAYER), p: INTEREST_PERCENT });
    // Endless: the wear-down from round WEAR_FROM + 1, announced WEAR_NOTICE rounds ahead and shown while it applies.
    const running = state.phase === 'plan' || state.phase === 'battle';
    const worn = running ? wearOf(state) : 0;
    const soon = running && worn === 0 && (state.length ?? 'rounds') === 'endless' && state.round >= WEAR_FROM - WEAR_NOTICE;
    wear.hidden = worn === 0 && !soon;
    wear.textContent = worn > 0 ? t('hud.wear', { n: worn, from: WEAR_FROM + 1 }) : soon ? t('hud.wearSoon', { from: WEAR_FROM + 1 }) : '';
    container.dataset.phase = state.phase;
    container.dataset.round = String(state.round);
    container.dataset.tick = String(state.run?.tick ?? 0);
  };

  const renderCells = (): void => {
    const { w } = state.world.map;
    [...cells.children].forEach((el, i) => {
      const x = i % w;
      const y = Math.floor(i / w);
      el.setAttribute('aria-label', cellLabel(x, y));
      el.setAttribute('aria-pressed', String(selected?.x === x && selected?.y === y));
    });
  };

  const option = (label: string, testId: string, onclick: () => void, disabled: boolean, note?: string): HTMLElement =>
    h('button', { type: 'button', class: 'td-option', 'data-testid': testId, disabled, onclick }, h('span', { class: 'td-option-name' }, label), note ? h('span', { class: 'td-option-note' }, note) : '');

  const renderPanel = (): void => {
    clear(panel);
    panel.append(h('h3', { class: 'td-subtitle' }, t('panel.title')));
    if (!selected) {
      panel.append(h('p', { class: 'wp-muted' }, t('panel.none')));
      return;
    }
    const { x, y } = selected;
    const planning = state.phase === 'plan';
    const s = structureAt(x, y);
    panel.append(h('p', { class: 'td-where' }, cellLabel(x, y)));
    if (!s) {
      const code = map().rows[y]![x];
      if (code !== 'b') return void panel.append(h('p', { class: 'wp-muted' }, t('panel.road')));
      if (!ownPad(map(), PLAYER, x, y)) return void panel.append(h('p', { class: 'wp-muted' }, t('panel.notOwn')));
      if (!planning) return void panel.append(h('p', { class: 'wp-muted' }, t('panel.locked')));
      panel.append(h('p', {}, t('panel.build')));
      const list = h('div', { class: 'td-options' });
      for (const kind of BASE_TOWERS) {
        const price = TOWERS[kind]!.price;
        const short = price > me().credits;
        list.append(option(t('panel.price', { name: nameOf(kind), n: price }), `build-${kind}`, () => onPlan({ t: 'place', kind, x, y }), short, short ? `${about(kind)} ${t('panel.short')}` : about(kind)));
      }
      const short = EXTRACTOR_PRICE > me().credits;
      list.append(option(t('panel.price', { name: nameOf('extractor'), n: EXTRACTOR_PRICE }), 'build-extractor', () => onPlan({ t: 'extractor', x, y }), short, short ? `${about('extractor')} ${t('panel.short')}` : about('extractor')));
      panel.append(list);
      return;
    }
    panel.append(h('p', { class: 'td-tower-name' }, nameOf(s.kind)));
    const def = TOWERS[s.kind];
    panel.append(h('p', { class: 'wp-muted' }, `${def ? `${t('panel.level', { n: def.level })} · ` : ''}${t('panel.health', { hp: s.hp, max: hpMax(s.kind) })}`), h('p', {}, about(s.kind)));
    if (s.side !== PLAYER) return;
    if (!planning) return void panel.append(h('p', { class: 'wp-muted' }, t('panel.locked')));
    if (def && def.next.length > 0) {
      panel.append(h('h4', { class: 'td-subtitle' }, t('panel.upgrade')));
      if (def.level === 1) panel.append(h('p', { class: 'wp-muted' }, t('panel.final')));
      const list = h('div', { class: 'td-options' });
      for (const kind of def.next) {
        const price = TOWERS[kind]!.price;
        const short = price > me().credits;
        list.append(option(t('panel.upgradeTo', { name: nameOf(kind), n: price }), `upgrade-${kind}`, () => onPlan({ t: 'upgrade', id: s.id, kind }), short, short ? `${about(kind)} ${t('panel.short')}` : about(kind)));
      }
      panel.append(list);
    } else if (def) panel.append(h('p', { class: 'wp-muted' }, t('panel.maxed')));
    if (def) {
      const current = (s.doctrine?.priority ?? 'weakest') as TowerPriority;
      const select = h(
        'select',
        { id: 'htl-target', 'data-testid': 'target', onchange: (e: Event) => onPlan({ t: 'target', id: s.id, priority: (e.target as HTMLSelectElement).value as TowerPriority }) },
        ...TOWER_PRIORITIES.map((p) => h('option', { value: p, selected: p === current }, t(`target.${p}`)))
      );
      panel.append(h('label', { class: 'td-target', for: 'htl-target' }, t('panel.target')), select);
    }
    panel.append(h('div', { class: 'wp-row' }, h('button', { type: 'button', 'data-testid': 'sell', onclick: () => onPlan({ t: 'sell', id: s.id }) }, t('panel.sell', { n: refundAt(state, PLAYER, s.id) }))));
  };

  const external = (): boolean => state.mode === 'external-small';

  const renderOutside = (): void => {
    clear(outside);
    outside.hidden = !external();
    if (!external()) return;
    const extra = Math.min(MAX_PRESSURE, state.pressure ?? 0);
    // Alone there is no other side to speak of.
    const solo = state.solo ? 'Solo' : '';
    outside.append(
      h('h3', { class: 'td-subtitle' }, t('external.title')),
      h('p', { 'data-testid': 'outside-wave' }, t(`external.incoming${solo}`, { list: listOf(externalWave(state)) }))
    );
    if (state.round > 0) outside.append(h('p', { 'data-testid': 'outside-pressure' }, t(`external.pressure${solo}`, { n: state.pressure ?? 0, extra })));
    outside.append(h('p', { class: 'wp-muted' }, t(`external.note${solo}`)));
  };

  const renderShop = (): void => {
    clear(shop);
    shop.hidden = external();
    if (external()) return;
    const side = me();
    const planning = state.phase === 'plan';
    const max = capacityOf(side);
    // From the lock on, the wave ends with this round's levy: it is shown apart from what was bought.
    const levy = levyOf(state);
    const bought = planning ? side.wave : side.wave.slice(0, side.wave.length - levy.length);
    shop.append(h('h3', { class: 'td-subtitle' }, t('shop.title')), h('p', { 'data-testid': 'capacity' }, t('shop.capacity', { n: bought.length, max })));
    const wave = h('ul', { class: 'td-wave-list', 'data-testid': 'wave' });
    bought.forEach((kind, index) => {
      wave.append(h('li', {}, h('button', { type: 'button', disabled: !planning, 'data-testid': `unbuy-${index}`, onclick: () => onPlan({ t: 'unbuy', index }) }, t('shop.remove', { name: unitName(kind) }))));
    });
    if (bought.length === 0) wave.append(h('li', { class: 'wp-muted' }, t('shop.empty')));
    shop.append(wave);
    if (levy.length > 0) shop.append(h('p', { 'data-testid': 'levy' }, t('shop.levy', { list: listOf(levy) })));
    if (!planning) return;
    const list = h('div', { class: 'td-options' });
    for (const kind of SHOP) {
      const price = UNIT_PRICES[kind]!;
      const refusal = checkPlan(state, PLAYER, { t: 'buy', kind });
      list.append(option(t('shop.buy', { name: unitName(kind), n: price }), `buy-${kind}`, () => onPlan({ t: 'buy', kind }), refusal !== null, t(`enemyAbout.${kind}`)));
    }
    shop.append(list);
    if (side.wave.length >= max && side.workshops < MAX_WORKSHOPS) shop.append(h('p', { class: 'wp-muted' }, t('shop.full', { n: WORKSHOP_CAPACITY })));
    shop.append(
      h('p', { class: 'wp-muted' }, t('shop.workshops', { n: side.workshops, max: MAX_WORKSHOPS })),
      option(t('shop.workshop', { n: WORKSHOP_PRICE, more: WORKSHOP_CAPACITY }), 'workshop', () => onPlan({ t: 'workshop' }), checkPlan(state, PLAYER, { t: 'workshop' }) !== null)
    );
  };

  const renderIntel = (): void => {
    clear(intel);
    intel.hidden = external() || (state.round === 0 && state.phase === 'plan');
    if (intel.hidden) return;
    // Last round's waves without that round's levy (both sides sent it; it is listed once).
    const levy = state.round > 0 ? levyOf({ ...state, round: state.round - 1 }) : [];
    const boughtOf = (wave: readonly EnemyKind[]) => wave.slice(0, wave.length - levy.length);
    intel.append(
      h('h3', { class: 'td-subtitle' }, t('intel.title')),
      h('p', { 'data-testid': 'intel-theirs' }, t('intel.theirs', { list: listOf(boughtOf(state.sides[1].lastWave)) })),
      h('p', {}, t('intel.yours', { list: listOf(boughtOf(me().lastWave)) }))
    );
    if (levy.length > 0) intel.append(h('p', {}, t('intel.levy', { list: listOf(levy) })));
  };

  const renderControls = (): void => {
    const p = state.phase;
    lockButton.hidden = p !== 'plan';
    playButton.hidden = p !== 'battle';
    speedButton.hidden = p !== 'battle';
    instantButton.hidden = p !== 'battle';
    playButton.textContent = t(playing ? 'controls.pause' : 'controls.play');
    speedButton.textContent = t('controls.speed', { n: speed });
    if (p === 'won' || p === 'lost' || p === 'draw') status.textContent = endText();
    status.hidden = status.textContent === '';
  };

  const draw = (): void => {
    const g = canvas.getContext?.('2d');
    if (!g) return;
    const width = board.clientWidth;
    if (width <= 0) return;
    const dpr = globalThis.devicePixelRatio || 1;
    const height = (width * state.world.map.h) / state.world.map.w;
    // Both sides: maps share a width but not a height (a map change keeps the width).
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    palette ??= readPalette(container);
    // Units glide over each step (Motion); in reduced motion they stand on their cells.
    const now = state.world.tick + (playing ? Math.min(1, acc) : 0);
    const place = context.reducedMotion ? undefined : (e: Entity) => motion.position(e.id, e.x, e.y, now);
    const m = map();
    const entries = m.lanes.map((r) => r.points[0]!);
    const goals = m.lanes.map((r, side) => {
      const [x, y] = r.points.at(-1)!;
      return { x, y, side: 1 - side };
    });
    drawFrame(g, width, palette, { world: state.world, place, beams, hits, blasts, selected, entries, goals, viewer: PLAYER, split: m.split, neutralUnits: external(), hpMax, splashOf }, terrainLayer(width, dpr, palette));
  };

  let terrainKey = '';
  let terrainCanvas: HTMLCanvasElement | null = null;
  const terrainLayer = (width: number, dpr: number, p: Palette): HTMLCanvasElement | null => {
    const key = `${state.mapId}|${Math.round(width * dpr)}|${p.terrain.key}`;
    if (key === terrainKey && terrainCanvas) return terrainCanvas;
    const layer = document.createElement('canvas');
    const cell = width / state.world.map.w;
    layer.width = Math.round(width * dpr);
    layer.height = Math.round(cell * state.world.map.h * dpr);
    const lg = layer.getContext?.('2d');
    if (!lg) return null;
    lg.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawTerrain(lg, state.world, cell, p);
    terrainKey = key;
    terrainCanvas = layer;
    return layer;
  };

  const render = (): void => {
    buildCells();
    renderHud();
    renderCells();
    renderPanel();
    renderOutside();
    renderShop();
    renderIntel();
    renderControls();
    draw();
  };

  // --- Battle playback -------------------------------------------------------------------------
  const collect = (events: readonly SimEvent[]): void => {
    beams = [];
    blasts = [];
    hits = new Set();
    motion.update(events);
    const lastTick = events.at(-1)?.tick;
    for (const e of events) {
      if (e.tick !== lastTick) continue;
      if (e.t === 'fire') {
        const shooter = state.world.entities.find((x) => x.id === e.id);
        const target = state.world.entities.find((x) => x.id === e.target);
        if (shooter && target && archetypeOf(TD_RULESET, shooter.kind)?.weapon?.delivery === 'beam') beams.push([shooter.id, target.id]);
      } else if (e.t === 'land') blasts.push([e.x, e.y, 0]);
      else if (e.t === 'hit') hits.add(e.id);
    }
  };

  const advance = (ticks: number): void => {
    const before = state;
    const result = ticks > 1_000 ? resolveBattle(before) : stepBattle(before, ticks);
    state = result.state;
    collect(result.events);
    motion.prune(new Set(state.world.entities.map((e) => e.id)));
    sinceSave += ticks;
    if (state.phase !== 'battle') return onBattleOver(before);
    if (sinceSave >= SAVE_EVERY) {
      sinceSave = 0;
      context.requestSave();
    }
    renderHud();
  };

  const onBattleOver = (before: HoldState): void => {
    stopLoop();
    playing = false;
    sinceSave = 0;
    beams = [];
    blasts = [];
    motion.clear();
    hits = new Set();
    acc = 0;
    if (state.phase === 'plan') {
      status.textContent = t(state.solo ? 'status.roundSolo' : external() ? 'status.roundExternal' : 'status.round', {
        n: before.round + 1,
        lost: before.sides[PLAYER].core - me().core,
        taken: before.sides[1].core - state.sides[1].core,
        killed: me().stats.killed - before.sides[PLAYER].stats.killed
      });
      announce(live, status.textContent);
    } else {
      status.textContent = '';
      reportEnd();
    }
    context.requestSave();
    render();
  };

  /** The closing line: alone, how long you held; otherwise both cores. */
  const endText = (): string => {
    const p = state.phase;
    if (state.solo) return t(p === 'won' ? 'status.soloWon' : 'status.soloLost', { n: state.round + 1, own: me().core });
    return t(`status.${p}`, { n: state.round + 1, own: me().core, foe: state.sides[1].core });
  };

  const reportEnd = (): void => {
    if (reported || (state.phase !== 'won' && state.phase !== 'lost' && state.phase !== 'draw')) return;
    reported = true;
    announce(live, endText());
    const stats = { core: me().core, rounds: state.round + 1, killed: me().stats.killed };
    // Alone there is no opponent; a fallen core is the natural end there ("result.completed": the force broke through).
    if (state.solo) context.finished({ outcome: state.phase === 'won' ? 'won' : 'completed', stats });
    else context.finished({ outcome: state.phase, stats: { ...stats, opponent: state.sides[1].core } });
  };

  const loop = (time: number): void => {
    frameId = 0;
    if (!playing || hostPaused || state.phase !== 'battle') return;
    const dt = lastTime === 0 ? 0 : Math.min(250, time - lastTime);
    lastTime = time;
    acc += (dt * speed * TICKS_PER_SECOND) / 1000;
    const n = Math.floor(acc);
    if (n > 0) {
      acc -= n;
      advance(n);
    }
    if (state.phase === 'battle') {
      draw();
      schedule();
    }
  };
  const schedule = (): void => {
    if (!raf || frameId !== 0) return;
    frameId = raf(loop);
  };
  const stopLoop = (): void => {
    if (frameId !== 0) caf?.(frameId);
    frameId = 0;
    lastTime = 0;
  };

  // --- Actions ---------------------------------------------------------------------------------
  const select = (x: number, y: number): void => {
    selected = { x, y };
    for (const el of cells.children) (el as HTMLElement).tabIndex = -1;
    const el = cells.children[y * state.world.map.w + x] as HTMLElement | undefined;
    if (el) el.tabIndex = 0;
    renderCells();
    renderPanel();
    draw();
  };

  const onPlan = (cmd: PlanCommand): void => {
    if (hostPaused || checkPlan(state, PLAYER, cmd) !== null) return;
    const before = state;
    const next = applyPlan(state, PLAYER, cmd);
    let message = '';
    const kindOf = (id: number) => before.world.entities.find((e) => e.id === id)?.kind ?? 'gun';
    switch (cmd.t) {
      case 'place':
        message = t('announce.placed', { name: nameOf(cmd.kind) });
        break;
      case 'extractor':
        message = t('announce.placed', { name: nameOf('extractor') });
        break;
      case 'upgrade':
        message = t('announce.upgraded', { name: nameOf(cmd.kind) });
        break;
      case 'sell':
        message = t('announce.sold', { name: nameOf(kindOf(cmd.id)), n: refundAt(before, PLAYER, cmd.id) });
        break;
      case 'target':
        message = t('announce.target', { name: nameOf(kindOf(cmd.id)), target: t(`target.${cmd.priority}`) });
        break;
      case 'buy':
        message = t('announce.bought', { name: unitName(cmd.kind) });
        break;
      case 'unbuy':
        message = t('announce.removed', { name: unitName(before.sides[PLAYER].wave[cmd.index] ?? 'walker') });
        break;
      case 'workshop':
        message = t('announce.workshop');
        break;
    }
    commit(next, message);
  };

  /**
   * Locking runs the computer's planner. It runs in a Worker where the browser has one, so closing,
   * pausing and the page stay responsive however long it plans (review of PR #104); elsewhere (tests)
   * it runs here after the "thinking" state is drawn. Either way the plan is the same: the planner
   * is pure and deterministic, and its work per plan is bounded (`WORK_BUDGET` in ai.ts).
   */
  let thinking: { token: number; timer: ReturnType<typeof setTimeout> | null } | null = null;
  let tokens = 0;
  let worker: Worker | null = null;
  const stopThinking = (): void => {
    if (thinking?.timer) clearTimeout(thinking.timer);
    thinking = null;
    lockButton.disabled = false;
    delete container.dataset.thinking;
  };
  const planned = (token: number, at: HoldState, cmds: PlanCommand[]): void => {
    if (thinking?.token !== token) return;
    stopThinking();
    if (state !== at || hostPaused || state.phase !== 'plan') return render();
    playing = true;
    acc = 0;
    commit(lockRound(state, () => cmds), t('announce.lock', { n: state.round + 1 }));
    schedule();
  };
  const plannerWorker = (): Worker | null => {
    if (worker || typeof Worker !== 'function') return worker;
    try {
      worker = new Worker(new URL('./plan.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (event: MessageEvent<{ token: number; plan: PlanCommand[] }>) => planned(event.data.token, current(), event.data.plan);
      worker.onerror = () => {
        // A worker that cannot start (e.g. blocked): plan here instead from now on.
        worker?.terminate();
        worker = null;
        workerFailed = true;
        if (thinking) planHere(thinking.token, state);
      };
    } catch {
      worker = null;
      workerFailed = true;
    }
    return worker;
  };
  let workerFailed = false;
  let lockedAt: HoldState | null = null;
  const current = (): HoldState => lockedAt ?? state;
  const planHere = (token: number, at: HoldState): void => {
    if (!thinking) return;
    thinking.timer = setTimeout(() => planned(token, at, planRound(seenBy(at))), 30);
  };
  const onLock = (): void => {
    if (hostPaused || state.phase !== 'plan' || thinking !== null) return;
    status.textContent = '';
    lockButton.disabled = true;
    phase.textContent = t('common.thinking');
    announce(live, phase.textContent);
    container.dataset.thinking = 'true';
    const token = ++tokens;
    thinking = { token, timer: null };
    lockedAt = state;
    // Alone there is nobody to plan for; elsewhere the computer plans (in its Worker if it can).
    const w = state.solo || workerFailed ? null : plannerWorker();
    if (w) w.postMessage({ token, seen: seenBy(state) });
    else if (state.solo) {
      thinking.timer = setTimeout(() => planned(token, lockedAt ?? state, []), 0);
    } else planHere(token, state);
  };

  const togglePlay = (): void => {
    if (state.phase !== 'battle' || hostPaused) return;
    playing = !playing;
    if (playing) schedule();
    else {
      stopLoop();
      context.requestSave();
    }
    renderHud();
    renderControls();
  };

  const cycleSpeed = (): void => {
    speed = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]!;
    renderControls();
  };

  const onInstant = (): void => {
    if (state.phase !== 'battle' || hostPaused) return;
    advance(Number.MAX_SAFE_INTEGER);
  };

  const onCellKey = (event: KeyboardEvent): void => {
    if (event.key !== ' ') return;
    event.preventDefault();
    if (state.phase === 'plan') onLock();
    else togglePlay();
  };

  // Redraw in the theme's colours and size.
  const scheme = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : undefined;
  const onScheme = (): void => {
    palette = null;
    draw();
  };
  scheme?.addEventListener?.('change', onScheme);
  const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(() => draw()) : undefined;
  const onWindowResize = (): void => draw();
  globalThis.addEventListener?.('resize', onWindowResize);

  const show = (next: HoldState): void => {
    stopLoop();
    stopThinking();
    state = next;
    playing = false;
    selected = null;
    motion.clear();
    hits = new Set();
    beams = [];
    blasts = [];
    status.textContent = '';
    reported = next.phase === 'won' || next.phase === 'lost' || next.phase === 'draw';
    if (!container.isConnected) {
      root.appendChild(container);
      resize?.observe(board);
    }
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      const start = startOf(options.settings?.mode, options.settings?.length);
      initial = newGame(normalizeSeed(options.seed), toDifficulty(options.difficulty), start.mapId, start.options);
      show(initial);
    },
    restore(saved: HoldState) {
      initial = newGame(saved.seed, saved.difficulty, saved.mapId, { length: saved.length ?? 'rounds', ...(saved.solo && { solo: true }) });
      show(structuredClone(saved));
    },
    serialize: () => structuredClone(state),
    pause() {
      hostPaused = true;
      stopLoop();
      renderHud();
    },
    resume() {
      hostPaused = false;
      if (playing && state.phase === 'battle') schedule();
      renderHud();
    },
    reset() {
      show(initial);
      context.requestSave();
    },
    dispose() {
      stopLoop();
      stopThinking();
      worker?.terminate();
      worker = null;
      disposeKeyboard();
      scheme?.removeEventListener?.('change', onScheme);
      resize?.disconnect();
      globalThis.removeEventListener?.('resize', onWindowResize);
      clear(root);
    }
  };
}
