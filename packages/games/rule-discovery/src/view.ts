import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, append, clear, h } from '@wp/ui';
import {
  MAX_VALUE,
  MIN_VALUE,
  canTest,
  createInitialState,
  currentHypothesis,
  findLogIndex,
  guess,
  guessCount,
  insightFor,
  isValue,
  ruledOutCounts,
  runTest,
  setDraft,
  testCount,
  toDifficulty,
  type RuleDiscoveryState,
  type RuleId,
  type Triple
} from './rules';
import './styles.css';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createRuleDiscovery(context: GameContext): GameInstance<RuleDiscoveryState> {
  const { t } = context;
  let state = createInitialState(0);
  let paused = false;
  /** Transient feedback (not part of the logical state). */
  let notice = '';
  const invalid = new Set<number>();

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'rd-live' });
  const board = h('div', { class: 'rd-board' });
  const container = h('div', { class: 'wp-rule-discovery', dir: t.direction, lang: t.locale }, board, live);

  const tripleText = (x: Triple) => x.join(', ');
  const ltr = (text: string, cls = '') => h('span', { dir: 'ltr', class: `rd-notation ${cls}`.trim() }, text);
  const answer = (fitsRule: boolean) => t(fitsRule ? 'log.yes' : 'log.no');
  const ruleText = (id: RuleId) => t(`rule.${id}`);

  const commit = (next: RuleDiscoveryState, message: string) => {
    state = next;
    notice = message;
    invalid.clear();
    render();
    context.requestSave();
    announce(live, message);
  };

  const say = (message: string) => {
    notice = message;
    render();
    announce(live, message);
  };

  const doTest = () => {
    if (paused || state.solved) return;
    if (invalid.size > 0) return say(t('input.invalid', { min: MIN_VALUE, max: MAX_VALUE }));
    const existing = findLogIndex(state, state.draft);
    if (existing >= 0) {
      return say(t('log.duplicate', { triple: tripleText(state.draft), answer: answer(state.log[existing]?.fits ?? false) }));
    }
    if (!canTest(state)) return;
    const next = runTest(state);
    const entry = next.log[next.log.length - 1];
    if (entry) commit(next, t('announce.tested', { triple: tripleText(entry.triple), answer: answer(entry.fits) }));
  };

  const doGuess = (id: RuleId) => {
    if (paused) return;
    const { state: next, outcome } = guess(state, id);
    if (outcome === 'ignored') return;
    if (outcome === 'correct') {
      commit(next, t('status.solved', { tests: testCount(next), guesses: guessCount(next) }));
      board.querySelector<HTMLElement>('[data-focus="status"]')?.focus();
      context.finished({ outcome: 'won', stats: { tests: testCount(next), guesses: guessCount(next) } });
      return;
    }
    const counter = next.log[next.log.length - 1];
    const message = counter?.source === 'counter'
      ? t(counter.fits ? 'wrong.fits' : 'wrong.notFits', { triple: tripleText(counter.triple) })
      : t('wrong.plain');
    commit(next, message);
    board.querySelector<HTMLElement>('[data-focus="notice"]')?.focus();
  };

  // --- Rendering ---------------------------------------------------------------------------

  const focusKeyOf = (el: Element | null) => (el instanceof HTMLElement && container.contains(el) ? (el.dataset.focus ?? null) : null);

  const render = () => {
    const previousFocus = focusKeyOf(document.activeElement);
    clear(board);
    const phase = state.solved ? 'solved' : 'playing';
    append(board,
      h('p', { class: `wp-status rd-status rd-status-${phase}`, 'data-testid': 'rd-status', 'data-phase': phase, tabindex: -1, 'data-focus': 'status' },
        state.solved ? `✓ ${t('status.solved', { tests: testCount(state), guesses: guessCount(state) })}` : t('status.playing')),
      h('div', { class: 'rd-example', 'data-testid': 'rd-example', 'data-triple': state.example.join(',') },
        h('span', {}, t('example.label')),
        ltr(state.example.join(' · '), 'rd-example-triple')
      ),
      state.solved ? null : renderTestForm(),
      notice ? h('p', { class: 'rd-notice', 'data-testid': 'rd-notice', tabindex: -1, 'data-focus': 'notice' }, notice) : null,
      renderInsight(),
      renderCandidates(),
      renderLog(),
      h('p', { class: 'wp-muted rd-stats', 'data-testid': 'rd-stats', 'data-tests': testCount(state), 'data-guesses': guessCount(state) },
        `${t('stats.tests', { n: testCount(state) })} · ${t('stats.guesses', { n: guessCount(state) })}`)
    );
    if (previousFocus) {
      (board.querySelector<HTMLElement>(`[data-focus="${previousFocus}"]`) ?? board.querySelector<HTMLElement>('[data-focus="status"]'))?.focus();
    }
  };

  const renderTestForm = () => {
    const fields = state.draft.map((value, i) => {
      const input = h('input', {
        type: 'number', inputmode: 'numeric', min: MIN_VALUE, max: MAX_VALUE, step: 1, value: String(value),
        class: 'rd-number', id: `rd-input-${i}`, 'data-testid': `rd-input-${i}`, 'data-focus': `input-${i}`,
        'aria-label': t('input.label', { n: i + 1 }), 'aria-invalid': invalid.has(i) ? 'true' : undefined,
        oninput: (event: Event) => {
          const el = event.target as HTMLInputElement;
          const n = Number(el.value);
          if (el.value.trim() === '' || !isValue(n)) {
            invalid.add(i);
            el.setAttribute('aria-invalid', 'true');
            return;
          }
          invalid.delete(i);
          el.removeAttribute('aria-invalid');
          const next = setDraft(state, i, n);
          if (next !== state) {
            state = next;
            context.requestSave();
          }
        },
        onkeydown: (event: Event) => {
          if ((event as KeyboardEvent).key === 'Enter') {
            event.preventDefault();
            doTest();
          }
        }
      });
      return input;
    });
    return h('section', { class: 'rd-panel', 'aria-labelledby': 'rd-test-heading' },
      h('h3', { id: 'rd-test-heading' }, t('test.heading')),
      h('p', { class: 'wp-muted rd-small' }, t('domain', { min: MIN_VALUE, max: MAX_VALUE })),
      h('div', { class: 'rd-inputs', dir: 'ltr' }, ...fields),
      h('div', { class: 'wp-row' },
        h('button', { type: 'button', class: 'primary', 'data-testid': 'rd-test', 'data-focus': 'test', onclick: doTest }, t('action.test')))
    );
  };

  const renderInsight = () => {
    const hypothesis = currentHypothesis(state);
    if (!hypothesis) return null;
    const insight = insightFor(state, hypothesis);
    const text = insight.kind === 'untested'
      ? t('insight.untested')
      : insight.kind === 'confirmOnly'
        ? t('insight.confirmOnly', { n: insight.tests })
        : t('insight.falsifying', { k: insight.falsifying, n: insight.tests });
    const extra = state.solved
      ? t('insight.useful', { k: ruledOutCounts(state).filter((n, i) => n > 0 && state.log[i]?.source === 'test').length, n: testCount(state) })
      : null;
    return h('section', { class: 'rd-insight', 'data-testid': 'rd-insight', 'data-kind': insight.kind, 'aria-labelledby': 'rd-insight-heading' },
      h('h3', { id: 'rd-insight-heading' }, t('insight.heading')),
      h('p', {}, text),
      extra ? h('p', {}, extra) : null
    );
  };

  const renderCandidates = () => {
    const list = h('ol', { class: 'rd-candidates' });
    state.candidates.forEach((id, i) => {
      const ruledOut = state.wrong.includes(id);
      const isAnswer = state.solved && id === state.rule;
      const tag = ruledOut ? `✗ ${t('candidate.ruledOut')}` : isAnswer ? `✓ ${t('candidate.answer')}` : '';
      list.appendChild(h('li', {},
        h('button', {
          type: 'button',
          class: `rd-candidate${ruledOut ? ' is-out' : ''}${isAnswer ? ' is-answer' : ''}`,
          'data-testid': `rd-candidate-${i}`, 'data-rule': id, 'data-focus': `candidate-${i}`,
          'data-state': ruledOut ? 'wrong' : isAnswer ? 'answer' : 'open',
          disabled: ruledOut || state.solved,
          onclick: () => doGuess(id)
        },
          h('span', {}, ruleText(id)),
          tag ? h('span', { class: 'rd-tag' }, tag) : null
        )
      ));
    });
    return h('section', { class: 'rd-panel', 'aria-labelledby': 'rd-cand-heading' },
      h('h3', { id: 'rd-cand-heading' }, t('candidates.heading')),
      state.solved ? null : h('p', { class: 'wp-muted rd-small' }, t('candidates.help')),
      list
    );
  };

  const renderLog = () => {
    const section = h('section', { class: 'rd-log', 'aria-labelledby': 'rd-log-heading' }, h('h3', { id: 'rd-log-heading' }, t('log.heading')));
    if (state.log.length === 0) {
      section.appendChild(h('p', { class: 'wp-muted' }, t('log.empty')));
      return section;
    }
    const counts = state.solved ? ruledOutCounts(state) : null;
    const body = h('tbody', {});
    state.log.forEach((entry, i) => {
      body.appendChild(h('tr', {
        'data-testid': `rd-log-row-${i}`, 'data-triple': entry.triple.join(','), 'data-fits': entry.fits ? 'true' : 'false', 'data-source': entry.source,
        class: entry.fits ? 'is-yes' : 'is-no'
      },
        h('td', { class: 'rd-n' }, String(i + 1)),
        h('td', {}, ltr(tripleText(entry.triple)), entry.source === 'counter' ? h('span', { class: 'rd-tag' }, t('log.counter')) : null),
        h('td', { class: 'rd-answer' }, `${entry.fits ? '✓' : '✗'} ${answer(entry.fits)}`),
        counts ? h('td', { class: 'rd-small' }, t('log.ruledOut', { n: counts[i] ?? 0 })) : null
      ));
    });
    section.appendChild(h('div', { class: 'rd-scroll' }, h('table', { class: 'rd-table' }, body)));
    return section;
  };

  // --- GameInstance --------------------------------------------------------------------------

  const mount = () => {
    if (!container.isConnected) context.root.appendChild(container);
    notice = '';
    invalid.clear();
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      state = createInitialState(options.seed, toDifficulty(options.difficulty));
      mount();
    },
    restore(saved: RuleDiscoveryState) {
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
