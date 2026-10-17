import type { Motif } from './types';

/** An orange and a golden deciduous tree, a fir between them, red shrubs and fallen leaves. Original pixel art drawn for Worthwhile Play. */
export const autumnForest: Motif = {
  id: 'autumn-forest',
  group: 'season',
  title: {
    de: 'Herbstwald',
    en: 'Autumn forest',
    nl: 'Herfstbos',
    es: 'Bosque en otoño',
    fr: 'Forêt en automne',
    ru: 'Осенний лес',
    'zh-Hans': '秋日森林',
    ko: '가을 숲',
    ja: '秋の森',
    ar: 'غابة في الخريف',
    pt: 'Floresta no outono',
    it: 'Bosco d’autunno',
    pl: 'Jesienny las',
    tr: 'Sonbahar ormanı',
    uk: 'Осінній ліс',
    hi: 'पतझड़ का जंगल'
  },
  place: {
    de: 'Wälder der gemäßigten Breiten in Europa und Nordamerika',
    en: 'Temperate forests of Europe and North America',
    nl: 'Gematigde bossen in Europa en Noord-Amerika',
    es: 'Bosques templados de Europa y Norteamérica',
    fr: 'Forêts tempérées d’Europe et d’Amérique du Nord',
    ru: 'Леса умеренного пояса Европы и Северной Америки',
    'zh-Hans': '欧洲和北美洲的温带森林',
    ko: '유럽과 북아메리카의 온대림',
    ja: 'ヨーロッパと北アメリカの温帯林',
    ar: 'الغابات المعتدلة في أوروبا وأمريكا الشمالية',
    pt: 'Florestas temperadas da Europa e da América do Norte',
    it: 'Foreste temperate d’Europa e del Nord America',
    pl: 'Lasy strefy umiarkowanej w Europie i Ameryce Północnej',
    tr: 'Avrupa ve Kuzey Amerika’nın ılıman ormanları',
    uk: 'Ліси помірного поясу Європи та Північної Америки',
    hi: 'यूरोप और उत्तरी अमेरिका के समशीतोष्ण वन'
  },
  backdrop: '#2b2f3a',
  palette: {
    s: ['#b9dcf0', 'lightBlue'],
    o: ['#e8792b', 'orange'],
    r: ['#c0262d', 'red'],
    y: ['#f2c230', 'gold'],
    b: ['#6b4423', 'brown'],
    d: ['#1f5130', 'darkGreen']
  },
  rows: [
    'ssssssssssssssssssss',
    'sssssssssdssssssssss',
    'sssssssssdsssssyyyss',
    'ssooosssdddssyyyyyss',
    'sooooossdddsyyyyyyys',
    'ooooooodddddyyyyyyys',
    'ooooooosdddsyyyyyyys',
    'ooooooodddddsyyyyyss',
    'sooooosdddddssyyysss',
    'ssooossdddddsssbssss',
    'sssbsssdddddsssbssss',
    'rrrbsssssbsssssbsrrr',
    'rrrbsssssbsssssbrrrr',
    'bbbbbbbbbbbbbbbbbbbb',
    'bbyybbbobbbbrrbbbyyb',
    'bbbbbbbbbbbbbbbbbbbb'
  ]
};
