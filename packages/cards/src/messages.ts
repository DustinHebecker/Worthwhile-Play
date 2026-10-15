import type { GameMessages, Translator } from '@wp/game-core';
import { rankOf, suitOf, type Card, type Rank, type Suit, type SuitSet } from './model';

/**
 * Card vocabulary in all 16 UI locales, under `cards.*`.
 *
 * Games merge it into their own catalogue with `withCardMessages(messages)`, so the game translator
 * (`ctx.t`) knows the keys and the contract test audits them together with the game's keys.
 *
 * Keys (suit ids C/S/H/D as in `SUITS`, court ranks J/Q/K/A; 2–10 are written as digits everywhere):
 * - `cards.suit.<S>` / `cards.suit.german.<S>`: standalone suit name ("Hearts", "Eichel").
 * - `cards.of.<S>` / `cards.of.german.<S>`: card name with a `{rank}` placeholder ("{rank} of Hearts",
 *   "Herz {rank}", "{rank} червей"), so each language can use its own word order and case.
 * - `cards.rank.<R>` / `cards.rank.german.<R>`: rank names ("Queen", "Ober").
 * - `cards.index.<R>` / `cards.index.german.<R>`: the letter printed in the card corner (en J Q K A,
 *   de B D K A, fr V D R A, ru В Д К Т …; German suits: U O K A).
 * - `cards.faceDown`, `cards.hand`.
 */
type Four = readonly [string, string, string, string];

interface LocaleCards {
  /** French suits C, S, H, D: standalone names and `{rank}` templates. */
  suits: Four;
  of: Four;
  /** German suits C (acorns), S (leaves), H (hearts), D (bells). */
  gSuits: Four;
  gOf: Four;
  /** Court ranks J, Q, K, A. */
  ranks: Four;
  gRanks: Four;
  index: Four;
  gIndex: Four;
  faceDown: string;
  hand: string;
}

const SUIT_IDS = ['C', 'S', 'H', 'D'] as const;
const COURT = ['J', 'Q', 'K', 'A'] as const;

const build = (l: LocaleCards): Record<string, string> => {
  const out: Record<string, string> = {};
  SUIT_IDS.forEach((s, i) => {
    out[`cards.suit.${s}`] = l.suits[i] as string;
    out[`cards.of.${s}`] = l.of[i] as string;
    out[`cards.suit.german.${s}`] = l.gSuits[i] as string;
    out[`cards.of.german.${s}`] = l.gOf[i] as string;
  });
  COURT.forEach((r, i) => {
    out[`cards.rank.${r}`] = l.ranks[i] as string;
    out[`cards.rank.german.${r}`] = l.gRanks[i] as string;
    out[`cards.index.${r}`] = l.index[i] as string;
    out[`cards.index.german.${r}`] = l.gIndex[i] as string;
  });
  out['cards.faceDown'] = l.faceDown;
  out['cards.hand'] = l.hand;
  return out;
};

const LATIN_GERMAN_INDEX: Four = ['U', 'O', 'K', 'A'];
const CYRILLIC_GERMAN_INDEX: Four = ['У', 'О', 'К', 'Т'];
const JQKA: Four = ['J', 'Q', 'K', 'A'];

export const CARD_MESSAGES = {
  en: build({
    suits: ['Clubs', 'Spades', 'Hearts', 'Diamonds'],
    of: ['{rank} of Clubs', '{rank} of Spades', '{rank} of Hearts', '{rank} of Diamonds'],
    gSuits: ['Acorns', 'Leaves', 'Hearts', 'Bells'],
    gOf: ['{rank} of Acorns', '{rank} of Leaves', '{rank} of Hearts', '{rank} of Bells'],
    ranks: ['Jack', 'Queen', 'King', 'Ace'],
    gRanks: ['Unter', 'Ober', 'King', 'Ace'],
    index: JQKA,
    gIndex: LATIN_GERMAN_INDEX,
    faceDown: 'Face-down card',
    hand: 'Cards in hand'
  }),
  de: build({
    suits: ['Kreuz', 'Pik', 'Herz', 'Karo'],
    of: ['Kreuz {rank}', 'Pik {rank}', 'Herz {rank}', 'Karo {rank}'],
    gSuits: ['Eichel', 'Grün', 'Rot', 'Schellen'],
    gOf: ['Eichel {rank}', 'Grün {rank}', 'Rot {rank}', 'Schellen {rank}'],
    ranks: ['Bube', 'Dame', 'König', 'Ass'],
    gRanks: ['Unter', 'Ober', 'König', 'Ass'],
    index: ['B', 'D', 'K', 'A'],
    gIndex: LATIN_GERMAN_INDEX,
    faceDown: 'Verdeckte Karte',
    hand: 'Karten auf der Hand'
  }),
  nl: build({
    suits: ['Klaveren', 'Schoppen', 'Harten', 'Ruiten'],
    of: ['Klaveren {rank}', 'Schoppen {rank}', 'Harten {rank}', 'Ruiten {rank}'],
    gSuits: ['Eikels', 'Bladeren', 'Harten', 'Bellen'],
    gOf: ['Eikels {rank}', 'Bladeren {rank}', 'Harten {rank}', 'Bellen {rank}'],
    ranks: ['boer', 'vrouw', 'heer', 'aas'],
    gRanks: ['Unter', 'Ober', 'koning', 'aas'],
    index: ['B', 'V', 'H', 'A'],
    gIndex: LATIN_GERMAN_INDEX,
    faceDown: 'Gesloten kaart',
    hand: 'Kaarten in de hand'
  }),
  es: build({
    suits: ['Tréboles', 'Picas', 'Corazones', 'Diamantes'],
    of: ['{rank} de tréboles', '{rank} de picas', '{rank} de corazones', '{rank} de diamantes'],
    gSuits: ['Bellotas', 'Hojas', 'Corazones', 'Cascabeles'],
    gOf: ['{rank} de bellotas', '{rank} de hojas', '{rank} de corazones', '{rank} de cascabeles'],
    ranks: ['Jota', 'Reina', 'Rey', 'As'],
    gRanks: ['Unter', 'Ober', 'Rey', 'As'],
    index: JQKA,
    gIndex: LATIN_GERMAN_INDEX,
    faceDown: 'Carta boca abajo',
    hand: 'Cartas en la mano'
  }),
  fr: build({
    suits: ['Trèfle', 'Pique', 'Cœur', 'Carreau'],
    of: ['{rank} de trèfle', '{rank} de pique', '{rank} de cœur', '{rank} de carreau'],
    gSuits: ['Glands', 'Feuilles', 'Cœurs', 'Grelots'],
    gOf: ['{rank} de glands', '{rank} de feuilles', '{rank} de cœurs', '{rank} de grelots'],
    ranks: ['Valet', 'Dame', 'Roi', 'As'],
    gRanks: ['Unter', 'Ober', 'Roi', 'As'],
    index: ['V', 'D', 'R', 'A'],
    gIndex: ['U', 'O', 'R', 'A'],
    faceDown: 'Carte face cachée',
    hand: 'Cartes en main'
  }),
  ru: build({
    suits: ['Трефы', 'Пики', 'Червы', 'Бубны'],
    of: ['{rank} треф', '{rank} пик', '{rank} червей', '{rank} бубён'],
    gSuits: ['Жёлуди', 'Листья', 'Сердца', 'Бубенцы'],
    gOf: ['{rank} желудей', '{rank} листьев', '{rank} сердец', '{rank} бубенцов'],
    ranks: ['Валет', 'Дама', 'Король', 'Туз'],
    gRanks: ['Унтер', 'Обер', 'Король', 'Туз'],
    index: ['В', 'Д', 'К', 'Т'],
    gIndex: CYRILLIC_GERMAN_INDEX,
    faceDown: 'Карта рубашкой вверх',
    hand: 'Карты на руке'
  }),
  'zh-Hans': build({
    suits: ['梅花', '黑桃', '红桃', '方块'],
    of: ['梅花{rank}', '黑桃{rank}', '红桃{rank}', '方块{rank}'],
    gSuits: ['橡果', '树叶', '红心', '铃铛'],
    gOf: ['橡果{rank}', '树叶{rank}', '红心{rank}', '铃铛{rank}'],
    ranks: JQKA,
    gRanks: ['Unter', 'Ober', 'K', 'A'],
    index: JQKA,
    gIndex: LATIN_GERMAN_INDEX,
    faceDown: '背面朝上的牌',
    hand: '手牌'
  }),
  ko: build({
    suits: ['클로버', '스페이드', '하트', '다이아몬드'],
    of: ['클로버 {rank}', '스페이드 {rank}', '하트 {rank}', '다이아몬드 {rank}'],
    gSuits: ['도토리', '나뭇잎', '하트', '방울'],
    gOf: ['도토리 {rank}', '나뭇잎 {rank}', '하트 {rank}', '방울 {rank}'],
    ranks: ['잭', '퀸', '킹', '에이스'],
    gRanks: ['운터', '오버', '킹', '에이스'],
    index: JQKA,
    gIndex: LATIN_GERMAN_INDEX,
    faceDown: '뒤집어 놓은 카드',
    hand: '손패'
  }),
  ja: build({
    suits: ['クラブ', 'スペード', 'ハート', 'ダイヤ'],
    of: ['クラブの{rank}', 'スペードの{rank}', 'ハートの{rank}', 'ダイヤの{rank}'],
    gSuits: ['ドングリ', '葉', 'ハート', '鈴'],
    gOf: ['ドングリの{rank}', '葉の{rank}', 'ハートの{rank}', '鈴の{rank}'],
    ranks: ['ジャック', 'クイーン', 'キング', 'エース'],
    gRanks: ['ウンター', 'オーバー', 'キング', 'エース'],
    index: JQKA,
    gIndex: LATIN_GERMAN_INDEX,
    faceDown: '裏向きのカード',
    hand: '手札'
  }),
  ar: build({
    suits: ['سباتي', 'بستوني', 'قلوب', 'ديناري'],
    of: ['{rank} السباتي', '{rank} البستوني', '{rank} القلوب', '{rank} الديناري'],
    gSuits: ['بلوط', 'أوراق', 'قلوب', 'أجراس'],
    gOf: ['{rank} البلوط', '{rank} الأوراق', '{rank} القلوب', '{rank} الأجراس'],
    ranks: ['ولد', 'ملكة', 'ملك', 'آس'],
    gRanks: ['أونتر', 'أوبر', 'ملك', 'آس'],
    index: JQKA,
    gIndex: LATIN_GERMAN_INDEX,
    faceDown: 'ورقة مقلوبة',
    hand: 'الأوراق في اليد'
  }),
  pt: build({
    suits: ['Paus', 'Espadas', 'Copas', 'Ouros'],
    of: ['{rank} de paus', '{rank} de espadas', '{rank} de copas', '{rank} de ouros'],
    gSuits: ['Bolotas', 'Folhas', 'Corações', 'Sinos'],
    gOf: ['{rank} de bolotas', '{rank} de folhas', '{rank} de corações', '{rank} de sinos'],
    ranks: ['Valete', 'Dama', 'Rei', 'Ás'],
    gRanks: ['Unter', 'Ober', 'Rei', 'Ás'],
    index: JQKA,
    gIndex: LATIN_GERMAN_INDEX,
    faceDown: 'Carta virada para baixo',
    hand: 'Cartas na mão'
  }),
  it: build({
    suits: ['Fiori', 'Picche', 'Cuori', 'Quadri'],
    of: ['{rank} di fiori', '{rank} di picche', '{rank} di cuori', '{rank} di quadri'],
    gSuits: ['Ghiande', 'Foglie', 'Cuori', 'Campanelli'],
    gOf: ['{rank} di ghiande', '{rank} di foglie', '{rank} di cuori', '{rank} di campanelli'],
    ranks: ['Fante', 'Donna', 'Re', 'Asso'],
    gRanks: ['Unter', 'Ober', 'Re', 'Asso'],
    index: JQKA,
    gIndex: LATIN_GERMAN_INDEX,
    faceDown: 'Carta coperta',
    hand: 'Carte in mano'
  }),
  pl: build({
    suits: ['Trefl', 'Pik', 'Kier', 'Karo'],
    of: ['{rank} trefl', '{rank} pik', '{rank} kier', '{rank} karo'],
    gSuits: ['Żołądź', 'Wino', 'Czerwień', 'Dzwonek'],
    gOf: ['{rank} żołędzi', '{rank} wina', '{rank} czerwieni', '{rank} dzwonków'],
    ranks: ['Walet', 'Dama', 'Król', 'As'],
    gRanks: ['Niżnik', 'Wyżnik', 'Król', 'As'],
    index: ['W', 'D', 'K', 'A'],
    gIndex: ['N', 'W', 'K', 'A'],
    faceDown: 'Zakryta karta',
    hand: 'Karty na ręce'
  }),
  tr: build({
    suits: ['Sinek', 'Maça', 'Kupa', 'Karo'],
    of: ['Sinek {rank}', 'Maça {rank}', 'Kupa {rank}', 'Karo {rank}'],
    gSuits: ['Palamut', 'Yaprak', 'Kalp', 'Çan'],
    gOf: ['Palamut {rank}', 'Yaprak {rank}', 'Kalp {rank}', 'Çan {rank}'],
    ranks: ['Vale', 'Kız', 'Papaz', 'As'],
    gRanks: ['Unter', 'Ober', 'Papaz', 'As'],
    index: JQKA,
    gIndex: LATIN_GERMAN_INDEX,
    faceDown: 'Kapalı kart',
    hand: 'Eldeki kartlar'
  }),
  uk: build({
    suits: ['Трефи', 'Піки', 'Чирви', 'Бубни'],
    of: ['{rank} треф', '{rank} пік', '{rank} чирв', '{rank} бубон'],
    gSuits: ['Жолуді', 'Листя', 'Серця', 'Дзвіночки'],
    gOf: ['{rank} жолудів', '{rank} листя', '{rank} сердець', '{rank} дзвіночків'],
    ranks: ['Валет', 'Дама', 'Король', 'Туз'],
    gRanks: ['Унтер', 'Обер', 'Король', 'Туз'],
    index: ['В', 'Д', 'К', 'Т'],
    gIndex: CYRILLIC_GERMAN_INDEX,
    faceDown: 'Карта сорочкою догори',
    hand: 'Карти в руці'
  }),
  hi: build({
    suits: ['चिड़ी', 'हुकुम', 'पान', 'ईंट'],
    of: ['चिड़ी {rank}', 'हुकुम {rank}', 'पान {rank}', 'ईंट {rank}'],
    gSuits: ['बलूत', 'पत्ती', 'दिल', 'घंटी'],
    gOf: ['बलूत {rank}', 'पत्ती {rank}', 'दिल {rank}', 'घंटी {rank}'],
    ranks: ['गुलाम', 'बेगम', 'बादशाह', 'इक्का'],
    gRanks: ['उंटर', 'ओबर', 'बादशाह', 'इक्का'],
    index: JQKA,
    gIndex: LATIN_GERMAN_INDEX,
    faceDown: 'उलटा रखा पत्ता',
    hand: 'हाथ के पत्ते'
  })
} as const satisfies GameMessages;

/** Adds `CARD_MESSAGES` to a game's catalogue, per locale. The game's own keys win on a clash. */
export function withCardMessages<M extends GameMessages>(messages: M): GameMessages {
  const locales = new Set([...Object.keys(messages), ...Object.keys(CARD_MESSAGES)]);
  const result: Record<string, Readonly<Record<string, string>>> = {};
  for (const locale of locales) {
    result[locale] = { ...(CARD_MESSAGES as GameMessages)[locale], ...messages[locale] };
  }
  return result;
}

const isCourt = (rank: Rank): rank is 'J' | 'Q' | 'K' | 'A' => rank === 'J' || rank === 'Q' || rank === 'K' || rank === 'A';
const setPrefix = (set: SuitSet) => (set === 'german' ? 'german.' : '');

/** Index letters used when no translator is given. */
const DEFAULT_INDEX: Readonly<Record<SuitSet, Readonly<Record<'J' | 'Q' | 'K' | 'A', string>>>> = {
  french: { J: 'J', Q: 'Q', K: 'K', A: 'A' },
  german: { J: 'U', Q: 'O', K: 'K', A: 'A' }
};

/** Spoken rank name: digits for 2–10, translated names for court cards and aces. */
export function rankName(rank: Rank, t: Translator, set: SuitSet = 'french'): string {
  if (rank === 'T') return '10';
  return isCourt(rank) ? t(`cards.rank.${setPrefix(set)}${rank}`) : rank;
}

/** Standalone suit name in the active language. */
export function suitName(suit: Suit, t: Translator, set: SuitSet = 'french'): string {
  return t(`cards.suit.${setPrefix(set)}${suit}`);
}

/** The short text in the card corner ("10", "7", "Q", "B" …). */
export function rankIndex(rank: Rank, t?: Translator, set: SuitSet = 'french'): string {
  if (rank === 'T') return '10';
  if (!isCourt(rank)) return rank;
  return t ? t(`cards.index.${setPrefix(set)}${rank}`) : DEFAULT_INDEX[set][rank];
}

/** Accessible name of a card ("Queen of Hearts", "Eichel Ober"); `null` = a face-down card. */
export function cardLabel(card: Card | null, t: Translator, set: SuitSet = 'french'): string {
  if (card === null) return t('cards.faceDown');
  return t(`cards.of.${setPrefix(set)}${suitOf(card)}`, { rank: rankName(rankOf(card), t, set) });
}
