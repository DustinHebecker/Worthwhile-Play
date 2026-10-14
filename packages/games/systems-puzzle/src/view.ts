import type { GameContext, GameInstance, NewGameOptions, Translator } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import {
  canUndo,
  choosePuzzle,
  createInitialState,
  floatRaised,
  progressOf,
  puzzleCount,
  puzzleOf,
  resetState,
  restartPuzzle,
  runToEnd,
  tick,
  toDifficulty,
  toggleValve,
  undo,
  type FlowState,
  type Progress,
  type PuzzleDef,
  type Refusal,
  type TickReport
} from './rules';
import './styles.css';

const SVG_NS = 'http://www.w3.org/2000/svg';
const CELL_W = 140;
const CELL_H = 190;
/** Room kept free above and below a tank for its name and level text. */
const TEXT_PAD = 24;
const TANK_W = 64;
const TANK_H = 88;

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, text?: string): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  if (text !== undefined) el.textContent = text;
  return el;
}

/** Tank letter (A, B, C …) — the same in every language, like labels on a technical drawing. */
export const tankName = (index: number): string => String.fromCharCode(65 + index);

const tankCenter = (puzzle: PuzzleDef, index: number) => {
  const tank = puzzle.tanks[index];
  return { x: (tank?.col ?? 0) * CELL_W + CELL_W / 2, y: (tank?.row ?? 0) * CELL_H + CELL_H / 2 - 4 };
};

export interface PipeGeometry {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Valve position (middle of the visible pipe). */
  vx: number;
  vy: number;
}

/** Visible pipe segment between the two tank outlines; pipes in both directions between a pair are offset. */
export function pipeGeometry(puzzle: PuzzleDef, index: number): PipeGeometry {
  const pipe = puzzle.pipes[index];
  const a = tankCenter(puzzle, pipe?.from ?? 0);
  const b = tankCenter(puzzle, pipe?.to ?? 0);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const twin = puzzle.pipes.some((p) => p.from === pipe?.to && p.to === pipe?.from);
  const offset = twin ? 30 : 0;
  const ox = (-dy / len) * offset;
  const oy = (dx / len) * offset;
  const edge = Math.min(dx === 0 ? Infinity : (TANK_W / 2 + 2) / Math.abs(dx), dy === 0 ? Infinity : (TANK_H / 2 + TEXT_PAD) / Math.abs(dy));
  const x1 = a.x + dx * edge + ox;
  const y1 = a.y + dy * edge + oy;
  const x2 = b.x - dx * edge + ox;
  const y2 = b.y - dy * edge + oy;
  return { x1, y1, x2, y2, vx: (x1 + x2) / 2, vy: (y1 + y2) / 2 };
}

/** Plain-language goal lines for a puzzle. */
export function goalTexts(t: Translator, puzzle: PuzzleDef): string[] {
  const lines = puzzle.targets.map((target) => t('goal.level', { tank: tankName(target.tank), n: target.level }));
  if (puzzle.noSpill === true) lines.push(t('goal.noSpill'));
  lines.push(t('goal.when', { n: puzzle.ticks }));
  return lines;
}

/** Overflow and float-switch events of the latest tick, in words. */
export function eventTexts(t: Translator, report: TickReport | null): string[] {
  if (!report) return [];
  const lines: string[] = [];
  report.spills.forEach((n, tank) => {
    if (n > 0) lines.push(t('event.overflow', { tank: tankName(tank), n }));
  });
  for (const valve of report.held) lines.push(t('event.held', { n: valve + 1 }));
  if (lines.length === 0) lines.push(t(report.moved.some((n) => n > 0) ? 'event.none' : 'event.calm'));
  return lines;
}

let instanceCounter = 0;

type StatusKind = 'info' | 'blocked' | 'solved' | 'failed';

export function createSystemsPuzzle(context: GameContext): GameInstance<FlowState> {
  const { t, root } = context;
  const uid = `fl${++instanceCounter}`;
  let state = createInitialState(0);
  let paused = false;
  let builtKey = '';
  let note: string | null = null;
  let valveButtons: HTMLButtonElement[] = [];

  const puzzleStatus = h('p', { class: 'fl-puzzle', 'data-testid': 'fl-puzzle' });
  const tickStatus = h('p', { class: 'fl-tick', 'data-testid': 'fl-tick' });
  const goalList = h('ul', { class: 'fl-goal-list', 'data-testid': 'fl-goal' });
  const modeText = h('p', { class: 'fl-mode wp-muted' });
  const goalBox = h('section', { class: 'fl-goal', 'aria-labelledby': `${uid}-goal` }, h('h3', { id: `${uid}-goal` }, t('goal.heading')), goalList, modeText);

  const drawing = svg('svg', { class: 'fl-svg', role: 'img', 'aria-label': t('scene') });
  const schematic = h('div', { class: 'fl-schematic', dir: 'ltr', 'data-testid': 'fl-schematic' });
  schematic.append(drawing);
  const legend = h('p', { class: 'fl-legend wp-muted' }, t('legend'));

  const stats = h('p', { class: 'fl-stats', 'data-testid': 'fl-stats' });
  const status = h('p', { class: 'wp-status fl-status', 'data-testid': 'fl-status', 'aria-live': 'off' });
  const events = h('ul', { class: 'fl-events', 'data-testid': 'fl-events' });

  const stepButton = h('button', { type: 'button', class: 'primary', 'data-testid': 'fl-step', 'aria-keyshortcuts': 'S', onclick: () => onTick(false) }, t('action.step'));
  const runButton = h('button', { type: 'button', 'data-testid': 'fl-run', 'aria-keyshortcuts': 'R', onclick: () => onTick(true) }, t('action.run'));
  const undoButton = h('button', { type: 'button', 'data-testid': 'fl-undo', 'aria-keyshortcuts': 'U', onclick: () => onUndo() }, t('common.undo'));
  const resetButton = h('button', { type: 'button', 'data-testid': 'fl-reset', onclick: () => onReset() }, t('action.reset'));
  const actions = h('div', { class: 'fl-actions' }, stepButton, runButton, undoButton, resetButton);

  const puzzleSelect = h('select', { id: `${uid}-select`, 'data-testid': 'fl-puzzle-select' });
  const playButton = h('button', { type: 'button', 'data-testid': 'fl-puzzle-play', onclick: () => onChoosePuzzle() }, t('puzzle.play'));
  const chooser = h('div', { class: 'wp-row fl-chooser' }, h('label', { for: `${uid}-select` }, t('puzzle.choose')), puzzleSelect, playButton);

  const help = h('div', { class: 'fl-help wp-muted' }, h('p', {}, t('rule.priority')), h('p', {}, t('help.keys')));
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'fl-announcer' });

  const container = h(
    'div',
    {
      class: `wp-systems-puzzle${context.reducedMotion ? ' fl-reduced' : ''}`,
      dir: t.direction,
      lang: t.locale,
      onkeydown: (event: Event) => onKey(event as KeyboardEvent)
    },
    h('div', { class: 'fl-head' }, puzzleStatus, tickStatus),
    goalBox,
    schematic,
    legend,
    stats,
    status,
    events,
    actions,
    chooser,
    help,
    live
  );

  /* ---------- SVG building ---------- */

  interface TankParts { fill: SVGRectElement; text: SVGTextElement; group: SVGGElement }
  interface PipeParts { line: SVGLineElement; label: SVGTextElement }
  let tankParts: TankParts[] = [];
  let pipeParts: PipeParts[] = [];

  const build = () => {
    const key = `${state.difficulty}/${state.puzzle}`;
    if (key === builtKey) return;
    builtKey = key;
    const puzzle = puzzleOf(state);
    const cols = Math.max(...puzzle.tanks.map((tank) => tank.col)) + 1;
    const rows = Math.max(...puzzle.tanks.map((tank) => tank.row)) + 1;
    const width = cols * CELL_W;
    const height = rows * CELL_H;
    drawing.setAttribute('viewBox', `0 0 ${width} ${height}`);
    clear(drawing);
    schematic.style.setProperty('--fl-ratio', `${width} / ${height}`);
    schematic.style.maxWidth = `${Math.round(width * 1.3)}px`;

    const defs = svg('defs');
    const pattern = svg('pattern', { id: `${uid}-hatch`, width: 8, height: 8, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
    pattern.append(svg('rect', { width: 8, height: 8, class: 'fl-water' }), svg('line', { x1: 0, y1: 0, x2: 0, y2: 8, class: 'fl-hatch-line' }));
    const arrow = svg('marker', { id: `${uid}-arrow`, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 14, markerHeight: 14, markerUnits: 'userSpaceOnUse', orient: 'auto' });
    arrow.append(svg('path', { d: 'M0 0 L10 5 L0 10 Z', class: 'fl-arrow' }));
    defs.append(pattern, arrow);
    drawing.append(defs);

    pipeParts = puzzle.pipes.map((pipe, i) => {
      const g = pipeGeometry(puzzle, i);
      const group = svg('g', { class: `fl-pipe${pipe.delay === 2 ? ' fl-slow' : ''}`, 'data-testid': `pipe-${i + 1}` });
      if (pipe.delay === 2) group.append(svg('line', { x1: g.x1, y1: g.y1, x2: g.x2, y2: g.y2, class: 'fl-pipe-outer' }));
      const line = svg('line', { x1: g.x1, y1: g.y1, x2: g.x2, y2: g.y2, class: 'fl-pipe-line', 'marker-end': `url(#${uid}-arrow)` });
      const horizontal = Math.abs(g.y2 - g.y1) < 1;
      const label = horizontal
        ? svg('text', { x: g.vx, y: g.vy - 36, class: 'fl-pipe-label', 'text-anchor': 'middle' })
        : svg('text', { x: g.vx + 36, y: g.vy + 5, class: 'fl-pipe-label', 'text-anchor': 'start' });
      group.append(line, label);
      drawing.append(group);
      return { line, label };
    });

    tankParts = puzzle.tanks.map((tank, i) => {
      const c = tankCenter(puzzle, i);
      const left = c.x - TANK_W / 2;
      const top = c.y - TANK_H / 2;
      const group = svg('g', { class: 'fl-tank', 'data-testid': `tank-${tankName(i)}` });
      group.append(svg('rect', { x: left, y: top, width: TANK_W, height: TANK_H, class: 'fl-tank-bg' }));
      const fill = svg('rect', { x: left, y: top + TANK_H, width: TANK_W, height: 0, class: 'fl-fill', fill: `url(#${uid}-hatch)` });
      group.append(fill);
      for (const target of puzzle.targets.filter((tg) => tg.tank === i)) {
        const y = top + TANK_H - (TANK_H * target.level) / tank.cap;
        group.append(
          svg('line', { x1: left - 4, y1: y, x2: left + TANK_W + 4, y2: y, class: 'fl-target' }),
          svg('text', { x: left + TANK_W - 3, y: y - top < 20 ? y + 16 : y - 4, class: 'fl-target-label', 'text-anchor': 'end' }, `◎${target.level}`)
        );
      }
      puzzle.pipes.forEach((pipe) => {
        if (pipe.float?.tank !== i) return;
        const y = top + TANK_H - (TANK_H * pipe.float.at) / tank.cap;
        group.append(
          svg('line', { x1: left, y1: y, x2: left + TANK_W, y2: y, class: 'fl-float' }),
          svg('text', { x: left + 3, y: y - top < 20 ? y + 16 : y - 4, class: 'fl-float-label' }, `F${pipe.float.at}`)
        );
      });
      group.append(svg('rect', { x: left, y: top, width: TANK_W, height: TANK_H, class: 'fl-tank-outline' }));
      group.append(svg('text', { x: c.x, y: top - 8, class: 'fl-tank-name', 'text-anchor': 'middle' }, tankName(i)));
      const text = svg('text', { x: c.x, y: top + TANK_H + 20, class: 'fl-tank-level', 'text-anchor': 'middle' });
      group.append(text);
      drawing.append(group);
      return { fill, text, group };
    });

    for (const button of valveButtons) button.remove();
    valveButtons = puzzle.pipes.map((_, i) => {
      const g = pipeGeometry(puzzle, i);
      const button = h('button', {
        type: 'button',
        class: 'fl-valve',
        'data-testid': `valve-${i + 1}`,
        style: `left:${(g.vx / width) * 100}%;top:${(g.vy / height) * 100}%`,
        onclick: () => onToggle(i)
      });
      schematic.append(button);
      return button;
    });

    clear(goalList);
    goalList.append(...goalTexts(t, puzzle).map((text) => h('li', {}, text)));
    modeText.textContent = t(state.difficulty === 'easy' ? 'mode.easy' : 'mode.timed');

    clear(puzzleSelect);
    const total = puzzleCount(state.difficulty);
    for (let i = 0; i < total; i++) {
      puzzleSelect.append(h('option', { value: i }, t('puzzle.option', { n: i + 1 })));
    }
    puzzleSelect.value = String(state.puzzle);
  };

  /* ---------- Rendering ---------- */

  const valveLabel = (puzzle: PuzzleDef, progress: Progress, i: number): string => {
    const pipe = puzzle.pipes[i];
    if (!pipe) return '';
    const open = progress.sim.valves[i] === true;
    const parts = [t('valve.label', { n: i + 1, from: tankName(pipe.from), to: tankName(pipe.to), rate: pipe.rate }), t(open ? 'valve.open' : 'valve.closed')];
    if (pipe.delay === 2) parts.push(t('valve.slow'));
    if (pipe.float) parts.push(t('valve.float', { tank: tankName(pipe.float.tank), n: pipe.float.at }));
    if (open && floatRaised(pipe, progress.sim.levels)) parts.push(t('valve.held'));
    const inPipe = progress.sim.transit[i] ?? 0;
    if (inPipe > 0) parts.push(t('pipe.transit', { n: inPipe }));
    return parts.join(', ');
  };

  const render = () => {
    build();
    const puzzle = puzzleOf(state);
    const progress = progressOf(state);
    const { sim } = progress;
    puzzleStatus.textContent = t('puzzle.status', { n: state.puzzle + 1, total: puzzleCount(state.difficulty) });
    tickStatus.textContent = t('tick.status', { n: sim.tick, total: puzzle.ticks });
    tickStatus.dataset.value = String(sim.tick);

    puzzle.tanks.forEach((tank, i) => {
      const parts = tankParts[i];
      if (!parts) return;
      const level = sim.levels[i] ?? 0;
      const c = tankCenter(puzzle, i);
      const fillH = (TANK_H * level) / tank.cap;
      parts.fill.setAttribute('y', String(c.y + TANK_H / 2 - fillH));
      parts.fill.setAttribute('height', String(fillH));
      parts.text.textContent = t('tank.short', { level, cap: tank.cap });
      parts.group.setAttribute('data-level', String(level));
      const spilledNow = (progress.last?.spills[i] ?? 0) > 0;
      parts.group.classList.toggle('fl-overflowed', spilledNow);
    });

    const locked = state.difficulty === 'easy' && sim.tick > 0;
    puzzle.pipes.forEach((pipe, i) => {
      const open = sim.valves[i] === true;
      const held = open && floatRaised(pipe, sim.levels);
      const parts = pipeParts[i];
      if (parts) {
        parts.line.parentElement?.setAttribute('data-state', held ? 'held' : open ? 'open' : 'closed');
        const inPipe = sim.transit[i] ?? 0;
        parts.label.textContent = `${pipe.rate}/t${pipe.delay === 2 ? ' ⧗' : ''}${inPipe > 0 ? ` (${inPipe})` : ''}`;
      }
      const button = valveButtons[i];
      if (!button) return;
      button.dataset.open = String(open);
      button.dataset.held = String(held);
      button.setAttribute('aria-pressed', String(open));
      button.setAttribute('aria-label', valveLabel(puzzle, progress, i));
      button.setAttribute('aria-disabled', String(locked || progress.solved || progress.over));
      button.replaceChildren(
        h('span', { class: 'fl-valve-num' }, String(i + 1)),
        h('span', { class: 'fl-valve-mark', 'aria-hidden': 'true' }, held ? '⊼' : open ? '○' : '⊘')
      );
    });

    stats.textContent = [t('stats.changes', { n: progress.changes }), t('stats.spilled', { n: sim.spilled })].join(' · ');
    stats.dataset.changes = String(progress.changes);
    stats.dataset.spilled = String(sim.spilled);

    let kind: StatusKind = 'info';
    let text: string;
    if (progress.solved) {
      kind = 'solved';
      text = t('status.solved', { ticks: sim.tick, changes: progress.changes, min: puzzle.minChanges });
    } else if (note) {
      kind = 'blocked';
      text = note;
    } else if (progress.over) {
      kind = 'failed';
      text = t('status.failed');
    } else if (sim.tick === 0) {
      text = t('status.setup');
    } else {
      text = t(locked ? 'status.runningLocked' : 'status.running', { n: sim.tick });
    }
    status.textContent = text;
    status.dataset.state = kind;
    container.dataset.solved = String(progress.solved);

    clear(events);
    events.append(...eventTexts(t, progress.last).map((line) => h('li', {}, line)));

    stepButton.disabled = progress.solved || progress.over;
    runButton.disabled = progress.solved || progress.over;
    undoButton.disabled = !canUndo(state);
    resetButton.disabled = state.actions.length === 0;
  };

  /* ---------- Actions ---------- */

  const commit = (next: FlowState, message: () => string) => {
    const wasSolved = progressOf(state).solved;
    state = next;
    note = null;
    render();
    context.requestSave();
    const progress = progressOf(state);
    const extra = [...eventTexts(t, progress.last)];
    if (progress.solved && !wasSolved) {
      announce(live, `${message()} ${status.textContent ?? ''}`);
      context.finished({ outcome: 'completed', stats: { ticks: progress.sim.tick, changes: progress.changes, minimal: puzzleOf(state).minChanges } });
    } else {
      announce(live, [message(), ...(progress.over ? [status.textContent ?? ''] : extra)].join(' '));
    }
  };

  const REFUSAL: Readonly<Record<Refusal, string>> = { solved: 'refuse.solved', over: 'refuse.over', locked: 'refuse.locked', noValve: 'refuse.over' };

  const explain = (refusal: Refusal) => {
    note = t(REFUSAL[refusal]);
    render();
    announce(live, note);
  };

  const onToggle = (valve: number) => {
    if (paused) return;
    const result = toggleValve(state, valve);
    if (result.refused) return explain(result.refused);
    commit(result.state, () => {
      const open = progressOf(state).sim.valves[valve] === true;
      return t('announce.valve', { n: valve + 1, state: t(open ? 'valve.open' : 'valve.closed') });
    });
  };

  const onTick = (all: boolean) => {
    if (paused) return;
    const result = all ? runToEnd(state) : tick(state);
    if (result.refused) return explain(result.refused);
    commit(result.state, () => t('announce.tick', { n: progressOf(state).sim.tick, total: puzzleOf(state).ticks }));
  };

  const onUndo = () => {
    if (paused || !canUndo(state)) return;
    commit(undo(state), () => t('announce.undone'));
  };

  const onReset = () => {
    if (paused || state.actions.length === 0) return;
    commit(restartPuzzle(state), () => t('announce.reset'));
  };

  const onChoosePuzzle = () => {
    if (paused) return;
    const index = Number(puzzleSelect.value);
    const next = choosePuzzle(state, index);
    if (next === state) return;
    commit(next, () => t('puzzle.status', { n: index + 1, total: puzzleCount(state.difficulty) }));
  };

  const onKey = (event: KeyboardEvent) => {
    if (paused || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target as Element | null;
    if (target instanceof HTMLSelectElement || target instanceof HTMLInputElement) return;
    const key = event.key.toLowerCase();
    const digit = /^[1-9]$/.test(key) ? Number(key) : 0;
    if (digit > 0 && digit <= puzzleOf(state).pipes.length) {
      event.preventDefault();
      onToggle(digit - 1);
    } else if (key === 's') {
      event.preventDefault();
      onTick(false);
    } else if (key === 'r') {
      event.preventDefault();
      onTick(true);
    } else if (key === 'u') {
      event.preventDefault();
      onUndo();
    }
  };

  const show = (next: FlowState) => {
    state = next;
    note = null;
    if (!container.isConnected) root.appendChild(container);
    builtKey = '';
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      show(createInitialState(options.seed, toDifficulty(options.difficulty)));
    },
    restore(saved: FlowState) {
      show({ ...saved, actions: [...saved.actions] });
    },
    serialize: () => ({ ...state, actions: [...state.actions] }),
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
