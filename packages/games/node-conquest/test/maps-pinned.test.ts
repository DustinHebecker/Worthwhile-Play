import { describe, expect, it } from 'vitest';
import { FACTION_COUNTS, getMap, INTRO_MAP, LEGACY_MAPS } from '../src/maps';

/** FNV-1a (32 bit) of a string: a compact fingerprint of a whole map. */
function fnv(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/**
 * Fingerprints of every map that existed before the hand-built maps were added (recorded from the
 * unchanged generator). Saves store only the map index and rebuild the map from it, so these maps
 * must stay byte-identical: nodes, levels, types, lanes, lengths and order.
 */
const PINNED: Record<string, string> = {
  '2:0:1': '86595e03',
  '2:0:2': '0a779b3d',
  '2:1:1': '2ee4be63',
  '2:1:2': 'd44f9d3c',
  '2:2:1': 'c60c2dd0',
  '2:2:2': '58016ab5',
  '2:3:1': 'bdd6706d',
  '2:3:2': '3129c742',
  '2:4:1': 'b2be64ab',
  '2:4:2': '817d1dca',
  '2:5:1': '2a2002a9',
  '2:5:2': '7fe17cc0',
  '2:6:1': 'dc336c2b',
  '2:6:2': 'c6ab7048',
  '3:0:1': 'b67f1067',
  '3:0:2': '5b3eb6e1',
  '3:1:1': '47b4d73c',
  '3:1:2': 'b2c0707e',
  '3:2:1': '671809d7',
  '3:2:2': '625106a0',
  '3:3:1': '680cf243',
  '3:3:2': '00b8a045',
  '3:4:1': '38842d4e',
  '3:4:2': '937912d4',
  '3:5:1': '34479ed8',
  '3:5:2': 'aa404c16',
  '3:6:1': 'fa890922',
  '3:6:2': '9162ade2',
  '4:0:1': '22f70678',
  '4:0:2': 'a4186835',
  '4:1:1': 'c8b66010',
  '4:1:2': '8ff6b3c3',
  '4:2:1': '8ee2f05a',
  '4:2:2': '60917351',
  '4:3:1': '4765b750',
  '4:3:2': '8b397709',
  '4:4:1': '34cc7c5d',
  '4:4:2': 'aff7b772',
  '4:5:1': '30c2c701',
  '4:5:2': 'b90e786e',
  '4:6:1': '6ace47c0',
  '4:6:2': 'dc4526f1',
  'intro': '3cdd995d',
};

describe('maps 0–6 never change (saves rebuild their map from the index)', () => {
  it('every legacy map in both layouts and the introduction keeps its exact fingerprint', () => {
    expect(LEGACY_MAPS).toBe(7);
    const now: Record<string, string> = {};
    for (const f of FACTION_COUNTS) {
      for (let m = 0; m < LEGACY_MAPS; m++) for (const layout of [1, 2] as const) now[`${f}:${m}:${layout}`] = fnv(JSON.stringify(getMap(f, m, layout)));
    }
    now.intro = fnv(JSON.stringify(getMap(2, INTRO_MAP)));
    expect(now).toEqual(PINNED);
  });

  it('the fingerprint notices any change', () => {
    const map = getMap(3, 4);
    const moved = { ...map, nodes: map.nodes.map((n, v) => (v === 3 ? { ...n, x: n.x + 1 } : n)) };
    expect(fnv(JSON.stringify(moved))).not.toBe(fnv(JSON.stringify(map)));
    expect(fnv('')).toBe('811c9dc5');
  });
});
