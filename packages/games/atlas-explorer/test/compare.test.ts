import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import { decodeAtlas } from '../src/atlas';
import { DIFFICULTIES, TEMPLATES, cityPool, countryPool, drawTemplate, lonDelta, templateAllowed, threshold, type Difficulty, type TemplateId } from '../src/compare';
import { ATLAS_DATA } from '../src/data/atlas.gen';
import { createRound } from '../src/generate';
import { AREAS } from '../src/state';
import { RAW_CITIES, RAW_COUNTRIES, compareOracle, cosineKm, dayHours, eastOf } from './oracle';

const atlas = decodeAtlas(ATLAS_DATA);

/** The fairness margin of a generated question, recomputed from raw data. */
function margin(template: TemplateId, places: readonly string[], param: number, d: Difficulty): boolean {
  const city = (id: string) => RAW_CITIES.get(id)!;
  const country = (id: string) => RAW_COUNTRIES.get(id)!;
  const [a, b, c] = places as [string, string, string];
  switch (template) {
    case 'north':
    case 'south':
      return Math.abs(city(a).lat - city(b).lat) >= threshold('lat', d);
    case 'east':
    case 'west':
      // As read off the map: the plain difference, at most 150°, so the shorter way round never crosses the date line.
      return Math.abs(city(b).lon - city(a).lon) >= threshold('lon', d) && Math.abs(city(b).lon - city(a).lon) <= 150;
    case 'closer': {
      const x = cosineKm(city(a), city(b));
      const y = cosineKm(city(a), city(c));
      return Math.max(x, y) / Math.min(x, y) >= threshold('closer', d) - 1e-9;
    }
    case 'larger': {
      const [p, q] = [country(a), country(b)];
      const r = threshold('larger', d);
      return p.areaCore >= r * q.areaMax || q.areaCore >= r * p.areaMax;
    }
    case 'people': {
      const r = threshold('people', d);
      return country(a).pop >= r * country(b).pop || country(b).pop >= r * country(a).pop;
    }
    case 'density': {
      const lo = (x: string) => country(x).pop / country(x).areaMax;
      const hi = (x: string) => country(x).pop / country(x).areaCore;
      return lo(a) >= 2 * hi(b) || lo(b) >= 2 * hi(a);
    }
    case 'daylight':
      return Math.abs(dayHours(city(a).lat, param) - dayHours(city(b).lat, param)) >= threshold('daylightHours', d) - 1e-9;
    case 'midnight':
      return Math.abs(city(a).lat) >= 68 || Math.abs(city(a).lat) <= 64;
    case 'season':
      return Math.abs(city(a).lat) >= 30;
    case 'tropics':
      return places.filter((p) => Math.abs(city(p).lat) <= 21.4).length === 1 && places.filter((p) => Math.abs(city(p).lat) >= 25.4).length === 2;
    case 'suntime': {
      const h = eastOf(city(a).lon, city(b).lon) / 15;
      return Math.abs(h) >= 2 && Math.abs(h - Math.round(h)) <= 0.3;
    }
    case 'clock':
      return Number.isInteger((city(b).tz - city(a).tz) / 60) && city(a).tz !== city(b).tz;
  }
}

describe('compare templates', () => {
  it('generate fair questions whose stored answer equals an independent oracle', () => {
    let checked = 0;
    for (const d of DIFFICULTIES)
      for (const area of AREAS)
        for (let seed = 0; seed < 40; seed++) {
          const round = createRound(seed * 7919 + 1, d, 'compare', area, atlas);
          for (const it of round.items) {
            if (it.kind !== 'compare') continue;
            checked++;
            expect(templateAllowed(it.template, d), `${it.template} at ${d}`).toBe(true);
            expect(margin(it.template, it.places, it.param, d), `${it.template} ${it.places.join(',')}`).toBe(true);
            expect(it.options[it.correct], `${it.template} ${it.places.join(',')}`).toBe(compareOracle(it.template, it.places, it.param));
            // Exactly one correct option: the options are distinct.
            expect(new Set(it.options).size).toBe(it.options.length);
          }
          // No template more than twice per round.
          const counts = new Map<string, number>();
          for (const it of round.items) if (it.kind === 'compare') counts.set(it.template, (counts.get(it.template) ?? 0) + 1);
          for (const n of counts.values()) expect(n).toBeLessThanOrEqual(2);
        }
    expect(checked).toBe(3 * 6 * 40 * 8);
  });

  it('draws every template somewhere and each one honours its difficulty', () => {
    for (const t of TEMPLATES) {
      const d: Difficulty = templateAllowed(t, 'hard') ? 'hard' : 'easy';
      const q = drawTemplate(createRng(3), t, { atlas, area: 'world', difficulty: d });
      expect(q, t).not.toBeNull();
      expect(q!.template).toBe(t);
      expect(q!.options[q!.correct]).toBe(compareOracle(t, q!.places, q!.param));
    }
    expect(drawTemplate(createRng(1), 'density', { atlas, area: 'world', difficulty: 'easy' })).toBeNull();
    expect(drawTemplate(createRng(1), 'season', { atlas, area: 'world', difficulty: 'hard' })).toBeNull();
    expect(drawTemplate(createRng(1), 'clock', { atlas, area: 'world', difficulty: 'medium' })).toBeNull();
  });

  it('uses a curated insight pair when it passes the threshold, else draws its own', () => {
    const q = drawTemplate(createRng(1), 'north', { atlas, area: 'world', difficulty: 'medium', insight: ['paris', 'montreal'] });
    expect(q!.places).toEqual(['paris', 'montreal']);
    expect(q!.options[q!.correct]).toBe('paris');
    // Rome–New York differ by 1.2° only: not on medium.
    const r = drawTemplate(createRng(1), 'north', { atlas, area: 'world', difficulty: 'medium', insight: ['rome', 'new-york'] });
    expect(r!.places).not.toEqual(['rome', 'new-york']);
    // Outside the area: ignored.
    const s = drawTemplate(createRng(1), 'north', { atlas, area: 'asia', difficulty: 'hard', insight: ['paris', 'montreal'] });
    expect(s!.places).not.toContain('paris');
  });

  it('never asks east or west across the date line (the answer must match the map)', () => {
    // Every New Delhi/Honolulu-like pair (more than 150° apart on the map) is left out, whatever the seed.
    for (let seed = 0; seed < 300; seed++)
      for (const t of ['east', 'west'] as const) {
        const q = drawTemplate(createRng(seed), t, { atlas, area: 'world', difficulty: 'hard' })!;
        const [a, b] = q.places.map((id) => RAW_CITIES.get(id)!);
        expect(Math.abs(b!.lon - a!.lon), q.places.join(',')).toBeLessThanOrEqual(150);
      }
    const q = drawTemplate(createRng(1), 'east', { atlas, area: 'world', difficulty: 'hard', insight: ['new-delhi', 'honolulu'] });
    expect(q!.places).not.toEqual(['new-delhi', 'honolulu']);
  });

  it('normalises longitude differences', () => {
    fc.assert(
      fc.property(fc.double({ min: -180, max: 180, noNaN: true }), fc.double({ min: -180, max: 180, noNaN: true }), (a, b) => {
        const d = lonDelta(a, b);
        expect(d).toBeGreaterThan(-180);
        expect(d).toBeLessThanOrEqual(180);
        expect(Math.abs(Math.cos(((d - (b - a)) * Math.PI) / 180) - 1)).toBeLessThan(1e-9);
      })
    );
    expect(lonDelta(170, -170)).toBe(20);
    expect(lonDelta(-170, 170)).toBe(-20);
  });

  it('keeps pools in their area and widens tiny ones', () => {
    for (const area of AREAS) {
      for (const c of countryPool(atlas, area, 'easy')) expect(area === 'world' || c.region === area).toBe(true);
      expect(cityPool(atlas, area, 'easy').length).toBeGreaterThanOrEqual(3);
    }
    expect(countryPool(atlas, 'world', 'easy').every((c) => c.tier === 1)).toBe(true);
    // Oceania has few tier-1 cities: the pool falls back to every city of the area.
    expect(cityPool(atlas, 'oceania', 'easy').some((c) => c.tier > 1)).toBe(true);
  });
});
