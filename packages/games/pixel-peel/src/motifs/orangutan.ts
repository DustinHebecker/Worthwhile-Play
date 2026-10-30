import type { Layer, Motif } from '../art/types';

/** A cluster of rainforest leaves: three overlapping leaves turned round (x, y). */
function leaves(x: number, y: number, s: number, rot: number, key: string, light: string): Layer[] {
  return [-40, 0, 40].map((d) => ({
    shape: { ellipse: [x + Math.round(Math.sin(((rot + d) * Math.PI) / 180) * 6 * s * 10) / 10, y - Math.round(Math.cos(((rot + d) * Math.PI) / 180) * 6 * s * 10) / 10, 3.4 * s, 7 * s], rot: rot + d },
    fill: key,
    shade: { light, dir: 'nw' }
  }));
}

/** A Bornean orangutan sitting on a branch in the misty rainforest, one long arm reaching up to the bough above. Original vector art drawn for Worthwhile Play. */
export const orangutan: Motif = {
  id: 'orangutan',
  group: 'animal',
  title: {
    de: 'Orang-Utan',
    en: 'Orangutan',
    nl: 'Orang-oetan',
    es: 'Orangután',
    fr: 'Orang-outan',
    ru: 'Орангутан',
    'zh-Hans': '猩猩',
    ko: '오랑우탄',
    ja: 'オランウータン',
    ar: 'إنسان الغاب',
    pt: 'Orangotango',
    it: 'Orango',
    pl: 'Orangutan',
    tr: 'Orangutan',
    uk: 'Орангутан',
    hi: 'ओरंगउटान'
  },
  place: {
    de: 'Regenwälder auf Borneo, Südostasien',
    en: 'Rainforests of Borneo, South-East Asia',
    nl: 'Regenwouden van Borneo, Zuidoost-Azië',
    es: 'Selvas de Borneo, sudeste asiático',
    fr: 'Forêts tropicales de Bornéo, Asie du Sud-Est',
    ru: 'Тропические леса Борнео, Юго-Восточная Азия',
    'zh-Hans': '东南亚婆罗洲的雨林',
    ko: '동남아시아 보르네오섬의 열대우림',
    ja: '東南アジア、ボルネオ島の熱帯雨林',
    ar: 'الغابات المطيرة في بورنيو، جنوب شرق آسيا',
    pt: 'Florestas tropicais de Bornéu, Sudeste Asiático',
    it: 'Foreste pluviali del Borneo, Sud-est asiatico',
    pl: 'Lasy deszczowe Borneo, Azja Południowo-Wschodnia',
    tr: 'Borneo’nun yağmur ormanları, Güneydoğu Asya',
    uk: 'Тропічні ліси Борнео, Південно-Східна Азія',
    hi: 'बोर्नियो के वर्षावन, दक्षिण-पूर्व एशिया'
  },
  aspect: 'tall',
  backdrop: '#f0d6e8',
  palette: {
    o: ['#d9672a', 'orange', 1],
    p: ['#f3a566', 'peach', 2, 'o'],
    u: ['#99401d', 'rust', 1],
    c: ['#4c3c37', 'charcoal', 1],
    n: ['#2b1d18', 'darkBrown', 2, 'c'],
    h: ['#c39478', 'tan', 1],
    b: ['#7a5a3e', 'brown', 1],
    l: ['#ad8a52', 'lightBrown', 3, 'b'],
    d: ['#1e4a2c', 'darkGreen', 1],
    e: ['#3f8a3c', 'green', 1],
    v: ['#6d7f34', 'olive', 3, 'e'],
    m: ['#96c95a', 'lightGreen', 1],
    z: ['#d3ea8a', 'lime', 3, 'm'],
    t: ['#3e817c', 'teal', 1],
    q: ['#173834', 'darkTeal', 1],
    a: ['#b4d8c6', 'mint', 1],
    g: ['#f2f7f3', 'white', 2, 'a']
  },
  layers: [
    // Misty rainforest depths: bright haze above, darker green-teal below, pale trunks fading into the mist.
    { shape: { all: true }, fill: { gradient: ['g', 'a', 't', 'q'], from: [0, 0], to: [0, 133], soft: 0.6 } },
    { shape: { rect: [10, 0, 7, 134] }, fill: 'a', shade: { light: 'g', dir: 'w' }, min: 36 },
    { shape: { rect: [62, 0, 6, 134] }, fill: 't', shade: { light: 'a', dir: 'w' } },
    { shape: { rect: [24, 30, 4, 104] }, fill: 't', min: 36 },
    { shape: { ellipse: [16, 40, 20, 10] }, fill: 't', shade: { light: 'a', dir: 'nw', mode: 'band', amount: 0.3 } },
    { shape: { ellipse: [70, 56, 18, 8] }, fill: 't', shade: { light: 'a', dir: 'nw', mode: 'band', amount: 0.3 }, min: 36 },
    // Hanging lianas.
    { shape: { line: [[6, 14], [8, 50], [5, 90], [8, 134]], width: 1 }, fill: 'v' },
    { shape: { line: [[72, 10], [74, 40], [71, 70]], width: 1 }, fill: 'm', min: 36 },
    { shape: { line: [[90, 8], [88, 60], [91, 100]], width: 1 }, fill: 'v', min: 42 },
    // The big trunk on the right and the bough above.
    { shape: { poly: [[80, 0], [96, 0], [97, 134], [78, 134], [80, 100], [82, 60]], smooth: 1 }, fill: 'b', shade: { light: 'l', dark: 'n', dir: 'w', width: 2 } },
    { shape: { line: [[86, 10], [85, 50], [87, 90], [86, 130]], width: 1 }, fill: 'n', min: 36 },
    { shape: { line: [[0, 22], [40, 17], [82, 12]], width: 6.5 }, fill: 'b', shade: { light: 'l', dark: 'n', dir: 'n', width: 1 } },
    // Leaves along the bough.
    ...leaves(8, 18, 1, -30, 'e', 'm'),
    ...leaves(56, 12, 0.9, 20, 'd', 'e'),
    ...leaves(46, 22, 0.8, 160, 'e', 'm'),
    ...leaves(70, 18, 0.8, 200, 'd', 'v'),
    // The branch the orangutan sits on, growing out of the trunk.
    { shape: { poly: [[0, 106], [30, 101], [60, 96], [84, 88], [86, 98], [62, 106], [32, 111], [0, 116]], smooth: 1 }, fill: 'b', shade: { light: 'l', dark: 'n', dir: 'n', width: 2 } },
    { shape: { line: [[6, 110], [30, 106], [56, 101]], width: 1 }, fill: 'n', min: 42 },
    // Foreground leaves at the bottom.
    ...leaves(10, 128, 1.4, 20, 'd', 'e'),
    ...leaves(34, 132, 1.2, -15, 'e', 'm'),
    ...leaves(70, 128, 1.3, 30, 'd', 'e'),
    ...leaves(92, 120, 1, -40, 'e', 'z'),
    // The long raised arm, gripping the bough, with long hair hanging from it.
    { shape: { poly: [[30, 30], [26, 40], [22, 48], [25, 49], [24, 56], [28, 56], [29, 63], [34, 62], [36, 50], [33, 34]] }, fill: 'u' },
    { shape: { line: [[38, 66], [33, 46], [30, 22]], width: 8 }, fill: 'o', shade: { light: 'p', dark: 'u', dir: 'w', width: 1 } },
    { shape: { line: [[33, 60], [30, 44], [29, 30]], width: 1 }, fill: 'p', min: 36 },
    { shape: { ellipse: [30.5, 20, 4.6, 3.6] }, fill: 'c', shade: { light: 'h', dir: 'n', mode: 'band', amount: 0.3 } },
    // Folded legs on the branch, a shadow between them, then the shaggy body.
    { shape: { ellipse: [49, 96, 8, 5] }, fill: 'n' },
    { shape: { line: [[27, 88], [28, 100]], width: 6.5 }, fill: 'o', shade: { light: 'p', dark: 'u', dir: 'w', width: 1 } },
    { shape: { line: [[71, 87], [70, 98]], width: 6.5 }, fill: 'o', shade: { light: 'p', dark: 'u', dir: 'w', width: 1 } },
    { shape: { ellipse: [37, 90, 12, 5.5], rot: -22 }, fill: 'o', shade: { light: 'p', dark: 'u', dir: 'nw' } },
    { shape: { ellipse: [61, 89, 12, 5.5], rot: 22 }, fill: 'o', shade: { light: 'p', dark: 'u', dir: 'nw' } },
    { shape: { ellipse: [28, 101, 4.4, 3] }, fill: 'c', shade: { light: 'h', dir: 'n', mode: 'band', amount: 0.3 } },
    { shape: { ellipse: [70, 99, 4.4, 3] }, fill: 'c', shade: { light: 'h', dir: 'n', mode: 'band', amount: 0.3 } },
    { name: 'body', shape: { poly: [[36, 60], [46, 57], [58, 59], [64, 68], [64, 80], [58, 88], [48, 90], [38, 88], [32, 80], [32, 68]], smooth: 2 }, fill: 'o', shade: { light: 'p', dark: 'u', dir: 'nw', width: 2 } },
    { shape: { line: [[40, 64], [39, 76], [41, 88]], width: 1 }, fill: 'u', clip: 'body' },
    { shape: { line: [[51, 66], [52, 78], [50, 89]], width: 1 }, fill: 'u', clip: 'body' },
    { shape: { line: [[45, 70], [46, 84]], width: 1 }, fill: 'p', clip: 'body', min: 42 },
    { shape: { line: [[58, 68], [59, 82]], width: 1 }, fill: 'u', clip: 'body', min: 36 },
    // The other arm resting on the knee.
    { shape: { line: [[61, 63], [68, 76], [63, 87]], width: 7 }, fill: 'o', shade: { light: 'p', dark: 'u', dir: 'nw', width: 1 } },
    { shape: { ellipse: [62, 88, 4, 3] }, fill: 'c', shade: { light: 'h', dir: 'n', mode: 'band', amount: 0.3 } },
    // Head: shaggy orange hair, a dark face with pale eye patches and muzzle.
    { shape: { ellipse: [48, 49, 14, 13.5] }, fill: 'o', shade: { light: 'p', dark: 'u', dir: 'nw', width: 2 } },
    { shape: { poly: [[35, 44], [38, 35], [43, 37], [47, 32], [52, 36], [57, 34], [61, 44]] }, fill: 'o', shade: { light: 'p', dir: 'nw' } },
    { name: 'face', shape: { poly: [[39, 44], [48, 41], [57, 44], [58.5, 54], [56, 61.5], [48, 64.5], [40, 61.5], [37.5, 54]], smooth: 1 }, fill: 'c' },
    { shape: { ellipse: [43.8, 49.5, 3.3, 2.7] }, fill: 'h', clip: 'face' },
    { shape: { ellipse: [52.2, 49.5, 3.3, 2.7] }, fill: 'h', clip: 'face' },
    { shape: { ellipse: [44, 49.8, 1.3, 1.3] }, fill: 'n', keep: true },
    { shape: { ellipse: [52, 49.8, 1.3, 1.3] }, fill: 'n', keep: true },
    { shape: { ellipse: [48, 58.2, 6.4, 4.4] }, fill: 'h', clip: 'face', shade: { light: 'l', dir: 'n', mode: 'band', amount: 0.3 } },
    { shape: { line: [[46.5, 56], [49.5, 56]], width: 1 }, fill: 'c', min: 42 },
    { shape: { line: [[46, 60.6], [50, 60.6]], width: 1 }, fill: 'c', min: 42 }
  ]
};
