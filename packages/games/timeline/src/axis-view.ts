/**
 * The time axis on screen (design § 12): one SVG with ticks, labelled markers, hatched ranges and window brackets;
 * the answer marker as a focusable slider; zoom and pan by buttons, keys, wheel, drag and pinch; the squeezed/even
 * toggle. Always left-to-right (past left), also on RTL pages. All geometry comes from the pure `axis.ts`.
 */
import type { Translator } from '@wp/game-core';
import { clear, h } from '@wp/ui';
import { FULL, chooseTicks, clampWindow, layoutLabels, pan, windowYears, xOf, yearAt, zoomAt, type AxisView, type Tick, type Window } from './axis';
import { formatTick, formatYear, type T } from './format';
import { snapYear } from './time';

const NS = 'http://www.w3.org/2000/svg';

export interface AxisMark {
  readonly y: number;
  /** Shown on the axis (◆ ▲ ● ■ 1 2 …). */
  readonly symbol: string;
  /** Text label (placed above the axis, or in the legend when there is no room). */
  readonly label: string;
  readonly style: 'guess' | 'anchor' | 'target' | 'option' | 'focus' | 'number';
}

export interface AxisRange {
  readonly lo: number;
  readonly hi: number;
  readonly label: string;
  readonly style: 'true' | 'window';
}

export interface AxisScene {
  /** `place`: the slider is shown and a tap sets the answer; `explore`: drag pans. */
  readonly mode: 'place' | 'explore';
  /** The current answer (place mode). */
  readonly value?: number | null;
  readonly marks?: readonly AxisMark[];
  readonly ranges?: readonly AxisRange[];
  readonly ariaLabel: string;
}

export interface AxisOptions {
  readonly t: Translator;
  readonly reducedMotion: boolean;
  paused(): boolean;
  /** The view preference changed (the host saves it). */
  onView?(view: AxisView): void;
  /** A new answer from a tap, a drag (on release) or a key. */
  onPlace(y: number, via: 'pointer' | 'keyboard'): void;
  /** Text for the live region after a keyboard change. */
  describe(y: number): string;
}

export interface AxisViewApi {
  readonly element: HTMLElement;
  show(scene: AxisScene): void;
  /** Sets the visible window (clamped); `animate` eases there unless reduced motion is on. */
  fit(w: Window, animate?: boolean): void;
  window(): Window;
  view(): AxisView;
  setView(v: AxisView): void;
  dispose(): void;
}

/** Estimated label width in pixels at the axis font size (wide glyphs for CJK and similar scripts). */
export function textWidth(s: string): number {
  let w = 0;
  for (const ch of s) w += (ch.codePointAt(0) ?? 0) >= 0x2e80 ? 12 : 6.6;
  return w;
}

const ROW_H = 16;
const ROWS = 3;
const LABEL_TOP = 14;
const AXIS_Y = LABEL_TOP + ROWS * ROW_H + 8;
const HEIGHT = AXIS_Y + 40;

let axisCount = 0;

export function createAxisView(o: AxisOptions, initialView: AxisView = 'log'): AxisViewApi {
  const uid = ++axisCount;
  const { t } = o;
  const locale = t.locale;
  const tt: T = (k, p) => t(k, p);
  let view: AxisView = initialView;
  let win: Window = FULL;
  let scene: AxisScene = { mode: 'explore', ariaLabel: '' };
  let draftY: number | null = null;
  let px = 640;
  let anim = 0;

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'tl-svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('height', String(HEIGHT));
  const slider = h('div', { class: 'tl-slider', role: 'slider', tabindex: 0, 'data-testid': 'tl-slider', 'aria-label': t('axis.slider'), 'aria-orientation': 'horizontal' }, h('span', { class: 'tl-slider-glyph', 'aria-hidden': 'true' }, '◆'));
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'tl-axis-live' });
  const plot = h('div', { class: 'tl-plot', 'data-testid': 'tl-plot' });
  plot.appendChild(svg);
  plot.appendChild(slider);
  const shows = h('p', { class: 'tl-axis-shows', 'data-testid': 'tl-axis-shows' });
  const legend = h('ul', { class: 'tl-legend', 'data-testid': 'tl-legend', 'aria-label': t('axis.legend') });
  const hint = h('p', { class: 'tl-axis-hint' });

  const button = (id: string, text: string, label: string, act: () => void) => {
    const b = h('button', { type: 'button', class: 'tl-tool', 'data-testid': id, 'aria-label': label, title: label }, text);
    b.addEventListener('click', () => !o.paused() && act());
    return b;
  };
  const centreX = () => (scene.mode === 'place' && draftY !== null ? Math.min(1, Math.max(0, xOf(draftY, win, view))) : 0.5);
  const zoomBy = (f: number) => setWindow(zoomAt(win, centreX(), f, view));
  const viewRadio = (v: AxisView, label: string) => {
    const input = h('input', { type: 'radio', name: `tl-view-${uid}`, value: v, 'data-testid': `tl-view-${v}` });
    input.addEventListener('change', () => {
      if (input.checked) {
        view = v;
        o.onView?.(v);
        draw();
      }
    });
    return [input, h('label', { class: 'tl-view-opt' }, input, ' ', label)] as const;
  };
  const [logInput, logLabel] = viewRadio('log', t('axis.log'));
  const [linInput, linLabel] = viewRadio('linear', t('axis.linear'));
  const tools = h(
    'div',
    { class: 'tl-tools' },
    h(
      'div',
      { class: 'tl-tool-row' },
      button('tl-back', '◀', t('axis.back'), () => setWindow(pan(win, -0.3, view))),
      button('tl-zoom-out', '−', t('axis.zoomOut'), () => zoomBy(1 / 2.5)),
      button('tl-zoom-in', '+', t('axis.zoomIn'), () => zoomBy(2.5)),
      button('tl-forward', '▶', t('axis.forward'), () => setWindow(pan(win, 0.3, view))),
      button('tl-fit', '⤢', t('axis.fit'), () => setWindow(FULL))
    ),
    h('fieldset', { class: 'tl-view' }, h('legend', {}, t('axis.view')), logLabel, linLabel)
  );
  const element = h(
    'div',
    { class: 'tl-axis', dir: 'ltr', 'data-testid': 'tl-axis' },
    plot,
    shows,
    legend,
    tools,
    hint,
    live
  );

  /* ---------- Drawing ---------- */

  const el = (name: string, attrs: Record<string, string | number>, text?: string) => {
    const e = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const X = (y: number) => xOf(y, win, view) * px;

  function measure() {
    const w = plot.clientWidth;
    px = w > 50 ? w : 640;
  }

  function draw() {
    measure();
    clear(svg);
    svg.setAttribute('viewBox', `0 0 ${px} ${HEIGHT}`);
    svg.setAttribute('width', String(px));
    svg.setAttribute('aria-label', scene.ariaLabel);
    logInput.checked = view === 'log';
    linInput.checked = view === 'linear';
    hint.textContent = t(view === 'log' ? 'axis.logHint' : 'axis.linearHint');
    const defs = el('defs', {});
    const pat = el('pattern', { id: 'tl-hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
    pat.appendChild(el('line', { x1: 0, y1: 0, x2: 0, y2: 6, class: 'tl-hatch-line' }));
    defs.appendChild(pat);
    svg.appendChild(defs);
    // Ranges: the true range (hatched band, bold outline) and windows (brackets).
    for (const r of scene.ranges ?? []) {
      let a = X(r.lo);
      let b = X(r.hi);
      if (b < 0 || a > px) continue;
      a = Math.max(-2, a);
      b = Math.min(px + 2, b);
      const w = Math.max(3, b - a);
      if (r.style === 'true') {
        svg.appendChild(el('rect', { x: a - (w === 3 ? 1.5 : 0), y: AXIS_Y - 12, width: w, height: 24, class: 'tl-range', fill: 'url(#tl-hatch)', 'data-testid': 'tl-range' }));
      } else {
        const d = `M${a + 4} ${AXIS_Y - 16}H${a}V${AXIS_Y + 16}H${a + 4}M${b - 4} ${AXIS_Y - 16}H${b}V${AXIS_Y + 16}H${b - 4}`;
        svg.appendChild(el('path', { d, class: 'tl-bracket', 'data-testid': 'tl-window' }));
      }
    }
    // The axis line and ticks.
    svg.appendChild(el('line', { x1: 0, y1: AXIS_Y, x2: px, y2: AXIS_Y, class: 'tl-line' }));
    const label = (tk: Tick) => formatTick(tk.y, tk.ago, tt, locale);
    for (const tk of chooseTicks(win, view, px, label, textWidth)) {
      const x = X(tk.y);
      svg.appendChild(el('line', { x1: x, y1: AXIS_Y - 5, x2: x, y2: AXIS_Y + 5, class: 'tl-tick' }));
      const w = textWidth(label(tk));
      const lx = Math.max(w / 2, Math.min(px - w / 2, x));
      svg.appendChild(el('text', { x: lx, y: AXIS_Y + 24, class: 'tl-tick-label', 'text-anchor': 'middle', 'data-y': tk.y }, label(tk)));
    }
    // Marks with labels in up to three rows above the axis; the rest goes to the legend.
    clear(legend);
    const marks = (scene.marks ?? []).filter((m) => {
      const x = X(m.y);
      return x >= -0.5 && x <= px + 0.5;
    });
    const labelled = marks.map((m) => ({ x: X(m.y), width: textWidth(`${m.symbol} ${m.label}`) }));
    const rows = layoutLabels(labelled, px, ROWS);
    marks.forEach((m, i) => {
      const x = X(m.y);
      const g = el('g', { class: `tl-mark tl-mark-${m.style}`, 'data-testid': `tl-mark-${m.style}` });
      g.appendChild(el('text', { x, y: AXIS_Y + 5, 'text-anchor': 'middle', class: 'tl-mark-symbol' }, m.symbol));
      const row = rows[i];
      if (row !== null && row !== undefined) {
        const ty = LABEL_TOP + row * ROW_H;
        const w = labelled[i]!.width;
        const left = Math.max(0, Math.min(px - w, x - w / 2));
        g.appendChild(el('line', { x1: x, y1: ty + 3, x2: x, y2: AXIS_Y - 8, class: 'tl-leader' }));
        g.appendChild(el('text', { x: left, y: ty, class: 'tl-mark-label' }, `${m.symbol} ${m.label}`));
      } else legend.appendChild(h('li', {}, `${m.symbol} ${m.label}`));
      svg.appendChild(g);
    });
    // Marks outside the window are listed too, so nothing is lost when zoomed in.
    for (const m of scene.marks ?? []) if (!marks.includes(m)) legend.appendChild(h('li', { class: 'tl-off' }, `${m.symbol} ${m.label} (${X(m.y) < 0 ? '◀' : '▶'})`));
    legend.hidden = legend.childElementCount === 0;
    const [l, r] = windowYears(win);
    shows.textContent = t('axis.shows', { from: formatYear(Math.round(l), tt, locale), to: formatYear(Math.min(2020, Math.round(r)), tt, locale) });
    drawSlider();
  }

  function drawSlider() {
    const place = scene.mode === 'place';
    slider.hidden = !place;
    if (!place) return;
    const has = draftY !== null;
    const x = has ? xOf(draftY!, win, view) : 0.5;
    const glyph = slider.firstElementChild as HTMLElement;
    glyph.textContent = !has ? '◇' : x < 0 ? '◀' : x > 1 ? '▶' : '◆';
    slider.style.left = `${Math.min(1, Math.max(0, x)) * 100}%`;
    slider.setAttribute('aria-valuemin', String(Math.round(win.lo * 1000) / 1000));
    slider.setAttribute('aria-valuemax', String(Math.round(win.hi * 1000) / 1000));
    slider.setAttribute('aria-valuenow', String(Math.round((has ? Math.log10(2030 - draftY!) : (win.lo + win.hi) / 2) * 1000) / 1000));
    slider.setAttribute('aria-valuetext', has ? formatYear(draftY!, tt, locale) : t('when.noAnswer'));
    slider.dataset.state = has ? 'set' : 'empty';
  }

  function setWindow(w: Window) {
    cancelAnimationFrame(anim);
    win = clampWindow(w);
    draw();
  }

  /* ---------- Pointer: tap/drag places (place mode) or pans; two pointers pinch ---------- */

  const pointers = new Map<number, { x: number; sx: number }>();
  let pinch: { d: number; win: Window; cx: number } | null = null;
  let moved = 0;
  let dragFrom: Window | null = null;
  const relX = (clientX: number) => {
    const r = plot.getBoundingClientRect();
    return r.width > 0 ? (clientX - r.left) / r.width : 0.5;
  };
  const placeAt = (clientX: number): number => snapYear(yearAt(Math.min(1, Math.max(0, relX(clientX))), win, view));

  plot.addEventListener('pointerdown', (e) => {
    if (o.paused()) return;
    if (e.target === slider || slider.contains(e.target as Node)) slider.focus();
    plot.setPointerCapture?.(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, sx: e.clientX });
    moved = 0;
    dragFrom = win;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()] as unknown as [{ x: number }, { x: number }];
      pinch = { d: Math.abs(a.x - b.x), win, cx: relX((a.x + b.x) / 2) };
    } else if (scene.mode === 'place') {
      draftY = placeAt(e.clientX);
      drawSlider();
    }
  });
  plot.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    moved = Math.max(moved, Math.abs(e.clientX - p.sx));
    p.x = e.clientX;
    if (pointers.size === 2 && pinch) {
      const [a, b] = [...pointers.values()] as unknown as [{ x: number }, { x: number }];
      const d = Math.abs(a.x - b.x);
      if (pinch.d > 10 && d > 10) {
        win = zoomAt(pinch.win, pinch.cx, d / pinch.d, view);
        draw();
      }
    } else if (pointers.size === 1) {
      if (scene.mode === 'place') {
        draftY = placeAt(e.clientX);
        drawSlider();
      } else if (dragFrom && moved >= 4) {
        const r = plot.getBoundingClientRect();
        win = pan(dragFrom, -(e.clientX - p.sx) / (r.width || px), view);
        draw();
      }
    }
  });
  const end = (e: PointerEvent) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0 && scene.mode === 'place' && e.type === 'pointerup' && draftY !== null && !o.paused()) o.onPlace(draftY, 'pointer');
    if (pointers.size === 0) dragFrom = null;
  };
  plot.addEventListener('pointerup', end);
  plot.addEventListener('pointercancel', end);
  plot.addEventListener(
    'wheel',
    (e) => {
      if (o.paused() || e.deltaY === 0) return;
      e.preventDefault();
      setWindow(zoomAt(win, Math.min(1, Math.max(0, relX(e.clientX))), e.deltaY < 0 ? 1.25 : 0.8, view));
    },
    { passive: false }
  );

  /* ---------- Keyboard on the slider (§ 12.4) ---------- */

  let keyChanged = false;
  const stepTo = (dx: number) => {
    const from = draftY ?? yearAt(0.5, win, view);
    let x = (draftY === null ? 0.5 : xOf(from, win, view)) + dx;
    let y = snapYear(yearAt(Math.min(1, Math.max(0, x)), win, view));
    // Make progress even where snapping is coarse.
    for (let i = 0; i < 20 && draftY !== null && y === draftY && x > 0 && x < 1; i++) {
      x += dx;
      y = snapYear(yearAt(Math.min(1, Math.max(0, x)), win, view));
    }
    return y;
  };
  slider.addEventListener('keydown', (e) => {
    if (o.paused()) return;
    let y: number | null = null;
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        y = stepTo(-0.01);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        y = stepTo(0.01);
        break;
      case 'PageDown':
        y = stepTo(-0.1);
        break;
      case 'PageUp':
        y = stepTo(0.1);
        break;
      case 'Home':
        y = snapYear(yearAt(0, win, view));
        break;
      case 'End':
        y = snapYear(yearAt(1, win, view));
        break;
      case '+':
      case '=':
        e.preventDefault();
        zoomBy(2.5);
        return;
      case '-':
      case '_':
        e.preventDefault();
        zoomBy(1 / 2.5);
        return;
      case '0':
        e.preventDefault();
        setWindow(FULL);
        return;
      default:
        return;
    }
    e.preventDefault();
    if (y !== null) {
      draftY = y;
      keyChanged = true;
      drawSlider();
      o.onPlace(y, 'keyboard');
    }
  });
  slider.addEventListener('keyup', () => {
    if (!keyChanged || draftY === null) return;
    keyChanged = false;
    live.textContent = o.describe(draftY);
  });

  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => draw()) : null;
  ro?.observe(plot);

  return {
    element,
    show(s) {
      scene = s;
      draftY = s.mode === 'place' ? (s.value ?? null) : null;
      draw();
    },
    fit(w, animate = false) {
      const target = clampWindow(w);
      cancelAnimationFrame(anim);
      if (!animate || o.reducedMotion || typeof requestAnimationFrame !== 'function') {
        win = target;
        draw();
        return;
      }
      const from = win;
      const start = performance.now();
      const stepFn = (now: number) => {
        const k = Math.min(1, (now - start) / 200);
        const e = k * (2 - k);
        win = clampWindow({ lo: from.lo + (target.lo - from.lo) * e, hi: from.hi + (target.hi - from.hi) * e });
        draw();
        if (k < 1) anim = requestAnimationFrame(stepFn);
      };
      anim = requestAnimationFrame(stepFn);
    },
    window: () => win,
    view: () => view,
    setView(v) {
      view = v;
      draw();
    },
    dispose() {
      cancelAnimationFrame(anim);
      ro?.disconnect();
    }
  };
}
