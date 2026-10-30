import type { Motif } from '../art/types';

/** A barn owl perched on a fence post at night, its white heart-shaped face lit by a full moon behind it. Original vector art drawn for Worthwhile Play. */
export const barnOwl: Motif = {
  id: 'barn-owl',
  group: 'animal',
  title: {
    de: 'Schleiereule',
    en: 'Barn owl',
    nl: 'Kerkuil',
    es: 'Lechuza común',
    fr: 'Effraie des clochers',
    ru: 'Обыкновенная сипуха',
    'zh-Hans': '仓鸮',
    ko: '원숭이올빼미',
    ja: 'メンフクロウ',
    ar: 'البومة البيضاء',
    pt: 'Coruja-das-torres',
    it: 'Barbagianni',
    pl: 'Płomykówka',
    tr: 'Peçeli baykuş',
    uk: 'Сипуха звичайна',
    hi: 'खलिहान उल्लू'
  },
  place: {
    de: 'Offenes Land in fast allen Erdteilen',
    en: 'Open country on every continent except Antarctica',
    nl: 'Open land op alle continenten behalve Antarctica',
    es: 'Campo abierto en todos los continentes salvo la Antártida',
    fr: 'Milieux ouverts sur tous les continents sauf l’Antarctique',
    ru: 'Открытые ландшафты на всех континентах, кроме Антарктиды',
    'zh-Hans': '除南极洲外各大洲的开阔地带',
    ko: '남극을 제외한 모든 대륙의 탁 트인 들판',
    ja: '南極大陸を除く各大陸の開けた土地',
    ar: 'الأراضي المفتوحة في كل القارات عدا القارة القطبية الجنوبية',
    pt: 'Campos abertos em todos os continentes, exceto a Antártida',
    it: 'Campagne aperte in tutti i continenti tranne l’Antartide',
    pl: 'Tereny otwarte na wszystkich kontynentach poza Antarktydą',
    tr: 'Antarktika dışındaki tüm kıtalarda açık araziler',
    uk: 'Відкриті простори на всіх континентах, крім Антарктиди',
    hi: 'अंटार्कटिका को छोड़कर सभी महाद्वीपों के खुले इलाक़े'
  },
  aspect: 'tall',
  backdrop: '#f2d4dc',
  palette: {
    n: ['#18204a', 'navy', 1],
    u: ['#2e4a8a', 'blue', 1],
    v: ['#6f6aa8', 'lavender', 2, 'u'],
    y: ['#f6eebe', 'lightYellow', 1],
    c: ['#e3cf8a', 'cream', 3, 'y'],
    w: ['#fbfaf6', 'white', 1],
    a: ['#e6d6bf', 'beige', 3, 'w'],
    g: ['#d9a04a', 'gold', 1],
    o: ['#a8742f', 'ochre', 2, 'g'],
    h: ['#c99a6e', 'lightBrown', 2, 'g'],
    e: ['#a9a8bb', 'lightGrey', 1],
    k: ['#141019', 'black', 1],
    b: ['#6e4c35', 'brown', 1],
    z: ['#3f2a1f', 'darkBrown', 2, 'b'],
    t: ['#13302f', 'darkTeal', 1],
    m: ['#3d6650', 'green', 1],
    l: ['#86ad8c', 'mint', 3, 'm']
  },
  layers: [
    // Night sky, lighter towards the moon and the horizon, with stars.
    { name: 'sky', shape: { rect: [0, 0, 100, 112] }, fill: { gradient: ['n', 'u', 'v'], from: [0, 8], to: [0, 104], soft: 0.6 } },
    { shape: { ellipse: [72, 26, 27, 27] }, fill: { gradient: ['u', 'v'], from: [72, 0], to: [72, 52], soft: 0.5 }, min: 40 },
    { shape: { all: true }, fill: { scatter: 'w', density: 0.025, salt: 41 }, clip: 'sky', min: 40 },
    { shape: { ellipse: [12, 14, 0.8, 0.8] }, fill: 'y', keep: true },
    { shape: { ellipse: [30, 8, 0.8, 0.8] }, fill: 'w', keep: true },
    { shape: { ellipse: [88, 62, 0.8, 0.8] }, fill: 'w', keep: true },
    { shape: { ellipse: [8, 48, 0.8, 0.8] }, fill: 'y', keep: true },
    // The full moon with soft grey seas.
    { shape: { ellipse: [72, 26, 17, 17] }, fill: 'y', shade: { dark: 'c', dir: 'ne', width: 2 } },
    { shape: { ellipse: [77, 20, 4.5, 3.5], rot: -20 }, fill: 'e', min: 40 },
    { shape: { ellipse: [80, 31, 3, 4] }, fill: 'e', min: 40 },
    { shape: { ellipse: [68, 36, 3.5, 2.4] }, fill: 'c', min: 48 },
    // Trees and hedges on the horizon, a moonlit meadow below.
    { shape: { poly: [[0, 104], [6, 96], [12, 94], [16, 98], [24, 99], [30, 92], [36, 90], [42, 95], [56, 97], [66, 93], [74, 88], [82, 90], [88, 96], [94, 95], [100, 92], [100, 114], [0, 114]], smooth: 1 }, fill: 't' },
    // A dark barn on the horizon with one lit window.
    { shape: { poly: [[3, 108], [3, 92], [14, 82], [25, 92], [25, 108]] }, fill: 'k' },
    { shape: { poly: [[25, 108], [25, 95], [34, 95], [34, 108]] }, fill: 'k' },
    { shape: { rect: [12, 94, 3, 3.5] }, fill: 'y', min: 40 },
    { name: 'meadow', shape: { rect: [0, 108, 100, 26] }, fill: { gradient: ['m', 't'], from: [0, 110], to: [0, 136], soft: 0.6 } },
    { shape: { poly: [[0, 106], [30, 104], [60, 107], [100, 103], [100, 112], [0, 112]], smooth: 1 }, fill: 'm', shade: { light: 'l', dir: 'n', mode: 'band', amount: 0.35 } },
    { shape: { all: true }, fill: { scatter: 'l', density: 0.12, salt: 43 }, clip: 'meadow', min: 40 },
    // A fence rail and the post the owl sits on.
    { shape: { poly: [[0, 98], [42, 94], [42, 99], [0, 103.5]] }, fill: 'b', shade: { light: 'h', dark: 'z', dir: 'n', mode: 'band', amount: 0.3 } },
    { shape: { poly: [[58, 94], [100, 97], [100, 102], [58, 99]] }, fill: 'b', shade: { light: 'h', dark: 'z', dir: 'n', mode: 'band', amount: 0.3 } },
    { shape: { rect: [5, 99, 5, 34] }, fill: 'z', shade: { light: 'b', dir: 'e' } },
    { shape: { rect: [90, 99, 5, 34] }, fill: 'z', shade: { light: 'b', dir: 'e' } },
    { name: 'post', shape: { rect: [38, 82, 24, 52] }, fill: 'b', shade: { light: 'h', dark: 'z', dir: 'ne', width: 2 } },
    { shape: { line: [[44, 92], [44.5, 130]], width: 1 }, fill: 'z', clip: 'post', min: 40 },
    { shape: { line: [[54, 100], [53.5, 126]], width: 1 }, fill: 'z', clip: 'post', min: 48 },
    { shape: { ellipse: [50, 82.5, 12, 2.2] }, fill: 'h' },
    // Wings and back: golden buff with grey mottling.
    { name: 'body', shape: { poly: [[28, 50], [38, 46], [62, 46], [72, 50], [74, 63], [69, 77], [60, 87], [50, 91], [40, 87], [31, 77], [26, 63]], smooth: 2 }, fill: 'g', shade: { dark: 'o', dir: 'ne', width: 2 } },
    { shape: { ellipse: [32, 58, 6, 3.6], rot: 35 }, fill: 'e', clip: 'body' },
    { shape: { ellipse: [68, 58, 6, 3.6], rot: -35 }, fill: 'e', clip: 'body' },
    { shape: { all: true }, fill: { scatter: 'e', density: 0.14, salt: 45 }, clip: 'body', min: 40 },
    { shape: { line: [[31, 70], [36, 82], [44, 90]], width: 1 }, fill: 'o', clip: 'body', min: 40 },
    { shape: { line: [[69, 70], [64, 82], [56, 90]], width: 1 }, fill: 'o', clip: 'body', min: 40 },
    // The white chest with fine dark spots.
    { name: 'chest', shape: { poly: [[41, 56], [50, 54], [59, 56], [61, 70], [57, 82], [50, 87], [43, 82], [39, 70]], smooth: 2 }, fill: 'w', shade: { dark: 'a', dir: 'ne', width: 2 } },
    { shape: { all: true }, fill: { scatter: 'o', density: 0.05, salt: 47 }, clip: 'chest', min: 48 },
    // Toes gripping the post.
    { shape: { ellipse: [45, 88.5, 3, 1.6] }, fill: 'e', shade: { dark: 'z', dir: 'n', mode: 'band', amount: 0.4 } },
    { shape: { ellipse: [55, 88.5, 3, 1.6] }, fill: 'e', shade: { dark: 'z', dir: 'n', mode: 'band', amount: 0.4 } },
    // The round head, then the white heart-shaped face with its buff rim.
    { name: 'head', shape: { ellipse: [50, 38, 19.5, 17] }, fill: 'g', shade: { dark: 'o', dir: 'ne', width: 2 } },
    { shape: { all: true }, fill: { scatter: 'e', density: 0.12, salt: 49 }, clip: 'head', min: 48 },
    { shape: { poly: [[50, 30], [45, 24], [38, 24], [33, 29.5], [32.5, 40], [36.5, 49], [43, 55.5], [50, 59.5], [57, 55.5], [63.5, 49], [67.5, 40], [67, 29.5], [62, 24], [55, 24]], smooth: 1 }, fill: 'w', shade: { dark: 'a', dir: 's', mode: 'band', amount: 0.25 }, outline: 'h' },
    { shape: { line: [[50, 31], [50, 45]], width: 1 }, fill: 'a', min: 40 },
    // Dark eyes and the pale hooked beak.
    { shape: { rect: [39.6, 36.2, 6.4, 7.6], round: 1.6 }, fill: 'k', keep: true },
    { shape: { rect: [54, 36.2, 6.4, 7.6], round: 1.6 }, fill: 'k', keep: true },
    { shape: { ellipse: [43.6, 38.8, 0.7, 0.7] }, fill: 'w', min: 48 },
    { shape: { ellipse: [58, 38.8, 0.7, 0.7] }, fill: 'w', min: 48 },
    { shape: { poly: [[48.6, 45], [51.4, 45], [50.8, 51.5], [50, 52.5], [49.2, 51.5]] }, fill: 'h', keep: true }
  ]
};
