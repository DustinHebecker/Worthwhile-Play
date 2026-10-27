/**
 * Causal loop diagrams (design § 12.2): data per challenge and goal, and a pure circle layout.
 *
 * Conventions (Sterman 2000, Meadows 2008): an edge "+" means "more of the source → more of the target" (at the same
 * time, all else equal), "−" means "more → less"; a delay edge acts through a maturation delay. A loop is reinforcing
 * (R) when the product of its signs is +, balancing (B) when it is −. Both are checked by tests: the loop type against
 * its signs, and every edge sign against the model's sensitivity at the challenge's start (slow test).
 */
import type { Habitat } from './habitats';

/** Pool and condition nodes besides the species ids. */
export const POOL_NODES = ['nutrients', 'dead', 'water', 'light', 'runoff', 'flow', 'rain', 'fertiliser'] as const;
export type PoolNode = (typeof POOL_NODES)[number];

export interface Edge {
  readonly from: string;
  readonly to: string;
  readonly sign: 1 | -1;
  readonly delay?: boolean;
}

export interface Loop {
  /** "R1", "B2" … */
  readonly id: string;
  /** The nodes of the cycle in order (the first is not repeated). */
  readonly path: readonly string[];
  /** Content key of its one-line description (`loops.<key>`). */
  readonly key: string;
}

export interface Cld {
  readonly habitat: Habitat;
  readonly nodes: readonly string[];
  readonly edges: readonly Edge[];
  readonly loops: readonly Loop[];
  /** The loop that explains the outcome (drawn thicker and dashed), or null when a chain explains it. */
  readonly highlight: string | null;
  /** An open causal chain to highlight (e.g. a trophic cascade). */
  readonly chain?: readonly string[];
}

const e = (from: string, to: string, sign: 1 | -1, delay = false): Edge => (delay ? { from, to, sign, delay } : { from, to, sign });

// Recurring pieces.
const GRAZE = [e('algae', 'fleas', 1), e('fleas', 'algae', -1)];
const B_GRAZE: Loop = { id: 'B1', path: ['algae', 'fleas'], key: 'graze' };
const FISH_FLEAS = [e('fleas', 'minnows', 1, true), e('minnows', 'fleas', -1)];
const SHADE = [e('algae', 'pondweed', -1), e('pondweed', 'algae', -1)];
const R_SHADE: Loop = { id: 'R1', path: ['algae', 'pondweed'], key: 'clearWater' };
const APHIDS = [e('flowers', 'aphids', 1), e('aphids', 'flowers', -1), e('aphids', 'ladybirds', 1, true), e('ladybirds', 'aphids', -1)];
const RABBITS = [e('clover', 'rabbits', 1, true), e('rabbits', 'clover', -1), e('rabbits', 'foxes', 1, true), e('foxes', 'rabbits', -1)];

const runoffCld: Cld = {
  habitat: 'pond',
  nodes: ['runoff', 'nutrients', 'algae', 'pondweed', 'fleas'],
  edges: [e('runoff', 'nutrients', 1), e('nutrients', 'algae', 1), ...SHADE, e('pondweed', 'fleas', 1), ...GRAZE],
  loops: [R_SHADE, { id: 'R2', path: ['algae', 'pondweed', 'fleas'], key: 'shelter' }, B_GRAZE],
  highlight: 'R1'
};

export const CLDS = {
  'fleas-arrive': {
    habitat: 'pond',
    nodes: ['nutrients', 'algae', 'fleas'],
    edges: [e('nutrients', 'algae', 1), e('algae', 'nutrients', -1), ...GRAZE],
    loops: [B_GRAZE, { id: 'B2', path: ['nutrients', 'algae'], key: 'uptake' }],
    highlight: 'B1'
  },
  'enrich-swings': {
    habitat: 'pond',
    nodes: ['runoff', 'nutrients', 'algae', 'fleas'],
    edges: [e('runoff', 'nutrients', 1), e('nutrients', 'algae', 1), ...GRAZE],
    loops: [B_GRAZE],
    highlight: 'B1',
    chain: ['runoff', 'nutrients', 'algae']
  },
  'fish-stocked': {
    habitat: 'pond',
    nodes: ['algae', 'fleas', 'minnows'],
    edges: [...GRAZE, ...FISH_FLEAS],
    loops: [B_GRAZE, { id: 'B2', path: ['fleas', 'minnows'], key: 'fishFleas' }],
    highlight: null,
    chain: ['minnows', 'fleas', 'algae']
  },
  'pike-return': {
    habitat: 'pond',
    nodes: ['algae', 'fleas', 'minnows', 'pike'],
    edges: [...GRAZE, ...FISH_FLEAS, e('minnows', 'pike', 1, true), e('pike', 'minnows', -1)],
    loops: [B_GRAZE, { id: 'B2', path: ['fleas', 'minnows'], key: 'fishFleas' }, { id: 'B3', path: ['minnows', 'pike'], key: 'pikeFish' }],
    highlight: null,
    chain: ['pike', 'minnows', 'fleas', 'algae']
  },
  'algae-treatment': {
    habitat: 'pond',
    nodes: ['nutrients', 'algae', 'dead', 'fleas'],
    edges: [e('nutrients', 'algae', 1), e('algae', 'dead', 1), e('dead', 'nutrients', 1), ...GRAZE],
    loops: [B_GRAZE, { id: 'R1', path: ['nutrients', 'algae', 'dead'], key: 'recycle' }],
    highlight: 'B1',
    chain: ['dead', 'nutrients', 'algae']
  },
  'slow-runoff': runoffCld,
  'no-way-back': {
    habitat: 'pond',
    nodes: ['nutrients', 'algae', 'pondweed', 'fleas'],
    edges: [e('nutrients', 'algae', 1), ...SHADE, e('pondweed', 'fleas', 1), ...GRAZE],
    loops: [R_SHADE, { id: 'R2', path: ['algae', 'pondweed', 'fleas'], key: 'shelter' }, B_GRAZE],
    highlight: 'R1'
  },
  shade: {
    habitat: 'pond',
    nodes: ['light', 'algae', 'pondweed'],
    edges: [e('light', 'pondweed', 1), e('light', 'algae', 1), ...SHADE],
    loops: [R_SHADE],
    highlight: 'R1',
    chain: ['light', 'pondweed']
  },
  spray: {
    habitat: 'meadow',
    nodes: ['flowers', 'aphids', 'ladybirds'],
    edges: APHIDS,
    loops: [{ id: 'B1', path: ['flowers', 'aphids'], key: 'aphidsFlowers' }, { id: 'B2', path: ['aphids', 'ladybirds'], key: 'ladybirdsAphids' }],
    highlight: 'B2'
  },
  'no-foxes': {
    habitat: 'meadow',
    nodes: ['clover', 'rabbits', 'foxes'],
    edges: RABBITS,
    loops: [{ id: 'B1', path: ['clover', 'rabbits'], key: 'rabbitsClover' }, { id: 'B2', path: ['rabbits', 'foxes'], key: 'foxesRabbits' }],
    highlight: 'B2',
    chain: ['foxes', 'rabbits', 'clover']
  },
  fertilise: {
    habitat: 'meadow',
    nodes: ['fertiliser', 'nutrients', 'grass', 'clover', 'flowers'],
    edges: [e('fertiliser', 'nutrients', 1), e('nutrients', 'grass', 1), e('grass', 'nutrients', -1), e('grass', 'clover', -1), e('grass', 'flowers', -1)],
    loops: [{ id: 'B1', path: ['nutrients', 'grass'], key: 'grassUptake' }],
    highlight: null,
    chain: ['fertiliser', 'nutrients', 'grass', 'clover']
  },
  drought: {
    habitat: 'meadow',
    nodes: ['rain', 'water', 'grass'],
    edges: [e('rain', 'water', 1), e('water', 'grass', 1), e('grass', 'water', -1)],
    loops: [{ id: 'B1', path: ['water', 'grass'], key: 'thirst' }],
    highlight: 'B1',
    chain: ['rain', 'water', 'grass']
  },
  'clover-poor': {
    habitat: 'meadow',
    nodes: ['clover', 'dead', 'worms', 'nutrients', 'flowers'],
    edges: [e('clover', 'dead', 1), e('dead', 'worms', 1), e('worms', 'dead', -1), e('dead', 'nutrients', 1), e('worms', 'nutrients', 1), e('nutrients', 'flowers', 1), e('flowers', 'nutrients', -1)],
    loops: [{ id: 'B1', path: ['dead', 'worms'], key: 'wormsDead' }, { id: 'B2', path: ['nutrients', 'flowers'], key: 'flowerUptake' }],
    highlight: null,
    chain: ['clover', 'dead', 'nutrients', 'flowers']
  },
  'worms-gone': {
    habitat: 'meadow',
    nodes: ['worms', 'dead', 'nutrients', 'grass', 'clover'],
    edges: [e('dead', 'worms', 1), e('worms', 'dead', -1), e('worms', 'nutrients', 1), e('dead', 'nutrients', 1), e('nutrients', 'grass', 1), e('grass', 'clover', -1)],
    loops: [{ id: 'B1', path: ['dead', 'worms'], key: 'wormsDead' }],
    highlight: null,
    chain: ['worms', 'nutrients', 'grass', 'clover']
  },
  'foxes-return': {
    habitat: 'meadow',
    nodes: ['clover', 'rabbits', 'foxes'],
    edges: RABBITS,
    loops: [{ id: 'B1', path: ['clover', 'rabbits'], key: 'rabbitsClover' }, { id: 'B2', path: ['rabbits', 'foxes'], key: 'foxesRabbits' }],
    highlight: 'B2',
    chain: ['foxes', 'rabbits', 'clover']
  },
  'ladybirds-gone': {
    habitat: 'meadow',
    nodes: ['flowers', 'aphids', 'ladybirds'],
    edges: APHIDS,
    loops: [{ id: 'B1', path: ['flowers', 'aphids'], key: 'aphidsFlowers' }, { id: 'B2', path: ['aphids', 'ladybirds'], key: 'ladybirdsAphids' }],
    highlight: 'B2'
  },
  // Goals.
  'save-pondweed': runoffCld,
  'clear-pond': {
    habitat: 'pond',
    nodes: ['runoff', 'nutrients', 'dead', 'algae', 'pondweed', 'fleas', 'minnows'],
    edges: [e('runoff', 'nutrients', 1), e('dead', 'nutrients', 1), e('nutrients', 'algae', 1), e('algae', 'dead', 1), ...SHADE, e('pondweed', 'fleas', 1), ...GRAZE, e('minnows', 'fleas', -1)],
    loops: [R_SHADE, { id: 'R2', path: ['algae', 'pondweed', 'fleas'], key: 'shelter' }, { id: 'R3', path: ['nutrients', 'algae', 'dead'], key: 'recycle' }, B_GRAZE],
    highlight: 'R1'
  },
  'protect-flowers': {
    habitat: 'meadow',
    nodes: ['flowers', 'aphids', 'ladybirds'],
    edges: APHIDS,
    loops: [{ id: 'B1', path: ['flowers', 'aphids'], key: 'aphidsFlowers' }, { id: 'B2', path: ['aphids', 'ladybirds'], key: 'ladybirdsAphids' }],
    highlight: 'B2'
  },
  'bring-back-clover': {
    habitat: 'meadow',
    nodes: ['clover', 'rabbits', 'foxes'],
    edges: RABBITS,
    loops: [{ id: 'B1', path: ['clover', 'rabbits'], key: 'rabbitsClover' }, { id: 'B2', path: ['rabbits', 'foxes'], key: 'foxesRabbits' }],
    highlight: 'B2',
    chain: ['foxes', 'rabbits', 'clover']
  }
} satisfies Record<string, Cld>;

export type CldId = keyof typeof CLDS;
export const cldOf = (id: string): Cld | undefined => (CLDS as Record<string, Cld>)[id];

/** Every loop description key used by the diagrams (content parity). */
export const LOOP_KEYS: readonly string[] = [...new Set(Object.values(CLDS as Record<string, Cld>).flatMap((c) => c.loops.map((l) => l.key)))].sort();

/** The edge from `a` to `b`, if any. */
export const edgeOf = (cld: Cld, a: string, b: string): Edge | undefined => cld.edges.find((x) => x.from === a && x.to === b);

/** The product of the signs around a loop (+1 reinforcing, −1 balancing), or 0 when an edge is missing. */
export function loopSign(cld: Cld, loop: Loop): 0 | 1 | -1 {
  let sign = 1;
  for (let k = 0; k < loop.path.length; k++) {
    const ed = edgeOf(cld, loop.path[k]!, loop.path[(k + 1) % loop.path.length]!);
    if (!ed) return 0;
    sign *= ed.sign;
  }
  return sign as 1 | -1;
}

export const loopKind = (loop: Loop): 'reinforcing' | 'balancing' => (loop.id.startsWith('R') ? 'reinforcing' : 'balancing');

/** Whether a loop contains a delay edge. */
export const loopHasDelay = (cld: Cld, loop: Loop): boolean =>
  loop.path.some((a, k) => edgeOf(cld, a, loop.path[(k + 1) % loop.path.length]!)?.delay === true);

/** The edges along an open chain. */
export const chainEdges = (cld: Cld, chain: readonly string[]): Edge[] =>
  chain.slice(1).flatMap((b, k) => {
    const ed = edgeOf(cld, chain[k]!, b);
    return ed ? [ed] : [];
  });

/* ---------- Layout (pure; SVG user units, LTR) ---------- */

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface EdgeLayout {
  readonly edge: Edge;
  /** Quadratic curve from `a` via control `c` to `b`, trimmed at the node boxes. */
  readonly a: Point;
  readonly c: Point;
  readonly b: Point;
  /** Where the sign disc sits (near the arrowhead) and the delay strokes' centre (mid-curve). */
  readonly sign: Point;
  readonly mid: Point;
  /** Direction of the curve at its end (radians), for the arrowhead. */
  readonly angle: number;
}

export interface CldLayout {
  readonly width: number;
  readonly height: number;
  readonly nodes: readonly { readonly id: string; readonly at: Point }[];
  readonly edges: readonly EdgeLayout[];
  readonly loops: readonly { readonly loop: Loop; readonly at: Point }[];
}

export const CLD_W = 360;
export const CLD_H = 260;
export const NODE_W = 92;
export const NODE_H = 30;

const round1 = (v: number) => Math.round(v * 10) / 10;
const pt = (x: number, y: number): Point => ({ x: round1(x), y: round1(y) });

/** Distance from a box centre to its edge along direction (dx, dy). */
function boxExit(dx: number, dy: number): number {
  const ax = Math.abs(dx) || 1e-9;
  const ay = Math.abs(dy) || 1e-9;
  return Math.min(NODE_W / 2 / ax, NODE_H / 2 / ay) + 4;
}

/** Nodes on an ellipse (first at the top, clockwise); edges bent to their left so that A→B and B→A separate. */
export function layoutCld(cld: Cld): CldLayout {
  const cx = CLD_W / 2;
  const cy = CLD_H / 2;
  const rx = CLD_W / 2 - NODE_W / 2 - 6;
  const ry = CLD_H / 2 - NODE_H / 2 - 8;
  const n = cld.nodes.length;
  const at = new Map<string, Point>();
  const nodes = cld.nodes.map((id, k) => {
    const ang = -Math.PI / 2 + (2 * Math.PI * k) / n;
    const p = pt(cx + rx * Math.cos(ang), cy + ry * Math.sin(ang));
    at.set(id, p);
    return { id, at: p };
  });
  const edges = cld.edges.flatMap((edge): EdgeLayout[] => {
    const p = at.get(edge.from);
    const q2 = at.get(edge.to);
    if (!p || !q2) return [];
    const dx = q2.x - p.x;
    const dy = q2.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    // Bend to the left of the direction of travel by 18 % of the length.
    const bend = 0.18 * len;
    const c = { x: (p.x + q2.x) / 2 + (dy / len) * bend, y: (p.y + q2.y) / 2 - (dx / len) * bend };
    const sx = c.x - p.x;
    const sy = c.y - p.y;
    const sl = Math.hypot(sx, sy) || 1;
    const ex = q2.x - c.x;
    const ey = q2.y - c.y;
    const el = Math.hypot(ex, ey) || 1;
    const a = pt(p.x + (sx / sl) * boxExit(sx / sl, sy / sl), p.y + (sy / sl) * boxExit(sx / sl, sy / sl));
    const b = pt(q2.x - (ex / el) * boxExit(ex / el, ey / el), q2.y - (ey / el) * boxExit(ex / el, ey / el));
    const mid = pt(0.25 * a.x + 0.5 * c.x + 0.25 * b.x, 0.25 * a.y + 0.5 * c.y + 0.25 * b.y);
    // The sign disc: on the curve at t = 0.8, pushed outward (left of travel) by 9 units.
    const t = 0.8;
    const on = { x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y };
    const sign = pt(on.x + (dy / len) * 10, on.y - (dx / len) * 10);
    return [{ edge, a, c: pt(c.x, c.y), b, mid, sign, angle: Math.atan2(b.y - c.y, b.x - c.x) }];
  });
  const loops = cld.loops.map((loop) => {
    let x = 0;
    let y = 0;
    for (const id of loop.path) {
      const p = at.get(id) ?? { x: cx, y: cy };
      x += p.x;
      y += p.y;
    }
    const k = loop.path.length || 1;
    // Two-node loops sit between their arcs; longer loops at their centroid, pulled a little to the centre.
    return { loop, at: pt((x / k) * 0.85 + cx * 0.15, (y / k) * 0.85 + cy * 0.15) };
  });
  return { width: CLD_W, height: CLD_H, nodes, edges, loops };
}
