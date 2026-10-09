import { hairColourVisible, type Face, type FaceShape } from './rules';

/**
 * Builds a friendly, calm portrait from face feature ids as a flat list of SVG elements (pure data, no
 * DOM), drawn back to front in a 100 × 110 view box. Original drawing code; no third-party art.
 */
export interface SvgNode {
  tag: 'path' | 'circle' | 'ellipse' | 'rect' | 'line';
  attrs: Record<string, string | number>;
}

export const VIEW_BOX = '0 0 100 110';

/** [fill, shade] from light to deep. Visual only. */
export const SKIN: readonly (readonly [string, string])[] = [
  ['#f8e1cf', '#e2b99a'],
  ['#efc9a9', '#d29f7b'],
  ['#e0b089', '#c38b63'],
  ['#cc9a6e', '#a9754c'],
  ['#b07b52', '#8c5a37'],
  ['#8d5b3a', '#6c4128'],
  ['#704629', '#52311b'],
  ['#55341f', '#3c2314']
];

export const HAIR: Readonly<Record<Face['hairColour'], string>> = {
  black: '#231b17',
  darkbrown: '#4b3022',
  brown: '#7b4e2b',
  auburn: '#a2482a',
  blond: '#d9b46c',
  grey: '#b5b0a8'
};

const BROW: Readonly<Record<Face['hairColour'], string>> = { ...HAIR, blond: '#a8834a', grey: '#8a857e' };
/** Headscarf / cap colours, indexed like HAIR_COLOURS. */
const COVER = ['#3f5f8a', '#7a4a6e', '#2f6b5a', '#a0563a', '#b8953f', '#5b5b78'] as const;
const COVER_KEYS: readonly Face['hairColour'][] = ['black', 'darkbrown', 'brown', 'auburn', 'blond', 'grey'];
export const SHIRT = ['#4f7a9a', '#8a5a7a', '#5f8a5a', '#b07a3a', '#6a6a8a', '#9a4a4a'] as const;

const INK = '#2a1d17';
const CX = 50;
const CY = 50;

const HEAD: Readonly<Record<FaceShape, { rx: number; ry: number }>> = {
  oval: { rx: 27, ry: 33 },
  round: { rx: 30, ry: 30 },
  long: { rx: 24.5, ry: 35 },
  square: { rx: 28, ry: 32 },
  heart: { rx: 29, ry: 33 }
};

const r1 = (n: number) => Math.round(n * 10) / 10;
const p = (...parts: (string | number)[]) => parts.map((x) => (typeof x === 'number' ? r1(x) : x)).join(' ');

function headPath(shape: FaceShape, rx: number, ry: number): SvgNode {
  if (shape === 'square') {
    const t = 15;
    const j = 10;
    const d = p('M', CX - rx, CY - ry + t, 'Q', CX - rx, CY - ry, CX - rx + t, CY - ry, 'L', CX + rx - t, CY - ry, 'Q', CX + rx, CY - ry, CX + rx, CY - ry + t,
      'L', CX + rx, CY + ry - j, 'Q', CX + rx, CY + ry, CX + rx - j * 1.6, CY + ry, 'L', CX - rx + j * 1.6, CY + ry, 'Q', CX - rx, CY + ry, CX - rx, CY + ry - j, 'Z');
    return { tag: 'path', attrs: { d } };
  }
  if (shape === 'heart') {
    const d = p('M', CX, CY + ry, 'C', CX - rx * 0.55, CY + ry, CX - rx, CY + ry * 0.35, CX - rx, CY - ry * 0.15, 'C', CX - rx, CY - ry * 0.85, CX - rx * 0.5, CY - ry, CX, CY - ry,
      'C', CX + rx * 0.5, CY - ry, CX + rx, CY - ry * 0.85, CX + rx, CY - ry * 0.15, 'C', CX + rx, CY + ry * 0.35, CX + rx * 0.55, CY + ry, CX, CY + ry, 'Z');
    return { tag: 'path', attrs: { d } };
  }
  return { tag: 'ellipse', attrs: { cx: CX, cy: CY, rx, ry } };
}

/** Hair over the top of the head, down to `side` at the temples, with the hairline at `depth` × ry above the centre. */
function cap(rx: number, ry: number, pad: number, side: number, depth: number, sweep = 0): string {
  const L = CX - rx - pad;
  const R = CX + rx + pad;
  const y = CY + side;
  return p('M', L, y, 'A', rx + pad, ry + pad, 0, 0, 1, R, y, 'C', CX + rx * (0.55 + sweep), CY - ry * (depth - sweep), CX - rx * (0.55 - sweep), CY - ry * (depth + sweep), L, y, 'Z');
}

export function faceSvg(face: Face): SvgNode[] {
  const { rx, ry } = HEAD[face.shape];
  const [skin, shade] = SKIN[face.skin] ?? (SKIN[0] as readonly [string, string]);
  const hair = HAIR[face.hairColour];
  const cover = COVER[Math.max(0, COVER_KEYS.indexOf(face.hairColour))] as string;
  const nodes: SvgNode[] = [];
  const add = (tag: SvgNode['tag'], attrs: SvgNode['attrs']) => nodes.push({ tag, attrs });
  const eyeY = CY - 1;
  const eyeDx = rx > 26 ? 10 : 9;
  const mouthY = CY + 18;

  // Hair behind the head.
  if (face.hair === 'long')
    add('path', { d: p('M', CX - rx - 6, CY, 'A', rx + 6, ry + 5, 0, 0, 1, CX + rx + 6, CY, 'L', CX + rx + 9, CY + ry + 22, 'L', CX - rx - 9, CY + ry + 22, 'Z'), fill: hair });
  if (face.hair === 'wavy') {
    const b = CY + ry * 0.75;
    add('path', {
      d: p('M', CX - rx - 6, CY, 'A', rx + 6, ry + 5, 0, 0, 1, CX + rx + 6, CY, 'L', CX + rx + 8, b, 'q', -3, 6, -7, 1, 'q', -3, 5, -6, -1,
        'L', CX - rx + 5, b - 1, 'q', -3, 6, -6, 1, 'q', -4, 5, -7, -1, 'Z'),
      fill: hair
    });
  }
  if (face.hair === 'curly')
    for (let a = 150; a <= 390; a += 30) {
      const rad = (a * Math.PI) / 180;
      add('circle', { cx: r1(CX + (rx + 2) * Math.cos(rad)), cy: r1(CY - 4 + (ry + 1) * Math.sin(rad)), r: 9, fill: hair });
    }
  if (face.hair === 'headscarf')
    add('path', { d: p('M', CX - rx - 9, CY, 'A', rx + 9, ry + 8, 0, 0, 1, CX + rx + 9, CY, 'L', CX + rx + 13, CY + ry + 16, 'Q', CX, CY + ry + 26, CX - rx - 13, CY + ry + 16, 'Z'), fill: cover });

  // Neck, shoulders (shirt), ears, head.
  add('rect', { x: CX - 9, y: CY + ry - 12, width: 18, height: 30, fill: shade });
  add('path', { d: p('M', 4, 110, 'C', 6, 97, 20, 92, 38, 90, 'Q', CX, 100, 62, 90, 'C', 80, 92, 94, 97, 96, 110, 'Z'), fill: SHIRT[face.shirt] ?? SHIRT[0] });
  if (face.hair === 'headscarf')
    add('path', { d: p('M', CX - rx - 13, CY + ry + 16, 'Q', CX, CY + ry + 26, CX + rx + 13, CY + ry + 16, 'L', CX + rx + 4, 110, 'L', CX - rx - 4, 110, 'Z'), fill: cover });
  if (face.hair !== 'headscarf')
    for (const side of [-1, 1]) add('ellipse', { cx: CX + side * (rx - 1), cy: CY + 2, rx: 5, ry: 8, fill: skin, stroke: shade, 'stroke-width': 1 });
  const head = headPath(face.shape, rx, ry);
  add(head.tag, { ...head.attrs, fill: skin, stroke: INK, 'stroke-opacity': 0.35, 'stroke-width': 0.9 });
  // Soft cheeks.
  for (const side of [-1, 1]) add('ellipse', { cx: CX + side * 15, cy: CY + 10, rx: 5, ry: 3, fill: '#e07a6a', opacity: 0.18 });

  // Marks.
  if (face.mark === 'freckles')
    for (const [dx, dy] of [[-17, 7], [-13, 9], [-15, 12], [-10, 6], [17, 7], [13, 9], [15, 12], [10, 6]] as const)
      add('circle', { cx: CX + dx, cy: CY + dy, r: 0.95, fill: '#8a5236', opacity: 0.75 });
  if (face.mark === 'mole') add('circle', { cx: CX + 13, cy: CY + 14, r: 1.3, fill: '#4a2c1c' });

  // Beard under the mouth.
  if (face.facialHair === 'beard')
    add('path', {
      d: p('M', CX - rx + 1, CY + 4, 'Q', CX - rx + 3, CY + ry + 2, CX, CY + ry + 4, 'Q', CX + rx - 3, CY + ry + 2, CX + rx - 1, CY + 4,
        'Q', CX + rx - 8, CY + ry * 0.45, CX, CY + ry * 0.48, 'Q', CX - rx + 8, CY + ry * 0.45, CX - rx + 1, CY + 4, 'Z'),
      fill: hair
    });

  // Eyebrows.
  const browW = face.brows === 'thick' ? 3.4 : 1.9;
  for (const side of [-1, 1]) {
    const ex = CX + side * eyeDx;
    const by = CY - 10;
    const d =
      face.brows === 'straight'
        ? p('M', ex - 6, by, 'L', ex + 6, by)
        : face.brows === 'arched'
          ? p('M', ex - 6, by + 1.5, 'Q', ex, by - 3.5, ex + 6, by + 1.5)
          : p('M', ex - 6, by + 1, 'Q', ex, by - 1.5, ex + 6, by + 0.5);
    add('path', { d, fill: 'none', stroke: BROW[face.hairColour], 'stroke-width': browW, 'stroke-linecap': 'round' });
  }

  // Eyes.
  for (const side of [-1, 1]) {
    const ex = CX + side * eyeDx;
    if (face.eyes === 'small') add('circle', { cx: ex, cy: eyeY, r: 2.3, fill: INK });
    else if (face.eyes === 'large') {
      add('ellipse', { cx: ex, cy: eyeY, rx: 4.3, ry: 3.4, fill: '#ffffff', stroke: INK, 'stroke-width': 0.8 });
      add('circle', { cx: ex, cy: eyeY, r: 2.4, fill: '#3b2a20' });
      add('circle', { cx: ex + 0.8, cy: eyeY - 0.8, r: 0.8, fill: '#ffffff' });
    } else add('path', { d: p('M', ex - 4, eyeY + 1, 'Q', ex, eyeY - 3.5, ex + 4, eyeY + 1), fill: 'none', stroke: INK, 'stroke-width': 1.8, 'stroke-linecap': 'round' });
  }

  // Nose.
  const nose =
    face.nose === 'small'
      ? p('M', CX - 2.5, CY + 9, 'Q', CX, CY + 11.5, CX + 2.5, CY + 9)
      : face.nose === 'straight'
        ? p('M', CX - 0.5, CY + 1, 'L', CX - 2, CY + 10, 'Q', CX, CY + 12, CX + 3, CY + 10)
        : p('M', CX - 4.5, CY + 7.5, 'Q', CX - 5.5, CY + 12, CX, CY + 12, 'Q', CX + 5.5, CY + 12, CX + 4.5, CY + 7.5);
  add('path', { d: nose, fill: 'none', stroke: shade, 'stroke-width': 1.6, 'stroke-linecap': 'round' });

  // Moustache (also part of the beard).
  if (face.facialHair !== 'none')
    add('path', { d: p('M', CX - 8, mouthY - 3, 'Q', CX - 4, mouthY - 7.5, CX, mouthY - 5, 'Q', CX + 4, mouthY - 7.5, CX + 8, mouthY - 3, 'Q', CX, mouthY - 4.5, CX - 8, mouthY - 3, 'Z'), fill: hair });

  // Mouth: always friendly.
  if (face.mouth === 'broad') {
    add('path', { d: p('M', CX - 8.5, mouthY - 1.5, 'Q', CX, mouthY + 9, CX + 8.5, mouthY - 1.5, 'Z'), fill: '#6e2f2f' });
    add('path', { d: p('M', CX - 7, mouthY - 0.8, 'Q', CX, mouthY + 2.4, CX + 7, mouthY - 0.8, 'Z'), fill: '#ffffff' });
  } else {
    const w = face.mouth === 'smile' ? 8 : 5.5;
    const depth = face.mouth === 'smile' ? 5 : 2.5;
    add('path', { d: p('M', CX - w, mouthY - 1, 'Q', CX, mouthY - 1 + depth * 1.4, CX + w, mouthY - 1), fill: 'none', stroke: '#8a3b36', 'stroke-width': 1.9, 'stroke-linecap': 'round' });
  }

  // Hair and coverings in front.
  switch (face.hair) {
    case 'buzz':
      add('path', { d: cap(rx, ry, 1.2, 0, 1.02), fill: hair, opacity: 0.92 });
      break;
    case 'short':
      add('path', { d: cap(rx, ry, 5, -2, 0.95, 0.15), fill: hair });
      add('path', { d: p('M', CX - rx * 0.9, CY - ry * 0.55, 'Q', CX - rx * 0.3, CY - ry * 0.5, CX + rx * 0.2, CY - ry * 0.85, 'L', CX - rx * 0.6, CY - ry * 0.95, 'Z'), fill: hair });
      break;
    case 'curly':
      add('path', { d: cap(rx, ry, 2, 0, 0.95), fill: hair });
      for (let x = -rx * 0.6; x <= rx * 0.61; x += rx * 0.3) add('circle', { cx: r1(CX + x), cy: r1(CY - ry * 0.68 - Math.abs(x) * 0.25), r: 5, fill: hair });
      break;
    case 'wavy':
      add('path', { d: cap(rx, ry, 4, 4, 0.92, 0.18), fill: hair });
      break;
    case 'long':
      add('path', { d: cap(rx, ry, 4, 6, 0.95), fill: hair });
      add('path', { d: p('M', CX, CY - ry - 3, 'L', CX, CY - ry * 0.7), stroke: shade, 'stroke-width': 1, opacity: 0.6 });
      break;
    case 'bun':
      add('circle', { cx: CX, cy: CY - ry - 7, r: 10, fill: hair });
      add('path', { d: cap(rx, ry, 1.5, 0, 1.0), fill: hair });
      break;
    case 'headscarf': {
      const ring =
        p('M', CX - rx - 9, CY - 2, 'A', rx + 9, ry + 8, 0, 1, 1, CX + rx + 9, CY - 2, 'A', rx + 9, ry + 8, 0, 1, 1, CX - rx - 9, CY - 2, 'Z') +
        ' ' +
        p('M', CX - rx + 3, CY + 4, 'A', rx - 3, ry - 4, 0, 1, 0, CX + rx - 3, CY + 4, 'A', rx - 3, ry - 4, 0, 1, 0, CX - rx + 3, CY + 4, 'Z');
      add('path', { d: ring, fill: cover, 'fill-rule': 'evenodd' });
      add('path', { d: p('M', CX - rx * 0.7, CY - ry * 0.75, 'Q', CX, CY - ry * 1.05, CX + rx * 0.7, CY - ry * 0.75), fill: 'none', stroke: '#ffffff', 'stroke-width': 1, opacity: 0.35 });
      break;
    }
    case 'cap':
      add('path', { d: p('M', CX - rx - 2, CY - ry * 0.32, 'A', rx + 2, ry * 0.78, 0, 0, 1, CX + rx + 2, CY - ry * 0.32, 'Z'), fill: cover });
      add('path', { d: p('M', CX - rx - 4, CY - ry * 0.34, 'Q', CX, CY - ry * 0.08, CX + rx + 4, CY - ry * 0.34, 'Q', CX, CY - ry * 0.24, CX - rx - 4, CY - ry * 0.34, 'Z'), fill: cover, stroke: INK, 'stroke-width': 0.6, 'stroke-opacity': 0.5 });
      add('circle', { cx: CX, cy: CY - ry * 1.08, r: 2, fill: cover, stroke: INK, 'stroke-width': 0.5, 'stroke-opacity': 0.5 });
      break;
    default:
      break;
  }
  if (!hairColourVisible(face) && face.hair === 'bald')
    add('path', { d: p('M', CX - rx * 0.5, CY - ry * 0.8, 'Q', CX - rx * 0.2, CY - ry * 0.92, CX + rx * 0.1, CY - ry * 0.88), fill: 'none', stroke: '#ffffff', 'stroke-width': 2, opacity: 0.25, 'stroke-linecap': 'round' });

  // Earrings.
  if (face.earrings !== 'none')
    for (const side of [-1, 1]) {
      const x = CX + side * (rx - 0.5);
      if (face.earrings === 'studs') add('circle', { cx: x, cy: CY + 9, r: 1.8, fill: '#e2c25a', stroke: '#8a6d1a', 'stroke-width': 0.6 });
      else add('circle', { cx: x, cy: CY + 12.5, r: 3.6, fill: 'none', stroke: '#c9a43a', 'stroke-width': 1.4 });
    }

  // Glasses.
  if (face.glasses !== 'none') {
    for (const side of [-1, 1]) {
      const ex = CX + side * eyeDx;
      if (face.glasses === 'round') add('circle', { cx: ex, cy: eyeY, r: 6.5, fill: '#ffffff', 'fill-opacity': 0.12, stroke: '#2d2d2d', 'stroke-width': 1.6 });
      else add('rect', { x: ex - 7.5, y: eyeY - 5, width: 15, height: 10, rx: 2.5, fill: '#ffffff', 'fill-opacity': 0.12, stroke: '#2d2d2d', 'stroke-width': 1.6 });
      add('line', { x1: CX + side * (eyeDx + (face.glasses === 'round' ? 6.5 : 7.5)), y1: eyeY - 1, x2: CX + side * (rx - 1), y2: eyeY - 2, stroke: '#2d2d2d', 'stroke-width': 1.4 });
    }
    const inner = eyeDx - (face.glasses === 'round' ? 6.5 : 7.5);
    add('path', { d: p('M', CX - inner, eyeY - 1, 'Q', CX, eyeY - 3, CX + inner, eyeY - 1), fill: 'none', stroke: '#2d2d2d', 'stroke-width': 1.4 });
  }
  return nodes;
}
