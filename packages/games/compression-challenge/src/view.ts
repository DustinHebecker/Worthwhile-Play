import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, append, clear, h } from '@wp/ui';
import { contentFor, type PieceText } from './content';
import { NOTED_BULLETS, NOTED_SUMMARIES, type BulletId, type SummaryId, type VersionId } from './pieces';
import {
  BULLET_PICKS,
  SCORED_STEPS,
  SELF_CHECKS,
  STEPS,
  WORD_TARGET,
  canCheck,
  check,
  chooseSummary,
  chooseVersion,
  countWords,
  createInitialState,
  isFinished,
  isGoldBullet,
  isNeededDetail,
  kindOf,
  next,
  pieceOf,
  scoreBullets,
  scoreCore,
  scoreDetails,
  setDraft,
  stepIndex,
  summarize,
  toDifficulty,
  toggleBullet,
  toggleCheck,
  toggleDetail,
  toggleSentence,
  verdictOf,
  type CompressionState,
  type Step,
  type Verdict
} from './rules';
import './styles.css';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const VERDICT_SYMBOL: Readonly<Record<Verdict, string>> = { hit: '✓', miss: '✗', extra: '✗', skipped: '✓' };
const CHECK_KEYS = ['check.key', 'check.nothingAdded', 'check.short'] as const;
type ScoredStep = Exclude<Step, 'done'>;

export function createCompressionChallenge(context: GameContext): GameInstance<CompressionState> {
  const { t } = context;
  let state = createInitialState(0);
  let paused = false;
  /** Transient hint (e.g. "tick at least one sentence"), not part of the logical state. */
  let notice = '';
  /** Whether the collapsible source text is open; a view preference only. */
  let sourceOpen = true;
  let reportedFinish = false;

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'cc-live' });
  const board = h('div', { class: 'cc-board' });
  const container = h('div', { class: 'wp-compression-challenge', dir: t.direction, lang: t.locale }, board, live);

  const text = (): PieceText => contentFor(t.locale)[state.piece] as PieceText;
  const sentenceText = (id: string) => text().sentences[id] ?? '';
  const words = (s: string) => countWords(s, t.locale);
  const stepName = (step: ScoredStep) => t(`stepName.${step}`);
  const stepHeading = (step: ScoredStep) => t('step.heading', { n: stepIndex(step) + 1, total: SCORED_STEPS, step: stepName(step) });

  // --- State changes ---------------------------------------------------------------------------

  /** Applies a rules transition; re-renders and saves only when the state really changed. */
  const commit = (nextState: CompressionState, options: { focus?: string; render?: boolean } = {}) => {
    if (paused || nextState === state) return false;
    const before = { step: state.step, checked: state.checked };
    state = nextState;
    notice = '';
    if (options.render !== false) render(options.focus);
    context.requestSave();
    if (state.step !== before.step || state.checked !== before.checked) {
      if (isFinished(state)) announce(live, t('result.completed'));
      else if (state.checked) announce(live, t('feedback.heading'));
      else announce(live, stepHeading(state.step as ScoredStep));
    }
    if (isFinished(state) && !reportedFinish) {
      reportedFinish = true;
      const s = summarize(state);
      context.finished({
        outcome: 'completed',
        stats: {
          coreSentences: s.core?.gold ?? 0,
          coreTicked: s.core?.hits ?? 0,
          otherTicked: s.core?.extras ?? 0,
          bestBullets: s.bullets?.hits ?? 0,
          faithfulSentence: s.sentence ? 1 : 0,
          neededDetails: s.details?.gold ?? 0,
          detailsTicked: s.details?.hits ?? 0,
          actionableVersion: s.version ? 1 : 0
        }
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

  // --- Rendering -------------------------------------------------------------------------------

  const focusKeyOf = (el: Element | null) => (el instanceof HTMLElement && container.contains(el) ? (el.dataset.focus ?? null) : null);

  const render = (focus?: string) => {
    const previousFocus = focus ?? focusKeyOf(document.activeElement);
    clear(board);
    append(board, renderIntro(), renderStepper());
    board.appendChild(isFinished(state) ? renderSummary() : renderStep());
    if (previousFocus) board.querySelector<HTMLElement>(`[data-focus="${previousFocus}"]`)?.focus();
  };

  const renderIntro = () =>
    h('section', { class: 'cc-intro wp-card', 'aria-labelledby': 'cc-title', 'data-testid': 'cc-intro', 'data-piece': state.piece },
      h('h2', { id: 'cc-title' }, text().title),
      h('p', { class: 'wp-muted' }, text().context)
    );

  const renderStepper = () =>
    h('ol', { class: 'cc-steps', 'aria-label': t('steps.heading') },
      ...STEPS.filter((s): s is ScoredStep => s !== 'done').map((s) => {
        const i = stepIndex(s);
        const current = stepIndex(state.step);
        const status = i < current ? 'done' : i === current ? 'current' : 'next';
        return h('li', { class: `cc-chip cc-chip-${status}`, 'data-testid': `cc-stepper-${s}`, 'data-status': status, 'aria-current': status === 'current' ? 'step' : undefined },
          h('span', { 'aria-hidden': 'true', class: 'cc-chip-mark' }, status === 'done' ? '✓' : status === 'current' ? '▶' : String(i + 1)),
          h('span', { class: 'sr-only' }, t(`stepper.${status}`, { step: stepName(s) })),
          h('span', { 'aria-hidden': 'true' }, stepName(s))
        );
      })
    );

  const renderStep = () => {
    const step = state.step as ScoredStep;
    const section = h('section', { class: 'cc-step', 'data-testid': 'cc-step', 'data-step': step, 'data-checked': state.checked ? 'true' : 'false', 'aria-labelledby': 'cc-step-heading' },
      h('h2', { id: 'cc-step-heading', tabindex: -1, 'data-focus': 'step', 'data-autofocus': true }, stepHeading(step)),
      h('p', { class: 'wp-status', 'data-testid': 'cc-task' }, t(`task.${step}`))
    );
    if (step === 'core') section.appendChild(state.checked ? renderCoreFeedback() : renderCoreChoice());
    else {
      section.appendChild(renderSource());
      if (step === 'bullets') section.appendChild(renderBullets());
      else if (step === 'sentence') {
        section.appendChild(renderSummaries());
        if (state.checked) section.appendChild(renderReflect());
      } else {
        section.appendChild(renderOneLiner());
        section.appendChild(step === 'details' ? renderDetails() : renderVersions());
      }
    }
    if (notice) section.appendChild(h('p', { class: 'cc-notice', role: 'status', tabindex: -1, 'data-focus': 'notice', 'data-testid': 'cc-notice' }, notice));
    section.appendChild(renderActions());
    return section;
  };

  /** The text as a paragraph, collapsible; core sentences are marked once step 1 is checked. */
  const renderSource = () => {
    const def = pieceOf(state);
    const all = state.sentences.map(sentenceText).join(' ');
    const paragraph = h('p', { class: 'cc-source-text' },
      ...state.sentences.flatMap((id, i) => {
        const sentence = sentenceText(id);
        const node = kindOf(def, id) === 'core'
          ? h('strong', { class: 'cc-core-mark', 'data-testid': `cc-core-${id}` }, h('span', { 'aria-hidden': 'true' }, '▸ '), sentence)
          : h('span', {}, sentence);
        return i === 0 ? [node] : [' ', node];
      })
    );
    const details = h('details', { class: 'cc-source wp-card', 'data-testid': 'cc-source', open: sourceOpen },
      h('summary', {}, t('text.heading'), ' · ', t('text.words', { n: words(all) })),
      h('p', { class: 'wp-muted cc-legend' }, t('text.coreMarked')),
      paragraph
    );
    details.addEventListener('toggle', () => {
      sourceOpen = (details as HTMLDetailsElement).open;
    });
    return details;
  };

  const checkboxCard = (attrs: { checked: boolean; testId: string; focus: string; onchange: () => void; type?: 'checkbox' | 'radio'; name?: string }, ...content: (Node | string)[]) =>
    h('label', { class: `cc-option${attrs.checked ? ' is-checked' : ''}` },
      h('input', {
        type: attrs.type ?? 'checkbox',
        name: attrs.name,
        checked: attrs.checked,
        'data-testid': attrs.testId,
        'data-focus': attrs.focus,
        onchange: attrs.onchange
      }),
      h('span', { class: 'cc-option-text' }, ...content)
    );

  // Step 1: core sentences.
  const renderCoreChoice = () => {
    const all = state.sentences.map(sentenceText).join(' ');
    return h('fieldset', { class: 'cc-options', 'data-testid': 'cc-sentences' },
      h('legend', {}, t('text.heading'), ' · ', t('text.words', { n: words(all) })),
      ...state.sentences.map((id) =>
        checkboxCard({ checked: state.core.includes(id), testId: `cc-sentence-${id}`, focus: `sentence-${id}`, onchange: () => commit(toggleSentence(state, id), { focus: `sentence-${id}` }) }, sentenceText(id))
      ),
      h('p', { class: 'wp-muted cc-count', 'data-testid': 'cc-count' }, t('count.ticked', { n: state.core.length }))
    );
  };

  const verdictItem = (testId: string, verdict: Verdict, label: string, body: string, reason: string) =>
    h('li', { class: `cc-verdict cc-verdict-${verdict}`, 'data-testid': testId, 'data-verdict': verdict },
      h('span', { class: 'cc-symbol', 'aria-hidden': 'true' }, VERDICT_SYMBOL[verdict]),
      h('div', {},
        h('p', { class: 'cc-verdict-label' }, label),
        h('p', {}, body),
        h('p', { class: 'wp-muted cc-reason' }, reason)
      )
    );

  const renderCoreFeedback = () => {
    const def = pieceOf(state);
    const score = scoreCore(state);
    const join = (ids: readonly string[]) => ids.map(sentenceText).join(' ');
    const mine = state.sentences.filter((id) => state.core.includes(id));
    const core = state.sentences.filter((id) => kindOf(def, id) === 'core');
    return h('section', { class: 'cc-panel', 'data-testid': 'cc-core-feedback', 'aria-labelledby': 'cc-core-feedback-heading' },
      h('h3', { id: 'cc-core-feedback-heading' }, t('feedback.heading')),
      h('p', { 'data-testid': 'cc-core-result' }, t('core.result', { hits: score.hits, gold: score.gold, extras: score.extras })),
      h('p', { class: 'wp-muted', 'data-testid': 'cc-core-length' }, t('core.length', { mine: words(join(mine)), core: words(join(core)), total: words(join(state.sentences)) })),
      h('ul', { class: 'cc-feedback' },
        ...state.sentences.map((id) => {
          const kind = kindOf(def, id) ?? 'detail';
          const verdict = verdictOf(kind === 'core', state.core.includes(id));
          return verdictItem(`cc-verdict-${id}`, verdict, t(`core.${verdict}`), sentenceText(id), t(`kind.${kind}`));
        })
      )
    );
  };

  // Step 2: three bullets.
  const bulletNote = (id: BulletId) =>
    (NOTED_BULLETS as readonly string[]).includes(id) ? text().bulletNotes[id as (typeof NOTED_BULLETS)[number]] : t(isGoldBullet(id) ? 'bullet.gold' : 'bullet.minor');

  const renderBullets = () => {
    if (!state.checked) {
      return h('fieldset', { class: 'cc-options', 'data-testid': 'cc-bullets' },
        h('legend', { class: 'sr-only' }, t('task.bullets')),
        ...state.bullets.map((id, i) =>
          checkboxCard({
            checked: state.picks.includes(id),
            testId: `cc-bullet-${i}`,
            focus: `bullet-${i}`,
            onchange: () => {
              if (!commit(toggleBullet(state, id), { focus: `bullet-${i}` }) && !state.picks.includes(id)) say(t('need.bulletsFull'));
            }
          }, h('span', { 'aria-hidden': 'true' }, '• '), text().bullets[id])
        ),
        h('p', { class: 'wp-muted cc-count', 'data-testid': 'cc-count' }, t('count.bullets', { n: state.picks.length, total: BULLET_PICKS }))
      );
    }
    const score = scoreBullets(state);
    return h('section', { class: 'cc-panel', 'data-testid': 'cc-bullets-feedback' },
      h('p', { 'data-testid': 'cc-bullets-result' }, t('bullets.result', { hits: score.hits, total: BULLET_PICKS })),
      h('ul', { class: 'cc-feedback' },
        ...state.bullets.map((id, i) => {
          const verdict = verdictOf(isGoldBullet(id), state.picks.includes(id));
          return verdictItem(`cc-bullet-${i}`, verdict, t(`bullets.${verdict}`), text().bullets[id], bulletNote(id));
        })
      )
    );
  };

  // Step 3: one sentence (+ optional own sentence).
  const summaryNote = (id: SummaryId) =>
    (NOTED_SUMMARIES as readonly string[]).includes(id) ? text().summaryNotes[id as (typeof NOTED_SUMMARIES)[number]] : t(`sentenceNote.${id}`);

  const renderSummaries = () => {
    if (!state.checked) {
      return h('fieldset', { class: 'cc-options', 'data-testid': 'cc-summaries' },
        h('legend', { class: 'sr-only' }, t('task.sentence')),
        ...state.summaries.map((id, i) =>
          checkboxCard({ type: 'radio', name: 'cc-summary', checked: state.summary === id, testId: `cc-summary-${i}`, focus: `summary-${i}`, onchange: () => commit(chooseSummary(state, id), { focus: `summary-${i}` }) },
            h('strong', {}, t('option.label', { n: i + 1 })), ' ', text().summaries[id])
        )
      );
    }
    const right = state.summary === 'faithful';
    return h('section', { class: 'cc-panel', 'data-testid': 'cc-summaries-feedback' },
      h('p', { 'data-testid': 'cc-sentence-result', 'data-correct': right ? 'true' : 'false' },
        h('span', { 'aria-hidden': 'true' }, right ? '✓ ' : '○ '), t(right ? 'sentence.right' : 'sentence.wrong')),
      ...state.summaries.map((id, i) => revealed(`cc-summary-${i}`, i, id === 'faithful', state.summary === id, text().summaries[id], summaryNote(id), 'badge.faithful', 'badge.notFaithful'))
    );
  };

  const revealed = (testId: string, i: number, best: boolean, chosen: boolean, body: string, note: string, yes: string, no: string) =>
    h('div', { class: `cc-option is-revealed${best ? ' is-best' : ''}${chosen ? ' is-checked' : ''}`, 'data-testid': testId, 'data-best': best ? 'true' : 'false', 'data-chosen': chosen ? 'true' : 'false' },
      h('p', {},
        h('strong', {}, t('option.label', { n: i + 1 })),
        ' ',
        h('span', { class: 'cc-badge' }, h('span', { 'aria-hidden': 'true' }, best ? '✓ ' : '✗ '), t(best ? yes : no)),
        chosen ? h('span', { class: 'cc-badge cc-badge-yours' }, t('badge.yours')) : null
      ),
      h('p', {}, body),
      h('p', { class: 'wp-muted cc-reason' }, note)
    );

  const renderReflect = () => {
    const count = h('p', { class: 'wp-muted cc-count', id: 'cc-draft-count', 'data-testid': 'cc-draft-count', 'aria-live': 'polite' });
    const updateCount = () => {
      count.textContent = t('reflect.words', { n: words(state.draft), target: WORD_TARGET });
    };
    updateCount();
    const field = h('textarea', {
      id: 'cc-draft',
      rows: 3,
      maxlength: 600,
      'aria-describedby': 'cc-draft-count',
      'data-testid': 'cc-draft',
      'data-focus': 'draft',
      oninput: (event: Event) => {
        if (commit(setDraft(state, (event.target as HTMLTextAreaElement).value), { render: false })) updateCount();
      }
    });
    field.value = state.draft;
    return h('section', { class: 'cc-panel cc-reflect', 'aria-labelledby': 'cc-reflect-heading' },
      h('h3', { id: 'cc-reflect-heading' }, t('reflect.heading')),
      h('div', { class: 'cc-compare' },
        h('div', {}, h('label', { for: 'cc-draft' }, t('reflect.label')), field, count),
        h('div', { class: 'cc-model', 'data-testid': 'cc-model' }, h('p', { class: 'cc-model-label' }, t('reflect.model')), h('p', {}, text().summaries.faithful))
      ),
      h('fieldset', { class: 'cc-checks' },
        h('legend', {}, t('reflect.checklist')),
        ...Array.from({ length: SELF_CHECKS }, (_, i) =>
          h('label', { class: 'cc-option cc-check' },
            h('input', { type: 'checkbox', checked: state.checks[i] === true, 'data-testid': `cc-check-${i}`, 'data-focus': `check-${i}`, onchange: () => commit(toggleCheck(state, i), { focus: `check-${i}` }) }),
            h('span', {}, t(CHECK_KEYS[i] as string, { target: WORD_TARGET }))
          )
        )
      )
    );
  };

  // Steps 4 and 5: expansion.
  const renderOneLiner = () =>
    h('div', { class: 'cc-oneliner', 'data-testid': 'cc-oneliner' },
      h('p', { class: 'cc-model-label' }, t('oneLiner.heading')),
      h('p', { class: 'cc-oneliner-text' }, h('span', { 'aria-hidden': 'true' }, '“'), text().oneLiner, h('span', { 'aria-hidden': 'true' }, '”')),
      h('p', { class: 'wp-muted' }, text().task)
    );

  const renderDetails = () => {
    const def = pieceOf(state);
    if (!state.checked) {
      return h('fieldset', { class: 'cc-options', 'data-testid': 'cc-details' },
        h('legend', { class: 'sr-only' }, t('task.details')),
        ...state.details.map((id) =>
          checkboxCard({ checked: state.needs.includes(id), testId: `cc-detail-${id}`, focus: `detail-${id}`, onchange: () => commit(toggleDetail(state, id), { focus: `detail-${id}` }) }, text().details[id] ?? '')
        ),
        h('p', { class: 'wp-muted cc-count', 'data-testid': 'cc-count' }, t('count.ticked', { n: state.needs.length }))
      );
    }
    const score = scoreDetails(state);
    return h('section', { class: 'cc-panel', 'data-testid': 'cc-details-feedback' },
      h('p', { 'data-testid': 'cc-details-result' }, t('details.result', { hits: score.hits, gold: score.gold, extras: score.extras })),
      h('ul', { class: 'cc-feedback' },
        ...state.details.map((id) => {
          const needed = isNeededDetail(def, id);
          const verdict = verdictOf(needed, state.needs.includes(id));
          return verdictItem(`cc-detail-${id}`, verdict, t(`details.${verdict}`), text().details[id] ?? '', t(needed ? 'detail.needed' : 'detail.notNeeded'));
        })
      )
    );
  };

  const versionNote = (id: VersionId) => (id === 'invented' ? text().versionNote : t(`versionNote.${id}`));

  const renderVersions = () => {
    if (!state.checked) {
      return h('fieldset', { class: 'cc-options', 'data-testid': 'cc-versions' },
        h('legend', { class: 'sr-only' }, t('task.expand')),
        ...state.versions.map((id, i) =>
          checkboxCard({ type: 'radio', name: 'cc-version', checked: state.expanded === id, testId: `cc-version-${i}`, focus: `version-${i}`, onchange: () => commit(chooseVersion(state, id), { focus: `version-${i}` }) },
            h('strong', {}, t('option.label', { n: i + 1 })), ' ', text().versions[id])
        )
      );
    }
    const right = state.expanded === 'actionable';
    return h('section', { class: 'cc-panel', 'data-testid': 'cc-versions-feedback' },
      h('p', { 'data-testid': 'cc-version-result', 'data-correct': right ? 'true' : 'false' },
        h('span', { 'aria-hidden': 'true' }, right ? '✓ ' : '○ '), t(right ? 'version.right' : 'version.wrong')),
      ...state.versions.map((id, i) => revealed(`cc-version-${i}`, i, id === 'actionable', state.expanded === id, text().versions[id], versionNote(id), 'badge.actionable', 'badge.notActionable'))
    );
  };

  const renderActions = () => {
    const row = h('div', { class: 'wp-row cc-actions' });
    const button = (key: string, testId: string, onclick: () => void) =>
      h('button', { type: 'button', class: 'primary', 'data-testid': testId, 'data-focus': testId, onclick: () => (paused ? undefined : onclick()) }, t(key));
    if (!state.checked) {
      row.appendChild(button('common.check', 'cc-check', () => {
        if (canCheck(state)) commit(check(state), { focus: 'step' });
        else say(t(`need.${state.step}`));
      }));
    } else {
      const last = state.step === 'expand';
      row.appendChild(button(last ? 'action.finish' : 'action.next', 'cc-next', () => commit(next(state), { focus: last ? 'summary' : 'step' })));
    }
    return row;
  };

  const renderSummary = () => {
    const s = summarize(state);
    const def = pieceOf(state);
    const join = (ids: readonly string[]) => words(ids.map(sentenceText).join(' '));
    const core = s.core ?? { gold: 0, hits: 0, extras: 0 };
    const details = s.details ?? { gold: 0, hits: 0, extras: 0 };
    const mark = (ok: boolean, yes: string, no: string, testId: string) =>
      h('li', { 'data-testid': testId, 'data-correct': ok ? 'true' : 'false' }, h('span', { 'aria-hidden': 'true' }, ok ? '✓ ' : '○ '), t(ok ? yes : no));
    return h('section', { class: 'cc-summary', 'data-testid': 'cc-summary', 'aria-labelledby': 'cc-summary-heading' },
      h('h2', { id: 'cc-summary-heading', tabindex: -1, 'data-focus': 'summary', 'data-autofocus': true }, t('end.heading')),
      h('ul', { class: 'cc-summary-list wp-card' },
        h('li', { 'data-testid': 'cc-end-core' }, t('end.core', { hits: core.hits, gold: core.gold, extras: core.extras })),
        h('li', { 'data-testid': 'cc-end-bullets' }, t('end.bullets', { hits: s.bullets?.hits ?? 0, total: BULLET_PICKS })),
        mark(s.sentence === true, 'end.sentenceYes', 'end.sentenceNo', 'cc-end-sentence'),
        h('li', { 'data-testid': 'cc-end-details' }, t('end.details', { hits: details.hits, gold: details.gold, extras: details.extras })),
        mark(s.version === true, 'end.versionYes', 'end.versionNo', 'cc-end-version')
      ),
      h('p', { 'data-testid': 'cc-end-ladder' }, t('end.ladder', { total: join(state.sentences), core: join(state.sentences.filter((id) => kindOf(def, id) === 'core')) })),
      state.draft.trim() === ''
        ? null
        : h('div', { class: 'cc-compare' },
            h('div', { class: 'cc-own', 'data-testid': 'cc-end-own' }, h('p', { class: 'cc-model-label' }, t('end.own')), h('p', {}, state.draft)),
            h('div', { class: 'cc-model' }, h('p', { class: 'cc-model-label' }, t('reflect.model')), h('p', {}, text().summaries.faithful))
          ),
      h('p', { class: 'wp-muted' }, t('end.note'))
    );
  };

  // --- GameInstance ----------------------------------------------------------------------------

  const mount = () => {
    if (!container.isConnected) context.root.appendChild(container);
    notice = '';
    sourceOpen = true;
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      state = createInitialState(options.seed, toDifficulty(options.difficulty));
      reportedFinish = false;
      mount();
    },
    restore(saved: CompressionState) {
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
