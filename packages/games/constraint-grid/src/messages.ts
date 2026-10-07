import type { GameMessages } from '@wp/game-core';
import { ATTRIBUTE_KINDS, NAME_COUNT, VOCABULARY, type AttributeKind } from './vocabulary';

/**
 * Translations for Constraint Grid ("Logic Grid").
 *
 * Clue sentences are never assembled from fragments in code. Each clue type is one full
 * sentence template per locale (`clue.<type>`), and its placeholders are filled with complete
 * noun phrases (`subject.*`, e.g. "the person with the cat"). The templates only use those
 * phrases in positions where their form never changes (subject or comparison position,
 * nominative), and avoid verb/adjective agreement with them, so the same phrase fits every
 * template:
 * - de: "als"/"ist" constructions instead of prepositions that need the dative;
 * - fr: all phrases start with "la personne" and all names with a consonant (no elision);
 * - pt/it: no "de/di + article" contractions next to a placeholder;
 * - ru/uk/pl: present tense (no gender) and "чем/ніж/niż" + nominative;
 * - ar: nominal sentences and "طابق {a}" (construct state), so no verb agrees with a name;
 * - hi: honorific "… वाले व्यक्ति" phrases, whose oblique form is identical;
 * - ko: every phrase ends in 님 or 사람 (final consonant), so particles are always 은/이/과;
 * - tr: placeholders are followed only by separate words (ile, değil), never by suffixes.
 * The view upper-cases the first letter of a rendered sentence (locale-aware).
 *
 * Person names are short international first names (all starting with a consonant),
 * transliterated for non-Latin scripts. Floors are numbered 1 (lowest) to N.
 */

type Six = readonly [string, string, string, string, string, string];

interface LocaleTexts {
  /** All other keys, verbatim. */
  ui: Readonly<Record<string, string>>;
  /** Category labels: person, floor, pet, drink, colour. */
  categories: readonly [string, string, string, string, string];
  names: readonly [string, string, string, string, string, string, string, string];
  items: Readonly<Record<AttributeKind, Six>>;
  subjects: Readonly<Record<AttributeKind, Six>>;
}

function build(texts: LocaleTexts): Record<string, string> {
  const out: Record<string, string> = { ...texts.ui };
  (['person', 'floor', ...ATTRIBUTE_KINDS] as const).forEach((kind, k) => {
    out[`category.${kind}`] = texts.categories[k] as string;
  });
  for (let i = 0; i < NAME_COUNT; i++) out[`name.${i}`] = texts.names[i] as string;
  for (const kind of ATTRIBUTE_KINDS) {
    VOCABULARY[kind].forEach((id, i) => {
      out[`item.${kind}.${id}`] = texts.items[kind][i] as string;
      out[`subject.${kind}.${id}`] = texts.subjects[kind][i] as string;
    });
  }
  return out;
}

const en = build({
  ui: {
    title: 'Logic Grid',
    tagline: 'Combine the clues to work out who lives where and has what.',
    rules: 'Each person has exactly one item of every category, and no two people share one. Use the clues to mark the grids: ✗ rules a pair out, ✓ confirms it. Floor 1 is the lowest floor; the puzzle is solved when every correct ✓ is in place.',
    'difficulty.easy': 'Easy (3 people, 3 categories)',
    'difficulty.medium': 'Medium (4 people, 3 categories)',
    'difficulty.hard': 'Hard (5 people, 4 categories)',
    'floor.item': 'Floor {n}',
    'subject.person': '{name}',
    'subject.floor': 'the person on floor {n}',
    'clue.same': '{a} is {b}.',
    'clue.notSame': '{a} is not {b}.',
    'clue.directlyAbove': '{a} lives exactly one floor above {b}.',
    'clue.above': '{a} lives on a higher floor than {b}.',
    'clue.nextTo': '{a} and {b} live on neighbouring floors.',
    'clue.eitherOr': '{a} is either {b} or {c}.',
    'clues.heading': 'Clues',
    'clues.help': 'Tap a clue to cross it out once you have used it.',
    'grids.heading': 'Grids',
    'grid.help': 'Tap a cell to cycle it: empty → ✗ (ruled out) → ✓ (confirmed) → empty.',
    'block.label': '{rows} × {columns}',
    'cell.unknown': '{row} and {col}: open',
    'cell.no': '{row} and {col}: ✗ ruled out',
    'cell.yes': '{row} and {col}: ✓ confirmed',
    'action.autoExclude': 'Auto-✗: placing ✓ rules out the rest of its row and column',
    'check.help': 'Check counts how many of your marks contradict the solution, without saying which.',
    'check.none': 'No contradictions so far.',
    'check.result': 'Marks that contradict the solution: {count}.',
    'status.progress': '✓ placed: {count} of {total}',
    'status.solved': 'Solved! Moves: {moves}.',
    'status.undone': 'Last change undone.',
    'result.completed': 'Every ✓ is in place – the puzzle is solved.',
    'keys.help': 'Keyboard: Tab moves between grids, arrow keys move within a grid, Space or Enter cycles a cell, Delete clears it.'
  },
  categories: ['Name', 'Floor', 'Pet', 'Drink', 'Colour'],
  names: ['Ben', 'Clara', 'David', 'Felix', 'Lena', 'Mia', 'Noah', 'Sara'],
  items: {
    pet: ['Cat', 'Dog', 'Bird', 'Fish', 'Rabbit', 'Turtle'],
    drink: ['Tea', 'Coffee', 'Milk', 'Juice', 'Water', 'Cocoa'],
    colour: ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White']
  },
  subjects: {
    pet: ['the person with the cat', 'the person with the dog', 'the person with the bird', 'the person with the fish', 'the person with the rabbit', 'the person with the turtle'],
    drink: ['the tea drinker', 'the coffee drinker', 'the milk drinker', 'the juice drinker', 'the water drinker', 'the cocoa drinker'],
    colour: ['the person in red', 'the person in blue', 'the person in green', 'the person in yellow', 'the person in black', 'the person in white']
  }
});

const de = build({
  ui: {
    title: 'Logikgitter',
    tagline: 'Kombiniere die Hinweise und finde heraus, wer wo wohnt und was hat.',
    rules: 'Jede Person hat aus jeder Kategorie genau ein Element, und keine zwei Personen teilen eines. Markiere mithilfe der Hinweise die Raster: ✗ schließt ein Paar aus, ✓ bestätigt es. Etage 1 ist die unterste; gelöst ist das Rätsel, wenn jedes richtige ✓ gesetzt ist.',
    'difficulty.easy': 'Leicht (3 Personen, 3 Kategorien)',
    'difficulty.medium': 'Mittel (4 Personen, 3 Kategorien)',
    'difficulty.hard': 'Schwer (5 Personen, 4 Kategorien)',
    'floor.item': 'Etage {n}',
    'subject.person': '{name}',
    'subject.floor': 'die Person auf Etage {n}',
    'clue.same': '{a} ist {b}.',
    'clue.notSame': '{a} ist nicht {b}.',
    'clue.directlyAbove': '{a} wohnt genau eine Etage höher als {b}.',
    'clue.above': '{a} wohnt weiter oben als {b}.',
    'clue.nextTo': '{a} und {b} wohnen auf benachbarten Etagen.',
    'clue.eitherOr': '{a} ist entweder {b} oder {c}.',
    'clues.heading': 'Hinweise',
    'clues.help': 'Tippe auf einen Hinweis, um ihn durchzustreichen, sobald du ihn verwendet hast.',
    'grids.heading': 'Raster',
    'grid.help': 'Tippe auf ein Feld, um es weiterzuschalten: leer → ✗ (ausgeschlossen) → ✓ (bestätigt) → leer.',
    'block.label': '{rows} × {columns}',
    'cell.unknown': '{row} und {col}: offen',
    'cell.no': '{row} und {col}: ✗ ausgeschlossen',
    'cell.yes': '{row} und {col}: ✓ bestätigt',
    'action.autoExclude': 'Auto-✗: Ein ✓ schließt den Rest seiner Zeile und Spalte aus',
    'check.help': 'Prüfen zählt, wie viele deiner Markierungen der Lösung widersprechen, ohne zu verraten, welche.',
    'check.none': 'Bisher keine Widersprüche.',
    'check.result': 'Markierungen, die der Lösung widersprechen: {count}.',
    'status.progress': '✓ gesetzt: {count} von {total}',
    'status.solved': 'Gelöst! Züge: {moves}.',
    'status.undone': 'Letzte Änderung rückgängig gemacht.',
    'result.completed': 'Jedes ✓ sitzt – das Rätsel ist gelöst.',
    'keys.help': 'Tastatur: Tab wechselt zwischen den Rastern, Pfeiltasten bewegen sich im Raster, Leertaste oder Enter schaltet ein Feld weiter, Entf leert es.'
  },
  categories: ['Name', 'Etage', 'Haustier', 'Getränk', 'Farbe'],
  names: ['Ben', 'Clara', 'David', 'Felix', 'Lena', 'Mia', 'Noah', 'Sara'],
  items: {
    pet: ['Katze', 'Hund', 'Vogel', 'Fisch', 'Kaninchen', 'Schildkröte'],
    drink: ['Tee', 'Kaffee', 'Milch', 'Saft', 'Wasser', 'Kakao'],
    colour: ['Rot', 'Blau', 'Grün', 'Gelb', 'Schwarz', 'Weiß']
  },
  subjects: {
    pet: ['die Person mit der Katze', 'die Person mit dem Hund', 'die Person mit dem Vogel', 'die Person mit dem Fisch', 'die Person mit dem Kaninchen', 'die Person mit der Schildkröte'],
    drink: ['die Tee trinkende Person', 'die Kaffee trinkende Person', 'die Milch trinkende Person', 'die Saft trinkende Person', 'die Wasser trinkende Person', 'die Kakao trinkende Person'],
    colour: ['die Person in Rot', 'die Person in Blau', 'die Person in Grün', 'die Person in Gelb', 'die Person in Schwarz', 'die Person in Weiß']
  }
});

const nl = build({
  ui: {
    title: 'Logicaraster',
    tagline: 'Combineer de aanwijzingen en ontdek wie waar woont en wat heeft.',
    rules: 'Iedere persoon heeft uit elke categorie precies één ding, en geen twee personen delen er een. Markeer met de aanwijzingen de rasters: ✗ sluit een paar uit, ✓ bevestigt het. Verdieping 1 is de laagste; de puzzel is opgelost als elk juist ✓ staat.',
    'difficulty.easy': 'Makkelijk (3 personen, 3 categorieën)',
    'difficulty.medium': 'Gemiddeld (4 personen, 3 categorieën)',
    'difficulty.hard': 'Moeilijk (5 personen, 4 categorieën)',
    'floor.item': 'Verdieping {n}',
    'subject.person': '{name}',
    'subject.floor': 'de persoon op verdieping {n}',
    'clue.same': '{a} is {b}.',
    'clue.notSame': '{a} is niet {b}.',
    'clue.directlyAbove': '{a} woont precies één verdieping hoger dan {b}.',
    'clue.above': '{a} woont hoger dan {b}.',
    'clue.nextTo': '{a} en {b} wonen op aangrenzende verdiepingen.',
    'clue.eitherOr': '{a} is ofwel {b}, ofwel {c}.',
    'clues.heading': 'Aanwijzingen',
    'clues.help': 'Tik op een aanwijzing om die door te strepen zodra je hem hebt gebruikt.',
    'grids.heading': 'Rasters',
    'grid.help': 'Tik op een vakje om het te wisselen: leeg → ✗ (uitgesloten) → ✓ (bevestigd) → leeg.',
    'block.label': '{rows} × {columns}',
    'cell.unknown': '{row} en {col}: open',
    'cell.no': '{row} en {col}: ✗ uitgesloten',
    'cell.yes': '{row} en {col}: ✓ bevestigd',
    'action.autoExclude': 'Auto-✗: een ✓ sluit de rest van de rij en kolom uit',
    'check.help': 'Controleren telt hoeveel van je markeringen de oplossing tegenspreken, zonder te zeggen welke.',
    'check.none': 'Tot nu toe geen tegenstrijdigheden.',
    'check.result': 'Markeringen die de oplossing tegenspreken: {count}.',
    'status.progress': '✓ geplaatst: {count} van {total}',
    'status.solved': 'Opgelost! Zetten: {moves}.',
    'status.undone': 'Laatste wijziging ongedaan gemaakt.',
    'result.completed': 'Elk ✓ staat goed – de puzzel is opgelost.',
    'keys.help': 'Toetsenbord: Tab gaat naar het volgende raster, pijltjestoetsen bewegen binnen een raster, spatie of Enter wisselt een vakje, Delete maakt het leeg.'
  },
  categories: ['Naam', 'Verdieping', 'Huisdier', 'Drankje', 'Kleur'],
  names: ['Ben', 'Clara', 'David', 'Felix', 'Lena', 'Mia', 'Noah', 'Sara'],
  items: {
    pet: ['Kat', 'Hond', 'Vogel', 'Vis', 'Konijn', 'Schildpad'],
    drink: ['Thee', 'Koffie', 'Melk', 'Sap', 'Water', 'Cacao'],
    colour: ['Rood', 'Blauw', 'Groen', 'Geel', 'Zwart', 'Wit']
  },
  subjects: {
    pet: ['de persoon met de kat', 'de persoon met de hond', 'de persoon met de vogel', 'de persoon met de vis', 'de persoon met het konijn', 'de persoon met de schildpad'],
    drink: ['de theedrinker', 'de koffiedrinker', 'de melkdrinker', 'de sapdrinker', 'de waterdrinker', 'de cacaodrinker'],
    colour: ['de persoon in het rood', 'de persoon in het blauw', 'de persoon in het groen', 'de persoon in het geel', 'de persoon in het zwart', 'de persoon in het wit']
  }
});

const es = build({
  ui: {
    title: 'Cuadrícula lógica',
    tagline: 'Combina las pistas para averiguar quién vive dónde y qué tiene.',
    rules: 'Cada persona tiene exactamente un elemento de cada categoría y nadie comparte ninguno. Usa las pistas para marcar las cuadrículas: ✗ descarta una pareja, ✓ la confirma. El piso 1 es el más bajo; el acertijo está resuelto cuando todos los ✓ correctos están puestos.',
    'difficulty.easy': 'Fácil (3 personas, 3 categorías)',
    'difficulty.medium': 'Media (4 personas, 3 categorías)',
    'difficulty.hard': 'Difícil (5 personas, 4 categorías)',
    'floor.item': 'Piso {n}',
    'subject.person': '{name}',
    'subject.floor': 'la persona del piso {n}',
    'clue.same': '{a} es {b}.',
    'clue.notSame': '{a} no es {b}.',
    'clue.directlyAbove': '{a} vive exactamente un piso más arriba que {b}.',
    'clue.above': '{a} vive en un piso más alto que {b}.',
    'clue.nextTo': '{a} y {b} viven en pisos contiguos.',
    'clue.eitherOr': '{a} es o bien {b}, o bien {c}.',
    'clues.heading': 'Pistas',
    'clues.help': 'Toca una pista para tacharla cuando ya la hayas usado.',
    'grids.heading': 'Cuadrículas',
    'grid.help': 'Toca una casilla para cambiarla: vacía → ✗ (descartada) → ✓ (confirmada) → vacía.',
    'block.label': '{rows} × {columns}',
    'cell.unknown': '{row} y {col}: abierta',
    'cell.no': '{row} y {col}: ✗ descartada',
    'cell.yes': '{row} y {col}: ✓ confirmada',
    'action.autoExclude': 'Auto-✗: al poner ✓ se descarta el resto de su fila y columna',
    'check.help': 'Comprobar cuenta cuántas de tus marcas contradicen la solución, sin decir cuáles.',
    'check.none': 'Por ahora no hay contradicciones.',
    'check.result': 'Marcas que contradicen la solución: {count}.',
    'status.progress': '✓ puestos: {count} de {total}',
    'status.solved': '¡Resuelto! Movimientos: {moves}.',
    'status.undone': 'Último cambio deshecho.',
    'result.completed': 'Todos los ✓ están en su sitio: el acertijo está resuelto.',
    'keys.help': 'Teclado: Tab pasa de una cuadrícula a otra, las flechas se mueven dentro de una cuadrícula, Espacio o Intro cambia una casilla y Supr la vacía.'
  },
  categories: ['Nombre', 'Piso', 'Mascota', 'Bebida', 'Color'],
  names: ['Ben', 'Clara', 'David', 'Félix', 'Lena', 'Mía', 'Noah', 'Sara'],
  items: {
    pet: ['Gato', 'Perro', 'Pájaro', 'Pez', 'Conejo', 'Tortuga'],
    drink: ['Té', 'Café', 'Leche', 'Jugo', 'Agua', 'Cacao'],
    colour: ['Rojo', 'Azul', 'Verde', 'Amarillo', 'Negro', 'Blanco']
  },
  subjects: {
    pet: ['la persona que tiene el gato', 'la persona que tiene el perro', 'la persona que tiene el pájaro', 'la persona que tiene el pez', 'la persona que tiene el conejo', 'la persona que tiene la tortuga'],
    drink: ['la persona que bebe té', 'la persona que bebe café', 'la persona que bebe leche', 'la persona que bebe jugo', 'la persona que bebe agua', 'la persona que bebe cacao'],
    colour: ['la persona vestida de rojo', 'la persona vestida de azul', 'la persona vestida de verde', 'la persona vestida de amarillo', 'la persona vestida de negro', 'la persona vestida de blanco']
  }
});

const fr = build({
  ui: {
    title: 'Grille logique',
    tagline: 'Combinez les indices pour trouver qui habite où et qui a quoi.',
    rules: 'Chaque personne a exactement un élément de chaque catégorie, et deux personnes n’en partagent jamais. Marquez les grilles à l’aide des indices : ✗ exclut une paire, ✓ la confirme. L’étage 1 est le plus bas ; l’énigme est résolue quand chaque ✓ correct est placé.',
    'difficulty.easy': 'Facile (3 personnes, 3 catégories)',
    'difficulty.medium': 'Moyen (4 personnes, 3 catégories)',
    'difficulty.hard': 'Difficile (5 personnes, 4 catégories)',
    'floor.item': 'Étage {n}',
    'subject.person': '{name}',
    'subject.floor': 'la personne de l’étage {n}',
    'clue.same': '{a} est {b}.',
    'clue.notSame': '{a} n’est pas {b}.',
    'clue.directlyAbove': '{a} habite exactement un étage au-dessus de {b}.',
    'clue.above': '{a} habite plus haut que {b}.',
    'clue.nextTo': '{a} et {b} habitent à des étages voisins.',
    'clue.eitherOr': '{a} est soit {b}, soit {c}.',
    'clues.heading': 'Indices',
    'clues.help': 'Touchez un indice pour le barrer une fois utilisé.',
    'grids.heading': 'Grilles',
    'grid.help': 'Touchez une case pour la faire changer : vide → ✗ (exclue) → ✓ (confirmée) → vide.',
    'block.label': '{rows} × {columns}',
    'cell.unknown': '{row} et {col} : ouverte',
    'cell.no': '{row} et {col} : ✗ exclue',
    'cell.yes': '{row} et {col} : ✓ confirmée',
    'action.autoExclude': 'Auto-✗ : placer un ✓ exclut le reste de sa ligne et de sa colonne',
    'check.help': 'Vérifier compte combien de vos marques contredisent la solution, sans dire lesquelles.',
    'check.none': 'Aucune contradiction pour l’instant.',
    'check.result': 'Marques qui contredisent la solution : {count}.',
    'status.progress': '✓ placés : {count} sur {total}',
    'status.solved': 'Résolu ! Coups : {moves}.',
    'status.undone': 'Dernière modification annulée.',
    'result.completed': 'Chaque ✓ est en place : l’énigme est résolue.',
    'keys.help': 'Clavier : Tab passe d’une grille à l’autre, les flèches se déplacent dans une grille, Espace ou Entrée change une case, Suppr la vide.'
  },
  categories: ['Prénom', 'Étage', 'Animal', 'Boisson', 'Couleur'],
  names: ['Ben', 'Clara', 'David', 'Félix', 'Léna', 'Mia', 'Noah', 'Sara'],
  items: {
    pet: ['Chat', 'Chien', 'Oiseau', 'Poisson', 'Lapin', 'Tortue'],
    drink: ['Thé', 'Café', 'Lait', 'Jus', 'Eau', 'Cacao'],
    colour: ['Rouge', 'Bleu', 'Vert', 'Jaune', 'Noir', 'Blanc']
  },
  subjects: {
    pet: ['la personne qui a le chat', 'la personne qui a le chien', 'la personne qui a l’oiseau', 'la personne qui a le poisson', 'la personne qui a le lapin', 'la personne qui a la tortue'],
    drink: ['la personne qui boit du thé', 'la personne qui boit du café', 'la personne qui boit du lait', 'la personne qui boit du jus', 'la personne qui boit de l’eau', 'la personne qui boit du cacao'],
    colour: ['la personne en rouge', 'la personne en bleu', 'la personne en vert', 'la personne en jaune', 'la personne en noir', 'la personne en blanc']
  }
});

const ru = build({
  ui: {
    title: 'Логическая сетка',
    tagline: 'Сопоставьте подсказки и выясните, кто где живёт и у кого что есть.',
    rules: 'У каждого человека ровно один элемент из каждой категории, и ни один элемент не принадлежит двоим. Отмечайте в сетках с помощью подсказок: ✗ исключает пару, ✓ подтверждает её. Этаж 1 — самый нижний; головоломка решена, когда все верные ✓ на своих местах.',
    'difficulty.easy': 'Легко (3 человека, 3 категории)',
    'difficulty.medium': 'Средне (4 человека, 3 категории)',
    'difficulty.hard': 'Сложно (5 человек, 4 категории)',
    'floor.item': 'Этаж {n}',
    'subject.person': '{name}',
    'subject.floor': 'жилец этажа {n}',
    'clue.same': '{a} — это {b}.',
    'clue.notSame': '{a} — это не {b}.',
    'clue.directlyAbove': '{a} живёт ровно на один этаж выше, чем {b}.',
    'clue.above': '{a} живёт выше, чем {b}.',
    'clue.nextTo': '{a} и {b} живут на соседних этажах.',
    'clue.eitherOr': '{a} — это либо {b}, либо {c}.',
    'clues.heading': 'Подсказки',
    'clues.help': 'Нажмите на подсказку, чтобы зачеркнуть её, когда она уже использована.',
    'grids.heading': 'Сетки',
    'grid.help': 'Нажимайте на клетку, чтобы переключать её: пусто → ✗ (исключено) → ✓ (подтверждено) → пусто.',
    'block.label': '{rows} × {columns}',
    'cell.unknown': '{row} и {col}: не отмечено',
    'cell.no': '{row} и {col}: ✗ исключено',
    'cell.yes': '{row} и {col}: ✓ подтверждено',
    'action.autoExclude': 'Авто-✗: ✓ исключает остальную часть строки и столбца',
    'check.help': 'Проверка считает, сколько ваших отметок противоречат решению, не называя, какие именно.',
    'check.none': 'Пока противоречий нет.',
    'check.result': 'Отметок, противоречащих решению: {count}.',
    'status.progress': 'Поставлено ✓: {count} из {total}',
    'status.solved': 'Решено! Ходов: {moves}.',
    'status.undone': 'Последнее изменение отменено.',
    'result.completed': 'Все ✓ на своих местах — головоломка решена.',
    'keys.help': 'Клавиатура: Tab переходит между сетками, стрелки перемещают внутри сетки, Пробел или Enter переключают клетку, Delete очищает её.'
  },
  categories: ['Имя', 'Этаж', 'Питомец', 'Напиток', 'Цвет'],
  names: ['Бен', 'Клара', 'Давид', 'Феликс', 'Лена', 'Мия', 'Ноа', 'Сара'],
  items: {
    pet: ['Кошка', 'Собака', 'Птица', 'Рыбка', 'Кролик', 'Черепаха'],
    drink: ['Чай', 'Кофе', 'Молоко', 'Сок', 'Вода', 'Какао'],
    colour: ['Красный', 'Синий', 'Зелёный', 'Жёлтый', 'Чёрный', 'Белый']
  },
  subjects: {
    pet: ['человек с кошкой', 'человек с собакой', 'человек с птицей', 'человек с рыбкой', 'человек с кроликом', 'человек с черепахой'],
    drink: ['любитель чая', 'любитель кофе', 'любитель молока', 'любитель сока', 'любитель воды', 'любитель какао'],
    colour: ['человек в красном', 'человек в синем', 'человек в зелёном', 'человек в жёлтом', 'человек в чёрном', 'человек в белом']
  }
});

const zhHans = build({
  ui: {
    title: '逻辑网格',
    tagline: '综合各条线索，推断出谁住在哪里、拥有什么。',
    rules: '每个人在每个类别中恰好拥有一项，且任何两人都不重复。根据线索在网格中标记：✗ 表示排除这一组合，✓ 表示确认。1 楼是最低的一层；所有正确的 ✓ 都放好时，谜题即告解开。',
    'difficulty.easy': '简单（3 人，3 个类别）',
    'difficulty.medium': '中等（4 人，3 个类别）',
    'difficulty.hard': '困难（5 人，4 个类别）',
    'floor.item': '{n} 楼',
    'subject.person': '{name}',
    'subject.floor': '住在 {n} 楼的人',
    'clue.same': '{a}就是{b}。',
    'clue.notSame': '{a}不是{b}。',
    'clue.directlyAbove': '{a}住的楼层正好比{b}高一层。',
    'clue.above': '{a}住得比{b}高。',
    'clue.nextTo': '{a}和{b}住在相邻的楼层。',
    'clue.eitherOr': '{a}要么是{b}，要么是{c}。',
    'clues.heading': '线索',
    'clues.help': '用过某条线索后，点按它即可划掉。',
    'grids.heading': '网格',
    'grid.help': '点按格子可依次切换：空白 → ✗（排除）→ ✓（确认）→ 空白。',
    'block.label': '{rows} × {columns}',
    'cell.unknown': '{row} 与 {col}：未标记',
    'cell.no': '{row} 与 {col}：✗ 已排除',
    'cell.yes': '{row} 与 {col}：✓ 已确认',
    'action.autoExclude': '自动 ✗：放置 ✓ 时，自动排除同一行和同一列的其余格子',
    'check.help': '“检查”会统计有多少标记与答案矛盾，但不会指出是哪些。',
    'check.none': '目前没有矛盾。',
    'check.result': '与答案矛盾的标记：{count} 个。',
    'status.progress': '已放置 ✓：{count} / {total}',
    'status.solved': '已解开！步数：{moves}。',
    'status.undone': '已撤销上一次更改。',
    'result.completed': '所有 ✓ 都已就位，谜题已解开。',
    'keys.help': '键盘：Tab 在网格之间切换，方向键在网格内移动，空格或回车切换格子，Delete 清除。'
  },
  categories: ['名字', '楼层', '宠物', '饮料', '颜色'],
  names: ['本', '克拉拉', '大卫', '费利克斯', '莉娜', '米娅', '诺亚', '萨拉'],
  items: {
    pet: ['猫', '狗', '鸟', '鱼', '兔子', '乌龟'],
    drink: ['茶', '咖啡', '牛奶', '果汁', '水', '可可'],
    colour: ['红色', '蓝色', '绿色', '黄色', '黑色', '白色']
  },
  subjects: {
    pet: ['养猫的人', '养狗的人', '养鸟的人', '养鱼的人', '养兔子的人', '养乌龟的人'],
    drink: ['喝茶的人', '喝咖啡的人', '喝牛奶的人', '喝果汁的人', '喝水的人', '喝可可的人'],
    colour: ['穿红衣服的人', '穿蓝衣服的人', '穿绿衣服的人', '穿黄衣服的人', '穿黑衣服的人', '穿白衣服的人']
  }
});

const ko = build({
  ui: {
    title: '논리 격자',
    tagline: '단서를 종합해 누가 어디에 살고 무엇을 가졌는지 알아내세요.',
    rules: '각 사람은 모든 범주에서 정확히 하나씩 가지며, 두 사람이 같은 것을 가지지 않습니다. 단서를 이용해 격자에 표시하세요. ✗는 조합을 제외하고 ✓는 확정합니다. 1층이 가장 낮은 층이며, 올바른 ✓가 모두 놓이면 퍼즐이 풀립니다.',
    'difficulty.easy': '쉬움 (3명, 3개 범주)',
    'difficulty.medium': '보통 (4명, 3개 범주)',
    'difficulty.hard': '어려움 (5명, 4개 범주)',
    'floor.item': '{n}층',
    'subject.person': '{name} 님',
    'subject.floor': '{n}층에 사는 사람',
    'clue.same': '{a}은 {b}입니다.',
    'clue.notSame': '{a}은 {b}이 아닙니다.',
    'clue.directlyAbove': '{a}은 {b}보다 정확히 한 층 위에 삽니다.',
    'clue.above': '{a}은 {b}보다 높은 층에 삽니다.',
    'clue.nextTo': '{a}과 {b}은 이웃한 층에 삽니다.',
    'clue.eitherOr': '{a}은 {b}이거나 {c}입니다.',
    'clues.heading': '단서',
    'clues.help': '사용한 단서는 눌러서 지울 수 있습니다.',
    'grids.heading': '격자',
    'grid.help': '칸을 누르면 순서대로 바뀝니다: 빈칸 → ✗(제외) → ✓(확정) → 빈칸.',
    'block.label': '{rows} × {columns}',
    'cell.unknown': '{row}, {col}: 미표시',
    'cell.no': '{row}, {col}: ✗ 제외',
    'cell.yes': '{row}, {col}: ✓ 확정',
    'action.autoExclude': '자동 ✗: ✓를 놓으면 같은 행과 열의 나머지 칸을 제외합니다',
    'check.help': '확인은 정답과 모순되는 표시가 몇 개인지만 알려 주고, 어느 것인지는 알려 주지 않습니다.',
    'check.none': '아직 모순이 없습니다.',
    'check.result': '정답과 모순되는 표시: {count}개.',
    'status.progress': '놓은 ✓: {count} / {total}',
    'status.solved': '해결했습니다! 이동 수: {moves}.',
    'status.undone': '마지막 변경을 취소했습니다.',
    'result.completed': '모든 ✓가 제자리에 있습니다. 퍼즐을 풀었습니다.',
    'keys.help': '키보드: Tab으로 격자 사이를 이동하고, 방향키로 격자 안에서 이동하며, 스페이스나 Enter로 칸을 바꾸고, Delete로 지웁니다.'
  },
  categories: ['이름', '층', '반려동물', '음료', '색'],
  names: ['벤', '클라라', '다비드', '펠릭스', '레나', '미아', '노아', '사라'],
  items: {
    pet: ['고양이', '개', '새', '물고기', '토끼', '거북'],
    drink: ['차', '커피', '우유', '주스', '물', '코코아'],
    colour: ['빨간색', '파란색', '초록색', '노란색', '검은색', '흰색']
  },
  subjects: {
    pet: ['고양이를 키우는 사람', '개를 키우는 사람', '새를 키우는 사람', '물고기를 키우는 사람', '토끼를 키우는 사람', '거북을 키우는 사람'],
    drink: ['차를 마시는 사람', '커피를 마시는 사람', '우유를 마시는 사람', '주스를 마시는 사람', '물을 마시는 사람', '코코아를 마시는 사람'],
    colour: ['빨간 옷을 입은 사람', '파란 옷을 입은 사람', '초록 옷을 입은 사람', '노란 옷을 입은 사람', '검은 옷을 입은 사람', '흰 옷을 입은 사람']
  }
});

const ja = build({
  ui: {
    title: 'ロジックグリッド',
    tagline: '手がかりを組み合わせて、誰がどこに住み、何を持っているかを突き止めよう。',
    rules: 'どの人も各カテゴリーからちょうど1つずつ持ち、2人が同じものを持つことはありません。手がかりをもとにグリッドに印を付けましょう。✗ は組み合わせを除外し、✓ は確定します。1階がいちばん下の階です。正しい ✓ がすべて置かれたら解けたことになります。',
    'difficulty.easy': 'やさしい（3人・3カテゴリー）',
    'difficulty.medium': 'ふつう（4人・3カテゴリー）',
    'difficulty.hard': 'むずかしい（5人・4カテゴリー）',
    'floor.item': '{n}階',
    'subject.person': '{name}さん',
    'subject.floor': '{n}階に住む人',
    'clue.same': '{a}は{b}です。',
    'clue.notSame': '{a}は{b}ではありません。',
    'clue.directlyAbove': '{a}は{b}のちょうど1つ上の階に住んでいます。',
    'clue.above': '{a}は{b}より上の階に住んでいます。',
    'clue.nextTo': '{a}と{b}は隣り合った階に住んでいます。',
    'clue.eitherOr': '{a}は{b}か{c}のどちらかです。',
    'clues.heading': '手がかり',
    'clues.help': '使い終わった手がかりはタップすると線で消せます。',
    'grids.heading': 'グリッド',
    'grid.help': 'マスをタップすると切り替わります：空白 → ✗（除外）→ ✓（確定）→ 空白。',
    'block.label': '{rows} × {columns}',
    'cell.unknown': '{row}と{col}：未記入',
    'cell.no': '{row}と{col}：✗ 除外',
    'cell.yes': '{row}と{col}：✓ 確定',
    'action.autoExclude': '自動 ✗：✓ を置くと、同じ行と列の残りを除外します',
    'check.help': 'チェックは、答えと矛盾する印の数だけを教えます。どれかは教えません。',
    'check.none': '今のところ矛盾はありません。',
    'check.result': '答えと矛盾する印：{count}個。',
    'status.progress': '置いた ✓：{count} / {total}',
    'status.solved': '解けました！手数：{moves}。',
    'status.undone': '直前の変更を取り消しました。',
    'result.completed': 'すべての ✓ がそろいました。パズルは解けました。',
    'keys.help': 'キーボード：Tab でグリッド間を移動、矢印キーでグリッド内を移動、スペースか Enter でマスを切り替え、Delete で消去します。'
  },
  categories: ['名前', '階', 'ペット', '飲み物', '色'],
  names: ['ベン', 'クララ', 'ダビド', 'フェリックス', 'レナ', 'ミア', 'ノア', 'サラ'],
  items: {
    pet: ['ネコ', 'イヌ', '鳥', '魚', 'ウサギ', 'カメ'],
    drink: ['お茶', 'コーヒー', '牛乳', 'ジュース', '水', 'ココア'],
    colour: ['赤', '青', '緑', '黄', '黒', '白']
  },
  subjects: {
    pet: ['ネコを飼っている人', 'イヌを飼っている人', '鳥を飼っている人', '魚を飼っている人', 'ウサギを飼っている人', 'カメを飼っている人'],
    drink: ['お茶を飲む人', 'コーヒーを飲む人', '牛乳を飲む人', 'ジュースを飲む人', '水を飲む人', 'ココアを飲む人'],
    colour: ['赤い服の人', '青い服の人', '緑の服の人', '黄色い服の人', '黒い服の人', '白い服の人']
  }
});

const ar = build({
  ui: {
    title: 'شبكة المنطق',
    tagline: 'اجمع بين الأدلة لتعرف من يسكن أين ومن يملك ماذا.',
    rules: 'لكل شخص عنصر واحد بالضبط من كل فئة، ولا يشترك شخصان في عنصر. استخدم الأدلة لتعليم الشبكات: ✗ تستبعد الزوج و✓ تؤكده. الطابق 1 هو الأدنى، وتُحل الأحجية عندما توضع كل علامات ✓ الصحيحة.',
    'difficulty.easy': 'سهل (3 أشخاص، 3 فئات)',
    'difficulty.medium': 'متوسط (4 أشخاص، 3 فئات)',
    'difficulty.hard': 'صعب (5 أشخاص، 4 فئات)',
    'floor.item': 'الطابق {n}',
    'subject.person': '{name}',
    'subject.floor': 'ساكن الطابق {n}',
    'clue.same': '{a} و{b} هما الشخص نفسه.',
    'clue.notSame': '{a} و{b} شخصان مختلفان.',
    'clue.directlyAbove': 'طابق {a} يعلو طابق {b} مباشرةً.',
    'clue.above': 'طابق {a} أعلى من طابق {b}.',
    'clue.nextTo': 'طابق {a} وطابق {b} متجاوران.',
    'clue.eitherOr': '{a} إمّا {b} وإمّا {c}.',
    'clues.heading': 'الأدلة',
    'clues.help': 'المس دليلًا لشطبه بعد أن تستخدمه.',
    'grids.heading': 'الشبكات',
    'grid.help': 'المس خانة لتبديلها: فارغة ← ✗ (مستبعدة) ← ✓ (مؤكدة) ← فارغة.',
    'block.label': '{rows} × {columns}',
    'cell.unknown': '{row} و{col}: غير معلَّمة',
    'cell.no': '{row} و{col}: ✗ مستبعدة',
    'cell.yes': '{row} و{col}: ✓ مؤكدة',
    'action.autoExclude': '✗ تلقائية: وضع ✓ يستبعد بقية صفّها وعمودها',
    'check.help': 'يحسب التحقق عدد علاماتك التي تناقض الحل، دون أن يحدد أيها.',
    'check.none': 'لا تناقضات حتى الآن.',
    'check.result': 'العلامات التي تناقض الحل: {count}.',
    'status.progress': 'علامات ✓ الموضوعة: {count} من {total}',
    'status.solved': 'تم الحل! عدد الحركات: {moves}.',
    'status.undone': 'تم التراجع عن آخر تغيير.',
    'result.completed': 'كل علامات ✓ في مكانها، وقد حُلّت الأحجية.',
    'keys.help': 'لوحة المفاتيح: Tab للانتقال بين الشبكات، والأسهم للتحرك داخل الشبكة، والمسافة أو Enter لتبديل الخانة، وDelete لمسحها.'
  },
  categories: ['الاسم', 'الطابق', 'الحيوان الأليف', 'المشروب', 'اللون'],
  names: ['بن', 'كلارا', 'ديفيد', 'فيليكس', 'لينا', 'ميا', 'نوح', 'سارة'],
  items: {
    pet: ['قطة', 'كلب', 'طائر', 'سمكة', 'أرنب', 'سلحفاة'],
    drink: ['شاي', 'قهوة', 'حليب', 'عصير', 'ماء', 'كاكاو'],
    colour: ['أحمر', 'أزرق', 'أخضر', 'أصفر', 'أسود', 'أبيض']
  },
  subjects: {
    pet: ['صاحب القطة', 'صاحب الكلب', 'صاحب الطائر', 'صاحب السمكة', 'صاحب الأرنب', 'صاحب السلحفاة'],
    drink: ['شارب الشاي', 'شارب القهوة', 'شارب الحليب', 'شارب العصير', 'شارب الماء', 'شارب الكاكاو'],
    colour: ['مرتدي الأحمر', 'مرتدي الأزرق', 'مرتدي الأخضر', 'مرتدي الأصفر', 'مرتدي الأسود', 'مرتدي الأبيض']
  }
});

const pt = build({
  ui: {
    title: 'Grade lógica',
    tagline: 'Combine as pistas para descobrir quem mora onde e quem tem o quê.',
    rules: 'Cada pessoa tem exatamente um item de cada categoria, e duas pessoas nunca partilham o mesmo. Use as pistas para marcar as grades: ✗ exclui um par, ✓ confirma-o. O andar 1 é o mais baixo; o enigma está resolvido quando todos os ✓ corretos estiverem colocados.',
    'difficulty.easy': 'Fácil (3 pessoas, 3 categorias)',
    'difficulty.medium': 'Médio (4 pessoas, 3 categorias)',
    'difficulty.hard': 'Difícil (5 pessoas, 4 categorias)',
    'floor.item': 'Andar {n}',
    'subject.person': '{name}',
    'subject.floor': 'a pessoa do andar {n}',
    'clue.same': '{a} é {b}.',
    'clue.notSame': '{a} não é {b}.',
    'clue.directlyAbove': '{a} mora exatamente um andar mais alto do que {b}.',
    'clue.above': '{a} mora num andar mais alto do que {b}.',
    'clue.nextTo': '{a} e {b} moram em andares vizinhos.',
    'clue.eitherOr': '{a} é ou {b} ou {c}.',
    'clues.heading': 'Pistas',
    'clues.help': 'Toque numa pista para riscá-la depois de usá-la.',
    'grids.heading': 'Grades',
    'grid.help': 'Toque numa casa para alterná-la: vazia → ✗ (excluída) → ✓ (confirmada) → vazia.',
    'block.label': '{rows} × {columns}',
    'cell.unknown': '{row} e {col}: em aberto',
    'cell.no': '{row} e {col}: ✗ excluída',
    'cell.yes': '{row} e {col}: ✓ confirmada',
    'action.autoExclude': 'Auto-✗: colocar ✓ exclui o resto da sua linha e coluna',
    'check.help': 'Verificar conta quantas das suas marcas contradizem a solução, sem dizer quais.',
    'check.none': 'Até agora, nenhuma contradição.',
    'check.result': 'Marcas que contradizem a solução: {count}.',
    'status.progress': '✓ colocados: {count} de {total}',
    'status.solved': 'Resolvido! Jogadas: {moves}.',
    'status.undone': 'Última alteração desfeita.',
    'result.completed': 'Todos os ✓ estão no lugar: o enigma está resolvido.',
    'keys.help': 'Teclado: Tab passa de uma grade para outra, as setas movem dentro de uma grade, Espaço ou Enter alternam uma casa, Delete limpa-a.'
  },
  categories: ['Nome', 'Andar', 'Animal', 'Bebida', 'Cor'],
  names: ['Ben', 'Clara', 'David', 'Félix', 'Lena', 'Mia', 'Noah', 'Sara'],
  items: {
    pet: ['Gato', 'Cão', 'Pássaro', 'Peixe', 'Coelho', 'Tartaruga'],
    drink: ['Chá', 'Café', 'Leite', 'Suco', 'Água', 'Cacau'],
    colour: ['Vermelho', 'Azul', 'Verde', 'Amarelo', 'Preto', 'Branco']
  },
  subjects: {
    pet: ['a pessoa que tem o gato', 'a pessoa que tem o cão', 'a pessoa que tem o pássaro', 'a pessoa que tem o peixe', 'a pessoa que tem o coelho', 'a pessoa que tem a tartaruga'],
    drink: ['a pessoa que bebe chá', 'a pessoa que bebe café', 'a pessoa que bebe leite', 'a pessoa que bebe suco', 'a pessoa que bebe água', 'a pessoa que bebe cacau'],
    colour: ['a pessoa vestida de vermelho', 'a pessoa vestida de azul', 'a pessoa vestida de verde', 'a pessoa vestida de amarelo', 'a pessoa vestida de preto', 'a pessoa vestida de branco']
  }
});

const it = build({
  ui: {
    title: 'Griglia logica',
    tagline: 'Combina gli indizi per scoprire chi abita dove e chi ha cosa.',
    rules: 'Ogni persona ha esattamente un elemento di ogni categoria e nessun elemento è condiviso. Usa gli indizi per segnare le griglie: ✗ esclude una coppia, ✓ la conferma. Il piano 1 è il più basso; il rompicapo è risolto quando ogni ✓ corretto è al suo posto.',
    'difficulty.easy': 'Facile (3 persone, 3 categorie)',
    'difficulty.medium': 'Medio (4 persone, 3 categorie)',
    'difficulty.hard': 'Difficile (5 persone, 4 categorie)',
    'floor.item': 'Piano {n}',
    'subject.person': '{name}',
    'subject.floor': 'la persona al piano {n}',
    'clue.same': '{a} è {b}.',
    'clue.notSame': '{a} non è {b}.',
    'clue.directlyAbove': '{a} abita esattamente un piano sopra {b}.',
    'clue.above': '{a} abita a un piano più alto di quello in cui abita {b}.',
    'clue.nextTo': '{a} e {b} abitano a piani adiacenti.',
    'clue.eitherOr': '{a} è o {b} o {c}.',
    'clues.heading': 'Indizi',
    'clues.help': 'Tocca un indizio per barrarlo quando lo hai usato.',
    'grids.heading': 'Griglie',
    'grid.help': 'Tocca una casella per cambiarla: vuota → ✗ (esclusa) → ✓ (confermata) → vuota.',
    'block.label': '{rows} × {columns}',
    'cell.unknown': '{row} e {col}: da decidere',
    'cell.no': '{row} e {col}: ✗ esclusa',
    'cell.yes': '{row} e {col}: ✓ confermata',
    'action.autoExclude': 'Auto-✗: mettere un ✓ esclude il resto della sua riga e colonna',
    'check.help': 'Verifica conta quanti dei tuoi segni contraddicono la soluzione, senza dire quali.',
    'check.none': 'Finora nessuna contraddizione.',
    'check.result': 'Segni che contraddicono la soluzione: {count}.',
    'status.progress': '✓ messi: {count} su {total}',
    'status.solved': 'Risolto! Mosse: {moves}.',
    'status.undone': 'Ultima modifica annullata.',
    'result.completed': 'Ogni ✓ è al suo posto: il rompicapo è risolto.',
    'keys.help': 'Tastiera: Tab passa da una griglia all’altra, le frecce si muovono nella griglia, Spazio o Invio cambiano una casella, Canc la svuota.'
  },
  categories: ['Nome', 'Piano', 'Animale', 'Bevanda', 'Colore'],
  names: ['Ben', 'Clara', 'Davide', 'Felice', 'Lena', 'Mia', 'Noah', 'Sara'],
  items: {
    pet: ['Gatto', 'Cane', 'Uccello', 'Pesce', 'Coniglio', 'Tartaruga'],
    drink: ['Tè', 'Caffè', 'Latte', 'Succo', 'Acqua', 'Cacao'],
    colour: ['Rosso', 'Blu', 'Verde', 'Giallo', 'Nero', 'Bianco']
  },
  subjects: {
    pet: ['la persona con il gatto', 'la persona con il cane', 'la persona con l’uccello', 'la persona con il pesce', 'la persona con il coniglio', 'la persona con la tartaruga'],
    drink: ['la persona che beve tè', 'la persona che beve caffè', 'la persona che beve latte', 'la persona che beve succo', 'la persona che beve acqua', 'la persona che beve cacao'],
    colour: ['la persona vestita di rosso', 'la persona vestita di blu', 'la persona vestita di verde', 'la persona vestita di giallo', 'la persona vestita di nero', 'la persona vestita di bianco']
  }
});

const pl = build({
  ui: {
    title: 'Siatka logiczna',
    tagline: 'Połącz wskazówki i ustal, kto gdzie mieszka i co ma.',
    rules: 'Każda osoba ma dokładnie jeden element z każdej kategorii i żadne dwie osoby nie mają tego samego. Zaznaczaj w siatkach na podstawie wskazówek: ✗ wyklucza parę, ✓ ją potwierdza. Piętro 1 jest najniższe; zagadka jest rozwiązana, gdy wszystkie poprawne ✓ są na miejscu.',
    'difficulty.easy': 'Łatwy (3 osoby, 3 kategorie)',
    'difficulty.medium': 'Średni (4 osoby, 3 kategorie)',
    'difficulty.hard': 'Trudny (5 osób, 4 kategorie)',
    'floor.item': 'Piętro {n}',
    'subject.person': '{name}',
    'subject.floor': 'osoba z piętra {n}',
    'clue.same': '{a} to {b}.',
    'clue.notSame': '{a} to nie {b}.',
    'clue.directlyAbove': '{a} mieszka dokładnie jedno piętro wyżej niż {b}.',
    'clue.above': '{a} mieszka wyżej niż {b}.',
    'clue.nextTo': '{a} i {b} mieszkają na sąsiednich piętrach.',
    'clue.eitherOr': '{a} to albo {b}, albo {c}.',
    'clues.heading': 'Wskazówki',
    'clues.help': 'Dotknij wskazówki, aby ją skreślić, gdy już ją wykorzystasz.',
    'grids.heading': 'Siatki',
    'grid.help': 'Dotknij pola, aby je przełączyć: puste → ✗ (wykluczone) → ✓ (potwierdzone) → puste.',
    'block.label': '{rows} × {columns}',
    'cell.unknown': '{row} i {col}: nieoznaczone',
    'cell.no': '{row} i {col}: ✗ wykluczone',
    'cell.yes': '{row} i {col}: ✓ potwierdzone',
    'action.autoExclude': 'Auto-✗: postawienie ✓ wyklucza resztę jego wiersza i kolumny',
    'check.help': 'Sprawdzanie liczy, ile Twoich oznaczeń przeczy rozwiązaniu, nie mówiąc, które.',
    'check.none': 'Na razie brak sprzeczności.',
    'check.result': 'Oznaczenia sprzeczne z rozwiązaniem: {count}.',
    'status.progress': 'Postawione ✓: {count} z {total}',
    'status.solved': 'Rozwiązane! Ruchy: {moves}.',
    'status.undone': 'Cofnięto ostatnią zmianę.',
    'result.completed': 'Wszystkie ✓ są na miejscu – zagadka rozwiązana.',
    'keys.help': 'Klawiatura: Tab przechodzi między siatkami, strzałki poruszają się w siatce, spacja lub Enter przełącza pole, Delete je czyści.'
  },
  categories: ['Imię', 'Piętro', 'Zwierzę', 'Napój', 'Kolor'],
  names: ['Ben', 'Klara', 'Dawid', 'Feliks', 'Lena', 'Mia', 'Noah', 'Sara'],
  items: {
    pet: ['Kot', 'Pies', 'Ptak', 'Ryba', 'Królik', 'Żółw'],
    drink: ['Herbata', 'Kawa', 'Mleko', 'Sok', 'Woda', 'Kakao'],
    colour: ['Czerwony', 'Niebieski', 'Zielony', 'Żółty', 'Czarny', 'Biały']
  },
  subjects: {
    pet: ['osoba z kotem', 'osoba z psem', 'osoba z ptakiem', 'osoba z rybą', 'osoba z królikiem', 'osoba z żółwiem'],
    drink: ['osoba pijąca herbatę', 'osoba pijąca kawę', 'osoba pijąca mleko', 'osoba pijąca sok', 'osoba pijąca wodę', 'osoba pijąca kakao'],
    colour: ['osoba ubrana na czerwono', 'osoba ubrana na niebiesko', 'osoba ubrana na zielono', 'osoba ubrana na żółto', 'osoba ubrana na czarno', 'osoba ubrana na biało']
  }
});

const tr = build({
  ui: {
    title: 'Mantık Tablosu',
    tagline: 'İpuçlarını birleştirerek kimin nerede oturduğunu ve neye sahip olduğunu bulun.',
    rules: 'Her kişinin her kategoriden tam olarak bir öğesi vardır ve iki kişi aynı öğeyi paylaşmaz. İpuçlarını kullanarak tabloları işaretleyin: ✗ bir eşleşmeyi eler, ✓ onu doğrular. 1. kat en alttaki kattır; doğru ✓ işaretlerinin hepsi yerleştiğinde bulmaca çözülür.',
    'difficulty.easy': 'Kolay (3 kişi, 3 kategori)',
    'difficulty.medium': 'Orta (4 kişi, 3 kategori)',
    'difficulty.hard': 'Zor (5 kişi, 4 kategori)',
    'floor.item': 'Kat {n}',
    'subject.person': '{name}',
    'subject.floor': '{n}. katta oturan kişi',
    'clue.same': '{a} ile {b} aynı kişidir.',
    'clue.notSame': '{a} ile {b} farklı kişilerdir.',
    'clue.directlyAbove': '{a}, {b} ile kıyaslandığında tam bir kat yukarıda oturuyor.',
    'clue.above': '{a}, {b} ile kıyaslandığında daha yukarıdaki bir katta oturuyor.',
    'clue.nextTo': '{a} ile {b} komşu katlarda oturuyor.',
    'clue.eitherOr': '{a} ya {b} ile ya da {c} ile aynı kişidir.',
    'clues.heading': 'İpuçları',
    'clues.help': 'Kullandığınız bir ipucunun üstünü çizmek için ona dokunun.',
    'grids.heading': 'Tablolar',
    'grid.help': 'Bir kareyi değiştirmek için dokunun: boş → ✗ (elendi) → ✓ (doğrulandı) → boş.',
    'block.label': '{rows} × {columns}',
    'cell.unknown': '{row} ve {col}: işaretsiz',
    'cell.no': '{row} ve {col}: ✗ elendi',
    'cell.yes': '{row} ve {col}: ✓ doğrulandı',
    'action.autoExclude': 'Otomatik ✗: ✓ koymak, satırının ve sütununun geri kalanını eler',
    'check.help': 'Kontrol, işaretlerinizden kaçının çözümle çeliştiğini sayar ama hangileri olduğunu söylemez.',
    'check.none': 'Şimdilik çelişki yok.',
    'check.result': 'Çözümle çelişen işaretler: {count}.',
    'status.progress': 'Konan ✓: {count} / {total}',
    'status.solved': 'Çözüldü! Hamle: {moves}.',
    'status.undone': 'Son değişiklik geri alındı.',
    'result.completed': 'Tüm ✓ işaretleri yerinde; bulmaca çözüldü.',
    'keys.help': 'Klavye: Tab tablolar arasında geçer, ok tuşları tablo içinde hareket eder, Boşluk veya Enter kareyi değiştirir, Delete temizler.'
  },
  categories: ['İsim', 'Kat', 'Evcil hayvan', 'İçecek', 'Renk'],
  names: ['Ben', 'Klara', 'David', 'Feliks', 'Lena', 'Mia', 'Noah', 'Sara'],
  items: {
    pet: ['Kedi', 'Köpek', 'Kuş', 'Balık', 'Tavşan', 'Kaplumbağa'],
    drink: ['Çay', 'Kahve', 'Süt', 'Meyve suyu', 'Su', 'Kakao'],
    colour: ['Kırmızı', 'Mavi', 'Yeşil', 'Sarı', 'Siyah', 'Beyaz']
  },
  subjects: {
    pet: ['kedisi olan kişi', 'köpeği olan kişi', 'kuşu olan kişi', 'balığı olan kişi', 'tavşanı olan kişi', 'kaplumbağası olan kişi'],
    drink: ['çay içen kişi', 'kahve içen kişi', 'süt içen kişi', 'meyve suyu içen kişi', 'su içen kişi', 'kakao içen kişi'],
    colour: ['kırmızı giyen kişi', 'mavi giyen kişi', 'yeşil giyen kişi', 'sarı giyen kişi', 'siyah giyen kişi', 'beyaz giyen kişi']
  }
});

const uk = build({
  ui: {
    title: 'Логічна сітка',
    tagline: 'Зіставте підказки й з’ясуйте, хто де живе і в кого що є.',
    rules: 'Кожна людина має рівно один елемент із кожної категорії, і жоден елемент не належить двом. Позначайте в сітках за підказками: ✗ виключає пару, ✓ підтверджує її. Поверх 1 — найнижчий; головоломку розв’язано, коли всі правильні ✓ на своїх місцях.',
    'difficulty.easy': 'Легко (3 людини, 3 категорії)',
    'difficulty.medium': 'Середньо (4 людини, 3 категорії)',
    'difficulty.hard': 'Складно (5 людей, 4 категорії)',
    'floor.item': 'Поверх {n}',
    'subject.person': '{name}',
    'subject.floor': 'мешканець поверху {n}',
    'clue.same': '{a} — це {b}.',
    'clue.notSame': '{a} — це не {b}.',
    'clue.directlyAbove': '{a} живе рівно на один поверх вище, ніж {b}.',
    'clue.above': '{a} живе вище, ніж {b}.',
    'clue.nextTo': '{a} і {b} живуть на сусідніх поверхах.',
    'clue.eitherOr': '{a} — це або {b}, або {c}.',
    'clues.heading': 'Підказки',
    'clues.help': 'Торкніться підказки, щоб закреслити її, коли вже використали.',
    'grids.heading': 'Сітки',
    'grid.help': 'Торкайтеся клітинки, щоб перемикати її: порожньо → ✗ (виключено) → ✓ (підтверджено) → порожньо.',
    'block.label': '{rows} × {columns}',
    'cell.unknown': '{row} і {col}: не позначено',
    'cell.no': '{row} і {col}: ✗ виключено',
    'cell.yes': '{row} і {col}: ✓ підтверджено',
    'action.autoExclude': 'Авто-✗: ✓ виключає решту його рядка і стовпця',
    'check.help': 'Перевірка рахує, скільки ваших позначок суперечать розв’язку, не кажучи, які саме.',
    'check.none': 'Поки що суперечностей немає.',
    'check.result': 'Позначок, що суперечать розв’язку: {count}.',
    'status.progress': 'Поставлено ✓: {count} з {total}',
    'status.solved': 'Розв’язано! Ходів: {moves}.',
    'status.undone': 'Останню зміну скасовано.',
    'result.completed': 'Усі ✓ на своїх місцях — головоломку розв’язано.',
    'keys.help': 'Клавіатура: Tab переходить між сітками, стрілки рухаються в межах сітки, Пробіл або Enter перемикають клітинку, Delete очищає її.'
  },
  categories: ['Ім’я', 'Поверх', 'Улюбленець', 'Напій', 'Колір'],
  names: ['Бен', 'Клара', 'Давид', 'Фелікс', 'Лена', 'Мія', 'Ноа', 'Сара'],
  items: {
    pet: ['Кішка', 'Собака', 'Птах', 'Рибка', 'Кролик', 'Черепаха'],
    drink: ['Чай', 'Кава', 'Молоко', 'Сік', 'Вода', 'Какао'],
    colour: ['Червоний', 'Синій', 'Зелений', 'Жовтий', 'Чорний', 'Білий']
  },
  subjects: {
    pet: ['людина з кішкою', 'людина із собакою', 'людина з птахом', 'людина з рибкою', 'людина з кроликом', 'людина з черепахою'],
    drink: ['любитель чаю', 'любитель кави', 'любитель молока', 'любитель соку', 'любитель води', 'любитель какао'],
    colour: ['людина в червоному', 'людина в синьому', 'людина в зеленому', 'людина в жовтому', 'людина в чорному', 'людина в білому']
  }
});

const hi = build({
  ui: {
    title: 'तर्क ग्रिड',
    tagline: 'सुरागों को जोड़कर पता लगाइए कि कौन कहाँ रहता है और किसके पास क्या है।',
    rules: 'हर व्यक्ति के पास हर श्रेणी की ठीक एक चीज़ है, और कोई भी दो व्यक्ति एक ही चीज़ साझा नहीं करते। सुरागों की मदद से ग्रिड में निशान लगाइए: ✗ किसी जोड़ी को बाहर करता है, ✓ उसकी पुष्टि करता है। मंज़िल 1 सबसे नीचे है; जब सभी सही ✓ लग जाएँ, पहेली हल हो जाती है।',
    'difficulty.easy': 'आसान (3 व्यक्ति, 3 श्रेणियाँ)',
    'difficulty.medium': 'मध्यम (4 व्यक्ति, 3 श्रेणियाँ)',
    'difficulty.hard': 'कठिन (5 व्यक्ति, 4 श्रेणियाँ)',
    'floor.item': 'मंज़िल {n}',
    'subject.person': '{name}',
    'subject.floor': 'मंज़िल {n} वाले व्यक्ति',
    'clue.same': '{a} और {b} एक ही व्यक्ति हैं।',
    'clue.notSame': '{a} और {b} अलग-अलग व्यक्ति हैं।',
    'clue.directlyAbove': '{a} की मंज़िल {b} की मंज़िल से ठीक एक ऊपर है।',
    'clue.above': '{a} की मंज़िल {b} की मंज़िल से ऊँची है।',
    'clue.nextTo': '{a} की मंज़िल और {b} की मंज़िल एक-दूसरे से सटी हुई हैं।',
    'clue.eitherOr': '{a} या तो {b} हैं या {c}।',
    'clues.heading': 'सुराग',
    'clues.help': 'किसी सुराग का उपयोग कर लेने के बाद उसे काटने के लिए उस पर टैप करें।',
    'grids.heading': 'ग्रिड',
    'grid.help': 'खाने को बदलने के लिए टैप करें: खाली → ✗ (बाहर) → ✓ (पुष्ट) → खाली।',
    'block.label': '{rows} × {columns}',
    'cell.unknown': '{row} और {col}: अचिह्नित',
    'cell.no': '{row} और {col}: ✗ बाहर',
    'cell.yes': '{row} और {col}: ✓ पुष्ट',
    'action.autoExclude': 'स्वचालित ✗: ✓ लगाने पर उसकी पंक्ति और स्तंभ के बाकी खाने बाहर हो जाते हैं',
    'check.help': 'जाँच बताती है कि आपके कितने निशान हल से टकराते हैं, पर यह नहीं कि कौन-से।',
    'check.none': 'अब तक कोई विरोधाभास नहीं।',
    'check.result': 'हल से टकराने वाले निशान: {count}।',
    'status.progress': 'लगाए गए ✓: {total} में से {count}',
    'status.solved': 'हल हो गया! चालें: {moves}।',
    'status.undone': 'पिछला बदलाव पूर्ववत किया गया।',
    'result.completed': 'हर ✓ अपनी जगह पर है – पहेली हल हो गई।',
    'keys.help': 'कीबोर्ड: Tab से ग्रिडों के बीच जाएँ, तीर कुंजियों से ग्रिड के भीतर चलें, Space या Enter से खाना बदलें, Delete से मिटाएँ।'
  },
  categories: ['नाम', 'मंज़िल', 'पालतू जानवर', 'पेय', 'रंग'],
  names: ['बेन', 'क्लारा', 'डेविड', 'फ़ेलिक्स', 'लेना', 'मिया', 'नोआ', 'सारा'],
  items: {
    pet: ['बिल्ली', 'कुत्ता', 'चिड़िया', 'मछली', 'खरगोश', 'कछुआ'],
    drink: ['चाय', 'कॉफ़ी', 'दूध', 'जूस', 'पानी', 'कोको'],
    colour: ['लाल', 'नीला', 'हरा', 'पीला', 'काला', 'सफ़ेद']
  },
  subjects: {
    pet: ['बिल्ली वाले व्यक्ति', 'कुत्ते वाले व्यक्ति', 'चिड़िया वाले व्यक्ति', 'मछली वाले व्यक्ति', 'खरगोश वाले व्यक्ति', 'कछुए वाले व्यक्ति'],
    drink: ['चाय पीने वाले व्यक्ति', 'कॉफ़ी पीने वाले व्यक्ति', 'दूध पीने वाले व्यक्ति', 'जूस पीने वाले व्यक्ति', 'पानी पीने वाले व्यक्ति', 'कोको पीने वाले व्यक्ति'],
    colour: ['लाल कपड़ों वाले व्यक्ति', 'नीले कपड़ों वाले व्यक्ति', 'हरे कपड़ों वाले व्यक्ति', 'पीले कपड़ों वाले व्यक्ति', 'काले कपड़ों वाले व्यक्ति', 'सफ़ेद कपड़ों वाले व्यक्ति']
  }
});

export const messages: GameMessages = { de, en, nl, es, fr, ru, 'zh-Hans': zhHans, ko, ja, ar, pt, it, pl, tr, uk, hi };
