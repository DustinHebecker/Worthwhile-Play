import type { Motif } from '../art/types';

/** Mount Fuji on a spring morning: the snow-capped cone above a band of cloud and forested foothills, mirrored in a lake, framed by a flowering cherry. Original vector art drawn for Worthwhile Play. */
export const mountFuji: Motif = {
  id: 'mount-fuji',
  group: 'landmark',
  title: {
    de: 'Fuji',
    en: 'Mount Fuji',
    nl: 'Fuji',
    es: 'Monte Fuji',
    fr: 'Mont Fuji',
    ru: 'Фудзи',
    'zh-Hans': '富士山',
    ko: '후지산',
    ja: '富士山',
    ar: 'جبل فوجي',
    pt: 'Monte Fuji',
    it: 'Monte Fuji',
    pl: 'Fudżi',
    tr: 'Fuji Dağı',
    uk: 'Фудзі',
    hi: 'फ़ूजी पर्वत'
  },
  place: {
    de: 'Honshū, Japan',
    en: 'Honshu, Japan',
    nl: 'Honshu, Japan',
    es: 'Honshu, Japón',
    fr: 'Honshū, Japon',
    ru: 'Хонсю, Япония',
    'zh-Hans': '日本本州',
    ko: '일본 혼슈',
    ja: '日本、本州',
    ar: 'هونشو، اليابان',
    pt: 'Honshu, Japão',
    it: 'Honshū, Giappone',
    pl: 'Honsiu, Japonia',
    tr: 'Honşu, Japonya',
    uk: 'Хонсю, Японія',
    hi: 'होंशू, जापान'
  },
  aspect: 'wide',
  backdrop: '#f2e2b8',
  palette: {
    b: ['#3a72c4', 'blue', 1],
    s: ['#86bbe6', 'skyBlue', 1],
    l: ['#c9e4f6', 'lightBlue', 2, 's'],
    w: ['#fcfcfd', 'white', 1],
    a: ['#aaa6da', 'lavender', 2, 'w'],
    v: ['#8a6cbc', 'violet', 1],
    u: ['#4a3f7e', 'darkPurple', 2, 'v'],
    n: ['#1f2f5a', 'navy', 1],
    d: ['#264d36', 'darkGreen', 1],
    e: ['#4e8b46', 'green', 1],
    m: ['#a2cc63', 'lightGreen', 2, 'e'],
    t: ['#2f8790', 'teal', 1],
    q: ['#62c2bd', 'turquoise', 3, 't'],
    p: ['#e57fa6', 'pink', 1],
    k: ['#f9cadb', 'lightPink', 2, 'p'],
    o: ['#4b2c27', 'darkBrown', 1]
  },
  layers: [
    // Morning sky: deep blue above, pale at the horizon, a few streaks of cloud.
    { shape: { rect: [0, 0, 100, 52] }, fill: { gradient: ['b', 's', 's', 'l'], from: [0, 0], to: [0, 46], soft: 0.6 } },
    { shape: { ellipse: [86, 7, 11, 2.2] }, fill: 'w', shade: { dark: 'l', dir: 'n', mode: 'band', amount: 0.4 } },
    { shape: { ellipse: [94, 11, 7, 1.6] }, fill: 'l', min: 40 },
    { shape: { ellipse: [34, 5, 7, 1.5] }, fill: 'l', min: 48 },
    // The cone: a broad concave profile with a flat, slightly notched summit.
    { name: 'fuji', shape: { poly: [[-10, 48], [-8, 46], [6, 39], [18, 32], [28, 25], [36, 18.5], [42, 13.5], [46, 10.5], [49, 9], [52, 8.2], [55, 8.8], [58, 8.1], [61, 9], [64, 10.5], [68, 13.5], [74, 18.5], [82, 25], [92, 32], [104, 39], [118, 46], [118, 48]], smooth: 1 }, fill: 'v', shade: { light: 's', dir: 'nw' } },
    // The shadowed west face.
    { name: 'shadow', shape: { poly: [[56, 8], [61, 9], [64, 10.5], [68, 13.5], [74, 18.5], [82, 25], [92, 32], [104, 39], [118, 46], [118, 52], [74, 52], [68, 40], [63, 28], [59, 18]], smooth: 1 }, fill: 'u', clip: 'fuji' },
    { shape: { line: [[38, 26], [34, 36], [36, 46]], width: 1 }, fill: 'u', clip: 'fuji', min: 40 },
    { shape: { line: [[22, 34], [18, 42]], width: 1 }, fill: 'u', clip: 'fuji', min: 48 },
    // The snow cap with streaks running down the gullies.
    { name: 'snow', shape: { poly: [[26, 27], [28, 25], [36, 18.5], [42, 13.5], [46, 10.5], [49, 9], [52, 8.2], [55, 8.8], [58, 8.1], [61, 9], [64, 10.5], [68, 13.5], [74, 18.5], [82, 25], [85, 27.2], [82, 27], [79, 30.5], [76, 25.5], [73, 28], [70, 33], [67, 24.5], [64, 28], [61, 23], [58, 31], [55, 23.5], [52, 28], [49, 22.5], [46, 30], [43, 24], [40, 27.5], [37, 24], [33, 28], [30, 25.5]] }, fill: 'w', clip: 'fuji' },
    { shape: { poly: [[56, 8], [61, 9], [64, 10.5], [68, 13.5], [74, 18.5], [82, 25], [85, 30], [70, 34], [63, 28], [59, 18]], smooth: 1 }, fill: 'a', clip: 'snow' },
    { shape: { line: [[48, 11], [44, 20]], width: 1 }, fill: 'a', clip: 'snow', min: 40 },
    { shape: { line: [[40, 16], [36, 23]], width: 1 }, fill: 'a', clip: 'snow', min: 48 },
    // A band of cloud around the lower slopes.
    { shape: { ellipse: [14, 35, 13, 2.6] }, fill: 'w', shade: { dark: 'a', dir: 'n', mode: 'band', amount: 0.4 } },
    { shape: { ellipse: [26, 33.5, 7, 2.2] }, fill: 'w', shade: { dark: 'a', dir: 'n', mode: 'band', amount: 0.35 } },
    { shape: { ellipse: [80, 37, 15, 2.4] }, fill: 'w', shade: { dark: 'a', dir: 'n', mode: 'band', amount: 0.4 } },
    { shape: { ellipse: [94, 34.5, 7, 2] }, fill: 'w', shade: { dark: 'a', dir: 'n', mode: 'band', amount: 0.35 } },
    // Forested foothills, a darker ridge behind a sunlit one.
    { name: 'hills', shape: { poly: [[0, 44], [8, 40.5], [18, 42], [28, 39.5], [38, 43], [50, 44.5], [62, 42.5], [72, 40], [84, 42.5], [94, 39.5], [100, 40.5], [100, 54], [0, 54]], smooth: 1 }, fill: 'd', shade: { light: 'e', dir: 'nw' } },
    { shape: { all: true }, fill: { scatter: 'e', density: 0.14, salt: 5 }, clip: 'hills', min: 40 },
    { name: 'near', shape: { poly: [[30, 52], [40, 47.5], [52, 46], [62, 47.5], [70, 46], [80, 48], [92, 46.5], [100, 47], [100, 54], [30, 54]], smooth: 1 }, fill: 'e', shade: { light: 'm', dark: 'd', dir: 'nw' } },
    { shape: { all: true }, fill: { scatter: 'd', density: 0.12, salt: 6 }, clip: 'near', min: 48 },
    // The lake with the mountain mirrored in it.
    { name: 'lake', shape: { rect: [0, 51, 100, 24] }, fill: { gradient: ['t', 't', 'n'], from: [0, 51], to: [0, 75], soft: 0.6 } },
    { shape: { poly: [[8, 51], [22, 55.5], [34, 59.5], [44, 62.5], [52, 63.5], [60, 62.5], [70, 59.5], [84, 55], [98, 51]], smooth: 1 }, fill: { gradient: ['v', 'v', 't'], from: [0, 51], to: [0, 64], soft: 0.6 }, clip: 'lake' },
    { shape: { poly: [[56, 64], [60, 62.5], [70, 59.5], [84, 55], [98, 51], [102, 51], [102, 58]], smooth: 1 }, fill: 'u', clip: 'lake' },
    { shape: { poly: [[38, 60.5], [44, 62.5], [52, 63.5], [60, 62.5], [66, 61], [63, 59], [60, 61], [56, 58.5], [52, 61], [48, 58.5], [44, 60.5], [41, 59]], smooth: 1 }, fill: 'a', clip: 'lake', min: 40 },
    { shape: { line: [[0, 56], [16, 56]], width: 1 }, fill: 'q', clip: 'lake' },
    { shape: { line: [[24, 60], [46, 60]], width: 1 }, fill: 'q', clip: 'lake' },
    { shape: { line: [[60, 57], [80, 57]], width: 1 }, fill: 'q', clip: 'lake', min: 40 },
    { shape: { line: [[34, 66], [52, 66]], width: 1 }, fill: 't', clip: 'lake', min: 40 },
    { shape: { line: [[56, 63], [70, 63]], width: 1 }, fill: 'q', clip: 'lake', min: 48 },
    { shape: { line: [[16, 70], [34, 70]], width: 1 }, fill: 'q', clip: 'lake', min: 48 },
    // The near shore: a grassy bank on the right.
    { name: 'bank', shape: { poly: [[52, 75], [60, 71], [72, 68.5], [88, 67], [100, 66.5], [100, 75]], smooth: 1 }, fill: 'e', shade: { light: 'm', dir: 'nw', width: 2 } },
    { shape: { all: true }, fill: { scatter: 'd', density: 0.12, salt: 7 }, clip: 'bank', min: 40 },
    // A flowering cherry on the left: trunk, branches and clouds of blossom.
    { shape: { poly: [[0, 75], [0, 40], [4, 30], [7, 31], [5, 42], [7, 58], [12, 75]], smooth: 1 }, fill: 'o' },
    { shape: { line: [[4, 34], [12, 22], [22, 15], [30, 12]], width: 2.4 }, fill: 'o' },
    { shape: { line: [[10, 25], [16, 30], [22, 31]], width: 1.6 }, fill: 'o' },
    { shape: { line: [[2, 32], [4, 18], [10, 8], [18, 2]], width: 2 }, fill: 'o' },
    { name: 'bloom', shape: { ellipse: [14, 5, 14, 7] }, fill: 'p', shade: { light: 'k', dir: 'nw', width: 2 } },
    { shape: { ellipse: [27, 11, 8, 4.6] }, fill: 'p', shade: { light: 'k', dir: 'nw', width: 2 } },
    { shape: { ellipse: [4, 18, 7, 6] }, fill: 'p', shade: { light: 'k', dir: 'nw', width: 2 } },
    { shape: { ellipse: [20, 27, 6, 3.6] }, fill: 'p', shade: { light: 'k', dir: 'nw', width: 2 } },
    { shape: { ellipse: [3, 2, 8, 5] }, fill: 'k' },
    { shape: { ellipse: [33, 12.5, 3.4, 2.4] }, fill: 'k', min: 40 },
    { shape: { ellipse: [10, 12, 4, 3] }, fill: 'k', min: 40 },
    { shape: { rect: [0, 0, 44, 34] }, fill: { scatter: 'o', density: 0.05, salt: 11 }, clip: 'bloom', min: 48 },
    // Fallen petals drifting on the water.
    { shape: { rect: [10, 52, 50, 23] }, fill: { scatter: 'k', density: 0.03, salt: 13 }, clip: 'lake', min: 48 },
    { shape: { ellipse: [16, 64, 2, 0.8] }, fill: 'k', min: 40 },
    { shape: { ellipse: [26, 72, 2.4, 0.9] }, fill: 'k', min: 40 }
  ]
};
