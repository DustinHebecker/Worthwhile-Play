import type { Motif } from './types';

/** A sitting red fox, front view, with its tail around one side. Original pixel art drawn for Worthwhile Play. */
export const redFox: Motif = {
  id: 'red-fox',
  group: 'animal',
  title: {
    de: 'Rotfuchs',
    en: 'Red fox',
    nl: 'Vos',
    es: 'Zorro rojo',
    fr: 'Renard roux',
    ru: 'Обыкновенная лисица',
    'zh-Hans': '赤狐',
    ko: '붉은여우',
    ja: 'アカギツネ',
    ar: 'الثعلب الأحمر',
    pt: 'Raposa-vermelha',
    it: 'Volpe rossa',
    pl: 'Lis rudy',
    tr: 'Kızıl tilki',
    uk: 'Звичайна лисиця',
    hi: 'लाल लोमड़ी'
  },
  place: {
    de: 'Europa, Asien, Nordafrika und Nordamerika',
    en: 'Europe, Asia, North Africa and North America',
    nl: 'Europa, Azië, Noord-Afrika en Noord-Amerika',
    es: 'Europa, Asia, el norte de África y Norteamérica',
    fr: 'Europe, Asie, Afrique du Nord et Amérique du Nord',
    ru: 'Европа, Азия, Северная Африка и Северная Америка',
    'zh-Hans': '欧洲、亚洲、北非和北美洲',
    ko: '유럽, 아시아, 북아프리카, 북아메리카',
    ja: 'ヨーロッパ、アジア、北アフリカ、北アメリカ',
    ar: 'أوروبا وآسيا وشمال أفريقيا وأمريكا الشمالية',
    pt: 'Europa, Ásia, Norte da África e América do Norte',
    it: 'Europa, Asia, Nordafrica e Nord America',
    pl: 'Europa, Azja, Afryka Północna i Ameryka Północna',
    tr: 'Avrupa, Asya, Kuzey Afrika ve Kuzey Amerika',
    uk: 'Європа, Азія, Північна Африка та Північна Америка',
    hi: 'यूरोप, एशिया, उत्तरी अफ़्रीका और उत्तरी अमेरिका'
  },
  backdrop: '#9cc3d5',
  palette: {
    o: ['#d9682b', 'orange'],
    w: ['#f6ead2', 'cream'],
    k: ['#241c18', 'black'],
    b: ['#7a3f1f', 'brown']
  },
  rows: [
    '................',
    '..k..........k..',
    '..kk........kk..',
    '..obo......obo..',
    '..obo.oooo.obo..',
    '.oooooooooooooo.',
    '.ookooooooookoo.',
    '.wwooooooooooww.',
    '..wwwoooooowww..',
    '...wwwwkkwwww.oo',
    '....wwwwwwww.ooo',
    '...oowwwwwwooooo',
    '..ooowwwwwwooooo',
    '..oooowwwwooooow',
    '..ooookkkkooooww',
    '..oook.kk.koowww'
  ]
};
