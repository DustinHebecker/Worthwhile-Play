import type { Motif } from '../art/types';

/** An American bison bull grazing on the prairie at sunset, buttes and a distant herd behind. Original vector art drawn for Worthwhile Play. */
export const bison: Motif = {
  id: 'bison',
  group: 'animal',
  title: {
    de: 'Amerikanischer Bison',
    en: 'American bison',
    nl: 'Amerikaanse bizon',
    es: 'Bisonte americano',
    fr: 'Bison d’Amérique',
    ru: 'Американский бизон',
    'zh-Hans': '美洲野牛',
    ko: '아메리카들소',
    ja: 'アメリカバイソン',
    ar: 'البيسون الأمريكي',
    pt: 'Bisão-americano',
    it: 'Bisonte americano',
    pl: 'Bizon amerykański',
    tr: 'Amerika bizonu',
    uk: 'Американський бізон',
    hi: 'अमेरिकी बाइसन'
  },
  place: {
    de: 'Prärien und Grasland in Nordamerika',
    en: 'Prairies and grasslands of North America',
    nl: 'Prairies en graslanden van Noord-Amerika',
    es: 'Praderas y pastizales de Norteamérica',
    fr: 'Prairies et plaines herbeuses d’Amérique du Nord',
    ru: 'Прерии и луга Северной Америки',
    'zh-Hans': '北美洲的大草原',
    ko: '북아메리카의 대초원과 초지',
    ja: '北アメリカのプレーリーと草原',
    ar: 'البراري والمراعي في أمريكا الشمالية',
    pt: 'Pradarias e campos da América do Norte',
    it: 'Praterie del Nord America',
    pl: 'Prerie i łąki Ameryki Północnej',
    tr: 'Kuzey Amerika’nın preryaları ve otlakları',
    uk: 'Прерії та луки Північної Америки',
    hi: 'उत्तरी अमेरिका के प्रेयरी और घास के मैदान'
  },
  aspect: 'wide',
  backdrop: '#cfe8f0',
  palette: {
    v: ['#6c58a6', 'violet', 1],
    a: ['#a08cc6', 'lavender', 2, 'v'],
    c: ['#ee8a6a', 'coral', 1],
    e: ['#f8bc8c', 'peach', 1],
    y: ['#fbe6a0', 'lightYellow', 1],
    w: ['#fff7dc', 'ivory', 3, 'y'],
    x: ['#3a2a52', 'darkPurple', 1],
    p: ['#5e4380', 'purple', 2, 'x'],
    g: ['#e2a83c', 'gold', 1],
    h: ['#b67f2c', 'ochre', 2, 'g'],
    o: ['#76742e', 'olive', 1],
    n: ['#382216', 'darkBrown', 1],
    b: ['#6c4227', 'brown', 1],
    u: ['#a2552a', 'rust', 2, 'b'],
    l: ['#b88652', 'lightBrown', 1],
    k: ['#141010', 'black', 3, 'n'],
    t: ['#dcc08a', 'tan', 3, 'l']
  },
  layers: [
    // Sunset sky: violet above, coral and peach, pale gold at the horizon; a low sun and streaks of cloud.
    { shape: { rect: [0, 0, 100, 42] }, fill: { gradient: ['v', 'c', 'e', 'y'], from: [0, 2], to: [0, 38], soft: 0.6 } },
    { shape: { ellipse: [26, 8, 18, 1.8] }, fill: 'a', min: 44 },
    { shape: { ellipse: [64, 15, 22, 2] }, fill: 'c', shade: { light: 'e', dir: 'se', mode: 'band', amount: 0.4 } },
    { shape: { ellipse: [18, 22, 14, 1.6] }, fill: 'e', min: 44 },
    { shape: { ellipse: [88, 27, 7, 7] }, fill: 'y', shade: { light: 'w', dir: 'nw', mode: 'band', amount: 0.5 } },
    // Buttes and low hills far away.
    { shape: { poly: [[0, 34], [4, 33], [6, 28], [18, 28], [20, 33], [34, 36], [50, 35], [62, 36], [70, 34], [74, 29], [96, 29], [98, 34], [100, 34], [100, 44], [0, 44]] }, fill: 'p', shade: { light: 'a', dir: 'n', width: 1 } },
    { shape: { poly: [[0, 39], [30, 38.5], [60, 40], [100, 39.5], [100, 44], [0, 44]] }, fill: 'x' },
    // The prairie: golden grass in the low sun.
    { name: 'grass', shape: { rect: [0, 41, 100, 34] }, fill: { gradient: ['g', 'h'], from: [0, 44], to: [0, 76], soft: 0.6 } },
    { shape: { all: true }, fill: { scatter: 't', density: 0.1, salt: 91 }, clip: 'grass', min: 44 },
    { shape: { all: true }, fill: { scatter: 'o', density: 0.08, salt: 92 }, clip: 'grass', min: 44 },
    // A distant herd on the horizon.
    { shape: { ellipse: [36, 42.5, 2.6, 1.3] }, fill: 'x', min: 44 },
    { shape: { ellipse: [42, 43, 2.2, 1.2] }, fill: 'x', min: 44 },
    { shape: { ellipse: [92, 43, 2.6, 1.3] }, fill: 'x', min: 44 },
    // The bison's long shadow on the grass.
    { shape: { ellipse: [46, 67.2, 33, 2] }, fill: 'o' },
    // Hind legs and tail.
    { shape: { poly: [[69.2, 51.9], [75.4, 51.9], [74.5, 66], [70.1, 66]], smooth: 1 }, fill: 'b', shade: { light: 'u', dir: 'e' } },
    { shape: { poly: [[74.5, 50.2], [80.7, 50.2], [79.8, 64.2], [75.4, 64.2]], smooth: 1 }, fill: 'n', shade: { light: 'b', dir: 'e' } },
    { shape: { rect: [70.1, 64.5, 4.4, 2.4] }, fill: 'k' },
    { shape: { rect: [75.8, 62.8, 4, 2.4] }, fill: 'k' },
    { shape: { line: [[80.7, 41.4], [83.3, 46.6], [82.9, 53.7]], width: 1.2 }, fill: 'b' },
    { shape: { ellipse: [82.9, 54.6, 1.4, 2.4] }, fill: 'k' },
    // The body: dark hindquarters, a lighter woolly cape over the hump and shoulders.
    { name: 'body', shape: { poly: [[35.8, 28], [41.5, 20.5], [47.5, 18], [53, 20], [58, 25], [64, 31.2], [71, 35.2], [78, 38.3], [81.6, 44.9], [80.7, 52.8], [74.5, 57.2], [62.2, 57.6], [48.1, 58.5], [35.8, 59], [28.8, 57.2], [27, 46.6], [28.8, 34.3]], smooth: 2 }, fill: 'b', shade: { light: 'u', dark: 'n', dir: 'ne', width: 2 } },
    { name: 'cape', shape: { poly: [[28.8, 34.3], [35.8, 26.8], [41.5, 20], [47.5, 17.5], [53, 19.5], [55.2, 27.3], [53.4, 31.7], [56.9, 35.2], [52.5, 38.7], [55.2, 43.1], [49.9, 45.8], [50.8, 50.2], [45.5, 52.8], [35.8, 53.7], [28.8, 50.2]] }, fill: 'l', clip: 'body', shade: { light: 't', dark: 'b', dir: 'ne', width: 2 } },
    { shape: { poly: [[27, 46.6], [35.8, 48.4], [44.6, 53.7], [49.9, 59], [28.8, 59]], smooth: 1 }, fill: 'b', clip: 'body', shade: { light: 'u', dir: 'ne', width: 1 } },
    { shape: { all: true }, fill: { scatter: 'b', density: 0.1, salt: 93 }, clip: 'cape', min: 44 },
    { shape: { line: [[56.9, 34.3], [58.7, 46.6], [55.2, 56.3]], width: 1 }, fill: 'n', clip: 'body', min: 56 },
    // Shaggy front legs.
    { shape: { poly: [[30.5, 53.7], [41.1, 53.7], [41.1, 60.7], [38.4, 63.4], [33.2, 63.4], [30.5, 60.7]], smooth: 1 }, fill: 'n' },
    { shape: { rect: [32.3, 59, 3.5, 7.9] }, fill: 'n', shade: { light: 'b', dir: 'e' } },
    { shape: { rect: [37.6, 59, 3.5, 7.6] }, fill: 'n', shade: { light: 'b', dir: 'e' } },
    { shape: { rect: [31.9, 65.4, 4.2, 2.4] }, fill: 'k' },
    { shape: { rect: [37.2, 64.9, 4.2, 2.4] }, fill: 'k' },
    // The massive head held low: a dark face under a woolly brown crown, a lighter beard, a pale horn and a bright eye.
    { name: 'head', shape: { poly: [[31, 32.4], [22.6, 31.3], [16.2, 36.6], [12, 47.1], [12, 54.6], [16.2, 57.7], [23.7, 56.7], [29.9, 50.4], [34.2, 40.9]], smooth: 1 }, fill: 'n' },
    { shape: { poly: [[33, 31], [24, 29.5], [17, 33], [14.8, 38.5], [18.5, 38.6], [22.5, 40.5], [27, 44], [31, 45], [34.5, 41]], smooth: 1 }, fill: 'b', shade: { light: 'u', dir: 'ne', width: 1 } },
    { shape: { poly: [[14, 55.6], [25.7, 54], [30.5, 60.9], [26.5, 69], [21, 66], [17.5, 60.5]], smooth: 1 }, fill: 'b', shade: { light: 'u', dark: 'n', dir: 'ne', width: 1 } },
    { shape: { line: [[22, 58], [23.5, 64]], width: 1 }, fill: 'n', min: 56 },
    { shape: { line: [[23.6, 34], [25, 28.4], [29.8, 25.4]], width: 2.6 }, fill: 't' },
    { shape: { line: [[18.2, 34.8], [17.4, 31]], width: 1.4 }, fill: 't', min: 44 },
    { shape: { ellipse: [19.2, 43, 2.8, 2.4] }, fill: 'b' },
    { shape: { ellipse: [19.2, 43.2, 1.6, 1.4] }, fill: 'k', keep: true },
    { shape: { ellipse: [18.6, 42.6, 0.6, 0.6] }, fill: 'w', keep: true },
    { shape: { ellipse: [13.5, 52.9, 1.4, 1.3] }, fill: 'k', min: 44 }
  ]
};
