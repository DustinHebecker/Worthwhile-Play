/**
 * Probability Detective view: routes the current case to its screen (`view-clues`, `view-checks`, `view-traps`),
 * renders the round summary with the calibration notebook, and implements the game instance contract.
 */
import { bcp47Tag, type GameContext, type GameInstance, type NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import { createRound } from './generate';
import {
  MODES,
  NOTEBOOK_MIN,
  caseNotes,
  currentCase,
  isReview,
  isSummary,
  markReported,
  nextCase,
  notebookAdd,
  notebookBins,
  posteriorAfter,
  readNotebook,
  restartRound,
  reviewCase,
  reviewChecks,
  summarize,
  type CaseState,
  type Mode,
  type NoteEntry,
  type PdState,
  type SummaryRow
} from './rules';
import { DIFFICULTIES, type Difficulty } from './templates';
import { MARKS, createUi } from './ui';
import { checksExplanation, checksScreen, checksText } from './view-checks';
import { clueExplanation, clueScreen, clueText } from './view-clues';
import type { Host } from './view-host';
import { trapExplanation, trapScreen, trapText } from './view-traps';
import './styles.css';

const NOTEBOOK_KEY = 'calibration';
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createProbabilityDetective(context: GameContext): GameInstance<PdState> {
  const { t, root } = context;
  const locale = t.locale;
  const ui = createUi(t);
  let state: PdState = createRound(0, 'easy');
  let paused = false;
  let focusNext: string | null = null;

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'pd-announcer' });
  const main = h('div', { class: 'pd-main' });
  const container = h('div', { class: 'wp-probability-detective', dir: t.direction, lang: bcp47Tag(locale), 'data-testid': 'pd-root' }, main, live);

  /* ---------- Calibration notebook (device preferences; never state) ---------- */

  const notebook = (): NoteEntry[] => {
    try {
      return readNotebook(context.preferences?.get(NOTEBOOK_KEY));
    } catch {
      return [];
    }
  };
  const saveNotebook = (book: NoteEntry[]) => {
    try {
      context.preferences?.set(NOTEBOOK_KEY, book);
    } catch {
      /* preferences are optional */
    }
  };

  const host: Host = {
    ui,
    state: () => state,
    paused: () => paused,
    difficulty: () => state.difficulty,
    commit(next, focus = null, message) {
      if (next === state) return;
      state = next;
      context.requestSave();
      focusNext = focus;
      render();
      if (message) announce(live, message);
    },
    announce: (message) => announce(live, message),
    note(c) {
      const notes = caseNotes(c);
      if (notes.length) saveNotebook(notebookAdd(notebook(), notes));
    },
    nextButton() {
      const last = state.index === state.cases.length - 1;
      const next = h('button', { type: 'button', class: 'pd-primary', 'data-testid': last ? 'pd-summary-btn' : 'pd-next' }, t(last ? 'action.summary' : 'action.nextCase'));
      next.addEventListener('click', () => !paused && host.commit(nextCase(state), last ? 'pd-summary-heading' : 'pd-case-heading'));
      return next;
    },
    header: (title, kindKey) =>
      h(
        'header',
        { class: 'pd-head' },
        h('p', { class: 'pd-progress', 'data-testid': 'pd-progress' }, `${t('progress', { n: state.index + 1, total: state.cases.length })} · ${t(kindKey)}`),
        ui.heading('h2', 'pd-case-heading', title)
      )
  };

  /* ---------- Summary (design § 10.5) ---------- */

  const caseTitle = (c: CaseState) => (c.kind === 'clues' ? clueText(locale, c).title : c.kind === 'checks' ? checksText(locale, c).title : trapText(locale, c).title);

  /** The one-line verdict of a case for its summary entry: "You: ● 30 % · Exact: ● 25 % · ●●○ Close". */
  const verdictLine = (c: CaseState, row: SummaryRow): string => {
    if (c.kind === 'trap') return row.questions ? t('summary.trapRow', { a: ui.int(row.matches ?? 0), n: ui.int(row.questions) }) : t('skipped');
    const parts: string[] = [];
    const final = c.kind === 'clues' ? reviewCase(c).final : c.answer && c.answer !== 'skip' ? c.answer : null;
    if (final && row.band && isReview(c)) {
      const exact = c.kind === 'clues' ? posteriorAfter(c, c.clues.length) : reviewChecks(c).exact;
      // Two explanations: the share of the first says it all. Three: every share.
      const shown = final.length === 2 ? [0] : final.map((_, i) => i);
      parts.push(
        t('you', { p: shown.map((i) => `${MARKS[i]} ${ui.whole(final[i]!)}`).join(' · ') }),
        t('ledger.exact', { p: shown.map((i) => `${MARKS[i]} ${ui.pct(exact[i]!)}`).join(' · ') }),
        ui.bandText(row.band)
      );
    } else parts.push(t('skipped'));
    if (c.kind === 'checks' && row.bestDecision !== null) parts.push(t(row.bestDecision ? 'summary.best' : 'summary.other'));
    return parts.join(' · ');
  };

  /** The full explanation of a reviewed case, as on its review screen (headings one level down, no ids). */
  const explanation = (c: CaseState): (HTMLElement | string)[] =>
    !isReview(c) ? [] : c.kind === 'clues' ? clueExplanation(ui, c, 'h4') : c.kind === 'checks' ? checksExplanation(ui, c, 'h4') : trapExplanation(ui, c, 'h4');

  const calibration = () => {
    if (!context.preferences) return '';
    const book = notebook();
    const box = h('section', { class: 'pd-calibration', 'data-testid': 'pd-calibration' }, h('h3', {}, t('calib.heading')));
    if (book.length < NOTEBOOK_MIN) {
      box.append(h('p', {}, t('calib.few', { n: ui.int(NOTEBOOK_MIN), k: ui.int(book.length) })));
    } else {
      box.append(
        h('p', {}, t('calib.intro', { n: ui.int(book.length) })),
        h(
          'ul',
          { class: 'pd-calib-list' },
          ...notebookBins(book).map((b) => h('li', {}, t('calib.row', { p: ui.whole(b.centre), k: ui.int(b.hits), n: ui.int(b.count), q: ui.whole(Math.round((100 * b.hits) / b.count)) })))
        )
      );
    }
    if (book.length > 0) {
      const clearBtn = h('button', { type: 'button', class: 'pd-secondary', 'data-testid': 'pd-calib-clear' }, t('calib.clear'));
      clearBtn.addEventListener('click', () => {
        saveNotebook([]);
        focusNext = 'pd-summary-heading';
        render();
        announce(live, t('calib.cleared'));
      });
      box.append(clearBtn);
    }
    return box;
  };

  /*
   * Compact summary (owner decision 2026-10-29): the round's lines and the tip first, then the calibration notebook,
   * then one collapsed entry per case whose summary carries the title and a one-line verdict; the full explanation is
   * inside. All entries start collapsed, so the screen stays short at 360 px and every verdict line is visible at once.
   */
  const renderSummary = () => {
    const sum = summarize(state);
    const lines: HTMLElement[] = [];
    if (sum.rows.some((r) => r.kind !== 'trap')) lines.push(h('p', {}, t('summary.close', { a: ui.int(sum.veryClose), n: ui.int(sum.scored), b: ui.int(sum.close) })));
    if (sum.forecastAvg !== null && sum.exactAvg !== null) lines.push(h('p', {}, t('summary.forecast', { a: ui.int(sum.forecastAvg), b: ui.int(sum.exactAvg) })));
    if (sum.checkCases > 0) lines.push(h('p', { 'data-testid': 'pd-sum-checks' }, t('summary.checks', { a: ui.int(sum.bestDecisions), n: ui.int(sum.checkCases) })));
    if (sum.trapQuestions > 0) lines.push(h('p', { 'data-testid': 'pd-sum-traps' }, t('summary.traps', { a: ui.int(sum.trapMatches), n: ui.int(sum.trapQuestions) })));
    if (sum.habit) lines.push(h('p', { 'data-testid': 'pd-habit' }, t(`habit.${sum.habit}`)));
    if (sum.baseRateCases > 0) lines.push(h('p', {}, t('summary.baseRate', { n: ui.int(sum.baseRateCases) })));
    const kindKey = { clues: 'kind.clues', checks: 'kind.checks', trap: 'kind.trap' } as const;
    const cases = h(
      'ul',
      { class: 'pd-summary-list', 'data-testid': 'pd-summary-list' },
      ...state.cases.map((c, i) => {
        const row = sum.rows[i]!;
        return h(
          'li',
          { 'data-band': row.band ?? 'none', 'data-kind': row.kind },
          h(
            'details',
            { class: 'pd-case', 'data-testid': `pd-case-${i}` },
            h(
              'summary',
              {},
              h('strong', { class: 'pd-case-title' }, caseTitle(c)),
              // The verdict sits on its own line; screen readers hear a pause between title and verdict.
              h('span', { class: 'sr-only' }, ': '),
              h('span', { class: 'pd-case-line', 'data-testid': `pd-case-line-${i}` }, verdictLine(c, row))
            ),
            h(
              'div',
              { class: 'pd-case-body' },
              h('p', { class: 'pd-small' }, `${t('progress', { n: i + 1, total: state.cases.length })} · ${t(kindKey[c.kind])}`),
              ...explanation(c)
            )
          )
        );
      })
    );
    return [
      ui.heading('h2', 'pd-summary-heading', t('summary.heading')),
      h('div', { class: 'pd-sum-lines', 'data-testid': 'pd-sum-lines' }, ...lines),
      h('p', { class: 'pd-tip', 'data-testid': 'pd-tip', 'data-tip': sum.tip }, h('strong', {}, `${t('tip.heading')}: `), t(`tip.${sum.tip}`)),
      calibration(),
      h(
        'section',
        { class: 'pd-cases', 'aria-labelledby': 'pd-cases-h' },
        h('h3', { id: 'pd-cases-h' }, t('summary.cases')),
        h('p', { class: 'pd-small' }, t('summary.open')),
        cases
      )
    ];
  };

  /* ---------- Render ---------- */

  function render() {
    clear(main);
    if (isSummary(state)) {
      container.dataset.phase = 'summary';
      main.append(...renderSummary());
      if (!state.reported) {
        state = markReported(state);
        context.requestSave();
        const sum = summarize(state);
        context.finished({
          outcome: 'completed',
          stats: {
            cases: state.cases.length,
            scored: sum.scored,
            veryClose: sum.veryClose,
            close: sum.close,
            bestDecisions: sum.bestDecisions,
            trapMatches: sum.trapMatches,
            ...(sum.forecastAvg === null ? {} : { forecastAvg: sum.forecastAvg })
          }
        });
      }
    } else {
      const c = currentCase(state)!;
      container.dataset.phase = c.kind;
      main.append(...(c.kind === 'clues' ? clueScreen(host, c) : c.kind === 'checks' ? checksScreen(host, c) : trapScreen(host, c)));
    }
    if (focusNext) {
      main.querySelector<HTMLElement>(`#${focusNext}`)?.focus();
      focusNext = null;
    }
  }

  const show = (next: PdState) => {
    state = next;
    focusNext = null;
    if (!container.isConnected) root.appendChild(container);
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      // Settings are untrusted (design § 13): unknown values fall back to the defaults.
      const difficulty = (DIFFICULTIES as readonly string[]).includes(options.difficulty ?? '') ? (options.difficulty as Difficulty) : 'easy';
      const m = options.settings?.mode;
      const mode: Mode = typeof m === 'string' && (MODES as readonly string[]).includes(m) ? (m as Mode) : 'clues';
      show(createRound(options.seed, difficulty, mode));
    },
    restore(saved: PdState) {
      show(clone(saved));
    },
    serialize: () => clone(state),
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    reset() {
      show(restartRound(state));
      context.requestSave();
    },
    dispose() {
      clear(root);
    }
  };
}
