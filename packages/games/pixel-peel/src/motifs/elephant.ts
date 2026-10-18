import type { Motif } from '../art/types';

/** An African savanna elephant walking in profile through golden grass, a flat-topped acacia and a warm evening sky. Original vector art drawn for Worthwhile Play. */
export const elephant: Motif = {
  id: 'elephant',
  group: 'animal',
  title: {
    de: 'Afrikanischer Elefant',
    en: 'African elephant',
    nl: 'Afrikaanse olifant',
    es: 'Elefante africano',
    fr: 'Éléphant d’Afrique',
    ru: 'Африканский слон',
    'zh-Hans': '非洲象',
    ko: '아프리카코끼리',
    ja: 'アフリカゾウ',
    ar: 'الفيل الأفريقي',
    pt: 'Elefante-africano',
    it: 'Elefante africano',
    pl: 'Słoń afrykański',
    tr: 'Afrika fili',
    uk: 'Африканський слон',
    hi: 'अफ़्रीकी हाथी'
  },
  place: {
    de: 'Afrika südlich der Sahara',
    en: 'Africa, south of the Sahara',
    nl: 'Afrika ten zuiden van de Sahara',
    es: 'África al sur del Sáhara',
    fr: 'Afrique au sud du Sahara',
    ru: 'Африка к югу от Сахары',
    'zh-Hans': '撒哈拉以南非洲',
    ko: '사하라 이남 아프리카',
    ja: 'サハラ以南のアフリカ',
    ar: 'أفريقيا جنوب الصحراء الكبرى',
    pt: 'África ao sul do Saara',
    it: 'Africa a sud del Sahara',
    pl: 'Afryka na południe od Sahary',
    tr: 'Sahra’nın güneyindeki Afrika',
    uk: 'Африка на південь від Сахари',
    hi: 'सहारा के दक्षिण का अफ़्रीका'
  },
  aspect: 'wide',
  backdrop: '#a9dbb0',
  palette: {
    o: ['#ec8a3a', 'orange', 1],
    p: ['#f6c288', 'peach', 1],
    y: ['#fbe9a8', 'lightYellow', 2, 'p'],
    g: ['#8b8a93', 'grey', 1],
    i: ['#bdbec6', 'lightGrey', 1],
    d: ['#5d5c67', 'darkGrey', 2, 'g'],
    k: ['#2b2930', 'charcoal', 1],
    v: ['#fbf3df', 'ivory', 1],
    h: ['#c8953a', 'ochre', 1],
    t: ['#ead36f', 'tan', 2, 'h'],
    b: ['#8a5c34', 'brown', 1],
    n: ['#4f2f17', 'darkBrown', 1],
    e: ['#6f7a35', 'olive', 1],
    m: ['#3f5a2c', 'darkGreen', 3, 'e'],
    r: ['#c0602e', 'rust', 3, 'o']
  },
  layers: [
    // Evening sky, low sun, distant hills.
    { shape: { all: true }, fill: { gradient: ['o', 'p', 'y'], from: [0, 0], to: [0, 46], soft: 0.85 } },
    { shape: { ellipse: [86, 40, 8, 8] }, fill: 'y' },
    { shape: { poly: [[-4, 44], [10, 38], [26, 42], [40, 37], [54, 42], [70, 39], [104, 41], [104, 52], [-4, 52]], smooth: 1 }, fill: 'r' },
    // Golden grass.
    { shape: { poly: [[-4, 80], [-4, 47], [30, 45], [60, 47], [104, 45], [104, 80]] }, fill: 'h', shade: { light: 't', dir: 'n', width: 2 } },
    { shape: { rect: [0, 52, 100, 23] }, fill: { scatter: 't', density: 0.12, salt: 111 } },
    { shape: { rect: [0, 58, 100, 17] }, fill: { scatter: 'b', density: 0.08, salt: 112 }, min: 40 },
    // The acacia: a flat crown on a forked trunk.
    { shape: { line: [[80, 47], [79, 36], [74, 28]], width: 2.2 }, fill: 'n' },
    { shape: { line: [[79, 36], [86, 28]], width: 1.8 }, fill: 'n' },
    { shape: { line: [[79, 40], [70, 31]], width: 1.2 }, fill: 'n', min: 40 },
    { shape: { ellipse: [80, 25, 18, 4.6] }, fill: 'e', shade: { light: 'h', dark: 'm', dir: 'n', mode: 'band', amount: 0.3 } },
    { shape: { ellipse: [70, 24, 8, 3] }, fill: 'e', shade: { dark: 'm', dir: 'n', mode: 'band', amount: 0.4 } },
    { shape: { ellipse: [90, 26, 8, 3] }, fill: 'e', shade: { dark: 'm', dir: 'n', mode: 'band', amount: 0.4 } },
    // Shadow under the elephant.
    { shape: { ellipse: [40, 66, 26, 3] }, fill: 'b' },
    // The far legs, darker.
    { shape: { poly: [[34, 44], [41, 44], [40, 65], [34, 65]] }, fill: 'd', shade: { dark: 'k', dir: 'w', mode: 'band', amount: 0.25 } },
    { shape: { poly: [[56, 42], [63, 42], [63, 64], [57, 64]] }, fill: 'd', shade: { dark: 'k', dir: 'w', mode: 'band', amount: 0.25 } },
    { shape: { line: [[64, 30], [68, 38], [68, 47]], width: 1.2 }, fill: 'k' },
    // Body and near legs.
    { name: 'body', shape: { poly: [[24, 34], [30, 22], [44, 18], [58, 22], [66, 30], [67, 40], [62, 48], [46, 51], [30, 48], [24, 42]], smooth: 2 }, fill: 'g', shade: { light: 'i', dark: 'd', dir: 'n', width: 2 }, outline: 'k' },
    { shape: { poly: [[25, 42], [34, 42], [34, 66], [25, 66]] }, fill: 'g', shade: { light: 'i', dark: 'd', dir: 'w', mode: 'band', amount: 0.25 } },
    { shape: { poly: [[48, 42], [57, 42], [58, 66], [49, 66]] }, fill: 'g', shade: { light: 'i', dark: 'd', dir: 'w', mode: 'band', amount: 0.25 } },
    { shape: { rect: [24.5, 64, 10, 2.5] }, fill: 'v' },
    { shape: { rect: [48.5, 64, 10, 2.5] }, fill: 'v' },
    { shape: { line: [[36, 26], [38, 46]], width: 1 }, fill: 'd', clip: 'body', min: 40 },
    { shape: { line: [[50, 24], [52, 46]], width: 1 }, fill: 'd', clip: 'body', min: 40 },
    { shape: { line: [[59, 28], [60, 44]], width: 1 }, fill: 'd', clip: 'body', min: 48 },
    // Head, trunk curling down, tusk, the large ear.
    { shape: { ellipse: [21, 30, 9.5, 11] }, fill: 'g', shade: { light: 'i', dark: 'd', dir: 'nw', width: 2 } },
    { shape: { line: [[16, 36], [12, 46]], width: 6.4 }, fill: 'g', shade: { light: 'i', dark: 'd', dir: 'w' } },
    { shape: { line: [[12, 46], [11, 55]], width: 5 }, fill: 'g', shade: { light: 'i', dark: 'd', dir: 'w' } },
    { shape: { line: [[11, 55], [13, 61], [17, 62]], width: 3.6 }, fill: 'g', shade: { light: 'i', dark: 'd', dir: 'w' } },
    { shape: { line: [[12, 48], [16, 48]], width: 1 }, fill: 'd', min: 48 },
    { shape: { line: [[11, 53], [15, 53]], width: 1 }, fill: 'd', min: 48 },
    { shape: { line: [[18, 42], [10, 47], [5, 45]], width: 3 }, fill: 'v', shade: { dark: 'p', dir: 'n' } },
    { shape: { poly: [[26, 20], [36, 17], [41, 26], [40, 40], [33, 47], [28, 40]], smooth: 2 }, fill: 'g', shade: { light: 'i', dark: 'd', dir: 'w', mode: 'band', amount: 0.35 }, outline: 'k' },
    { shape: { line: [[31, 25], [34, 34], [32, 41]], width: 1 }, fill: 'd', min: 40 },
    { shape: { ellipse: [18.5, 28, 1, 0.8] }, fill: 'k', keep: true }
  ]
};
