import type { Motif } from './types';

/** An African savanna elephant in profile. Original pixel art drawn for Worthwhile Play. */
export const elephant: Motif = {
  id: 'elephant',
  group: 'animal',
  title: {
    de: 'Afrikanischer Elefant',
    en: 'African elephant',
    nl: 'Afrikaanse olifant',
    es: 'Elefante africano',
    fr: 'Éléphant d’Afrique',
    ru: 'Африканский слон',
    'zh-Hans': '非洲象',
    ko: '아프리카코끼리',
    ja: 'アフリカゾウ',
    ar: 'الفيل الأفريقي',
    pt: 'Elefante-africano',
    it: 'Elefante africano',
    pl: 'Słoń afrykański',
    tr: 'Afrika fili',
    uk: 'Африканський слон',
    hi: 'अफ़्रीकी हाथी'
  },
  place: {
    de: 'Afrika südlich der Sahara',
    en: 'Africa, south of the Sahara',
    nl: 'Afrika ten zuiden van de Sahara',
    es: 'África al sur del Sáhara',
    fr: 'Afrique au sud du Sahara',
    ru: 'Африка к югу от Сахары',
    'zh-Hans': '撒哈拉以南非洲',
    ko: '사하라 이남 아프리카',
    ja: 'サハラ以南のアフリカ',
    ar: 'أفريقيا جنوب الصحراء الكبرى',
    pt: 'África ao sul do Saara',
    it: 'Africa a sud del Sahara',
    pl: 'Afryka na południe od Sahary',
    tr: 'Sahra’nın güneyindeki Afrika',
    uk: 'Африка на південь від Сахари',
    hi: 'सहारा के दक्षिण का अफ़्रीका'
  },
  backdrop: '#b9d9ea',
  palette: {
    g: ['#8e9499', 'grey'],
    d: ['#4f555b', 'darkGrey'],
    w: ['#f3ead2', 'cream'],
    t: ['#c9a46a', 'tan']
  },
  rows: [
    '................',
    '................',
    '...gggg.........',
    '..gggggdddgggg..',
    '..gdggdddddggggg',
    '.ggggddddddggggg',
    '.ggggddddddggggg',
    '.gggggddddgggggg',
    '.gg.wwgddggggggg',
    '.gg.wwgggggggggg',
    '.gg..gggggggggg.',
    '.gg..gg.gg.gg.gg',
    '..g..gg.gg.gg.gg',
    '..gg.gg.gg.gg.gg',
    'tttttttttttttttt',
    'tttttttttttttttt'
  ]
};
