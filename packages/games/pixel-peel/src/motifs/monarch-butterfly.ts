import type { Layer, Motif, Point } from '../art/types';

const r1 = (v: number) => Math.round(v * 10) / 10;

/**
 * A monarch with open wings seen from above, its body at (x, y), scaled by `s`. Each wing is a black shape with white
 * spots in the border, an orange panel inside and (with `veins`) black veins across it; `id` keeps the clip names
 * apart.
 */
function monarch(id: string, x: number, y: number, s: number, detail: number, veins: boolean): Layer[] {
  const out: Layer[] = [];
  const P = (m: 1 | -1, q: readonly Point[]): Point[] => q.map(([px, py]) => [r1(x + m * s * px), r1(y + s * py)]);
  // Wing outlines relative to the body, for the left side (m = -1 mirrors them to the right).
  const fore: Point[] = [[1, -4], [8, -14], [20, -21], [31, -22], [34, -18], [31, -9], [23, 0], [10, 3], [1, 2]];
  const foreIn: Point[] = [[2.5, -4], [9, -13], [19, -19], [28, -19.5], [30.5, -16], [27, -9], [20, -2.5], [9, 1], [2.5, 0.5]];
  const hind: Point[] = [[1, 2], [12, 3], [22, 8], [25, 15], [21, 22], [12, 24], [4, 18], [1, 10]];
  const hindIn: Point[] = [[2.5, 3.5], [12, 4.5], [20, 9], [23, 15], [19.5, 20.5], [11.5, 22], [4.5, 17], [2.5, 10]];
  for (const m of [-1, 1] as const) {
    const side = `${id}${m}`;
    out.push(
      { name: `${side}f`, shape: { poly: P(m, fore), smooth: 1 }, fill: 'k' },
      { name: `${side}h`, shape: { poly: P(m, hind), smooth: 1 }, fill: 'k' },
      { shape: { all: true }, fill: { scatter: 'w', density: 0.3, salt: 101 + m }, clip: `${side}f`, min: detail },
      { shape: { all: true }, fill: { scatter: 'w', density: 0.3, salt: 103 + m }, clip: `${side}h`, min: detail },
      { shape: { poly: P(m, foreIn), smooth: 1 }, fill: 'o', shade: { light: 'g', dir: 'n', width: 1 }, ...(veins ? {} : { outline: 'k' }) },
      { shape: { poly: P(m, hindIn), smooth: 1 }, fill: 'o', shade: { light: 'g', dir: 'n', width: 1 }, ...(veins ? {} : { outline: 'k' }) },
      // The white spots near the tip of the forewing.
      { shape: { ellipse: [r1(x + m * s * 27), r1(y - s * 19.5), r1(1.2 * s), r1(1.2 * s)] }, fill: 'w', min: detail },
      { shape: { ellipse: [r1(x + m * s * 30.5), r1(y - s * 15), r1(1.1 * s), r1(1.1 * s)] }, fill: 'w', min: detail },
    );
    if (!veins) continue;
    out.push(
      // Black veins across the orange panels.
      { shape: { line: P(m, [[2, -2], [16, -8], [27, -15]]), width: 1 }, fill: 'k' },
      { shape: { line: P(m, [[3, 0], [14, -3], [22, -5]]), width: 1 }, fill: 'k', min: detail },
      { shape: { line: P(m, [[3, 4], [12, 12], [16, 20]]), width: 1 }, fill: 'k' },
      { shape: { line: P(m, [[3, 4], [16, 10], [21, 14]]), width: 1 }, fill: 'k', min: detail },
      { shape: { line: P(m, [[3, 6], [6, 14], [8, 19]]), width: 1 }, fill: 'k', min: detail }
    );
  }
  out.push(
    { shape: { ellipse: [x, r1(y + s * 4), r1(1.8 * s), r1(10 * s)] }, fill: 'k', keep: true },
    { shape: { ellipse: [x, r1(y - s * 8), r1(2 * s), r1(2 * s)] }, fill: 'k', keep: true },
    { shape: { line: [[x, r1(y - s * 9)], [r1(x - s * 5), r1(y - s * 18)]], width: 1 }, fill: 'k', min: detail },
    { shape: { line: [[x, r1(y - s * 9)], [r1(x + s * 5), r1(y - s * 18)]], width: 1 }, fill: 'k', min: detail }
  );
  return out;
}

/** A cluster of milkweed flowers: a rounded umbel of small pink stars over a purple shadow. */
function umbel(x: number, y: number, r: number, salt: number): Layer[] {
  const out: Layer[] = [
    { shape: { ellipse: [x, y, r, r * 0.8] }, fill: 'u', shade: { light: 'p', dir: 'nw', width: 2 } }
  ];
  const stars: Point[] = [[-0.55, -0.35], [-0.1, -0.55], [0.4, -0.4], [-0.7, 0.15], [-0.2, -0.05], [0.3, 0.05], [0.7, -0.05], [-0.35, 0.45], [0.15, 0.45], [0.55, 0.4]];
  stars.forEach(([dx, dy], i) => {
    const cx = r1(x + dx * r);
    const cy = r1(y + dy * r * 0.8);
    out.push({ shape: { star: [cx, cy, r1(r * 0.24), r1(r * 0.1), 5], rot: (salt * 7 + i * 23) % 72 }, fill: i % 3 === 0 ? 'q' : 'p' });
    out.push({ shape: { ellipse: [cx, cy, r1(r * 0.07), r1(r * 0.07)] }, fill: 'q', min: 48 });
  });
  return out;
}

/** Monarch butterflies feeding on pink milkweed flowers in a summer meadow. Original vector art drawn for Worthwhile Play. */
export const monarchButterfly: Motif = {
  id: 'monarch-butterfly',
  group: 'animal',
  title: {
    de: 'Monarchfalter',
    en: 'Monarch butterflies',
    nl: 'Monarchvlinders',
    es: 'Mariposas monarca',
    fr: 'Papillons monarques',
    ru: 'Бабочки-монархи',
    'zh-Hans': '帝王蝶',
    ko: '제주왕나비',
    ja: 'オオカバマダラ',
    ar: 'فراشات الملك',
    pt: 'Borboletas-monarca',
    it: 'Farfalle monarca',
    pl: 'Monarchy wędrowne',
    tr: 'Monark kelebekleri',
    uk: 'Метелики-монархи',
    hi: 'मोनार्क तितलियाँ'
  },
  place: {
    de: 'Nordamerika; Winterquartiere in Mexiko und Kalifornien',
    en: 'North America; wintering in Mexico and California',
    nl: 'Noord-Amerika; overwinteren in Mexico en Californië',
    es: 'Norteamérica; invernan en México y California',
    fr: 'Amérique du Nord ; hivernage au Mexique et en Californie',
    ru: 'Северная Америка; зимовки в Мексике и Калифорнии',
    'zh-Hans': '北美洲；在墨西哥和加利福尼亚越冬',
    ko: '북아메리카, 멕시코와 캘리포니아에서 월동',
    ja: '北アメリカ、メキシコとカリフォルニアで越冬',
    ar: 'أمريكا الشمالية، وتقضي الشتاء في المكسيك وكاليفورنيا',
    pt: 'América do Norte; passam o inverno no México e na Califórnia',
    it: 'Nord America; svernano in Messico e in California',
    pl: 'Ameryka Północna; zimują w Meksyku i Kalifornii',
    tr: 'Kuzey Amerika; kışı Meksika ve Kaliforniya’da geçirir',
    uk: 'Північна Америка; зимують у Мексиці та Каліфорнії',
    hi: 'उत्तरी अमेरिका; सर्दियाँ मेक्सिको और कैलिफ़ोर्निया में'
  },
  aspect: 'square',
  backdrop: '#f4e2c4',
  palette: {
    s: ['#8cc6e8', 'skyBlue', 1],
    l: ['#c6e4f4', 'lightBlue', 2, 's'],
    y: ['#f6eb9a', 'lightYellow', 1],
    a: ['#b6a6dc', 'lavender', 1],
    o: ['#ee7a1a', 'orange', 1],
    g: ['#f6ad3c', 'gold', 2, 'o'],
    k: ['#15110f', 'black', 1],
    w: ['#fbf8f2', 'white', 1],
    p: ['#e48bb0', 'pink', 1],
    q: ['#f8c8dc', 'lightPink', 2, 'p'],
    u: ['#8a4a86', 'purple', 1],
    e: ['#4f9a3e', 'green', 1],
    m: ['#a6d36a', 'lightGreen', 2, 'e'],
    d: ['#23502e', 'darkGreen', 1],
    v: ['#7f8a34', 'olive', 3, 'e'],
    t: ['#3e7a6c', 'teal', 3, 'd']
  },
  layers: [
    // Summer sky over a soft, out-of-focus meadow with bokeh.
    { shape: { rect: [0, 0, 100, 60] }, fill: { gradient: ['l', 's'], from: [0, 0], to: [0, 44], soft: 0.6 } },
    { shape: { ellipse: [80, 9, 15, 4.4] }, fill: 'w', shade: { dark: 'l', dir: 'n', mode: 'band', amount: 0.4 } },
    { shape: { ellipse: [14, 20, 9, 2.6] }, fill: 'w', shade: { dark: 'l', dir: 'n', mode: 'band', amount: 0.4 }, min: 40 },
    { name: 'meadow', shape: { poly: [[0, 46], [10, 43.5], [20, 42.5], [32, 43.5], [44, 45], [57, 43], [70, 41.5], [85, 42.5], [100, 44], [100, 100], [0, 100]] }, fill: { gradient: ['m', 'e', 'd'], from: [0, 44], to: [0, 100], soft: 0.6 } },
    { shape: { ellipse: [10, 52, 6, 5] }, fill: 'y' },
    { shape: { ellipse: [88, 50, 7, 6] }, fill: 'a' },
    { shape: { ellipse: [24, 62, 5, 4] }, fill: 'a', min: 40 },
    { shape: { ellipse: [94, 66, 4, 4] }, fill: 'y', min: 40 },
    { shape: { ellipse: [66, 52, 4, 3.4] }, fill: 'y', min: 40 },
    { shape: { all: true }, fill: { scatter: 'v', density: 0.1, salt: 105 }, clip: 'meadow', min: 48 },
    { shape: { all: true }, fill: { scatter: 't', density: 0.08, salt: 106 }, clip: 'meadow', min: 48 },
    // Milkweed: stems, broad leaves, and the flower clusters.
    { shape: { line: [[42, 100], [44, 76], [46, 60]], width: 2 }, fill: 'e' },
    { shape: { line: [[82, 100], [80, 82]], width: 2 }, fill: 'e' },
    { shape: { line: [[12, 100], [14, 84]], width: 2 }, fill: 'e', min: 40 },
    { shape: { ellipse: [30, 86, 14, 5], rot: 30 }, fill: 'e', shade: { light: 'm', dark: 'd', dir: 'nw' } },
    { shape: { ellipse: [58, 82, 14, 5], rot: -25 }, fill: 'e', shade: { light: 'm', dark: 'd', dir: 'nw' } },
    { shape: { line: [[20, 80], [40, 92]], width: 1 }, fill: 'm', min: 40 },
    { shape: { line: [[48, 88], [68, 76]], width: 1 }, fill: 'm', min: 40 },
    { shape: { ellipse: [92, 90, 10, 4], rot: -30 }, fill: 'd', shade: { light: 'e', dir: 'nw' } },
    ...umbel(80, 78, 13, 1),
    ...umbel(14, 82, 11, 2),
    ...umbel(46, 62, 17, 3),
    // Two monarchs feeding with open wings, a large one and a smaller one.
    ...monarch('a', 41, 34, 1.02, 40, true),
    ...monarch('b', 77, 73, 0.58, 48, true)
  ]
};
