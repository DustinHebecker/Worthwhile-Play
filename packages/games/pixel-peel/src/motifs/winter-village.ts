import type { Motif } from './types';

/** Two snowy houses with lit windows, firs, a mountain and the moon. Original pixel art drawn for Worthwhile Play. */
export const winterVillage: Motif = {
  id: 'winter-village',
  group: 'season',
  title: {
    de: 'Winterdorf',
    en: 'Winter village',
    nl: 'Winterdorp',
    es: 'Pueblo en invierno',
    fr: 'Village en hiver',
    ru: 'Зимняя деревня',
    'zh-Hans': '冬日村庄',
    ko: '겨울 마을',
    ja: '冬の村',
    ar: 'قرية في الشتاء',
    pt: 'Aldeia no inverno',
    it: 'Villaggio d’inverno',
    pl: 'Zimowa wioska',
    tr: 'Kış köyü',
    uk: 'Зимове село',
    hi: 'सर्दियों का गाँव'
  },
  place: {
    de: 'Ein Bergdorf im Winter',
    en: 'A mountain village in winter',
    nl: 'Een bergdorp in de winter',
    es: 'Un pueblo de montaña en invierno',
    fr: 'Un village de montagne en hiver',
    ru: 'Горная деревня зимой',
    'zh-Hans': '冬天的山村',
    ko: '겨울의 산골 마을',
    ja: '冬の山あいの村',
    ar: 'قرية جبلية في الشتاء',
    pt: 'Uma aldeia de montanha no inverno',
    it: 'Un villaggio di montagna d’inverno',
    pl: 'Górska wioska zimą',
    tr: 'Kışın bir dağ köyü',
    uk: 'Гірське село взимку',
    hi: 'सर्दियों में एक पहाड़ी गाँव'
  },
  backdrop: '#c9b28a',
  palette: {
    n: ['#1d2b55', 'navy'],
    w: ['#f4f6f8', 'white'],
    b: ['#7a4b2a', 'brown'],
    y: ['#f5cf47', 'yellow'],
    d: ['#2b5d3a', 'darkGreen'],
    g: ['#8a909a', 'grey']
  },
  rows: [
    'nnnnnnnnnnnnnnnnnnnn',
    'nnnnnnnnnnnnnnnyynnn',
    'nnnnnnnnnnnnnnnyynnn',
    'nnnnnnggnnnnnnnnnnnn',
    'nnnnnggggnnnnnnnnnnn',
    'nnnnggggggnnnwngnnnn',
    'nnnggwgggggnwwwgnnwn',
    'nwggwwwggggwwwwwnndn',
    'ndgwwwwwggwwwwwwwddd',
    'dddbbbbbgggbbbbbggdg',
    'gdgbybybgggbybybgddd',
    'dddbybybgggbybybgddd',
    'gbgbbbbbgggbbbbbggbg',
    'wwwwwwwwwwwwwwwwwwww',
    'wwwwwwwwwwwwwwwwwwww',
    'wwwwwwwwwwwwwwwwwwww'
  ]
};
