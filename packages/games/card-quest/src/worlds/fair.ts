import type { CardEntry, World } from '../cards';

/**
 * World 8 — Big Top (design § 4.6): circus ring and funfair — the circus folk (ring artistes: clowns, acrobats, the
 * strongman, the stilt walker, the flea circus) against the funfair folk (showmen with rides and stalls: ghost train,
 * hall of mirrors, bumper cars, Ferris wheel, hook-a-duck). Colourful slapstick; animals only as free, voluntary
 * characters. Same composition and level budget as Kampfzwerge:
 * 142 cards: 76 encounter (36 monsters, 10 boosters, 4 reinforcements, 2 windfalls, 14 curses, 4 origins,
 * 6 professions) and 66 loot (34 items, 6 upgrades, 16 one-shots incl. 2 Change Sides, 6 level-ups, 4 doubles).
 * Language-free; texts per locale in `content/fa/<locale>.ts` under the same ids.
 */
const cards: readonly CardEntry[] = [
  /* ---------- Monsters (36): all 9 base kinds ---------- */
  { id: 'fa.prize-teddy', type: 'monster', level: 1, kind: 'figurine', traits: ['tiny'], loot: 1, levels: 1, blunder: [{ t: 'cards', n: 1 }] },
  { id: 'fa.act-dog', type: 'monster', level: 1, kind: 'critter', traits: ['sleepy', 'tiny'], loot: 1, levels: 1, flee: 2, blunder: [{ t: 'slot', slot: 'feet' }] },
  { id: 'fa.sheet-ghost', type: 'monster', level: 2, kind: 'spook', traits: ['cold'], loot: 1, levels: 1, blunder: [{ t: 'cards', n: 1 }] },
  { id: 'fa.hook-a-duck', type: 'monster', level: 2, kind: 'figurine', traits: ['wet'], loot: 1, levels: 1, mods: [{ when: { family: 'circus' }, bonus: 2 }], blunder: [{ t: 'slot', slot: 'head' }] },
  { id: 'fa.ice-cream-blob', type: 'monster', level: 2, kind: 'goo', traits: ['sticky', 'cold'], loot: 1, levels: 1, blunder: [{ t: 'slot', slot: 'feet' }] },
  { id: 'fa.popcorn-pigeons', type: 'monster', level: 3, kind: 'critter', traits: ['flying', 'loud'], loot: 1, levels: 1, blunder: [{ t: 'level', n: 1 }] },
  { id: 'fa.candy-apple', type: 'monster', level: 3, kind: 'greens', traits: ['sticky', 'shiny'], loot: 1, levels: 1, flee: -1, blunder: [{ t: 'slot', slot: 'feet' }] },
  { id: 'fa.sawdust-vole', type: 'monster', level: 3, kind: 'digger', traits: ['sleepy', 'tiny'], loot: 1, levels: 1, blunder: [{ t: 'cards', n: 2 }] },
  { id: 'fa.ant-in-the-works', type: 'monster', level: 3, kind: 'crawler', traits: ['tiny'], loot: 1, levels: 1, mods: [{ when: { kind: 'machine' }, bonus: 3 }], blunder: [{ t: 'slot', slot: 'small' }] },
  { id: 'fa.coconut-shy', type: 'monster', level: 4, kind: 'greens', traits: ['armoured'], loot: 2, levels: 1, flee: -1, blunder: [{ t: 'level', n: 1 }] },
  { id: 'fa.log-flume', type: 'monster', level: 4, kind: 'machine', traits: ['wet', 'loud'], loot: 2, levels: 1, mods: [{ when: { kind: 'figurine' }, bonus: 2 }], blunder: [{ t: 'slot', slot: 'body' }] },
  { id: 'fa.bumper-car-announcer', type: 'monster', level: 4, kind: 'bigmouth', traits: ['loud'], loot: 2, levels: 1, mods: [{ when: { family: 'circus' }, bonus: 3 }], blunder: [{ t: 'best' }] },
  { id: 'fa.ball-pit', type: 'monster', level: 5, kind: 'digger', traits: ['loud', 'huge'], loot: 2, levels: 1, mods: [{ when: { kind: 'bigmouth' }, bonus: 2 }], blunder: [{ t: 'cards', n: 2 }] },
  { id: 'fa.chip-seagull', type: 'monster', level: 5, kind: 'critter', traits: ['flying', 'loud'], loot: 2, levels: 1, blunder: [{ t: 'slot', slot: 'small' }] },
  { id: 'fa.runaway-flea', type: 'monster', level: 5, kind: 'crawler', traits: ['tiny'], loot: 2, levels: 1, blunder: [{ t: 'cards', n: 3 }] },
  { id: 'fa.ferris-wheel', type: 'monster', level: 6, kind: 'machine', traits: ['huge', 'electric'], loot: 2, levels: 1, mods: [{ when: { kind: 'bigmouth' }, bonus: 3 }], blunder: [{ t: 'slot', slot: 'head' }] },
  { id: 'fa.caramel-cauldron', type: 'monster', level: 6, kind: 'goo', traits: ['fiery', 'sticky'], loot: 2, levels: 1, flee: -1, blunder: [{ t: 'slot', slot: 'body' }] },
  { id: 'fa.top-hat-magician', type: 'monster', level: 6, kind: 'bigmouth', traits: ['shiny', 'ancient'], loot: 2, levels: 1, blunder: [{ t: 'slot', slot: 'small' }, { t: 'cards', n: 1 }] },
  { id: 'fa.cymbal-monkey', type: 'monster', level: 7, kind: 'figurine', traits: ['loud'], loot: 2, levels: 1, mods: [{ when: { family: 'funfair' }, bonus: 3 }], blunder: [{ t: 'level', n: 1 }] },
  { id: 'fa.driverless-bumper-car', type: 'monster', level: 7, kind: 'machine', traits: ['armoured', 'loud'], loot: 2, levels: 1, flee: 1, blunder: [{ t: 'level', n: 1 }, { t: 'slot', slot: 'feet' }] },
  { id: 'fa.ringmaster', type: 'monster', level: 8, kind: 'bigmouth', traits: ['loud'], loot: 2, levels: 1, mods: [{ when: { lacks: 'shiny' }, bonus: 2 }], blunder: [{ t: 'level', n: 1 }] },
  { id: 'fa.mirror-ghost', type: 'monster', level: 8, kind: 'spook', traits: ['shiny'], loot: 2, levels: 1, mods: [{ when: { family: 'circus' }, bonus: 2 }], blunder: [{ t: 'best' }] },
  { id: 'fa.safety-net-spider', type: 'monster', level: 8, kind: 'crawler', traits: ['sticky'], loot: 2, levels: 1, flee: -1, blunder: [{ t: 'slot', slot: 'hand' }] },
  { id: 'fa.waffle-raccoon', type: 'monster', level: 9, kind: 'critter', traits: ['sticky', 'sleepy'], loot: 3, levels: 1, blunder: [{ t: 'best' }] },
  { id: 'fa.hedge-maze', type: 'monster', level: 9, kind: 'greens', traits: ['huge', 'ancient'], loot: 3, levels: 1, flee: -2, blunder: [{ t: 'level', n: 1 }] },
  { id: 'fa.popcorn-machine', type: 'monster', level: 10, kind: 'machine', traits: ['fiery', 'loud'], loot: 3, levels: 1, mods: [{ when: { lacks: 'cold' }, bonus: 4 }], blunder: [{ t: 'slot', slot: 'head' }, { t: 'level', n: 1 }] },
  { id: 'fa.clown-troupe', type: 'monster', level: 10, kind: 'bigmouth', traits: ['loud'], loot: 3, levels: 1, mods: [{ when: { family: 'funfair' }, bonus: 3 }], blunder: [{ t: 'level', n: 1 }, { t: 'cards', n: 1 }] },
  { id: 'fa.ghost-train-ride', type: 'monster', level: 10, kind: 'spook', traits: ['cold', 'ancient'], loot: 3, levels: 1, noFlee: true, blunder: [{ t: 'level', n: 1 }] },
  { id: 'fa.disco-ball-beetle', type: 'monster', level: 11, kind: 'crawler', traits: ['armoured', 'huge'], loot: 3, levels: 1, blunder: [{ t: 'slot', slot: 'body' }, { t: 'level', n: 1 }] },
  { id: 'fa.prize-sunflower', type: 'monster', level: 11, kind: 'greens', traits: ['huge'], loot: 3, levels: 1, mods: [{ when: { kind: 'critter' }, bonus: 3 }], blunder: [{ t: 'level', n: 2 }] },
  { id: 'fa.looping-coaster', type: 'monster', level: 12, kind: 'machine', traits: ['loud', 'electric'], loot: 3, levels: 1, blunder: [{ t: 'slot', slot: 'hand' }, { t: 'level', n: 1 }] },
  { id: 'fa.stilt-walker', type: 'monster', level: 12, kind: 'bigmouth', traits: ['huge'], loot: 3, levels: 1, flee: 1, blunder: [{ t: 'level', n: 2 }] },
  { id: 'fa.vintage-candy-floss', type: 'monster', level: 13, kind: 'goo', traits: ['ancient', 'sticky'], loot: 4, levels: 1, flee: -1, blunder: [{ t: 'best' }, { t: 'level', n: 1 }] },
  { id: 'fa.strongman', type: 'monster', level: 15, kind: 'bigmouth', traits: ['huge', 'bearded'], loot: 4, levels: 1, mods: [{ when: { kind: 'machine' }, bonus: 3 }], blunder: [{ t: 'level', n: 2 }, { t: 'cards', n: 2 }] },
  { id: 'fa.haunted-carousel', type: 'monster', level: 16, kind: 'spook', traits: ['ancient', 'loud'], loot: 4, levels: 2, mods: [{ when: { family: 'circus' }, bonus: 3 }], blunder: [{ t: 'level', n: 2 }, { t: 'best' }] },
  { id: 'fa.vengeful-mole', type: 'monster', level: 18, kind: 'digger', traits: ['huge', 'ancient'], loot: 5, levels: 2, flee: -1, blunder: [{ t: 'level', n: 3 }] },

  /* ---------- Monster boosters (10) ---------- */
  { id: 'fa.greatest-attraction', type: 'booster', level: 10, loot: 2, traits: ['huge'] },
  { id: 'fa.on-tour-for-generations', type: 'booster', level: 10, loot: 2, traits: ['ancient'] },
  { id: 'fa.encore', type: 'booster', level: 5, loot: 1, copies: 2 },
  { id: 'fa.packed-stands', type: 'booster', level: 5, loot: 1, copies: 2 },
  { id: 'fa.flea-circus-size', type: 'booster', level: -5, loot: -1, traits: ['tiny'], copies: 2 },
  { id: 'fa.carousel-dizzy', type: 'booster', level: -3, loot: 0, traits: ['sleepy'], copies: 2 },

  /* ---------- Reinforcements (4) and windfalls (2) ---------- */
  { id: 'fa.next-act', type: 'reinforcement', copies: 2 },
  { id: 'fa.clown-car', type: 'reinforcement', copies: 2 },
  { id: 'fa.under-the-stands', type: 'windfall', loot: 2 },
  { id: 'fa.last-day-sale', type: 'windfall', loot: 2 },

  /* ---------- Curses (14) ---------- */
  { id: 'fa.into-the-net', type: 'curse', effect: { t: 'level', n: 1 } },
  { id: 'fa.forgot-the-punchline', type: 'curse', effect: { t: 'level', n: 1 } },
  { id: 'fa.hat-on-the-swing-ride', type: 'curse', effect: { t: 'slot', slot: 'head' } },
  { id: 'fa.water-balloon', type: 'curse', effect: { t: 'slot', slot: 'body' } },
  { id: 'fa.shoe-in-the-bouncy-castle', type: 'curse', effect: { t: 'slot', slot: 'feet' } },
  { id: 'fa.juggled-not-caught', type: 'curse', effect: { t: 'slot', slot: 'hand' } },
  { id: 'fa.dropped-from-the-wheel', type: 'curse', effect: { t: 'slot', slot: 'small' } },
  { id: 'fa.put-on-the-prize-shelf', type: 'curse', effect: { t: 'best' } },
  { id: 'fa.candy-floss-fingers', type: 'curse', effect: { t: 'cards', n: 2 } },
  { id: 'fa.admission-please', type: 'curse', effect: { t: 'cards', n: 2 } },
  { id: 'fa.carousel-vertigo', type: 'curse', effect: { t: 'malus', n: 3 } },
  { id: 'fa.giggle-fit', type: 'curse', effect: { t: 'malus', n: 2 } },
  { id: 'fa.programme-change', type: 'curse', effect: { t: 'profession' } },
  { id: 'fa.mirror-mix-up', type: 'curse', effect: { t: 'origin' } },

  /* ---------- Origins (4) and professions (6) ---------- */
  { id: 'fa.fortune-machine', type: 'origin', kind: 'machine', family: 'funfair', traits: ['electric'], mods: [{ when: { kind: 'spook' }, bonus: 2 }] },
  { id: 'fa.carousel-horse', type: 'origin', kind: 'figurine', family: 'funfair', traits: ['shiny'], mods: [{ when: { kind: 'greens' }, bonus: 2 }] },
  { id: 'fa.circus-flea', type: 'origin', kind: 'crawler', family: 'circus', traits: ['tiny'], flee: 1 },
  { id: 'fa.squirt-flower-clown', type: 'origin', kind: 'bigmouth', family: 'circus', traits: ['loud'], mods: [{ when: { trait: 'fiery' }, bonus: 2 }] },
  { id: 'fa.barker', type: 'profession', sell: 2 },
  { id: 'fa.ride-mechanic', type: 'profession', perClass: { cls: 'tool', bonus: 1 } },
  { id: 'fa.costume-tailor', type: 'profession', perClass: { cls: 'clothing', bonus: 1 } },
  { id: 'fa.coaster-test-rider', type: 'profession', mods: [{ when: { kind: 'machine' }, bonus: 3 }, { when: { kind: 'figurine' }, bonus: 1 }] },
  { id: 'fa.flea-circus-director', type: 'profession', mods: [{ when: { kind: 'crawler' }, bonus: 3 }, { when: { kind: 'critter' }, bonus: 1 }] },
  { id: 'fa.ghost-train-operator', type: 'profession', mods: [{ when: { kind: 'spook' }, bonus: 3 }], flee: 1 },

  /* ---------- Items (34) ---------- */
  // head (6)
  { id: 'fa.rainbow-wig', type: 'item', slot: 'head', bonus: 1, value: 2, cls: 'clothing', self: [{ when: { family: 'circus' }, bonus: 2 }], set: 'clown-kit' },
  { id: 'fa.ride-headset', type: 'item', slot: 'head', bonus: 2, value: 3, cls: 'gadget', traits: ['electric'], mods: [{ when: { trait: 'loud' }, bonus: 2 }], set: 'showman-kit' },
  { id: 'fa.popcorn-bag-helmet', type: 'item', slot: 'head', bonus: 1, value: 1, cls: 'junk', traits: ['armoured'] },
  { id: 'fa.ringmaster-top-hat', type: 'item', slot: 'head', bonus: 3, value: 6, cls: 'clothing', traits: ['shiny'] },
  { id: 'fa.bucket-hat', type: 'item', slot: 'head', bonus: 1, value: 2, cls: 'junk', traits: ['wet'], mods: [{ when: { trait: 'fiery' }, bonus: 2 }] },
  { id: 'fa.acrobat-cap', type: 'item', slot: 'head', bonus: 2, value: 3, cls: 'clothing', traits: ['armoured'] },
  // body (5)
  { id: 'fa.cash-apron', type: 'item', slot: 'body', bonus: 1, value: 2, cls: 'clothing', set: 'showman-kit' },
  { id: 'fa.sequin-armour', type: 'item', slot: 'body', bonus: 3, value: 5, cls: 'clothing', traits: ['armoured', 'shiny'] },
  { id: 'fa.showman-jacket', type: 'item', slot: 'body', bonus: 2, value: 3, cls: 'clothing', self: [{ when: { family: 'funfair' }, bonus: 1 }] },
  { id: 'fa.mothball-cape', type: 'item', slot: 'body', bonus: 2, value: 2, cls: 'clothing', traits: ['smelly'], mods: [{ when: { kind: 'crawler' }, bonus: 2 }] },
  { id: 'fa.trapeze-leotard', type: 'item', slot: 'body', bonus: 1, value: 2, cls: 'clothing', flee: 1 },
  // feet (4)
  { id: 'fa.tent-crew-boots', type: 'item', slot: 'feet', bonus: 2, value: 3, cls: 'clothing', traits: ['armoured'] },
  { id: 'fa.giant-clown-shoes', type: 'item', slot: 'feet', bonus: 1, value: 2, cls: 'clothing', flee: 1, set: 'clown-kit' },
  { id: 'fa.spring-boots', type: 'item', slot: 'feet', bonus: 1, value: 4, cls: 'clothing', flee: 2 },
  { id: 'fa.flume-wellies', type: 'item', slot: 'feet', bonus: 1, value: 2, cls: 'clothing', mods: [{ when: { trait: 'wet' }, bonus: 2 }] },
  // hands (12)
  { id: 'fa.hook-a-duck-rod', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 3, cls: 'tool', mods: [{ when: { kind: 'critter' }, bonus: 1 }], set: 'showman-kit' },
  { id: 'fa.chestnut-roaster', type: 'item', slot: 'hand', hands: 2, bonus: 3, value: 3, cls: 'tool', traits: ['fiery'], mods: [{ when: { trait: 'cold' }, bonus: 3 }] },
  { id: 'fa.high-striker-mallet', type: 'item', slot: 'hand', hands: 2, bonus: 4, value: 4, cls: 'tool' },
  { id: 'fa.clown-horn', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 3, cls: 'tool', mods: [{ when: { kind: 'bigmouth' }, bonus: 2 }], set: 'clown-kit' },
  { id: 'fa.candy-floss-stick', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 2, cls: 'tool', mods: [{ when: { kind: 'goo' }, bonus: 2 }] },
  { id: 'fa.golden-juggling-club', type: 'item', slot: 'hand', hands: 1, big: true, bonus: 4, value: 6, cls: 'weapon', traits: ['shiny'] },
  { id: 'fa.sparkler', type: 'item', slot: 'hand', hands: 1, bonus: 1, value: 2, cls: 'gadget', traits: ['fiery'], mods: [{ when: { kind: 'spook' }, bonus: 3 }] },
  { id: 'fa.clown-watering-can', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 2, cls: 'tool', traits: ['wet'], mods: [{ when: { trait: 'fiery' }, bonus: 2 }] },
  { id: 'fa.diabolo', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 2, cls: 'weapon', mods: [{ when: { trait: 'flying' }, bonus: 3 }] },
  { id: 'fa.giant-plush-banana', type: 'item', slot: 'hand', hands: 2, big: true, bonus: 5, value: 5, cls: 'junk' },
  { id: 'fa.showground-cane', type: 'item', slot: 'hand', hands: 1, bonus: 3, value: 4, cls: 'weapon', self: [{ when: { family: 'funfair' }, bonus: 1 }] },
  { id: 'fa.rolled-programme', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 3, cls: 'tool', mods: [{ when: { kind: 'crawler' }, bonus: 2 }] },
  // small (7)
  { id: 'fa.organ-crank', type: 'item', slot: 'small', bonus: 2, value: 3, cls: 'tool', self: [{ when: { family: 'funfair' }, bonus: 1 }] },
  { id: 'fa.strongman-moustache', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'clothing', traits: ['bearded'] },
  { id: 'fa.free-ride-token', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'junk', flee: 1 },
  { id: 'fa.glass-diamond', type: 'item', slot: 'small', bonus: 0, value: 8, cls: 'junk', traits: ['shiny'] },
  { id: 'fa.bumper-car-earmuffs', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'gadget', mods: [{ when: { trait: 'loud' }, bonus: 3 }] },
  { id: 'fa.roasted-almonds', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'food', mods: [{ when: { trait: 'cold' }, bonus: 2 }] },
  { id: 'fa.showground-map', type: 'item', slot: 'small', bonus: 0, value: 3, cls: 'junk', flee: 2 },

  /* ---------- Upgrades (6) ---------- */
  { id: 'fa.freshly-painted', type: 'upgrade', bonus: 2, copies: 2 },
  { id: 'fa.sequinned', type: 'upgrade', bonus: 1, traits: ['shiny'], copies: 2 },
  { id: 'fa.with-a-fanfare', type: 'upgrade', bonus: 3, traits: ['loud'] },
  { id: 'fa.from-grandpas-caravan', type: 'upgrade', bonus: 2, traits: ['ancient'] },

  /* ---------- One-shots (16 incl. Change Sides) ---------- */
  { id: 'fa.drum-roll', type: 'oneshot', bonus: 3, value: 2, copies: 2 },
  { id: 'fa.confetti-shower', type: 'oneshot', bonus: 2, value: 1, copies: 2 },
  { id: 'fa.cream-pie', type: 'oneshot', bonus: 5, value: 3 },
  { id: 'fa.triple-somersault', type: 'oneshot', bonus: 4, value: 3 },
  { id: 'fa.flying-rubber-duck', type: 'oneshot', bonus: 2, value: 1 },
  { id: 'fa.handful-of-sawdust', type: 'oneshot', bonus: 2, value: 1 },
  { id: 'fa.megaphone-announcement', type: 'oneshot', bonus: 4, value: 2 },
  { id: 'fa.swing-ride-launch', type: 'oneshot', bonus: 0, value: 1, flee: 3, copies: 2 },
  { id: 'fa.curtain-down', type: 'oneshot', bonus: 0, value: 2, escape: true, copies: 2 },
  { id: 'fa.banana-peel', type: 'oneshot', bonus: 3, value: 2 },
  { id: 'fa.change-rings', type: 'oneshot', bonus: 0, value: 1, turncoat: true, copies: 2 },

  /* ---------- Level-ups (6) and doubles (4) ---------- */
  { id: 'fa.standing-ovation', type: 'levelup', copies: 2 },
  { id: 'fa.the-act-works', type: 'levelup', copies: 2 },
  { id: 'fa.jubilee-gala', type: 'levelup', copies: 2 },
  { id: 'fa.pantomime-horse', type: 'double', of: 'origin', copies: 2 },
  { id: 'fa.two-stalls-at-once', type: 'double', of: 'profession', copies: 2 }
];

export const FAIR: World = {
  id: 'fa',
  cards,
  sets: [
    { id: 'clown-kit', items: ['fa.rainbow-wig', 'fa.giant-clown-shoes', 'fa.clown-horn'], bonus: 3 },
    { id: 'showman-kit', items: ['fa.hook-a-duck-rod', 'fa.ride-headset', 'fa.cash-apron'], bonus: 3 }
  ]
};
