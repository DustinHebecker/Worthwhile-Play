import type { Layer, Motif } from '../art/types';

const CX = 50;
const CY = 86;

/** A row of eye-spots on the fanned train: `n` spots on an arc of radius `r`, from `from` to `to` degrees. */
function eyes(r: number, n: number, from: number, to: number, s: number, min?: number): Layer[] {
  const out: Layer[] = [];
  for (let i = 0; i < n; i++) {
    const deg = from + ((to - from) * i) / (n - 1);
    const a = (deg * Math.PI) / 180;
    const x = Math.round((CX + Math.cos(a) * r) * 10) / 10;
    const y = Math.round((CY - Math.sin(a) * r * 1.25) * 10) / 10;
    const rot = Math.round(90 - deg);
    const lod = min ? { min } : {};
    out.push(
      { shape: { ellipse: [x, y, 3.4 * s, 4.4 * s], rot }, fill: 'g', shade: { dark: 'h', dir: 's', width: 1 }, ...lod },
      { shape: { ellipse: [x, y + 0.2, 2.4 * s, 3.1 * s], rot }, fill: 'q', shade: { dark: 'a', dir: 's', width: 1 }, ...lod },
      { shape: { ellipse: [x, y + 0.4, 1.3 * s, 1.8 * s], rot }, fill: 'n', keep: true, ...lod }
    );
  }
  return out;
}

/** Feather shafts radiating from the base of the train. */
function shafts(): Layer[] {
  const out: Layer[] = [];
  for (let deg = 5; deg <= 175; deg += 10) {
    const a = (deg * Math.PI) / 180;
    const p = (r: number): [number, number] => [Math.round((CX + Math.cos(a) * r) * 10) / 10, Math.round((CY - Math.sin(a) * r * 1.25) * 10) / 10];
    out.push({ shape: { line: [p(14), p(44)], width: 1 }, fill: 'o', clip: 'fan', min: 48 });
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
    c: ['#e4d0a6', 'beige', 1],
    k: ['#3e3a3c', 'charcoal', 3, 'n']
  },
  layers: [
    // Soft evening sky over a garden.
    { shape: { rect: [0, 0, 100, 90] }, fill: { gradient: ['v', 's'], from: [0, 0], to: [0, 40], soft: 0.6 } },
    { shape: { ellipse: [4, 18, 18, 22] }, fill: 'd', shade: { light: 'e', dir: 'nw', width: 1 } },
    { shape: { ellipse: [98, 22, 16, 24] }, fill: 'd', shade: { light: 'e', dir: 'nw', width: 1 } },
    // The fanned train: bright rim, green, bronze towards the base.
    { name: 'fan', shape: { ellipse: [CX, CY, 50, 68] }, fill: 'm' },
    { shape: { ellipse: [CX, CY, 46.5, 64] }, fill: 'e' },
    { shape: { ellipse: [CX, CY, 36, 48] }, fill: { gradient: ['e', 'o'], from: [CX, CY - 46], to: [CX, CY - 14], soft: 0.5 } },
    { shape: { ellipse: [CX, CY, 21, 28] }, fill: 'd' },
    { shape: { all: true }, fill: { scatter: 'z', density: 0.1, salt: 71 }, clip: 'fan', min: 40 },
    ...shafts(),
    ...eyes(44, 13, 6, 174, 1.25),
    ...eyes(33, 10, 12, 168, 1.1),
    ...eyes(23, 7, 16, 164, 0.9, 40),
    // The garden path and grass.
    { name: 'ground', shape: { rect: [0, 84, 100, 16] }, fill: { gradient: ['c', 'h'], from: [0, 84], to: [0, 104], soft: 0.6 } },
    { shape: { all: true }, fill: { scatter: 'h', density: 0.12, salt: 73 }, clip: 'ground', min: 40 },
    { shape: { poly: [[0, 84], [8, 80], [14, 84], [20, 81], [26, 86], [0, 90]], smooth: 1 }, fill: 'd', shade: { light: 'e', dir: 'n', mode: 'band', amount: 0.4 } },
    { shape: { poly: [[74, 86], [80, 81], [86, 84], [92, 80], [100, 83], [100, 90], [76, 90]], smooth: 1 }, fill: 'd', shade: { light: 'e', dir: 'n', mode: 'band', amount: 0.4 } },
    // Copper wings and legs.
    { shape: { line: [[47, 82], [46, 92]], width: 1.4 }, fill: 'k' },
    { shape: { line: [[53, 82], [54, 92]], width: 1.4 }, fill: 'k' },
    { shape: { ellipse: [41.5, 73, 6.6, 12], rot: 18 }, fill: 'r', shade: { light: 'c', dir: 'nw', width: 1 } },
    { shape: { ellipse: [58.5, 73, 6.6, 12], rot: -18 }, fill: 'r', shade: { light: 'c', dir: 'ne', width: 1 } },
    // Iridescent blue neck and breast, small head with a crest.
    { name: 'body', shape: { poly: [[48.5, 34], [51.5, 34], [53, 44], [56, 56], [58, 68], [57, 78], [50, 84], [43, 78], [42, 68], [44, 56], [47, 44]], smooth: 1 }, fill: 'b', shade: { light: 'q', dark: 'n', dir: 'nw', width: 1 } },
    { shape: { line: [[50, 30], [47, 22]], width: 1 }, fill: 'k', min: 48 },
    { shape: { line: [[50, 30], [50, 21]], width: 1 }, fill: 'k', min: 48 },
    { shape: { line: [[50, 30], [53, 22]], width: 1 }, fill: 'k', min: 48 },
    { shape: { ellipse: [47, 22, 1.2, 1.2] }, fill: 'b', min: 40 },
    { shape: { ellipse: [50, 20.6, 1.2, 1.2] }, fill: 'b', min: 40 },
    { shape: { ellipse: [53, 22, 1.2, 1.2] }, fill: 'b', min: 40 },
    { shape: { poly: [[50, 29], [46.5, 22], [53.5, 22]] }, fill: 'n', keep: true },
    { shape: { ellipse: [50, 30.5, 4.2, 4.2] }, fill: 'b', shade: { light: 'q', dir: 'nw', width: 1 } },
    { shape: { poly: [[48.8, 33.4], [51.2, 33.4], [50, 36.6]] }, fill: 'c', keep: true }
  ]
};
