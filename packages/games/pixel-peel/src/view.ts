import { bcp47Tag, type GameContext, type GameInstance, type NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import { createInitial } from './generate';
import { findMotif } from './motifs/index';
import { LOCALES, type Locale } from './motifs/types';
import {
  EMPTY,
  canUndo,
  exposed,
  isSolved,
  isStuck,
  play,
  position,
  presentCount,
  preview,
  resetState,
  restart,
  shootersOf,
  undo,
  undoTo,
  type Hit,
  type Move,
  type PaletteEntry,
  type PeelState,
  type Position,
  type Preview,
  type Shooter
} from './rules';
import { hint as computeHint, type HintResult } from './solver';
import './styles.css';

/** Symbols by palette position (design § 6.1); drawn as paths, never as font glyphs. */
export const SYMBOLS = ['dot', 'triangle', 'square', 'diamond', 'plus', 'ring', 'bar', 'star'] as const;
/** The same symbols as text, only inside sentences (status lines), next to the colour name. */
const GLYPHS = ['●', '▲', '■', '◆', '✚', '○', '▬', '★'];

const star = (() => {
  const pts: string[] = [];
  for (let k = 0; k < 10; k++) {
    const r = k % 2 === 0 ? 9.5 : 4;
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    pts.push(`${(12 + r * Math.cos(a)).toFixed(2)} ${(12.6 + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
})();

/** Symbol outlines in a 24 × 24 box (filled with the even-odd rule, so the ring has a hole). */
export const SYMBOL_PATHS = [
  'M6 12a6 6 0 1 0 12 0a6 6 0 1 0 -12 0Z',
  'M12 3.5L21 19.5H3Z',
  'M5.5 5.5H18.5V18.5H5.5Z',
  'M12 2.5L21.5 12L12 21.5L2.5 12Z',
  'M9.5 3.5H14.5V9.5H20.5V14.5H14.5V20.5H9.5V14.5H3.5V9.5H9.5Z',
  'M3.5 12a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0ZM7.5 12a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0Z',
  'M3 8.5H21V15.5H3Z',
  star
];

/** Black or white, whichever contrasts with the fill (WCAG relative luminance > 0.4 → black). */
export function inkFor(hex: string): string {
  const lin = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const lum = 0.2126 * lin(1) + 0.7152 * lin(3) + 0.0722 * lin(5);
  return lum > 0.4 ? '#000000' : '#ffffff';
}

const SVG = 'http://www.w3.org/2000/svg';
function symbolSvg(index: number, ink: string): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'pp-symbol');
  const path = document.createElementNS(SVG, 'path');
  path.setAttribute('d', SYMBOL_PATHS[index] ?? SYMBOL_PATHS[0]!);
  path.setAttribute('fill', ink);
  path.setAttribute('fill-rule', 'evenodd');
  svg.appendChild(path);
  return svg;
}

const ANIMATION_MAX_MS = 900;
const PREFS = 'display';
const TRACK = 10;

interface Display {
  animation: boolean;
  allSymbols: boolean;
  confirm: boolean;
}

interface Animation {
  hits: Hit[];
  start: number;
  duration: number;
  frame: number;
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createPixelPeel(context: GameContext): GameInstance<PeelState> {
  const { t } = context;
  const locale: Locale = (LOCALES as readonly string[]).includes(t.locale) ? (t.locale as Locale) : 'en';
  let state: PeelState = createInitial(0);
  let pos: Position = position(state);
  let paused = false;
  let previewMove: Move | null = null;
  /** With "Confirm before launch": the move chosen by the first press. */
  let selected: Move | null = null;
  let hintResult: HintResult | null = null;
  let statusText = '';
  let anim: Animation | null = null;
  let laneFocus = 0;
  let slotFocus = 0;
  let wasStuck = false;
  /**
   * The shooter button just launched: its next shooter is not previewed until the pointer leaves it or focus moves,
   * so the status line keeps the result (the browser re-enters the button when its content is replaced).
   */
  let quiet: HTMLElement | null = null;
  const keyboardFocused = (el: HTMLElement) => {
    try {
      return document.activeElement === el && el.matches(':focus-visible');
    } catch {
      return false;
    }
  };
  const stored = context.preferences?.get(PREFS);
  const display: Display = {
    animation: !(typeof stored === 'object' && stored !== null && (stored as Display).animation === false),
    allSymbols: typeof stored === 'object' && stored !== null && (stored as Display).allSymbols === true,
    confirm: typeof stored === 'object' && stored !== null && (stored as Display).confirm === true
  };

  // --- Text helpers ------------------------------------------------------------------------------------------

  const entry = (key: string): { e: PaletteEntry; i: number } => {
    const i = Math.max(0, state.picture.palette.findIndex((p) => p.key === key));
    return { e: state.picture.palette[i] as PaletteEntry, i };
  };
  const colourName = (key: string) => t(`colour.${entry(key).e.name}`);
  const symbolName = (key: string) => t(`symbol.${SYMBOLS[entry(key).i] ?? 'dot'}`);
  const shooterText = (s: Shooter) => `${colourName(s.c)} ${GLYPHS[entry(s.c).i] ?? ''} ${s.n}`;
  const sentence = (text: string) => text.charAt(0).toLocaleUpperCase(bcp47Tag(t.locale)) + text.slice(1);
  const motifTitle = () => findMotif(state.motif)?.title[locale] ?? t('picture.generic');
  const motifPlace = () => findMotif(state.motif)?.place[locale] ?? '';

  // --- DOM ---------------------------------------------------------------------------------------------------

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'data-testid': 'pp-live' });
  const titleEl = h('p', { class: 'pp-title', 'data-testid': 'pp-title' });
  const leftEl = h('p', { class: 'pp-left', 'data-testid': 'pp-left' });
  const canvas = h('canvas', { class: 'pp-canvas', role: 'img', 'data-testid': 'pp-canvas' });
  const board = h('div', { class: 'pp-board', dir: 'ltr' }, canvas);
  const status = h('p', { class: 'wp-status pp-status', 'data-testid': 'pp-status' });

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
  let slotButtons: HTMLButtonElement[] = [];
  let slotFree: HTMLElement[] = [];
  let laneButtons: HTMLButtonElement[] = [];
  let laneEmpty: HTMLElement[] = [];
  let laneQueues: HTMLElement[] = [];

  const coloursList = h('ul', { class: 'pp-colour-list' });
  const colours = h('details', { class: 'pp-details', 'data-testid': 'pp-colours' }, h('summary', {}, t('colours.heading')), coloursList);
  const option = (key: keyof Display, label: string) => {
    const input = h('input', { type: 'checkbox', 'data-testid': `pp-option-${key}` });
    input.addEventListener('change', () => {
      display[key] = input.checked;
      context.preferences?.set(PREFS, { ...display });
      if (key === 'animation' && !input.checked) finishAnimation();
      selected = null;
      draw();
    });
    return { input, label: h('label', { class: 'pp-option' }, input, h('span', {}, label)) };
  };
  const options = { animation: option('animation', t('options.animation')), allSymbols: option('allSymbols', t('options.allSymbols')), confirm: option('confirm', t('options.confirm')) };
  const optionsBox = h('details', { class: 'pp-details', 'data-testid': 'pp-options' }, h('summary', {}, t('options.heading')), options.animation.label, options.allSymbols.label, options.confirm.label);

  const side = h('div', { class: 'pp-side' },
    status,
    hintRow,
    stuckPanel,
    h('section', { class: 'pp-section' }, slotsHeading, slotsRow),
    h('section', { class: 'pp-section' }, h('h3', { class: 'pp-heading', id: 'pp-lanes-heading' }, t('lanes.heading')), lanesRow),
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

  // --- Building (once per game) --------------------------------------------------------------------------------

  const moveOf = (el: Element | null): Move | null => (el instanceof HTMLElement && el.dataset.move ? el.dataset.move : null);

  const build = () => {
    clear(slotsRow);
    clear(lanesRow);
    slotButtons = [];
    slotFree = [];
    laneButtons = [];
    laneEmpty = [];
    laneQueues = [];
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
      const queue = h('div', { class: 'pp-queue' });
      laneButtons.push(b);
      laneEmpty.push(empty);
      laneQueues.push(queue);
      lanesRow.append(h('div', { class: 'pp-lane', 'data-testid': `pp-lane-box-${i}` }, h('span', { class: 'pp-lane-name', 'aria-hidden': 'true' }, t('lane.name', { lane: i + 1 })), b, empty, queue));
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
        showPreview(keyboardFocused(b) ? moveOf(b) : null);
      });
    }
  };

  const fillShooter = (b: HTMLElement, s: Shooter, label: string) => {
    const { e, i } = entry(s.c);
    clear(b);
    const swatch = h('span', { class: 'pp-swatch', style: `background:${e.hex}` });
    swatch.appendChild(symbolSvg(i, inkFor(e.hex)));
    b.append(swatch, h('span', { class: 'pp-shots', dir: 'ltr' }, s.n));
    b.setAttribute('aria-label', label);
    b.dataset.colour = s.c;
    b.dataset.shots = String(s.n);
  };

  const chip = (s: Shooter) => {
    const { e, i } = entry(s.c);
    const sw = h('span', { class: 'pp-chip-swatch', style: `background:${e.hex}` });
    sw.appendChild(symbolSvg(i, inkFor(e.hex)));
    return h('li', { class: 'pp-chip' }, sw, h('span', { 'aria-hidden': 'true', dir: 'ltr' }, s.n), h('span', { class: 'sr-only' }, t('chip.label', { colour: colourName(s.c), symbol: symbolName(s.c), shots: s.n })));
  };

  // --- Rendering -----------------------------------------------------------------------------------------------

  const update = () => {
    pos = position(state);
    const solved = isSolved(pos);
    const total = state.picture.rows.join('').replace(/\./g, '').length;
    const left = presentCount(pos);
    titleEl.textContent = motifTitle();
    leftEl.textContent = t('picture.left', { left, total });
    leftEl.dataset.left = String(left);

    // Slots
    const free = pos.slots.filter((s) => s === null).length;
    slotsHeading.textContent = t('slots.heading', { free, total: pos.slots.length });
    pos.slots.forEach((s, j) => {
      const b = slotButtons[j] as HTMLButtonElement;
      (slotFree[j] as HTMLElement).hidden = s !== null;
      b.hidden = s === null;
      if (s) fillShooter(b, s, t('slot.label', { slot: j + 1, colour: colourName(s.c), symbol: symbolName(s.c), shots: s.n }));
    });

    // Lanes
    pos.lanes.forEach((lane, i) => {
      const k = pos.laneFront[i] as number;
      const front = lane[k];
      const b = laneButtons[i] as HTMLButtonElement;
      b.hidden = !front;
      (laneEmpty[i] as HTMLElement).hidden = Boolean(front);
      if (front) fillShooter(b, front, t('lane.label', { lane: i + 1, colour: colourName(front.c), symbol: symbolName(front.c), shots: front.n }));
      const queue = laneQueues[i] as HTMLElement;
      clear(queue);
      const rest = lane.slice(k + 1);
      if (rest.length > 0) {
        const list = h('ol', { class: 'pp-chips', 'aria-label': t('lane.queue', { lane: i + 1 }) }, ...rest.slice(0, 6).map(chip));
        queue.appendChild(list);
        if (rest.length > 6) {
          queue.appendChild(h('details', { class: 'pp-more' }, h('summary', {}, t('lane.more', { n: rest.length - 6 })), h('ol', { class: 'pp-chips', start: 7 }, ...rest.slice(6).map(chip))));
        }
      }
    });

    // Legality, hint marks, roving tab stops
    for (const b of [...slotButtons, ...laneButtons]) {
      const move = moveOf(b) as Move;
      const p = preview(pos, move);
      b.setAttribute('aria-disabled', String(!p.legal));
      const hinted = hintResult?.kind === 'move' && hintResult.move === move;
      b.dataset.hint = String(hinted);
      b.classList.toggle('is-selected', selected === move);
      b.querySelector('.pp-hint-badge')?.remove();
      if (hinted) b.appendChild(h('span', { class: 'pp-hint-badge' }, t('hint.badge')));
    }
    syncTabStops();

    // Actions, stuck, hint undo target
    const stuck = !solved && isStuck(pos);
    stuckPanel.hidden = !stuck;
    undoButton.disabled = !canUndo(state);
    restartButton.disabled = state.moves.length === 0 || solved;
    for (const b of stuckPanel.querySelectorAll('button')) {
      if (b.dataset.testid === 'pp-stuck-undo') b.disabled = !canUndo(state);
      if (b.dataset.testid === 'pp-stuck-restart') b.disabled = state.moves.length === 0;
    }
    const undoTarget = hintResult?.kind === 'undo' && hintResult.k < state.moves.length ? hintResult.k : -1;
    hintRow.hidden = undoTarget < 0;
    undoToButton.textContent = undoTarget === 0 ? t('hint.undoToStart') : t('hint.undoTo', { k: undoTarget });

    // Colours overview
    clear(coloursList);
    const reach = new Map<string, number>();
    for (const c of exposed(pos)) reach.set(pos.cells[c] as string, (reach.get(pos.cells[c] as string) ?? 0) + 1);
    state.picture.palette.forEach((p, i) => {
      const count = pos.cells.filter((c) => c === p.key).length;
      const sw = h('span', { class: 'pp-chip-swatch', style: `background:${p.hex}` });
      sw.appendChild(symbolSvg(i, inkFor(p.hex)));
      coloursList.appendChild(h('li', { class: 'pp-colour', 'data-testid': `pp-colour-${p.key}` }, sw, h('span', { class: 'pp-colour-name' }, sentence(t(`colour.${p.name}`))), h('span', { class: 'pp-colour-count' }, t('colours.row', { left: count, reachable: reach.get(p.key) ?? 0, shooters: shootersOf(pos, p.key) }))));
    });
    const reachable = state.picture.palette.filter((p) => reach.has(p.key)).map((p) => t('picture.reachItem', { colour: t(`colour.${p.name}`), n: reach.get(p.key) ?? 0 }));
    canvas.setAttribute('aria-label', t('picture.label', { title: motifTitle(), w: pos.w, h: pos.h, left, total, reachable: reachable.length ? reachable.join(t('list.separator')) : t('picture.reachNone') }));

    for (const key of ['animation', 'allSymbols', 'confirm'] as const) options[key].input.checked = display[key];
    options.animation.input.disabled = context.reducedMotion;
    if (context.reducedMotion) options.animation.input.checked = false;

    // Reveal
    playArea.hidden = solved;
    reveal.hidden = !solved;
    if (solved) {
      revealTitle.textContent = motifTitle();
      revealPlace.textContent = motifPlace();
      revealPlace.hidden = motifPlace() === '';
      revealStats.textContent = t('reveal.stats', { launches: pos.launches, parks: pos.parks });
    }
    if (stuck && !wasStuck) announce(live, t('stuck.text'));
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
    if (!p.shooter) return t('reason.empty');
    const shooter = shooterText(p.shooter);
    if (!p.legal) return sentence(t('preview.blocked', { shooter, reason: t(p.reason === 'noSlot' ? 'reason.noSlot' : 'reason.nothing', { left: p.left }) }));
    const slotMove = p.move.startsWith('S');
    if (p.parks) return sentence(t('preview.parks', { shooter }));
    if (p.left === 0) return sentence(t('preview.usedUp', { shooter, n: p.hits.length }));
    return sentence(t(slotMove ? 'preview.backToSlot' : 'preview.removes', { shooter, n: p.hits.length, left: p.left }));
  };

  const renderStatus = () => {
    if (previewMove && !isSolved(pos)) {
      status.textContent = previewText(preview(pos, previewMove)) + (selected === previewMove ? ` ${t('confirm.again')}` : '');
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
  };

  // --- Canvas --------------------------------------------------------------------------------------------------

  const cssVar = (name: string, fallback: string) => {
    const v = typeof getComputedStyle === 'function' ? getComputedStyle(container).getPropertyValue(name).trim() : '';
    return v || fallback;
  };

  const context2d = (el: HTMLCanvasElement, cssW: number, cssH: number): CanvasRenderingContext2D | null => {
    const dpr = typeof window !== 'undefined' && window.devicePixelRatio > 0 ? Math.min(3, window.devicePixelRatio) : 1;
    el.style.width = `${cssW}px`;
    el.style.height = `${cssH}px`;
    el.width = Math.round(cssW * dpr);
    el.height = Math.round(cssH * dpr);
    let g: CanvasRenderingContext2D | null = null;
    try {
      g = el.getContext('2d');
    } catch {
      g = null;
    }
    if (g) g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return g;
  };

  const symbolPaths: (Path2D | null)[] = SYMBOL_PATHS.map((d) => (typeof Path2D === 'function' ? new Path2D(d) : null));
  const drawSymbol = (g: CanvasRenderingContext2D, index: number, x: number, y: number, size: number, ink: string) => {
    const path = symbolPaths[index];
    if (!path) return;
    g.save();
    g.translate(x, y);
    g.scale(size / 24, size / 24);
    g.fillStyle = ink;
    g.fill(path, 'evenodd');
    g.restore();
  };

  const available = (el: HTMLElement) => {
    const w = el.clientWidth || container.clientWidth || 0;
    return w > 0 ? w : 0;
  };

  /** Station centre on the track (for the moving token). */
  const stationPoint = (i: number, cell: number, w: number, h: number): [number, number] => {
    const half = TRACK / 2;
    if (i < w) return [TRACK + (i + 0.5) * cell, TRACK + h * cell + half];
    if (i < w + h) return [TRACK + w * cell + half, TRACK + (h - 1 - (i - w) + 0.5) * cell];
    if (i < 2 * w + h) return [TRACK + (w - 1 - (i - w - h) + 0.5) * cell, half];
    return [half, TRACK + (i - 2 * w - h + 0.5) * cell];
  };

  const draw = () => {
    const { w, h } = state.picture;
    const avail = available(board);
    const cell = avail > 0 ? Math.max(8, Math.min(28, Math.floor((avail - 2 * TRACK) / w))) : 16;
    const cssW = w * cell + 2 * TRACK;
    const cssH = h * cell + 2 * TRACK;
    const solved = isSolved(pos);
    const ex = exposed(pos);
    canvas.dataset.exposed = ex.map((c) => `${c % w},${Math.floor(c / w)}`).join(' ');
    canvas.dataset.cell = String(cell);
    const p = previewMove && !anim ? preview(pos, previewMove) : null;
    canvas.dataset.preview = p ? p.hits.map((x) => `${x.cell % w},${Math.floor(x.cell / w)}`).join(' ') : '';
    if (solved) drawReveal();
    const g = context2d(canvas, cssW, cssH);
    if (!g) return;
    // Track: a frame with one tick per station.
    g.fillStyle = cssVar('--wp-surface-2', '#ecebe5');
    g.fillRect(0, 0, cssW, cssH);
    g.strokeStyle = cssVar('--wp-muted', '#5c5b55');
    g.lineWidth = 1;
    g.beginPath();
    for (let i = 0; i < 2 * w + 2 * h; i++) {
      const [x, y] = stationPoint(i, cell, w, h);
      if (i < w || (i >= w + h && i < 2 * w + h)) {
        g.moveTo(x + 0.5, y - 2);
        g.lineTo(x + 0.5, y + 2);
      } else {
        g.moveTo(x - 2, y + 0.5);
        g.lineTo(x + 2, y + 0.5);
      }
    }
    g.stroke();
    // Cells: removed and transparent show the backdrop. Cells still to pop in an animation stay drawn.
    const pending = new Set<number>();
    let token: Hit | undefined;
    if (anim) {
      const f = Math.min(1, (performance.now() - anim.start) / anim.duration);
      const done = Math.floor(f * anim.hits.length);
      anim.hits.slice(done).forEach((x) => pending.add(x.cell));
      token = anim.hits[Math.min(done, anim.hits.length - 1)];
    }
    const original = state.picture.rows.join('');
    const exSet = new Set(ex);
    const symbolSize = Math.max(6, Math.round(cell * 0.62));
    for (let c = 0; c < w * h; c++) {
      const x = TRACK + (c % w) * cell;
      const y = TRACK + Math.floor(c / w) * cell;
      const key = pos.cells[c] !== EMPTY ? (pos.cells[c] as string) : pending.has(c) ? (original[c] as string) : EMPTY;
      if (key === EMPTY) {
        g.fillStyle = state.picture.backdrop;
        g.fillRect(x, y, cell, cell);
        continue;
      }
      const { e, i } = entry(key);
      g.fillStyle = e.hex;
      g.fillRect(x, y, cell, cell);
      if (!pending.has(c) && (exSet.has(c) || display.allSymbols)) drawSymbol(g, i, x + (cell - symbolSize) / 2, y + (cell - symbolSize) / 2, symbolSize, inkFor(e.hex));
    }
    // Preview: hatching plus a double outline (never colour alone).
    if (p) {
      for (const hit of p.hits) {
        const x = TRACK + (hit.cell % w) * cell;
        const y = TRACK + Math.floor(hit.cell / w) * cell;
        const ink = inkFor(entry(original[hit.cell] as string).e.hex);
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
    if (token) {
      const [tx, ty] = stationPoint(token.station, cell, w, h);
      const shooter = entry(original[token.cell] as string).e;
      g.beginPath();
      g.arc(tx, ty, TRACK / 2 + 1, 0, Math.PI * 2);
      g.fillStyle = shooter.hex;
      g.fill();
      g.lineWidth = 1.5;
      g.strokeStyle = cssVar('--wp-text', '#1d1d1b');
      g.stroke();
    }
  };

  const drawReveal = () => {
    const { w, h } = state.picture;
    const avail = available(reveal);
    const cell = avail > 0 ? Math.max(6, Math.min(24, Math.floor(avail / w))) : 16;
    const g = context2d(revealCanvas, w * cell, h * cell);
    revealCanvas.setAttribute('aria-label', motifTitle());
    if (!g) return;
    state.picture.rows.forEach((row, y) => {
      for (let x = 0; x < w; x++) {
        const key = row[x] as string;
        g.fillStyle = key === EMPTY ? state.picture.backdrop : entry(key).e.hex;
        g.fillRect(x * cell, y * cell, cell, cell);
      }
    });
  };

  // --- Animation (cosmetic only: the state has already changed) ------------------------------------------------

  const tick = () => {
    if (!anim) return;
    draw();
    if (performance.now() - anim.start >= anim.duration) {
      anim = null;
      draw();
      return;
    }
    anim.frame = requestAnimationFrame(tick);
  };

  const startAnimation = (hits: Hit[]) => {
    finishAnimation();
    if (context.reducedMotion || !display.animation || hits.length === 0 || typeof requestAnimationFrame !== 'function') return;
    anim = { hits, start: performance.now(), duration: Math.min(ANIMATION_MAX_MS, 120 + hits.length * 45), frame: 0 };
    anim.frame = requestAnimationFrame(tick);
  };

  function finishAnimation() {
    if (!anim) return;
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(anim.frame);
    anim = null;
    draw();
  }

  // --- Actions -------------------------------------------------------------------------------------------------

  const commit = (next: PeelState, message: string) => {
    hintResult = null;
    selected = null;
    previewMove = null;
    state = next;
    pos = position(state);
    const solvedNow = isSolved(pos) && !state.reported;
    if (solvedNow) state = { ...state, reported: true };
    statusText = message;
    update();
    context.requestSave();
    if (solvedNow) {
      announce(live, `${motifTitle()}. ${t('reveal.stats', { launches: pos.launches, parks: pos.parks })}`);
      context.finished({ outcome: 'completed', stats: { launches: pos.launches, parks: pos.parks } });
      revealTitle.focus();
    } else announce(live, message);
  };

  const resultText = (p: Preview): string => {
    const shooter = shooterText(p.shooter as Shooter);
    const n = p.hits.length;
    if (p.left === 0) return sentence(t('result.usedUp', { shooter, n }));
    if (p.parks) return sentence(t('result.parked', { shooter, slot: p.slot + 1 }));
    return sentence(t(p.move.startsWith('S') ? 'result.back' : 'result.waits', { shooter, n, slot: p.slot + 1, left: p.left }));
  };

  function activate(b: HTMLButtonElement) {
    finishAnimation();
    if (paused || isSolved(pos)) return;
    const move = moveOf(b);
    if (!move) return;
    const p = preview(pos, move);
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
    commit(play(state, move), resultText(p));
    quiet = b;
    startAnimation(p.hits);
    if (isSolved(pos)) return;
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

  function doHint() {
    finishAnimation();
    if (paused || isSolved(pos)) return;
    hintResult = computeHint(state);
    let text: string;
    if (hintResult.kind === 'move') {
      const p = preview(pos, hintResult.move);
      const shooter = shooterText(p.shooter as Shooter);
      const index = Number(hintResult.move.slice(1)) + 1;
      text = hintResult.move.startsWith('L') ? t('hint.lane', { lane: index, shooter }) : t('hint.slot', { slot: index, shooter });
    } else {
      const k = hintResult.k;
      const kind = hintResult.proven ? 'hint.unsolvable' : 'hint.unknown';
      text = k === 0 ? t(`${kind}Start`) : t(kind, { k });
    }
    statusText = text;
    previewMove = null;
    update();
    announce(live, text);
  }

  // --- Keyboard ------------------------------------------------------------------------------------------------

  const roving = (row: HTMLElement, list: () => HTMLButtonElement[], setFocus: (i: number) => void) => {
    row.addEventListener('keydown', (event) => {
      const shown = visible(list());
      const index = shown.indexOf(document.activeElement as HTMLButtonElement);
      if (index < 0) return;
      const rtl = getComputedStyle(row).direction === 'rtl';
      const step: Record<string, number> = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowDown: 1, ArrowUp: -1 };
      let target = -1;
      if (event.key in step) target = Math.max(0, Math.min(shown.length - 1, index + (step[event.key] as number)));
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

  const onKeyDown = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      doUndo();
    } else if (event.key === 'Escape' && (previewMove || selected)) {
      selected = null;
      showPreview(null);
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
  container.addEventListener('pointerdown', onPointerDown);
  if (typeof window !== 'undefined') window.addEventListener('resize', onResize);

  // --- GameInstance --------------------------------------------------------------------------------------------

  const mount = () => {
    finishAnimation();
    hintResult = null;
    selected = null;
    previewMove = null;
    statusText = '';
    laneFocus = 0;
    slotFocus = 0;
    pos = position(state);
    wasStuck = isStuck(pos);
    build();
    if (!container.isConnected) context.root.appendChild(container);
    colours.open = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 48rem)').matches;
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
    },
    serialize: () => clone(state),
    pause() {
      paused = true;
      finishAnimation();
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
      container.removeEventListener('keydown', onKeyDown);
      container.removeEventListener('pointerdown', onPointerDown);
      if (typeof window !== 'undefined') window.removeEventListener('resize', onResize);
      clear(context.root);
    }
  };
}
