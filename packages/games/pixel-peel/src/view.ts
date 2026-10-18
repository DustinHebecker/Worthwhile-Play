import { bcp47Tag, type GameContext, type GameInstance, type NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import { LOCALES, type Locale } from './art/types';
import { exposureOf, parseMove, replayCursor, shotsLeft, step, updateExposure, type Cursor, type Exposure, type Outcome, type Table } from './engine';
import { createInitial } from './generate';
import { hint as computeHint, type HintResult } from './hint';
import { findMotif } from './motifs/index';
import { canUndo, resetState, restart, tableOfState, undo, undoTo, type Hit, type Move, type PaletteEntry, type PeelState, type Shooter } from './rules';
import { inkFor, SYMBOLS, symbolPath } from './symbols';
import './styles.css';

export { inkFor, SYMBOLS } from './symbols';

const ANIMATION_MAX_MS = 900;
const PREFS = 'display';
/** Track frame around the picture (CSS px). */
const TRACK = 6;
/** Cell size (CSS px) in Large view. */
const LARGE_CELL = 14;
/** Symbols and the hatch are drawn from this cell size (CSS px). */
const SYMBOL_MIN = 10;
/** Chips shown per lane before "Show whole lanes". */
const CHIPS_SHOWN = 7;

interface Display {
  animation: boolean;
  allSymbols: boolean;
  confirm: boolean;
  large: boolean;
  /** null: the default for the screen width. */
  wholeLanes: boolean | null;
}

interface Animation {
  hits: Hit[];
  done: number;
  start: number;
  duration: number;
  frame: number;
  /** Colour key of the launched shooter (token colour). */
  c: string;
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

export function createPixelPeel(context: GameContext): GameInstance<PeelState> {
  const { t } = context;
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
  let anim: Animation | null = null;
  let laneFocus = 0;
  let slotFocus = 0;
  let wasStuck = false;
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
  const stored = context.preferences?.get(PREFS);
  const pref = (key: keyof Display): unknown => (typeof stored === 'object' && stored !== null ? (stored as Record<string, unknown>)[key] : undefined);
  const display: Display = {
    animation: pref('animation') !== false,
    allSymbols: pref('allSymbols') === true,
    confirm: pref('confirm') === true,
    large: pref('large') === true,
    wholeLanes: typeof pref('wholeLanes') === 'boolean' ? (pref('wholeLanes') as boolean) : null
  };
  const wide = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 48rem)').matches;
  const wholeLanes = () => display.wholeLanes ?? wide();

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
  const canvas = h('canvas', { class: 'pp-canvas', role: 'img', 'data-testid': 'pp-canvas' });
  const board = h('div', { class: 'pp-board', dir: 'ltr', 'data-testid': 'pp-board' }, canvas);
  const status = h('p', { class: 'wp-status pp-status', 'data-testid': 'pp-status', 'aria-live': 'off' });

  const button = (testId: string, label: string, onclick: () => void) => h('button', { type: 'button', 'data-testid': testId, onclick: () => onclick() }, label);
  const undoButton = button('pp-undo', t('common.undo'), () => doUndo());
  const restartButton = button('pp-restart', t('action.restart'), () => doRestart());
  const hintButton = button('pp-hint', t('common.hint'), () => doHint());
  const undoToButton = button('pp-undo-to', '', () => doUndoTo());
  const hintRow = h('div', { class: 'wp-row pp-hint-row', hidden: true }, undoToButton);
  const stuckPanel = h('div', { class: 'pp-stuck', role: 'group', 'aria-labelledby': 'pp-stuck-text', 'data-testid': 'pp-stuck', hidden: true },
    h('p', { id: 'pp-stuck-text' }, t('stuck.text')),
    h('div', { class: 'wp-row' },
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
  let laneChips: HTMLElement[][] = [];

  const coloursList = h('ul', { class: 'pp-colour-list' });
  const colours = h('details', { class: 'pp-details', 'data-testid': 'pp-colours' }, h('summary', {}, t('colours.heading')), coloursList);
  let colourRows: { li: HTMLElement; count: HTMLElement; toggle: HTMLButtonElement; key: string }[] = [];

  const checkbox = (key: 'animation' | 'allSymbols' | 'confirm' | 'wholeLanes', label: string) => {
    const input = h('input', { type: 'checkbox', 'data-testid': `pp-option-${key}` });
    input.addEventListener('change', () => {
      display[key] = input.checked;
      savePrefs();
      if (key === 'animation' && !input.checked) finishAnimation();
      selected = null;
      update();
    });
    return { input, label: h('label', { class: 'pp-option' }, input, h('span', {}, label)) };
  };
  const sizeRadio = (large: boolean) => {
    const input = h('input', { type: 'radio', name: 'pp-size', value: large ? 'large' : 'fit', 'data-testid': `pp-option-${large ? 'large' : 'fit'}` });
    input.addEventListener('change', () => {
      if (!input.checked) return;
      display.large = large;
      savePrefs();
      update();
    });
    return { input, label: h('label', { class: 'pp-option' }, input, h('span', {}, t(large ? 'options.large' : 'options.fit'))) };
  };
  const options = {
    animation: checkbox('animation', t('options.animation')),
    allSymbols: checkbox('allSymbols', t('options.allSymbols')),
    confirm: checkbox('confirm', t('options.confirm')),
    wholeLanes: checkbox('wholeLanes', t('options.wholeLanes'))
  };
  const sizes = { fit: sizeRadio(false), large: sizeRadio(true) };
  const optionsBox = h('details', { class: 'pp-details', 'data-testid': 'pp-options' },
    h('summary', {}, t('options.heading')),
    h('fieldset', { class: 'pp-sizes' }, h('legend', {}, t('options.size')), sizes.fit.label, sizes.large.label),
    options.wholeLanes.label,
    options.allSymbols.label,
    options.animation.label,
    options.confirm.label
  );
  const savePrefs = () => context.preferences?.set(PREFS, { ...display });

  const side = h('div', { class: 'pp-side' },
    status,
    hintRow,
    stuckPanel,
    h('section', { class: 'pp-section' }, slotsHeading, slotsRow),
    h('section', { class: 'pp-section' }, h('h3', { class: 'pp-heading', id: 'pp-lanes-heading' }, t('lanes.heading')), lanesRow, lanesToggle),
    h('div', { class: 'wp-row pp-actions' }, undoButton, restartButton, hintButton),
    h('p', { class: 'wp-muted pp-help' }, t('help.symbols')),
    h('p', { class: 'wp-muted pp-help' }, t('help.keys')),
    colours,
    optionsBox
  );
  const playArea = h('div', { class: 'pp-play' }, h('div', { class: 'pp-head' }, titleEl, leftEl), h('div', { class: 'pp-main' }, board, side));

  const revealCanvas = h('canvas', { class: 'pp-reveal-canvas', role: 'img', 'data-testid': 'pp-reveal-canvas' });
  const revealTitle = h('h2', { class: 'pp-reveal-title', tabindex: -1, 'data-testid': 'pp-reveal-title' });
  const revealPlace = h('p', { class: 'pp-reveal-place' });
  const revealStats = h('p', { class: 'wp-muted', 'data-testid': 'pp-reveal-stats' });
  const reveal = h('section', { class: 'pp-reveal', 'data-testid': 'pp-reveal', hidden: true }, h('div', { class: 'pp-reveal-board', dir: 'ltr' }, revealCanvas), revealTitle, revealPlace, revealStats);

  const container = h('div', { class: 'wp-pixel-peel', dir: t.direction, lang: bcp47Tag(t.locale) }, playArea, reveal, live);
  if (context.reducedMotion) container.classList.add('is-reduced-motion');

  // --- Session: engine, cursor, exposure, cached previews (design v2 § 6.5) -----------------------------------

  const solved = () => cursor.cells.left === 0;

  /** Rebuilds the session from the state (new game, restore, undo): one replay, < 2 ms at 48. */
  const rebuild = () => {
    table = tableOfState(state);
    cursor = replayCursor(table, state.moves) ?? (replayCursor(table, []) as Cursor);
    exposure = exposureOf(table.engine, cursor.cells);
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

  const fillSwatch = (sw: HTMLElement, key: string) => {
    const { e, i } = entry(key);
    clear(sw);
    sw.style.background = e.hex;
    sw.appendChild(symbolSvg(i, inkFor(e.hex)));
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
    colourRows = [];
    for (let j = 0; j < state.slots; j++) {
      const b = h('button', { type: 'button', class: 'pp-shooter pp-slot', 'data-testid': `pp-slot-${j}`, 'data-move': `S${j}` });
      const free = h('div', { class: 'pp-slot-free', 'data-testid': `pp-slot-free-${j}` }, h('span', { 'aria-hidden': 'true' }, t('slot.free')), h('span', { class: 'sr-only' }, t('slot.freeLabel', { slot: j + 1 })));
      slotButtons.push(b);
      slotFree.push(free);
      slotsRow.append(h('div', { class: 'pp-slot-cell' }, b, free));
    }
    state.lanes.forEach((lane, i) => {
      const b = h('button', { type: 'button', class: 'pp-shooter pp-front', 'data-testid': `pp-lane-${i}`, 'data-move': `L${i}` });
      const empty = h('div', { class: 'pp-lane-empty' }, t('lane.empty'));
      const chips = lane.map((s, k) => {
        const sw = h('span', { class: 'pp-chip-swatch' });
        fillSwatch(sw, s.c);
        return h('li', { class: 'pp-chip', 'data-index': k }, sw, h('span', { 'aria-hidden': 'true', dir: 'ltr' }, s.n), h('span', { class: 'sr-only' }, t('chip.label', { colour: colourName(s.c), symbol: symbolName(s.c), shots: s.n })));
      });
      laneButtons.push(b);
      laneEmpty.push(empty);
      laneChips.push(chips);
      const list = h('ol', { class: 'pp-chips', 'aria-label': t('lane.queue', { lane: i + 1 }) }, ...chips);
      lanesRow.append(h('div', { class: 'pp-lane', 'data-testid': `pp-lane-box-${i}` }, h('span', { class: 'pp-lane-name', 'aria-hidden': 'true' }, t('lane.name', { lane: i + 1 })), b, empty, list));
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
        finishAnimation();
        shownColour = shownColour === p.key ? null : p.key;
        update();
      });
      const li = h('li', { class: 'pp-colour', 'data-testid': `pp-colour-${p.key}` }, sw, h('span', { class: 'pp-colour-name' }, sentence(t(`colour.${p.name}`))), count, toggle);
      coloursList.appendChild(li);
      colourRows.push({ li, count, toggle, key: p.key });
    });
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

  const update = () => {
    const isSolved = solved();
    const total = table.engine.filled;
    const left = cursor.cells.left;
    titleEl.textContent = t('title.colours', { title: motifTitle(), n: state.picture.palette.length });
    leftEl.textContent = t('picture.left', { left, total });
    leftEl.dataset.left = String(left);

    // Slots
    const free = cursor.slots.filter((s) => s === null).length;
    slotsHeading.textContent = t('slots.heading', { free, total: cursor.slots.length });
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
      (laneChips[i] as HTMLElement[]).forEach((chip, index) => {
        const behind = index - k - 1;
        const hide = behind < 0 || (!whole && behind >= CHIPS_SHOWN);
        if (behind >= CHIPS_SHOWN && !whole) hiddenChips++;
        if (chip.hidden !== hide) chip.hidden = hide;
      });
    });
    const longest = Math.max(0, ...state.lanes.map((lane, i) => lane.length - (cursor.laneFront[i] as number) - 1 - CHIPS_SHOWN));
    lanesToggle.hidden = longest <= 0;
    lanesToggle.setAttribute('aria-expanded', String(whole));
    lanesToggle.textContent = whole ? t('lanes.collapse') : t('lanes.expand', { n: hiddenChips });

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
    stuckPanel.hidden = !stuck;
    undoButton.disabled = !canUndo(state);
    restartButton.disabled = state.moves.length === 0 || isSolved;
    hintButton.disabled = isSolved;
    for (const b of stuckPanel.querySelectorAll('button')) {
      if (b.dataset.testid === 'pp-stuck-undo') b.disabled = !canUndo(state);
      if (b.dataset.testid === 'pp-stuck-restart') b.disabled = state.moves.length === 0;
    }
    const undoTarget = hintResult?.kind === 'undo' && hintResult.k < state.moves.length ? hintResult.k : -1;
    hintRow.hidden = undoTarget < 0;
    undoToButton.textContent = undoTarget === 0 ? t('hint.undoToStart') : t('hint.undoTo', { k: undoTarget });

    // Colours overview
    const edge = new Int32Array(table.engine.keys.length + 1);
    for (let c = 0; c < exposure.seenBy.length; c++) if (exposure.seenBy[c]) edge[table.engine.colour[c] as number] = (edge[table.engine.colour[c] as number] as number) + 1;
    const shots = shotsLeft(table, cursor);
    for (const row of colourRows) {
      const code = table.engine.codes.get(row.key) ?? 0;
      row.count.textContent = t('colours.row', { left: leftOf[code] ?? 0, edge: edge[code] ?? 0, shots: shots[code] ?? 0 });
      row.toggle.setAttribute('aria-pressed', String(shownColour === row.key));
      row.li.classList.toggle('is-done', (leftOf[code] ?? 0) === 0);
    }
    const reachable = state.picture.palette.filter((p) => (edge[table.engine.codes.get(p.key) ?? 0] ?? 0) > 0).map((p) => t('picture.reachItem', { colour: t(`colour.${p.name}`), n: edge[table.engine.codes.get(p.key) ?? 0] ?? 0 }));
    canvas.setAttribute('aria-label', t('picture.label', { title: motifTitle(), w: table.engine.w, h: table.engine.h, left, total, reachable: reachable.length ? reachable.join(t('list.separator')) : t('picture.reachNone') }));

    for (const key of ['animation', 'allSymbols', 'confirm'] as const) options[key].input.checked = display[key];
    options.wholeLanes.input.checked = whole;
    sizes.fit.input.checked = !display.large;
    sizes.large.input.checked = display.large;
    options.animation.input.disabled = context.reducedMotion;
    if (context.reducedMotion) options.animation.input.checked = false;

    // Reveal
    playArea.hidden = isSolved;
    reveal.hidden = !isSolved;
    if (isSolved) {
      revealTitle.textContent = motifTitle();
      revealPlace.textContent = motifPlace();
      revealPlace.hidden = motifPlace() === '';
      revealStats.textContent = t('reveal.stats', { launches: cursor.launches, parks: cursor.parks });
    }
    if (stuck && !wasStuck) becameStuck = true;
    wasStuck = stuck;
    renderStatus();
    draw();
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
      status.textContent = statusText || t('status.start');
      status.dataset.kind = statusText ? 'message' : 'start';
    }
  };

  const showPreview = (move: Move | null) => {
    if (previewMove === move) return;
    // Any input jumps an animation to its end (design § 7.5), so the preview shows the real position.
    if (move !== null) finishAnimation();
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
      base.set([back[0], back[1], back[2], 255], c * 4);
      dim.set([back[0], back[1], back[2], 255], c * 4);
    }
  };

  const cssVar = (name: string, fallback: string) => {
    const v = typeof getComputedStyle === 'function' ? getComputedStyle(container).getPropertyValue(name).trim() : '';
    return v || fallback;
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

  /** Cell size in CSS px: Fit fills the available width (at least 5 px), Large is 14 px. */
  const cellSize = () => {
    const { w } = table.engine;
    if (display.large) return LARGE_CELL;
    const avail = available();
    return avail > 0 ? Math.max(5, Math.min(24, Math.floor((avail - 2 * TRACK) / w))) : 8;
  };

  /** Station centre on the track (for the moving token). */
  const stationPoint = (i: number, cell: number, w: number, h: number): [number, number] => {
    const half = TRACK / 2;
    if (i < w) return [TRACK + (i + 0.5) * cell, TRACK + h * cell + half];
    if (i < w + h) return [TRACK + w * cell + half, TRACK + (h - 1 - (i - w) + 0.5) * cell];
    if (i < 2 * w + h) return [TRACK + (w - 1 - (i - w - h) + 0.5) * cell, half];
    return [half, TRACK + (i - 2 * w - h + 0.5) * cell];
  };

  let scratch: HTMLCanvasElement | null = null;
  const blit = (g: CanvasRenderingContext2D, data: Uint8ClampedArray, x: number, y: number, cell: number, mask?: (c: number) => boolean) => {
    const { w, h } = table.engine;
    if (typeof ImageData !== 'function' || typeof document === 'undefined') return;
    if (!scratch) scratch = document.createElement('canvas');
    scratch.width = w;
    scratch.height = h;
    const sg = scratch.getContext('2d');
    if (!sg) return;
    let pixels = data;
    if (mask) {
      pixels = new Uint8ClampedArray(data);
      for (let c = 0; c < w * h; c++) if (!mask(c)) pixels[c * 4 + 3] = 0;
    }
    sg.putImageData(new ImageData(pixels as Uint8ClampedArray<ArrayBuffer>, w, h), 0, 0);
    g.drawImage(scratch, x, y, w * cell, h * cell);
  };

  /** The colour key in the spotlight: the previewed shooter's, else the one shown from the colours list. */
  const spotlightKey = (): string | null => {
    if (previewMove && !anim) {
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
    board.classList.toggle('is-large', display.large);
    if (display.large) {
      board.setAttribute('role', 'region');
      board.setAttribute('tabindex', '0');
      board.setAttribute('aria-label', t('picture.region'));
    } else {
      board.removeAttribute('role');
      board.removeAttribute('tabindex');
      board.removeAttribute('aria-label');
    }
    const ex: number[] = [];
    for (let c = 0; c < exposure.seenBy.length; c++) if (exposure.seenBy[c]) ex.push(c);
    canvas.dataset.exposed = ex.map((c) => `${c % w},${Math.floor(c / w)}`).join(' ');
    canvas.dataset.cell = String(cell);
    const symbols = cell >= SYMBOL_MIN ? (display.allSymbols ? 'all' : 'edge') : 'none';
    canvas.dataset.symbols = symbols;
    const p = previewMove && !anim ? previewOf(previewMove) : null;
    canvas.dataset.preview = p ? p.cells.map((x) => `${x.cell % w},${Math.floor(x.cell / w)}`).join(' ') : '';
    const spot = spotlightKey();
    canvas.dataset.spotlight = spot ?? '';
    if (solved() && !anim) drawReveal();
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
      blit(g, base, TRACK, TRACK, cell, (c) => shown[c] === 1 && colour[c] === code);
    } else blit(g, base, TRACK, TRACK, cell);
    // Symbols from 10 px: on exposed cells, or on all with the option.
    if (symbols !== 'none') {
      const size = Math.max(6, Math.round(cell * 0.62));
      const list = symbols === 'all' ? [...shown.keys()].filter((c) => shown[c]) : ex;
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
    if (anim) {
      const hit = anim.hits[Math.min(anim.done, anim.hits.length - 1)];
      if (hit) {
        const [tx, ty] = stationPoint(hit.station, cell, w, h);
        g.beginPath();
        g.arc(tx, ty, TRACK / 2 + 2, 0, Math.PI * 2);
        g.fillStyle = entry(anim.c).e.hex;
        g.fill();
        g.lineWidth = 1.5;
        g.strokeStyle = cssVar('--wp-text', '#1d1d1b');
        g.stroke();
      }
    }
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

  const tick = () => {
    if (!anim) return;
    const f = Math.min(1, (performance.now() - anim.start) / anim.duration);
    const done = Math.floor(f * anim.hits.length);
    if (done > anim.done) {
      popCells(anim.hits.slice(anim.done, done).map((x) => x.cell));
      anim.done = done;
    }
    if (f >= 1) {
      anim = null;
      draw();
      return;
    }
    draw();
    anim.frame = requestAnimationFrame(tick);
  };

  const startAnimation = (hits: Hit[], c: string) => {
    finishAnimation();
    if (context.reducedMotion || !display.animation || hits.length === 0 || typeof requestAnimationFrame !== 'function') {
      popCells(hits.map((x) => x.cell));
      return;
    }
    anim = { hits, done: 0, start: performance.now(), duration: Math.min(ANIMATION_MAX_MS, 120 + hits.length * 30), frame: 0, c };
    anim.frame = requestAnimationFrame(tick);
  };

  function finishAnimation() {
    if (!anim) return;
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(anim.frame);
    popCells(anim.hits.slice(anim.done).map((x) => x.cell));
    anim = null;
    draw();
  }

  // --- Actions -------------------------------------------------------------------------------------------------

  const cancelHint = () => {
    if (hintTimer !== null) clearTimeout(hintTimer);
    hintTimer = null;
  };

  /** Applies a new state after a move (incrementally) or any other change (by replay). */
  const commit = (next: PeelState, message: string, played?: { move: Move; hits: Hit[] }) => {
    cancelHint();
    hintResult = null;
    selected = null;
    previewMove = null;
    state = next;
    if (played) {
      const parsed = parseMove(played.move);
      if (parsed) step(table, cursor, parsed.kind, parsed.index, true);
      for (const hit of played.hits) leftOf[table.engine.colour[hit.cell] as number] = (leftOf[table.engine.colour[hit.cell] as number] as number) - 1;
      updateExposure(table.engine, cursor.cells, exposure, played.hits.map((x) => x.cell));
      previews = new Map();
    } else {
      finishAnimation();
      rebuild();
    }
    const solvedNow = solved() && !state.reported;
    if (solvedNow) state = { ...state, reported: true };
    statusText = message;
    becameStuck = false;
    if (played) startAnimation(played.hits, keyOfCode(table.engine.colour[(played.hits[0] ?? { cell: 0 }).cell] as number));
    update();
    context.requestSave();
    if (solvedNow) {
      announce(live, `${motifTitle()}. ${t('reveal.stats', { launches: cursor.launches, parks: cursor.parks })}`);
      context.finished({ outcome: 'completed', stats: { launches: cursor.launches, parks: cursor.parks } });
      revealTitle.focus();
    } else announce(live, becameStuck ? `${message} ${t('stuck.text')}` : message);
    becameStuck = false;
  };

  const resultText = (p: Preview): string => {
    const shooter = shooterText(shooterOf(p) as Shooter);
    if (p.left === 0) return sentence(t('result.usedUp', { shooter, n: p.hits }));
    if (p.parks) return sentence(t('result.parked', { shooter, slot: p.slot + 1 }));
    return sentence(t(p.move.startsWith('S') ? 'result.back' : 'result.waits', { shooter, n: p.hits, slot: p.slot + 1, left: p.left }));
  };

  function activate(b: HTMLButtonElement) {
    finishAnimation();
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
    commit({ ...state, moves: [...state.moves, move], restartUndo: null }, resultText(p), { move, hits: p.cells });
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
    finishAnimation();
    if (paused || !canUndo(state)) return;
    const fromRestart = state.moves.length === 0;
    commit(undo(state), t(fromRestart ? 'status.restartUndone' : 'status.undone'));
  }

  function doRestart() {
    finishAnimation();
    if (paused) return;
    const next = restart(state);
    if (next !== state) commit(next, t('status.restarted'));
  }

  function doUndoTo() {
    finishAnimation();
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
    finishAnimation();
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
    } else if (event.key === 'Escape' && (previewMove || selected || shownColour)) {
      selected = null;
      shownColour = null;
      showPreview(null);
      update();
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
  const onResize = () => draw();
  container.addEventListener('keydown', onKeyDown);
  document.addEventListener('pointerdown', onPointerDown);
  if (typeof window !== 'undefined') window.addEventListener('resize', onResize);

  // --- GameInstance --------------------------------------------------------------------------------------------

  const mount = () => {
    finishAnimation();
    cancelHint();
    hintResult = null;
    selected = null;
    previewMove = null;
    shownColour = null;
    statusText = '';
    laneFocus = 0;
    slotFocus = 0;
    rebuild();
    build();
    wasStuck = isStuckNow();
    if (!container.isConnected) context.root.appendChild(container);
    colours.open = wide();
    update();
  };

  return {
    newGame(options: NewGameOptions) {
      state = createInitial(options.seed, options.difficulty, options.settings?.motif);
      mount();
    },
    restore(saved: PeelState) {
      state = clone(saved);
      mount();
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
      finishAnimation();
      cancelHint();
      renderStatus();
    },
    resume() {
      paused = false;
    },
    reset() {
      state = resetState(state);
      mount();
      context.requestSave();
    },
    dispose() {
      finishAnimation();
      cancelHint();
      container.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      if (typeof window !== 'undefined') window.removeEventListener('resize', onResize);
      clear(context.root);
    }
  };
}
