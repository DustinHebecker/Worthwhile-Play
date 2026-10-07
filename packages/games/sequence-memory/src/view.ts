// @ts-nocheck
import './styles.css';
import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, clear, gridKeyboard, h } from '@wp/ui';
import {
  beginRecall,
  COLUMNS,
  enterTile,
  newSession,
  nextRound,
  ROUNDS,
  setPresentation,
  summarize,
  tileMarks,
  TILES,
  toDifficulty,
  undoInput,
  upcomingSpan,
  type Presentation,
  type SequenceState,
  type TileMark
} from './rules';

/**
 * Automatic presentation timing (about 800 ms per tile: lit, then a short blank gap).
 * Timers only drive the presentation, which is view state: the logical state stays
 * "showing" until the presentation has ended, so closing mid-way is always safe.
 */
export const LEAD_MS = 600;
export const LIT_MS = 600;
export const GAP_MS = 200;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** Visible tile content: a symbol or step number, so states never depend on colour. */
function markText(mark: TileMark): string {
  switch (mark.kind) {
    case 'lit':
      return '●';
    case 'entered':
    case 'miss':
      return String(mark.step);
    case 'ok':
      return `${mark.step}✓`;
    case 'extra':
      return '✗';
    default:
      return '';
  }
}

const LABEL_KEY: Record<TileMark['kind'], string> = {
  idle: 'tile',
  lit: 'tile.lit',
  entered: 'tile.entered',
  ok: 'tile.ok',
  miss: 'tile.miss',
  extra: 'tile.extra'
};

export function createSequenceMemory(context: GameContext): GameInstance<SequenceState> {
  const { root, t } = context;
  const defaultPresentation: Presentation = context.reducedMotion ? 'step' : 'auto';
  let state: SequenceState | undefined;
  let paused = false;
  // View-only presentation progress (deliberately not persisted, see rules.ts).
  let presenting = false;
  let shown = 0;
  let lit: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let focusIndex = 4;

  const position = (tile: number) => t(`pos.${tile}`);

  const roundEl = h('span', { 'data-testid': 'seq-round' });
  const spanEl = h('span', { 'data-testid': 'seq-span' });
  const modeButton = (mode: Presentation) =>
    h('button', { type: 'button', class: 'wp-seq__mode', 'data-testid': `seq-mode-${mode}`, 'aria-pressed': 'false', onclick: () => setMode(mode) }, t(`mode.${mode}`));
  const modeAuto = modeButton('auto');
  const modeStep = modeButton('step');
  const statusEl = h('p', { class: 'wp-status wp-seq__status', 'data-testid': 'seq-status' });
  const tiles = Array.from({ length: TILES }, (_, i) =>
    h(
      'button',
      { type: 'button', class: 'wp-seq__tile', 'data-cell': true, 'data-testid': `tile-${i}`, 'data-state': 'idle', tabindex: -1, onclick: () => activate(i) },
      h('span', { class: 'wp-seq__mark', 'aria-hidden': 'true' })
    )
  );
  // The grid stays left-to-right in RTL locales so that position names ("top left") stay true.
  const board = h('div', { class: 'wp-seq__board', role: 'group', dir: 'ltr', 'aria-label': t('board'), 'data-testid': 'seq-board' }, ...tiles);
  const startBtn = h('button', { type: 'button', 'data-testid': 'seq-start', onclick: () => startPresentation() });
  const nextBtn = h('button', { type: 'button', class: 'primary', 'data-testid': 'seq-next', onclick: () => stepNext() });
  const undoBtn = h('button', { type: 'button', 'data-testid': 'seq-undo', onclick: () => undo() }, t('common.undo'));
  const continueBtn = h('button', { type: 'button', class: 'primary', 'data-testid': 'seq-continue', onclick: () => proceed() }, t('action.continue'));
  const summaryEl = h('div', { class: 'wp-seq__summary', 'data-testid': 'seq-summary', hidden: true });
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status' });
  const container = h(
    'div',
    { class: `wp-seq${context.reducedMotion ? '' : ' wp-seq--motion'}`, dir: t.direction },
    h('div', { class: 'wp-seq__info' }, roundEl, spanEl),
    h('div', { class: 'wp-seq__modes', role: 'group', 'aria-label': t('mode.label') }, h('span', { class: 'wp-seq__modes-label', 'aria-hidden': 'true' }, t('mode.label')), modeAuto, modeStep),
    statusEl,
    board,
    h('div', { class: 'wp-seq__actions' }, startBtn, nextBtn, undoBtn, continueBtn),
    summaryEl,
    live
  );
  const disposeKeyboard = gridKeyboard(board, COLUMNS);

  const setFocusIndex = (index: number) => {
    focusIndex = index;
    tiles.forEach((tile, i) => (tile.tabIndex = i === index ? 0 : -1));
  };
  const focusInside = () => container.contains(document.activeElement);

  const statusText = (s: SequenceState): string => {
    const backwards = s.difficulty === 'backwards';
    const last = s.history[s.history.length - 1];
    switch (s.phase) {
      case 'showing':
        if (!presenting || shown === 0) return t(backwards ? 'status.readyBackwards' : 'status.ready', { span: s.span });
        if (s.presentation === 'step' && shown === s.span) return t('status.shown');
        return t('status.showing', { n: shown, span: s.span });
      case 'recalling':
        return t(backwards ? 'status.recallBackwards' : 'status.recall', { entered: s.input.length, span: s.span });
      case 'feedback':
        return t(last?.correct ? 'status.correct' : 'status.wrong', { next: upcomingSpan(s) });
      default:
        return t(last?.correct ? 'status.lastCorrect' : 'status.lastWrong');
    }
  };

  const summaryLines = (s: SequenceState): string[] => {
    const { maxSpan, correctRounds, rounds } = summarize(s);
    const percent = new Intl.NumberFormat(t.locale, { style: 'percent' }).format(rounds ? correctRounds / rounds : 0);
    return [maxSpan > 0 ? t('summary.span', { span: maxSpan }) : t('summary.noSpan'), t('summary.accuracy', { correct: correctRounds, rounds, percent })];
  };

  const update = () => {
    if (!state) return;
    const s = state;
    const marks = tileMarks(s, lit);
    tiles.forEach((tile, i) => {
      const mark = marks[i] ?? { kind: 'idle' };
      tile.dataset.state = mark.kind;
      tile.setAttribute('aria-label', t(LABEL_KEY[mark.kind], { n: i + 1, position: position(i), step: 'step' in mark ? mark.step : '' }));
      tile.setAttribute('aria-disabled', String(s.phase !== 'recalling' || s.input.includes(i)));
      const markEl = tile.firstElementChild;
      if (markEl) markEl.textContent = markText(mark);
    });
    roundEl.textContent = t('info.round', { round: s.round + 1, rounds: ROUNDS });
    spanEl.textContent = t('info.span', { span: s.span });
    modeAuto.setAttribute('aria-pressed', String(s.presentation === 'auto'));
    modeStep.setAttribute('aria-pressed', String(s.presentation === 'step'));
    statusEl.textContent = statusText(s);

    const showing = s.phase === 'showing';
    startBtn.hidden = !showing;
    startBtn.textContent = presenting ? t('action.restart') : t('action.show');
    startBtn.classList.toggle('primary', !presenting);
    nextBtn.hidden = !(showing && presenting && s.presentation === 'step');
    nextBtn.textContent = shown < s.span ? t('action.next') : t('action.ready');
    undoBtn.hidden = s.phase !== 'recalling';
    undoBtn.disabled = s.input.length === 0;
    continueBtn.hidden = s.phase !== 'feedback';
    summaryEl.hidden = s.phase !== 'finished';
    clear(summaryEl);
    if (s.phase === 'finished') summaryEl.append(...summaryLines(s).map((line) => h('p', {}, line)));
  };

  const apply = (next: SequenceState, message: string) => {
    const wasFinished = state?.phase === 'finished';
    state = next;
    update();
    if (message) announce(live, message);
    context.requestSave();
    if (!wasFinished && next.phase === 'finished') {
      const { maxSpan, correctRounds, rounds } = summarize(next);
      context.finished({ outcome: 'completed', stats: { maxSpan, correctRounds, rounds } });
    }
  };

  // --- presentation (view state only) ---
  const stopTimer = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };
  const resetPresentation = () => {
    stopTimer();
    presenting = false;
    shown = 0;
    lit = undefined;
  };
  const later = (ms: number, action: () => void) => {
    timer = setTimeout(() => {
      timer = undefined;
      action();
    }, ms);
  };

  const finishPresentation = () => {
    if (!state || state.phase !== 'showing') return;
    const hadFocus = focusInside();
    resetPresentation();
    const next = beginRecall(state);
    apply(next, statusText(next));
    if (hadFocus) tiles[focusIndex]?.focus();
  };

  const showTile = (k: number) => {
    if (!state) return;
    const s = state;
    shown = k;
    lit = s.sequence[k - 1];
    update();
    if (lit !== undefined) announce(live, t('announce.item', { n: k, span: s.span, position: position(lit) }));
    if (s.presentation !== 'auto') return;
    later(LIT_MS, () => {
      lit = undefined;
      update();
      later(GAP_MS, () => (k < s.span ? showTile(k + 1) : finishPresentation()));
    });
  };

  const startPresentation = (focus = focusInside()) => {
    if (!state || paused || state.phase !== 'showing') return;
    resetPresentation();
    presenting = true;
    if (state.presentation === 'step') {
      showTile(1);
      if (focus) nextBtn.focus();
    } else {
      update();
      later(LEAD_MS, () => showTile(1));
    }
  };

  const stepNext = () => {
    if (!state || paused || !presenting || state.presentation !== 'step') return;
    if (shown < state.span) showTile(shown + 1);
    else finishPresentation();
  };

  // --- player actions ---
  const activate = (tile: number) => {
    if (!state || paused) return;
    const hadFocus = focusInside();
    setFocusIndex(tile);
    const { state: next, event } = enterTile(state, tile);
    if (event.kind === 'ignored') return;
    const entry = t('announce.entry', { n: event.step, position: position(tile) });
    const parts = event.kind === 'completed' ? [entry, statusText(next), ...(next.phase === 'finished' ? summaryLines(next) : [])] : [entry];
    apply(next, parts.join(' '));
    if (hadFocus && next.phase === 'feedback') continueBtn.focus();
  };

  const undo = () => {
    if (!state || paused) return;
    const next = undoInput(state);
    if (next === state) return;
    apply(next, statusText(next));
  };

  const proceed = () => {
    if (!state || paused || state.phase !== 'feedback') return;
    const hadFocus = focusInside();
    apply(nextRound(state), '');
    // Pressing "Next round" is the player's go-ahead, so the new sequence starts right away.
    startPresentation(hadFocus);
    if (hadFocus && state.presentation === 'auto') tiles[focusIndex]?.focus();
  };

  const setMode = (mode: Presentation) => {
    if (!state || paused || state.presentation === mode) return;
    resetPresentation();
    apply(setPresentation(state, mode), '');
  };

  const mount = () => {
    if (container.parentElement !== root) {
      clear(root);
      root.append(container);
    }
    setFocusIndex(focusIndex);
    update();
  };

  const start = (seed: number, difficulty: SequenceState['difficulty'], presentation: Presentation) => {
    resetPresentation();
    state = newSession(seed, difficulty, presentation);
    mount();
    context.requestSave();
  };

  return {
    newGame(options: NewGameOptions) {
      start(options.seed, toDifficulty(options.difficulty), state?.presentation ?? defaultPresentation);
    },
    restore(saved: SequenceState) {
      // Closed during the presentation? It simply starts again from the first tile.
      resetPresentation();
      state = clone(saved);
      mount();
    },
    serialize() {
      if (!state) throw new Error('No game in progress');
      return clone(state);
    },
    pause() {
      paused = true;
      if (presenting) {
        resetPresentation();
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
      resetPresentation();
      disposeKeyboard();
      clear(root);
      state = undefined;
    }
  };
}
