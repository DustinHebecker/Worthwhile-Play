import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, append, clear, h } from '@wp/ui';
import { contentFor, type ScenarioText } from './content';
import {
  SELF_CHECKS,
  backToSelect,
  checkMessage,
  checkSelection,
  chooseLead,
  chooseMessage,
  createInitialState,
  currentRound,
  goToLead,
  isFinished,
  nextRound,
  scenarioOf,
  scoreRound,
  setDraft,
  summarize,
  tagOf,
  toDifficulty,
  toggleCheck,
  toggleFact,
  verdictOf,
  type AudienceSwitchState,
  type RoundState,
  type Step,
  type Verdict
} from './rules';
import type { AudienceId, MessageId } from './scenarios';
import './styles.css';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const VERDICT_SYMBOL: Readonly<Record<Verdict, string>> = { hit: '✓', miss: '✗', extra: '✗', skipped: '✓', optional: '○' };
const CHECK_KEYS = ['check.first', 'check.needed', 'check.skip'] as const;

export function createAudienceSwitch(context: GameContext): GameInstance<AudienceSwitchState> {
  const { t } = context;
  let state = createInitialState(0);
  let paused = false;
  /** Transient hint (e.g. "tick at least one fact"), not part of the logical state. */
  let notice = '';
  let reportedFinish = false;

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'as-live' });
  const board = h('div', { class: 'as-board' });
  const container = h('div', { class: 'wp-audience-switch', dir: t.direction, lang: t.locale }, board, live);

  const text = (): ScenarioText => contentFor(t.locale)[state.scenario] as ScenarioText;
  const audienceName = (a: AudienceId) => t(`audience.${a}`);
  const factText = (id: string) => text().facts[id] ?? id;
  const messageText = (a: AudienceId, id: MessageId) => text().messages[`${a}.${id}`] ?? '';
  const reasonText = (a: AudienceId, factId: string) => {
    const tag = tagOf(scenarioOf(state), factId, a);
    if (tag === 'optional') return t('reason.optional');
    return text().reasons[`${a}.${factId}`] ?? text().reasons[factId] ?? '';
  };
  const stepText = (step: Step) => (step === 'done' ? t('summary.heading') : t(`step.${step}`));

  // --- State changes -------------------------------------------------------------------------

  /** Applies a rules transition; re-renders and saves only when the state really changed. */
  const commit = (next: AudienceSwitchState, options: { focus?: string; render?: boolean } = {}) => {
    if (paused || next === state) return false;
    const stepBefore = currentRound(state)?.step;
    const roundBefore = state.round;
    state = next;
    notice = '';
    if (options.render !== false) render(options.focus);
    context.requestSave();
    const round = currentRound(state);
    if (state.round !== roundBefore || round?.step !== stepBefore) {
      announce(live, isFinished(state) ? t('result.completed') : stepText(round?.step ?? 'done'));
    }
    if (isFinished(state) && !reportedFinish) {
      reportedFinish = true;
      const s = summarize(state);
      context.finished({ outcome: 'completed', stats: { neededFacts: s.needed, includedFacts: s.hits, notNeededIncluded: s.extras, openings: s.leads, messages: s.messages } });
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
    append(board, renderSituation(), renderAudiences());
    if (isFinished(state)) board.appendChild(renderSummary());
    else board.appendChild(renderRound());
    if (previousFocus) board.querySelector<HTMLElement>(`[data-focus="${previousFocus}"]`)?.focus();
  };

  const renderSituation = () =>
    h('section', { class: 'as-situation wp-card', 'aria-labelledby': 'as-situation-heading', 'data-testid': 'as-situation', 'data-scenario': state.scenario },
      h('h2', { id: 'as-situation-heading' }, t('situation.heading'), ': ', text().title),
      h('p', {}, text().situation),
      h('details', { class: 'as-questions' },
        h('summary', {}, t('questions.heading')),
        h('ul', {}, ...['know', 'care', 'decide', 'skip'].map((q) => h('li', {}, t(`questions.${q}`))))
      )
    );

  const renderAudiences = () =>
    h('ol', { class: 'as-audiences', 'aria-label': t('audiences.heading') },
      ...state.audiences.map((a, i) => {
        const status = i < state.round ? 'done' : i === state.round ? 'current' : 'next';
        return h('li', { class: `as-chip as-chip-${status}`, 'data-testid': `as-audience-${i}`, 'data-status': status, 'aria-current': status === 'current' ? 'step' : undefined },
          h('span', { 'aria-hidden': 'true', class: 'as-chip-mark' }, status === 'done' ? '✓' : status === 'current' ? '▶' : '·'),
          h('span', { class: 'sr-only' }, t(`audiences.${status}`, { audience: audienceName(a) })),
          h('span', { 'aria-hidden': 'true' }, audienceName(a))
        );
      })
    );

  const renderRound = () => {
    const round = currentRound(state) as RoundState;
    const audience = state.audiences[state.round] as AudienceId;
    const section = h('section', { class: 'as-round', 'data-testid': 'as-round', 'data-step': round.step, 'data-audience': audience, 'aria-labelledby': 'as-round-heading' },
      h('h2', { id: 'as-round-heading', tabindex: -1, 'data-focus': 'round', 'data-autofocus': true },
        t('round.heading', { n: state.round + 1, total: state.audiences.length, audience: audienceName(audience) })
      ),
      h('p', { class: 'wp-status', 'data-testid': 'as-step' }, stepText(round.step))
    );
    if (round.step === 'select') section.appendChild(renderSelect(round));
    else if (round.step === 'lead') section.appendChild(renderLead(round));
    else {
      section.appendChild(renderFeedback(round, audience));
      section.appendChild(renderMessages(round, audience));
      if (round.step === 'reflect') section.appendChild(renderReflect(round, audience));
    }
    if (notice) section.appendChild(h('p', { class: 'as-notice', role: 'status', tabindex: -1, 'data-focus': 'notice', 'data-testid': 'as-notice' }, notice));
    section.appendChild(renderActions(round));
    return section;
  };

  const renderSelect = (round: RoundState) =>
    h('fieldset', { class: 'as-facts', 'data-testid': 'as-facts' },
      h('legend', { class: 'sr-only' }, t('step.select')),
      ...state.facts.map((id) => {
        const checked = round.selected.includes(id);
        return h('label', { class: `as-fact${checked ? ' is-checked' : ''}` },
          h('input', {
            type: 'checkbox',
            checked,
            'data-testid': `as-fact-${id}`,
            'data-focus': `fact-${id}`,
            onchange: () => commit(toggleFact(state, id), { focus: `fact-${id}` })
          }),
          h('span', {}, factText(id))
        );
      }),
      h('p', { class: 'wp-muted as-count', 'data-testid': 'as-count' }, t('select.count', { n: round.selected.length }))
    );

  const renderLead = (round: RoundState) =>
    h('fieldset', { class: 'as-facts', 'data-testid': 'as-lead' },
      h('legend', { class: 'sr-only' }, t('step.lead')),
      ...state.facts.filter((id) => round.selected.includes(id)).map((id) =>
        h('label', { class: `as-fact${round.lead === id ? ' is-checked' : ''}` },
          h('input', {
            type: 'radio',
            name: 'as-lead',
            checked: round.lead === id,
            'data-testid': `as-lead-${id}`,
            'data-focus': `lead-${id}`,
            onchange: () => commit(chooseLead(state, id), { focus: `lead-${id}` })
          }),
          h('span', {}, factText(id))
        )
      )
    );

  const renderFeedback = (round: RoundState, audience: AudienceId) => {
    const score = scoreRound(state, state.round);
    const def = scenarioOf(state);
    const best = def.lead[audience] as string;
    const list = h('ul', { class: 'as-feedback', 'data-testid': 'as-feedback' },
      ...state.facts.map((id) => {
        const verdict = verdictOf(tagOf(def, id, audience), round.selected.includes(id));
        return h('li', { class: `as-verdict as-verdict-${verdict}`, 'data-testid': `as-verdict-${id}`, 'data-verdict': verdict },
          h('span', { class: 'as-symbol', 'aria-hidden': 'true' }, VERDICT_SYMBOL[verdict]),
          h('div', {},
            h('p', { class: 'as-verdict-label' }, t(`verdict.${verdict}`)),
            h('p', { class: 'as-fact-text' }, factText(id)),
            h('p', { class: 'wp-muted as-reason' }, reasonText(audience, id))
          )
        );
      })
    );
    const leadSame = score.leadCorrect;
    return h('section', { class: 'as-panel', 'aria-labelledby': 'as-feedback-heading' },
      h('h3', { id: 'as-feedback-heading' }, t('feedback.heading')),
      h('p', { 'data-testid': 'as-feedback-summary' }, t('feedback.summary', { hits: score.hits, needed: score.needed, extras: score.extras })),
      list,
      h('div', { class: 'as-lead-result', 'data-testid': 'as-lead-result', 'data-correct': leadSame ? 'true' : 'false' },
        h('h3', {}, t('leadResult.heading')),
        h('p', {}, h('span', { 'aria-hidden': 'true', class: 'as-symbol-inline' }, leadSame ? '✓ ' : '○ '), t(leadSame ? 'leadResult.same' : 'leadResult.other')),
        h('p', {}, t('leadResult.yours', { fact: factText(round.lead ?? '') })),
        leadSame ? null : h('p', {}, t('leadResult.best', { fact: factText(best) })),
        h('p', { class: 'wp-muted' }, t(`lead.${audience}`))
      )
    );
  };

  const renderMessages = (round: RoundState, audience: AudienceId) => {
    const revealed = round.step !== 'message';
    return h('fieldset', { class: 'as-messages', 'data-testid': 'as-messages' },
      h('legend', {}, t('message.heading')),
      ...round.order.map((id, i) => {
        const chosen = round.chosen === id;
        const label = t('message.label', { n: i + 1 });
        if (!revealed) {
          return h('label', { class: `as-message${chosen ? ' is-checked' : ''}` },
            h('input', { type: 'radio', name: 'as-message', checked: chosen, 'data-testid': `as-message-${i}`, 'data-focus': `message-${i}`, onchange: () => commit(chooseMessage(state, id), { focus: `message-${i}` }) }),
            h('span', {}, h('strong', {}, label), h('span', { class: 'as-message-text' }, messageText(audience, id)))
          );
        }
        const fit = id === 'fit';
        return h('div', { class: `as-message is-revealed${fit ? ' is-fit' : ''}${chosen ? ' is-checked' : ''}`, 'data-testid': `as-message-${i}`, 'data-fit': fit ? 'true' : 'false', 'data-chosen': chosen ? 'true' : 'false' },
          h('p', {},
            h('strong', {}, label),
            ' ',
            h('span', { class: 'as-badge' }, h('span', { 'aria-hidden': 'true' }, fit ? '✓ ' : '✗ '), t(fit ? 'message.fit' : 'message.flawed')),
            chosen ? h('span', { class: 'as-badge as-badge-yours' }, t('message.yours')) : null
          ),
          h('p', { class: 'as-message-text' }, messageText(audience, id)),
          h('p', { class: 'wp-muted as-reason' }, t(`flaw.${id}`))
        );
      })
    );
  };

  const renderReflect = (round: RoundState, audience: AudienceId) => {
    const field = h('textarea', {
      id: 'as-draft',
      rows: 4,
      maxlength: 2000,
      'data-testid': 'as-draft',
      'data-focus': 'draft',
      oninput: (event: Event) => commit(setDraft(state, (event.target as HTMLTextAreaElement).value), { render: false })
    });
    field.value = round.draft;
    return h('section', { class: 'as-panel as-reflect', 'aria-labelledby': 'as-reflect-heading' },
      h('h3', { id: 'as-reflect-heading' }, t('step.reflect')),
      h('div', { class: 'as-compare' },
        h('div', {}, h('label', { for: 'as-draft' }, t('reflect.label')), field),
        h('div', { class: 'as-model', 'data-testid': 'as-model' }, h('p', { class: 'as-model-label' }, t('reflect.model')), h('p', {}, messageText(audience, 'fit')))
      ),
      h('fieldset', { class: 'as-checks' },
        h('legend', {}, t('reflect.checklist')),
        ...Array.from({ length: SELF_CHECKS }, (_, i) =>
          h('label', { class: 'as-check' },
            h('input', { type: 'checkbox', checked: round.checks[i] === true, 'data-testid': `as-check-${i}`, 'data-focus': `check-${i}`, onchange: () => commit(toggleCheck(state, i), { focus: `check-${i}` }) }),
            h('span', {}, t(CHECK_KEYS[i] as string))
          )
        )
      )
    );
  };

  const renderActions = (round: RoundState) => {
    const row = h('div', { class: 'wp-row as-actions' });
    const button = (key: string, testId: string, onclick: () => void, primary = true) =>
      h('button', { type: 'button', class: primary ? 'primary' : undefined, 'data-testid': testId, 'data-focus': testId, onclick: () => (paused ? undefined : onclick()) }, t(key));
    if (round.step === 'select') {
      row.appendChild(button('action.continue', 'as-continue', () => {
        if (round.selected.length === 0) say(t('select.needOne'));
        else commit(goToLead(state), { focus: 'round' });
      }));
    } else if (round.step === 'lead') {
      row.appendChild(button('action.back', 'as-back', () => commit(backToSelect(state), { focus: 'round' }), false));
      row.appendChild(button('common.check', 'as-check-selection', () => {
        if (round.lead === null) say(t('lead.needOne'));
        else commit(checkSelection(state), { focus: 'round' });
      }));
    } else if (round.step === 'message') {
      row.appendChild(button('common.check', 'as-check-message', () => {
        if (round.chosen === null) say(t('message.needOne'));
        else commit(checkMessage(state), { focus: 'round' });
      }));
    } else if (round.step === 'reflect') {
      const last = state.round === state.audiences.length - 1;
      row.appendChild(button(last ? 'action.finish' : 'action.next', 'as-next', () => commit(nextRound(state), { focus: last ? 'summary' : 'round' })));
    }
    return row;
  };

  const renderSummary = () => {
    const table = h('ul', { class: 'as-summary-list' },
      ...state.audiences.map((a, i) => {
        const s = scoreRound(state, i);
        const mark = (ok: boolean, yes: string, no: string) =>
          h('li', {}, h('span', { 'aria-hidden': 'true', class: 'as-symbol-inline' }, ok ? '✓ ' : '○ '), t(ok ? yes : no));
        return h('li', { class: 'as-summary-item wp-card', 'data-testid': `as-summary-${i}`, 'data-hits': s.hits, 'data-needed': s.needed, 'data-extras': s.extras },
          h('h3', {}, audienceName(a)),
          h('ul', {},
            h('li', {}, t('summary.facts', { hits: s.hits, needed: s.needed })),
            h('li', {}, t('summary.extras', { n: s.extras })),
            mark(s.leadCorrect, 'summary.leadSame', 'summary.leadOther'),
            mark(s.messageCorrect, 'summary.messageFit', 'summary.messageOther')
          )
        );
      })
    );
    return h('section', { class: 'as-summary', 'data-testid': 'as-summary', 'aria-labelledby': 'as-summary-heading' },
      h('h2', { id: 'as-summary-heading', tabindex: -1, 'data-focus': 'summary', 'data-autofocus': true }, t('summary.heading')),
      table,
      h('p', { class: 'wp-muted' }, t('summary.note'))
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
    restore(saved: AudienceSwitchState) {
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
