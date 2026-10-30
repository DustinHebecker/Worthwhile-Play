import type { Layer, Motif, Point } from '../art/types';

const CX = 50;
const CY = 86;
/** The train is a fan of feathers, taller than wide: radius r at angle deg (0° = right, 90° = up). */
const YS = 1.38;
const at = (r: number, deg: number): Point => {
  const a = (deg * Math.PI) / 180;
  return [Math.round((CX + Math.cos(a) * r) * 10) / 10, Math.round((CY - Math.sin(a) * r * YS) * 10) / 10];
};

/** The scalloped outline of the train: a feather tip at every ray, notches between them; `r` at the tips. */
function scallops(r: number): Point[] {
  const points: Point[] = [at(14, -4)];
  for (let i = 0; i <= 28; i++) points.push(at(i % 2 === 0 ? r * 0.94 : r, -4 + (188 * i) / 28));
  points.push(at(14, 184), [CX, 96]);
  return points;
}

/** Feather shafts as rays from the base of the train to every feather tip. */
function rays(): Layer[] {
  const out: Layer[] = [];
  for (let i = 1; i < 28; i += 2) {
    const deg = -4 + (188 * i) / 28;
    out.push({ shape: { line: [at(i % 4 === 1 ? 14 : 24, deg), at(47, deg)], width: 1 }, fill: 'd', clip: 'fan', ...(i % 4 === 1 ? {} : { min: 48 }) });
  }
  for (let i = 2; i < 28; i += 2) {
    const deg = -4 + (188 * i) / 28;
    out.push({ shape: { line: [at(12, deg), at(44, deg)], width: 1 }, fill: 'o', clip: 'fan', min: 48 });
  }
  return out;
}

/**
 * A row of eye-spots on the train: `n` spots on the arc of radius `r` between the rays, scaled by `s` (bigger
 * outwards): a bronze ring, a teal ring and a dark-blue centre, each turned along its feather.
 */
function eyes(r: number, n: number, from: number, to: number, s: number, min?: number): Layer[] {
  const out: Layer[] = [];
  const lod = min ? { min } : {};
  for (let i = 0; i < n; i++) {
    const deg = from + ((to - from) * i) / (n - 1);
    const [x, y] = at(r, deg);
    const rot = Math.round(90 - deg);
    const outer = { ellipse: [x, y, Math.round(3.4 * s * 10) / 10, Math.round(4.4 * s * 10) / 10], rot } as const;
    const ring = { ellipse: [x, y, Math.round(2.4 * s * 10) / 10, Math.round(3.1 * s * 10) / 10], rot } as const;
    // Plain rings up to medium, shaded ones on hard only (fewer small colour patches keep medium fair).
    out.push(
      { shape: outer, fill: 'g', ...lod },
      { shape: outer, fill: 'g', shade: { dark: 'h', dir: 's', width: 1 }, min: 48 },
      { shape: ring, fill: 'q', ...lod },
      { shape: ring, fill: 'q', shade: { dark: 'a', dir: 's', width: 1 }, min: 48 },
      { shape: { ellipse: [x, y, Math.round(1.3 * s * 10) / 10, Math.round(1.7 * s * 10) / 10], rot }, fill: 'n', keep: true, ...lod }
    );
  }
  return out;
}

/** A peacock displaying its fanned train of eye-spotted feathers, its blue neck and crest in front, on a garden path. Original vector art drawn for Worthwhile Play. */
export const peacock: Motif = {
  id: 'peacock',
  group: 'animal',
  title: {
    de: 'Pfau',
    en: 'Peacock',
    nl: 'Pauw',
    es: 'Pavo real',
    fr: 'Paon',
    ru: 'Павлин',
    'zh-Hans': '孔雀',
    ko: '공작',
    ja: 'クジャク',
    ar: 'الطاووس',
    pt: 'Pavão',
    it: 'Pavone',
    pl: 'Paw',
    tr: 'Tavus kuşu',
    uk: 'Павич',
    hi: 'मोर'
  },
  place: {
    de: 'Wälder und Felder in Südasien',
    en: 'Forests and farmland of South Asia',
    nl: 'Bossen en akkers in Zuid-Azië',
    es: 'Bosques y campos del sur de Asia',
    fr: 'Forêts et campagnes d’Asie du Sud',
    ru: 'Леса и поля Южной Азии',
    'zh-Hans': '南亚的森林与农田',
    ko: '남아시아의 숲과 농지',
    ja: '南アジアの森や農地',
    ar: 'الغابات والأراضي الزراعية في جنوب آسيا',
    pt: 'Florestas e campos do Sul da Ásia',
    it: 'Foreste e campagne dell’Asia meridionale',
    pl: 'Lasy i pola Azji Południowej',
    tr: 'Güney Asya’nın ormanları ve tarlaları',
    uk: 'Ліси й поля Південної Азії',
    hi: 'दक्षिण एशिया के वन और खेत'
  },
  aspect: 'square',
  backdrop: '#f4d7d0',
  palette: {
    s: ['#c4b4e0', 'lavender', 1],
    v: ['#8f7cc0', 'violet', 2, 's'],
    b: ['#2058c0', 'blue', 1],
    n: ['#142a6a', 'navy', 1],
    q: ['#2fb7b2', 'turquoise', 1],
    a: ['#1e7c7e', 'teal', 2, 'q'],
    e: ['#2f8a3e', 'green', 1],
    d: ['#1a4a2a', 'darkGreen', 1],
    m: ['#94c64a', 'lightGreen', 1],
    z: ['#d6e66e', 'lime', 3, 'm'],
    o: ['#7a7a2c', 'olive', 2, 'e'],
    g: ['#e2b23c', 'gold', 1],
    h: ['#b8842c', 'ochre', 2, 'g'],
    r: ['#a4542a', 'rust', 1],
    c: ['#e4d0a6', 'beige', 1]
  },
  layers: [
    // Soft evening sky over a garden.
    { shape: { rect: [0, 0, 100, 90] }, fill: { gradient: ['v', 's'], from: [0, 0], to: [0, 40], soft: 0.6 } },
    { shape: { ellipse: [4, 18, 18, 22] }, fill: 'd', shade: { light: 'e', dir: 'nw', width: 1 } },
    { shape: { ellipse: [98, 22, 16, 24] }, fill: 'd', shade: { light: 'e', dir: 'nw', width: 1 } },
    // The fanned train: a scalloped fan of green feathers radiating from the body, a bright rim at the tips.
    { name: 'fan', shape: { poly: scallops(50) }, fill: 'm' },
    { shape: { poly: scallops(46) }, fill: { gradient: ['e', 'e', 'o'], from: [CX, 20], to: [CX, 84], soft: 0.15 } },
    ...rays(),
    { shape: { all: true }, fill: { scatter: 'z', density: 0.08, salt: 71 }, clip: 'fan', min: 48 },
    ...eyes(43, 13, 3, 177, 1.3),
    ...eyes(31, 9, 9, 171, 0.95),
    ...eyes(20, 6, 15, 165, 0.65, 48),
    // The garden path and grass.
    { name: 'ground', shape: { rect: [0, 84, 100, 16] }, fill: { gradient: ['c', 'h'], from: [0, 84], to: [0, 104], soft: 0.6 } },
    { shape: { all: true }, fill: { scatter: 'h', density: 0.12, salt: 73 }, clip: 'ground', min: 48 },
    { shape: { poly: [[0, 84], [8, 80], [14, 84], [20, 81], [26, 86], [0, 90]], smooth: 1 }, fill: 'd', shade: { light: 'e', dir: 'n', mode: 'band', amount: 0.4 } },
    { shape: { poly: [[74, 86], [80, 81], [86, 84], [92, 80], [100, 83], [100, 90], [76, 90]], smooth: 1 }, fill: 'd', shade: { light: 'e', dir: 'n', mode: 'band', amount: 0.4 } },
    // Legs, copper wings folded at the sides of the breast.
    { shape: { line: [[48, 82], [47, 93]], width: 2 }, fill: 'n' },
    { shape: { line: [[53, 82], [54, 93]], width: 2 }, fill: 'n' },
    { shape: { ellipse: [42.5, 74, 6.4, 10.5], rot: 15 }, fill: 'r', shade: { dark: 'h', dir: 'ne', width: 1 } },
    { shape: { ellipse: [59, 74, 6.4, 10.5], rot: -15 }, fill: 'r', shade: { dark: 'h', dir: 'nw', width: 1 } },
    // A slim iridescent blue neck rising in a gentle curve, the head turned to the left with a small crest.
    { shape: { ellipse: [50.5, 72, 7.2, 11] }, fill: 'b', shade: { light: 'q', dark: 'n', dir: 'nw', width: 1 } },
    { shape: { line: [[50, 66], [51.5, 56], [54, 46], [55, 39]], width: 5.6 }, fill: 'b' },
    { shape: { line: [[50, 66], [51.5, 56], [54, 46], [55, 39]], width: 5.6 }, fill: 'b', shade: { light: 'a', dark: 'n', dir: 'w', width: 1 }, min: 40 },
    { shape: { line: [[55, 34], [57, 25.5]], width: 1 }, fill: 'n' },
    { shape: { line: [[55, 34], [54, 25.5]], width: 1 }, fill: 'n', min: 40 },
    { shape: { line: [[55, 34], [60, 26.5]], width: 1 }, fill: 'n', min: 48 },
    { shape: { ellipse: [57, 25, 1.4, 1.4] }, fill: 'b', keep: true },
    { shape: { ellipse: [54, 25, 1.2, 1.2] }, fill: 'b', min: 40 },
    { shape: { ellipse: [60.2, 26, 1.2, 1.2] }, fill: 'b', min: 48 },
    { shape: { ellipse: [54.5, 36, 4.4, 4] }, fill: 'b' },
    { shape: { ellipse: [54.5, 36, 4.4, 4] }, fill: 'b', shade: { light: 'q', dir: 'nw', width: 1 }, min: 40 },
    { shape: { line: [[51.6, 34.6], [55.4, 34.6]], width: 1 }, fill: 'c', min: 48 },
    { shape: { ellipse: [53.2, 35.6, 0.9, 0.9] }, fill: 'n', min: 40 },
    { shape: { poly: [[51, 35.4], [47.4, 37.4], [51, 38.6]] }, fill: 'c', keep: true }
  ]
};
