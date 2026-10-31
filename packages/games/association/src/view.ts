import './styles.css';
import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { findWord, toVocabularyLanguage } from '@wp/learning-content';
import { announce, append, clear, h } from '@wp/ui';
import {
  answerFiller,
  answerOf,
  answerQuestion,
  answersByPair,
  cueOf,
  FILLER_MAX_COUNT,
  newRound,
  nextPair,
  NOTE_MAX,
  previousPair,
  score,
  setNote,
  toDifficulty,
  type AssociationState,
  type Difficulty,
  type FillerShape,
  type Question
} from './rules';

const SVG_NS = 'http://www.w3.org/2000/svg';
const NAMES_PREFERENCE = 'names';
let instanceCount = 0;

const svg = (tag: string, attrs: Record<string, string | number>): SVGElement => {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  return el;
};

/** Shape outlines in a 100×100 view box (shape, not colour, carries the information). */
const SHAPE_SVG: Readonly<Record<FillerShape, () => SVGElement>> = {
  circle: () => svg('circle', { cx: 50, cy: 50, r: 38 }),
  square: () => svg('rect', { x: 14, y: 14, width: 72, height: 72 }),
  triangle: () => svg('polygon', { points: '50,10 92,86 8,86' })
};

const isTextEntry = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/** Digit 1–9 from the main row or the number pad, else undefined. */
const digitOf = (event: KeyboardEvent): number | undefined => {
  const match = /^(?:Digit|Numpad)([1-9])$/.exec(event.code) ?? /^([1-9])$/.exec(event.key);
  return match ? Number(match[1]) : undefined;
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * Self-paced throughout: no timers. Every step (next/previous pair, note edit, count, answer) is
 * saved; a round closed at any point reopens at the same pair, break or question.
 */
export function createAssociation(context: GameContext): GameInstance<AssociationState> {
  const { root, t } = context;
  const language = toVocabularyLanguage(t.locale) ?? 'en';
  const nameOf = (id: string): string => findWord(id)?.words[language] ?? id;
  const emojiOf = (id: string): string => findWord(id)?.emoji ?? '?';
  const uid = `wp-assoc-${++instanceCount}`;
  let state: AssociationState | undefined;
  let showNames = context.preferences?.get(NAMES_PREFERENCE) !== false;

  const statusEl = h('p', { class: 'wp-status wp-assoc__status', 'data-testid': 'as-status' });
  const namesBox = h('input', {
    type: 'checkbox',
    'data-testid': 'as-names',
    onchange: () => {
      showNames = namesBox.checked;
      context.preferences?.set(NAMES_PREFERENCE, showNames);
      container.classList.toggle('wp-assoc--no-names', !showNames);
    }
  });
  const namesLabel = h('label', { class: 'wp-assoc__toggle' }, namesBox, h('span', {}, t('names.show')));

  // --- learning ---
  const pairEl = h('div', { class: 'wp-assoc__pair', role: 'group', 'data-testid': 'as-pair' });
  const noteInput = h('input', {
    type: 'text',
    id: `${uid}-note`,
    class: 'wp-assoc__note',
    'data-testid': 'as-note',
    maxlength: NOTE_MAX,
    autocomplete: 'off',
    'aria-describedby': `${uid}-hint`,
    oninput: () => onNote(),
    onkeydown: (event: Event) => {
      const e = event as KeyboardEvent;
      if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        onNext();
      }
    }
  });
  const backBtn = h('button', { type: 'button', 'data-testid': 'as-back', onclick: () => onBack() }, t('action.back'));
  const nextBtn = h('button', { type: 'button', class: 'primary', 'data-testid': 'as-next', 'data-autofocus': true, onclick: () => onNext() });
  const learnEl = h(
    'section',
    { class: 'wp-assoc__phase', 'data-testid': 'as-learn' },
    h('p', { class: 'wp-assoc__tip' }, t('learn.tip')),
    pairEl,
    h(
      'div',
      { class: 'wp-assoc__field' },
      h('label', { for: `${uid}-note` }, t('note.label')),
      noteInput,
      h('p', { class: 'wp-assoc__muted', id: `${uid}-hint` }, t('note.hint'))
    ),
    h('div', { class: 'wp-assoc__nav' }, backBtn, nextBtn)
  );

  // --- counting break ---
  const fillerQuestion = h('p', { class: 'wp-assoc__question', 'data-testid': 'as-filler-question' });
  const fillerShapes = h('div', { class: 'wp-assoc__shapes', role: 'img', 'data-testid': 'as-filler-shapes' });
  const countButtons = Array.from({ length: FILLER_MAX_COUNT }, (_, i) =>
    h('button', { type: 'button', class: 'wp-assoc__count', 'data-testid': `as-count-${i + 1}`, onclick: () => onCount(i + 1) }, String(i + 1))
  );
  const fillerEl = h(
    'section',
    { class: 'wp-assoc__phase', 'data-testid': 'as-filler' },
    h('p', { class: 'wp-assoc__tip' }, t('filler.intro')),
    fillerQuestion,
    fillerShapes,
    h('div', { class: 'wp-assoc__counts', role: 'group', 'aria-label': t('filler.answers') }, ...countButtons),
    h('p', { class: 'wp-assoc__muted' }, t('filler.keys', { max: FILLER_MAX_COUNT }))
  );

  // --- recall ---
  const cueEl = h('div', { class: 'wp-assoc__cue', 'data-testid': 'as-cue' });
  const optionsEl = h('div', { class: 'wp-assoc__options', role: 'group', 'aria-label': t('recall.options'), 'data-testid': 'as-options' });
  const recallKeys = h('p', { class: 'wp-assoc__muted' });
  const recallEl = h(
    'section',
    { class: 'wp-assoc__phase', 'data-testid': 'as-recall' },
    h('p', { class: 'wp-assoc__question' }, t('recall.question')),
    cueEl,
    optionsEl,
    recallKeys
  );

  const summaryEl = h('section', { class: 'wp-assoc__phase wp-assoc__summary', 'data-testid': 'as-summary', tabindex: -1 });
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status' });
  const container = h(
    'div',
    { class: 'wp-assoc', dir: t.direction },
    statusEl,
    namesLabel,
    learnEl,
    fillerEl,
    recallEl,
    summaryEl,
    live
  );

  const focusInside = () => container.contains(document.activeElement);

  const card = (id: string, testId?: string) =>
    h(
      'div',
      { class: 'wp-assoc__card', role: 'img', 'aria-label': nameOf(id), 'data-item': id, 'data-testid': testId },
      h('span', { class: 'wp-assoc__emoji', 'aria-hidden': 'true' }, emojiOf(id)),
      h('span', { class: 'wp-assoc__name', 'aria-hidden': 'true' }, nameOf(id))
    );

  const optionButtons = (): HTMLButtonElement[] => [...optionsEl.querySelectorAll<HTMLButtonElement>('button')];

  const renderLearn = (s: AssociationState) => {
    const [a, b] = s.pairs[s.index] as [string, string];
    clear(pairEl);
    pairEl.dataset.index = String(s.index);
    pairEl.setAttribute('aria-label', t('learn.pair', { a: nameOf(a), b: nameOf(b) }));
    pairEl.append(card(a, 'as-item-a'), h('span', { class: 'wp-assoc__link', 'aria-hidden': 'true' }, '+'), card(b, 'as-item-b'));
    if (noteInput.value !== s.notes[s.index]) noteInput.value = s.notes[s.index] ?? '';
    backBtn.disabled = s.index === 0;
    nextBtn.textContent = t(s.index === s.pairs.length - 1 ? 'action.done' : 'action.next');
  };

  const renderFiller = (s: AssociationState) => {
    const round = s.fillers[s.index];
    if (!round) return;
    fillerEl.dataset.index = String(s.index);
    fillerQuestion.textContent = t(`filler.question.${round.target}`);
    clear(fillerShapes);
    fillerShapes.setAttribute('aria-label', t('filler.shapes', { list: round.shapes.map((shape) => t(`shape.${shape}`)).join(', ') }));
    for (const shape of round.shapes) {
      const graphic = svg('svg', { viewBox: '0 0 100 100', 'aria-hidden': 'true', focusable: 'false', class: 'wp-assoc__shape', 'data-shape': shape });
      graphic.append(SHAPE_SVG[shape]());
      fillerShapes.append(graphic);
    }
  };

  const renderRecall = (s: AssociationState) => {
    const question = s.questions[s.index] as Question;
    const cue = cueOf(s, question);
    recallEl.dataset.index = String(s.index);
    clear(cueEl);
    cueEl.dataset.item = cue;
    cueEl.append(card(cue));
    clear(optionsEl);
    question.options.forEach((id, i) => {
      optionsEl.append(
        h(
          'button',
          {
            type: 'button',
            class: 'wp-assoc__option',
            'data-testid': `as-option-${i}`,
            'data-item': id,
            'aria-label': t('option.label', { n: i + 1, item: nameOf(id) }),
            tabindex: i === 0 ? 0 : -1,
            onclick: () => onAnswer(id)
          },
          h('span', { class: 'wp-assoc__num', 'aria-hidden': 'true' }, String(i + 1)),
          h('span', { class: 'wp-assoc__emoji', 'aria-hidden': 'true' }, emojiOf(id)),
          h('span', { class: 'wp-assoc__name', 'aria-hidden': 'true' }, nameOf(id))
        )
      );
    });
    recallKeys.textContent = t('recall.keys', { max: question.options.length });
  };

  const renderSummary = (s: AssociationState) => {
    clear(summaryEl);
    if (s.phase !== 'finished') return;
    const r = score(s);
    const chosen = answersByPair(s);
    const rows = s.pairs.map(([a, b], i) => {
      const question = s.questions.find((q) => q.pair === i) as Question;
      const answer = chosen[i];
      const recalled = answer === answerOf(s, question);
      const note = (s.notes[i] ?? '').trim();
      return h(
        'li',
        { class: 'wp-assoc__row', 'data-testid': `as-summary-pair-${i}`, 'data-recalled': String(recalled) },
        h('span', { class: 'wp-assoc__mark', 'aria-hidden': 'true' }, recalled ? '✓' : '✗'),
        h(
          'div',
          { class: 'wp-assoc__row-body' },
          h('p', { class: 'wp-assoc__row-pair' }, `${emojiOf(a)} ${emojiOf(b)}`, ' ', h('span', {}, t('learn.pair', { a: nameOf(a), b: nameOf(b) }))),
          h('p', {}, recalled ? t('summary.recalled') : t('summary.chosen', { item: answer ? nameOf(answer) : '' })),
          note && h('p', { class: 'wp-assoc__row-note' }, t('summary.note', { note }))
        )
      );
    });
    append(
      summaryEl,
      h('p', { class: 'wp-assoc__score', 'data-testid': 'as-score' }, t('summary.score', { correct: r.correct, total: r.total })),
      r.fillerTotal > 0 && h('p', { class: 'wp-assoc__muted' }, t('summary.filler', { correct: r.fillerCorrect, total: r.fillerTotal })),
      h('h3', { class: 'wp-assoc__heading' }, t('summary.heading')),
      h('ul', { class: 'wp-assoc__rows' }, ...rows),
      h('h3', { class: 'wp-assoc__heading' }, t('about.heading')),
      h('p', {}, t('about.imagery')),
      h('p', {}, t('about.uses')),
      h('p', { class: 'wp-assoc__muted' }, t('summary.practice'))
    );
  };

  const statusText = (s: AssociationState): string => {
    switch (s.phase) {
      case 'learn':
        return t('learn.progress', { n: s.index + 1, total: s.pairs.length });
      case 'filler':
        return t('filler.progress', { n: s.index + 1, total: s.fillers.length });
      case 'recall':
        return t('recall.progress', { n: s.index + 1, total: s.questions.length });
      default:
        return t('result.completed');
    }
  };

  const update = () => {
    if (!state) return;
    const s = state;
    learnEl.hidden = s.phase !== 'learn';
    fillerEl.hidden = s.phase !== 'filler';
    recallEl.hidden = s.phase !== 'recall';
    summaryEl.hidden = s.phase !== 'finished';
    namesLabel.hidden = s.phase === 'filler' || s.phase === 'finished';
    namesBox.checked = showNames;
    container.classList.toggle('wp-assoc--no-names', !showNames);
    statusEl.textContent = statusText(s);
    if (s.phase === 'learn') renderLearn(s);
    else if (s.phase === 'filler') renderFiller(s);
    else if (s.phase === 'recall') renderRecall(s);
    renderSummary(s);
  };

  /** Announces the new step and moves focus to its main control (only if focus was in the game). */
  const afterStep = (hadFocus: boolean) => {
    if (!state) return;
    const s = state;
    if (s.phase === 'learn') {
      const [a, b] = s.pairs[s.index] as [string, string];
      announce(live, `${statusText(s)}: ${t('learn.pair', { a: nameOf(a), b: nameOf(b) })}`);
      if (hadFocus && document.activeElement !== noteInput) nextBtn.focus();
    } else if (s.phase === 'filler') {
      announce(live, `${statusText(s)}: ${fillerQuestion.textContent ?? ''}`);
      if (hadFocus) countButtons[0]?.focus();
    } else if (s.phase === 'recall') {
      announce(live, `${statusText(s)}: ${t('recall.cue', { item: nameOf(cueOf(s, s.questions[s.index] as Question)) })}`);
      if (hadFocus) optionButtons()[0]?.focus();
    } else {
      const r = score(s);
      announce(live, `${t('result.completed')} ${t('summary.score', { correct: r.correct, total: r.total })}`);
      if (hadFocus) summaryEl.focus();
    }
  };

  const apply = (next: AssociationState) => {
    if (!state || next === state) return false;
    const hadFocus = focusInside();
    state = next;
    context.requestSave();
    update();
    afterStep(hadFocus);
    return true;
  };

  // --- player actions ---
  const onNote = () => {
    if (!state) return;
    const next = setNote(state, noteInput.value);
    if (next === state) return;
    state = next;
    context.requestSave();
  };
  const onNext = () => {
    if (state) apply(nextPair(state));
  };
  const onBack = () => {
    if (state) apply(previousPair(state));
  };
  const onCount = (count: number) => {
    if (state) apply(answerFiller(state, count));
  };
  const onAnswer = (id: string) => {
    if (!state || state.phase !== 'recall') return;
    const next = answerQuestion(state, id);
    if (apply(next) && next.phase === 'finished') {
      const r = score(next);
      context.finished({ outcome: 'completed', stats: { correct: r.correct, total: r.total } });
    }
  };

  /** Arrow keys / Home / End move between the answer options (roving tabindex, RTL-aware). */
  const onOptionsKey = (event: KeyboardEvent) => {
    const buttons = optionButtons();
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    const rtl = t.direction === 'rtl';
    const deltas: Record<string, number> = {
      ArrowUp: -1,
      ArrowDown: 1,
      ArrowLeft: rtl ? 1 : -1,
      ArrowRight: rtl ? -1 : 1,
      Home: -index,
      End: buttons.length - 1 - index
    };
    const delta = deltas[event.key];
    if (delta === undefined) return;
    const target = buttons[(index + delta + buttons.length) % buttons.length] as HTMLButtonElement;
    event.preventDefault();
    for (const button of buttons) button.tabIndex = -1;
    target.tabIndex = 0;
    target.focus();
  };
  optionsEl.addEventListener('keydown', onOptionsKey);

  /** Number keys choose a count (break) or an option (recall) directly. */
  const onKeyDown = (event: KeyboardEvent) => {
    if (!state || event.repeat || event.altKey || event.ctrlKey || event.metaKey || isTextEntry(event.target)) return;
    const target = event.target as Node | null;
    // Only from the page body or from inside the game, never from the host's controls.
    if (target && target !== document.body && target !== document.documentElement && !container.contains(target)) return;
    const digit = digitOf(event);
    if (digit === undefined) return;
    if (state.phase === 'filler' && digit <= FILLER_MAX_COUNT) {
      event.preventDefault();
      onCount(digit);
    } else if (state.phase === 'recall') {
      const id = (state.questions[state.index] as Question).options[digit - 1];
      if (id === undefined) return;
      event.preventDefault();
      onAnswer(id);
    }
  };
  document.addEventListener('keydown', onKeyDown);

  const mount = () => {
    if (container.parentElement !== root) {
      clear(root);
      root.append(container);
    }
    noteInput.value = '';
    update();
  };

  const begin = (seed: number, difficulty: Difficulty) => {
    state = newRound(seed, difficulty);
    mount();
    context.requestSave();
  };

  return {
    newGame(options: NewGameOptions) {
      begin(options.seed, toDifficulty(options.difficulty));
    },
    restore(saved: AssociationState) {
      // A finished round shows its summary again; finished() is not repeated.
      state = clone(saved);
      mount();
    },
    serialize() {
      if (!state) throw new Error('No game in progress');
      return clone(state);
    },
    pause() {
      // Nothing runs on its own; the round simply waits.
    },
    resume() {},
    reset() {
      if (state) begin(state.seed, state.difficulty);
    },
    dispose() {
      document.removeEventListener('keydown', onKeyDown);
      optionsEl.removeEventListener('keydown', onOptionsKey);
      clear(root);
      state = undefined;
    }
  };
}
