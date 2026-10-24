import { describe, expect, it } from 'vitest';
import { ALL_PARAMS, blockingIssues, checkParams, DE_PARAMS, IN_PARAMS, SOURCES, WORLD_PARAMS } from '../src';

describe('calibration parameter data', () => {
  it('has no blocking issues', () => {
    expect(blockingIssues(checkParams(ALL_PARAMS, SOURCES))).toEqual([]);
  });

  it('has unique parameter ids', () => {
    const ids = ALL_PARAMS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses every registered source at least once', () => {
    const used = new Set(ALL_PARAMS.map((p) => p.sourceId));
    expect(SOURCES.filter((s) => !used.has(s.id)).map((s) => s.id)).toEqual([]);
  });

  it('keeps each profile in its own region', () => {
    expect(DE_PARAMS.every((p) => p.region === 'DE' && p.id.startsWith('de.'))).toBe(true);
    expect(IN_PARAMS.every((p) => p.region === 'IN' && p.id.startsWith('in.'))).toBe(true);
    expect(WORLD_PARAMS.every((p) => p.id.split('.')[0] === (p.region === 'world' ? 'world' : p.region.toLowerCase()))).toBe(true);
  });

  it('reports unverified parameters per region', () => {
    const counts = new Map<string, number>();
    for (const p of ALL_PARAMS) if (p.status === 'unverified') counts.set(p.region, (counts.get(p.region) ?? 0) + 1);
    console.info(`unverified parameters per region: ${JSON.stringify(Object.fromEntries(counts))} of ${ALL_PARAMS.length}`);
    expect([...counts.values()].reduce((a, b) => a + b, 0)).toBeLessThan(ALL_PARAMS.length);
  });
});
