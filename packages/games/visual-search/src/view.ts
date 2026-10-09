import './styles.css';
import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import {
  allowsNotThere,
  answerTrial,
  CONFIGS,
  currentTrial,
  generateRound,
  ITEM_DIAMETER,
  navigate,
  newRound,
  NOT_THERE,
  outcomeOf,
  startRound,
  summarize,
  toDifficulty,
  TRIALS,
  type Difficulty,
  type Features,
  type Item,
  type Move,
  type Round,
  type SearchState
} from './rules';

/**
 * Layout: the board is a CSS grid of CONFIGS[difficulty].cols columns (at most 5), sized to
 * the available width, so cells stay >= 56 px on a 360 px phone and no set-size reduction is
 * needed. Each occupied cell is one button filling the cell (the touch target); the shape is
 * drawn inside it at ITEM_DIAMETER % of the cell, offset by the seeded jitter.
 *
 * Timing is view state only: the search time runs from the moment a board is shown until the
 * answer. A host pause (tab hidden) during a board marks that board as untimed; after a
 * restore the current board is shown again and timed from then on.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
let instanceCounter = 0;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function svg(tag: string, attrs: Record<string, string | number> = {}, ...children: Element[]): SVGElement {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  el.append(...children);
  return el;
}

const SHAPE_PATHS: Readonly<Record<Features['shape'], () => SVGElement>> = {
  bar: () => svg('rect', { x: -38, y: -14, width: 76, height: 28 }),
  triangle: () => svg('polygon', { points: '0,-40 34.6,20 -34.6,20' }),
  cross: () =>
    svg('polygon', { points: '-13,-38 13,-38 13,-13 38,-13 38,13 13,13 13,38 -13,38 -13,13 -38,13 -38,-13 -13,-13' })
};

const ARROWS: Readonly<Record<string, Move>> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  Home: 'first',
  End: 'last'
};

export function createVisualSearch(context: GameContext): GameInstance<SearchState> {
  const { root, t } = context;
  const stripesId = `wp-vs-stripes-${++instanceCounter}`;
  let state: SearchState | undefined;
  let round: Round | undefined;
  let roundKey = '';
  /** Board index shown with its answer revealed (view state only). */
  let review: number | undefined;
  /** Position of the roving focus within the shown board's items. */
  let focusIndex = 0;
  let boardKey = '';
  let onset = 0;
  let interrupted = false;

  const describe = (f: Features) =>
    t('features', { shape: t(`shape.${f.shape}`), fill: t(`fill.${f.fill}`), tilt: t(`tilt.${f.tilt}`) });

  const drawShape = (f: Features): SVGElement => {
    const shape = SHAPE_PATHS[f.shape]();
    const fill = f.fill === 'solid' ? 'currentColor' : f.fill === 'striped' ? `url(#${stripesId})` : 'none';
    shape.setAttribute('fill', fill);
    shape.setAttribute('stroke', 'currentColor');
    shape.setAttribute('stroke-width', '6');
    shape.setAttribute('stroke-linejoin', 'round');
    const group = svg('g', f.tilt === 'tilted' ? { transform: 'rotate(45)' } : {}, shape);
    // The shapes reach a radius of about 43.5 (stroke included), so rotation never leaves the view box.
    return svg('svg', { viewBox: '-44 -44 88 88', class: 'wp-vs__shape', 'aria-hidden': 'true', focusable: 'false' }, group);
  };

  // Shared stripe pattern (stripes follow the shape's own orientation).
  const defs = svg(
    'svg',
    { class: 'wp-vs__defs', width: 0, height: 0, 'aria-hidden': 'true', focusable: 'false' },
    svg('defs', {}, svg('pattern', { id: stripesId, patternUnits: 'userSpaceOnUse', width: 100, height: 10 }, svg('rect', { x: -50, y: 0, width: 200, height: 4.5, fill: 'currentColor' })))
  );

  const introSample = h('div', { class: 'wp-vs__sample' });
  const introTarget = h('p', { class: 'wp-vs__target', 'data-testid': 'vs-intro-target' });
  const introPresence = h('p', {});
  const startBtn = h('button', { type: 'button', class: 'primary', 'data-testid': 'vs-start', 'data-autofocus': '', onclick: () => start() }, t('action.start'));
  const intro = h(
    'div',
    { class: 'wp-vs__intro', 'data-testid': 'vs-intro' },
    introSample,
    introTarget,
    h('p', {}, t('intro.length')),
    introPresence,
    h('p', { class: 'wp-vs__muted' }, t('intro.keys')),
    startBtn
  );

  const findSample = h('span', { class: 'wp-vs__find-sample', 'data-testid': 'vs-find-sample' });
  const findText = h('span', { 'data-testid': 'vs-find' });
  const findEl = h('p', { class: 'wp-vs__find' }, findSample, findText);
  const statusEl = h('p', { class: 'wp-status wp-vs__status', 'data-testid': 'vs-status' });
  const board = h('div', { class: 'wp-vs__board', role: 'group', 'data-testid': 'vs-board' });
  const notThereBtn = h('button', { type: 'button', class: 'wp-vs__not-there', 'data-testid': 'vs-not-there', 'aria-keyshortcuts': 'N', onclick: () => pick(NOT_THERE) }, t('action.notThere'));
  const nextBtn = h('button', { type: 'button', class: 'primary', 'data-testid': 'vs-next', onclick: () => next() }, t('action.next'));
  const feedbackEl = h('p', { class: 'wp-vs__feedback', 'data-testid': 'vs-feedback' });
  const play = h('div', { class: 'wp-vs__play' }, findEl, statusEl, board, feedbackEl, h('div', { class: 'wp-row wp-vs__actions' }, notThereBtn, nextBtn));
  const summaryEl = h('div', { class: 'wp-vs__summary', 'data-testid': 'vs-summary', tabindex: -1 });
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status' });
  const container = h(
    'div',
    { class: `wp-vs${context.reducedMotion ? '' : ' wp-vs--motion'}`, dir: t.direction },
    defs,
    intro,
    play,
    summaryEl,
    live
  );

  const ensureRound = (s: SearchState) => {
    const key = `${s.seed}:${s.difficulty}`;
    if (key !== roundKey) {
      round = generateRound(s.seed, s.difficulty);
      roundKey = key;
    }
  };

  /** Index of the board on screen (the reviewed one, else the current one), if any. */
  const shownIndex = (): number | undefined => {
    if (!state) return undefined;
    if (review !== undefined) return review;
    return state.phase === 'running' ? state.answers.length : undefined;
  };

  const seconds = (ms: number) => new Intl.NumberFormat(t.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(ms / 1000);

  const summaryLines = (s: SearchState, r: Round): string[] => {
    const sum = summarize(s, r);
    const lines = [t('summary.correct', { correct: sum.correct, total: sum.total }), t('summary.wrongItem', { count: sum.wrongItem })];
    if (allowsNotThere(s.difficulty)) {
      lines.push(t('summary.missed', { count: sum.missed }), t('summary.falseFind', { count: sum.falseFind }));
    }
    for (const { setSize, ms } of sum.medians) {
      lines.push(ms === null ? t('summary.noTime', { size: setSize }) : t('summary.median', { size: setSize, seconds: seconds(ms) }));
    }
    lines.push(t('summary.timeNote'), t(s.difficulty === 'feature' ? 'explain.feature' : 'explain.conjunction'), t('summary.note'));
    return lines;
  };

  const itemLabel = (item: Item, cols: number, revealed: boolean, chosen: boolean): string => {
    let label = t('item.label', { features: describe(item), row: Math.floor(item.cell / cols) + 1, col: (item.cell % cols) + 1 });
    if (revealed && item.target) label = t('item.target', { label });
    if (revealed && chosen) label = t('item.chosen', { label });
    return label;
  };

  const items = () => [...board.querySelectorAll<HTMLButtonElement>('[data-item]')];

  const buildBoard = (index: number) => {
    if (!state || !round) return;
    const trial = round.trials[index];
    if (!trial) return;
    const { cols, rows } = CONFIGS[state.difficulty];
    clear(board);
    board.style.setProperty('--wp-vs-cols', String(cols));
    board.dataset.trial = String(index);
    board.setAttribute('aria-label', t('board.label', { n: index + 1, total: TRIALS, count: trial.setSize }));
    const byCell = new Map(trial.items.map((item, i) => [item.cell, i]));
    for (let cell = 0; cell < cols * rows; cell++) {
      const i = byCell.get(cell);
      const item = i === undefined ? undefined : trial.items[i];
      if (!item || i === undefined) {
        board.append(h('div', { class: 'wp-vs__cell', 'aria-hidden': 'true' }));
        continue;
      }
      const button = h('button', {
        type: 'button',
        class: 'wp-vs__item',
        'data-item': i,
        'data-testid': `vs-item-${i}`,
        'data-cell': item.cell,
        'data-shape': item.shape,
        'data-fill': item.fill,
        'data-tilt': item.tilt,
        tabindex: -1,
        onclick: () => pick(i)
      });
      const shape = drawShape(item);
      const offset = (d: number) => `${50 - ITEM_DIAMETER / 2 + d}%`;
      shape.style.setProperty('inset-inline-start', offset(item.dx));
      shape.style.setProperty('top', offset(item.dy));
      shape.style.setProperty('width', `${ITEM_DIAMETER}%`);
      shape.style.setProperty('height', `${ITEM_DIAMETER}%`);
      button.append(shape);
      board.append(h('div', { class: 'wp-vs__cell' }, button));
    }
  };

  const update = () => {
    if (!state || !round) return;
    const s = state;
    const r = round;
    const allowNotThere = allowsNotThere(s.difficulty);
    intro.hidden = s.phase !== 'ready';
    clear(introSample);
    introSample.append(drawShape(r.target));
    introTarget.textContent = t('intro.target', { features: describe(r.target) });
    introPresence.textContent = t(allowNotThere ? 'intro.sometimes' : 'intro.always');

    const index = shownIndex();
    play.hidden = index === undefined;
    summaryEl.hidden = s.phase !== 'finished';
    clear(summaryEl);
    if (s.phase === 'finished') summaryEl.append(...summaryLines(s, r).map((line) => h('p', {}, line)));
    if (index === undefined) {
      boardKey = '';
      feedbackEl.textContent = '';
      clear(board);
      return;
    }

    clear(findSample);
    findSample.append(drawShape(r.target));
    Object.assign(findSample.dataset, { shape: r.target.shape, fill: r.target.fill, tilt: r.target.tilt });
    findText.textContent = t('status.find', { features: describe(r.target) });
    statusEl.textContent = t('status.progress', { n: index + 1, total: TRIALS });

    const key = `${roundKey}:${index}`;
    if (key !== boardKey) {
      boardKey = key;
      focusIndex = 0;
      buildBoard(index);
    }
    const trial = r.trials[index];
    const answer = review === undefined ? undefined : s.answers[review];
    const { cols } = CONFIGS[s.difficulty];
    items().forEach((button, i) => {
      const item = trial?.items[i];
      if (!item) return;
      const revealed = answer !== undefined;
      const chosen = revealed && answer.pick === i;
      button.tabIndex = i === focusIndex ? 0 : -1;
      button.setAttribute('aria-disabled', String(revealed));
      button.classList.toggle('is-target', revealed && item.target);
      button.classList.toggle('is-chosen', chosen);
      if (revealed && item.target) button.dataset.revealed = 'target';
      else delete button.dataset.revealed;
      button.setAttribute('aria-label', itemLabel(item, cols, revealed, chosen));
    });
    board.classList.toggle('is-review', answer !== undefined);
    feedbackEl.textContent = answer !== undefined && trial ? t(`feedback.${outcomeOf(trial, answer.pick)}`) : '';
    notThereBtn.hidden = !allowNotThere || answer !== undefined;
    nextBtn.hidden = answer === undefined || s.phase === 'finished';
  };

  const showBoard = () => {
    onset = Date.now();
    interrupted = false;
  };

  const focusItem = (index: number) => {
    focusIndex = index;
    const buttons = items();
    buttons.forEach((b, i) => (b.tabIndex = i === index ? 0 : -1));
    buttons[index]?.focus();
  };

  // --- player actions ---
  const start = () => {
    if (!state || state.phase !== 'ready') return;
    state = startRound(state);
    review = undefined;
    update();
    showBoard();
    context.requestSave();
    focusItem(0);
  };

  const pick = (choice: number) => {
    if (!state || !round || review !== undefined || !currentTrial(state, round)) return;
    const index = state.answers.length;
    const ms = interrupted ? null : Date.now() - onset;
    const nextState = answerTrial(state, round, choice, ms);
    if (nextState === state) return;
    state = nextState;
    review = index;
    update();
    context.requestSave();
    const feedback = feedbackEl.textContent ?? '';
    if (state.phase === 'finished') {
      const sum = summarize(state, round);
      const stats: Record<string, number> = { correct: sum.correct, total: sum.total, wrongItem: sum.wrongItem, missed: sum.missed, falseFind: sum.falseFind };
      for (const { setSize, ms: median } of sum.medians) if (median !== null) stats[`medianMs${setSize}`] = median;
      announce(live, [feedback, t('result.completed'), ...summaryLines(state, round)].join(' '));
      context.finished({ outcome: 'completed', stats });
      summaryEl.focus();
      return;
    }
    announce(live, feedback);
    nextBtn.focus();
  };

  const next = () => {
    if (!state || review === undefined || state.phase !== 'running') return;
    review = undefined;
    update();
    showBoard();
    focusItem(0);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'n' || event.key === 'N') {
      if (state && round && review === undefined && currentTrial(state, round) && allowsNotThere(state.difficulty)) {
        event.preventDefault();
        pick(NOT_THERE);
      }
      return;
    }
    const target = event.target as HTMLElement | null;
    const buttons = items();
    const from = target ? buttons.indexOf(target as HTMLButtonElement) : -1;
    if (from < 0 || !state) return;
    const rtl = t.direction === 'rtl';
    const move: Move | undefined =
      event.key === 'ArrowLeft' ? (rtl ? 'next' : 'prev') : event.key === 'ArrowRight' ? (rtl ? 'prev' : 'next') : ARROWS[event.key];
    if (!move) return;
    event.preventDefault();
    const cells = buttons.map((b) => Number(b.dataset.cell));
    focusItem(navigate(cells, CONFIGS[state.difficulty].cols, from, move));
  };
  container.addEventListener('keydown', onKeyDown);

  const mount = () => {
    if (container.parentElement !== root) {
      clear(root);
      root.append(container);
    }
    boardKey = '';
    update();
  };

  const begin = (seed: number, difficulty: Difficulty) => {
    review = undefined;
    state = newRound(seed, difficulty);
    ensureRound(state);
    mount();
    context.requestSave();
  };

  return {
    newGame(options: NewGameOptions) {
      begin(options.seed, toDifficulty(options.difficulty));
    },
    restore(saved: SearchState) {
      // The current board is shown again (same seeded layout) and timed from now on.
      state = clone(saved);
      review = undefined;
      ensureRound(state);
      mount();
      showBoard();
    },
    serialize() {
      if (!state) throw new Error('No game in progress');
      return clone(state);
    },
    pause() {
      interrupted = true;
    },
    resume() {
      // Nothing to do: the board stays as it was; a paused board is simply not timed.
    },
    reset() {
      if (state) begin(state.seed, state.difficulty);
    },
    dispose() {
      container.removeEventListener('keydown', onKeyDown);
      clear(root);
      state = undefined;
      round = undefined;
    }
  };
}
