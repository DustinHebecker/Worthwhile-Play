import type { Motif } from '../art/types';

/** A white polar bear walking across an ice floe on a dark teal sea, under a pale sky with a low sun and distant icebergs. Original vector art drawn for Worthwhile Play. */
export const polarBear: Motif = {
  id: 'polar-bear',
  group: 'animal',
  title: {
    de: 'Eisbär',
    en: 'Polar bear',
    nl: 'IJsbeer',
    es: 'Oso polar',
    fr: 'Ours polaire',
    ru: 'Белый медведь',
    'zh-Hans': '北极熊',
    ko: '북극곰',
    ja: 'ホッキョクグマ',
    ar: 'الدب القطبي',
    pt: 'Urso-polar',
    it: 'Orso polare',
    pl: 'Niedźwiedź polarny',
    tr: 'Kutup ayısı',
    uk: 'Білий ведмідь',
    hi: 'ध्रुवीय भालू'
  },
  place: {
    de: 'Die Arktis',
    en: 'The Arctic',
    nl: 'Het Noordpoolgebied',
    es: 'El Ártico',
    fr: 'L’Arctique',
    ru: 'Арктика',
    'zh-Hans': '北极地区',
    ko: '북극',
    ja: '北極圏',
    ar: 'المنطقة القطبية الشمالية',
    pt: 'O Ártico',
    it: 'L’Artico',
    pl: 'Arktyka',
    tr: 'Arktik',
    uk: 'Арктика',
    hi: 'आर्कटिक'
  },
  aspect: 'wide',
  backdrop: '#c7e8b0',
  palette: {
    l: ['#c0def5', 'lightBlue', 1],
    c: ['#f5ae88', 'peach', 1],
    y: ['#ffe9a0', 'lightYellow', 3, 'c'],
    w: ['#ffffff', 'white', 1],
    v: ['#ecdcb4', 'ivory', 2, 'w'],
    i: ['#a9aebc', 'lightGrey', 1],
    a: ['#a29ece', 'lavender', 2, 'c'],
    g: ['#787e8e', 'grey', 1],
    d: ['#4c505c', 'darkGrey', 3, 'g'],
    s: ['#6aaee0', 'skyBlue', 1],
    b: ['#4a86c4', 'blue', 3, 's'],
    u: ['#5fc6c6', 'turquoise', 1],
    t: ['#348f99', 'teal', 1],
    q: ['#1c4f5c', 'darkTeal', 1],
    n: ['#152f4e', 'navy', 2, 'q'],
    k: ['#202229', 'charcoal', 1]
  },
  layers: [
    // A pale sky, lavender and peach towards a low sun; icebergs on the horizon.
    { shape: { rect: [0, 0, 100, 31] }, fill: { gradient: ['l', 'a', 'c'], from: [0, 2], to: [0, 30], soft: 0.6 } },
    { shape: { ellipse: [16, 23, 8.5, 8.5] }, fill: 'y', shade: { dark: 'c', dir: 'se' } },
    { shape: { poly: [[46, 31], [52, 22], [60, 24], [66, 31]] }, fill: 'w', shade: { dark: 'i', dir: 'e', mode: 'band', amount: 0.45 } },
    { shape: { poly: [[72, 31], [76, 26], [84, 27], [90, 31]] }, fill: 'w', shade: { dark: 'i', dir: 'e', mode: 'band', amount: 0.45 } },
    { shape: { poly: [[-2, 31], [2, 26], [8, 28], [12, 31]] }, fill: 'w', shade: { dark: 'i', dir: 'e', mode: 'band', amount: 0.45 } },
    // The sea, darker towards us, with the sun's reflection and ripples.
    { shape: { rect: [0, 30, 100, 45] }, fill: { gradient: ['u', 't', 'q', 'n'], from: [0, 30], to: [0, 75], soft: 0.5 } },
    { shape: { line: [[10, 33], [22, 33]], width: 1.2 }, fill: 'c' },
    { shape: { line: [[12, 36], [20, 36]], width: 1.2 }, fill: 'y' },
    { shape: { line: [[13, 39], [19, 39]], width: 1 }, fill: 'c', min: 40 },
    { shape: { line: [[60, 37], [76, 37]], width: 1 }, fill: 'u', min: 40 },
    { shape: { line: [[78, 44], [94, 44]], width: 1 }, fill: 'u' },
    { shape: { line: [[4, 46], [16, 46]], width: 1 }, fill: 'u', min: 48 },
    // The ice floe: a snow top, a blue side, a turquoise glow under water.
    { shape: { poly: [[2, 64], [8, 71], [88, 71], [98, 62], [96, 68], [10, 74]], smooth: 1 }, fill: 'u' },
    { shape: { poly: [[4, 57], [20, 53], [56, 52], [84, 54], [98, 58], [98, 63], [86, 68], [10, 68], [2, 62]], smooth: 1 }, fill: 's', shade: { dark: 'b', dir: 'n', mode: 'band', amount: 0.15 } },
    { shape: { poly: [[4, 57], [20, 53], [56, 52], [84, 54], [98, 58], [82, 61.5], [50, 62.5], [16, 61.5]], smooth: 1 }, fill: 'l', shade: { light: 'w', dir: 'n', mode: 'band', amount: 0.35 } },
    // The far legs, behind the body.
    { shape: { poly: [[30, 42], [38, 42], [38.5, 58], [40, 60], [31, 60]] }, fill: 'g', shade: { light: 'i', dark: 'd', dir: 'e', mode: 'band', amount: 0.3 }, outline: 'k' },
    { shape: { poly: [[59, 42], [66, 42], [66.5, 58], [68, 60], [59, 60]] }, fill: 'g', shade: { light: 'i', dark: 'd', dir: 'e', mode: 'band', amount: 0.3 }, outline: 'k' },
    { shape: { line: [[31, 59], [40, 59]], width: 2.4 }, fill: 'd' },
    { shape: { line: [[59, 59], [68, 59]], width: 2.4 }, fill: 'd' },
    // The bear in one silhouette, walking right: the rump above the shoulders, a long neck, a long low head with a
    // small ear; near legs with wide paws.
    { name: 'bear', shape: { poly: [[20, 60.5], [17, 50], [13, 40], [16, 31], [26, 26], [42, 26.5], [56, 29], [66, 32], [74, 34], [78, 32], [81, 31], [83, 33], [89, 35], [94, 39], [97.5, 42.5], [95, 45.5], [88, 47], [80, 48], [72, 47], [62, 48], [61, 60.5], [50, 60.5], [50, 50], [40, 51], [33, 50], [33, 60.5]], smooth: 1 }, fill: 'w', shade: { light: 'v', dark: 'i', dir: 'n', mode: 'band', amount: 0.18 }, outline: 'k' },
    { shape: { ellipse: [42, 49, 20, 3.4] }, fill: 'i', clip: 'bear' },
    { shape: { poly: [[50, 46], [56, 44], [60, 50], [60, 59], [51, 59]] }, fill: 'w', clip: 'bear', shade: { dark: 'i', dir: 'w', mode: 'band', amount: 0.3 } },
    { shape: { poly: [[20, 44], [28, 42], [32, 50], [32, 59], [21, 59]] }, fill: 'w', clip: 'bear', shade: { dark: 'i', dir: 'w', mode: 'band', amount: 0.3 } },
    { shape: { line: [[50, 59.5], [61, 59.5]], width: 1.4 }, fill: 'g', clip: 'bear' },
    { shape: { line: [[20, 59.5], [33, 59.5]], width: 1.4 }, fill: 'g', clip: 'bear' },
    { shape: { ellipse: [86.5, 39, 1, 1] }, fill: 'k', keep: true },
    { shape: { ellipse: [96.4, 42.6, 1.4, 1.2] }, fill: 'k', keep: true },
    { shape: { line: [[88, 45], [93, 44.6]], width: 1 }, fill: 'g', min: 48 },
    { shape: { ellipse: [81, 33, 1.2, 1] }, fill: 'g', clip: 'bear', min: 48 },
    // Its shadow on the snow.
    { shape: { ellipse: [44, 62, 30, 1.6] }, fill: 'i', min: 40 }
  ]
};
