import type { Motif } from '../art/types';

/** A red-crowned crane dancing in a snowy marsh, broad white wings spread with black trailing edges, a red winter sun low over a far treeline. Original vector art drawn for Worthwhile Play. */
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
    c: ['#d6dde8', 'lightGrey', 2, 'w'],
    g: ['#868e9c', 'grey', 1],
    k: ['#1a1a20', 'black', 1],
    h: ['#4a4c5e', 'charcoal', 2, 'k'],
    r: ['#d8283a', 'red', 1],
    b: ['#3f63a8', 'blue', 1],
    s: ['#7f9fd6', 'skyBlue', 2, 'b'],
    v: ['#b9a3d8', 'lavender', 1],
    p: ['#f2b0c0', 'lightPink', 1],
    e: ['#f8d2b8', 'peach', 2, 'p'],
    t: ['#22424e', 'darkTeal', 1],
    a: ['#46707a', 'teal', 2, 't'],
    l: ['#aec2e0', 'lightBlue', 1],
    o: ['#c4964a', 'ochre', 1],
    n: ['#e3c48a', 'tan', 3, 'o']
  },
  layers: [
    // Dawn sky, deep blue above, pink at the horizon; a red winter sun over a low misty treeline.
    { shape: { all: true }, fill: { gradient: ['b', 's', 'v', 'p'], from: [0, 0], to: [0, 50], soft: 0.5 } },
    { shape: { rect: [-4, 42, 108, 20] }, fill: { gradient: ['p', 'e'], from: [0, 42], to: [0, 56], soft: 0.5 } },
    { shape: { ellipse: [88, 49, 6, 6] }, fill: 'r', keep: true },
    { name: 'trees', shape: { poly: [[-4, 66], [-4, 54], [4, 50], [8, 54], [14, 49], [20, 54], [28, 51], [36, 55], [44, 53], [56, 54], [64, 51], [72, 55], [80, 52], [86, 55], [94, 52], [104, 54], [104, 66]] }, fill: 't', shade: { light: 'a', dir: 'n', width: 2 } },
    { shape: { line: [[-4, 60], [104, 60]], width: 1 }, fill: 'a', clip: 'trees', min: 40 },
    // The calm snowy marsh: blue shade in the distance, bright in front, a few reed tufts.
    { name: 'snow', shape: { poly: [[-4, 63], [30, 62], [70, 62.5], [104, 62], [104, 104], [-4, 104]] }, fill: { gradient: ['l', 'c', 'w'], from: [0, 63], to: [0, 96], soft: 0.5 } },
    { shape: { ellipse: [20, 70, 24, 1.6] }, fill: 'l', clip: 'snow' },
    { shape: { ellipse: [80, 78, 22, 1.6] }, fill: 'c', clip: 'snow' },
    { shape: { ellipse: [50, 96, 18, 2.6] }, fill: 'l' },
    { shape: { ellipse: [72, 88, 16, 1.4] }, fill: 'l', clip: 'snow' },
    { shape: { ellipse: [26, 84, 14, 1.4] }, fill: 'c', clip: 'snow' },
    { shape: { ellipse: [10, 98, 10, 3] }, fill: 'o', shade: { light: 'n', dir: 'n' } },
    { shape: { line: [[6, 99], [5, 88], [3, 82]], width: 1 }, fill: 'o' },
    { shape: { line: [[10, 99], [11, 86], [14, 80]], width: 1 }, fill: 'o' },
    { shape: { line: [[14, 99], [16, 90]], width: 1 }, fill: 'n', min: 40 },
    { shape: { ellipse: [92, 97, 9, 3] }, fill: 'o', shade: { light: 'n', dir: 'n' } },
    { shape: { line: [[90, 99], [89, 87], [87, 82]], width: 1 }, fill: 'o' },
    { shape: { line: [[95, 99], [96, 88], [99, 83]], width: 1 }, fill: 'o' },
    { shape: { line: [[86, 99], [84, 91]], width: 1 }, fill: 'n', min: 40 },
    { shape: { ellipse: [30, 64, 5, 1.2] }, fill: 'o', min: 40 },
    { shape: { ellipse: [74, 66, 5, 1.2] }, fill: 'o', min: 40 },
    // Wings spread wide: white with grey feather rows, black secondaries along the trailing edges.
    {
      name: 'wingL',
      shape: { poly: [[45, 56], [38, 46], [30, 36], [22, 28], [14, 20], [5, 13], [3, 18], [7, 21], [3, 25], [9, 28], [6, 32], [12, 35], [16, 42], [22, 48], [30, 54], [38, 60], [45, 64]], smooth: 1 },
      fill: 'w',
      shade: { dark: 'c', dir: 'se', width: 1 }
    },
    { shape: { poly: [[11, 37], [17, 35], [25, 41], [33, 47], [41, 53], [48, 57], [46, 68], [36, 62], [28, 56], [20, 50], [13, 44]], smooth: 1 }, fill: 'k', clip: 'wingL', shade: { light: 'h', dir: 'nw' } },
    { shape: { line: [[12, 26], [20, 32], [28, 38]], width: 1 }, fill: 'g', clip: 'wingL' },
    { shape: { line: [[8, 18], [16, 24]], width: 1 }, fill: 'c', clip: 'wingL', min: 40 },
    { shape: { line: [[24, 34], [34, 42], [40, 48]], width: 1 }, fill: 'c', clip: 'wingL', min: 48 },
    {
      name: 'wingR',
      shape: { poly: [[55, 56], [62, 46], [70, 36], [78, 28], [86, 20], [95, 13], [97, 18], [93, 21], [97, 25], [91, 28], [94, 32], [88, 35], [84, 42], [78, 48], [70, 54], [62, 60], [55, 64]], smooth: 1 },
      fill: 'w',
      shade: { dark: 'c', dir: 'se', width: 1 }
    },
    { shape: { poly: [[89, 37], [83, 35], [75, 41], [67, 47], [59, 53], [52, 57], [54, 68], [64, 62], [72, 56], [80, 50], [87, 44]], smooth: 1 }, fill: 'k', clip: 'wingR', shade: { light: 'h', dir: 'nw' } },
    { shape: { line: [[88, 26], [80, 32], [72, 38]], width: 1 }, fill: 'g', clip: 'wingR' },
    { shape: { line: [[92, 18], [84, 24]], width: 1 }, fill: 'c', clip: 'wingR', min: 40 },
    { shape: { line: [[76, 34], [66, 42], [60, 48]], width: 1 }, fill: 'c', clip: 'wingR', min: 48 },
    // Long dark legs, one lifted in the dance.
    { shape: { line: [[47, 70], [46, 82], [44.5, 95]], width: 1.8 }, fill: 'h' },
    { shape: { line: [[44.5, 95], [40.5, 96]], width: 1 }, fill: 'h' },
    { shape: { line: [[54, 70], [59, 79], [55, 86], [57, 88]], width: 1.8 }, fill: 'h' },
    // White body, grey below, a short pale tail.
    { shape: { poly: [[38, 64], [32, 68], [34, 72], [40, 70]], smooth: 1 }, fill: 'c' },
    { shape: { ellipse: [50, 64, 12, 7.6] }, fill: 'w', shade: { dark: 'g', dir: 'nw', width: 2 } },
    { shape: { ellipse: [50, 96.5, 12, 1.6] }, fill: 'g' },
    // Black neck with a white nape, red crown, black face, a horn-coloured bill raised to the sky.
    { shape: { poly: [[51, 60], [52, 48], [53.5, 36], [54.5, 27], [60.5, 27], [60, 36], [59, 48], [59, 60]], smooth: 1 }, fill: 'k' },
    { shape: { line: [[52.6, 55], [53.6, 42], [55, 31]], width: 1.6 }, fill: 'w' },
    { shape: { ellipse: [57.5, 25, 4, 3.4] }, fill: 'k', keep: true },
    { shape: { ellipse: [56.8, 22.4, 3.2, 2] }, fill: 'r', keep: true },
    { shape: { ellipse: [54.6, 26.6, 1.6, 1.6] }, fill: 'w' },
    { shape: { poly: [[59, 24], [61.4, 22.8], [67.5, 11], [66.2, 10.4], [59, 21]] }, fill: 'n', keep: true }
  ]
};
