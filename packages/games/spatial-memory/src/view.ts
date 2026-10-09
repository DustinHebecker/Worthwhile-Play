import './styles.css';
import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, clear, gridKeyboard, h } from '@wp/ui';
import {
  beginRecall,
  canSubmit,
  cellMarks,
  countHits,
  expectedCells,
  gridSide,
  newSession,
  nextRound,
  ROUNDS,
  setPresentation,
  submit,
  summarize,
  toDifficulty,
  toggleCell,
  upcomingSize,
  type CellMark,
  type PatternState,
  type Presentation
} from './rules';

/**
 * Automatic hiding: the pattern stays visible for AUTO_BASE_MS plus AUTO_PER_CELL_MS per cell.
 * The timer only drives view state: the logical state stays "showing" until the pattern is
 * hidden, so closing mid-way is always safe. The player can always hide it earlier.
 */
export const AUTO_BASE_MS = 1500;
export const AUTO_PER_CELL_MS = 300;
export const revealMs = (size: number) => AUTO_BASE_MS + AUTO_PER_CELL_MS * size;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** Visible cell content: a symbol, so states never depend on colour. */
const MARK_TEXT: Record<CellMark, string> = { idle: '', shown: '●', marked: '●', hit: '✓', miss: '○', wrong: '✗' };
const LABEL_KEY: Record<CellMark, string> = {
  idle: 'cell',
  shown: 'cell.shown',
  marked: 'cell.marked',
  hit: 'cell.hit',
  miss: 'cell.miss',
  wrong: 'cell.wrong'
};

export function createPatternMemory(context: GameContext): GameInstance<PatternState> {
  const { root, t } = context;
  const defaultPresentation: Presentation = context.reducedMotion ? 'step' : 'auto';
  let state: PatternState | undefined;
  let paused = false;
  // View-only visibility of the pattern (deliberately not persisted, see rules.ts).
  let revealed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let focusIndex = 0;
  let side = 0;
  let cells: HTMLButtonElement[] = [];
  let disposeKeyboard = () => {};

  const roundEl = h('span', { 'data-testid': 'pm-round' });
  const sizeEl = h('span', { 'data-testid': 'pm-size' });
  const modeButton = (mode: Presentation) =>
    h('button', { type: 'button', class: 'wp-pm__mode', 'data-testid': `pm-mode-${mode}`, 'aria-pressed': 'false', onclick: () => setMode(mode) }, t(`mode.${mode}`));
  const modeAuto = modeButton('auto');
  const modeStep = modeButton('step');
  const hintEl = h(
    'p',
    { class: 'wp-pm__hint', 'data-testid': 'pm-rotate-hint', hidden: true },
    h('span', { class: 'wp-pm__arrow', 'aria-hidden': 'true' }, '↻'),
    ' ',
    t('hint.rotated')
  );
  const statusEl = h('p', { class: 'wp-status wp-pm__status', 'data-testid': 'pm-status' });
  // The grid stays left-to-right in RTL locales: rows, columns and "clockwise" keep their meaning.
  const board = h('div', { class: 'wp-pm__board', role: 'group', dir: 'ltr', 'aria-label': t('board'), 'data-testid': 'pm-board' });
  const showBtn = h('button', { type: 'button', class: 'primary', 'data-testid': 'pm-show', onclick: () => reveal() }, t('action.show'));
  const memorisedBtn = h('button', { type: 'button', class: 'primary', 'data-testid': 'pm-memorised', onclick: () => hidePattern() }, t('action.memorised'));
  const doneBtn = h('button', { type: 'button', class: 'primary', 'data-testid': 'pm-done', onclick: () => done() }, t('action.done'));
  const nextBtn = h('button', { type: 'button', class: 'primary', 'data-testid': 'pm-next', onclick: () => proceed() }, t('action.continue'));
  const legendEl = h('p', { class: 'wp-pm__legend', 'data-testid': 'pm-legend', hidden: true }, t('legend'));
  const summaryEl = h('div', { class: 'wp-pm__summary', 'data-testid': 'pm-summary', hidden: true });
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status' });
  const container = h(
    'div',
    { class: `wp-pm${context.reducedMotion ? '' : ' wp-pm--motion'}`, dir: t.direction },
    h('div', { class: 'wp-pm__info' }, roundEl, sizeEl),
    h('div', { class: 'wp-pm__modes', role: 'group', 'aria-label': t('mode.label') }, h('span', { class: 'wp-pm__modes-label', 'aria-hidden': 'true' }, t('mode.label')), modeAuto, modeStep),
    hintEl,
    statusEl,
    board,
    legendEl,
    h('div', { class: 'wp-pm__actions' }, showBtn, memorisedBtn, doneBtn, nextBtn),
    summaryEl,
    live
  );

  const coords = (cell: number) => ({ row: Math.floor(cell / side) + 1, col: (cell % side) + 1 });
  const focusInside = () => container.contains(document.activeElement);

  const setFocusIndex = (index: number) => {
    focusIndex = index;
    cells.forEach((cell, i) => (cell.tabIndex = i === index ? 0 : -1));
  };

  /** (Re)builds the grid when the pattern size moves to another grid size. */
  const ensureBoard = (nextSide: number) => {
    if (nextSide === side) return;
    const hadFocus = cells.includes(document.activeElement as HTMLButtonElement);
    disposeKeyboard();
    side = nextSide;
    clear(board);
    cells = Array.from({ length: side * side }, (_, i) =>
      h(
        'button',
        { type: 'button', class: 'wp-pm__cell', 'data-cell': true, 'data-testid': `cell-${i}`, 'data-state': 'idle', tabindex: -1, onclick: () => toggle(i) },
        h('span', { class: 'wp-pm__mark', 'aria-hidden': 'true' })
      )
    );
    board.style.setProperty('--pm-side', String(side));
    board.append(...cells);
    disposeKeyboard = gridKeyboard(board, side);
    setFocusIndex(Math.min(focusIndex, cells.length - 1));
    if (hadFocus) cells[focusIndex]?.focus();
  };

  const hitsOf = (s: PatternState) => countHits(expectedCells(s.pattern, gridSide(s.size), s.difficulty), s.marks);

  const statusText = (s: PatternState): string => {
    const rotated = s.difficulty === 'rotated';
    const last = s.history[s.history.length - 1];
    switch (s.phase) {
      case 'showing':
        if (!revealed) return t(rotated ? 'status.readyRotated' : 'status.ready', { size: s.size });
        return t(s.presentation === 'auto' ? 'status.showingAuto' : 'status.showing', { size: s.size });
      case 'recalling':
        return t(rotated ? 'status.recallRotated' : 'status.recall', { marked: s.marks.length, size: s.size });
      case 'feedback':
        return last?.correct ? t('status.correct', { next: upcomingSize(s) }) : t('status.wrong', { hits: hitsOf(s), size: s.size, next: upcomingSize(s) });
      default:
        return last?.correct ? t('status.lastCorrect') : t('status.lastWrong', { hits: hitsOf(s), size: s.size });
    }
  };

  const summaryLines = (s: PatternState): string[] => {
    const { maxSize, correctRounds, rounds } = summarize(s);
    const percent = new Intl.NumberFormat(t.locale, { style: 'percent' }).format(rounds ? correctRounds / rounds : 0);
    return [maxSize > 0 ? t('summary.size', { size: maxSize }) : t('summary.noSize'), t('summary.accuracy', { correct: correctRounds, rounds, percent })];
  };

  const update = () => {
    if (!state) return;
    const s = state;
    ensureBoard(gridSide(s.size));
    const marks = cellMarks(s, revealed);
    cells.forEach((cell, i) => {
      const mark = marks[i] ?? 'idle';
      cell.dataset.state = mark;
      cell.setAttribute('aria-label', t(LABEL_KEY[mark], coords(i)));
      cell.setAttribute('aria-disabled', String(s.phase !== 'recalling'));
      const markEl = cell.firstElementChild;
      if (markEl) markEl.textContent = MARK_TEXT[mark];
    });
    roundEl.textContent = t('info.round', { round: s.round + 1, rounds: ROUNDS });
    sizeEl.textContent = t('info.size', { size: s.size });
    modeAuto.setAttribute('aria-pressed', String(s.presentation === 'auto'));
    modeStep.setAttribute('aria-pressed', String(s.presentation === 'step'));
    hintEl.hidden = s.difficulty !== 'rotated' || s.phase === 'finished';
    statusEl.textContent = statusText(s);

    const evaluated = s.phase === 'feedback' || s.phase === 'finished';
    showBtn.hidden = !(s.phase === 'showing' && !revealed);
    memorisedBtn.hidden = !(s.phase === 'showing' && revealed);
    doneBtn.hidden = s.phase !== 'recalling';
    doneBtn.disabled = !canSubmit(s);
    nextBtn.hidden = s.phase !== 'feedback';
    legendEl.hidden = !evaluated;
    summaryEl.hidden = s.phase !== 'finished';
    clear(summaryEl);
    if (s.phase === 'finished') summaryEl.append(...summaryLines(s).map((line) => h('p', {}, line)));
  };

  const apply = (next: PatternState, message: string) => {
    const wasFinished = state?.phase === 'finished';
    state = next;
    update();
    if (message) announce(live, message);
    context.requestSave();
    if (!wasFinished && next.phase === 'finished') {
      const { maxSize, correctRounds, rounds } = summarize(next);
      context.finished({ outcome: 'completed', stats: { maxSize, correctRounds, rounds } });
    }
  };

  // --- showing the pattern (view state only) ---
  const stopReveal = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    revealed = false;
  };

  const reveal = (focus = focusInside()) => {
    if (!state || paused || state.phase !== 'showing') return;
    stopReveal();
    revealed = true;
    update();
    announce(live, statusText(state));
    if (focus) memorisedBtn.focus();
    if (state.presentation === 'auto') {
      timer = setTimeout(() => {
        timer = undefined;
        hidePattern();
      }, revealMs(state.size));
    }
  };

  const hidePattern = () => {
    if (!state || paused || state.phase !== 'showing' || !revealed) return;
    const hadFocus = focusInside();
    stopReveal();
    const next = beginRecall(state);
    apply(next, statusText(next));
    if (hadFocus) cells[focusIndex]?.focus();
  };

  // --- player actions ---
  const toggle = (cell: number) => {
    if (!state || paused || state.phase !== 'recalling') return;
    setFocusIndex(cell);
    const next = toggleCell(state, cell);
    if (next === state) {
      announce(live, t('status.full', { size: state.size }));
      return;
    }
    const marked = next.marks.includes(cell);
    apply(next, `${t(marked ? 'announce.marked' : 'announce.unmarked', coords(cell))}. ${statusText(next)}`);
  };

  const done = () => {
    if (!state || paused || !canSubmit(state)) return;
    const hadFocus = focusInside();
    const next = submit(state);
    apply(next, [statusText(next), ...(next.phase === 'finished' ? summaryLines(next) : [])].join(' '));
    if (hadFocus && next.phase === 'feedback') nextBtn.focus();
  };

  const proceed = () => {
    if (!state || paused || state.phase !== 'feedback') return;
    const hadFocus = focusInside();
    apply(nextRound(state), '');
    // Pressing "Next round" is the player's go-ahead, so the new pattern appears right away.
    reveal(hadFocus);
  };

  const setMode = (mode: Presentation) => {
    if (!state || paused || state.presentation === mode) return;
    stopReveal();
    apply(setPresentation(state, mode), '');
  };

  const mount = () => {
    if (container.parentElement !== root) {
      clear(root);
      root.append(container);
    }
    update();
    setFocusIndex(focusIndex);
  };

  const start = (seed: number, difficulty: PatternState['difficulty'], presentation: Presentation) => {
    stopReveal();
    state = newSession(seed, difficulty, presentation);
    mount();
    context.requestSave();
  };

  return {
    newGame(options: NewGameOptions) {
      start(options.seed, toDifficulty(options.difficulty), state?.presentation ?? defaultPresentation);
    },
    restore(saved: PatternState) {
      // Closed while the pattern was visible? The player simply shows it again.
      stopReveal();
      state = clone(saved);
      mount();
    },
    serialize() {
      if (!state) throw new Error('No game in progress');
      return clone(state);
    },
    pause() {
      paused = true;
      if (revealed) {
        stopReveal();
        update();
      }
    },
    resume() {
      paused = false;
    },
    reset() {
      if (state) start(state.seed, state.difficulty, state.presentation);
    },
    dispose() {
      stopReveal();
      disposeKeyboard();
      clear(root);
      state = undefined;
    }
  };
}
