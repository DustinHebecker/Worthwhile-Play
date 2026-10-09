import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, append, clear, h } from '@wp/ui';
import { contentFor, type SituationText } from './content';
import {
  SELF_CHECKS,
  STEPS,
  assembledBriefing,
  cardDef,
  checkChoices,
  checkSort,
  chooseAction,
  chooseDecision,
  createInitialState,
  finish,
  isFinished,
  modelBriefing,
  placeCard,
  scoreSort,
  setNotes,
  situationOf,
  summarize,
  toDifficulty,
  toggleCheck,
  unsortedCount,
  verdictFor,
  type BriefingState,
  type Step
} from './rules';
import { RIGHT_ACTION, RIGHT_DECISION, SECTIONS, SLOTS, type ActionId, type DecisionId, type Slot } from './situations';
import './styles.css';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const CHECK_KEYS = ['check.act', 'check.known', 'check.ask'] as const;
const WORK_STEPS = ['sort', 'decide', 'review'] as const;
const isSlot = (value: string): value is Slot => (SLOTS as readonly string[]).includes(value);

export function createBriefingGame(context: GameContext): GameInstance<BriefingState> {
  const { t } = context;
  let state = createInitialState(0);
  let paused = false;
  /** Transient hint (e.g. "sort every card first"), not part of the logical state. */
  let notice = '';
  let reportedFinish = false;

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'bg-live' });
  const board = h('div', { class: 'bg-board' });
  const container = h('div', { class: 'wp-briefing-game', dir: t.direction, lang: t.locale }, board, live);

  const text = (): SituationText => contentFor(t.locale)[state.situation] as SituationText;
  const cardText = (id: string) => text().cards[id] ?? id;
  const slotName = (slot: Slot) => t(`section.${slot}`);
  const stepText = (step: Step) => (step === 'done' ? t('summary.heading') : t(`step.${step}`));

  // --- State changes -------------------------------------------------------------------------

  /** Applies a rules transition; re-renders and saves only when the state really changed. */
  const commit = (next: BriefingState, options: { focus?: string; render?: boolean } = {}) => {
    if (paused || next === state) return false;
    const stepBefore = state.step;
    state = next;
    notice = '';
    if (options.render !== false) render(options.focus);
    context.requestSave();
    if (state.step !== stepBefore) announce(live, isFinished(state) ? t('result.completed') : stepText(state.step));
    if (isFinished(state) && !reportedFinish) {
      reportedFinish = true;
      const s = summarize(state);
      context.finished({
        outcome: 'completed',
        stats: { cards: s.total, fittingCards: s.correct, decision: s.decisionCorrect ? 1 : 0, nextAction: s.actionCorrect ? 1 : 0 }
      });
    }
    return true;
  };

  const say = (message: string) => {
    if (paused) return;
    notice = message;
    render('notice');
    announce(live, message);
  };

  // --- Rendering -----------------------------------------------------------------------------

  const focusKeyOf = (el: Element | null) => (el instanceof HTMLElement && container.contains(el) ? (el.dataset.focus ?? null) : null);

  const render = (focus?: string) => {
    const previousFocus = focus ?? focusKeyOf(document.activeElement);
    clear(board);
    append(board, renderSituation(), renderProgress());
    board.appendChild(isFinished(state) ? renderDone() : renderStep());
    if (previousFocus) board.querySelector<HTMLElement>(`[data-focus="${previousFocus}"]`)?.focus();
  };

  const renderSituation = () =>
    h('section', { class: 'bg-situation wp-card', 'aria-labelledby': 'bg-situation-heading', 'data-testid': 'bg-situation', 'data-situation': state.situation },
      h('h2', { id: 'bg-situation-heading' }, t('situation.heading'), ': ', text().title),
      h('p', {}, text().situation),
      h('p', { class: 'bg-recipient', 'data-testid': 'bg-recipient' }, t('recipient', { recipient: text().recipient })),
      h('details', { class: 'bg-guide', open: state.difficulty === 'easy' && state.step === 'sort' },
        h('summary', {}, t('guide.heading')),
        h('dl', {}, ...SLOTS.flatMap((slot) => [h('dt', {}, slotName(slot)), h('dd', {}, t(`guide.${slot}`))]))
      )
    );

  const renderProgress = () => {
    const rank = STEPS.indexOf(state.step);
    return h('ol', { class: 'bg-progress', 'aria-label': t('steps.heading') },
      ...WORK_STEPS.map((step, i) => {
        const status = i < rank ? 'done' : i === rank ? 'current' : 'next';
        const name = t(`stepName.${step}`);
        return h('li', { class: `bg-chip bg-chip-${status}`, 'data-testid': `bg-progress-${step}`, 'data-status': status, 'aria-current': status === 'current' ? 'step' : undefined },
          h('span', { 'aria-hidden': 'true', class: 'bg-chip-mark' }, status === 'done' ? '✓' : status === 'current' ? '▶' : String(i + 1)),
          h('span', { class: 'sr-only' }, t(`progress.${status}`, { step: name })),
          h('span', { 'aria-hidden': 'true' }, name)
        );
      })
    );
  };

  const renderStep = () => {
    const section = h('section', { class: 'bg-step', 'data-testid': 'bg-step', 'data-step': state.step, 'aria-labelledby': 'bg-step-heading' },
      h('h2', { id: 'bg-step-heading', tabindex: -1, 'data-focus': 'step', 'data-autofocus': true }, stepText(state.step))
    );
    if (state.step === 'sort') section.appendChild(renderSort());
    else if (state.step === 'decide') append(section, renderSortFeedback(), renderChoices());
    else append(section, renderChoicesFeedback(), renderCompare(), renderReflect(), renderSortFeedback());
    if (notice) section.appendChild(h('p', { class: 'bg-notice', role: 'status', tabindex: -1, 'data-focus': 'notice', 'data-testid': 'bg-notice' }, notice));
    section.appendChild(renderActions());
    return section;
  };

  const renderSort = () => {
    const list = h('ol', { class: 'bg-inbox', 'data-testid': 'bg-inbox', 'aria-label': t('inbox.heading') },
      ...state.cards.map((id, i) => {
        const placed = state.placement[i] ?? null;
        const select = h('select', {
          'data-testid': `bg-select-${id}`,
          'data-focus': `select-${id}`,
          'aria-label': t('sort.label', { n: i + 1 }),
          'aria-describedby': `bg-text-${id}`,
          onchange: (event: Event) => {
            const value = (event.target as HTMLSelectElement).value;
            commit(placeCard(state, id, isSlot(value) ? value : null), { focus: `select-${id}` });
          }
        },
          h('option', { value: '' }, t('sort.choose')),
          ...SLOTS.map((slot) => h('option', { value: slot }, slotName(slot)))
        );
        select.value = placed ?? '';
        return h('li', { class: `bg-card${placed ? ' is-placed' : ''}`, 'data-testid': `bg-card-${id}`, 'data-placed': placed ?? '' },
          h('span', { class: 'bg-card-number', 'aria-hidden': 'true' }, String(i + 1)),
          h('p', { id: `bg-text-${id}`, class: 'bg-card-text' }, cardText(id)),
          select
        );
      })
    );
    const done = state.cards.length - unsortedCount(state);
    return h('div', { class: 'bg-sort' },
      list,
      h('p', { class: 'wp-muted bg-count', 'data-testid': 'bg-count' }, t('sort.count', { n: done, total: state.cards.length }))
    );
  };

  const renderSortFeedback = () => {
    const def = situationOf(state);
    const score = scoreSort(state);
    const verdicts = h('ul', { class: 'bg-verdicts', 'data-testid': 'bg-verdicts' },
      ...state.cards.map((id, i) => {
        const v = verdictFor(def, id, state.placement[i] ?? null);
        const also = v.gold.filter((s) => s !== (v.correct ? v.placed : v.primary));
        const label = v.correct
          ? t('verdict.correct', { section: slotName(v.placed as Slot) })
          : t('verdict.wrong', { placed: v.placed ? slotName(v.placed) : t('sort.choose'), section: slotName(v.primary) });
        return h('li', { class: `bg-verdict bg-verdict-${v.correct ? 'correct' : 'wrong'}`, 'data-testid': `bg-verdict-${id}`, 'data-verdict': v.correct ? 'correct' : 'wrong' },
          h('span', { class: 'bg-symbol', 'aria-hidden': 'true' }, v.correct ? '✓' : '✗'),
          h('div', {},
            h('p', { class: 'bg-verdict-label' }, label),
            also.length > 0 ? h('p', { class: 'bg-also' }, t('verdict.also', { section: also.map(slotName).join(', ') })) : null,
            h('p', { class: 'bg-card-text' }, cardText(id)),
            h('p', { class: 'wp-muted bg-reason' }, t(`reason.${cardDef(def, id)?.kind ?? 'background'}`))
          )
        );
      })
    );
    const bySlot = h('ul', { class: 'bg-by-section' },
      ...SLOTS.filter((slot) => score.bySlot[slot].total > 0).map((slot) => {
        const row = score.bySlot[slot];
        return h('li', { 'data-testid': `bg-section-${slot}`, 'data-correct': row.correct, 'data-total': row.total },
          h('span', { 'aria-hidden': 'true', class: 'bg-symbol-inline' }, row.correct === row.total ? '✓ ' : '○ '),
          t('sections.row', { section: slotName(slot), correct: row.correct, total: row.total })
        );
      })
    );
    const patterns = score.confusions.length === 0
      ? h('p', { 'data-testid': 'bg-patterns' }, t('patterns.none'))
      : h('ul', { 'data-testid': 'bg-patterns' },
        ...score.confusions.slice(0, 3).map((c) =>
          h('li', {}, t('patterns.row', { from: slotName(c.from), to: c.to ? slotName(c.to) : t('sort.choose'), n: c.count }))
        )
      );
    return h('section', { class: 'bg-panel', 'data-testid': 'bg-feedback', 'aria-labelledby': 'bg-feedback-heading' },
      h('h3', { id: 'bg-feedback-heading' }, t('feedback.heading')),
      h('p', { class: 'bg-score', 'data-testid': 'bg-feedback-summary' }, t('feedback.summary', { correct: score.correct, total: score.total })),
      h('div', { class: 'bg-overview' },
        h('div', {}, h('h4', {}, t('sections.heading')), bySlot),
        h('div', {}, h('h4', {}, t('patterns.heading')), patterns)
      ),
      h('h4', {}, t('feedback.cards')),
      verdicts
    );
  };

  const optionGroup = <T extends string>(kind: 'decision' | 'action', order: readonly T[], chosen: T | null, label: (id: T) => string, choose: (id: T) => BriefingState) =>
    h('fieldset', { class: 'bg-options', 'data-testid': `bg-${kind}s` },
      h('legend', {}, t(kind === 'decision' ? 'decide.decision' : 'decide.action')),
      ...order.map((id, i) =>
        h('label', { class: `bg-option${chosen === id ? ' is-checked' : ''}` },
          h('input', {
            type: 'radio',
            name: `bg-${kind}`,
            checked: chosen === id,
            'data-testid': `bg-${kind}-${i}`,
            'data-focus': `${kind}-${i}`,
            onchange: () => commit(choose(id), { focus: `${kind}-${i}` })
          }),
          h('span', {}, h('strong', {}, t('option.label', { n: i + 1 })), ' ', label(id))
        )
      )
    );

  const renderChoices = () =>
    h('div', { class: 'bg-choices' },
      optionGroup<DecisionId>('decision', state.decisionOrder, state.decision, (id) => text().decisions[id] ?? id, (id) => chooseDecision(state, id)),
      optionGroup<ActionId>('action', state.actionOrder, state.action, (id) => text().actions[id] ?? id, (id) => chooseAction(state, id))
    );

  const revealedGroup = <T extends string>(kind: 'decision' | 'action', order: readonly T[], chosen: T | null, right: T, label: (id: T) => string) =>
    h('div', { class: 'bg-revealed' },
      h('h4', {}, t(kind === 'decision' ? 'decide.decision' : 'decide.action')),
      ...order.map((id, i) => {
        const fits = id === right;
        const yours = id === chosen;
        return h('div', { class: `bg-option is-revealed${fits ? ' is-fit' : ''}${yours ? ' is-checked' : ''}`, 'data-testid': `bg-${kind}-${i}`, 'data-fit': fits ? 'true' : 'false', 'data-chosen': yours ? 'true' : 'false' },
          h('p', {},
            h('strong', {}, t('option.label', { n: i + 1 })),
            ' ',
            h('span', { class: 'bg-badge' }, h('span', { 'aria-hidden': 'true' }, fits ? '✓ ' : '✗ '), t(fits ? 'choice.fits' : 'choice.notBest')),
            yours ? h('span', { class: 'bg-badge bg-badge-yours' }, t('choice.yours')) : null
          ),
          h('p', { class: 'bg-card-text' }, label(id)),
          h('p', { class: 'wp-muted bg-reason' }, t(`${kind}Kind.${id}`))
        );
      })
    );

  const renderChoicesFeedback = () =>
    h('section', { class: 'bg-panel', 'data-testid': 'bg-choices-feedback', 'aria-labelledby': 'bg-choices-heading' },
      h('h3', { id: 'bg-choices-heading' }, t('choices.heading')),
      revealedGroup<DecisionId>('decision', state.decisionOrder, state.decision, RIGHT_DECISION, (id) => text().decisions[id] ?? id),
      revealedGroup<ActionId>('action', state.actionOrder, state.action, RIGHT_ACTION, (id) => text().actions[id] ?? id)
    );

  const renderBriefing = (testId: string, heading: string, cards: Record<Slot, string[]>, decision: DecisionId | null, action: ActionId | null) =>
    h('div', { class: 'bg-briefing', 'data-testid': testId },
      h('h4', {}, heading),
      ...SECTIONS.map((section) => {
        const lead = section === 'decision' && decision ? text().decisions[decision] : section === 'next' && action ? text().actions[action] : undefined;
        const items = cards[section];
        return h('div', { class: 'bg-briefing-section', 'data-section': section, 'data-count': items.length },
          h('h5', {}, slotName(section)),
          lead ? h('p', { class: 'bg-briefing-lead' }, lead) : null,
          items.length > 0
            ? h('ul', {}, ...items.map((id) => h('li', {}, cardText(id))))
            : lead ? null : h('p', { class: 'wp-muted' }, t('compare.empty'))
        );
      })
    );

  const renderCompare = () =>
    h('section', { class: 'bg-panel', 'data-testid': 'bg-compare', 'aria-labelledby': 'bg-compare-heading' },
      h('h3', { id: 'bg-compare-heading' }, t('compare.heading')),
      h('div', { class: 'bg-compare' },
        renderBriefing('bg-yours', t('compare.yours'), assembledBriefing(state), state.decision, state.action),
        renderBriefing('bg-model', t('compare.model'), modelBriefing(state), RIGHT_DECISION, RIGHT_ACTION)
      )
    );

  const renderReflect = () => {
    const field = h('textarea', {
      id: 'bg-notes',
      rows: 4,
      maxlength: 2000,
      'data-testid': 'bg-notes',
      'data-focus': 'notes',
      oninput: (event: Event) => commit(setNotes(state, (event.target as HTMLTextAreaElement).value), { render: false })
    });
    field.value = state.notes;
    return h('section', { class: 'bg-panel bg-reflect' },
      h('label', { for: 'bg-notes' }, t('notes.label')),
      field,
      h('fieldset', { class: 'bg-checks' },
        h('legend', {}, t('checklist.heading')),
        ...Array.from({ length: SELF_CHECKS }, (_, i) =>
          h('label', { class: 'bg-check' },
            h('input', { type: 'checkbox', checked: state.checks[i] === true, 'data-testid': `bg-check-${i}`, 'data-focus': `check-${i}`, onchange: () => commit(toggleCheck(state, i), { focus: `check-${i}` }) }),
            h('span', {}, t(CHECK_KEYS[i] as string))
          )
        )
      )
    );
  };

  const renderActions = () => {
    const row = h('div', { class: 'wp-row bg-actions' });
    const button = (key: string, testId: string, onclick: () => void) =>
      h('button', { type: 'button', class: 'primary', 'data-testid': testId, 'data-focus': testId, onclick: () => (paused ? undefined : onclick()) }, t(key));
    if (state.step === 'sort') {
      row.appendChild(button('common.check', 'bg-check-sort', () => {
        const open = unsortedCount(state);
        if (open > 0) say(t('sort.needAll', { n: open }));
        else commit(checkSort(state), { focus: 'step' });
      }));
    } else if (state.step === 'decide') {
      row.appendChild(button('common.check', 'bg-check-choices', () => {
        if (state.decision === null || state.action === null) say(t('decide.needBoth'));
        else commit(checkChoices(state), { focus: 'step' });
      }));
    } else if (state.step === 'review') {
      row.appendChild(button('action.finish', 'bg-finish', () => commit(finish(state), { focus: 'summary' })));
    }
    return row;
  };

  const renderDone = () => {
    const s = summarize(state);
    const mark = (ok: boolean, yes: string, no: string) =>
      h('li', {}, h('span', { 'aria-hidden': 'true', class: 'bg-symbol-inline' }, ok ? '✓ ' : '○ '), t(ok ? yes : no));
    return h('section', { class: 'bg-step bg-summary', 'data-testid': 'bg-summary', 'data-step': 'done', 'aria-labelledby': 'bg-summary-heading' },
      h('h2', { id: 'bg-summary-heading', tabindex: -1, 'data-focus': 'summary', 'data-autofocus': true }, t('summary.heading')),
      h('ul', { class: 'bg-summary-list wp-card', 'data-testid': 'bg-summary-list', 'data-correct': s.correct, 'data-total': s.total },
        h('li', {}, t('summary.cards', { correct: s.correct, total: s.total })),
        mark(s.decisionCorrect, 'summary.decisionRight', 'summary.decisionOther'),
        mark(s.actionCorrect, 'summary.actionRight', 'summary.actionOther'),
        h('li', {}, t('summary.checks', { n: s.checked, total: SELF_CHECKS }))
      ),
      h('p', { class: 'wp-muted' }, t('summary.note')),
      renderCompare(),
      state.notes ? h('section', { class: 'bg-panel', 'data-testid': 'bg-notes-final' }, h('h3', {}, t('notes.label')), h('p', { class: 'bg-notes-text' }, state.notes)) : null,
      renderChoicesFeedback(),
      renderSortFeedback()
    );
  };

  // --- GameInstance ----------------------------------------------------------------------------

  const mount = () => {
    if (!container.isConnected) context.root.appendChild(container);
    notice = '';
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      state = createInitialState(options.seed, toDifficulty(options.difficulty));
      reportedFinish = false;
      mount();
    },
    restore(saved: BriefingState) {
      state = clone(saved);
      reportedFinish = isFinished(state);
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
      reportedFinish = false;
      mount();
      context.requestSave();
    },
    dispose() {
      clear(context.root);
    }
  };
}
