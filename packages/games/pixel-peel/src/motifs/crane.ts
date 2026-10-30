import type { Motif } from '../art/types';

/** A red-crowned crane dancing in the snow with its wings raised, a second crane behind, a red winter sun over a dark forest. Original vector art drawn for Worthwhile Play. */
export const crane: Motif = {
  id: 'crane',
  group: 'animal',
  title: {
    de: 'Mandschurenkranich',
    en: 'Red-crowned crane',
    nl: 'Chinese kraanvogel',
    es: 'Grulla de Manchuria',
    fr: 'Grue du Japon',
    ru: 'Японский журавль',
    'zh-Hans': '丹顶鹤',
    ko: '두루미',
    ja: 'タンチョウ',
    ar: 'الكركي الياباني',
    pt: 'Grou-japonês',
    it: 'Gru della Manciuria',
    pl: 'Żuraw mandżurski',
    tr: 'Mançurya turnası',
    uk: 'Японський журавель',
    hi: 'लाल-मुकुट सारस'
  },
  place: {
    de: 'Japan, Nordostchina, Korea und Russlands Ferner Osten',
    en: 'Japan, north-east China, Korea and the Russian Far East',
    nl: 'Japan, Noordoost-China, Korea en het Russische Verre Oosten',
    es: 'Japón, el noreste de China, Corea y el Extremo Oriente ruso',
    fr: 'Japon, nord-est de la Chine, Corée et Extrême-Orient russe',
    ru: 'Япония, северо-восток Китая, Корея и Дальний Восток России',
    'zh-Hans': '日本、中国东北、朝鲜半岛和俄罗斯远东地区',
    ko: '일본, 중국 동북부, 한반도, 러시아 극동',
    ja: '日本、中国東北部、朝鮮半島、ロシア極東',
    ar: 'اليابان وشمال شرق الصين وكوريا والشرق الأقصى الروسي',
    pt: 'Japão, nordeste da China, Coreia e Extremo Oriente russo',
    it: 'Giappone, Cina nord-orientale, Corea ed Estremo Oriente russo',
    pl: 'Japonia, północno-wschodnie Chiny, Korea i rosyjski Daleki Wschód',
    tr: 'Japonya, kuzeydoğu Çin, Kore ve Rusya’nın Uzak Doğusu',
    uk: 'Японія, північний схід Китаю, Корея та Далекий Схід Росії',
    hi: 'जापान, उत्तर-पूर्वी चीन, कोरिया और रूस का सुदूर पूर्व'
  },
  aspect: 'square',
  backdrop: '#cfeedd',
  palette: {
    w: ['#fdfdfb', 'white', 1],
    c: ['#d3dbe9', 'lightGrey', 2, 'b'],
    b: ['#a7bad8', 'lightBlue', 1],
    k: ['#1a1a20', 'black', 1],
    h: ['#4a4c5e', 'charcoal', 2, 'k'],
    r: ['#d8283a', 'red', 1],
    s: ['#6f98dc', 'skyBlue', 1],
    v: ['#cfb0e0', 'lavender', 1],
    p: ['#f4b6c2', 'lightPink', 1],
    u: ['#76709f', 'violet', 1],
    t: ['#20505a', 'darkTeal', 1],
    a: ['#3f7d7a', 'teal', 2, 't'],
    g: ['#9a94c4', 'purple', 3, 'u'],
    o: ['#c4964a', 'ochre', 1],
    d: ['#5e3a2a', 'darkBrown', 2, 'o'],
    l: ['#8c8a55', 'olive', 3, 'o'],
    n: ['#e6c98e', 'tan', 3, 'o']
  },
  layers: [
    // Dawn sky over a misty far forest and a dark near forest, snow falling.
    { shape: { all: true }, fill: { gradient: ['s', 'v', 'p'], from: [0, 0], to: [0, 30], soft: 0.6 } },
    {
      name: 'far',
      shape: {
        poly: [
          [-4, 62], [-4, 24], [3, 18], [7, 24], [12, 16], [17, 23], [22, 19], [27, 25], [33, 17], [38, 24], [44, 20], [50, 26],
          [56, 18], [61, 24], [66, 15], [71, 22], [77, 18], [82, 24], [88, 16], [93, 22], [98, 18], [104, 24], [104, 62]
        ]
      },
      fill: 'u',
      shade: { light: 'g', dir: 'n', mode: 'band', amount: 0.25 }
    },
    {
      name: 'forest',
      shape: {
        poly: [
          [-4, 62], [-4, 36], [2, 30], [6, 37], [10, 28], [15, 36], [20, 32], [25, 39], [31, 31], [36, 38], [42, 34], [47, 40],
          [53, 33], [58, 39], [63, 30], [68, 37], [73, 32], [79, 38], [84, 29], [89, 36], [94, 31], [99, 37], [104, 33], [104, 62]
        ]
      },
      fill: { gradient: ['a', 't'], from: [0, 30], to: [0, 50], soft: 0.6 }
    },
    { shape: { all: true }, fill: { stripes: ['t', 'a'], width: 2, angle: 90 }, clip: 'forest', min: 48 },
    { shape: { all: true }, fill: { scatter: 'b', density: 0.07, salt: 9 }, clip: 'forest', min: 40 },
    { shape: { all: true }, fill: { scatter: 'w', density: 0.035, salt: 5 }, min: 40 },
    // Snow field: blue shade at the far edge, bright in front, with wind ripples.
    { name: 'snow', shape: { poly: [[-4, 58], [30, 56.5], [70, 57], [104, 56], [104, 104], [-4, 104]] }, fill: { gradient: ['b', 'c', 'w'], from: [0, 58], to: [0, 98], soft: 0.6 } },
    { shape: { ellipse: [22, 70, 20, 1.6] }, fill: 'c', clip: 'snow' },
    { shape: { ellipse: [70, 86, 18, 1.6] }, fill: 'b', clip: 'snow' },
    { shape: { ellipse: [62, 74, 22, 1.4] }, fill: 'c', clip: 'snow' },
    { shape: { ellipse: [30, 88, 14, 1.4] }, fill: 'c', clip: 'snow', min: 40 },
    { shape: { ellipse: [49, 95, 17, 2.6] }, fill: 'b' },
    { shape: { ellipse: [84, 81, 9, 1.5] }, fill: 'b' },
    // Tufts of marsh grass in the snow.
    { shape: { ellipse: [8, 63, 5, 1.6] }, fill: 'o', min: 40 },
    { shape: { ellipse: [22, 62, 5, 1.5] }, fill: 'o' },
    { shape: { ellipse: [66, 66, 5, 1.5] }, fill: 'o' },
    { shape: { ellipse: [90, 64, 4, 1.3] }, fill: 'o', min: 40 },
    { shape: { ellipse: [72, 76, 7, 1.8] }, fill: 'n', min: 40 },
    { shape: { ellipse: [30, 76, 5, 1.5] }, fill: 'o', min: 40 },
    { shape: { ellipse: [64, 90, 8, 2] }, fill: 'n', min: 48 },
    { shape: { ellipse: [50, 61, 4, 1.2] }, fill: 'n', min: 48 },
    { shape: { ellipse: [30, 91, 5, 1.5] }, fill: 'n', min: 48 },
    { shape: { ellipse: [80, 70, 5, 1.4] }, fill: 'o', min: 40 },
    // A winter shrub with red berries on the left, dry reeds on the right.
    { shape: { line: [[4, 100], [6, 88], [3, 78]], width: 1.4 }, fill: 'd' },
    { shape: { line: [[6, 90], [12, 82], [14, 73]], width: 1.4 }, fill: 'd' },
    { shape: { line: [[10, 100], [15, 90], [22, 84]], width: 1.4 }, fill: 'd' },
    { shape: { line: [[2, 86], [-2, 80]], width: 1 }, fill: 'd', min: 40 },
    { shape: { ellipse: [3.5, 76.5, 3.6, 3] }, fill: 'r', keep: true },
    { shape: { ellipse: [14, 72, 3.6, 3] }, fill: 'r', keep: true },
    { shape: { ellipse: [22, 83, 3.6, 3] }, fill: 'r', keep: true },
    { shape: { ellipse: [9, 85.5, 3.2, 2.6] }, fill: 'r', keep: true },
    { shape: { ellipse: [3, 74.4, 2.6, 1] }, fill: 'w', min: 40 },
    { shape: { ellipse: [14, 69.8, 2.6, 1] }, fill: 'w', min: 40 },
    { shape: { ellipse: [22, 80.8, 2.6, 1] }, fill: 'w', min: 48 },
    { shape: { ellipse: [12, 100, 12, 3.4] }, fill: 'c' },
    { name: 'reeds', shape: { poly: [[84, 102], [86, 93], [89, 88], [92, 84], [95, 88], [98, 83], [101, 90], [104, 102]], smooth: 1 }, fill: 'o', shade: { light: 'n', dark: 'l', dir: 'nw' } },
    { shape: { line: [[90, 99], [91, 88], [89, 74]], width: 1 }, fill: 'o' },
    { shape: { line: [[94, 99], [95, 86], [98, 72]], width: 1 }, fill: 'l' },
    { shape: { line: [[86, 99], [84, 88], [80, 80]], width: 1 }, fill: 'n' },
    { shape: { line: [[92, 99], [88, 84]], width: 1 }, fill: 'l', clip: 'reeds', min: 48 },
    { shape: { line: [[98, 99], [96, 86]], width: 1 }, fill: 'd', clip: 'reeds', min: 40 },
    // The second crane further back on the right, bowing in the dance.
    { shape: { line: [[83, 59], [83, 66]], width: 1 }, fill: 'h' },
    { shape: { line: [[87, 59], [88, 66]], width: 1 }, fill: 'h' },
    { shape: { ellipse: [86, 56.5, 6.5, 3.8], rot: 8 }, fill: 'w', shade: { dark: 'c', dir: 'nw' } },
    { shape: { poly: [[89, 53], [96, 52], [96, 57], [90, 59]], smooth: 1 }, fill: 'k' },
    { shape: { line: [[81, 55.5], [78, 58], [76.5, 61]], width: 2.2 }, fill: 'k' },
    { shape: { ellipse: [76, 61.5, 2, 1.7] }, fill: 'k', keep: true },
    { shape: { ellipse: [75.6, 60.4, 1.5, 1] }, fill: 'r', keep: true },
    { shape: { line: [[75, 62.5], [73.5, 66]], width: 1 }, fill: 'l', min: 40 },
    // The dancing crane: wings raised, black secondaries along the trailing edges, white primaries.
    { shape: { line: [[45, 70], [44, 82], [42.5, 94]], width: 1.6 }, fill: 'h' },
    { shape: { line: [[52, 71], [55, 81], [51, 88], [52, 94]], width: 1.6 }, fill: 'h' },
    { shape: { line: [[42.5, 94], [38.5, 95]], width: 1 }, fill: 'h', min: 40 },
    {
      name: 'wingL',
      shape: { poly: [[46, 57], [36, 44], [24, 31], [13, 22], [4, 15], [2, 20], [6, 25], [3, 28], [9, 32], [7, 35.5], [15, 39], [22, 45], [30, 53], [38, 61]], smooth: 1 },
      fill: 'w',
      shade: { dark: 'c', dir: 'nw', width: 1 }
    },
    { shape: { poly: [[40, 63], [30, 53], [22, 45], [18, 41.5], [22.5, 41], [30, 47.5], [39, 55], [47, 59]], smooth: 1 }, fill: 'k', clip: 'wingL' },
    { shape: { line: [[13, 27], [24, 36]], width: 1 }, fill: 'c', clip: 'wingL', min: 40 },
    { shape: { line: [[8, 21], [16, 28]], width: 1 }, fill: 'c', clip: 'wingL', min: 48 },
    {
      name: 'wingR',
      shape: { poly: [[52, 57], [62, 44], [74, 31], [85, 22], [96, 15], [98, 20], [94, 25], [97, 28], [91, 32], [93, 35.5], [85, 39], [78, 45], [70, 53], [60, 62]], smooth: 1 },
      fill: 'w',
      shade: { dark: 'c', dir: 'nw', width: 1 }
    },
    { shape: { poly: [[58, 63], [70, 53], [78, 45], [82, 41.5], [77.5, 41], [70, 47.5], [61, 55], [53, 59]], smooth: 1 }, fill: 'k', clip: 'wingR' },
    { shape: { line: [[87, 27], [76, 36]], width: 1 }, fill: 'c', clip: 'wingR', min: 40 },
    { shape: { line: [[92, 21], [84, 28]], width: 1 }, fill: 'c', clip: 'wingR', min: 48 },
    { shape: { poly: [[38, 60], [31, 65], [33, 71], [40, 69]], smooth: 1 }, fill: 'k' },
    { name: 'body', shape: { ellipse: [48, 64, 13, 8], rot: -12 }, fill: 'w', shade: { dark: 'c', dir: 'se', width: 2 } },
    // Neck: black at the front, a white band down the nape; red crown, pale horn-coloured bill pointing at the sky.
    { shape: { poly: [[49, 60], [51, 47], [53.5, 35], [55.5, 28], [61, 28], [60, 36], [58.5, 47], [58, 60]], smooth: 1 }, fill: 'k' },
    { shape: { line: [[51.5, 54], [53, 41], [55.5, 30]], width: 1.4 }, fill: 'w' },
    { shape: { ellipse: [58.5, 27, 3.6, 3] }, fill: 'k', keep: true },
    { shape: { ellipse: [57.8, 24.4, 3, 1.9] }, fill: 'r', keep: true },
    { shape: { ellipse: [56, 28.4, 1.4, 1.4] }, fill: 'w', min: 40 },
    { shape: { poly: [[59.5, 26], [61.5, 24], [68.5, 14.5], [67.5, 14], [60, 22.5]] }, fill: 'l', keep: true },
    { shape: { line: [[60.5, 25.5], [68, 14.5]], width: 1 }, fill: 'n', min: 48 }
  ]
};
