import type { Motif } from '../art/types';

/** Steep karst towers rising from jade water in the morning haze, with a junk under rust sails and the towers mirrored below. Original vector art drawn for Worthwhile Play. */
export const haLongBay: Motif = {
  id: 'ha-long-bay',
  group: 'landscape',
  title: {
    de: 'Halong-Bucht',
    en: 'Ha Long Bay',
    nl: 'Halongbaai',
    es: 'Bahía de Ha Long',
    fr: 'Baie d’Along',
    ru: 'Бухта Халонг',
    'zh-Hans': '下龙湾',
    ko: '하롱베이',
    ja: 'ハロン湾',
    ar: 'خليج ها لونغ',
    pt: 'Baía de Ha Long',
    it: 'Baia di Ha Long',
    pl: 'Zatoka Ha Long',
    tr: 'Ha Long Körfezi',
    uk: 'Бухта Халонг',
    hi: 'हा लॉन्ग खाड़ी'
  },
  place: {
    de: 'Provinz Quảng Ninh, Vietnam',
    en: 'Quảng Ninh Province, Vietnam',
    nl: 'Provincie Quảng Ninh, Vietnam',
    es: 'Provincia de Quảng Ninh, Vietnam',
    fr: 'Province de Quảng Ninh, Viêt Nam',
    ru: 'Провинция Куангнинь, Вьетнам',
    'zh-Hans': '越南广宁省',
    ko: '베트남 꽝닌성',
    ja: 'ベトナム、クアンニン省',
    ar: 'مقاطعة كوانغ نينه، فيتنام',
    pt: 'Província de Quảng Ninh, Vietnã',
    it: 'Provincia di Quảng Ninh, Vietnam',
    pl: 'Prowincja Quảng Ninh, Wietnam',
    tr: 'Quảng Ninh Eyaleti, Vietnam',
    uk: 'Провінція Куангнінь, В’єтнам',
    hi: 'क्वांग निन्ह प्रांत, वियतनाम'
  },
  aspect: 'wide',
  backdrop: '#e8ccf5',
  palette: {
    l: ['#a99bd6', 'lavender', 1],
    x: ['#e8b3c4', 'lightPink', 3, 'p'],
    p: ['#f6c79c', 'peach', 1],
    y: ['#fff3c2', 'lightYellow', 1],
    a: ['#b5c0cf', 'lightGrey', 2, 'g'],
    g: ['#7b8aa1', 'grey', 1],
    c: ['#33393f', 'charcoal', 1],
    d: ['#2c5a3d', 'darkGreen', 1],
    e: ['#5f9748', 'green', 1],
    i: ['#a3c95a', 'lime', 3, 'e'],
    q: ['#3e9f8f', 'teal', 1],
    m: ['#93d4c0', 'mint', 2, 'q'],
    u: ['#1e6663', 'darkTeal', 2, 'n'],
    n: ['#1b3768', 'navy', 1],
    r: ['#b04a28', 'rust', 1],
    o: ['#e88a3c', 'orange', 2, 'r'],
    b: ['#6b4327', 'brown', 1],
    w: ['#f7f3ea', 'ivory', 3, 'y']
  },
  layers: [
    // Hazy morning sky, the sun low behind the towers on the right.
    { shape: { rect: [0, 0, 100, 42] }, fill: { gradient: ['l', 'x', 'p'], from: [0, 2], to: [0, 34], soft: 0.6 } },
    { shape: { ellipse: [76, 22, 5.5, 5.5] }, fill: 'y', shade: { light: 'w', dir: 'nw', width: 2 } },
    { shape: { line: [[6, 10], [22, 10]], width: 1.3 }, fill: 'x', min: 40 },
    { shape: { line: [[40, 15], [58, 15]], width: 1.3 }, fill: 'p', min: 40 },
    { shape: { line: [[84, 8], [98, 8]], width: 1.3 }, fill: 'x', min: 48 },
    // The far towers, pale in the haze.
    {
      shape: {
        poly: [[20, 42], [21, 30], [24, 26], [27, 30], [28, 36], [32, 33], [34, 28], [37, 27], [39, 32], [40, 42]],
        smooth: 1
      },
      fill: 'a'
    },
    {
      shape: {
        poly: [[46, 42], [47, 33], [50, 29], [53, 31], [55, 35], [58, 32], [61, 33], [63, 38], [64, 42]],
        smooth: 1
      },
      fill: 'a'
    },
    { shape: { poly: [[74, 42], [76, 33], [80, 30], [84, 34], [86, 42]], smooth: 1 }, fill: 'a' },
    // Middle towers, blue-grey, lit from the right, with green ledges.
    {
      shape: {
        poly: [[22, 44], [23, 34], [25, 24], [28, 18], [32, 17], [35, 21], [35, 30], [34, 38], [36, 44]],
        smooth: 1
      },
      fill: 'g',
      shade: { light: 'a', dir: 'ne', width: 2 }
    },
    {
      shape: {
        poly: [[38, 44], [39, 36], [41, 28], [43, 24], [46, 25], [47, 32], [46, 38], [48, 44]],
        smooth: 1
      },
      fill: 'g',
      shade: { light: 'a', dir: 'ne' }
    },
    {
      shape: {
        poly: [[54, 44], [55, 36], [56, 27], [59, 21], [63, 20], [66, 24], [66, 32], [65, 38], [67, 44]],
        smooth: 1
      },
      fill: 'g',
      shade: { light: 'a', dir: 'ne', width: 2 }
    },
    { shape: { poly: [[67, 44], [68, 37], [71, 33], [74, 35], [75, 44]], smooth: 1 }, fill: 'g', shade: { light: 'a', dir: 'ne' } },
    { shape: { ellipse: [31, 19, 3.6, 2] }, fill: 'e', min: 40 },
    { shape: { ellipse: [62, 22, 3.6, 2] }, fill: 'e', min: 40 },
    { shape: { ellipse: [44, 26, 2.4, 1.6] }, fill: 'e', min: 48 },
    // A band of mist over the water line.
    { shape: { ellipse: [44, 41, 30, 2.4] }, fill: 'w', min: 40 },
    { shape: { ellipse: [76, 40.5, 10, 1.6] }, fill: 'y' },
    // The water: pale where it mirrors the sky, jade, then deep blue in front.
    { name: 'water', shape: { rect: [0, 42, 100, 33] }, fill: { gradient: ['m', 'q', 'u', 'n'], from: [0, 43], to: [0, 74], soft: 0.6 } },
    // Reflections of the middle towers.
    { shape: { poly: [[23, 44], [25, 52], [29, 57], [34, 53], [35, 46], [36, 44]], smooth: 1 }, fill: { stripes: ['g', 'm'], width: 1.4, angle: 90 }, clip: 'water', min: 40 },
    { shape: { poly: [[55, 44], [56, 51], [60, 55], [65, 51], [66, 44]], smooth: 1 }, fill: { stripes: ['g', 'q'], width: 1.4, angle: 90 }, clip: 'water' },
    // Sun glitter.
    { shape: { line: [[70, 46], [80, 46]], width: 1.2 }, fill: 'y' },
    { shape: { line: [[72, 49], [78, 49]], width: 1.2 }, fill: 'y', min: 40 },
    { shape: { line: [[64, 52], [72, 52]], width: 1.2 }, fill: 'm', min: 48 },
    // The near tower on the left: grey limestone walls under jungle, rounded on top.
    {
      name: 'left',
      shape: {
        poly: [[-4, 50], [-4, 14], [0, 8], [6, 5], [12, 6], [16, 10], [18, 18], [17, 27], [19, 34], [21, 42], [20, 47], [17, 50]],
        smooth: 1
      },
      fill: 'c',
      shade: { light: 'g', dir: 'ne', width: 2 }
    },
    { shape: { poly: [[-4, 4], [6, 3], [14, 5], [19, 12], [18, 18], [13, 16], [9, 21], [5, 17], [-4, 22]], smooth: 1 }, fill: 'd', clip: 'left', shade: { light: 'e', dir: 'ne', width: 2 } },
    { shape: { poly: [[12, 25], [17, 23], [20, 30], [15, 32]], smooth: 1 }, fill: 'd', clip: 'left', shade: { light: 'e', dir: 'ne' } },
    { shape: { poly: [[0, 31], [7, 29], [10, 35], [3, 37]], smooth: 1 }, fill: 'd', clip: 'left', shade: { light: 'e', dir: 'n' } },
    { shape: { rect: [0, 20, 22, 30] }, fill: { scatter: 'g', density: 0.14, salt: 13 }, clip: 'left', min: 40 },
    { shape: { rect: [0, 0, 22, 24] }, fill: { scatter: 'i', density: 0.16, salt: 11 }, clip: 'left', min: 40 },
    { shape: { line: [[13, 35], [14, 45]], width: 1 }, fill: 'g', clip: 'left', min: 48 },
    { shape: { line: [[6, 40], [7, 48]], width: 1 }, fill: 'g', clip: 'left', min: 48 },
    // The near tower on the right, taller and undercut at the water.
    {
      name: 'right',
      shape: {
        poly: [[80, 48], [82, 44], [80, 36], [82, 26], [84, 16], [88, 10], [94, 8], [100, 10], [104, 14], [104, 48]],
        smooth: 1
      },
      fill: 'c',
      shade: { light: 'g', dir: 'ne', width: 2 }
    },
    { shape: { poly: [[82, 16], [87, 8], [95, 6], [104, 10], [104, 22], [98, 20], [94, 25], [90, 20], [84, 23]], smooth: 1 }, fill: 'd', clip: 'right', shade: { light: 'e', dir: 'ne', width: 2 } },
    { shape: { poly: [[84, 32], [90, 30], [92, 36], [86, 38]], smooth: 1 }, fill: 'd', clip: 'right', shade: { light: 'e', dir: 'n' } },
    { shape: { poly: [[95, 41], [101, 39], [104, 45], [98, 46]], smooth: 1 }, fill: 'd', clip: 'right', shade: { light: 'e', dir: 'n' }, min: 40 },
    { shape: { rect: [80, 20, 24, 30] }, fill: { scatter: 'g', density: 0.14, salt: 14 }, clip: 'right', min: 40 },
    { shape: { rect: [80, 0, 24, 26] }, fill: { scatter: 'i', density: 0.14, salt: 12 }, clip: 'right', min: 40 },
    { shape: { line: [[96, 24], [97, 34]], width: 1 }, fill: 'g', clip: 'right', min: 48 },
    // Dark reflections of the near towers.
    { shape: { poly: [[-4, 50], [18, 50], [20, 54], [17, 60], [10, 64], [2, 66], [-4, 66]], smooth: 1 }, fill: { stripes: ['n', 'u'], width: 1.4, angle: 90 } },
    { shape: { poly: [[80, 48], [104, 48], [104, 66], [96, 66], [88, 62], [83, 56]], smooth: 1 }, fill: { stripes: ['n', 'u'], width: 1.4, angle: 90 } },
    // The junk: a dark hull and three battened rust sails, lit from the right.
    { name: 'sails', shape: { poly: [[36, 38], [44, 36], [47, 56], [37, 57]], smooth: 1 }, fill: 'r', shade: { light: 'o', dir: 'ne' } },
    { shape: { poly: [[28, 44], [34, 43], [35, 57], [28, 57]], smooth: 1 }, fill: 'r', shade: { light: 'o', dir: 'ne' } },
    { shape: { poly: [[48, 46], [53, 45], [55, 57], [48, 57]], smooth: 1 }, fill: 'r', shade: { light: 'o', dir: 'ne' } },
    { shape: { line: [[37, 42], [45, 41]], width: 0.9 }, fill: 'b', min: 40 },
    { shape: { line: [[37, 47], [46, 46]], width: 0.9 }, fill: 'b' },
    { shape: { line: [[37, 52], [46, 51]], width: 0.9 }, fill: 'b', min: 40 },
    { shape: { line: [[28, 50], [35, 49]], width: 0.9 }, fill: 'b', min: 48 },
    { shape: { line: [[48, 51], [54, 50]], width: 0.9 }, fill: 'b', min: 48 },
    { shape: { poly: [[24, 55], [30, 57], [52, 57], [58, 54], [56, 60], [50, 62], [31, 62], [26, 59]], smooth: 1 }, fill: 'b', shade: { dark: 'c', dir: 'n', mode: 'band', amount: 0.4 } },
    { shape: { rect: [33, 57.5, 18, 1.2] }, fill: 'p', min: 48 },
    { shape: { poly: [[26, 62], [56, 62], [52, 66], [30, 66]], smooth: 1 }, fill: { stripes: ['u', 'b'], width: 1.4, angle: 90 } },
    // Ripples in front.
    { shape: { line: [[60, 66], [70, 66]], width: 1 }, fill: 'q', min: 40 },
    { shape: { line: [[12, 70], [24, 70]], width: 1 }, fill: 'u', min: 40 },
    { shape: { line: [[40, 70], [50, 70]], width: 1 }, fill: 'q', min: 48 },
    { shape: { line: [[76, 71], [90, 71]], width: 1 }, fill: 'u', min: 48 }
  ]
};
