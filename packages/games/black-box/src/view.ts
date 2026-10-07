import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, append, clear, h } from '@wp/ui';
import { bitName, describeRule, formatInput, formatList, formatNumber, formatOutput, inputHeader, parseDigitList, parseInteger } from './format';
import {
  attemptResults,
  canSubmit,
  cancelTest,
  createInitialState,
  evaluate,
  experimentCount,
  familyOf,
  findLogIndex,
  phaseOf,
  ruleOf,
  runExperiment,
  setDraftValue,
  setPrediction,
  startTest,
  submitTest,
  toDifficulty,
  useHint,
  valueBounds,
  type BlackBoxState,
  type Input,
  type Output,
  type Prediction
} from './rules';
import './styles.css';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createBlackBox(context: GameContext): GameInstance<BlackBoxState> {
  const { t } = context;
  let state = createInitialState(0);
  let paused = false;
  /** Transient feedback in the active panel (not part of the logical state). */
  let notice = '';
  /** Log row to highlight after re-running a known input. */
  let highlight = -1;
  /** Experiment fields whose typed text is currently not a valid value. */
  const invalidFields = new Set<number>();

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'bb-live' });
  const board = h('div', { class: 'bb-board' });
  const container = h('div', { class: 'wp-black-box', dir: t.direction, lang: t.locale }, board, live);

  const spec = () => familyOf(state).input;
  const outputKind = () => familyOf(state).output;
  const inputText = (input: Input) => formatInput(spec(), input);
  const outputText = (output: Output) => formatOutput(outputKind(), output);
  const ltr = (text: string, attrs: Record<string, string> = {}) => h('span', { dir: 'ltr', class: 'bb-notation', ...attrs }, text);
  const familyName = () => t(`family.${state.family}`);
  const ruleText = () => {
    const description = describeRule(ruleOf(state));
    return 'formula' in description ? description.formula : t(description.key, description.params);
  };

  // --- State changes -----------------------------------------------------------------------

  const commit = (next: BlackBoxState, message?: string, options: { render?: boolean } = {}) => {
    if (next === state) return false;
    state = next;
    if (options.render !== false) {
      notice = '';
      highlight = -1;
      invalidFields.clear();
      render();
    }
    context.requestSave();
    if (message) announce(live, message);
    return true;
  };

  const say = (message: string) => {
    notice = message;
    render();
    announce(live, message);
  };

  const run = () => {
    if (invalidFields.size > 0) {
      const [min, max] = valueBounds(spec());
      say(t('input.invalid', { min, max }));
      return;
    }
    const existing = findLogIndex(state, state.draft);
    if (existing >= 0) {
      const input = state.draft;
      highlight = existing;
      say(t('announce.duplicate', { n: existing + 1, input: inputText(input), output: outputText(evaluate(ruleOf(state), input)) }));
      return;
    }
    const input = [...state.draft];
    const message = t('announce.ran', { input: inputText(input), output: outputText(evaluate(ruleOf(state), input)) });
    if (commit(runExperiment(state), message)) {
      notice = message;
      render();
    }
  };

  const openTest = () => {
    const next = startTest(state);
    if (commit(next, t('announce.testOpened', { n: next.challenge?.inputs.length ?? 0 }))) {
      board.querySelector<HTMLElement>('[data-focus="predict-0"]')?.focus();
    }
  };

  /** Applies the typed list predictions to `base` (empty text = empty list). */
  const withListPredictions = (base: BlackBoxState): BlackBoxState => {
    const s = spec();
    if (s.kind !== 'list') return base;
    let next = base;
    board.querySelectorAll<HTMLInputElement>('input[data-predict]').forEach((field) => {
      const parsed = parseDigitList(field.value, s.length);
      if (parsed !== null) next = setPrediction(next, Number(field.dataset.predict), parsed);
    });
    return next;
  };

  const submit = () => {
    const synced = withListPredictions(state);
    if (!canSubmit(synced)) {
      commit(synced, undefined, { render: false });
      say(t('status.incomplete'));
      return;
    }
    const next = submitTest(synced);
    const attempt = next.lastAttempt;
    if (!attempt) return;
    const results = attemptResults(next, attempt);
    const correct = results.filter(Boolean).length;
    let message = t('attempt.summary', { n: next.attempts, correct, total: results.length });
    if (next.solved) message += ` ${solvedText(next)}`;
    commit(next, message);
    board.querySelector<HTMLElement>(next.solved ? '[data-focus="status"]' : '[data-focus="attempt"]')?.focus();
    if (next.solved) {
      context.finished({ outcome: 'won', stats: { experiments: experimentCount(next), tests: next.attempts, hints: next.hintUsed ? 1 : 0 } });
    }
  };

  const solvedText = (s: BlackBoxState) => t('status.solved', { experiments: experimentCount(s), tests: s.attempts });

  // --- Rendering ---------------------------------------------------------------------------

  const focusKeyOf = (el: Element | null) => (el instanceof HTMLElement && container.contains(el) ? (el.dataset.focus ?? null) : null);

  const render = () => {
    const previousFocus = focusKeyOf(document.activeElement);
    clear(board);
    const phase = phaseOf(state);
    const s = spec();
    const [min, max] = valueBounds(s);

    const domainKey = `domain.${s.kind}`;
    const domainParams = s.kind === 'bits' ? { n: s.count } : s.kind === 'list' ? { n: s.length } : { min, max };

    append(board,
      h('div', { class: 'bb-diagram', 'aria-hidden': 'true', dir: 'ltr' },
        h('span', { class: 'bb-io' }, inputHeader(s)),
        h('span', { class: 'bb-arrow' }, '→'),
        h('span', { class: 'bb-box' }, '?'),
        h('span', { class: 'bb-arrow' }, '→'),
        h('span', { class: 'bb-io' }, s.kind === 'bits' ? '0 / 1' : s.kind === 'list' ? '[…]' : 'f')
      ),
      h('p', { class: 'bb-domain', 'data-testid': 'bb-domain' }, t(domainKey, domainParams)),
      h('p', { class: `wp-status bb-status bb-status-${phase}`, 'data-testid': 'bb-status', 'data-phase': phase, tabindex: -1, 'data-focus': 'status' }, statusText()),
      phase === 'solved' ? null : renderStats(),
      renderHint()
    );

    if (phase === 'experimenting') board.appendChild(renderExperiment());
    else if (phase === 'testing') board.appendChild(renderChallenge());
    else board.appendChild(renderSolved());

    board.append(...[renderAttempt(), renderLog()].filter((el): el is HTMLElement => el !== null));

    if (previousFocus) {
      const target = board.querySelector<HTMLElement>(`[data-focus="${previousFocus}"]`) ?? board.querySelector<HTMLElement>('[data-focus="status"]');
      target?.focus();
    }
  };

  const statusText = () => {
    const phase = phaseOf(state);
    if (phase === 'solved') return solvedText(state);
    return t(phase === 'testing' ? 'status.testing' : 'status.experimenting');
  };

  const renderStats = () => {
    const parts = [t('stats.experiments', { n: experimentCount(state) }), t('stats.tests', { n: state.attempts })];
    if (state.hintUsed) parts.push(t('stats.hint'));
    return h('p', { class: 'bb-stats wp-muted', 'data-testid': 'bb-stats', 'data-experiments': experimentCount(state), 'data-tests': state.attempts, 'data-hint': state.hintUsed ? 1 : 0 }, parts.join(' · '));
  };

  const renderHint = () => {
    if (state.hintUsed || state.solved) return h('p', { class: 'bb-hint-text', 'data-testid': 'bb-hint-text' }, t('hint.text', { family: familyName() }));
    return h('div', { class: 'wp-row bb-hint' },
      h('button', { type: 'button', 'data-testid': 'bb-hint', 'data-focus': 'hint', 'aria-describedby': 'bb-hint-help', onclick: () => {
        if (paused) return;
        if (commit(useHint(state), t('hint.text', { family: familyName() }))) board.querySelector<HTMLElement>('[data-focus="status"]')?.focus();
      } }, t('common.hint')),
      h('span', { class: 'wp-muted bb-small', id: 'bb-hint-help' }, t('hint.help'))
    );
  };

  const stepper = (index: number, name: string, label: string) => {
    const [min, max] = valueBounds(spec());
    const value = state.draft[index] ?? min;
    const field = h('input', {
      type: 'number',
      inputmode: 'numeric',
      min,
      max,
      step: 1,
      value,
      class: 'bb-number',
      'aria-label': label,
      'data-testid': `bb-input-${index}`,
      'data-focus': `input-${index}`,
      'data-value': value
    });
    field.addEventListener('input', () => {
      if (paused) return;
      const parsed = parseInteger(field.value);
      const valid = parsed !== null && parsed >= min && parsed <= max;
      field.setAttribute('aria-invalid', valid ? 'false' : 'true');
      if (!valid) {
        invalidFields.add(index);
        return;
      }
      invalidFields.delete(index);
      field.dataset.value = String(parsed);
      commit(setDraftValue(state, index, parsed), undefined, { render: false });
    });
    const nudge = (delta: number, testId: string, text: string, aria: string) =>
      h('button', {
        type: 'button',
        class: 'bb-nudge',
        'data-testid': `${testId}-${index}`,
        'data-focus': `${testId}-${index}`,
        'aria-label': t(aria, { name }),
        onclick: () => {
          if (paused) return;
          const current = state.draft[index] ?? min;
          const next = Math.min(max, Math.max(min, current + delta));
          commit(setDraftValue(state, index, next));
        }
      }, text);
    return h('span', { class: 'bb-stepper', dir: 'ltr' },
      nudge(-1, 'bb-dec', '−', 'action.decrease'),
      field,
      nudge(1, 'bb-inc', '+', 'action.increase')
    );
  };

  const renderInputControls = () => {
    const s = spec();
    const group = h('div', { class: `bb-inputs bb-inputs-${s.kind}`, role: 'group', 'aria-label': t('experiment.input'), 'data-testid': 'bb-input', dir: 'ltr' });
    if (s.kind === 'int' || s.kind === 'pair') {
      const names = s.kind === 'int' ? ['x'] : ['x', 'y'];
      names.forEach((name, i) => group.appendChild(h('label', { class: 'bb-field' }, h('span', { class: 'bb-var' }, `${name} =`), stepper(i, name, name))));
    } else if (s.kind === 'bits') {
      state.draft.forEach((bit, i) => {
        group.appendChild(
          h('span', { class: 'bb-field bb-bit-field' },
            h('span', { class: 'bb-var', 'aria-hidden': 'true' }, bitName(i)),
            h('button', {
              type: 'button',
              class: `bb-bit${bit === 1 ? ' is-on' : ''}`,
              'aria-pressed': bit === 1 ? 'true' : 'false',
              'aria-label': t('input.bit', { name: bitName(i) }),
              'data-testid': `bb-input-${i}`,
              'data-focus': `input-${i}`,
              'data-value': bit,
              onclick: () => {
                if (!paused) commit(setDraftValue(state, i, 1 - bit));
              }
            }, String(bit))
          )
        );
      });
    } else {
      const items = h('span', { class: 'bb-list-fields' });
      state.draft.forEach((value, i) => {
        const field = h('input', {
          type: 'number',
          inputmode: 'numeric',
          min: s.min,
          max: s.max,
          step: 1,
          value,
          class: 'bb-number bb-digit',
          'aria-label': t('input.element', { n: i + 1 }),
          'data-testid': `bb-input-${i}`,
          'data-focus': `input-${i}`,
          'data-value': value
        });
        field.addEventListener('input', () => {
          if (paused) return;
          const parsed = parseInteger(field.value);
          const valid = parsed !== null && parsed >= s.min && parsed <= s.max;
          field.setAttribute('aria-invalid', valid ? 'false' : 'true');
          if (!valid) {
            invalidFields.add(i);
            return;
          }
          invalidFields.delete(i);
          field.dataset.value = String(parsed);
          commit(setDraftValue(state, i, parsed), undefined, { render: false });
        });
        items.appendChild(field);
      });
      group.append(h('span', { class: 'bb-bracket', 'aria-hidden': 'true' }, '['), items, h('span', { class: 'bb-bracket', 'aria-hidden': 'true' }, ']'));
    }
    return group;
  };

  const renderExperiment = () => {
    const form = h('form', { class: 'bb-panel', 'data-testid': 'bb-experiment', 'aria-labelledby': 'bb-exp-heading', novalidate: true });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!paused) run();
    });
    form.append(
      h('h3', { id: 'bb-exp-heading' }, t('experiment.heading')),
      renderInputControls(),
      h('p', { class: 'bb-notice', 'data-testid': 'bb-notice', role: 'status', hidden: notice === '' }, notice),
      h('div', { class: 'wp-row bb-actions' },
        h('button', { type: 'submit', class: 'primary', 'data-testid': 'bb-run', 'data-focus': 'run' }, t('action.run')),
        h('button', { type: 'button', 'data-testid': 'bb-test', 'data-focus': 'test', onclick: () => {
          if (!paused) openTest();
        } }, t('action.test'))
      )
    );
    return form;
  };

  const renderPrediction = (index: number, input: Input, prediction: Prediction | null) => {
    const label = t('predict.label', { input: inputText(input) });
    const kind = outputKind();
    if (kind === 'bool') {
      return h('span', { class: 'bb-choice', role: 'group', 'aria-label': label, 'data-testid': `bb-predict-${index}`, 'data-value': prediction === null ? '' : String(prediction) },
        ...[0, 1].map((v) =>
          h('button', {
            type: 'button',
            class: `bb-bit${prediction === v ? ' is-on' : ''}`,
            'aria-pressed': prediction === v ? 'true' : 'false',
            'data-testid': `bb-predict-${index}-${v}`,
            'data-focus': v === 0 ? `predict-${index}` : `predict-${index}-1`,
            onclick: () => {
              if (!paused) commit(setPrediction(state, index, v));
            }
          }, String(v))
        )
      );
    }
    const isList = kind === 'list';
    const field = h('input', {
      type: isList ? 'text' : 'number',
      inputmode: 'numeric',
      autocomplete: 'off',
      class: `bb-number bb-predict${isList ? ' bb-predict-list' : ''}`,
      value: prediction === null ? '' : Array.isArray(prediction) ? prediction.join(' ') : String(prediction),
      'aria-label': label,
      'aria-describedby': isList ? 'bb-list-help' : undefined,
      'data-testid': `bb-predict-${index}`,
      'data-focus': `predict-${index}`,
      'data-predict': index,
      dir: 'ltr'
    });
    field.addEventListener('input', () => {
      if (paused) return;
      const s = spec();
      const length = s.kind === 'list' ? s.length : 0;
      const parsed: Prediction | null = isList ? parseDigitList(field.value, length) : parseInteger(field.value);
      const invalid = field.value.trim() !== '' && parsed === null;
      field.setAttribute('aria-invalid', invalid ? 'true' : 'false');
      // Empty list text stays "unanswered" until submit, so a restored blank field means the same thing.
      const value = isList && field.value.trim() === '' ? null : parsed;
      commit(setPrediction(state, index, value), undefined, { render: false });
    });
    return field;
  };

  const renderChallenge = () => {
    const challenge = state.challenge;
    const form = h('form', { class: 'bb-panel', 'data-testid': 'bb-challenge', 'aria-labelledby': 'bb-test-heading', novalidate: true });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!paused) submit();
    });
    const list = h('ol', { class: 'bb-predictions' });
    challenge?.inputs.forEach((input, i) => {
      list.appendChild(
        h('li', { class: 'bb-prediction', 'data-testid': `bb-challenge-${i}`, 'data-input': input.join(',') },
          ltr(inputText(input), { class: 'bb-notation bb-challenge-input' }),
          h('span', { class: 'bb-arrow', 'aria-hidden': 'true' }, '→'),
          renderPrediction(i, input, challenge.predictions[i] ?? null)
        )
      );
    });
    append(form,
      h('h3', { id: 'bb-test-heading' }, t('test.heading')),
      h('p', { class: 'wp-muted' }, t('test.intro')),
      list,
      outputKind() === 'list' ? h('p', { class: 'wp-muted bb-small', id: 'bb-list-help' }, t('predict.listHelp')) : null,
      h('p', { class: 'bb-notice', 'data-testid': 'bb-notice', role: 'status', hidden: notice === '' }, notice),
      h('div', { class: 'wp-row bb-actions' },
        h('button', { type: 'submit', class: 'primary', 'data-testid': 'bb-submit', 'data-focus': 'submit' }, t('action.submit')),
        h('button', { type: 'button', 'data-testid': 'bb-back', 'data-focus': 'back', 'aria-describedby': 'bb-back-help', onclick: () => {
          if (!paused && commit(cancelTest(state))) board.querySelector<HTMLElement>('[data-focus="test"]')?.focus();
        } }, t('action.back'))
      ),
      h('p', { class: 'wp-muted bb-small', id: 'bb-back-help' }, t('test.backNote'))
    );
    return form;
  };

  const renderSolved = () =>
    h('section', { class: 'bb-panel bb-solved', 'data-testid': 'bb-solved' },
      h('p', { class: 'bb-rule', 'data-testid': 'bb-rule' }, t('solved.rule', { rule: ruleText() }))
    );

  const renderAttempt = () => {
    const attempt = state.lastAttempt;
    if (!attempt) return null;
    const results = attemptResults(state, attempt);
    const correct = results.filter(Boolean).length;
    const table = h('table', { class: 'bb-table', 'data-testid': 'bb-attempt-table' },
      h('thead', {}, h('tr', {},
        h('th', { scope: 'col', class: 'bb-verdict' }, h('span', { class: 'sr-only' }, t('attempt.verdict'))),
        h('th', { scope: 'col' }, t('log.input')),
        h('th', { scope: 'col' }, t('attempt.predicted')),
        h('th', { scope: 'col' }, t('attempt.actual'))
      ))
    );
    const body = h('tbody', {});
    attempt.inputs.forEach((input, i) => {
      const right = results[i] === true;
      const predicted = attempt.predictions[i] as Prediction;
      body.appendChild(
        h('tr', { class: right ? 'is-right' : 'is-wrong', 'data-testid': `bb-attempt-row-${i}`, 'data-correct': right ? 'true' : 'false' },
          // Verdict: a distinct symbol plus a screen-reader word, never colour alone.
          h('td', { class: 'bb-verdict' }, h('span', { 'aria-hidden': 'true' }, right ? '✓' : '✗'), h('span', { class: 'sr-only' }, t(right ? 'attempt.right' : 'attempt.wrong'))),
          h('td', {}, ltr(inputText(input))),
          h('td', {}, ltr(typeof predicted === 'number' ? formatOutput(outputKind(), predicted) : formatList(predicted))),
          h('td', {}, ltr(outputText(evaluate(ruleOf(state), input))))
        )
      );
    });
    table.appendChild(body);
    return h('section', { class: 'bb-attempt', 'data-testid': 'bb-attempt', 'aria-labelledby': 'bb-attempt-heading' },
      h('h3', { id: 'bb-attempt-heading', tabindex: -1, 'data-focus': 'attempt' }, t('attempt.summary', { n: state.attempts, correct, total: results.length })),
      h('div', { class: 'bb-scroll' }, table),
      state.solved ? null : h('p', { class: 'wp-muted bb-small' }, t('attempt.continue'))
    );
  };

  const renderLog = () => {
    const section = h('section', { class: 'bb-log', 'aria-labelledby': 'bb-log-heading' }, h('h3', { id: 'bb-log-heading' }, t('log.heading')));
    if (state.log.length === 0) {
      section.appendChild(h('p', { class: 'wp-muted', 'data-testid': 'bb-log-empty' }, t('log.empty')));
      return section;
    }
    const table = h('table', { class: 'bb-table', 'data-testid': 'bb-log' },
      h('thead', {}, h('tr', {},
        h('th', { scope: 'col' }, '#'),
        h('th', { scope: 'col' }, t('log.input'), ' ', ltr(inputHeader(spec()), { class: 'bb-notation wp-muted' })),
        h('th', { scope: 'col' }, t('log.output'))
      ))
    );
    const body = h('tbody', {});
    state.log.forEach((entry, i) => {
      const output = evaluate(ruleOf(state), entry.input);
      body.appendChild(
        h('tr', {
          class: `${entry.source === 'test' ? 'is-test' : ''}${i === highlight ? ' is-highlight' : ''}`.trim() || undefined,
          'data-testid': `bb-log-row-${i}`,
          'data-input': entry.input.join(','),
          'data-output': typeof output === 'number' ? String(output) : output.join(','),
          'data-source': entry.source
        },
          h('td', { class: 'bb-n' }, formatNumber(i + 1), entry.source === 'test' ? h('span', { class: 'bb-tag' }, t('log.fromTest')) : null),
          h('td', {}, ltr(inputText(entry.input))),
          h('td', {}, ltr(outputText(output)))
        )
      );
    });
    table.appendChild(body);
    section.appendChild(h('div', { class: 'bb-scroll' }, table));
    return section;
  };

  // --- GameInstance --------------------------------------------------------------------------

  const mount = () => {
    if (!container.isConnected) context.root.appendChild(container);
    notice = '';
    highlight = -1;
    invalidFields.clear();
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      state = createInitialState(options.seed, toDifficulty(options.difficulty));
      mount();
    },
    restore(saved: BlackBoxState) {
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
      state = createInitialState(state.seed, state.difficulty);
      mount();
      context.requestSave();
    },
    dispose() {
      clear(context.root);
    }
  };
}
