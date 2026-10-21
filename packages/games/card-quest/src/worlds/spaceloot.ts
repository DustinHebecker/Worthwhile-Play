import type { CardEntry, World } from '../cards';

/**
 * World 2 — Spaceloot (design § 4.2): shabby sci-fi — the ship's crew (androids, stowaway cockroaches) against
 * aliens (slime, briefcase), broken machines, bureaucratic space. Same composition and level budget as Kampfzwerge:
 * 142 cards: 76 encounter (36 monsters, 10 boosters, 4 reinforcements, 2 windfalls, 14 curses, 4 origins,
 * 6 professions) and 66 loot (34 items, 6 upgrades, 16 one-shots incl. 2 Change Sides, 6 level-ups, 4 doubles).
 * Language-free; texts per locale in `content/sl/<locale>.ts` under the same ids.
 */
const cards: readonly CardEntry[] = [
  /* ---------- Monsters (36): all 9 base kinds ---------- */
  { id: 'sl.dust-mite', type: 'monster', level: 1, kind: 'crawler', traits: ['tiny'], loot: 1, levels: 1, blunder: [{ t: 'cards', n: 1 }] },
  { id: 'sl.ship-hamster', type: 'monster', level: 1, kind: 'critter', traits: ['tiny', 'sleepy'], loot: 1, levels: 1, flee: 2, blunder: [{ t: 'slot', slot: 'feet' }] },
  { id: 'sl.static-ghost', type: 'monster', level: 2, kind: 'spook', traits: ['electric'], loot: 1, levels: 1, blunder: [{ t: 'cards', n: 1 }] },
  { id: 'sl.bobble-alien', type: 'monster', level: 2, kind: 'figurine', traits: ['shiny'], loot: 1, levels: 1, mods: [{ when: { family: 'crew' }, bonus: 2 }], blunder: [{ t: 'slot', slot: 'head' }] },
  { id: 'sl.canteen-jelly', type: 'monster', level: 2, kind: 'goo', traits: ['sticky', 'cold'], loot: 1, levels: 1, blunder: [{ t: 'slot', slot: 'feet' }] },
  { id: 'sl.space-gull', type: 'monster', level: 3, kind: 'critter', traits: ['flying', 'loud'], loot: 1, levels: 1, blunder: [{ t: 'level', n: 1 }] },
  { id: 'sl.homesick-vine', type: 'monster', level: 3, kind: 'greens', traits: ['sticky'], loot: 1, levels: 1, flee: -1, blunder: [{ t: 'slot', slot: 'feet' }] },
  { id: 'sl.asteroid-worm', type: 'monster', level: 3, kind: 'digger', traits: ['sleepy', 'cold'], loot: 1, levels: 1, blunder: [{ t: 'cards', n: 2 }] },
  { id: 'sl.cable-beetle', type: 'monster', level: 3, kind: 'crawler', traits: ['tiny', 'electric'], loot: 1, levels: 1, mods: [{ when: { kind: 'machine' }, bonus: 3 }], blunder: [{ t: 'slot', slot: 'small' }] },
  { id: 'sl.captains-plant', type: 'monster', level: 4, kind: 'greens', traits: [], loot: 2, levels: 1, flee: -1, blunder: [{ t: 'level', n: 1 }] },
  { id: 'sl.spin-cycle', type: 'monster', level: 4, kind: 'machine', traits: ['wet', 'loud'], loot: 2, levels: 1, mods: [{ when: { kind: 'bigmouth' }, bonus: 2 }], blunder: [{ t: 'slot', slot: 'body' }] },
  { id: 'sl.customs-officer', type: 'monster', level: 4, kind: 'bigmouth', traits: ['bureaucratic'], loot: 2, levels: 1, mods: [{ when: { family: 'alien' }, bonus: 3 }], blunder: [{ t: 'best' }] },
  { id: 'sl.moon-mole', type: 'monster', level: 5, kind: 'digger', traits: ['bureaucratic'], loot: 2, levels: 1, mods: [{ when: { kind: 'machine' }, bonus: 2 }], blunder: [{ t: 'cards', n: 2 }] },
  { id: 'sl.jetpack-rat', type: 'monster', level: 5, kind: 'critter', traits: ['flying'], loot: 2, levels: 1, blunder: [{ t: 'slot', slot: 'small' }] },
  { id: 'sl.form-jellyfish', type: 'monster', level: 5, kind: 'goo', traits: ['bureaucratic', 'wet'], loot: 2, levels: 1, blunder: [{ t: 'cards', n: 3 }] },
  { id: 'sl.robo-vac', type: 'monster', level: 6, kind: 'machine', traits: ['loud'], loot: 2, levels: 1, mods: [{ when: { kind: 'crawler' }, bonus: 3 }], blunder: [{ t: 'slot', slot: 'head' }] },
  { id: 'sl.food-paste', type: 'monster', level: 6, kind: 'goo', traits: ['smelly', 'sticky'], loot: 2, levels: 1, flee: -1, blunder: [{ t: 'slot', slot: 'body' }] },
  { id: 'sl.junk-dealer', type: 'monster', level: 6, kind: 'bigmouth', traits: ['shiny'], loot: 2, levels: 1, blunder: [{ t: 'slot', slot: 'small' }, { t: 'cards', n: 1 }] },
  { id: 'sl.mission-mascot', type: 'monster', level: 7, kind: 'figurine', traits: ['loud'], loot: 2, levels: 1, mods: [{ when: { family: 'alien' }, bonus: 3 }], blunder: [{ t: 'level', n: 1 }] },
  { id: 'sl.moon-buggy', type: 'monster', level: 7, kind: 'machine', traits: ['armoured', 'loud'], loot: 2, levels: 1, flee: 1, blunder: [{ t: 'level', n: 1 }, { t: 'slot', slot: 'feet' }] },
  { id: 'sl.safety-inspection', type: 'monster', level: 8, kind: 'bigmouth', traits: ['bureaucratic'], loot: 2, levels: 1, mods: [{ when: { lacks: 'armoured' }, bonus: 2 }], blunder: [{ t: 'level', n: 1 }] },
  { id: 'sl.captains-ghost', type: 'monster', level: 8, kind: 'spook', traits: ['cold'], loot: 2, levels: 1, mods: [{ when: { family: 'crew' }, bonus: 2 }], blunder: [{ t: 'best' }] },
  { id: 'sl.drain-crab', type: 'monster', level: 8, kind: 'crawler', traits: ['sticky', 'wet'], loot: 2, levels: 1, flee: -1, blunder: [{ t: 'slot', slot: 'hand' }] },
  { id: 'sl.station-raccoon', type: 'monster', level: 9, kind: 'critter', traits: ['shiny'], loot: 3, levels: 1, blunder: [{ t: 'best' }] },
  { id: 'sl.jungle-planet', type: 'monster', level: 9, kind: 'greens', traits: ['huge', 'wet'], loot: 3, levels: 1, flee: -2, blunder: [{ t: 'level', n: 1 }] },
  { id: 'sl.moody-computer', type: 'monster', level: 10, kind: 'machine', traits: ['electric'], loot: 3, levels: 1, mods: [{ when: { lacks: 'electric' }, bonus: 4 }], blunder: [{ t: 'slot', slot: 'head' }, { t: 'level', n: 1 }] },
  { id: 'sl.late-invasion', type: 'monster', level: 10, kind: 'bigmouth', traits: ['loud', 'shiny'], loot: 3, levels: 1, mods: [{ when: { family: 'crew' }, bonus: 3 }], blunder: [{ t: 'level', n: 1 }, { t: 'cards', n: 1 }] },
  { id: 'sl.laundry-black-hole', type: 'monster', level: 10, kind: 'spook', traits: ['cold', 'ancient'], loot: 3, levels: 1, noFlee: true, blunder: [{ t: 'level', n: 1 }] },
  { id: 'sl.tank-beetle', type: 'monster', level: 11, kind: 'crawler', traits: ['armoured', 'fiery'], loot: 3, levels: 1, blunder: [{ t: 'slot', slot: 'body' }, { t: 'level', n: 1 }] },
  { id: 'sl.alien-orchid', type: 'monster', level: 11, kind: 'greens', traits: ['sticky', 'smelly'], loot: 3, levels: 1, mods: [{ when: { kind: 'bigmouth' }, bonus: 3 }], blunder: [{ t: 'level', n: 2 }] },
  { id: 'sl.tantrum-engine', type: 'monster', level: 12, kind: 'machine', traits: ['fiery', 'loud'], loot: 3, levels: 1, blunder: [{ t: 'slot', slot: 'hand' }, { t: 'level', n: 1 }] },
  { id: 'sl.spacesick-giant', type: 'monster', level: 12, kind: 'bigmouth', traits: ['huge'], loot: 3, levels: 1, flee: 1, blunder: [{ t: 'level', n: 2 }] },
  { id: 'sl.comet-goo', type: 'monster', level: 13, kind: 'goo', traits: ['ancient', 'cold'], loot: 4, levels: 1, flee: -1, blunder: [{ t: 'best' }, { t: 'level', n: 1 }] },
  { id: 'sl.galactic-office', type: 'monster', level: 15, kind: 'bigmouth', traits: ['bureaucratic', 'ancient'], loot: 4, levels: 1, mods: [{ when: { kind: 'machine' }, bonus: 3 }], blunder: [{ t: 'level', n: 2 }, { t: 'cards', n: 2 }] },
  { id: 'sl.planet-eater', type: 'monster', level: 16, kind: 'digger', traits: ['ancient', 'huge'], loot: 4, levels: 2, mods: [{ when: { family: 'crew' }, bonus: 3 }], blunder: [{ t: 'level', n: 2 }, { t: 'best' }] },
  { id: 'sl.airlock-thing', type: 'monster', level: 18, kind: 'spook', traits: ['huge', 'cold'], loot: 5, levels: 2, flee: -1, blunder: [{ t: 'level', n: 3 }] },

  /* ---------- Monster boosters (10) ---------- */
  { id: 'sl.supermassive', type: 'booster', level: 10, loot: 2, traits: ['huge'] },
  { id: 'sl.since-big-bang', type: 'booster', level: 10, loot: 2, traits: ['ancient'] },
  { id: 'sl.wifi-rage', type: 'booster', level: 5, loot: 1, copies: 2 },
  { id: 'sl.brought-mothership', type: 'booster', level: 5, loot: 1, copies: 2 },
  { id: 'sl.shrink-ray', type: 'booster', level: -5, loot: -1, traits: ['tiny'], copies: 2 },
  { id: 'sl.space-lag', type: 'booster', level: -3, loot: 0, traits: ['sleepy'], copies: 2 },

  /* ---------- Reinforcements (4) and windfalls (2) ---------- */
  { id: 'sl.distress-signal', type: 'reinforcement', copies: 2 },
  { id: 'sl.swarm-alert', type: 'reinforcement', copies: 2 },
  { id: 'sl.cargo-hold', type: 'windfall', loot: 2 },
  { id: 'sl.flea-market', type: 'windfall', loot: 2 },

  /* ---------- Curses (14) ---------- */
  { id: 'sl.wrong-airlock', type: 'curse', effect: { t: 'level', n: 1 } },
  { id: 'sl.time-loop', type: 'curse', effect: { t: 'level', n: 1 } },
  { id: 'sl.fogged-helmet', type: 'curse', effect: { t: 'slot', slot: 'head' } },
  { id: 'sl.shrunken-suit', type: 'curse', effect: { t: 'slot', slot: 'body' } },
  { id: 'sl.magnet-floor', type: 'curse', effect: { t: 'slot', slot: 'feet' } },
  { id: 'sl.dropped-in-space', type: 'curse', effect: { t: 'slot', slot: 'hand' } },
  { id: 'sl.space-moths', type: 'curse', effect: { t: 'slot', slot: 'small' } },
  { id: 'sl.zero-gravity', type: 'curse', effect: { t: 'best' } },
  { id: 'sl.mothership-spam', type: 'curse', effect: { t: 'cards', n: 2 } },
  { id: 'sl.meteor-shower', type: 'curse', effect: { t: 'cards', n: 2 } },
  { id: 'sl.space-hiccups', type: 'curse', effect: { t: 'malus', n: 3 } },
  { id: 'sl.canteen-food', type: 'curse', effect: { t: 'malus', n: 2 } },
  { id: 'sl.lost-badge', type: 'curse', effect: { t: 'profession' } },
  { id: 'sl.teleporter-mixup', type: 'curse', effect: { t: 'origin' } },

  /* ---------- Origins (4) and professions (6) ---------- */
  { id: 'sl.android', type: 'origin', kind: 'machine', family: 'crew', traits: ['electric'], mods: [{ when: { kind: 'machine' }, bonus: 2 }] },
  { id: 'sl.space-cockroach', type: 'origin', kind: 'crawler', family: 'crew', traits: ['armoured'], flee: 1 },
  { id: 'sl.space-slime', type: 'origin', kind: 'goo', family: 'alien', traits: ['sticky'], mods: [{ when: { kind: 'crawler' }, bonus: 2 }] },
  { id: 'sl.briefcase-alien', type: 'origin', kind: 'bigmouth', family: 'alien', traits: ['bureaucratic'], mods: [{ when: { kind: 'bigmouth' }, bonus: 2 }] },
  { id: 'sl.cargo-trader', type: 'profession', sell: 2 },
  { id: 'sl.space-janitor', type: 'profession', perClass: { cls: 'tool', bonus: 1 } },
  { id: 'sl.gadget-officer', type: 'profession', perClass: { cls: 'gadget', bonus: 1 } },
  { id: 'sl.robot-whisperer', type: 'profession', mods: [{ when: { kind: 'machine' }, bonus: 3 }, { when: { kind: 'figurine' }, bonus: 1 }] },
  { id: 'sl.xeno-gardener', type: 'profession', mods: [{ when: { kind: 'greens' }, bonus: 3 }, { when: { kind: 'goo' }, bonus: 1 }] },
  { id: 'sl.test-pilot', type: 'profession', mods: [{ when: { kind: 'critter' }, bonus: 3 }], flee: 1 },

  /* ---------- Items (34) ---------- */
  // head (6)
  { id: 'sl.three-eye-shades', type: 'item', slot: 'head', bonus: 1, value: 2, cls: 'clothing', self: [{ when: { family: 'alien' }, bonus: 2 }], set: 'tourist-kit' },
  { id: 'sl.antenna-headband', type: 'item', slot: 'head', bonus: 2, value: 3, cls: 'gadget', traits: ['electric'], mods: [{ when: { kind: 'bigmouth' }, bonus: 2 }], set: 'away-team' },
  { id: 'sl.colander-helmet', type: 'item', slot: 'head', bonus: 1, value: 1, cls: 'junk', traits: ['armoured'] },
  { id: 'sl.admiral-cap', type: 'item', slot: 'head', bonus: 3, value: 6, cls: 'clothing', traits: ['shiny'] },
  { id: 'sl.ice-pack-beanie', type: 'item', slot: 'head', bonus: 1, value: 2, cls: 'junk', traits: ['cold'], mods: [{ when: { trait: 'fiery' }, bonus: 2 }] },
  { id: 'sl.fishbowl-helmet', type: 'item', slot: 'head', bonus: 2, value: 3, cls: 'clothing', traits: ['armoured'] },
  // body (5)
  { id: 'sl.crew-jumpsuit', type: 'item', slot: 'body', bonus: 1, value: 2, cls: 'clothing', set: 'away-team' },
  { id: 'sl.asteroid-armour', type: 'item', slot: 'body', bonus: 3, value: 5, cls: 'clothing', traits: ['armoured', 'shiny'] },
  { id: 'sl.tentacle-poncho', type: 'item', slot: 'body', bonus: 2, value: 3, cls: 'clothing', self: [{ when: { family: 'alien' }, bonus: 1 }] },
  { id: 'sl.space-blanket-cape', type: 'item', slot: 'body', bonus: 2, value: 2, cls: 'clothing', traits: ['shiny'], mods: [{ when: { trait: 'cold' }, bonus: 2 }] },
  { id: 'sl.blinking-vest', type: 'item', slot: 'body', bonus: 1, value: 2, cls: 'clothing', flee: 1 },
  // feet (4)
  { id: 'sl.magnet-boots', type: 'item', slot: 'feet', bonus: 2, value: 3, cls: 'clothing', traits: ['armoured'] },
  { id: 'sl.moon-slippers', type: 'item', slot: 'feet', bonus: 1, value: 2, cls: 'clothing', flee: 1, set: 'tourist-kit' },
  { id: 'sl.jet-sneakers', type: 'item', slot: 'feet', bonus: 1, value: 4, cls: 'clothing', flee: 2 },
  { id: 'sl.antigrav-socks', type: 'item', slot: 'feet', bonus: 1, value: 2, cls: 'clothing', mods: [{ when: { trait: 'flying' }, bonus: 2 }] },
  // hands (12)
  { id: 'sl.laser-ladle', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 3, cls: 'weapon', mods: [{ when: { kind: 'goo' }, bonus: 1 }], set: 'away-team' },
  { id: 'sl.fire-extinguisher', type: 'item', slot: 'hand', hands: 2, bonus: 3, value: 3, cls: 'tool', traits: ['cold'], mods: [{ when: { trait: 'fiery' }, bonus: 3 }] },
  { id: 'sl.zero-g-mop', type: 'item', slot: 'hand', hands: 2, bonus: 4, value: 4, cls: 'tool' },
  { id: 'sl.fly-swatter', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 3, cls: 'tool', mods: [{ when: { kind: 'crawler' }, bonus: 2 }], set: 'tourist-kit' },
  { id: 'sl.plunger', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 2, cls: 'tool', mods: [{ when: { kind: 'goo' }, bonus: 2 }] },
  { id: 'sl.golden-ray-gun', type: 'item', slot: 'hand', hands: 1, big: true, bonus: 4, value: 6, cls: 'weapon', traits: ['shiny'] },
  { id: 'sl.bright-torch', type: 'item', slot: 'hand', hands: 1, bonus: 1, value: 2, cls: 'gadget', traits: ['electric'], mods: [{ when: { kind: 'spook' }, bonus: 3 }] },
  { id: 'sl.coolant-squirter', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 2, cls: 'tool', traits: ['cold'], mods: [{ when: { trait: 'fiery' }, bonus: 2 }] },
  { id: 'sl.star-net', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 2, cls: 'weapon', mods: [{ when: { trait: 'flying' }, bonus: 3 }] },
  { id: 'sl.trolley-ram', type: 'item', slot: 'hand', hands: 2, big: true, bonus: 5, value: 5, cls: 'junk' },
  { id: 'sl.alien-boomerang', type: 'item', slot: 'hand', hands: 1, bonus: 3, value: 4, cls: 'weapon', self: [{ when: { family: 'alien' }, bonus: 1 }] },
  { id: 'sl.spanner-3000', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 3, cls: 'tool', mods: [{ when: { kind: 'machine' }, bonus: 2 }] },
  // small (7)
  { id: 'sl.oil-can', type: 'item', slot: 'small', bonus: 2, value: 3, cls: 'tool', self: [{ when: { family: 'crew' }, bonus: 1 }] },
  { id: 'sl.clip-on-antennae', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'clothing', traits: ['electric'] },
  { id: 'sl.lucky-meteorite', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'junk', flee: 1 },
  { id: 'sl.moon-rock', type: 'item', slot: 'small', bonus: 0, value: 8, cls: 'junk', traits: ['shiny'] },
  { id: 'sl.vacuum-earplugs', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'gadget', mods: [{ when: { trait: 'loud' }, bonus: 3 }] },
  { id: 'sl.tube-cocoa', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'food', mods: [{ when: { trait: 'cold' }, bonus: 2 }] },
  { id: 'sl.star-map', type: 'item', slot: 'small', bonus: 0, value: 3, cls: 'junk', flee: 2 },

  /* ---------- Upgrades (6) ---------- */
  { id: 'sl.space-taped', type: 'upgrade', bonus: 2, copies: 2 },
  { id: 'sl.chrome-plated', type: 'upgrade', bonus: 1, traits: ['shiny'], copies: 2 },
  { id: 'sl.nuclear-powered', type: 'upgrade', bonus: 3, traits: ['loud'] },
  { id: 'sl.ancient-blessing', type: 'upgrade', bonus: 2, traits: ['ancient'] },

  /* ---------- One-shots (16 incl. Change Sides) ---------- */
  { id: 'sl.gravity-popper', type: 'oneshot', bonus: 3, value: 2, copies: 2 },
  { id: 'sl.expanding-foam', type: 'oneshot', bonus: 2, value: 1, copies: 2 },
  { id: 'sl.reactor-overload', type: 'oneshot', bonus: 5, value: 3 },
  { id: 'sl.confetti-cannon', type: 'oneshot', bonus: 4, value: 3 },
  { id: 'sl.freeze-dried-ice-cream', type: 'oneshot', bonus: 2, value: 1 },
  { id: 'sl.stardust', type: 'oneshot', bonus: 2, value: 1 },
  { id: 'sl.off-key-anthem', type: 'oneshot', bonus: 4, value: 2 },
  { id: 'sl.hologram-decoy', type: 'oneshot', bonus: 0, value: 1, flee: 3, copies: 2 },
  { id: 'sl.escape-pod', type: 'oneshot', bonus: 0, value: 2, escape: true, copies: 2 },
  { id: 'sl.foam-party', type: 'oneshot', bonus: 3, value: 2 },
  { id: 'sl.defector-protocol', type: 'oneshot', bonus: 0, value: 1, turncoat: true, copies: 2 },

  /* ---------- Level-ups (6) and doubles (4) ---------- */
  { id: 'sl.promotion', type: 'levelup', copies: 2 },
  { id: 'sl.orbit-birthday', type: 'levelup', copies: 2 },
  { id: 'sl.found-manual', type: 'levelup', copies: 2 },
  { id: 'sl.hybrid-dna', type: 'double', of: 'origin', copies: 2 },
  { id: 'sl.double-shift', type: 'double', of: 'profession', copies: 2 }
];

export const SPACELOOT: World = {
  id: 'sl',
  cards,
  sets: [
    { id: 'away-team', items: ['sl.laser-ladle', 'sl.antenna-headband', 'sl.crew-jumpsuit'], bonus: 3 },
    { id: 'tourist-kit', items: ['sl.three-eye-shades', 'sl.moon-slippers', 'sl.fly-swatter'], bonus: 3 }
  ]
};
