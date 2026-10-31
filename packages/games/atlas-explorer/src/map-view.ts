/**
 * The world map (design § 14): one SVG in Equal Earth coordinates, built once; zoom and pan change only the
 * `viewBox`. Pointer, touch and keyboard input; a crosshair cursor with polite announcements; dynamic layers (scene)
 * for markers, outlines, lines and labels. The map is never mirrored in RTL. No colour-only information: styles
 * differ by pattern, line style and text.
 */
import type { Translator } from '@wp/game-core';
import { announce, h } from '@wp/ui';
import { inside, type Atlas, type Box, type Shape } from './atlas';
import { EE_X_MAX, EE_Y_MAX, POLAR_CIRCLE, TROPIC, greatCircle, project, unproject } from './geo';

const NS = 'http://www.w3.org/2000/svg';
const S = 1000;
const WORLD_W = 2 * EE_X_MAX * S + 60;
const WORLD_H = 2 * EE_Y_MAX * S + 60;
const MAX_ZOOM = 8;

/** Projected SVG coordinates (y down) of a lon/lat point. */
export function toSvg(lon: number, lat: number): [number, number] {
  const [x, y] = project(lon, lat);
  return [x * S, -y * S];
}

const svg = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
};

const r1 = (v: number) => Math.round(v * 10) / 10;

/** An SVG path for flat lon/lat rings (closed) or lines (open). */
export function pathOf(parts: readonly ArrayLike<number>[], closed: boolean): string {
  let d = '';
  for (const p of parts) {
    for (let i = 0; i < p.length; i += 2) {
      const [x, y] = toSvg(p[i]!, p[i + 1]!);
      d += `${i ? 'L' : 'M'}${r1(x)} ${r1(y)}`;
    }
    if (closed) d += 'Z';
  }
  return d;
}

export type ShapeStyle = 'target' | 'guess' | 'neighbour' | 'current' | 'outline' | 'place' | 'feature';
export type LineId = 'equator' | 'cancer' | 'capricorn' | 'arctic' | 'antarctic' | 'meridian';

export interface Scene {
  /** Country borders drawn (hard mode hides them for city and feature targets: coastlines only). */
  readonly borders: boolean;
  /** Graticule step and which latitude labels to show. */
  readonly graticule: { readonly step: 10 | 30; readonly labels: 'all' | 'equator' | 'none' } | null;
  /** Special parallels drawn with their names. */
  readonly lines?: readonly LineId[];
  readonly shapes?: readonly { readonly kind: 'country' | 'feature' | 'other' | 'disputed'; readonly id: string; readonly style: ShapeStyle }[];
  readonly markers?: readonly { readonly lon: number; readonly lat: number; readonly symbol: string; readonly label?: string; readonly style: 'marker' | 'place' | 'target' | 'pick' }[];
  readonly arcs?: readonly { readonly from: readonly [number, number]; readonly to: readonly [number, number]; readonly label?: string; readonly style?: 'dashed' | 'solid' | 'arrow' }[];
  readonly polylines?: readonly { readonly pts: readonly (readonly [number, number])[]; readonly style: 'route' | 'best'; readonly numbers?: boolean }[];
  readonly labels?: readonly { readonly lon: number; readonly lat: number; readonly text: string }[];
  readonly meridians?: readonly { readonly lon: number; readonly label: string }[];
  readonly parallels?: readonly { readonly lat: number; readonly label: string }[];
  /** Accessible summary of what the map shows now. */
  readonly ariaLabel: string;
}

export interface MapOptions {
  readonly atlas: Atlas;
  readonly t: Translator;
  readonly reducedMotion: boolean;
  /** A tap or click (not a drag), or Enter on the keyboard cursor. */
  onPick(lon: number, lat: number, via: 'pointer' | 'keyboard', client?: { x: number; y: number }): void;
  /** The announcement for the cursor position (after a key is released). */
  describe(lon: number, lat: number): string;
  /** Labels of the special lines (translated). */
  lineLabel(id: LineId): string;
  /** Latitude label ("30° N"). */
  latLabel(lat: number): string;
  paused(): boolean;
}

export interface MapView {
  readonly element: HTMLElement;
  /** Draws the dynamic layers. */
  show(scene: Scene): void;
  /** Fits the view to a lon/lat box (animated unless reduced motion). */
  fit(box: Box): void;
  /** The box the "Fit" button and key 0 return to. */
  setHome(box: Box): void;
  /** Countries (or other units) with a dot near a client point: tiny countries a finger cannot hit (≤ radius px). */
  dotsNear(client: { x: number; y: number }, radiusPx: number): string[];
  /** The keyboard cursor, if placed. */
  cursor(): [number, number] | null;
  focus(): void;
  dispose(): void;
}

/** Countries too small to see at world view get a dot (km²). */
const DOT_KM2 = 3000;
let instances = 0;

export function createMapView(o: MapOptions): MapView {
  const { atlas, t } = o;
  const root = svg('svg', { class: 'ae-svg', 'aria-hidden': 'true', focusable: 'false', preserveAspectRatio: 'xMidYMid meet' });
  const defs = svg('defs');
  // Patterns (userSpaceOnUse in screen-sized units via patternTransform, updated on zoom).
  const pattern = (id: string, size: number, body: string) => {
    const p = svg('pattern', { id, width: size, height: size, patternUnits: 'userSpaceOnUse' });
    p.innerHTML = body;
    defs.append(p);
    return p;
  };
  // Pattern ids must be unique per document (several maps may exist, e.g. in tests).
  const uid = `ae-map${++instances}`;
  const patterns = [
    pattern(`${uid}-stripes`, 8, '<rect width="8" height="8" class="ae-pt-bg"/><path d="M-2 2l4-4M0 8l8-8M6 10l4-4" class="ae-pt-stripe"/>'),
    pattern(`${uid}-dots`, 8, '<rect width="8" height="8" class="ae-pt-bg2"/><circle cx="4" cy="4" r="1.6" class="ae-pt-dot"/>'),
    pattern(`${uid}-hatch`, 8, '<rect width="8" height="8" class="ae-pt-hatchbg"/><path d="M0 0l8 8M8 0l-8 8" class="ae-pt-hatch"/>')
  ];
  root.append(defs);

  const sea = svg('path', { class: 'ae-sea' });
  // The world outline: the projected ±180° meridians.
  {
    let d = '';
    for (let lat = -90; lat <= 90; lat += 2) {
      const [x, y] = toSvg(-180, lat);
      d += `${lat === -90 ? 'M' : 'L'}${r1(x)} ${r1(y)}`;
    }
    for (let lat = 90; lat >= -90; lat -= 2) {
      const [x, y] = toSvg(180, lat);
      d += `L${r1(x)} ${r1(y)}`;
    }
    sea.setAttribute('d', `${d}Z`);
  }
  const gGrat = svg('g', { class: 'ae-grat' });
  const gCoast = svg('g', { class: 'ae-coast' });
  const gLand = svg('g', { class: 'ae-land' });
  const gHatch = svg('g', { class: 'ae-hatched' });
  const gLakes = svg('g', { class: 'ae-lakes' });
  const gDots = svg('g', { class: 'ae-dots' });
  const gScene = svg('g', { class: 'ae-scene' });
  const gFixed = svg('g', { class: 'ae-fixed' });
  root.append(sea, gGrat, gCoast, gLand, gLakes, gHatch, gDots, gScene, gFixed);

  // Base layers, built once.
  const shapePaths = new Map<string, string>();
  const addShape = (key: string, s: Shape) => {
    const d = pathOf(s.rings, true);
    shapePaths.set(key, d);
    gCoast.append(svg('path', { d, class: 'ae-coastline' }));
    gLand.append(svg('path', { d, class: 'ae-country', 'data-id': key }));
  };
  for (const c of atlas.countries) addShape(`country:${c.id}`, c);
  for (const x of atlas.others) addShape(`other:${x.id}`, x);
  for (const d of atlas.disputed) {
    const p = pathOf(d.rings, true);
    shapePaths.set(`disputed:${d.id}`, p);
    gHatch.append(svg('path', { d: p, class: 'ae-disputed', fill: `url(#${uid}-hatch)` }));
  }
  for (const f of atlas.features) if (f.kind === 'lake') gLakes.append(svg('path', { d: pathOf(f.rings, true), class: 'ae-lake' }));
  const dots = atlas.countries.filter((c) => c.areaMax < DOT_KM2);
  const dotEls = dots.map((c) => {
    const [x, y] = toSvg(c.label[0], c.label[1]);
    const el = svg('circle', { cx: r1(x), cy: r1(y), r: 3, class: 'ae-dot', 'data-id': c.id });
    gDots.append(el);
    return el;
  });

  // Graticule (rebuilt when the step changes).
  let gratStep = 0;
  const buildGraticule = (step: number) => {
    if (step === gratStep) return;
    gratStep = step;
    gGrat.replaceChildren();
    for (let lat = -90 + step; lat < 90; lat += step) {
      const [x1, y] = toSvg(-180, lat);
      const [x2] = toSvg(180, lat);
      gGrat.append(svg('path', { d: `M${r1(x1)} ${r1(y)}H${r1(x2)}`, class: 'ae-gl' }));
    }
    for (let lon = -180 + step; lon < 180; lon += step) {
      let d = '';
      for (let lat = -90; lat <= 90; lat += 3) {
        const [x, y] = toSvg(lon, lat);
        d += `${lat === -90 ? 'M' : 'L'}${r1(x)} ${r1(y)}`;
      }
      gGrat.append(svg('path', { d, class: 'ae-gl' }));
    }
  };

  /* ---------- View state ---------- */

  let cx = 0;
  let cy = 0;
  let zoom = 1;
  let home: Box = [-180, -90, 180, 90];
  let aspect = 2;
  let cursor: [number, number] | null = null;
  let anim = 0;
  let resize: ResizeObserver | null = null;

  const viewWidth = () => {
    // The world fits in both directions at zoom 1.
    const w = Math.max(WORLD_W, WORLD_H * aspect);
    return w / zoom;
  };
  const clampCenter = () => {
    const w = viewWidth();
    const hgt = w / aspect;
    const maxX = Math.max(0, WORLD_W / 2 - w / 2);
    const maxY = Math.max(0, WORLD_H / 2 - hgt / 2);
    cx = Math.max(-maxX, Math.min(maxX, cx));
    cy = Math.max(-maxY, Math.min(maxY, cy));
  };
  /** Units per screen pixel (for fixed-size markers and patterns). */
  const unitsPerPx = () => {
    const width = wrap.clientWidth || 800;
    return viewWidth() / width;
  };
  const apply = () => {
    clampCenter();
    const w = viewWidth();
    const hgt = w / aspect;
    root.setAttribute('viewBox', `${r1(cx - w / 2)} ${r1(cy - hgt / 2)} ${r1(w)} ${r1(hgt)}`);
    const k = unitsPerPx();
    for (const p of patterns) p.setAttribute('patternTransform', `scale(${k.toPrecision(4)})`);
    for (const el of dotEls) el.setAttribute('r', (3.2 * k).toPrecision(4));
    for (const el of gFixed.querySelectorAll<SVGGElement>('[data-at]')) {
      const [x, y] = el.dataset.at!.split(',').map(Number) as [number, number];
      el.setAttribute('transform', `translate(${r1(x)} ${r1(y)}) scale(${k.toPrecision(4)})`);
    }
    zoomIn.disabled = zoom >= MAX_ZOOM - 1e-9;
    zoomOut.disabled = zoom <= 1 + 1e-9;
  };
  const setView = (x: number, y: number, z: number, animate = false) => {
    const target = { x, y, z: Math.max(1, Math.min(MAX_ZOOM, z)) };
    cancelAnimationFrame(anim);
    if (!animate || o.reducedMotion || typeof requestAnimationFrame !== 'function') {
      cx = target.x;
      cy = target.y;
      zoom = target.z;
      apply();
      return;
    }
    const from = { x: cx, y: cy, z: zoom };
    const start = performance.now();
    const stepFrame = (now: number) => {
      const f = Math.min(1, (now - start) / 200);
      const e = f * (2 - f);
      cx = from.x + (target.x - from.x) * e;
      cy = from.y + (target.y - from.y) * e;
      zoom = from.z * (target.z / from.z) ** e;
      apply();
      if (f < 1) anim = requestAnimationFrame(stepFrame);
    };
    anim = requestAnimationFrame(stepFrame);
  };
  const fitBox = (box: Box, animate: boolean) => {
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (let i = 0; i <= 8; i++)
      for (let j = 0; j <= 8; j++) {
        const [x, y] = toSvg(box[0] + ((box[2] - box[0]) * i) / 8, box[1] + ((box[3] - box[1]) * j) / 8);
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
    const pad = 1.15;
    const w = Math.max((x1 - x0) * pad, (y1 - y0) * pad * aspect, 120);
    setView((x0 + x1) / 2, (y0 + y1) / 2, Math.max(WORLD_W, WORLD_H * aspect) / w, animate);
  };

  /** Client pixel → SVG units → lon/lat (null off the map). */
  const clientToLonLat = (clientX: number, clientY: number): [number, number] | null => {
    const rect = root.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const w = viewWidth();
    const hgt = w / aspect;
    const x = cx - w / 2 + ((clientX - rect.left) / rect.width) * w;
    const y = cy - hgt / 2 + ((clientY - rect.top) / rect.height) * hgt;
    return unproject(x / S, -y / S);
  };

  /* ---------- DOM: wrapper, buttons, live region ---------- */

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'ae-map-live' });
  const zoomIn = h('button', { type: 'button', class: 'ae-mapbtn', 'aria-label': t('map.zoomIn'), 'data-testid': 'ae-zoom-in' }, '+');
  const zoomOut = h('button', { type: 'button', class: 'ae-mapbtn', 'aria-label': t('map.zoomOut'), 'data-testid': 'ae-zoom-out' }, '−');
  const fitBtn = h('button', { type: 'button', class: 'ae-mapbtn ae-fit', 'data-testid': 'ae-fit' }, t('map.fit'));
  const wrap = h(
    'div',
    {
      class: 'ae-map',
      tabindex: 0,
      role: 'application',
      'aria-roledescription': t('map.role'),
      'aria-label': t('map.label'),
      'aria-describedby': '',
      'data-testid': 'ae-map',
      dir: 'ltr'
    },
    root as unknown as HTMLElement
  );
  const element = h('div', { class: 'ae-mapwrap' }, wrap, h('div', { class: 'ae-mapbtns' }, zoomIn, zoomOut, fitBtn), live);
  const zoomBy = (f: number, around?: [number, number]) => {
    const nz = Math.max(1, Math.min(MAX_ZOOM, zoom * f));
    if (around) {
      // Keep the point under the pointer (or cursor) in place.
      const k = zoom / nz;
      setView(around[0] + (cx - around[0]) * k, around[1] + (cy - around[1]) * k, nz);
    } else setView(cx, cy, nz);
  };
  zoomIn.addEventListener('click', () => zoomBy(1.6));
  zoomOut.addEventListener('click', () => zoomBy(1 / 1.6));
  fitBtn.addEventListener('click', () => fitBox(home, true));

  /* ---------- Pointer and touch ---------- */

  const pointers = new Map<number, { x: number; y: number; sx: number; sy: number }>();
  let moved = 0;
  let pinch: { d: number; z: number } | null = null;
  wrap.addEventListener('pointerdown', (e) => {
    if (o.paused()) return;
    wrap.setPointerCapture?.(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
    if (pointers.size === 1) moved = 0;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()] as unknown as [{ x: number; y: number }, { x: number; y: number }];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: zoom };
      moved = 99;
    }
  });
  wrap.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    moved = Math.max(moved, Math.hypot(e.clientX - p.sx, e.clientY - p.sy));
    if (pointers.size === 1 && moved >= 8) {
      const k = unitsPerPx();
      setView(cx - dx * k, cy - dy * k, zoom);
    } else if (pointers.size === 2 && pinch) {
      const [a, b] = [...pointers.values()] as unknown as [{ x: number; y: number }, { x: number; y: number }];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.d > 0) setView(cx, cy, pinch.z * (d / pinch.d));
    }
  });
  const end = (e: PointerEvent) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0 && moved < 8 && e.type === 'pointerup' && !o.paused()) {
      const ll = clientToLonLat(e.clientX, e.clientY);
      if (ll) o.onPick(ll[0], ll[1], 'pointer', { x: e.clientX, y: e.clientY });
    }
  };
  wrap.addEventListener('pointerup', end);
  wrap.addEventListener('pointercancel', end);
  wrap.addEventListener(
    'wheel',
    (e) => {
      if (o.paused()) return;
      e.preventDefault();
      const rect = root.getBoundingClientRect();
      const w = viewWidth();
      const at: [number, number] = rect.width ? [cx - w / 2 + ((e.clientX - rect.left) / rect.width) * w, cy - w / aspect / 2 + ((e.clientY - rect.top) / rect.height) * (w / aspect)] : [cx, cy];
      zoomBy(e.deltaY < 0 ? 1.25 : 1 / 1.25, at);
    },
    { passive: false }
  );

  /* ---------- Keyboard cursor ---------- */

  const cursorEl = svg('g', { class: 'ae-cursor', 'data-testid': 'ae-cursor' });
  cursorEl.innerHTML = '<circle r="9" class="ae-cursor-ring"/><path d="M-16 0H-5M5 0H16M0 -16V-5M0 5V16" class="ae-cursor-line"/>';
  const placeCursor = () => {
    if (!cursor) return;
    const [x, y] = toSvg(cursor[0], cursor[1]);
    cursorEl.dataset.at = `${x},${y}`;
    if (!cursorEl.isConnected) gFixed.append(cursorEl);
    apply();
  };
  wrap.addEventListener('focus', () => {
    if (!cursor) {
      const ll = unproject(cx / S, -cy / S) ?? [0, 0];
      cursor = [ll[0], ll[1]];
    }
    placeCursor();
  });
  let pendingAnnounce = false;
  wrap.addEventListener('keydown', (e) => {
    if (o.paused()) return;
    const step = (e.shiftKey ? 0.1 : 0.02) * viewWidth();
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const mv = moves[e.key];
    if (mv) {
      if (!cursor) cursor = unproject(cx / S, -cy / S) ?? [0, 0];
      const [x, y] = toSvg(cursor[0], cursor[1]);
      const nx = Math.max(-EE_X_MAX * S, Math.min(EE_X_MAX * S, x + mv[0]));
      const ny = Math.max(-EE_Y_MAX * S, Math.min(EE_Y_MAX * S, y + mv[1]));
      // Outside the outline near the poles, keep the latitude and pull the longitude in.
      const ll = unproject(nx / S, -ny / S) ?? unproject((nx / S) * 0.5, -ny / S);
      if (ll) cursor = [ll[0], ll[1]];
      // The view follows the cursor.
      const w = viewWidth();
      const hgt = w / aspect;
      const [px, py] = toSvg(cursor[0], cursor[1]);
      if (Math.abs(px - cx) > w * 0.4 || Math.abs(py - cy) > hgt * 0.4) setView(px, py, zoom);
      placeCursor();
      pendingAnnounce = true;
      e.preventDefault();
    } else if (e.key === '+' || e.key === '=') {
      zoomBy(1.6, cursor ? toSvg(cursor[0], cursor[1]) : undefined);
      e.preventDefault();
    } else if (e.key === '-' || e.key === '_') {
      zoomBy(1 / 1.6, cursor ? toSvg(cursor[0], cursor[1]) : undefined);
      e.preventDefault();
    } else if (e.key === '0') {
      fitBox(home, true);
      e.preventDefault();
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (!cursor) cursor = unproject(cx / S, -cy / S) ?? [0, 0];
      placeCursor();
      o.onPick(cursor[0], cursor[1], 'keyboard');
      e.preventDefault();
    }
  });
  wrap.addEventListener('keyup', (e) => {
    // Announce after the key is released, not on every repeat (design § 14.3).
    if (pendingAnnounce && e.key.startsWith('Arrow') && cursor) {
      pendingAnnounce = false;
      announce(live, o.describe(cursor[0], cursor[1]));
    }
  });

  /* ---------- Scene ---------- */

  const fixedAt = (lon: number, lat: number, cls: string, inner: SVGElement[]) => {
    const [x, y] = toSvg(lon, lat);
    const g = svg('g', { class: cls });
    g.dataset.at = `${x},${y}`;
    g.append(...inner);
    gFixed.append(g);
    return g;
  };
  const textEl = (text: string, dx: number, dy: number, cls: string) => {
    const el = svg('text', { x: dx, y: dy, class: cls, 'text-anchor': 'middle' });
    el.textContent = text;
    return el;
  };
  const LINE_LATS: Record<Exclude<LineId, 'meridian'>, number> = { equator: 0, cancer: TROPIC, capricorn: -TROPIC, arctic: POLAR_CIRCLE, antarctic: -POLAR_CIRCLE };

  function show(scene: Scene) {
    wrap.classList.toggle('ae-noborders', !scene.borders);
    gScene.replaceChildren();
    gFixed.replaceChildren();
    if (scene.graticule) {
      buildGraticule(scene.graticule.step);
      gGrat.removeAttribute('hidden');
    } else gGrat.setAttribute('hidden', '');
    for (const s of scene.shapes ?? []) {
      let d = shapePaths.get(`${s.kind}:${s.id}`);
      if (s.kind === 'feature') {
        const f = atlas.feature(s.id);
        if (!f) continue;
        d = f.kind === 'river' ? pathOf(f.lines, false) : pathOf(f.rings, true);
        gScene.append(svg('path', { d, class: `ae-shape ae-${s.style} ae-f-${f.kind}`, ...(f.kind === 'river' ? {} : { fill: `url(#${uid}-stripes)` }) }));
        continue;
      }
      if (!d) continue;
      const fill = s.style === 'target' ? `url(#${uid}-stripes)` : s.style === 'neighbour' ? `url(#${uid}-dots)` : 'none';
      gScene.append(svg('path', { d, class: `ae-shape ae-${s.style}`, fill, 'data-shape': s.id }));
      // Tiny countries: a ring around their dot, so the style is visible at any zoom.
      if (s.kind === 'country') {
        const c = atlas.country(s.id);
        if (c && c.areaMax < DOT_KM2) fixedAt(c.label[0], c.label[1], `ae-dotring ae-${s.style}`, [svg('circle', { r: 9 })]);
      }
    }
    // Special parallels and the graticule labels.
    const latLabels = new Set<number>();
    if (scene.graticule && scene.graticule.labels !== 'none') {
      for (let lat = -90 + scene.graticule.step; lat < 90; lat += scene.graticule.step) if (scene.graticule.labels === 'all' || lat === 0) latLabels.add(lat);
    }
    for (const lat of latLabels) fixedAt(-176, lat, 'ae-latlabel', [textEl(o.latLabel(lat), 0, -4, 'ae-gtext')]);
    for (const id of scene.lines ?? []) {
      if (id === 'meridian') {
        let d = '';
        for (let lat = -90; lat <= 90; lat += 3) {
          const [x, y] = toSvg(0, lat);
          d += `${lat === -90 ? 'M' : 'L'}${r1(x)} ${r1(y)}`;
        }
        gScene.append(svg('path', { d, class: 'ae-line ae-line-meridian' }));
        fixedAt(0, 78, 'ae-linelabel', [textEl(o.lineLabel(id), 0, -6, 'ae-ltext')]);
        continue;
      }
      const lat = LINE_LATS[id];
      const [x1, y] = toSvg(-180, lat);
      const [x2] = toSvg(180, lat);
      gScene.append(svg('path', { d: `M${r1(x1)} ${r1(y)}H${r1(x2)}`, class: `ae-line ae-line-${id}` }));
      fixedAt(-150, lat, 'ae-linelabel', [textEl(o.lineLabel(id), 0, -6, 'ae-ltext')]);
    }
    for (const m of scene.meridians ?? []) {
      let d = '';
      for (let lat = -90; lat <= 90; lat += 3) {
        const [x, y] = toSvg(m.lon, lat);
        d += `${lat === -90 ? 'M' : 'L'}${r1(x)} ${r1(y)}`;
      }
      gScene.append(svg('path', { d, class: 'ae-line ae-explain' }));
      fixedAt(m.lon, 70, 'ae-linelabel', [textEl(m.label, 0, -6, 'ae-ltext')]);
    }
    for (const p of scene.parallels ?? []) {
      const [x1, y] = toSvg(-180, p.lat);
      const [x2] = toSvg(180, p.lat);
      gScene.append(svg('path', { d: `M${r1(x1)} ${r1(y)}H${r1(x2)}`, class: 'ae-line ae-explain' }));
      fixedAt(-160, p.lat, 'ae-linelabel', [textEl(p.label, 0, -6, 'ae-ltext')]);
    }
    for (const a of scene.arcs ?? []) {
      // Arrows show a map direction (straight in lon/lat); other lines follow the great circle (the shortest way).
      const pts: [number, number][] =
        a.style === 'arrow'
          ? Array.from({ length: 12 }, (_, i) => [a.from[0] + ((a.to[0] - a.from[0]) * i) / 11, a.from[1] + ((a.to[1] - a.from[1]) * i) / 11] as [number, number])
          : greatCircle(a.from[0], a.from[1], a.to[0], a.to[1], 48);
      // Split where the great circle crosses the antimeridian.
      let d = '';
      let prev: number | null = null;
      for (const [lon, lat] of pts) {
        const [x, y] = toSvg(lon, lat);
        d += `${prev === null || Math.abs(lon - prev) > 180 ? 'M' : 'L'}${r1(x)} ${r1(y)}`;
        prev = lon;
      }
      gScene.append(svg('path', { d, class: `ae-arc ae-arc-${a.style ?? 'dashed'}` }));
      if (a.style === 'arrow') {
        const [lon, lat] = pts[pts.length - 1]!;
        fixedAt(lon, lat, 'ae-arrowhead', [svg('circle', { r: 4 })]);
      }
      if (a.label) {
        const [lon, lat] = pts[Math.floor(pts.length / 2)]!;
        fixedAt(lon, lat, 'ae-arclabel', [textEl(a.label, 0, -8, 'ae-atext')]);
      }
    }
    for (const pl of scene.polylines ?? []) {
      const d = pl.pts.map(([lon, lat], i) => {
        const [x, y] = toSvg(lon, lat);
        return `${i ? 'L' : 'M'}${r1(x)} ${r1(y)}`;
      });
      gScene.append(svg('path', { d: d.join(''), class: `ae-route ae-route-${pl.style}` }));
      if (pl.numbers) pl.pts.forEach(([lon, lat], i) => i > 0 && fixedAt(lon, lat, 'ae-step', [svg('circle', { r: 9 }), textEl(String(i), 0, 4, 'ae-stext')]));
    }
    for (const l of scene.labels ?? []) fixedAt(l.lon, l.lat, 'ae-label', [textEl(l.text, 0, 4, 'ae-ltext')]);
    for (const m of scene.markers ?? []) {
      const inner: SVGElement[] = [textEl(m.symbol, 0, 6, `ae-msym ae-m-${m.style}`)];
      if (m.label) inner.push(textEl(m.label, 0, 22, 'ae-mtext'));
      fixedAt(m.lon, m.lat, `ae-marker ae-m-${m.style}`, inner);
    }
    if (cursor && document.activeElement === wrap) gFixed.append(cursorEl);
    wrap.setAttribute('aria-label', `${t('map.label')}. ${scene.ariaLabel}`);
    apply();
  }

  // Keep the viewBox matched to the element's aspect ratio (no letterboxing, taps map exactly).
  const measure = () => {
    const w = wrap.clientWidth;
    const hh = wrap.clientHeight;
    if (w > 0 && hh > 0 && Math.abs(w / hh - aspect) > 0.01) {
      aspect = w / hh;
      apply();
    }
  };
  if (typeof ResizeObserver === 'function') {
    resize = new ResizeObserver(measure);
    resize.observe(wrap);
  }
  apply();

  return {
    element,
    show,
    fit: (box) => {
      measure();
      fitBox(box, true);
    },
    setHome: (box) => {
      home = box;
      measure();
      fitBox(box, false);
    },
    dotsNear(client, radiusPx) {
      const k = unitsPerPx();
      const rect = root.getBoundingClientRect();
      if (!rect.width) return [];
      const w = viewWidth();
      const hgt = w / aspect;
      const x = cx - w / 2 + ((client.x - rect.left) / rect.width) * w;
      const y = cy - hgt / 2 + ((client.y - rect.top) / rect.height) * hgt;
      return dots
        .filter((c) => {
          const [dx, dy] = toSvg(c.label[0], c.label[1]);
          return Math.hypot(dx - x, dy - y) <= radiusPx * k;
        })
        .map((c) => c.id);
    },
    cursor: () => cursor,
    focus: () => wrap.focus(),
    dispose() {
      cancelAnimationFrame(anim);
      resize?.disconnect();
    }
  };
}

/** Lon/lat box of a shape, padded a little; null for an empty shape. */
export function boxOfShape(s: Shape | undefined): Box | null {
  return s && s.rings.length ? s.box : null;
}

/** Whether a point lies in any of the shapes (helper for views). */
export const insideAny = (shapes: readonly Shape[], lon: number, lat: number): boolean => shapes.some((s) => inside(s, lon, lat));
