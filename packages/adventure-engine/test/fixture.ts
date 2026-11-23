import { compile, type Action, type Adventure, type Compiled } from '../src';

const box = { x: 100, y: 100, w: 200, h: 200 };
const notTaken = (item: string) => ({ not: { any: [{ has: item }, { used: item }] } });

/**
 * A three-scene test adventure ("the watchtower") that uses every feature of the engine core:
 * take, use, talk/dialogue, use item on hotspot, combine, deduce, present, onEnter, travel, goals,
 * chapters, an ending. Not shipped; the shape of real content.
 */
export const WATCHTOWER: Adventure = {
  id: 'watchtower',
  contentVersion: 1,
  start: { scene: 'yard' },
  flags: { 'grapnel-hooked': { max: 1 }, 'keeper-mood': { max: 3 } },
  items: [{ id: 'rope' }, { id: 'hook' }, { id: 'grapnel' }, { id: 'chest-key' }, { id: 'map' }],
  clues: [{ id: 'shifts' }, { id: 'ledger-dates' }, { id: 'gate-unwatched' }],
  scenes: [
    {
      id: 'yard',
      region: 'outside',
      onEnter: [{ when: { not: { visited: 'cellar' } } }, {}],
      hotspots: [
        { id: 'rope', shape: box, visible: notTaken('rope'), on: { take: [{ then: [{ give: 'rope' }] }] } },
        {
          id: 'keeper',
          shape: box,
          on: { talk: [{ then: [{ dialogue: 'keeper' }] }] },
          clues: {
            'gate-unwatched': [
              { when: { not: { has: 'chest-key' } }, then: [{ give: 'chest-key' }, { set: 'keeper-mood', to: 3 }] },
              {}
            ]
          }
        },
        { id: 'stair', shape: box, on: { use: [{ then: [{ go: 'cellar' }] }] } },
        {
          id: 'window',
          shape: { points: [[1000, 100], [1100, 100], [1050, 200]] },
          on: { use: [{ when: { flag: 'grapnel-hooked' }, then: [{ go: 'tower' }] }, {}] },
          items: { grapnel: [{ then: [{ take: 'grapnel' }, { set: 'grapnel-hooked', to: 1 }] }] }
        }
      ]
    },
    {
      id: 'cellar',
      region: 'outside',
      hotspots: [
        { id: 'hook', shape: box, visible: notTaken('hook'), on: { take: [{ then: [{ give: 'hook' }] }] } },
        { id: 'ledger', shape: box, on: { examine: [{ then: [{ learn: 'ledger-dates' }] }] } },
        { id: 'stair', shape: box, on: { use: [{ then: [{ go: 'yard' }] }] } }
      ]
    },
    {
      id: 'tower',
      region: 'tower',
      map: false,
      hotspots: [
        {
          id: 'chest',
          shape: box,
          on: { use: [{ when: { has: 'map' } }, {}] },
          items: { 'chest-key': [{ then: [{ take: 'chest-key' }, { give: 'map' }] }] }
        }
      ]
    }
  ],
  combinations: [{ items: ['rope', 'hook'], rules: [{ then: [{ take: 'rope' }, { take: 'hook' }, { give: 'grapnel' }] }] }],
  deductions: [{ clues: ['shifts', 'ledger-dates'], rules: [{ then: [{ learn: 'gate-unwatched' }] }] }],
  dialogues: [
    {
      id: 'keeper',
      nodes: [
        {
          id: 'hello',
          options: [
            { id: 'shifts', next: 'shifts', then: [{ learn: 'shifts' }, { add: 'keeper-mood', by: 1 }] },
            { id: 'tower', when: { knows: 'shifts' }, next: 'hello' },
            { id: 'bye', next: null }
          ]
        },
        { id: 'shifts', options: [{ id: 'thanks', next: null }] }
      ]
    }
  ],
  goals: [
    { id: 'reach-window', active: { visited: 'cellar' }, done: { visited: 'tower' } },
    { id: 'keeper-secret', active: { knows: 'ledger-dates' }, done: { has: 'chest-key' } },
    { id: 'open-chest', active: { visited: 'tower' }, done: { has: 'map' } }
  ],
  chapters: [
    { id: 'below', done: { has: 'grapnel' } },
    { id: 'above', done: { has: 'map' } }
  ],
  endings: [{ id: 'map-found', when: { has: 'map' } }]
};

let compiled: Compiled | undefined;
/**
 * The compiled fixture, built on first use inside a test: an error at import time would fail whole
 * test files without failing a test, which mutation testing cannot count as a kill.
 */
export const C = (): Compiled => (compiled ??= compile(WATCHTOWER));

/** The golden walkthrough: start → ending. */
export const WALKTHROUGH: readonly Action[] = [
  { a: 'take', hs: 'rope' },
  { a: 'talk', hs: 'keeper' },
  { a: 'choose', option: 'shifts' },
  { a: 'choose', option: 'thanks' },
  { a: 'use', hs: 'stair' },
  { a: 'take', hs: 'hook' },
  { a: 'examine', hs: 'ledger' },
  { a: 'combine', x: 'rope', y: 'hook' },
  { a: 'deduce', x: 'shifts', y: 'ledger-dates' },
  { a: 'travel', scene: 'yard' },
  { a: 'present', clue: 'gate-unwatched', hs: 'keeper' },
  { a: 'useItem', item: 'grapnel', hs: 'window' },
  { a: 'use', hs: 'window' },
  { a: 'useItem', item: 'chest-key', hs: 'chest' }
];
