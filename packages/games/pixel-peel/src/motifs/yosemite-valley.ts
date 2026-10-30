import type { Motif } from '../art/types';

/** The classic view up the glacier valley: the granite wall of El Capitan on the left, Half Dome with its sheer face in the distance, the ribbon of Bridalveil Fall on the right, forest on the valley floor. Original vector art drawn for Worthwhile Play. */
export const yosemiteValley: Motif = {
  id: 'yosemite-valley',
  group: 'landmark',
  title: {
    de: 'Yosemite Valley',
    en: 'Yosemite Valley',
    nl: 'Yosemite Valley',
    es: 'Valle de Yosemite',
    fr: 'Vallée de Yosemite',
    ru: 'Долина Йосемити',
    'zh-Hans': '优胜美地山谷',
    ko: '요세미티 계곡',
    ja: 'ヨセミテ渓谷',
    ar: 'وادي يوسمايت',
    pt: 'Vale de Yosemite',
    it: 'Valle di Yosemite',
    pl: 'Dolina Yosemite',
    tr: 'Yosemite Vadisi',
    uk: 'Долина Йосеміті',
    hi: 'योसेमिटी घाटी'
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
  aspect: 'wide',
  backdrop: '#f2c4c4',
  palette: {
    b: ['#3a6eb0', 'blue', 1],
    s: ['#6eaedf', 'skyBlue', 1],
    l: ['#bad9f1', 'lightBlue', 2, 's'],
    w: ['#f8f8f5', 'white', 1],
    a: ['#a6a2cc', 'lavender', 1],
    y: ['#f2e1a6', 'lightYellow', 3, 't'],
    t: ['#d2b88c', 'tan', 1],
    i: ['#cbc8c0', 'lightGrey', 3, 'g'],
    g: ['#9a968e', 'grey', 1],
    k: ['#5c5d62', 'darkGrey', 1],
    m: ['#9cc45e', 'lime', 2, 'e'],
    e: ['#4f8a3c', 'green', 1],
    h: ['#3d7d74', 'teal', 2, 'd'],
    d: ['#24472c', 'darkGreen', 1],
    c: ['#18211f', 'charcoal', 1],
    o: ['#c4923f', 'ochre', 2, 't']
  },
  layers: [
    // Afternoon sky with a bank of white clouds over the southern rim.
    { shape: { rect: [0, 0, 100, 50] }, fill: { gradient: ['b', 's', 's', 'l'], from: [0, -4], to: [0, 40], soft: 0.6 } },
    { shape: { ellipse: [80, 9, 16, 5] }, fill: 'w', shade: { dark: 'l', dir: 'n', mode: 'band', amount: 0.35 } },
    { shape: { ellipse: [68, 12, 9, 3.6] }, fill: 'w', shade: { dark: 'l', dir: 'n', mode: 'band', amount: 0.35 } },
    { shape: { ellipse: [92, 6, 9, 3.4] }, fill: 'w' },
    { shape: { ellipse: [30, 5, 8, 1.8] }, fill: 'w', shade: { dark: 'l', dir: 'n', mode: 'band', amount: 0.4 }, min: 40 },
    // Far ridges at the head of the valley, blue in the haze.
    { shape: { rect: [0, 44, 100, 31] }, fill: 'd' },
    { shape: { poly: [[30, 44], [38, 39], [46, 38], [76, 38], [86, 42], [86, 50], [30, 50]], smooth: 1 }, fill: 'a', shade: { light: 'l', dir: 'n' } },
    // Half Dome, centred in the V of the valley: a rounded granite crown, its sheer cut face turned towards the viewer and lit warm by the low sun, the back of the dome in cool shadow.
    { name: 'dome', shape: { poly: [[45.6, 48], [45.6, 18], [46.4, 16.2], [48.6, 15.2], [52, 14.9], [56.4, 15.1], [61, 16.4], [65.4, 18.6], [69.4, 22.6], [72.8, 27.6], [75.6, 33], [77.8, 39], [79, 48]], smooth: 1 }, fill: 'i', shade: { dark: 'a', dir: 'w', mode: 'band', amount: 0.3 } },
    { shape: { poly: [[44, 14], [50.4, 14], [50.4, 25], [50.8, 34], [51.4, 48], [44, 48]] }, fill: 't', clip: 'dome' },
    { shape: { poly: [[44, 14], [48.4, 14], [48.2, 30], [48.6, 48], [44, 48]] }, fill: 'y', clip: 'dome', min: 40 },
    { shape: { line: [[50.8, 16], [51, 32], [51.6, 46]], width: 1 }, fill: 'o', clip: 'dome' },
    { shape: { line: [[47.6, 27], [47.8, 40]], width: 1 }, fill: 'o', clip: 'dome', min: 48 },
    { shape: { line: [[57, 16.6], [62, 24], [65, 36]], width: 1 }, fill: 'g', clip: 'dome', min: 48 },
    // The valley floor far away, forest in blue-green haze.
    { shape: { poly: [[30, 50], [46, 46], [60, 44.5], [74, 45], [88, 46], [88, 60], [30, 60]], smooth: 1 }, fill: 'h', shade: { light: 'a', dir: 'n' } },
    { shape: { rect: [30, 44, 58, 16] }, fill: { scatter: 'd', density: 0.08, salt: 3 }, min: 48 },
    // The southern wall on the right: Cathedral Rocks in shade, forest on the ledges.
    { name: 'south', shape: { poly: [[62, 62], [66, 50], [71, 42], [76, 35], [80, 30], [86, 26], [92, 22.5], [100, 20], [100, 64], [62, 64]], smooth: 1 }, fill: 'k', shade: { light: 'g', dir: 'nw', width: 2 } },
    { shape: { poly: [[84, 27.5], [92, 22.5], [100, 20], [100, 25], [93, 28], [86, 31]], smooth: 1 }, fill: 'd', clip: 'south' },
    { shape: { poly: [[64, 58], [70, 50], [76, 52], [72, 60], [64, 64]], smooth: 1 }, fill: 'd', clip: 'south' },
    { shape: { poly: [[88, 48], [94, 42], [100, 41], [100, 56], [90, 57]], smooth: 1 }, fill: 'd', clip: 'south' },
    { shape: { line: [[74, 40], [73, 48]], width: 1 }, fill: 'g', clip: 'south', min: 40 },
    { shape: { line: [[92, 31], [94, 38]], width: 1 }, fill: 'g', clip: 'south', min: 48 },
    { shape: { all: true }, fill: { scatter: 'e', density: 0.1, salt: 21 }, clip: 'south', min: 48 },
    // Bridalveil Fall: a white ribbon leaping from its hanging valley, mist where it lands.
    { shape: { poly: [[79.4, 31], [81.4, 31], [82.4, 46], [83.4, 56], [80.6, 56], [80, 46]] }, fill: 'w', shade: { dark: 'l', dir: 'w', mode: 'band', amount: 0.3 } },
    { shape: { ellipse: [82, 56.5, 5, 2.4] }, fill: 'l' },
    { shape: { ellipse: [82, 56, 3, 1.4] }, fill: 'w', min: 40 },
    // El Capitan: one massive, smooth granite wall on the left, its face and prow lit by the afternoon sun, trees along the rim.
    { name: 'cap', shape: { poly: [[-2, 9], [8, 9.5], [17, 11], [24, 13.5], [29, 17], [32.5, 22], [34.5, 30], [36, 40], [37.5, 50], [39.5, 62], [-2, 62]], smooth: 1 }, fill: { gradient: ['g', 'g', 'i', 't'], from: [-2, 0], to: [36, 0], soft: 0.3 }, shade: { light: 'y', dark: 'k', dir: 'e', width: 2 } },
    { shape: { line: [[18, 12], [19, 30], [18.4, 48]], width: 1 }, fill: 'g', clip: 'cap', min: 48 },
    { shape: { line: [[8, 11], [7.6, 30]], width: 1 }, fill: 'k', clip: 'cap', min: 48 },
    { shape: { poly: [[-2, 8], [6, 7], [14, 8.5], [22, 11], [28, 14.5], [24, 15], [16, 12.5], [8, 11.5], [-2, 12]], smooth: 1 }, fill: 'd' },
    // The forested valley floor with a sunlit meadow.
    { name: 'floor', shape: { poly: [[-2, 60], [20, 59], [40, 58.5], [60, 60], [80, 59], [102, 61], [102, 70], [-2, 70]], smooth: 1 }, fill: 'e', shade: { light: 'm', dir: 'n', width: 2 } },
    { shape: { poly: [[42, 61], [52, 60.6], [60, 61.4], [62, 63], [50, 63.6], [44, 63]], smooth: 1 }, fill: 'o', clip: 'floor' },
    { shape: { all: true }, fill: { scatter: 'd', density: 0.07, salt: 5 }, clip: 'floor', min: 48 },
    // Dark conifers in the foreground framing the view.
    { name: 'firs', shape: { poly: [[-2, 75], [-2, 62], [3, 56], [6, 63], [10, 58], [14, 65], [18, 61], [22, 67], [30, 68], [40, 68.5], [50, 67.5], [58, 68.5], [66, 67], [72, 62], [76, 66], [80, 60], [84, 65], [88, 58], [92, 64], [96, 59], [102, 63], [102, 75]] }, fill: 'd', shade: { light: 'e', dir: 'nw' } },
    { shape: { poly: [[-2, 75], [-2, 71.5], [20, 71], [44, 72.5], [70, 71.5], [102, 72], [102, 75]], smooth: 1 }, fill: 'c' },
    { shape: { all: true }, fill: { scatter: 'c', density: 0.05, salt: 9 }, clip: 'firs', min: 48 }
  ]
};
