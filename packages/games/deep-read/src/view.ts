import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, append, clear, h } from '@wp/ui';
import { contentFor } from './content';
import type { OptionId, OptionText, QuestionStructure, TextContent } from './content/types';
import {
  SELF_CHECK_ITEMS,
  SUMMARY_MAX,
  answer,
  correctCount,
  createInitialState,
  currentQuestion,
  finish,
  finishReading,
  isAnswered,
  isCorrect,
  lookedBackCount,
  next,
  questionCount,
  restart,
  resultStats,
  selfCheckCount,
  setSummary,
  setTextOpen,
  skipSummary,
  submitSummary,
  textOf,
  toDifficulty,
  toggleSelfCheck,
  type DeepReadState
} from './rules';
import './styles.css';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const TEXT_SIZES = 3;
const SIZE_KEY = 'textSize';

export function createDeepRead(context: GameContext): GameInstance<DeepReadState> {
  const { t } = context;
  const content = contentFor(t.locale);
  let state = createInitialState(0);
  let paused = false;
  /** Option picked but not yet checked (view-only; a reload simply asks again). */
  let selected: string | null = null;
  /** Transient notice (e.g. "choose an answer first"). */
  let notice = '';

  const readSize = (): number => {
    const value = context.preferences?.get(SIZE_KEY);
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < TEXT_SIZES ? value : 0;
  };
  let textSize = readSize();

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'dr-live' });
  const board = h('div', { class: 'dr-board' });
  const container = h('div', { class: 'wp-deep-read', dir: t.direction, lang: t.locale }, board, live);

  const text = (): TextContent => content[state.textId] as TextContent;
  const optionText = (question: QuestionStructure, id: string): OptionText =>
    (text().questions[question.id]?.[id as OptionId] ?? ['', '']) as OptionText;

  // --- State changes -----------------------------------------------------------------------

  const commit = (nextState: DeepReadState, message?: string, focus?: string) => {
    if (nextState === state) return false;
    state = nextState;
    notice = '';
    render();
    context.requestSave();
    if (message) announce(live, message);
    if (focus) board.querySelector<HTMLElement>(`[data-focus="${focus}"]`)?.focus();
    return true;
  };

  const say = (message: string) => {
    notice = message;
    render();
    announce(live, message);
  };

  const progress = () => t('q.progress', { n: state.cursor + 1, total: questionCount(state) });

  const endGame = (nextState: DeepReadState) => {
    if (commit(nextState, t('done.score', { correct: correctCount(nextState), total: questionCount(nextState) }), 'done')) {
      context.finished({ outcome: 'completed', stats: resultStats(state) });
    }
  };

  const check = () => {
    if (paused) return;
    if (selected === null) {
      say(t('q.choose'));
      board.querySelector<HTMLElement>('input[type="radio"]')?.focus();
      return;
    }
    const nextState = answer(state, selected);
    if (nextState === state) return;
    const index = state.cursor;
    const right = isCorrect(nextState, index);
    const question = currentQuestion(nextState);
    let message = t(right ? 'feedback.correct' : 'feedback.incorrect');
    if (!right) message += ` ${t('feedback.best', { answer: optionText(question, question.gold)[0] })}`;
    commit(nextState, message, 'feedback');
  };

  const goNext = () => {
    if (paused) return;
    const nextState = next(state);
    selected = null;
    if (nextState.phase === 'questions') commit(nextState, `${t('q.progress', { n: nextState.cursor + 1, total: questionCount(nextState) })}`, 'question');
    else commit(nextState, t('summary.heading'), 'summary');
  };

  const showParagraph = (n: number) => {
    if (paused) return;
    if (!state.textOpen) commit(setTextOpen(state, true));
    const target = board.querySelector<HTMLElement>(`[data-para="${n}"]`);
    target?.focus();
    target?.scrollIntoView?.({ block: 'center', behavior: context.reducedMotion ? 'auto' : 'smooth' });
  };

  const setSize = (size: number) => {
    textSize = Math.max(0, Math.min(TEXT_SIZES - 1, size));
    context.preferences?.set(SIZE_KEY, textSize);
    render();
  };

  // --- Rendering ---------------------------------------------------------------------------

  const focusKeyOf = (el: Element | null) => (el instanceof HTMLElement && container.contains(el) ? (el.dataset.focus ?? null) : null);

  const render = () => {
    const previousFocus = focusKeyOf(document.activeElement);
    clear(board);
    container.dataset.phase = state.phase;
    container.className = `wp-deep-read dr-size-${textSize}`;
    board.append(renderHeader());
    if (state.phase === 'reading') board.append(renderReading());
    else if (state.phase === 'questions') board.append(...renderQuestions());
    else if (state.phase === 'summary') board.append(renderSummary());
    else if (state.phase === 'compare') board.append(renderCompare());
    else board.append(renderDone());
    if (previousFocus) board.querySelector<HTMLElement>(`[data-focus="${previousFocus}"]`)?.focus();
  };

  const renderHeader = () =>
    h('div', { class: 'dr-header' },
      h('h3', { class: 'dr-title', 'data-testid': 'dr-title', 'data-text': state.textId, tabindex: -1, 'data-focus': 'title', 'data-autofocus': state.phase === 'reading' ? true : undefined }, text().title),
      h('div', { class: 'dr-size', role: 'group', 'aria-label': t('text.size') },
        h('button', { type: 'button', class: 'dr-size-btn', 'aria-label': t('text.smaller'), title: t('text.smaller'), disabled: textSize === 0, 'data-testid': 'dr-smaller', 'data-focus': 'smaller', onclick: () => setSize(textSize - 1) },
          h('span', { 'aria-hidden': 'true', class: 'dr-a-small' }, 'A'), h('span', { 'aria-hidden': 'true' }, '−')),
        h('button', { type: 'button', class: 'dr-size-btn', 'aria-label': t('text.larger'), title: t('text.larger'), disabled: textSize === TEXT_SIZES - 1, 'data-testid': 'dr-larger', 'data-focus': 'larger', onclick: () => setSize(textSize + 1) },
          h('span', { 'aria-hidden': 'true', class: 'dr-a-large' }, 'A'), h('span', { 'aria-hidden': 'true' }, '+'))
      )
    );

  const renderArticle = (support?: number) =>
    h('article', { class: 'dr-text', 'data-testid': 'dr-text', 'aria-label': text().title },
      ...text().paragraphs.map((paragraph, i) => {
        const n = i + 1;
        const isSupport = support === n;
        return h('p', {
          class: `dr-para${isSupport ? ' is-support' : ''}`,
          'data-testid': `dr-para-${n}`,
          'data-para': n,
          'data-support': isSupport ? 'true' : undefined,
          tabindex: -1
        },
          h('span', { class: 'dr-pnum', 'aria-hidden': 'true' }, isSupport ? `◆ ${n}` : String(n)),
          h('span', { class: 'sr-only' }, `${t('text.paragraph', { n })}: `),
          paragraph
        );
      })
    );

  const renderReading = () =>
    h('section', { class: 'dr-reading', 'data-testid': 'dr-reading' },
      h('p', { class: 'wp-muted dr-intro' }, t('read.intro')),
      renderArticle(),
      h('div', { class: 'wp-row dr-actions' },
        h('button', { type: 'button', class: 'primary', 'data-testid': 'dr-done-reading', 'data-focus': 'done-reading', onclick: () => {
          if (!paused) commit(finishReading(state), progress(), 'question');
        } }, t('read.done'))
      )
    );

  const renderQuestions = (): HTMLElement[] => {
    const question = currentQuestion(state);
    const answered = isAnswered(state);
    const parts: HTMLElement[] = [];
    parts.push(
      h('div', { class: 'wp-row dr-toggle' },
        h('button', {
          type: 'button',
          'aria-expanded': state.textOpen ? 'true' : 'false',
          'data-testid': 'dr-toggle-text',
          'data-focus': 'toggle-text',
          onclick: () => {
            if (!paused) commit(setTextOpen(state, !state.textOpen));
          }
        }, t(state.textOpen ? 'text.hide' : 'text.show'))
      )
    );
    if (state.textOpen) {
      parts.push(h('p', { class: 'dr-open-note wp-muted', 'data-testid': 'dr-open-note' }, t('text.openNote')));
      parts.push(renderArticle(answered ? question.support : undefined));
    }
    parts.push(renderQuestion(question, answered));
    return parts;
  };

  const typeTag = (question: QuestionStructure) => h('span', { class: 'dr-type', 'data-testid': 'dr-type', 'data-type': question.type }, t(`type.${question.type}`));

  const renderQuestion = (question: QuestionStructure, answered: boolean) => {
    const prompt = text().questions[question.id]?.q ?? '';
    const section = h('section', { class: 'dr-question', 'data-testid': 'dr-question', 'data-question': question.id, 'data-index': state.cursor, 'aria-labelledby': 'dr-q-heading' },
      h('p', { class: 'wp-row dr-q-meta' }, h('span', { class: 'dr-progress', 'data-testid': 'dr-progress' }, progress()), typeTag(question)),
      h('h4', { id: 'dr-q-heading', class: 'dr-prompt', tabindex: -1, 'data-focus': 'question', 'data-autofocus': true }, prompt)
    );
    if (!answered) {
      const form = h('form', { class: 'dr-form', novalidate: true });
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        check();
      });
      const fieldset = h('fieldset', { class: 'dr-options' }, h('legend', { class: 'sr-only' }, prompt));
      for (const id of question.options) {
        const radio = h('input', { type: 'radio', name: 'dr-option', value: id, checked: selected === id, 'data-testid': `dr-radio-${id}`, 'data-focus': `radio-${id}` });
        radio.addEventListener('change', () => {
          if (paused) return;
          selected = id;
        });
        fieldset.append(h('label', { class: 'dr-option', 'data-testid': `dr-option-${id}`, 'data-option': id }, radio, h('span', {}, optionText(question, id)[0])));
      }
      append(form,
        fieldset,
        h('p', { class: 'dr-notice', 'data-testid': 'dr-notice', role: 'status', hidden: notice === '' }, notice),
        h('div', { class: 'wp-row dr-actions' }, h('button', { type: 'submit', class: 'primary', 'data-testid': 'dr-check', 'data-focus': 'check' }, t('common.check')))
      );
      section.append(form);
      return section;
    }
    section.append(renderFeedback(question));
    return section;
  };

  const renderFeedback = (question: QuestionStructure) => {
    const index = state.cursor;
    const chosen = state.answers[index] as string;
    const right = isCorrect(state, index);
    const isLast = index + 1 >= questionCount(state);
    const list = h('ul', { class: 'dr-explained' });
    for (const id of question.options) {
      const [label, why] = optionText(question, id);
      const isGold = id === question.gold;
      const isChosen = id === chosen;
      const marks: string[] = [];
      if (isChosen) marks.push(t('option.yours'));
      if (isGold) marks.push(t('option.best'));
      list.append(
        h('li', {
          class: `dr-explain${isGold ? ' is-gold' : ''}${isChosen ? ' is-chosen' : ''}`,
          'data-testid': `dr-explain-${id}`,
          'data-gold': isGold ? 'true' : 'false',
          'data-chosen': isChosen ? 'true' : 'false'
        },
          h('span', { class: 'dr-mark', 'aria-hidden': 'true' }, isGold ? '✓' : isChosen ? '✗' : '·'),
          h('div', { class: 'dr-explain-body' },
            marks.length ? h('span', { class: 'dr-tags' }, marks.join(' · ')) : null,
            h('span', { class: 'dr-option-text' }, label),
            h('span', { class: 'dr-why' }, why)
          )
        )
      );
    }
    return h('div', { class: 'dr-feedback', 'data-testid': 'dr-feedback', 'data-correct': right ? 'true' : 'false', 'data-answer': chosen },
      h('p', { class: `dr-verdict ${right ? 'is-right' : 'is-wrong'}`, 'data-testid': 'dr-verdict', tabindex: -1, 'data-focus': 'feedback' },
        h('span', { 'aria-hidden': 'true', class: 'dr-verdict-mark' }, right ? '✓' : '✗'), ' ', t(right ? 'feedback.correct' : 'feedback.incorrect')),
      list,
      question.support !== undefined
        ? h('p', { class: 'wp-row dr-see' },
          h('span', { 'data-testid': 'dr-see' }, t('feedback.see', { n: question.support })),
          h('button', { type: 'button', 'data-testid': 'dr-show-para', 'data-focus': 'show-para', onclick: () => showParagraph(question.support as number) }, t('feedback.show', { n: question.support })))
        : null,
      state.lookedBack[index] ? h('p', { class: 'wp-muted dr-looked', 'data-testid': 'dr-looked-back' }, t('q.lookedBack')) : null,
      h('div', { class: 'wp-row dr-actions' },
        h('button', { type: 'button', class: 'primary', 'data-testid': 'dr-next', 'data-focus': 'next', onclick: goNext }, t(isLast ? 'q.continue' : 'q.next')))
    );
  };

  const renderSummary = () => {
    const counter = h('span', { class: 'wp-muted dr-count', id: 'dr-count', 'data-testid': 'dr-count' }, t('summary.count', { n: state.summary.length, max: SUMMARY_MAX }));
    const field = h('textarea', {
      id: 'dr-summary-field',
      class: 'dr-summary-field',
      rows: 3,
      maxlength: SUMMARY_MAX,
      'aria-describedby': 'dr-count',
      'data-testid': 'dr-summary-field',
      'data-focus': 'summary-field'
    });
    field.value = state.summary;
    field.addEventListener('input', () => {
      if (paused) return;
      const nextState = setSummary(state, field.value);
      if (nextState === state) return;
      state = nextState;
      counter.textContent = t('summary.count', { n: state.summary.length, max: SUMMARY_MAX });
      context.requestSave();
    });
    const form = h('form', { class: 'dr-panel', 'data-testid': 'dr-summary', novalidate: true });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (paused) return;
      const nextState = submitSummary(state);
      if (nextState === state) {
        say(t('summary.empty'));
        board.querySelector<HTMLElement>('[data-focus="summary-field"]')?.focus();
        return;
      }
      commit(nextState, t('compare.model'), 'compare');
    });
    append(form,
      h('h4', { tabindex: -1, 'data-focus': 'summary', 'data-autofocus': true }, t('summary.heading')),
      h('p', { class: 'wp-muted' }, t('summary.intro')),
      h('label', { for: 'dr-summary-field', class: 'dr-label' }, t('summary.label')),
      field,
      counter,
      h('p', { class: 'dr-notice', 'data-testid': 'dr-notice', role: 'status', hidden: notice === '' }, notice),
      h('div', { class: 'wp-row dr-actions' },
        h('button', { type: 'submit', class: 'primary', 'data-testid': 'dr-compare', 'data-focus': 'compare-btn' }, t('summary.compare')),
        h('button', { type: 'button', 'data-testid': 'dr-skip', 'data-focus': 'skip', onclick: () => {
          if (!paused) endGame(skipSummary(state));
        } }, t('summary.skip')))
    );
    return form;
  };

  const sentences = () =>
    h('div', { class: 'dr-sentences' },
      h('div', { class: 'dr-sentence' }, h('h5', {}, t('compare.yours')), h('blockquote', { 'data-testid': 'dr-yours' }, state.summary)),
      h('div', { class: 'dr-sentence' }, h('h5', {}, t('compare.model')), h('blockquote', { 'data-testid': 'dr-model' }, text().summary))
    );

  const renderCompare = () => {
    const list = h('ul', { class: 'dr-checklist' });
    for (let i = 0; i < SELF_CHECK_ITEMS; i++) {
      const box = h('input', { type: 'checkbox', checked: state.selfCheck[i] === true, 'data-testid': `dr-check-${i + 1}`, 'data-focus': `check-${i + 1}` });
      box.addEventListener('change', () => {
        if (!paused) commit(toggleSelfCheck(state, i));
      });
      list.append(h('li', {}, h('label', { class: 'dr-option' }, box, h('span', {}, t(`check.${i + 1}`)))));
    }
    return h('section', { class: 'dr-panel', 'data-testid': 'dr-compare-panel' },
      h('h4', { tabindex: -1, 'data-focus': 'compare', 'data-autofocus': true }, t('summary.heading')),
      sentences(),
      h('fieldset', { class: 'dr-options' }, h('legend', {}, t('compare.check')), list),
      h('p', { class: 'wp-muted' }, t('compare.note')),
      h('div', { class: 'wp-row dr-actions' },
        h('button', { type: 'button', class: 'primary', 'data-testid': 'dr-finish', 'data-focus': 'finish', onclick: () => {
          if (!paused) endGame(finish(state));
        } }, t('compare.finish')))
    );
  };

  const renderDone = () => {
    const total = questionCount(state);
    const questions = textOf(state).questions;
    const list = h('ol', { class: 'dr-review' });
    questions.forEach((question, i) => {
      const right = isCorrect(state, i);
      const chosen = state.answers[i] as string;
      list.append(
        h('li', { class: `dr-review-item ${right ? 'is-right' : 'is-wrong'}`, 'data-testid': `dr-review-${i}`, 'data-correct': right ? 'true' : 'false' },
          h('span', { class: 'dr-mark', 'aria-hidden': 'true' }, right ? '✓' : '✗'),
          h('div', { class: 'dr-explain-body' },
            h('span', { class: 'dr-tags' }, `${t(`type.${question.type}`)} · ${t(right ? 'feedback.correct' : 'feedback.incorrect')}`),
            h('span', { class: 'dr-option-text' }, text().questions[question.id]?.q ?? ''),
            h('span', {}, `${t('option.yours')}: ${optionText(question, chosen)[0]}`, state.lookedBack[i] ? h('span', { class: 'wp-muted' }, ` (${t('q.lookedBack')})`) : null),
            right ? null : h('span', {}, `${t('option.best')}: ${optionText(question, question.gold)[0]}`)
          )
        )
      );
    });
    return h('section', { class: 'dr-panel dr-done', 'data-testid': 'dr-done' },
      h('h4', { tabindex: -1, 'data-focus': 'done', 'data-autofocus': true }, t('done.heading')),
      h('ul', { class: 'dr-stats' },
        h('li', { 'data-testid': 'dr-score', 'data-correct': correctCount(state), 'data-total': total }, t('done.score', { correct: correctCount(state), total })),
        h('li', { 'data-testid': 'dr-looked-count' }, t('done.lookedBack', { n: lookedBackCount(state) })),
        state.summary === ''
          ? h('li', { 'data-testid': 'dr-no-sentence' }, t('done.noSentence'))
          : h('li', { 'data-testid': 'dr-self-count' }, t('done.selfCheck', { n: selfCheckCount(state), total: SELF_CHECK_ITEMS }))
      ),
      state.summary === '' ? null : sentences(),
      h('h5', {}, t('done.answers')),
      list
    );
  };

  // --- GameInstance --------------------------------------------------------------------------

  const mount = () => {
    if (!container.isConnected) context.root.appendChild(container);
    selected = null;
    notice = '';
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      state = createInitialState(options.seed, toDifficulty(options.difficulty));
      mount();
    },
    restore(saved: DeepReadState) {
      state = clone(saved);
      mount();
    },
    serialize: () => clone(state),
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    reset() {
      state = restart(state);
      mount();
      context.requestSave();
    },
    dispose() {
      clear(context.root);
    }
  };
}
