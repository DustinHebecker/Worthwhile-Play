import { describe, expect, it } from 'vitest';
import { compile, type Adventure } from '../src';
import { WATCHTOWER } from './fixture';

const errorOf = (adv: Adventure): string => {
  try {
    compile(adv);
    return '';
  } catch (e) {
    return (e as Error).message;
  }
};
const yardWith = (patch: object): Adventure => ({
  ...WATCHTOWER,
  scenes: WATCHTOWER.scenes.map((sc) => (sc.id === 'yard' ? { ...sc, hotspots: [...sc.hotspots, { id: 'extra', shape: { x: 0, y: 0, w: 120, h: 120 }, ...patch }] } : sc))
});

describe('compile', () => {
  it('accepts the fixture', () => {
    expect(errorOf(WATCHTOWER)).toBe('');
  });

  it.each<[string, Adventure, string]>([
    ['bad adventure id', { ...WATCHTOWER, id: 'Watch Tower' }, 'adventure id'],
    ['content version', { ...WATCHTOWER, contentVersion: 0 }, 'contentVersion'],
    ['dotted id', { ...WATCHTOWER, items: [...WATCHTOWER.items, { id: 'a.b' }] }, 'item id "a.b"'],
    ['duplicate item', { ...WATCHTOWER, items: [...WATCHTOWER.items, { id: 'rope' }] }, 'duplicate item id "rope"'],
    ['duplicate hotspot', yardWith({ id: 'rope' }), 'duplicate hotspot'],
    ['flag max', { ...WATCHTOWER, flags: { ...WATCHTOWER.flags, x: { max: 0 } } }, 'flag "x" max'],
    ['unknown flag in condition', yardWith({ visible: { flag: 'nope' } }), 'unknown flag "nope"'],
    ['flag compared out of range', yardWith({ visible: { flag: 'keeper-mood', gte: 4 } }), 'outside 0…3'],
    ['unknown item in condition', yardWith({ visible: { has: 'sword' } }), 'unknown item "sword"'],
    ['unknown clue', yardWith({ visible: { knows: 'x' } }), 'unknown clue "x"'],
    ['unknown scene', yardWith({ visible: { visited: 'moon' } }), 'unknown scene "moon"'],
    ['unknown goal', yardWith({ visible: { goal: 'win' } }), 'unknown goal "win"'],
    ['unknown condition', yardWith({ visible: { weird: 1 } }), 'unknown condition'],
    ['set out of range', yardWith({ on: { use: [{ then: [{ set: 'keeper-mood', to: 4 }] }] } }), 'bad value 4'],
    ['add of zero', yardWith({ on: { use: [{ then: [{ add: 'keeper-mood', by: 0 }] }] } }), 'bad value 0'],
    ['give unknown item', yardWith({ on: { use: [{ then: [{ give: 'sword' }] }] } }), 'unknown item "sword"'],
    ['go unknown scene', yardWith({ on: { use: [{ then: [{ go: 'moon' }] }] } }), 'unknown scene "moon"'],
    ['unknown dialogue', yardWith({ on: { talk: [{ then: [{ dialogue: 'x' }] }] } }), 'unknown dialogue "x"'],
    ['unknown effect', yardWith({ on: { use: [{ then: [{ explode: 1 }] }] } }), 'unknown effect'],
    ['unknown verb', yardWith({ on: { kick: [{}] } }), 'unknown verb "kick"'],
    ['item rule for unknown item', yardWith({ items: { sword: [{}] } }), 'unknown item "sword"'],
    ['clue rule for unknown clue', yardWith({ clues: { x: [{}] } }), 'unknown clue "x"'],
    ['combination with itself', { ...WATCHTOWER, combinations: [{ items: ['rope', 'rope'], rules: [] }] }, 'needs two different'],
    ['duplicate combination', { ...WATCHTOWER, combinations: [...WATCHTOWER.combinations, { items: ['hook', 'rope'], rules: [] }] }, 'duplicate combination hook+rope'],
    ['deduction with unknown clue', { ...WATCHTOWER, deductions: [{ clues: ['shifts', 'x'], rules: [] }] }, 'needs two different'],
    ['dialogue without nodes', { ...WATCHTOWER, dialogues: [{ id: 'empty', nodes: [] }] }, 'has no nodes'],
    ['node without options', { ...WATCHTOWER, dialogues: [{ id: 'd', nodes: [{ id: 'n', options: [] }] }] }, 'has no options'],
    ['node without unconditional option', { ...WATCHTOWER, dialogues: [{ id: 'd', nodes: [{ id: 'n', options: [{ id: 'o', when: { has: 'rope' }, next: null }] }] }] }, 'unconditional option'],
    ['unknown next node', { ...WATCHTOWER, dialogues: [{ id: 'd', nodes: [{ id: 'n', options: [{ id: 'o', next: 'm' }] }] }] }, 'unknown next node "m"'],
    ['option changes scene', { ...WATCHTOWER, dialogues: [{ id: 'd', nodes: [{ id: 'n', options: [{ id: 'o', next: null, then: [{ go: 'yard' }] }] }] }] }, 'cannot start dialogues or change scenes'],
    ['no ending', { ...WATCHTOWER, endings: [] }, 'at least one ending'],
    ['unknown start scene', { ...WATCHTOWER, start: { scene: 'moon' } }, 'start scene "moon"'],
    ['unknown start item', { ...WATCHTOWER, start: { scene: 'yard', items: ['sword'] } }, 'start item "sword"'],
    ['bad start flag', { ...WATCHTOWER, start: { scene: 'yard', flags: { 'keeper-mood': 9 } } }, 'start flag "keeper-mood"=9'],
    ['bad region', { ...WATCHTOWER, scenes: WATCHTOWER.scenes.map((s) => ({ ...s, region: 'Out Side' })) }, 'region "Out Side"']
  ])('rejects %s', (_, adv, message) => {
    expect(errorOf(adv)).toContain(message);
  });
});
