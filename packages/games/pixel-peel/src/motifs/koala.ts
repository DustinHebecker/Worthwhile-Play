import type { Motif } from './types';

/** A koala holding a eucalyptus branch. Original pixel art drawn for Worthwhile Play. */
export const koala: Motif = {
  id: 'koala',
  group: 'animal',
  title: {
    de: 'Koala',
    en: 'Koala',
    nl: 'Koala',
    es: 'Koala',
    fr: 'Koala',
    ru: 'Коала',
    'zh-Hans': '考拉',
    ko: '코알라',
    ja: 'コアラ',
    ar: 'الكوالا',
    pt: 'Coala',
    it: 'Koala',
    pl: 'Koala',
    tr: 'Koala',
    uk: 'Коала',
    hi: 'कोआला'
  },
  place: {
    de: 'Ostaustralien',
    en: 'Eastern Australia',
    nl: 'Oost-Australië',
    es: 'Este de Australia',
    fr: 'Est de l’Australie',
    ru: 'Восточная Австралия',
    'zh-Hans': '澳大利亚东部',
    ko: '오스트레일리아 동부',
    ja: 'オーストラリア東部',
    ar: 'شرق أستراليا',
    pt: 'Leste da Austrália',
    it: 'Australia orientale',
    pl: 'Wschodnia Australia',
    tr: 'Doğu Avustralya',
    uk: 'Східна Австралія',
    hi: 'पूर्वी ऑस्ट्रेलिया'
  },
  backdrop: '#f3e3b5',
  palette: {
    g: ['#8f9aa3', 'grey'],
    w: ['#f7f7f2', 'white'],
    k: ['#1d1d1d', 'black'],
    e: ['#4f9a4a', 'green'],
    b: ['#6e4a2c', 'brown']
  },
  rows: [
    '................',
    '.ggg........ggg.',
    'gwwgg......ggwwg',
    'gwwggggggggggwwg',
    'gwggggggggggggwg',
    '.gggggggggggggg.',
    '..gkggggggggkg..',
    '..ggggkkkkgggg..',
    '..gggkkkkkkggg..',
    'e..ggkkkkkkgg...',
    'ee.gggggggggg...',
    '.bbggwwwwwwggg..',
    '..bbbbbbwwwwgg..',
    '..ggwwbbbbbbgg..',
    '..ggwwwwwwbbbe..',
    '...gggggggggee..'
  ]
};
