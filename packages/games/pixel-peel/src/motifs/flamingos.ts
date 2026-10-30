import type { Layer, Motif, Point } from '../art/types';

/**
 * One flamingo standing in shallow water, drawn facing right with its standing foot at (45, 66) and scaled about
 * that point: `x`, `y` place the foot, `s` scales, `m` = -1 mirrors it to face left.
 */
function flamingo(x: number, y: number, s: number, m: 1 | -1, name: string, reflect: boolean): Layer[] {
  const p = (q: Point): Point => [Math.round((x + m * s * (q[0] - 45)) * 10) / 10, Math.round((y + s * (q[1] - 66)) * 10) / 10];
  const ps = (qs: readonly Point[]) => qs.map(p);
  const r = (q: Point): Point => {
    const [px, py] = p(q);
    return [px, Math.round((y + (y - py) * 0.55) * 10) / 10];
  };
  const body: Point[] = [[28, 40], [33, 35.5], [41, 32.5], [49, 33], [53.5, 36.5], [52, 42], [45, 46], [36, 46.5], [30, 44]];
  const neck: Point[] = [[51, 35.5], [52.5, 30], [50.6, 24], [48.2, 19], [48.6, 14], [52, 11], [55.5, 11.4]];
  const out: Layer[] = [];
  if (reflect) {
    // A soft, squashed reflection below the foot.
    out.push({ shape: { poly: body.map(r) as Point[], smooth: 1 }, fill: 'm', min: 44 });
    out.push({ shape: { line: neck.map(r) as Point[], width: 1 }, fill: 'm', min: 44 });
    out.push({ shape: { line: [r([45, 46]), r([45, 66])], width: 1 }, fill: 'm', min: 44 });
  }
  out.push(
    // The legs: one standing, one folded up.
    { shape: { line: ps([[44.5, 45], [45, 55.5], [45, 66]]), width: 1 }, fill: 'd' },
    { shape: { line: ps([[39.5, 45], [40.5, 51.5], [46, 48.5]]), width: 1 }, fill: 'n', min: 40 },
    { shape: { ellipse: [x, y + 0.6 * s, 3.4 * s, 0.9 * s] }, fill: 'w', min: 44 },
    // Body, crimson wing coverts and black flight feathers.
    { name, shape: { poly: ps(body), smooth: 2 }, fill: 'c', shade: { light: 'e', dark: 'd', dir: m === 1 ? 'nw' : 'ne', width: 1 } },
    { shape: { poly: ps([[30, 41.5], [37, 38.6], [45, 38.4], [44, 42], [36, 44], [31, 44]]), smooth: 1 }, fill: 'd', clip: name, shade: { dark: 'n', dir: 's', mode: 'band', amount: 0.45 } },
    { shape: { poly: ps([[24.5, 41], [33, 41.5], [36, 45.5], [29.5, 46.5]]), smooth: 1 }, fill: 'k' },
    // The S-shaped neck, head, pale beak with its black, bent-down tip.
    { shape: { line: ps(neck), width: 3.2 * s }, fill: 'c' },
    { shape: { line: ps([[52.4, 34], [53.2, 30], [51.4, 24.5]]), width: 1 }, fill: 'e', min: 48 },
    { shape: { ellipse: [p([56.6, 12])[0], p([56.6, 12])[1], 3.2 * s, 2.6 * s] }, fill: 'c', shade: { light: 'e', dir: 'n', mode: 'band', amount: 0.3 } },
    { shape: { poly: ps([[58.6, 10.2], [61.8, 11], [63.6, 13.6], [63, 17], [61.6, 18], [60.8, 15.2], [59, 14]]) }, fill: 'w' },
    { shape: { poly: ps([[63.6, 13.8], [63, 17], [61.6, 18], [61, 15.4]]) }, fill: 'k', keep: true },
    { shape: { ellipse: [p([56.4, 11.3])[0], p([56.4, 11.3])[1], 0.9 * s, 0.9 * s] }, fill: 'k', keep: true }
  );
  return out;
}

/** Flamingos standing in a shallow pink soda lake at morning, acacias and blue hills on the far shore. Original vector art drawn for Worthwhile Play. */
export const flamingos: Motif = {
  id: 'flamingos',
  group: 'animal',
  title: {
    de: 'Flamingos',
    en: 'Flamingos',
    nl: 'Flamingo’s',
    es: 'Flamencos',
    fr: 'Flamants roses',
    ru: 'Фламинго',
    'zh-Hans': '火烈鸟',
    ko: '플라밍고',
    ja: 'フラミンゴ',
    ar: 'طيور النحام',
    pt: 'Flamingos',
    it: 'Fenicotteri',
    pl: 'Flamingi',
    tr: 'Flamingolar',
    uk: 'Фламінго',
    hi: 'राजहंस'
  },
  place: {
    de: 'Salz- und Sodaseen in Afrika, Südeuropa, Asien und Amerika',
    en: 'Salt and soda lakes of Africa, southern Europe, Asia and the Americas',
    nl: 'Zout- en sodameren in Afrika, Zuid-Europa, Azië en Amerika',
    es: 'Lagos salados y sódicos de África, el sur de Europa, Asia y América',
    fr: 'Lacs salés et lacs de soude d’Afrique, d’Europe du Sud, d’Asie et d’Amérique',
    ru: 'Солёные и содовые озёра Африки, Южной Европы, Азии и Америки',
    'zh-Hans': '非洲、南欧、亚洲和美洲的盐湖与碱湖',
    ko: '아프리카, 남유럽, 아시아, 아메리카의 염호와 소다호',
    ja: 'アフリカ、南ヨーロッパ、アジア、南北アメリカの塩湖・ソーダ湖',
    ar: 'البحيرات المالحة والقلوية في أفريقيا وجنوب أوروبا وآسيا والأمريكتين',
    pt: 'Lagos salgados e alcalinos da África, do sul da Europa, da Ásia e das Américas',
    it: 'Laghi salati e alcalini di Africa, Europa meridionale, Asia e Americhe',
    pl: 'Jeziora słone i sodowe Afryki, południowej Europy, Azji i obu Ameryk',
    tr: 'Afrika, Güney Avrupa, Asya ve Amerika’nın tuz ve soda gölleri',
    uk: 'Солоні та содові озера Африки, Південної Європи, Азії та Америки',
    hi: 'अफ़्रीका, दक्षिणी यूरोप, एशिया और अमेरिका की खारी और सोडा झीलें'
  },
  aspect: 'wide',
  backdrop: '#c6ecd6',
  palette: {
    s: ['#86bde0', 'skyBlue', 1],
    l: ['#c3e0f1', 'lightBlue', 2, 's'],
    y: ['#fbefb0', 'lightYellow', 3, 'w'],
    v: ['#7d6aa8', 'violet', 1],
    a: ['#b9aede', 'lavender', 1],
    g: ['#2f5a3a', 'darkGreen', 1],
    o: ['#7d8a3e', 'olive', 3, 'g'],
    b: ['#e2caa0', 'beige', 1],
    t: ['#b6936a', 'tan', 2, 'b'],
    q: ['#f5c2cd', 'lightPink', 1],
    r: ['#e58fa8', 'pink', 1],
    m: ['#c9437a', 'magenta', 2, 'r'],
    c: ['#f07a6a', 'coral', 1],
    e: ['#f9b496', 'peach', 2, 'c'],
    d: ['#c8363d', 'red', 1],
    n: ['#7e2a3a', 'maroon', 3, 'd'],
    k: ['#1d1a1f', 'black', 1],
    w: ['#fdf8ee', 'ivory', 1]
  },
  layers: [
    // Morning sky, haze at the horizon, a few clouds.
    { shape: { rect: [0, 0, 100, 34] }, fill: { gradient: ['s', 'l', 'y'], from: [0, 0], to: [0, 32], soft: 0.6 } },
    { shape: { ellipse: [20, 8, 12, 2.6] }, fill: 'w', shade: { dark: 'l', dir: 'n', mode: 'band', amount: 0.4 }, min: 40 },
    { shape: { ellipse: [76, 13, 15, 2.8] }, fill: 'l', shade: { light: 'w', dir: 'n', mode: 'band', amount: 0.4 } },
    // Blue hills on the far shore, then the acacia woodland at the water.
    { shape: { poly: [[0, 26], [12, 20], [24, 22], [38, 16], [52, 21], [64, 19], [80, 23], [92, 18], [100, 20], [100, 34], [0, 34]], smooth: 1 }, fill: 'a', shade: { light: 'l', dir: 'nw', width: 1 } },
    { shape: { poly: [[0, 30], [10, 27], [22, 29], [34, 26], [48, 28.5], [62, 26.5], [76, 29], [90, 27], [100, 28.5], [100, 34], [0, 34]], smooth: 1 }, fill: 'v' },
    { shape: { rect: [0, 31, 100, 4] }, fill: 'g' },
    { shape: { ellipse: [8, 28.8, 6, 2.2] }, fill: 'g', shade: { light: 'o', dir: 'n', mode: 'band', amount: 0.4 } },
    { shape: { rect: [7.6, 29.5, 0.8, 3] }, fill: 'g' },
    { shape: { ellipse: [30, 29, 7, 2.3] }, fill: 'g', shade: { light: 'o', dir: 'n', mode: 'band', amount: 0.4 } },
    { shape: { ellipse: [52, 28.6, 6, 2.2] }, fill: 'g', shade: { light: 'o', dir: 'n', mode: 'band', amount: 0.4 } },
    { shape: { ellipse: [88, 29, 7, 2.3] }, fill: 'g', shade: { light: 'o', dir: 'n', mode: 'band', amount: 0.4 } },
    { shape: { rect: [0, 33.5, 100, 2] }, fill: 'b' },
    // The pink lake: lighter far away, deeper near, streaks of reflected sky.
    { name: 'lake', shape: { rect: [0, 35, 100, 40] }, fill: { gradient: ['q', 'r', 'm'], from: [0, 37], to: [0, 82], soft: 0.6 } },
    { shape: { ellipse: [22, 40, 22, 0.9] }, fill: 'a' },
    { shape: { ellipse: [72, 43, 26, 1.0] }, fill: 'a' },
    { shape: { ellipse: [40, 50, 24, 1.1] }, fill: 'q', min: 44 },
    { shape: { ellipse: [86, 54, 16, 1.1] }, fill: 'a' },
    { shape: { ellipse: [14, 61, 18, 1.2] }, fill: 'a', min: 40 },
    { shape: { ellipse: [64, 70, 30, 1.3] }, fill: 'q' },
    // A distant flock wading near the far shore.
    ...[[6, 38.5], [11, 37.8], [15.5, 38.8], [44, 38.2], [49, 37.6], [53, 38.6], [88, 38.4], [93, 37.8]].flatMap(([fx, fy]): Layer[] => [
      { shape: { ellipse: [fx!, fy!, 1.9, 0.9] }, fill: 'c', min: 44 },
      { shape: { line: [[fx! + 1.4, fy!], [fx! + 1.6, fy! - 3]], width: 1 }, fill: 'c', min: 44 }
    ]),
    // Salt crust and mud in the foreground corner.
    { name: 'crust', shape: { poly: [[0, 64], [10, 62.5], [22, 65], [30, 69], [34, 75], [0, 75]], smooth: 1 }, fill: 'b', shade: { dark: 't', dir: 'se', width: 2 } },
    { shape: { all: true }, fill: { scatter: 't', density: 0.2, salt: 33 }, clip: 'crust', min: 40 },
    // Three flamingos: two near, one farther away.
    ...flamingo(77, 61, 0.8, 1, 'bird2', true),
    ...flamingo(33, 70, 1.05, 1, 'bird1', true)
  ]
};
