import type { Motif } from '../art/types';

/** The wide view east along Yosemite Valley on a misty morning: the pale wall of El Capitan on the left, the shaded Cathedral Rocks with Bridalveil Fall on the right, a small hazy Half Dome far away at the end of the valley, bands of mist over the dark forest and a tall pine framing the view. Original vector art drawn for Worthwhile Play. */
export const yosemiteTunnelView: Motif = {
  id: 'yosemite-tunnel-view',
  group: 'landmark',
  title: {
    de: 'Yosemite-Tal vom Tunnel View',
    en: 'Yosemite from Tunnel View',
    nl: 'Yosemite vanaf Tunnel View',
    es: 'Yosemite desde Tunnel View',
    fr: 'Yosemite depuis Tunnel View',
    ru: 'Йосемити с Tunnel View',
    'zh-Hans': '从隧道观景点眺望优胜美地',
    ko: '터널 뷰에서 본 요세미티',
    ja: 'トンネルビューから見たヨセミテ',
    ar: 'يوسمايت من مطل تانل فيو',
    pt: 'Yosemite vista do Tunnel View',
    it: 'Yosemite da Tunnel View',
    pl: 'Yosemite z Tunnel View',
    tr: "Tunnel View'dan Yosemite",
    uk: 'Йосеміті з Tunnel View',
    hi: 'टनल व्यू से योसेमिटी'
  },
  place: {
    de: 'Yosemite-Nationalpark, Kalifornien, USA',
    en: 'Yosemite National Park, California, United States',
    nl: 'Yosemite National Park, Californië, Verenigde Staten',
    es: 'Parque nacional de Yosemite, California, Estados Unidos',
    fr: 'Parc national de Yosemite, Californie, États-Unis',
    ru: 'Йосемитский национальный парк, Калифорния, США',
    'zh-Hans': '美国加利福尼亚州优胜美地国家公园',
    ko: '미국 캘리포니아주 요세미티 국립공원',
    ja: 'アメリカ合衆国カリフォルニア州、ヨセミテ国立公園',
    ar: 'منتزه يوسمايت الوطني، كاليفورنيا، الولايات المتحدة',
    pt: 'Parque Nacional de Yosemite, Califórnia, Estados Unidos',
    it: 'Parco nazionale di Yosemite, California, Stati Uniti',
    pl: 'Park Narodowy Yosemite, Kalifornia, Stany Zjednoczone',
    tr: 'Yosemite Ulusal Parkı, Kaliforniya, ABD',
    uk: 'Національний парк Йосеміті, Каліфорнія, США',
    hi: 'योसेमिटी राष्ट्रीय उद्यान, कैलिफ़ोर्निया, संयुक्त राज्य अमेरिका'
  },
  aspect: 'panorama',
  backdrop: '#f0b6cf',
  palette: {
    b: ['#3c70b6', 'blue', 1],
    s: ['#7cb4e2', 'skyBlue', 1],
    l: ['#c6e0f3', 'lightBlue', 2, 's'],
    w: ['#f7f8f6', 'white', 1],
    a: ['#968cc0', 'lavender', 1],
    i: ['#c6c1b6', 'lightGrey', 1],
    y: ['#ecdcb4', 'beige', 2, 'i'],
    g: ['#8f8d89', 'grey', 1],
    k: ['#53565f', 'darkGrey', 1],
    h: ['#4b8783', 'teal', 1],
    u: ['#2a5856', 'darkTeal', 2, 'd'],
    e: ['#4f8c40', 'green', 1],
    m: ['#8dbb6a', 'lightGreen', 3, 'e'],
    d: ['#21432d', 'darkGreen', 1],
    c: ['#151c1b', 'charcoal', 1],
    n: ['#6e4a2e', 'brown', 2, 'k']
  },
  layers: [
    // A big morning sky, deep blue overhead, paler towards the valley, with wispy cirrus streaks.
    { shape: { rect: [0, 0, 100, 34] }, fill: { gradient: ['b', 's', 's', 'l'], from: [0, 0], to: [0, 26], soft: 0.4 } },
    { shape: { line: [[44, 7], [56, 4.6], [70, 3.4]], width: 1 }, fill: 'w' },
    { shape: { line: [[62, 9], [76, 6.6], [90, 6]], width: 1 }, fill: 'w' },
    { shape: { line: [[50, 11], [60, 9.6]], width: 1 }, fill: 'l', min: 56 },
    { shape: { line: [[74, 2], [86, 1.4], [96, 2]], width: 1 }, fill: 'l', min: 56 },
    { shape: { line: [[40, 3], [48, 1.8]], width: 1 }, fill: 'l', min: 64 },
    { shape: { rect: [0, 30, 100, 21] }, fill: 'd' },
    // Far ridges at the head of the valley in blue haze, and Half Dome, small and pale in the distance.
    { shape: { poly: [[40, 30], [44, 25], [50, 24], [58, 23.4], [64, 21.8], [70, 22.4], [74, 25], [76, 30]], smooth: 1 }, fill: 'a', shade: { light: 'l', dir: 'ne' } },
    { name: 'dome', shape: { poly: [[50.6, 25], [50.6, 18], [51.2, 16.6], [52.6, 15.8], [54.4, 15.8], [56.4, 16.6], [58.4, 18.4], [60.2, 21], [61.4, 25]], smooth: 1 }, fill: 'i', shade: { dark: 'a', dir: 'ne', mode: 'band', amount: 0.35 } },
    { shape: { line: [[51.2, 16], [51.4, 25]], width: 1 }, fill: 'g', clip: 'dome', min: 56 },
    // The far valley walls in haze on both sides.
    { shape: { poly: [[36, 32], [40, 26], [44, 25], [48, 27], [48, 32]], smooth: 1 }, fill: 'a', shade: { dark: 'g', dir: 'ne', width: 1 } },
    { shape: { poly: [[62, 32], [64, 26], [67, 22.5], [70, 21], [72, 32]], smooth: 1 }, fill: 'g', shade: { light: 'a', dir: 'ne', width: 1 } },
    // Cathedral Rocks on the right: dark, shaded cliffs with forest on the ledges and the Cathedral Spires.
    { name: 'cath', shape: { poly: [[64, 40], [66, 32], [69, 25], [72, 19], [75, 15], [78, 13], [80, 10.6], [83, 10], [86, 8.6], [90, 7.4], [95, 7], [102, 6.4], [102, 44], [64, 44]], smooth: 1 }, fill: 'k', shade: { light: 'g', dir: 'ne', width: 2 } },
    { shape: { poly: [[73.4, 18], [74.2, 12.6], [75, 18]] }, fill: 'k', min: 56 },
    { shape: { poly: [[76, 15], [76.8, 10.4], [77.6, 14]] }, fill: 'k', min: 56 },
    { shape: { poly: [[66, 34], [70, 30], [74, 31], [72, 38], [66, 42]], smooth: 1 }, fill: 'u', clip: 'cath' },
    { shape: { poly: [[84, 20], [90, 15], [96, 13], [102, 12], [102, 18], [94, 20], [88, 23]], smooth: 1 }, fill: 'd', clip: 'cath' },
    { shape: { poly: [[86, 30], [92, 25], [102, 23], [102, 44], [86, 44]], smooth: 1 }, fill: 'd', clip: 'cath' },
    { shape: { line: [[78, 16], [77, 24]], width: 1 }, fill: 'g', clip: 'cath', min: 64 },
    // Bridalveil Fall: a white ribbon from its hanging valley, mist where it lands.
    { shape: { line: [[81.4, 19], [81.8, 26], [82.4, 33]], width: 1.4 }, fill: 'w' },
    { shape: { ellipse: [82.4, 34, 3.4, 1.6] }, fill: 'l' },
    // El Capitan: a huge pale granite wall rising on the left, its sheer face lit from the east, trees on its crown.
    { name: 'cap', shape: { poly: [[-2, 18], [4, 14], [10, 10.4], [16, 7.6], [22, 6], [28, 5.8], [32, 7], [35.4, 9.6], [37.4, 13.6], [38.6, 19], [39.6, 26], [41, 33], [42.4, 40], [-2, 40]], smooth: 1 }, fill: { gradient: ['g', 'i', 'i', 'i'], from: [0, 0], to: [36, 0], soft: 0.4 }, shade: { light: 'y', dark: 'g', dir: 'ne', width: 2 } },
    { shape: { line: [[30, 8], [31.4, 20], [32, 32]], width: 1 }, fill: 'g', clip: 'cap', min: 56 },
    { shape: { line: [[24, 9], [24.6, 22]], width: 1 }, fill: 'g', clip: 'cap', min: 64 },
    { shape: { poly: [[33, 14], [37, 14], [38.4, 24], [34.6, 26]], smooth: 1 }, fill: 'y', clip: 'cap', min: 56 },
    { shape: { poly: [[-2, 16], [6, 11], [12, 8], [18, 6.2], [22, 5.6], [20, 8], [14, 10], [8, 13.4], [2, 18], [-2, 20]], smooth: 1 }, fill: 'd' },
    { shape: { poly: [[-2, 26], [8, 24], [16, 26], [24, 30], [32, 34], [40, 40], [-2, 40]], smooth: 1 }, fill: 'd', shade: { light: 'e', dir: 'ne' } },
    // The valley floor: forest receding into the distance, bluer and paler with every band, its foot lost in wisps of morning mist.
    { shape: { poly: [[40, 33], [42, 30.4], [45, 29.8], [48, 30.2], [51, 29.4], [55, 29.8], [59, 29.2], [63, 29.8], [67, 30.6], [70, 33]], smooth: 1 }, fill: { gradient: ['a', 'h'], from: [0, 29.6], to: [0, 32], soft: 0.5 } },
    { shape: { ellipse: [50, 31.8, 7, 0.9] }, fill: 'w' },
    { shape: { ellipse: [61, 31.4, 5, 0.8] }, fill: 'l', min: 56 },
    { name: 'mid', shape: { poly: [[32, 43], [32, 34.8], [33.5, 33.4], [35, 34.8], [36.2, 33.9], [37.4, 34.8], [39.2, 32.8], [41, 34.8], [42.4, 33.7], [43.8, 34.8], [45.4, 33.2], [47, 34.8], [48.5, 33.4], [50, 34.8], [51.2, 33.9], [52.4, 34.8], [54.2, 32.8], [56, 34.8], [57.4, 33.7], [58.8, 34.8], [60.4, 33.2], [62, 34.8], [63.5, 33.4], [65, 34.8], [66.2, 33.9], [67.4, 34.8], [69.2, 32.8], [71, 34.8], [72.4, 33.7], [73.8, 34.8], [75.4, 33.2], [77, 34.8], [78.5, 33.4], [80, 34.8], [80, 34.8], [80, 43]] }, fill: { gradient: ['h', 'h', 'u'], from: [0, 33], to: [0, 39], soft: 0.5 } },
    { shape: { ellipse: [43, 37.2, 7, 0.8] }, fill: 'w' },
    { shape: { ellipse: [64, 36.8, 7, 0.8] }, fill: 'w' },
    { shape: { ellipse: [54, 37.6, 5, 0.7] }, fill: 'l', min: 56 },
    { shape: { ellipse: [75, 38, 5, 0.8] }, fill: 'l', min: 64 },
    // The near forest and the forested slope on the right: dark conifers, a few taller ones catching the light.
    { name: 'near', shape: { poly: [[26, 51], [26, 40.6], [28.2, 38.2], [30.4, 40.6], [32.1, 39], [33.8, 40.6], [36.3, 37.6], [38.8, 40.6], [40.7, 38.6], [42.6, 40.6], [44.7, 37.8], [46.8, 40.6], [48.3, 39.2], [49.8, 40.6], [52, 38.2], [54.2, 40.6], [55.9, 39], [57.6, 40.6], [60.1, 37.6], [62.6, 40.6], [64.5, 38.6], [66.4, 40.5], [68.5, 37.4], [70.6, 39.8], [72.1, 38.1], [73.6, 39.2], [75.8, 36.4], [78, 38.4], [79.7, 36.5], [81.4, 37.8], [83.9, 34.4], [86.4, 36.9], [88.3, 34.6], [90.2, 36.2], [92.3, 33.1], [94.4, 35.5], [95.9, 33.8], [97.4, 34.9], [99.6, 32.2], [101.8, 34.2], [102, 34.1], [102, 51]] }, fill: 'd', shade: { light: 'e', dir: 'ne', width: 1 } },
    { shape: { poly: [[30, 51], [30, 45], [32.5, 42.8], [35, 45], [36.8, 43.6], [38.6, 45], [40.8, 42.4], [43, 45], [44.6, 43.4], [46.2, 45], [48.6, 43], [51, 45], [53.5, 42.8], [56, 45], [57.8, 43.6], [59.6, 45], [61.8, 42.4], [64, 45], [65.6, 43.4], [67.2, 44.8], [69.6, 42.4], [72, 43.9], [74.5, 41.3], [77, 43], [78.8, 41.3], [80.6, 42.4], [82.8, 39.4], [85, 41.6], [86.6, 39.7], [88.2, 41], [90.6, 38.6], [93, 40.1], [95.5, 37.5], [98, 39.2], [99.8, 37.5], [101.6, 38.6], [102, 38.5], [102, 51]] }, fill: 'u', clip: 'near', min: 56 },
    { shape: { poly: [[34, 51], [34, 48.6], [36.3, 46.6], [38.6, 48.6], [40.5, 47.2], [42.4, 48.6], [45, 46.2], [47.6, 48.6], [49.3, 47], [51, 48.6], [53.3, 46.6], [55.6, 48.6], [57.5, 47.2], [59.4, 48.6], [62, 46.2], [64.6, 48.6], [66.3, 46.9], [68, 48.2], [70.3, 45.8], [72.6, 47.4], [74.5, 45.7], [76.4, 46.7], [79, 43.9], [81.6, 45.8], [83.3, 43.9], [85, 45.2], [87.3, 42.8], [89.6, 44.4], [91.5, 42.6], [93.4, 43.7], [96, 40.8], [98.6, 42.7], [100.3, 40.8], [102, 42.1], [102, 42.1], [102, 51]] }, fill: 'd', clip: 'near', shade: { light: 'u', dir: 'ne', width: 1 }, min: 56 },
    { shape: { poly: [[36, 35.8], [37.6, 38.6], [36.9, 38.6], [38.6, 42], [33.4, 42], [35.1, 38.6], [34.4, 38.6]] }, fill: 'e', shade: { light: 'm', dark: 'd', dir: 'ne', width: 1 } },
    { shape: { poly: [[47, 36.4], [48.4, 39.2], [47.8, 39.2], [49.4, 42.6], [44.6, 42.6], [46.2, 39.2], [45.6, 39.2]] }, fill: 'e', shade: { light: 'm', dark: 'd', dir: 'ne', width: 1 }, min: 56 },
    { shape: { poly: [[60, 35.8], [61.7, 38.6], [61, 38.6], [62.8, 42], [57.2, 42], [59, 38.6], [58.3, 38.6]] }, fill: 'e', shade: { light: 'm', dark: 'd', dir: 'ne', width: 1 } },
    { shape: { poly: [[73, 34.8], [74.6, 37.6], [73.9, 37.6], [75.6, 41], [70.4, 41], [72.1, 37.6], [71.4, 37.6]] }, fill: 'e', shade: { light: 'm', dark: 'd', dir: 'ne', width: 1 }, min: 56 },
    { shape: { poly: [[88, 31], [89.8, 34.3], [89, 34.3], [91, 38.4], [85, 38.4], [87, 34.3], [86.2, 34.3]] }, fill: 'e', shade: { light: 'm', dark: 'd', dir: 'ne', width: 1 } },
    // The forested slope below El Capitan on the left.
    { name: 'slope', shape: { poly: [[-2, 30], [6, 31], [14, 34], [22, 37.4], [28, 40], [34, 44], [40, 48], [42, 51], [-2, 51]], smooth: 1 }, fill: { gradient: ['e', 'e', 'd'], from: [0, 32], to: [0, 46], soft: 0.6 } },
    { shape: { rect: [0, 48.4, 100, 2] }, fill: 'c' },
    // The tall pine in the left foreground framing the view, its trunk standing on the slope.
    { shape: { line: [[9, 10], [9, 49]], width: 2.4 }, fill: 'n' },
    { shape: { poly: [[9, 1], [10.7, 7.2], [9.8, 6.2], [12.3, 13.3], [10.5, 12.4], [14, 19.5], [11.2, 18.6], [15.7, 25.7], [12, 24.7], [17.3, 31.8], [12.8, 30.9], [19, 38], [10.5, 38], [7.5, 38], [-1, 38], [5.2, 30.9], [0.7, 31.8], [6, 24.7], [2.3, 25.7], [6.8, 18.6], [4, 19.5], [7.5, 12.4], [5.7, 13.3], [8.2, 6.2], [7.3, 7.2]] }, fill: 'd', shade: { light: 'e', dir: 'ne', width: 1 } },
    { shape: { poly: [[24, 32], [27, 39.6], [25.6, 39], [28.6, 46], [19.4, 46], [22.4, 39], [21, 39.6]] }, fill: 'd', shade: { light: 'e', dir: 'ne', width: 1 } },
    { shape: { line: [[24, 45], [24, 49]], width: 1.4 }, fill: 'n' }
  ]
};
