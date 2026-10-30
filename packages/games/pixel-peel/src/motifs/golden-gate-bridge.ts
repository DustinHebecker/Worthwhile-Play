import type { Motif } from '../art/types';

/** The suspension bridge seen from the headland on its northern side: two orange towers, the sagging main cables, fog drifting in from the ocean and the city in the haze behind. Original vector art drawn for Worthwhile Play. */
export const goldenGateBridge: Motif = {
  id: 'golden-gate-bridge',
  group: 'landmark',
  title: {
    de: 'Golden Gate Bridge',
    en: 'Golden Gate Bridge',
    nl: 'Golden Gate Bridge',
    es: 'Puente Golden Gate',
    fr: 'Pont du Golden Gate',
    ru: 'Мост Золотые Ворота',
    'zh-Hans': '金门大桥',
    ko: '금문교',
    ja: 'ゴールデン・ゲート・ブリッジ',
    ar: 'جسر البوابة الذهبية',
    pt: 'Ponte Golden Gate',
    it: 'Golden Gate Bridge',
    pl: 'Most Golden Gate',
    tr: 'Golden Gate Köprüsü',
    uk: 'Міст Золоті Ворота',
    hi: 'गोल्डन गेट ब्रिज'
  },
  place: {
    de: 'San Francisco, Kalifornien, USA',
    en: 'San Francisco, California, United States',
    nl: 'San Francisco, Californië, Verenigde Staten',
    es: 'San Francisco, California, Estados Unidos',
    fr: 'San Francisco, Californie, États-Unis',
    ru: 'Сан-Франциско, Калифорния, США',
    'zh-Hans': '美国加利福尼亚州旧金山',
    ko: '미국 캘리포니아주 샌프란시스코',
    ja: 'アメリカ合衆国カリフォルニア州サンフランシスコ',
    ar: 'سان فرانسيسكو، كاليفورنيا، الولايات المتحدة',
    pt: 'São Francisco, Califórnia, Estados Unidos',
    it: 'San Francisco, California, Stati Uniti',
    pl: 'San Francisco, Kalifornia, Stany Zjednoczone',
    tr: 'San Francisco, Kaliforniya, ABD',
    uk: 'Сан-Франциско, Каліфорнія, США',
    hi: 'सैन फ़्रांसिस्को, कैलिफ़ोर्निया, संयुक्त राज्य अमेरिका'
  },
  aspect: 'panorama',
  backdrop: '#d6c8ec',
  palette: {
    s: ['#78acdb', 'skyBlue', 1],
    l: ['#bcdaf0', 'lightBlue', 2, 's'],
    y: ['#f6e3b4', 'lightYellow', 3, 'w'],
    w: ['#f7f8f9', 'white', 1],
    i: ['#b9b6b4', 'lightGrey', 2, 'w'],
    g: ['#868e9a', 'grey', 1],
    r: ['#c63b2a', 'red', 1],
    a: ['#ec7a4c', 'coral', 2, 'r'],
    x: ['#73211e', 'maroon', 1],
    t: ['#3a8f9a', 'teal', 1],
    b: ['#2d64a0', 'blue', 1],
    n: ['#163659', 'navy', 1],
    h: ['#c99a44', 'ochre', 1],
    e: ['#5a7f38', 'green', 1],
    d: ['#2c4a2b', 'darkGreen', 2, 'e']
  },
  layers: [
    // Late-afternoon sky, hazy and warm towards the horizon, with a few high clouds.
    { shape: { rect: [0, 0, 100, 32] }, fill: { gradient: ['s', 's', 'l', 'y'], from: [0, 0], to: [0, 30], soft: 0.6 } },
    { shape: { ellipse: [58, 6, 12, 1.6] }, fill: 'w', shade: { dark: 'l', dir: 'n', mode: 'band', amount: 0.4 } },
    { shape: { ellipse: [88, 10, 9, 1.4] }, fill: 'w', min: 56 },
    // The city across the strait: hills and towers in the haze, low fog in front.
    { shape: { poly: [[66, 30], [76, 26], [86, 24.5], [100, 25.5], [100, 31], [66, 31]], smooth: 1 }, fill: 'i' },
    { shape: { rect: [76, 24.5, 3.4, 6] }, fill: 'g' },
    { shape: { rect: [80, 22, 2.4, 8] }, fill: 'g' },
    { shape: { rect: [83, 24, 3, 6] }, fill: 'g' },
    { shape: { rect: [87, 21, 2.2, 9] }, fill: 'x' },
    { shape: { poly: [[90, 30], [91.2, 19.5], [92.4, 30]] }, fill: 'g' },
    { shape: { rect: [93.5, 23, 3, 7] }, fill: 'x' },
    { shape: { rect: [96.5, 22.5, 3.5, 8] }, fill: 'g' },
    // Water: turquoise near the horizon, deep blue and navy towards the viewer, glints and a wake.
    { name: 'sea', shape: { rect: [0, 29.5, 100, 21] }, fill: { gradient: ['t', 't', 'b', 'n'], from: [0, 31], to: [0, 51], soft: 0.6 } },
    { shape: { line: [[58, 38], [66, 38]], width: 1 }, fill: 'l', min: 56 },
    { shape: { line: [[80, 42], [92, 42]], width: 1 }, fill: 'l', min: 56 },
    { shape: { line: [[40, 45], [52, 46.5]], width: 1 }, fill: 'w', min: 64 },
    // Fog rolling in from the ocean on the left, banking under the far end of the bridge.
    { shape: { poly: [[-2, 32], [8, 26], [20, 25], [30, 27.5], [44, 28.5], [62, 30], [78, 30.5], [96, 31], [100, 33], [60, 34], [30, 34], [0, 35]], smooth: 1 }, fill: 'w', shade: { dark: 'i', dir: 'n', mode: 'band', amount: 0.25 } },
    { shape: { ellipse: [8, 27, 10, 3.4] }, fill: 'w', shade: { dark: 'i', dir: 's', mode: 'band', amount: 0.3 } },
    // Main cables of the side span leaving the frame towards the far anchorage.
    { shape: { line: [[72, 18.6], [80, 22], [90, 24.6], [100, 26.4]], width: 1 }, fill: 'r' },
    // The far tower: smaller in the distance, two legs with portal struts.
    { name: 'far', shape: { poly: [[70.4, 18.2], [73.6, 18.2], [74, 34.6], [70, 34.6]] }, fill: 'r', shade: { dark: 'x', dir: 'w', mode: 'band', amount: 0.35 } },
    { shape: { rect: [71.3, 20, 1.4, 1.4] }, fill: 's', clip: 'far', min: 56 },
    { shape: { rect: [71.3, 23, 1.4, 1.6] }, fill: 's', clip: 'far', min: 56 },
    { shape: { rect: [71.3, 26.2, 1.4, 1.6] }, fill: 'l', clip: 'far', min: 64 },
    // The deck, rising slightly towards the far tower; the truss below in shadow.
    { shape: { poly: [[-2, 30.4], [27, 31.2], [72, 28.8], [100, 27.6], [100, 29.2], [72, 30.2], [27, 33.6], [-2, 33]] }, fill: 'r', shade: { dark: 'x', dir: 'n', mode: 'band', amount: 0.5 } },
    { shape: { line: [[-2, 30.2], [27, 31], [72, 28.7], [100, 27.5]], width: 1 }, fill: 'a', min: 56 },
    // The main span cables and suspenders.
    { shape: { line: [[29, 4.4], [36, 14], [44, 21.5], [52, 26], [60, 27.6], [66, 26], [72, 18.6]], width: 1 }, fill: 'r' },
    { shape: { line: [[22.4, 4.4], [32, 15], [42, 22.6], [52, 27], [60, 28.3], [66, 27], [70.8, 19]], width: 1 }, fill: 'x', min: 56 },
    { shape: { line: [[34, 11.5], [34, 31.4]], width: 1 }, fill: 'r', min: 56 },
    { shape: { line: [[39, 17.3], [39, 31.2]], width: 1 }, fill: 'r', min: 56 },
    { shape: { line: [[44, 21.5], [44, 30.9]], width: 1 }, fill: 'r', min: 64 },
    { shape: { line: [[49, 24.6], [49, 30.6]], width: 1 }, fill: 'r', min: 64 },
    { shape: { line: [[54, 26.6], [54, 30.3]], width: 1 }, fill: 'r', min: 64 },
    // The side span cable towards the near anchorage, leaving the frame on the left.
    { shape: { line: [[23, 4.4], [14, 14], [6, 22], [-1, 27.4]], width: 1 }, fill: 'r' },
    { shape: { line: [[26.5, 4.4], [18, 14.5], [10, 22.5], [2, 28.6]], width: 1 }, fill: 'x', min: 56 },
    // The near tower: two tapering legs with art-deco portal struts, sunlit on the left.
    { name: 'near', shape: { poly: [[21.8, 3], [30.2, 3], [31.4, 46], [20.6, 46]] }, fill: 'r', shade: { light: 'a', dir: 'w', mode: 'band', amount: 0.2 } },
    { shape: { poly: [[27, 3], [30.2, 3], [31.4, 46], [28, 46]] }, fill: 'x', clip: 'near', min: 56 },
    { shape: { rect: [24.6, 6.2, 2.8, 3.6] }, fill: 's', clip: 'near' },
    { shape: { rect: [24.6, 12.2, 2.8, 5.4] }, fill: 's', clip: 'near' },
    { shape: { rect: [24.6, 20, 2.8, 6] }, fill: 'l', clip: 'near' },
    { shape: { rect: [24.4, 35, 3.2, 8] }, fill: 'b', clip: 'near' },
    { shape: { line: [[21, 3.2], [31, 3.2]], width: 1 }, fill: 'x' },
    { shape: { rect: [19.8, 44.5, 12.4, 3] }, fill: 'g', shade: { light: 'i', dark: 'x', dir: 'w', mode: 'band', amount: 0.3 } },
    // Fog wisps crossing the tower legs below the deck.
    { shape: { ellipse: [16, 37, 9, 1.8] }, fill: 'w', shade: { dark: 'i', dir: 'n', mode: 'band', amount: 0.3 } },
    { shape: { ellipse: [44, 35.2, 12, 1.5] }, fill: 'i', min: 56 },
    // The headland in the foreground: dry golden grass and dark scrub, sunlit edges.
    { name: 'head', shape: { poly: [[-2, 41], [6, 39], [12, 40.5], [18, 44], [24, 48], [28, 51], [-2, 51]], smooth: 1 }, fill: 'h', shade: { light: 'y', dir: 'nw' } },
    { shape: { poly: [[0, 46], [6, 44.5], [12, 46.5], [16, 51], [0, 51]], smooth: 1 }, fill: 'e', clip: 'head' },
    { shape: { ellipse: [8, 42.8, 3.6, 1.6] }, fill: 'd', clip: 'head' },
    { shape: { ellipse: [3, 41.6, 3, 1.4] }, fill: 'd', clip: 'head' },
    { shape: { ellipse: [14, 48.5, 4, 1.8] }, fill: 'd', clip: 'head' },
    { shape: { ellipse: [94, 47.5, 4, 1.6] }, fill: 'd' },
    { shape: { all: true }, fill: { scatter: 'd', density: 0.12, salt: 8 }, clip: 'head', min: 56 },
    { name: 'right', shape: { poly: [[84, 51], [90, 46.5], [96, 45], [102, 45.5], [102, 51]], smooth: 1 }, fill: 'e', shade: { light: 'h', dir: 'nw' } },
    { shape: { all: true }, fill: { scatter: 'd', density: 0.15, salt: 12 }, clip: 'right', min: 56 }
  ]
};
