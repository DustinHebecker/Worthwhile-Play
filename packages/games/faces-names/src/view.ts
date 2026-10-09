import './styles.css';
import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, append, clear, h } from '@wp/ui';
import { faceSvg, VIEW_BOX } from './face-svg';
import { namesFor } from './names';
import {
  answer,
  correctOption,
  describeFace,
  featurePart,
  hasHint,
  isAnswered,
  newRound,
  nextPerson,
  nextQuestion,
  NOTE_MAX,
  previousPerson,
  QUESTION_TYPES,
  resultsByPerson,
  score,
  setNote,
  showHint,
  standoutOptions,
  toDifficulty,
  toggleStandout,
  type DescriptionPart,
  type Difficulty,
  type Face,
  type FacesNamesState,
  type Feature,
  type Person,
  type Question
} from './rules';

const SVG_NS = 'http://www.w3.org/2000/svg';
let instanceCount = 0;

const isTextEntry = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/** Digit 1–9 from the main row or the number pad, else undefined. */
const digitOf = (event: KeyboardEvent): number | undefined => {
  const match = /^(?:Digit|Numpad)([1-9])$/.exec(event.code) ?? /^([1-9])$/.exec(event.key);
  return match ? Number(match[1]) : undefined;
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** The portrait as an inline SVG (decorative: the surrounding element carries the description). */
function portrait(face: Face, className: string): SVGSVGElement {
  const el = document.createElementNS(SVG_NS, 'svg');
  el.setAttribute('viewBox', VIEW_BOX);
  el.setAttribute('class', className);
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('focusable', 'false');
  for (const node of faceSvg(face)) {
    const child = document.createElementNS(SVG_NS, node.tag);
    for (const [name, value] of Object.entries(node.attrs)) child.setAttribute(name, String(value));
    el.append(child);
  }
  return el;
}

/**
 * Self-paced throughout: no timers. Every step (next/previous person, feature choice, note edit, hint,
 * answer, next question) is saved; a session closed at any point reopens at the same person or question,
 * an answered question still showing its feedback.
 */
export function createFacesNames(context: GameContext): GameInstance<FacesNamesState> {
  const { root, t } = context;
  const uid = `wp-fn-${++instanceCount}`;
  let state: FacesNamesState | undefined;

  const phrase = (part: DescriptionPart): string =>
    part.colour ? t('desc.hair', { style: t(part.key), colour: t(part.colour) }) : t(part.key);
  /** All features, joined by the locale's list separator (no "and": every part has the same weight). */
  const describe = (face: Face): string => describeFace(face).map(phrase).join(t('desc.separator'));
  const featureText = (face: Face, feature: Feature): string => {
    const part = featurePart(face, feature);
    return part ? phrase(part) : '';
  };
  const personOf = (s: FacesNamesState, i: number): Person => s.people[i] as Person;

  const statusEl = h('p', { class: 'wp-status wp-fn__status', 'data-testid': 'fn-status' });

  // --- study ---
  const studyFace = h('div', { class: 'wp-fn__portrait', role: 'img', 'data-testid': 'fn-face' });
  const studyName = h('p', { class: 'wp-fn__name', 'data-testid': 'fn-name' });
  const studyFacts = h('div', { class: 'wp-fn__facts', 'data-testid': 'fn-facts' });
  const standoutEl = h('div', { class: 'wp-fn__chips', role: 'group', 'aria-labelledby': `${uid}-standout`, 'data-testid': 'fn-standout' });
  const noteInput = h('input', {
    type: 'text',
    id: `${uid}-note`,
    class: 'wp-fn__note',
    'data-testid': 'fn-note',
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
  const backBtn = h('button', { type: 'button', 'data-testid': 'fn-back', onclick: () => onBack() }, t('action.back'));
  const nextBtn = h('button', { type: 'button', class: 'primary', 'data-testid': 'fn-next', 'data-autofocus': true, onclick: () => onNext() });
  const studyEl = h(
    'section',
    { class: 'wp-fn__phase', 'data-testid': 'fn-study' },
    h('p', { class: 'wp-fn__tip' }, t('study.tip')),
    h('div', { class: 'wp-fn__card' }, studyFace, h('div', { class: 'wp-fn__info' }, studyName, studyFacts)),
    h('div', { class: 'wp-fn__field' }, h('p', { class: 'wp-fn__label', id: `${uid}-standout` }, t('standout.question')), standoutEl),
    h(
      'div',
      { class: 'wp-fn__field' },
      h('label', { class: 'wp-fn__label', for: `${uid}-note` }, t('note.label')),
      noteInput,
      h('p', { class: 'wp-fn__muted', id: `${uid}-hint` }, t('note.hint'))
    ),
    h('div', { class: 'wp-fn__nav' }, backBtn, nextBtn)
  );

  // --- test ---
  const questionEl = h('p', { class: 'wp-fn__question', 'data-testid': 'fn-question' });
  const cueEl = h('div', { class: 'wp-fn__cue', 'data-testid': 'fn-cue' });
  const optionsEl = h('div', { class: 'wp-fn__options', role: 'group', 'data-testid': 'fn-options' });
  const hintBtn = h('button', { type: 'button', class: 'wp-fn__hint-btn', 'data-testid': 'fn-hint', onclick: () => onHint() }, t('action.hint'));
  const hintText = h('div', { class: 'wp-fn__hint', 'data-testid': 'fn-hint-text' });
  const feedbackEl = h('p', { class: 'wp-fn__feedback', 'data-testid': 'fn-feedback' });
  const continueBtn = h('button', { type: 'button', class: 'primary', 'data-testid': 'fn-continue', onclick: () => onContinue() });
  const keysEl = h('p', { class: 'wp-fn__muted' });
  const testEl = h(
    'section',
    { class: 'wp-fn__phase', 'data-testid': 'fn-test' },
    questionEl,
    cueEl,
    optionsEl,
    hintBtn,
    hintText,
    feedbackEl,
    continueBtn,
    keysEl
  );

  const summaryEl = h('section', { class: 'wp-fn__phase wp-fn__summary', 'data-testid': 'fn-summary', tabindex: -1 });
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status' });
  const container = h('div', { class: 'wp-fn', dir: t.direction }, statusEl, studyEl, testEl, summaryEl, live);

  const focusInside = () => container.contains(document.activeElement);
  const optionButtons = (): HTMLButtonElement[] => [...optionsEl.querySelectorAll<HTMLButtonElement>('button')];

  const renderStudy = (s: FacesNamesState) => {
    const person = personOf(s, s.index);
    clear(studyFace);
    studyFace.dataset.person = String(s.index);
    studyFace.setAttribute('aria-label', t('face.shown', { description: describe(person.face) }));
    studyFace.append(portrait(person.face, 'wp-fn__svg'));
    studyName.textContent = person.name;
    clear(studyFacts);
    append(
      studyFacts,
      h('p', {}, t('card.age', { age: person.age })),
      h('p', { 'data-testid': 'fn-job' }, t('card.job', { job: t(`job.${person.job}`) })),
      h('p', { 'data-testid': 'fn-context' }, t(`ctx.${person.context}`))
    );
    clear(standoutEl);
    for (const feature of standoutOptions(s.people, s.index)) {
      const pressed = s.standout[s.index] === feature;
      standoutEl.append(
        h(
          'button',
          {
            type: 'button',
            class: 'wp-fn__chip',
            'data-testid': `fn-standout-${feature}`,
            'aria-pressed': String(pressed),
            onclick: () => onStandout(feature)
          },
          h('span', { class: 'wp-fn__chip-mark', 'aria-hidden': 'true' }, pressed ? '✓' : ''),
          featureText(person.face, feature)
        )
      );
    }
    if (noteInput.value !== s.notes[s.index]) noteInput.value = s.notes[s.index] ?? '';
    backBtn.disabled = s.index === 0;
    nextBtn.textContent = t(s.index === s.people.length - 1 ? 'action.start' : 'action.next');
  };

  const questionText = (s: FacesNamesState, q: Question): string =>
    q.type === 'face' ? t('question.face', { name: personOf(s, q.person).name }) : t(`question.${q.type}`);

  /** Text of an option (for feedback and labels). */
  const optionText = (s: FacesNamesState, q: Question, position: number): string => {
    if (q.type === 'job') return t(`job.${q.options[position] as string}`);
    if (q.type === 'name') return personOf(s, q.options[position] as number).name;
    return t('feedback.faceNumber', { n: position + 1 });
  };

  const renderTest = (s: FacesNamesState) => {
    const q = s.questions[s.index] as Question;
    const answered = isAnswered(s);
    const chosen = s.answers[s.index];
    const correct = correctOption(s.people, q);
    testEl.dataset.index = String(s.index);
    testEl.dataset.type = q.type;
    questionEl.textContent = questionText(s, q);
    clear(cueEl);
    cueEl.dataset.person = String(q.person);
    if (q.type === 'face') {
      cueEl.className = 'wp-fn__cue wp-fn__cue--name';
      cueEl.removeAttribute('role');
      cueEl.removeAttribute('aria-label');
      cueEl.textContent = personOf(s, q.person).name;
    } else {
      const face = personOf(s, q.person).face;
      cueEl.className = 'wp-fn__cue wp-fn__portrait';
      cueEl.setAttribute('role', 'img');
      cueEl.setAttribute('aria-label', t('face.shown', { description: describe(face) }));
      cueEl.append(portrait(face, 'wp-fn__svg'));
    }
    clear(optionsEl);
    optionsEl.className = `wp-fn__options${q.type === 'face' ? ' wp-fn__options--faces' : ''}`;
    optionsEl.setAttribute('aria-label', questionText(s, q));
    q.options.forEach((value, i) => {
      const result = !answered ? undefined : i === correct ? 'correct' : i === chosen ? 'wrong' : undefined;
      const label =
        q.type === 'face'
          ? t('face.option', { n: i + 1, description: describe(personOf(s, value as number).face) })
          : t('option.label', { n: i + 1, item: optionText(s, q, i) });
      const content =
        q.type === 'face' ? portrait(personOf(s, value as number).face, 'wp-fn__svg') : h('span', { class: 'wp-fn__option-text' }, optionText(s, q, i));
      optionsEl.append(
        h(
          'button',
          {
            type: 'button',
            class: 'wp-fn__option',
            'data-testid': `fn-option-${i}`,
            'data-value': String(value),
            'data-result': result,
            'data-chosen': answered && i === chosen ? 'true' : undefined,
            'aria-label': label,
            'aria-disabled': answered ? 'true' : undefined,
            tabindex: i === 0 ? 0 : -1,
            onclick: () => onAnswer(i)
          },
          h('span', { class: 'wp-fn__num', 'aria-hidden': 'true' }, String(i + 1)),
          content,
          h('span', { class: 'wp-fn__mark', 'aria-hidden': 'true' }, result === 'correct' ? '✓' : result === 'wrong' ? '✗' : '')
        )
      );
    });
    const shown = s.hints[s.index] === true;
    hintBtn.hidden = answered || shown || !hasHint(s);
    clear(hintText);
    hintText.hidden = !shown;
    if (shown) {
      const note = (s.notes[q.person] ?? '').trim();
      const feature = s.standout[q.person];
      append(
        hintText,
        feature && h('p', {}, t('hint.standout', { feature: featureText(personOf(s, q.person).face, feature) })),
        note && h('p', {}, t('hint.note', { note }))
      );
    }
    feedbackEl.hidden = !answered;
    feedbackEl.dataset.result = answered ? (chosen === correct ? 'correct' : 'wrong') : '';
    feedbackEl.textContent = !answered
      ? ''
      : chosen === correct
        ? `✓ ${t('feedback.correct', { answer: optionText(s, q, correct) })}`
        : `✗ ${t('feedback.wrong', { answer: optionText(s, q, correct) })}`;
    continueBtn.hidden = !answered;
    continueBtn.textContent = t(s.index === s.questions.length - 1 ? 'action.summary' : 'action.continue');
    keysEl.hidden = answered;
    keysEl.textContent = t('test.keys', { max: q.options.length });
  };

  const renderSummary = (s: FacesNamesState) => {
    clear(summaryEl);
    if (s.phase !== 'finished') return;
    const r = score(s);
    const byPerson = resultsByPerson(s);
    const rows = s.people.map((person, i) => {
      const result = byPerson[i] as ReturnType<typeof resultsByPerson>[number];
      const note = (s.notes[i] ?? '').trim();
      const feature = s.standout[i];
      return h(
        'li',
        { class: 'wp-fn__row', 'data-testid': `fn-summary-person-${i}` },
        h('div', { class: 'wp-fn__row-face', role: 'img', 'aria-label': t('face.shown', { description: describe(person.face) }) }, portrait(person.face, 'wp-fn__svg')),
        h(
          'div',
          { class: 'wp-fn__row-body' },
          h('p', { class: 'wp-fn__row-name' }, t('summary.person', { name: person.name, age: person.age })),
          h('p', {}, t('card.job', { job: t(`job.${person.job}`) }), ' · ', t(`ctx.${person.context}`)),
          h(
            'ul',
            { class: 'wp-fn__marks' },
            ...QUESTION_TYPES.map((type) => {
              const ok = result.results[type] === true;
              return h(
                'li',
                { 'data-result': ok ? 'correct' : 'wrong', 'data-testid': `fn-summary-${i}-${type}` },
                h('span', { class: 'wp-fn__mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'),
                ' ',
                t(ok ? 'summary.correct' : 'summary.incorrect', { type: t(`summary.type.${type}`) })
              );
            })
          ),
          feature && h('p', { class: 'wp-fn__row-note' }, t('hint.standout', { feature: featureText(person.face, feature) })),
          note && h('p', { class: 'wp-fn__row-note' }, t('hint.note', { note }))
        )
      );
    });
    append(
      summaryEl,
      h('p', { class: 'wp-fn__score', 'data-testid': 'fn-score' }, t('summary.score', { correct: r.correct, total: r.total })),
      r.hints > 0 && h('p', { class: 'wp-fn__muted', 'data-testid': 'fn-hints-used' }, t('summary.hints', { count: r.hints })),
      h('h3', { class: 'wp-fn__heading' }, t('summary.heading')),
      h('ul', { class: 'wp-fn__rows' }, ...rows),
      h('h3', { class: 'wp-fn__heading' }, t('about.heading')),
      h('p', {}, t('about.text')),
      h('p', { class: 'wp-fn__muted' }, t('summary.practice'))
    );
  };

  const statusText = (s: FacesNamesState): string => {
    if (s.phase === 'study') return t('study.progress', { n: s.index + 1, total: s.people.length });
    if (s.phase === 'test') return t('test.progress', { n: s.index + 1, total: s.questions.length });
    return t('result.completed');
  };

  const update = () => {
    if (!state) return;
    const s = state;
    studyEl.hidden = s.phase !== 'study';
    testEl.hidden = s.phase !== 'test';
    summaryEl.hidden = s.phase !== 'finished';
    container.dataset.phase = s.phase;
    statusEl.textContent = statusText(s);
    if (s.phase === 'study') renderStudy(s);
    else if (s.phase === 'test') renderTest(s);
    renderSummary(s);
  };

  /** Announces the new step and moves focus to its main control (only if focus was in the game). */
  const afterStep = (hadFocus: boolean, focusTarget?: HTMLElement) => {
    if (!state) return;
    const s = state;
    if (s.phase === 'study') {
      const person = personOf(s, s.index);
      announce(live, `${statusText(s)}: ${person.name}`);
      if (hadFocus && !focusInside()) nextBtn.focus();
    } else if (s.phase === 'test') {
      const q = s.questions[s.index] as Question;
      if (isAnswered(s)) {
        announce(live, feedbackEl.textContent ?? '');
        if (hadFocus) continueBtn.focus();
      } else {
        announce(live, `${statusText(s)}: ${questionText(s, q)}`);
        if (hadFocus) (focusTarget ?? optionButtons()[0])?.focus();
      }
    } else {
      const r = score(s);
      announce(live, `${t('result.completed')} ${t('summary.score', { correct: r.correct, total: r.total })}`);
      if (hadFocus) summaryEl.focus();
    }
  };

  const apply = (next: FacesNamesState, focusTarget?: HTMLElement): boolean => {
    if (!state || next === state) return false;
    const hadFocus = focusInside();
    state = next;
    context.requestSave();
    update();
    afterStep(hadFocus, focusTarget);
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
    if (state) apply(nextPerson(state));
  };
  const onBack = () => {
    if (state) apply(previousPerson(state));
  };
  const onStandout = (feature: Feature) => {
    if (!state) return;
    const next = toggleStandout(state, feature);
    if (next === state) return;
    state = next;
    context.requestSave();
    update();
    standoutEl.querySelector<HTMLElement>(`[data-testid="fn-standout-${feature}"]`)?.focus();
  };
  const onHint = () => {
    if (!state) return;
    const hadFocus = focusInside();
    const next = showHint(state);
    if (next === state) return;
    state = next;
    context.requestSave();
    update();
    announce(live, hintText.textContent ?? '');
    if (hadFocus) optionButtons()[0]?.focus();
  };
  const onAnswer = (position: number) => {
    if (state) apply(answer(state, position));
  };
  const onContinue = () => {
    if (!state) return;
    const next = nextQuestion(state);
    if (apply(next) && next.phase === 'finished') {
      const r = score(next);
      context.finished({ outcome: 'completed', stats: { correct: r.correct, total: r.total, hints: r.hints } });
    }
  };

  /** Arrow keys / Home / End move between the options (roving tabindex, RTL-aware). */
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

  /** Number keys choose an option directly while a question is open. */
  const onKeyDown = (event: KeyboardEvent) => {
    if (!state || state.phase !== 'test' || isAnswered(state)) return;
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || isTextEntry(event.target)) return;
    const target = event.target as Node | null;
    // Only from the page body or from inside the game, never from the host's controls.
    if (target && target !== document.body && target !== document.documentElement && !container.contains(target)) return;
    const digit = digitOf(event);
    const q = state.questions[state.index] as Question;
    if (digit === undefined || digit > q.options.length) return;
    event.preventDefault();
    onAnswer(digit - 1);
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
    state = newRound(seed, difficulty, namesFor(t.locale));
    mount();
    context.requestSave();
  };

  return {
    newGame(options: NewGameOptions) {
      begin(options.seed, toDifficulty(options.difficulty));
    },
    restore(saved: FacesNamesState) {
      // A finished session shows its summary again; finished() is not repeated.
      state = clone(saved);
      mount();
    },
    serialize() {
      if (!state) throw new Error('No game in progress');
      return clone(state);
    },
    pause() {
      // Nothing runs on its own; the session simply waits.
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
