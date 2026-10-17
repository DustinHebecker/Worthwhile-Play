import type { Motif } from './types';

/** A tiger’s head, front view, with grass below. Original pixel art drawn for Worthwhile Play. */
export const tiger: Motif = {
  id: 'tiger',
  group: 'animal',
  title: {
    de: 'Tiger',
    en: 'Tiger',
    nl: 'Tijger',
    es: 'Tigre',
    fr: 'Tigre',
    ru: 'Тигр',
    'zh-Hans': '老虎',
    ko: '호랑이',
    ja: 'トラ',
    ar: 'النمر',
    pt: 'Tigre',
    it: 'Tigre',
    pl: 'Tygrys',
    tr: 'Kaplan',
    uk: 'Тигр',
    hi: 'बाघ'
  },
  place: {
    de: 'Süd-, Südost- und Ostasien',
    en: 'South, South-East and East Asia',
    nl: 'Zuid-, Zuidoost- en Oost-Azië',
    es: 'Sur, sudeste y este de Asia',
    fr: 'Asie du Sud, du Sud-Est et de l’Est',
    ru: 'Южная, Юго-Восточная и Восточная Азия',
    'zh-Hans': '南亚、东南亚和东亚',
    ko: '남아시아, 동남아시아, 동아시아',
    ja: '南アジア、東南アジア、東アジア',
    ar: 'جنوب آسيا وجنوب شرقها وشرقها',
    pt: 'Sul, Sudeste e Leste da Ásia',
    it: 'Asia meridionale, sudorientale e orientale',
    pl: 'Azja Południowa, Południowo-Wschodnia i Wschodnia',
    tr: 'Güney, Güneydoğu ve Doğu Asya',
    uk: 'Південна, Південно-Східна та Східна Азія',
    hi: 'दक्षिण, दक्षिण-पूर्व और पूर्वी एशिया'
  },
  backdrop: '#a9c6dd',
  palette: {
    o: ['#e47a22', 'orange'],
    k: ['#1b1b1b', 'black'],
    w: ['#fbf7ee', 'white'],
    e: ['#3f8f3a', 'green']
  },
  rows: [
    '................',
    '.oo..........oo.',
    '.oko........oko.',
    '.oooooooooooooo.',
    'okoookkookkoooko',
    'ooooooowwooooooo',
    'okwwoooooooowwko',
    'ookkwoooooowkkoo',
    'oowwwwoooowwwwoo',
    'kooowwwwwwwwoook',
    'ooowwwkkkkwwwooo',
    '.oowwwwkkwwwwoo.',
    '..owwwwwwwwwwo..',
    '...owwwwwwwwo...',
    'eee.oooooooo.eee',
    'eeeeeeeeeeeeeeee'
  ]
};
