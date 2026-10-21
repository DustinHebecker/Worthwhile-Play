import type { CardEntry, World } from '../cards';

/**
 * World 4 — Fridge (design § 4.4): an expedition to the back of the fridge — fresh food against leftovers, mild mould,
 * the freezer drawer as an ice age. Same composition and level budget as Kampfzwerge:
 * 142 cards: 76 encounter (36 monsters, 10 boosters, 4 reinforcements, 2 windfalls, 14 curses, 4 origins,
 * 6 professions) and 66 loot (34 items, 6 upgrades, 16 one-shots incl. 2 Change Sides, 6 level-ups, 4 doubles).
 * Language-free; texts per locale in `content/fd/<locale>.ts` under the same ids.
 */
const cards: readonly CardEntry[] = [
  /* ---------- Monsters (36): all 9 base kinds ---------- */
  { id: 'fd.lonely-pea', type: 'monster', level: 1, kind: 'greens', traits: ['tiny'], loot: 1, levels: 1, blunder: [{ t: 'cards', n: 1 }] },
  { id: 'fd.lost-hedgehog', type: 'monster', level: 1, kind: 'critter', traits: ['sleepy', 'cold'], loot: 1, levels: 1, flee: 2, blunder: [{ t: 'slot', slot: 'feet' }] },
  { id: 'fd.light-ghost', type: 'monster', level: 2, kind: 'spook', traits: ['electric'], loot: 1, levels: 1, blunder: [{ t: 'cards', n: 1 }] },
  { id: 'fd.fruit-magnet', type: 'monster', level: 2, kind: 'figurine', traits: ['shiny'], loot: 1, levels: 1, mods: [{ when: { family: 'leftover' }, bonus: 2 }], blunder: [{ t: 'slot', slot: 'head' }] },
  { id: 'fd.runaway-jam', type: 'monster', level: 2, kind: 'goo', traits: ['sticky', 'wet'], loot: 1, levels: 1, blunder: [{ t: 'slot', slot: 'feet' }] },
  { id: 'fd.freezer-penguin', type: 'monster', level: 3, kind: 'critter', traits: ['cold', 'loud'], loot: 1, levels: 1, blunder: [{ t: 'level', n: 1 }] },
  { id: 'fd.lonely-pickle', type: 'monster', level: 3, kind: 'greens', traits: ['wet'], loot: 1, levels: 1, flee: -1, blunder: [{ t: 'slot', slot: 'feet' }] },
  { id: 'fd.sprouting-potato', type: 'monster', level: 3, kind: 'digger', traits: ['sleepy', 'ancient'], loot: 1, levels: 1, blunder: [{ t: 'cards', n: 2 }] },
  { id: 'fd.crumb-ants', type: 'monster', level: 3, kind: 'crawler', traits: ['tiny'], loot: 1, levels: 1, mods: [{ when: { kind: 'goo' }, bonus: 3 }], blunder: [{ t: 'slot', slot: 'small' }] },
  { id: 'fd.wilted-lettuce', type: 'monster', level: 4, kind: 'greens', traits: [], loot: 2, levels: 1, flee: -1, blunder: [{ t: 'level', n: 1 }] },
  { id: 'fd.ice-maker', type: 'monster', level: 4, kind: 'machine', traits: ['cold', 'loud'], loot: 2, levels: 1, mods: [{ when: { kind: 'greens' }, bonus: 2 }], blunder: [{ t: 'slot', slot: 'body' }] },
  { id: 'fd.midnight-snacker', type: 'monster', level: 4, kind: 'bigmouth', traits: ['sleepy'], loot: 2, levels: 1, mods: [{ when: { family: 'fresh' }, bonus: 3 }], blunder: [{ t: 'best' }] },
  { id: 'fd.veg-drawer-mole', type: 'monster', level: 5, kind: 'digger', traits: ['wet'], loot: 2, levels: 1, mods: [{ when: { kind: 'greens' }, bonus: 2 }], blunder: [{ t: 'cards', n: 2 }] },
  { id: 'fd.cheese-mouse', type: 'monster', level: 5, kind: 'critter', traits: ['shiny'], loot: 2, levels: 1, blunder: [{ t: 'slot', slot: 'small' }] },
  { id: 'fd.best-before-beetle', type: 'monster', level: 5, kind: 'crawler', traits: ['bureaucratic'], loot: 2, levels: 1, blunder: [{ t: 'cards', n: 3 }] },
  { id: 'fd.megalomaniac-blender', type: 'monster', level: 6, kind: 'machine', traits: ['loud'], loot: 2, levels: 1, mods: [{ when: { kind: 'goo' }, bonus: 3 }], blunder: [{ t: 'slot', slot: 'head' }] },
  { id: 'fd.walking-cheese', type: 'monster', level: 6, kind: 'goo', traits: ['smelly', 'sticky'], loot: 2, levels: 1, flee: -1, blunder: [{ t: 'slot', slot: 'body' }] },
  { id: 'fd.food-box-uncle', type: 'monster', level: 6, kind: 'bigmouth', traits: ['shiny'], loot: 2, levels: 1, blunder: [{ t: 'slot', slot: 'small' }, { t: 'cards', n: 1 }] },
  { id: 'fd.egg-cup-guard', type: 'monster', level: 7, kind: 'figurine', traits: ['loud'], loot: 2, levels: 1, mods: [{ when: { family: 'leftover' }, bonus: 3 }], blunder: [{ t: 'level', n: 1 }] },
  { id: 'fd.drinks-crate', type: 'monster', level: 7, kind: 'machine', traits: ['armoured', 'loud'], loot: 2, levels: 1, flee: 1, blunder: [{ t: 'level', n: 1 }, { t: 'slot', slot: 'feet' }] },
  { id: 'fd.food-inspection', type: 'monster', level: 8, kind: 'bigmouth', traits: ['bureaucratic'], loot: 2, levels: 1, mods: [{ when: { lacks: 'cold' }, bonus: 2 }], blunder: [{ t: 'level', n: 1 }] },
  { id: 'fd.freezer-ghost', type: 'monster', level: 8, kind: 'spook', traits: ['cold'], loot: 2, levels: 1, mods: [{ when: { family: 'fresh' }, bonus: 2 }], blunder: [{ t: 'best' }] },
  { id: 'fd.fruit-flies', type: 'monster', level: 8, kind: 'crawler', traits: ['flying'], loot: 2, levels: 1, flee: -1, blunder: [{ t: 'slot', slot: 'hand' }] },
  { id: 'fd.door-opening-cat', type: 'monster', level: 9, kind: 'critter', traits: ['loud'], loot: 3, levels: 1, blunder: [{ t: 'best' }] },
  { id: 'fd.broccoli-forest', type: 'monster', level: 9, kind: 'greens', traits: ['huge'], loot: 3, levels: 1, flee: -2, blunder: [{ t: 'level', n: 1 }] },
  { id: 'fd.slamming-door', type: 'monster', level: 10, kind: 'machine', traits: ['cold', 'electric'], loot: 3, levels: 1, mods: [{ when: { lacks: 'armoured' }, bonus: 4 }], blunder: [{ t: 'slot', slot: 'head' }, { t: 'level', n: 1 }] },
  { id: 'fd.sunday-breakfast', type: 'monster', level: 10, kind: 'bigmouth', traits: ['loud', 'huge'], loot: 3, levels: 1, mods: [{ when: { family: 'fresh' }, bonus: 3 }], blunder: [{ t: 'level', n: 1 }, { t: 'cards', n: 1 }] },
  { id: 'fd.ageless-yoghurt', type: 'monster', level: 10, kind: 'goo', traits: ['ancient', 'smelly'], loot: 3, levels: 1, noFlee: true, blunder: [{ t: 'level', n: 1 }] },
  { id: 'fd.deli-crab', type: 'monster', level: 11, kind: 'crawler', traits: ['armoured', 'cold'], loot: 3, levels: 1, blunder: [{ t: 'slot', slot: 'body' }, { t: 'level', n: 1 }] },
  { id: 'fd.biting-cabbage', type: 'monster', level: 11, kind: 'greens', traits: ['sticky'], loot: 3, levels: 1, mods: [{ when: { kind: 'critter' }, bonus: 3 }], blunder: [{ t: 'level', n: 2 }] },
  { id: 'fd.microwave-next-door', type: 'monster', level: 12, kind: 'machine', traits: ['fiery', 'loud'], loot: 3, levels: 1, blunder: [{ t: 'slot', slot: 'hand' }, { t: 'level', n: 1 }] },
  { id: 'fd.forgotten-lasagne', type: 'monster', level: 12, kind: 'goo', traits: ['huge', 'smelly'], loot: 3, levels: 1, flee: 1, blunder: [{ t: 'level', n: 2 }] },
  { id: 'fd.freezer-burn', type: 'monster', level: 13, kind: 'spook', traits: ['ancient', 'cold'], loot: 4, levels: 1, flee: -1, blunder: [{ t: 'best' }, { t: 'level', n: 1 }] },
  { id: 'fd.grandma-tidies-up', type: 'monster', level: 15, kind: 'bigmouth', traits: ['bureaucratic'], loot: 4, levels: 1, mods: [{ when: { kind: 'goo' }, bonus: 3 }], blunder: [{ t: 'level', n: 2 }, { t: 'cards', n: 2 }] },
  { id: 'fd.freezer-glacier', type: 'monster', level: 16, kind: 'digger', traits: ['cold', 'huge'], loot: 4, levels: 2, mods: [{ when: { family: 'leftover' }, bonus: 3 }], blunder: [{ t: 'level', n: 2 }, { t: 'best' }] },
  { id: 'fd.thing-at-the-back', type: 'monster', level: 18, kind: 'spook', traits: ['ancient', 'smelly'], loot: 5, levels: 2, flee: -1, blunder: [{ t: 'level', n: 3 }] },

  /* ---------- Monster boosters (10) ---------- */
  { id: 'fd.family-pack', type: 'booster', level: 10, loot: 2, traits: ['huge'] },
  { id: 'fd.best-before-1990', type: 'booster', level: 10, loot: 2, traits: ['ancient'] },
  { id: 'fd.extra-garlic', type: 'booster', level: 5, loot: 1, copies: 2 },
  { id: 'fd.with-gravy', type: 'booster', level: 5, loot: 1, copies: 2 },
  { id: 'fd.diet-version', type: 'booster', level: -5, loot: -1, traits: ['tiny'], copies: 2 },
  { id: 'fd.cold-sleep', type: 'booster', level: -3, loot: 0, traits: ['sleepy'], copies: 2 },

  /* ---------- Reinforcements (4) and windfalls (2) ---------- */
  { id: 'fd.something-behind', type: 'reinforcement', copies: 2 },
  { id: 'fd.door-open-too-long', type: 'reinforcement', copies: 2 },
  { id: 'fd.full-shopping-basket', type: 'windfall', loot: 2 },
  { id: 'fd.grandmas-pantry', type: 'windfall', loot: 2 },

  /* ---------- Curses (14) ---------- */
  { id: 'fd.is-the-light-off', type: 'curse', effect: { t: 'level', n: 1 } },
  { id: 'fd.forgot-shopping', type: 'curse', effect: { t: 'level', n: 1 } },
  { id: 'fd.ice-cube-in-hat', type: 'curse', effect: { t: 'slot', slot: 'head' } },
  { id: 'fd.ketchup-stain', type: 'curse', effect: { t: 'slot', slot: 'body' } },
  { id: 'fd.defrost-puddle', type: 'curse', effect: { t: 'slot', slot: 'feet' } },
  { id: 'fd.butter-fingers', type: 'curse', effect: { t: 'slot', slot: 'hand' } },
  { id: 'fd.fridge-jigsaw', type: 'curse', effect: { t: 'slot', slot: 'small' } },
  { id: 'fd.who-ate-my-pudding', type: 'curse', effect: { t: 'best' } },
  { id: 'fd.dropped-eggs', type: 'curse', effect: { t: 'cards', n: 2 } },
  { id: 'fd.expired', type: 'curse', effect: { t: 'cards', n: 2 } },
  { id: 'fd.brain-freeze', type: 'curse', effect: { t: 'malus', n: 3 } },
  { id: 'fd.too-much-lemon', type: 'curse', effect: { t: 'malus', n: 2 } },
  { id: 'fd.kitchen-duty-swap', type: 'curse', effect: { t: 'profession' } },
  { id: 'fd.decanted', type: 'curse', effect: { t: 'origin' } },

  /* ---------- Origins (4) and professions (6) ---------- */
  { id: 'fd.brave-radish', type: 'origin', kind: 'greens', family: 'fresh', traits: [], mods: [{ when: { kind: 'goo' }, bonus: 2 }] },
  { id: 'fd.fresh-milk', type: 'origin', kind: 'goo', family: 'fresh', traits: ['cold'], flee: 1 },
  { id: 'fd.yesterdays-pizza', type: 'origin', kind: 'goo', family: 'leftover', traits: ['smelly'], mods: [{ when: { kind: 'machine' }, bonus: 2 }] },
  { id: 'fd.mummified-lemon', type: 'origin', kind: 'greens', family: 'leftover', traits: ['ancient'], mods: [{ when: { kind: 'critter' }, bonus: 2 }] },
  { id: 'fd.leftover-chef', type: 'profession', sell: 2 },
  { id: 'fd.kitchen-help', type: 'profession', perClass: { cls: 'tool', bonus: 1 } },
  { id: 'fd.gourmet', type: 'profession', perClass: { cls: 'food', bonus: 2 } },
  { id: 'fd.fridge-technician', type: 'profession', mods: [{ when: { kind: 'machine' }, bonus: 3 }, { when: { kind: 'figurine' }, bonus: 1 }] },
  { id: 'fd.herb-gardener', type: 'profession', mods: [{ when: { kind: 'greens' }, bonus: 3 }, { when: { kind: 'crawler' }, bonus: 1 }] },
  { id: 'fd.midnight-inspector', type: 'profession', mods: [{ when: { kind: 'spook' }, bonus: 3 }], flee: 1 },

  /* ---------- Items (34) ---------- */
  // head (6)
  { id: 'fd.chef-hat', type: 'item', slot: 'head', bonus: 1, value: 2, cls: 'clothing', self: [{ when: { family: 'fresh' }, bonus: 2 }], set: 'chef-kit' },
  { id: 'fd.headlamp', type: 'item', slot: 'head', bonus: 2, value: 3, cls: 'gadget', traits: ['electric'], mods: [{ when: { kind: 'spook' }, bonus: 2 }], set: 'fridge-raider' },
  { id: 'fd.salad-bowl-helmet', type: 'item', slot: 'head', bonus: 1, value: 1, cls: 'junk', traits: ['armoured'] },
  { id: 'fd.egg-cup-crown', type: 'item', slot: 'head', bonus: 3, value: 6, cls: 'clothing', traits: ['shiny'] },
  { id: 'fd.frozen-peas-hat', type: 'item', slot: 'head', bonus: 1, value: 2, cls: 'junk', traits: ['cold'], mods: [{ when: { trait: 'fiery' }, bonus: 2 }] },
  { id: 'fd.pot-helmet', type: 'item', slot: 'head', bonus: 2, value: 3, cls: 'clothing', traits: ['armoured'] },
  // body (5)
  { id: 'fd.snack-pyjamas', type: 'item', slot: 'body', bonus: 1, value: 2, cls: 'clothing', set: 'fridge-raider' },
  { id: 'fd.foil-armour', type: 'item', slot: 'body', bonus: 3, value: 5, cls: 'clothing', traits: ['armoured', 'shiny'] },
  { id: 'fd.stained-apron', type: 'item', slot: 'body', bonus: 2, value: 3, cls: 'clothing', self: [{ when: { family: 'leftover' }, bonus: 1 }] },
  { id: 'fd.garlic-cape', type: 'item', slot: 'body', bonus: 2, value: 2, cls: 'clothing', traits: ['smelly'], mods: [{ when: { kind: 'crawler' }, bonus: 2 }] },
  { id: 'fd.slippery-apron', type: 'item', slot: 'body', bonus: 1, value: 2, cls: 'clothing', flee: 1 },
  // feet (4)
  { id: 'fd.snow-boots', type: 'item', slot: 'feet', bonus: 2, value: 3, cls: 'clothing', traits: ['armoured'] },
  { id: 'fd.kitchen-clogs', type: 'item', slot: 'feet', bonus: 1, value: 2, cls: 'clothing', flee: 1, set: 'chef-kit' },
  { id: 'fd.roller-skates', type: 'item', slot: 'feet', bonus: 1, value: 4, cls: 'clothing', flee: 2 },
  { id: 'fd.spiked-slippers', type: 'item', slot: 'feet', bonus: 1, value: 2, cls: 'clothing', mods: [{ when: { trait: 'cold' }, bonus: 2 }] },
  // hands (12)
  { id: 'fd.tongs', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 3, cls: 'tool', mods: [{ when: { kind: 'goo' }, bonus: 1 }], set: 'fridge-raider' },
  { id: 'fd.soda-siphon', type: 'item', slot: 'hand', hands: 2, bonus: 3, value: 3, cls: 'tool', traits: ['wet'], mods: [{ when: { trait: 'fiery' }, bonus: 3 }] },
  { id: 'fd.rolling-pin', type: 'item', slot: 'hand', hands: 2, bonus: 4, value: 4, cls: 'tool' },
  { id: 'fd.wooden-spoon', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 3, cls: 'tool', mods: [{ when: { kind: 'greens' }, bonus: 2 }], set: 'chef-kit' },
  { id: 'fd.soup-ladle', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 2, cls: 'tool', mods: [{ when: { kind: 'goo' }, bonus: 2 }] },
  { id: 'fd.golden-whisk', type: 'item', slot: 'hand', hands: 1, big: true, bonus: 4, value: 6, cls: 'weapon', traits: ['shiny'] },
  { id: 'fd.sparkler', type: 'item', slot: 'hand', hands: 1, bonus: 1, value: 2, cls: 'gadget', traits: ['fiery'], mods: [{ when: { kind: 'spook' }, bonus: 3 }] },
  { id: 'fd.oven-mitt', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 2, cls: 'clothing', mods: [{ when: { trait: 'fiery' }, bonus: 2 }] },
  { id: 'fd.electric-swatter', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 2, cls: 'gadget', traits: ['electric'], mods: [{ when: { trait: 'flying' }, bonus: 3 }] },
  { id: 'fd.drinks-crate-ram', type: 'item', slot: 'hand', hands: 2, big: true, bonus: 5, value: 5, cls: 'junk' },
  { id: 'fd.frying-pan', type: 'item', slot: 'hand', hands: 1, bonus: 3, value: 4, cls: 'weapon', self: [{ when: { family: 'fresh' }, bonus: 1 }] },
  { id: 'fd.crumb-vacuum', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 3, cls: 'gadget', mods: [{ when: { kind: 'crawler' }, bonus: 2 }] },
  // small (7)
  { id: 'fd.salt-shaker', type: 'item', slot: 'small', bonus: 2, value: 3, cls: 'tool', self: [{ when: { family: 'leftover' }, bonus: 1 }] },
  { id: 'fd.milk-moustache', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'clothing', traits: ['bearded'] },
  { id: 'fd.fortune-cookie', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'food', flee: 1 },
  { id: 'fd.tin-of-caviar', type: 'item', slot: 'small', bonus: 0, value: 8, cls: 'junk', traits: ['shiny'] },
  { id: 'fd.bread-earplugs', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'food', mods: [{ when: { trait: 'loud' }, bonus: 3 }] },
  { id: 'fd.hot-broth', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'food', mods: [{ when: { trait: 'cold' }, bonus: 2 }] },
  { id: 'fd.supermarket-map', type: 'item', slot: 'small', bonus: 0, value: 3, cls: 'junk', flee: 2 },

  /* ---------- Upgrades (6) ---------- */
  { id: 'fd.cling-wrapped', type: 'upgrade', bonus: 2, copies: 2 },
  { id: 'fd.glazed', type: 'upgrade', bonus: 1, traits: ['shiny'], copies: 2 },
  { id: 'fd.extra-hot', type: 'upgrade', bonus: 3, traits: ['fiery'] },
  { id: 'fd.grandmas-recipe', type: 'upgrade', bonus: 2, traits: ['ancient'] },

  /* ---------- One-shots (16 incl. Change Sides) ---------- */
  { id: 'fd.fizz-explosion', type: 'oneshot', bonus: 3, value: 2, copies: 2 },
  { id: 'fd.caramel-sauce', type: 'oneshot', bonus: 2, value: 1, copies: 2 },
  { id: 'fd.whole-tube-of-mustard', type: 'oneshot', bonus: 5, value: 3 },
  { id: 'fd.popcorn-blast', type: 'oneshot', bonus: 4, value: 3 },
  { id: 'fd.flying-peas', type: 'oneshot', bonus: 2, value: 1 },
  { id: 'fd.handful-of-crumbs', type: 'oneshot', bonus: 2, value: 1 },
  { id: 'fd.humming-choir', type: 'oneshot', bonus: 4, value: 2 },
  { id: 'fd.butter-on-the-floor', type: 'oneshot', bonus: 0, value: 1, flee: 3, copies: 2 },
  { id: 'fd.behind-the-ketchup', type: 'oneshot', bonus: 0, value: 2, escape: true, copies: 2 },
  { id: 'fd.ice-cube-avalanche', type: 'oneshot', bonus: 3, value: 2 },
  { id: 'fd.shelf-swap', type: 'oneshot', bonus: 0, value: 1, turncoat: true, copies: 2 },

  /* ---------- Level-ups (6) and doubles (4) ---------- */
  { id: 'fd.top-shelf', type: 'levelup', copies: 2 },
  { id: 'fd.freshly-reheated', type: 'levelup', copies: 2 },
  { id: 'fd.in-the-cookbook', type: 'levelup', copies: 2 },
  { id: 'fd.fusion-cuisine', type: 'double', of: 'origin', copies: 2 },
  { id: 'fd.side-dish', type: 'double', of: 'profession', copies: 2 }
];

export const FRIDGE: World = {
  id: 'fd',
  cards,
  sets: [
    { id: 'fridge-raider', items: ['fd.tongs', 'fd.headlamp', 'fd.snack-pyjamas'], bonus: 3 },
    { id: 'chef-kit', items: ['fd.chef-hat', 'fd.kitchen-clogs', 'fd.wooden-spoon'], bonus: 3 }
  ]
};
