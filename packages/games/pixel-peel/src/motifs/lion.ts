import type { Motif } from '../art/types';

/** A maned lion resting on the granite boulders of a kopje, the savanna with acacias and blue hills behind. Original vector art drawn for Worthwhile Play. */
export const lion: Motif = {
  id: 'lion',
  group: 'animal',
  title: {
    de: 'Löwe',
    en: 'Lion',
    nl: 'Leeuw',
    es: 'León',
    fr: 'Lion',
    ru: 'Лев',
    'zh-Hans': '狮子',
    ko: '사자',
    ja: 'ライオン',
    ar: 'الأسد',
    pt: 'Leão',
    it: 'Leone',
    pl: 'Lew',
    tr: 'Aslan',
    uk: 'Лев',
    hi: 'सिंह'
  },
  place: {
    de: 'Savannen in Afrika südlich der Sahara; einige im Gir-Wald, Indien',
    en: 'Savannas of sub-Saharan Africa; a few in the Gir Forest, India',
    nl: 'Savannes in Afrika ten zuiden van de Sahara; enkele in het Gir-woud, India',
    es: 'Sabanas del África subsahariana; unos pocos en el bosque de Gir, India',
    fr: 'Savanes d’Afrique subsaharienne ; quelques-uns dans la forêt de Gir, en Inde',
    ru: 'Саванны Африки южнее Сахары; немного — в лесу Гир, Индия',
    'zh-Hans': '撒哈拉以南非洲的稀树草原；印度吉尔森林也有少量',
    ko: '사하라 이남 아프리카의 사바나, 일부는 인도 기르 숲',
    ja: 'サハラ以南のアフリカのサバンナ、一部はインドのギル森林',
    ar: 'سافانا أفريقيا جنوب الصحراء الكبرى، وقلة في غابة غير بالهند',
    pt: 'Savanas da África subsaariana; alguns na Floresta de Gir, Índia',
    it: 'Savane dell’Africa subsahariana; alcuni nella foresta di Gir, India',
    pl: 'Sawanny Afryki Subsaharyjskiej; nieliczne w lesie Gir w Indiach',
    tr: 'Sahra altı Afrika’nın savanları; birkaçı Hindistan’daki Gir Ormanı’nda',
    uk: 'Савани Африки на південь від Сахари; кілька — у лісі Гір, Індія',
    hi: 'उप-सहारा अफ़्रीका के सवाना; कुछ भारत के गिर वन में'
  },
  aspect: 'wide',
  backdrop: '#f2d0dc',
  palette: {
    s: ['#86bfe2', 'skyBlue', 1],
    l: ['#c4e0f0', 'lightBlue', 2, 's'],
    v: ['#9f98c6', 'lavender', 1],
    o: ['#9a9440', 'olive', 1],
    h: ['#c9a646', 'ochre', 2, 'o'],
    g: ['#3c5a2e', 'darkGreen', 1],
    t: ['#c8925a', 'tan', 1],
    y: ['#e8b86a', 'gold', 2, 't'],
    c: ['#f2e2c2', 'cream', 1],
    b: ['#6c4224', 'brown', 1],
    u: ['#9c5a2a', 'rust', 2, 'b'],
    n: ['#3e2616', 'darkBrown', 1],
    k: ['#181412', 'black', 3, 'n'],
    e: ['#8e8984', 'grey', 1],
    a: ['#c6bfb6', 'lightGrey', 2, 'e'],
    d: ['#55504d', 'darkGrey', 1]
  },
  layers: [
    // Late-afternoon sky, hazy towards the horizon, a few high clouds.
    { shape: { rect: [0, 0, 100, 40] }, fill: { gradient: ['s', 'l', 'c'], from: [0, 0], to: [0, 36], soft: 0.6 } },
    { shape: { ellipse: [70, 9, 16, 2.4] }, fill: 'c', shade: { dark: 'l', dir: 'n', mode: 'band', amount: 0.4 }, min: 44 },
    { shape: { ellipse: [22, 14, 12, 2] }, fill: 'l', min: 44 },
    // Blue hills, then the grass plain with acacias.
    { shape: { poly: [[0, 30], [14, 26], [28, 29], [44, 24], [60, 28], [78, 25], [100, 29], [100, 40], [0, 40]], smooth: 1 }, fill: 'v' },
    { name: 'plain', shape: { rect: [0, 34, 100, 41] }, fill: { gradient: ['h', 'o'], from: [0, 34], to: [0, 70], soft: 0.6 } },
    { shape: { all: true }, fill: { scatter: 'h', density: 0.14, salt: 61 }, clip: 'plain', min: 44 },
    { shape: { line: [[62, 36], [62.5, 27]], width: 1 }, fill: 'd' },
    { shape: { ellipse: [62, 26, 9, 2.6] }, fill: 'g', shade: { light: 'o', dir: 'n', mode: 'band', amount: 0.3 } },
    { shape: { line: [[88, 38], [87.5, 31]], width: 1 }, fill: 'd' },
    { shape: { ellipse: [88, 30, 7.5, 2.2] }, fill: 'g', shade: { light: 'o', dir: 'n', mode: 'band', amount: 0.3 } },
    { shape: { ellipse: [76, 33, 4, 1.2] }, fill: 'g', min: 44 },
    // The kopje: rounded granite boulders, lit from the left.
    { shape: { ellipse: [14, 70, 20, 11] }, fill: 'e', shade: { light: 'a', dark: 'd', dir: 'nw', width: 2 } },
    { shape: { ellipse: [90, 62, 16, 15] }, fill: 'e', shade: { light: 'a', dark: 'd', dir: 'nw', width: 2 } },
    { name: 'rock', shape: { poly: [[16, 56], [30, 50], [50, 48], [70, 49], [84, 54], [92, 64], [94, 76], [8, 76], [10, 64]], smooth: 2 }, fill: 'e', shade: { light: 'a', dark: 'd', dir: 'nw', width: 3 } },
    { shape: { line: [[30, 62], [42, 66], [48, 76]], width: 1 }, fill: 'd', clip: 'rock' },
    { shape: { line: [[66, 58], [72, 66], [70, 76]], width: 1 }, fill: 'd', clip: 'rock', min: 44 },
    { shape: { line: [[52, 60], [58, 61]], width: 1 }, fill: 'a', clip: 'rock', min: 56 },
    { shape: { all: true }, fill: { scatter: 'a', density: 0.06, salt: 63 }, clip: 'rock', min: 56 },
    { shape: { ellipse: [4, 74, 8, 3] }, fill: 'o', shade: { light: 'h', dir: 'n', mode: 'band', amount: 0.4 } },
    { shape: { ellipse: [74, 76, 10, 3] }, fill: 'o', shade: { light: 'h', dir: 'n', mode: 'band', amount: 0.4 }, min: 44 },
    // Shadow of the lion on the rock.
    { shape: { ellipse: [52.6, 52.4, 34.5, 3.4] }, fill: 'd', clip: 'rock' },
    // Tail hanging over the edge with its black tuft.
    { shape: { line: [[80.2, 45], [87.1, 48.4], [90.5, 55.3], [89.4, 63.4]], width: 2 }, fill: 't' },
    { shape: { ellipse: [89.4, 65.1, 2.1, 3] }, fill: 'k', keep: true },
    // Body and haunch.
    { shape: { poly: [[34.2, 35.8], [48, 32.3], [64.1, 32.9], [77.9, 34.6], [85.9, 41.5], [84.8, 49.5], [71, 52.4], [48, 52.4], [34.2, 49.5]], smooth: 2 }, fill: 't', shade: { light: 'y', dark: 'u', dir: 'nw', width: 2 } },
    { shape: { ellipse: [75.6, 43.8, 10.3, 8] }, fill: 't', shade: { light: 'y', dark: 'u', dir: 'nw', width: 1 } },
    { shape: { line: [[66.4, 48.4], [73.3, 51.3], [82.5, 50.7]], width: 1 }, fill: 'u', min: 44 },
    { shape: { ellipse: [81.3, 51.3, 4.6, 1.8] }, fill: 'c', shade: { dark: 't', dir: 'n', mode: 'band', amount: 0.4 } },
    // Front legs stretched out on the rock, pale paws.
    { shape: { poly: [[15.8, 48.4], [38.8, 46.1], [41.1, 53], [15.8, 53.6]], smooth: 1 }, fill: 't', shade: { light: 'y', dark: 'u', dir: 'n', mode: 'band', amount: 0.3 } },
    { shape: { ellipse: [14.7, 51.3, 4.6, 2.5] }, fill: 'c', shade: { dark: 't', dir: 'n', mode: 'band', amount: 0.4 } },
    { shape: { line: [[18.1, 50.1], [36.5, 49.5]], width: 1 }, fill: 'u', min: 44 },
    // The mane: a big dark ruff round the head, lighter at the rim.
    { shape: { poly: [[10.9, 24.9], [16.3, 14], [27.1, 8.6], [39.3, 12.6], [46, 22.2], [47.4, 35.8], [43.4, 46.6], [35.2, 53.3], [24.4, 54.7], [16.3, 49.3], [9.5, 38.5]], smooth: 2 }, fill: 'b', shade: { light: 'u', dark: 'n', dir: 'nw', width: 2 } },
    { shape: { line: [[38, 19.4], [43.4, 30.3], [40.6, 43.9]], width: 1 }, fill: 'n', min: 44 },
    { shape: { line: [[16.3, 19.4], [13.5, 33]], width: 1 }, fill: 'u', min: 56 },
    // Ears, face, muzzle, nose and amber-dark eyes.
    { shape: { ellipse: [17, 18.7, 3.8, 3.6] }, fill: 't', shade: { dark: 'k', dir: 'se' } },
    { shape: { ellipse: [34.5, 18.7, 3.8, 3.6] }, fill: 't', shade: { dark: 'k', dir: 'se' } },
    { name: 'face', shape: { poly: [[17.6, 22.2], [25.7, 19.4], [33.9, 22.2], [35.2, 31.7], [32.5, 41.2], [25.7, 46], [18.9, 41.2], [16.3, 31.7]], smooth: 1 }, fill: 't', shade: { light: 'y', dark: 'u', dir: 'nw', width: 1 } },
    { shape: { poly: [[23.7, 29], [27.8, 29], [29, 37.1], [22.5, 37.1]] }, fill: 'y', clip: 'face', min: 44 },
    { shape: { ellipse: [25.7, 40.5, 6.6, 4.8] }, fill: 'c', shade: { dark: 'a', dir: 'n', mode: 'band', amount: 0.3 } },
    { shape: { poly: [[23, 35.8], [28.5, 35.8], [26.8, 38.7], [24.7, 38.7]] }, fill: 'k', keep: true },
    { shape: { line: [[25.7, 39], [25.7, 42]], width: 1 }, fill: 'k', min: 56 },
    { shape: { rect: [19, 27.6, 4.6, 2.8] }, fill: 'k', keep: true },
    { shape: { rect: [28, 27.6, 4.6, 2.8] }, fill: 'k', keep: true }
  ]
};
