import { describe, expect, it } from 'vitest';
import { ALL_PARAMS, blockingIssues, checkParams, DE_PARAMS, IN_PARAMS, LIFE_TABLES, SERIES, SOURCES, WORLD_PARAMS } from '../src';

describe('calibration parameter data', () => {
  it('has no blocking issues', () => {
    expect(blockingIssues(checkParams(ALL_PARAMS, SOURCES))).toEqual([]);
  });

  it('has unique parameter ids', () => {
    const ids = ALL_PARAMS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses every registered source at least once', () => {
    const used = new Set([...ALL_PARAMS.map((p) => p.sourceId), ...SERIES.map((x) => x.sourceId), ...Object.values(LIFE_TABLES).map((t) => t.sourceId)]);
    expect(SOURCES.filter((s) => !used.has(s.id)).map((s) => s.id)).toEqual([]);
  });

  it('keeps each profile in its own region', () => {
    expect(DE_PARAMS.every((p) => p.region === 'DE' && p.id.startsWith('de.'))).toBe(true);
    expect(IN_PARAMS.every((p) => p.region === 'IN' && p.id.startsWith('in.'))).toBe(true);
    expect(WORLD_PARAMS.every((p) => p.id.split('.')[0] === (p.region === 'world' ? 'world' : p.region.toLowerCase()))).toBe(true);
  });

  it('has well-formed series with registered sources', () => {
    const ids = new Set(SOURCES.map((x) => x.id));
    for (const x of SERIES) {
      expect(ids.has(x.sourceId)).toBe(true);
      expect(x.values.length).toBeGreaterThan(10);
      expect(x.values.every((v) => Number.isFinite(v) && Math.abs(v) < 0.5)).toBe(true);
    }
  });

  it('has complete life tables that reproduce the published life expectancy', () => {
    const e0 = (ppm: readonly number[]): number => {
      // Expected lifetime in years from monthly hazards (deaths at mid-month).
      let alive = 1;
      let years = 0;
      for (const p of ppm) for (let m = 0; m < 12; m++) {
        const d = alive * (p / 1e6);
        years += (alive - d / 2) / 12;
        alive -= d;
      }
      return years;
    };
    for (const t of Object.values(LIFE_TABLES)) {
      expect(t.female).toHaveLength(101);
      expect(t.male).toHaveLength(101);
      expect([...t.female, ...t.male].every((p) => Number.isInteger(p) && p > 0 && p <= 1e6)).toBe(true);
      expect(t.female[100]).toBe(1e6);
    }
    expect(e0(LIFE_TABLES.DE!.female)).toBeCloseTo(83.2, 0);
    expect(e0(LIFE_TABLES.DE!.male)).toBeCloseTo(78.5, 0);
    expect(e0(LIFE_TABLES.IN!.female)).toBeCloseTo(73.6, 0);
    expect(e0(LIFE_TABLES.IN!.male)).toBeCloseTo(70.5, 0);
  });

  it('reports unverified parameters per region', () => {
    const counts = new Map<string, number>();
    for (const p of ALL_PARAMS) if (p.status === 'unverified') counts.set(p.region, (counts.get(p.region) ?? 0) + 1);
    console.info(`unverified parameters per region: ${JSON.stringify(Object.fromEntries(counts))} of ${ALL_PARAMS.length}`);
    expect([...counts.values()].reduce((a, b) => a + b, 0)).toBeLessThan(ALL_PARAMS.length);
  });
});
