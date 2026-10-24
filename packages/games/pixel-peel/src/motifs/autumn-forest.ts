import type { Motif } from '../art/types';

/** Autumn: a path leading into a forest of red, rust, orange and golden crowns towards a low sun, dark trunks, one fir, and falling leaves. Original vector art drawn for Worthwhile Play. */
export const autumnForest: Motif = {
  id: 'autumn-forest',
  group: 'season',
  title: {
    de: 'Herbstwald',
    en: 'Autumn forest',
    nl: 'Herfstbos',
    es: 'Bosque en otoño',
    fr: 'Forêt en automne',
    ru: 'Осенний лес',
    'zh-Hans': '秋日森林',
    ko: '가을 숲',
    ja: '秋の森',
    ar: 'غابة في الخريف',
    pt: 'Floresta no outono',
    it: 'Bosco d’autunno',
    pl: 'Jesienny las',
    tr: 'Sonbahar ormanı',
    uk: 'Осінній ліс',
    hi: 'पतझड़ का जंगल'
  },
  place: {
    de: 'Wälder der gemäßigten Breiten in Europa und Nordamerika',
    en: 'Temperate forests of Europe and North America',
    nl: 'Gematigde bossen in Europa en Noord-Amerika',
    es: 'Bosques templados de Europa y Norteamérica',
    fr: 'Forêts tempérées d’Europe et d’Amérique du Nord',
    ru: 'Леса умеренного пояса Европы и Северной Америки',
    'zh-Hans': '欧洲和北美洲的温带森林',
    ko: '유럽과 북아메리카의 온대림',
    ja: 'ヨーロッパと北アメリカの温帯林',
    ar: 'الغابات المعتدلة في أوروبا وأمريكا الشمالية',
    pt: 'Florestas temperadas da Europa e da América do Norte',
    it: 'Foreste temperate d’Europa e del Nord America',
    pl: 'Lasy strefy umiarkowanej w Europie i Ameryce Północnej',
    tr: 'Avrupa ve Kuzey Amerika’nın ılıman ormanları',
    uk: 'Ліси помірного поясу Європи та Північної Америки',
    hi: 'यूरोप और उत्तरी अमेरिका के समशीतोष्ण वन'
  },
  aspect: 'square',
  backdrop: '#9ec5e8',
  palette: {
    y: ['#fff1a8', 'lightYellow', 1],
    c: ['#f6c48e', 'peach', 2, 'y'],
    g: ['#e9b52c', 'gold', 1],
    o: ['#e6762a', 'orange', 1],
    u: ['#a8441f', 'rust', 1],
    r: ['#cc2f2a', 'red', 1],
    x: ['#6e1f22', 'maroon', 2, 'r'],
    h: ['#b8902f', 'ochre', 2, 'g'],
    k: ['#2f2019', 'darkBrown', 1],
    b: ['#68412c', 'brown', 1],
    l: ['#956a44', 'lightBrown', 1],
    t: ['#cda56f', 'tan', 1],
    d: ['#264736', 'darkGreen', 1],
    a: ['#eadbbd', 'beige', 3, 't'],
    e: ['#55723b', 'olive', 3, 'd']
  },
  layers: [
    // Low sun glowing through the trees, hazy distance.
    { shape: { all: true }, fill: { gradient: ['y', 'c'], from: [50, 40], to: [50, 0], soft: 0.8 } },
    { shape: { ellipse: [50, 44, 16, 16] }, fill: { gradient: ['y', 'c'], from: [50, 44], to: [50, 28], soft: 0.8 } },
    // Distant crowns in haze.
    { shape: { ellipse: [30, 40, 12, 9] }, fill: 'h', shade: { light: 'c', dir: 'n', mode: 'band', amount: 0.3 } },
    { shape: { ellipse: [70, 38, 13, 10] }, fill: 'h', shade: { light: 'c', dir: 'n', mode: 'band', amount: 0.3 } },
    { shape: { ellipse: [50, 34, 8, 6] }, fill: 'g', shade: { light: 'y', dir: 'n', mode: 'band', amount: 0.3 } },
    { shape: { rect: [38, 40, 2, 16] }, fill: 'b' },
    { shape: { rect: [61, 40, 2, 16] }, fill: 'b' },
    // The ground with leaf litter and the path into the light.
    { shape: { rect: [0, 54, 100, 46] }, fill: 'u' },
    { shape: { rect: [0, 54, 100, 46] }, fill: { scatter: 'o', density: 0.28, salt: 61 } },
    { shape: { rect: [0, 54, 100, 46] }, fill: { scatter: 'x', density: 0.12, salt: 62 } },
    { shape: { rect: [0, 54, 100, 46] }, fill: { scatter: 'g', density: 0.08, salt: 63 }, min: 40 },
    { name: 'path', shape: { poly: [[46, 54], [54, 54], [72, 100], [24, 100]] }, fill: 't', shade: { light: 'a', dark: 'l', dir: 'w', mode: 'band', amount: 0.22 } },
    { shape: { all: true }, fill: { scatter: 'o', density: 0.07, salt: 64 }, clip: 'path' },
    { shape: { all: true }, fill: { scatter: 'u', density: 0.05, salt: 65 }, clip: 'path', min: 40 },
    // A fir in the distance, dark against the light.
    { name: 'fir', shape: { poly: [[60, 14], [66, 27], [63, 27], [69, 40], [65, 40], [71, 55], [49, 55], [55, 40], [51, 40], [57, 27], [54, 27]] }, fill: 'd', shade: { light: 'e', dir: 'ne', width: 2 } },
    { shape: { rect: [58.5, 54, 3, 4] }, fill: 'k' },
    // Trunks.
    { shape: { poly: [[8, 30], [14, 30], [15, 84], [5, 84]] }, fill: 'k', shade: { light: 'b', dir: 'w', mode: 'band', amount: 0.3 } },
    { shape: { poly: [[86, 26], [92, 26], [95, 88], [83, 88]] }, fill: 'k', shade: { light: 'b', dir: 'w', mode: 'band', amount: 0.3 } },
    { shape: { poly: [[30, 40], [33, 40], [34, 66], [29, 66]] }, fill: 'k', shade: { light: 'b', dir: 'w', mode: 'band', amount: 0.3 } },
    { shape: { poly: [[70, 38], [73, 38], [74, 68], [69, 68]] }, fill: 'k', shade: { light: 'b', dir: 'w', mode: 'band', amount: 0.3 } },
    { shape: { line: [[88, 40], [78, 30]], width: 2 }, fill: 'k' },
    { shape: { line: [[11, 46], [22, 38]], width: 2 }, fill: 'k' },
    // Crowns: red and rust on the left, orange and gold on the right, lit from the sun in the middle.
    { shape: { ellipse: [24, 26, 14, 11] }, fill: 'r', shade: { light: 'o', dark: 'x', dir: 'ne', width: 2 } },
    { shape: { ellipse: [8, 14, 14, 12] }, fill: 'u', shade: { light: 'r', dark: 'x', dir: 'ne', width: 2 } },
    { shape: { ellipse: [34, 8, 13, 9] }, fill: 'r', shade: { light: 'o', dark: 'x', dir: 'se', width: 2 } },
    { shape: { ellipse: [10, 36, 9, 7] }, fill: 'r', shade: { light: 'o', dark: 'x', dir: 'ne', width: 2 } },
    { shape: { ellipse: [78, 22, 14, 11] }, fill: 'o', shade: { light: 'g', dark: 'u', dir: 'nw', width: 2 } },
    { shape: { ellipse: [92, 10, 13, 12] }, fill: 'g', shade: { light: 'y', dark: 'h', dir: 'nw', width: 2 } },
    { shape: { ellipse: [64, 8, 12, 8] }, fill: 'o', shade: { light: 'g', dark: 'u', dir: 'sw', width: 2 } },
    { shape: { ellipse: [92, 36, 9, 7] }, fill: 'o', shade: { light: 'g', dark: 'u', dir: 'nw', width: 2 } },
    { shape: { rect: [0, 0, 44, 46] }, fill: { scatter: 'x', density: 0.05, salt: 66 }, min: 40 },
    // Leaves falling across the light.
    { shape: { ellipse: [44, 22, 1.2, 1] }, fill: 'o', keep: true },
    { shape: { ellipse: [56, 30, 1.2, 1] }, fill: 'r', keep: true },
    { shape: { ellipse: [52, 46, 1.2, 1] }, fill: 'g', keep: true },
    { shape: { ellipse: [40, 52, 1.2, 1] }, fill: 'o', keep: true, min: 40 },
    { shape: { ellipse: [62, 50, 1.2, 1] }, fill: 'r', keep: true, min: 40 },
    { shape: { ellipse: [47, 14, 1.2, 1] }, fill: 'u', keep: true, min: 48 },
    { shape: { ellipse: [58, 18, 1.2, 1] }, fill: 'g', keep: true, min: 48 }
  ]
};
