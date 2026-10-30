import { bcp47Tag, type GameContext, type GameInstance, type NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import { LOCALES, type Locale } from './art/types';
import { exposureOf, parseMove, replayCursor, shotsLeft, step, updateExposure, type Cursor, type Exposure, type Outcome, type Table } from './engine';
import { createInitial } from './generate';
import { hint as computeHint, type HintResult } from './hint';
import { findMotif } from './motifs/index';
import { canUndo, resetState, restart, tableOfState, undo, undoTo, type Hit, type Move, type PaletteEntry, type PeelState, type Shooter } from './rules';
import { fitCell } from './layout';
import { PeelQueue, SLOW_TIMING, TIMING } from './peel';
import { inkFor, SYMBOLS, symbolPath } from './symbols';
import './styles.css';

export { inkFor, SYMBOLS } from './symbols';

const PREFS = 'display';
/** Track frame around the picture (CSS px). */
const TRACK = 6;
/** Cell size (CSS px) in Large view. */
const LARGE_CELL = 14;
/** Symbols and the hatch are drawn from this cell size (CSS px). */
const SYMBOL_MIN = 10;
/** Chips shown per lane before "Show whole lanes" (on a phone held upright: 2, so the play unit fits one screen). */
const CHIPS_SHOWN = 7;
const CHIPS_COMPACT = 2;

/**
 * How launches are drawn (design v3 § 3, § 12.9): Slow walks station by station and shoots line by line, Quick walks
 * quickly and peels pixel by pixel, Off is instant.
 */
export type PeelMode = 'slow' | 'quick' | 'off';
export const PEEL_MODES: readonly PeelMode[] = ['slow', 'quick', 'off'];

/**
 * The Peeling preference of a stored display record (field `peeling`). Older records: the first v3 field `peel`,
 * whose "slow" was today's Quick (the same animation) and whose v2-style "quick" is gone, both read as Quick, "off"
 * as Off; the v2 `animation: false` as Off; otherwise the default, Quick.
 */
export function peelOf(stored: unknown): PeelMode {
  const record = typeof stored === 'object' && stored !== null ? (stored as Record<string, unknown>) : {};
  if ((PEEL_MODES as readonly unknown[]).includes(record.peeling)) return record.peeling as PeelMode;
  if (record.peel === 'off') return 'off';
  if (record.peel === 'slow' || record.peel === 'quick') return 'quick';
  return record.animation === false ? 'off' : 'quick';
}

/** Frame scheduling and clock, injectable for tests (presentation only: nothing in the game waits for them). */
export interface ViewOptions {
  frame?: (callback: (time: number) => void) => number;
  cancelFrame?: (handle: number) => void;
  now?: () => number;
}

interface Display {
  peeling: PeelMode;
  allSymbols: boolean;
  confirm: boolean;
  large: boolean;
  /** null: the default for the screen width. */
  wholeLanes: boolean | null;
}

/** What a move would do (cached per position). */
interface Preview extends Outcome {
  move: Move;
  hits: number;
  cells: Hit[];
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const rgbOf = (hex: string): [number, number, number] => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];

const SVG = 'http://www.w3.org/2000/svg';
function symbolSvg(index: number, ink: string): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'pp-symbol');
  const path = document.createElementNS(SVG, 'path');
  path.setAttribute('d', symbolPath(index));
  path.setAttribute('fill', ink);
  path.setAttribute('fill-rule', 'evenodd');
  svg.appendChild(path);
  return svg;
}

/** One 4 × 4 picture of one colour, cleared by one shooter: never shown, it only gives the view a valid state. */
const PLACEHOLDER: PeelState = {
  seed: 1,
  difficulty: 'easy',
  choice: 'any',
  motif: '',
  picture: { w: 4, h: 4, rows: ['aaaa', 'aaaa', 'aaaa', 'aaaa'], palette: [{ key: 'a', hex: '#888888', name: 'grey' }], backdrop: '#ffffff' },
  lanes: [[{ c: 'a', n: 16 }]],
  slots: 1,
  witness: ['L0'],
  moves: [],
  restartUndo: null,
  reported: false
};

export function createPixelPeel(context: GameContext, viewOptions: ViewOptions = {}): GameInstance<PeelState> {
  const { t } = context;
  const hasFrames = typeof requestAnimationFrame === 'function';
  const frame = viewOptions.frame ?? (hasFrames ? (cb: (time: number) => void) => requestAnimationFrame(cb) : undefined);
  const cancelFrame = viewOptions.cancelFrame ?? (typeof cancelAnimationFrame === 'function' ? (h: number) => cancelAnimationFrame(h) : () => undefined);
  const now = viewOptions.now ?? (() => performance.now());
  const locale: Locale = (LOCALES as readonly string[]).includes(t.locale) ? (t.locale as Locale) : 'en';
  // A tiny placeholder until newGame() or restore(): generating a real game here would only cost start time.
  let state: PeelState = PLACEHOLDER;
  let table: Table = tableOfState(state);
  let cursor: Cursor = replayCursor(table, []) as Cursor;
  let exposure: Exposure = exposureOf(table.engine, cursor.cells);
  /** Present cells per colour code. */
  let leftOf = new Int32Array(1);
  let previews = new Map<Move, Preview>();
  let paused = false;
  let previewMove: Move | null = null;
  /** Colour key highlighted from the colours list (null: none). */
  let shownColour: string | null = null;
  /** With "Confirm before launch": the move chosen by the first press. */
  let selected: Move | null = null;
  let hintResult: HintResult | null = null;
  let hintTimer: ReturnType<typeof setTimeout> | null = null;
  let statusText = '';
  /** Slow peeling: the queue of committed launches still to draw, and its frame loop. */
  let slow: PeelQueue | null = null;
  /** How the current queue draws (Slow: shots line by line; Quick: pixel by pixel). */
  let slowMode: PeelMode = 'quick';
  let slowFrame: number | null = null;
  let slowLast = 0;
  /** The reveal takes focus when it appears after the last move (not on restore). */
  let focusReveal = false;
  const peeling = () => slow?.busy ?? false;
  let laneFocus = 0;
  let slotFocus = 0;
  let wasStuck = false;
  /** The notice cards were closed (until the next change), and where focus goes back to. */
  let noticesDismissed = false;
  let noticeReturn: HTMLElement | null = null;
  let becameStuck = false;
  /** The shooter button just launched: not previewed again until the pointer leaves it or focus moves. */
  let quiet: HTMLElement | null = null;
  const keyboardFocused = (el: HTMLElement) => {
    try {
      return document.activeElement === el && el.matches(':focus-visible');
    } catch {
      return false;
    }
  };
  const coarsePointer = () => {
    try {
      return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    } catch {
      return false;
    }
  };
  const stored = context.preferences?.get(PREFS);
  const pref = (key: keyof Display): unknown => (typeof stored === 'object' && stored !== null ? (stored as Record<string, unknown>)[key] : undefined);
  const display: Display = {
    peeling: peelOf(stored),
    allSymbols: pref('allSymbols') === true,
    // On touch screens a tap would launch at once and the spotlight would never be seen: there the first tap
    // previews by default (remembered once the player changes it).
    confirm: typeof pref('confirm') === 'boolean' ? (pref('confirm') as boolean) : coarsePointer(),
    large: pref('large') === true,
    wholeLanes: typeof pref('wholeLanes') === 'boolean' ? (pref('wholeLanes') as boolean) : null
  };
  const wide = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 48rem)').matches;
  const wholeLanes = () => display.wholeLanes ?? wide();
  /** The stacked layout of a phone held upright (read once per mount and resize). */
  let compact = false;
  const chipsShown = () => (compact ? CHIPS_COMPACT : CHIPS_SHOWN);
  /** The picture sticks to the top of the stacked layout (the media query of styles.css). */
  const stickyTop = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(max-width: 47.99rem) and (orientation: portrait) and (min-height: 32rem), (max-width: 35.99rem) and (min-height: 32rem)').matches;

  // --- Text helpers ------------------------------------------------------------------------------------------

  const entry = (key: string): { e: PaletteEntry; i: number } => {
    const i = Math.max(0, state.picture.palette.findIndex((p) => p.key === key));
    return { e: state.picture.palette[i] as PaletteEntry, i };
  };
  const keyOfCode = (code: number) => table.engine.keys[code - 1] as string;
  const colourName = (key: string) => t(`colour.${entry(key).e.name}`);
  const symbolName = (key: string) => t(`symbol.${SYMBOLS[entry(key).i % SYMBOLS.length] ?? 'dot'}`);
  const shooterText = (s: Shooter) => t('shooter.text', { colour: colourName(s.c), n: s.n });
  const sentence = (text: string) => text.charAt(0).toLocaleUpperCase(bcp47Tag(t.locale)) + text.slice(1);
  const motifTitle = () => findMotif(state.motif)?.title[locale] ?? t('picture.generic');
  const motifPlace = () => findMotif(state.motif)?.place[locale] ?? '';
  const shooterOf = (o: Outcome): Shooter | null => (o.shooter ? { c: keyOfCode(o.shooter.c), n: o.shooter.n } : null);

  // --- DOM ---------------------------------------------------------------------------------------------------

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'pp-live' });
  const titleEl = h('p', { class: 'pp-title', 'data-testid': 'pp-title' });
  const leftEl = h('p', { class: 'pp-left', 'data-testid': 'pp-left' });
  const canvas = h('canvas', { class: 'pp-canvas', role: 'img', id: 'pp-canvas', 'data-testid': 'pp-canvas' });
  const board = h('div', { class: 'pp-board', dir: 'ltr', 'data-testid': 'pp-board' }, canvas);
  const status = h('p', { class: 'wp-status pp-status', 'data-testid': 'pp-status', 'aria-live': 'off' });

  const button = (testId: string, label: string, onclick: () => void) => h('button', { type: 'button', 'data-testid': testId, onclick: () => onclick() }, label);
  /** A button of the action row: its label in a span, so on a phone it keeps 44 px and its longest word (styles.css). */
  const actionButton = (testId: string, label: string, onclick: () => void) => h('button', { type: 'button', 'data-testid': testId, onclick: () => onclick() }, h('span', { class: 'pp-label' }, label));
  const finishCount = h('span', { class: 'pp-count', 'aria-hidden': 'true', dir: 'ltr' });
  const finishButton = h('button', { type: 'button', class: 'pp-finish', 'data-testid': 'pp-finish-peeling', onclick: () => finishAll() }, h('span', { class: 'pp-label' }, t('action.finishPeeling')), finishCount);
  finishButton.setAttribute('aria-controls', 'pp-canvas');
  const undoButton = actionButton('pp-undo', t('common.undo'), () => doUndo());
  const restartButton = button('pp-restart', t('action.restart'), () => doRestart());
  const hintButton = actionButton('pp-hint', t('common.hint'), () => doHint());
  const undoToButton = button('pp-undo-to', '', () => doUndoTo());
  const hintRow = h('div', { class: 'wp-row pp-hint-row', hidden: true }, undoToButton);
  const stuckText = h('p', { id: 'pp-stuck-text', 'data-testid': 'pp-stuck-text' }, t('stuck.text'));
  const closeNotice = h('button', { type: 'button', class: 'pp-close', 'data-testid': 'pp-stuck-close', 'aria-label': t('notice.close'), onclick: () => dismissNotices() }, h('span', { 'aria-hidden': 'true' }, '×'));
  const stuckBack = button('pp-stuck-back', '', () => doStuckBack());
  stuckBack.hidden = true;
  const stuckPanel = h('div', { class: 'pp-stuck', role: 'group', 'aria-labelledby': 'pp-stuck-text', 'data-testid': 'pp-stuck', hidden: true },
    h('div', { class: 'pp-stuck-head' }, stuckText, closeNotice),
    h('div', { class: 'wp-row' },
      stuckBack,
      button('pp-stuck-undo', t('common.undo'), () => doUndo()),
      button('pp-stuck-restart', t('action.restart'), () => doRestart()),
      button('pp-stuck-hint', t('common.hint'), () => doHint())
    )
  );

  const slotsHeading = h('h3', { class: 'pp-heading', id: 'pp-slots-heading', 'data-testid': 'pp-slots-heading' });
  const slotsRow = h('div', { class: 'pp-slots', role: 'group', 'aria-labelledby': 'pp-slots-heading' });
  const lanesRow = h('div', { class: 'pp-lanes', role: 'group', 'aria-labelledby': 'pp-lanes-heading' });
  const lanesToggle = h('button', { type: 'button', class: 'pp-lanes-toggle', 'data-testid': 'pp-lanes-toggle', 'aria-expanded': 'false' });
  let slotButtons: HTMLButtonElement[] = [];
  let slotFree: HTMLElement[] = [];
  let laneButtons: HTMLButtonElement[] = [];
  let laneEmpty: HTMLElement[] = [];
  /** Per lane, the chip of each shooter, created when it is first shown (sparse: building ~80 chips costs start time). */
  let laneChips: (HTMLElement | undefined)[][] = [];
  let laneLists: HTMLElement[] = [];

  const coloursList = h('ul', { class: 'pp-colour-list' });
  const colours = h('details', { class: 'pp-details', 'data-testid': 'pp-colours' }, h('summary', {}, t('colours.heading')), coloursList);
  let colourRows: { li: HTMLElement; count: HTMLElement; toggle: HTMLButtonElement; key: string }[] = [];

  const checkbox = (key: 'allSymbols' | 'confirm' | 'wholeLanes', label: string) => {
    const input = h('input', { type: 'checkbox', 'data-testid': `pp-option-${key}` });
    input.addEventListener('change', () => {
      display[key] = input.checked;
      savePrefs();
      selected = null;
      update();
    });
    return { input, label: h('label', { class: 'pp-option' }, input, h('span', {}, label)) };
  };
  const sizeRadio = (large: boolean) => {
    const input = h('input', { type: 'radio', name: 'pp-size', value: large ? 'large' : 'fit', 'data-testid': `pp-option-${large ? 'large' : 'fit'}` });
    input.addEventListener('change', () => {
      if (!input.checked) return;
      finishAll();
      display.large = large;
      savePrefs();
      update();
    });
    return { input, label: h('label', { class: 'pp-option' }, input, h('span', {}, t(large ? 'options.large' : 'options.fit'))) };
  };
  const peelRadio = (mode: PeelMode) => {
    const input = h('input', { type: 'radio', name: 'pp-peel', value: mode, 'data-testid': `pp-option-peel-${mode}` });
    input.addEventListener('change', () => {
      if (!input.checked) return;
      display.peeling = mode;
      savePrefs();
      // Effective at once: the running queue ends now; the next launch is drawn the new way.
      finishAll();
      update();
    });
    const key = mode === 'slow' ? 'options.peelSlow' : mode === 'quick' ? 'options.peelQuick' : 'options.peelOff';
    return { input, label: h('label', { class: 'pp-option' }, input, h('span', {}, t(key))) };
  };
  const peelRadios = { slow: peelRadio('slow'), quick: peelRadio('quick'), off: peelRadio('off') };
  const peelReduced = h('p', { class: 'wp-muted pp-help', 'data-testid': 'pp-peel-reduced' }, t('options.peelReduced'));
  peelReduced.hidden = !context.reducedMotion;
  const options = {
    allSymbols: checkbox('allSymbols', t('options.allSymbols')),
    confirm: checkbox('confirm', t('options.confirm')),
    wholeLanes: checkbox('wholeLanes', t('options.wholeLanes'))
  };
  const sizes = { fit: sizeRadio(false), large: sizeRadio(true) };
  const optionsBox = h('details', { class: 'pp-details', 'data-testid': 'pp-options' },
    h('summary', {}, t('options.heading')),
    h('fieldset', { class: 'pp-sizes pp-peel', 'data-testid': 'pp-peel' }, h('legend', {}, t('options.peel')), peelRadios.slow.label, peelRadios.quick.label, peelRadios.off.label, h('p', { class: 'wp-muted pp-help' }, t('options.peelHelp')), peelReduced),
    h('fieldset', { class: 'pp-sizes' }, h('legend', {}, t('options.size')), sizes.fit.label, sizes.large.label),
    options.wholeLanes.label,
    options.allSymbols.label,
    options.confirm.label
  );
  const savePrefs = () => context.preferences?.set(PREFS, { ...display });
  /** The Peeling mode in effect: reduced motion forces Off. */
  const peelMode = (): PeelMode => (context.reducedMotion ? 'off' : display.peeling);

  // The Display button of the action row opens the same panel directly under the row (design v3 § 3.1).
  const displayButton = actionButton('pp-display', t('action.display'), () => toggleDisplay());
  displayButton.setAttribute('aria-expanded', 'false');
  optionsBox.id = 'pp-options';
  displayButton.setAttribute('aria-controls', 'pp-options');
  optionsBox.addEventListener('toggle', () => displayButton.setAttribute('aria-expanded', String(optionsBox.open)));

  /*
   * The play unit (design v3 § 4.1): title line, picture, status, waiting places, lane fronts and the action row; on
   * a phone held upright it fits one screen. Notices (stuck, the hint's way back) are cards over the picture, so
   * nothing under the finger moves. Everything else follows below the unit.
   */
  const noticeLayer = h('div', { class: 'pp-notices' }, stuckPanel, hintRow);
  const frameEl = h('div', { class: 'pp-frame', 'data-testid': 'pp-frame' }, board, noticeLayer);
  const actions = h('div', { class: 'wp-row pp-actions', 'data-testid': 'pp-actions' }, undoButton, hintButton, displayButton, finishButton);
  const more = h('div', { class: 'pp-more' },
    lanesToggle,
    h('div', { class: 'wp-row pp-secondary' }, restartButton),
    h('p', { class: 'wp-muted pp-help pp-help-start' }, t('status.start')),
    h('p', { class: 'wp-muted pp-help' }, t('help.symbols')),
    h('p', { class: 'wp-muted pp-help' }, t('help.keys')),
    colours,
    optionsBox
  );
  const side = h('div', { class: 'pp-side' },
    status,
    h('section', { class: 'pp-section pp-slots-section' }, slotsHeading, slotsRow),
    h('section', { class: 'pp-section pp-lanes-section' }, h('h3', { class: 'pp-heading', id: 'pp-lanes-heading' }, t('lanes.heading')), lanesRow),
    actions,
    more
  );
  const headEl = h('div', { class: 'pp-head' }, titleEl, leftEl);
  const playArea = h('div', { class: 'pp-play', 'data-testid': 'pp-play' }, headEl, h('div', { class: 'pp-main' }, frameEl, side));
  /** Measures `100svh` (the viewport with the browser bars shown); falls back to innerHeight. */
  const svhProbe = h('div', { class: 'pp-svh', 'aria-hidden': 'true' });

  function toggleDisplay() {
    if (optionsBox.open) {
      optionsBox.open = false;
      more.append(optionsBox);
    } else {
      actions.after(optionsBox);
      optionsBox.open = true;
      try {
        optionsBox.scrollIntoView?.({ block: 'nearest' });
      } catch {
        // Presentation only.
      }
    }
    displayButton.setAttribute('aria-expanded', String(optionsBox.open));
  }

  const revealCanvas = h('canvas', { class: 'pp-reveal-canvas', role: 'img', 'data-testid': 'pp-reveal-canvas' });
  const revealTitle = h('h2', { class: 'pp-reveal-title', tabindex: -1, 'data-testid': 'pp-reveal-title' });
  const revealPlace = h('p', { class: 'pp-reveal-place' });
  const revealStats = h('p', { class: 'wp-muted', 'data-testid': 'pp-reveal-stats' });
  const reveal = h('section', { class: 'pp-reveal', 'data-testid': 'pp-reveal', hidden: true }, h('div', { class: 'pp-reveal-board', dir: 'ltr' }, revealCanvas), revealTitle, revealPlace, revealStats);

  const container = h('div', { class: 'wp-pixel-peel', dir: t.direction, lang: bcp47Tag(t.locale) }, playArea, reveal, live, svhProbe);
  if (context.reducedMotion) container.classList.add('is-reduced-motion');

  // --- Session: engine, cursor, exposure, cached previews (design v2 § 6.5) -----------------------------------

  const solved = () => cursor.cells.left === 0;

  /** Rebuilds the session from the state (new game, restore, undo): one replay, < 2 ms at 48. */
  const rebuild = () => {
    table = tableOfState(state);
    cursor = replayCursor(table, state.moves) ?? (replayCursor(table, []) as Cursor);
    exposure = exposureOf(table.engine, cursor.cells);
    stamp++;
    exposedStamp++;
    leftOf = new Int32Array(table.engine.keys.length + 1);
    const { colour } = table.engine;
    for (let i = 0; i < colour.length; i++) if (cursor.cells.present[i]) leftOf[colour[i] as number] = (leftOf[colour[i] as number] as number) + 1;
    previews = new Map();
    resetImages();
  };

  const previewOf = (move: Move): Preview => {
    const cached = previews.get(move);
    if (cached) return cached;
    const parsed = parseMove(move);
    const cells: Hit[] = [];
    const o: Outcome = parsed ? step(table, cursor, parsed.kind, parsed.index, false, (cell, station) => cells.push({ cell, station })) : { legal: false, reason: 'invalid', shooter: null, hits: 0, left: 0, slot: -1, parks: false };
    const p: Preview = { ...o, move, cells: o.reason === 'nothing' ? [] : cells };
    previews.set(move, p);
    return p;
  };

  const isStuckNow = () => !solved() && [...laneButtons, ...slotButtons].every((b) => !previewOf(moveOf(b) as Move).legal);

  // --- Building (once per game) --------------------------------------------------------------------------------

  const moveOf = (el: Element | null): Move | null => (el instanceof HTMLElement && el.dataset.move ? el.dataset.move : null);

  /** One symbol per colour, cloned for every swatch (a game has up to ~80 chips). */
  const symbolCache = new Map<string, SVGSVGElement>();
  const fillSwatch = (sw: HTMLElement, key: string) => {
    const { e, i } = entry(key);
    clear(sw);
    sw.style.background = e.hex;
    const cacheKey = `${i}|${e.hex}`;
    let svg = symbolCache.get(cacheKey);
    if (!svg) {
      svg = symbolSvg(i, inkFor(e.hex));
      symbolCache.set(cacheKey, svg);
    }
    sw.appendChild(svg.cloneNode(true));
  };

  const build = () => {
    clear(slotsRow);
    clear(lanesRow);
    clear(coloursList);
    slotButtons = [];
    slotFree = [];
    laneButtons = [];
    laneEmpty = [];
    laneChips = [];
    laneLists = [];
    colourRows = [];
    for (let j = 0; j < state.slots; j++) {
      const b = h('button', { type: 'button', class: 'pp-shooter pp-slot', 'data-testid': `pp-slot-${j}`, 'data-move': `S${j}` });
      const free = h('div', { class: 'pp-slot-free', 'data-testid': `pp-slot-free-${j}` }, h('span', { 'aria-hidden': 'true' }, t('slot.free')), h('span', { class: 'sr-only' }, t('slot.freeLabel', { slot: j + 1 })));
      slotButtons.push(b);
      slotFree.push(free);
      slotsRow.append(h('div', { class: 'pp-slot-cell' }, b, free));
    }
    state.lanes.forEach((_, i) => {
      const b = h('button', { type: 'button', class: 'pp-shooter pp-front', 'data-testid': `pp-lane-${i}`, 'data-move': `L${i}` });
      const empty = h('div', { class: 'pp-lane-empty' }, t('lane.empty'));
      laneButtons.push(b);
      laneEmpty.push(empty);
      laneChips.push([]);
      const list = h('ol', { class: 'pp-chips', 'aria-label': t('lane.queue', { lane: i + 1 }) });
      laneLists.push(list);
      lanesRow.append(
        h('div', { class: 'pp-lane', 'data-testid': `pp-lane-box-${i}` },
          h('span', { class: 'pp-lane-name', 'aria-hidden': 'true' }, t('lane.name', { lane: i + 1 })),
          h('div', { class: 'pp-front-cell' }, b, empty, h('span', { class: 'pp-lane-number', 'aria-hidden': 'true', dir: 'ltr' }, String(i + 1))),
          list
        )
      );
    });
    for (const b of [...slotButtons, ...laneButtons]) {
      b.addEventListener('click', () => activate(b));
      b.addEventListener('focus', () => {
        if (quiet !== b) showPreview(moveOf(b));
      });
      b.addEventListener('blur', () => {
        if (quiet === b) quiet = null;
        if (previewMove === moveOf(b) && selected === null) showPreview(null);
      });
      b.addEventListener('pointerenter', (e) => {
        if ((e as PointerEvent).pointerType === 'mouse' && quiet !== b) showPreview(moveOf(b));
      });
      b.addEventListener('pointerleave', (e) => {
        if ((e as PointerEvent).pointerType !== 'mouse' || selected !== null) return;
        if (quiet === b) quiet = null;
        // Only the button being previewed hands the preview back (to a keyboard-focused shooter, if any).
        if (previewMove !== moveOf(b)) return;
        const focused = [...slotButtons, ...laneButtons].find((x) => keyboardFocused(x));
        showPreview(focused ? moveOf(focused) : null);
      });
    }
    state.picture.palette.forEach((p) => {
      const sw = h('span', { class: 'pp-chip-swatch' });
      fillSwatch(sw, p.key);
      const count = h('span', { class: 'pp-colour-count' });
      const toggle = h('button', { type: 'button', class: 'pp-show', 'aria-pressed': 'false', 'aria-label': t('colours.showLabel', { colour: t(`colour.${p.name}`) }), 'data-testid': `pp-show-${p.key}` }, t('colours.show'));
      toggle.addEventListener('click', () => {
        shownColour = shownColour === p.key ? null : p.key;
        update();
      });
      const li = h('li', { class: 'pp-colour', 'data-testid': `pp-colour-${p.key}` }, sw, h('span', { class: 'pp-colour-name' }, sentence(t(`colour.${p.name}`))), count, toggle);
      coloursList.appendChild(li);
      colourRows.push({ li, count, toggle, key: p.key });
    });
  };

  /** Creates the chip of shooter `index` in lane `i`, in its place in the lane's list. */
  const chipOf = (i: number, index: number): HTMLElement => {
    const s = (state.lanes[i] as Shooter[])[index] as Shooter;
    const sw = h('span', { class: 'pp-chip-swatch' });
    fillSwatch(sw, s.c);
    const chip = h('li', { class: 'pp-chip', 'data-index': index }, sw, h('span', { 'aria-hidden': 'true', dir: 'ltr' }, s.n), h('span', { class: 'sr-only' }, t('chip.label', { colour: colourName(s.c), symbol: symbolName(s.c), shots: s.n })));
    const chips = laneChips[i] as (HTMLElement | undefined)[];
    const next = chips.find((c, j) => c !== undefined && j > index) ?? null;
    (laneLists[i] as HTMLElement).insertBefore(chip, next);
    chips[index] = chip;
    return chip;
  };

  const fillShooter = (b: HTMLElement, s: Shooter, label: string) => {
    if (b.dataset.colour !== s.c || b.dataset.shots !== String(s.n)) {
      clear(b);
      const swatch = h('span', { class: 'pp-swatch' });
      fillSwatch(swatch, s.c);
      b.append(swatch, h('span', { class: 'pp-shots', dir: 'ltr' }, s.n));
      b.dataset.colour = s.c;
      b.dataset.shots = String(s.n);
    }
    b.setAttribute('aria-label', label);
  };

  // --- Rendering -----------------------------------------------------------------------------------------------

  const setText = (el: HTMLElement, text: string) => {
    if (el.textContent !== text) el.textContent = text;
  };
  const setAttr = (el: Element, name: string, value: string) => {
    if (el.getAttribute(name) !== value) el.setAttribute(name, value);
  };

  const update = () => {
    const isSolved = solved();
    const total = table.engine.filled;
    const left = cursor.cells.left;
    setText(titleEl, t('title.colours', { title: motifTitle(), n: state.picture.palette.length }));
    setText(leftEl, t('picture.left', { left, total }));
    leftEl.dataset.left = String(left);

    // Slots
    const free = cursor.slots.filter((s) => s === null).length;
    setText(slotsHeading, t('slots.heading', { free, total: cursor.slots.length }));
    cursor.slots.forEach((s, j) => {
      const b = slotButtons[j] as HTMLButtonElement;
      (slotFree[j] as HTMLElement).hidden = s !== null;
      b.hidden = s === null;
      if (s) {
        const key = keyOfCode(s.c);
        fillShooter(b, { c: key, n: s.n }, t('slot.label', { slot: j + 1, colour: colourName(key), symbol: symbolName(key), shots: s.n }));
      }
    });

    // Lanes: the front is a button; behind it the chips (the first 7 unless "Show whole lanes").
    const whole = wholeLanes();
    let hiddenChips = 0;
    state.lanes.forEach((lane, i) => {
      const k = cursor.laneFront[i] as number;
      const front = lane[k];
      const b = laneButtons[i] as HTMLButtonElement;
      b.hidden = !front;
      (laneEmpty[i] as HTMLElement).hidden = Boolean(front);
      if (front) fillShooter(b, front, t('lane.label', { lane: i + 1, colour: colourName(front.c), symbol: symbolName(front.c), shots: front.n }));
      const end = whole ? lane.length : Math.min(lane.length, k + 1 + chipsShown());
      hiddenChips += lane.length - end;
      const chips = laneChips[i] as (HTMLElement | undefined)[];
      chips.forEach((chip, index) => {
        const hide = index <= k || index >= end;
        if (chip && chip.hidden !== hide) chip.hidden = hide;
      });
      for (let index = k + 1; index < end; index++) if (!chips[index]) chipOf(i, index);
    });
    const longest = Math.max(0, ...state.lanes.map((lane, i) => lane.length - (cursor.laneFront[i] as number) - 1 - chipsShown()));
    lanesToggle.hidden = longest <= 0;
    lanesToggle.setAttribute('aria-expanded', String(whole));
    setText(lanesToggle, whole ? t('lanes.collapse') : t('lanes.expand', { n: hiddenChips }));

    // Legality, hint marks, roving tab stops
    for (const b of [...slotButtons, ...laneButtons]) {
      const move = moveOf(b) as Move;
      const p = previewOf(move);
      b.setAttribute('aria-disabled', String(!p.legal));
      const hinted = hintResult?.kind === 'move' && hintResult.move === move;
      b.dataset.hint = String(hinted);
      b.classList.toggle('is-selected', selected === move);
      b.querySelector('.pp-hint-badge')?.remove();
      if (hinted) b.appendChild(h('span', { class: 'pp-hint-badge' }, t('hint.badge')));
    }
    syncTabStops();

    // Actions, stuck, hint undo target
    const stuck = !isSolved && isStuckNow();
    stuckPanel.hidden = !stuck || noticesDismissed;
    if (stuck) scheduleStuckSafe();
    const safe = stuck && stuckSafe?.key === state.moves.join(' ') && stuckSafe.k > 0 ? stuckSafe.k : -1;
    stuckBack.hidden = safe < 0;
    setText(stuckBack, safe > 0 ? t('stuck.backButton', { k: safe }) : '');
    setText(stuckText, safe > 0 ? t('stuck.back', { k: safe }) : t('stuck.text'));
    // As rules.canUndo, from the cached cursor (canUndo replays every move).
    const undoable = !isSolved && (state.moves.length > 0 || (state.restartUndo?.length ?? 0) > 0);
    undoButton.disabled = !undoable;
    restartButton.disabled = state.moves.length === 0 || isSolved;
    hintButton.disabled = isSolved;
    for (const b of stuckPanel.querySelectorAll('button')) {
      if (b.dataset.testid === 'pp-stuck-undo') b.disabled = !undoable;
      if (b.dataset.testid === 'pp-stuck-restart') b.disabled = state.moves.length === 0;
    }
    const undoTarget = hintResult?.kind === 'undo' && hintResult.k < state.moves.length ? hintResult.k : -1;
    // The stuck card already offers the same way back first: no second card with the same button.
    hintRow.hidden = undoTarget < 0 || noticesDismissed || (!stuckPanel.hidden && safe === undoTarget);
    setText(undoToButton, undoTarget === 0 ? t('hint.undoToStart') : t('hint.undoTo', { k: undoTarget }));

    // Colours overview
    const edge = new Int32Array(table.engine.keys.length + 1);
    for (let c = 0; c < exposure.seenBy.length; c++) if (exposure.seenBy[c]) edge[table.engine.colour[c] as number] = (edge[table.engine.colour[c] as number] as number) + 1;
    const shots = shotsLeft(table, cursor);
    for (const row of colourRows) {
      const code = table.engine.codes.get(row.key) ?? 0;
      setText(row.count, t('colours.row', { left: leftOf[code] ?? 0, edge: edge[code] ?? 0, shots: shots[code] ?? 0 }));
      row.toggle.setAttribute('aria-pressed', String(shownColour === row.key));
      row.li.classList.toggle('is-done', (leftOf[code] ?? 0) === 0);
    }
    const reachable = state.picture.palette.filter((p) => (edge[table.engine.codes.get(p.key) ?? 0] ?? 0) > 0).map((p) => t('picture.reachItem', { colour: t(`colour.${p.name}`), n: edge[table.engine.codes.get(p.key) ?? 0] ?? 0 }));
    setAttr(canvas, 'aria-label', t('picture.label', { title: motifTitle(), w: table.engine.w, h: table.engine.h, left, total, reachable: reachable.length ? reachable.join(t('list.separator')) : t('picture.reachNone') }));

    for (const key of ['allSymbols', 'confirm'] as const) options[key].input.checked = display[key];
    options.wholeLanes.input.checked = whole;
    sizes.fit.input.checked = !display.large;
    sizes.large.input.checked = display.large;
    for (const mode of PEEL_MODES) {
      peelRadios[mode].input.checked = peelMode() === mode;
      peelRadios[mode].input.disabled = context.reducedMotion;
    }

    // Reveal: once the picture is solved and nothing is still peeling.
    const showReveal = isSolved && !peeling();
    playArea.hidden = showReveal;
    reveal.hidden = !showReveal;
    if (showReveal) {
      revealTitle.textContent = motifTitle();
      revealPlace.textContent = motifPlace();
      revealPlace.hidden = motifPlace() === '';
      revealStats.textContent = t('reveal.stats', { launches: cursor.launches, parks: cursor.parks });
    }
    if (stuck && !wasStuck) becameStuck = true;
    wasStuck = stuck;
    renderStatus();
    syncPeel();
    draw();
    if (showReveal && focusReveal) {
      focusReveal = false;
      revealTitle.focus();
    }
  };

  /** Test hooks and the Finish peeling button (design v3 § 3.4). */
  const syncPeel = () => {
    const launches = slow?.launches ?? 0;
    setAttr(board, 'data-peeling', String(launches));
    setAttr(board, 'data-pending', String(slow?.pending ?? 0));
    finishButton.hidden = !peeling();
    // The accessible name says how many launches are still peeling; the count shows as a badge.
    setAttr(finishButton, 'aria-label', t('action.finishPeelingCount', { n: Math.max(1, launches) }));
    setText(finishCount, String(Math.max(1, launches)));
  };

  const visible = (list: HTMLButtonElement[]) => list.filter((b) => !b.hidden);

  const syncTabStops = () => {
    for (const [list, idx] of [[slotButtons, slotFocus], [laneButtons, laneFocus]] as const) {
      const shown = visible(list);
      const target = list[idx] && !list[idx]!.hidden ? list[idx] : shown[0];
      for (const b of list) b.tabIndex = b === target ? 0 : -1;
    }
  };

  const previewText = (p: Preview): string => {
    const s = shooterOf(p);
    if (!s) return t('reason.empty');
    const shooter = shooterText(s);
    if (!p.legal) return sentence(t('preview.blocked', { shooter, reason: t(p.reason === 'noSlot' ? 'reason.noSlot' : 'reason.nothing', { left: p.left }) }));
    if (p.parks) return sentence(t('preview.parks', { shooter }));
    if (p.left === 0) return sentence(t('preview.usedUp', { shooter, n: p.hits }));
    return sentence(t(p.move.startsWith('S') ? 'preview.backToSlot' : 'preview.removes', { shooter, n: p.hits, left: p.left }));
  };

  const renderStatus = () => {
    status.removeAttribute('aria-busy');
    if (hintTimer !== null) {
      status.textContent = t('hint.checking');
      status.dataset.kind = 'busy';
      status.setAttribute('aria-busy', 'true');
    } else if (previewMove && !solved()) {
      status.textContent = previewText(previewOf(previewMove)) + (selected === previewMove ? ` ${t('confirm.again')}` : '');
      status.dataset.kind = 'preview';
    } else {
      status.textContent = statusText || t(compact ? 'status.startShort' : 'status.start');
      status.dataset.kind = statusText ? 'message' : 'start';
    }
  };

  /**
   * Fonts differ between devices: on a phone a text that does not fit its fixed box steps its font down, 0.875 →
   * 0.8 → 0.75 rem (`data-fit` 0–2, styles.css), and only then scrolls inside. Measured after each text change (a
   * mutation observer, so every way the text changes is covered) and on mount and resize: one layout read each.
   */
  const fitSteps = (el: HTMLElement, overflows: () => boolean) => {
    if (!compact || !el.isConnected) {
      if (el.hasAttribute('data-fit')) el.removeAttribute('data-fit');
      return;
    }
    el.dataset.fit = '0';
    for (let k = 1; k <= 2 && overflows(); k++) el.dataset.fit = String(k);
  };
  const fitStatus = () => fitSteps(status, () => status.scrollHeight > status.clientHeight + 1);
  const fitActions = () =>
    fitSteps(actions, () =>
      [...actions.querySelectorAll<HTMLButtonElement>('button')].some((b) => {
        if (b.hidden) return false;
        const label = b.querySelector<HTMLElement>('.pp-label');
        if (!label) return false;
        const cs = getComputedStyle(b);
        const room = b.clientHeight - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0);
        return label.offsetHeight > room + 1 || label.scrollWidth > label.clientWidth + 1;
      })
    );
  const fitObservers: MutationObserver[] = [];
  if (typeof MutationObserver === 'function') {
    const onStatus = new MutationObserver(() => fitStatus());
    onStatus.observe(status, { childList: true, characterData: true, subtree: true });
    const onActions = new MutationObserver(() => fitActions());
    onActions.observe(actions, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    fitObservers.push(onStatus, onActions);
  }

  const showPreview = (move: Move | null) => {
    if (previewMove === move) return;
    // Any input jumps an animation to its end (design § 7.5), so the preview shows the real position.
    previewMove = move;
    if (move === null) selected = null;
    renderStatus();
    draw();
    if (move) revealPreviewInLarge();
  };

  // --- Canvas: 1-pixel-per-cell images, scaled (design v2 § 6.1) -------------------------------------------------

  /** Picture as RGBA, one pixel per cell: `base` (removed cells show the backdrop), `dim` (every cell washed out). */
  let base: Uint8ClampedArray = new Uint8ClampedArray(0);
  let dim: Uint8ClampedArray = new Uint8ClampedArray(0);
  /** Cells drawn as still present (pending animation pops are drawn until popped). */
  let shown: Uint8Array = new Uint8Array(0);

  const resetImages = () => {
    const { w, h, colour } = table.engine;
    base = new Uint8ClampedArray(w * h * 4);
    dim = new Uint8ClampedArray(w * h * 4);
    shown = cursor.cells.present.slice();
    stamp++;
    const back = rgbOf(state.picture.backdrop);
    const rgb = state.picture.palette.map((p) => rgbOf(p.hex));
    for (let c = 0; c < w * h; c++) {
      const code = colour[c] as number;
      const col = shown[c] && code ? (rgb[code - 1] as [number, number, number]) : back;
      base.set([col[0], col[1], col[2], 255], c * 4);
      // Dimmed: 70 % towards the backdrop, so shape and brightness, not hue, carry the spotlight.
      const d = code ? (rgb[code - 1] as [number, number, number]) : back;
      const mix = (k: number) => Math.round((d[k] as number) * 0.3 + (back[k] as number) * 0.7);
      dim.set(shown[c] ? [mix(0), mix(1), mix(2), 255] : [back[0], back[1], back[2], 255], c * 4);
    }
  };

  /** Pops cells from the drawn picture (they show the backdrop from now on). */
  const popCells = (cells: readonly number[]) => {
    const back = rgbOf(state.picture.backdrop);
    for (const c of cells) {
      shown[c] = 0;
      stamp++;
      base.set([back[0], back[1], back[2], 255], c * 4);
      dim.set([back[0], back[1], back[2], 255], c * 4);
    }
  };

  /** Theme colours for the canvas, read once (getComputedStyle per frame is slow on phones); reset on resize. */
  let cssCache = new Map<string, string>();
  const cssVar = (name: string, fallback: string) => {
    let v = cssCache.get(name);
    if (v === undefined) {
      v = (typeof getComputedStyle === 'function' ? getComputedStyle(container).getPropertyValue(name).trim() : '') || fallback;
      cssCache.set(name, v);
    }
    return v;
  };

  const dpr = () => (typeof window !== 'undefined' && window.devicePixelRatio > 0 ? Math.min(3, window.devicePixelRatio) : 1);

  const context2d = (el: HTMLCanvasElement, cssW: number, cssH: number): CanvasRenderingContext2D | null => {
    const ratio = dpr();
    el.style.width = `${cssW}px`;
    el.style.height = `${cssH}px`;
    const bw = Math.round(cssW * ratio);
    const bh = Math.round(cssH * ratio);
    if (el.width !== bw) el.width = bw;
    if (el.height !== bh) el.height = bh;
    let g: CanvasRenderingContext2D | null = null;
    try {
      g = el.getContext('2d');
    } catch {
      g = null;
    }
    if (g) {
      g.setTransform(ratio, 0, 0, ratio, 0, 0);
      g.imageSmoothingEnabled = false;
    }
    return g;
  };

  const symbolPaths: (Path2D | null)[] = SYMBOLS.map((_, i) => (typeof Path2D === 'function' ? new Path2D(symbolPath(i)) : null));
  const drawSymbol = (g: CanvasRenderingContext2D, index: number, x: number, y: number, size: number, ink: string) => {
    const path = symbolPaths[index % symbolPaths.length];
    if (!path) return;
    g.save();
    g.translate(x, y);
    g.scale(size / 24, size / 24);
    g.fillStyle = ink;
    g.fill(path, 'evenodd');
    g.restore();
  };

  const available = () => {
    const w = board.clientWidth || container.clientWidth || 0;
    return w > 0 ? w : 0;
  };

  /** The viewport height with the browser bars shown (`100svh`), else innerHeight. */
  const viewportHeight = () => {
    const probe = svhProbe.offsetHeight;
    if (probe > 0) return probe;
    return typeof window !== 'undefined' && window.innerHeight > 0 ? window.innerHeight : 0;
  };

  /**
   * Height of the play unit without the picture (design v3 § 4.2). Stacked: from the title line to the end of the
   * action row, so picture, status, waiting places, lane fronts and actions fit one screen. Side by side: the title
   * line above the picture, so the whole picture fits the screen beside the lanes.
   */
  const chromeHeight = () => {
    const top = headEl.getBoundingClientRect().top;
    const pic = canvas.getBoundingClientRect();
    if (compact) return Math.max(0, actions.getBoundingClientRect().bottom - top - pic.height);
    return Math.max(0, pic.top - top) + 8;
  };

  /**
   * Cell size in CSS px: Fit is the largest size (5–24 px) that fits the width and keeps the play unit within the
   * screen height (`fitCell`); Large is 14 px. Measured once per mount and resize: reading layout on every launch
   * would force a layout each time.
   */
  let fitSize = 0;
  let lastPictureH = '';
  const cellSize = () => {
    const { w, h } = table.engine;
    if (display.large) return LARGE_CELL;
    if (!fitSize) {
      const availW = available();
      fitSize = availW > 0 && !playArea.hidden ? fitCell({ availW, availH: viewportHeight(), w, h, track: TRACK, chrome: chromeHeight() }) : 0;
      if (!fitSize) return 8;
    }
    return fitSize;
  };
  /** Bumped whenever the drawn cells or the exposed set change (keys the cached spotlight image). */
  let stamp = 0;
  /** Bumped whenever the committed exposed set changes (keys the exposed-cell test hook). */
  let exposedStamp = 0;

  /** Station centre on the track (for the moving token). */
  const stationPoint = (i: number, cell: number, w: number, h: number): [number, number] => {
    const half = TRACK / 2;
    if (i < w) return [TRACK + (i + 0.5) * cell, TRACK + h * cell + half];
    if (i < w + h) return [TRACK + w * cell + half, TRACK + (h - 1 - (i - w) + 0.5) * cell];
    if (i < 2 * w + h) return [TRACK + (w - 1 - (i - w - h) + 0.5) * cell, half];
    return [half, TRACK + (i - 2 * w - h + 0.5) * cell];
  };

  /** A point on the track at track distance `d` (stations; −0.5 is the start corner), between two stations. */
  const trackPoint = (d: number, cell: number, w: number, h: number): [number, number] => {
    const n = 2 * w + 2 * h;
    const i0 = Math.floor(d);
    const f = d - i0;
    const a = stationPoint((((i0 % n) + n) % n), cell, w, h);
    const b = stationPoint(((((i0 + 1) % n) + n) % n), cell, w, h);
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  };

  const roundRect = (g: CanvasRenderingContext2D, x: number, y: number, size: number, r: number) => {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + size, y, x + size, y + size, r);
    g.arcTo(x + size, y + size, x, y + size, r);
    g.arcTo(x, y + size, x, y, r);
    g.arcTo(x, y, x + size, y, r);
    g.closePath();
  };

  /** Slow peeling: cells in their peel effect, the line to the cell being peeled, the token and the queue. */
  const drawSlow = (g: CanvasRenderingContext2D, cell: number) => {
    if (!slow) return;
    const { w, h, colour } = table.engine;
    const ink = cssVar('--wp-text', '#1d1d1b');
    // Peeling cells shrink to the backdrop.
    for (const e of slow.effects()) {
      const size = cell * (1 - e.progress);
      if (size <= 0.5) continue;
      g.fillStyle = entry(keyOfCode(colour[e.cell] as number)).e.hex;
      g.fillRect(TRACK + (e.cell % w) * cell + (cell - size) / 2, TRACK + Math.floor(e.cell / w) * cell + (cell - size) / 2, size, size);
    }
    const token = slow.token();
    const size = Math.max(16, Math.min(26, Math.round(cell * 2.4)));
    // Waiting launches: small tokens stacked at the start corner, in launch order.
    const queued = slow.queued();
    const small = Math.max(8, Math.round(size * 0.55));
    queued.slice(0, 6).forEach((key, k) => {
      const x = 1 + k * (small * 0.45);
      const y = h * cell + 2 * TRACK - small - 1 - k * (small * 0.45);
      roundRect(g, x, y, small, 2);
      g.fillStyle = entry(key).e.hex;
      g.fill();
      g.lineWidth = 1;
      g.strokeStyle = ink;
      g.stroke();
    });
    if (!token) return;
    const [tx, ty] = trackPoint(token.distance, cell, w, h);
    const { e, i } = entry(token.colour);
    const tokenInk = inkFor(e.hex);
    if (slowMode !== 'slow' && token.target !== null) {
      g.beginPath();
      g.moveTo(tx, ty);
      g.lineTo(TRACK + (token.target % w + 0.5) * cell, TRACK + (Math.floor(token.target / w) + 0.5) * cell);
      g.lineWidth = 1.5;
      g.strokeStyle = ink;
      g.stroke();
    }
    g.save();
    g.globalAlpha = 1 - token.fade;
    const x = Math.max(0, Math.min(w * cell + 2 * TRACK - size, tx - size / 2));
    const y = Math.max(0, Math.min(h * cell + 2 * TRACK - size, ty - size / 2));
    roundRect(g, x, y, size, 4);
    g.fillStyle = e.hex;
    g.fill();
    g.lineWidth = 1.5;
    g.strokeStyle = ink;
    g.stroke();
    drawSymbol(g, i, x + size * 0.18, y + size * 0.18, size * 0.64, tokenInk);
    // Remaining shots: a small number on a pill at the token's corner.
    const label = String(token.shots);
    g.font = `700 ${Math.max(9, Math.round(size * 0.5))}px system-ui, sans-serif`;
    const tw = (typeof g.measureText === 'function' ? g.measureText(label).width : 6) + 4;
    const lx = Math.min(w * cell + 2 * TRACK - tw, x + size - 3);
    const ly = Math.max(0, y - 6);
    g.fillStyle = ink;
    g.fillRect(lx, ly, tw, Math.max(10, Math.round(size * 0.55)));
    g.fillStyle = cssVar('--wp-bg', '#ffffff');
    g.textBaseline = 'top';
    g.fillText(label, lx + 2, ly + 1);
    g.restore();
    // Slow: the shot, over the token: a straight beam along the station's row or column, from the edge to the farthest
    // pixel it removes, and an outline around each of them.
    if (slowMode === 'slow' && token.station !== null && token.beam >= 0 && token.targets.length > 0) {
      const st = token.station;
      const far = token.targets.reduce((a, c) => {
        // Distance from the far side: the bottom shoots up, the right side left, the top down, the left side right.
        const d = (x: number) => (st < w ? Math.floor(x / w) : st < w + h ? x % w : st < 2 * w + h ? -Math.floor(x / w) : -(x % w));
        return d(c) < d(a) ? c : a;
      });
      const cx = far % w;
      const cy = Math.floor(far / w);
      const thick = Math.max(4, cell * 0.7);
      let rx: number, ry: number, rw: number, rh: number;
      if (st < w) [rx, ry, rw, rh] = [TRACK + (st + 0.5) * cell - thick / 2, TRACK + cy * cell, thick, (h - cy) * cell + TRACK];
      else if (st < w + h) [rx, ry, rw, rh] = [TRACK + cx * cell, TRACK + (cy + 0.5) * cell - thick / 2, (w - cx) * cell + TRACK, thick];
      else if (st < 2 * w + h) [rx, ry, rw, rh] = [TRACK + (cx + 0.5) * cell - thick / 2, 0, thick, TRACK + (cy + 1) * cell];
      else [rx, ry, rw, rh] = [0, TRACK + (cy + 0.5) * cell - thick / 2, TRACK + (cx + 1) * cell, thick];
      g.save();
      // In for the first third of the shot, then fading out.
      g.globalAlpha = token.beam < 0.33 ? 0.9 : Math.max(0, 0.9 * (1 - (token.beam - 0.33) / 0.67));
      g.fillStyle = entry(token.colour).e.hex;
      g.fillRect(rx, ry, rw, rh);
      g.lineWidth = 1;
      g.strokeStyle = ink;
      g.strokeRect(rx + 0.5, ry + 0.5, Math.max(0, rw - 1), Math.max(0, rh - 1));
      g.globalAlpha = Math.max(0, 1 - token.beam);
      for (const c of token.targets) {
        const x0 = TRACK + (c % w) * cell;
        const y0 = TRACK + Math.floor(c / w) * cell;
        g.lineWidth = 2;
        g.strokeStyle = '#000000';
        g.strokeRect(x0 - 1, y0 - 1, cell + 2, cell + 2);
        g.lineWidth = 1;
        g.strokeStyle = '#ffffff';
        g.strokeRect(x0 + 0.5, y0 + 0.5, cell - 1, cell - 1);
      }
      g.restore();
    }
  };

  let scratch: HTMLCanvasElement | null = null;
  const blit = (g: CanvasRenderingContext2D, pixels: Uint8ClampedArray, x: number, y: number, cell: number) => {
    const { w, h } = table.engine;
    if (typeof ImageData !== 'function' || typeof document === 'undefined') return;
    if (!scratch) scratch = document.createElement('canvas');
    if (scratch.width !== w) scratch.width = w;
    if (scratch.height !== h) scratch.height = h;
    const sg = scratch.getContext('2d');
    if (!sg) return;
    sg.putImageData(new ImageData(pixels as Uint8ClampedArray<ArrayBuffer>, w, h), 0, 0);
    g.drawImage(scratch, x, y, w * cell, h * cell);
  };
  /** The spotlight colour's cells at full strength, the rest transparent; rebuilt only when they change. */
  let spotBuffer: Uint8ClampedArray = new Uint8ClampedArray(0);
  let spotFor = '';
  const spotPixels = (code: number): Uint8ClampedArray => {
    const key = `${code}|${stamp}`;
    if (key === spotFor && spotBuffer.length === base.length) return spotBuffer;
    const { colour } = table.engine;
    if (spotBuffer.length !== base.length) spotBuffer = new Uint8ClampedArray(base.length);
    spotBuffer.set(base);
    // Cells still to peel are going: dimmed like the other colours (design v3 § 3.2).
    const present = cursor.cells.present;
    for (let c = 0; c < colour.length; c++) if (!(shown[c] === 1 && present[c] === 1 && colour[c] === code)) spotBuffer[c * 4 + 3] = 0;
    spotFor = key;
    return spotBuffer;
  };
  let exposedFor = -1;
  let exposedCells: number[] = [];

  /** The colour key in the spotlight: the previewed shooter's, else the one shown from the colours list. */
  const spotlightKey = (): string | null => {
    if (previewMove) {
      const s = shooterOf(previewOf(previewMove));
      if (s) return s.c;
    }
    return shownColour;
  };

  const draw = () => {
    const { w, h, colour } = table.engine;
    const cell = cellSize();
    const cssW = w * cell + 2 * TRACK;
    const cssH = h * cell + 2 * TRACK;
    const pictureH = `${display.large ? 0 : cssH + 8}px`;
    if (pictureH !== lastPictureH) container.style.setProperty('--pp-picture-h', (lastPictureH = pictureH));
    board.classList.toggle('is-large', display.large);
    frameEl.classList.toggle('is-large', display.large);
    if (display.large) {
      board.setAttribute('role', 'region');
      board.setAttribute('tabindex', '0');
      board.setAttribute('aria-label', t('picture.region'));
    } else {
      board.removeAttribute('role');
      board.removeAttribute('tabindex');
      board.removeAttribute('aria-label');
    }
    if (exposedFor !== exposedStamp) {
      exposedCells = [];
      for (let c = 0; c < exposure.seenBy.length; c++) if (exposure.seenBy[c]) exposedCells.push(c);
      canvas.dataset.exposed = exposedCells.map((c) => `${c % w},${Math.floor(c / w)}`).join(' ');
      exposedFor = exposedStamp;
    }
    const ex = exposedCells;
    canvas.dataset.cell = String(cell);
    const symbols = cell >= SYMBOL_MIN ? (display.allSymbols ? 'all' : 'edge') : 'none';
    canvas.dataset.symbols = symbols;
    const p = previewMove ? previewOf(previewMove) : null;
    canvas.dataset.preview = p ? p.cells.map((x) => `${x.cell % w},${Math.floor(x.cell / w)}`).join(' ') : '';
    const spot = spotlightKey();
    canvas.dataset.spotlight = spot ?? '';
    if (solved() && !peeling()) drawReveal();
    const g = context2d(canvas, cssW, cssH);
    if (!g) return;
    // Track: a plain frame, with one tick per station when the cells are large enough.
    g.fillStyle = cssVar('--wp-surface-2', '#ecebe5');
    g.fillRect(0, 0, cssW, cssH);
    if (cell >= 8) {
      g.strokeStyle = cssVar('--wp-muted', '#5c5b55');
      g.lineWidth = 1;
      g.beginPath();
      for (let i = 0; i < 2 * w + 2 * h; i++) {
        const [x, y] = stationPoint(i, cell, w, h);
        if (i < w || (i >= w + h && i < 2 * w + h)) {
          g.moveTo(x + 0.5, y - 1.5);
          g.lineTo(x + 0.5, y + 1.5);
        } else {
          g.moveTo(x - 1.5, y + 0.5);
          g.lineTo(x + 1.5, y + 0.5);
        }
      }
      g.stroke();
    }
    // Cells: one blit; with a spotlight, the dimmed picture plus the spotlight colour at full strength.
    const code = spot ? (table.engine.codes.get(spot) ?? 0) : 0;
    if (code) {
      blit(g, dim, TRACK, TRACK, cell);
      blit(g, spotPixels(code), TRACK, TRACK, cell);
    } else blit(g, base, TRACK, TRACK, cell);
    // Symbols from 10 px: on exposed cells, or on all with the option.
    if (symbols !== 'none') {
      const size = Math.max(6, Math.round(cell * 0.62));
      const present = cursor.cells.present;
      const list = symbols === 'all' ? [...shown.keys()].filter((c) => shown[c] && present[c]) : ex;
      for (const c of list) {
        if (!shown[c] || (code && colour[c] !== code)) continue;
        const { e, i } = entry(keyOfCode(colour[c] as number));
        drawSymbol(g, i, TRACK + (c % w) * cell + (cell - size) / 2, TRACK + Math.floor(c / w) * cell + (cell - size) / 2, size, inkFor(e.hex));
      }
    }
    // Preview marks: a contrasting square below 10 px; hatching plus a double outline from 10 px (never hue alone).
    if (p) {
      for (const hit of p.cells) {
        const x = TRACK + (hit.cell % w) * cell;
        const y = TRACK + Math.floor(hit.cell / w) * cell;
        const ink = inkFor(entry(keyOfCode(colour[hit.cell] as number)).e.hex);
        if (cell < SYMBOL_MIN) {
          const s = Math.max(2, Math.floor(cell / 2));
          g.fillStyle = ink;
          g.fillRect(x + Math.floor((cell - s) / 2), y + Math.floor((cell - s) / 2), s, s);
          continue;
        }
        g.save();
        g.beginPath();
        g.rect(x, y, cell, cell);
        g.clip();
        g.strokeStyle = ink;
        g.globalAlpha = 0.75;
        g.lineWidth = Math.max(1, cell / 10);
        g.beginPath();
        for (let k = -cell; k < cell; k += Math.max(4, cell / 3)) {
          g.moveTo(x + k, y + cell);
          g.lineTo(x + k + cell, y);
        }
        g.stroke();
        g.restore();
        g.lineWidth = 2;
        g.strokeStyle = '#000000';
        g.strokeRect(x + 1, y + 1, cell - 2, cell - 2);
        g.lineWidth = 1;
        g.strokeStyle = '#ffffff';
        g.strokeRect(x + 2.5, y + 2.5, cell - 5, cell - 5);
      }
    }
    if (slow?.busy) drawSlow(g, cell);
  };

  /** In Large view, scrolls the picture so that the first previewed cell is visible (if none is). */
  const revealPreviewInLarge = () => {
    if (!display.large || !previewMove) return;
    const p = previewOf(previewMove);
    if (p.cells.length === 0) return;
    const cell = LARGE_CELL;
    const { w } = table.engine;
    const inView = (c: number) => {
      const x = TRACK + (c % w) * cell;
      const y = TRACK + Math.floor(c / w) * cell;
      return x >= board.scrollLeft && x + cell <= board.scrollLeft + board.clientWidth && y >= board.scrollTop && y + cell <= board.scrollTop + board.clientHeight;
    };
    if (p.cells.some((hit) => inView(hit.cell))) return;
    const first = (p.cells[0] as Hit).cell;
    board.scrollLeft = Math.max(0, TRACK + (first % w) * cell - board.clientWidth / 2);
    board.scrollTop = Math.max(0, TRACK + Math.floor(first / w) * cell - board.clientHeight / 2);
  };

  const drawReveal = () => {
    const { w, h } = state.picture;
    const avail = reveal.clientWidth || container.clientWidth || 0;
    const cell = avail > 0 ? Math.max(4, Math.min(16, Math.floor(avail / w))) : 8;
    revealCanvas.setAttribute('aria-label', motifTitle());
    const g = context2d(revealCanvas, w * cell, h * cell);
    if (!g || typeof ImageData !== 'function') return;
    // The played grid, as it was before the first move.
    const back = rgbOf(state.picture.backdrop);
    const rgb = new Map(state.picture.palette.map((p) => [p.key, rgbOf(p.hex)] as const));
    const data = new Uint8ClampedArray(w * h * 4);
    state.picture.rows.forEach((row, y) => {
      for (let x = 0; x < w; x++) {
        const col = rgb.get(row[x] as string) ?? back;
        data.set([col[0], col[1], col[2], 255], (y * w + x) * 4);
      }
    });
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    off.getContext('2d')?.putImageData(new ImageData(data, w, h), 0, 0);
    g.drawImage(off, 0, 0, w * cell, h * cell);
  };

  // --- Animation (cosmetic only: the state has already changed) ------------------------------------------------

  /** One frame of the peel queue (Slow or Quick, design v3 § 3.2); the loop stops when the queue is empty. */
  const slowTick = () => {
    slowFrame = null;
    if (!slow) return;
    const t1 = now();
    // A long gap (a hidden page, a stalled frame) moves on at most one second.
    const dt = Math.min(1000, Math.max(0, t1 - slowLast));
    slowLast = t1;
    popCells(slow.advance(dt));
    if (slow.busy) {
      syncPeel();
      draw();
      if (frame) slowFrame = frame(slowTick);
    } else update();
  };

  const startAnimation = (hits: Hit[], c: string, shots: number, usedUp: boolean) => {
    const mode = peelMode();
    if (mode === 'off' || !frame) {
      popCells(hits.map((x) => x.cell));
      return;
    }
    // A queue draws one way; a change of the preference has finished the old one (peelRadio).
    if (!slow || slowMode !== mode) {
      slow = new PeelQueue(2 * table.engine.w + 2 * table.engine.h, mode === 'slow' ? SLOW_TIMING : TIMING);
      slowMode = mode;
    }
    if (!slow.busy) slowLast = now();
    slow.enqueue({ hits, colour: c, shots, usedUp });
    if (slowFrame === null) slowFrame = frame(slowTick);
  };

  /**
   * Ends every animation at once (Finish peeling, Undo, Start again, Back to move k, Hint, size changes, switching
   * Peeling away from Slow, pause). `refresh: false` when a full update follows anyway.
   */
  function finishAll(refresh = true) {
    if (slowFrame !== null) cancelFrame(slowFrame);
    slowFrame = null;
    if (!slow?.busy) return;
    popCells(slow.finishAll());
    if (refresh) update();
  }

  /** Forgets every animation without drawing (a rebuild or dispose follows). */
  function dropAnimations() {
    if (slowFrame !== null) cancelFrame(slowFrame);
    slowFrame = null;
    slow = null;
  }

  // --- Actions -------------------------------------------------------------------------------------------------

  const cancelHint = () => {
    if (hintTimer !== null) clearTimeout(hintTimer);
    hintTimer = null;
  };
  let stuckTimer: ReturnType<typeof setTimeout> | null = null;
  /** The safe point offered by the stuck card, for the moves it was computed for (-1: none beyond the start). */
  let stuckSafe: { key: string; k: number } | null = null;

  /** Applies a new state after a move (incrementally) or any other change (by replay). */
  const commit = (next: PeelState, message: string, played?: { move: Move; hits: Hit[]; colour: string; shots: number; usedUp: boolean }) => {
    cancelHint();
    cancelStuckSafe();
    hintResult = null;
    selected = null;
    previewMove = null;
    state = next;
    if (played) {
      const parsed = parseMove(played.move);
      if (parsed) step(table, cursor, parsed.kind, parsed.index, true);
      for (const hit of played.hits) leftOf[table.engine.colour[hit.cell] as number] = (leftOf[table.engine.colour[hit.cell] as number] as number) - 1;
      updateExposure(table.engine, cursor.cells, exposure, played.hits.map((x) => x.cell));
      stamp++;
      exposedStamp++;
      previews = new Map();
    } else {
      dropAnimations();
      rebuild();
    }
    const solvedNow = solved() && !state.reported;
    if (solvedNow) state = { ...state, reported: true };
    statusText = message;
    becameStuck = false;
    noticesDismissed = false;
    const keyboard = document.activeElement instanceof HTMLElement && container.contains(document.activeElement) && keyboardFocused(document.activeElement) ? document.activeElement : null;
    if (played) startAnimation(played.hits, played.colour, played.shots, played.usedUp);
    if (solvedNow) focusReveal = true;
    update();
    context.requestSave();
    if (solvedNow) {
      announce(live, `${motifTitle()}. ${t('reveal.stats', { launches: cursor.launches, parks: cursor.parks })}`);
      context.finished({ outcome: 'completed', stats: { launches: cursor.launches, parks: cursor.parks } });
    } else announce(live, becameStuck ? `${message} ${t('stuck.text')}` : message);
    // A keyboard player is taken into the stuck card (and back when it closes, design v3 § 4.3).
    if (becameStuck && keyboard) {
      const first = [...stuckPanel.querySelectorAll<HTMLButtonElement>('.wp-row button')].find((b) => !b.hidden && !b.disabled);
      if (first) {
        noticeReturn = keyboard;
        first.focus();
      }
    }
    becameStuck = false;
  };

  /** Closes the notice cards until the next change (Esc or the close button); focus goes back where it came from. */
  function dismissNotices() {
    const inside = document.activeElement instanceof HTMLElement && noticeLayer.contains(document.activeElement);
    noticesDismissed = true;
    update();
    if (inside) {
      const back = noticeReturn && noticeReturn.isConnected && !noticeReturn.hidden ? noticeReturn : (visible(laneButtons)[0] ?? visible(slotButtons)[0] ?? undoButton);
      back.focus();
    }
    noticeReturn = null;
  }

  const resultText = (p: Preview): string => {
    const shooter = shooterText(shooterOf(p) as Shooter);
    if (p.left === 0) return sentence(t('result.usedUp', { shooter, n: p.hits }));
    if (p.parks) return sentence(t('result.parked', { shooter, slot: p.slot + 1 }));
    return sentence(t(p.move.startsWith('S') ? 'result.back' : 'result.waits', { shooter, n: p.hits, slot: p.slot + 1, left: p.left }));
  };

  function activate(b: HTMLButtonElement) {
    if (paused || solved()) return;
    const move = moveOf(b);
    if (!move) return;
    const p = previewOf(move);
    if (!p.legal) {
      previewMove = move;
      selected = null;
      renderStatus();
      draw();
      announce(live, previewText(p));
      return;
    }
    if (display.confirm && selected !== move) {
      selected = move;
      previewMove = move;
      update();
      announce(live, `${previewText(p)} ${t('confirm.again')}`);
      return;
    }
    const isLane = move.startsWith('L');
    const index = Number(move.slice(1));
    const wasFocused = document.activeElement === b;
    const s = shooterOf(p) as Shooter;
    commit({ ...state, moves: [...state.moves, move], restartUndo: null }, resultText(p), { move, hits: p.cells, colour: s.c, shots: s.n, usedUp: p.left === 0 });
    quiet = b;
    if (solved()) return;
    // Focus stays on the same lane; an emptied lane or slot hands focus on (next lane, then the first slot).
    if (wasFocused && b.hidden) {
      const lanes = visible(laneButtons);
      const slots = visible(slotButtons);
      const next = isLane ? lanes.find((x) => Number(x.dataset.move?.slice(1)) > index) ?? lanes[0] ?? slots[0] : slots.find((x) => Number(x.dataset.move?.slice(1)) > index) ?? slots[0] ?? lanes[0];
      quiet = next ?? null;
      next?.focus();
    }
  }

  function doUndo() {
    finishAll(false);
    if (paused || !canUndo(state)) return;
    const fromRestart = state.moves.length === 0;
    commit(undo(state), t(fromRestart ? 'status.restartUndone' : 'status.undone'));
  }

  function doRestart() {
    finishAll(false);
    if (paused) return;
    const next = restart(state);
    if (next !== state) commit(next, t('status.restarted'));
  }

  /** The stuck card's way back (design v3 § 2.4): the hint's safe point, proven as the hint proves it. */
  function doStuckBack() {
    finishAll(false);
    if (paused || stuckSafe === null || stuckSafe.key !== state.moves.join(' ')) return;
    const k = stuckSafe.k;
    const next = undoTo(state, k);
    if (next !== state) commit(next, k === 0 ? t('status.undoneToStart') : t('status.undoneTo', { k }));
  }

  /**
   * When the position is stuck, the safe point is computed once, after one frame (the search takes a moment on a
   * phone); until then the card offers Undo, Start again and Hint. Presentation only: no rule waits for it.
   */
  const scheduleStuckSafe = () => {
    const key = state.moves.join(' ');
    if (stuckTimer !== null || stuckSafe?.key === key) return;
    stuckTimer = setTimeout(() => {
      stuckTimer = null;
      if (paused || !isStuckNow() || state.moves.join(' ') !== key) return;
      const r = computeHint(state);
      stuckSafe = { key, k: r.kind === 'undo' && r.k < state.moves.length ? r.k : -1 };
      update();
    }, 30);
  };
  const cancelStuckSafe = () => {
    if (stuckTimer !== null) clearTimeout(stuckTimer);
    stuckTimer = null;
  };

  function doUndoTo() {
    finishAll(false);
    if (paused || hintResult?.kind !== 'undo') return;
    const k = hintResult.k;
    const next = undoTo(state, k);
    if (next !== state) commit(next, k === 0 ? t('status.undoneToStart') : t('status.undoneTo', { k }));
  }

  const showHint = (result: HintResult) => {
    hintResult = result;
    let text: string;
    if (result.kind === 'move') {
      const p = previewOf(result.move);
      const shooter = shooterText(shooterOf(p) as Shooter);
      const index = Number(result.move.slice(1)) + 1;
      text = result.move.startsWith('L') ? t('hint.lane', { lane: index, shooter }) : t('hint.slot', { slot: index, shooter });
    } else {
      const kind = result.proven ? 'hint.unsolvable' : 'hint.unknown';
      text = result.k === 0 ? t(`${kind}Start`) : t(kind, { k: result.k });
    }
    statusText = text;
    previewMove = null;
    update();
    announce(live, text);
  };

  function doHint() {
    finishAll();
    if (paused || solved() || hintTimer !== null) return;
    // The quick answer (on the witness path) at once; anything else after one frame with a busy state.
    const onPath = state.moves.every((m, i) => state.witness[i] === m) && state.moves.length < state.witness.length;
    if (onPath) return showHint(computeHint(state));
    hintTimer = setTimeout(() => {
      hintTimer = null;
      showHint(computeHint(state));
    }, 30);
    renderStatus();
  }

  // --- Keyboard ------------------------------------------------------------------------------------------------

  const roving = (row: HTMLElement, list: () => HTMLButtonElement[], setFocus: (i: number) => void) => {
    row.addEventListener('keydown', (event) => {
      const shown = visible(list());
      const index = shown.indexOf(document.activeElement as HTMLButtonElement);
      if (index < 0) return;
      const rtl = getComputedStyle(row).direction === 'rtl';
      const stepBy: Record<string, number> = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowDown: 1, ArrowUp: -1 };
      let target = -1;
      if (event.key in stepBy) target = Math.max(0, Math.min(shown.length - 1, index + (stepBy[event.key] as number)));
      else if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = shown.length - 1;
      if (target < 0) return;
      event.preventDefault();
      quiet = null;
      const el = shown[target] as HTMLButtonElement;
      setFocus(list().indexOf(el));
      syncTabStops();
      el.focus();
    });
    row.addEventListener('focusin', (event) => {
      const i = list().indexOf(event.target as HTMLButtonElement);
      if (i >= 0) setFocus(i);
      syncTabStops();
    });
  };
  roving(lanesRow, () => laneButtons, (i) => (laneFocus = i));
  roving(slotsRow, () => slotButtons, (i) => (slotFocus = i));

  lanesToggle.addEventListener('click', () => {
    display.wholeLanes = !wholeLanes();
    savePrefs();
    update();
  });

  // Large view: the arrow keys pan the picture when it has focus.
  board.addEventListener('keydown', (event) => {
    if (!display.large || event.target !== board) return;
    const d: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const v = d[event.key];
    if (!v) return;
    event.preventDefault();
    board.scrollLeft += v[0] * LARGE_CELL * 4;
    board.scrollTop += v[1] * LARGE_CELL * 4;
  });

  const onKeyDown = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      doUndo();
    } else if (event.key === 'Escape' && (previewMove || selected || shownColour) && !noticeLayer.contains(event.target as Node)) {
      selected = null;
      shownColour = null;
      showPreview(null);
      update();
    } else if (event.key === 'Escape' && (!stuckPanel.hidden || !hintRow.hidden)) {
      event.preventDefault();
      dismissNotices();
    }
  };
  const onPointerDown = (event: PointerEvent) => {
    // With "Confirm before launch", a press elsewhere cancels the selection.
    if (selected && !(event.target instanceof Element && event.target.closest(`[data-move="${selected}"]`))) {
      selected = null;
      showPreview(null);
      update();
    }
  };
  const onResize = () => {
    fitSize = 0;
    cssCache = new Map();
    compact = stickyTop();
    update();
    fitStatus();
    fitActions();
  };
  container.addEventListener('keydown', onKeyDown);
  document.addEventListener('pointerdown', onPointerDown);
  if (typeof window !== 'undefined') window.addEventListener('resize', onResize);

  // --- GameInstance --------------------------------------------------------------------------------------------

  /**
   * Once per game start or restore (design v3 § 4.4): when the play unit is not fully on screen, the page scrolls so
   * that its top is at the top. Presentation only, in the next frame; never again during play.
   */
  const scrollIntoViewOnce = () => {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') return;
    window.requestAnimationFrame(() => {
      if (!container.isConnected || playArea.hidden || typeof playArea.scrollIntoView !== 'function') return;
      const vh = viewportHeight();
      const top = playArea.getBoundingClientRect().top;
      const bottom = Math.max(actions.getBoundingClientRect().bottom, compact ? 0 : frameEl.getBoundingClientRect().bottom);
      if (top < 0 || bottom > vh) playArea.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  };

  const mount = () => {
    fitSize = 0;
    cssCache = new Map();
    compact = stickyTop();
    dropAnimations();
    cancelHint();
    cancelStuckSafe();
    stuckSafe = null;
    hintResult = null;
    selected = null;
    previewMove = null;
    shownColour = null;
    statusText = '';
    noticesDismissed = false;
    noticeReturn = null;
    laneFocus = 0;
    slotFocus = 0;
    rebuild();
    build();
    wasStuck = isStuckNow();
    if (!container.isConnected) context.root.appendChild(container);
    colours.open = wide();
    update();
    fitStatus();
    fitActions();
  };

  return {
    newGame(options: NewGameOptions) {
      state = createInitial(options.seed, options.difficulty, options.settings?.motif);
      mount();
      scrollIntoViewOnce();
    },
    restore(saved: PeelState) {
      state = clone(saved);
      mount();
      scrollIntoViewOnce();
      // A save written between the last move and finished() (or by an older version): report the end once.
      if (solved() && !state.reported) {
        state = { ...state, reported: true };
        context.requestSave();
        context.finished({ outcome: 'completed', stats: { launches: cursor.launches, parks: cursor.parks } });
      }
    },
    serialize: () => clone(state),
    pause() {
      paused = true;
      finishAll();
      cancelHint();
      cancelStuckSafe();
      renderStatus();
    },
    resume() {
      paused = false;
      if (isStuckNow()) scheduleStuckSafe();
    },
    reset() {
      state = resetState(state);
      mount();
      context.requestSave();
    },
    dispose() {
      dropAnimations();
      cancelHint();
      cancelStuckSafe();
      for (const o of fitObservers) o.disconnect();
      container.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      if (typeof window !== 'undefined') window.removeEventListener('resize', onResize);
      clear(context.root);
    }
  };
}
