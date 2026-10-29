/**
 * Scene pictures (design §§ 12, 15.3): code-drawn SVG of the beam, the mobile and the stack, the cursor, the
 * explanation layer (turning-effect bars, centres of mass) and the cosmetic tipping pose computed from the verdict.
 * The picture is never mirrored (`dir="ltr"`, § 17.4); meaning is carried by labels and patterns, not colour.
 */
import type { Outcome } from './check';
import type { Scene } from './generate';
import { fitViewBox } from './fit';
import { layoutBeam, layoutMobile, layoutStack, mobileHookPoints, STACK_VIEW, type MobileLayout } from './layout';
import { beamMoments, BODY_LENGTH, bodyCentre, CUBE_WIDTH, isBar, stackJoints, type BeamScene, type MobileNode, type StackScene } from './statics';

const NS = 'http://www.w3.org/2000/svg';
type SAttrs = Record<string, string | number | undefined>;
export function s(tag: string, attrs: SAttrs = {}, ...children: (Node | string)[]): SVGElement {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined) el.setAttribute(k, String(v));
  for (const c of children) el.append(c);
  return el;
}

export interface SceneOptions {
  outcome: Outcome | null;
  /** Show the explanation layer (turning effects / centres of mass). */
  explain: boolean;
  /** Animate the tipping pose (just released, motion allowed). */
  animate: boolean;
  /** Beam: hook under the cursor; mobile: hook index (depth-first); stack: selected body or cube x. */
  cursor: { kind: 'hook'; at: number } | { kind: 'body'; at: number } | { kind: 'cube'; at: number } | null;
  /** mobile-predict: the bar asked about. */
  marked: number | null;
  /** stack-overhang: the target. */
  flag: number | null;
  title: string;
  desc: string;
  /** The unit around a weight's number (from `tray.weight`, e.g. "" and "kg"), so weights read as weights. */
  kgUnit?: { pre: string; post: string };
  /** Mark the parts that may be dragged (`data-drag`): placed parts, and bodies that may slide. */
  drag?: { parts: boolean; bodies: boolean };
}

/** Marks a drawn part as draggable (the view reads `data-drag` on pointerdown, design § 13.1). */
const draggable = (el: SVGElement, on: boolean | undefined, what: string): SVGElement => {
  if (on) {
    el.setAttribute('data-drag', what);
    el.classList.add('bl-draggable');
  }
  return el;
};

const TIP_BEAM = 12;
const TIP_MOBILE = 25;
const TIP_STACK = 35;

function defs(): SVGElement {
  return s(
    'defs',
    {},
    s('pattern', { id: 'bl-hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, s('line', { x1: 0, y1: 0, x2: 0, y2: 6, class: 'bl-hatch-line' })),
    s('pattern', { id: 'bl-dots', width: 6, height: 6, patternUnits: 'userSpaceOnUse' }, s('circle', { cx: 3, cy: 3, r: 1.3, class: 'bl-dot' })),
    s('pattern', { id: 'bl-stone', width: 10, height: 8, patternUnits: 'userSpaceOnUse' }, s('path', { d: 'M0 4h10M5 0v4M2 4v4', class: 'bl-hatch-line' }))
  );
}

/**
 * The tipping pose as an SVG transform (exact in any viewBox); the cosmetic motion (≤ 0.7 s) is a SMIL rotation that
 * is only added when motion is allowed. `data-rot` lets the framing cover the whole motion.
 */
const rotate = (g: SVGElement, deg: number, cx: number, cy: number, animate: boolean) => {
  if (deg === 0) return;
  g.setAttribute('transform', `rotate(${deg} ${cx} ${cy})`);
  g.setAttribute('data-rot', String(deg));
  g.setAttribute('data-cx', String(cx));
  g.setAttribute('data-cy', String(cy));
  if (animate) {
    g.classList.add('bl-tipping');
    g.append(s('animateTransform', { attributeName: 'transform', type: 'rotate', from: `0 ${cx} ${cy}`, to: `${deg} ${cx} ${cy}`, dur: '0.6s', fill: 'freeze', calcMode: 'spline', keyTimes: '0;1', keySplines: '0.42 0 1 1' }));
  }
};

/** A weight's label: the number with a smaller unit ("3kg"), so it never reads like a part number. */
function kgLabel(x: number, y: number, kg: number, o: SceneOptions, fs = 10): SVGElement {
  const unit = (txt: string) => s('tspan', { 'font-size': Math.round(fs * 0.68 * 10) / 10, class: 'bl-unit' }, txt);
  const t = s('text', { x, y, 'font-size': fs, class: 'bl-kg', 'text-anchor': 'middle' });
  if (o.kgUnit?.pre) t.append(unit(o.kgUnit.pre));
  t.append(String(kg));
  if (o.kgUnit?.post) t.append(unit(o.kgUnit.post));
  return t;
}

/** A hanging weight: ring, then a trapezoid body (wider at the bottom) — a different shape from any bar or block. */
function weightShape(x: number, y: number, kg: number, free: boolean | undefined, o: SceneOptions, w = 22): SVGElement {
  const hgt = 13 + kg * 2.5;
  const top = y + 9;
  const inset = w * 0.14;
  return s(
    'g',
    { class: `bl-weight${free ? ' bl-weight--free' : ''}` },
    s('line', { x1: x, y1: y, x2: x, y2: y + 4, class: 'bl-string' }),
    s('circle', { cx: x, cy: y + 6.5, r: 2.5, class: 'bl-ring' }),
    s('path', { d: `M${x - w / 2 + inset} ${top}H${x + w / 2 - inset}L${x + w / 2} ${top + hgt}H${x - w / 2}Z`, class: 'bl-mass' }),
    kgLabel(x, top + hgt / 2 + 3.5, kg, o, w < 18 ? 8 : 10)
  );
}

/* ---------------- Beam ---------------- */

function drawBeam(scene: BeamScene, o: SceneOptions): SVGElement {
  const L = layoutBeam(scene.half);
  const ax = L.x(scene.axle);
  const root = s('g');
  // Stand (fixed) and the bar (turns).
  root.append(s('path', { d: `M${ax} ${L.barY + 6}L${ax - 18} ${L.barY + 70}H${ax + 18}Z`, class: 'bl-stand' }));
  const bar = s('g', { class: 'bl-beam' });
  bar.append(s('rect', { x: L.x(-scene.half) - 10, y: L.barY - 5, width: L.x(scene.half) - L.x(-scene.half) + 20, height: 10, rx: 4, class: 'bl-bar' }));
  for (let p = -scene.half; p <= scene.half; p++) {
    bar.append(s('circle', { cx: L.x(p), cy: L.barY + 7, r: 2.4, class: 'bl-hook' }));
    bar.append(s('text', { x: L.x(p), y: L.barY - 9, class: 'bl-tick', 'text-anchor': 'middle' }, String(Math.abs(p - scene.axle))));
  }
  bar.append(s('circle', { cx: ax, cy: L.barY, r: 4, class: 'bl-axle' }));
  if (scene.barKg > 0) {
    // The bar's own weight acts at its middle; when the axle sits there too, the label steps aside off the axle dot.
    const off = Math.abs(ax - L.x(0)) < 15 ? (ax <= L.x(0) ? 1 : -1) * Math.max(15, L.step * 0.5) : 0;
    bar.append(kgLabel(L.x(0) + off, L.barY + 3, scene.barKg, o, 8));
  }
  let lowest = L.barY + 70;
  scene.weights.forEach((w, i) => {
    const y = beamWeightY(scene, w.hook, i);
    bar.append(draggable(weightShape(L.x(w.hook), y, w.kg, w.free, o, Math.min(22, L.step * 0.92)), o.drag?.parts && w.free, `weight:${i}`));
    lowest = Math.max(lowest, y + 22 + w.kg * 2.5);
  });
  if (o.cursor?.kind === 'hook') bar.append(s('path', { d: `M${L.x(o.cursor.at) - 7} ${L.barY - 30}h14l-7 9z`, class: 'bl-cursor' }));
  const side = o.outcome?.bench === 'beam' ? o.outcome.sides[0] : undefined;
  rotate(bar, side === 'left-down' ? -TIP_BEAM : side === 'right-down' ? TIP_BEAM : 0, ax, L.barY, o.animate);
  root.append(bar);
  // The turning-effect bars go below the lowest hanging weight, so they never cover one.
  const tilt = side === 'left-down' || side === 'right-down' ? 130 * Math.sin((TIP_BEAM * Math.PI) / 180) : 0;
  if (o.explain) root.append(beamBars(scene, Math.max(L.barY + 92, lowest + 10 + tilt)));
  return root;
}

/** Where the weight hanging i-th in the list (or a new one, i = list length) on `hook` begins: below those before it. */
function beamWeightY(scene: BeamScene, hook: number, i: number, except = -1): number {
  const L = layoutBeam(scene.half);
  let y = L.barY + 9;
  scene.weights.forEach((other, j) => {
    if (j < i && j !== except && other.hook === hook) y += 22 + other.kg * 2.5;
  });
  return y;
}

/** Turning-effect bars below the beam: left segments hatched, right ones dotted, each labelled. */
function beamBars(scene: BeamScene, y: number): SVGElement {
  const g = s('g', { class: 'bl-explain' });
  const m = beamMoments(scene);
  const items = [...scene.weights.map((w, i) => ({ v: m.weights[i]!, label: `${w.kg}×${Math.abs(w.hook - scene.axle)}` })), { v: m.bar, label: `${scene.barKg}×${Math.abs(scene.axle)}` }].filter((x) => x.v !== 0);
  const max = Math.max(1, items.filter((x) => x.v < 0).reduce((a, x) => a - x.v, 0), items.filter((x) => x.v > 0).reduce((a, x) => a + x.v, 0));
  const unit = Math.min(8, 140 / max);
  const cx = 160;
  let left = cx;
  let right = cx;
  for (const it of items) {
    const w = Math.abs(it.v) * unit;
    if (it.v < 0) {
      left -= w;
      g.append(s('rect', { x: left, y, width: w, height: 14, class: 'bl-seg bl-seg--left' }));
      if (w > 22) g.append(s('text', { x: left + w / 2, y: y + 11, class: 'bl-seg-label', 'text-anchor': 'middle' }, it.label));
    } else {
      g.append(s('rect', { x: right, y, width: w, height: 14, class: 'bl-seg bl-seg--right' }));
      if (w > 22) g.append(s('text', { x: right + w / 2, y: y + 11, class: 'bl-seg-label', 'text-anchor': 'middle' }, it.label));
      right += w;
    }
  }
  g.append(s('line', { x1: cx, y1: y - 4, x2: cx, y2: y + 18, class: 'bl-axis' }));
  return g;
}

/* ---------------- Mobile ---------------- */

function drawMobile(node: MobileNode, o: SceneOptions): SVGElement {
  const lay = layoutMobile(node);
  const sides = o.outcome?.bench === 'mobile' ? o.outcome.sides : null;
  const root = s('g');
  root.append(s('line', { x1: lay.x, y1: 0, x2: lay.x, y2: lay.y, class: 'bl-string' }));
  root.append(s('rect', { x: -1000, y: -4, width: 2320, height: 8, class: 'bl-ceiling', 'data-nofit': '' }));
  let hookIndex = 0;
  const draw = (n: MobileNode, l: MobileLayout, barIdx: { i: number }): SVGElement => {
    const g = s('g');
    if (!isBar(n)) return g;
    const me = barIdx.i++;
    const x0 = l.x - n.bar.string * l.unit;
    g.append(s('rect', { x: x0 - 4, y: l.y - 3, width: n.bar.width * l.unit + 8, height: 6, rx: 3, class: `bl-bar${o.marked === me ? ' bl-bar--marked' : ''}` }));
    if (o.marked === me) g.append(s('text', { x: x0 - 10, y: l.y + 4, class: 'bl-label', 'text-anchor': 'end' }, '▶'));
    g.append(s('circle', { cx: l.x, cy: l.y, r: 3, class: 'bl-axle' }));
    for (let p = 0; p <= n.bar.width; p++) if (p !== n.bar.string) g.append(s('text', { x: x0 + p * l.unit, y: l.y - 7, class: 'bl-tick', 'text-anchor': 'middle' }, String(Math.abs(p - n.bar.string))));
    n.bar.hooks.forEach((h, k) => {
      const j = hookIndex++;
      const hx = x0 + h.pos * l.unit;
      const child = l.children[k];
      // Shapes scale with the bar's step so neighbouring hooks never overlap.
      const w = Math.min(22, l.unit * 0.85);
      if (h.child === null) {
        const r = Math.min(8, l.unit * 0.38);
        g.append(s('line', { x1: hx, y1: l.y, x2: hx, y2: l.y + 14 - r, class: 'bl-string bl-string--slot' }));
        g.append(s('circle', { cx: hx, cy: l.y + 14, r, class: 'bl-slot' }));
        // Keep room for a weight that may still be hung here, so placing one does not reframe the picture.
        g.append(s('rect', { x: hx - w / 2, y: l.y, width: w, height: 8 + 9 + 13 + 6 * 2.5, class: 'bl-reserve' }));
      } else if (!isBar(h.child)) {
        g.append(s('line', { x1: hx, y1: l.y, x2: hx, y2: l.y + 8, class: 'bl-string' }));
        g.append(draggable(weightShape(hx, l.y + 8, h.child.kg, h.child.free, o, w), o.drag?.parts && h.child.free, `hook:${j}`));
      } else if (child) {
        g.append(s('line', { x1: hx, y1: l.y, x2: hx, y2: child.y, class: 'bl-string' }));
        g.append(draw(h.child, child, barIdx));
      }
      if (o.cursor?.kind === 'hook' && o.cursor.at === j) g.append(s('path', { d: `M${hx - 7} ${l.y - 26}h14l-7 9z`, class: 'bl-cursor' }));
    });
    const side = sides?.[me];
    rotate(g, side === 'left-down' ? -TIP_MOBILE : side === 'right-down' ? TIP_MOBILE : 0, l.x, l.y, o.animate);
    return g;
  };
  root.append(draw(node, lay, { i: 0 }));
  return root;
}

/* ---------------- Stack ---------------- */

function drawStack(scene: StackScene, o: SceneOptions): SVGElement {
  const L = layoutStack(scene);
  const root = s('g');
  // The table runs off the picture; only its edge and a strip of its top are framed.
  root.append(s('rect', { x: -1000, y: L.tableY, width: 1000 + L.px(0), height: 1000, class: 'bl-table', 'data-nofit': '' }));
  root.append(s('rect', { x: L.px(0) - 24, y: L.tableY, width: 24, height: 26, class: 'bl-reserve' }));
  root.append(s('line', { x1: L.px(0), y1: L.tableY - 6, x2: L.px(0), y2: L.tableY + 1000, class: 'bl-edge', 'data-nofit': '' }));
  if (o.flag !== null) {
    const fy = L.bodyY(scene.bodies.length - 1) - 34;
    root.append(s('line', { x1: L.px(o.flag), y1: fy, x2: L.px(o.flag), y2: L.tableY, class: 'bl-flag-line' }));
    root.append(s('path', { d: `M${L.px(o.flag)} ${fy}h14l-4 5 4 5h-14z`, class: 'bl-flag' }));
  }
  // Explanation layer: the plumb lines and centre-of-mass markers inside each part, so its number can step aside.
  const joints = o.explain ? stackJoints(scene) : [];
  const avoid = (k: number): number[] =>
    joints.flatMap((j) => (j.k > k ? [] : j.k === k && !j.holds ? [L.px(j.S / j.M), L.px(j.S / j.M) + (j.dir === 'right' ? 22 : -22)] : [L.px(j.S / j.M)]));
  const fail = o.outcome?.bench === 'stack' ? o.outcome.failing[0] : undefined;
  const lower = s('g');
  const upper = s('g');
  scene.bodies.forEach((b, k) => {
    const g = draggable(s('g'), o.drag?.bodies, `body:${k}`);
    (fail && k >= fail.joint ? upper : lower).append(g);
    const y = L.bodyY(k);
    const kind = b.kind;
    g.append(
      s('rect', {
        x: L.px(b.left),
        y,
        width: BODY_LENGTH[kind] * L.scale,
        height: L.bodyH,
        rx: 2,
        class: `bl-body bl-body--${kind}${o.cursor?.kind === 'body' && o.cursor.at === k ? ' bl-body--cursor' : ''}`
      })
    );
    if (kind === 'stone') g.append(s('rect', { x: L.px(b.left), y, width: BODY_LENGTH[kind] * L.scale, height: L.bodyH, fill: 'url(#bl-stone)', class: 'bl-pattern' }));
    const left = L.px(b.left);
    const right = left + BODY_LENGTH[kind] * L.scale;
    const spots = [L.px(bodyCentre(b)), left + 8, right - 8];
    const xs = avoid(k);
    const clear = (x: number) => Math.min(Infinity, ...xs.map((a) => Math.abs(a - x)));
    const lx = spots.find((x) => clear(x) >= 10) ?? spots.reduce((a, x) => (clear(x) > clear(a) ? x : a));
    g.append(s('text', { x: lx, y: o.explain ? y + 10 : y + L.bodyH / 2 + 4, class: 'bl-label bl-label--small bl-part-no', 'text-anchor': 'middle' }, String(k + 1)));
  });
  // Cubes, stacked when they share a spot.
  const heights = new Map<string, number>();
  let topY = L.bodyY(scene.bodies.length - 1);
  scene.cubes.forEach((c, i) => {
    const g = draggable(s('g'), o.drag?.parts && c.free, `cube:${i}`);
    (fail && c.on >= fail.joint ? upper : lower).append(g);
    const key = `${c.on}:${c.x}`;
    const below = heights.get(key) ?? 0;
    const size = CUBE_WIDTH * L.scale;
    heights.set(key, below + size);
    const y = L.bodyY(c.on) - below - size;
    topY = Math.min(topY, y - 2);
    const cx = L.px(c.x);
    const cls = `${c.free ? ' bl-weight--free' : ''}${o.cursor?.kind === 'cube' && o.cursor.at === c.x ? ' bl-body--cursor' : ''}`;
    // A weight shape (handle on a trapezoid), not a block: it must not read like a numbered part.
    g.append(s('path', { d: `M${cx - 2.5} ${y + 3}v-1.6h5v1.6`, class: 'bl-handle' }));
    g.append(s('path', { d: `M${cx - size / 2 + 1.6} ${y + 3}H${cx + size / 2 - 1.6}L${cx + size / 2} ${y + size}H${cx - size / 2}Z`, class: `bl-cube${cls}` }));
    g.append(kgLabel(cx, y + size / 2 + 4, c.kg, o, 6.8));
  });
  if (scene.bucket) {
    const b = scene.bucket;
    const g = fail && b.on >= fail.joint ? upper : lower;
    const top = L.bodyY(b.on) + L.bodyH;
    g.append(s('line', { x1: L.px(b.x), y1: top, x2: L.px(b.x), y2: top + 14, class: 'bl-string' }));
    g.append(s('path', { d: `M${L.px(b.x) - 11} ${top + 14}h22l-3 20h-16z`, class: 'bl-bucket' }));
    g.append(kgLabel(L.px(b.x), top + 28, b.kg, o, 8));
  }
  if (o.cursor?.kind === 'cube' && !scene.cubes.some((c) => c.x === o.cursor!.at)) root.append(s('path', { d: `M${L.px(o.cursor.at) - 7} ${L.bodyY(0) - 26}h14l-7 9z`, class: 'bl-cursor' }));
  root.append(lower, upper);
  if (fail) {
    const j = stackJoints(scene)[fail.joint]!;
    const pivotX = L.px(fail.dir === 'right' ? j.hi : j.lo);
    rotate(upper, fail.dir === 'right' ? TIP_STACK : -TIP_STACK, pivotX, L.bodyY(fail.joint) + L.bodyH, o.animate);
  }
  if (o.explain) {
    const g = s('g', { class: 'bl-explain' });
    // After a fall the tipped parts sweep over the joint, so the fall notes go above the upright stack, on the side
    // the parts fall away from (the side that stays clear during the whole motion).
    let notes = 0;
    const lefts = scene.bodies.map((b) => L.px(b.left));
    const rights = scene.bodies.map((b) => L.px(b.left + BODY_LENGTH[b.kind]));
    for (const j of joints) {
      const x = L.px(j.S / j.M);
      const y = L.bodyY(j.k) + L.bodyH;
      g.append(s('line', { x1: L.px(j.lo), y1: y, x2: L.px(j.hi), y2: y, class: 'bl-contact' }));
      g.append(s('line', { x1: x, y1: L.bodyY(scene.bodies.length - 1) - 4, x2: x, y2: y, class: 'bl-plumb' }));
      g.append(s('circle', { cx: x, cy: y - 5, r: 4, class: `bl-com${j.holds ? '' : ' bl-com--fail'}` }));
      g.append(s('path', { d: `M${x - 2.6} ${y - 5}h5.2M${x} ${y - 7.6}v5.2`, class: 'bl-com-cross' }));
      const note = j.dir === 'right' ? '✕ →' : '← ✕';
      const anchor = j.dir === 'right' ? 'start' : 'end';
      if (!j.holds && fail)
        g.append(s('text', { x: j.dir === 'right' ? Math.min(...lefts) : Math.max(...rights), y: topY - 6 - 12 * notes++, class: 'bl-label bl-label--small bl-halo bl-fall-note', 'text-anchor': anchor }, note));
      else if (!j.holds) g.append(s('text', { x: x + (j.dir === 'right' ? 7 : -7), y: y - 2, class: 'bl-label bl-label--small bl-halo', 'text-anchor': anchor }, note));
      else if (j.edge) g.append(s('text', { x: x + 7, y: y - 2, class: 'bl-label bl-label--small bl-halo' }, '▲'));
    }
    root.append(g);
  }
  return root;
}

export const VIEWBOX = { beam: '0 0 320 230', mobile: '0 0 320 230', stack: `0 0 320 ${STACK_VIEW.height}` } as const;

export function drawScene(scene: Scene, o: SceneOptions): SVGElement {
  const id = `bl-t-${Math.abs(o.title.length * 31 + o.desc.length)}`;
  const svg = s('svg', { class: `bl-svg bl-svg--${scene.bench}`, role: 'img', 'aria-labelledby': `${id}-t ${id}-d`, 'data-testid': 'bl-scene' });
  svg.append(s('title', { id: `${id}-t` }, o.title), s('desc', { id: `${id}-d` }, o.desc), defs());
  const content = scene.bench === 'beam' ? drawBeam(scene.s, o) : scene.bench === 'mobile' ? drawMobile(scene.s, o) : drawStack(scene.s, o);
  svg.append(content);
  // Frame the drawing tightly (design § 19.1: as large as possible on a phone); the beam keeps its full bar width.
  svg.setAttribute('viewBox', fitViewBox(content, VIEWBOX[scene.bench], 8, scene.bench === 'beam' ? 300 : 150, 110));
  return svg;
}

/* ---------------- Drag preview (design § 13.1) ---------------- */

/** Where a dragged part would land: a beam hook, a mobile hook (index), a cube centre (cm) or a body's left end (cm). */
export type Ghost =
  | { kind: 'beam'; hook: number; kg: number; except: number }
  | { kind: 'mobile'; hook: number; kg: number }
  | { kind: 'cube'; x: number; kg: number; except: number }
  | { kind: 'body'; index: number; left: number };

/** The snap target drawn while dragging: a dashed outline of the part where it would land (no motion, no colour cue). */
export function drawGhost(scene: Scene, g: Ghost, o: Pick<SceneOptions, 'kgUnit'>): SVGElement {
  const root = s('g', { class: 'bl-ghost', 'data-testid': 'bl-drag-ghost', 'aria-hidden': 'true' });
  const opts = { ...o } as SceneOptions;
  if (g.kind === 'beam' && scene.bench === 'beam') {
    const L = layoutBeam(scene.s.half);
    root.append(s('path', { d: `M${L.x(g.hook) - 7} ${L.barY - 30}h14l-7 9z`, class: 'bl-cursor' }));
    root.append(weightShape(L.x(g.hook), beamWeightY(scene.s, g.hook, scene.s.weights.length, g.except), g.kg, true, opts, Math.min(22, L.step * 0.92)));
  } else if (g.kind === 'mobile' && scene.bench === 'mobile') {
    const p = mobileHookPoints(scene.s)[g.hook];
    if (p) root.append(s('path', { d: `M${p.x - 7} ${p.y - 26}h14l-7 9z`, class: 'bl-cursor' }), weightShape(p.x, p.y + 8, g.kg, true, opts, 18));
  } else if (g.kind === 'cube' && scene.bench === 'stack') {
    const L = layoutStack(scene.s);
    const size = CUBE_WIDTH * L.scale;
    const below = scene.s.cubes.filter((c, i) => i !== g.except && c.on === 0 && c.x === g.x).length * size;
    const y = L.bodyY(0) - below - size;
    const cx = L.px(g.x);
    root.append(
      s('path', { d: `M${cx - size / 2 + 1.6} ${y + 3}H${cx + size / 2 - 1.6}L${cx + size / 2} ${y + size}H${cx - size / 2}Z`, class: 'bl-cube' }),
      kgLabel(cx, y + size / 2 + 4, g.kg, opts, 6.8)
    );
  } else if (g.kind === 'body' && scene.bench === 'stack') {
    const L = layoutStack(scene.s);
    const b = scene.s.bodies[g.index];
    if (b) root.append(s('rect', { x: L.px(g.left), y: L.bodyY(g.index), width: BODY_LENGTH[b.kind] * L.scale, height: L.bodyH, rx: 2, class: 'bl-body' }));
  }
  return root;
}
