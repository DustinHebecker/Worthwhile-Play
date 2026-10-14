import './styles.css';
import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import {
  advance,
  generateSequence,
  GLYPHS,
  LOOKALIKES,
  newSession,
  respond,
  responseFor,
  score,
  SESSIONS,
  startSession,
  TARGET,
  toDifficulty,
  type Difficulty,
  type SignalState,
  type Stimulus,
  type SymbolId
} from './rules';

/**
 * Without reduced motion each symbol is visible for SHOW_MS, followed by a short blank
 * until the next onset; with reduced motion the symbols simply swap. Timers only drive
 * the presentation: the logical state (index, responses) is saved after each stimulus
 * and after each response, so closing at any moment is safe.
 */
export const SHOW_MS = 1000;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const isTextEntry = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

export function createSignalWatch(context: GameContext): GameInstance<SignalState> {
  const { root, t } = context;
  let state: SignalState | undefined;
  let sequence: Stimulus[] = [];
  let sequenceKey = '';
  /** Host pause (tab hidden). */
  let paused = false;
  /** Session waits for "Continue" (after a pause or a restore). View state only. */
  let held = false;
  /** Whether the current symbol is visible (false during the blank gap). */
  let showing = false;
  let onset = 0;
  let stepTimer: ReturnType<typeof setTimeout> | undefined;
  let gapTimer: ReturnType<typeof setTimeout> | undefined;

  const symbolName = (symbol: SymbolId) => t(`symbol.${symbol}`);

  const introGlyph = h('span', { class: 'wp-sw__sample', 'aria-hidden': 'true' }, GLYPHS[TARGET]);
  const introTarget = h('p', { class: 'wp-sw__target' });
  const introLength = h('p', { 'data-testid': 'sw-length' });
  const introLookalikes = h('p', { class: 'wp-sw__muted' });
  const startBtn = h('button', { type: 'button', class: 'primary', 'data-testid': 'sw-start', onclick: () => start() }, t('action.start'));
  const intro = h('div', { class: 'wp-sw__intro', 'data-testid': 'sw-intro' }, introGlyph, introTarget, introLength, introLookalikes, startBtn);

  const statusEl = h('p', { class: 'wp-status wp-sw__status', 'data-testid': 'sw-status' });
  const ackEl = h('p', { class: 'wp-sw__ack', 'data-testid': 'sw-ack' });
  const stimulusEl = h('div', { class: 'wp-sw__stimulus', role: 'img', 'data-testid': 'sw-stimulus', 'data-symbol': '', 'data-index': 0 });
  const respondBtn = h('button', {
    type: 'button',
    class: 'primary wp-sw__respond',
    'data-testid': 'sw-respond',
    onpointerdown: (event: Event) => {
      if ((event as PointerEvent).button === 0) onRespond();
    },
    // Keyboard activation is handled on keydown; this catches assistive-technology clicks.
    onclick: (event: Event) => {
      if ((event as MouseEvent).detail === 0) onRespond();
    }
  }, t('action.respond'));
  const hintEl = h('p', { class: 'wp-sw__muted' }, t('action.respondHint'));
  const continueBtn = h('button', { type: 'button', class: 'primary', 'data-testid': 'sw-continue', onclick: () => proceed() }, t('action.continue'));
  const play = h('div', { class: 'wp-sw__play' }, stimulusEl, respondBtn, hintEl, continueBtn);
  const summaryEl = h('div', { class: 'wp-sw__summary', 'data-testid': 'sw-summary', hidden: true });
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status' });
  const container = h(
    'div',
    { class: `wp-sw${context.reducedMotion ? '' : ' wp-sw--motion'}`, dir: t.direction },
    intro,
    statusEl,
    ackEl,
    play,
    summaryEl,
    live
  );

  const focusInside = () => container.contains(document.activeElement);
  const active = () => !!state && state.phase === 'running' && !held && !paused;

  const ensureSequence = (s: SignalState) => {
    const key = `${s.seed}:${s.difficulty}`;
    if (key !== sequenceKey) {
      sequence = generateSequence(s.seed, s.difficulty);
      sequenceKey = key;
    }
  };

  const summaryLines = (s: SignalState): string[] => {
    const { targets, hits, misses, falseAlarms, meanRtMs } = score(s, sequence);
    return [
      t('summary.hits', { hits, targets }),
      t('summary.misses', { misses }),
      t('summary.falseAlarms', { falseAlarms }),
      meanRtMs === null ? t('summary.noRt') : t('summary.meanRt', { ms: meanRtMs }),
      t('summary.note')
    ];
  };

  const update = () => {
    if (!state) return;
    const s = state;
    const { minutes, count } = SESSIONS[s.difficulty];
    introTarget.textContent = t('intro.target', { name: symbolName(TARGET) });
    introLength.textContent = t('intro.length', { minutes, count });
    introLookalikes.textContent = LOOKALIKES[s.difficulty].length > 0 ? t('intro.lookalikes') : '';
    introLookalikes.hidden = LOOKALIKES[s.difficulty].length === 0;
    intro.hidden = s.phase !== 'ready';
    play.hidden = s.phase !== 'running';
    summaryEl.hidden = s.phase !== 'finished';

    const current = s.phase === 'running' && !held && showing ? sequence[s.index] : undefined;
    stimulusEl.dataset.index = String(s.index);
    stimulusEl.dataset.symbol = current?.symbol ?? '';
    stimulusEl.setAttribute('aria-label', current ? t('stimulus.label', { name: symbolName(current.symbol) }) : t('stimulus.none'));
    const glyph = current ? GLYPHS[current.symbol] : '';
    if ((stimulusEl.textContent ?? '') !== glyph) {
      clear(stimulusEl);
      // A fresh element per symbol restarts the (optional) fade-in.
      if (glyph) stimulusEl.append(h('span', { class: 'wp-sw__glyph', 'aria-hidden': 'true' }, glyph));
    }

    respondBtn.hidden = s.phase !== 'running' || held;
    hintEl.hidden = respondBtn.hidden;
    continueBtn.hidden = !(s.phase === 'running' && held);
    respondBtn.setAttribute('aria-disabled', String(!!responseFor(s, s.index)));
    ackEl.textContent = s.phase === 'running' && !held && responseFor(s, s.index) ? t('status.noted') : '';

    if (s.phase === 'ready') statusEl.textContent = t('status.ready');
    else if (s.phase === 'finished') statusEl.textContent = t('result.completed');
    else {
      const progress = t('status.progress', { n: s.index + 1, total: sequence.length });
      statusEl.textContent = held ? `${t('status.paused')} ${progress}` : progress;
    }

    clear(summaryEl);
    if (s.phase === 'finished') summaryEl.append(...summaryLines(s).map((line) => h('p', {}, line)));
  };

  // --- presentation (view state only) ---
  const stopTimers = () => {
    if (stepTimer !== undefined) clearTimeout(stepTimer);
    if (gapTimer !== undefined) clearTimeout(gapTimer);
    stepTimer = undefined;
    gapTimer = undefined;
    showing = false;
  };

  const present = () => {
    if (!state || !active()) return;
    const stimulus = sequence[state.index];
    if (!stimulus) return;
    stopTimers();
    showing = true;
    onset = Date.now();
    update();
    announce(live, symbolName(stimulus.symbol));
    if (!context.reducedMotion) {
      gapTimer = setTimeout(() => {
        gapTimer = undefined;
        showing = false;
        update();
      }, SHOW_MS);
    }
    stepTimer = setTimeout(() => {
      stepTimer = undefined;
      closeStimulus();
    }, stimulus.intervalMs);
  };

  const closeStimulus = () => {
    if (!state || state.phase !== 'running') return;
    stopTimers();
    state = advance(state, sequence);
    context.requestSave();
    if (state.phase === 'finished') {
      const hadFocus = focusInside();
      update();
      const { hits, misses, falseAlarms, meanRtMs } = score(state, sequence);
      announce(live, [t('result.completed'), ...summaryLines(state)].join(' '));
      context.finished({ outcome: 'completed', stats: { hits, misses, falseAlarms, ...(meanRtMs === null ? {} : { meanRtMs }) } });
      if (hadFocus) summaryEl.focus();
      return;
    }
    present();
  };

  // --- player actions ---
  const onRespond = () => {
    if (!state || !active()) return;
    const next = respond(state, sequence, Date.now() - onset);
    if (next === state) return;
    state = next;
    update();
    context.requestSave();
  };

  const start = () => {
    if (!state || paused || state.phase !== 'ready') return;
    state = startSession(state);
    held = false;
    context.requestSave();
    present();
    respondBtn.focus();
  };

  const proceed = () => {
    if (!state || paused || state.phase !== 'running' || !held) return;
    held = false;
    present();
    respondBtn.focus();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    if (!active() || event.repeat || isTextEntry(event.target)) return;
    const target = event.target as Node | null;
    // Respond from the page body or from inside the game, never from the host's controls.
    if (target && target !== document.body && target !== document.documentElement && !container.contains(target)) return;
    if (target instanceof HTMLElement && target !== respondBtn && target.tagName === 'BUTTON') return;
    event.preventDefault();
    onRespond();
  };
  document.addEventListener('keydown', onKeyDown);

  const mount = () => {
    if (container.parentElement !== root) {
      clear(root);
      root.append(container);
    }
    update();
  };

  const begin = (seed: number, difficulty: Difficulty) => {
    stopTimers();
    held = false;
    state = newSession(seed, difficulty);
    ensureSequence(state);
    mount();
    context.requestSave();
  };

  summaryEl.tabIndex = -1;

  return {
    newGame(options: NewGameOptions) {
      begin(options.seed, toDifficulty(options.difficulty));
    },
    restore(saved: SignalState) {
      // Closed mid-session? It waits for "Continue" and resumes at the same stimulus.
      stopTimers();
      state = clone(saved);
      ensureSequence(state);
      held = state.phase === 'running';
      mount();
    },
    serialize() {
      if (!state) throw new Error('No game in progress');
      return clone(state);
    },
    pause() {
      paused = true;
      if (state?.phase === 'running' && !held) {
        const hadFocus = focusInside();
        stopTimers();
        held = true;
        update();
        if (hadFocus) continueBtn.focus();
      }
    },
    resume() {
      // The session stays on "Paused — continue" until the player chooses to go on.
      paused = false;
    },
    reset() {
      if (state) begin(state.seed, state.difficulty);
    },
    dispose() {
      stopTimers();
      document.removeEventListener('keydown', onKeyDown);
      clear(root);
      state = undefined;
    }
  };
}
