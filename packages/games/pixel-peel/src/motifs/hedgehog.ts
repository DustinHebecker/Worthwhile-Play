import type { Layer, Motif, Point } from '../art/types';

/**
 * A spiky dome: points on a half ellipse around (`cx`, `cy`), alternating between the tips (`f` = 1) and the roots
 * (`f` = `inner`) of the spines, closed along the ground.
 */
function spines(cx: number, cy: number, rx: number, ry: number, inner: number, n: number): Point[] {
  const points: Point[] = [[cx - rx, cy + 3]];
  for (let i = 0; i <= n; i++) {
    const a = Math.PI * (1 - i / n);
    const f = i % 2 === 0 ? inner : 1;
    points.push([Math.round((cx + Math.cos(a) * rx * f) * 10) / 10, Math.round((cy - Math.sin(a) * ry * f) * 10) / 10]);
  }
  points.push([cx + rx, cy + 3]);
  return points;
}

/** Spines radiating from the centre of the back, every `step` degrees, in turn in the given keys. */
function quills(from: number, step: number, keys: readonly string[], min: number): Layer[] {
  const out: Layer[] = [];
  for (let i = 0, deg = from; deg < 180; i++, deg += step) {
    const a = (Math.PI * deg) / 180;
    const p = (f: number): Point => [Math.round((55 - Math.cos(a) * 36 * f) * 10) / 10, Math.round((79 - Math.sin(a) * 41 * f) * 10) / 10];
    out.push({ shape: { line: [p(0.72), p(0.97)], width: 1 }, fill: keys[i % keys.length]!, clip: 'back', min });
  }
  return out;
}

/** A fallen leaf: a pointed ellipse turned by `rot`, with its midrib from medium on. */
function leaf(x: number, y: number, rot: number, key: string, rib: string): Layer[] {
  return [
    { shape: { ellipse: [x, y, 4.6, 2.2], rot }, fill: key },
    { shape: { line: [[x - 3.6 * Math.cos((rot * Math.PI) / 180), y - 3.6 * Math.sin((rot * Math.PI) / 180)], [x + 3.6 * Math.cos((rot * Math.PI) / 180), y + 3.6 * Math.sin((rot * Math.PI) / 180)]], width: 1 }, fill: rib, min: 48 }
  ];
}

/** A hedgehog snuffling through fallen autumn leaves, a sunlit, out-of-focus wood behind. Original vector art drawn for Worthwhile Play. */
export const hedgehog: Motif = {
  id: 'hedgehog',
  group: 'animal',
  title: {
    de: 'Igel',
    en: 'Hedgehog',
    nl: 'Egel',
    es: 'Erizo',
    fr: 'Hérisson',
    ru: 'Ёж',
    'zh-Hans': '刺猬',
    ko: '고슴도치',
    ja: 'ハリネズミ',
    ar: 'القنفذ',
    pt: 'Ouriço-cacheiro',
    it: 'Riccio',
    pl: 'Jeż',
    tr: 'Kirpi',
    uk: 'Їжак',
    hi: 'हेजहॉग'
  },
  place: {
    de: 'Gärten, Hecken und Wälder in Europa',
    en: 'Gardens, hedgerows and woodland across Europe',
    nl: 'Tuinen, heggen en bossen in heel Europa',
    es: 'Jardines, setos y bosques de toda Europa',
    fr: 'Jardins, haies et bois de toute l’Europe',
    ru: 'Сады, живые изгороди и леса Европы',
    'zh-Hans': '欧洲各地的花园、树篱和林地',
    ko: '유럽 곳곳의 정원, 산울타리, 숲',
    ja: 'ヨーロッパ各地の庭、生け垣、森',
    ar: 'الحدائق والسياجات النباتية والغابات في أنحاء أوروبا',
    pt: 'Jardins, sebes e bosques de toda a Europa',
    it: 'Giardini, siepi e boschi di tutta Europa',
    pl: 'Ogrody, żywopłoty i lasy w całej Europie',
    tr: 'Avrupa’nın bahçeleri, çit bitkileri ve ormanları',
    uk: 'Сади, живоплоти й ліси по всій Європі',
    hi: 'पूरे यूरोप के बाग़, झाड़ियों की बाड़ें और वन'
  },
  aspect: 'square',
  backdrop: '#cfe0f4',
  palette: {
    k: ['#17120f', 'black', 1],
    n: ['#4a301e', 'darkBrown', 1],
    b: ['#7b5434', 'brown', 1],
    l: ['#a9784c', 'lightBrown', 2, 'b'],
    a: ['#e6cfa6', 'beige', 1],
    c: ['#f6ead2', 'cream', 3, 'a'],
    o: ['#e27a28', 'orange', 1],
    r: ['#b8352a', 'red', 1],
    u: ['#8a3a22', 'rust', 2, 'r'],
    y: ['#f2c63e', 'yellow', 1],
    g: ['#d69a2c', 'gold', 2, 'y'],
    h: ['#9a8a3a', 'olive', 1],
    e: ['#5c8a3a', 'green', 1],
    m: ['#9cc25a', 'lightGreen', 3, 'e'],
    d: ['#22403b', 'darkTeal', 1],
    t: ['#3f6a5a', 'teal', 2, 'd']
  },
  layers: [
    // A sunlit autumn wood, out of focus: dark depths above, warm glowing foliage low down, two trunks.
    { name: 'wood', shape: { rect: [0, 0, 100, 60] }, fill: { gradient: ['d', 't', 'h', 'g'], from: [0, 2], to: [0, 56], soft: 0.6 } },
    { shape: { ellipse: [26, 8, 18, 9] }, fill: 'h', shade: { light: 'g', dir: 'nw', mode: 'band', amount: 0.35 } },
    { shape: { ellipse: [70, 14, 16, 9] }, fill: 'o', shade: { light: 'g', dir: 'nw', mode: 'band', amount: 0.3 } },
    { shape: { ellipse: [54, 26, 14, 5] }, fill: 'u', shade: { light: 'o', dir: 'nw', mode: 'band', amount: 0.4 }, min: 40 },
    { shape: { ellipse: [16, 34, 10, 6] }, fill: 'o', min: 40 },
    { shape: { ellipse: [88, 40, 9, 6] }, fill: 'y', min: 40 },
    { shape: { rect: [4, 0, 7, 58] }, fill: 'n', shade: { light: 'b', dir: 'w' } },
    { shape: { rect: [88, 0, 8, 58] }, fill: 'n', shade: { light: 'b', dir: 'w', width: 2 } },
    { shape: { all: true }, fill: { scatter: 'y', density: 0.05, salt: 51 }, clip: 'wood', min: 40 },
    // The forest floor: leaf litter with moss.
    { name: 'floor', shape: { poly: [[0, 56], [12, 54.5], [24, 55.5], [37, 54.5], [50, 55], [63, 54], [76, 55.5], [88, 54], [100, 55], [100, 100], [0, 100]] }, fill: { gradient: ['o', 'u', 'b'], from: [0, 56], to: [0, 104], soft: 0.6 } },
    { shape: { ellipse: [88, 62, 14, 4] }, fill: 'e', shade: { light: 'm', dir: 'n', mode: 'band', amount: 0.4 } },
    { shape: { ellipse: [6, 92, 12, 4] }, fill: 'e', shade: { light: 'm', dir: 'n', mode: 'band', amount: 0.4 } },
    { shape: { all: true }, fill: { scatter: 'r', density: 0.14, salt: 53 }, clip: 'floor' },
    { shape: { all: true }, fill: { scatter: 'y', density: 0.08, salt: 54 }, clip: 'floor', min: 40 },
    { shape: { all: true }, fill: { scatter: 'g', density: 0.08, salt: 55 }, clip: 'floor', min: 40 },
    ...leaf(30, 58, 20, 'y', 'g'),
    ...leaf(70, 57, -30, 'r', 'u'),
    ...leaf(94, 80, 50, 'y', 'g'),
    // The hedgehog: a dome of spines, shaded from the low sun.
    { shape: { ellipse: [54, 82.5, 38, 3.6] }, fill: 'k' },
    { name: 'back', shape: { poly: spines(55, 79, 38, 43, 0.8, 22) }, fill: 'n' },
    { shape: { poly: spines(54, 80, 32, 36, 0.8, 20) }, fill: 'b', shade: { light: 'a', dark: 'n', dir: 'nw', width: 2 } },
    { shape: { poly: spines(53, 81, 23, 27, 0.8, 16) }, fill: 'l', shade: { light: 'a', dir: 'nw', width: 1 } },
    ...quills(9, 16.5, ['a', 'c'], 40),
    { shape: { all: true }, fill: { scatter: 'c', density: 0.07, salt: 57 }, clip: 'back', min: 48 },
    // Feet.
    { shape: { ellipse: [32, 82, 3.4, 2] }, fill: 'l', shade: { dark: 'n', dir: 'n', mode: 'band', amount: 0.4 } },
    { shape: { ellipse: [74, 83, 3.4, 2] }, fill: 'l', shade: { dark: 'n', dir: 'n', mode: 'band', amount: 0.4 } },
    // The face: a pale pointed snout with a black nose, a dark eye in a brown mask and a small round ear.
    { name: 'face', shape: { poly: [[36, 56], [28, 58], [20, 63], [12, 69], [7, 72.5], [9, 76], [18, 78], [28, 81], [37, 80.5], [41, 69]], smooth: 1 }, fill: 'a', shade: { light: 'c', dark: 'l', dir: 'nw', width: 2 } },
    { shape: { ellipse: [25, 65.5, 6, 3.6], rot: -22 }, fill: 'l', clip: 'face' },
    { shape: { ellipse: [35, 56.5, 3.6, 3.2] }, fill: 'l', shade: { dark: 'n', dir: 'se' } },
    { shape: { ellipse: [7.4, 73.2, 2.8, 2.4] }, fill: 'k', keep: true },
    { shape: { rect: [20.9, 62.6, 4.1, 4.1] }, fill: 'k', keep: true },
    { shape: { rect: [21, 62.7, 1.8, 1.8] }, fill: 'c', min: 48 },
    { shape: { line: [[11, 76.5], [17, 77.5]], width: 1 }, fill: 'l', min: 48 },
    // Leaves in front.
    ...leaf(18, 90, 30, 'o', 'u'),
    ...leaf(50, 93, -25, 'y', 'g'),
    ...leaf(70, 89, 10, 'r', 'u'),
    ...leaf(34, 97, 5, 'g', 'n'),
    ...leaf(88, 95, -40, 'o', 'u')
  ]
};
