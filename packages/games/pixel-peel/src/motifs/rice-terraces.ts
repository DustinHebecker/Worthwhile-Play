import type { Motif } from './types';

/** Curved terraces, some flooded, with a hut on stilts. Original pixel art drawn for Worthwhile Play. */
export const riceTerraces: Motif = {
  id: 'rice-terraces',
  group: 'landscape',
  title: {
    de: 'Reisterrassen',
    en: 'Rice terraces',
    nl: 'Rijstterrassen',
    es: 'Terrazas de arroz',
    fr: 'Rizières en terrasses',
    ru: 'Рисовые террасы',
    'zh-Hans': '梯田',
    ko: '계단식 논',
    ja: '棚田',
    ar: 'مدرجات الأرز',
    pt: 'Socalcos de arroz',
    it: 'Terrazze di riso',
    pl: 'Tarasy ryżowe',
    tr: 'Pirinç terasları',
    uk: 'Рисові тераси',
    hi: 'धान के सीढ़ीदार खेत'
  },
  place: {
    de: 'Südost- und Ostasien',
    en: 'South-East and East Asia',
    nl: 'Zuidoost- en Oost-Azië',
    es: 'Sudeste y este de Asia',
    fr: 'Asie du Sud-Est et de l’Est',
    ru: 'Юго-Восточная и Восточная Азия',
    'zh-Hans': '东南亚和东亚',
    ko: '동남아시아와 동아시아',
    ja: '東南アジアと東アジア',
    ar: 'جنوب شرق آسيا وشرقها',
    pt: 'Sudeste e Leste da Ásia',
    it: 'Asia sudorientale e orientale',
    pl: 'Azja Południowo-Wschodnia i Wschodnia',
    tr: 'Güneydoğu ve Doğu Asya',
    uk: 'Південно-Східна та Східна Азія',
    hi: 'दक्षिण-पूर्व और पूर्वी एशिया'
  },
  backdrop: '#3a2f4a',
  palette: {
    s: ['#bfe2f5', 'lightBlue'],
    l: ['#b6e07a', 'lightGreen'],
    g: ['#5fa73f', 'green'],
    d: ['#285e2e', 'darkGreen'],
    t: ['#2a9d9a', 'teal'],
    b: ['#7a4b2a', 'brown']
  },
  rows: [
    'ssssssssssssssssssss',
    'ssssssssssssssssssss',
    'ssssssssssssssssbsss',
    'ssddddsssssssssbbbss',
    'sdddddddsssdddbbbbbs',
    'dddddddddddddddbbbdd',
    'ltttggddddddddgbtbtl',
    'llttttggggggggttttll',
    'glllttttttttttttlllg',
    'ggllllttttttttllllgg',
    'lgggllllllllllllgggl',
    'llggggllllllllggggll',
    'tlllgggggggggggglllt',
    'ttllllgggggggglllltt',
    'gtttlllllllllllltttg',
    'ggttttllllllllttttgg'
  ]
};
