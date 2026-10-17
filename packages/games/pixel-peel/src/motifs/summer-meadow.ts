import type { Motif } from './types';

/** Sun, a cloud, hedgerows, poppies and daisies. Original pixel art drawn for Worthwhile Play. */
export const summerMeadow: Motif = {
  id: 'summer-meadow',
  group: 'season',
  title: {
    de: 'Sommerwiese',
    en: 'Summer meadow',
    nl: 'Zomerweide',
    es: 'Prado de verano',
    fr: 'Prairie d’été',
    ru: 'Летний луг',
    'zh-Hans': '夏日草地',
    ko: '여름 들판',
    ja: '夏の草原',
    ar: 'مرج صيفي',
    pt: 'Prado de verão',
    it: 'Prato d’estate',
    pl: 'Letnia łąka',
    tr: 'Yaz çayırı',
    uk: 'Літній луг',
    hi: 'गर्मियों का घास का मैदान'
  },
  place: {
    de: 'Mitteleuropa',
    en: 'Central Europe',
    nl: 'Centraal-Europa',
    es: 'Europa Central',
    fr: 'Europe centrale',
    ru: 'Центральная Европа',
    'zh-Hans': '中欧',
    ko: '중부 유럽',
    ja: '中央ヨーロッパ',
    ar: 'أوروبا الوسطى',
    pt: 'Europa Central',
    it: 'Europa centrale',
    pl: 'Europa Środkowa',
    tr: 'Orta Avrupa',
    uk: 'Центральна Європа',
    hi: 'मध्य यूरोप'
  },
  backdrop: '#2b2f3a',
  palette: {
    s: ['#a9d6f5', 'lightBlue'],
    y: ['#f7d33c', 'yellow'],
    w: ['#ffffff', 'white'],
    g: ['#7cc04a', 'green'],
    d: ['#2f6b2a', 'darkGreen'],
    r: ['#d8322a', 'red']
  },
  rows: [
    'ssssssssssssssssssss',
    'ssssssssssssssyyysss',
    'sssswwsssssssyyyyyss',
    'ssswwwwwsssssyyyyyss',
    'sswwwwwwwssssyyyyyss',
    'ssssssssssssssyyysss',
    'ssssssssssssssssssss',
    'dddsssssssssddddssss',
    'ddddddssssddddddddds',
    'gggdddddddddgggddddd',
    'gggggggggggggggggggg',
    'ggrrgggggwgggggrrggg',
    'grrrrgggwywgggrrrrgg',
    'ggrrggdggwggggwrrggg',
    'gggdgggggrrggwywgdgg',
    'gggdggggrrrrggwggdgg'
  ]
};
