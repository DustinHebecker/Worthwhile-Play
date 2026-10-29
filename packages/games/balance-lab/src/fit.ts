/**
 * Framing of the scene picture: the viewBox is fitted to the bounding box of what is drawn, so that on a phone the
 * parts, numbers and hooks are as large as possible. Pure geometry over the SVG elements the scene code builds (no
 * layout engine needed, so it also works in the DOM tests). Elements marked `data-nofit` (e.g. a table or ceiling
 * that runs off the edge) are ignored; invisible `.bl-reserve` rects keep room for parts that may still be placed.
 * Groups turned by the tipping pose carry `data-rot`/`data-cx`/`data-cy`; the frame covers the whole motion.
 */

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface Turn {
  deg: number;
  cx: number;
  cy: number;
}

const FONT: Record<string, number> = { 'bl-seg-label': 8, 'bl-tick': 9, 'bl-label--small': 9, 'bl-label': 11 };

function fontSize(el: Element): number {
  const own = Number(el.getAttribute('font-size'));
  if (own > 0) return own;
  const cls = (el.getAttribute('class') ?? '').split(/\s+/);
  for (const [k, v] of Object.entries(FONT)) if (cls.includes(k)) return v;
  return 11;
}

/** Approximate advance width of a text element (0.62 em per character; tspans may set their own size). */
function textWidth(el: Element): number {
  const fs = fontSize(el);
  let w = 0;
  for (const c of Array.from(el.childNodes)) {
    if (c.nodeType === 3) w += (c.textContent ?? '').length * fs * 0.62;
    else if (c.nodeType === 1) w += ((c as Element).textContent ?? '').length * fontSize(c as Element) * 0.62;
  }
  return w;
}

/** The points of a simple path (M, L, H, V, Z in either case — all the scene uses). */
export function pathPoints(d: string): [number, number][] {
  const tokens = d.match(/[MLHVZmlhvz]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) ?? [];
  const out: [number, number][] = [];
  let x = 0;
  let y = 0;
  let cmd = 'M';
  let i = 0;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    const tk = tokens[i]!;
    if (/[A-Za-z]/.test(tk)) {
      cmd = tk;
      i++;
      if (cmd === 'Z' || cmd === 'z') continue;
    }
    if (i >= tokens.length) break;
    switch (cmd) {
      case 'M':
      case 'L':
        x = num();
        y = num();
        break;
      case 'm':
      case 'l':
        x += num();
        y += num();
        break;
      case 'H':
        x = num();
        break;
      case 'h':
        x += num();
        break;
      case 'V':
        y = num();
        break;
      case 'v':
        y += num();
        break;
      default:
        i++;
        continue;
    }
    if (Number.isFinite(x) && Number.isFinite(y)) out.push([x, y]);
  }
  return out;
}

function ownPoints(el: Element): [number, number][] {
  const a = (k: string) => Number(el.getAttribute(k) ?? 0);
  switch (el.tagName.toLowerCase()) {
    case 'rect': {
      const x = a('x');
      const y = a('y');
      return [
        [x, y],
        [x + a('width'), y + a('height')],
        [x + a('width'), y],
        [x, y + a('height')]
      ];
    }
    case 'circle': {
      const r = a('r');
      return [
        [a('cx') - r, a('cy') - r],
        [a('cx') + r, a('cy') + r],
        [a('cx') + r, a('cy') - r],
        [a('cx') - r, a('cy') + r]
      ];
    }
    case 'line':
      return [
        [a('x1'), a('y1')],
        [a('x2'), a('y2')]
      ];
    case 'path':
      return pathPoints(el.getAttribute('d') ?? '');
    case 'text': {
      const w = textWidth(el);
      const fs = fontSize(el);
      const anchor = el.getAttribute('text-anchor') ?? 'start';
      const x = a('x');
      const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
      const y = a('y');
      return [
        [left, y - fs * 0.8],
        [left + w, y + fs * 0.25],
        [left + w, y - fs * 0.8],
        [left, y + fs * 0.25]
      ];
    }
    default:
      return [];
  }
}

function turn(p: [number, number], t: Turn, f: number): [number, number] {
  const r = (t.deg * f * Math.PI) / 180;
  const dx = p[0] - t.cx;
  const dy = p[1] - t.cy;
  return [t.cx + dx * Math.cos(r) - dy * Math.sin(r), t.cy + dx * Math.sin(r) + dy * Math.cos(r)];
}

/** The bounding box of everything drawn under `root` (over the whole tipping motion), or null when empty. */
export function contentBox(root: Element): Box | null {
  const box: Box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const walk = (el: Element, turns: Turn[]) => {
    const tag = el.tagName.toLowerCase();
    if (tag === 'defs' || tag === 'title' || tag === 'desc' || el.hasAttribute('data-nofit')) return;
    const rot = el.getAttribute('data-rot');
    const here = rot === null ? turns : [...turns, { deg: Number(rot), cx: Number(el.getAttribute('data-cx')), cy: Number(el.getAttribute('data-cy')) }];
    const pts = ownPoints(el);
    for (const f of here.length ? [0, 0.5, 1] : [1])
      for (const p0 of pts) {
        let p = p0;
        for (let k = here.length - 1; k >= 0; k--) p = turn(p, here[k]!, f);
        box.x0 = Math.min(box.x0, p[0]);
        box.y0 = Math.min(box.y0, p[1]);
        box.x1 = Math.max(box.x1, p[0]);
        box.y1 = Math.max(box.y1, p[1]);
      }
    if (tag !== 'text') for (const c of Array.from(el.children)) walk(c, here);
  };
  walk(root, []);
  return Number.isFinite(box.x0) ? box : null;
}

/** A viewBox string around the content: padded, at least `minW` × `minH`, centred on the content. */
export function fitViewBox(root: Element, fallback: string, pad = 8, minW = 150, minH = 110): string {
  const b = contentBox(root);
  if (!b) return fallback;
  let w = b.x1 - b.x0 + 2 * pad;
  let h = b.y1 - b.y0 + 2 * pad;
  const cx = (b.x0 + b.x1) / 2;
  const cy = (b.y0 + b.y1) / 2;
  w = Math.max(w, minW);
  h = Math.max(h, minH);
  const r = (v: number) => Math.round(v * 10) / 10;
  return `${r(cx - w / 2)} ${r(cy - h / 2)} ${r(w)} ${r(h)}`;
}

/** A client rectangle (the part of `DOMRect` the mapping needs). */
export interface ClientRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** The numbers of a viewBox attribute (the fallback frame when it is missing or malformed). */
function viewBoxOf(viewBox: string | null): [number, number, number, number] {
  const v = (viewBox ?? '').trim().split(/[\s,]+/).map(Number);
  return v.length === 4 && v.every(Number.isFinite) && v[2]! > 0 && v[3]! > 0 ? (v as [number, number, number, number]) : [0, 0, 320, 230];
}

/** Scale and letterbox offsets of a viewBox shown in a client rectangle (`preserveAspectRatio` xMidYMid meet). */
function frame(viewBox: string | null, rect: ClientRect) {
  const [vx, vy, vw, vh] = viewBoxOf(viewBox);
  const k = Math.min(rect.width / vw, rect.height > 0 ? rect.height / vh : Infinity);
  return { vx, vy, k, ox: rect.left + (rect.width - vw * k) / 2, oy: rect.top + (rect.height - vh * k) / 2 };
}

/** The picture point under a client point: the scene is framed by a fitted viewBox and letterboxed (xMidYMid meet). */
export function toScene(viewBox: string | null, rect: ClientRect, clientX: number, clientY: number): { x: number; y: number } {
  const f = frame(viewBox, rect);
  return { x: f.vx + (clientX - f.ox) / f.k, y: f.vy + (clientY - f.oy) / f.k };
}

/** The client point of a picture point (the inverse of `toScene`). */
export function toClient(viewBox: string | null, rect: ClientRect, x: number, y: number): { x: number; y: number } {
  const f = frame(viewBox, rect);
  return { x: f.ox + (x - f.vx) * f.k, y: f.oy + (y - f.vy) * f.k };
}
