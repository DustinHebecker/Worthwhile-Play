import type { Motif } from '../art/types';

/** Icebergs in a calm polar sea under a low sun, the great hidden part of the largest one glowing under the water, and a seal resting on an ice floe. Original vector art drawn for Worthwhile Play. */
export const icebergs: Motif = {
  id: 'icebergs',
  group: 'landscape',
  title: {
    de: 'Eisberge',
    en: 'Icebergs',
    nl: 'IJsbergen',
    es: 'Icebergs',
    fr: 'Icebergs',
    ru: 'Айсберги',
    'zh-Hans': '冰山',
    ko: '빙산',
    ja: '氷山',
    ar: 'جبال جليدية',
    pt: 'Icebergs',
    it: 'Iceberg',
    pl: 'Góry lodowe',
    tr: 'Buzdağları',
    uk: 'Айсберги',
    hi: 'हिमशैल'
  },
  place: {
    de: 'Polarmeere der Arktis und Antarktis',
    en: 'Polar seas of the Arctic and Antarctic',
    nl: 'Poolzeeën van de Noord- en Zuidpool',
    es: 'Mares polares del Ártico y la Antártida',
    fr: 'Mers polaires de l’Arctique et de l’Antarctique',
    ru: 'Полярные моря Арктики и Антарктики',
    'zh-Hans': '北极和南极的极地海域',
    ko: '북극과 남극의 극지 바다',
    ja: '北極と南極の極地の海',
    ar: 'البحار القطبية في القطبين الشمالي والجنوبي',
    pt: 'Mares polares do Ártico e da Antártida',
    it: 'Mari polari dell’Artico e dell’Antartide',
    pl: 'Morza polarne Arktyki i Antarktyki',
    tr: 'Arktik ve Antarktika’nın kutup denizleri',
    uk: 'Полярні моря Арктики та Антарктики',
    hi: 'आर्कटिक और अंटार्कटिक के ध्रुवीय समुद्र'
  },
  aspect: 'wide',
  backdrop: '#d8a8e8',
  palette: {
    s: ['#5a9bdc', 'skyBlue', 1],
    k: ['#f2c3cf', 'lightPink', 2, 'p'],
    p: ['#f6c8a0', 'peach', 1],
    y: ['#fff1b4', 'lightYellow', 1],
    o: ['#f3c454', 'gold', 3, 'y'],
    w: ['#fbfdff', 'white', 1],
    l: ['#a5d4f2', 'lightBlue', 1],
    a: ['#b6addb', 'lavender', 1],
    v: ['#7570b0', 'violet', 3, 'a'],
    q: ['#3fbcc8', 'turquoise', 1],
    m: ['#a3ebe2', 'mint', 2, 'q'],
    t: ['#1f8c99', 'teal', 2, 'c'],
    c: ['#155a68', 'darkTeal', 1],
    b: ['#2d62a6', 'blue', 1],
    n: ['#132c4c', 'navy', 1],
    g: ['#5b544f', 'darkGrey', 1],
    x: ['#9b948d', 'grey', 2, 'g']
  },
  layers: [
    // A pale polar sky warming towards the low sun on the right.
    { shape: { rect: [0, 0, 100, 36] }, fill: { gradient: ['s', 'k', 'p'], from: [0, 0], to: [0, 30], soft: 0.6 } },
    { shape: { ellipse: [80, 35, 30, 4] }, fill: 'y' },
    { shape: { ellipse: [30, 35, 26, 2.4] }, fill: 'y', min: 40 },
    { shape: { ellipse: [89, 22, 7.5, 7.5] }, fill: 'o', min: 48 },
    { shape: { ellipse: [89, 22, 5.5, 5.5] }, fill: 'y', shade: { dark: 'o', dir: 'nw' } },
    { shape: { ellipse: [30, 6, 12, 1.8] }, fill: 'k', min: 40 },
    { shape: { ellipse: [70, 12, 10, 1.6] }, fill: 'p', min: 48 },
    // A far tabular berg on the horizon.
    { shape: { poly: [[2, 34], [3, 29.5], [8, 28.5], [20, 28.8], [24, 30], [25, 34]] }, fill: 'a', shade: { dark: 'v', dir: 'e', mode: 'band', amount: 0.5 } },
    { shape: { poly: [[88, 34], [89, 31.5], [96, 31], [101, 32], [101, 34]] }, fill: 'v', min: 40 },
    // The sea: lit blue near the horizon, deep blue in front.
    { name: 'sea', shape: { rect: [0, 34, 100, 41] }, fill: { gradient: ['b', 'c', 'n'], from: [0, 36], to: [0, 74], soft: 0.6 } },
    // The hidden part of the big berg, glowing turquoise under the surface.
    { shape: { poly: [[14, 35], [62, 35], [70, 44], [66, 56], [54, 64], [38, 66], [22, 60], [12, 48]], smooth: 1 }, fill: { gradient: ['m', 'q', 't'], from: [0, 36], to: [0, 64], soft: 0.6 }, clip: 'sea' },
    // Glitter of the sun on the water.
    { shape: { line: [[76, 37], [88, 37]], width: 1.2 }, fill: 'y' },
    { shape: { line: [[78, 40], [86, 40]], width: 1.2 }, fill: 'p' },
    { shape: { line: [[80, 43.5], [85, 43.5]], width: 1.2 }, fill: 'y', min: 40 },
    { shape: { line: [[74, 47], [80, 47]], width: 1 }, fill: 'l', min: 48 },
    // The big berg: white faces lit from the right, blue shadows, turquoise crevasses.
    {
      name: 'berg',
      shape: {
        poly: [[16, 36], [18, 28], [22, 22], [26, 19], [29, 12], [33, 6], [36, 9], [38, 15], [42, 14], [46, 9], [50, 13], [52, 20], [57, 24], [60, 30], [62, 36]],
        smooth: 1
      },
      fill: 'w',
      shade: { light: 'w', dark: 'l', dir: 'e', mode: 'band', amount: 0.4 }
    },
    { shape: { poly: [[29, 14], [33, 7], [35, 12], [33, 22], [30, 30], [27, 36], [22, 36], [26, 24]], smooth: 1 }, fill: 'l', clip: 'berg' },
    { shape: { line: [[38, 16], [37, 24], [39, 32]], width: 1.2 }, fill: 'q', clip: 'berg' },
    { shape: { line: [[46, 12], [47, 20], [45, 28]], width: 1 }, fill: 'q', clip: 'berg', min: 40 },
    { shape: { line: [[53, 22], [52, 30]], width: 1 }, fill: 'l', clip: 'berg', min: 48 },
    { shape: { line: [[18, 33], [61, 33]], width: 1.2 }, fill: 'm', clip: 'berg' },
    { shape: { line: [[24, 30.5], [34, 30.5]], width: 1 }, fill: 'a', clip: 'berg', min: 48 },
    // A smaller berg on the right, in front of the sun's glow.
    {
      name: 'small',
      shape: { poly: [[64, 37], [66, 31], [69, 27], [72, 22], [75, 25], [78, 30], [80, 37]], smooth: 1 },
      fill: 'w',
      shade: { dark: 'a', dir: 'e', mode: 'band', amount: 0.45 }
    },
    { shape: { line: [[72, 24], [71, 30], [73, 36]], width: 1 }, fill: 'l', clip: 'small' },
    { shape: { poly: [[64, 37], [80, 37], [78, 41], [66, 41]], smooth: 1 }, fill: 'q', clip: 'sea' },
    // Ripples in the deep water.
    { shape: { line: [[6, 66], [18, 66]], width: 1 }, fill: 'b' },
    { shape: { line: [[30, 70], [44, 70]], width: 1 }, fill: 't', min: 40 },
    { shape: { line: [[4, 72], [12, 72]], width: 1 }, fill: 't', min: 48 },
    { shape: { line: [[72, 52], [84, 52]], width: 1 }, fill: 'b', min: 40 },
    // The ice floe in front, thick blue-green at its edge.
    { shape: { poly: [[48, 66], [52, 62], [62, 60], [80, 59], [96, 60], [104, 62], [104, 72], [92, 74], [70, 74], [54, 72]], smooth: 1 }, fill: 'q', shade: { dark: 't', dir: 'n', mode: 'band', amount: 0.3 } },
    { name: 'floe', shape: { poly: [[48, 65], [52, 61], [62, 59], [80, 58], [96, 59], [104, 61], [104, 68], [90, 70], [68, 70], [54, 69]], smooth: 1 }, fill: 'w', shade: { dark: 'l', dir: 'ne', width: 2 } },
    { shape: { ellipse: [79, 67, 15, 2.2] }, fill: 'l', clip: 'floe' },
    // A seal resting on the floe, its head raised to the left.
    { name: 'seal', shape: { poly: [[64, 62], [66, 58], [71, 56.5], [80, 56.8], [88, 58.4], [94, 60.6], [97, 62.4], [94, 64.6], [84, 65.6], [72, 65.6], [66, 64.6]], smooth: 1 }, fill: 'g', shade: { light: 'x', dir: 'ne', width: 2 } },
    { shape: { poly: [[61, 57], [67, 55.5], [69, 61], [64, 62.5]], smooth: 1 }, fill: 'g' },
    { shape: { ellipse: [63.5, 55, 4.2, 3.6] }, fill: 'g', shade: { light: 'x', dir: 'ne', width: 2 } },
    { shape: { ellipse: [59.8, 56.4, 2.2, 1.6] }, fill: 'x' },
    { shape: { ellipse: [62.8, 53.8, 0.8, 0.8] }, fill: 'n', keep: true },
    { shape: { ellipse: [58, 56, 0.7, 0.6] }, fill: 'n', keep: true, min: 48 },
    { shape: { poly: [[70, 63], [74, 62], [76.5, 66.6], [71, 66.6]], smooth: 1 }, fill: 'g', shade: { dark: 'n', dir: 'nw', mode: 'band', amount: 0.2 } },
    { shape: { poly: [[95, 61.4], [101, 58.4], [100, 61.8], [102.5, 63.6], [97, 63.8]], smooth: 1 }, fill: 'g' },
    { shape: { rect: [70, 56, 26, 9] }, fill: { scatter: 'x', density: 0.1, salt: 41 }, clip: 'seal', min: 48 }
  ]
};
