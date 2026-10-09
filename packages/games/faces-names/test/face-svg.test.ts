import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import { faceSvg, HAIR, SKIN } from '../src/face-svg';
import { FEATURE_VALUES, FEATURES, HAIR_COLOURS, isConsistentFace, randomFace, SKIN_TONES, type Face } from '../src/rules';

const BASE: Face = {
  shape: 'oval',
  skin: 2,
  hair: 'short',
  hairColour: 'brown',
  brows: 'straight',
  eyes: 'small',
  nose: 'small',
  mouth: 'smile',
  glasses: 'none',
  facialHair: 'none',
  earrings: 'none',
  mark: 'none',
  shirt: 1
};

const render = (face: Face) => JSON.stringify(faceSvg(face));

describe('faceSvg', () => {
  it('draws every value of every feature differently (what tells faces apart is visible)', () => {
    for (const base of [BASE, { ...BASE, hair: 'headscarf' } as Face, { ...BASE, hair: 'bald', facialHair: 'beard' } as Face]) {
      for (const feature of FEATURES) {
        const drawings = new Set<string>();
        let variants = 0;
        for (const value of FEATURE_VALUES[feature]) {
          const face = { ...base, [feature]: value } as Face;
          if (!isConsistentFace(face, 60)) continue;
          variants++;
          drawings.add(render(face));
        }
        expect(drawings.size, `${base.hair}/${feature}`).toBe(variants);
      }
    }
  });

  it('uses the skin tone and the hair colour (visual only)', () => {
    expect(new Set(Array.from({ length: SKIN_TONES }, (_, skin) => render({ ...BASE, skin }))).size).toBe(SKIN_TONES);
    expect(new Set(HAIR_COLOURS.map((hairColour) => render({ ...BASE, hairColour }))).size).toBe(HAIR_COLOURS.length);
    expect(SKIN).toHaveLength(SKIN_TONES);
    expect(render(BASE)).toContain(HAIR.brown);
  });

  it('hides the ears under a headscarf and shows them otherwise', () => {
    const ears = (face: Face) => faceSvg(face).filter((n) => n.tag === 'ellipse' && n.attrs.ry === 8).length;
    expect(ears(BASE)).toBe(2);
    expect(ears({ ...BASE, hair: 'headscarf' })).toBe(0);
  });

  it('produces well-formed attributes for any generated face', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffff_ffff }), (seed) => {
        const rng = createRng(seed);
        const face = randomFace(rng, rng.int(22, 79));
        const nodes = faceSvg(face);
        expect(nodes.length).toBeGreaterThan(10);
        for (const node of nodes)
          for (const value of Object.values(node.attrs)) {
            if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
            else expect(value).not.toMatch(/NaN|undefined|Infinity/);
          }
      }),
      { numRuns: 200 }
    );
  });
});
