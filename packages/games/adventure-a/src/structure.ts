import type { Adventure, Cond, Shape } from '@wp/adventure-engine';

/**
 * Adventure A, prologue (docs/design/adventures.md § 10.1, increment A1): a lakeside village below a
 * reservoir that has sunk low for the first time in a century. Three scenes: the jetty, the village square,
 * the ferry keeper's hut. The puzzles are language-independent (pictograms, notches, cause and effect).
 *
 * Structure only: every text lives in `content/<locale>.ts` under keys derived from these ids.
 */

/** Hotspot shapes in scene units (1600 × 900); the art draws its objects at the same places. */
export const SHAPES = {
  jetty: {
    keeper: { x: 1080, y: 380, w: 150, h: 300 },
    lamp: { x: 300, y: 250, w: 130, h: 200 },
    boat: { x: 620, y: 600, w: 380, h: 170 },
    lock: { x: 1010, y: 610, w: 120, h: 120 },
    path: { x: 1400, y: 470, w: 200, h: 260 }
  },
  square: {
    board: { x: 640, y: 300, w: 300, h: 260 },
    well: { x: 1060, y: 480, w: 230, h: 230 },
    door: { x: 180, y: 330, w: 190, h: 330 },
    path: { x: 1400, y: 560, w: 200, h: 260 }
  },
  hut: {
    flask: { x: 980, y: 260, w: 130, h: 160 },
    hearth: { x: 520, y: 430, w: 380, h: 300 },
    door: { x: 1330, y: 280, w: 200, h: 420 }
  }
} as const satisfies Record<string, Record<string, Shape>>;

const notTaken = (item: string): Cond => ({ not: { any: [{ has: item }, { used: item }] } });

export const PROLOGUE: Adventure = {
  id: 'adventure-a',
  contentVersion: 1,
  start: { scene: 'jetty' },
  flags: { 'chain-open': { max: 1 }, 'keeper-ready': { max: 1 }, crossed: { max: 1 } },
  items: [{ id: 'lamp' }, { id: 'oil' }, { id: 'lamp-filled' }, { id: 'lamp-lit' }],
  clues: [{ id: 'ferry-rule' }, { id: 'fog-fear' }, { id: 'heron-notches' }, { id: 'chain-code' }],
  scenes: [
    {
      id: 'jetty',
      region: 'village',
      onEnter: [{ when: { not: { visited: 'square' } } }, {}],
      hotspots: [
        {
          id: 'keeper',
          shape: SHAPES.jetty.keeper,
          on: { talk: [{ then: [{ dialogue: 'keeper' }] }] },
          items: {
            'lamp-lit': [{ then: [{ take: 'lamp-lit' }, { set: 'keeper-ready', to: 1 }] }],
            lamp: [{}],
            'lamp-filled': [{}]
          }
        },
        { id: 'lamp', shape: SHAPES.jetty.lamp, visible: notTaken('lamp'), on: { take: [{ then: [{ give: 'lamp' }] }] } },
        {
          id: 'boat',
          shape: SHAPES.jetty.boat,
          on: {
            use: [
              { when: { all: [{ flag: 'chain-open' }, { flag: 'keeper-ready' }] }, then: [{ set: 'crossed', to: 1 }] },
              { when: { flag: 'chain-open' } },
              {}
            ]
          }
        },
        {
          id: 'lock',
          shape: SHAPES.jetty.lock,
          visible: { not: { flag: 'chain-open' } },
          on: { use: [{ when: { knows: 'chain-code' }, then: [{ set: 'chain-open', to: 1 }] }, {}] }
        },
        { id: 'path', shape: SHAPES.jetty.path, on: { use: [{ then: [{ go: 'square' }] }] } }
      ]
    },
    {
      id: 'square',
      region: 'village',
      hotspots: [
        { id: 'board', shape: SHAPES.square.board, on: { examine: [{ then: [{ learn: 'heron-notches' }] }] } },
        { id: 'well', shape: SHAPES.square.well, on: { use: [{}] } },
        { id: 'door', shape: SHAPES.square.door, on: { use: [{ then: [{ go: 'hut' }] }] } },
        { id: 'path', shape: SHAPES.square.path, on: { use: [{ then: [{ go: 'jetty' }] }] } }
      ]
    },
    {
      id: 'hut',
      region: 'village',
      hotspots: [
        { id: 'flask', shape: SHAPES.hut.flask, visible: notTaken('oil'), on: { take: [{ then: [{ give: 'oil' }] }] } },
        {
          id: 'hearth',
          shape: SHAPES.hut.hearth,
          items: { 'lamp-filled': [{ then: [{ take: 'lamp-filled' }, { give: 'lamp-lit' }] }], lamp: [{}], oil: [{}] }
        },
        { id: 'door', shape: SHAPES.hut.door, on: { use: [{ then: [{ go: 'square' }] }] } }
      ]
    }
  ],
  combinations: [{ items: ['lamp', 'oil'], rules: [{ then: [{ take: 'lamp' }, { take: 'oil' }, { give: 'lamp-filled' }] }] }],
  deductions: [{ clues: ['ferry-rule', 'heron-notches'], rules: [{ then: [{ learn: 'chain-code' }] }] }],
  dialogues: [
    {
      id: 'keeper',
      nodes: [
        {
          id: 'hello',
          options: [
            { id: 'crossing', next: 'crossing', then: [{ learn: 'ferry-rule' }, { learn: 'fog-fear' }] },
            { id: 'archive', next: 'archive' },
            { id: 'bye', next: null }
          ]
        },
        { id: 'crossing', options: [{ id: 'more', next: 'hello' }, { id: 'bye', next: null }] },
        { id: 'archive', options: [{ id: 'more', next: 'hello' }, { id: 'bye', next: null }] }
      ]
    }
  ],
  goals: [
    { id: 'ask-keeper', active: { not: { knows: 'ferry-rule' } }, done: { knows: 'ferry-rule' } },
    { id: 'open-lock', active: { knows: 'ferry-rule' }, done: { flag: 'chain-open' } },
    { id: 'light-lamp', active: { knows: 'fog-fear' }, done: { flag: 'keeper-ready' } },
    { id: 'cross', active: { all: [{ flag: 'chain-open' }, { flag: 'keeper-ready' }] }, done: { flag: 'crossed' } }
  ],
  chapters: [{ id: 'prologue', done: { flag: 'crossed' } }],
  endings: [{ id: 'prologue-end', when: { flag: 'crossed' } }]
};
