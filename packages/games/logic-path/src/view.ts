import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import {
  append,
  canUndo,
  chooseLevel,
  clearProgram,
  closeBlock,
  cloneState,
  createInitialState,
  cycleTimes,
  DIR_NAMES,
  isRepeat,
  levelCount,
  levelOf,
  MAX_BODY,
  MAX_STEPS,
  paletteOf,
  programLength,
  progressOf,
  removeAt,
  resetState,
  runProgram,
  shownResult,
  toDifficulty,
  undo,
  type Cmd,
  type Frame,
  type Level,
  type LogicPathState,
  type PaletteEntry,
  type RunResult
} from './rules';
import './styles.css';

/** Icon + test id per palette entry. Icons are text glyphs that never mirror in RTL. */
const ENTRY: Readonly<Record<PaletteEntry, { icon: string; id: string }>> = {
  F: { icon: '↑', id: 'forward' },
  L: { icon: '↶', id: 'left' },
  R: { icon: '↷', id: 'right' },
  C: { icon: '◇', id: 'if' },
  repeat: { icon: '⟳', id: 'repeat' }
};

const STEP_MS = 280;

type CellKind = 'wall' | 'floor' | 'goal' | 'star' | 'collected';

export function createLogicPath(context: GameContext): GameInstance<LogicPathState> {
  const { t, root } = context;
  let state = createInitialState(0);
  let paused = false;
  let builtKey = '';
  let cells: HTMLElement[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  /** Frame being animated (index into the shown result's frames), or null when not animating. */
  let animating: { result: RunResult; frame: number } | null = null;

  const name = (cmd: PaletteEntry) => t(`cmd.${cmd}`);

  const levelStatus = h('p', { class: 'lp-level', 'data-testid': 'lp-level' });
  const levelSelect = h('select', { id: 'lp-level-select', 'data-testid': 'level-select', onchange: () => onChooseLevel() });
  const chooser = h('div', { class: 'wp-row lp-chooser' }, h('label', { for: 'lp-level-select' }, t('level.choose')), levelSelect);
  const runsText = h('span', { 'data-testid': 'lp-runs' });
  const bestText = h('span', { 'data-testid': 'lp-best' });
  const stats = h('p', { class: 'lp-stats wp-muted' }, runsText, bestText);

  const board = h('div', { class: 'lp-board', role: 'group', dir: 'ltr', 'aria-label': t('board'), 'data-testid': 'lp-board' });
  const robot = h('span', { class: 'lp-robot', 'aria-hidden': 'true', 'data-testid': 'lp-robot' }, h('span', { class: 'lp-robot-arrow', 'aria-hidden': 'true' }, '▲'));
  const status = h('p', { class: 'wp-status lp-status', 'data-testid': 'lp-status' });

  const count = h('span', { class: 'lp-count', 'data-testid': 'lp-count' });
  const programList = h('ol', { class: 'lp-program', 'data-testid': 'lp-program', 'aria-label': t('program') });
  const programHead = h('div', { class: 'lp-program-head' }, h('h3', { class: 'lp-heading' }, t('program')), count);

  const paletteButtons = new Map<PaletteEntry, HTMLButtonElement>();
  const palette = h('div', { class: 'lp-palette', role: 'group', 'aria-label': t('palette') });
  const endButton = h(
    'button',
    { type: 'button', class: 'lp-cmd lp-end', 'data-testid': 'cmd-end', onclick: () => onClose() },
    h('span', { class: 'lp-icon', 'aria-hidden': 'true' }, '⟧'),
    h('span', {}, t('cmd.end'))
  );
  const runButton = h('button', { type: 'button', class: 'primary lp-run', 'data-testid': 'lp-run', onclick: () => onRun() }, h('span', { 'aria-hidden': 'true' }, '▶ '), t('run'));
  const undoButton = h('button', { type: 'button', 'data-testid': 'lp-undo', onclick: () => onUndo() }, t('common.undo'));
  const clearButton = h('button', { type: 'button', 'data-testid': 'lp-clear', onclick: () => onClear() }, t('clear'));
  const actions = h('div', { class: 'wp-row lp-actions' }, runButton, undoButton, clearButton);

  const legendItem = (kind: CellKind) => h('span', { class: 'lp-legend-item' }, h('span', { class: 'lp-swatch', 'data-kind': kind }, symbol(kind)), t(`cell.${kind}`));
  const legend = h('p', { class: 'lp-legend wp-muted', 'aria-hidden': 'true' }, legendItem('goal'), legendItem('star'), legendItem('wall'));
  const help = h('div', { class: 'lp-help wp-muted' }, h('p', {}, t('help')), h('p', {}, t('help.keys')));
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'lp-announcer' });

  const container = h(
    'div',
    { class: `wp-logic-path${context.reducedMotion ? ' lp-reduced' : ''}`, dir: t.direction, lang: t.locale, onkeydown: (event: Event) => onKey(event as KeyboardEvent) },
    h('div', { class: 'lp-top' }, levelStatus, stats),
    board,
    status,
    h('section', { class: 'lp-editor' }, programHead, programList, palette, actions),
    chooser,
    legend,
    help,
    live
  );

  function symbol(kind: CellKind): string {
    return { wall: '', floor: '', goal: '⚑', star: '★', collected: '☆' }[kind];
  }

  /* ---------- Rendering ---------- */

  const build = () => {
    const key = `${state.difficulty}/${state.level}`;
    if (key === builtKey) return;
    builtKey = key;
    const level = levelOf(state);
    clear(board);
    board.style.setProperty('--lp-cols', String(level.width));
    cells = level.walls.map((_, i) => {
      const row = Math.floor(i / level.width);
      const col = i % level.width;
      return h('span', { class: 'lp-cell', role: 'img', 'data-testid': `cell-${row}-${col}` }, h('span', { class: 'lp-symbol', 'aria-hidden': 'true' }));
    });
    board.append(...cells);
    clear(palette);
    paletteButtons.clear();
    for (const entry of paletteOf(state)) {
      const button = h(
        'button',
        { type: 'button', class: 'lp-cmd', 'data-testid': `cmd-${ENTRY[entry].id}`, onclick: () => onAppend(entry) },
        h('span', { class: 'lp-icon', 'aria-hidden': 'true' }, ENTRY[entry].icon),
        h('span', {}, name(entry))
      );
      paletteButtons.set(entry, button);
      palette.append(button);
    }
    if (paletteOf(state).includes('repeat')) palette.append(endButton);
  };

  const fillLevelSelect = () => {
    clear(levelSelect);
    state.levels.forEach((p, i) => {
      levelSelect.append(h('option', { value: i }, t(p.solved ? 'level.optionSolved' : 'level.option', { n: i + 1 })));
    });
    levelSelect.value = String(state.level);
  };

  /** Collected stars after frame `upTo` (inclusive; -1 = start). */
  const collectedAt = (level: Level, frames: readonly Frame[], upTo: number): Set<number> => {
    const set = new Set<number>();
    for (let k = 0; k <= upTo && k < frames.length; k++) {
      const frame = frames[k] as Frame;
      const cell = frame.row * level.width + frame.col;
      if (level.stars.includes(cell)) set.add(cell);
    }
    return set;
  };

  const renderBoard = (result: RunResult | null, frameIndex: number) => {
    const level = levelOf(state);
    const frames = result?.frames ?? [];
    const frame = frameIndex >= 0 ? frames[frameIndex] : undefined;
    const pos = frame ?? level.start;
    const collected = collectedAt(level, frames, frameIndex);
    const robotCell = pos.row * level.width + pos.col;
    const robotText = t('robot.label', { dir: t(`dir.${DIR_NAMES[pos.dir]}`) });
    cells.forEach((cell, i) => {
      const kind: CellKind = level.walls[i] ? 'wall' : i === level.goal ? 'goal' : level.stars.includes(i) ? (collected.has(i) ? 'collected' : 'star') : 'floor';
      if (cell.dataset.kind !== kind) {
        cell.dataset.kind = kind;
        (cell.firstChild as HTMLElement).textContent = symbol(kind);
      }
      const content = i === robotCell ? `${t(`cell.${kind}`)}; ${robotText}` : t(`cell.${kind}`);
      cell.setAttribute('aria-label', t('cell.label', { row: Math.floor(i / level.width) + 1, col: (i % level.width) + 1, content }));
    });
    const crashed = result?.outcome === 'crash' && frameIndex === frames.length - 1;
    robot.dataset.row = String(pos.row);
    robot.dataset.col = String(pos.col);
    robot.dataset.dir = DIR_NAMES[pos.dir];
    robot.dataset.crashed = String(crashed);
    robot.style.setProperty('--lp-turn', `${pos.dir * 90}deg`);
    robot.setAttribute('aria-label', robotText);
    const host = cells[pos.row * level.width + pos.col];
    if (host && robot.parentElement !== host) host.append(robot);
    // Highlight the program step being executed.
    const active = frame && animating ? `${frame.item}/${frame.sub}` : '';
    for (const el of programList.querySelectorAll<HTMLElement>('[data-step]')) el.classList.toggle('lp-active', el.dataset.step === active);
  };

  const statusText = (result: RunResult): string => {
    const level = levelOf(state);
    const p = progressOf(state);
    const length = programLength(p.program);
    if (result.outcome === 'goal') return `${t('status.goal', { steps: result.steps, length })} ${t('status.minimal', { minimal: level.minimal })}`;
    if (result.outcome === 'crash') return t('status.crash', { step: result.steps });
    if (result.outcome === 'limit') return t('status.limit', { max: MAX_STEPS });
    const missing = level.stars.length - result.collected.length;
    return missing > 0 ? `${t('status.ended')} ${t('status.stars', { missing })}` : t('status.ended');
  };

  const renderStatus = (result: RunResult | null) => {
    if (animating) {
      status.dataset.state = 'running';
      status.textContent = t('status.running');
    } else if (result) {
      status.dataset.state = result.outcome;
      status.textContent = statusText(result);
    } else {
      status.dataset.state = 'idle';
      status.textContent = t('status.idle');
    }
  };

  const programButton = (label: string, testId: string, aria: string, step: string, onclick: () => void, icon?: string) =>
    h('button', { type: 'button', class: 'lp-step', 'data-testid': testId, 'data-step': step, 'aria-label': aria, title: aria, onclick }, icon ? h('span', { class: 'lp-icon', 'aria-hidden': 'true' }, icon) : null, h('span', {}, label));

  const renderProgram = () => {
    const p = progressOf(state);
    const level = levelOf(state);
    clear(programList);
    if (p.program.length === 0) programList.append(h('li', { class: 'lp-empty wp-muted' }, t('program.empty')));
    p.program.forEach((item, i) => {
      if (!isRepeat(item)) {
        programList.append(h('li', {}, programButton(name(item), `prog-${i}`, t('prog.remove', { name: name(item) }), `${i}/-1`, () => onRemove(i, -1), ENTRY[item].icon)));
        return;
      }
      const open = p.open && i === p.program.length - 1;
      const label = t('repeat.label', { n: item.repeat });
      const body = h('ol', { class: 'lp-body' });
      item.body.forEach((cmd: Cmd, j) =>
        body.append(h('li', {}, programButton(name(cmd), `prog-${i}-${j}`, t('prog.remove', { name: name(cmd) }), `${i}/${j}`, () => onRemove(i, j), ENTRY[cmd].icon)))
      );
      if (open) body.append(h('li', { class: 'lp-slot wp-muted', 'aria-hidden': 'true' }, `+ ${MAX_BODY - item.body.length}`));
      programList.append(
        h(
          'li',
          { class: 'lp-block', 'data-open': String(open) },
          h(
            'div',
            { class: 'lp-block-head' },
            programButton(name('repeat'), `prog-${i}`, t('prog.remove', { name: label }), `${i}/head`, () => onRemove(i, -1), ENTRY.repeat.icon),
            h('button', { type: 'button', class: 'lp-times', 'data-testid': `prog-${i}-times`, 'aria-label': t('repeat.times', { n: item.repeat }), title: t('repeat.times', { n: item.repeat }), onclick: () => onCycle(i) }, `×${item.repeat}`)
          ),
          body
        )
      );
    });
    const length = programLength(p.program);
    count.textContent = t('program.count', { n: length, limit: level.limit });
    count.dataset.value = String(length);
    const full = length >= level.limit;
    for (const button of paletteButtons.values()) button.disabled = full;
    endButton.disabled = !p.open;
    undoButton.disabled = !canUndo(state);
    clearButton.disabled = p.program.length === 0;
    runButton.disabled = p.program.length === 0;
  };

  const render = () => {
    build();
    fillLevelSelect();
    const p = progressOf(state);
    levelStatus.textContent = t('level.status', { n: state.level + 1, total: levelCount(state.difficulty) });
    container.dataset.solved = String(p.solved);
    runsText.textContent = t('stats.runs', { n: p.runs });
    runsText.dataset.value = String(p.runs);
    bestText.textContent = p.solved ? t('stats.best', { best: p.best, minimal: levelOf(state).minimal }) : '';
    bestText.hidden = !p.solved;
    renderProgram();
    const result = animating ? animating.result : shownResult(state);
    const frameIndex = animating ? animating.frame : result ? result.frames.length - 1 : -1;
    renderBoard(result, frameIndex);
    renderStatus(result);
  };

  /* ---------- Animation ---------- */

  const stopAnimation = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    animating = null;
  };

  const tick = () => {
    if (!animating) return;
    if (animating.frame >= animating.result.frames.length - 1) {
      const result = animating.result;
      stopAnimation();
      render();
      announce(live, statusText(result));
      return;
    }
    animating.frame++;
    renderBoard(animating.result, animating.frame);
    timer = setTimeout(tick, STEP_MS);
  };

  /* ---------- Actions ---------- */

  const commitEdit = (next: LogicPathState, message: string) => {
    if (next === state) return false;
    stopAnimation();
    state = next;
    render();
    context.requestSave();
    announce(live, message);
    return true;
  };

  const onAppend = (entry: PaletteEntry) => {
    if (paused) return;
    if (!commitEdit(append(state, entry), t('announce.added', { name: name(entry) }))) announce(live, t('announce.full'));
  };

  const onClose = () => {
    if (paused) return;
    commitEdit(closeBlock(state), t('cmd.end'));
  };

  const onRemove = (index: number, sub: number) => {
    if (paused) return;
    const item = progressOf(state).program[index];
    if (item === undefined) return;
    const removed = sub >= 0 && isRepeat(item) ? name(item.body[sub] as Cmd) : isRepeat(item) ? t('repeat.label', { n: item.repeat }) : name(item);
    commitEdit(removeAt(state, index, sub), t('announce.removed', { name: removed }));
  };

  const onRemoveLast = () => {
    const { program, open } = progressOf(state);
    const last = program[program.length - 1];
    if (last === undefined) return;
    if (open && isRepeat(last) && last.body.length > 0) onRemove(program.length - 1, last.body.length - 1);
    else onRemove(program.length - 1, -1);
  };

  const onCycle = (index: number) => {
    if (paused) return;
    const next = cycleTimes(state, index);
    const item = progressOf(next).program[index];
    if (item !== undefined && isRepeat(item)) commitEdit(next, t('repeat.label', { n: item.repeat }));
  };

  const onUndo = () => {
    if (paused) return;
    commitEdit(undo(state), t('announce.undone'));
  };

  const onClear = () => {
    if (paused) return;
    commitEdit(clearProgram(state), t('announce.cleared'));
  };

  const onChooseLevel = () => {
    if (paused) return;
    const index = Number(levelSelect.value);
    const next = chooseLevel(state, index);
    if (next === state) return;
    stopAnimation();
    state = next;
    render();
    context.requestSave();
    announce(live, t('level.status', { n: index + 1, total: levelCount(state.difficulty) }));
  };

  const onRun = () => {
    if (paused || progressOf(state).program.length === 0) return;
    stopAnimation();
    const outcome = runProgram(state);
    // The logical state (runs, solved, best) is committed before any animation, so closing the
    // app mid-animation loses nothing.
    state = outcome.state;
    context.requestSave();
    if (outcome.firstSolve) {
      const p = progressOf(state);
      context.finished({ outcome: 'completed', stats: { runs: p.runs, length: p.best, minimal: levelOf(state).minimal } });
    }
    if (context.reducedMotion || outcome.result.frames.length <= 1) {
      render();
      announce(live, statusText(outcome.result));
      return;
    }
    animating = { result: outcome.result, frame: -1 };
    render();
    timer = setTimeout(tick, STEP_MS);
  };

  const KEYS: Readonly<Record<string, PaletteEntry>> = { ArrowUp: 'F', ArrowLeft: 'L', ArrowRight: 'R' };

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
    const entry = KEYS[event.key];
    if (entry) {
      event.preventDefault();
      onAppend(entry);
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      onRemoveLast();
    }
  };

  const show = (next: LogicPathState) => {
    stopAnimation();
    state = next;
    if (!container.isConnected) root.appendChild(container);
    builtKey = '';
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      show(createInitialState(options.seed, toDifficulty(options.difficulty)));
    },
    restore(saved: LogicPathState) {
      show(cloneState(saved));
    },
    serialize: () => cloneState(state),
    pause() {
      paused = true;
      if (animating) {
        stopAnimation();
        render();
      }
    },
    resume() {
      paused = false;
    },
    reset() {
      show(resetState(state));
      context.requestSave();
    },
    dispose() {
      stopAnimation();
      clear(root);
    }
  };
}
