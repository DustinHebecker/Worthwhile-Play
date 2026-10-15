import { cardLabel, renderCard, renderHand, suitName, type Card, type HandView, type Suit, type SuitSet } from '@wp/cards';
import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { isOneOf, normalizeSeed } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import { advance, type ComputerMove } from './ai';
import {
  DEFAULT_DIFFICULTY,
  DEFAULT_OPTIONS,
  DIFFICULTIES,
  GAME_KINDS,
  HUMAN,
  SCORINGS,
  SEATS,
  SERIES_LENGTHS,
  applyAction,
  biddingStatus,
  dealPhase,
  declarerCards,
  declarerOf,
  endSeries,
  entryScores,
  highBid,
  isLegalContract,
  legalCards,
  minimumValue,
  newGame,
  nextBid,
  nextDeal,
  playKind,
  roleOf,
  sortHand,
  startSeries,
  sumPoints,
  toAct,
  totals,
  trickLeaders,
  trickWinners,
  type Action,
  type Contract,
  type DealState,
  type Difficulty,
  type GameKind,
  type GameResult,
  type Options,
  type Seat,
  type SkatState
} from './rules';
import './styles.css';

const PREF_FACES = 'faces';
const PREF_OPTIONS = 'options';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createSkat(context: GameContext): GameInstance<SkatState> {
  const { t, root } = context;
  let state: SkatState = newGame(0);
  let faces: SuitSet = context.preferences?.get(PREF_FACES) === 'german' ? 'german' : 'french';
  /** Cards chosen to put away (discard phase), by card id. */
  let chosen: Card[] = [];
  /** Declaration being prepared in the panel. */
  let draft: Contract = { kind: 'grand', hand: false, schneider: false, schwarz: false, ouvert: false };

  const storedOptions = (): Options => {
    const raw = context.preferences?.get(PREF_OPTIONS);
    if (raw && typeof raw === 'object') {
      const o = raw as Record<string, unknown>;
      if (isOneOf(o.series as number, SERIES_LENGTHS) && isOneOf(o.scoring as string, SCORINGS) && typeof o.ramsch === 'boolean') {
        return { series: o.series as Options['series'], scoring: o.scoring as Options['scoring'], ramsch: o.ramsch };
      }
    }
    return { ...DEFAULT_OPTIONS };
  };

  // ---------------------------------------------------------------- words
  const player = (seat: Seat) => t(`seat.${seat}`);
  const card = (c: Card) => cardLabel(c, t, faces);
  const gameName = (kind: GameKind | 'ramsch'): string => {
    if (kind === 'grand' || kind === 'null' || kind === 'ramsch') return t(`game.${kind}`);
    return suitName(kind as Suit, t, faces);
  };
  const contractName = (c: Contract): string => {
    const parts = [gameName(c.kind)];
    if (c.ouvert) parts.push(t('ann.ouvert'));
    if (c.hand) parts.push(t('ann.hand'));
    if (c.schwarz) parts.push(t('ann.schwarz'));
    else if (c.schneider) parts.push(t('ann.schneider'));
    return parts.join(' ');
  };
  const actionText = (seat: Seat, action: Action): string => {
    const who = player(seat);
    switch (action.type) {
      case 'bid':
        return t('log.bid', { player: who, value: action.value });
      case 'yes':
        return t('log.yes', { player: who });
      case 'pass':
        return t('log.pass', { player: who });
      case 'pickup':
        return t('log.pickup', { player: who });
      case 'hand':
        return t('log.hand', { player: who });
      case 'discard':
        return t('log.discard', { player: who });
      case 'declare':
        return t('log.declare', { player: who, game: contractName(action.contract) });
      case 'play':
        return t('log.play', { player: who, card: card(action.card) });
    }
  };

  // ---------------------------------------------------------------- DOM skeleton
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'announcer' });
  const facesSelect = h('select', { 'data-testid': 'option-faces', onchange: () => setFaces(facesSelect.value === 'german' ? 'german' : 'french') });
  for (const f of ['french', 'german'] as const) facesSelect.append(h('option', { value: f }, t(`faces.${f}`)));
  const progress = h('p', { class: 'sk-progress', 'data-testid': 'progress' });
  const bar = h('div', { class: 'sk-bar' }, progress, h('label', { class: 'sk-field sk-field--inline' }, h('span', {}, t('setup.faces')), facesSelect));

  const setupSection = h('section', { class: 'sk-setup wp-card', 'data-testid': 'setup', 'aria-labelledby': 'sk-setup-title' });
  const tableSection = h('section', { class: 'sk-table', 'aria-label': t('table') });
  const listDetails = h('details', { class: 'sk-list', 'data-testid': 'liste' });
  const helpDetails = h(
    'details',
    { class: 'sk-help' },
    h('summary', {}, t('help.title')),
    ...['help.deal', 'help.bidding', 'help.games', 'help.play', 'help.value', 'help.scoring', 'help.ramsch', 'help.terms'].map((key) => h('p', {}, t(key)))
  );

  const container = h('div', { class: 'wp-skat', dir: t.direction }, bar, setupSection, tableSection, listDetails, helpDetails, live);
  root.append(container);

  // Hands are long-lived widgets (keep keyboard focus across updates).
  // Toggle selection (putting two cards away) and "press to play" are different widgets (aria-pressed or not),
  // so the hand is rebuilt when the mode changes.
  const makeHand = (toggle: boolean): HandView => {
    const view = renderHand([], { t, suits: faces, selectable: true, label: t('hand.mine'), onSelect: (index) => onCard(index), ...(toggle ? { selected: [] } : {}) });
    view.element.dataset.testid = 'my-hand';
    view.element.setAttribute('data-autofocus', '');
    return view;
  };
  let myHand: HandView = makeHand(false);
  let toggleMode = false;
  const dynamicPart = h('div', { class: 'sk-dynamic' });
  const meHeader = h('div', {});
  const meBox = h('div', { class: 'sk-seat', 'data-seat': HUMAN, 'data-testid': `seat-${HUMAN}` }, meHeader, myHand.element);
  tableSection.append(dynamicPart, meBox);
  /** Face-down backs only: the opponents' card identities never reach the DOM. */
  const backs = (seat: Seat, count: number) => {
    const row = h('div', { class: 'sk-backs', role: 'img', 'aria-label': t('hand.of', { player: player(seat) }), 'data-testid': `hand-${seat}` });
    for (let i = 0; i < count; i++) row.append(renderCard(null, { suits: faces, label: false }));
    return row;
  };
  let shownHand: Card[] = [];

  // ---------------------------------------------------------------- setup screen
  function renderSetup() {
    clear(setupSection);
    const o = state.options;
    const select = (name: string, values: readonly (string | number)[], current: string | number, label: (v: string) => string, onChange: (v: string) => void) => {
      const el = h('select', { 'data-testid': `option-${name}`, onchange: () => onChange(el.value) });
      for (const v of values) el.append(h('option', { value: String(v) }, label(String(v))));
      el.value = String(current);
      return el;
    };
    const field = (label: string, control: HTMLElement) => h('label', { class: 'sk-field' }, h('span', {}, label), control);
    const update = (patch: Partial<Options>) => {
      state = { ...state, options: { ...state.options, ...patch } };
      context.preferences?.set(PREF_OPTIONS, state.options);
      context.requestSave();
    };
    const ramschBox = h('input', { type: 'checkbox', 'data-testid': 'option-ramsch', onchange: () => update({ ramsch: ramschBox.checked }) });
    ramschBox.checked = o.ramsch;
    const scoringHint = h('p', { class: 'sk-hint' }, t(`scoring.${o.scoring}.hint`));
    const startButton = h('button', { type: 'button', class: 'primary', 'data-testid': 'start', 'data-autofocus': '', onclick: () => onStart() }, t('setup.start'));
    setupSection.append(
      h('h2', { id: 'sk-setup-title' }, t('setup.title')),
      h('p', {}, t('rules')),
      field(t('setup.series'), select('series', SERIES_LENGTHS, o.series, (v) => (v === '0' ? t('series.open') : t('series.games', { count: Number(v) })), (v) => update({ series: Number(v) as Options['series'] }))),
      field(t('setup.scoring'), select('scoring', SCORINGS, o.scoring, (v) => t(`scoring.${v}`), (v) => {
        update({ scoring: v === 'seeger' ? 'seeger' : 'simple' });
        scoringHint.textContent = t(`scoring.${state.options.scoring}.hint`);
      })),
      scoringHint,
      h('label', { class: 'sk-check' }, ramschBox, h('span', {}, t('setup.ramsch'))),
      field(t('setup.level'), select('level', DIFFICULTIES, state.difficulty, (v) => t(`difficulty.${v}`), (v) => {
        if (!isOneOf(v, DIFFICULTIES)) return;
        state = { ...state, difficulty: v };
        context.setDifficulty?.(v);
        context.requestSave();
      })),
      startButton
    );
  }

  // ---------------------------------------------------------------- table
  const seatBox = (seat: Seat, d: DealState) => {
    const declarer = declarerOf(d);
    const status = biddingStatus(d.bids, d.dealer);
    const tags: string[] = [t(`role.${roleOf(seat, d.dealer)}`)];
    if (seat === d.dealer) tags.push(t('tag.dealer'));
    if (declarer === seat) tags.push(t('tag.declarer'));
    if (status && !status.done && status.passed.includes(seat)) tags.push(t('tag.passed'));
    const tricksWon = trickWinners(d).filter((w) => w === seat).length;
    return h(
      'div',
      { class: `sk-seat${declarer === seat ? ' sk-seat--declarer' : ''}${toAct(d) === seat ? ' sk-seat--active' : ''}`, 'data-seat': seat, 'data-testid': `seat-${seat}` },
      h('p', { class: 'sk-seat-name' }, h('strong', {}, player(seat)), ' ', h('span', { class: 'sk-tags' }, tags.join(' · '))),
      h('p', { class: 'sk-seat-info' }, t('seat.info', { cards: d.hands[seat].length, tricks: tricksWon }))
    );
  };

  const trickView = (cards: readonly Card[], leader: Seat, label: string, testid: string, winner?: Seat) => {
    const list = h('ol', { class: 'sk-trick', 'aria-label': label, 'data-testid': testid });
    cards.forEach((c, i) => {
      const seat = ((leader + i) % 3) as Seat;
      const face = renderCard(c, { suits: faces, t, label: false, style: 'full' });
      list.append(
        h('li', { class: `sk-trick-card${winner === seat ? ' sk-trick-card--winner' : ''}`, 'data-seat': seat, 'data-card': c },
          face,
          // Visible: who played it (the card itself is drawn); for screen readers: the full sentence.
          h('span', { class: 'sk-trick-who', 'aria-hidden': 'true' }, `${winner === seat ? '★ ' : ''}${player(seat)}`),
          h('span', { class: 'sr-only' }, winner === seat ? t('trick.byWinner', { player: player(seat), card: card(c) }) : t('trick.by', { player: player(seat), card: card(c) })))
      );
    });
    return h('div', { class: 'sk-trick-box' }, h('p', { class: 'sk-trick-label' }, label), list);
  };

  const skatView = (d: DealState) => {
    const phase = dealPhase(d);
    // The Skat is hidden until the game is over (then shown: the Skat, or the two cards put away).
    const visible = phase === 'done' ? (d.skatChoice === 'pickup' ? d.discards : d.skat) : [];
    const count = phase === 'done' ? visible.length : d.skat.length;
    if (count === 0) return null;
    const cards = phase === 'done' ? visible : d.skat.map(() => null);
    const box = h('div', { class: 'sk-skat', 'data-testid': 'skat', role: 'group', 'aria-label': phase === 'done' && d.skatChoice === 'pickup' ? t('skat.discards') : t('skat.label') });
    box.append(h('p', { class: 'sk-trick-label' }, phase === 'done' && d.skatChoice === 'pickup' ? t('skat.discards') : t('skat.label')));
    const row = h('div', { class: 'sk-skat-cards' });
    for (const c of cards) row.append(renderCard(c, { suits: faces, t, style: 'full' }));
    box.append(row);
    return box;
  };

  const contractLine = (d: DealState) => {
    const declarer = declarerOf(d);
    if (d.ramsch) return t('contract.ramsch');
    if (declarer === null || !d.contract) return null;
    return t('contract.line', { player: player(declarer), game: contractName(d.contract), bid: highBid(d) });
  };

  // ---------------------------------------------------------------- panels
  const button = (label: string, testid: string, onClick: () => void, primary = false) =>
    h('button', { type: 'button', class: primary ? 'primary' : undefined, 'data-testid': testid, onclick: onClick }, label);

  function biddingLog(d: DealState) {
    const status = biddingStatus(d.bids, d.dealer);
    const list = h('ol', { class: 'sk-log', 'aria-label': t('bidding.log'), 'data-testid': 'bidding-log' });
    d.bids.forEach((b, i) => {
      const seat = status?.speakers[i] ?? HUMAN;
      const action: Action = typeof b === 'number' ? { type: 'bid', value: b } : { type: b };
      list.append(h('li', {}, actionText(seat, action)));
    });
    return list;
  }

  function biddingPanel(d: DealState, panel: HTMLElement) {
    const status = biddingStatus(d.bids, d.dealer);
    if (!status) return;
    panel.append(biddingLog(d));
    if (status.next !== HUMAN) return;
    const actions = h('div', { class: 'sk-actions' });
    if (status.expect === 'bid') {
      const value = nextBid(status.high);
      if (value !== undefined) actions.append(button(t('bid.say', { value }), 'bid-say', () => act({ type: 'bid', value }), true));
      actions.append(button(t('bid.pass'), 'bid-pass', () => act({ type: 'pass' })));
    } else if (status.expect === 'answer') {
      actions.append(button(t('bid.yes', { value: status.high }), 'bid-yes', () => act({ type: 'yes' }), true));
      actions.append(button(t('bid.pass'), 'bid-pass', () => act({ type: 'pass' })));
    } else {
      actions.append(button(t('bid.play'), 'bid-play', () => act({ type: 'bid', value: 18 }), true));
      actions.append(button(t('bid.pass'), 'bid-pass', () => act({ type: 'pass' })));
    }
    panel.append(actions);
  }

  function declarePanel(d: DealState, panel: HTMLElement) {
    const hand = d.skatChoice === 'hand';
    draft = { ...draft, hand };
    if (!hand) draft = { ...draft, schneider: false, schwarz: false, ouvert: draft.kind === 'null' && draft.ouvert };
    const bid = highBid(d);
    const fieldset = h('fieldset', { class: 'sk-kinds' }, h('legend', {}, t('declare.game')));
    for (const kind of GAME_KINDS) {
      const input = h('input', { type: 'radio', name: 'sk-kind', value: kind, 'data-testid': `declare-${kind}`, onchange: () => {
        draft = { ...draft, kind };
        if (kind === 'null') draft = { ...draft, schneider: false, schwarz: false };
        else if (!hand) draft = { ...draft, ouvert: false };
        render();
      } });
      input.checked = draft.kind === kind;
      fieldset.append(h('label', { class: 'sk-radio' }, input, h('span', {}, gameName(kind))));
    }
    const extras = h('fieldset', { class: 'sk-extras' }, h('legend', {}, t('declare.announce')));
    const box = (key: 'schneider' | 'schwarz' | 'ouvert', enabled: boolean) => {
      const input = h('input', { type: 'checkbox', 'data-testid': `declare-${key}`, onchange: () => {
        const on = input.checked;
        let next: Contract = { ...draft, [key]: on };
        // Schwarz implies Schneider; ouvert (suit/Grand) implies Schwarz.
        if (next.kind !== 'null') {
          if (key === 'ouvert' && on) next = { ...next, schwarz: true, schneider: true };
          if (key === 'schwarz' && on) next = { ...next, schneider: true };
          if (key === 'schwarz' && !on) next = { ...next, ouvert: false };
          if (key === 'schneider' && !on) next = { ...next, schwarz: false, ouvert: false };
        }
        draft = next;
        render();
      } });
      input.checked = draft[key];
      input.disabled = !enabled;
      extras.append(h('label', { class: 'sk-check' }, input, h('span', {}, t(`ann.${key}.long`))));
    };
    const suitLike = draft.kind !== 'null';
    box('schneider', hand && suitLike);
    box('schwarz', hand && suitLike);
    box('ouvert', draft.kind === 'null' || hand);
    const cards = declarerCards(d, HUMAN);
    const legal = isLegalContract(draft);
    const value = minimumValue(draft, cards);
    const info = h('p', { class: 'sk-hint', 'data-testid': 'declare-value' }, value >= bid ? t('declare.value', { value, bid }) : t('declare.overbid', { value, bid }));
    panel.append(
      h('p', {}, hand ? t('declare.handPrompt', { bid }) : t('declare.prompt', { bid })),
      fieldset,
      extras,
      info,
      h('div', { class: 'sk-actions' }, button(t('declare.confirm', { game: contractName(draft) }), 'declare-confirm', () => {
        if (legal) act({ type: 'declare', contract: draft });
      }, true))
    );
  }

  function resultText(r: GameResult): string[] {
    if (r.type === 'passed') return [t('outcome.passed')];
    if (r.type === 'ramsch') {
      const sweep = r.tricks.findIndex((n) => n === 10);
      if (sweep >= 0) return [t('outcome.durchmarsch', { player: player(sweep as Seat) })];
      const most = Math.max(...r.points);
      const losers = SEATS.filter((s) => r.points[s] === most).map(player).join(t('separator'));
      return [t('outcome.ramsch', { players: losers, points: most }), SEATS.map((s) => t('outcome.points', { player: player(s), points: r.points[s] })).join(t('separator'))];
    }
    const v = r.valuation;
    const lines: string[] = [];
    const who = player(r.declarer);
    if (r.contract.kind === 'null') lines.push(t(v.won ? 'outcome.nullWon' : 'outcome.nullLost', { player: who }));
    else lines.push(t(v.won ? 'outcome.won' : 'outcome.lost', { player: who, points: r.declarerPoints, defenders: 120 - r.declarerPoints }));
    if (v.overbid) lines.push(t('outcome.overbid', { bid: r.bid, value: v.value }));
    if (v.matadors) {
      const levels = t(v.matadors.with ? 'value.with' : 'value.without', { count: v.matadors.count });
      const extras: string[] = [];
      if (r.contract.hand) extras.push(t('ann.hand'));
      if (v.schneider || r.contract.schneider) extras.push(t('value.schneider'));
      if (r.contract.schneider) extras.push(t('ann.schneider'));
      if (v.schwarz || r.contract.schwarz) extras.push(t('value.schwarz'));
      if (r.contract.schwarz) extras.push(t('ann.schwarz'));
      if (r.contract.ouvert) extras.push(t('ann.ouvert'));
      if (!v.overbid) lines.push(t('value.formula', { levels: [levels, t('value.game'), ...extras].join(', '), multiplier: v.multiplier, base: v.base, value: v.value }));
    } else if (!v.overbid) lines.push(t('value.null', { value: v.value }));
    lines.push(t('outcome.score', { player: who, score: v.score > 0 ? `+${v.score}` : String(v.score) }));
    return lines;
  }

  function donePanel(d: DealState, panel: HTMLElement) {
    const r = d.result as GameResult;
    const box = h('div', { class: 'sk-result', 'data-testid': 'result' });
    for (const line of resultText(r)) box.append(h('p', {}, line));
    panel.append(box);
    if (state.stage === 'over') {
      const sums = totals(state.list, state.options.scoring);
      panel.append(
        h('div', { class: 'sk-summary wp-card', 'data-testid': 'summary' },
          h('h2', {}, t('summary.title')),
          h('p', {}, t('summary.games', { count: state.list.length })),
          h('ul', {}, ...SEATS.map((s) => h('li', {}, t('summary.total', { player: player(s), points: sums[s] })))))
      );
      return;
    }
    const actions = h('div', { class: 'sk-actions' }, button(t('next'), 'next', () => onNext(), true));
    actions.append(button(t('endSeries'), 'end-series', () => onEndSeries()));
    panel.append(actions);
  }

  function renderList() {
    const open = listDetails.open;
    clear(listDetails);
    listDetails.open = open;
    listDetails.append(h('summary', {}, t('list.title')));
    if (state.list.length === 0) {
      listDetails.append(h('p', {}, t('list.empty')));
      return;
    }
    const head = h('tr', {}, h('th', { scope: 'col' }, t('list.number')), h('th', { scope: 'col' }, t('list.game')), ...SEATS.map((s) => h('th', { scope: 'col' }, player(s))));
    const body = h('tbody', {});
    const running: [number, number, number] = [0, 0, 0];
    state.list.forEach((entry, i) => {
      const scores = entryScores(entry, state.options.scoring);
      SEATS.forEach((s) => (running[s] += scores[s]));
      const r = entry.result;
      const label = r.type === 'passed' ? t('list.passed') : r.type === 'ramsch' ? t('game.ramsch') :
        t('list.entry', { player: player(r.declarer), game: contractName(r.contract), outcome: t(r.valuation.won ? 'list.won' : 'list.lost'), value: r.valuation.value });
      body.append(h('tr', {}, h('th', { scope: 'row' }, String(i + 1)), h('td', {}, label), ...SEATS.map((s) => h('td', {}, scores[s] === 0 ? '–' : `${scores[s] > 0 ? '+' : ''}${scores[s]} (${running[s]})`))));
    });
    const sums = totals(state.list, state.options.scoring);
    const foot = h('tfoot', {}, h('tr', {}, h('th', { scope: 'row', colspan: 2 }, t('list.total')), ...SEATS.map((s) => h('td', { 'data-testid': `total-${s}` }, String(sums[s])))));
    listDetails.append(
      h('p', { class: 'sk-hint' }, t(`scoring.${state.options.scoring}.hint`)),
      h('div', { class: 'sk-list-scroll' }, h('table', {}, h('caption', { class: 'sr-only' }, t('list.title')), h('thead', {}, head), body, foot))
    );
  }

  function statusText(d: DealState): string {
    const phase = dealPhase(d);
    const actor = toAct(d);
    if (phase === 'done') return t('status.done');
    if (actor !== HUMAN) return t('common.thinking');
    switch (phase) {
      case 'bidding': {
        const st = biddingStatus(d.bids, d.dealer);
        if (st?.expect === 'answer') return t('status.answer', { player: player(st.speakers[st.speakers.length - 1] as Seat), value: st.high });
        if (st?.expect === 'open') return t('status.open');
        return t('status.bid', { value: nextBid(st?.high ?? 0) ?? 264 });
      }
      case 'skat':
        return t('status.skat', { bid: highBid(d) });
      case 'discard':
        return t('status.discard', { count: chosen.length });
      case 'declare':
        return t('status.declare');
      default:
        return t('status.play');
    }
  }

  function renderTable() {
    clear(dynamicPart);
    const d = state.deal;
    if (!d) return;
    const phase = dealPhase(d);
    const kind = playKind(d) ?? (phase === 'declare' ? draft.kind : 'grand');
    // Opponents: face-down cards only (no card identities in the DOM).
    const opponents = h('div', { class: 'sk-opponents' });
    for (const seat of [1, 2] as const) {
      const box = seatBox(seat, d);
      box.append(backs(seat, d.hands[seat].length));
      opponents.append(box);
    }
    const center = h('div', { class: 'sk-center' });
    const skat = skatView(d);
    if (skat) center.append(skat);
    const leaders = trickLeaders(d);
    const currentLeader = leaders[leaders.length - 1] as Seat;
    if (phase === 'play' || d.trick.length) center.append(trickView(d.trick, currentLeader, t('trick.current'), 'trick'));
    const lastTrick = d.tricks[d.tricks.length - 1];
    if (lastTrick) {
      const winner = trickWinners(d)[d.tricks.length - 1] as Seat;
      center.append(trickView(lastTrick, leaders[d.tricks.length - 1] as Seat, t('trick.last', { player: player(winner), points: sumPoints(lastTrick) }), 'last-trick', winner));
    }
    const line = contractLine(d);
    const status = h('p', { class: 'wp-status sk-status', 'data-testid': 'status' }, statusText(d));
    const panel = h('div', { class: 'sk-panel', 'data-testid': 'panel' });
    if (phase === 'bidding') biddingPanel(d, panel);
    else if (phase === 'skat' && toAct(d) === HUMAN) {
      panel.append(h('div', { class: 'sk-actions' },
        button(t('skat.pickup'), 'skat-pickup', () => act({ type: 'pickup' }), true),
        button(t('skat.hand'), 'skat-hand', () => act({ type: 'hand' }))));
    } else if (phase === 'discard' && toAct(d) === HUMAN) {
      const confirm = button(t('discard.confirm'), 'discard-confirm', () => {
        if (chosen.length === 2) act({ type: 'discard', cards: [chosen[0] as Card, chosen[1] as Card] });
      }, true);
      confirm.disabled = chosen.length !== 2;
      panel.append(h('p', { class: 'sk-hint' }, chosen.length ? t('discard.chosen', { cards: chosen.map(card).join(t('separator')), points: sumPoints(chosen) }) : t('discard.hint')),
        h('div', { class: 'sk-actions' }, confirm));
    } else if (phase === 'declare' && toAct(d) === HUMAN) declarePanel(d, panel);
    else if (phase === 'done') donePanel(d, panel);

    dynamicPart.append(
      opponents,
      center,
      ...(line ? [h('p', { class: 'sk-contract', 'data-testid': 'contract' }, line)] : []),
      status,
      panel
    );

    // My seat: the hand widget stays in the document (keyboard focus and layout survive re-renders).
    const me = seatBox(HUMAN, d);
    meBox.className = me.className;
    meHeader.replaceChildren(...Array.from(me.childNodes));
    shownHand = sortHand(d.hands[HUMAN], kind);
    let disabled: number[] = [];
    let selectable = false;
    let selected: number[] | undefined;
    if (toAct(d) === HUMAN && phase === 'play') {
      const legal = legalCards(d.hands[HUMAN], d.trick, kind);
      selectable = true;
      disabled = shownHand.flatMap((c, i) => (legal.includes(c) ? [] : [i]));
    } else if (toAct(d) === HUMAN && phase === 'discard') {
      selectable = true;
      selected = shownHand.flatMap((c, i) => (chosen.includes(c) ? [i] : []));
    }
    if ((selected !== undefined) !== toggleMode) {
      const hadFocus = myHand.element.contains(document.activeElement);
      myHand.destroy();
      toggleMode = selected !== undefined;
      myHand = makeHand(toggleMode);
      meBox.append(myHand.element);
      if (hadFocus) queueMicrotask(() => myHand.focusCard(0));
    }
    myHand.update(shownHand, { suits: faces, selectable, disabled, label: t('hand.mine'), ...(selected ? { selected } : {}) });
    Array.from(myHand.element.children).forEach((el, i) => ((el as HTMLElement).dataset.card = shownHand[i]));
  }

  function renderProgress() {
    if (state.stage === 'setup') {
      progress.textContent = t('setup.title');
      return;
    }
    const n = state.list.length + (state.deal && !state.deal.result ? 1 : 0);
    const shown = Math.max(1, n);
    progress.textContent = state.options.series > 0 ? t('progress.of', { n: shown, total: state.options.series }) : t('progress.open', { n: shown });
  }

  function render() {
    const active = document.activeElement;
    const focusInPanel = active instanceof HTMLElement && tableSection.contains(active) && !myHand.element.contains(active);
    const focusTestId = active instanceof HTMLElement ? active.dataset.testid : undefined;
    facesSelect.value = faces;
    container.dataset.stage = state.stage;
    container.dataset.phase = state.deal ? dealPhase(state.deal) : 'setup';
    setupSection.hidden = state.stage !== 'setup';
    tableSection.hidden = state.stage === 'setup';
    listDetails.hidden = state.stage === 'setup';
    if (state.stage === 'setup') renderSetup();
    else renderTable();
    renderList();
    if (state.stage === 'over') listDetails.open = true;
    renderProgress();
    if (focusInPanel) {
      // Keep keyboard users in place: same control if it still exists, else the panel's first control or the hand.
      const same = focusTestId ? tableSection.querySelector<HTMLElement>(`[data-testid="${focusTestId}"]`) : null;
      const first = tableSection.querySelector<HTMLElement>('[data-testid="panel"] button:not([disabled]), [data-testid="panel"] input:not([disabled])');
      (same ?? first ?? myHand.element.querySelector<HTMLElement>('button[tabindex="0"]'))?.focus();
    }
  }

  // ---------------------------------------------------------------- actions
  function describe(moves: readonly ComputerMove[], before: DealState | null): string {
    const parts = moves.map((m) => actionText(m.seat, m.action));
    const d = state.deal;
    if (d && before && d.tricks.length > before.tricks.length) {
      const winners = trickWinners(d);
      for (let i = before.tricks.length; i < d.tricks.length; i++) {
        parts.push(t('log.trick', { player: player(winners[i] as Seat), points: sumPoints(d.tricks[i] as Card[]) }));
      }
    }
    return parts.join(' ');
  }

  function commit(next: SkatState, spoken: string) {
    const wasOver = state.stage === 'over';
    state = next;
    chosen = [];
    context.requestSave();
    render();
    const result = state.deal?.result;
    const extra = result && dealPhase(state.deal as DealState) === 'done' ? resultText(result).join(' ') : '';
    announce(live, [spoken, extra, statusTextSafe()].filter(Boolean).join(' '));
    if (!wasOver && state.stage === 'over') {
      context.finished({ outcome: 'completed', stats: { games: state.list.length, points: totals(state.list, state.options.scoring)[HUMAN] } });
    }
  }
  const statusTextSafe = () => (state.deal && state.stage === 'play' && !state.deal.result ? statusText(state.deal) : '');

  function act(action: Action) {
    if (!state.deal || toAct(state.deal) !== HUMAN) return;
    const before = state.deal;
    const after = applyAction(state, HUMAN, action);
    if (!after) return;
    if (action.type === 'declare') draft = { ...action.contract };
    const { state: advanced, moves } = advance(after);
    commit(advanced, [actionText(HUMAN, action), describe(moves, before)].filter(Boolean).join(' '));
  }

  function onCard(index: number) {
    const d = state.deal;
    const c = shownHand[index];
    if (!d || !c || toAct(d) !== HUMAN) return;
    const phase = dealPhase(d);
    if (phase === 'play') act({ type: 'play', card: c });
    else if (phase === 'discard') {
      if (chosen.includes(c)) chosen = chosen.filter((x) => x !== c);
      else if (chosen.length < 2) chosen = [...chosen, c];
      else chosen = [chosen[1] as Card, c];
      render();
      myHand.focusCard(shownHand.indexOf(c));
    }
  }

  function onStart() {
    const started = startSeries(state);
    const { state: advanced, moves } = advance(started);
    commit(advanced, [t('announce.started'), describe(moves, started.deal)].join(' '));
    myHand.focusCard(0);
  }

  function onNext() {
    const next = nextDeal(state);
    if (!next) return;
    draft = { kind: 'grand', hand: false, schneider: false, schwarz: false, ouvert: false };
    const { state: advanced, moves } = advance(next);
    commit(advanced, [t('announce.newDeal', { player: player((next.deal as DealState).dealer) }), describe(moves, next.deal)].join(' '));
    const firstButton = tableSection.querySelector<HTMLElement>('[data-testid="panel"] button');
    (firstButton ?? myHand.element.querySelector<HTMLElement>('button'))?.focus();
  }

  function onEndSeries() {
    const next = endSeries(state);
    if (next) commit(next, t('summary.title'));
  }

  function setFaces(next: SuitSet) {
    faces = next;
    context.preferences?.set(PREF_FACES, next);
    render();
  }

  const start = (s: SkatState) => {
    state = s;
    chosen = [];
    draft = { kind: 'grand', hand: false, schneider: false, schwarz: false, ouvert: false };
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      const difficulty: Difficulty = isOneOf(options.difficulty, DIFFICULTIES) ? options.difficulty : DEFAULT_DIFFICULTY;
      start(newGame(normalizeSeed(options.seed), difficulty, storedOptions()));
    },
    restore(saved: SkatState) {
      start(clone(saved));
      context.setDifficulty?.(state.difficulty);
    },
    serialize: () => clone(state),
    pause() {},
    resume() {},
    reset() {
      start(newGame(state.seed, state.difficulty, state.options));
      context.requestSave();
    },
    dispose() {
      myHand.destroy();
      clear(root);
    }
  };
}
