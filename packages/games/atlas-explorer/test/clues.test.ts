import { describe, expect, it } from 'vitest';
import { createRng } from '@wp/game-core';
import { decodeAtlas } from '../src/atlas';
import { AREA_RATIO, CAPITAL_DLAT, PEOPLE_RATIO, candidatesAfter, clueExcludes, clueKnown, clueLimits, clueTrue, drawMystery, orderClues, trueClues } from '../src/clues';
import { DIFFICULTIES } from '../src/compare';
import { ATLAS_DATA } from '../src/data/atlas.gen';
import { createRound } from '../src/generate';
import { AREAS } from '../src/state';
import { FEATURE_KIND, RAW_CITIES, RAW_COUNTRIES, clueAllows, type RawCountry } from './oracle';

const atlas = decodeAtlas(ATLAS_DATA);

/** The strict truth of a clue for the target, re-implemented on raw facts (margins included). */
function strictlyTrue(t: RawCountry, id: string, arg: string): boolean {
  const ref = arg.split(':')[1] ?? '';
  if (id === 'area') {
    const r = RAW_COUNTRIES.get(ref)!;
    return arg.startsWith('gt') ? t.areaCore >= AREA_RATIO * r.areaMax : r.areaCore >= AREA_RATIO * t.areaMax;
  }
  if (id === 'people') {
    const r = RAW_COUNTRIES.get(ref)!;
    return arg.startsWith('gt') ? t.pop >= PEOPLE_RATIO * r.pop : r.pop >= PEOPLE_RATIO * t.pop;
  }
  if (id === 'capital') {
    const r = RAW_CITIES.get(ref)!;
    const cap = [...RAW_CITIES.values()].find((x) => x.capital && x.country === t.id);
    return cap !== undefined && (arg.startsWith('n') ? cap.lat - r.lat >= CAPITAL_DLAT : r.lat - cap.lat >= CAPITAL_DLAT);
  }
  if (id === 'river') return t.ft.includes(arg) && FEATURE_KIND.get(arg) === 'river';
  if (id === 'desert') return t.ft.includes(arg) && FEATURE_KIND.get(arg) === 'desert';
  if (id === 'range') return t.ft.includes(arg) && ['range', 'plateau', 'basin'].includes(FEATURE_KIND.get(arg)!);
  return clueAllows(t, id, arg);
}

describe('mystery clues', () => {
  it('are true for the target and leave exactly the target (independent filter)', () => {
    let n = 0;
    for (const d of DIFFICULTIES)
      for (const area of AREAS)
        for (let seed = 0; seed < 12; seed++) {
          const round = createRound(seed * 104729 + 11, d, 'mystery', area, atlas);
          const limits = clueLimits(d);
          for (const it of round.items) {
            if (it.kind !== 'mystery') continue;
            n++;
            const t = RAW_COUNTRIES.get(it.target)!;
            expect(it.clues.length).toBeGreaterThanOrEqual(limits.min);
            expect(it.clues.length).toBeLessThanOrEqual(limits.max);
            for (const k of it.clues) {
              expect(strictlyTrue(t, k.id, k.arg), `${it.target}: ${k.id} ${k.arg}`).toBe(true);
              expect(clueKnown(atlas, k)).toBe(true);
            }
            const left = [...RAW_COUNTRIES.values()].filter((c) => it.clues.every((k) => clueAllows(c, k.id, k.arg)));
            expect(left.map((c) => c.id), it.target).toEqual([it.target]);
            const first = [...RAW_COUNTRIES.values()].filter((c) => clueAllows(c, it.clues[0]!.id, it.clues[0]!.arg));
            expect(first.length).toBeGreaterThanOrEqual(limits.firstLeaves);
            // Each clue removes at least one candidate.
            let cands = [...RAW_COUNTRIES.values()];
            for (const k of it.clues) {
              const next = cands.filter((c) => clueAllows(c, k.id, k.arg));
              expect(next.length, `${it.target}: ${k.id} ${k.arg}`).toBeLessThan(cands.length);
              cands = next;
            }
          }
        }
    expect(n).toBe(3 * 6 * 12 * 4);
  });

  it('never mention a hatched area or a non-UN entity', () => {
    const round = createRound(99, 'hard', 'mystery', 'world', atlas);
    for (const it of round.items)
      if (it.kind === 'mystery')
        for (const k of it.clues) {
          if (k.id === 'nb' || k.id === 'area' || k.id === 'people') expect(RAW_COUNTRIES.has(k.arg.split(':').pop()!)).toBe(true);
          expect(k.arg).not.toMatch(/^d-/);
        }
  });

  it('rule out only what is clearly false', () => {
    const fr = atlas.country('FR')!;
    const es = atlas.country('ES')!;
    const de = atlas.country('DE')!;
    // Spain is a little smaller than France: "larger than France" rules it out, "smaller than Germany" does not
    // rule out France (it is larger than Germany, so it is ruled out), and France itself is never its own reference.
    expect(clueExcludes(atlas, es, { id: 'area', arg: 'gt:FR' })).toBe(true);
    expect(clueExcludes(atlas, fr, { id: 'area', arg: 'gt:FR' })).toBe(true);
    expect(clueExcludes(atlas, fr, { id: 'area', arg: 'lt:DE' })).toBe(true);
    expect(clueExcludes(atlas, de, { id: 'area', arg: 'lt:FR' })).toBe(false);
    // A country whose capital is not listed cannot be ruled out by a capital clue.
    const noCapital = atlas.countries.find((c) => !atlas.cities.some((x) => x.capital && x.country === c.id))!;
    expect(clueExcludes(atlas, noCapital, { id: 'capital', arg: 'n:madrid' })).toBe(false);
    expect(clueExcludes(atlas, es, { id: 'capital', arg: 'n:madrid' })).toBe(true);
    expect(clueTrue(atlas, fr, { id: 'capital', arg: 'n:madrid' })).toBe(true);
    expect(clueTrue(atlas, fr, { id: 'nb', arg: 'ES' })).toBe(true);
    expect(clueTrue(atlas, fr, { id: 'coast', arg: 'no' })).toBe(false);
    expect(clueTrue(atlas, atlas.country('RU')!, { id: 'region', arg: 'europe' })).toBe(false); // no region clue
    expect(candidatesAfter(atlas, [{ id: 'nb', arg: 'AD' }]).map((c) => c.id).sort()).toEqual(['ES', 'FR']);
  });

  it('order clues broad first and end at the target', () => {
    const t = atlas.country('KE')!;
    const all = trueClues(createRng(5), atlas, t);
    expect(all.length).toBeGreaterThan(8);
    for (const k of all) expect(clueTrue(atlas, t, k)).toBe(true);
    const order = orderClues(createRng(5), atlas, t, all, clueLimits('medium'));
    if (order) {
      expect(candidatesAfter(atlas, order).map((c) => c.id)).toEqual(['KE']);
      expect(['region', 'ns', 'ew', 'coast', 'island']).toContain(order[0]!.id);
    }
    expect(drawMystery(createRng(1), atlas, 'europe', 'easy', new Set())).not.toBeNull();
  });

  it('validates clue shapes', () => {
    expect(clueKnown(atlas, { id: 'nb', arg: 'FR' })).toBe(true);
    expect(clueKnown(atlas, { id: 'nb', arg: 'XX' })).toBe(false);
    expect(clueKnown(atlas, { id: 'area', arg: 'gt:FR' })).toBe(true);
    expect(clueKnown(atlas, { id: 'area', arg: 'eq:FR' })).toBe(false);
    expect(clueKnown(atlas, { id: 'capital', arg: 'n:madrid' })).toBe(true);
    expect(clueKnown(atlas, { id: 'capital', arg: 'x:madrid' })).toBe(false);
    expect(clueKnown(atlas, { id: 'line', arg: 'equator' })).toBe(false);
    expect(clueKnown(atlas, { id: 'zzz', arg: '' })).toBe(false);
    expect(clueKnown(atlas, null)).toBe(false);
    expect(clueKnown(atlas, { id: 'island', arg: 'x' })).toBe(false);
  });
});
