/**
 * Pond & Meadow view: the page (scene and charts in the main column, the notebook panel beside it), routing of the
 * state to its mode screen, display preferences and the game instance contract. Time moves only on the player's
 * command; the chart reveal after a run is cosmetic (CSS, off with reduced motion) and never needed for correctness.
 */
import { bcp47Tag, type GameContext, type GameInstance, type NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import { focusChart, numbersTable, sharedChart, smallMultiples } from './chart-view';
import { badgeKey, renderScene } from './scene';
import { choiceOf, currentModel, markReported, newGameState, restart, type EcoState } from './rules';
import { createUi } from './ui';
import { exploreScreen } from './view-explore';
import { goalScreen } from './view-goal';
import type { Host, MainSpec, Prefs, Screen } from './view-host';
import { predictScreen } from './view-predict';
import './styles.css';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createEcosystem(context: GameContext): GameInstance<EcoState> {
  const { t, root } = context;
  const ui = createUi(t);
  const readPref = (key: string): boolean => {
    try {
      return context.preferences?.get(key) === true;
    } catch {
      return false;
    }
  };
  const prefs: Prefs = { shared: readPref('shared'), numbers: readPref('numbers') };
  let state: EcoState = newGameState(0, choiceOf(undefined, {}));
  let paused = false;
  let focusNext: string | null = null;
  let reveal = false;
  let scratch: Record<string, unknown> = {};
  let screenKey = '';

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'eco-announcer' });
  const status = h('p', { class: 'eco-status', 'data-testid': 'eco-status' });
  const main = h('section', { class: 'eco-main', 'aria-labelledby': 'eco-status-id' });
  const panel = h('section', { class: 'eco-panel', 'data-testid': 'eco-panel' });
  const bar = h('div', { class: 'eco-sticky' });
  const aside = h('div', { class: 'eco-aside' }, panel, bar);
  const layout = h('div', { class: 'eco-layout' }, main, aside);
  const note = h('p', { class: 'eco-foot', 'data-testid': 'eco-foot' }, t('note.model'));
  /** Shown after restoring a notebook saved with an earlier model id (design § 14). */
  const refined = h('p', { class: 'eco-refined', 'data-testid': 'eco-refined', hidden: true }, t('note.recalculated'));
  const container = h('div', { class: 'wp-ecosystem', dir: t.direction, lang: bcp47Tag(t.locale), 'data-testid': 'eco-root' }, refined, layout, note, live);

  const host: Host = {
    ui,
    reducedMotion: context.reducedMotion,
    state: () => state,
    paused: () => paused,
    commit(next, focus = null, message, rev = false) {
      if (next === state) {
        if (message) announce(live, message);
        return;
      }
      state = next;
      context.requestSave();
      focusNext = focus;
      reveal = rev && !context.reducedMotion;
      render();
      if (message) announce(live, message);
    },
    update(next) {
      if (next === state) return;
      state = next;
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
    finish(outcome, stats) {
      if (state.mode === 'explore' || state.reported) return;
      state = markReported(state);
      context.requestSave();
      context.finished({ outcome, stats });
    }
  };

  function display(): HTMLElement {
    const box = (key: keyof Prefs, label: string, testid: string) => {
      const input = h('input', { type: 'checkbox', checked: prefs[key], 'data-testid': testid });
      input.addEventListener('change', () => {
        prefs[key] = input.checked;
        try {
          context.preferences?.set(key, input.checked);
        } catch {
          /* preferences are optional */
        }
        host.refresh();
      });
      return h('label', { class: 'eco-check' }, input, ` ${label}`);
    };
    return h('details', { class: 'eco-display' }, h('summary', {}, t('display.heading')), box('shared', t('display.shared'), 'eco-pref-shared'), box('numbers', t('display.numbers'), 'eco-pref-numbers'));
  }

  function renderMain(m: MainSpec) {
    clear(main);
    const sample = m.scene;
    status.textContent = `${t('week', { n: ui.int(m.week) })} · ${t(`habitat.${m.habitat}`)} · ${t(badgeKey(m.habitat, sample))}`;
    status.id = 'eco-status-id';
    main.append(status, renderScene(ui, m.habitat, sample, { numbers: prefs.numbers }));
    if (m.focus) {
      const chart = focusChart({ ui, ...m.focus });
      if (reveal) chart.classList.add('eco-reveal');
      main.append(chart);
    }
    for (const el of m.underChart ?? []) main.append(el);
    main.append(prefs.shared ? sharedChart(ui, m.rows, m.x0, m.x1) : smallMultiples(ui, m.rows, m.x0, m.x1), numbersTable(ui, m.rows, m.x0), display());
  }

  function render() {
    let screen: Screen;
    if (state.mode === 'predict') screen = predictScreen(host, state);
    else if (state.mode === 'goal') screen = goalScreen(host, state);
    else screen = exploreScreen(host, state);
    const key = state.mode === 'predict' ? `p:${state.seed}:${state.index}` : `${state.mode}:${state.seed}`;
    if (key !== screenKey) {
      screenKey = key;
      if (state.mode === 'predict') scratch = {};
    }
    container.dataset.mode = state.mode;
    container.dataset.phase =
      state.mode === 'predict' ? (state.index >= state.items.length ? 'summary' : state.items[state.index]!.ran ? 'review' : 'question') : state.mode === 'goal' ? (state.outcome?.kind ?? 'running') : 'explore';
    renderMain(screen.main);
    clear(panel);
    panel.append(...screen.panel);
    clear(bar);
    if (screen.bar) bar.append(screen.bar);
    container.classList.toggle('eco-has-bar', Boolean(screen.bar));
    reveal = false;
    if (focusNext) {
      container.querySelector<HTMLElement>(`#${focusNext}`)?.focus();
      focusNext = null;
    }
  }

  const show = (s: EcoState, recalculated = false) => {
    state = s;
    refined.hidden = !recalculated;
    focusNext = null;
    screenKey = '';
    scratch = {};
    if (!container.isConnected) root.appendChild(container);
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      show(newGameState(options.seed, choiceOf(options.difficulty, options.settings)));
    },
    restore(saved: EcoState) {
      const { state: s, recalculated } = currentModel(clone(saved));
      show(s, recalculated);
      if (s.model !== saved.model) {
        context.requestSave();
        if (recalculated) announce(live, t('note.recalculated'));
      }
    },
    serialize: () => clone(state),
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    reset() {
      show(restart(state));
      context.requestSave();
    },
    dispose() {
      clear(root);
    }
  };
}
