import type { CardEntry, World } from '../cards';

/**
 * World 5 — Railway (design § 4.5): steam, timetables and the eternal delay — passengers against the railway
 * staff (no real operator, line or brand). Same composition and level budget as Kampfzwerge:
 * 142 cards: 76 encounter (36 monsters, 10 boosters, 4 reinforcements, 2 windfalls, 14 curses, 4 origins,
 * 6 professions) and 66 loot (34 items, 6 upgrades, 16 one-shots incl. 2 Change Sides, 6 level-ups, 4 doubles).
 * Language-free; texts per locale in `content/rw/<locale>.ts` under the same ids.
 */
const cards: readonly CardEntry[] = [
  /* ---------- Monsters (36): all 9 base kinds ---------- */
  { id: 'rw.plush-loco', type: 'monster', level: 1, kind: 'figurine', traits: ['tiny'], loot: 1, levels: 1, blunder: [{ t: 'cards', n: 1 }] },
  { id: 'rw.station-dog', type: 'monster', level: 1, kind: 'critter', traits: ['sleepy', 'tiny'], loot: 1, levels: 1, flee: 2, blunder: [{ t: 'slot', slot: 'feet' }] },
  { id: 'rw.draught-ghost', type: 'monster', level: 2, kind: 'spook', traits: ['cold'], loot: 1, levels: 1, blunder: [{ t: 'cards', n: 1 }] },
  { id: 'rw.china-conductor', type: 'monster', level: 2, kind: 'figurine', traits: ['shiny'], loot: 1, levels: 1, mods: [{ when: { family: 'passenger' }, bonus: 2 }], blunder: [{ t: 'slot', slot: 'head' }] },
  { id: 'rw.platform-gum', type: 'monster', level: 2, kind: 'goo', traits: ['sticky', 'smelly'], loot: 1, levels: 1, blunder: [{ t: 'slot', slot: 'feet' }] },
  { id: 'rw.sparrow-gang', type: 'monster', level: 3, kind: 'critter', traits: ['flying', 'loud'], loot: 1, levels: 1, blunder: [{ t: 'level', n: 1 }] },
  { id: 'rw.sleeper-weed', type: 'monster', level: 3, kind: 'greens', traits: ['sticky'], loot: 1, levels: 1, flee: -1, blunder: [{ t: 'slot', slot: 'feet' }] },
  { id: 'rw.embankment-mole', type: 'monster', level: 3, kind: 'digger', traits: ['sleepy', 'tiny'], loot: 1, levels: 1, blunder: [{ t: 'cards', n: 2 }] },
  { id: 'rw.ticket-silverfish', type: 'monster', level: 3, kind: 'crawler', traits: ['tiny', 'bureaucratic'], loot: 1, levels: 1, mods: [{ when: { kind: 'machine' }, bonus: 3 }], blunder: [{ t: 'slot', slot: 'small' }] },
  { id: 'rw.platform-planter', type: 'monster', level: 4, kind: 'greens', traits: [], loot: 2, levels: 1, flee: -1, blunder: [{ t: 'level', n: 1 }] },
  { id: 'rw.train-wash', type: 'monster', level: 4, kind: 'machine', traits: ['wet', 'loud'], loot: 2, levels: 1, mods: [{ when: { kind: 'figurine' }, bonus: 2 }], blunder: [{ t: 'slot', slot: 'body' }] },
  { id: 'rw.seat-hog', type: 'monster', level: 4, kind: 'bigmouth', traits: ['loud'], loot: 2, levels: 1, mods: [{ when: { family: 'passenger' }, bonus: 3 }], blunder: [{ t: 'best' }] },
  { id: 'rw.tunnel-borer', type: 'monster', level: 5, kind: 'digger', traits: ['bureaucratic', 'loud'], loot: 2, levels: 1, mods: [{ when: { kind: 'bigmouth' }, bonus: 2 }], blunder: [{ t: 'cards', n: 2 }] },
  { id: 'rw.ticket-magpie', type: 'monster', level: 5, kind: 'critter', traits: ['shiny', 'flying'], loot: 2, levels: 1, blunder: [{ t: 'slot', slot: 'small' }] },
  { id: 'rw.refund-bug', type: 'monster', level: 5, kind: 'crawler', traits: ['bureaucratic'], loot: 2, levels: 1, blunder: [{ t: 'cards', n: 3 }] },
  { id: 'rw.passing-freight', type: 'monster', level: 6, kind: 'machine', traits: ['loud', 'huge'], loot: 2, levels: 1, mods: [{ when: { kind: 'critter' }, bonus: 3 }], blunder: [{ t: 'slot', slot: 'head' }] },
  { id: 'rw.dining-car-goulash', type: 'monster', level: 6, kind: 'goo', traits: ['smelly', 'fiery'], loot: 2, levels: 1, flee: -1, blunder: [{ t: 'slot', slot: 'body' }] },
  { id: 'rw.lost-property-clerk', type: 'monster', level: 6, kind: 'bigmouth', traits: ['bureaucratic', 'ancient'], loot: 2, levels: 1, blunder: [{ t: 'slot', slot: 'small' }, { t: 'cards', n: 1 }] },
  { id: 'rw.basement-railway', type: 'monster', level: 7, kind: 'figurine', traits: ['loud'], loot: 2, levels: 1, mods: [{ when: { family: 'railstaff' }, bonus: 3 }], blunder: [{ t: 'level', n: 1 }] },
  { id: 'rw.runaway-trolley', type: 'monster', level: 7, kind: 'machine', traits: ['armoured', 'loud'], loot: 2, levels: 1, flee: 1, blunder: [{ t: 'level', n: 1 }, { t: 'slot', slot: 'feet' }] },
  { id: 'rw.ticket-inspection', type: 'monster', level: 8, kind: 'bigmouth', traits: ['bureaucratic'], loot: 2, levels: 1, mods: [{ when: { lacks: 'bureaucratic' }, bonus: 2 }], blunder: [{ t: 'level', n: 1 }] },
  { id: 'rw.ghost-conductor', type: 'monster', level: 8, kind: 'spook', traits: ['cold'], loot: 2, levels: 1, mods: [{ when: { family: 'passenger' }, bonus: 2 }], blunder: [{ t: 'best' }] },
  { id: 'rw.luggage-rack-spider', type: 'monster', level: 8, kind: 'crawler', traits: ['sticky'], loot: 2, levels: 1, flee: -1, blunder: [{ t: 'slot', slot: 'hand' }] },
  { id: 'rw.station-cat', type: 'monster', level: 9, kind: 'critter', traits: ['loud', 'shiny'], loot: 3, levels: 1, blunder: [{ t: 'best' }] },
  { id: 'rw.overgrown-sidings', type: 'monster', level: 9, kind: 'greens', traits: ['huge', 'ancient'], loot: 3, levels: 1, flee: -2, blunder: [{ t: 'level', n: 1 }] },
  { id: 'rw.exact-change-machine', type: 'monster', level: 10, kind: 'machine', traits: ['electric', 'bureaucratic'], loot: 3, levels: 1, mods: [{ when: { lacks: 'shiny' }, bonus: 4 }], blunder: [{ t: 'slot', slot: 'head' }, { t: 'level', n: 1 }] },
  { id: 'rw.bowling-club-outing', type: 'monster', level: 10, kind: 'bigmouth', traits: ['loud'], loot: 3, levels: 1, mods: [{ when: { family: 'railstaff' }, bonus: 3 }], blunder: [{ t: 'level', n: 1 }, { t: 'cards', n: 1 }] },
  { id: 'rw.ghost-train', type: 'monster', level: 10, kind: 'spook', traits: ['cold', 'ancient'], loot: 3, levels: 1, noFlee: true, blunder: [{ t: 'level', n: 1 }] },
  { id: 'rw.ballast-beetle', type: 'monster', level: 11, kind: 'crawler', traits: ['armoured', 'huge'], loot: 3, levels: 1, blunder: [{ t: 'slot', slot: 'body' }, { t: 'level', n: 1 }] },
  { id: 'rw.hanging-basket', type: 'monster', level: 11, kind: 'greens', traits: ['sticky'], loot: 3, levels: 1, mods: [{ when: { kind: 'critter' }, bonus: 3 }], blunder: [{ t: 'level', n: 2 }] },
  { id: 'rw.overheated-boiler', type: 'monster', level: 12, kind: 'machine', traits: ['fiery', 'loud'], loot: 3, levels: 1, blunder: [{ t: 'slot', slot: 'hand' }, { t: 'level', n: 1 }] },
  { id: 'rw.giant-backpacker', type: 'monster', level: 12, kind: 'bigmouth', traits: ['huge'], loot: 3, levels: 1, flee: 1, blunder: [{ t: 'level', n: 2 }] },
  { id: 'rw.ancient-sandwich', type: 'monster', level: 13, kind: 'goo', traits: ['ancient', 'smelly'], loot: 4, levels: 1, flee: -1, blunder: [{ t: 'best' }, { t: 'level', n: 1 }] },
  { id: 'rw.timetable-conference', type: 'monster', level: 15, kind: 'bigmouth', traits: ['bureaucratic', 'sleepy'], loot: 4, levels: 1, mods: [{ when: { kind: 'machine' }, bonus: 3 }], blunder: [{ t: 'level', n: 2 }, { t: 'cards', n: 2 }] },
  { id: 'rw.endless-delay', type: 'monster', level: 16, kind: 'spook', traits: ['bureaucratic', 'ancient'], loot: 4, levels: 2, mods: [{ when: { family: 'passenger' }, bonus: 3 }], blunder: [{ t: 'level', n: 2 }, { t: 'best' }] },
  { id: 'rw.eternal-roadworks', type: 'monster', level: 18, kind: 'digger', traits: ['huge', 'ancient'], loot: 5, levels: 2, flee: -1, blunder: [{ t: 'level', n: 3 }] },

  /* ---------- Monster boosters (10) ---------- */
  { id: 'rw.extra-long', type: 'booster', level: 10, loot: 2, traits: ['huge'] },
  { id: 'rw.steam-age', type: 'booster', level: 10, loot: 2, traits: ['ancient'] },
  { id: 'rw.delay-rage', type: 'booster', level: 5, loot: 1, copies: 2 },
  { id: 'rw.tour-group', type: 'booster', level: 5, loot: 1, copies: 2 },
  { id: 'rw.toy-gauge', type: 'booster', level: -5, loot: -1, traits: ['tiny'], copies: 2 },
  { id: 'rw.rocking-carriage', type: 'booster', level: -3, loot: 0, traits: ['sleepy'], copies: 2 },

  /* ---------- Reinforcements (4) and windfalls (2) ---------- */
  { id: 'rw.next-stop', type: 'reinforcement', copies: 2 },
  { id: 'rw.change-here', type: 'reinforcement', copies: 2 },
  { id: 'rw.lost-property-auction', type: 'windfall', loot: 2 },
  { id: 'rw.forgotten-luggage-van', type: 'windfall', loot: 2 },

  /* ---------- Curses (14) ---------- */
  { id: 'rw.missed-train', type: 'curse', effect: { t: 'level', n: 1 } },
  { id: 'rw.wrong-platform', type: 'curse', effect: { t: 'level', n: 1 } },
  { id: 'rw.hat-out-of-window', type: 'curse', effect: { t: 'slot', slot: 'head' } },
  { id: 'rw.coffee-in-the-curve', type: 'curse', effect: { t: 'slot', slot: 'body' } },
  { id: 'rw.shoe-in-the-gap', type: 'curse', effect: { t: 'slot', slot: 'feet' } },
  { id: 'rw.suitcase-swap', type: 'curse', effect: { t: 'slot', slot: 'hand' } },
  { id: 'rw.seat-crack', type: 'curse', effect: { t: 'slot', slot: 'small' } },
  { id: 'rw.luggage-elsewhere', type: 'curse', effect: { t: 'best' } },
  { id: 'rw.passenger-survey', type: 'curse', effect: { t: 'cards', n: 2 } },
  { id: 'rw.no-small-change', type: 'curse', effect: { t: 'cards', n: 2 } },
  { id: 'rw.replacement-bus', type: 'curse', effect: { t: 'malus', n: 3 } },
  { id: 'rw.tunnel-dead-zone', type: 'curse', effect: { t: 'malus', n: 2 } },
  { id: 'rw.new-roster', type: 'curse', effect: { t: 'profession' } },
  { id: 'rw.woke-up-elsewhere', type: 'curse', effect: { t: 'origin' } },

  /* ---------- Origins (4) and professions (6) ---------- */
  { id: 'rw.steam-engine', type: 'origin', kind: 'machine', family: 'railstaff', traits: ['fiery'], mods: [{ when: { trait: 'cold' }, bonus: 2 }] },
  { id: 'rw.signal-box-mouse', type: 'origin', kind: 'critter', family: 'railstaff', traits: ['tiny'], mods: [{ when: { kind: 'crawler' }, bonus: 2 }] },
  { id: 'rw.commuter', type: 'origin', kind: 'bigmouth', family: 'passenger', traits: ['sleepy'], flee: 1 },
  { id: 'rw.platform-pigeon', type: 'origin', kind: 'critter', family: 'passenger', traits: ['flying'], mods: [{ when: { kind: 'greens' }, bonus: 2 }] },
  { id: 'rw.souvenir-seller', type: 'profession', sell: 2 },
  { id: 'rw.track-walker', type: 'profession', perClass: { cls: 'tool', bonus: 1 } },
  { id: 'rw.uniform-tailor', type: 'profession', perClass: { cls: 'clothing', bonus: 1 } },
  { id: 'rw.engine-driver', type: 'profession', mods: [{ when: { kind: 'machine' }, bonus: 3 }, { when: { kind: 'digger' }, bonus: 1 }] },
  { id: 'rw.track-gardener', type: 'profession', mods: [{ when: { kind: 'greens' }, bonus: 3 }, { when: { kind: 'crawler' }, bonus: 1 }] },
  { id: 'rw.night-train-guard', type: 'profession', mods: [{ when: { kind: 'spook' }, bonus: 3 }], flee: 1 },

  /* ---------- Items (34) ---------- */
  // head (6)
  { id: 'rw.conductor-cap', type: 'item', slot: 'head', bonus: 1, value: 2, cls: 'clothing', self: [{ when: { family: 'railstaff' }, bonus: 2 }], set: 'conductor-kit' },
  { id: 'rw.commuter-headphones', type: 'item', slot: 'head', bonus: 2, value: 3, cls: 'gadget', traits: ['electric'], mods: [{ when: { trait: 'loud' }, bonus: 2 }], set: 'commuter-kit' },
  { id: 'rw.newspaper-hat', type: 'item', slot: 'head', bonus: 1, value: 1, cls: 'junk', traits: ['armoured'] },
  { id: 'rw.stationmaster-cap', type: 'item', slot: 'head', bonus: 3, value: 6, cls: 'clothing', traits: ['shiny'] },
  { id: 'rw.rain-bonnet', type: 'item', slot: 'head', bonus: 1, value: 2, cls: 'junk', traits: ['wet'], mods: [{ when: { trait: 'fiery' }, bonus: 2 }] },
  { id: 'rw.track-helmet', type: 'item', slot: 'head', bonus: 2, value: 3, cls: 'clothing', traits: ['armoured'] },
  // body (5)
  { id: 'rw.commuter-jacket', type: 'item', slot: 'body', bonus: 1, value: 2, cls: 'clothing', set: 'commuter-kit' },
  { id: 'rw.boiler-armour', type: 'item', slot: 'body', bonus: 3, value: 5, cls: 'clothing', traits: ['armoured', 'shiny'] },
  { id: 'rw.travel-jumper', type: 'item', slot: 'body', bonus: 2, value: 3, cls: 'clothing', self: [{ when: { family: 'passenger' }, bonus: 1 }] },
  { id: 'rw.sooty-overalls', type: 'item', slot: 'body', bonus: 2, value: 2, cls: 'clothing', traits: ['smelly'], mods: [{ when: { kind: 'crawler' }, bonus: 2 }] },
  { id: 'rw.track-vest', type: 'item', slot: 'body', bonus: 1, value: 2, cls: 'clothing', flee: 1 },
  // feet (4)
  { id: 'rw.track-boots', type: 'item', slot: 'feet', bonus: 2, value: 3, cls: 'clothing', traits: ['armoured'] },
  { id: 'rw.polished-shoes', type: 'item', slot: 'feet', bonus: 1, value: 2, cls: 'clothing', flee: 1, set: 'conductor-kit' },
  { id: 'rw.connection-sprinters', type: 'item', slot: 'feet', bonus: 1, value: 4, cls: 'clothing', flee: 2 },
  { id: 'rw.galoshes', type: 'item', slot: 'feet', bonus: 1, value: 2, cls: 'clothing', mods: [{ when: { trait: 'wet' }, bonus: 2 }] },
  // hands (12)
  { id: 'rw.commuter-umbrella', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 3, cls: 'tool', mods: [{ when: { kind: 'critter' }, bonus: 1 }], set: 'commuter-kit' },
  { id: 'rw.coal-shovel', type: 'item', slot: 'hand', hands: 2, bonus: 3, value: 3, cls: 'tool', traits: ['fiery'], mods: [{ when: { trait: 'cold' }, bonus: 3 }] },
  { id: 'rw.points-lever', type: 'item', slot: 'hand', hands: 2, bonus: 4, value: 4, cls: 'tool' },
  { id: 'rw.ticket-punch', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 3, cls: 'tool', mods: [{ when: { kind: 'bigmouth' }, bonus: 2 }], set: 'conductor-kit' },
  { id: 'rw.gum-scraper', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 2, cls: 'tool', mods: [{ when: { kind: 'goo' }, bonus: 2 }] },
  { id: 'rw.golden-signal-disc', type: 'item', slot: 'hand', hands: 1, big: true, bonus: 4, value: 6, cls: 'weapon', traits: ['shiny'] },
  { id: 'rw.signal-lantern', type: 'item', slot: 'hand', hands: 1, bonus: 1, value: 2, cls: 'gadget', traits: ['fiery'], mods: [{ when: { kind: 'spook' }, bonus: 3 }] },
  { id: 'rw.engine-bucket', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 2, cls: 'tool', traits: ['wet'], mods: [{ when: { trait: 'fiery' }, bonus: 2 }] },
  { id: 'rw.guard-whistle', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 2, cls: 'weapon', mods: [{ when: { trait: 'flying' }, bonus: 3 }] },
  { id: 'rw.suitcase-ram', type: 'item', slot: 'hand', hands: 2, big: true, bonus: 5, value: 5, cls: 'junk' },
  { id: 'rw.regulars-cane', type: 'item', slot: 'hand', hands: 1, bonus: 3, value: 4, cls: 'weapon', self: [{ when: { family: 'passenger' }, bonus: 1 }] },
  { id: 'rw.rolled-newspaper', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 3, cls: 'tool', mods: [{ when: { kind: 'crawler' }, bonus: 2 }] },
  // small (7)
  { id: 'rw.duty-watch', type: 'item', slot: 'small', bonus: 2, value: 3, cls: 'tool', self: [{ when: { family: 'railstaff' }, bonus: 1 }] },
  { id: 'rw.stick-on-sideburns', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'clothing', traits: ['bearded'] },
  { id: 'rw.lucky-ticket', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'junk', flee: 1 },
  { id: 'rw.ticket-from-1899', type: 'item', slot: 'small', bonus: 0, value: 8, cls: 'junk', traits: ['shiny'] },
  { id: 'rw.carriage-earplugs', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'gadget', mods: [{ when: { trait: 'loud' }, bonus: 3 }] },
  { id: 'rw.bistro-sausage', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'food', mods: [{ when: { trait: 'cold' }, bonus: 2 }] },
  { id: 'rw.old-timetable', type: 'item', slot: 'small', bonus: 0, value: 3, cls: 'junk', flee: 2 },

  /* ---------- Upgrades (6) ---------- */
  { id: 'rw.freshly-oiled', type: 'upgrade', bonus: 2, copies: 2 },
  { id: 'rw.brass-polished', type: 'upgrade', bonus: 1, traits: ['shiny'], copies: 2 },
  { id: 'rw.steam-whistle', type: 'upgrade', bonus: 3, traits: ['loud'] },
  { id: 'rw.from-the-museum', type: 'upgrade', bonus: 2, traits: ['ancient'] },

  /* ---------- One-shots (16 incl. Change Sides) ---------- */
  { id: 'rw.full-steam', type: 'oneshot', bonus: 3, value: 2, copies: 2 },
  { id: 'rw.soot-cloud', type: 'oneshot', bonus: 2, value: 1, copies: 2 },
  { id: 'rw.emergency-brake', type: 'oneshot', bonus: 5, value: 3 },
  { id: 'rw.whistle-blast', type: 'oneshot', bonus: 4, value: 3 },
  { id: 'rw.flying-pretzel', type: 'oneshot', bonus: 2, value: 1 },
  { id: 'rw.handful-of-ballast', type: 'oneshot', bonus: 2, value: 1 },
  { id: 'rw.full-volume-announcement', type: 'oneshot', bonus: 4, value: 2 },
  { id: 'rw.wrong-train', type: 'oneshot', bonus: 0, value: 1, flee: 3, copies: 2 },
  { id: 'rw.doors-closing', type: 'oneshot', bonus: 0, value: 2, escape: true, copies: 2 },
  { id: 'rw.swinging-curve', type: 'oneshot', bonus: 3, value: 2 },
  { id: 'rw.switch-trains', type: 'oneshot', bonus: 0, value: 1, turncoat: true, copies: 2 },

  /* ---------- Level-ups (6) and doubles (4) ---------- */
  { id: 'rw.chief-guard', type: 'levelup', copies: 2 },
  { id: 'rw.on-time', type: 'levelup', copies: 2 },
  { id: 'rw.anniversary-trip', type: 'levelup', copies: 2 },
  { id: 'rw.double-header', type: 'double', of: 'origin', copies: 2 },
  { id: 'rw.split-shift', type: 'double', of: 'profession', copies: 2 }
];

export const RAILWAY: World = {
  id: 'rw',
  cards,
  sets: [
    { id: 'conductor-kit', items: ['rw.conductor-cap', 'rw.polished-shoes', 'rw.ticket-punch'], bonus: 3 },
    { id: 'commuter-kit', items: ['rw.commuter-umbrella', 'rw.commuter-headphones', 'rw.commuter-jacket'], bonus: 3 }
  ]
};
