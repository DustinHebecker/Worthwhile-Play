/**
 * Atlas Explorer view: the atlas page (map and card), routing of the current item to its screen, the round summary,
 * the display preferences and the game instance contract.
 */
import { bcp47Tag, type GameContext, type GameInstance, type NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import { contentFor, withContent } from './content';
import { atlasSync } from './data';
import type { DistanceUnit } from './format';
import { createMapView, type Scene } from './map-view';
import { createRound, currentItem, isSummary, markReported, next, restartRound, skip, startChoice, summarize } from './rules';
import { inReview, type AtlasState, type Item } from './state';
import { BAND_MARKS, createUi } from './ui';
import { REGION_BOX, describePoint } from './view-common';
import { compareQuestion, compareScreen, compareVerdict } from './view-compare';
import { findDescribe, findScreen, findTitle, verdictText } from './view-find';
import type { Host, Screen } from './view-host';
import { mysteryScreen } from './view-mystery';
import { routeScreen } from './view-route';
import './styles.css';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createAtlasExplorer(context: GameContext): GameInstance<AtlasState> {
  const { root } = context;
  // In-game texts come from the preloaded per-locale content (ADR 0011), the rest from the host.
  const t = withContent(context.t);
  const atlas = atlasSync();
  const pref = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
    try {
      const v = context.preferences?.get(key);
      return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
    } catch {
      return fallback;
    }
  };
  let unit: DistanceUnit = pref('unit', ['km', 'mi'] as const, 'km');
  let labelSize = pref('labels', ['normal', 'large'] as const, 'normal');
  const ui = createUi(t, atlas, () => contentFor(t.locale), () => unit);
  let state: AtlasState = createRound(0, 'easy', 'mixed', 'world', atlas);
  let paused = false;
  let focusNext: string | null = null;
  let explored: [number, number] | null = null;
  let fitKey = '';
  let screen: Screen | null = null;

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'ae-announcer' });
  const card = h('section', { class: 'ae-card', 'data-testid': 'ae-card' });
  const map = createMapView({
    atlas,
    t,
    reducedMotion: context.reducedMotion,
    paused: () => paused,
    onPick: (lon, lat, via, client) => screen?.onPick(lon, lat, via, client),
    describe(lon, lat) {
      const item = currentItem(state);
      return item?.kind === 'find' ? findDescribe(host, item, lon, lat) : describePoint(ui, atlas, lon, lat);
    },
    lineLabel: (id) => t(`line.${id}`),
    latLabel: (lat) => ui.lat(lat, 0)
  });
  const prefs = preferencesBox();
  const layout = h('div', { class: 'ae-layout' }, h('div', { class: 'ae-mapcol' }, map.element), card);
  const note = h('p', { class: 'ae-note', 'data-testid': 'ae-note' }, t('note.data'));
  const container = h('div', { class: 'wp-atlas-explorer', dir: t.direction, lang: bcp47Tag(t.locale), 'data-testid': 'ae-root' }, layout, prefs, note, live);

  const host: Host = {
    ui,
    atlas,
    map,
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
    refresh(focus = null) {
      focusNext = focus;
      render();
    },
    announce: (message) => announce(live, message),
    nextButton() {
      const last = state.index === state.items.length - 1;
      const b = h('button', { type: 'button', class: 'ae-primary', 'data-testid': last ? 'ae-summary-btn' : 'ae-next' }, t(last ? 'action.summary' : 'action.next'));
      b.addEventListener('click', () => !paused && host.commit(next(state), last ? 'ae-summary-heading' : 'ae-item-heading'));
      return b;
    },
    skipButton() {
      const b = h('button', { type: 'button', class: 'ae-secondary', 'data-testid': 'ae-skip' }, t('action.skip'));
      b.addEventListener('click', () => !paused && host.commit(skip(state), 'ae-review-heading', t('action.skipped')));
      return b;
    },
    header(item, title) {
      return h(
        'header',
        { class: 'ae-head' },
        h('p', { class: 'ae-progress', 'data-testid': 'ae-progress' }, `${t('progress', { n: ui.int(state.index + 1), total: ui.int(state.items.length) })} · ${t(`kind.${item.kind}`)}`),
        ui.heading('h2', 'ae-item-heading', title)
      );
    },
    explored: () => explored,
    setExplored(p) {
      explored = p;
    }
  };

  /* ---------- Display preferences (device, never state) ---------- */

  function preferencesBox(): HTMLElement {
    const choice = (name: string, label: string, values: readonly [string, string][], current: () => string, set: (v: string) => void) => {
      const fs = h('fieldset', { class: 'ae-pref' }, h('legend', {}, label));
      for (const [v, text] of values) {
        const input = h('input', { type: 'radio', name: `ae-${name}`, value: v, 'data-testid': `ae-pref-${name}-${v}` });
        input.checked = current() === v;
        input.addEventListener('change', () => {
          set(v);
          try {
            context.preferences?.set(name, v);
          } catch {
            /* preferences are optional */
          }
          render();
        });
        fs.append(h('label', { class: 'ae-option' }, input, ' ', text));
      }
      return fs;
    };
    return h(
      'details',
      { class: 'ae-prefs', 'data-testid': 'ae-prefs' },
      h('summary', {}, t('pref.heading')),
      choice('unit', t('pref.unit'), [['km', t('pref.km')], ['mi', t('pref.mi')]], () => unit, (v) => (unit = v as DistanceUnit)),
      choice('labels', t('pref.labels'), [['normal', t('pref.normal')], ['large', t('pref.large')]], () => labelSize, (v) => (labelSize = v as 'normal' | 'large'))
    );
  }

  /* ---------- Summary (descriptive; no grades) ---------- */

  const itemLine = (item: Item): string => {
    switch (item.kind) {
      case 'find': {
        const title = findTitle(host, item);
        if (item.band === null) return `${title}: ${t('summary.skipped')}`;
        return `${title}: ${verdictText(host, item)}${item.km ? ` (${ui.km(item.km)})` : ''}`;
      }
      case 'compare':
        return `${compareQuestion(host, item)} ${item.answer === 'skip' ? t('summary.skipped') : compareVerdict(host, item)}`;
      case 'mystery':
        return `${t('kind.mystery')}: ${item.end === 'solved' ? t('summary.found', { name: ui.country(item.target), c: ui.int(item.shown), g: ui.int(item.guesses.length) }) : t('summary.lookedUp', { name: ui.country(item.target) })}`;
      case 'route':
        return `${ui.country(item.from)} → ${ui.country(item.to)}: ${item.end === 'arrived' ? t('summary.route', { n: ui.int(item.path.length - 1), best: ui.int(item.best) }) : t('summary.lookedUpRoute', { best: ui.int(item.best) })}`;
    }
  };

  function renderSummary(): HTMLElement[] {
    const sum = summarize(state);
    const lines: HTMLElement[] = [];
    if (sum.finds) lines.push(h('p', { 'data-testid': 'ae-sum-finds' }, t('summary.finds', { a: ui.int(sum.bands[0]), b: ui.int(sum.bands[1]), c: ui.int(sum.bands[2]), d: ui.int(sum.bands[3]) })));
    if (sum.compared) lines.push(h('p', { 'data-testid': 'ae-sum-compare' }, t('summary.compared', { n: ui.int(sum.compared), m: ui.int(sum.matched) })));
    if (sum.mysteries) lines.push(h('p', {}, t('summary.mysteries', { a: ui.int(sum.solved), n: ui.int(sum.mysteries) })));
    if (sum.routes) lines.push(h('p', {}, t('summary.routes', { a: ui.int(sum.arrived), n: ui.int(sum.routes), s: ui.int(sum.shortest) })));
    return [
      ui.heading('h2', 'ae-summary-heading', t('summary.heading')),
      h('ul', { class: 'ae-summary-list', 'data-testid': 'ae-summary-list' }, ...state.items.map((it) => h('li', { 'data-kind': it.kind }, itemLine(it)))),
      ...lines,
      h('p', { class: 'ae-muted' }, t('summary.marks', { marks: BAND_MARKS.map((m, i) => `${m} ${t(`band.${i}`)}`).join(' · ') }))
    ];
  }

  /* ---------- Render ---------- */

  function render() {
    container.dataset.labels = labelSize;
    clear(card);
    if (isSummary(state)) {
      container.dataset.phase = 'summary';
      screen = null;
      card.append(...renderSummary());
      map.show({ borders: true, graticule: null, ariaLabel: t('summary.heading') });
      if (!state.reported) {
        state = markReported(state);
        context.requestSave();
        const sum = summarize(state);
        context.finished({
          outcome: 'completed',
          stats: { items: state.items.length, onTarget: sum.bands[0], close: sum.bands[1], compared: sum.compared, matched: sum.matched, solved: sum.solved, arrived: sum.arrived, shortest: sum.shortest }
        });
      }
    } else {
      const item = currentItem(state)!;
      const phase = inReview(item) ? 'review' : 'question';
      const key = `${state.seed}:${state.index}:${phase}`;
      if (key !== fitKey) explored = null;
      container.dataset.phase = `${item.kind}-${phase}`;
      screen = item.kind === 'find' ? findScreen(host, item) : item.kind === 'compare' ? compareScreen(host, item) : item.kind === 'mystery' ? mysteryScreen(host, item) : routeScreen(host, item);
      card.append(...screen.card);
      map.show(screen.scene as Scene);
      if (key !== fitKey) {
        fitKey = key;
        if (screen.fit === null) map.fit(REGION_BOX[state.region]);
        else if (screen.fit) map.fit(screen.fit);
      }
    }
    if (focusNext) {
      container.querySelector<HTMLElement>(`#${focusNext}`)?.focus();
      focusNext = null;
    }
  }

  const show = (s: AtlasState) => {
    state = s;
    focusNext = null;
    fitKey = '';
    explored = null;
    if (!container.isConnected) root.appendChild(container);
    map.setHome(REGION_BOX[s.region]);
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      // Settings are untrusted (design § 15): unknown values fall back to the defaults.
      const c = startChoice(options.difficulty, options.settings);
      show(createRound(options.seed, c.difficulty, c.mode, c.region, atlas));
    },
    restore(saved: AtlasState) {
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
      show(restartRound(state, atlas));
      context.requestSave();
    },
    dispose() {
      map.dispose();
      clear(root);
    }
  };
}
