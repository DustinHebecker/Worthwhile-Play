import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { countryAt, countryDistanceKm, decodeAtlas, inside, LINES, placeAt, REGIONS } from '../src/atlas';
import { ATLAS_DATA } from '../src/data/atlas.gen';
import { UN_MEMBERS } from '../src/data/un-members';
import manifest from '../src/data/manifest.json';

const atlas = decodeAtlas(ATLAS_DATA);
const source = readFileSync(new URL('../src/data/atlas.gen.ts', import.meta.url));

describe('generated atlas', () => {
  it('matches its manifest (hash and source)', () => {
    expect(createHash('sha256').update(source).digest('hex')).toBe(manifest.output.sha256);
    expect(manifest.dataId).toBe(ATLAS_DATA.id);
    expect(manifest.source.version).toBe('5.1.2');
    // Every pinned source file has a recorded SHA-256.
    for (const hash of Object.values(manifest.files)) expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('stays within the size budget (design § 22; owner decision: ≤ 150 KB gzip)', () => {
    expect(source.length).toBeLessThanOrEqual(150 * 1024);
    expect(gzipSync(source, { level: 9 }).length).toBeLessThanOrEqual(100 * 1024);
  });

  it('has all 193 UN members exactly once, with unique ids everywhere', () => {
    expect(atlas.countries.map((c) => c.id)).toEqual([...UN_MEMBERS].sort());
    const ids = [...atlas.countries, ...atlas.others, ...atlas.disputed, ...atlas.features, ...atlas.cities].map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of atlas.countries) expect(REGIONS).toContain(c.region);
  });

  it('has closed rings with at least three distinct points for every drawn entity', () => {
    for (const s of [...atlas.countries, ...atlas.others, ...atlas.disputed]) {
      for (const r of s.rings) {
        expect(r.length).toBeGreaterThanOrEqual(8);
        expect([r[0], r[1]]).toEqual([r[r.length - 2], r[r.length - 1]]);
        for (const v of r) expect(Number.isFinite(v)).toBe(true);
      }
    }
    // Every UN member is drawn.
    for (const c of atlas.countries) expect(c.rings.length, c.id).toBeGreaterThan(0);
  });

  it('has a symmetric, irreflexive neighbour relation between UN members only', () => {
    for (const c of atlas.countries) {
      expect(c.nb).not.toContain(c.id);
      for (const n of c.nb) {
        expect(atlas.country(n), `${c.id}→${n}`).toBeDefined();
        expect(atlas.country(n)!.nb, `${n}→${c.id}`).toContain(c.id);
      }
    }
  });

  it('applies the neutrality rules (design § 12)', () => {
    // The whole-state feature (Israel) is not drawn; Pakistan–China (whole border in a hatched area) are no neighbours.
    expect(manifest.notDrawnWholeState.map((w) => w.country)).toEqual(['IL']);
    expect(atlas.country('CN')!.nb).not.toContain('PK');
    expect(atlas.country('SO')!.nb).not.toContain('DJ');
    expect(atlas.country('RU')!.nb).toContain('UA');
    expect(atlas.country('IN')!.nb).toContain('CN');
    expect(atlas.country('AM')!.nb).toContain('AZ');
    expect(atlas.country('MA')!.nb).toContain('DZ');
    // A hatched area belongs to no country: a point in Crimea is "disputed", not Russia or Ukraine.
    expect(placeAt(atlas, 34.1, 45.0)).toEqual({ kind: 'disputed', id: expect.any(String) });
    expect(countryAt(atlas, 34.1, 45.0)).toBeNull();
    // … but a tap there counts as on target for both (it touches both).
    expect(countryDistanceKm(atlas, atlas.country('UA')!, 34.1, 45.0)).toBe(0);
    expect(countryDistanceKm(atlas, atlas.country('RU')!, 34.1, 45.0)).toBe(0);
    // The worldview check ran and found nothing unexplained.
    expect(manifest.worldviews?.checked).toHaveLength(32);
    expect(manifest.worldviews!.reported.filter((r) => r.status === 'unexplained')).toEqual([]);
  });

  it('keeps places inside narrow hatched areas hatched after simplification (policy A)', () => {
    // Before the hatched edges got their own deviation limit, the Gaza Strip was simplified to a triangle and Gaza City
    // read "Israel" when tapped. Each point lies well inside its area in the source data.
    const places: [string, number, number][] = [
      ['Gaza City', 34.46, 31.51],
      ['Beit Hanoun', 34.53, 31.54],
      ['Khan Yunis', 34.3, 31.34],
      ['Ramallah', 35.2, 31.9],
      ['Hebron', 35.1, 31.53],
      ['Simferopol', 34.1, 44.95],
      ['Srinagar', 74.8, 34.08],
      ['Muzaffarabad', 73.47, 34.37],
      ['Laayoune', -13.2, 27.15],
      ['Taipei', 121.5, 25.03],
      ['Pristina', 21.17, 42.67],
      ['Sukhumi', 41.0, 43.0],
      ['Tskhinvali', 43.96, 42.23],
      ['Tiraspol', 29.63, 46.84],
      ['Stepanakert', 46.75, 39.82],
      ['Hargeisa', 44.07, 9.56],
      ['Golan Heights', 35.69, 32.99],
      ['North Nicosia', 33.36, 35.2]
    ];
    for (const [name, lon, lat] of places) expect(placeAt(atlas, lon, lat)?.kind, name).toBe('disputed');
  });

  it('names tiny places on land as the data does: Ceuta and Melilla are Spain, Gibraltar is hatched', () => {
    // Below the resolution of the shared arcs, Melilla read "Morocco", Ceuta "sea" and Gibraltar's Rock "Spain"; tiny
    // parts on land now have fine rings that are tested first (follow-up 2026-10-29).
    const at = (lon: number, lat: number) => placeAt(atlas, lon, lat);
    const country = (id: string) => ({ kind: 'country', id });
    // Ceuta and Melilla: administered by Spain, drawn as Spanish exclaves; Morocco around them.
    expect(at(-5.316, 35.889), 'Ceuta').toEqual(country('ES'));
    expect(at(-2.94, 35.29), 'Melilla').toEqual(country('ES'));
    expect(at(-2.956, 35.28), 'Melilla airport').toEqual(country('ES'));
    expect(at(-5.36, 35.85), 'Fnideq').toEqual(country('MA'));
    expect(at(-2.93, 35.17), 'Nador').toEqual(country('MA'));
    // Gibraltar is in the disputed-areas layer (administered by the UK, claimed by Spain): hatched, so neither Spain
    // nor the United Kingdom; La Línea next to it is Spain.
    expect(at(-5.348, 36.128), 'Gibraltar').toEqual({ kind: 'disputed', id: 'd-b55' });
    expect(at(-5.35, 36.165), 'La Línea').toEqual(country('ES'));
    // Llívia (Spain, inside France), Monaco, San Marino and Vatican City.
    expect(at(1.98, 42.465), 'Llívia').toEqual(country('ES'));
    expect(at(2.04, 42.46), 'Saillagouse').toEqual(country('FR'));
    expect(at(7.42, 43.735), 'Monaco').toEqual(country('MC'));
    expect(at(12.45, 43.94), 'San Marino').toEqual(country('SM'));
    expect(at(12.4535, 41.9035), 'Vatican City').toEqual({ kind: 'other', id: 'VAT' });
    expect(at(12.49, 41.89), 'Rome').toEqual(country('IT'));
    // A tap in Ceuta counts for Spain; Spain and Morocco are neighbours (their only border is at Ceuta and Melilla).
    expect(countryDistanceKm(atlas, atlas.country('ES')!, -5.316, 35.889)).toBe(0);
    expect(atlas.country('ES')!.nb).toContain('MA');
    // Fine rings are closed rings with an area; the tiny hatched areas that quantisation had flattened into zero-area
    // slivers (Dragonja, Vojvodina, Mount Scopus) have one again.
    const area = (r: ArrayLike<number>) => {
      let a = 0;
      for (let i = 2; i < r.length; i += 2) a += r[i - 2]! * r[i + 1]! - r[i]! * r[i - 1]!;
      return Math.abs(a / 2);
    };
    for (const sp of atlas.spots) for (const r of sp.rings) expect(area(r), sp.id).toBeGreaterThan(0);
    for (const id of ['d-b82', 'd-b96', 'd-b99', 'd-b55']) {
      const d = atlas.disputed.find((x) => x.id === id)!;
      expect(d.rings.length, id).toBeGreaterThan(0);
      for (const r of d.rings) expect(area(r), id).toBeGreaterThan(0);
    }
  });

  it('places every curated city in its country (or within the 25 km tolerance)', () => {
    for (const city of atlas.cities) {
      const c = atlas.country(city.country)!;
      expect(c, city.id).toBeDefined();
      expect(countryDistanceKm(atlas, c, city.lon, city.lat), city.id).toBe(0);
    }
  });

  it('knows a few points', () => {
    expect(countryAt(atlas, 2.35, 48.86)).toBe('FR');
    expect(countryAt(atlas, 36.82, -1.29)).toBe('KE');
    expect(countryAt(atlas, -30, 0)).toBeNull();
    expect(placeAt(atlas, -42, 72)).toEqual({ kind: 'other', id: 'GRL' });
    expect(inside(atlas.feature('sahara')!, 10, 24)).toBe(true);
  });

  it('references only known ids, never retired ones', () => {
    for (const c of atlas.countries) for (const f of c.features) expect(atlas.feature(f), `${c.id}: ${f}`).toBeDefined();
    for (const c of atlas.countries) for (const d of c.touching) expect(atlas.disputed.some((x) => x.id === d)).toBe(true);
    for (const pairs of Object.values(atlas.pairs)) for (const p of pairs) for (const id of p) expect(atlas.city(id), id).toBeDefined();
    for (const id of atlas.retired) expect(atlas.country(id) ?? atlas.city(id) ?? atlas.feature(id)).toBeDefined();
  });

  it('has plausible facts', () => {
    const c = (id: string) => atlas.country(id)!;
    expect(c('CH').coast).toBe(false);
    expect(c('FR').coast).toBe(true);
    expect(c('KZ').coast).toBe(false); // the Caspian Sea is not a coast
    expect(c('JP').island).toBe(true);
    expect(c('DK').island).toBe(false);
    expect(c('DE').features).toContain('rhine');
    expect(c('EG').features).toContain('nile');
    expect(c('CL').features).toContain('atacama');
    // A physical region counts only with a meaningful share (≥ 10 % of the country or ≥ 5 % of the feature): the
    // Sahara polygon's fuzzy southern edge reaches 2–9 % into these countries, which keeps them only as "near".
    for (const id of ['CF', 'CM', 'NG', 'SS', 'BF']) {
      expect(c(id).features, id).not.toContain('sahara');
      expect(c(id).featuresNear, id).toContain('sahara');
    }
    for (const id of ['DZ', 'LY', 'EG', 'NE', 'TD', 'ML']) expect(c(id).features, id).toContain('sahara');
    expect(c('AD').features).toContain('pyrenees');
    expect(c('RU').features).toContain('urals');
    expect(c('FR').featuresNear).not.toContain('sahara');
    // Special lines need a 0.5° margin (simplification must not flip them): Niger (23.52° N) and Chad (23.45° N) are
    // only near the Tropic of Cancer, Peru (0.03° S) the Equator, Iceland (Grímsey) the Arctic Circle.
    for (const [id, bit] of [['NE', LINES.cancer], ['TD', LINES.cancer], ['PE', LINES.equator], ['IS', LINES.arctic], ['TG', LINES.meridian]] as const) {
      expect(c(id).lines & bit, id).toBe(0);
      expect(c(id).linesNear & bit, id).toBe(bit);
    }
    expect(c('DZ').lines & LINES.cancer).toBe(LINES.cancer);
    expect(c('KE').lines & LINES.equator).toBe(LINES.equator);
    for (const x of atlas.countries) expect(x.lines & x.linesNear, x.id).toBe(0);
    for (const x of atlas.countries) for (const f of x.featuresNear) expect(x.features, `${x.id}: ${f}`).not.toContain(f);
    expect(c('RU').areaCore).toBeGreaterThan(16_000_000);
    expect(c('RU').areaMax).toBeGreaterThan(c('RU').areaCore);
    for (const x of atlas.countries) {
      expect(x.areaMax).toBeGreaterThanOrEqual(x.areaCore);
      expect(x.pop).toBeGreaterThan(0);
      expect(x.home[0]).toBeLessThanOrEqual(x.home[2]);
    }
    for (const city of atlas.cities) expect(Math.abs(city.tz)).toBeLessThanOrEqual(14 * 60);
  });
});
