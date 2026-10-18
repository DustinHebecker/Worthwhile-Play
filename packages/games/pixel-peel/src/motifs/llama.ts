import type { Motif } from '../art/types';

/** A llama portrait in front of snowy Andean peaks and a deep blue sky, wearing a woven blanket in red, orange, turquoise and magenta stripes. Original vector art drawn for Worthwhile Play. */
export const llama: Motif = {
  id: 'llama',
  group: 'animal',
  title: {
    de: 'Lama',
    en: 'Llama',
    nl: 'Lama',
    es: 'Llama',
    fr: 'Lama',
    ru: 'Лама',
    'zh-Hans': '美洲驼',
    ko: '라마',
    ja: 'リャマ',
    ar: 'اللاما',
    pt: 'Lhama',
    it: 'Lama',
    pl: 'Lama',
    tr: 'Lama',
    uk: 'Лама',
    hi: 'लामा'
  },
  place: {
    de: 'Die Anden, Südamerika',
    en: 'The Andes, South America',
    nl: 'De Andes, Zuid-Amerika',
    es: 'Los Andes, Sudamérica',
    fr: 'Les Andes, Amérique du Sud',
    ru: 'Анды, Южная Америка',
    'zh-Hans': '南美洲安第斯山脉',
    ko: '남아메리카 안데스산맥',
    ja: '南アメリカのアンデス山脈',
    ar: 'جبال الأنديز، أمريكا الجنوبية',
    pt: 'Os Andes, América do Sul',
    it: 'Le Ande, America del Sud',
    pl: 'Andy, Ameryka Południowa',
    tr: 'And Dağları, Güney Amerika',
    uk: 'Анди, Південна Америка',
    hi: 'एंडीज़, दक्षिण अमेरिका'
  },
  aspect: 'square',
  backdrop: '#f3b9c9',
  palette: {
    b: ['#2d5cb6', 'blue', 1],
    s: ['#79ade5', 'skyBlue', 2, 'b'],
    w: ['#f8f8f4', 'white', 1],
    v: ['#9a9bcc', 'lavender', 1],
    g: ['#686b8c', 'grey', 2, 'v'],
    c: ['#eedab2', 'cream', 1],
    a: ['#c3a274', 'beige', 1],
    t: ['#977552', 'tan', 2, 'a'],
    k: ['#2a2420', 'charcoal', 1],
    n: ['#6a4430', 'brown', 2, 'k'],
    r: ['#d13a33', 'red', 1],
    o: ['#f08a2a', 'orange', 1],
    q: ['#27b0a6', 'turquoise', 1],
    m: ['#c23b84', 'magenta', 3, 'r'],
    y: ['#f3c63e', 'gold', 3, 'o'],
    e: ['#5f9e46', 'green', 1]
  },
  layers: [
    // Deep blue sky and snowy peaks.
    { shape: { all: true }, fill: { gradient: ['b', 's'], from: [0, 0], to: [0, 70], soft: 0.8 } },
    { name: 'peaks', shape: { poly: [[-4, 66], [10, 46], [20, 52], [34, 34], [46, 48], [58, 40], [72, 52], [86, 38], [104, 54], [104, 80], [-4, 80]] }, fill: 'v', shade: { dark: 'g', dir: 'w', mode: 'band', amount: 0.3 } },
    { shape: { poly: [[28, 42], [34, 34], [40, 42], [37, 41], [34, 44], [31, 41]] }, fill: 'w', clip: 'peaks' },
    { shape: { poly: [[80, 46], [86, 38], [92, 46], [89, 45], [86, 48], [83, 45]] }, fill: 'w', clip: 'peaks' },
    { shape: { poly: [[6, 52], [10, 46], [14, 50], [11, 50], [9, 53]] }, fill: 'w', clip: 'peaks' },
    { shape: { poly: [[54, 44], [58, 40], [62, 44], [59, 44], [57, 46]] }, fill: 'w', clip: 'peaks', min: 40 },
    { shape: { poly: [[-4, 80], [20, 70], [50, 74], [104, 68], [104, 104], [-4, 104]], smooth: 1 }, fill: 'e', shade: { dark: 'g', dir: 's', mode: 'band', amount: 0.2 } },
    // The body behind, under the blanket.
    { shape: { ellipse: [80, 100, 26, 16] }, fill: 'c', shade: { dark: 'a', dir: 'nw' } },
    // The neck.
    { name: 'neck', shape: { poly: [[44, 34], [62, 30], [70, 60], [74, 100], [42, 100], [46, 62]], smooth: 1 }, fill: 'c', shade: { light: 'w', dark: 'a', dir: 'w', mode: 'band', amount: 0.22 } },
    { shape: { poly: [[66, 44], [70, 60], [74, 100], [68, 100], [66, 64]], smooth: 1 }, fill: 't', clip: 'neck' },
    { shape: { all: true }, fill: { scatter: 'a', density: 0.07, salt: 121 }, clip: 'neck', min: 40 },
    // Ears.
    { shape: { ellipse: [47, 12, 3.4, 9], rot: -18 }, fill: 'c', shade: { dark: 'a', dir: 'nw' } },
    { shape: { ellipse: [61, 11, 3.4, 9], rot: 14 }, fill: 'c', shade: { dark: 'a', dir: 'nw' } },
    { shape: { ellipse: [47.6, 13, 1.9, 7], rot: -18 }, fill: 'n' },
    { shape: { ellipse: [60.6, 12, 1.9, 7], rot: 14 }, fill: 'n' },
    // Head with a woolly top knot, the snout and face.
    { shape: { ellipse: [53, 28, 13, 10] }, fill: 'c', shade: { light: 'w', dark: 'a', dir: 'nw', width: 2 } },
    { shape: { ellipse: [54, 19, 8, 4.5] }, fill: 'c', shade: { dark: 'a', dir: 'n', mode: 'band', amount: 0.3 } },
    { shape: { ellipse: [52, 18, 1.6, 1.2] }, fill: 'a', keep: true, min: 40 },
    { shape: { ellipse: [57, 19, 1.6, 1.2] }, fill: 'a', keep: true, min: 40 },
    { shape: { ellipse: [38, 34, 9, 7] }, fill: 'c', shade: { light: 'w', dark: 'a', dir: 'nw' } },
    { shape: { ellipse: [33, 36, 4, 4.4] }, fill: 'a', shade: { dark: 't', dir: 'nw' } },
    { shape: { line: [[31, 33], [33, 34]], width: 1 }, fill: 'k' },
    { shape: { line: [[30, 38], [35, 39]], width: 1 }, fill: 'k' },
    { shape: { ellipse: [48, 26, 1.8, 1.6] }, fill: 'k', keep: true },
    { shape: { ellipse: [48.6, 25.4, 0.5, 0.5] }, fill: 'w', keep: true, min: 48 },
    { shape: { line: [[45, 23.5], [49, 23]], width: 1 }, fill: 't', min: 48 },
    // The woven blanket.
    { name: 'blanket', shape: { poly: [[40, 78], [74, 74], [100, 80], [100, 104], [36, 104]] }, fill: 'r' },
    { shape: { all: true }, fill: { stripes: ['r', 'r', 'o', 'y', 'q', 'q', 'm', 'o'], width: 2.4, angle: 90 }, clip: 'blanket' },
    { shape: { line: [[40, 78], [74, 74], [100, 80]], width: 1.6 }, fill: 'k' },
    { shape: { line: [[36, 100], [100, 100]], width: 1 }, fill: 'w', min: 40 }
  ]
};
