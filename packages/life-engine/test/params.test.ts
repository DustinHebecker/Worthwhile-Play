import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { blockingIssues, checkParams, paramValue, type Param, type Source } from '../src';

const source: Source = { id: 'destatis-vse-2025', citation: 'Destatis, Verdiensterhebung', year: 2025, url: 'https://www.destatis.de/', license: 'DL-DE-BY 2.0', licenseStatus: 'open' };
const nc: Source = { id: 'who-gho', citation: 'WHO Global Health Observatory', year: 2024, url: 'https://www.who.int/data/gho', license: 'CC BY-NC-SA 3.0 IGO', licenseStatus: 'non-commercial' };
const param: Param = { id: 'de.earnings.apprenticeship', value: 4125, unit: 'local-currency-per-month', sourceId: source.id, year: 2025, region: 'DE', band: [3900, 4350], status: 'verified' };

describe('parameter checks', () => {
  it('accepts a well-formed set', () => {
    expect(checkParams([param], [source])).toEqual([]);
    expect(paramValue([param], 'de.earnings.apprenticeship')).toBe(4125);
    expect(() => paramValue([param], 'de.nothing')).toThrow(RangeError);
  });

  it('reports each kind of problem', () => {
    const kinds = (ps: Param[], ss: Source[] = [source, nc]) => checkParams(ps, ss).map((i) => i.kind);
    expect(kinds([param, param])).toContain('duplicate-param');
    expect(kinds([{ ...param, id: 'Bad id' }])).toContain('bad-id');
    expect(kinds([{ ...param, sourceId: 'missing' }])).toContain('unknown-source');
    expect(kinds([{ ...param, sourceId: nc.id }])).toContain('non-commercial-source');
    expect(kinds([{ ...param, unit: 'furlongs' }])).toContain('unknown-unit');
    expect(kinds([{ ...param, value: Number.NaN }])).toContain('not-finite');
    expect(kinds([{ ...param, value: 5000 }])).toContain('outside-band');
    expect(kinds([{ ...param, year: 1066 }])).toContain('bad-year');
    expect(kinds([{ ...param, region: 'Germany' }])).toContain('bad-region');
    expect(kinds([{ ...param, status: 'maybe' as never }])).toContain('bad-status');
    expect(kinds([param], [source, source])).toContain('duplicate-source');
    expect(kinds([param], [source, { ...source, id: 'x2', url: 'http://insecure.example' }])).toContain('bad-source');
  });

  it('treats unverified values as informational, not blocking', () => {
    const issues = checkParams([{ ...param, status: 'unverified' }], [source]);
    expect(issues.map((i) => i.kind)).toEqual(['unverified']);
    expect(blockingIssues(issues)).toEqual([]);
  });

  it('never throws on junk', () => {
    fc.assert(fc.property(fc.array(fc.anything()), fc.array(fc.anything()), (ps, ss) => {
      checkParams(ps as Param[], ss as Source[]);
    }));
  });
});
