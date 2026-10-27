/**
 * Sense of Time view: the page (card column and timeline panel), routing of the current item to its screen, the
 * round summary, the axis-view preference and the game instance contract.
 */
import { bcp47Tag, type GameContext, type GameInstance, type NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import type { AxisView } from './axis';
import { createAxisView } from './axis-view';
import { contentFor } from './content';
import { formatYear } from './format';
import { createRound, currentItem, inReview, isSummary, markReported, next, restartRound, skip, startChoice, summarize, tendencyKey, firstRight, togetherRight, type Item, type TimelineState } from './rules';
import { BAND_MARKS, orderMark, pairsTotal } from './score';
import { createUi } from './ui';
import { firstScreen } from './view-first';
import type { Host, Screen } from './view-host';
import { orderScreen } from './view-order';
import { togetherScreen } from './view-together';
import { whenScreen } from './view-when';
import './styles.css';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** The current calendar year for typed "years ago" (the rules never read the clock). */
const currentYear = (): number => {
  const y = new Date().getFullYear();
  return Number.isFinite(y) ? Math.min(2100, Math.max(2026, y)) : 2026;
};

export function createTimeline(context: GameContext): GameInstance<TimelineState> {
  const { t, root } = context;
  const tt = (k: string, p?: Record<string, string | number>) => t(k, p);
  const pref = (): AxisView => {
    try {
      const v = context.preferences?.get('axis');
      return v === 'linear' ? 'linear' : 'log';
    } catch {
      return 'log';
    }
  };
  const ui = createUi(t, () => contentFor(t.locale));
  let state: TimelineState = createRound(0, 'easy', 'mixed', 'all');
  let paused = false;
  let focusNext: string | null = null;
  let fitKey = '';
  let screen: Screen | null = null;
  let scratch: Record<string, unknown> = {};

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'tl-announcer' });
  const axis = createAxisView(
    {
      t,
      reducedMotion: context.reducedMotion,
      paused: () => paused,
      onView(v) {
        try {
          context.preferences?.set('axis', v);
        } catch {
          /* preferences are optional */
        }
      },
      onPlace: (y, via) => screen?.onPlace?.(y, via),
      describe: (y) => t('when.placed', { date: formatYear(y, tt, t.locale) })
    },
    pref()
  );
  const card = h('section', { class: 'tl-card', 'data-testid': 'tl-card' });
  const panel = h('section', { class: 'tl-panel', 'aria-label': t('axis.label') }, axis.element);
  const layout = h('div', { class: 'tl-layout' }, card, panel);
  const note = h('p', { class: 'tl-foot', 'data-testid': 'tl-foot' }, t('note.content'));
  const container = h('div', { class: 'wp-timeline', dir: t.direction, lang: bcp47Tag(t.locale), 'data-testid': 'tl-root' }, layout, note, live);

  const host: Host = {
    ui,
    t,
    axis,
    nowYear: currentYear(),
    state: () => state,
    paused: () => paused,
    commit(nextState, focus = null, message) {
      if (nextState === state) return;
      state = nextState;
      context.requestSave();
      focusNext = focus;
      render();
      if (message) announce(live, message);
    },
    update(nextState) {
      if (nextState === state) return;
      state = nextState;
      context.requestSave();
    },
    refresh(focus = null) {
      focusNext = focus;
      render();
    },
    announce: (message) => announce(live, message),
    get scratch() {
      return scratch;
    },
    nextButton() {
      const last = state.index === state.items.length - 1;
      const b = h('button', { type: 'button', class: 'tl-primary', 'data-testid': last ? 'tl-summary-btn' : 'tl-next' }, t(last ? 'action.summary' : 'action.next'));
      b.addEventListener('click', () => !paused && host.commit(next(state), last ? 'tl-summary-heading' : 'tl-item-heading'));
      return b;
    },
    skipButton() {
      const b = h('button', { type: 'button', class: 'tl-secondary', 'data-testid': 'tl-skip' }, t('action.skip'));
      b.addEventListener('click', () => {
        if (paused) return;
        delete scratch.picked;
        host.commit(skip(state), 'tl-review-heading', t('action.skipped'));
      });
      return b;
    },
    header(item, title) {
      return h(
        'header',
        { class: 'tl-head' },
        h('p', { class: 'tl-progress', 'data-testid': 'tl-progress' }, `${t('progress', { n: ui.int(state.index + 1), total: ui.int(state.items.length) })} · ${t(`kind.${item.kind}`)}`),
        ui.heading('h2', 'tl-item-heading', title)
      );
    }
  };

  /* ---------- Summary (descriptive; no grades, § 13.2) ---------- */

  function itemLine(item: Item): string {
    const skipped = item.answer === 'skip';
    switch (item.kind) {
      case 'when': {
        const title = ui.title(item.event);
        if (skipped || item.band === null || typeof item.answer !== 'number') return t('summary.whenLine', { mark: '–', title, result: t('summary.skipped') });
        const e = ui.ev(item.event);
        const off = item.band === 0 ? t('summary.inRange') : `${t(`band.${item.band}`)} (${ui.duration(Math.abs(item.answer - Math.min(e.hi, Math.max(e.lo, item.answer))))})`;
        return t('summary.whenLine', { mark: BAND_MARKS[item.band], title, result: off });
      }
      case 'order': {
        if (skipped || item.pairs === null) return t('summary.orderLine', { mark: '–', result: t('summary.skipped') });
        const total = pairsTotal(item.events.length);
        return t('summary.orderLine', { mark: BAND_MARKS[orderMark(item.pairs, total)], result: t('order.result', { pairs: ui.int(item.pairs), total: ui.int(total) }) });
      }
      case 'first': {
        const r = firstRight(item);
        return t('summary.firstLine', { mark: r === null ? '–' : r ? '●●●' : '○○○', a: ui.title(item.a), b: ui.title(item.b), result: r === null ? t('summary.skipped') : t(r ? 'summary.right' : 'summary.wrong') });
      }
      case 'together': {
        const r = togetherRight(item);
        return t('summary.togetherLine', { mark: r === null ? '–' : r ? '●●●' : '○○○', title: ui.title(item.focus), result: r === null ? t('summary.skipped') : t(r ? 'summary.right' : 'summary.wrong') });
      }
    }
  }

  function renderSummary(): HTMLElement[] {
    const sum = summarize(state);
    const out: HTMLElement[] = [
      ui.heading('h2', 'tl-summary-heading', t('summary.heading')),
      h('ul', { class: 'tl-summary-list', 'data-testid': 'tl-summary-list' }, ...state.items.map((it) => h('li', { 'data-kind': it.kind }, itemLine(it))))
    ];
    const tk = tendencyKey(sum.tendency);
    if (tk) out.push(h('p', { 'data-testid': 'tl-tendency' }, t(`summary.${tk}`)));
    if (sum.pairsTotal) out.push(h('p', {}, t('summary.pairs', { n: ui.int(sum.pairsRight), total: ui.int(sum.pairsTotal) })));
    if (sum.firstAsked) out.push(h('p', {}, t('summary.first', { n: ui.int(sum.firstRight), total: ui.int(sum.firstAsked) })));
    if (sum.togetherAsked) out.push(h('p', {}, t('summary.together', { n: ui.int(sum.togetherRight), total: ui.int(sum.togetherAsked) })));
    out.push(h('p', { class: 'tl-tip', 'data-testid': 'tl-tip' }, t(`summary.tip.${sum.tip}`)));
    out.push(h('p', { class: 'tl-muted' }, t('summary.marks', { marks: [1, 2, 3, 4].map((b) => `${BAND_MARKS[b]} ${t(`band.${b}`)}`).join(' · ') })));
    return out;
  }

  /* ---------- Render ---------- */

  function render() {
    clear(card);
    if (isSummary(state)) {
      container.dataset.phase = 'summary';
      screen = null;
      card.append(...renderSummary());
      axis.show({ mode: 'explore', ariaLabel: t('axis.label') });
      if (fitKey !== 'summary') {
        fitKey = 'summary';
        axis.fit({ lo: -Infinity, hi: Infinity });
      }
      if (!state.reported) {
        state = markReported(state);
        context.requestSave();
        const sum = summarize(state);
        context.finished({
          outcome: 'completed',
          stats: { items: sum.items, answered: sum.answered, closeOrBetter: sum.closeOrBetter, pairsRight: sum.pairsRight, pairsTotal: sum.pairsTotal }
        });
      }
    } else {
      const item = currentItem(state)!;
      const phase = inReview(item) ? 'review' : 'question';
      const key = `${state.seed}:${state.index}:${phase}`;
      if (key !== fitKey) scratch = {};
      container.dataset.phase = `${item.kind}-${phase}`;
      screen = item.kind === 'when' ? whenScreen(host, item) : item.kind === 'order' ? orderScreen(host, item) : item.kind === 'first' ? firstScreen(host, item) : togetherScreen(host, item);
      card.append(...screen.card);
      axis.show(screen.scene);
      if (key !== fitKey) {
        fitKey = key;
        if (screen.fit === null) axis.fit({ lo: -Infinity, hi: Infinity });
        else if (screen.fit) axis.fit(screen.fit, phase === 'review');
      }
    }
    if (focusNext) {
      container.querySelector<HTMLElement>(`#${focusNext}`)?.focus();
      focusNext = null;
    }
  }

  const show = (s: TimelineState) => {
    state = s;
    focusNext = null;
    fitKey = '';
    scratch = {};
    if (!container.isConnected) root.appendChild(container);
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      const c = startChoice(options.difficulty, options.settings);
      show(createRound(options.seed, c.difficulty, c.mode, c.span));
    },
    restore(saved: TimelineState) {
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
      axis.dispose();
      clear(root);
    }
  };
}
