import type { Motif } from './types';

/** A llama in profile with a woven saddle blanket. Original pixel art drawn for Worthwhile Play. */
export const llama: Motif = {
  id: 'llama',
  group: 'animal',
  title: {
    de: 'Lama',
    en: 'Llama',
    nl: 'Lama',
    es: 'Llama',
    fr: 'Lama',
    ru: 'Лама',
    'zh-Hans': '美洲驼',
    ko: '라마',
    ja: 'リャマ',
    ar: 'اللاما',
    pt: 'Lhama',
    it: 'Lama',
    pl: 'Lama',
    tr: 'Lama',
    uk: 'Лама',
    hi: 'लामा'
  },
  place: {
    de: 'Die Anden, Südamerika',
    en: 'The Andes, South America',
    nl: 'De Andes, Zuid-Amerika',
    es: 'Los Andes, Sudamérica',
    fr: 'Les Andes, Amérique du Sud',
    ru: 'Анды, Южная Америка',
    'zh-Hans': '南美洲安第斯山脉',
    ko: '남아메리카 안데스산맥',
    ja: '南アメリカのアンデス山脈',
    ar: 'جبال الأنديز، أمريكا الجنوبية',
    pt: 'Os Andes, América do Sul',
    it: 'Le Ande, America del Sud',
    pl: 'Andy, Ameryka Południowa',
    tr: 'And Dağları, Güney Amerika',
    uk: 'Анди, Південна Америка',
    hi: 'एंडीज़, दक्षिण अमेरिका'
  },
  backdrop: '#a8cbe0',
  palette: {
    c: ['#f4ead8', 'cream'],
    b: ['#7a5230', 'brown'],
    k: ['#3b2616', 'darkBrown'],
    r: ['#c3352b', 'red'],
    t: ['#1f8f8a', 'teal']
  },
  rows: [
    '..k.k...........',
    '..kck...........',
    '.cckc...........',
    'ccccc...........',
    'cc.ccc..........',
    '...ccc..........',
    '...ccc..........',
    '...ccc.........c',
    '...cccrrrrrrcccc',
    '...ccrtrtrtrccc.',
    '...ccrrrrrrrccc.',
    '...cctttttttccc.',
    '....cc.....cc...',
    '....cc.....cc...',
    '....bb.....bb...',
    '....kk.....kk...'
  ]
};
