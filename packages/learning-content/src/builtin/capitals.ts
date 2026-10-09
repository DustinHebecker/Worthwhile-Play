import type { CountryCode } from './countries';
import { VOCABULARY_LANGUAGES, type VocabularyLanguage } from './first-words';

/**
 * "Capitals": country ↔ capital for the countries of "Flags & countries" whose capital is
 * unambiguous. Country names come from the browser (CLDR via `Intl.DisplayNames`), like the
 * flags deck; capital names are not in CLDR, so they were written for this project (facts, no
 * third-party list or dataset) in the 16 UI languages, using the conventional exonym of each
 * language ("Warschau", "Varsovie", "ワルシャワ").
 *
 * Conventions:
 * - The everyday name of the city, not the official long form; Portuguese follows Brazilian usage
 *   ("Madri", "Moscou"), like the UI translations; Chinese is Simplified (zh-Hans).
 * - Where the city and the country have the same name in a language, the city is marked
 *   (Polish "Meksyk (miasto)"), so both cards of a pair are distinguishable.
 * - Bern is Switzerland's "federal city" (the de facto capital; the constitution names none);
 *   Amsterdam is the constitutional capital of the Netherlands (the government sits in The Hague).
 *
 * Countries of the flags deck deliberately left out (see `CAPITAL_EXCLUSIONS`).
 */
export const CAPITAL_EXCLUSIONS: Readonly<Partial<Record<CountryCode, string>>> = {
  ZA: 'three capitals (Pretoria, Cape Town, Bloemfontein)',
  ID: 'capital is being moved from Jakarta to Nusantara (law of 2022, move not completed)',
  TN: 'capital and country share the same name in Arabic (تونس) and Chinese (突尼斯)',
  UA: 'conventional exonym in transition in several languages (Kyiv/Kiev, Kyjiw/Kiew)',
  MN: 'transliteration varies widely between and within languages (Ulaanbaatar/Ulan Bator/Oulan-Bator)'
};

type Names = readonly [string, string, string, string, string, string, string, string, string, string, string, string, string, string, string, string];
type Row = readonly [code: CountryCode, names: Names];

// Column order = VOCABULARY_LANGUAGES: de, en, nl, es, fr, ru, zh-Hans, ko, ja, ar, pt, it, pl, tr, uk, hi
const ROWS: readonly Row[] = [
  ['AR', ['Buenos Aires', 'Buenos Aires', 'Buenos Aires', 'Buenos Aires', 'Buenos Aires', 'Буэнос-Айрес', '布宜诺斯艾利斯', '부에노스아이레스', 'ブエノスアイレス', 'بوينس آيرس', 'Buenos Aires', 'Buenos Aires', 'Buenos Aires', 'Buenos Aires', 'Буенос-Айрес', 'ब्यूनस आयर्स']],
  ['AT', ['Wien', 'Vienna', 'Wenen', 'Viena', 'Vienne', 'Вена', '维也纳', '빈', 'ウィーン', 'فيينا', 'Viena', 'Vienna', 'Wiedeń', 'Viyana', 'Відень', 'वियना']],
  ['AU', ['Canberra', 'Canberra', 'Canberra', 'Canberra', 'Canberra', 'Канберра', '堪培拉', '캔버라', 'キャンベラ', 'كانبرا', 'Camberra', 'Canberra', 'Canberra', 'Canberra', 'Канберра', 'कैनबरा']],
  ['BE', ['Brüssel', 'Brussels', 'Brussel', 'Bruselas', 'Bruxelles', 'Брюссель', '布鲁塞尔', '브뤼셀', 'ブリュッセル', 'بروكسل', 'Bruxelas', 'Bruxelles', 'Bruksela', 'Brüksel', 'Брюссель', 'ब्रसेल्स']],
  ['BR', ['Brasília', 'Brasília', 'Brasilia', 'Brasilia', 'Brasilia', 'Бразилиа', '巴西利亚', '브라질리아', 'ブラジリア', 'برازيليا', 'Brasília', 'Brasilia', 'Brasília', 'Brasilia', 'Бразиліа', 'ब्रासीलिया']],
  ['CA', ['Ottawa', 'Ottawa', 'Ottawa', 'Ottawa', 'Ottawa', 'Оттава', '渥太华', '오타와', 'オタワ', 'أوتاوا', 'Ottawa', 'Ottawa', 'Ottawa', 'Ottava', 'Оттава', 'ओटावा']],
  ['CH', ['Bern', 'Bern', 'Bern', 'Berna', 'Berne', 'Берн', '伯尔尼', '베른', 'ベルン', 'برن', 'Berna', 'Berna', 'Berno', 'Bern', 'Берн', 'बर्न']],
  ['CL', ['Santiago de Chile', 'Santiago', 'Santiago', 'Santiago de Chile', 'Santiago', 'Сантьяго', '圣地亚哥', '산티아고', 'サンティアゴ', 'سانتياغو', 'Santiago', 'Santiago del Cile', 'Santiago', 'Santiago', 'Сантьяго', 'सैंटियागो']],
  ['CN', ['Peking', 'Beijing', 'Peking', 'Pekín', 'Pékin', 'Пекин', '北京', '베이징', '北京', 'بكين', 'Pequim', 'Pechino', 'Pekin', 'Pekin', 'Пекін', 'बीजिंग']],
  ['CO', ['Bogotá', 'Bogotá', 'Bogota', 'Bogotá', 'Bogota', 'Богота', '波哥大', '보고타', 'ボゴタ', 'بوغوتا', 'Bogotá', 'Bogotà', 'Bogota', 'Bogota', 'Богота', 'बोगोटा']],
  ['CZ', ['Prag', 'Prague', 'Praag', 'Praga', 'Prague', 'Прага', '布拉格', '프라하', 'プラハ', 'براغ', 'Praga', 'Praga', 'Praga', 'Prag', 'Прага', 'प्राग']],
  ['DE', ['Berlin', 'Berlin', 'Berlijn', 'Berlín', 'Berlin', 'Берлин', '柏林', '베를린', 'ベルリン', 'برلين', 'Berlim', 'Berlino', 'Berlin', 'Berlin', 'Берлін', 'बर्लिन']],
  ['DK', ['Kopenhagen', 'Copenhagen', 'Kopenhagen', 'Copenhague', 'Copenhague', 'Копенгаген', '哥本哈根', '코펜하겐', 'コペンハーゲン', 'كوبنهاغن', 'Copenhague', 'Copenaghen', 'Kopenhaga', 'Kopenhag', 'Копенгаген', 'कोपेनहेगन']],
  ['EE', ['Tallinn', 'Tallinn', 'Tallinn', 'Tallin', 'Tallinn', 'Таллин', '塔林', '탈린', 'タリン', 'تالين', 'Tallinn', 'Tallinn', 'Tallinn', 'Tallinn', 'Таллінн', 'तालिन']],
  ['EG', ['Kairo', 'Cairo', 'Caïro', 'El Cairo', 'Le Caire', 'Каир', '开罗', '카이로', 'カイロ', 'القاهرة', 'Cairo', 'Il Cairo', 'Kair', 'Kahire', 'Каїр', 'काहिरा']],
  ['ES', ['Madrid', 'Madrid', 'Madrid', 'Madrid', 'Madrid', 'Мадрид', '马德里', '마드리드', 'マドリード', 'مدريد', 'Madri', 'Madrid', 'Madryt', 'Madrid', 'Мадрид', 'मैड्रिड']],
  ['FI', ['Helsinki', 'Helsinki', 'Helsinki', 'Helsinki', 'Helsinki', 'Хельсинки', '赫尔辛基', '헬싱키', 'ヘルシンキ', 'هلسنكي', 'Helsinque', 'Helsinki', 'Helsinki', 'Helsinki', 'Гельсінкі', 'हेलसिंकी']],
  ['FR', ['Paris', 'Paris', 'Parijs', 'París', 'Paris', 'Париж', '巴黎', '파리', 'パリ', 'باريس', 'Paris', 'Parigi', 'Paryż', 'Paris', 'Париж', 'पेरिस']],
  ['GB', ['London', 'London', 'Londen', 'Londres', 'Londres', 'Лондон', '伦敦', '런던', 'ロンドン', 'لندن', 'Londres', 'Londra', 'Londyn', 'Londra', 'Лондон', 'लंदन']],
  ['GH', ['Accra', 'Accra', 'Accra', 'Acra', 'Accra', 'Аккра', '阿克拉', '아크라', 'アクラ', 'أكرا', 'Acra', 'Accra', 'Akra', 'Akra', 'Аккра', 'अक्रा']],
  ['GR', ['Athen', 'Athens', 'Athene', 'Atenas', 'Athènes', 'Афины', '雅典', '아테네', 'アテネ', 'أثينا', 'Atenas', 'Atene', 'Ateny', 'Atina', 'Афіни', 'एथेंस']],
  ['HR', ['Zagreb', 'Zagreb', 'Zagreb', 'Zagreb', 'Zagreb', 'Загреб', '萨格勒布', '자그레브', 'ザグレブ', 'زغرب', 'Zagreb', 'Zagabria', 'Zagrzeb', 'Zagreb', 'Загреб', 'ज़ाग्रेब']],
  ['HU', ['Budapest', 'Budapest', 'Boedapest', 'Budapest', 'Budapest', 'Будапешт', '布达佩斯', '부다페스트', 'ブダペスト', 'بودابست', 'Budapeste', 'Budapest', 'Budapeszt', 'Budapeşte', 'Будапешт', 'बुडापेस्ट']],
  ['IE', ['Dublin', 'Dublin', 'Dublin', 'Dublín', 'Dublin', 'Дублин', '都柏林', '더블린', 'ダブリン', 'دبلن', 'Dublin', 'Dublino', 'Dublin', 'Dublin', 'Дублін', 'डबलिन']],
  ['IN', ['Neu-Delhi', 'New Delhi', 'New Delhi', 'Nueva Delhi', 'New Delhi', 'Нью-Дели', '新德里', '뉴델리', 'ニューデリー', 'نيودلهي', 'Nova Délhi', 'Nuova Delhi', 'Nowe Delhi', 'Yeni Delhi', 'Нью-Делі', 'नई दिल्ली']],
  ['IS', ['Reykjavík', 'Reykjavík', 'Reykjavik', 'Reikiavik', 'Reykjavik', 'Рейкьявик', '雷克雅未克', '레이캬비크', 'レイキャビク', 'ريكيافيك', 'Reykjavík', 'Reykjavík', 'Reykjavík', 'Reykjavik', "Рейк'явік", 'रेक्याविक']],
  ['IT', ['Rom', 'Rome', 'Rome', 'Roma', 'Rome', 'Рим', '罗马', '로마', 'ローマ', 'روما', 'Roma', 'Roma', 'Rzym', 'Roma', 'Рим', 'रोम']],
  ['JM', ['Kingston', 'Kingston', 'Kingston', 'Kingston', 'Kingston', 'Кингстон', '金斯敦', '킹스턴', 'キングストン', 'كينغستون', 'Kingston', 'Kingston', 'Kingston', 'Kingston', 'Кінгстон', 'किंग्स्टन']],
  ['JP', ['Tokio', 'Tokyo', 'Tokio', 'Tokio', 'Tokyo', 'Токио', '东京', '도쿄', '東京', 'طوكيو', 'Tóquio', 'Tokyo', 'Tokio', 'Tokyo', 'Токіо', 'टोक्यो']],
  ['KE', ['Nairobi', 'Nairobi', 'Nairobi', 'Nairobi', 'Nairobi', 'Найроби', '内罗毕', '나이로비', 'ナイロビ', 'نيروبي', 'Nairóbi', 'Nairobi', 'Nairobi', 'Nairobi', 'Найробі', 'नैरोबी']],
  ['KR', ['Seoul', 'Seoul', 'Seoel', 'Seúl', 'Séoul', 'Сеул', '首尔', '서울', 'ソウル', 'سول', 'Seul', 'Seul', 'Seul', 'Seul', 'Сеул', 'सियोल']],
  ['LT', ['Vilnius', 'Vilnius', 'Vilnius', 'Vilna', 'Vilnius', 'Вильнюс', '维尔纽斯', '빌뉴스', 'ビリニュス', 'فيلنيوس', 'Vilnius', 'Vilnius', 'Wilno', 'Vilnius', 'Вільнюс', 'विल्नियस']],
  ['LV', ['Riga', 'Riga', 'Riga', 'Riga', 'Riga', 'Рига', '里加', '리가', 'リガ', 'ريغا', 'Riga', 'Riga', 'Ryga', 'Riga', 'Рига', 'रीगा']],
  ['MA', ['Rabat', 'Rabat', 'Rabat', 'Rabat', 'Rabat', 'Рабат', '拉巴特', '라바트', 'ラバト', 'الرباط', 'Rabat', 'Rabat', 'Rabat', 'Rabat', 'Рабат', 'रबात']],
  ['MX', ['Mexiko-Stadt', 'Mexico City', 'Mexico-Stad', 'Ciudad de México', 'Mexico', 'Мехико', '墨西哥城', '멕시코시티', 'メキシコシティ', 'مكسيكو سيتي', 'Cidade do México', 'Città del Messico', 'Meksyk (miasto)', 'Meksiko City', 'Мехіко', 'मेक्सिको सिटी']],
  ['NG', ['Abuja', 'Abuja', 'Abuja', 'Abuya', 'Abuja', 'Абуджа', '阿布贾', '아부자', 'アブジャ', 'أبوجا', 'Abuja', 'Abuja', 'Abudża', 'Abuja', 'Абуджа', 'अबुजा']],
  ['NL', ['Amsterdam', 'Amsterdam', 'Amsterdam', 'Ámsterdam', 'Amsterdam', 'Амстердам', '阿姆斯特丹', '암스테르담', 'アムステルダム', 'أمستردام', 'Amsterdã', 'Amsterdam', 'Amsterdam', 'Amsterdam', 'Амстердам', 'एम्स्टर्डम']],
  ['NO', ['Oslo', 'Oslo', 'Oslo', 'Oslo', 'Oslo', 'Осло', '奥斯陆', '오슬로', 'オスロ', 'أوسلو', 'Oslo', 'Oslo', 'Oslo', 'Oslo', 'Осло', 'ओस्लो']],
  ['NP', ['Kathmandu', 'Kathmandu', 'Kathmandu', 'Katmandú', 'Katmandou', 'Катманду', '加德满都', '카트만두', 'カトマンズ', 'كاتماندو', 'Katmandu', 'Katmandu', 'Katmandu', 'Katmandu', 'Катманду', 'काठमांडू']],
  ['NZ', ['Wellington', 'Wellington', 'Wellington', 'Wellington', 'Wellington', 'Веллингтон', '惠灵顿', '웰링턴', 'ウェリントン', 'ولينغتون', 'Wellington', 'Wellington', 'Wellington', 'Wellington', 'Веллінгтон', 'वेलिंगटन']],
  ['PE', ['Lima', 'Lima', 'Lima', 'Lima', 'Lima', 'Лима', '利马', '리마', 'リマ', 'ليما', 'Lima', 'Lima', 'Lima', 'Lima', 'Ліма', 'लीमा']],
  ['PH', ['Manila', 'Manila', 'Manilla', 'Manila', 'Manille', 'Манила', '马尼拉', '마닐라', 'マニラ', 'مانيلا', 'Manila', 'Manila', 'Manila', 'Manila', 'Маніла', 'मनीला']],
  ['PK', ['Islamabad', 'Islamabad', 'Islamabad', 'Islamabad', 'Islamabad', 'Исламабад', '伊斯兰堡', '이슬라마바드', 'イスラマバード', 'إسلام آباد', 'Islamabad', 'Islamabad', 'Islamabad', 'İslamabad', 'Ісламабад', 'इस्लामाबाद']],
  ['PL', ['Warschau', 'Warsaw', 'Warschau', 'Varsovia', 'Varsovie', 'Варшава', '华沙', '바르샤바', 'ワルシャワ', 'وارسو', 'Varsóvia', 'Varsavia', 'Warszawa', 'Varşova', 'Варшава', 'वारसॉ']],
  ['PT', ['Lissabon', 'Lisbon', 'Lissabon', 'Lisboa', 'Lisbonne', 'Лиссабон', '里斯本', '리스본', 'リスボン', 'لشبونة', 'Lisboa', 'Lisbona', 'Lizbona', 'Lizbon', 'Лісабон', 'लिस्बन']],
  ['RO', ['Bukarest', 'Bucharest', 'Boekarest', 'Bucarest', 'Bucarest', 'Бухарест', '布加勒斯特', '부쿠레슈티', 'ブカレスト', 'بوخارست', 'Bucareste', 'Bucarest', 'Bukareszt', 'Bükreş', 'Бухарест', 'बुखारेस्ट']],
  ['RU', ['Moskau', 'Moscow', 'Moskou', 'Moscú', 'Moscou', 'Москва', '莫斯科', '모스크바', 'モスクワ', 'موسكو', 'Moscou', 'Mosca', 'Moskwa', 'Moskova', 'Москва', 'मॉस्को']],
  ['SA', ['Riad', 'Riyadh', 'Riyad', 'Riad', 'Riyad', 'Эр-Рияд', '利雅得', '리야드', 'リヤド', 'الرياض', 'Riade', 'Riad', 'Rijad', 'Riyad', 'Ер-Ріяд', 'रियाद']],
  ['SE', ['Stockholm', 'Stockholm', 'Stockholm', 'Estocolmo', 'Stockholm', 'Стокгольм', '斯德哥尔摩', '스톡홀름', 'ストックホルム', 'ستوكهولم', 'Estocolmo', 'Stoccolma', 'Sztokholm', 'Stockholm', 'Стокгольм', 'स्टॉकहोम']],
  ['SN', ['Dakar', 'Dakar', 'Dakar', 'Dakar', 'Dakar', 'Дакар', '达喀尔', '다카르', 'ダカール', 'داكار', 'Dacar', 'Dakar', 'Dakar', 'Dakar', 'Дакар', 'डकार']],
  ['TH', ['Bangkok', 'Bangkok', 'Bangkok', 'Bangkok', 'Bangkok', 'Бангкок', '曼谷', '방콕', 'バンコク', 'بانكوك', 'Bangkok', 'Bangkok', 'Bangkok', 'Bangkok', 'Бангкок', 'बैंकॉक']],
  ['TR', ['Ankara', 'Ankara', 'Ankara', 'Ankara', 'Ankara', 'Анкара', '安卡拉', '앙카라', 'アンカラ', 'أنقرة', 'Ancara', 'Ankara', 'Ankara', 'Ankara', 'Анкара', 'अंकारा']],
  ['US', ['Washington, D.C.', 'Washington, D.C.', 'Washington D.C.', 'Washington D. C.', 'Washington', 'Вашингтон', '华盛顿', '워싱턴 D.C.', 'ワシントンD.C.', 'واشنطن العاصمة', 'Washington, D.C.', 'Washington', 'Waszyngton', 'Washington, D.C.', 'Вашингтон', 'वॉशिंगटन डी.सी.']],
  ['UY', ['Montevideo', 'Montevideo', 'Montevideo', 'Montevideo', 'Montevideo', 'Монтевидео', '蒙得维的亚', '몬테비데오', 'モンテビデオ', 'مونتيفيديو', 'Montevidéu', 'Montevideo', 'Montevideo', 'Montevideo', 'Монтевідео', 'मोंटेवीडियो']],
  ['VN', ['Hanoi', 'Hanoi', 'Hanoi', 'Hanói', 'Hanoï', 'Ханой', '河内', '하노이', 'ハノイ', 'هانوي', 'Hanói', 'Hanoi', 'Hanoi', 'Hanoi', 'Ханой', 'हनोई']]
];

export interface CapitalEntry {
  readonly code: CountryCode;
  readonly names: Readonly<Record<VocabularyLanguage, string>>;
}

export const CAPITALS: readonly CapitalEntry[] = ROWS.map(([code, names]) => ({
  code,
  names: Object.fromEntries(VOCABULARY_LANGUAGES.map((lang, i) => [lang, names[i] as string])) as Record<VocabularyLanguage, string>
}));

/** Country codes with a capital, in the order of the flags deck. */
export const CAPITAL_CODES: readonly CountryCode[] = CAPITALS.map((entry) => entry.code);

const BY_CODE = new Map<string, CapitalEntry>(CAPITALS.map((entry) => [entry.code, entry]));

/** Capital of the country `code` (any case) in `language`, or `undefined` if the deck has none. */
export function capitalName(code: string, language: VocabularyLanguage): string | undefined {
  return BY_CODE.get(code.toUpperCase())?.names[language];
}
