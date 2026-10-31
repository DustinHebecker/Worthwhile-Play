/**
 * Unit and structure pictures (owner choice 2026-10-27, after Set A's "blocks with a sign"): each
 * kind is drawn as itself, in one of two views the player picks: from the side (profile, lit from
 * above, a ground shadow) or from above (top view, a drop shadow). Vehicles keep their wheels and
 * stand on outrigger legs when set up. The side is never told by colour alone: own units are filled
 * and face right (or up the map, seen from above), enemies are a pale tint with a coloured outline
 * and face the other way. Hand-written geometry in a 44-unit box (one map cell); no fonts or images.
 */

export type View = 'profile' | 'top';
export const VIEWS: readonly View[] = ['profile', 'top'];

/**
 * A part of a drawing. b: a body (filled, outlined); t: a tyre or track (dark); l: a detail line and
 * f: a detail fill (in the ink, light on own units); o: a line and of: a fill in the outline colour
 * (antennas, legs, flags); d: a dashed outline-colour line; h: a road wheel inside a track (x, y, r).
 */
type Part =
  | readonly ['b' | 't' | 'l' | 'f' | 'of', string]
  | readonly ['o' | 'd', string, number]
  | readonly ['h', number, number, number];

interface Drawing {
  readonly parts: readonly Part[];
  /** Set up in place (relay, post, jammer, gun): these parts instead, on outrigger legs. */
  readonly deployedParts?: readonly Part[];
  /** Wheels seen from the side: centre and radius. */
  readonly wheels?: readonly (readonly [number, number, number])[];
  /** Can be set up (outrigger legs instead of wheels). */
  readonly legs?: boolean;
  /** A structure: it stands on a foundation line. */
  readonly base?: boolean;
  /** Flies: a longer drop shadow seen from above. */
  readonly air?: boolean;
}

const rect = (x: number, y: number, w: number, h: number, r = 0): string =>
  r === 0
    ? `M${x},${y} H${x + w} V${y + h} H${x} Z`
    : `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x + r} A${r},${r} 0 0 1 ${x},${y + h - r} V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`;
const circ = (cx: number, cy: number, r: number): string => `M${cx - r},${cy} A${r},${r} 0 1 0 ${cx + r},${cy} A${r},${r} 0 1 0 ${cx - r},${cy} Z`;
const poly = (pts: readonly (readonly [number, number])[]): string => 'M' + pts.map((p) => p.join(',')).join(' L') + ' Z';
/** A bar of width 2·hw from a to b (barrels, tubes, beams). */
function bar(ax: number, ay: number, bx: number, by: number, hw: number): string {
  const len = Math.hypot(bx - ax, by - ay);
  const px = (-(by - ay) / len) * hw;
  const py = ((bx - ax) / len) * hw;
  const f = (n: number) => Math.round(n * 100) / 100;
  return poly([[f(ax + px), f(ay + py)], [f(bx + px), f(by + py)], [f(bx - px), f(by - py)], [f(ax - px), f(ay - py)]]);
}
/** Radio arcs on both sides of (cx, cy). */
function arcs(cx: number, cy: number, r1 = 4, r2 = 7): string {
  const a = (r: number) => {
    const k = r * 0.7;
    return `M${cx - k},${cy - k} A${r},${r} 0 0 0 ${cx - k},${cy + k} M${cx + k},${cy - k} A${r},${r} 0 0 1 ${cx + k},${cy + k}`;
  };
  return a(r1) + ' ' + a(r2);
}

// --- From the side --------------------------------------------------------------------------
const WY = 33;
const WR = 4.3;
const truckCab: Part[] = [
  ['b', 'M27,31 V20.5 H33.5 L38.5,25.5 V31 Z'],
  ['f', 'M28.8,22.3 H32.7 L35.9,25.4 H28.8 Z']
];
const truckBed: Part[] = [['b', 'M4,31 V25.5 H27 V31 Z'], ['l', 'M7,28.2 H24']];
const truckWheels = [[10, WY, WR], [32.5, WY, WR]] as const;
const pedestal = 'M10.5,35 L13,20 H31 L33.5,35 Z';

export const PROFILE: Readonly<Record<string, Drawing>> = {
  rifles: {
    // Three soldiers; the middle one stands a step back (higher up, drawn first, partly covered).
    parts: ([[22, -4], [10, 0], [34, 0]] as const).flatMap(([x, d]): Part[] => [
      ['o', `M${x - 1.1},${24.5 + d} L${x - 3},${33.6 + d} M${x + 1.1},${24.5 + d} L${x + 2.8},${33.6 + d}`, 2.4],
      ['b', `M${x - 2.7},${15.6 + d} H${x + 2.7} L${x + 2.2},${25 + d} H${x - 2.2} Z`],
      ['b', circ(x, 12.4 + d, 2.7)],
      ['o', `M${x - 1.5},${21.5 + d} L${x + 6},${17 + d}`, 1.7]
    ])
  },
  lancer: {
    parts: [
      ['o', 'M17.6,26 L13,33.6 M22.4,26 L28.8,26 L28.8,33.6', 2.4],
      ['b', 'M16.4,17 H23.6 L23,26.4 H17 Z'],
      ['b', circ(20, 13.6, 2.8)],
      ['b', bar(5, 19.6, 37.5, 12.4, 1.75)],
      ['l', 'M10,18.1 L12.6,17.5'],
      ['o', 'M3.2,17.2 L0.6,15.4 M3.4,20.2 L0.6,21.6', 1.4]
    ]
  },
  outrider: {
    parts: [
      ['o', 'M9,24.5 L6.5,10.5', 1.6],
      ['b', 'M4,31 V26.2 L10.5,24 H19.5 L23.5,19 H31.5 L35.5,24 L40,25.6 V31 Z'],
      ['f', 'M24.3,20.6 H30.6 L33.3,23.9 H21.7 Z'],
      ['l', 'M26.6,24.6 V30 M8,27.5 H38']
    ],
    wheels: [[12, WY, WR], [32, WY, WR]]
  },
  warden: {
    parts: [
      ['t', 'M6.5,27.5 H37.5 Q42,27.5 42,32.5 Q42,37.6 37,37.6 H7 Q2,37.6 2,32.5 Q2,27.5 6.5,27.5 Z'],
      ...[8, 15.3, 22.6, 29.9, 37].map((x): Part => ['h', x, 32.6, 2.9]),
      ['b', 'M3.5,28.8 L8,22.5 H36 L40.5,28.8 Z'],
      ['b', 'M13,22.5 L15.5,15.8 H27 L30,22.5 Z'],
      ['b', rect(28.5, 17, 13, 2.8, 0.6)],
      ['o', 'M17.5,15.8 V13.4 H21.5 V15.8', 1.6],
      ['l', 'M8.6,25.8 H35.4']
    ]
  },
  howitzer: {
    parts: [
      ['o', 'M7,29 L1.8,34.5', 2.4],
      ['b', bar(23.5, 21.5, 41, 8.5, 1.5)],
      ['b', 'M5.5,31 V26 H28 L33,29 V31 Z'],
      ['b', 'M14.5,26 L16.5,18.6 H27 L29.2,26 Z'],
      ['l', 'M8.5,28.6 H26'],
      ['f', circ(22, 22.4, 1.5)]
    ],
    wheels: [[12, WY, WR], [26.5, WY, WR]],
    legs: true
  },
  'mast-truck': {
    parts: [...truckBed, ...truckCab, ['o', 'M6,23.4 H25', 2.4], ['of', circ(6, 23.4, 2)]],
    deployedParts: [...truckBed, ...truckCab, ['o', 'M14,25.5 V6.5', 2.2], ['o', arcs(14, 7), 1.6]],
    wheels: truckWheels,
    legs: true
  },
  'field-post': {
    parts: [
      ['b', rect(4, 15, 22.5, 16, 1.5)],
      ...truckCab,
      ['f', rect(15.5, 18.5, 7, 4.2, 0.6)],
      ['l', 'M7.5,19 V28.5 H12.5 V19 Z'],
      ['o', 'M9.5,15 V4', 1.6],
      ['of', 'M9.5,4 L18,6.6 L9.5,9.2 Z']
    ],
    wheels: truckWheels,
    legs: true
  },
  jammer: {
    parts: [...truckBed, ...truckCab, ['b', rect(8, 21, 13, 4.5, 0.6)], ['o', 'M10,21 V8 M19,21 V8', 1.6], ['o', 'M7,13 L10,9.5 L13,14.5 L16,9.5 L19,14.5 L22,11', 1.6]],
    wheels: truckWheels,
    legs: true
  },
  tracer: {
    parts: [
      ...truckBed,
      ...truckCab,
      ['o', 'M15,25.5 V18', 2.2],
      ['b', 'M4.5,9.5 Q14,25 25,10.5 Q14.5,17.5 4.5,9.5 Z'],
      ['o', 'M15,15.6 L17.5,7.5', 1.4],
      ['of', circ(17.6, 7.2, 1.5)]
    ],
    wheels: truckWheels,
    legs: true
  },
  kite: {
    parts: [
      ['d', 'M12,38.5 H32', 1.6],
      ['b', 'M7.5,18.2 L5,9.5 H10 L14.5,17.6 Z'],
      ['b', 'M5,20 Q5.5,17 11.5,17 H31 Q38,17 40,20 Q38,23 31,23 H11.5 Q5.5,23 5,20 Z'],
      ['b', 'M15,21.5 H27.5 L24.5,27 H18 Z'],
      ['f', circ(33, 23.6, 1.9)],
      ['l', 'M12,20 H29'],
      ['o', 'M41.3,13.5 V26.5', 1.8]
    ],
    air: true
  },
  'command-post': {
    parts: [['o', 'M22,18 V3.5', 1.8], ['of', 'M22,3.5 L32.5,6.6 L22,9.7 Z'], ['b', 'M5.5,35 V22.5 L10,18 H34 L38.5,22.5 V35 Z'], ['f', rect(10.5, 23, 23, 2.8, 0.6)], ['l', 'M18.5,35 V28.5 H25.5 V35']],
    base: true
  },
  'relay-mast': {
    parts: [
      ['o', 'M13.5,35 L21,9.5 L28.5,35 M15.9,27 H26.1 M18,19.8 H24 M15.9,27 L24,19.8 M26.1,27 L18,19.8', 1.8],
      ['o', arcs(21, 9.5), 1.6],
      ['b', rect(27.5, 27.5, 12, 7.5, 1)],
      ['f', rect(30.5, 29.5, 3.5, 2.6, 0.4)]
    ],
    base: true
  },
  muster: {
    parts: [['b', 'M4,35 V21 L22,10 L40,21 V35 Z'], ['l', 'M4,21 H40'], ['l', 'M19,35 V27 H25 V35'], ['f', rect(8, 24, 6.5, 4, 0.6)], ['f', rect(29.5, 24, 6.5, 4, 0.6)]],
    base: true
  },
  'motor-pool': {
    parts: [['b', 'M3.5,35 V22.5 Q22,5 40.5,22.5 V35 Z'], ['l', 'M10.5,35 V23 H33.5 V35 M10.5,27 H33.5 M10.5,31 H33.5'], ['l', 'M8,19.5 Q22,9 36,19.5']],
    base: true
  },
  extractor: {
    parts: [
      ['o', 'M6.5,21.5 V31', 1.6],
      ['o', 'M15.5,31 L21,16 L26.5,31', 2.6],
      ['b', rect(7, 31, 30, 4, 0.8)],
      ['b', bar(5, 17.6, 36.5, 12.4, 1.5)],
      ['b', 'M2.5,13.4 L8,12.4 L9,21.8 L5,21.8 Z'],
      ['o', 'M33,22 L34.4,13.6', 1.8],
      ['b', circ(33, 22.5, 3.8)],
      ['f', circ(21, 15.6, 1.3)]
    ],
    base: true
  },
  'tower-gun': {
    parts: [['b', pedestal], ['b', 'M15,20 Q22,9.5 29,20 Z'], ['b', rect(26.5, 13.4, 15, 2.8, 0.6)], ['l', 'M12.2,27 H31.8'], ['f', rect(20.6, 22.2, 2.8, 3.6, 0.4)]],
    base: true
  },
  'tower-artillery': {
    parts: [['b', bar(21.5, 16.5, 39.5, 3.5, 1.5)], ['b', pedestal], ['b', 'M15.5,20 L18,14.5 H26 L28.5,20 Z'], ['l', 'M12.2,27 H31.8'], ['f', rect(20.6, 22.2, 2.8, 3.6, 0.4)]],
    base: true
  },
  'tower-laser': {
    parts: [['b', pedestal], ['b', rect(13, 11, 16, 9, 2)], ['b', circ(31, 15.5, 3)], ['f', circ(31, 15.5, 1.3)], ['d', 'M35.5,15.5 H43.5', 1.8], ['l', 'M16.5,13 V18 M19.8,13 V18'], ['l', 'M12.2,27 H31.8']],
    base: true
  },
  'tower-emp': {
    parts: [
      ['b', pedestal],
      ['o', 'M22,20 V16', 2.4],
      ['b', circ(22, 10.8, 5.4)],
      ['f', circ(22, 10.8, 2)],
      ['o', 'M12.3,4.4 A11,11 0 0 0 12.3,17.2 M31.7,4.4 A11,11 0 0 1 31.7,17.2', 1.6],
      ['l', 'M12.2,27 H31.8']
    ],
    base: true
  }
};

// --- From above ------------------------------------------------------------------------------
const tyres = (xs: readonly number[], w = 6, h = 3.4, yTop = 9, yBottom = 31.6): Part[] => xs.flatMap((x): Part[] => [['t', rect(x, yTop, w, h, 1)], ['t', rect(x, yBottom, w, h, 1)]]);
const truckTop = (bed: readonly Part[]): Part[] => [...tyres([8, 29]), ['b', rect(4, 12, 24.5, 20, 1.5)], ['b', rect(29.5, 13, 10.5, 18, 2.5)], ['f', rect(36.4, 15, 2.4, 14, 0.8)], ...bed];
const towerTop: Part[] = [
  ['b', circ(22, 22, 14)],
  ...Array.from({ length: 8 }, (_, i): Part => {
    const a = (i * Math.PI) / 4 + Math.PI / 8;
    return ['f', circ(Math.round((22 + Math.cos(a) * 12) * 10) / 10, Math.round((22 + Math.sin(a) * 12) * 10) / 10, 1.3)];
  })
];

export const TOP: Readonly<Record<string, Drawing>> = {
  rifles: {
    parts: ([[12, 12], [28, 14], [16, 30]] as const).flatMap(([x, y]): Part[] => [['o', `M${x + 1},${y + 2.6} H${x + 9}`, 1.7], ['b', rect(x - 4.4, y - 2.6, 8.8, 5.2, 2.6)], ['b', circ(x, y, 2.7)]])
  },
  lancer: { parts: [['b', rect(15, 16, 10, 12, 4)], ['b', circ(20, 22, 3.2)], ['b', rect(6, 24.6, 32, 3.6, 1.8)], ['l', 'M12,26.4 H15']] },
  outrider: { parts: [...tyres([9, 28], 7, 3.6, 8.5, 31.9), ['b', rect(7, 11, 30.5, 22, 6)], ['f', 'M27,14.5 L31,15.5 V28.5 L27,29.5 Z'], ['l', 'M17,12.5 V31.5 M11,22 H25']] },
  warden: {
    parts: [['t', rect(4, 7.5, 35, 6.5, 2)], ['t', rect(4, 30, 35, 6.5, 2)], ['b', rect(6, 12.5, 32, 19, 2.5)], ['b', rect(24.5, 20.6, 18, 2.8, 0.6)], ['b', circ(20, 22, 7)], ['f', circ(17.5, 20.5, 1.7)], ['l', 'M6,16 H38 M6,28 H38']]
  },
  howitzer: {
    parts: [['o', 'M6,18 L1.5,13 M6,26 L1.5,31', 2.2], ...tyres([9, 22], 7, 3.6, 8.5, 31.9), ['b', rect(5.5, 12, 26, 20, 2)], ['b', rect(22, 20.4, 21, 3.2, 0.6)], ['b', circ(21, 22, 5.5)], ['f', circ(21, 22, 1.6)]],
    legs: true
  },
  'mast-truck': { parts: truckTop([['o', 'M7,22 H25.5', 2.4], ['of', circ(7, 22, 2.2)]]), deployedParts: truckTop([['of', circ(15, 22, 3)], ['o', arcs(15, 22, 6, 9.5), 1.6]]), legs: true },
  'field-post': { parts: truckTop([['l', 'M7,16 H25.5 M7,28 H25.5'], ['of', circ(10.5, 22, 1.6)], ['of', 'M10.5,22 L21,18.5 L21,25.5 Z']]), legs: true },
  jammer: { parts: truckTop([['o', 'M6.5,22 L9.5,15.5 L12.5,28.5 L15.5,15.5 L18.5,28.5 L21.5,15.5 L24.5,22', 1.7]]), legs: true },
  tracer: { parts: truckTop([['b', circ(16, 22, 7.5)], ['l', 'M16,15 V29'], ['f', circ(16, 22, 1.8)]]), legs: true },
  kite: {
    parts: [
      ['b', 'M17,20 L22,4 H27 L25.5,20 Z'],
      ['b', 'M17,24 L22,40 H27 L25.5,24 Z'],
      ['b', 'M5,15.5 H9 L12,20 H7 Z'],
      ['b', 'M5,28.5 H9 L12,24 H7 Z'],
      ['b', 'M4.5,22 Q6,19.3 12,19.3 H33 Q39.5,19.8 41,22 Q39.5,24.2 33,24.7 H12 Q6,24.7 4.5,22 Z'],
      ['f', circ(33.5, 22, 1.6)],
      ['o', 'M42.5,15.5 V28.5', 1.8]
    ],
    air: true
  },
  'command-post': { parts: [['b', rect(5, 5, 34, 34, 2)], ['l', rect(10, 10, 24, 24, 1)], ['o', 'M16,14 V31', 1.8], ['of', 'M16,14 L30,18.5 L16,23 Z']] },
  'relay-mast': { parts: [['o', rect(14, 14, 16, 16) + ' M14,14 L30,30 M30,14 L14,30', 1.6], ['o', arcs(22, 22, 13, 17), 1.6], ['b', rect(29, 31, 11, 8, 1)]] },
  muster: { parts: [['b', rect(4, 9, 36, 26, 1.5)], ['l', 'M4,22 H40 M10,9 V35 M22,9 V35 M34,9 V35']] },
  'motor-pool': { parts: [['b', rect(4, 7, 36, 30, 6)], ['l', 'M10,7 V37 M16,7 V37 M22,7 V37 M28,7 V37 M34,7 V37'], ['f', rect(36, 12, 4, 20, 1)]] },
  extractor: { parts: [['b', rect(6, 15, 32, 14, 1.5)], ['b', rect(4, 20, 34, 4, 1)], ['b', circ(34, 22, 5)], ['b', rect(2, 18.5, 6, 7, 1)], ['f', circ(21, 22, 1.8)]] },
  'tower-gun': { parts: [...towerTop, ['b', rect(26, 20.6, 17, 2.8, 0.6)], ['b', circ(22, 22, 6.5)]] },
  'tower-artillery': { parts: [...towerTop, ['b', rect(24, 20.3, 20, 3.4, 0.6)], ['b', rect(16, 16, 12, 12, 2)]] },
  'tower-laser': { parts: [...towerTop, ['b', rect(15, 17.5, 15, 9, 2)], ['b', circ(32, 22, 3)], ['f', circ(32, 22, 1.3)], ['d', 'M36,22 H44', 1.6]] },
  'tower-emp': { parts: [...towerTop, ['b', circ(22, 22, 6)], ['f', circ(22, 22, 2.2)], ['o', circ(22, 22, 9.5), 1.4]] }
};

/** Mixes two #rrggbb colours (t = share of b); anything else comes back unchanged. */
export function mix(a: string, b: string, t: number): string {
  const p = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return a;
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i]! - v) * t).toString(16).padStart(2, '0')).join('');
}

export interface IconStyle {
  readonly own: boolean;
  /** Side colour (outline, own fill) and the surface colour (halo, own ink). */
  readonly colour: string;
  readonly surface: string;
  /** From the side (default) or from above. */
  readonly view?: View;
  /** Last known position: dashed outline, surface fill. */
  readonly ghost?: boolean;
  /** Set up in place: outrigger legs instead of wheels. */
  readonly deployed?: boolean;
  /** Under construction: dashed, hatched outline with the turns left. */
  readonly site?: number;
}

const LEGS_PROFILE = 'M9,30 L5,37.4 M35,30 L39,37.4 M2,37.4 H8 M36,37.4 H42';
const LEGS_TOP = 'M5,12.5 L1.2,8.2 M5,31.5 L1.2,35.8 M39,13 L42.8,8.2 M39,31 L42.8,35.8';

type Drawn = Part | readonly ['w', number, number, number];

/**
 * Draws `kind` with its 44-unit box at (x, y), scaled by `scale`. Returns false if the kind has no
 * picture (a canvas without Path2D, e.g. tests, or an unknown kind).
 */
export function drawIcon(g: CanvasRenderingContext2D, kind: string, x: number, y: number, scale: number, style: IconStyle): boolean {
  const top = style.view === 'top';
  const def = (top ? TOP : PROFILE)[kind];
  if (!def || typeof Path2D === 'undefined') return false;
  const deployed = !!style.deployed && !!def.legs;
  const parts = deployed && def.deployedParts ? def.deployedParts : def.parts;
  const faded = !!style.ghost || style.site !== undefined;
  const own = style.own && !faded;
  const { colour, surface } = style;
  // The enemy is a pale tint of its colour with a coloured outline (filled or not: a cue besides colour).
  const fill = own ? colour : faded ? surface : mix(colour, surface, 0.8);
  const edge = own ? mix(colour, '#000000', 0.42) : colour;
  const ink = own ? surface : colour;
  const tyre = mix(colour, '#161616', 0.78);
  const dash = faded ? [3.5, 2.5] : [];

  g.save();
  g.translate(x, y);
  g.scale(scale, scale);
  g.save();
  // The enemy faces the other way.
  if (!style.own) {
    if (top) {
      g.translate(44, 44);
      g.rotate(Math.PI);
    } else {
      g.translate(44, 0);
      g.scale(-1, 1);
    }
  }
  g.lineJoin = 'round';
  g.lineCap = 'round';
  const wheels: Drawn[] = top || deployed ? [] : (def.wheels ?? []).map(([wx, wy, r]) => ['w', wx, wy, r] as const);
  const all: Drawn[] = [...parts, ...wheels];
  const pathOf = (p: Drawn): Path2D =>
    p[0] === 'w' || p[0] === 'h' ? new Path2D(circ(p[1], p[2], p[3])) : new Path2D(p[1]);
  const width = (p: Drawn): number => (p[0] === 'o' || p[0] === 'd' ? p[2] : p[0] === 'l' ? 1.3 : 1.6);
  const extra: Drawn[] = [];
  if (deployed) extra.push(['o', top ? LEGS_TOP : LEGS_PROFILE, 2.4]);
  if (def.base && !top) extra.push(['o', 'M3,35.8 H41', 2.6]);

  // Shadows: a soft ground shadow from the side, a drop shadow from above.
  if (!faded && !top) {
    g.fillStyle = 'rgba(0,0,0,0.22)';
    g.beginPath();
    g.ellipse(22, def.air ? 39 : 37.6, def.air ? 11 : 18, 2.4, 0, 0, Math.PI * 2);
    g.fill();
  }
  if (!faded && top) {
    g.save();
    g.translate(def.air ? 3 : 1.6, def.air ? 3 : 1.6);
    g.fillStyle = 'rgba(0,0,0,0.22)';
    for (const p of all) if (p[0] === 'b' || p[0] === 't') g.fill(pathOf(p));
    g.restore();
  }
  // Halo: a surface-coloured outline around everything, so it stands out from any terrain.
  g.strokeStyle = surface;
  g.fillStyle = surface;
  for (const p of [...all, ...extra]) {
    if (p[0] === 'l' || p[0] === 'f' || p[0] === 'h') continue;
    g.lineWidth = width(p) + 3.4;
    g.stroke(pathOf(p));
    if (p[0] === 'of') g.fill(pathOf(p));
  }
  // A wheel's face: the dark tyre, a large rim (own: a little darker than the vehicle; enemy: a
  // tint of its colour) and a dark hub, so it reads as a wheel even on a phone.
  const wheelFace = (wx: number, wy: number, r: number) => {
    g.beginPath();
    if (faded) {
      g.arc(wx, wy, r * 0.5, 0, Math.PI * 2);
      g.strokeStyle = colour;
      g.lineWidth = 0.9;
      g.stroke();
      return;
    }
    g.arc(wx, wy, r * 0.72, 0, Math.PI * 2);
    g.fillStyle = own ? mix(colour, '#000000', 0.22) : mix(colour, surface, 0.45);
    g.fill();
    g.lineWidth = 0.8;
    g.strokeStyle = tyre;
    g.stroke();
    g.beginPath();
    g.arc(wx, wy, r * 0.24, 0, Math.PI * 2);
    g.fillStyle = tyre;
    g.fill();
  };
  // Light from above: lighter at the top of a body, darker at its foot.
  const shade = (path: Path2D) => {
    g.save();
    g.clip(path);
    const grad = g.createLinearGradient(0, 3, 0, 38);
    grad.addColorStop(0, 'rgba(255,255,255,0.62)');
    grad.addColorStop(0.42, 'rgba(255,255,255,0.08)');
    grad.addColorStop(0.62, 'rgba(0,0,0,0.06)');
    grad.addColorStop(1, 'rgba(0,0,0,0.48)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 44, 44);
    g.restore();
  };
  for (const p of [...extra, ...all]) {
    const path = pathOf(p);
    g.setLineDash(p[0] === 'd' ? [2.5, 2.5] : dash);
    switch (p[0]) {
      case 'b':
        g.fillStyle = fill;
        g.fill(path);
        if (!faded && !top) shade(path);
        g.strokeStyle = edge;
        g.lineWidth = 1.6;
        g.stroke(path);
        break;
      case 't':
      case 'w':
        g.fillStyle = faded ? surface : tyre;
        g.fill(path);
        g.strokeStyle = faded ? colour : tyre;
        g.lineWidth = 1.2;
        g.stroke(path);
        if (p[0] === 'w') wheelFace(p[1], p[2], p[3]);
        break;
      case 'h':
        wheelFace(p[1], p[2], p[3] / 0.72);
        break;
      case 'l':
        if (faded) break;
        g.strokeStyle = ink;
        g.lineWidth = 1.3;
        g.stroke(path);
        break;
      case 'f':
        if (faded) break;
        g.fillStyle = ink;
        g.fill(path);
        break;
      case 'o':
      case 'd':
        g.strokeStyle = edge;
        g.lineWidth = width(p);
        g.stroke(path);
        break;
      case 'of':
        g.fillStyle = edge;
        g.fill(path);
        break;
    }
  }
  g.setLineDash([]);
  if (style.site !== undefined) {
    // Hatching inside the bodies of a site.
    const clip = new Path2D();
    for (const p of all) if (p[0] === 'b') clip.addPath(pathOf(p));
    g.save();
    g.clip(clip);
    g.strokeStyle = colour;
    g.lineWidth = 1.2;
    g.stroke(new Path2D(Array.from({ length: 27 }, (_, i) => `M${-44 + i * 5},44 L${i * 5},0`).join(' ')));
    g.restore();
  }
  g.restore();
  // The turns a site has left (never mirrored).
  if (style.site !== undefined) {
    g.font = '800 14px system-ui, sans-serif';
    g.textAlign = 'center';
    g.lineWidth = 3.4;
    g.strokeStyle = surface;
    g.strokeText(String(style.site), 22, 27);
    g.fillStyle = colour;
    g.fillText(String(style.site), 22, 27);
  }
  g.restore();
  return true;
}
