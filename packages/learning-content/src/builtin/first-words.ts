/**
 * "First words": 60 everyday concrete nouns, each with an emoji picture and the
 * standard everyday word in the 16 UI languages. Authored for this project
 * (no third-party word list); pictures are Unicode emoji drawn by the system font.
 *
 * Conventions (docs/content/deck-format.md):
 * - Singular nominative, the most common everyday word (not a scientific term).
 * - German, Dutch, Spanish, French, Portuguese and Italian include the definite
 *   article ("der Apfel", "de appel", "la manzana"), because the gender is part of
 *   learning the noun. Other languages show the bare noun.
 * - Portuguese follows Brazilian usage (like the UI translations); Spanish uses
 *   widely understood forms; Chinese is Simplified (zh-Hans).
 */
export const VOCABULARY_LANGUAGES = ['de', 'en', 'nl', 'es', 'fr', 'ru', 'zh-Hans', 'ko', 'ja', 'ar', 'pt', 'it', 'pl', 'tr', 'uk', 'hi'] as const;
export type VocabularyLanguage = (typeof VOCABULARY_LANGUAGES)[number];

type Words = readonly [string, string, string, string, string, string, string, string, string, string, string, string, string, string, string, string];
type Row = readonly [id: string, emoji: string, words: Words];

// Column order = VOCABULARY_LANGUAGES: de, en, nl, es, fr, ru, zh-Hans, ko, ja, ar, pt, it, pl, tr, uk, hi
const ROWS: readonly Row[] = [
  ['apple', '🍎', ['der Apfel', 'apple', 'de appel', 'la manzana', 'la pomme', 'яблоко', '苹果', '사과', 'りんご', 'تفاحة', 'a maçã', 'la mela', 'jabłko', 'elma', 'яблуко', 'सेब']],
  ['banana', '🍌', ['die Banane', 'banana', 'de banaan', 'el plátano', 'la banane', 'банан', '香蕉', '바나나', 'バナナ', 'موزة', 'a banana', 'la banana', 'banan', 'muz', 'банан', 'केला']],
  ['grapes', '🍇', ['die Weintraube', 'grapes', 'de druif', 'la uva', 'le raisin', 'виноград', '葡萄', '포도', 'ぶどう', 'عنب', 'a uva', "l'uva", 'winogrona', 'üzüm', 'виноград', 'अंगूर']],
  ['strawberry', '🍓', ['die Erdbeere', 'strawberry', 'de aardbei', 'la fresa', 'la fraise', 'клубника', '草莓', '딸기', 'いちご', 'فراولة', 'o morango', 'la fragola', 'truskawka', 'çilek', 'полуниця', 'स्ट्रॉबेरी']],
  ['lemon', '🍋', ['die Zitrone', 'lemon', 'de citroen', 'el limón', 'le citron', 'лимон', '柠檬', '레몬', 'レモン', 'ليمونة', 'o limão', 'il limone', 'cytryna', 'limon', 'лимон', 'नींबू']],
  ['cherry', '🍒', ['die Kirsche', 'cherry', 'de kers', 'la cereza', 'la cerise', 'вишня', '樱桃', '체리', 'さくらんぼ', 'كرز', 'a cereja', 'la ciliegia', 'wiśnia', 'kiraz', 'вишня', 'चेरी']],
  ['pear', '🍐', ['die Birne', 'pear', 'de peer', 'la pera', 'la poire', 'груша', '梨', '배', '洋なし', 'كمثرى', 'a pera', 'la pera', 'gruszka', 'armut', 'груша', 'नाशपाती']],
  ['carrot', '🥕', ['die Karotte', 'carrot', 'de wortel', 'la zanahoria', 'la carotte', 'морковь', '胡萝卜', '당근', 'にんじん', 'جزرة', 'a cenoura', 'la carota', 'marchewka', 'havuç', 'морква', 'गाजर']],
  ['tomato', '🍅', ['die Tomate', 'tomato', 'de tomaat', 'el tomate', 'la tomate', 'помидор', '西红柿', '토마토', 'トマト', 'طماطم', 'o tomate', 'il pomodoro', 'pomidor', 'domates', 'помідор', 'टमाटर']],
  ['bread', '🍞', ['das Brot', 'bread', 'het brood', 'el pan', 'le pain', 'хлеб', '面包', '빵', 'パン', 'خبز', 'o pão', 'il pane', 'chleb', 'ekmek', 'хліб', 'ब्रेड']],
  ['cheese', '🧀', ['der Käse', 'cheese', 'de kaas', 'el queso', 'le fromage', 'сыр', '奶酪', '치즈', 'チーズ', 'جبن', 'o queijo', 'il formaggio', 'ser', 'peynir', 'сир', 'चीज़']],
  ['egg', '🥚', ['das Ei', 'egg', 'het ei', 'el huevo', "l'œuf", 'яйцо', '鸡蛋', '달걀', 'たまご', 'بيضة', 'o ovo', "l'uovo", 'jajko', 'yumurta', 'яйце', 'अंडा']],
  ['milk', '🥛', ['die Milch', 'milk', 'de melk', 'la leche', 'le lait', 'молоко', '牛奶', '우유', '牛乳', 'حليب', 'o leite', 'il latte', 'mleko', 'süt', 'молоко', 'दूध']],
  ['cake', '🍰', ['der Kuchen', 'cake', 'de taart', 'el pastel', 'le gâteau', 'торт', '蛋糕', '케이크', 'ケーキ', 'كعكة', 'o bolo', 'la torta', 'ciasto', 'pasta', 'торт', 'केक']],
  ['dog', '🐕', ['der Hund', 'dog', 'de hond', 'el perro', 'le chien', 'собака', '狗', '개', '犬', 'كلب', 'o cachorro', 'il cane', 'pies', 'köpek', 'собака', 'कुत्ता']],
  ['cat', '🐈', ['die Katze', 'cat', 'de kat', 'el gato', 'le chat', 'кошка', '猫', '고양이', '猫', 'قطة', 'o gato', 'il gatto', 'kot', 'kedi', 'кіт', 'बिल्ली']],
  ['horse', '🐎', ['das Pferd', 'horse', 'het paard', 'el caballo', 'le cheval', 'лошадь', '马', '말', '馬', 'حصان', 'o cavalo', 'il cavallo', 'koń', 'at', 'кінь', 'घोड़ा']],
  ['cow', '🐄', ['die Kuh', 'cow', 'de koe', 'la vaca', 'la vache', 'корова', '奶牛', '소', '牛', 'بقرة', 'a vaca', 'la mucca', 'krowa', 'inek', 'корова', 'गाय']],
  ['pig', '🐖', ['das Schwein', 'pig', 'het varken', 'el cerdo', 'le cochon', 'свинья', '猪', '돼지', '豚', 'خنزير', 'o porco', 'il maiale', 'świnia', 'domuz', 'свиня', 'सूअर']],
  ['fish', '🐟', ['der Fisch', 'fish', 'de vis', 'el pez', 'le poisson', 'рыба', '鱼', '물고기', '魚', 'سمكة', 'o peixe', 'il pesce', 'ryba', 'balık', 'риба', 'मछली']],
  ['bird', '🐦', ['der Vogel', 'bird', 'de vogel', 'el pájaro', "l'oiseau", 'птица', '鸟', '새', '鳥', 'طائر', 'o pássaro', "l'uccello", 'ptak', 'kuş', 'птах', 'चिड़िया']],
  ['mouse', '🐁', ['die Maus', 'mouse', 'de muis', 'el ratón', 'la souris', 'мышь', '老鼠', '쥐', 'ねずみ', 'فأر', 'o rato', 'il topo', 'mysz', 'fare', 'миша', 'चूहा']],
  ['rabbit', '🐇', ['das Kaninchen', 'rabbit', 'het konijn', 'el conejo', 'le lapin', 'кролик', '兔子', '토끼', 'うさぎ', 'أرنب', 'o coelho', 'il coniglio', 'królik', 'tavşan', 'кролик', 'खरगोश']],
  ['elephant', '🐘', ['der Elefant', 'elephant', 'de olifant', 'el elefante', "l'éléphant", 'слон', '大象', '코끼리', 'ゾウ', 'فيل', 'o elefante', "l'elefante", 'słoń', 'fil', 'слон', 'हाथी']],
  ['lion', '🦁', ['der Löwe', 'lion', 'de leeuw', 'el león', 'le lion', 'лев', '狮子', '사자', 'ライオン', 'أسد', 'o leão', 'il leone', 'lew', 'aslan', 'лев', 'शेर']],
  ['bear', '🐻', ['der Bär', 'bear', 'de beer', 'el oso', "l'ours", 'медведь', '熊', '곰', 'クマ', 'دب', 'o urso', "l'orso", 'niedźwiedź', 'ayı', 'ведмідь', 'भालू']],
  ['frog', '🐸', ['der Frosch', 'frog', 'de kikker', 'la rana', 'la grenouille', 'лягушка', '青蛙', '개구리', 'カエル', 'ضفدع', 'o sapo', 'la rana', 'żaba', 'kurbağa', 'жаба', 'मेंढक']],
  ['snake', '🐍', ['die Schlange', 'snake', 'de slang', 'la serpiente', 'le serpent', 'змея', '蛇', '뱀', 'ヘビ', 'ثعبان', 'a cobra', 'il serpente', 'wąż', 'yılan', 'змія', 'साँप']],
  ['butterfly', '🦋', ['der Schmetterling', 'butterfly', 'de vlinder', 'la mariposa', 'le papillon', 'бабочка', '蝴蝶', '나비', 'チョウ', 'فراشة', 'a borboleta', 'la farfalla', 'motyl', 'kelebek', 'метелик', 'तितली']],
  ['tree', '🌳', ['der Baum', 'tree', 'de boom', 'el árbol', "l'arbre", 'дерево', '树', '나무', '木', 'شجرة', 'a árvore', "l'albero", 'drzewo', 'ağaç', 'дерево', 'पेड़']],
  ['flower', '🌼', ['die Blume', 'flower', 'de bloem', 'la flor', 'la fleur', 'цветок', '花', '꽃', '花', 'زهرة', 'a flor', 'il fiore', 'kwiat', 'çiçek', 'квітка', 'फूल']],
  ['sun', '☀️', ['die Sonne', 'sun', 'de zon', 'el sol', 'le soleil', 'солнце', '太阳', '해', '太陽', 'شمس', 'o sol', 'il sole', 'słońce', 'güneş', 'сонце', 'सूरज']],
  ['moon', '🌙', ['der Mond', 'moon', 'de maan', 'la luna', 'la lune', 'луна', '月亮', '달', '月', 'قمر', 'a lua', 'la luna', 'księżyc', 'ay', 'місяць', 'चाँद']],
  ['star', '⭐', ['der Stern', 'star', 'de ster', 'la estrella', "l'étoile", 'звезда', '星星', '별', '星', 'نجمة', 'a estrela', 'la stella', 'gwiazda', 'yıldız', 'зірка', 'तारा']],
  ['cloud', '☁️', ['die Wolke', 'cloud', 'de wolk', 'la nube', 'le nuage', 'облако', '云', '구름', '雲', 'سحابة', 'a nuvem', 'la nuvola', 'chmura', 'bulut', 'хмара', 'बादल']],
  ['fire', '🔥', ['das Feuer', 'fire', 'het vuur', 'el fuego', 'le feu', 'огонь', '火', '불', '火', 'نار', 'o fogo', 'il fuoco', 'ogień', 'ateş', 'вогонь', 'आग']],
  ['mountain', '⛰️', ['der Berg', 'mountain', 'de berg', 'la montaña', 'la montagne', 'гора', '山', '산', '山', 'جبل', 'a montanha', 'la montagna', 'góra', 'dağ', 'гора', 'पहाड़']],
  ['house', '🏠', ['das Haus', 'house', 'het huis', 'la casa', 'la maison', 'дом', '房子', '집', '家', 'بيت', 'a casa', 'la casa', 'dom', 'ev', 'будинок', 'घर']],
  ['car', '🚗', ['das Auto', 'car', 'de auto', 'el coche', 'la voiture', 'машина', '汽车', '자동차', '車', 'سيارة', 'o carro', 'la macchina', 'samochód', 'araba', 'автомобіль', 'कार']],
  ['bicycle', '🚲', ['das Fahrrad', 'bicycle', 'de fiets', 'la bicicleta', 'le vélo', 'велосипед', '自行车', '자전거', '自転車', 'دراجة', 'a bicicleta', 'la bicicletta', 'rower', 'bisiklet', 'велосипед', 'साइकिल']],
  ['train', '🚆', ['der Zug', 'train', 'de trein', 'el tren', 'le train', 'поезд', '火车', '기차', '電車', 'قطار', 'o trem', 'il treno', 'pociąg', 'tren', 'поїзд', 'रेलगाड़ी']],
  ['airplane', '✈️', ['das Flugzeug', 'airplane', 'het vliegtuig', 'el avión', "l'avion", 'самолёт', '飞机', '비행기', '飛行機', 'طائرة', 'o avião', "l'aereo", 'samolot', 'uçak', 'літак', 'हवाई जहाज़']],
  ['book', '📖', ['das Buch', 'book', 'het boek', 'el libro', 'le livre', 'книга', '书', '책', '本', 'كتاب', 'o livro', 'il libro', 'książka', 'kitap', 'книжка', 'किताब']],
  ['key', '🔑', ['der Schlüssel', 'key', 'de sleutel', 'la llave', 'la clé', 'ключ', '钥匙', '열쇠', '鍵', 'مفتاح', 'a chave', 'la chiave', 'klucz', 'anahtar', 'ключ', 'चाबी']],
  ['clock', '🕰️', ['die Uhr', 'clock', 'de klok', 'el reloj', "l'horloge", 'часы', '时钟', '시계', '時計', 'ساعة', 'o relógio', "l'orologio", 'zegar', 'saat', 'годинник', 'घड़ी']],
  ['chair', '🪑', ['der Stuhl', 'chair', 'de stoel', 'la silla', 'la chaise', 'стул', '椅子', '의자', '椅子', 'كرسي', 'a cadeira', 'la sedia', 'krzesło', 'sandalye', 'стілець', 'कुर्सी']],
  ['bed', '🛏️', ['das Bett', 'bed', 'het bed', 'la cama', 'le lit', 'кровать', '床', '침대', 'ベッド', 'سرير', 'a cama', 'il letto', 'łóżko', 'yatak', 'ліжко', 'बिस्तर']],
  ['door', '🚪', ['die Tür', 'door', 'de deur', 'la puerta', 'la porte', 'дверь', '门', '문', 'ドア', 'باب', 'a porta', 'la porta', 'drzwi', 'kapı', 'двері', 'दरवाज़ा']],
  ['ball', '⚽', ['der Ball', 'ball', 'de bal', 'la pelota', 'le ballon', 'мяч', '球', '공', 'ボール', 'كرة', 'a bola', 'la palla', 'piłka', 'top', "м'яч", 'गेंद']],
  ['hat', '🎩', ['der Hut', 'hat', 'de hoed', 'el sombrero', 'le chapeau', 'шляпа', '帽子', '모자', '帽子', 'قبعة', 'o chapéu', 'il cappello', 'kapelusz', 'şapka', 'капелюх', 'टोपी']],
  ['shoe', '👞', ['der Schuh', 'shoe', 'de schoen', 'el zapato', 'la chaussure', 'ботинок', '鞋子', '신발', '靴', 'حذاء', 'o sapato', 'la scarpa', 'but', 'ayakkabı', 'черевик', 'जूता']],
  ['umbrella', '☂️', ['der Regenschirm', 'umbrella', 'de paraplu', 'el paraguas', 'le parapluie', 'зонт', '雨伞', '우산', '傘', 'مظلة', 'o guarda-chuva', "l'ombrello", 'parasol', 'şemsiye', 'парасолька', 'छाता']],
  ['glasses', '👓', ['die Brille', 'glasses', 'de bril', 'las gafas', 'les lunettes', 'очки', '眼镜', '안경', 'めがね', 'نظارة', 'os óculos', 'gli occhiali', 'okulary', 'gözlük', 'окуляри', 'चश्मा']],
  ['pencil', '✏️', ['der Bleistift', 'pencil', 'het potlood', 'el lápiz', 'le crayon', 'карандаш', '铅笔', '연필', '鉛筆', 'قلم رصاص', 'o lápis', 'la matita', 'ołówek', 'kurşun kalem', 'олівець', 'पेंसिल']],
  ['scissors', '✂️', ['die Schere', 'scissors', 'de schaar', 'las tijeras', 'les ciseaux', 'ножницы', '剪刀', '가위', 'はさみ', 'مقص', 'a tesoura', 'le forbici', 'nożyczki', 'makas', 'ножиці', 'कैंची']],
  ['guitar', '🎸', ['die Gitarre', 'guitar', 'de gitaar', 'la guitarra', 'la guitare', 'гитара', '吉他', '기타', 'ギター', 'غيتار', 'a guitarra', 'la chitarra', 'gitara', 'gitar', 'гітара', 'गिटार']],
  ['bell', '🔔', ['die Glocke', 'bell', 'de bel', 'la campana', 'la cloche', 'колокольчик', '铃铛', '종', 'ベル', 'جرس', 'o sino', 'la campana', 'dzwonek', 'zil', 'дзвоник', 'घंटी']],
  ['heart', '❤️', ['das Herz', 'heart', 'het hart', 'el corazón', 'le cœur', 'сердце', '心', '하트', 'ハート', 'قلب', 'o coração', 'il cuore', 'serce', 'kalp', 'серце', 'दिल']],
  ['cup', '☕', ['die Tasse', 'cup', 'het kopje', 'la taza', 'la tasse', 'чашка', '杯子', '컵', 'カップ', 'فنجان', 'a xícara', 'la tazza', 'filiżanka', 'fincan', 'чашка', 'कप']],
  ['candle', '🕯️', ['die Kerze', 'candle', 'de kaars', 'la vela', 'la bougie', 'свеча', '蜡烛', '양초', 'ろうそく', 'شمعة', 'a vela', 'la candela', 'świeca', 'mum', 'свічка', 'मोमबत्ती']]
];

export interface VocabularyEntry {
  readonly id: string;
  readonly emoji: string;
  readonly words: Readonly<Record<VocabularyLanguage, string>>;
}

export const FIRST_WORDS: readonly VocabularyEntry[] = ROWS.map(([id, emoji, words]) => ({
  id,
  emoji,
  words: Object.fromEntries(VOCABULARY_LANGUAGES.map((lang, i) => [lang, words[i] as string])) as Record<VocabularyLanguage, string>
}));

const BY_ID = new Map(FIRST_WORDS.map((entry) => [entry.id, entry]));

export function findWord(id: string): VocabularyEntry | undefined {
  return BY_ID.get(id);
}

export function isVocabularyLanguage(value: unknown): value is VocabularyLanguage {
  return typeof value === 'string' && (VOCABULARY_LANGUAGES as readonly string[]).includes(value);
}

/**
 * Maps any BCP-47 tag to a vocabulary language, or `undefined`: exact match, then the
 * base language (`pt-BR` → `pt`, `en-GB` → `en`). Chinese maps to Simplified only for
 * `zh`, `zh-CN`, `zh-SG` and `zh-Hans-*`; Traditional Chinese is not offered as Simplified.
 */
export function toVocabularyLanguage(tag: string | undefined): VocabularyLanguage | undefined {
  if (!tag) return undefined;
  if (isVocabularyLanguage(tag)) return tag;
  const lower = tag.toLowerCase();
  if (lower.startsWith('zh')) return /^zh(?:-hans(?:-.*)?|-cn|-sg)?$/.test(lower) ? 'zh-Hans' : undefined;
  const base = lower.split('-')[0];
  return isVocabularyLanguage(base) ? base : undefined;
}
