/**
 * Time-series charts (design § 12.1): the focus chart (one species, larger, with axes, goal line, change markers,
 * history, ghost lines, prediction overlays and the sketch handles), the small multiples (one row per species), the
 * shared chart (all species on one log-like scale) and the "Show the numbers" table. One SVG each, always LTR (time
 * runs left to right in every locale); lines differ by dash pattern and markers, never by colour alone.
 */
import { announce, h } from '@wp/ui';
import { glyph, ilog2, svg } from './glyphs';
import { habitatDef, type Habitat } from './habitats';
import type { Ui } from './ui';

export const VBW = 600;
const M = { l: 46, r: 14, t: 16, b: 28 };

/** One line of the focus chart: `values[k]` is the value in week `x0 + k` (null: no data). */
export interface Line {
  readonly values: readonly (number | null)[];
  /** CSS class (stroke style); `eco-line-model`, `-ghost`, `-nothing`, `-way`, `-sketch`, `-history`. */
  readonly cls: string;
}

export interface SketchSpec {
  readonly weeks: readonly number[];
  readonly values: readonly number[];
  readonly max: number;
  readonly editable: boolean;
  /** While dragging (no save) and when a move is finished (save). */
  onInput(values: number[]): void;
  onCommit(values: number[]): void;
  /** "week 26: about 120". */
  valueText(week: number, value: number): string;
  label(week: number): string;
}

export interface FocusOptions {
  readonly ui: Ui;
  /** First and last week on the x axis (x0 may be negative: the history before the change). */
  readonly x0: number;
  readonly x1: number;
  readonly lines: readonly Line[];
  /** Fixed top of the y axis (u); otherwise from the data. */
  readonly ymax?: number | undefined;
  readonly goal?: { readonly value: number; readonly label: string } | undefined;
  readonly markers?: readonly { readonly week: number; readonly n: number }[] | undefined;
  /** A level answer: the shaded band at week `week` between lo and hi (u). */
  readonly band?: { readonly week: number; readonly lo: number; readonly hi: number } | undefined;
  /** A week to mark with a thin vertical line (the asked week). */
  readonly mark?: number | undefined;
  readonly sketch?: SketchSpec | undefined;
  readonly tall?: boolean | undefined;
  /** Accessible name (the "what happened" summary). */
  readonly label: string;
  /** The cursor's live text for a week. */
  describe(week: number): string;
  readonly testid?: string | undefined;
}

/** A round axis top: 1, 2 or 5 × 10^k above `v` (at least 1,000 u). */
export function niceMax(v: number): number {
  let m = 1000;
  for (;;) {
    for (const f of [1, 2, 5]) if (f * m >= v) return f * m;
    m *= 10;
  }
}

/** A tick step in weeks giving at most 8 ticks. */
export function weekStep(span: number): number {
  for (const s of [1, 2, 4, 8, 13, 26, 52, 104]) if (span / s <= 8) return s;
  return 208;
}

function pathOf(points: readonly (readonly [number, number] | null)[]): string {
  let d = '';
  let pen = false;
  for (const p of points) {
    if (!p) {
      pen = false;
      continue;
    }
    d += `${pen ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    pen = true;
  }
  return d;
}

/** The focus chart with its cursor (←/→, Home/End, PageUp/PageDown; a click sets it) and optional sketch handles. */
export function focusChart(o: FocusOptions): HTMLElement {
  const VBH = o.tall ? 520 : 300;
  const pw = VBW - M.l - M.r;
  const ph = VBH - M.t - M.b;
  const span = Math.max(1, o.x1 - o.x0);
  let top = o.ymax ?? 0;
  if (o.ymax === undefined) {
    for (const l of o.lines) for (const v of l.values) if (v !== null && v > top) top = v;
    if (o.goal) top = Math.max(top, o.goal.value);
    if (o.band) top = Math.max(top, o.band.hi === Number.POSITIVE_INFINITY ? o.band.lo * 1.3 : o.band.hi);
    top = niceMax(top * 1.05);
  }
  const X = (w: number) => M.l + ((w - o.x0) / span) * pw;
  const Y = (v: number) => M.t + ph - (Math.min(v, top) / top) * ph;
  const s = svg('svg', { viewBox: `0 0 ${VBW} ${VBH}`, class: 'eco-chart-svg', 'aria-hidden': 'true', focusable: 'false' });
  // History before the change (shaded), axes and ticks.
  if (o.x0 < 0) {
    s.append(svg('rect', { x: X(o.x0), y: M.t, width: X(0) - X(o.x0), height: ph, class: 'eco-history' }));
    s.append(svg('text', { x: (X(o.x0) + X(0)) / 2, y: M.t + 12, class: 'eco-axis-text eco-mid' }, document.createTextNode(o.ui.t('chart.before'))));
  }
  s.append(svg('path', { d: `M${M.l} ${M.t}V${M.t + ph}H${M.l + pw}`, class: 'eco-axis' }));
  for (const f of [0, 0.5, 1]) {
    const y = M.t + ph - f * ph;
    s.append(svg('path', { d: `M${M.l - 4} ${y}H${M.l + pw}`, class: f === 0 ? 'eco-axis' : 'eco-grid' }));
    s.append(svg('text', { x: M.l - 6, y: y + 4, class: 'eco-axis-text eco-end' }, document.createTextNode(o.ui.amount(top * f))));
  }
  const step = weekStep(span);
  const first = Math.ceil(o.x0 / step) * step + 0;
  for (let w = first; w <= o.x1; w += step) {
    s.append(svg('path', { d: `M${X(w)} ${M.t + ph}v5`, class: 'eco-axis' }));
    s.append(svg('text', { x: X(w), y: M.t + ph + 18, class: 'eco-axis-text eco-mid', 'data-week': w + 0 }, document.createTextNode(o.ui.int(w + 0))));
  }
  if (o.goal) {
    const y = Y(o.goal.value);
    s.append(svg('path', { d: `M${M.l} ${y}H${M.l + pw}`, class: 'eco-goal-line' }));
    s.append(svg('text', { x: M.l + pw - 4, y: y - 5, class: 'eco-axis-text eco-end eco-goal-text' }, document.createTextNode(o.goal.label)));
  }
  if (o.mark !== undefined) s.append(svg('path', { d: `M${X(o.mark)} ${M.t}V${M.t + ph}`, class: 'eco-mark' }));
  if (o.band) {
    const hi = Math.min(o.band.hi, top);
    const x = X(o.band.week);
    const wd = Math.max(14, pw * 0.04);
    s.append(svg('rect', { x: x - wd / 2, y: Y(hi), width: wd, height: Math.max(2, Y(o.band.lo) - Y(hi)), class: 'eco-band', 'data-testid': 'eco-band' }));
  }
  for (const l of o.lines) {
    const pts = l.values.map((v, k) => (v === null ? null : ([X(o.x0 + k), Y(v)] as const)));
    s.append(svg('path', { d: pathOf(pts), class: `eco-line ${l.cls}` }));
  }
  for (const m of o.markers ?? []) {
    const x = X(m.week);
    s.append(svg('path', { d: `M${x - 5} ${M.t - 10}h10l-5 8z`, class: 'eco-marker' }));
    s.append(svg('text', { x: x + 7, y: M.t - 3, class: 'eco-axis-text' }, document.createTextNode(o.ui.int(m.n))));
  }
  const cursorLine = svg('path', { d: '', class: 'eco-cursor' });
  s.append(cursorLine);
  const live = h('p', { class: 'eco-cursor-live', 'aria-live': 'polite', 'data-testid': 'eco-cursor-live' });
  const help = h('p', { class: 'sr-only', id: `${o.testid ?? 'eco-focus'}-help` }, o.ui.t('chart.help'));
  const box = h('div', { class: `eco-chart${o.tall ? ' eco-chart-tall' : ''}`, dir: 'ltr' }, s);
  const wrap = h(
    'div',
    {
      class: 'eco-focus',
      role: 'group',
      'aria-roledescription': o.ui.t('chart.roledesc'),
      'aria-label': o.label,
      'aria-describedby': `${o.testid ?? 'eco-focus'}-help`,
      tabindex: 0,
      'data-testid': o.testid ?? 'eco-focus-chart'
    },
    box,
    help,
    live
  );
  let cursor: number | null = null;
  const setCursor = (w: number) => {
    cursor = Math.max(o.x0, Math.min(o.x1, w));
    cursorLine.setAttribute('d', `M${X(cursor)} ${M.t}V${M.t + ph}`);
    announce(live, o.describe(cursor));
  };
  wrap.addEventListener('keydown', (e) => {
    if (e.target !== wrap) return;
    const now = cursor ?? o.x1;
    const to: Record<string, number> = { ArrowLeft: now - 1, ArrowRight: now + 1, Home: o.x0, End: o.x1, PageUp: now - 8, PageDown: now + 8 };
    const w = to[e.key];
    if (w === undefined) return;
    e.preventDefault();
    setCursor(cursor === null && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') ? o.x1 : w);
  });
  s.addEventListener('click', (e) => {
    const r = s.getBoundingClientRect();
    if (!r.width) return;
    const vx = ((e.clientX - r.left) / r.width) * VBW;
    setCursor(Math.round(o.x0 + ((vx - M.l) / pw) * span));
  });
  if (o.sketch) box.append(sketchLayer(o.sketch, X, Y, top, VBH, s));
  return wrap;
}

/** The sketch: six handles (`role="slider"`, 44 px) over the chart, joined by a dashed line from the value before. */
function sketchLayer(sk: SketchSpec, X: (w: number) => number, Y: (v: number) => number, top: number, VBH: number, s: SVGSVGElement): HTMLElement {
  const values = [...sk.values];
  const line = svg('path', { d: '', class: 'eco-line eco-line-sketch', 'data-testid': 'eco-sketch-line' });
  s.append(line);
  const layer = h('div', { class: 'eco-handles' });
  const stepOf = Math.max(1, Math.round(sk.max / 50));
  const draw = () => {
    line.setAttribute('d', pathOf(sk.weeks.map((w, k) => [X(w), Y(values[k]!)] as const)));
    handles.forEach((el, k) => {
      el.style.left = `${(X(sk.weeks[k]!) / VBW) * 100}%`;
      el.style.top = `${(Y(values[k]!) / VBH) * 100}%`;
      el.setAttribute('aria-valuenow', String(values[k]));
      el.setAttribute('aria-valuetext', sk.valueText(sk.weeks[k]!, values[k]!));
    });
  };
  const clamp = (v: number) => Math.max(0, Math.min(sk.max, Math.round(v)));
  const handles = sk.weeks.map((w, k) => {
    const el = h('div', {
      class: 'eco-handle',
      role: 'slider',
      tabindex: sk.editable ? 0 : -1,
      'aria-label': sk.label(w),
      'aria-valuemin': 0,
      'aria-valuemax': sk.max,
      'aria-orientation': 'vertical',
      'aria-readonly': sk.editable ? undefined : 'true',
      'data-testid': `eco-handle-${k}`
    });
    if (sk.editable) {
      el.addEventListener('keydown', (e) => {
        const big = Math.max(stepOf, Math.round(sk.max / 10));
        const map: Record<string, number> = { ArrowUp: values[k]! + stepOf, ArrowRight: values[k]! + stepOf, ArrowDown: values[k]! - stepOf, ArrowLeft: values[k]! - stepOf, PageUp: values[k]! + big, PageDown: values[k]! - big, Home: 0, End: sk.max };
        const v = map[e.key];
        if (v === undefined) return;
        e.preventDefault();
        values[k] = clamp(v);
        draw();
        sk.onCommit([...values]);
      });
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        el.setPointerCapture?.(e.pointerId);
        el.focus();
        const move = (ev: PointerEvent) => {
          const r = s.getBoundingClientRect();
          if (!r.height) return;
          const vy = ((ev.clientY - r.top) / r.height) * VBH;
          const plotTop = Y(top);
          const plotBottom = Y(0);
          const v = ((plotBottom - vy) / (plotBottom - plotTop)) * top;
          values[k] = clamp(Math.round(v / (stepOf / 2)) * (stepOf / 2));
          draw();
          sk.onInput([...values]);
        };
        const up = () => {
          el.removeEventListener('pointermove', move);
          el.removeEventListener('pointerup', up);
          el.removeEventListener('pointercancel', up);
          sk.onCommit([...values]);
        };
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
        move(e);
      });
    }
    return el;
  });
  layer.append(...handles);
  draw();
  return layer;
}

/* ---------- Small multiples, shared chart, numbers ---------- */

export interface SeriesRow {
  /** Species id, or a pool: nutrients, dead, water. */
  readonly id: string;
  readonly values: readonly number[];
}

/** Rows to show: present species (any value in the window) then the pools. */
export function rowsOf(habitat: Habitat, samples: readonly (readonly number[])[]): SeriesRow[] {
  const hab = habitatDef(habitat);
  const n = hab.species.length;
  const rows: SeriesRow[] = [];
  hab.species.forEach((sp, i) => {
    const v = samples.map((x) => x[i]!);
    if (v.some((x) => x > 0)) rows.push({ id: sp.id, values: v });
  });
  rows.push({ id: 'nutrients', values: samples.map((x) => x[n]!) });
  rows.push({ id: 'dead', values: samples.map((x) => x[n + 1]!) });
  if (habitat === 'meadow') rows.push({ id: 'water', values: samples.map((x) => x[n + 2]!) });
  return rows;
}

const POOLS = new Set(['nutrients', 'dead', 'water']);

function icon(id: string): SVGSVGElement {
  const g = POOLS.has(id) ? svg('g', { class: `eco-glyph eco-pool-${id}` }, svg('rect', { x: -6, y: -6, width: 12, height: 12, rx: 2, class: 'f s' })) : glyph(id);
  return svg('svg', { viewBox: '-12 -12 24 24', class: 'eco-icon', 'aria-hidden': 'true', focusable: 'false' }, g);
}

/** One row per species (glyph, name, sparkline with its own scale, current value), pools as thin grey rows. */
export function smallMultiples(ui: Ui, rows: readonly SeriesRow[], x0: number, x1: number): HTMLElement {
  const W = 200;
  const H = 28;
  const list = h('ul', { class: 'eco-rows', 'data-testid': 'eco-rows' });
  for (const r of rows) {
    const max = Math.max(1, ...r.values);
    const n = Math.max(1, x1 - x0);
    const pts = r.values.map((v, k) => [(k / n) * W, H - 2 - (v / max) * (H - 4)] as const);
    const spark = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'eco-spark', 'aria-hidden': 'true', focusable: 'false', preserveAspectRatio: 'none' }, svg('path', { d: pathOf(pts), class: `eco-line ${POOLS.has(r.id) ? 'eco-line-pool' : 'eco-line-model'}` }));
    const last = r.values[r.values.length - 1] ?? 0;
    list.append(
      h(
        'li',
        { class: `eco-row${POOLS.has(r.id) ? ' eco-row-pool' : ''}`, 'data-id': r.id },
        icon(r.id),
        h('span', { class: 'eco-row-name' }, POOLS.has(r.id) ? ui.t(`chart.${r.id}`) : ui.name(r.id)),
        h('span', { class: 'eco-row-spark', dir: 'ltr' }, spark),
        h('bdi', { class: 'eco-row-value' }, ui.amount(last))
      )
    );
  }
  return list;
}

const DASHES = ['', '8 4', '2 4', '10 3 2 3', '4 4', '1 3', '12 6', '6 2 2 2'];

/** y = log2(1 + u/1000) without Math.log: the integer part from ilog2, the rest interpolated linearly. */
export function log2ish(u: number): number {
  const x = 1 + u / 1000;
  const k = ilog2(x);
  const lo = 1 << k;
  return k + (x - lo) / lo;
}

/** All species in one chart on a log-like scale; lines differ by dash pattern and glyph markers every 8 weeks. */
export function sharedChart(ui: Ui, rows: readonly SeriesRow[], x0: number, x1: number): HTMLElement {
  const VBH = 300;
  const pw = VBW - M.l - M.r;
  const ph = VBH - M.t - M.b;
  const species = rows.filter((r) => !POOLS.has(r.id));
  const top = Math.max(1, ...species.flatMap((r) => r.values.map(log2ish)));
  const span = Math.max(1, x1 - x0);
  const X = (w: number) => M.l + ((w - x0) / span) * pw;
  const Y = (v: number) => M.t + ph - (log2ish(v) / top) * ph;
  const s = svg('svg', { viewBox: `0 0 ${VBW} ${VBH}`, class: 'eco-chart-svg', 'aria-hidden': 'true', focusable: 'false' });
  s.append(svg('path', { d: `M${M.l} ${M.t}V${M.t + ph}H${M.l + pw}`, class: 'eco-axis' }));
  const step = weekStep(span);
  for (let w = Math.ceil(x0 / step) * step + 0; w <= x1; w += step) s.append(svg('text', { x: X(w), y: M.t + ph + 18, class: 'eco-axis-text eco-mid' }, document.createTextNode(ui.int(w + 0))));
  for (const u of [1000, 10_000, 100_000, 1_000_000]) {
    if (log2ish(u) > top) break;
    s.append(svg('path', { d: `M${M.l} ${Y(u)}H${M.l + pw}`, class: 'eco-grid' }));
    s.append(svg('text', { x: M.l - 6, y: Y(u) + 4, class: 'eco-axis-text eco-end' }, document.createTextNode(ui.amount(u))));
  }
  const legend = h('ul', { class: 'eco-legend' });
  species.forEach((r, k) => {
    const path = svg('path', { d: pathOf(r.values.map((v, i) => [X(x0 + i), Y(v)] as const)), class: 'eco-line eco-line-shared', 'stroke-dasharray': DASHES[k % DASHES.length]! });
    s.append(path);
    for (let i = 0; i < r.values.length; i += 8) {
      const g = glyph(r.id);
      g.setAttribute('transform', `translate(${X(x0 + i).toFixed(1)} ${Y(r.values[i]!).toFixed(1)}) scale(0.6)`);
      s.append(g);
    }
    legend.append(h('li', {}, icon(r.id), svg('svg', { viewBox: '0 0 30 6', class: 'eco-legend-line', 'aria-hidden': 'true' }, svg('path', { d: 'M0 3H30', class: 'eco-line eco-line-shared', 'stroke-dasharray': DASHES[k % DASHES.length]! })), ` ${ui.name(r.id)}`));
  });
  return h('div', { class: 'eco-shared', 'data-testid': 'eco-shared' }, h('div', { class: 'eco-chart', dir: 'ltr' }, s), legend);
}

/** "Show the numbers": a table of every 4th week (and the last), all species and pools. */
export function numbersTable(ui: Ui, rows: readonly SeriesRow[], x0: number): HTMLElement {
  const n = rows[0]?.values.length ?? 0;
  const weeks: number[] = [];
  for (let k = 0; k < n; k++) if ((x0 + k) % 4 === 0 || k === n - 1) weeks.push(k);
  const table = h(
    'table',
    { class: 'eco-table', 'data-testid': 'eco-table' },
    h('caption', {}, ui.t('chart.units')),
    h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, ui.t('chart.week')), ...rows.map((r) => h('th', { scope: 'col' }, POOLS.has(r.id) ? ui.t(`chart.${r.id}`) : ui.name(r.id))))),
    h('tbody', {}, ...weeks.map((k) => h('tr', {}, h('th', { scope: 'row' }, ui.int(x0 + k)), ...rows.map((r) => h('td', {}, ui.amount(r.values[k] ?? 0))))))
  );
  return h('details', { class: 'eco-numbers', 'data-testid': 'eco-numbers' }, h('summary', {}, ui.t('chart.numbers')), h('div', { class: 'eco-table-wrap' }, table));
}

/** The cursor text: "Week 14: Algae 72, Water fleas 40 …" (at most 6 species, then "…and 3 more in the table"). */
export function cursorText(ui: Ui, rows: readonly SeriesRow[], week: number, k: number): string {
  const sp = rows.filter((r) => !POOLS.has(r.id) && (r.values[k] ?? 0) > 0);
  const shown = sp.slice(0, 6).map((r) => ui.t('scene.item', { name: ui.name(r.id), v: ui.amount(r.values[k] ?? 0) }));
  const list = shown.join(', ') + (sp.length > 6 ? ` ${ui.t('chart.more', { n: ui.int(sp.length - 6) })}` : '');
  return ui.t('chart.cursor', { n: ui.int(week), list: list || ui.t('scene.empty') });
}
