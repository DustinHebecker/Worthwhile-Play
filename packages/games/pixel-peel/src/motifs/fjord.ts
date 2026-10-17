import type { Motif } from './types';

/** Steep walls with snow caps and a waterfall, a distant peak, and a red boathouse. Original pixel art drawn for Worthwhile Play. */
export const fjord: Motif = {
  id: 'fjord',
  group: 'landscape',
  title: {
    de: 'Fjord',
    en: 'Fjord',
    nl: 'Fjord',
    es: 'Fiordo',
    fr: 'Fjord',
    ru: 'Фьорд',
    'zh-Hans': '峡湾',
    ko: '피오르',
    ja: 'フィヨルド',
    ar: 'مضيق بحري (فيورد)',
    pt: 'Fiorde',
    it: 'Fiordo',
    pl: 'Fiord',
    tr: 'Fiyort',
    uk: 'Фіорд',
    hi: 'फ़्योर्ड'
  },
  place: {
    de: 'Westnorwegen',
    en: 'Western Norway',
    nl: 'West-Noorwegen',
    es: 'Oeste de Noruega',
    fr: 'Ouest de la Norvège',
    ru: 'Западная Норвегия',
    'zh-Hans': '挪威西部',
    ko: '노르웨이 서부',
    ja: 'ノルウェー西部',
    ar: 'غرب النرويج',
    pt: 'Oeste da Noruega',
    it: 'Norvegia occidentale',
    pl: 'Zachodnia Norwegia',
    tr: 'Batı Norveç',
    uk: 'Західна Норвегія',
    hi: 'पश्चिमी नॉर्वे'
  },
  backdrop: '#c9b28a',
  palette: {
    s: ['#9fd0f0', 'lightBlue'],
    w: ['#ffffff', 'white'],
    d: ['#24543a', 'darkGreen'],
    g: ['#6fb352', 'green'],
    b: ['#2f6fb3', 'blue'],
    r: ['#c8322b', 'red']
  },
  rows: [
    'ssssssssssssssswssss',
    'sssswssssssssswwwsss',
    'ssswwwssssssswwwwwss',
    'ssdwdwdssswsddddddds',
    'sdddddwdswwwdddddddd',
    'ddddddwdwwwwdddddddd',
    'ddddddwdwwwwdddddddd',
    'ddddddwdbbbbdddddddd',
    'ddddddwdbbbbdddddddd',
    'dddddddbbbbbbddddddd',
    'gggdddbbbbbbbbdrdggg',
    'gggddbbbbbbbbbrrrggg',
    'ggggbbbbbbbbbbrrrggg',
    'gggbbbbbbbbbbbbbbggg',
    'ggbbbbbbbbbbbbbbbbgg',
    'gbbbbbbbbbbbbbbbbbbg'
  ]
};
