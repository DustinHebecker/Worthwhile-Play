import type { Layer, Motif, Point } from '../art/types';

const r1 = (v: number) => Math.round(v * 10) / 10;

/** A wavy line hanging from (x, y) down by `len`, swinging `amp` to the sides `waves` times. */
function wave(x: number, y: number, len: number, amp: number, waves: number, phase: number): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    points.push([r1(x + Math.sin((t * waves + phase) * Math.PI * 2) * amp * (0.4 + t)), r1(y + t * len)]);
  }
  return points;
}

/**
 * A jellyfish: a bell with a scalloped rim round (x, y) of half-width `w`, tentacles below. `bell`, `glow` and `deep`
 * are its light, glowing and dark keys; `tent` the tentacle key.
 */
function jelly(name: string, x: number, y: number, w: number, bell: string, glow: string, deep: string, tent: string, len: number, min?: number): Layer[] {
  const lod = min ? { min } : {};
  const h = w * 0.85;
  const out: Layer[] = [];
  for (let i = 0; i < 3; i++) {
    const tx = x - w * 0.6 + (w * 1.2 * i) / 2;
    out.push({ shape: { line: wave(tx, y + h * 0.15, len, w * 0.12, 1.3, i * 0.3), width: 1 }, fill: tent, ...lod });
  }
  const rim: Point[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    rim.push([r1(x + w - 2 * w * t), r1(y + h * 0.1 + (i % 2 === 0 ? 0 : h * 0.16))]);
  }
  const dome: Point[] = [];
  for (let i = 1; i < 12; i++) {
    const a = (Math.PI * i) / 12;
    dome.push([r1(x - Math.cos(a) * w), r1(y - Math.sin(a) * h)]);
  }
  out.push({ name, shape: { poly: [...dome, ...rim], smooth: 1 }, fill: { gradient: [glow, bell, deep], from: [x, y - h], to: [x, y + h * 0.3], soft: 0.6 }, ...lod });
  return out;
}

/** Glowing jellyfish drifting in dark ocean water, light falling from the surface above. Original vector art drawn for Worthwhile Play. */
export const jellyfish: Motif = {
  id: 'jellyfish',
  group: 'animal',
  title: {
    de: 'Quallen',
    en: 'Jellyfish',
    nl: 'Kwallen',
    es: 'Medusas',
    fr: 'Méduses',
    ru: 'Медузы',
    'zh-Hans': '水母',
    ko: '해파리',
    ja: 'クラゲ',
    ar: 'قناديل البحر',
    pt: 'Águas-vivas',
    it: 'Meduse',
    pl: 'Meduzy',
    tr: 'Denizanaları',
    uk: 'Медузи',
    hi: 'जेलीफ़िश'
  },
  place: {
    de: 'In allen Weltmeeren, von der Oberfläche bis in die Tiefsee',
    en: 'Every ocean, from the surface to the deep sea',
    nl: 'Alle oceanen, van het oppervlak tot de diepzee',
    es: 'Todos los océanos, de la superficie a las profundidades',
    fr: 'Tous les océans, de la surface aux grands fonds',
    ru: 'Все океаны, от поверхности до глубин',
    'zh-Hans': '世界各大洋，从海面到深海',
    ko: '모든 바다, 수면에서 심해까지',
    ja: '世界中の海、海面から深海まで',
    ar: 'كل المحيطات، من السطح إلى أعماق البحار',
    pt: 'Todos os oceanos, da superfície ao mar profundo',
    it: 'Tutti gli oceani, dalla superficie agli abissi',
    pl: 'Wszystkie oceany, od powierzchni po głębiny',
    tr: 'Yüzeyden derin denize kadar tüm okyanuslar',
    uk: 'Усі океани, від поверхні до глибин',
    hi: 'सभी महासागर, सतह से गहरे समुद्र तक'
  },
  aspect: 'tall',
  backdrop: '#f2e6c8',
  palette: {
    t: ['#2c7a8c', 'teal', 1],
    s: ['#5fa8d0', 'skyBlue', 2, 't'],
    b: ['#1d3f7a', 'blue', 1],
    n: ['#0f1a3e', 'navy', 1],
    x: ['#34104c', 'darkPurple', 2, 'n'],
    m: ['#cf4596', 'magenta', 1],
    p: ['#f08cc2', 'pink', 1],
    l: ['#fcd2e6', 'lightPink', 1],
    w: ['#ffffff', 'white', 3, 'l'],
    a: ['#b69ce2', 'lavender', 1],
    v: ['#7656bf', 'violet', 1],
    q: ['#4ed0cc', 'turquoise', 1],
    i: ['#b8f0dc', 'mint', 3, 'q'],
    c: ['#f2907a', 'coral', 1],
    d: ['#16505a', 'darkTeal', 2, 'b']
  },
  layers: [
    // Water: light near the surface, deep blue and violet-black below.
    { name: 'water', shape: { all: true }, fill: { gradient: ['t', 'b', 'n', 'x'], from: [0, 0], to: [0, 133], soft: 0.6 } },
    { shape: { poly: [[0, 0], [16, 0], [44, 133], [30, 133]] }, fill: 'd', clip: 'water', min: 36 },
    { shape: { poly: [[30, 0], [40, 0], [76, 120], [66, 120]] }, fill: { gradient: ['s', 't', 'b'], from: [0, 0], to: [0, 110], soft: 0.6 }, min: 36 },
    { shape: { poly: [[60, 0], [66, 0], [96, 90], [90, 90]] }, fill: { gradient: ['s', 't'], from: [0, 0], to: [0, 70], soft: 0.6 } },
    { shape: { all: true }, fill: { scatter: 'i', density: 0.03, salt: 81 }, min: 42 },
    // Two small turquoise jellyfish at the sides.
    ...jelly('left', 16, 100, 12, 'q', 'i', 'q', 'q', 22),
    ...jelly('right', 86, 82, 9, 'q', 'i', 'q', 'q', 16),
    // The big jellyfish: frilly oral arms behind, long tentacles, a glowing bell.
    { shape: { poly: [[44, 44], [40, 58], [44, 70], [38, 84], [42, 98], [38, 112], [44, 110], [48, 96], [46, 82], [50, 70], [48, 56], [52, 44]], smooth: 1 }, fill: 'a', shade: { dark: 'v', dir: 'ne', width: 1 } },
    { shape: { poly: [[54, 44], [60, 58], [56, 72], [62, 86], [58, 100], [64, 116], [68, 112], [64, 98], [68, 84], [62, 70], [66, 56], [60, 44]], smooth: 1 }, fill: 'a', shade: { dark: 'v', dir: 'nw', width: 1 } },
    { shape: { poly: [[48, 44], [50, 60], [48, 76], [52, 92], [50, 104], [54, 104], [56, 90], [53, 76], [55, 60], [53, 44]], smooth: 1 }, fill: 'v', shade: { light: 'a', dir: 'w', width: 1 }, min: 36 },
    ...[28, 36, 66, 74].map((tx, i): Layer => ({ shape: { line: wave(tx, 46, 70 + (i % 3) * 8, 3, 1.4, i * 0.25), width: 1 }, fill: i % 2 === 0 ? 'p' : 'l' })),
    ...[32, 40, 62, 70].map((tx, i): Layer => ({ shape: { line: wave(tx, 46, 60 + i * 6, 2.5, 1.2, i * 0.4), width: 1 }, fill: 'c' })),
    { name: 'bell', shape: { poly: [[52, 16], [64, 18], [74, 25], [79, 34], [80, 42], [76, 46], [72, 43], [68, 47], [62, 44], [56, 48], [50, 44], [44, 48], [38, 44], [32, 47], [28, 43], [24, 46], [20, 42], [21, 34], [26, 25], [36, 18]], smooth: 1 }, fill: { gradient: ['l', 'p', 'm'], from: [50, 16], to: [50, 46], soft: 0.6 }, shade: { light: 'w', dir: 'n', width: 1 } },
    // Glowing ribs running down the bell.
    { shape: { line: [[44, 20], [36, 44]], width: 1 }, fill: 'l', clip: 'bell' },
    { shape: { line: [[56, 20], [64, 44]], width: 1 }, fill: 'l', clip: 'bell' },
    { shape: { line: [[38, 22], [26, 42]], width: 1 }, fill: 'p', clip: 'bell', min: 36 },
    { shape: { line: [[62, 22], [74, 42]], width: 1 }, fill: 'p', clip: 'bell', min: 36 },
    { shape: { line: [[50, 18], [50, 46]], width: 1 }, fill: 'p', clip: 'bell', min: 42 },
    { shape: { ellipse: [42, 24, 6, 2.4], rot: -20 }, fill: 'w', clip: 'bell', min: 36 }
  ]
};
