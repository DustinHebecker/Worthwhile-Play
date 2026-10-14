import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, clear, gridKeyboard, h } from '@wp/ui';
import {
  applyRule,
  createInitialState,
  isSolved,
  knownList,
  missingPremises,
  premisesMet,
  resetProof,
  toDifficulty,
  undo,
  verdict,
  VOCAB,
  type Atom,
  type MinimalProofState,
  type Rule
} from './rules';
import './styles.css';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SIGN: Record<Rule['op'], string> = { imp: '', and: '∧', or: '∨' };

export function createMinimalProof(context: GameContext): GameInstance<MinimalProofState> {
  const { t } = context;
  let state = createInitialState(0);
  let paused = false;
  /** Rule holding the roving tabindex (view-only). */
  let focusRule = 0;
  /** Last derived atom to animate (view-only). */
  let fresh: number | null = null;
  let ruleEls: HTMLButtonElement[] = [];
  let disposeKeyboard: () => void = () => undefined;

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'mp-live' });
  const goal = h('p', { class: 'mp-goal', 'data-testid': 'mp-goal' });
  const status = h('p', { class: 'wp-status mp-status', 'data-testid': 'mp-status' });
  const facts = h('ul', { class: 'mp-facts', 'data-testid': 'mp-facts', 'aria-labelledby': 'mp-facts-title' });
  const rulesList = h('div', { class: 'mp-rules', role: 'group', 'aria-labelledby': 'mp-rules-title', 'data-testid': 'mp-rules' });
  const feedback = h('p', { class: 'mp-feedback', 'data-testid': 'mp-feedback', hidden: true });
  const undoButton = h('button', { type: 'button', 'data-testid': 'mp-undo', onclick: () => takeBack() },
    h('span', { 'aria-hidden': 'true' }, '↶ '), t('common.undo'));
  const resetButton = h('button', { type: 'button', 'data-testid': 'mp-reset', onclick: () => clearProof() }, t('action.resetProof'));
  const controls = h('div', { class: 'wp-row mp-controls' }, undoButton, resetButton);
  const help = h('div', { class: 'mp-help wp-muted' }, h('p', {}, t('help')), h('p', { dir: 'auto' }, t('legend')));
  const container = h('div', { class: 'wp-minimal-proof', dir: t.direction, lang: t.locale },
    goal,
    status,
    h('section', { class: 'mp-section' }, h('h3', { id: 'mp-facts-title' }, t('facts.title')), facts),
    h('section', { class: 'mp-section' }, h('h3', { id: 'mp-rules-title' }, t('rules.title')), rulesList),
    feedback,
    controls,
    help,
    live
  );

  // --- Text ------------------------------------------------------------------------------------

  const atomOf = (i: number): Atom => state.puzzle.atoms[i] as Atom;
  const symbol = (i: number) => `${atomOf(i).neg ? '¬' : ''}${LETTERS[atomOf(i).letter] ?? '?'}`;
  const label = (i: number) => {
    const atom = atomOf(i);
    const id = VOCAB[atom.label] ?? VOCAB[0];
    return t(atom.neg ? `vocab.${id}.not` : `vocab.${id}`);
  };
  const spoken = (i: number) => t(atomOf(i).neg ? 'atom.nameNot' : 'atom.name', { letter: LETTERS[atomOf(i).letter] ?? '?', label: label(i) });
  const ruleSentence = (rule: Rule) => {
    const [a, b] = rule.premises.map(spoken);
    return t(`rule.${rule.op}`, { a: a ?? '', b: b ?? '', c: spoken(rule.conclusion) });
  };

  const chip = (i: number, known: boolean, extra = '') =>
    h('span', { class: `mp-atom${known ? ' is-known' : ''}${atomOf(i).neg ? ' is-neg' : ''}${extra}`, 'data-atom': i },
      h('span', { class: 'mp-symbol', dir: 'ltr' }, symbol(i)),
      h('span', { class: 'mp-label' }, label(i)),
      known ? h('span', { class: 'mp-check', 'aria-hidden': 'true' }, '✓') : null
    );

  // --- Moves -----------------------------------------------------------------------------------

  const setFeedback = (message: string) => {
    feedback.textContent = message;
    feedback.hidden = message === '';
    if (message) announce(live, message);
  };

  const commit = (next: MinimalProofState, message: string) => {
    if (next === state) return;
    state = next;
    update();
    context.requestSave();
    setFeedback(message);
    if (isSolved(state)) {
      const steps = state.applied.length;
      announce(live, `${message} ${t('status.solved', { steps, minimal: state.puzzle.minimal })}`);
      context.finished({ outcome: 'completed', stats: { steps, minimal: state.puzzle.minimal } });
    }
  };

  const apply = (index: number) => {
    if (paused) return;
    focusRule = index;
    const rule = state.puzzle.rules[index];
    if (!rule) return;
    const v = verdict(state, index);
    if (v === 'ok') {
      fresh = context.reducedMotion ? null : rule.conclusion;
      commit(applyRule(state, index), t('derived', { c: spoken(rule.conclusion), n: index + 1 }));
      return;
    }
    if (v === 'known') setFeedback(t('refuse.known', { c: spoken(rule.conclusion) }));
    else if (v === 'missing') {
      const missing = missingPremises(rule, new Set(knownList(state.puzzle, state.applied)));
      if (rule.op === 'or') setFeedback(t('refuse.missingOr', { a: spoken(rule.premises[0] as number), b: spoken(rule.premises[1] as number) }));
      else setFeedback(t('refuse.missing', { missing: missing.map(spoken).join(', ') }));
    }
    update();
  };

  const takeBack = () => {
    if (paused) return;
    fresh = null;
    commit(undo(state), t('undone'));
  };

  const clearProof = () => {
    if (paused) return;
    fresh = null;
    commit(resetProof(state), t('cleared'));
  };

  // --- Rendering -------------------------------------------------------------------------------

  const build = () => {
    disposeKeyboard();
    clear(rulesList);
    ruleEls = state.puzzle.rules.map((_, i) => {
      const button = h('button', { type: 'button', class: 'mp-rule', 'data-rule': i, 'data-testid': `rule-${i}`, tabindex: -1, onclick: () => apply(i) });
      rulesList.appendChild(button);
      return button;
    });
    disposeKeyboard = gridKeyboard(rulesList, 1, '[data-rule]');
  };

  const update = () => {
    const list = knownList(state.puzzle, state.applied);
    const known = new Set(list);
    const solved = known.has(state.puzzle.goal);
    const steps = state.applied.length;

    clear(goal);
    const [before = '', after = ''] = t(solved ? 'goal.proved' : 'goal', { goal: '\u0000' }).split('\u0000');
    goal.append(before, chip(state.puzzle.goal, solved, ' mp-goal-atom'), after);
    goal.setAttribute('aria-label', t(solved ? 'goal.proved' : 'goal', { goal: spoken(state.puzzle.goal) }));
    goal.dataset.reached = String(solved);

    status.dataset.state = solved ? 'solved' : 'playing';
    status.textContent = solved
      ? `${t('status.solved', { steps, minimal: state.puzzle.minimal })} ${t(steps === state.puzzle.minimal ? 'status.shortest' : 'status.longer')}`
      : t('status.steps', { steps });

    clear(facts);
    list.forEach((atom, k) => {
      const isFresh = atom === fresh && k === list.length - 1;
      const note = k < state.puzzle.facts.length
        ? t('facts.given')
        : t('facts.step', { n: k - state.puzzle.facts.length + 1, rule: (state.applied[k - state.puzzle.facts.length] as number) + 1 });
      facts.appendChild(h('li', {
        class: `mp-fact${isFresh ? ' is-new' : ''}${atom === state.puzzle.goal ? ' is-goal' : ''}`,
        'data-testid': `fact-${atom}`,
        'data-step': k < state.puzzle.facts.length ? 0 : k - state.puzzle.facts.length + 1,
        'aria-label': `${spoken(atom)} – ${note}`
      }, chip(atom, true), h('span', { class: 'mp-note', 'aria-hidden': 'true' }, note)));
    });

    focusRule = Math.min(Math.max(0, focusRule), ruleEls.length - 1);
    state.puzzle.rules.forEach((rule, i) => {
      const button = ruleEls[i];
      if (!button) return;
      const ready = premisesMet(rule, known);
      const done = known.has(rule.conclusion);
      const applicable = ready && !done && !solved;
      const ruleState = done ? 'known' : ready ? 'ready' : 'missing';
      const mark = { known: '✓', ready: '▶', missing: '○' }[ruleState];
      const stateText = t(`rule.${ruleState}`);
      button.dataset.applicable = String(applicable);
      button.dataset.state = ruleState;
      button.setAttribute('aria-label', `${t('rule.number', { n: i + 1 })}: ${ruleSentence(rule)}. ${stateText}`);
      button.setAttribute('aria-disabled', String(solved));
      button.tabIndex = i === focusRule ? 0 : -1;
      clear(button);
      const formula = h('span', { class: 'mp-formula', dir: 'ltr' });
      rule.premises.forEach((p, k) => {
        if (k > 0) formula.appendChild(h('span', { class: 'mp-op', 'aria-hidden': 'true' }, SIGN[rule.op]));
        formula.appendChild(chip(p, known.has(p)));
      });
      formula.appendChild(h('span', { class: 'mp-op mp-arrow', 'aria-hidden': 'true' }, '→'));
      formula.appendChild(chip(rule.conclusion, done));
      button.append(
        h('span', { class: 'mp-mark', 'aria-hidden': 'true' }, mark),
        h('span', { class: 'mp-num', 'aria-hidden': 'true' }, `${i + 1}`),
        formula
      );
    });

    undoButton.disabled = solved || steps === 0;
    resetButton.disabled = solved || steps === 0;
    controls.hidden = solved;
    help.hidden = solved;
    container.classList.toggle('is-solved', solved);
  };

  // --- GameInstance ----------------------------------------------------------------------------

  const mount = () => {
    focusRule = 0;
    fresh = null;
    setFeedback('');
    build();
    update();
    if (!container.isConnected) context.root.appendChild(container);
  };

  return {
    newGame(options: NewGameOptions) {
      state = createInitialState(options.seed, toDifficulty(options.difficulty));
      mount();
    },
    restore(saved: MinimalProofState) {
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
      disposeKeyboard();
      clear(context.root);
    }
  };
}
