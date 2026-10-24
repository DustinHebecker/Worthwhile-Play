import type { CardEntry, World } from '../cards';

/**
 * World 7 — Break Time (design § 4.6): surprise tests, homework monsters, the photocopier in the staff room, the
 * caretaker and the school trip — pupils against the staff room (affectionate on both sides; no country-specific
 * school terms). Same composition and level budget as Kampfzwerge:
 * 142 cards: 76 encounter (36 monsters, 10 boosters, 4 reinforcements, 2 windfalls, 14 curses, 4 origins,
 * 6 professions) and 66 loot (34 items, 6 upgrades, 16 one-shots incl. 2 Change Sides, 6 level-ups, 4 doubles).
 * Language-free; texts per locale in `content/sc/<locale>.ts` under the same ids.
 */
const cards: readonly CardEntry[] = [
  /* ---------- Monsters (36): all 9 base kinds ---------- */
  { id: 'sc.pencil-topper', type: 'monster', level: 1, kind: 'figurine', traits: ['tiny'], loot: 1, levels: 1, blunder: [{ t: 'cards', n: 1 }] },
  { id: 'sc.class-hamster', type: 'monster', level: 1, kind: 'critter', traits: ['sleepy', 'tiny'], loot: 1, levels: 1, flee: 2, blunder: [{ t: 'slot', slot: 'feet' }] },
  { id: 'sc.cloakroom-ghost', type: 'monster', level: 2, kind: 'spook', traits: ['cold'], loot: 1, levels: 1, blunder: [{ t: 'cards', n: 1 }] },
  { id: 'sc.trophy-cup', type: 'monster', level: 2, kind: 'figurine', traits: ['shiny'], loot: 1, levels: 1, mods: [{ when: { family: 'pupil' }, bonus: 2 }], blunder: [{ t: 'slot', slot: 'head' }] },
  { id: 'sc.craft-paste', type: 'monster', level: 2, kind: 'goo', traits: ['sticky', 'smelly'], loot: 1, levels: 1, blunder: [{ t: 'slot', slot: 'feet' }] },
  { id: 'sc.room-budgie', type: 'monster', level: 3, kind: 'critter', traits: ['flying', 'loud'], loot: 1, levels: 1, blunder: [{ t: 'level', n: 1 }] },
  { id: 'sc.trip-burrs', type: 'monster', level: 3, kind: 'greens', traits: ['sticky'], loot: 1, levels: 1, flee: -1, blunder: [{ t: 'slot', slot: 'feet' }] },
  { id: 'sc.apple-worm', type: 'monster', level: 3, kind: 'digger', traits: ['sleepy', 'tiny'], loot: 1, levels: 1, blunder: [{ t: 'cards', n: 2 }] },
  { id: 'sc.library-louse', type: 'monster', level: 3, kind: 'crawler', traits: ['tiny', 'bureaucratic'], loot: 1, levels: 1, mods: [{ when: { kind: 'machine' }, bonus: 3 }], blunder: [{ t: 'slot', slot: 'small' }] },
  { id: 'sc.science-cress', type: 'monster', level: 4, kind: 'greens', traits: [], loot: 2, levels: 1, flee: -1, blunder: [{ t: 'level', n: 1 }] },
  { id: 'sc.water-fountain', type: 'monster', level: 4, kind: 'machine', traits: ['wet', 'loud'], loot: 2, levels: 1, mods: [{ when: { kind: 'figurine' }, bonus: 2 }], blunder: [{ t: 'slot', slot: 'body' }] },
  { id: 'sc.playground-duty', type: 'monster', level: 4, kind: 'bigmouth', traits: ['loud'], loot: 2, levels: 1, mods: [{ when: { family: 'pupil' }, bonus: 3 }], blunder: [{ t: 'best' }] },
  { id: 'sc.excuse-vole', type: 'monster', level: 5, kind: 'digger', traits: ['bureaucratic', 'loud'], loot: 2, levels: 1, mods: [{ when: { kind: 'bigmouth' }, bonus: 2 }], blunder: [{ t: 'cards', n: 2 }] },
  { id: 'sc.roof-jackdaw', type: 'monster', level: 5, kind: 'critter', traits: ['shiny', 'flying'], loot: 2, levels: 1, blunder: [{ t: 'slot', slot: 'small' }] },
  { id: 'sc.homework-monster', type: 'monster', level: 5, kind: 'crawler', traits: ['bureaucratic'], loot: 2, levels: 1, blunder: [{ t: 'cards', n: 3 }] },
  { id: 'sc.school-bell', type: 'monster', level: 6, kind: 'machine', traits: ['loud', 'huge'], loot: 2, levels: 1, mods: [{ when: { kind: 'critter' }, bonus: 3 }], blunder: [{ t: 'slot', slot: 'head' }] },
  { id: 'sc.canteen-chilli', type: 'monster', level: 6, kind: 'goo', traits: ['smelly', 'fiery'], loot: 2, levels: 1, flee: -1, blunder: [{ t: 'slot', slot: 'body' }] },
  { id: 'sc.school-office', type: 'monster', level: 6, kind: 'bigmouth', traits: ['bureaucratic', 'ancient'], loot: 2, levels: 1, blunder: [{ t: 'slot', slot: 'small' }, { t: 'cards', n: 1 }] },
  { id: 'sc.confiscated-doll', type: 'monster', level: 7, kind: 'figurine', traits: ['loud'], loot: 2, levels: 1, mods: [{ when: { family: 'teacher' }, bonus: 3 }], blunder: [{ t: 'level', n: 1 }] },
  { id: 'sc.projector-trolley', type: 'monster', level: 7, kind: 'machine', traits: ['armoured', 'loud'], loot: 2, levels: 1, flee: 1, blunder: [{ t: 'level', n: 1 }, { t: 'slot', slot: 'feet' }] },
  { id: 'sc.school-inspection', type: 'monster', level: 8, kind: 'bigmouth', traits: ['bureaucratic'], loot: 2, levels: 1, mods: [{ when: { lacks: 'bureaucratic' }, bonus: 2 }], blunder: [{ t: 'level', n: 1 }] },
  { id: 'sc.school-play-ghost', type: 'monster', level: 8, kind: 'spook', traits: ['cold'], loot: 2, levels: 1, mods: [{ when: { family: 'pupil' }, bonus: 2 }], blunder: [{ t: 'best' }] },
  { id: 'sc.map-spider', type: 'monster', level: 8, kind: 'crawler', traits: ['sticky'], loot: 2, levels: 1, flee: -1, blunder: [{ t: 'slot', slot: 'hand' }] },
  { id: 'sc.school-dog', type: 'monster', level: 9, kind: 'critter', traits: ['loud', 'shiny'], loot: 3, levels: 1, blunder: [{ t: 'best' }] },
  { id: 'sc.playground-chestnut', type: 'monster', level: 9, kind: 'greens', traits: ['huge', 'ancient'], loot: 3, levels: 1, flee: -2, blunder: [{ t: 'level', n: 1 }] },
  { id: 'sc.staff-copier', type: 'monster', level: 10, kind: 'machine', traits: ['electric', 'bureaucratic'], loot: 3, levels: 1, mods: [{ when: { lacks: 'shiny' }, bonus: 4 }], blunder: [{ t: 'slot', slot: 'head' }, { t: 'level', n: 1 }] },
  { id: 'sc.coach-back-row', type: 'monster', level: 10, kind: 'bigmouth', traits: ['loud'], loot: 3, levels: 1, mods: [{ when: { family: 'teacher' }, bonus: 3 }], blunder: [{ t: 'level', n: 1 }, { t: 'cards', n: 1 }] },
  { id: 'sc.surprise-test', type: 'monster', level: 10, kind: 'spook', traits: ['cold', 'ancient'], loot: 3, levels: 1, noFlee: true, blunder: [{ t: 'level', n: 1 }] },
  { id: 'sc.stag-beetle', type: 'monster', level: 11, kind: 'crawler', traits: ['armoured', 'huge'], loot: 3, levels: 1, blunder: [{ t: 'slot', slot: 'body' }, { t: 'level', n: 1 }] },
  { id: 'sc.lab-flytrap', type: 'monster', level: 11, kind: 'greens', traits: ['sticky'], loot: 3, levels: 1, mods: [{ when: { kind: 'critter' }, bonus: 3 }], blunder: [{ t: 'level', n: 2 }] },
  { id: 'sc.bunsen-burner', type: 'monster', level: 12, kind: 'machine', traits: ['fiery', 'loud'], loot: 3, levels: 1, blunder: [{ t: 'slot', slot: 'hand' }, { t: 'level', n: 1 }] },
  { id: 'sc.caretaker', type: 'monster', level: 12, kind: 'bigmouth', traits: ['huge'], loot: 3, levels: 1, flee: 1, blunder: [{ t: 'level', n: 2 }] },
  { id: 'sc.bottom-of-bag-banana', type: 'monster', level: 13, kind: 'goo', traits: ['ancient', 'smelly'], loot: 4, levels: 1, flee: -1, blunder: [{ t: 'best' }, { t: 'level', n: 1 }] },
  { id: 'sc.staff-meeting', type: 'monster', level: 15, kind: 'bigmouth', traits: ['bureaucratic', 'sleepy'], loot: 4, levels: 1, mods: [{ when: { kind: 'machine' }, bonus: 3 }], blunder: [{ t: 'level', n: 2 }, { t: 'cards', n: 2 }] },
  { id: 'sc.endless-detention', type: 'monster', level: 16, kind: 'spook', traits: ['bureaucratic', 'ancient'], loot: 4, levels: 2, mods: [{ when: { family: 'pupil' }, bonus: 3 }], blunder: [{ t: 'level', n: 2 }, { t: 'best' }] },
  { id: 'sc.playground-worm-legend', type: 'monster', level: 18, kind: 'digger', traits: ['huge', 'ancient'], loot: 5, levels: 2, flee: -1, blunder: [{ t: 'level', n: 3 }] },

  /* ---------- Monster boosters (10) ---------- */
  { id: 'sc.poster-size', type: 'booster', level: 10, loot: 2, traits: ['huge'] },
  { id: 'sc.old-curriculum', type: 'booster', level: 10, loot: 2, traits: ['ancient'] },
  { id: 'sc.before-the-holidays', type: 'booster', level: 5, loot: 1, copies: 2 },
  { id: 'sc.bake-sale-sugar-rush', type: 'booster', level: 5, loot: 1, copies: 2 },
  { id: 'sc.cheat-sheet-size', type: 'booster', level: -5, loot: -1, traits: ['tiny'], copies: 2 },
  { id: 'sc.slideshow-in-the-dark', type: 'booster', level: -3, loot: 0, traits: ['sleepy'], copies: 2 },

  /* ---------- Reinforcements (4) and windfalls (2) ---------- */
  { id: 'sc.new-in-class', type: 'reinforcement', copies: 2 },
  { id: 'sc.class-next-door', type: 'reinforcement', copies: 2 },
  { id: 'sc.lost-property-box', type: 'windfall', loot: 2 },
  { id: 'sc.confiscation-drawer', type: 'windfall', loot: 2 },

  /* ---------- Curses (14) ---------- */
  { id: 'sc.overslept', type: 'curse', effect: { t: 'level', n: 1 } },
  { id: 'sc.forgot-homework', type: 'curse', effect: { t: 'level', n: 1 } },
  { id: 'sc.header-from-the-pitch', type: 'curse', effect: { t: 'slot', slot: 'head' } },
  { id: 'sc.finger-paint', type: 'curse', effect: { t: 'slot', slot: 'body' } },
  { id: 'sc.laces-tied-together', type: 'curse', effect: { t: 'slot', slot: 'feet' } },
  { id: 'sc.glued-in-woodwork', type: 'curse', effect: { t: 'slot', slot: 'hand' } },
  { id: 'sc.down-the-drain', type: 'curse', effect: { t: 'slot', slot: 'small' } },
  { id: 'sc.confiscated', type: 'curse', effect: { t: 'best' } },
  { id: 'sc.trip-paperwork', type: 'curse', effect: { t: 'cards', n: 2 } },
  { id: 'sc.books-to-the-front', type: 'curse', effect: { t: 'cards', n: 2 } },
  { id: 'sc.sports-day-aches', type: 'curse', effect: { t: 'malus', n: 3 } },
  { id: 'sc.squeaky-chalk', type: 'curse', effect: { t: 'malus', n: 2 } },
  { id: 'sc.new-timetable', type: 'curse', effect: { t: 'profession' } },
  { id: 'sc.role-swap-day', type: 'curse', effect: { t: 'origin' } },

  /* ---------- Origins (4) and professions (6) ---------- */
  { id: 'sc.old-school-teacher', type: 'origin', kind: 'bigmouth', family: 'teacher', traits: ['ancient'], mods: [{ when: { trait: 'sleepy' }, bonus: 2 }] },
  { id: 'sc.biology-skeleton', type: 'origin', kind: 'figurine', family: 'teacher', traits: [], mods: [{ when: { kind: 'spook' }, bonus: 2 }] },
  { id: 'sc.class-clown', type: 'origin', kind: 'bigmouth', family: 'pupil', traits: ['loud'], flee: 1 },
  { id: 'sc.reading-rat', type: 'origin', kind: 'critter', family: 'pupil', traits: ['tiny'], mods: [{ when: { trait: 'bureaucratic' }, bonus: 2 }] },
  { id: 'sc.tuck-shop', type: 'profession', sell: 2 },
  { id: 'sc.woodwork-whizz', type: 'profession', perClass: { cls: 'tool', bonus: 1 } },
  { id: 'sc.costume-club', type: 'profession', perClass: { cls: 'clothing', bonus: 1 } },
  { id: 'sc.tech-club', type: 'profession', mods: [{ when: { kind: 'machine' }, bonus: 3 }, { when: { kind: 'figurine' }, bonus: 1 }] },
  { id: 'sc.garden-club', type: 'profession', mods: [{ when: { kind: 'greens' }, bonus: 3 }, { when: { kind: 'crawler' }, bonus: 1 }] },
  { id: 'sc.night-hike-leader', type: 'profession', mods: [{ when: { kind: 'spook' }, bonus: 3 }], flee: 1 },

  /* ---------- Items (34) ---------- */
  // head (6)
  { id: 'sc.reading-glasses-chain', type: 'item', slot: 'head', bonus: 1, value: 2, cls: 'clothing', self: [{ when: { family: 'teacher' }, bonus: 2 }], set: 'staff-room' },
  { id: 'sc.coach-headphones', type: 'item', slot: 'head', bonus: 2, value: 3, cls: 'gadget', traits: ['electric'], mods: [{ when: { trait: 'loud' }, bonus: 2 }], set: 'class-trip' },
  { id: 'sc.worksheet-helmet', type: 'item', slot: 'head', bonus: 1, value: 1, cls: 'junk', traits: ['armoured'] },
  { id: 'sc.golden-laurels', type: 'item', slot: 'head', bonus: 3, value: 6, cls: 'clothing', traits: ['shiny'] },
  { id: 'sc.swimming-cap', type: 'item', slot: 'head', bonus: 1, value: 2, cls: 'junk', traits: ['wet'], mods: [{ when: { trait: 'fiery' }, bonus: 2 }] },
  { id: 'sc.ski-helmet', type: 'item', slot: 'head', bonus: 2, value: 3, cls: 'clothing', traits: ['armoured'] },
  // body (5)
  { id: 'sc.name-tag-raincoat', type: 'item', slot: 'body', bonus: 1, value: 2, cls: 'clothing', set: 'class-trip' },
  { id: 'sc.drama-club-armour', type: 'item', slot: 'body', bonus: 3, value: 5, cls: 'clothing', traits: ['armoured', 'shiny'] },
  { id: 'sc.class-hoodie', type: 'item', slot: 'body', bonus: 2, value: 3, cls: 'clothing', self: [{ when: { family: 'pupil' }, bonus: 1 }] },
  { id: 'sc.sweaty-pe-shirt', type: 'item', slot: 'body', bonus: 2, value: 2, cls: 'clothing', traits: ['smelly'], mods: [{ when: { kind: 'crawler' }, bonus: 2 }] },
  { id: 'sc.race-number', type: 'item', slot: 'body', bonus: 1, value: 2, cls: 'clothing', flee: 1 },
  // feet (4)
  { id: 'sc.football-boots', type: 'item', slot: 'feet', bonus: 2, value: 3, cls: 'clothing', traits: ['armoured'] },
  { id: 'sc.socks-and-sandals', type: 'item', slot: 'feet', bonus: 1, value: 2, cls: 'clothing', flee: 1, set: 'staff-room' },
  { id: 'sc.gym-plimsolls', type: 'item', slot: 'feet', bonus: 1, value: 4, cls: 'clothing', flee: 2 },
  { id: 'sc.pool-sliders', type: 'item', slot: 'feet', bonus: 1, value: 2, cls: 'clothing', mods: [{ when: { trait: 'wet' }, bonus: 2 }] },
  // hands (12)
  { id: 'sc.butterfly-net', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 3, cls: 'tool', mods: [{ when: { kind: 'critter' }, bonus: 1 }], set: 'class-trip' },
  { id: 'sc.jumbo-hot-glue', type: 'item', slot: 'hand', hands: 2, bonus: 3, value: 3, cls: 'tool', traits: ['fiery'], mods: [{ when: { trait: 'cold' }, bonus: 3 }] },
  { id: 'sc.board-set-square', type: 'item', slot: 'hand', hands: 2, bonus: 4, value: 4, cls: 'tool' },
  { id: 'sc.red-pen', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 3, cls: 'tool', mods: [{ when: { kind: 'bigmouth' }, bonus: 2 }], set: 'staff-room' },
  { id: 'sc.board-sponge', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 2, cls: 'tool', mods: [{ when: { kind: 'goo' }, bonus: 2 }] },
  { id: 'sc.golden-baton', type: 'item', slot: 'hand', hands: 1, big: true, bonus: 4, value: 6, cls: 'weapon', traits: ['shiny'] },
  { id: 'sc.night-hike-torch', type: 'item', slot: 'hand', hands: 1, bonus: 1, value: 2, cls: 'gadget', traits: ['electric'], mods: [{ when: { kind: 'spook' }, bonus: 3 }] },
  { id: 'sc.wash-bottle', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 2, cls: 'tool', traits: ['wet'], mods: [{ when: { trait: 'fiery' }, bonus: 2 }] },
  { id: 'sc.badminton-racket', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 2, cls: 'weapon', mods: [{ when: { trait: 'flying' }, bonus: 3 }] },
  { id: 'sc.overstuffed-school-bag', type: 'item', slot: 'hand', hands: 2, big: true, bonus: 5, value: 5, cls: 'junk' },
  { id: 'sc.hockey-stick', type: 'item', slot: 'hand', hands: 1, bonus: 3, value: 4, cls: 'weapon', self: [{ when: { family: 'pupil' }, bonus: 1 }] },
  { id: 'sc.rolled-school-paper', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 3, cls: 'tool', mods: [{ when: { kind: 'crawler' }, bonus: 2 }] },
  // small (7)
  { id: 'sc.pe-stopwatch', type: 'item', slot: 'small', bonus: 2, value: 3, cls: 'tool', self: [{ when: { family: 'teacher' }, bonus: 1 }] },
  { id: 'sc.felt-tip-moustache', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'clothing', traits: ['bearded'] },
  { id: 'sc.lucky-eraser', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'junk', flee: 1 },
  { id: 'sc.glitter-trading-card', type: 'item', slot: 'small', bonus: 0, value: 8, cls: 'junk', traits: ['shiny'] },
  { id: 'sc.ear-defenders', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'gadget', mods: [{ when: { trait: 'loud' }, bonus: 3 }] },
  { id: 'sc.hot-waffle', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'food', mods: [{ when: { trait: 'cold' }, bonus: 2 }] },
  { id: 'sc.loo-key-block', type: 'item', slot: 'small', bonus: 0, value: 3, cls: 'junk', flee: 2 },

  /* ---------- Upgrades (6) ---------- */
  { id: 'sc.freshly-sharpened', type: 'upgrade', bonus: 2, copies: 2 },
  { id: 'sc.glitter-glued', type: 'upgrade', bonus: 1, traits: ['shiny'], copies: 2 },
  { id: 'sc.built-in-bell', type: 'upgrade', bonus: 3, traits: ['loud'] },
  { id: 'sc.old-teaching-collection', type: 'upgrade', bonus: 2, traits: ['ancient'] },

  /* ---------- One-shots (16 incl. Change Sides) ---------- */
  { id: 'sc.final-sprint', type: 'oneshot', bonus: 3, value: 2, copies: 2 },
  { id: 'sc.chalk-dust-cloud', type: 'oneshot', bonus: 2, value: 1, copies: 2 },
  { id: 'sc.fire-drill', type: 'oneshot', bonus: 5, value: 3 },
  { id: 'sc.look-over-the-glasses', type: 'oneshot', bonus: 4, value: 3 },
  { id: 'sc.flying-eraser', type: 'oneshot', bonus: 2, value: 1 },
  { id: 'sc.handful-of-marbles', type: 'oneshot', bonus: 2, value: 1 },
  { id: 'sc.choir-fortissimo', type: 'oneshot', bonus: 4, value: 2 },
  { id: 'sc.may-i-go-to-the-loo', type: 'oneshot', bonus: 0, value: 1, flee: 3, copies: 2 },
  { id: 'sc.saved-by-the-bell', type: 'oneshot', bonus: 0, value: 2, escape: true, copies: 2 },
  { id: 'sc.sack-race-stampede', type: 'oneshot', bonus: 3, value: 2 },
  { id: 'sc.dodgeball-team-switch', type: 'oneshot', bonus: 0, value: 1, turncoat: true, copies: 2 },

  /* ---------- Level-ups (6) and doubles (4) ---------- */
  { id: 'sc.class-rep', type: 'levelup', copies: 2 },
  { id: 'sc.gold-star', type: 'levelup', copies: 2 },
  { id: 'sc.last-day-of-school', type: 'levelup', copies: 2 },
  { id: 'sc.double-period', type: 'double', of: 'origin', copies: 2 },
  { id: 'sc.two-clubs-at-once', type: 'double', of: 'profession', copies: 2 }
];

export const SCHOOL: World = {
  id: 'sc',
  cards,
  sets: [
    { id: 'staff-room', items: ['sc.reading-glasses-chain', 'sc.socks-and-sandals', 'sc.red-pen'], bonus: 3 },
    { id: 'class-trip', items: ['sc.name-tag-raincoat', 'sc.coach-headphones', 'sc.butterfly-net'], bonus: 3 }
  ]
};
