import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import { BROW, contrastRatio, COVER, edgeFor, EYE_INK, faceSvg, HAIR, luminance, MIN_CONTRAST, MOUTH_FILL, ON_SKIN, pickContrasting, SKIN, skinPalette, type SvgNode } from '../src/face-svg';
import { FEATURE_VALUES, FEATURES, HAIR_COLOURS, HAIR_STYLES, isConsistentFace, randomFace, SKIN_TONES, type Face, type Feature } from '../src/rules';

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

  describe('contrast on every skin tone (WCAG non-text contrast ≥ 3:1)', () => {
    it('computes WCAG luminance and contrast ratios', () => {
      expect(luminance('#000000')).toBe(0);
      expect(luminance('#ffffff')).toBeCloseTo(1, 10);
      expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
      expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
      expect(contrastRatio('#777777', '#777777')).toBe(1);
      // Known reference value: #767676 on white is 4.54:1.
      expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
      expect(pickContrasting('#ffffff', ['#eeeeee', '#777777', '#000000'])).toBe('#777777');
      expect(pickContrasting('#ffffff', ['#eeeeee', '#dddddd'])).toBe('#dddddd');
    });

    it('chooses feature colours (lines, lips, frames, earrings, keyline) with ≥ 3:1 against every skin tone', () => {
      for (let skin = 0; skin < SKIN_TONES; skin++) {
        const palette = skinPalette(skin);
        expect(palette.fill).toBe(SKIN[skin]?.[0]);
        for (const role of ['line', 'lip', 'frame', 'metal', 'keyline'] as const)
          expect(contrastRatio(palette[role], palette.fill), `skin ${skin} ${role}`).toBeGreaterThanOrEqual(MIN_CONTRAST);
      }
    });

    it('gives every hair, eyebrow, covering, eye and mouth colour a ≥ 3:1 boundary on every skin tone', () => {
      const colours: [string, string][] = [
        ...HAIR_COLOURS.map((c): [string, string] => [`hair ${c}`, HAIR[c]]),
        ...HAIR_COLOURS.map((c): [string, string] => [`brow ${c}`, BROW[c]]),
        ...COVER.map((c, i): [string, string] => [`cover ${i}`, c]),
        ['eye', EYE_INK],
        ['open mouth', MOUTH_FILL]
      ];
      for (let skin = 0; skin < SKIN_TONES; skin++) {
        const palette = skinPalette(skin);
        for (const [name, colour] of colours) {
          const edge = edgeFor(colour, palette);
          const boundary = edge ?? colour;
          expect(contrastRatio(boundary, palette.fill), `skin ${skin} ${name}`).toBeGreaterThanOrEqual(MIN_CONTRAST);
          // The keyline is only added where the colour itself is too close to the skin.
          expect(edge === undefined).toBe(contrastRatio(colour, palette.fill) >= MIN_CONTRAST);
        }
      }
      // Dark hair on the deepest tones and blond hair on the lightest really do need (and get) a keyline.
      expect(edgeFor(HAIR.black, skinPalette(SKIN_TONES - 1))).toBe(skinPalette(SKIN_TONES - 1).keyline);
      expect(edgeFor(HAIR.blond, skinPalette(0))).toBe(skinPalette(0).keyline);
    });

    /** The colour that meets the skin: the stroke if the element has one, else its fill. */
    const boundaryOf = (node: SvgNode): string => {
      const stroke = node.attrs.stroke;
      return typeof stroke === 'string' && stroke !== 'none' ? stroke : String(node.attrs.fill);
    };
    const featureFaces = (): Face[] => {
      const faces: Face[] = [];
      for (const hair of HAIR_STYLES)
        for (const hairColour of HAIR_COLOURS)
          for (const variant of [0, 1, 2]) {
            const face: Face = {
              ...BASE,
              hair,
              hairColour,
              eyes: (['small', 'large', 'smiling'] as const)[variant] as Face['eyes'],
              mouth: (['slight', 'smile', 'broad'] as const)[variant] as Face['mouth'],
              brows: (['straight', 'arched', 'thick'] as const)[variant] as Face['brows'],
              glasses: (['round', 'square', 'none'] as const)[variant] as Face['glasses'],
              facialHair: hair === 'headscarf' ? 'none' : ((['beard', 'moustache', 'none'] as const)[variant] as Face['facialHair']),
              earrings: hair === 'headscarf' ? 'none' : ((['studs', 'hoops', 'none'] as const)[variant] as Face['earrings']),
              mark: (['freckles', 'mole', 'none'] as const)[variant] as Face['mark']
            };
            faces.push(face);
          }
      return faces;
    };

    it('draws everything that sits on the skin with ≥ 3:1 contrast, for all 8 skin tones', () => {
      for (let skin = 0; skin < SKIN_TONES; skin++) {
        const fill = SKIN[skin]?.[0] as string;
        for (const face of featureFaces()) {
          const nodes = faceSvg({ ...face, skin }).filter((n) => n.attrs[ON_SKIN] === 1);
          expect(nodes.length).toBeGreaterThan(5);
          for (const node of nodes) {
            expect(node.attrs.opacity, 'no transparency on feature marks').toBeUndefined();
            expect(contrastRatio(boundaryOf(node), fill), `skin ${skin} ${face.hair}/${face.hairColour} ${JSON.stringify(node.attrs).slice(0, 80)}`).toBeGreaterThanOrEqual(MIN_CONTRAST);
          }
        }
      }
    });

    it('marks every distinguishing feature as drawn on the skin (so the contrast check covers it)', () => {
      const count = (face: Face) => faceSvg(face).filter((n) => n.attrs[ON_SKIN] === 1).length;
      const checks: [Feature, Partial<Face>][] = [
        ['hair', { hair: 'curly' }],
        ['glasses', { glasses: 'round' }],
        ['facialHair', { facialHair: 'beard' }],
        ['facialHair', { facialHair: 'moustache' }],
        ['earrings', { earrings: 'hoops' }],
        ['mark', { mark: 'freckles' }],
        ['mark', { mark: 'mole' }]
      ];
      const bald: Face = { ...BASE, hair: 'bald' };
      for (const [, change] of checks) expect(count({ ...bald, ...change })).toBeGreaterThan(count(bald));
      // Eyes, brows, nose and mouth are always marked.
      for (let skin = 0; skin < SKIN_TONES; skin++) expect(count({ ...bald, skin })).toBeGreaterThanOrEqual(2 + 2 + 1 + 1);
    });
  });
});
