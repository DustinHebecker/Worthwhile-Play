import { bcp47Tag, type GameContext, type GameInstance, type NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import { STATS, ageInYears, balanceOf, dateOf } from '@wp/life-engine';
import {
  ageOf, budgetOf, createState, currentEvent, decide, isOver, qualification, settingsOf, step, type ManyLivesState, type StepKind
} from './rules';
import { drawScene, placeOf } from './scene';
import './styles.css';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** Events after which the neutral note that real help exists is shown. */
const SUPPORT_NOTE_EVENTS = ['health.mental-strain', 'health.work-accident'];

export function createManyLives(context: GameContext): GameInstance<ManyLivesState> {
  const { t } = context;
  let state: ManyLivesState = createState({ seed: 1 });

  const money = (cents: number): string =>
    new Intl.NumberFormat(bcp47Tag(t.locale), { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents / 100);

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'ml-live' });
  const wip = h('p', { class: 'ml-wip', 'data-testid': 'ml-wip' }, h('strong', {}, t('wip.label')), ' ', t('wip.text'));
  const status = h('section', { class: 'ml-status', 'aria-label': t('status.label'), 'data-testid': 'ml-status' });
  const scene = h('figure', { class: 'ml-scene', 'data-testid': 'ml-scene' });
  const card = h('section', { class: 'ml-card', 'data-testid': 'ml-card', 'aria-live': 'polite' });
  const money_ = h('section', { class: 'ml-budget', 'data-testid': 'ml-budget' });
  const log = h('section', { class: 'ml-log', 'data-testid': 'ml-log' });
  const root = h('div', { class: 'ml' }, wip, status, scene, card, money_, log, live);
  context.root.appendChild(root);

  const commit = (next: ManyLivesState, message?: string) => {
    if (next === state) return;
    state = next;
    render();
    context.requestSave();
    if (message !== undefined) announce(live, message);
    if (isOver(state) && !state.reported) {
      state = { ...state, reported: true };
      context.requestSave();
      context.finished({ outcome: 'completed', stats: { age: ageOf(state) } });
    }
  };

  const advance = (kind: StepKind) => {
    const next = step(state, kind);
    const ev = currentEvent(next);
    const parts = [t('time.passed', { months: next.lastStep })];
    if (ev !== undefined) parts.push(t(`event.${ev.def.id}.title`));
    commit(next, parts.join(' '));
    if (ev !== undefined) focusCard();
  };

  const focusCard = () => card.querySelector<HTMLElement>('[data-autofocus]')?.focus();

  function renderStatus() {
    clear(status);
    const d = dateOf(state.life.calendar, state.life.month);
    const items = budgetOf(state);
    const net = items.reduce((a, i) => a + i.cents, 0);
    status.append(
      h('p', { class: 'ml-status-line' },
        h('span', { 'data-testid': 'ml-age' }, t('status.age', { age: ageOf(state) })),
        h('span', {}, t('status.date', { month: d.month, year: d.year })),
        h('span', { 'data-testid': 'ml-cash' }, t('status.cash', { amount: money(balanceOf(state.life.ledger, 'cash')) })),
        // Money is nominal; inflation is part of the lesson, so today's purchasing power is shown beside it.
        state.life.economy.priceIndex > 1.05
          ? h('span', { class: 'ml-muted', 'data-testid': 'ml-cash-real' }, t('status.real', {
            amount: money(Math.round(balanceOf(state.life.ledger, 'cash') / state.life.economy.priceIndex)),
            year: state.life.calendar.birthYear
          }))
          : null,
        items.length > 0 ? h('span', {}, t('status.net', { amount: money(net) })) : null),
      h('ul', { class: 'ml-stats' }, ...STATS.map((id) => {
        const value = Math.round(state.life.stats[id] / 10);
        const label = t(`stat.${id}`);
        return h('li', { class: 'ml-stat', 'data-stat': id },
          h('span', { class: 'ml-stat-label' }, label),
          h('meter', { min: 0, max: 100, value, 'aria-label': t('stat.value', { label, value }) }),
          h('span', { class: 'ml-stat-value', 'aria-hidden': 'true' }, String(value)));
      }))
    );
  }

  function renderScene() {
    clear(scene);
    const place = placeOf(state);
    const home = ageOf(state) < 6 ? 'scene.child' : state.life.flags.includes('home.parents') ? 'scene.home-parents' : 'scene.home-own';
    const what = place === 'child' || place === 'idle' ? '' : `, ${t(`scene.${place}`)}`;
    scene.append(drawScene(state), h('figcaption', { class: 'sr-only' }, t('scene.label', { description: `${t(home)}${what}` })));
  }

  function renderCard() {
    clear(card);
    if (isOver(state)) {
      card.append(
        h('h2', {}, t('review.title')),
        h('p', { 'data-testid': 'ml-review-age' }, t('review.age', { age: ageOf(state) })),
        h('p', {}, t('review.wealth', { amount: money(balanceOf(state.life.ledger, 'cash')) })),
        h('p', {}, t('review.qualification', { qualification: t(`qual.${qualification(state)}`) })),
        h('p', { class: 'ml-muted' }, t('review.note'))
      );
      return;
    }
    const ev = currentEvent(state);
    if (ev !== undefined) {
      const id = ev.def.id;
      card.append(
        h('p', { class: 'ml-muted' }, `${t('event.label')} · ${t('event.when', { age: ageOf(state) })}`),
        h('h2', { 'data-testid': 'ml-event-title' }, t(`event.${id}.title`)),
        h('p', {}, t(`event.${id}.text`)),
        h('div', { class: 'ml-choices', role: 'group', 'aria-label': t(`event.${id}.title`) },
          ...ev.choices.map((c, i) => h('button', {
            type: 'button', class: i === 0 ? 'primary' : '', 'data-testid': `ml-choice-${c.id}`, 'data-autofocus': i === 0 ? true : undefined,
            onclick: () => commit(decide(state, c.id))
          }, t(`choice.${id}.${c.id}`)))),
        ...(SUPPORT_NOTE_EVENTS.includes(id) ? [h('p', { class: 'ml-help', 'data-testid': 'ml-help' }, t('help.support'))] : [])
      );
      return;
    }
    card.append(
      h('h2', { class: 'sr-only' }, t('time.label')),
      h('div', { class: 'ml-time', role: 'group', 'aria-label': t('time.label') },
        h('button', { type: 'button', 'data-testid': 'ml-month', onclick: () => advance('month') }, t('time.month')),
        h('button', { type: 'button', 'data-testid': 'ml-year', onclick: () => advance('year') }, t('time.year')),
        h('button', { type: 'button', class: 'primary', 'data-testid': 'ml-next-event', 'data-autofocus': true, onclick: () => advance('event') }, t('time.event')))
    );
  }

  function renderBudget() {
    clear(money_);
    const items = budgetOf(state);
    money_.append(h('h2', {}, t('budget.label')));
    if (items.length === 0) { money_.append(h('p', { class: 'ml-muted' }, t('budget.none'))); return; }
    const total = items.reduce((a, i) => a + i.cents, 0);
    money_.append(h('dl', { class: 'ml-budget-list' },
      ...items.flatMap((i) => [h('dt', {}, t(`budget.${i.category}`)), h('dd', { class: i.cents < 0 ? 'ml-neg' : 'ml-pos' }, money(i.cents))]),
      h('dt', { class: 'ml-total' }, t('budget.total')), h('dd', { class: `ml-total ${total < 0 ? 'ml-neg' : 'ml-pos'}` }, money(total))));
  }

  function renderLog() {
    clear(log);
    log.append(h('h2', {}, t('log.label')));
    if (state.log.length === 0) { log.append(h('p', { class: 'ml-muted' }, t('log.empty'))); return; }
    log.append(h('ol', { class: 'ml-log-list', reversed: true },
      ...[...state.log].reverse().slice(0, 8).map((e) => h('li', {}, t('log.entry', { age: ageInYears(e.month), text: t(e.key) })))));
  }

  function render() {
    renderStatus();
    renderScene();
    renderCard();
    renderBudget();
    renderLog();
  }

  render();

  return {
    newGame(options: NewGameOptions) {
      state = createState(options);
      render();
      context.requestSave();
    },
    restore(saved) {
      state = clone(saved);
      render();
    },
    serialize: () => clone(state),
    pause() {},
    resume() {},
    reset() {
      // Back to the seeded start of this life (same seed and settings).
      state = createState({ seed: state.life.seed, settings: settingsOf(state) });
      render();
      context.requestSave();
    },
    dispose() {
      root.remove();
    }
  };
}
