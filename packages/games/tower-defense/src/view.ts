import { bcp47Tag, normalizeSeed, type GameContext, type GameInstance, type NewGameOptions } from '@wp/game-core';
import { archetypeOf, type SimEvent } from '@wp/strategy-engine';
import { announce, clear, gridKeyboard, h } from '@wp/ui';
import { drawFrame, drawTerrain, readPalette, type Palette } from '@wp/td-core';
import { BASE_TOWERS, TICKS_PER_SECOND, TD_RULESET, TOWERS, type EnemyKind } from '@wp/td-core';
import {
  applyCommand,
  checkCommand,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  endGame,
  INTEREST_PERCENT,
  incomeAfter,
  interestOf,
  mapOf,
  newGame,
  refundOf,
  resolveWave,
  retryWave,
  startWave,
  stepWave,
  TOWER_PRIORITIES,
  towerAt,
  waveCount,
  wavePreview,
  type BuildCommand,
  type Difficulty,
  type TdState,
  type TowerPriority
} from './rules';
import { DEFAULT_MAP, mapById } from './maps';
import './styles.css';

/** Ticks between autosaves while a wave runs (5 simulated seconds). */
const SAVE_EVERY = 5 * TICKS_PER_SECOND;
const SPEEDS = [1, 2, 4] as const;

const toDifficulty = (d: string | undefined): Difficulty => ((DIFFICULTIES as readonly string[]).includes(d ?? '') ? (d as Difficulty) : DEFAULT_DIFFICULTY);
const hpMax = (kind: string): number => archetypeOf(TD_RULESET, kind)?.hp ?? 1;
const splashOf = (kind: string): number => archetypeOf(TD_RULESET, kind)?.weapon?.splash ?? 0;

export function createTowerDefense(context: GameContext): GameInstance<TdState> {
  const { t, root } = context;
  let state: TdState = newGame(0);
  let initial: TdState = state;
  let hostPaused = false;
  let playing = false;
  let speed: (typeof SPEEDS)[number] = 1;
  let selected: { x: number; y: number } | null = null;
  let frameId = 0;
  let lastTime = 0;
  let acc = 0;
  let sinceSave = 0;
  let prev = new Map<number, readonly [number, number]>();
  let beams: [number, number, number, number][] = [];
  let blasts: [number, number, number][] = [];
  let palette: Palette | null = null;
  let disposeKeyboard: () => void = () => {};
  let builtFor = '';

  // The map is drawn with the theme's colours: read them again when the colour scheme changes.
  const scheme = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : undefined;
  const onScheme = (): void => {
    palette = null;
    draw();
  };
  scheme?.addEventListener?.('change', onScheme);
  // …and in the new size when the board is resized (rotation, window size).
  const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(() => draw()) : undefined;
  // A zoom changes the device pixel ratio without resizing the board: redraw sharp.
  const onWindowResize = (): void => draw();
  globalThis.addEventListener?.('resize', onWindowResize);

  const raf: ((cb: (t: number) => void) => number) | undefined = typeof requestAnimationFrame === 'function' ? requestAnimationFrame.bind(globalThis) : undefined;
  const caf: ((id: number) => void) | undefined = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame.bind(globalThis) : undefined;

  // --- DOM -------------------------------------------------------------------------------------
  const credits = h('span', { 'data-testid': 'credits' });
  const core = h('span', { 'data-testid': 'core' });
  const interest = h('span', { 'data-testid': 'interest' });
  const wave = h('span', { 'data-testid': 'wave' });
  const phase = h('span', { 'data-testid': 'phase' });
  const hud = h('p', { class: 'td-hud' }, wave, phase, credits, core, interest);
  const status = h('p', { class: 'wp-status td-status', 'data-testid': 'status', hidden: true });
  const canvas = h('canvas', { class: 'td-canvas', 'aria-hidden': 'true' });
  const cells = h('div', { class: 'td-cells', role: 'group', 'aria-label': t('board'), 'data-testid': 'board' });
  const board = h('div', { class: 'td-board', dir: 'ltr' }, canvas, cells);
  const panel = h('section', { class: 'td-panel wp-card', 'aria-label': t('panel.title'), 'data-testid': 'panel' });
  const previewTitle = h('h3', { class: 'td-subtitle' });
  const previewList = h('ul', { class: 'td-preview-list', 'data-testid': 'preview' });
  const preview = h('section', { class: 'td-preview' }, previewTitle, previewList);
  const startButton = h('button', { type: 'button', class: 'wp-primary', 'data-testid': 'start', onclick: () => onStart() }, t('controls.start'));
  const playButton = h('button', { type: 'button', 'data-testid': 'play', onclick: () => togglePlay() });
  const speedButton = h('button', { type: 'button', 'data-testid': 'speed', onclick: () => cycleSpeed() });
  const instantButton = h('button', { type: 'button', 'data-testid': 'instant', onclick: () => onInstant() }, t('controls.instant'));
  const retryButton = h('button', { type: 'button', class: 'wp-primary', 'data-testid': 'retry', onclick: () => onRetry() });
  const giveUpButton = h('button', { type: 'button', 'data-testid': 'give-up', onclick: () => onGiveUp() }, t('controls.giveUp'));
  const controls = h('div', { class: 'wp-row td-controls' }, startButton, playButton, speedButton, instantButton, retryButton, giveUpButton);
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'announcer' });
  const container = h(
    'div',
    { class: `wp-tower-defense${context.reducedMotion ? ' td-reduced' : ''}`, dir: t.direction, lang: bcp47Tag(t.locale) },
    hud,
    status,
    controls,
    h('div', { class: 'td-layout' }, board, h('div', { class: 'td-side' }, panel, preview)),
    h('p', { class: 'wp-muted td-help' }, t('keys.help')),
    h('p', { class: 'wp-muted td-help' }, t('access.note')),
    live
  );

  // --- Helpers ---------------------------------------------------------------------------------
  const towerName = (kind: string): string => t(`tower.${kind}`);
  const enemyName = (kind: string): string => t(`enemy.${kind}`);
  const about = (kind: string): string => (TOWERS[kind]?.level === 3 ? t('about.level3') : t(`about.${kind}`));
  const where = (x: number, y: number) => ({ row: y + 1, col: x + 1 });
  const terrainAt = (x: number, y: number): string => state.world.map.terrain[y * state.world.map.w + x] ?? '^';
  const commit = (next: TdState, message?: string): void => {
    if (next === state) return;
    state = next;
    render();
    context.requestSave();
    if (message) announce(live, message);
  };

  const cellLabel = (x: number, y: number): string => {
    const map = mapOf(state);
    const tower = towerAt(state.world, x, y);
    const p = where(x, y);
    let label: string;
    if (tower) label = t('cell.tower', { ...p, tower: towerName(tower.kind), hp: tower.hp, max: hpMax(tower.kind) });
    else {
      const code = terrainAt(x, y);
      const first = map.routes[0]!.points[0]!;
      const last = map.routes[0]!.points.at(-1)!;
      if (code === 'b') label = t('cell.pad', p);
      else if (code !== '=') label = t('cell.rock', p);
      else if (first[0] === x && first[1] === y) label = t('cell.entry', p);
      else if (last[0] === x && last[1] === y) label = t('cell.goal', p);
      else label = t('cell.road', p);
    }
    const n = state.world.entities.filter((e) => e.side === 1 && e.x === x && e.y === y).length;
    return n > 0 ? t('cell.enemies', { cell: label, n }) : label;
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
            onkeydown: (event: Event) => onCellKey(event as KeyboardEvent, x, y),
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
    const total = waveCount(state);
    wave.textContent = t('hud.wave', { n: state.wave + 1, total });
    phase.textContent = state.phase === 'wave' ? t(playing && !hostPaused ? 'hud.running' : 'hud.paused') : state.phase === 'build' ? t('hud.build') : '';
    credits.textContent = t('hud.credits', { n: state.credits });
    credits.dataset.value = String(state.credits);
    core.textContent = t('hud.core', { n: state.core });
    core.dataset.value = String(state.core);
    // Interest is paid after every wave but the last, on what is left when the wave starts.
    const paysInterest = state.phase === 'build' && state.wave < waveCount(state) - 1;
    interest.hidden = !paysInterest;
    interest.textContent = paysInterest ? t('hud.interest', { n: interestOf(state.credits), p: INTEREST_PERCENT }) : '';
    container.dataset.phase = state.phase;
    container.dataset.tick = String(state.run?.tick ?? 0);
    container.dataset.waveIndex = String(state.wave);
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

  const button = (label: string, testId: string, onclick: () => void, disabled: boolean, note?: string): HTMLElement =>
    h('button', { type: 'button', class: 'td-option', 'data-testid': testId, disabled, onclick }, h('span', { class: 'td-option-name' }, label), note ? h('span', { class: 'td-option-note' }, note) : '');

  const renderPanel = (): void => {
    clear(panel);
    panel.append(h('h3', { class: 'td-subtitle' }, t('panel.title')));
    if (!selected) {
      panel.append(h('p', { class: 'wp-muted' }, t('panel.none')));
      return;
    }
    const { x, y } = selected;
    const building = state.phase === 'build';
    const tower = towerAt(state.world, x, y);
    panel.append(h('p', { class: 'td-where' }, cellLabel(x, y)));
    if (!tower) {
      if (terrainAt(x, y) !== 'b') {
        panel.append(h('p', { class: 'wp-muted' }, t('panel.road')));
        return;
      }
      if (!building) {
        panel.append(h('p', { class: 'wp-muted' }, t('panel.locked')));
        return;
      }
      panel.append(h('p', {}, t('panel.build')));
      const list = h('div', { class: 'td-options' });
      for (const kind of BASE_TOWERS) {
        const price = TOWERS[kind]!.price;
        const short = price > state.credits;
        list.append(
          button(t('panel.price', { name: towerName(kind), n: price }), `build-${kind}`, () => onCommand({ t: 'place', kind, x, y }), short, short ? `${about(kind)} ${t('panel.short')}` : about(kind))
        );
      }
      panel.append(list);
      return;
    }
    const def = TOWERS[tower.kind]!;
    const record = state.towers.find((r) => r.id === tower.id);
    panel.append(
      h('p', { class: 'td-tower-name' }, towerName(tower.kind)),
      h('p', { class: 'wp-muted' }, `${t('panel.level', { n: def.level })} · ${t('panel.health', { hp: tower.hp, max: hpMax(tower.kind) })}`),
      h('p', {}, about(tower.kind))
    );
    if (!building) {
      panel.append(h('p', { class: 'wp-muted' }, t('panel.locked')));
      return;
    }
    if (def.next.length > 0) {
      panel.append(h('h4', { class: 'td-subtitle' }, t('panel.upgrade')));
      if (def.level === 1) panel.append(h('p', { class: 'wp-muted' }, t('panel.final')));
      const list = h('div', { class: 'td-options' });
      for (const kind of def.next) {
        const price = TOWERS[kind]!.price;
        const short = price > state.credits;
        list.append(
          button(t('panel.upgradeTo', { name: towerName(kind), n: price }), `upgrade-${kind}`, () => onCommand({ t: 'upgrade', id: tower.id, kind }), short, short ? `${about(kind)} ${t('panel.short')}` : about(kind))
        );
      }
      panel.append(list);
    } else panel.append(h('p', { class: 'wp-muted' }, t('panel.maxed')));
    const current = (tower.doctrine?.priority ?? 'weakest') as TowerPriority;
    const select = h(
      'select',
      { id: 'td-target', 'data-testid': 'target', onchange: (e: Event) => onCommand({ t: 'target', id: tower.id, priority: (e.target as HTMLSelectElement).value as TowerPriority }) },
      ...TOWER_PRIORITIES.map((p) => h('option', { value: p, selected: p === current }, t(`target.${p}`)))
    );
    panel.append(h('label', { class: 'td-target', for: 'td-target' }, t('panel.target')), select);
    if (record) panel.append(h('div', { class: 'wp-row' }, h('button', { type: 'button', 'data-testid': 'sell', onclick: () => onCommand({ t: 'sell', id: tower.id }) }, t('panel.sell', { n: refundOf(record) }))));
  };

  const renderPreview = (): void => {
    const running = state.phase === 'wave';
    previewTitle.textContent = t(running ? 'preview.titleRunning' : 'preview.title');
    clear(previewList);
    preview.hidden = state.phase === 'won' || state.phase === 'lost' || state.phase === 'ended';
    if (preview.hidden) return;
    const map = mapOf(state);
    for (const row of wavePreview(state, state.wave)) {
      const air = map.routes[row.route]?.layer === 'air';
      previewList.append(
        h(
          'li',
          { 'data-kind': row.kind },
          h('span', { class: 'td-preview-count' }, t('preview.row', { n: row.count, enemy: enemyName(row.kind) }) + (air ? ` (${t('preview.air')})` : '')),
          h('span', { class: 'td-option-note' }, t(`enemyAbout.${row.kind as EnemyKind}`))
        )
      );
    }
  };

  const renderControls = (): void => {
    const p = state.phase;
    startButton.hidden = p !== 'build';
    playButton.hidden = p !== 'wave';
    speedButton.hidden = p !== 'wave';
    instantButton.hidden = p !== 'wave';
    retryButton.hidden = p !== 'lost' || !state.checkpoint;
    giveUpButton.hidden = p !== 'lost';
    playButton.textContent = t(playing ? 'controls.pause' : 'controls.play');
    speedButton.textContent = t('controls.speed', { n: speed });
    retryButton.textContent = t('controls.retry', { n: (state.checkpoint?.wave ?? state.wave) + 1 });
    if (p === 'won') status.textContent = t('status.won', { total: waveCount(state), core: state.core });
    else if (p === 'lost') status.textContent = t('status.lost', { n: state.wave + 1 });
    else if (p === 'ended') status.textContent = t('status.ended', { n: state.wave + 1 });
    status.hidden = status.textContent === '';
  };

  const draw = (): void => {
    const g = canvas.getContext?.('2d');
    if (!g) return;
    const width = board.clientWidth;
    if (width <= 0) return;
    const dpr = globalThis.devicePixelRatio || 1;
    const height = (width * state.world.map.h) / state.world.map.w;
    if (canvas.width !== Math.round(width * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    palette ??= readPalette(container);
    const alpha = context.reducedMotion || !playing ? 1 : Math.min(1, acc);
    const map = mapOf(state);
    const entries = map.routes.filter((r) => r.layer === 'ground').map((r) => r.points[0]!);
    const [gx, gy] = map.routes[0]!.points.at(-1)!;
    const goals = [{ x: gx, y: gy, side: 0 }];
    drawFrame(g, width, palette, { world: state.world, prev, alpha, beams, blasts, selected, entries, goals, hpMax, splashOf }, terrainLayer(width, dpr, palette));
  };

  /** The terrain drawn once per map, size and theme (the strategy terrain renderer is detailed). */
  let terrainKey = '';
  let terrainCanvas: HTMLCanvasElement | null = null;
  const terrainLayer = (width: number, dpr: number, p: Palette): HTMLCanvasElement | null => {
    const { map } = state.world;
    const key = `${state.mapId}|${Math.round(width * dpr)}|${p.terrain.key}`;
    if (key === terrainKey && terrainCanvas) return terrainCanvas;
    const layer = document.createElement('canvas');
    const cell = width / map.w;
    layer.width = Math.round(width * dpr);
    layer.height = Math.round(cell * map.h * dpr);
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
    renderPreview();
    renderControls();
    draw();
  };

  // --- Wave playback ---------------------------------------------------------------------------
  const collect = (events: readonly SimEvent[]): void => {
    beams = [];
    blasts = [];
    const lastTick = events.at(-1)?.tick;
    for (const e of events) {
      if (e.tick !== lastTick) continue;
      if (e.t === 'fire') {
        const shooter = state.world.entities.find((x) => x.id === e.id);
        const target = state.world.entities.find((x) => x.id === e.target);
        if (shooter && target && archetypeOf(TD_RULESET, shooter.kind)?.weapon?.delivery === 'beam') beams.push([shooter.x, shooter.y, target.x, target.y]);
      } else if (e.t === 'land') blasts.push([e.x, e.y, 0]);
    }
  };

  const advance = (ticks: number): void => {
    const before = state;
    prev = new Map(before.world.entities.map((e) => [e.id, [e.x, e.y] as const]));
    const result = ticks > 1_000 ? resolveWave(before) : stepWave(before, ticks);
    state = result.state;
    collect(result.events);
    sinceSave += ticks;
    if (state.phase !== 'wave') {
      onWaveOver(before);
      return;
    }
    if (sinceSave >= SAVE_EVERY) {
      sinceSave = 0;
      context.requestSave();
    }
    renderHud();
  };

  const onWaveOver = (before: TdState): void => {
    stopLoop();
    playing = false;
    sinceSave = 0;
    beams = [];
    blasts = [];
    prev = new Map();
    acc = 0;
    const killed = state.stats.killed - before.stats.killed;
    const leaked = state.stats.leaked - before.stats.leaked;
    if (state.phase === 'build') {
      const income = incomeAfter(before, before.wave);
      const paid = interestOf(before.checkpoint?.credits ?? 0);
      status.textContent = `${t('status.waveDone', { n: state.wave, killed, leaked })} ${t('status.income', { income, interest: paid })}`;
      announce(live, status.textContent);
    } else if (state.phase === 'won') {
      announce(live, t('status.won', { total: waveCount(state), core: state.core }));
      context.finished({ outcome: 'won', stats: { core: state.core, killed: state.stats.killed, leaked: state.stats.leaked, retries: state.stats.retries } });
    } else if (state.phase === 'lost') {
      announce(live, t('status.lost', { n: state.wave + 1 }));
    }
    context.requestSave();
    render();
  };

  const loop = (time: number): void => {
    frameId = 0;
    if (!playing || hostPaused || state.phase !== 'wave') return;
    const dt = lastTime === 0 ? 0 : Math.min(250, time - lastTime);
    lastTime = time;
    acc += (dt * speed * TICKS_PER_SECOND) / 1000;
    const n = Math.floor(acc);
    if (n > 0) {
      acc -= n;
      advance(n);
    }
    if (state.phase === 'wave') {
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

  const onCommand = (cmd: BuildCommand): void => {
    if (hostPaused || checkCommand(state, cmd) !== null) return;
    const before = state;
    const next = applyCommand(state, cmd);
    let message = '';
    if (cmd.t === 'place') message = t('announce.placed', { name: towerName(cmd.kind) });
    else if (cmd.t === 'upgrade') message = t('announce.upgraded', { name: towerName(cmd.kind) });
    else if (cmd.t === 'sell') {
      const record = before.towers.find((r) => r.id === cmd.id);
      const kind = before.world.entities.find((e) => e.id === cmd.id)?.kind ?? 'gun';
      message = t('announce.sold', { name: towerName(kind), n: record ? refundOf(record) : 0 });
    } else {
      const kind = before.world.entities.find((e) => e.id === cmd.id)?.kind ?? 'gun';
      message = t('announce.target', { name: towerName(kind), target: t(`target.${cmd.priority}`) });
    }
    commit(next, message);
  };

  const onStart = (): void => {
    if (hostPaused || state.phase !== 'build') return;
    status.textContent = '';
    playing = true;
    acc = 0;
    commit(startWave(state), t('announce.waveStart', { n: state.wave + 1 }));
    schedule();
  };

  const togglePlay = (): void => {
    if (state.phase !== 'wave' || hostPaused) return;
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
    if (state.phase !== 'wave' || hostPaused) return;
    advance(Number.MAX_SAFE_INTEGER);
  };

  const onRetry = (): void => {
    if (state.phase !== 'lost' || hostPaused) return;
    const next = retryWave(state);
    status.textContent = '';
    commit(next, t('announce.retry', { n: next.wave + 1 }));
  };

  /** Ending the game after a loss is final (no retry afterwards), so `finished` is reported once. */
  const onGiveUp = (): void => {
    if (state.phase !== 'lost' || hostPaused) return;
    commit(endGame(state), t('status.ended', { n: state.wave + 1 }));
    context.finished({ outcome: 'lost', stats: { core: state.core, killed: state.stats.killed, leaked: state.stats.leaked, retries: state.stats.retries } });
  };

  const onCellKey = (event: KeyboardEvent, x: number, y: number): void => {
    if (event.key === ' ') {
      event.preventDefault();
      if (state.phase === 'build') onStart();
      else togglePlay();
      return;
    }
    const n = Number(event.key);
    if (Number.isInteger(n) && n >= 1 && n <= BASE_TOWERS.length && state.phase === 'build') {
      event.preventDefault();
      select(x, y);
      onCommand({ t: 'place', kind: BASE_TOWERS[n - 1]!, x, y });
    }
  };

  const show = (next: TdState): void => {
    stopLoop();
    state = next;
    playing = false;
    selected = null;
    prev = new Map();
    beams = [];
    blasts = [];
    status.textContent = '';
    if (!container.isConnected) {
      root.appendChild(container);
      resize?.observe(board);
    }
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      const wanted = options.settings?.map;
      const mapId = typeof wanted === 'string' && mapById(wanted) ? wanted : DEFAULT_MAP;
      initial = newGame(normalizeSeed(options.seed), toDifficulty(options.difficulty), mapId);
      show(initial);
    },
    restore(saved: TdState) {
      initial = newGame(saved.seed, saved.difficulty, saved.mapId);
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
      if (playing && state.phase === 'wave') schedule();
      renderHud();
    },
    reset() {
      show(initial);
      context.requestSave();
    },
    dispose() {
      stopLoop();
      scheme?.removeEventListener?.('change', onScheme);
      resize?.disconnect();
      globalThis.removeEventListener?.('resize', onWindowResize);
      disposeKeyboard();
      clear(root);
    }
  };
}
