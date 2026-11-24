import { svg, type ArtProvider, type AdventureState, type Scene } from '@wp/adventure-engine';
import { SHAPES } from './structure';

/**
 * Code-drawn scenes for Adventure A (owner decision Q1: vector art drawn in code, swappable later).
 * Style: a "paper diorama" — flat silhouettes in 3–5 depth layers, soft gradients for sky, water and fog,
 * a restricted dusk palette. Objects are drawn where the structure puts their hotspots (`SHAPES`), and a
 * changed state (lamp taken, chain open, oil taken) changes the picture. Pictures carry no information that
 * the text does not: they are decoration for sighted players.
 */

type Attrs = Record<string, string | number>;
const g = (attrs: Attrs, ...children: SVGElement[]): SVGGElement => {
  const el = svg('g', attrs);
  el.append(...children);
  return el;
};
const rect = (x: number, y: number, w: number, h: number, fill: string, extra: Attrs = {}) => svg('rect', { x, y, width: w, height: h, fill, ...extra });
const path = (d: string, fill: string, extra: Attrs = {}) => svg('path', { d, fill, ...extra });
const ellipse = (cx: number, cy: number, rx: number, ry: number, fill: string, extra: Attrs = {}) => svg('ellipse', { cx, cy, rx, ry, fill, ...extra });

function linear(id: string, stops: readonly (readonly [number, string])[], vertical = true): SVGLinearGradientElement {
  const grad = svg('linearGradient', vertical ? { id, x1: 0, y1: 0, x2: 0, y2: 1 } : { id, x1: 0, y1: 0, x2: 1, y2: 0 });
  for (const [offset, color] of stops) grad.append(svg('stop', { offset, 'stop-color': color }));
  return grad;
}
function radial(id: string, stops: readonly (readonly [number, string, number?])[]): SVGRadialGradientElement {
  const grad = svg('radialGradient', { id });
  for (const [offset, color, opacity] of stops) grad.append(svg('stop', { offset, 'stop-color': color, 'stop-opacity': opacity ?? 1 }));
  return grad;
}
const defs = (...children: SVGElement[]): SVGDefsElement => {
  const d = svg('defs');
  d.append(...children);
  return d;
};

/** A soft horizontal fog band. */
const fog = (y: number, h: number, opacity: number) => rect(-50, y, 1700, h, 'url(#adva-fog)', { opacity, rx: h / 2 });

/** Drowned towers far out in the lake (the goal of the adventure). */
function towers(): SVGGElement {
  const c = '#4a5563';
  return g(
    { opacity: 0.85 },
    path('M300 470 L300 380 L318 350 L336 380 L336 470 Z', c),
    path('M380 470 L380 330 L404 290 L428 330 L428 470 Z', c),
    rect(392, 350, 10, 18, '#2f3742'),
    path('M470 470 L470 400 L486 375 L502 400 L502 470 Z', c),
    path('M1180 470 L1180 360 L1200 330 L1220 360 L1220 470 Z', c),
    rect(1194, 380, 10, 16, '#2f3742')
  );
}

function jetty(state: Readonly<AdventureState>): SVGGElement {
  const s = SHAPES.jetty;
  const lampTaken = state.items.includes('lamp') || state.used.includes('lamp');
  const chainOpen = (state.flags['chain-open'] ?? 0) > 0;
  const lampAtBow = (state.flags['keeper-ready'] ?? 0) > 0;
  const k = s.keeper;
  return g(
    { class: 'adva-jetty' },
    defs(
      linear('adva-sky', [[0, '#2b3446'], [0.55, '#6b6f80'], [1, '#c9a98a']]),
      linear('adva-water', [[0, '#5d6878'], [1, '#262d38']]),
      linear('adva-fog', [[0, '#d7dbe0'], [0.5, '#eef0f2'], [1, '#d7dbe0']], false),
      radial('adva-glow', [[0, '#ffd38a', 0.9], [1, '#ffd38a', 0]])
    ),
    rect(0, 0, 1600, 900, 'url(#adva-sky)'),
    path('M0 470 Q200 420 420 455 T860 440 T1300 450 T1600 430 L1600 470 L0 470 Z', '#3a4250'),
    towers(),
    rect(0, 470, 1600, 430, 'url(#adva-water)'),
    fog(430, 70, 0.55),
    fog(520, 50, 0.35),
    // Jetty planks.
    path('M0 690 L1350 650 L1400 700 L0 760 Z', '#4b3a2c'),
    ...Array.from({ length: 14 }, (_, i) => rect(40 + i * 95, 650 + i * -2.5, 6, 100, '#3a2c21')),
    // Posts.
    rect(355, 240, 22, 470, '#3a2c21'),
    rect(1060, 560, 26, 160, '#3a2c21'),
    // Lamp on the post (until taken).
    lampTaken ? rect(372, 268, 34, 6, '#2a211a') : g({}, rect(372, 268, 34, 6, '#2a211a'), path('M376 274 L404 274 L410 330 L370 330 Z', '#8c8f94', { stroke: '#2a211a', 'stroke-width': 4 }), rect(368, 330, 44, 10, '#2a211a')),
    // Boat.
    path(`M${s.boat.x} ${s.boat.y + 40} Q${s.boat.x + 190} ${s.boat.y + 160} ${s.boat.x + 380} ${s.boat.y + 40} L${s.boat.x + 350} ${s.boat.y + 95} Q${s.boat.x + 190} ${s.boat.y + 170} ${s.boat.x + 30} ${s.boat.y + 95} Z`, '#5a4130'),
    rect(s.boat.x + 120, s.boat.y + 40, 150, 10, '#3a2c21'),
    lampAtBow ? g({}, ellipse(s.boat.x + 360, s.boat.y + 10, 90, 90, 'url(#adva-glow)'), rect(s.boat.x + 350, s.boat.y + 5, 22, 30, '#ffd38a')) : g({}),
    // Chain from the bow to the post, and its lock (until opened).
    chainOpen
      ? path(`M${s.boat.x + 370} ${s.boat.y + 60} Q${s.boat.x + 420} ${s.boat.y + 140} ${s.boat.x + 450} ${s.boat.y + 150}`, 'none', { stroke: '#2a2f36', 'stroke-width': 8, 'stroke-dasharray': '10 6' })
      : g(
          {},
          path(`M${s.boat.x + 370} ${s.boat.y + 60} L${s.lock.x + 30} ${s.lock.y + 55}`, 'none', { stroke: '#2a2f36', 'stroke-width': 8, 'stroke-dasharray': '10 6' }),
          rect(s.lock.x + 25, s.lock.y + 30, 70, 60, '#a8823b', { rx: 10, stroke: '#5c4720', 'stroke-width': 5 }),
          svg('circle', { cx: s.lock.x + 60, cy: s.lock.y + 60, r: 16, fill: '#5c4720' })
        ),
    // The ferry keeper: a hooded silhouette with a pole.
    g(
      {},
      rect(k.x + 118, k.y - 20, 8, 320, '#2a211a'),
      path(`M${k.x + 30} ${k.y + 300} L${k.x + 45} ${k.y + 110} Q${k.x + 75} ${k.y + 40} ${k.x + 105} ${k.y + 110} L${k.x + 120} ${k.y + 300} Z`, '#2c3038'),
      ellipse(k.x + 75, k.y + 80, 30, 36, '#2c3038')
    ),
    // Path up to the village.
    path('M1400 760 L1460 560 L1520 470 L1600 470 L1600 760 Z', '#463a2e'),
    path('M1440 700 L1500 540 L1560 480', 'none', { stroke: '#6b5a48', 'stroke-width': 10, 'stroke-linecap': 'round' }),
    fog(760, 140, 0.25)
  );
}

function square(state: Readonly<AdventureState>): SVGGElement {
  const s = SHAPES.square;
  const read = state.clues.includes('heron-notches');
  const b = s.board;
  const notch = (x: number, y: number, fresh: boolean) => rect(x, y, 6, 26, fresh ? '#e8dcc0' : '#6f6658', { rx: 2 });
  return g(
    { class: 'adva-square' },
    defs(linear('adva-sky2', [[0, '#3a4152'], [1, '#9c8c7d']]), linear('adva-fog', [[0, '#d7dbe0'], [0.5, '#eef0f2'], [1, '#d7dbe0']], false)),
    rect(0, 0, 1600, 900, 'url(#adva-sky2)'),
    // Houses in two depth layers.
    path('M0 520 L0 300 L120 220 L240 300 L240 520 Z M420 520 L420 280 L520 210 L620 280 L620 520 Z M1250 520 L1250 260 L1370 190 L1490 260 L1490 520 Z', '#4a4a52'),
    path(`M${s.door.x - 80} 700 L${s.door.x - 80} 300 L${s.door.x + 95} 190 L${s.door.x + 270} 300 L${s.door.x + 270} 700 Z`, '#5a4f4a'),
    rect(s.door.x + 165, 205, 34, 70, '#3d3532'),
    path(`M${s.door.x + 170} 205 q 10 -40 -6 -80 q 20 30 12 80`, '#cfd3d8', { opacity: 0.5 }),
    rect(s.door.x, s.door.y, s.door.w, s.door.h, '#3b2a20', { rx: 14 }),
    // Cobbles.
    rect(0, 700, 1600, 200, '#5d5852'),
    ...Array.from({ length: 24 }, (_, i) => ellipse(40 + i * 66, 760 + (i % 3) * 40, 26, 10, '#6b6660')),
    // The tally board: rows of creatures with notches; the heron row is fresh.
    rect(b.x, b.y, b.w, b.h, '#8a8174', { rx: 8, stroke: '#4f483f', 'stroke-width': 6 }),
    rect(b.x + 140, b.y + b.h, 20, 140, '#4f483f'),
    // Heron (tall bird), fish, frog — simple carved glyphs.
    path(`M${b.x + 30} ${b.y + 70} l12 -40 l6 10 l-8 30 l14 0 l-10 8 Z`, '#3d372f'),
    ...[0, 1, 2].map((i) => notch(b.x + 80 + i * 18, b.y + 36, true)),
    ellipse(b.x + 45, b.y + 130, 20, 10, '#3d372f'),
    path(`M${b.x + 62} ${b.y + 130} l14 -10 l0 20 Z`, '#3d372f'),
    ...[0, 1, 2, 3, 4].map((i) => notch(b.x + 80 + i * 18, b.y + 116, false)),
    ellipse(b.x + 45, b.y + 205, 18, 13, '#3d372f'),
    ...[0, 1].map((i) => notch(b.x + 80 + i * 18, b.y + 192, false)),
    read ? rect(b.x + 20, b.y + 22, 150, 56, 'none', { stroke: '#e8dcc0', 'stroke-width': 3, rx: 8, 'stroke-dasharray': '8 6' }) : g({}),
    // Well.
    ellipse(s.well.x + 115, s.well.y + 60, 110, 34, '#3a3a3e'),
    rect(s.well.x + 5, s.well.y + 60, 220, 150, '#6d6860', { rx: 10 }),
    rect(s.well.x + 20, s.well.y - 60, 12, 120, '#3a2c21'),
    rect(s.well.x + 198, s.well.y - 60, 12, 120, '#3a2c21'),
    rect(s.well.x + 10, s.well.y - 70, 210, 14, '#3a2c21'),
    // Path down to the jetty.
    path('M1400 900 L1470 700 L1560 560 L1600 560 L1600 900 Z', '#463a2e'),
    fog(560, 90, 0.2)
  );
}

function hut(state: Readonly<AdventureState>): SVGGElement {
  const s = SHAPES.hut;
  const oilTaken = state.items.includes('oil') || state.used.includes('oil');
  const f = s.flask;
  const h = s.hearth;
  return g(
    { class: 'adva-hut' },
    defs(linear('adva-wall', [[0, '#3b2f28'], [1, '#55443a']]), radial('adva-ember', [[0, '#ff9a4d', 0.95], [0.6, '#c2461f', 0.6], [1, '#c2461f', 0]])),
    rect(0, 0, 1600, 900, 'url(#adva-wall)'),
    // Beams with hanging nets and tools.
    rect(0, 80, 1600, 40, '#2a211a'),
    rect(0, 200, 1600, 24, '#2a211a'),
    path('M200 120 q60 140 120 0 M260 120 l0 120 M240 150 l40 40 M280 150 l-40 40', 'none', { stroke: '#8c7b63', 'stroke-width': 4 }),
    path('M1140 120 l0 90 l30 30 M1180 120 l0 110', 'none', { stroke: '#8c7b63', 'stroke-width': 6, 'stroke-linecap': 'round' }),
    // Shelf with the oil flask (until taken).
    rect(f.x - 60, f.y + f.h, f.w + 160, 18, '#2a211a'),
    rect(f.x + 120, f.y + 70, 40, 90, '#5a6a55', { rx: 6 }),
    oilTaken ? g({}) : g({}, rect(f.x + 35, f.y + 40, 60, 120, '#b38b3f', { rx: 14 }), rect(f.x + 52, f.y + 12, 26, 32, '#6b5124', { rx: 4 })),
    // Hearth with glowing embers.
    rect(h.x, h.y, h.w, h.h, '#4a4038', { rx: 10 }),
    rect(h.x + 40, h.y + 70, h.w - 80, h.h - 70, '#1d1814'),
    ellipse(h.x + h.w / 2, h.y + h.h - 40, 150, 70, 'url(#adva-ember)'),
    ...Array.from({ length: 6 }, (_, i) => ellipse(h.x + 110 + i * 32, h.y + h.h - 30, 16, 8, i % 2 ? '#ff8a3d' : '#d4552a')),
    rect(h.x - 20, h.y - 20, h.w + 40, 30, '#2a211a'),
    // Door back to the square.
    rect(s.door.x, s.door.y, s.door.w, s.door.h, '#2f241c', { rx: 12 }),
    rect(s.door.x + 150, s.door.y + 210, 20, 20, '#a8823b', { rx: 10 }),
    // Floor.
    rect(0, 760, 1600, 140, '#2a221d')
  );
}

const SCENES: Readonly<Record<string, (state: Readonly<AdventureState>) => SVGGElement>> = { jetty, square, hut };

export const prologueArt: ArtProvider = {
  render(scene: Scene, state: Readonly<AdventureState>): SVGElement {
    const draw = SCENES[scene.id];
    return draw ? draw(state) : g({});
  }
};
