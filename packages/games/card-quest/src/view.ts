import type { GameContext, GameInstance, GameResult, NewGameOptions } from '@wp/game-core';
import { isOneOf } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import { pictogram } from './art';
import type { MonsterCard } from './cards';
import { cardBlunder, cardFlavour, cardName, cardRules, keyNumber } from './cardtext';
import { HUMAN, advance, computerToAct } from './driver';
import {
  DEFAULT_SETTINGS,
  DIFFICULTIES,
  FLEE_TARGET,
  MAX_OPPONENTS,
  ROUND_LIMITS,
  SELL_RATE,
  TARGETS,
  actorOf,
  charityTarget,
  fightTotals,
  fleeBonus,
  heroParts,
  isValidSettings,
  legalActions,
  monsterLoot,
  monsterStrength,
  newGame,
  playerParts,
  step,
  sum,
  surplus,
  type Action,
  type CardQuestState,
  type LogEvent,
  type Part,
  type Player,
  type Settings
} from './rules';
import { defOf } from './worlds';
import './styles.css';

/** `context.preferences` key of the last setup (opponents, target, round limit, coach). */
export const SETUP_PREFERENCE = 'setup';

type Mode = 'play' | 'sell' | 'give';

export function createCardQuest(context: GameContext): GameInstance<CardQuestState> {
  const { t, root } = context;
  let state: CardQuestState = newGame(0, initialSettings(undefined));
  let selected: string | null = null;
  let mode: Mode = 'play';
  const picked = new Set<string>();
  let finishedSent = false;

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'announcer' });
  const main = h('div', { class: 'cq', 'data-testid': 'card-quest' });
  root.append(main, live);

  function initialSettings(difficulty: string | undefined): Settings {
    const saved = context.preferences?.get(SETUP_PREFERENCE);
    const base: Settings = { ...DEFAULT_SETTINGS, worlds: [...DEFAULT_SETTINGS.worlds] };
    const merged = { ...base, ...(typeof saved === 'object' && saved !== null ? saved : {}), worlds: base.worlds };
    const settings = isValidSettings(merged) ? merged : base;
    return { ...settings, difficulty: isOneOf(difficulty, DIFFICULTIES) ? difficulty : settings.difficulty };
  }

  /* ---------------------------------------------------------------- names */

  const seatName = (seat: number) => (seat === HUMAN ? t('you') : t(`npc.${seat}`));
  const name = (card: string) => cardName(t, card);

  /* ---------------------------------------------------------------- acting */

  /** Applies the person's action, lets the computer players answer, saves and re-renders. */
  function act(action: Action): void {
    const hint = currentHint();
    const before = state.logSeq;
    const next = step(state, HUMAN, action);
    if (!next) return;
    next.seen = before;
    if (hint && !next.hints.includes(hint)) next.hints.push(hint);
    state = advance(next);
    if (action.a !== 'equip' && action.a !== 'unequip' && action.a !== 'upgrade') selected = null;
    if (mode !== 'play' && action.a !== 'equip') {
      mode = 'play';
      picked.clear();
    }
    context.requestSave();
    render();
    announce(live, [...newEvents().slice(-6).map(eventText), nextText()].join(' '));
    finishIfOver();
  }

  function finishIfOver(): void {
    if (state.phase !== 'over' || finishedSent) return;
    finishedSent = true;
    const human = state.winners.includes(HUMAN);
    const outcome: GameResult['outcome'] = human ? (state.winners.length > 1 ? 'draw' : 'won') : 'lost';
    context.finished({ outcome, stats: { rounds: state.round, level: (state.players[HUMAN] as Player).level } });
  }

  /* ---------------------------------------------------------------- texts */

  function nextText(): string {
    switch (state.phase) {
      case 'setup':
        return t('setup.title');
      case 'prepare':
        return t('next.prepare');
      case 'after':
        return t('next.after');
      case 'fight':
        if (state.active === HUMAN) return t(someoneInterfered() ? 'next.fight.youAgain' : 'next.fight.you');
        return t('next.fight.react', { name: seatName(state.active) });
      case 'flee':
        if (currentMonsterNoFlee()) return t('next.flee.none');
        return t('next.flee', { need: Math.max(1, FLEE_TARGET - fleeBonus(state) - fleeMod()) });
      case 'end': {
        const n = surplus(state);
        if (n === 0) return t('next.end');
        const to = charityTarget(state);
        return to >= 0 ? t('next.end.give', { n, name: seatName(to) }) : t('next.end.discard', { n });
      }
      case 'over': {
        if (state.winners.length > 1) return t('next.over.shared', { names: state.winners.map(seatName).join(t('r.separator')) });
        if (state.winners[0] === HUMAN) return t('next.over.won', { target: state.settings.target });
        return t('next.over.lost', { name: seatName(state.winners[0] ?? 1) });
      }
    }
  }

  const someoneInterfered = () => (state.fight?.against.length ?? 0) > 0 || (state.fight?.monsters.some((m) => m.boosters.length > 0) ?? false) || (state.fight?.monsters.length ?? 0) > 1;

  /** Whether the monster the person flees from next cannot be fled from at all. */
  function currentMonsterNoFlee(): boolean {
    const m = state.fight?.monsters[state.fight.rolls.length];
    return m ? ((defOf(m.card) as MonsterCard).noFlee ?? false) : false;
  }

  function fleeMod(): number {
    const fight = state.fight;
    if (!fight) return 0;
    const m = fight.monsters[fight.rolls.length];
    return m ? ((defOf(m.card) as MonsterCard).flee ?? 0) : 0;
  }

  const newEvents = (): LogEvent[] => {
    const firstSeq = state.logSeq - state.log.length;
    return state.log.filter((_, i) => firstSeq + i >= state.seen);
  };

  function eventText(e: LogEvent): string {
    const n = (seat: number) => seatName(seat);
    switch (e.e) {
      case 'turn':
        return t('log.turn', { name: n(e.seat) });
      case 'open':
        return t('log.open', { name: n(e.seat), card: name(e.card) });
      case 'rummage':
        return t('log.rummage', { name: n(e.seat) });
      case 'challenge':
        return t('log.challenge', { name: n(e.seat), card: name(e.card) });
      case 'boost':
        return t('log.boost', { name: n(e.seat), card: name(e.card), monster: name(e.monster) });
      case 'reinforce':
        return t('log.reinforce', { name: n(e.seat), card: name(e.card), monster: name(e.monster) });
      case 'oneshot':
        return t(e.side === 'hero' ? 'log.oneshot.hero' : 'log.oneshot.monster', { name: n(e.seat), card: name(e.card) });
      case 'escape':
        return t('log.escape', { name: n(e.seat), card: name(e.card) });
      case 'curse':
        return t('log.curse', { name: n(e.seat), card: name(e.card), target: n(e.target) });
      case 'won':
        return t('log.won', { name: n(e.seat), levels: e.levels, loot: e.loot });
      case 'lost':
        return t('log.lost', { name: n(e.seat) });
      case 'flee': {
        const line = t(e.ok ? 'log.flee.ok' : 'log.flee.fail', { name: n(e.seat), roll: e.roll, total: e.total, monster: name(e.monster) });
        const blunder = e.ok ? '' : cardBlunder(t, e.monster);
        return blunder ? `${line} ${blunder}` : line;
      }
      case 'penalty':
        switch (e.p) {
          case 'level':
            return t('log.penalty.level', { name: n(e.seat), n: e.n ?? 0 });
          case 'slot':
          case 'best':
            return e.card ? t('log.penalty.item', { name: n(e.seat), card: name(e.card) }) : t('log.penalty.none', { name: n(e.seat) });
          case 'cards':
            return t('log.penalty.cards', { name: n(e.seat), n: e.n ?? 0 });
          case 'malus':
            return t('log.penalty.malus', { name: n(e.seat), n: e.n ?? 0 });
          case 'origin':
            return t('log.penalty.origin', { name: n(e.seat) });
          case 'profession':
            return t('log.penalty.profession', { name: n(e.seat) });
        }
        return '';
      case 'equip':
        return t('log.equip', { name: n(e.seat), card: name(e.card) });
      case 'sell':
        return t('log.sell', { name: n(e.seat), n: e.count, levels: e.levels });
      case 'play':
        return t('log.play', { name: n(e.seat), card: name(e.card) });
      case 'upgrade':
        return t('log.upgrade', { name: n(e.seat), card: name(e.card), item: name(e.item) });
      case 'give':
        return t('log.give', { name: n(e.seat), n: e.count, to: n(e.to) });
      case 'discard':
        return t('log.discard', { name: n(e.seat), n: e.count });
      case 'win':
        return t('log.win', { names: e.seats.map(n).join(t('r.separator')) });
    }
  }

  /** The coach hint for the current situation (shown once each, design § 7.1), or null. */
  function currentHint(): string | null {
    if (!state.settings.coach || state.phase === 'setup' || state.phase === 'over') return null;
    const me = state.players[HUMAN] as Player;
    const fresh = (id: string) => !state.hints.includes(id);
    const has = (type: string) => me.hand.some((c) => defOf(c).type === type);
    const myTurn = state.active === HUMAN;
    if (myTurn && state.phase === 'fight' && fresh('fight')) return 'fight';
    if (!myTurn && state.phase === 'fight' && fresh('react')) return 'react';
    if (state.phase === 'flee' && fresh('flee')) return 'flee';
    if (myTurn && state.phase === 'end' && surplus(state) > 0 && fresh('charity')) return 'charity';
    if (myTurn && state.phase === 'after' && has('monster') && fresh('challenge')) return 'challenge';
    if (myTurn && (state.phase === 'prepare' || state.phase === 'after' || state.phase === 'end')) {
      if (has('item') && fresh('items')) return 'items';
      if (has('curse') && fresh('curse')) return 'curse';
      if (legalActions(state, HUMAN).some((a) => a.a === 'sell') && fresh('sell')) return 'sell';
    }
    return null;
  }

  /* ---------------------------------------------------------------- rendering helpers */

  const keyOf = (el: Element | null): string | null => el?.closest('[data-key]')?.getAttribute('data-key') ?? null;

  function render(): void {
    const focusKey = keyOf(document.activeElement && root.contains(document.activeElement) ? document.activeElement : null);
    clear(main);
    main.setAttribute('dir', t.direction);
    // Phase and seat on turn, for tests and styling (public information only).
    main.dataset.phase = state.phase;
    main.dataset.active = String(state.active);
    if (state.phase === 'setup') main.append(renderSetup());
    else main.append(...renderPlay());
    if (!focusKey) return;
    // Keep focus on the same control; if it is gone (the step moved on), go to the next main action or its text.
    const same = main.querySelector<HTMLElement>(`[data-key="${CSS.escape(focusKey)}"]`);
    const fallback = main.querySelector<HTMLElement>('.cq-actions button.primary:not([disabled])') ?? main.querySelector<HTMLElement>('.cq-next-text');
    (same ?? fallback)?.focus();
  }

  function pic(card: string): HTMLElement {
    const span = h('span', { class: 'cq-art' });
    span.innerHTML = pictogram(card);
    return span;
  }

  /** A compact card tile (button). */
  function tile(card: string, opts: { key: string; onClick: () => void; pressed?: boolean | undefined; hint?: string | undefined; testid?: string }): HTMLButtonElement {
    const def = defOf(card);
    const num = keyNumber(card);
    return h(
      'button',
      {
        type: 'button',
        class: 'cq-tile',
        'data-type': def.type,
        'data-key': opts.key,
        'data-card': card,
        'data-testid': opts.testid ?? `card-${card}`,
        'aria-pressed': opts.pressed === undefined ? undefined : String(opts.pressed),
        onclick: opts.onClick
      },
      pic(card),
      h('span', { class: 'cq-tile-text' }, h('span', { class: 'cq-tile-name' }, name(card)), h('span', { class: 'cq-tile-type' }, t(`type.${def.type}`), opts.hint ? ` · ${opts.hint}` : '')),
      num ? h('span', { class: 'cq-tile-num' }, num) : null
    );
  }

  const button = (label: string, onclick: () => void, opts: { primary?: boolean; testid?: string; key?: string; disabled?: boolean } = {}) =>
    h(
      'button',
      { type: 'button', class: opts.primary ? 'primary' : undefined, 'data-testid': opts.testid, 'data-key': opts.key ?? opts.testid, disabled: opts.disabled, onclick },
      label
    );

  /* ---------------------------------------------------------------- setup screen */

  function renderSetup(): HTMLElement {
    const s = state.settings;
    const set = (patch: Partial<Settings>) => {
      const settings = { ...state.settings, ...patch, worlds: [...state.settings.worlds] };
      context.preferences?.set(SETUP_PREFERENCE, { opponents: settings.opponents, target: settings.target, roundLimit: settings.roundLimit, coach: settings.coach });
      state = newGame(state.seed, settings);
      context.requestSave();
      render();
    };
    const select = (id: string, label: string, values: readonly number[], text: (v: number) => string, value: number, onChange: (v: number) => void) => {
      const el = h('select', { id: `cq-${id}`, 'data-testid': `setup-${id}`, 'data-key': `setup-${id}`, onchange: () => onChange(Number(el.value)) });
      for (const v of values) el.append(h('option', { value: String(v), selected: v === value }, text(v)));
      return h('div', { class: 'cq-field' }, h('label', { for: `cq-${id}` }, label), el);
    };
    const coach = h('input', { type: 'checkbox', id: 'cq-coach', 'data-testid': 'setup-coach', 'data-key': 'setup-coach', checked: s.coach, onchange: () => set({ coach: coach.checked }) });
    const opponents = Array.from({ length: MAX_OPPONENTS }, (_, i) => i + 1);
    return h(
      'section',
      { class: 'cq-setup wp-stack', 'aria-labelledby': 'cq-setup-title' },
      h('h2', { id: 'cq-setup-title' }, t('setup.title')),
      h(
        'fieldset',
        { class: 'cq-worlds' },
        h('legend', {}, t('setup.worlds')),
        h('label', { class: 'cq-check' }, h('input', { type: 'checkbox', checked: true, disabled: true }), h('span', {}, t('world.kz'))),
        h('p', { class: 'cq-muted' }, t('setup.moreWorlds'))
      ),
      select('opponents', t('setup.opponents'), opponents, String, s.opponents, (v) => set({ opponents: v })),
      select('target', t('setup.target'), TARGETS, (v) => t('setup.targetLevel', { n: v }), s.target, (v) => {
        if (isOneOf(v, TARGETS)) set({ target: v });
      }),
      select('roundLimit', t('setup.roundLimit'), ROUND_LIMITS, (v) => (v === 0 ? t('setup.roundLimit.off') : t('setup.roundLimit.n', { n: v })), s.roundLimit, (v) => {
        if (isOneOf(v, ROUND_LIMITS)) set({ roundLimit: v });
      }),
      h('p', { class: 'cq-muted' }, t('setup.roundLimit.hint')),
      h('label', { class: 'cq-check', for: 'cq-coach' }, coach, h('span', {}, t('setup.coach'))),
      button(t('setup.start'), () => act({ a: 'start', settings: state.settings }), { primary: true, testid: 'start' }),
      h('p', { class: 'cq-muted' }, t('setup.note'))
    );
  }

  /* ---------------------------------------------------------------- play screen */

  function renderPlay(): HTMLElement[] {
    const out: HTMLElement[] = [];
    const s = state.settings;
    out.push(
      h(
        'p',
        { class: 'cq-round', 'data-testid': 'round' },
        s.roundLimit > 0 ? t('status.roundLimit', { round: state.round, limit: s.roundLimit, target: s.target }) : t('status.round', { round: state.round, target: s.target })
      )
    );
    out.push(renderPlayers());
    const next = h('div', { class: 'cq-next', 'data-testid': 'next' }, h('p', { class: 'cq-next-text', tabindex: '-1' }, nextText()));
    const hint = currentHint();
    if (hint) next.append(h('p', { class: 'cq-hint', 'data-testid': 'hint' }, t(`hint.${hint}`)));
    out.push(next);
    const recent = newEvents().filter((e) => e.e !== 'turn' || e.seat !== HUMAN);
    if (recent.length > 0 && state.phase !== 'over') {
      out.push(h('section', { class: 'cq-recent', 'aria-labelledby': 'cq-recent-title' }, h('h3', { id: 'cq-recent-title' }, t('log.new')), h('ul', {}, ...recent.slice(-12).map((e) => h('li', {}, eventText(e))))));
    }
    if (state.fight) out.push(renderFight());
    out.push(renderActions());
    out.push(renderHand());
    out.push(renderMine());
    out.push(renderLog());
    return out;
  }

  function strengthOf(seat: number): number {
    return sum(playerParts(state.players[seat] as Player));
  }

  function renderPlayers(): HTMLElement {
    const list = h('ul', { class: 'cq-players', 'data-testid': 'players' });
    state.players.forEach((p, seat) => {
      const facts = [t('table.level', { n: p.level }), t('table.strength', { n: strengthOf(seat) }), t('table.cards', { n: p.hand.length })];
      if (p.malus > 0) facts.push(t('table.malus', { n: p.malus }));
      const gear = [...p.origins, ...p.professions, ...p.equipped].map(name).join(t('r.separator')) || t('table.nothing');
      list.append(
        h(
          'li',
          { class: 'cq-player', 'data-active': String(seat === state.active), 'data-testid': `player-${seat}` },
          h('details', {}, h(
            'summary',
            {},
            h('span', { class: 'cq-player-name' }, seatName(seat), p.personality ? h('span', { class: 'cq-muted' }, ` · ${t(`personality.${p.personality}`)}`) : null, seat === state.active ? h('span', { class: 'cq-turn' }, ` · ${t('table.active')}`) : null),
            h('span', { class: 'cq-player-facts' }, facts.join(' · '))
          ), h('p', { class: 'cq-player-gear' }, p.personality ? `${t(`personality.${p.personality}.desc`)} ` : '', gear))
        )
      );
    });
    return h('section', { class: 'cq-table', 'aria-label': t('table.title') }, list);
  }

  function partsList(parts: Part[], seat: number): HTMLElement {
    const label = (p: Part) => {
      if (p.source === 'level') return t('part.level');
      if (p.source === 'malus') return t('part.malus');
      if (p.source.startsWith('set:')) return t('part.set', { name: t(`set.${p.source.slice(4)}`) });
      if (p.source.startsWith('vs:')) return t('part.vs', { name: seatName(seat) });
      return name(p.source);
    };
    return h('ul', { class: 'cq-parts' }, ...parts.map((p) => h('li', {}, `${label(p)} ${p.value >= 0 ? '+' : '−'}${Math.abs(p.value)}`)));
  }

  function renderFight(): HTMLElement {
    const fight = state.fight!;
    const totals = fightTotals(state);
    const hero = seatName(state.active);
    const mine = state.active === HUMAN;
    const win = totals.hero > totals.monsters;
    const forecast = mine
      ? t(win ? 'fight.forecast.win' : 'fight.forecast.lose', { hero: totals.hero, monsters: totals.monsters })
      : t(win ? 'fight.forecast.other.win' : 'fight.forecast.other.lose', { name: hero, hero: totals.hero, monsters: totals.monsters });
    const monsters = h('div', { class: 'cq-fight-monsters' });
    fight.monsters.forEach((m, i) => {
      const parts = monsterStrength(state, i);
      monsters.append(
        h(
          'div',
          { class: 'cq-fight-monster' },
          tile(m.card, { key: `fight-${i}`, onClick: () => select(m.card), testid: `fight-monster-${i}` }),
          h('p', { class: 'cq-strong' }, `${Math.max(1, sum(parts))}`),
          partsList(parts, state.active)
        )
      );
    });
    const levels = fight.monsters.reduce((a, m) => a + (defOf(m.card) as MonsterCard).levels, 0);
    const loot = fight.monsters.reduce((a, m) => a + monsterLoot(m), 0);
    const played = (ids: string[], label: string) => (ids.length > 0 ? h('p', {}, `${label}: ${ids.map(name).join(t('r.separator'))}`) : null);
    return h(
      'section',
      { class: 'cq-fight', 'aria-labelledby': 'cq-fight-title', 'data-testid': 'fight' },
      h('h3', { id: 'cq-fight-title' }, t('fight.title')),
      h('p', { class: 'cq-forecast', 'data-testid': 'forecast', 'data-win': String(win) }, h('span', { class: 'cq-forecast-icon', 'aria-hidden': 'true' }, win ? '▲' : '▼'), forecast),
      h('div', { class: 'cq-fight-hero' }, h('p', { class: 'cq-strong' }, t('fight.hero', { name: hero, n: totals.hero })), partsList(heroParts(state), state.active)),
      monsters,
      played(fight.hero, t('fight.for', { name: hero })),
      played(fight.against, t('fight.against')),
      h('p', { class: 'cq-muted' }, t('fight.reward', { levels, loot })),
      fight.rolls.length > 0 ? h('p', {}, t('fight.rolls', { rolls: fight.rolls.join(t('r.separator')) })) : null
    );
  }

  function renderActions(): HTMLElement {
    const bar = h('div', { class: 'cq-actions', 'data-testid': 'actions' });
    const actor = actorOf(state);
    const calm = state.active === HUMAN && (state.phase === 'prepare' || state.phase === 'after' || state.phase === 'end');
    if (mode === 'sell') {
      const { total, levels } = sellValue();
      bar.append(
        h('p', { class: 'cq-muted' }, t('sell.title', { sum: total, levels }), ' ', t('sell.need', { rate: SELL_RATE })),
        button(t('btn.sell', { n: levels }), () => act({ a: 'sell', cards: [...picked] }), { primary: true, testid: 'sell', disabled: !sellLegal() }),
        button(t('btn.cancel'), () => {
          mode = 'play';
          picked.clear();
          render();
        }, { testid: 'cancel' })
      );
      return bar;
    }
    if (state.phase === 'over' || actor !== HUMAN) return bar;
    switch (state.phase) {
      case 'prepare':
        bar.append(button(t('btn.open'), () => act({ a: 'open' }), { primary: true, testid: 'open' }));
        break;
      case 'after':
        bar.append(button(t('btn.rummage'), () => act({ a: 'rummage' }), { primary: true, testid: 'rummage' }));
        break;
      case 'fight':
        bar.append(button(t(state.active === HUMAN ? 'btn.fight' : 'btn.letBe'), () => act({ a: 'pass' }), { primary: true, testid: 'pass' }));
        break;
      case 'flee':
        bar.append(button(t(currentMonsterNoFlee() ? 'btn.blunder' : 'btn.roll'), () => act({ a: 'roll' }), { primary: true, testid: 'roll' }));
        break;
      case 'end': {
        const n = surplus(state);
        if (n === 0) bar.append(button(t('btn.end'), () => act({ a: 'end', give: [] }), { primary: true, testid: 'end' }));
        else {
          if (mode !== 'give') {
            mode = 'give';
            picked.clear();
          }
          const label = charityTarget(state) >= 0 ? t('btn.give', { n }) : t('btn.discard', { n });
          bar.append(button(label, () => act({ a: 'end', give: [...picked] }), { primary: true, testid: 'end', disabled: picked.size !== n }));
        }
        break;
      }
    }
    if (calm && legalActions(state, HUMAN).some((a) => a.a === 'sell') && mode === 'play') {
      bar.append(
        button(t('btn.sellMode'), () => {
          mode = 'sell';
          picked.clear();
          selected = null;
          render();
        }, { testid: 'sell-mode' })
      );
    }
    return bar;
  }

  function sellValue(): { total: number; levels: number } {
    const me = state.players[HUMAN] as Player;
    const extra = me.professions.reduce((a, p) => a + ((defOf(p) as { sell?: number }).sell ?? 0), 0);
    const total = [...picked].reduce((a, c) => a + ((defOf(c) as { value?: number }).value ?? 0) + extra, 0);
    return { total, levels: Math.max(0, Math.min(Math.floor(total / SELL_RATE), state.settings.target - 1 - me.level)) };
  }

  const sellLegal = () => picked.size > 0 && step(state, HUMAN, { a: 'sell', cards: [...picked] }) !== null;

  /** Legal actions of the person that involve `card`. */
  function actionsFor(card: string): { label: string; action: Action; testid: string }[] {
    const out: { label: string; action: Action; testid: string }[] = [];
    for (const a of legalActions(state, HUMAN)) {
      switch (a.a) {
        case 'equip':
          if (a.card === card) out.push({ label: t('act.equip'), action: a, testid: 'act-equip' });
          break;
        case 'unequip':
          if (a.card === card) out.push({ label: t('act.unequip'), action: a, testid: 'act-unequip' });
          break;
        case 'play':
          if (a.card === card) out.push({ label: t('act.play'), action: a, testid: 'act-play' });
          break;
        case 'challenge':
          if (a.card === card) out.push({ label: t('act.challenge'), action: a, testid: 'act-challenge' });
          break;
        case 'upgrade':
          if (a.card === card) out.push({ label: t('act.upgrade', { name: name(a.item) }), action: a, testid: `act-upgrade-${a.item}` });
          break;
        case 'curse':
          if (a.card === card) out.push({ label: t('act.curse', { name: seatName(a.target) }), action: a, testid: `act-curse-${a.target}` });
          break;
        case 'boost':
          if (a.card === card) out.push({ label: t('act.boost', { name: name(state.fight!.monsters[a.monster]!.card) }), action: a, testid: `act-boost-${a.monster}` });
          break;
        case 'reinforce':
          if (a.card === card || a.monster === card) out.push({ label: t('act.reinforce', { name: name(a.monster) }), action: a, testid: `act-reinforce-${a.monster}` });
          break;
        case 'oneshot': {
          if (a.card !== card) break;
          const def = defOf(card);
          const label =
            def.type === 'oneshot' && def.escape
              ? t('act.escape')
              : a.side === 'monster'
                ? t('act.monster')
                : state.active === HUMAN
                  ? t('act.hero.you')
                  : t('act.hero.other', { name: seatName(state.active) });
          out.push({ label, action: a, testid: `act-oneshot-${a.side}` });
          break;
        }
        default:
          break;
      }
    }
    return out;
  }

  function select(card: string): void {
    selected = selected === card ? null : card;
    render();
    main.querySelector<HTMLElement>('[data-testid="detail"]')?.focus();
  }

  function why(card: string): string {
    const type = defOf(card).type;
    if (type === 'booster' || type === 'oneshot' || type === 'reinforcement') return t('card.why.fightOnly');
    if (['item', 'upgrade', 'levelup', 'windfall', 'origin', 'profession', 'double'].includes(type)) return t('card.why.ownTurn');
    return t('card.why.notNow');
  }

  /** Whether a card can be picked in the current give-away or sell mode. */
  function pickable(card: string): boolean {
    const me = state.players[HUMAN] as Player;
    if (mode === 'give') return me.hand.includes(card);
    if (mode === 'sell') return ['item', 'oneshot'].includes(defOf(card).type) && (me.hand.includes(card) || me.pack.includes(card) || me.equipped.includes(card));
    return false;
  }

  function renderDetail(card: string): HTMLElement {
    const { type, lines } = cardRules(t, card);
    const actions =
      mode === 'play'
        ? actionsFor(card)
        : pickable(card)
          ? [{ label: t(picked.has(card) ? 'act.unpick' : 'act.pick'), action: null, testid: 'act-pick' }]
          : [];
    const close = button(t('btn.close'), () => {
      selected = null;
      render();
    }, { testid: 'detail-close' });
    return h(
      'section',
      { class: 'cq-detail', 'data-type': defOf(card).type, tabindex: '-1', 'data-testid': 'detail', 'aria-labelledby': 'cq-detail-title' },
      h('div', { class: 'cq-detail-head' }, pic(card), h('div', {}, h('h3', { id: 'cq-detail-title' }, name(card)), h('p', { class: 'cq-tile-type' }, type))),
      h('ul', { class: 'cq-rules' }, ...lines.map((l) => h('li', {}, l))),
      h('p', { class: 'cq-flavour' }, cardFlavour(t, card)),
      cardBlunder(t, card) ? h('p', { class: 'cq-blunder', 'data-testid': 'detail-blunder' }, t('detail.blunder', { text: cardBlunder(t, card) })) : null,
      h(
        'div',
        { class: 'cq-detail-actions' },
        ...actions.map((a) => button(a.label, () => (a.action ? act(a.action) : toggle(card)), { primary: true, testid: a.testid, key: `${a.testid}-${card}` })),
        actions.length === 0 && mode === 'play' && (state.players[HUMAN] as Player).hand.includes(card) ? h('p', { class: 'cq-muted' }, why(card)) : null,
        close
      )
    );
  }

  function renderHand(): HTMLElement {
    const me = state.players[HUMAN] as Player;
    const legal = legalActions(state, HUMAN);
    const playable = (c: string) => legal.some((a) => ('card' in a && a.card === c) || (a.a === 'reinforce' && a.monster === c));
    const grid = h('div', { class: 'cq-grid', role: 'group', 'aria-labelledby': 'cq-hand-title' });
    for (const c of me.hand) {
      grid.append(
        pickOrTile(c, 'hand', {
          pressed: mode === 'play' ? selected === c : undefined,
          hint: mode === 'play' && playable(c) ? t('hand.playable') : undefined
        })
      );
    }
    const section = h(
      'section',
      { class: 'cq-hand', 'data-testid': 'hand' },
      h('h3', { id: 'cq-hand-title' }, t('hand.title', { n: me.hand.length })),
      me.hand.length === 0 ? h('p', { class: 'cq-muted' }, t('hand.empty')) : grid
    );
    if (selected && (me.hand.includes(selected) || me.equipped.includes(selected) || me.pack.includes(selected) || isInFight(selected) || me.origins.includes(selected) || me.professions.includes(selected) || me.doubles.includes(selected))) {
      section.append(renderDetail(selected));
    } else if (selected && !isVisible(selected)) selected = null;
    return section;
  }

  const isInFight = (card: string) => state.fight?.monsters.some((m) => m.card === card) ?? false;
  const isVisible = (card: string) => {
    const me = state.players[HUMAN] as Player;
    return me.hand.includes(card) || me.equipped.includes(card) || me.pack.includes(card) || isInFight(card);
  };

  function toggle(card: string): void {
    if (picked.has(card)) picked.delete(card);
    else picked.add(card);
    render();
  }

  /**
   * A card tile. In the give-away and sell modes a pickable tile toggles its selection, and an info button next
   * to it opens the card detail, so the card can be read before it is chosen (owner feedback B1). Elsewhere the
   * tile opens the detail.
   */
  function pickOrTile(c: string, prefix: string, extra: { pressed?: boolean | undefined; hint?: string | undefined } = {}): HTMLElement {
    if (!pickable(c)) return tile(c, { key: `${prefix}-${c}`, pressed: extra.pressed, hint: extra.hint, onClick: () => select(c) });
    return h(
      'div',
      { class: 'cq-pick' },
      tile(c, { key: `${prefix}-${c}`, pressed: picked.has(c), hint: extra.hint, onClick: () => toggle(c) }),
      h(
        'button',
        {
          type: 'button',
          class: 'cq-info',
          'data-testid': `info-${c}`,
          'data-key': `info-${prefix}-${c}`,
          'aria-label': t('card.info', { name: name(c) }),
          'aria-expanded': String(selected === c),
          onclick: () => select(c)
        },
        h('span', { 'aria-hidden': 'true' }, 'i')
      )
    );
  }

  function renderMine(): HTMLElement {
    const me = state.players[HUMAN] as Player;
    const tiles = (cards: string[], prefix: string) =>
      h('div', { class: 'cq-grid' }, ...cards.map((c) => pickOrTile(c, prefix, { hint: prefix === 'eq' ? upgradesOf(c) : undefined })));
    const character = [...me.origins, ...me.professions, ...me.doubles];
    return h(
      'section',
      { class: 'cq-mine', 'data-testid': 'mine', 'aria-labelledby': 'cq-mine-title' },
      h('h3', { id: 'cq-mine-title' }, t('mine.title')),
      me.equipped.length > 0 ? tiles(me.equipped, 'eq') : h('p', { class: 'cq-muted' }, t('table.nothing')),
      h('h4', {}, t('mine.character')),
      character.length > 0 ? tiles(character, 'ch') : h('p', { class: 'cq-muted' }, t('mine.none')),
      me.pack.length > 0 ? h('h4', {}, t('mine.pack')) : null,
      me.pack.length > 0 ? tiles(me.pack, 'pack') : null
    );
  }

  function upgradesOf(item: string): string | undefined {
    const me = state.players[HUMAN] as Player;
    const ups = me.upgrades.filter((u) => u.item === item).map((u) => name(u.card));
    return ups.length > 0 ? ups.join(t('r.separator')) : undefined;
  }

  function renderLog(): HTMLElement {
    const events = state.log.slice(-25).reverse();
    return h('details', { class: 'cq-log', 'data-testid': 'log' }, h('summary', {}, t('log.title')), h('ul', {}, ...events.map((e) => h('li', {}, eventText(e)))));
  }

  /* ---------------------------------------------------------------- instance */

  return {
    newGame(options: NewGameOptions) {
      state = newGame(options.seed, initialSettings(options.difficulty));
      selected = null;
      mode = 'play';
      picked.clear();
      finishedSent = false;
      render();
    },
    restore(saved) {
      state = saved;
      selected = null;
      mode = 'play';
      picked.clear();
      finishedSent = state.phase === 'over';
      render();
      // Saves are written after the computer players moved; an older save may still owe their moves.
      if (computerToAct(state)) {
        state = advance(state);
        context.requestSave();
        render();
        finishIfOver();
      }
    },
    serialize: () => JSON.parse(JSON.stringify(state)) as CardQuestState,
    pause() {},
    resume() {},
    reset() {
      state = newGame(state.seed, { ...state.settings, worlds: [...state.settings.worlds] });
      selected = null;
      mode = 'play';
      picked.clear();
      finishedSent = false;
      render();
    },
    dispose() {
      clear(root);
    }
  };
}
