import type { CardEntry, World } from '../cards';

/**
 * World 3 — Office (design § 4.3): the office against the home office — meetings as monsters, the printer as
 * nemesis, the sofa as a battlefield. Same composition and level budget as Kampfzwerge:
 * 142 cards: 76 encounter (36 monsters, 10 boosters, 4 reinforcements, 2 windfalls, 14 curses, 4 origins,
 * 6 professions) and 66 loot (34 items, 6 upgrades, 16 one-shots incl. 2 Change Sides, 6 level-ups, 4 doubles).
 * Language-free; texts per locale in `content/of/<locale>.ts` under the same ids.
 */
const cards: readonly CardEntry[] = [
  /* ---------- Monsters (36): all 9 base kinds ---------- */
  { id: 'of.stress-ball', type: 'monster', level: 1, kind: 'figurine', traits: ['tiny'], loot: 1, levels: 1, blunder: [{ t: 'cards', n: 1 }] },
  { id: 'of.goldfish', type: 'monster', level: 1, kind: 'critter', traits: ['wet', 'sleepy'], loot: 1, levels: 1, flee: 2, blunder: [{ t: 'slot', slot: 'feet' }] },
  { id: 'of.spam-ghost', type: 'monster', level: 2, kind: 'spook', traits: ['electric'], loot: 1, levels: 1, blunder: [{ t: 'cards', n: 1 }] },
  { id: 'of.bobblehead-boss', type: 'monster', level: 2, kind: 'figurine', traits: ['shiny'], loot: 1, levels: 1, mods: [{ when: { family: 'remote' }, bonus: 2 }], blunder: [{ t: 'slot', slot: 'head' }] },
  { id: 'of.coffee-stain', type: 'monster', level: 2, kind: 'goo', traits: ['sticky', 'wet'], loot: 1, levels: 1, blunder: [{ t: 'slot', slot: 'feet' }] },
  { id: 'of.open-plan-parrot', type: 'monster', level: 3, kind: 'critter', traits: ['flying', 'loud'], loot: 1, levels: 1, blunder: [{ t: 'level', n: 1 }] },
  { id: 'of.predecessor-cactus', type: 'monster', level: 3, kind: 'greens', traits: ['sticky'], loot: 1, levels: 1, flee: -1, blunder: [{ t: 'slot', slot: 'feet' }] },
  { id: 'of.archive-mole', type: 'monster', level: 3, kind: 'digger', traits: ['sleepy', 'ancient'], loot: 1, levels: 1, blunder: [{ t: 'cards', n: 2 }] },
  { id: 'of.crumb-beetle', type: 'monster', level: 3, kind: 'crawler', traits: ['tiny'], loot: 1, levels: 1, mods: [{ when: { kind: 'machine' }, bonus: 3 }], blunder: [{ t: 'slot', slot: 'small' }] },
  { id: 'of.team-bonsai', type: 'monster', level: 4, kind: 'greens', traits: [], loot: 2, levels: 1, flee: -1, blunder: [{ t: 'level', n: 1 }] },
  { id: 'of.burnout-coffee-machine', type: 'monster', level: 4, kind: 'machine', traits: ['wet', 'loud'], loot: 2, levels: 1, mods: [{ when: { kind: 'bigmouth' }, bonus: 2 }], blunder: [{ t: 'slot', slot: 'body' }] },
  { id: 'of.drilling-neighbour', type: 'monster', level: 4, kind: 'bigmouth', traits: ['loud'], loot: 2, levels: 1, mods: [{ when: { family: 'remote' }, bonus: 3 }], blunder: [{ t: 'best' }] },
  { id: 'of.building-site', type: 'monster', level: 5, kind: 'digger', traits: ['loud'], loot: 2, levels: 1, mods: [{ when: { kind: 'bigmouth' }, bonus: 2 }], blunder: [{ t: 'cards', n: 2 }] },
  { id: 'of.window-pigeon', type: 'monster', level: 5, kind: 'critter', traits: ['flying'], loot: 2, levels: 1, blunder: [{ t: 'slot', slot: 'small' }] },
  { id: 'of.file-mites', type: 'monster', level: 5, kind: 'crawler', traits: ['bureaucratic', 'tiny'], loot: 2, levels: 1, blunder: [{ t: 'cards', n: 3 }] },
  { id: 'of.jammed-printer', type: 'monster', level: 6, kind: 'machine', traits: ['loud'], loot: 2, levels: 1, mods: [{ when: { kind: 'greens' }, bonus: 3 }], blunder: [{ t: 'slot', slot: 'head' }] },
  { id: 'of.microwave-fish-soup', type: 'monster', level: 6, kind: 'goo', traits: ['smelly', 'fiery'], loot: 2, levels: 1, flee: -1, blunder: [{ t: 'slot', slot: 'body' }] },
  { id: 'of.it-support', type: 'monster', level: 6, kind: 'bigmouth', traits: ['electric'], loot: 2, levels: 1, blunder: [{ t: 'slot', slot: 'small' }, { t: 'cards', n: 1 }] },
  { id: 'of.motivation-poster', type: 'monster', level: 7, kind: 'figurine', traits: ['shiny'], loot: 2, levels: 1, mods: [{ when: { family: 'office' }, bonus: 3 }], blunder: [{ t: 'level', n: 1 }] },
  { id: 'of.turbo-office-chair', type: 'monster', level: 7, kind: 'machine', traits: ['armoured', 'loud'], loot: 2, levels: 1, flee: 1, blunder: [{ t: 'level', n: 1 }, { t: 'slot', slot: 'feet' }] },
  { id: 'of.compliance-check', type: 'monster', level: 8, kind: 'bigmouth', traits: ['bureaucratic'], loot: 2, levels: 1, mods: [{ when: { lacks: 'bureaucratic' }, bonus: 2 }], blunder: [{ t: 'level', n: 1 }] },
  { id: 'of.camera-off', type: 'monster', level: 8, kind: 'spook', traits: ['cold'], loot: 2, levels: 1, mods: [{ when: { family: 'remote' }, bonus: 2 }], blunder: [{ t: 'best' }] },
  { id: 'of.monitor-spider', type: 'monster', level: 8, kind: 'crawler', traits: ['sticky'], loot: 2, levels: 1, flee: -1, blunder: [{ t: 'slot', slot: 'hand' }] },
  { id: 'of.bosss-dog', type: 'monster', level: 9, kind: 'critter', traits: ['loud', 'smelly'], loot: 3, levels: 1, blunder: [{ t: 'best' }] },
  { id: 'of.open-plan-jungle', type: 'monster', level: 9, kind: 'greens', traits: ['huge', 'wet'], loot: 3, levels: 1, flee: -2, blunder: [{ t: 'level', n: 1 }] },
  { id: 'of.frozen-video-call', type: 'monster', level: 10, kind: 'machine', traits: ['electric', 'cold'], loot: 3, levels: 1, mods: [{ when: { lacks: 'electric' }, bonus: 4 }], blunder: [{ t: 'slot', slot: 'head' }, { t: 'level', n: 1 }] },
  { id: 'of.team-building', type: 'monster', level: 10, kind: 'bigmouth', traits: ['loud'], loot: 3, levels: 1, mods: [{ when: { family: 'office' }, bonus: 3 }], blunder: [{ t: 'level', n: 1 }, { t: 'cards', n: 1 }] },
  { id: 'of.endless-meeting', type: 'monster', level: 10, kind: 'spook', traits: ['bureaucratic', 'sleepy'], loot: 3, levels: 1, noFlee: true, blunder: [{ t: 'level', n: 1 }] },
  { id: 'of.copy-room-beetle', type: 'monster', level: 11, kind: 'crawler', traits: ['armoured', 'shiny'], loot: 3, levels: 1, blunder: [{ t: 'slot', slot: 'body' }, { t: 'level', n: 1 }] },
  { id: 'of.carnivorous-office-plant', type: 'monster', level: 11, kind: 'greens', traits: ['sticky'], loot: 3, levels: 1, mods: [{ when: { kind: 'critter' }, bonus: 3 }], blunder: [{ t: 'level', n: 2 }] },
  { id: 'of.overheated-laptop', type: 'monster', level: 12, kind: 'machine', traits: ['fiery', 'loud'], loot: 3, levels: 1, blunder: [{ t: 'slot', slot: 'hand' }, { t: 'level', n: 1 }] },
  { id: 'of.parcel-courier', type: 'monster', level: 12, kind: 'bigmouth', traits: ['huge'], loot: 3, levels: 1, flee: 1, blunder: [{ t: 'level', n: 2 }] },
  { id: 'of.unwashed-mug', type: 'monster', level: 13, kind: 'goo', traits: ['ancient', 'smelly'], loot: 4, levels: 1, flee: -1, blunder: [{ t: 'best' }, { t: 'level', n: 1 }] },
  { id: 'of.annual-review', type: 'monster', level: 15, kind: 'bigmouth', traits: ['bureaucratic'], loot: 4, levels: 1, mods: [{ when: { kind: 'bigmouth' }, bonus: 3 }], blunder: [{ t: 'level', n: 2 }, { t: 'cards', n: 2 }] },
  { id: 'of.time-clock-ghost', type: 'monster', level: 16, kind: 'spook', traits: ['ancient', 'loud'], loot: 4, levels: 2, mods: [{ when: { family: 'remote' }, bonus: 3 }], blunder: [{ t: 'level', n: 2 }, { t: 'best' }] },
  { id: 'of.monday-morning', type: 'monster', level: 18, kind: 'spook', traits: ['huge', 'sleepy'], loot: 5, levels: 2, flee: -1, blunder: [{ t: 'level', n: 3 }] },

  /* ---------- Monster boosters (10) ---------- */
  { id: 'of.escalated', type: 'booster', level: 10, loot: 2, traits: ['huge'] },
  { id: 'of.always-been-so', type: 'booster', level: 10, loot: 2, traits: ['ancient'] },
  { id: 'of.too-much-coffee', type: 'booster', level: 5, loot: 1, copies: 2 },
  { id: 'of.boss-in-cc', type: 'booster', level: 5, loot: 1, copies: 2 },
  { id: 'of.budget-cut', type: 'booster', level: -5, loot: -1, traits: ['tiny'], copies: 2 },
  { id: 'of.afternoon-slump', type: 'booster', level: -3, loot: 0, traits: ['sleepy'], copies: 2 },

  /* ---------- Reinforcements (4) and windfalls (2) ---------- */
  { id: 'of.brings-a-colleague', type: 'reinforcement', copies: 2 },
  { id: 'of.invite-everyone', type: 'reinforcement', copies: 2 },
  { id: 'of.supply-cupboard', type: 'windfall', loot: 2 },
  { id: 'of.kitchen-cake', type: 'windfall', loot: 2 },

  /* ---------- Curses (14) ---------- */
  { id: 'of.still-on-mute', type: 'curse', effect: { t: 'level', n: 1 } },
  { id: 'of.wrong-meeting', type: 'curse', effect: { t: 'level', n: 1 } },
  { id: 'of.headset-tangle', type: 'curse', effect: { t: 'slot', slot: 'head' } },
  { id: 'of.coffee-spill', type: 'curse', effect: { t: 'slot', slot: 'body' } },
  { id: 'of.dog-took-slipper', type: 'curse', effect: { t: 'slot', slot: 'feet' } },
  { id: 'of.mouse-battery', type: 'curse', effect: { t: 'slot', slot: 'hand' } },
  { id: 'of.clean-desk', type: 'curse', effect: { t: 'slot', slot: 'small' } },
  { id: 'of.it-inventory', type: 'curse', effect: { t: 'best' } },
  { id: 'of.reply-all', type: 'curse', effect: { t: 'cards', n: 2 } },
  { id: 'of.inbox-overflow', type: 'curse', effect: { t: 'cards', n: 2 } },
  { id: 'of.wifi-down', type: 'curse', effect: { t: 'malus', n: 3 } },
  { id: 'of.kitchen-chair-back', type: 'curse', effect: { t: 'malus', n: 2 } },
  { id: 'of.restructuring', type: 'curse', effect: { t: 'profession' } },
  { id: 'of.new-avatar', type: 'curse', effect: { t: 'origin' } },

  /* ---------- Origins (4) and professions (6) ---------- */
  { id: 'of.open-plan-human', type: 'origin', kind: 'bigmouth', family: 'office', traits: ['loud'], mods: [{ when: { kind: 'machine' }, bonus: 2 }] },
  { id: 'of.office-ficus', type: 'origin', kind: 'greens', family: 'office', traits: [], mods: [{ when: { kind: 'crawler' }, bonus: 2 }] },
  { id: 'of.sweatpants-pro', type: 'origin', kind: 'bigmouth', family: 'remote', traits: ['sleepy'], flee: 1 },
  { id: 'of.home-office-cat', type: 'origin', kind: 'critter', family: 'remote', traits: ['tiny'], mods: [{ when: { kind: 'spook' }, bonus: 2 }] },
  { id: 'of.controller', type: 'profession', sell: 2 },
  { id: 'of.facility-manager', type: 'profession', perClass: { cls: 'tool', bonus: 1 } },
  { id: 'of.it-admin', type: 'profession', perClass: { cls: 'gadget', bonus: 1 } },
  { id: 'of.printer-tamer', type: 'profession', mods: [{ when: { kind: 'machine' }, bonus: 3 }, { when: { kind: 'figurine' }, bonus: 1 }] },
  { id: 'of.plant-sitter', type: 'profession', mods: [{ when: { kind: 'greens' }, bonus: 3 }, { when: { kind: 'crawler' }, bonus: 1 }] },
  { id: 'of.meeting-moderator', type: 'profession', mods: [{ when: { kind: 'spook' }, bonus: 3 }], flee: 1 },

  /* ---------- Items (34) ---------- */
  // head (6)
  { id: 'of.hair-curlers', type: 'item', slot: 'head', bonus: 1, value: 2, cls: 'clothing', self: [{ when: { family: 'remote' }, bonus: 2 }], set: 'couch-kit' },
  { id: 'of.mute-headset', type: 'item', slot: 'head', bonus: 2, value: 3, cls: 'gadget', traits: ['electric'], mods: [{ when: { trait: 'loud' }, bonus: 2 }], set: 'video-call' },
  { id: 'of.box-helmet', type: 'item', slot: 'head', bonus: 1, value: 1, cls: 'junk', traits: ['armoured'] },
  { id: 'of.month-crown', type: 'item', slot: 'head', bonus: 3, value: 6, cls: 'clothing', traits: ['shiny'] },
  { id: 'of.fan-cap', type: 'item', slot: 'head', bonus: 1, value: 2, cls: 'junk', traits: ['cold'], mods: [{ when: { trait: 'fiery' }, bonus: 2 }] },
  { id: 'of.bike-helmet', type: 'item', slot: 'head', bonus: 2, value: 3, cls: 'clothing', traits: ['armoured'] },
  // body (5)
  { id: 'of.top-half-shirt', type: 'item', slot: 'body', bonus: 1, value: 2, cls: 'clothing', set: 'video-call' },
  { id: 'of.binder-armour', type: 'item', slot: 'body', bonus: 3, value: 5, cls: 'clothing', traits: ['armoured', 'bureaucratic'] },
  { id: 'of.favourite-sweatpants', type: 'item', slot: 'body', bonus: 2, value: 3, cls: 'clothing', self: [{ when: { family: 'remote' }, bonus: 1 }] },
  { id: 'of.tuesday-bathrobe', type: 'item', slot: 'body', bonus: 2, value: 2, cls: 'clothing', traits: ['smelly'], mods: [{ when: { trait: 'cold' }, bonus: 2 }] },
  { id: 'of.visitor-lanyard', type: 'item', slot: 'body', bonus: 1, value: 2, cls: 'clothing', flee: 1 },
  // feet (4)
  { id: 'of.safety-shoes', type: 'item', slot: 'feet', bonus: 2, value: 3, cls: 'clothing', traits: ['armoured'] },
  { id: 'of.fluffy-slippers', type: 'item', slot: 'feet', bonus: 1, value: 2, cls: 'clothing', flee: 1, set: 'couch-kit' },
  { id: 'of.after-work-trainers', type: 'item', slot: 'feet', bonus: 1, value: 4, cls: 'clothing', flee: 2 },
  { id: 'of.grippy-socks', type: 'item', slot: 'feet', bonus: 1, value: 2, cls: 'clothing', mods: [{ when: { trait: 'wet' }, bonus: 2 }] },
  // hands (12)
  { id: 'of.ring-light', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 3, cls: 'gadget', mods: [{ when: { kind: 'bigmouth' }, bonus: 1 }], set: 'video-call' },
  { id: 'of.water-cooler', type: 'item', slot: 'hand', hands: 2, bonus: 3, value: 3, cls: 'tool', traits: ['wet'], mods: [{ when: { trait: 'fiery' }, bonus: 3 }] },
  { id: 'of.flipchart-stand', type: 'item', slot: 'hand', hands: 2, bonus: 4, value: 4, cls: 'tool' },
  { id: 'of.tv-remote', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 3, cls: 'gadget', mods: [{ when: { kind: 'machine' }, bonus: 2 }], set: 'couch-kit' },
  { id: 'of.kitchen-sponge', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 2, cls: 'tool', mods: [{ when: { kind: 'goo' }, bonus: 2 }] },
  { id: 'of.golden-fountain-pen', type: 'item', slot: 'hand', hands: 1, big: true, bonus: 4, value: 6, cls: 'weapon', traits: ['shiny'] },
  { id: 'of.desk-lamp', type: 'item', slot: 'hand', hands: 1, bonus: 1, value: 2, cls: 'gadget', traits: ['electric'], mods: [{ when: { kind: 'spook' }, bonus: 3 }] },
  { id: 'of.herbal-tea-flask', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 2, cls: 'food', traits: ['wet'], mods: [{ when: { trait: 'cold' }, bonus: 2 }] },
  { id: 'of.paper-planes', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 2, cls: 'weapon', mods: [{ when: { trait: 'flying' }, bonus: 3 }] },
  { id: 'of.copier-ram', type: 'item', slot: 'hand', hands: 2, big: true, bonus: 5, value: 5, cls: 'junk' },
  { id: 'of.pointer-stick', type: 'item', slot: 'hand', hands: 1, bonus: 3, value: 4, cls: 'weapon', self: [{ when: { family: 'office' }, bonus: 1 }] },
  { id: 'of.stapler', type: 'item', slot: 'hand', hands: 1, bonus: 2, value: 3, cls: 'tool', mods: [{ when: { kind: 'crawler' }, bonus: 2 }] },
  // small (7)
  { id: 'of.slogan-mug', type: 'item', slot: 'small', bonus: 2, value: 3, cls: 'junk', self: [{ when: { family: 'office' }, bonus: 1 }] },
  { id: 'of.stick-on-moustache', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'clothing', traits: ['bearded'] },
  { id: 'of.lucky-pen', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'junk', flee: 1 },
  { id: 'of.one-share', type: 'item', slot: 'small', bonus: 0, value: 8, cls: 'junk', traits: ['shiny'] },
  { id: 'of.open-plan-earplugs', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'gadget', mods: [{ when: { trait: 'loud' }, bonus: 3 }] },
  { id: 'of.drawer-chocolate', type: 'item', slot: 'small', bonus: 1, value: 2, cls: 'food', mods: [{ when: { trait: 'sleepy' }, bonus: 2 }] },
  { id: 'of.escape-plan', type: 'item', slot: 'small', bonus: 0, value: 3, cls: 'junk', flee: 2 },

  /* ---------- Upgrades (6) ---------- */
  { id: 'of.sticky-note', type: 'upgrade', bonus: 2, copies: 2 },
  { id: 'of.freshly-dusted', type: 'upgrade', bonus: 1, traits: ['shiny'], copies: 2 },
  { id: 'of.turbo-update', type: 'upgrade', bonus: 3, traits: ['loud'] },
  { id: 'of.signed-by-founder', type: 'upgrade', bonus: 2, traits: ['ancient'] },

  /* ---------- One-shots (16 incl. Change Sides) ---------- */
  { id: 'of.coffee-overdose', type: 'oneshot', bonus: 3, value: 2, copies: 2 },
  { id: 'of.rubber-bands', type: 'oneshot', bonus: 2, value: 1, copies: 2 },
  { id: 'of.final-word', type: 'oneshot', bonus: 5, value: 3 },
  { id: 'of.hole-punch-confetti', type: 'oneshot', bonus: 4, value: 3 },
  { id: 'of.flying-biscuits', type: 'oneshot', bonus: 2, value: 1 },
  { id: 'of.paper-ball', type: 'oneshot', bonus: 2, value: 1 },
  { id: 'of.eighty-slides', type: 'oneshot', bonus: 4, value: 2 },
  { id: 'of.urgent-call', type: 'oneshot', bonus: 0, value: 1, flee: 3, copies: 2 },
  { id: 'of.connection-lost', type: 'oneshot', bonus: 0, value: 2, escape: true, copies: 2 },
  { id: 'of.sprinkler-alarm', type: 'oneshot', bonus: 3, value: 2 },
  { id: 'of.poached', type: 'oneshot', bonus: 0, value: 1, turncoat: true, copies: 2 },

  /* ---------- Level-ups (6) and doubles (4) ---------- */
  { id: 'of.team-lead', type: 'levelup', copies: 2 },
  { id: 'of.praise-from-above', type: 'levelup', copies: 2 },
  { id: 'of.pay-rise', type: 'levelup', copies: 2 },
  { id: 'of.hybrid-work', type: 'double', of: 'origin', copies: 2 },
  { id: 'of.part-time-twice', type: 'double', of: 'profession', copies: 2 }
];

export const OFFICE: World = {
  id: 'of',
  cards,
  sets: [
    { id: 'video-call', items: ['of.ring-light', 'of.mute-headset', 'of.top-half-shirt'], bonus: 3 },
    { id: 'couch-kit', items: ['of.hair-curlers', 'of.fluffy-slippers', 'of.tv-remote'], bonus: 3 }
  ]
};
