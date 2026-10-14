import './styles.css';
import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { isRecord } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import {
  answer,
  blockLength,
  canCompare,
  dPrime,
  generateBlock,
  GLYPHS,
  newBlock,
  nOf,
  PACES,
  POSITION_BIT,
  POSITIONS,
  scoreBlock,
  setPace,
  setVariant,
  SHAPES,
  startBlock,
  SYMBOL_BIT,
  TIMED_ITEM_MS,
  toDifficulty,
  toPace,
  togglePending,
  toVariant,
  VARIANTS,
  type Difficulty,
  type Item,
  type NBackState,
  type Pace,
  type StreamScore,
  type Variant
} from './rules';

/**
 * Answer design: in the single variants every item gets an explicit answer, "Match" or
 * "No match" (two large buttons; M/Space and N/J), which also moves on to the next item.
 * Explicit answers suit the self-paced default (nothing moves until the person answers)
 * and work the same for pointer, touch, keyboard and screen readers. In the dual variant
 * the two claims are toggles ("Same position" A, "Same shape" L) confirmed with "Next".
 *
 * The optional timed pace only closes an unanswered item after TIMED_ITEM_MS (as "No
 * match", or with the toggled dual claims). It stops on pause() and after a restore, and
 * the logical state is exact at item boundaries, so timers are never needed for correctness.
 */
const PREFERENCES_KEY = 'options';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const isTextEntry = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

const keyIs = (event: KeyboardEvent, letter: string): boolean => event.key.toLowerCase() === letter || event.code === `Key${letter.toUpperCase()}`;

export function createNBack(context: GameContext): GameInstance<NBackState> {
  const { root, t } = context;
  const seconds = TIMED_ITEM_MS / 1000;
  let state: NBackState | undefined;
  let block: Item[] = [];
  let blockKey = '';
  let paused = false;
  /** Timed pace waits for "Continue" after a pause or a restore. View state only. */
  let held = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const readOptions = (): { variant: Variant; pace: Pace } => {
    const raw = context.preferences?.get(PREFERENCES_KEY);
    return isRecord(raw) ? { variant: toVariant(raw.variant), pace: toPace(raw.pace) } : { variant: toVariant(undefined), pace: toPace(undefined) };
  };

  // --- intro (ready phase) ---
  const taskEl = h('p', { class: 'wp-nb__task', 'data-testid': 'nb-task' });
  const lengthEl = h('p', { 'data-testid': 'nb-length' });
  const luresEl = h('p', { class: 'wp-nb__muted' });
  const optionButton = (group: string, value: string, label: string, onclick: () => void) =>
    h('button', { type: 'button', class: 'wp-nb__option', 'data-testid': `nb-${group}-${value}`, 'aria-pressed': 'false', onclick }, label);
  const variantButtons = VARIANTS.map((v) => optionButton('variant', v, t(`variant.${v}`), () => chooseVariant(v)));
  const paceButtons = PACES.map((p) => optionButton('pace', p, t(`pace.${p}`, { seconds }), () => choosePace(p)));
  const timedNote = h('p', { class: 'wp-nb__muted' }, t('intro.timed', { seconds }));
  const startBtn = h('button', { type: 'button', class: 'primary', 'data-testid': 'nb-start', 'data-autofocus': true, onclick: () => start() }, t('action.start'));
  const optionGroup = (labelKey: string, buttons: HTMLElement[]) => {
    const id = `wp-nb-${labelKey.replace('.', '-')}`;
    return h(
      'div',
      { class: 'wp-nb__options', role: 'group', 'aria-labelledby': id },
      h('span', { id, class: 'wp-nb__options-label' }, t(labelKey)),
      ...buttons
    );
  };
  const intro = h(
    'div',
    { class: 'wp-nb__intro', 'data-testid': 'nb-intro' },
    taskEl,
    lengthEl,
    luresEl,
    optionGroup('variant.label', variantButtons),
    optionGroup('pace.label', paceButtons),
    timedNote,
    startBtn
  );

  // --- play ---
  const statusEl = h('p', { class: 'wp-status wp-nb__status', 'data-testid': 'nb-status' });
  const promptEl = h('p', { class: 'wp-nb__prompt', 'data-testid': 'nb-prompt' });
  const cells = Array.from({ length: POSITIONS }, (_, i) =>
    h('div', { class: 'wp-nb__cell', 'data-testid': `nb-cell-${i}`, 'data-state': 'idle' }, h('span', { class: 'wp-nb__glyph', 'aria-hidden': 'true' }))
  );
  // Always left-to-right, so that position names ("top left") stay true in RTL locales.
  const grid = h('div', { class: 'wp-nb__grid', dir: 'ltr', 'aria-hidden': 'true' }, ...cells);
  const shapeStage = h('div', { class: 'wp-nb__shape', 'aria-hidden': 'true', 'data-testid': 'nb-shape' });
  const stage = h('div', { class: 'wp-nb__stage' }, grid, shapeStage);
  const itemEl = h('p', { class: 'wp-nb__item', 'data-testid': 'nb-item', 'data-index': '', 'data-position': '', 'data-symbol': '' });
  const matchBtn = h('button', { type: 'button', class: 'primary wp-nb__answer', 'data-testid': 'nb-match', onclick: () => commit(state ? matchBits() : 0) }, t('action.match'));
  const noMatchBtn = h('button', { type: 'button', class: 'wp-nb__answer', 'data-testid': 'nb-no-match', onclick: () => commit(0) }, t('action.noMatch'));
  const posBtn = h(
    'button',
    { type: 'button', class: 'wp-nb__answer wp-nb__toggle', 'data-testid': 'nb-same-position', 'aria-pressed': 'false', onclick: () => toggle(POSITION_BIT) },
    t('action.samePosition')
  );
  const shapeBtn = h(
    'button',
    { type: 'button', class: 'wp-nb__answer wp-nb__toggle', 'data-testid': 'nb-same-shape', 'aria-pressed': 'false', onclick: () => toggle(SYMBOL_BIT) },
    t('action.sameShape')
  );
  const nextBtn = h('button', { type: 'button', class: 'primary wp-nb__answer', 'data-testid': 'nb-next', onclick: () => commit(state?.pending ?? 0) }, t('action.next'));
  const continueBtn = h('button', { type: 'button', class: 'primary wp-nb__answer', 'data-testid': 'nb-continue', onclick: () => proceed() }, t('action.continue'));
  const answers = h('div', { class: 'wp-nb__answers' }, matchBtn, noMatchBtn, posBtn, shapeBtn, nextBtn, continueBtn);
  const keysEl = h('p', { class: 'wp-nb__muted', 'data-testid': 'nb-keys' });
  const play = h('div', { class: 'wp-nb__play', 'data-testid': 'nb-play', tabindex: -1 }, promptEl, stage, itemEl, answers, keysEl);
  const summaryEl = h('div', { class: 'wp-nb__summary', 'data-testid': 'nb-summary', tabindex: -1, hidden: true });
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status' });
  const container = h('div', { class: `wp-nb${context.reducedMotion ? '' : ' wp-nb--motion'}`, dir: t.direction }, statusEl, intro, play, summaryEl, live);

  const focusInside = () => container.contains(document.activeElement);
  const running = () => !!state && state.phase === 'running';
  const active = () => running() && !held && !paused;
  /** "Match" claims every stream of a single variant (only one bit survives the variant mask). */
  const matchBits = () => POSITION_BIT | SYMBOL_BIT;

  const ensureBlock = (s: NBackState) => {
    const key = `${s.seed}:${s.difficulty}`;
    if (key !== blockKey) {
      block = generateBlock(s.seed, s.difficulty);
      blockKey = key;
    }
  };

  const itemText = (s: NBackState, index: number): string => {
    const item = block[index];
    if (!item) return t('item.none');
    const params = { n: index + 1, position: t(`pos.${item.position}`), shape: t(`shape.${SHAPES[item.symbol]}`) };
    return t(`item.${s.variant}`, params);
  };

  const formatDPrime = (value: number): string => {
    try {
      return new Intl.NumberFormat(t.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    } catch {
      return value.toFixed(2);
    }
  };

  const streamLines = (score: StreamScore): string[] => [
    t('summary.hits', { hits: score.hits, targets: score.targets }),
    t('summary.misses', { misses: score.misses }),
    t('summary.falseAlarms', { falseAlarms: score.falseAlarms }),
    t('summary.correctRejections', { correctRejections: score.correctRejections }),
    t('summary.dPrime', { value: formatDPrime(dPrime(score)) })
  ];

  const renderSummary = (s: NBackState) => {
    clear(summaryEl);
    const score = scoreBlock(s, block);
    const sections: [string, StreamScore | undefined][] = [
      ['variant.position', score.position],
      ['variant.symbol', score.symbol]
    ];
    for (const [labelKey, part] of sections) {
      if (!part) continue;
      summaryEl.append(
        h(
          'section',
          { class: 'wp-nb__stream', 'data-testid': `nb-summary-${labelKey === 'variant.position' ? 'position' : 'symbol'}` },
          h('h3', {}, t(labelKey)),
          ...streamLines(part).map((line) => h('p', {}, line))
        )
      );
    }
    summaryEl.append(h('p', { class: 'wp-nb__muted' }, t('summary.dPrimeNote')), h('p', { class: 'wp-nb__muted' }, t('summary.note')));
  };

  const update = () => {
    if (!state) return;
    const s = state;
    const n = nOf(s.difficulty);
    const total = blockLength(s.difficulty);
    intro.hidden = s.phase !== 'ready';
    play.hidden = s.phase !== 'running';
    summaryEl.hidden = s.phase !== 'finished';

    // Intro
    taskEl.textContent = t('intro.task', { n });
    lengthEl.textContent = t('intro.length', { count: total });
    luresEl.hidden = s.difficulty !== 'n3';
    luresEl.textContent = luresEl.hidden ? '' : t('intro.lures', { n });
    variantButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(VARIANTS[i] === s.variant)));
    paceButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(PACES[i] === s.pace)));
    timedNote.hidden = s.pace !== 'timed';

    // Status
    if (s.phase === 'ready') statusEl.textContent = t('status.ready');
    else if (s.phase === 'finished') statusEl.textContent = t('result.completed');
    else statusEl.textContent = t('status.progress', { n: s.index + 1, total });

    // Item
    const item = s.phase === 'running' ? block[s.index] : undefined;
    const showPosition = s.variant !== 'symbol';
    grid.hidden = !showPosition;
    shapeStage.hidden = showPosition;
    cells.forEach((cell, i) => {
      const lit = !!item && item.position === i;
      cell.dataset.state = lit ? 'active' : 'idle';
      const glyph = !lit ? '' : s.variant === 'dual' ? GLYPHS[SHAPES[item.symbol] as (typeof SHAPES)[number]] : '●';
      const span = cell.firstElementChild as HTMLElement;
      if (span.textContent !== glyph) span.textContent = glyph;
    });
    const shapeGlyph = item ? GLYPHS[SHAPES[item.symbol] as (typeof SHAPES)[number]] : '';
    if (shapeStage.textContent !== shapeGlyph) shapeStage.textContent = shapeGlyph;
    stage.dataset.index = String(s.index);
    itemEl.textContent = item ? itemText(s, s.index) : '';
    itemEl.dataset.index = item ? String(s.index) : '';
    itemEl.dataset.position = item && showPosition ? String(item.position) : '';
    itemEl.dataset.symbol = item && s.variant !== 'position' ? (SHAPES[item.symbol] as string) : '';

    // Answers
    const compare = canCompare(s);
    const dual = s.variant === 'dual';
    const answering = s.phase === 'running' && !held;
    matchBtn.hidden = !(answering && compare && !dual);
    noMatchBtn.hidden = matchBtn.hidden;
    posBtn.hidden = !(answering && compare && dual);
    shapeBtn.hidden = posBtn.hidden;
    posBtn.setAttribute('aria-pressed', String((s.pending & POSITION_BIT) !== 0));
    shapeBtn.setAttribute('aria-pressed', String((s.pending & SYMBOL_BIT) !== 0));
    nextBtn.hidden = !(answering && (!compare || dual));
    continueBtn.hidden = !(s.phase === 'running' && held);
    promptEl.textContent = held ? t('status.paused') : compare ? t('status.compare', { n }) : t('status.warmup');
    keysEl.hidden = !answering;
    keysEl.textContent = !compare ? t('keys.warmup') : dual ? t('keys.dual') : t('keys.single');

    if (s.phase === 'finished') renderSummary(s);
    else clear(summaryEl);
  };

  // --- timed pace (view state only) ---
  const stopTimer = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };

  const armTimer = () => {
    stopTimer();
    if (!state || state.pace !== 'timed' || !active()) return;
    timer = setTimeout(() => {
      timer = undefined;
      if (state && active()) commit(state.pending);
    }, TIMED_ITEM_MS);
  };

  /** Moves focus to the main control when the focused control has just been hidden. */
  const keepFocus = () => {
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && container.contains(focused) && !focused.closest('[hidden]')) return;
    const target = [continueBtn, nextBtn, matchBtn, posBtn].find((b) => !b.hidden);
    (target ?? play).focus();
  };

  const focusMain = () => {
    const target = [nextBtn, matchBtn, posBtn].find((b) => !b.hidden);
    (target ?? play).focus();
  };

  const presentItem = () => {
    if (!state) return;
    if (!context.reducedMotion) {
      // Restart the gentle fade so that a repeated item is still visibly a new item.
      stage.classList.remove('wp-nb__stage--enter');
      void stage.offsetWidth;
      stage.classList.add('wp-nb__stage--enter');
    }
    announce(live, `${itemText(state, state.index)}. ${canCompare(state) ? t('status.compare', { n: nOf(state.difficulty) }) : t('status.warmup')}`);
    armTimer();
  };

  // --- player actions ---
  const commit = (claims: number) => {
    if (!state || !active()) return;
    const hadFocus = focusInside();
    state = answer(state, claims);
    context.requestSave();
    update();
    if (state.phase === 'finished') {
      stopTimer();
      const score = scoreBlock(state, block);
      const { hits, misses, falseAlarms, correctRejections } = score.total;
      context.finished({
        outcome: 'completed',
        stats: { n: nOf(state.difficulty), hits, misses, falseAlarms, correctRejections, dPrime: dPrime(score.total) }
      });
      announce(live, t('result.completed'));
      if (hadFocus) summaryEl.focus();
      return;
    }
    if (hadFocus) keepFocus();
    presentItem();
  };

  const toggle = (bit: number) => {
    if (!state || !active()) return;
    const next = togglePending(state, bit);
    if (next === state) return;
    state = next;
    update();
    context.requestSave();
  };

  const chooseVariant = (variant: Variant) => {
    if (!state || state.phase !== 'ready' || state.variant === variant) return;
    state = setVariant(state, variant);
    context.preferences?.set(PREFERENCES_KEY, { variant: state.variant, pace: state.pace });
    update();
    context.requestSave();
  };

  const choosePace = (pace: Pace) => {
    if (!state || state.phase !== 'ready' || state.pace === pace) return;
    state = setPace(state, pace);
    context.preferences?.set(PREFERENCES_KEY, { variant: state.variant, pace: state.pace });
    update();
    context.requestSave();
  };

  const start = () => {
    if (!state || paused || state.phase !== 'ready') return;
    state = startBlock(state);
    held = false;
    context.requestSave();
    update();
    focusMain();
    presentItem();
  };

  const proceed = () => {
    if (!state || paused || !running() || !held) return;
    held = false;
    update();
    focusMain();
    presentItem();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!state || !active() || event.repeat || event.altKey || event.ctrlKey || event.metaKey || isTextEntry(event.target)) return;
    const target = event.target as Node | null;
    // Only from the page body or from inside the game, never from the host's controls.
    if (target && target !== document.body && target !== document.documentElement && !container.contains(target)) return;
    const onButton = target instanceof HTMLElement && target.tagName === 'BUTTON';
    const compare = canCompare(state);
    const dual = state.variant === 'dual';
    let action: (() => void) | undefined;
    if (event.key === ' ' || event.key === 'Enter') {
      // Space/Enter on a focused button activate that button natively.
      if (onButton) return;
      if (!compare || dual) action = () => commit(state?.pending ?? 0);
      else if (event.key === ' ') action = () => commit(matchBits());
    } else if (compare && !dual && keyIs(event, 'm')) action = () => commit(matchBits());
    else if (compare && !dual && (keyIs(event, 'n') || keyIs(event, 'j'))) action = () => commit(0);
    else if (compare && dual && keyIs(event, 'a')) action = () => toggle(POSITION_BIT);
    else if (compare && dual && keyIs(event, 'l')) action = () => toggle(SYMBOL_BIT);
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

  const begin = (seed: number, difficulty: Difficulty, variant: Variant, pace: Pace) => {
    stopTimer();
    held = false;
    state = newBlock(seed, difficulty, variant, pace);
    ensureBlock(state);
    mount();
    context.requestSave();
  };

  return {
    newGame(options: NewGameOptions) {
      const { variant, pace } = readOptions();
      begin(options.seed, toDifficulty(options.difficulty), variant, pace);
    },
    restore(saved: NBackState) {
      // Closed mid-block: the same item is shown again. The timed pace waits for "Continue".
      stopTimer();
      state = clone(saved);
      ensureBlock(state);
      held = state.phase === 'running' && state.pace === 'timed';
      mount();
    },
    serialize() {
      if (!state) throw new Error('No game in progress');
      return clone(state);
    },
    pause() {
      paused = true;
      stopTimer();
      if (state?.phase === 'running' && state.pace === 'timed' && !held) {
        const hadFocus = focusInside();
        held = true;
        update();
        if (hadFocus) continueBtn.focus();
      }
    },
    resume() {
      // A timed block stays on "Paused — continue" until the person chooses to go on.
      paused = false;
    },
    reset() {
      if (state) begin(state.seed, state.difficulty, state.variant, state.pace);
    },
    dispose() {
      stopTimer();
      document.removeEventListener('keydown', onKeyDown);
      clear(root);
      state = undefined;
    }
  };
}
