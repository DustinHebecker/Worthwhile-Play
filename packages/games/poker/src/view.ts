import { cardLabel, renderCard, renderHand, type Card, type HandView } from '@wp/cards';
import type { GameContext, GameInstance, GameResult, NewGameOptions } from '@wp/game-core';
import { isInt, isOneOf, normalizeSeed } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import { computer } from './ai';
import { categoryOf, scoreCards } from './eval';
import {
  applyAction,
  blindsForHand,
  BLIND_LEVELS,
  cloneState,
  computePots,
  createTable,
  DEFAULT_DIFFICULTY,
  DEFAULT_OPPONENTS,
  DIFFICULTIES,
  endTable,
  HANDS_PER_LEVEL,
  isLive,
  legalActions,
  MAX_OPPONENTS,
  MIN_OPPONENTS,
  nextHand,
  potTotal,
  runComputers,
  START_STACK,
  startTable,
  type Action,
  type LogEntry,
  type PokerState
} from './rules';
import './styles.css';


/** Name of a hand score, e.g. "Full house" (a straight flush to the ace is a royal flush). */
export function handName(score: number, t: GameContext['t']): string {
  const category = categoryOf(score);
  if (category === 'straightFlush' && ((score >> 16) & 0xf) === 12) return t('hand.royalFlush');
  return t(`hand.${category}`);
}

/** Pot-size based bet presets: the total bet on this street for a share of the pot after calling. */
export function presetAmount(state: PokerState, fraction: number): number {
  const legal = legalActions(state);
  if (!legal.raise) return 0;
  const me = state.seats[state.toAct];
  const myBet = me?.bet ?? 0;
  const pot = potTotal(state);
  const to = Math.round(myBet + legal.call + fraction * (pot + legal.call));
  return Math.min(legal.raise.max, Math.max(legal.raise.min, to));
}

export function createPoker(context: GameContext): GameInstance<PokerState> {
  const { t, root } = context;
  // The level and number of opponents are chosen on the host's start screen (ADR 0017, settings.ts).
  const readOpponents = (value: unknown): number => (isInt(value, MIN_OPPONENTS, MAX_OPPONENTS) ? value : DEFAULT_OPPONENTS);
  let state: PokerState = createTable(0, DEFAULT_DIFFICULTY, DEFAULT_OPPONENTS);
  let confirmingEnd = false;
  let amount = 0;
  let disposed = false;

  const seatName = (seat: number) => (seat === 0 ? t('seat.you') : t('seat.opponent', { n: seat }));
  const cardsText = (cards: readonly Card[]) => cards.map((c) => cardLabel(c, t)).join(t('separator'));

  /** The person (seat 0) gets second-person forms ("You call 2", "Du gehst mit 2"); opponents third-person ones. */
  const actionText = (entry: LogEntry): string => {
    const prefix = entry.seat === 0 ? 'actionYou' : 'action';
    const amountText = String(entry.amount);
    if (entry.allIn && (entry.kind === 'call' || entry.kind === 'bet' || entry.kind === 'raise')) return t(`${prefix}.allIn`, { amount: amountText });
    return t(`${prefix}.${entry.kind}`, { amount: amountText });
  };
  const entryText = (entry: LogEntry) => t(entry.seat === 0 ? 'log.entryYou' : 'log.entry', { name: seatName(entry.seat), action: actionText(entry) });

  /* ---------------------------------------------------------------- DOM skeleton */
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'pk-announcer' });
  const body = h('div', { class: 'pk-body' });
  const container = h('div', { class: 'wp-poker', dir: t.direction }, body, live);
  root.append(container);
  let hand: HandView | undefined;

  /* ---------------------------------------------------------------- transitions */
  const resultOf = (s: PokerState): GameResult => ({
    outcome: s.ended === 'champion' ? 'won' : s.ended === 'busted' ? 'lost' : 'completed',
    stats: { hands: s.summary.hands, showdownsWon: s.summary.showdownsWon, biggestPot: s.summary.biggestPot, chips: s.seats[0]?.stack ?? 0 }
  });

  const describeSince = (before: PokerState, after: PokerState): string => {
    const parts: string[] = [];
    const sameHand = before.handNumber === after.handNumber && before.phase !== 'setup';
    const from = sameHand ? before.log.length : 0;
    if (!sameHand && after.handNumber > 0) {
      parts.push(t('live.handStart', { n: after.handNumber, cards: cardsText(after.seats[0]?.hole ?? []) }));
    }
    let street = sameHand ? before.street : 'preflop';
    let boardShown = sameHand ? before.board.length : 0;
    const showBoard = (upTo: number) => {
      if (upTo > boardShown) {
        const streetKey = upTo === 3 ? 'flop' : upTo === 4 ? 'turn' : 'river';
        parts.push(t('live.board', { street: t(`street.${streetKey}`), cards: cardsText(after.board.slice(boardShown, upTo)) }));
        boardShown = upTo;
      }
    };
    for (const entry of after.log.slice(from)) {
      if (entry.street !== street) {
        showBoard(entry.street === 'flop' ? 3 : entry.street === 'turn' ? 4 : 5);
        street = entry.street;
      }
      parts.push(entryText(entry));
    }
    showBoard(after.board.length);
    if (after.result && (after.phase === 'handOver' || after.phase === 'finished') && (before.phase === 'betting' || !sameHand)) {
      parts.push(...resultLines(after));
    }
    if (after.phase === 'finished' && before.phase !== 'finished') parts.push(t(`ended.${after.ended ?? 'stopped'}`));
    if (after.phase === 'betting') parts.push(statusLine(after));
    return parts.join(' ');
  };

  const commit = (next: PokerState) => {
    const before = state;
    state = next;
    confirmingEnd = false;
    amount = 0;
    context.requestSave();
    render();
    announce(live, describeSince(before, next));
    if (before.phase !== 'finished' && next.phase === 'finished') context.finished(resultOf(next));
  };

  const decide = (s: PokerState) => computer(s.difficulty);
  const play = (action: Action) => {
    if (state.phase !== 'betting' || state.toAct !== 0) return;
    commit(runComputers(applyAction(state, action), decide(state)));
  };
  const start = () => {
    if (state.phase !== 'setup') return;
    commit(runComputers(startTable(state), decide(state)));
    focusMain();
  };
  const next = () => {
    if (state.phase !== 'handOver') return;
    commit(runComputers(nextHand(state), decide(state)));
    focusMain();
  };
  const focusMain = () => {
    const target = body.querySelector<HTMLElement>('[data-autofocus]');
    target?.focus();
  };

  /* ---------------------------------------------------------------- rendering */
  const statusLine = (s: PokerState): string => {
    const legal = legalActions(s);
    if (legal.call > 0) return t('status.toCall', { amount: legal.call });
    return t('common.yourTurn');
  };

  function resultLines(s: PokerState): string[] {
    const result = s.result;
    if (!result) return [];
    const lines: string[] = [];
    result.payouts.forEach((chips, seat) => {
      if (chips <= 0) return;
      if (!result.showdown) lines.push(t(seat === 0 ? 'result.youWinFold' : 'result.winFold', { name: seatName(seat), chips }));
      else lines.push(t(seat === 0 ? 'result.youWin' : 'result.win', { name: seatName(seat), chips, hand: handName(result.scores[seat] ?? 0, t) }));
    });
    return lines;
  }

  const renderSetup = () => {
    const [sb, bb] = blindsForHand(1);
    return h(
      'section',
      { class: 'pk-setup', 'data-testid': 'pk-setup', 'aria-labelledby': 'pk-setup-title' },
      h('h2', { id: 'pk-setup-title', class: 'pk-heading' }, t('setup.title')),
      h('p', { class: 'pk-note', 'data-testid': 'pk-table' }, `${t('setup.opponents')}: ${state.opponents} · ${t('setup.level')}: ${t(`difficulty.${state.difficulty}`)}`),
      h('p', { class: 'pk-note' }, t('setup.info', { stack: START_STACK, bbs: START_STACK / bb, sb, bb, hands: HANDS_PER_LEVEL })),
      h('p', { class: 'pk-note' }, t('setup.chips')),
      h('button', { type: 'button', class: 'primary', 'data-testid': 'pk-start', 'data-autofocus': true, onclick: start }, t('setup.start'))
    );
  };

  const renderInfo = () => {
    const parts = [t('info.hand', { n: state.handNumber }), t('info.blinds', { sb: state.sb, bb: state.bb })];
    const level = Math.floor((state.handNumber - 1) / HANDS_PER_LEVEL);
    if (state.phase !== 'finished' && level < BLIND_LEVELS.length - 1) parts.push(t('info.rise', { n: (level + 1) * HANDS_PER_LEVEL }));
    return h('p', { class: 'pk-info', 'data-testid': 'pk-info' }, parts.join(' · '));
  };

  const lastEntryOf = (seat: number) => [...state.log].reverse().find((e) => e.seat === seat);

  const renderSeat = (index: number) => {
    const seat = state.seats[index];
    if (!seat) return h('li', {});
    const result = state.result;
    const revealed = index !== 0 && result !== null && result.shown.includes(index) && state.phase !== 'betting';
    const out = !seat.inHand && seat.stack === 0;
    const toAct = state.phase === 'betting' && state.toAct === index;
    const status = out
      ? t('seat.out')
      : !seat.inHand
        ? ''
        : seat.folded
          ? t(index === 0 ? 'seat.foldedYou' : 'seat.folded')
          : seat.stack === 0 && state.phase === 'betting'
            ? t('seat.allIn')
            : (() => {
                const last = lastEntryOf(index);
                return last ? actionText(last) : '';
              })();
    const cards = h('span', { class: 'pk-seat-cards' });
    if (index !== 0 && seat.inHand && !seat.folded) {
      if (revealed) {
        for (const card of seat.hole) {
          const svg = renderCard(card, { t, label: cardLabel(card, t) });
          svg.dataset.card = card;
          cards.append(svg);
        }
      } else {
        cards.append(renderCard(null, { label: false }), renderCard(null, { label: false }), h('span', { class: 'sr-only' }, t('seat.hidden')));
      }
    }
    const handText = revealed && result ? h('span', { class: 'pk-seat-hand', 'data-testid': `pk-seat-hand-${index}` }, handName(result.scores[index] ?? 0, t)) : null;
    const dealer =
      state.button === index && state.handNumber > 0
        ? h('span', { class: 'pk-dealer', role: 'img', 'aria-label': t('seat.dealer'), title: t('seat.dealer') }, h('span', { 'aria-hidden': 'true' }, t('seat.dealerShort')))
        : null;
    return h(
      'li',
      {
        class: 'pk-seat',
        'data-testid': `pk-seat-${index}`,
        'data-state': out ? 'out' : seat.folded ? 'folded' : toAct ? 'to-act' : 'in',
        'aria-current': toAct ? 'true' : undefined
      },
      h('span', { class: 'pk-seat-name' }, toAct ? h('span', { class: 'pk-turn-mark', 'aria-hidden': 'true' }, '▶') : null, seatName(index), dealer),
      h('span', { class: 'pk-seat-stack', 'data-testid': `pk-stack-${index}` }, t('seat.stack', { chips: seat.stack })),
      seat.bet > 0 ? h('span', { class: 'pk-seat-bet' }, t('seat.bet', { chips: seat.bet })) : null,
      status ? h('span', { class: 'pk-seat-status' }, status) : null,
      cards.childElementCount > 0 ? cards : null,
      handText
    );
  };

  const renderBoard = () => {
    const label = state.board.length > 0 ? t('board.cards', { cards: cardsText(state.board) }) : t('board.empty');
    const board = h('div', { class: 'pk-board', role: 'group', 'aria-label': label, 'data-testid': 'pk-board' });
    for (let i = 0; i < 5; i++) {
      const card = state.board[i];
      if (card) {
        const svg = renderCard(card, { t });
        svg.dataset.card = card;
        board.append(svg);
      } else {
        board.append(h('span', { class: 'pk-slot', 'aria-hidden': 'true' }));
      }
    }
    return board;
  };

  const renderPot = () => {
    if (state.phase === 'betting') {
      const pots = computePots(
        state.seats.map((s) => s.committed - s.bet),
        state.seats.map(isLive)
      );
      const lines = [t('pot.total', { chips: potTotal(state) })];
      if (pots.length > 1) pots.forEach((pot, i) => lines.push(i === 0 ? t('pot.main', { chips: pot.amount }) : t('pot.side', { n: i, chips: pot.amount })));
      return h('p', { class: 'pk-pot', 'data-testid': 'pk-pot' }, lines.join(' · '));
    }
    return null;
  };

  const renderMe = () => {
    const me = state.seats[0];
    const wrap = h('section', { class: 'pk-me', 'aria-label': t('you.cards'), 'data-testid': 'pk-me' });
    if (!me || me.hole.length === 0) return wrap;
    hand?.destroy();
    hand = renderHand(me.hole, { t, label: t('you.cards'), fan: false, style: 'full' });
    hand.element.dataset.testid = 'pk-hole';
    hand.element.querySelectorAll<HTMLElement>('.wp-hand-card').forEach((el, i) => (el.dataset.card = me.hole[i]));
    wrap.append(hand.element);
    if (me.folded) wrap.append(h('p', { class: 'pk-note' }, t('you.folded')));
    else if (state.board.length >= 3) wrap.append(h('p', { class: 'pk-best', 'data-testid': 'pk-best' }, t('you.best', { hand: handName(scoreCards([...me.hole, ...state.board]), t) })));
    return wrap;
  };

  const renderActions = () => {
    const legal = legalActions(state);
    const panel = h('section', { class: 'pk-actions', 'aria-label': t('actions.title'), 'data-testid': 'pk-actions' });
    const pot = potTotal(state);
    if (legal.call > 0) {
      const pct = Math.round((100 * legal.call) / (pot + legal.call));
      panel.append(h('p', { class: 'pk-odds', 'data-testid': 'pk-odds' }, t('odds.need', { call: legal.call, pot: pot + legal.call, pct })));
    }
    const me = state.seats[0];
    const row = h('div', { class: 'pk-buttons' });
    if (legal.fold) row.append(h('button', { type: 'button', 'data-testid': 'pk-fold', onclick: () => play({ type: 'fold' }) }, t('btn.fold')));
    if (legal.check) row.append(h('button', { type: 'button', 'data-testid': 'pk-check', 'data-autofocus': true, onclick: () => play({ type: 'check' }) }, t('btn.check')));
    if (legal.call > 0) {
      const allIn = me !== undefined && legal.call >= me.stack;
      row.append(
        h('button', { type: 'button', 'data-testid': 'pk-call', 'data-autofocus': true, onclick: () => play({ type: 'call' }) }, t(allIn ? 'btn.callAllIn' : 'btn.call', { amount: legal.call }))
      );
    }
    panel.append(row);
    if (legal.raise) {
      const { min, max } = legal.raise;
      if (amount < min || amount > max) amount = min;
      const isBet = state.currentBet === 0;
      const confirm = h('button', { type: 'button', class: 'primary', 'data-testid': 'pk-raise' });
      const range = h('input', { type: 'range', min, max, step: 1, value: amount, 'aria-label': t('amount.label'), 'data-testid': 'pk-slider' });
      const number = h('input', { type: 'number', min, max, step: 1, value: amount, inputmode: 'numeric', 'aria-label': t('amount.label'), 'aria-describedby': 'pk-amount-range', 'data-testid': 'pk-amount' });
      const sync = (value: number, from?: HTMLInputElement) => {
        amount = Math.min(max, Math.max(min, Math.round(Number.isFinite(value) ? value : min)));
        if (from !== range) range.value = String(amount);
        if (from !== number) number.value = String(amount);
        confirm.textContent = amount === max ? t('btn.allIn', { amount }) : t(isBet ? 'btn.bet' : 'btn.raise', { amount });
      };
      range.addEventListener('input', () => sync(Number(range.value), range));
      number.addEventListener('input', () => {
        const v = Number(number.value);
        if (number.value !== '' && Number.isFinite(v) && v >= min && v <= max) sync(v, number);
      });
      number.addEventListener('change', () => sync(Number(number.value)));
      number.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          sync(Number(number.value));
          play({ type: 'raise', to: amount });
        }
      });
      confirm.addEventListener('click', () => {
        sync(Number(number.value));
        play({ type: 'raise', to: amount });
      });
      const presets: [string, () => number][] = [
        ['min', () => min],
        ['half', () => presetAmount(state, 0.5)],
        ['threeQuarters', () => presetAmount(state, 0.75)],
        ['pot', () => presetAmount(state, 1)],
        ['allIn', () => max]
      ];
      const presetRow = h('div', { class: 'pk-presets', role: 'group', 'aria-label': t('presets.title') });
      for (const [id, value] of presets) {
        presetRow.append(h('button', { type: 'button', 'data-testid': `pk-preset-${id}`, onclick: () => sync(value()) }, t(`presets.${id}`)));
      }
      sync(amount);
      panel.append(
        h(
          'div',
          { class: 'pk-raise-box' },
          presetRow,
          h('div', { class: 'pk-amount' }, range, number),
          h('p', { class: 'pk-note', id: 'pk-amount-range' }, t('amount.range', { min, max })),
          confirm
        )
      );
    }
    return panel;
  };

  const renderResult = () => {
    const lines = resultLines(state);
    if (lines.length === 0) return null;
    return h('section', { class: 'pk-result', 'data-testid': 'pk-result', 'aria-label': t('result.title') }, ...lines.map((line) => h('p', {}, line)));
  };

  const renderSummary = () =>
    h(
      'section',
      { class: 'pk-summary', 'data-testid': 'pk-summary', 'aria-labelledby': 'pk-summary-title' },
      h('h2', { id: 'pk-summary-title', class: 'pk-heading' }, t(`ended.${state.ended ?? 'stopped'}`)),
      h(
        'ul',
        {},
        h('li', {}, t('summary.hands', { n: state.summary.hands })),
        h('li', {}, t('summary.showdowns', { n: state.summary.showdownsWon })),
        h('li', {}, t('summary.biggest', { chips: state.summary.biggestPot })),
        h('li', {}, t('summary.stack', { chips: state.seats[0]?.stack ?? 0 }))
      )
    );

  const renderLog = () => {
    if (state.log.length === 0) return null;
    const list = h('ol', { class: 'pk-log', 'data-testid': 'pk-log' });
    let street = '';
    for (const entry of state.log) {
      if (entry.street !== street) {
        street = entry.street;
        list.append(h('li', { class: 'pk-log-street' }, t(`street.${street}`)));
      }
      list.append(h('li', {}, entryText(entry)));
    }
    return h('details', { class: 'pk-log-box' }, h('summary', {}, t('log.title')), list);
  };

  const renderEnd = () => {
    if (state.phase === 'finished') return null;
    if (!confirmingEnd) {
      return h('div', { class: 'pk-end' }, h('button', { type: 'button', 'data-testid': 'pk-end', onclick: () => ((confirmingEnd = true), render(), body.querySelector<HTMLElement>('[data-testid="pk-end-no"]')?.focus()) }, t('end.button')));
    }
    return h(
      'div',
      { class: 'pk-end', role: 'group', 'aria-label': t('end.button') },
      h('p', {}, t(state.phase === 'betting' ? 'end.confirmHand' : 'end.confirm')),
      h('button', { type: 'button', class: 'primary', 'data-testid': 'pk-end-yes', onclick: () => commit(endTable(state)) }, t('end.yes')),
      h('button', { type: 'button', 'data-testid': 'pk-end-no', onclick: () => ((confirmingEnd = false), render(), body.querySelector<HTMLElement>('[data-testid="pk-end"]')?.focus()) }, t('end.no'))
    );
  };

  function render() {
    if (disposed) return;
    const focusedId = (document.activeElement as HTMLElement | null)?.closest?.('[data-testid]')?.getAttribute('data-testid');
    const hadFocus = body.contains(document.activeElement);
    hand?.destroy();
    hand = undefined;
    clear(body);
    container.dataset.phase = state.phase;
    // Public facts only (hand number, phase): lets tests match the DOM with the (asynchronously written) save.
    container.dataset.hand = String(state.handNumber);
    container.dataset.seats = String(state.seats.length);
    if (state.phase === 'setup') {
      body.append(renderSetup());
    } else {
      const seats = h('ul', { class: 'pk-seats', 'aria-label': t('seats.title'), 'data-testid': 'pk-seats' }, ...state.seats.map((_, i) => renderSeat(i)));
      body.append(renderInfo(), seats, h('div', { class: 'pk-center' }, renderBoard(), renderPot()), renderMe());
      if (state.phase === 'betting') body.append(renderActions());
      const result = state.phase !== 'betting' ? renderResult() : null;
      if (result) body.append(result);
      if (state.phase === 'handOver') {
        body.append(h('div', { class: 'pk-buttons' }, h('button', { type: 'button', class: 'primary', 'data-testid': 'pk-next', 'data-autofocus': true, onclick: next }, t('next'))));
      }
      if (state.phase === 'finished') body.append(renderSummary());
      const log = renderLog();
      if (log) body.append(log);
      const end = renderEnd();
      if (end) body.append(end);
    }
    if (hadFocus && focusedId) {
      const again = body.querySelector<HTMLElement>(`[data-testid="${focusedId}"]`);
      if (again) again.focus();
      else focusMain();
    }
  }

  /* ---------------------------------------------------------------- instance */
  return {
    newGame(options: NewGameOptions) {
      const difficulty = isOneOf(options.difficulty, DIFFICULTIES) ? options.difficulty : DEFAULT_DIFFICULTY;
      const table = createTable(normalizeSeed(options.seed), difficulty, readOpponents(options.settings?.opponents));
      // After Start on the host's start screen the person sits down at once; a direct start (deep link) shows the
      // table first and waits for "Take a seat".
      state = options.begin ? runComputers(startTable(table), decide(table)) : table;
      confirmingEnd = false;
      render();
    },
    restore(saved: PokerState) {
      state = cloneState(saved);
      confirmingEnd = false;
      render();
    },
    serialize: () => cloneState(state),
    pause() {},
    resume() {},
    reset() {
      state = createTable(state.seed, state.difficulty, state.opponents);
      confirmingEnd = false;
      context.requestSave();
      render();
    },
    dispose() {
      disposed = true;
      hand?.destroy();
      clear(root);
    }
  };
}
