import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, append, clear, h } from '@wp/ui';
import {
  VARS,
  checkFix,
  chooseFix,
  createInitialState,
  currentMachine,
  formatRule,
  isSolved,
  output,
  pickRule,
  runMachine,
  sameRegs,
  selectTest,
  step,
  wasTried,
  type DebugState,
  type Regs
} from './rules';
import './styles.css';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createDebugSystem(context: GameContext): GameInstance<DebugState> {
  const { t } = context;
  let state = createInitialState(0);
  let paused = false;

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'ds-live' });
  const board = h('div', { class: 'ds-board' });
  const container = h('div', { class: 'wp-debug-system', dir: t.direction, lang: t.locale }, board, live);

  const code = (text: string) => h('code', { class: 'ds-code', dir: 'ltr' }, text);
  const regsView = (regs: Readonly<Regs>, testId?: string) =>
    h('span', { class: 'ds-regs', dir: 'ltr', 'data-testid': testId, 'data-values': regs.join(',') },
      ...VARS.map((v, i) => h('span', { class: 'ds-reg' }, h('span', { class: 'ds-var' }, v), ` = ${regs[i]}`))
    );

  // --- State changes -----------------------------------------------------------------------

  const focusKeyOf = (el: Element | null) => (el instanceof HTMLElement && container.contains(el) ? (el.dataset.focus ?? null) : null);

  const commit = (next: DebugState, message?: string, focus?: string): boolean => {
    if (paused || next === state) return false;
    state = next;
    render(focus);
    context.requestSave();
    if (message) announce(live, message);
    return true;
  };

  const doStep = () => {
    const next = step(state);
    if (next.cursor === 0) {
      commit(next, t('announce.restart'));
      return;
    }
    const i = next.cursor - 1;
    const trace = runMachine(currentMachine(next), next.tests[next.test]?.input ?? [0, 0, 0], next.cursor);
    const regs = trace.states[next.cursor] as Regs;
    commit(next, t('announce.step', { n: i + 1, result: t(trace.fired[i] ? 'rule.applied' : 'rule.skipped'), x: regs[0], y: regs[1], z: regs[2] }));
  };

  const doCheck = () => {
    const next = checkFix(state);
    if (next === state) return;
    if (isSolved(next)) {
      if (commit(next, t('status.solved'), 'status')) {
        context.finished({ outcome: 'won', stats: { stepsViewed: next.stepsViewed, wrongPicks: next.wrongPicks } });
      }
    } else {
      commit(next, statusText(next), 'status');
    }
  };

  // --- Rendering ---------------------------------------------------------------------------

  const phaseOf = (s: DebugState) => (isSolved(s) ? 'solved' : s.lastPassed !== null ? 'wrong' : s.picked !== null ? 'choose' : 'start');

  const statusText = (s: DebugState) => {
    const phase = phaseOf(s);
    if (phase === 'solved') return t('status.solved');
    if (phase === 'wrong') return t('status.wrong', { passed: s.lastPassed ?? 0, total: s.tests.length });
    if (phase === 'choose') return t('status.choose', { n: (s.picked ?? 0) + 1 });
    return t('status.start');
  };

  const render = (focus?: string) => {
    const previousFocus = focus ?? focusKeyOf(document.activeElement);
    clear(board);
    const machine = currentMachine(state);
    const test = state.tests[state.test] ?? state.tests[0];
    const trace = runMachine(machine, test?.input ?? [0, 0, 0], state.cursor);
    const solved = isSolved(state);

    append(board,
      h('p', { class: `wp-status ds-status ds-status-${phaseOf(state)}`, 'data-testid': 'ds-status', 'data-phase': phaseOf(state), tabindex: -1, 'data-focus': 'status' }, statusText(state)),
      h('p', { class: 'wp-muted ds-stats', 'data-testid': 'ds-stats', 'data-steps': state.stepsViewed, 'data-wrong': state.wrongPicks },
        t('stats', { steps: state.stepsViewed, wrong: state.wrongPicks })),
      renderMachine(machine, trace.fired, solved),
      solved ? null : renderFixes(),
      renderRun(trace.states[state.cursor] as Regs, machine.length),
      renderTests(machine),
      h('p', { class: 'ds-legend wp-muted' }, t('legend'))
    );

    if (previousFocus) {
      const target = board.querySelector<HTMLElement>(`[data-focus="${previousFocus}"]`) ?? board.querySelector<HTMLElement>('[data-focus="status"]');
      target?.focus();
    }
  };

  const renderMachine = (machine: DebugState['rules'], fired: boolean[], solved: boolean) => {
    const list = h('ol', { class: 'ds-rules', 'aria-labelledby': 'ds-machine-heading' });
    machine.forEach((rule, i) => {
      const text = formatRule(rule);
      const done = i < state.cursor;
      const isNext = i === state.cursor && !solved;
      const marker = done
        ? h('span', { class: `ds-mark ${fired[i] ? 'is-applied' : 'is-skipped'}`, 'data-testid': `ds-mark-${i}` }, `${fired[i] ? '✓' : '–'} ${t(fired[i] ? 'rule.applied' : 'rule.skipped')}`)
        : isNext
          ? h('span', { class: 'ds-mark is-next', 'data-testid': `ds-mark-${i}` }, `▶ ${t('rule.next')}`)
          : null;
      const fixed = solved && state.fix?.[0] === i;
      const picked = state.picked === i;
      list.appendChild(
        h('li', { class: `ds-rule-row${isNext ? ' is-next' : ''}${picked ? ' is-picked' : ''}${fixed ? ' is-fixed' : ''}` },
          h('button', {
            type: 'button',
            class: 'ds-rule',
            'data-testid': `ds-rule-${i}`,
            'data-focus': `rule-${i}`,
            'data-code': text,
            'aria-pressed': picked ? 'true' : 'false',
            'aria-label': t('rule.label', { n: i + 1, code: text }),
            disabled: solved,
            onclick: () => commit(pickRule(state, i), t('status.choose', { n: i + 1 }), 'fix-0')
          }, h('span', { class: 'ds-num' }, `${i + 1}`), code(text), fixed ? h('span', { class: 'ds-fixed-mark', 'aria-hidden': 'true' }, '✓') : null),
          marker
        )
      );
    });
    return h('section', { class: 'ds-panel', 'data-testid': 'ds-machine' },
      h('h3', { id: 'ds-machine-heading' }, t('machine.heading')),
      solved ? null : h('p', { class: 'ds-small' }, t('pick.prompt')),
      list
    );
  };

  const renderFixes = () => {
    if (state.picked === null) return null;
    const i = state.picked;
    const options = state.options[i] ?? [];
    const group = h('div', { class: 'ds-fixes', role: 'group', 'aria-labelledby': 'ds-fix-heading' });
    options.forEach((option, j) => {
      const text = formatRule(option);
      const tried = wasTried(state, i, j);
      group.appendChild(
        h('button', {
          type: 'button',
          class: `ds-fix${state.chosen === j ? ' is-chosen' : ''}${tried ? ' is-tried' : ''}`,
          'data-testid': `ds-fix-${j}`,
          'data-focus': `fix-${j}`,
          'data-code': text,
          'aria-pressed': state.chosen === j ? 'true' : 'false',
          'aria-label': t('fix.option', { n: j + 1, code: text }) + (tried ? ` (${t('fix.tried')})` : ''),
          onclick: () => commit(chooseFix(state, j), undefined, `fix-${j}`)
        }, code(text), tried ? h('span', { class: 'ds-tried' }, `✗ ${t('fix.tried')}`) : null)
      );
    });
    return h('section', { class: 'ds-panel', 'data-testid': 'ds-fix-panel' },
      h('h3', { id: 'ds-fix-heading' }, t('fix.heading', { n: i + 1 })),
      group,
      h('div', { class: 'wp-row' },
        h('button', { type: 'button', class: 'primary', 'data-testid': 'ds-check', 'data-focus': 'check', disabled: state.chosen === null, onclick: doCheck }, t('common.check'))
      )
    );
  };

  const renderRun = (regs: Regs, total: number) => {
    const atEnd = state.cursor >= total;
    return h('section', { class: 'ds-panel', 'data-testid': 'ds-run' },
      h('h3', {}, t('run.heading')),
      h('p', { class: 'ds-small', 'data-testid': 'ds-position', 'data-cursor': state.cursor }, t('run.position', { n: state.test + 1, step: state.cursor, total })),
      regsView(regs, 'ds-regs'),
      h('div', { class: 'wp-row' },
        h('button', { type: 'button', class: atEnd ? '' : 'primary', 'data-testid': 'ds-step', 'data-focus': 'step', onclick: doStep }, t(atEnd ? 'action.restart' : 'action.step'))
      )
    );
  };

  const renderTests = (machine: DebugState['rules']) => {
    const list = h('div', { class: 'ds-tests' });
    state.tests.forEach((test, k) => {
      const actual = output(machine, test.input);
      const pass = sameRegs(actual, test.expected);
      const selected = state.test === k;
      list.appendChild(
        h('button', {
          type: 'button',
          class: `ds-test${selected ? ' is-selected' : ''} ${pass ? 'is-pass' : 'is-fail'}`,
          'data-testid': `ds-test-${k}`,
          'data-focus': `test-${k}`,
          'data-pass': pass ? 'true' : 'false',
          'aria-pressed': selected ? 'true' : 'false',
          onclick: () => commit(selectTest(state, k), undefined, `test-${k}`)
        },
          h('span', { class: 'ds-test-head' },
            h('strong', {}, t('test.label', { n: k + 1 })),
            h('span', { class: 'ds-verdict' }, `${pass ? '✓' : '✗'} ${t(pass ? 'test.pass' : 'test.fail')}`)
          ),
          h('span', { class: 'ds-test-row' }, h('span', { class: 'ds-test-key' }, t('test.start')), regsView(test.input)),
          h('span', { class: 'ds-test-row' }, h('span', { class: 'ds-test-key' }, t('test.expected')), regsView(test.expected)),
          h('span', { class: 'ds-test-row' }, h('span', { class: 'ds-test-key' }, t('test.actual')), regsView(actual))
        )
      );
    });
    return h('section', { class: 'ds-panel', 'data-testid': 'ds-tests' }, h('h3', {}, t('tests.heading')), list);
  };

  // --- Lifecycle ---------------------------------------------------------------------------

  context.root.appendChild(container);
  render();

  return {
    newGame(options: NewGameOptions) {
      state = createInitialState(options.seed, options.difficulty);
      paused = false;
      render();
    },
    restore(saved: DebugState) {
      state = clone(saved);
      paused = false;
      render();
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
      render();
      context.requestSave();
    },
    dispose() {
      container.remove();
      clear(context.root);
    }
  };
}
