import type { CardEntry, World } from '../cards';

/**
 * World 6 — Creepy Crawlies (design § 4.6): the world under the garden and in the cellar — compost heap, flower
 * pots, cellar shelves and rain — worms (slow, wise, down-to-earth diggers) against insects (busy, buzzing,
 * six-legged, organised in hives and colonies). Nobody gets squashed: creatures flee, sulk, get stuck or fall
 * asleep. Same composition and level budget as Kampfzwerge:
 * 142 cards: 76 encounter (36 monsters, 10 boosters, 4 reinforcements, 2 windfalls, 14 curses, 4 origins,
 * 6 professions) and 66 loot (34 items, 6 upgrades, 16 one-shots incl. 2 Change Sides, 6 level-ups, 4 doubles).
 * Language-free; texts per locale in `content/bg/<locale>.ts` under the same ids.
 */
const cards: readonly CardEntry[] = [
  /* ---------- Monsters (36): all 9 base kinds ---------- */
  { id: 'bg.rubber-spider', type: 'monster', level: 1, kind: 'figurine', traits: ['tiny'], loot: 1, levels: 1, blunder: [{ t: 'cards', n: 1 }] },
  { id: 'bg.dormouse', type: 'monster', level: 1, kind: 'critter', traits: ['sleepy', 'tiny'], loot: 1, levels: 1, flee: 2, blunder: [{ t: 'slot', slot: 'feet' }] },
  { id: 'bg.cobweb-ghost', type: 'monster', level: 2, kind: 'spook', traits: ['cold'], loot: 1, levels: 1, blunder: [{ t: 'cards', n: 1 }] },
  { id: 'bg.tin-blackbird', type: 'monster', level: 2, kind: 'figurine', traits: ['shiny'], loot: 1, levels: 1, mods: [{ when: { family: 'worm' }, bonus: 2 }], blunder: [{ t: 'slot', slot: 'head' }] },
  { id: 'bg.slime-trail', type: 'monster', level: 2, kind: 'goo', traits: ['sticky', 'wet'], loot: 1, levels: 1, blunder: [{ t: 'slot', slot: 'feet' }] },
  { id: 'bg.mosquito', type: 'monster', level: 3, kind: 'crawler', traits: ['flying', 'loud'], loot: 1, levels: 1, blunder: [{ t: 'level', n: 1 }] },
  { id: 'bg.cleavers', type: 'monster', level: 3, kind: 'greens', traits: ['sticky'], loot: 1, levels: 1, flee: -1, blunder: [{ t: 'slot', slot: 'feet' }] },
  { id: 'bg.mole-cricket', type: 'monster', level: 3, kind: 'digger', traits: ['sleepy', 'tiny'], loot: 1, levels: 1, blunder: [{ t: 'cards', n: 2 }] },
  { id: 'bg.ant-traffic-police', type: 'monster', level: 3, kind: 'crawler', traits: ['tiny', 'bureaucratic'], loot: 1, levels: 1, mods: [{ when: { kind: 'bigmouth' }, bonus: 3 }], blunder: [{ t: 'slot', slot: 'small' }] },
  { id: 'bg.zucchini', type: 'monster', level: 4, kind: 'greens', traits: [], loot: 2, levels: 1, flee: -1, blunder: [{ t: 'level', n: 1 }] },
  { id: 'bg.cellar-pump', type: 'monster', level: 4, kind: 'machine', traits: ['wet', 'loud'], loot: 2, levels: 1, mods: [{ when: { trait: 'tiny' }, bonus: 2 }], blunder: [{ t: 'slot', slot: 'body' }] },
  { id: 'bg.early-bird', type: 'monster', level: 4, kind: 'critter', traits: ['flying', 'loud'], loot: 2, levels: 1, mods: [{ when: { family: 'worm' }, bonus: 3 }], blunder: [{ t: 'best' }] },
  { id: 'bg.monday-mole', type: 'monster', level: 5, kind: 'digger', traits: ['sleepy', 'loud'], loot: 2, levels: 1, mods: [{ when: { kind: 'crawler' }, bonus: 2 }], blunder: [{ t: 'cards', n: 2 }] },
  { id: 'bg.forgetful-squirrel', type: 'monster', level: 5, kind: 'critter', traits: ['loud', 'tiny'], loot: 2, levels: 1, blunder: [{ t: 'slot', slot: 'small' }] },
  { id: 'bg.wasp-collection-agency', type: 'monster', level: 5, kind: 'crawler', traits: ['bureaucratic', 'flying'], loot: 2, levels: 1, blunder: [{ t: 'cards', n: 3 }] },
  { id: 'bg.lawn-scarifier', type: 'monster', level: 6, kind: 'machine', traits: ['loud', 'huge'], loot: 2, levels: 1, mods: [{ when: { kind: 'digger' }, bonus: 3 }], blunder: [{ t: 'slot', slot: 'head' }] },
  { id: 'bg.hot-compost', type: 'monster', level: 6, kind: 'goo', traits: ['smelly', 'fiery'], loot: 2, levels: 1, flee: -1, blunder: [{ t: 'slot', slot: 'body' }] },
  { id: 'bg.cellar-clearout', type: 'monster', level: 6, kind: 'bigmouth', traits: ['bureaucratic', 'ancient'], loot: 2, levels: 1, blunder: [{ t: 'slot', slot: 'small' }, { t: 'cards', n: 1 }] },
  { id: 'bg.rubber-frog', type: 'monster', level: 7, kind: 'figurine', traits: ['loud'], loot: 2, levels: 1, mods: [{ when: { family: 'insect' }, bonus: 3 }], blunder: [{ t: 'level', n: 1 }] },
  { id: 'bg.robot-mower', type: 'monster', level: 7, kind: 'machine', traits: ['armoured', 'loud'], loot: 2, levels: 1, flee: 1, blunder: [{ t: 'level', n: 1 }, { t: 'slot', slot: 'feet' }] },
  { id: 'bg.cellar-caretaker', type: 'monster', level: 8, kind: 'bigmouth', traits: ['bureaucratic'], loot: 2, levels: 1, mods: [{ when: { lacks: 'bureaucratic' }, bonus: 2 }], blunder: [{ t: 'level', n: 1 }] },
  { id: 'bg.ghost-hen', type: 'monster', level: 8, kind: 'spook', traits: ['cold'], loot: 2, levels: 1, mods: [{ when: { family: 'worm' }, bonus: 2 }], blunder: [{ t: 'best' }] },
  { id: 'bg.hammock-spider', type: 'monster', level: 8, kind: 'crawler', traits: ['sticky'], loot: 2, levels: 1, flee: -1, blunder: [{ t: 'slot', slot: 'hand' }] },
  { id: 'bg.ringtone-starling', type: 'monster', level: 9, kind: 'critter', traits: ['loud', 'shiny'], loot: 3, levels: 1, blunder: [{ t: 'best' }] },
  { id: 'bg.oak-roots', type: 'monster', level: 9, kind: 'greens', traits: ['huge', 'ancient'], loot: 3, levels: 1, flee: -2, blunder: [{ t: 'level', n: 1 }] },
  { id: 'bg.garden-shredder', type: 'monster', level: 10, kind: 'machine', traits: ['electric', 'loud'], loot: 3, levels: 1, mods: [{ when: { lacks: 'armoured' }, bonus: 4 }], blunder: [{ t: 'slot', slot: 'head' }, { t: 'level', n: 1 }] },
  { id: 'bg.holiday-camp', type: 'monster', level: 10, kind: 'bigmouth', traits: ['loud'], loot: 3, levels: 1, mods: [{ when: { family: 'insect' }, bonus: 3 }], blunder: [{ t: 'level', n: 1 }, { t: 'cards', n: 1 }] },
  { id: 'bg.potato-cellar-spook', type: 'monster', level: 10, kind: 'spook', traits: ['cold', 'ancient'], loot: 3, levels: 1, noFlee: true, blunder: [{ t: 'level', n: 1 }] },
  { id: 'bg.stag-beetle', type: 'monster', level: 11, kind: 'crawler', traits: ['armoured', 'huge'], loot: 3, levels: 1, blunder: [{ t: 'slot', slot: 'body' }, { t: 'level', n: 1 }] },
  { id: 'bg.flytrap', type: 'monster', level: 11, kind: 'greens', traits: ['sticky'], loot: 3, levels: 1, mods: [{ when: { trait: 'flying' }, bonus: 3 }], blunder: [{ t: 'level', n: 2 }] },
  { id: 'bg.barbecue', type: 'monster', level: 12, kind: 'machine', traits: ['fiery', 'loud'], loot: 3, levels: 1, blunder: [{ t: 'slot', slot: 'hand' }, { t: 'level', n: 1 }] },
  { id: 'bg.gardener-giant', type: 'monster', level: 12, kind: 'bigmouth', traits: ['huge'], loot: 3, levels: 1, flee: 1, blunder: [{ t: 'level', n: 2 }] },
  { id: 'bg.organic-bin', type: 'monster', level: 13, kind: 'goo', traits: ['ancient', 'smelly'], loot: 4, levels: 1, flee: -1, blunder: [{ t: 'best' }, { t: 'level', n: 1 }] },
  { id: 'bg.ant-assembly', type: 'monster', level: 15, kind: 'crawler', traits: ['bureaucratic', 'sleepy'], loot: 4, levels: 1, mods: [{ when: { kind: 'critter' }, bonus: 3 }], blunder: [{ t: 'level', n: 2 }, { t: 'cards', n: 2 }] },
  { id: 'bg.old-badger', type: 'monster', level: 16, kind: 'critter', traits: ['huge', 'smelly'], loot: 4, levels: 2, mods: [{ when: { family: 'worm' }, bonus: 3 }], blunder: [{ t: 'level', n: 2 }, { t: 'best' }] },
  { id: 'bg.great-mole', type: 'monster', level: 18, kind: 'digger', traits: ['huge', 'ancient'], loot: 5, levels: 2, flee: -1, blunder: [{ t: 'level', n: 3 }] },

  /* ---------- Monster boosters (10) ---------- */
  { id: 'bg.hose-length', type: 'booster', level: 10, loot: 2, traits: ['huge'] },
  { id: 'bg.from-dino-times', type: 'booster', level: 10, loot: 2, traits: ['ancient'] },
  { id: 'bg.wasp-mood', type: 'booster', level: 5, loot: 1, copies: 2 },
  { id: 'bg.whole-swarm', type: 'booster', level: 5, loot: 1, copies: 2 },
  { id: 'bg.bug-sized', type: 'booster', level: -5, loot: -1, traits: ['tiny'], copies: 2 },
  { id: 'bg.winter-torpor', type: 'booster', level: -3, loot: 0, traits: ['sleepy'], copies: 2 },

  /* ---------- Reinforcements (4) and windfalls (2) ---------- */
  { id: 'bg.under-the-stone', type: 'reinforcement', copies: 2 },
  { id: 'bg.follow-the-scent', type: 'reinforcement', copies: 2 },
  { id: 'bg.abandoned-picnic', type: 'windfall', loot: 2 },
  { id: 'bg.cellar-junk-box', type: 'windfall', loot: 2 },

  /* ---------- Curses (14) ---------- */
  { id: 'bg.rain', type: 'curse', effect: { t: 'level', n: 1 } },
  { id: 'bg.wrong-flowerpot', type: 'curse', effect: { t: 'level', n: 1 } },
  { id: 'bg.hat-blown-away', type: 'curse', effect: { t: 'slot', slot: 'head' } },
  { id: 'bg.watering-can-shower', type: 'curse', effect: { t: 'slot', slot: 'body' } },
  { id: 'bg.six-shoes-one-knot', type: 'curse', effect: { t: 'slot', slot: 'feet' } },
  { id: 'bg.carried-off-by-ants', type: 'curse', effect: { t: 'slot', slot: 'hand' } },
  { id: 'bg.between-the-floorboards', type: 'curse', effect: { t: 'slot', slot: 'small' } },
  { id: 'bg.washed-away', type: 'curse', effect: { t: 'best' } },
  { id: 'bg.flight-permit', type: 'curse', effect: { t: 'cards', n: 2 } },
  { id: 'bg.winter-supplies', type: 'curse', effect: { t: 'cards', n: 2 } },
  { id: 'bg.midday-sun', type: 'curse', effect: { t: 'malus', n: 3 } },
  { id: 'bg.cobweb-in-antennae', type: 'curse', effect: { t: 'malus', n: 2 } },
  { id: 'bg.new-job-in-hive', type: 'curse', effect: { t: 'profession' } },
  { id: 'bg.wrong-cocoon', type: 'curse', effect: { t: 'origin' } },

  /* ---------- Origins (4) and professions (6) ---------- */
  { id: 'bg.worker-ant', type: 'origin', kind: 'crawler', family: 'insect', traits: ['tiny'], mods: [{ when: { kind: 'digger' }, bonus: 2 }] },
  { id: 'bg.bumblebee', type: 'origin', kind: 'critter', family: 'insect', traits: ['flying'], mods: [{ when: { kind: 'greens' }, bonus: 2 }] },
  { id: 'bg.compost-worm', type: 'origin', kind: 'digger', family: 'worm', traits: ['smelly'], flee: 1 },
  { id: 'bg.earthworm', type: 'origin', kind: 'digger', family: 'worm', traits: ['wet'], mods: [{ when: { kind: 'crawler' }, bonus: 2 }] },
  { id: 'bg.honey-trader', type: 'profession', sell: 2 },
  { id: 'bg.flowerpot-foreman', type: 'profession', perClass: { cls: 'tool', bonus: 1 } },
  { id: 'bg.silk-tailor', type: 'profession', perClass: { cls: 'clothing', bonus: 1 } },
  { id: 'bg.scarecrow-builder', type: 'profession', mods: [{ when: { kind: 'critter' }, bonus: 3 }, { when: { kind: 'figurine' }, bonus: 1 }] },
  { id: 'bg.aphid-shepherd', type: 'profession', mods: [{ when: { kind: 'greens' }, bonus: 3 }, { when: { kind: 'crawler' }, bonus: 1 }] },
  { id: 'bg.firefly-night-watch', type: 'profession', mods: [{ when: { kind: 'spook' }, bonus: 3 }], flee: 1 },

  /* ---------- Items (34) ---------- */
  // head (6)
  { id: 'bg.antenna-cap', type: 'item', slot: 'head', bonus: 1, value: 2, cls: 'clothing', self: [{ when: { family: 'insect' }, bonus: 2 }], set: 'swarm-kit' },
  { id: 'bg.clod-helmet', type: 'item', slot: 'head', bonus: 2, value: 3, cls: 'clothing', traits: ['armoured'], mods: [{ when: { trait: 'flying' }, bonus: 2 }], set: 'burrow-kit' },
  { id: 'bg.snail-shell-helmet', type: 'item', slot: 'head', bonus: 1, value: 1, cls: 'junk', traits: ['armoured'] },
  { id: 'bg.queen-bee-crown', type: 'item', slot: 'head', bonus: 3, value: 6, cls: 'clothing', traits: ['shiny'] },
  { id: 'bg.dew-thimble', type: 'item', slot: 'head', bonus: 1, value: 2, cls: 'junk', traits: ['wet'], mods: [{ when: { trait: 'fiery' }, bonus: 2 }] },
  { id: 'bg.drill-helmet', type: 'item', slot: 'head', bonus: 2, value: 3, cls: 'gadget', traits: ['electric'] },
  // body (5)
  { id: 'bg.compost-cape', type: 'item', slot: 'body', bonus: 1, value: 2, cls: 'clothing', traits: ['smelly'], set: 'burrow-kit' },
  { id: 'bg.rose-chafer-armour', type: 'item', slot: 'body', bonus: 3, value: 5, cls: 'clothing', traits: ['armoured', 'shiny'] },
  { id: 'bg.ringed-jumper', type: 'item', slot: 'body', bonus: 2, value: 3, cls: 'clothing', self: [{ when: { family: 'worm' }, bonus: 1 }] },
  { id: 'bg.mud-dungarees', type: 'item', slot: 'body', bonus: 2, value: 2, cls: 'clothing', traits: ['wet'], mods: [{ when: { kind: 'crawler' }, bonus: 2 }] },
  { id: 'bg.leaf-cloak', type: 'item', slot: 'body', bonus: 1, value: 2, cls: 'clothing', flee: 1 },
  // feet (4)
  { id: 'bg.acorn-shoes', type: 'item', slot: 'feet', bonus: 2, value: 3, cls: 'clothing', traits: ['armoured'] },
  { id: 'bg.six-little-boots', type: 'item', slot: 'feet', bonus: 1, value: 2, cls: 'clothing', flee: 1, set: 'swarm-kit' },
  { id: 'bg.grasshopper-springs', type: 'item', slot: 'feet', bonus: 1, value: 4, cls: 'clothing', flee: 2 },
  { id: 'bg.pond-skater-shoes', type: 'item', slot: 'feet', bonus: 1, value: 2, cls: 'clothing', mods: [{ when: { trait: 'wet' }, bonus: 2 }] },
  // hands (12)
  { id: 'bg.pocket-spade', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 3, cls: 'tool', mods: [{ when: { kind: 'critter' }, bonus: 1 }], set: 'burrow-kit' },
  { id: 'bg.compost-fork', type: 'item', slot: 'hand', hands: 2, bonus: 3, value: 3, cls: 'tool', traits: ['fiery'], mods: [{ when: { trait: 'cold' }, bonus: 3 }] },
  { id: 'bg.lolly-stick-crowbar', type: 'item', slot: 'hand', hands: 2, bonus: 4, value: 4, cls: 'tool' },
  { id: 'bg.rose-thorn', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 3, cls: 'tool', mods: [{ when: { kind: 'bigmouth' }, bonus: 2 }], set: 'swarm-kit' },
  { id: 'bg.slime-pusher', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 2, cls: 'tool', mods: [{ when: { kind: 'goo' }, bonus: 2 }] },
  { id: 'bg.golden-darning-needle', type: 'item', slot: 'hand', hands: 1, big: true, bonus: 4, value: 6, cls: 'weapon', traits: ['shiny'] },
  { id: 'bg.walnut-tealight', type: 'item', slot: 'hand', hands: 1, bonus: 1, value: 2, cls: 'gadget', traits: ['fiery'], mods: [{ when: { kind: 'spook' }, bonus: 3 }] },
  { id: 'bg.dolls-watering-can', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 2, cls: 'tool', traits: ['wet'], mods: [{ when: { trait: 'fiery' }, bonus: 2 }] },
  { id: 'bg.grass-whistle', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 2, cls: 'weapon', mods: [{ when: { trait: 'flying' }, bonus: 3 }] },
  { id: 'bg.giant-marble', type: 'item', slot: 'hand', hands: 2, big: true, bonus: 5, value: 5, cls: 'junk' },
  { id: 'bg.root-walking-stick', type: 'item', slot: 'hand', hands: 1, bonus: 3, value: 4, cls: 'weapon', self: [{ when: { family: 'worm' }, bonus: 1 }] },
  { id: 'bg.tickle-feather', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 3, cls: 'tool', mods: [{ when: { kind: 'crawler' }, bonus: 2 }] },
  // small (7)
  { id: 'bg.pocket-sundial', type: 'item', slot: 'small', bonus: 2, value: 3, cls: 'tool', self: [{ when: { family: 'insect' }, bonus: 1 }] },
  { id: 'bg.moss-beard', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'clothing', traits: ['bearded'] },
  { id: 'bg.four-leaf-clover', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'junk', flee: 1 },
  { id: 'bg.amber-mosquito', type: 'item', slot: 'small', bonus: 0, value: 8, cls: 'junk', traits: ['shiny'] },
  { id: 'bg.beeswax-earplugs', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'gadget', mods: [{ when: { trait: 'loud' }, bonus: 3 }] },
  { id: 'bg.honey-drops', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'food', mods: [{ when: { trait: 'cold' }, bonus: 2 }] },
  { id: 'bg.tunnel-map', type: 'item', slot: 'small', bonus: 0, value: 3, cls: 'junk', flee: 2 },

  /* ---------- Upgrades (6) ---------- */
  { id: 'bg.spider-silk-patch', type: 'upgrade', bonus: 2, copies: 2 },
  { id: 'bg.dew-polish', type: 'upgrade', bonus: 1, traits: ['shiny'], copies: 2 },
  { id: 'bg.built-in-buzzer', type: 'upgrade', bonus: 3, traits: ['loud'] },
  { id: 'bg.prehistoric-find', type: 'upgrade', bonus: 2, traits: ['ancient'] },

  /* ---------- One-shots (16 incl. Change Sides) ---------- */
  { id: 'bg.ant-pyramid', type: 'oneshot', bonus: 3, value: 2, copies: 2 },
  { id: 'bg.pollen-cloud', type: 'oneshot', bonus: 2, value: 1, copies: 2 },
  { id: 'bg.hive-alarm', type: 'oneshot', bonus: 5, value: 3 },
  { id: 'bg.buzz-concert', type: 'oneshot', bonus: 4, value: 3 },
  { id: 'bg.flying-acorn', type: 'oneshot', bonus: 2, value: 1 },
  { id: 'bg.mud-ball', type: 'oneshot', bonus: 2, value: 1 },
  { id: 'bg.cricket-chorus', type: 'oneshot', bonus: 4, value: 2 },
  { id: 'bg.into-the-mousehole', type: 'oneshot', bonus: 0, value: 1, flee: 3, copies: 2 },
  { id: 'bg.play-dead', type: 'oneshot', bonus: 0, value: 2, escape: true, copies: 2 },
  { id: 'bg.slime-slide', type: 'oneshot', bonus: 3, value: 2 },
  { id: 'bg.feelers-out', type: 'oneshot', bonus: 0, value: 1, turncoat: true, copies: 2 },

  /* ---------- Level-ups (6) and doubles (4) ---------- */
  { id: 'bg.moulted', type: 'levelup', copies: 2 },
  { id: 'bg.butterfly-at-last', type: 'levelup', copies: 2 },
  { id: 'bg.compost-party', type: 'levelup', copies: 2 },
  { id: 'bg.six-legged-worm', type: 'double', of: 'origin', copies: 2 },
  { id: 'bg.busy-bee', type: 'double', of: 'profession', copies: 2 }
];

export const BUGS: World = {
  id: 'bg',
  cards,
  sets: [
    { id: 'swarm-kit', items: ['bg.antenna-cap', 'bg.six-little-boots', 'bg.rose-thorn'], bonus: 3 },
    { id: 'burrow-kit', items: ['bg.pocket-spade', 'bg.clod-helmet', 'bg.compost-cape'], bonus: 3 }
  ]
};
