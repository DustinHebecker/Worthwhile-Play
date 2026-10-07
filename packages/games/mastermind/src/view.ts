// @ts-nocheck
import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import {
  MAX_GUESSES,
  canSubmit,
  checkDraft,
  clearDraft,
  clearSlot,
  configOf,
  createInitialState,
  gameStatus,
  historyOf,
  placeSymbol,
  setCursor,
  submitGuess,
  toDifficulty,
  type MastermindState
} from './rules';
import './styles.css';

const SVG_NS = 'http://www.w3.org/2000/svg';

type ShapePart = readonly [tag: string, attrs: Readonly<Record<string, string>>];

/** Symbol index → shape. Each symbol has a distinct shape, colour (CSS) and translated name. */
const SHAPES: readonly { name: string; parts: readonly ShapePart[] }[] = [
  { name: 'circle', parts: [['circle', { cx: '12', cy: '12', r: '9' }]] },
  { name: 'triangle', parts: [['polygon', { points: '12,2.5 21.8,20.5 2.2,20.5' }]] },
  { name: 'square', parts: [['rect', { x: '3.5', y: '3.5', width: '17', height: '17', rx: '1.5' }]] },
  { name: 'diamond', parts: [['polygon', { points: '12,1.5 22.5,12 12,22.5 1.5,12' }]] },
  { name: 'star', parts: [['polygon', { points: '12,1.8 14.7,9 22.4,9.3 16.4,14.1 18.5,21.6 12,17.3 5.5,21.6 7.6,14.1 1.6,9.3 9.3,9' }]] },
  { name: 'hexagon', parts: [['polygon', { points: '22,12 17,20.7 7,20.7 2,12 7,3.3 17,3.3' }]] },
  { name: 'plus', parts: [['path', { d: 'M8.5 2.5h7v6h6v7h-6v6h-7v-6h-6v-7h6z' }]] },
  { name: 'heart', parts: [['path', { d: 'M12 21.5S2 15.2 2 8.6A5 5 0 0 1 12 6a5 5 0 0 1 10 2.6c0 6.6-10 12.9-10 12.9z' }]] }
];

function shapeIcon(symbol: number): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  for (const [tag, attrs] of SHAPES[symbol]?.parts ?? []) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
    svg.appendChild(el);
  }
  return svg;
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createMastermind(context: GameContext): GameInstance<MastermindState> {
  const { t } = context;
  const rtl = t.direction === 'rtl';
  let state = createInitialState(0);
  let paused = false;
  /** Result of the user-invoked consistency check; cleared whenever the draft changes. */
  let checkMessage = '';

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'mm-live' });
  const board = h('div', { class: 'mm-board' });
  const container = h('div', { class: 'wp-mastermind', dir: t.direction, lang: t.locale }, board, live);

  const symbolName = (symbol: number) => t(`shape.${SHAPES[symbol]?.name ?? 'circle'}`);
  const codeText = (code: readonly number[]) => code.map(symbolName).join(t('code.separator'));

  const tile = (symbol: number | null, extraClass = '') => {
    const el = h('span', { class: `mm-tile ${symbol === null ? 'mm-empty' : `mm-sym mm-sym-${symbol}`} ${extraClass}`.trim(), 'aria-hidden': 'true' });
    if (symbol !== null) el.appendChild(shapeIcon(symbol));
    return el;
  };

  const pegs = (exact: number, partial: number, positions: number) => {
    const box = h('span', { class: 'mm-pegs', 'aria-hidden': 'true', style: `--mm-peg-cols: ${Math.ceil(positions / 2)}` });
    for (let i = 0; i < positions; i++) {
      const kind = i < exact ? 'exact' : i < exact + partial ? 'partial' : 'none';
      box.appendChild(h('span', { class: `mm-peg mm-peg-${kind}` }));
    }
    return box;
  };

  // --- State changes -----------------------------------------------------------------------

  const commit = (next: MastermindState, message?: string) => {
    if (next === state) return false;
    state = next;
    checkMessage = '';
    render();
    context.requestSave();
    if (message) announce(live, message);
    return true;
  };

  const place = (symbol: number) => {
    const position = state.cursor;
    commit(placeSymbol(state, symbol), t('announce.placed', { symbol: symbolName(symbol), n: position + 1 }));
  };

  const backspace = () => {
    const next = clearSlot(state);
    if (next !== state) commit(next, t('announce.cleared', { n: next.cursor + 1 }));
  };

  const submit = () => {
    if (!canSubmit(state)) {
      if (gameStatus(state) === 'playing') {
        checkMessage = t('status.incomplete');
        render();
        announce(live, checkMessage);
      }
      return;
    }
    const next = submitGuess(state);
    const entry = historyOf(next)[next.guesses.length - 1];
    const status = gameStatus(next);
    let message = entry
      ? t('guess.summary', { n: next.guesses.length, code: codeText(entry.code), exact: entry.feedback.exact, partial: entry.feedback.partial })
      : '';
    if (status !== 'playing') message += ` ${statusText(next)}`;
    commit(next, message);
    if (status !== 'playing') context.finished({ outcome: status, stats: { guesses: next.guesses.length } });
  };

  const runCheck = () => {
    if (gameStatus(state) !== 'playing') return;
    const result = checkDraft(configOf(state), historyOf(state), state.draft);
    const remaining = t('check.remaining', { remaining: result.remaining });
    let verdict: string;
    if (result.verdict === 'contradicts') verdict = t('check.contradicts', { n: result.guessIndex + 1, exact: result.wouldGet.exact, partial: result.wouldGet.partial });
    else verdict = t(`check.${result.verdict}`);
    checkMessage = `${verdict} ${remaining}`;
    render();
    announce(live, checkMessage);
  };

  const statusText = (s: MastermindState) => {
    const status = gameStatus(s);
    if (status === 'won') return t('status.won', { n: s.guesses.length });
    if (status === 'lost') return t('status.lost', { code: codeText(s.secret) });
    return t('guessesLeft', { n: MAX_GUESSES - s.guesses.length, max: MAX_GUESSES });
  };

  // --- Rendering ---------------------------------------------------------------------------

  const focusKeyOf = (el: Element | null) => (el instanceof HTMLElement && container.contains(el) ? el.dataset.focus ?? null : null);

  const render = () => {
    const previousFocus = focusKeyOf(document.activeElement);
    clear(board);
    const config = configOf(state);
    const status = gameStatus(state);
    const history = historyOf(state);

    board.append(
      h('p', { class: 'mm-setup wp-muted', 'data-testid': 'mm-setup' }, t(config.repeats ? 'setup.repeats' : 'setup.unique', { positions: config.positions, symbols: config.symbols })),
      h('div', { class: 'mm-legend' },
        h('span', { class: 'mm-legend-item' }, pegs(1, 0, 1), t('legend.exact')),
        h('span', { class: 'mm-legend-item' }, pegs(0, 1, 1), t('legend.partial'))
      ),
      h('p', { class: `wp-status mm-status mm-status-${status}`, 'data-testid': 'mm-status', 'data-status': status, tabindex: -1, 'data-focus': 'status' }, statusText(state))
    );

    if (history.length > 0) {
      const list = h('ol', { class: 'mm-history', 'aria-label': t('guesses.label'), 'data-testid': 'mm-history' });
      history.forEach((entry, i) => {
        list.appendChild(
          h('li', { class: 'mm-row', 'data-testid': `mm-guess-${i}`, 'data-code': entry.code.join(','), 'data-exact': entry.feedback.exact, 'data-partial': entry.feedback.partial },
            h('span', { class: 'mm-row-n', 'aria-hidden': 'true' }, i + 1),
            h('span', { class: 'mm-code', 'aria-hidden': 'true' }, ...entry.code.map((s) => tile(s, 'mm-small'))),
            pegs(entry.feedback.exact, entry.feedback.partial, config.positions),
            h('span', { class: 'sr-only' }, t('guess.summary', { n: i + 1, code: codeText(entry.code), exact: entry.feedback.exact, partial: entry.feedback.partial }))
          )
        );
      });
      board.appendChild(list);
    }

    if (status === 'lost') {
      board.appendChild(
        h('div', { class: 'mm-secret', 'data-testid': 'mm-secret', 'data-code': state.secret.join(',') },
          h('span', { class: 'mm-secret-label' }, t('secret.label')),
          h('span', { class: 'mm-code', role: 'img', 'aria-label': codeText(state.secret) }, ...state.secret.map((s) => tile(s, 'mm-small')))
        )
      );
    }

    if (status === 'playing') board.appendChild(renderComposer());

    if (previousFocus) restoreFocus(previousFocus, status === 'playing');
  };

  const renderComposer = () => {
    const config = configOf(state);
    const slots = h('div', { class: 'mm-slots', role: 'group', 'aria-label': t('draft.label'), 'data-testid': 'mm-draft' });
    state.draft.forEach((symbol, i) => {
      const isCursor = i === state.cursor;
      const label = symbol === null ? t('slot.empty', { n: i + 1 }) : t('slot.filled', { n: i + 1, symbol: symbolName(symbol) });
      const button = h('button', {
        type: 'button',
        class: `mm-slot${isCursor ? ' is-cursor' : ''}`,
        'data-slot': i,
        'data-focus': `slot-${i}`,
        'data-testid': `mm-slot-${i}`,
        'data-symbol': symbol === null ? '' : symbol,
        'aria-label': label,
        'aria-current': isCursor ? 'true' : undefined,
        tabindex: isCursor ? 0 : -1,
        onclick: () => {
          if (!paused) commit(setCursor(state, i));
        }
      }, tile(symbol));
      slots.appendChild(button);
    });

    const palette = h('div', { class: 'mm-palette', role: 'group', 'aria-label': t('palette.label') });
    for (let s = 0; s < config.symbols; s++) {
      palette.appendChild(
        h('button', {
          type: 'button',
          class: 'mm-pal',
          'data-focus': `pal-${s}`,
          'data-testid': `mm-palette-${s}`,
          'aria-label': t('palette.button', { symbol: symbolName(s), key: s + 1 }),
          onclick: () => {
            if (!paused) place(s);
          }
        }, tile(s), h('span', { class: 'mm-key', 'aria-hidden': 'true' }, s + 1))
      );
    }

    const submittable = canSubmit(state);
    const actions = h('div', { class: 'wp-row mm-actions' },
      h('button', {
        type: 'button',
        class: `primary${submittable ? '' : ' is-inactive'}`,
        'data-focus': 'submit',
        'data-testid': 'mm-submit',
        'aria-disabled': submittable ? undefined : 'true',
        onclick: () => {
          if (!paused) submit();
        }
      }, t('action.submit')),
      h('button', { type: 'button', 'data-focus': 'clear', 'data-testid': 'mm-clear', onclick: () => {
        if (!paused) commit(clearDraft(state));
      } }, t('action.clear')),
      h('button', { type: 'button', 'data-focus': 'check', 'data-testid': 'mm-check', 'aria-describedby': 'mm-check-help', onclick: () => {
        if (!paused) runCheck();
      } }, t('action.check'))
    );

    return h('section', { class: 'mm-composer', 'aria-label': t('draft.label') },
      slots,
      palette,
      actions,
      h('p', { class: 'mm-check-result', 'data-testid': 'mm-check-result', hidden: checkMessage === '' }, checkMessage),
      h('p', { class: 'mm-hint wp-muted', id: 'mm-check-help' }, t('check.help')),
      h('p', { class: 'mm-hint wp-muted' }, t('keys.help', { max: config.symbols }))
    );
  };

  const restoreFocus = (key: string, playing: boolean) => {
    let target: HTMLElement | null = null;
    if (playing) {
      // Slot focus follows the cursor; after submitting, continue at the (reset) cursor.
      const followCursor = key.startsWith('slot-') || key === 'submit' || key === 'clear';
      target = board.querySelector<HTMLElement>(`[data-focus="${followCursor ? `slot-${state.cursor}` : key}"]`);
    }
    (target ?? board.querySelector<HTMLElement>('[data-focus="status"]'))?.focus();
  };

  // --- Keyboard ------------------------------------------------------------------------------

  const onKeyDown = (event: KeyboardEvent) => {
    if (paused || event.altKey || event.ctrlKey || event.metaKey || gameStatus(state) !== 'playing') return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    const onSlot = target?.dataset.slot !== undefined;
    if (/^[1-9]$/.test(event.key)) {
      const symbol = Number(event.key) - 1;
      if (symbol < configOf(state).symbols) {
        event.preventDefault();
        place(symbol);
      }
      return;
    }
    const last = state.draft.length - 1;
    const moves: Record<string, number> = {
      ArrowLeft: state.cursor + (rtl ? 1 : -1),
      ArrowRight: state.cursor + (rtl ? -1 : 1),
      Home: 0,
      End: last
    };
    switch (event.key) {
      case 'Backspace':
      case 'Delete':
        event.preventDefault();
        backspace();
        return;
      case 'Enter':
        // Let Enter activate other focused buttons natively; on slots or elsewhere it submits.
        if (target instanceof HTMLButtonElement && !onSlot) return;
        event.preventDefault();
        submit();
        return;
      default: {
        const to = moves[event.key];
        if (to === undefined || !onSlot) return;
        event.preventDefault();
        commit(setCursor(state, Math.max(0, Math.min(last, to))));
      }
    }
  };
  container.addEventListener('keydown', onKeyDown);

  // --- GameInstance --------------------------------------------------------------------------

  const mount = () => {
    if (!container.isConnected) context.root.appendChild(container);
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      state = createInitialState(options.seed, toDifficulty(options.difficulty));
      checkMessage = '';
      mount();
    },
    restore(saved: MastermindState) {
      state = clone(saved);
      checkMessage = '';
      mount();
    },
    serialize: () => clone(state),
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    reset() {
      state = createInitialState(state.seed, state.difficulty);
      checkMessage = '';
      mount();
      context.requestSave();
    },
    dispose() {
      container.removeEventListener('keydown', onKeyDown);
      clear(context.root);
    }
  };
}
