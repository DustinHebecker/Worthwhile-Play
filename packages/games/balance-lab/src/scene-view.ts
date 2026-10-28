/**
 * Scene pictures (design §§ 12, 15.3): code-drawn SVG of the beam, the mobile and the stack, the cursor, the
 * explanation layer (turning-effect bars, centres of mass) and the cosmetic tipping pose computed from the verdict.
 * The picture is never mirrored (`dir="ltr"`, § 17.4); meaning is carried by labels and patterns, not colour.
 */
import type { Outcome } from './check';
import type { Scene } from './generate';
import { layoutBeam, layoutMobile, layoutStack, STACK_VIEW, type MobileLayout } from './layout';
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
}

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

const rotate = (g: SVGElement, deg: number, cx: number, cy: number, animate: boolean) => {
  if (deg === 0) return;
  g.setAttribute('style', `--bl-angle: ${deg}deg; transform-origin: ${cx}px ${cy}px; transform: rotate(${deg}deg)`);
  if (animate) g.classList.add('bl-tipping');
};

function weightShape(x: number, y: number, kg: number, free: boolean | undefined): SVGElement {
  const hgt = 12 + kg * 2.5;
  const w = 18;
  return s(
    'g',
    { class: `bl-weight${free ? ' bl-weight--free' : ''}` },
    s('line', { x1: x, y1: y, x2: x, y2: y + 6, class: 'bl-string' }),
    s('rect', { x: x - w / 2, y: y + 6, width: w, height: hgt, rx: 3, class: 'bl-mass' }),
    s('text', { x, y: y + 6 + hgt / 2 + 4, class: 'bl-label', 'text-anchor': 'middle' }, String(kg))
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
  if (scene.barKg > 0) bar.append(s('text', { x: L.x(0), y: L.barY + 3.5, class: 'bl-label bl-label--small', 'text-anchor': 'middle' }, `${scene.barKg}`));
  const perHook = new Map<number, number>();
  for (const w of scene.weights) {
    const n = perHook.get(w.hook) ?? 0;
    perHook.set(w.hook, n + 1);
    let y = L.barY + 9;
    for (const other of scene.weights) {
      if (other === w) break;
      if (other.hook === w.hook) y += 18 + other.kg * 2.5;
    }
    bar.append(weightShape(L.x(w.hook), y, w.kg, w.free));
  }
  if (o.cursor?.kind === 'hook') bar.append(s('path', { d: `M${L.x(o.cursor.at) - 7} ${L.barY - 30}h14l-7 9z`, class: 'bl-cursor' }));
  const side = o.outcome?.bench === 'beam' ? o.outcome.sides[0] : undefined;
  rotate(bar, side === 'left-down' ? -TIP_BEAM : side === 'right-down' ? TIP_BEAM : 0, ax, L.barY, o.animate);
  root.append(bar);
  if (o.explain) root.append(beamBars(scene, L));
  return root;
}

/** Turning-effect bars below the beam: left segments hatched, right ones dotted, each labelled. */
function beamBars(scene: BeamScene, L: ReturnType<typeof layoutBeam>): SVGElement {
  const g = s('g', { class: 'bl-explain' });
  const m = beamMoments(scene);
  const items = [...scene.weights.map((w, i) => ({ v: m.weights[i]!, label: `${w.kg}×${Math.abs(w.hook - scene.axle)}` })), { v: m.bar, label: `${scene.barKg}×${Math.abs(scene.axle)}` }].filter((x) => x.v !== 0);
  const max = Math.max(1, items.filter((x) => x.v < 0).reduce((a, x) => a - x.v, 0), items.filter((x) => x.v > 0).reduce((a, x) => a + x.v, 0));
  const unit = Math.min(8, 140 / max);
  const cx = 160;
  let left = cx;
  let right = cx;
  const y = L.barY + 92;
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
  root.append(s('rect', { x: 100, y: 0, width: 120, height: 4, class: 'bl-ceiling' }));
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
      if (h.child === null) {
        g.append(s('circle', { cx: hx, cy: l.y + 14, r: 8, class: 'bl-slot' }));
      } else if (!isBar(h.child)) {
        g.append(s('line', { x1: hx, y1: l.y, x2: hx, y2: l.y + 8, class: 'bl-string' }));
        g.append(weightShape(hx, l.y + 8, h.child.kg, h.child.free));
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
  root.append(s('rect', { x: 0, y: L.tableY, width: L.px(0), height: STACK_VIEW.height - L.tableY, class: 'bl-table' }));
  root.append(s('line', { x1: L.px(0), y1: L.tableY - 6, x2: L.px(0), y2: STACK_VIEW.height, class: 'bl-edge' }));
  if (o.flag !== null) {
    root.append(s('line', { x1: L.px(o.flag), y1: 18, x2: L.px(o.flag), y2: L.tableY, class: 'bl-flag-line' }));
    root.append(s('path', { d: `M${L.px(o.flag)} 18h14l-4 5 4 5h-14z`, class: 'bl-flag' }));
  }
  const fail = o.outcome?.bench === 'stack' ? o.outcome.failing[0] : undefined;
  const lower = s('g');
  const upper = s('g');
  scene.bodies.forEach((b, k) => {
    const g = fail && k >= fail.joint ? upper : lower;
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
    g.append(s('text', { x: L.px(bodyCentre(b)), y: y + L.bodyH / 2 + 4, class: 'bl-label bl-label--small', 'text-anchor': 'middle' }, String(k + 1)));
  });
  // Cubes, stacked when they share a spot.
  const heights = new Map<string, number>();
  for (const c of scene.cubes) {
    const g = fail && c.on >= fail.joint ? upper : lower;
    const key = `${c.on}:${c.x}`;
    const below = heights.get(key) ?? 0;
    const size = CUBE_WIDTH * L.scale;
    heights.set(key, below + size);
    const y = L.bodyY(c.on) - below - size;
    g.append(s('rect', { x: L.px(c.x - CUBE_WIDTH / 2), y, width: size, height: size, class: `bl-cube${c.free ? ' bl-weight--free' : ''}${o.cursor?.kind === 'cube' && o.cursor.at === c.x ? ' bl-body--cursor' : ''}` }));
    g.append(s('text', { x: L.px(c.x), y: y + size / 2 + 4, class: 'bl-label bl-label--small', 'text-anchor': 'middle' }, String(c.kg)));
  }
  if (scene.bucket) {
    const b = scene.bucket;
    const g = fail && b.on >= fail.joint ? upper : lower;
    const top = L.bodyY(b.on) + L.bodyH;
    g.append(s('line', { x1: L.px(b.x), y1: top, x2: L.px(b.x), y2: top + 14, class: 'bl-string' }));
    g.append(s('path', { d: `M${L.px(b.x) - 11} ${top + 14}h22l-3 20h-16z`, class: 'bl-bucket' }));
    g.append(s('text', { x: L.px(b.x), y: top + 29, class: 'bl-label bl-label--small', 'text-anchor': 'middle' }, String(b.kg)));
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
    for (const j of stackJoints(scene)) {
      const x = L.px(j.S / j.M);
      const y = L.bodyY(j.k) + L.bodyH;
      g.append(s('line', { x1: L.px(j.lo), y1: y, x2: L.px(j.hi), y2: y, class: 'bl-contact' }));
      g.append(s('line', { x1: x, y1: L.bodyY(scene.bodies.length - 1) - 4, x2: x, y2: y, class: 'bl-plumb' }));
      g.append(s('circle', { cx: x, cy: y - 5, r: 4.5, class: `bl-com${j.holds ? '' : ' bl-com--fail'}` }));
      g.append(s('path', { d: `M${x - 3} ${y - 5}h6M${x} ${y - 8}v6`, class: 'bl-com-cross' }));
      if (!j.holds) g.append(s('text', { x: x + (j.dir === 'right' ? 8 : -8), y: y - 2, class: 'bl-label bl-label--small', 'text-anchor': j.dir === 'right' ? 'start' : 'end' }, j.dir === 'right' ? '✕ →' : '← ✕'));
      else if (j.edge) g.append(s('text', { x: x + 8, y: y - 2, class: 'bl-label bl-label--small' }, '▲'));
    }
    root.append(g);
  }
  return root;
}

export const VIEWBOX = { beam: '0 0 320 230', mobile: '0 0 320 230', stack: `0 0 320 ${STACK_VIEW.height}` } as const;

export function drawScene(scene: Scene, o: SceneOptions): SVGElement {
  const id = `bl-t-${Math.abs(o.title.length * 31 + o.desc.length)}`;
  const svg = s('svg', { viewBox: VIEWBOX[scene.bench], class: `bl-svg bl-svg--${scene.bench}`, role: 'img', 'aria-labelledby': `${id}-t ${id}-d`, 'data-testid': 'bl-scene' });
  svg.append(s('title', { id: `${id}-t` }, o.title), s('desc', { id: `${id}-d` }, o.desc), defs());
  svg.append(scene.bench === 'beam' ? drawBeam(scene.s, o) : scene.bench === 'mobile' ? drawMobile(scene.s, o) : drawStack(scene.s, o));
  return svg;
}
