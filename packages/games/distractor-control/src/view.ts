import './styles.css';
import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import {
  answer,
  CHOICES,
  generateSequence,
  ITEM_COUNT,
  newSession,
  score,
  SESSION_MINUTES,
  startSession,
  tapDistractor,
  toDifficulty,
  visibleDistractor,
  type Choice,
  type Difficulty,
  type DistractorKind,
  type DistractorState,
  type Item,
  type Slot
} from './rules';

/** Small text-presentation symbols next to each extra (decorative; the text carries meaning). */
const ICONS: Readonly<Record<DistractorKind, string>> = {
  bonus: '★',
  message: '✉',
  tapHere: '☞',
  badge: '●',
  offer: '%'
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * Self-paced: no timers at all. The logical state is saved after every answer and every tap
 * on an extra. A session closed (or paused) mid-way waits behind "Continue", like Signal Watch,
 * so the player picks up the thread deliberately.
 */
export function createDistractorControl(context: GameContext): GameInstance<DistractorState> {
  const { root, t } = context;
  let state: DistractorState | undefined;
  let sequence: Item[] = [];
  let sequenceKey = '';
  /** Session waits for "Continue" (after a pause or a restore). View state only. */
  let held = false;
  /** Host pause (tab hidden). */
  let paused = false;
  /** The last action was a tap on an extra (shows a neutral note). View state only. */
  let noted = false;

  const introLength = h('p', { 'data-testid': 'dc-length' });
  const startBtn = h('button', { type: 'button', class: 'primary', 'data-testid': 'dc-start', onclick: () => start() }, t('action.start'));
  const intro = h(
    'div',
    { class: 'wp-dc__intro', 'data-testid': 'dc-intro' },
    h('p', { class: 'wp-dc__task' }, t('intro.task')),
    introLength,
    h('p', { class: 'wp-dc__muted' }, t('intro.distractors')),
    startBtn
  );

  const statusEl = h('p', { class: 'wp-status wp-dc__status', 'data-testid': 'dc-status' });
  const ackEl = h('p', { class: 'wp-dc__ack', 'data-testid': 'dc-ack' });
  const slots = {} as Record<Slot, HTMLElement>;
  const lane = (start: Slot, end: Slot) => {
    slots[start] = h('div', { class: 'wp-dc__slot wp-dc__slot--start' });
    slots[end] = h('div', { class: 'wp-dc__slot wp-dc__slot--end' });
    return h('div', { class: 'wp-dc__lane' }, slots[start], slots[end]);
  };
  const laneAbove = lane('aboveStart', 'aboveEnd');
  const laneBelow = lane('belowStart', 'belowEnd');
  const itemEl = h('div', { class: 'wp-dc__item', role: 'img', 'data-testid': 'dc-item', 'data-index': 0 });
  const answerBtns = Object.fromEntries(
    CHOICES.map((choice) => [
      choice,
      h('button', { type: 'button', class: 'wp-dc__answer', 'data-testid': `dc-answer-${choice}`, onclick: () => onAnswer(choice) }, t(`answer.${choice}`))
    ])
  ) as Record<Choice, HTMLButtonElement>;
  const answers = h('div', { class: 'wp-dc__answers', role: 'group', 'aria-label': t('answer.group') }, answerBtns.even, answerBtns.odd);
  const continueBtn = h('button', { type: 'button', class: 'primary', 'data-testid': 'dc-continue', onclick: () => proceed() }, t('action.continue'));
  const play = h('div', { class: 'wp-dc__play' }, laneAbove, itemEl, answers, laneBelow, continueBtn);
  const summaryEl = h('div', { class: 'wp-dc__summary', 'data-testid': 'dc-summary', hidden: true, tabindex: -1 });
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status' });
  const container = h(
    'div',
    { class: `wp-dc${context.reducedMotion ? '' : ' wp-dc--motion'}`, dir: t.direction },
    intro,
    statusEl,
    ackEl,
    play,
    summaryEl,
    live
  );

  const focusInside = () => container.contains(document.activeElement);
  const active = () => !!state && state.phase === 'running' && !held && !paused;

  const ensureSequence = (s: DistractorState) => {
    const key = `${s.seed}:${s.difficulty}`;
    if (key !== sequenceKey) {
      sequence = generateSequence(s.seed, s.difficulty);
      sequenceKey = key;
    }
  };

  const summaryLines = (s: DistractorState): string[] => {
    const { correct, shown, captured } = score(s, sequence);
    return [
      t('summary.correct', { correct, total: ITEM_COUNT }),
      t('summary.shown', { shown }),
      t('summary.captured', { captured }),
      t('summary.note')
    ];
  };

  /** Renders the current item's extra (if any) into its reserved slot. */
  const renderDistractor = (s: DistractorState) => {
    const distractor = held ? null : visibleDistractor(s, sequence);
    const existing = container.querySelector<HTMLElement>('[data-testid="dc-distractor"]');
    if (existing && distractor && existing.dataset.index === String(s.index)) return;
    existing?.remove();
    if (!distractor) return;
    slots[distractor.slot].append(
      h(
        'button',
        {
          type: 'button',
          class: `wp-dc__extra wp-dc__extra--${distractor.kind}`,
          'data-testid': 'dc-distractor',
          'data-index': s.index,
          'data-kind': distractor.kind,
          onclick: () => onDistractor()
        },
        h('span', { class: 'wp-dc__extra-icon', 'aria-hidden': 'true' }, ICONS[distractor.kind]),
        h('span', {}, t(`distractor.${distractor.kind}`))
      )
    );
  };

  const update = () => {
    if (!state) return;
    const s = state;
    introLength.textContent = t('intro.length', { count: ITEM_COUNT, minutes: SESSION_MINUTES });
    intro.hidden = s.phase !== 'ready';
    play.hidden = s.phase !== 'running';
    summaryEl.hidden = s.phase !== 'finished';

    const item = s.phase === 'running' && !held ? sequence[s.index] : undefined;
    itemEl.dataset.index = String(s.index);
    itemEl.textContent = item ? String(item.value) : '';
    itemEl.setAttribute('aria-label', item ? t('item.label', { value: item.value }) : t('item.none'));
    answers.hidden = !item;
    continueBtn.hidden = !(s.phase === 'running' && held);
    renderDistractor(s);
    ackEl.textContent = noted && item ? t('status.captured') : '';

    if (s.phase === 'ready') statusEl.textContent = t('status.ready');
    else if (s.phase === 'finished') statusEl.textContent = t('result.completed');
    else {
      const progress = t('status.progress', { n: s.index + 1, total: ITEM_COUNT });
      statusEl.textContent = held ? `${t('status.paused')} ${progress}` : progress;
    }

    clear(summaryEl);
    if (s.phase === 'finished') summaryEl.append(...summaryLines(s).map((line) => h('p', {}, line)));
  };

  const announceItem = () => {
    const item = state && state.phase === 'running' ? sequence[state.index] : undefined;
    if (item) announce(live, t('item.label', { value: item.value }));
  };

  // --- player actions ---
  const onAnswer = (choice: Choice) => {
    if (!state || !active()) return;
    const hadFocus = focusInside();
    state = answer(state, choice);
    noted = false;
    context.requestSave();
    update();
    if (state.phase === 'finished') {
      const { correct, shown, captured } = score(state, sequence);
      announce(live, [t('result.completed'), ...summaryLines(state)].join(' '));
      context.finished({ outcome: 'completed', stats: { correct, total: ITEM_COUNT, shown, captured } });
      if (hadFocus) summaryEl.focus();
      return;
    }
    announceItem();
  };

  const onDistractor = () => {
    if (!state || !active()) return;
    const next = tapDistractor(state, sequence);
    if (next === state) return;
    const hadFocus = focusInside();
    state = next;
    noted = true;
    context.requestSave();
    update();
    announce(live, t('status.captured'));
    if (hadFocus) answerBtns.even.focus();
  };

  const start = () => {
    if (!state || paused || state.phase !== 'ready') return;
    state = startSession(state);
    held = false;
    noted = false;
    context.requestSave();
    update();
    announceItem();
    answerBtns.even.focus();
  };

  const proceed = () => {
    if (!state || paused || state.phase !== 'running' || !held) return;
    held = false;
    update();
    announceItem();
    answerBtns.even.focus();
  };

  const mount = () => {
    if (container.parentElement !== root) {
      clear(root);
      root.append(container);
    }
    update();
  };

  const begin = (seed: number, difficulty: Difficulty) => {
    held = false;
    noted = false;
    state = newSession(seed, difficulty);
    ensureSequence(state);
    mount();
    context.requestSave();
  };

  return {
    newGame(options: NewGameOptions) {
      begin(options.seed, toDifficulty(options.difficulty));
    },
    restore(saved: DistractorState) {
      // Closed mid-session? It waits for "Continue" and resumes at the same item.
      state = clone(saved);
      ensureSequence(state);
      held = state.phase === 'running';
      noted = false;
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
        held = true;
        noted = false;
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
      clear(root);
      state = undefined;
    }
  };
}
