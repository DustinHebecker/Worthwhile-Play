import type { CardEntry, World } from '../cards';

/**
 * World 1 — Kampfzwerge (design § 4.1): fairy-tale dwarves (mine, forest) against garden gnomes.
 * 140 cards: 76 encounter (36 monsters, 10 boosters, 4 reinforcements, 2 windfalls, 14 curses, 4 origins,
 * 6 professions) and 64 loot (34 items, 6 upgrades, 14 one-shots, 6 level-ups, 4 doubles).
 * Language-free; texts per locale in `content/<locale>.ts` under the same ids.
 */
const cards: readonly CardEntry[] = [
  /* ---------- Monsters (36): all 9 base kinds ---------- */
  { id: 'kz.pebble-golem', type: 'monster', level: 1, kind: 'figurine', traits: ['tiny'], loot: 1, levels: 1, blunder: [{ t: 'cards', n: 1 }] },
  { id: 'kz.grumpy-snail', type: 'monster', level: 1, kind: 'critter', traits: ['sticky', 'sleepy'], loot: 1, levels: 1, flee: 2, blunder: [{ t: 'slot', slot: 'feet' }] },
  { id: 'kz.dust-bunny', type: 'monster', level: 2, kind: 'spook', traits: ['tiny'], loot: 1, levels: 1, blunder: [{ t: 'cards', n: 1 }] },
  { id: 'kz.lawn-flamingo', type: 'monster', level: 2, kind: 'figurine', traits: ['shiny'], loot: 1, levels: 1, mods: [{ when: { family: 'garden' }, bonus: 2 }], blunder: [{ t: 'slot', slot: 'head' }] },
  { id: 'kz.cave-slime', type: 'monster', level: 2, kind: 'goo', traits: ['sticky', 'wet'], loot: 1, levels: 1, blunder: [{ t: 'slot', slot: 'feet' }] },
  { id: 'kz.mine-canary', type: 'monster', level: 3, kind: 'critter', traits: ['flying', 'loud'], loot: 1, levels: 1, blunder: [{ t: 'level', n: 1 }] },
  { id: 'kz.ambitious-moss', type: 'monster', level: 3, kind: 'greens', traits: ['sticky'], loot: 1, levels: 1, flee: -1, blunder: [{ t: 'slot', slot: 'feet' }] },
  { id: 'kz.deep-grub', type: 'monster', level: 3, kind: 'digger', traits: ['sticky', 'sleepy'], loot: 1, levels: 1, blunder: [{ t: 'cards', n: 2 }] },
  { id: 'kz.aphid-army', type: 'monster', level: 3, kind: 'crawler', traits: ['tiny'], loot: 1, levels: 1, mods: [{ when: { kind: 'greens' }, bonus: 3 }], blunder: [{ t: 'slot', slot: 'small' }] },
  { id: 'kz.returning-weed', type: 'monster', level: 4, kind: 'greens', traits: [], loot: 2, levels: 1, flee: -1, blunder: [{ t: 'level', n: 1 }] },
  { id: 'kz.grudge-sprinkler', type: 'monster', level: 4, kind: 'machine', traits: ['wet', 'loud'], loot: 2, levels: 1, mods: [{ when: { kind: 'figurine' }, bonus: 2 }], blunder: [{ t: 'slot', slot: 'body' }] },
  { id: 'kz.hobby-gardener', type: 'monster', level: 4, kind: 'bigmouth', traits: ['loud'], loot: 2, levels: 1, mods: [{ when: { family: 'garden' }, bonus: 3 }], blunder: [{ t: 'best' }] },
  { id: 'kz.tunnel-worm', type: 'monster', level: 5, kind: 'digger', traits: ['bureaucratic'], loot: 2, levels: 1, mods: [{ when: { kind: 'digger' }, bonus: 2 }], blunder: [{ t: 'cards', n: 2 }] },
  { id: 'kz.gold-rat', type: 'monster', level: 5, kind: 'critter', traits: ['shiny'], loot: 2, levels: 1, blunder: [{ t: 'slot', slot: 'small' }] },
  { id: 'kz.bark-beetle-office', type: 'monster', level: 5, kind: 'crawler', traits: ['bureaucratic'], loot: 2, levels: 1, blunder: [{ t: 'cards', n: 3 }] },
  { id: 'kz.leaf-blower', type: 'monster', level: 6, kind: 'machine', traits: ['loud'], loot: 2, levels: 1, mods: [{ when: { kind: 'figurine' }, bonus: 3 }], blunder: [{ t: 'slot', slot: 'head' }] },
  { id: 'kz.compost-blob', type: 'monster', level: 6, kind: 'goo', traits: ['smelly', 'sticky'], loot: 2, levels: 1, flee: -1, blunder: [{ t: 'slot', slot: 'body' }] },
  { id: 'kz.metal-detectorist', type: 'monster', level: 6, kind: 'bigmouth', traits: ['shiny'], loot: 2, levels: 1, blunder: [{ t: 'slot', slot: 'small' }, { t: 'cards', n: 1 }] },
  { id: 'kz.gnome-watch', type: 'monster', level: 7, kind: 'figurine', traits: ['loud'], loot: 2, levels: 1, mods: [{ when: { family: 'fairytale' }, bonus: 3 }], blunder: [{ t: 'level', n: 1 }] },
  { id: 'kz.runaway-cart', type: 'monster', level: 7, kind: 'machine', traits: ['armoured', 'loud'], loot: 2, levels: 1, flee: 1, blunder: [{ t: 'level', n: 1 }, { t: 'slot', slot: 'feet' }] },
  { id: 'kz.mole-foreman', type: 'monster', level: 8, kind: 'digger', traits: ['bureaucratic'], loot: 2, levels: 1, mods: [{ when: { lacks: 'armoured' }, bonus: 2 }], blunder: [{ t: 'level', n: 1 }] },
  { id: 'kz.haunted-gnome', type: 'monster', level: 8, kind: 'spook', traits: ['cold'], loot: 2, levels: 1, mods: [{ when: { family: 'garden' }, bonus: 2 }], blunder: [{ t: 'best' }] },
  { id: 'kz.cave-spider', type: 'monster', level: 8, kind: 'crawler', traits: ['sticky'], loot: 2, levels: 1, flee: -1, blunder: [{ t: 'slot', slot: 'hand' }] },
  { id: 'kz.collector-crow', type: 'monster', level: 9, kind: 'critter', traits: ['flying', 'shiny'], loot: 3, levels: 1, blunder: [{ t: 'best' }] },
  { id: 'kz.hedge-maze', type: 'monster', level: 9, kind: 'greens', traits: ['huge'], loot: 3, levels: 1, flee: -2, blunder: [{ t: 'level', n: 1 }] },
  { id: 'kz.lawnmower', type: 'monster', level: 10, kind: 'machine', traits: ['loud'], loot: 3, levels: 1, mods: [{ when: { lacks: 'bearded' }, bonus: 4 }], blunder: [{ t: 'slot', slot: 'head' }, { t: 'level', n: 1 }] },
  { id: 'kz.rival-crew', type: 'monster', level: 10, kind: 'digger', traits: ['bearded', 'loud'], loot: 3, levels: 1, mods: [{ when: { family: 'garden' }, bonus: 3 }], blunder: [{ t: 'level', n: 1 }, { t: 'cards', n: 1 }] },
  { id: 'kz.last-shift-ghost', type: 'monster', level: 10, kind: 'spook', traits: ['cold', 'ancient'], loot: 3, levels: 1, noFlee: true, blunder: [{ t: 'level', n: 1 }] },
  { id: 'kz.giant-woodlouse', type: 'monster', level: 11, kind: 'crawler', traits: ['armoured'], loot: 3, levels: 1, blunder: [{ t: 'slot', slot: 'body' }, { t: 'level', n: 1 }] },
  { id: 'kz.carnivorous-rose', type: 'monster', level: 11, kind: 'greens', traits: ['sticky'], loot: 3, levels: 1, mods: [{ when: { kind: 'critter' }, bonus: 3 }], blunder: [{ t: 'level', n: 2 }] },
  { id: 'kz.steam-drill', type: 'monster', level: 12, kind: 'machine', traits: ['fiery', 'loud'], loot: 3, levels: 1, blunder: [{ t: 'slot', slot: 'hand' }, { t: 'level', n: 1 }] },
  { id: 'kz.backache-giant', type: 'monster', level: 12, kind: 'bigmouth', traits: ['huge'], loot: 3, levels: 1, flee: 1, blunder: [{ t: 'level', n: 2 }] },
  { id: 'kz.primordial-ooze', type: 'monster', level: 13, kind: 'goo', traits: ['ancient', 'sticky'], loot: 4, levels: 1, flee: -1, blunder: [{ t: 'best' }, { t: 'level', n: 1 }] },
  { id: 'kz.garden-show-jury', type: 'monster', level: 15, kind: 'bigmouth', traits: ['bureaucratic'], loot: 4, levels: 1, mods: [{ when: { kind: 'figurine' }, bonus: 3 }], blunder: [{ t: 'level', n: 2 }, { t: 'cards', n: 2 }] },
  { id: 'kz.mine-king', type: 'monster', level: 16, kind: 'digger', traits: ['ancient', 'bearded'], loot: 4, levels: 2, mods: [{ when: { family: 'garden' }, bonus: 3 }], blunder: [{ t: 'level', n: 2 }, { t: 'best' }] },
  { id: 'kz.shed-thing', type: 'monster', level: 18, kind: 'spook', traits: ['huge', 'ancient'], loot: 5, levels: 2, flee: -1, blunder: [{ t: 'level', n: 3 }] },

  /* ---------- Monster boosters (10) ---------- */
  { id: 'kz.prize-size', type: 'booster', level: 10, loot: 2, traits: ['huge'] },
  { id: 'kz.older-than-the-mine', type: 'booster', level: 10, loot: 2, traits: ['ancient'] },
  { id: 'kz.furious-fence', type: 'booster', level: 5, loot: 1, copies: 2 },
  { id: 'kz.brought-cousins', type: 'booster', level: 5, loot: 1, copies: 2 },
  { id: 'kz.fresh-from-garden-centre', type: 'booster', level: -5, loot: -1, traits: ['tiny'], copies: 2 },
  { id: 'kz.lunch-break', type: 'booster', level: -3, loot: 0, traits: ['sleepy'], copies: 2 },

  /* ---------- Reinforcements (4) and windfalls (2) ---------- */
  { id: 'kz.come-in-pairs', type: 'reinforcement', copies: 2 },
  { id: 'kz.lured-by-noise', type: 'reinforcement', copies: 2 },
  { id: 'kz.tool-shed', type: 'windfall', loot: 2 },
  { id: 'kz.gold-vein', type: 'windfall', loot: 2 },

  /* ---------- Curses (14) ---------- */
  { id: 'kz.beard-in-hedge', type: 'curse', effect: { t: 'level', n: 1 } },
  { id: 'kz.mine-collapse', type: 'curse', effect: { t: 'level', n: 1 } },
  { id: 'kz.wrong-hat', type: 'curse', effect: { t: 'slot', slot: 'head' } },
  { id: 'kz.pink-paint', type: 'curse', effect: { t: 'slot', slot: 'body' } },
  { id: 'kz.shoe-in-pond', type: 'curse', effect: { t: 'slot', slot: 'feet' } },
  { id: 'kz.broken-pickaxe', type: 'curse', effect: { t: 'slot', slot: 'hand' } },
  { id: 'kz.bird-droppings', type: 'curse', effect: { t: 'slot', slot: 'small' } },
  { id: 'kz.fence-dispute', type: 'curse', effect: { t: 'best' } },
  { id: 'kz.neighbour-complaint', type: 'curse', effect: { t: 'cards', n: 2 } },
  { id: 'kz.picnic-ants', type: 'curse', effect: { t: 'cards', n: 2 } },
  { id: 'kz.rain-on-party', type: 'curse', effect: { t: 'malus', n: 3 } },
  { id: 'kz.muddy-boots', type: 'curse', effect: { t: 'malus', n: 2 } },
  { id: 'kz.forgot-password', type: 'curse', effect: { t: 'profession' } },
  { id: 'kz.identity-crisis', type: 'curse', effect: { t: 'origin' } },

  /* ---------- Origins (4) and professions (6) ---------- */
  { id: 'kz.mine-dwarf', type: 'origin', kind: 'digger', family: 'fairytale', traits: ['bearded'], mods: [{ when: { kind: 'spook' }, bonus: 2 }] },
  { id: 'kz.forest-dwarf', type: 'origin', kind: 'digger', family: 'fairytale', traits: ['bearded'], mods: [{ when: { kind: 'greens' }, bonus: 2 }] },
  { id: 'kz.ceramic-gnome', type: 'origin', kind: 'figurine', family: 'garden', traits: ['shiny'], mods: [{ when: { kind: 'machine' }, bonus: 2 }] },
  { id: 'kz.plastic-gnome', type: 'origin', kind: 'figurine', family: 'garden', traits: [], flee: 1 },
  { id: 'kz.treasure-accountant', type: 'profession', sell: 2 },
  { id: 'kz.lawn-sentinel', type: 'profession', perClass: { cls: 'tool', bonus: 1 } },
  { id: 'kz.beard-barber', type: 'profession', perClass: { cls: 'clothing', bonus: 1 } },
  { id: 'kz.mine-foreman', type: 'profession', mods: [{ when: { kind: 'digger' }, bonus: 3 }, { when: { kind: 'machine' }, bonus: 1 }] },
  { id: 'kz.hedge-artist', type: 'profession', mods: [{ when: { kind: 'greens' }, bonus: 3 }, { when: { kind: 'crawler' }, bonus: 1 }] },
  { id: 'kz.night-watch', type: 'profession', mods: [{ when: { kind: 'spook' }, bonus: 3 }], flee: 1 },

  /* ---------- Items (34) ---------- */
  // head (6)
  { id: 'kz.pointy-hat', type: 'item', slot: 'head', bonus: 1, value: 2, cls: 'clothing', self: [{ when: { family: 'garden' }, bonus: 2 }], set: 'gnome-outfit' },
  { id: 'kz.lamp-helmet', type: 'item', slot: 'head', bonus: 2, value: 3, cls: 'gadget', traits: ['electric'], mods: [{ when: { kind: 'spook' }, bonus: 2 }], set: 'mining-gear' },
  { id: 'kz.flowerpot-helmet', type: 'item', slot: 'head', bonus: 1, value: 1, cls: 'junk', traits: ['armoured'] },
  { id: 'kz.mine-king-crown', type: 'item', slot: 'head', bonus: 3, value: 6, cls: 'clothing', traits: ['shiny'] },
  { id: 'kz.watering-hat', type: 'item', slot: 'head', bonus: 1, value: 2, cls: 'junk', traits: ['wet'], mods: [{ when: { trait: 'fiery' }, bonus: 2 }] },
  { id: 'kz.hard-hat', type: 'item', slot: 'head', bonus: 2, value: 3, cls: 'clothing', traits: ['armoured'] },
  // body (5)
  { id: 'kz.leather-apron', type: 'item', slot: 'body', bonus: 1, value: 2, cls: 'clothing', set: 'mining-gear' },
  { id: 'kz.bottlecap-mail', type: 'item', slot: 'body', bonus: 3, value: 5, cls: 'clothing', traits: ['armoured', 'shiny'] },
  { id: 'kz.gnome-overalls', type: 'item', slot: 'body', bonus: 2, value: 3, cls: 'clothing', self: [{ when: { family: 'garden' }, bonus: 1 }] },
  { id: 'kz.compost-cloak', type: 'item', slot: 'body', bonus: 2, value: 2, cls: 'clothing', traits: ['smelly'], mods: [{ when: { kind: 'crawler' }, bonus: 2 }] },
  { id: 'kz.hi-vis-vest', type: 'item', slot: 'body', bonus: 1, value: 2, cls: 'clothing', flee: 1 },
  // feet (4)
  { id: 'kz.steel-toe-boots', type: 'item', slot: 'feet', bonus: 2, value: 3, cls: 'clothing', traits: ['armoured'] },
  { id: 'kz.garden-clogs', type: 'item', slot: 'feet', bonus: 1, value: 2, cls: 'clothing', flee: 1, set: 'gnome-outfit' },
  { id: 'kz.league-slippers', type: 'item', slot: 'feet', bonus: 1, value: 4, cls: 'clothing', flee: 2 },
  { id: 'kz.rubber-boots', type: 'item', slot: 'feet', bonus: 1, value: 2, cls: 'clothing', mods: [{ when: { trait: 'wet' }, bonus: 2 }] },
  // hands (12)
  { id: 'kz.pickaxe', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 3, cls: 'tool', mods: [{ when: { kind: 'digger' }, bonus: 1 }], set: 'mining-gear' },
  { id: 'kz.garden-hose', type: 'item', slot: 'hand', hands: 2, bonus: 3, value: 3, cls: 'tool', traits: ['wet'], mods: [{ when: { trait: 'fiery' }, bonus: 3 }] },
  { id: 'kz.rake-of-reckoning', type: 'item', slot: 'hand', hands: 2, bonus: 4, value: 4, cls: 'tool' },
  { id: 'kz.garden-shears', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 3, cls: 'tool', mods: [{ when: { kind: 'greens' }, bonus: 2 }], set: 'gnome-outfit' },
  { id: 'kz.shovel', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 2, cls: 'tool', mods: [{ when: { kind: 'goo' }, bonus: 2 }] },
  { id: 'kz.golden-hammer', type: 'item', slot: 'hand', hands: 1, big: true, bonus: 4, value: 6, cls: 'weapon', traits: ['shiny'] },
  { id: 'kz.lantern-stick', type: 'item', slot: 'hand', hands: 1, bonus: 1, value: 2, cls: 'gadget', traits: ['fiery'], mods: [{ when: { kind: 'spook' }, bonus: 3 }] },
  { id: 'kz.doom-watering-can', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 2, cls: 'tool', traits: ['wet'], mods: [{ when: { trait: 'fiery' }, bonus: 2 }] },
  { id: 'kz.slingshot', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 2, cls: 'weapon', mods: [{ when: { trait: 'flying' }, bonus: 3 }] },
  { id: 'kz.wheelbarrow-ram', type: 'item', slot: 'hand', hands: 2, big: true, bonus: 5, value: 5, cls: 'junk' },
  { id: 'kz.gnome-spear', type: 'item', slot: 'hand', hands: 1, bonus: 3, value: 4, cls: 'weapon', self: [{ when: { family: 'garden' }, bonus: 1 }] },
  { id: 'kz.pruning-saw', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 3, cls: 'tool', mods: [{ when: { kind: 'crawler' }, bonus: 2 }] },
  // small (7)
  { id: 'kz.beard-comb', type: 'item', slot: 'small', bonus: 2, value: 3, cls: 'tool', self: [{ when: { family: 'fairytale' }, bonus: 1 }] },
  { id: 'kz.fake-beard', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'clothing', traits: ['bearded'] },
  { id: 'kz.lucky-charm', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'junk', flee: 1 },
  { id: 'kz.gold-nugget', type: 'item', slot: 'small', bonus: 0, value: 8, cls: 'junk', traits: ['shiny'] },
  { id: 'kz.moss-earplugs', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'gadget', mods: [{ when: { trait: 'loud' }, bonus: 3 }] },
  { id: 'kz.mine-tea', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'food', mods: [{ when: { trait: 'cold' }, bonus: 2 }] },
  { id: 'kz.allotment-map', type: 'item', slot: 'small', bonus: 0, value: 3, cls: 'junk', flee: 2 },

  /* ---------- Upgrades (6) ---------- */
  { id: 'kz.taped-up', type: 'upgrade', bonus: 2, copies: 2 },
  { id: 'kz.freshly-polished', type: 'upgrade', bonus: 1, traits: ['shiny'], copies: 2 },
  { id: 'kz.turbo-attachment', type: 'upgrade', bonus: 3, traits: ['loud'] },
  { id: 'kz.lucky-rune', type: 'upgrade', bonus: 2, traits: ['ancient'] },

  /* ---------- One-shots (14) ---------- */
  { id: 'kz.bottled-thunderstorm', type: 'oneshot', bonus: 3, value: 2, copies: 2 },
  { id: 'kz.gnome-superglue', type: 'oneshot', bonus: 2, value: 1, copies: 2 },
  { id: 'kz.mine-gas', type: 'oneshot', bonus: 5, value: 3 },
  { id: 'kz.firecracker', type: 'oneshot', bonus: 4, value: 3 },
  { id: 'kz.thermos-soup', type: 'oneshot', bonus: 2, value: 1 },
  { id: 'kz.bag-of-gravel', type: 'oneshot', bonus: 2, value: 1 },
  { id: 'kz.seven-shovels-song', type: 'oneshot', bonus: 4, value: 2 },
  { id: 'kz.shiny-distraction', type: 'oneshot', bonus: 0, value: 1, flee: 3, copies: 2 },
  { id: 'kz.side-tunnel', type: 'oneshot', bonus: 0, value: 2, escape: true, copies: 2 },
  { id: 'kz.watering-ambush', type: 'oneshot', bonus: 3, value: 2 },

  /* ---------- Level-ups (6) and doubles (4) ---------- */
  { id: 'kz.senior-gnome', type: 'levelup', copies: 2 },
  { id: 'kz.mine-birthday', type: 'levelup', copies: 2 },
  { id: 'kz.overnight-beard', type: 'levelup', copies: 2 },
  { id: 'kz.patchwork-ancestry', type: 'double', of: 'origin', copies: 2 },
  { id: 'kz.second-job', type: 'double', of: 'profession', copies: 2 }
];

export const KAMPFZWERGE: World = {
  id: 'kz',
  cards,
  sets: [
    { id: 'mining-gear', items: ['kz.pickaxe', 'kz.lamp-helmet', 'kz.leather-apron'], bonus: 3 },
    { id: 'gnome-outfit', items: ['kz.pointy-hat', 'kz.garden-clogs', 'kz.garden-shears'], bonus: 3 }
  ]
};
