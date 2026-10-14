import './styles.css';
import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import {
  BLOCK_MINUTES,
  checkIn,
  CONFIGS,
  generateItems,
  hasCheckIn,
  ITEM_COUNT,
  LATE_WINDOW,
  newBlock,
  respond,
  score,
  startBlock,
  toDifficulty,
  type Difficulty,
  type Item,
  type ProspectiveState,
  type Response,
  type Shape
} from './rules';

const SVG_NS = 'http://www.w3.org/2000/svg';

const svg = (tag: string, attrs: Record<string, string | number>): SVGElement => {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  return el;
};

const starPoints = (): string => {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 44 : 19;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push(`${(50 + r * Math.cos(angle)).toFixed(1)},${(53 + r * Math.sin(angle)).toFixed(1)}`);
  }
  return points.join(' ');
};

/** Shape outlines in a 100×100 view box. */
const SHAPE_SVG: Readonly<Record<Shape, () => SVGElement>> = {
  circle: () => svg('circle', { cx: 50, cy: 50, r: 37 }),
  oval: () => svg('ellipse', { cx: 50, cy: 50, rx: 44, ry: 27 }),
  square: () => svg('rect', { x: 15, y: 15, width: 70, height: 70 }),
  triangle: () => svg('polygon', { points: '50,10 91,84 9,84' }),
  diamond: () => svg('polygon', { points: '50,6 94,50 50,94 6,50' }),
  hexagon: () => svg('polygon', { points: '50,8 87,29 87,71 50,92 13,71 13,29' }),
  star: () => svg('polygon', { points: starPoints() })
};

/** Vertical centre of each shape (the triangle's centroid sits lower). */
const dotY = (shape: Shape): number => (shape === 'triangle' ? 60 : 50);

const isTextEntry = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

const keyIs = (event: KeyboardEvent, letter: string): boolean => event.key.toLowerCase() === letter || event.code === `Key${letter.toUpperCase()}`;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * Self-paced: no timers at all. The next shape appears after an answer; the logical state is
 * saved after every answer and every check-in. A block closed (or paused) mid-way waits behind
 * "Continue" with the intentions shown again, and resumes at the very same shape.
 */
export function createProspectiveMemory(context: GameContext): GameInstance<ProspectiveState> {
  const { root, t } = context;
  let state: ProspectiveState | undefined;
  let items: Item[] = [];
  let itemsKey = '';
  /** Block waits for "Continue" (after a pause or a restore). View state only. */
  let held = false;
  /** Host pause (tab hidden). */
  let paused = false;
  /** Neutral acknowledgement of the last Note / Check in press. View state only. */
  let ack = '';
  let renderedItem = '';

  const intentionList = (s: ProspectiveState, testId: string) => {
    const config = CONFIGS[s.difficulty];
    return h(
      'ul',
      { class: 'wp-pm__intentions', 'data-testid': testId },
      h('li', { 'data-intention': config.cueKind }, t(`intention.${config.cueKind}`)),
      config.checkIn !== null && h('li', { 'data-intention': 'checkIn' }, t('intention.checkIn', { n: config.checkIn }))
    );
  };

  const introIntentions = h('div', { class: 'wp-pm__box' });
  const introLength = h('p', { class: 'wp-pm__muted', 'data-testid': 'pm-length' });
  const introKeys = h('p', { class: 'wp-pm__muted', 'data-testid': 'pm-keys' });
  const startBtn = h(
    'button',
    { type: 'button', class: 'primary', 'data-testid': 'pm-start', 'data-autofocus': true, onclick: () => start() },
    t('action.start')
  );
  const intro = h(
    'div',
    { class: 'wp-pm__intro', 'data-testid': 'pm-intro' },
    h('p', { class: 'wp-pm__task' }, t('intro.task')),
    introIntentions,
    introLength,
    h('p', { class: 'wp-pm__muted' }, t('intro.tip')),
    introKeys,
    startBtn
  );

  const statusEl = h('p', { class: 'wp-status wp-pm__status', 'data-testid': 'pm-status' });
  const ackEl = h('p', { class: 'wp-pm__ack', 'data-testid': 'pm-ack' });
  const itemEl = h('div', { class: 'wp-pm__item', role: 'img', 'data-testid': 'pm-item', 'data-index': 0 });

  const button = (response: Response | 'checkIn', extraClass: string) =>
    h(
      'button',
      {
        type: 'button',
        class: `wp-pm__answer ${extraClass}`,
        'data-testid': `pm-${response}`,
        onclick: () => (response === 'checkIn' ? onCheckIn() : onRespond(response))
      },
      t(`answer.${response}`)
    );
  const roundBtn = button('round', 'wp-pm__answer--sort');
  const angularBtn = button('angular', 'wp-pm__answer--sort');
  const noteBtn = button('note', 'wp-pm__answer--intention');
  const checkInBtn = button('checkIn', 'wp-pm__answer--intention');
  const answers = h(
    'div',
    { class: 'wp-pm__answers', role: 'group', 'aria-label': t('answer.group') },
    h('div', { class: 'wp-pm__row' }, roundBtn, angularBtn),
    h('div', { class: 'wp-pm__row wp-pm__row--intentions' }, noteBtn, checkInBtn)
  );
  const playKeys = h('p', { class: 'wp-pm__muted wp-pm__keys' });
  const reminder = h('div', { class: 'wp-pm__box', 'data-testid': 'pm-reminder' });
  const continueBtn = h('button', { type: 'button', class: 'primary', 'data-testid': 'pm-continue', onclick: () => proceed() }, t('action.continue'));
  const play = h('div', { class: 'wp-pm__play' }, itemEl, answers, playKeys, reminder, continueBtn);
  const summaryEl = h('div', { class: 'wp-pm__summary', 'data-testid': 'pm-summary', hidden: true, tabindex: -1 });
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status' });
  const container = h(
    'div',
    { class: `wp-pm${context.reducedMotion ? '' : ' wp-pm--motion'}`, dir: t.direction },
    intro,
    statusEl,
    ackEl,
    play,
    summaryEl,
    live
  );

  const focusInside = () => container.contains(document.activeElement);
  const running = () => !!state && state.phase === 'running';
  const active = () => running() && !held && !paused;

  const ensureItems = (s: ProspectiveState) => {
    const key = `${s.seed}:${s.difficulty}`;
    if (key !== itemsKey) {
      items = generateItems(s.seed, s.difficulty);
      itemsKey = key;
    }
  };

  const itemLabel = (item: Item): string => {
    const shape = t(`shape.${item.shape}`);
    return item.dot ? t('item.withDot', { shape }) : shape;
  };

  const renderItem = (s: ProspectiveState) => {
    const item = s.phase === 'running' && !held ? items[s.index] : undefined;
    const key = item ? `${s.seed}:${s.difficulty}:${s.index}` : '';
    if (key === renderedItem) return;
    renderedItem = key;
    clear(itemEl);
    itemEl.dataset.index = String(s.index);
    if (!item) {
      itemEl.setAttribute('aria-label', t('item.none'));
      delete itemEl.dataset.shape;
      delete itemEl.dataset.dot;
      return;
    }
    itemEl.dataset.shape = item.shape;
    itemEl.dataset.dot = String(item.dot);
    itemEl.setAttribute('aria-label', itemLabel(item));
    const graphic = svg('svg', { viewBox: '0 0 100 100', 'aria-hidden': 'true', focusable: 'false', class: 'wp-pm__shape' });
    const outline = SHAPE_SVG[item.shape]();
    outline.setAttribute('class', item.filled ? 'wp-pm__fill' : 'wp-pm__outline');
    graphic.append(outline);
    if (item.dot) graphic.append(svg('circle', { cx: 50, cy: dotY(item.shape), r: 6, class: item.filled ? 'wp-pm__dot wp-pm__dot--on-fill' : 'wp-pm__dot' }));
    itemEl.append(graphic);
  };

  const summaryLines = (s: ProspectiveState): string[] => {
    const r = score(s, items);
    const lines = [
      t('summary.ongoing', { correct: r.ongoingCorrect, total: r.ongoingTotal }),
      t('summary.cues', { count: r.cues }),
      t('summary.onTime', { count: r.onTime }),
      t('summary.late', { count: r.late, window: LATE_WINDOW }),
      t('summary.missed', { count: r.missed }),
      t('summary.falseAlarms', { count: r.falseAlarms })
    ];
    if (r.checkIn === 'missed') lines.push(t('summary.checkIn.missed'));
    else if (r.checkIn !== 'none') lines.push(t(`summary.checkIn.${r.checkIn}`, { n: (r.checkInAt ?? 0) + 1 }));
    if (r.checkIn !== 'none') lines.push(t('summary.extraCheckIns', { count: r.extraCheckIns }));
    return lines;
  };

  const renderSummary = (s: ProspectiveState) => {
    clear(summaryEl);
    if (s.phase !== 'finished') return;
    summaryEl.append(
      h('ul', { class: 'wp-pm__results', 'data-testid': 'pm-results' }, ...summaryLines(s).map((line) => h('li', {}, line))),
      h('h3', { class: 'wp-pm__heading' }, t('about.heading')),
      h('p', {}, t('about.text')),
      h('h3', { class: 'wp-pm__heading' }, t('tips.heading')),
      h('ul', { class: 'wp-pm__tips' }, h('li', {}, t('tips.whenThen')), h('li', {}, t('tips.cues')), h('li', {}, t('tips.routine'))),
      h('p', { class: 'wp-pm__muted' }, t('summary.note'))
    );
  };

  const update = () => {
    if (!state) return;
    const s = state;
    const withCheckIn = hasCheckIn(s.difficulty);
    intro.hidden = s.phase !== 'ready';
    play.hidden = s.phase !== 'running';
    summaryEl.hidden = s.phase !== 'finished';

    clear(introIntentions);
    introIntentions.append(h('p', { class: 'wp-pm__label' }, t('intro.intentions')), intentionList(s, 'pm-intentions'));
    introLength.textContent = t('intro.length', { count: ITEM_COUNT, minutes: BLOCK_MINUTES });
    const keys = t(withCheckIn ? 'keys.checkIn' : 'keys.basic');
    introKeys.textContent = keys;
    playKeys.textContent = keys;

    renderItem(s);
    const showing = running() && !held;
    itemEl.hidden = !showing;
    answers.hidden = !showing;
    playKeys.hidden = !showing;
    checkInBtn.hidden = !withCheckIn;
    continueBtn.hidden = !(running() && held);
    reminder.hidden = !(running() && held);
    clear(reminder);
    if (running() && held) reminder.append(h('p', { class: 'wp-pm__label' }, t('intro.intentions')), intentionList(s, 'pm-reminder-list'));
    ackEl.textContent = showing ? ack : '';

    if (s.phase === 'ready') statusEl.textContent = t('status.ready');
    else if (s.phase === 'finished') statusEl.textContent = t('result.completed');
    else {
      const progress = t('status.progress', { n: s.index + 1, total: ITEM_COUNT });
      statusEl.textContent = held ? `${t('status.paused')} ${progress}` : progress;
    }
    renderSummary(s);
  };

  const announceItem = () => {
    const item = state && state.phase === 'running' ? items[state.index] : undefined;
    if (item) announce(live, `${t('status.progress', { n: (state?.index ?? 0) + 1, total: ITEM_COUNT })}: ${itemLabel(item)}`);
  };

  // --- player actions ---
  const onRespond = (response: Response) => {
    if (!state || !active()) return;
    const hadFocus = focusInside();
    state = respond(state, response);
    ack = response === 'note' ? t('ack.note') : '';
    context.requestSave();
    update();
    if (state.phase === 'finished') {
      const r = score(state, items);
      announce(live, [t('result.completed'), ...summaryLines(state)].join(' '));
      context.finished({
        outcome: 'completed',
        stats: {
          correct: r.ongoingCorrect,
          total: r.ongoingTotal,
          cues: r.cues,
          onTime: r.onTime,
          late: r.late,
          missed: r.missed,
          falseAlarms: r.falseAlarms,
          ...(r.checkIn === 'none' ? {} : { checkInOnTime: r.checkIn === 'onTime' ? 1 : 0 })
        }
      });
      if (hadFocus) summaryEl.focus();
      return;
    }
    announceItem();
  };

  const onCheckIn = () => {
    if (!state || !active()) return;
    const next = checkIn(state);
    if (next === state) return;
    state = next;
    ack = t('ack.checkIn');
    context.requestSave();
    update();
    announce(live, ack);
  };

  const start = () => {
    if (!state || paused || state.phase !== 'ready') return;
    state = startBlock(state);
    held = false;
    ack = '';
    context.requestSave();
    update();
    roundBtn.focus();
    announceItem();
  };

  const proceed = () => {
    if (!state || paused || !running() || !held) return;
    held = false;
    update();
    roundBtn.focus();
    announceItem();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!state || !active() || event.repeat || event.altKey || event.ctrlKey || event.metaKey || isTextEntry(event.target)) return;
    const target = event.target as Node | null;
    // Only from the page body or from inside the game, never from the host's controls.
    if (target && target !== document.body && target !== document.documentElement && !container.contains(target)) return;
    let action: (() => void) | undefined;
    if (keyIs(event, 'f')) action = () => onRespond('round');
    else if (keyIs(event, 'j')) action = () => onRespond('angular');
    else if (keyIs(event, 'n')) action = () => onRespond('note');
    else if (keyIs(event, 'c') && hasCheckIn(state.difficulty)) action = () => onCheckIn();
    if (!action) return;
    event.preventDefault();
    action();
  };
  document.addEventListener('keydown', onKeyDown);

  const mount = () => {
    if (container.parentElement !== root) {
      clear(root);
      root.append(container);
    }
    update();
  };

  const begin = (seed: number, difficulty: Difficulty) => {
    held = false;
    ack = '';
    state = newBlock(seed, difficulty);
    ensureItems(state);
    mount();
    context.requestSave();
  };

  return {
    newGame(options: NewGameOptions) {
      begin(options.seed, toDifficulty(options.difficulty));
    },
    restore(saved: ProspectiveState) {
      // Closed mid-block? It waits for "Continue" (intentions shown again) and resumes at the same shape.
      state = clone(saved);
      ensureItems(state);
      held = state.phase === 'running';
      ack = '';
      mount();
    },
    serialize() {
      if (!state) throw new Error('No game in progress');
      return clone(state);
    },
    pause() {
      paused = true;
      if (state?.phase === 'running' && !held) {
        const hadFocus = focusInside();
        held = true;
        ack = '';
        update();
        if (hadFocus) continueBtn.focus();
      }
    },
    resume() {
      // The block stays on "Paused — continue" until the player chooses to go on.
      paused = false;
    },
    reset() {
      if (state) begin(state.seed, state.difficulty);
    },
    dispose() {
      document.removeEventListener('keydown', onKeyDown);
      clear(root);
      state = undefined;
    }
  };
}
