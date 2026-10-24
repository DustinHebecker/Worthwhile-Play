import type { LicenseStatus, Param, ParamStatus, Source } from './types';
import { UNITS } from './types';

export type ParamIssue =
  | { kind: 'duplicate-param'; id: string }
  | { kind: 'duplicate-source'; id: string }
  | { kind: 'bad-id'; id: string }
  | { kind: 'unknown-source'; id: string; sourceId: string }
  | { kind: 'unknown-unit'; id: string; unit: string }
  | { kind: 'not-finite'; id: string }
  | { kind: 'outside-band'; id: string }
  | { kind: 'bad-year'; id: string }
  | { kind: 'bad-region'; id: string }
  | { kind: 'bad-source'; id: string }
  | { kind: 'non-commercial-source'; id: string; sourceId: string }
  | { kind: 'bad-status'; id: string }
  | { kind: 'unverified'; id: string };

const PARAM_ID = /^[a-z0-9]+(?:\.[a-zA-Z0-9-]+)+$/;
const SOURCE_ID = /^[a-z0-9][a-z0-9-]*$/;
const REGION = /^(?:[A-Z]{2}|world)$/;
const LICENSE: readonly LicenseStatus[] = ['open', 'cite-figures', 'non-commercial', 'unchecked'];
const STATUS: readonly ParamStatus[] = ['verified', 'secondary', 'unverified'];

const isYear = (y: unknown): boolean => Number.isInteger(y) && (y as number) >= 1800 && (y as number) <= 2100;

/**
 * Checks parameters against the source registry. Never throws; returns every issue found.
 * `unverified` issues are informational during development and must be resolved before release.
 */
export function checkParams(params: readonly Param[], sources: readonly Source[]): ParamIssue[] {
  const issues: ParamIssue[] = [];
  const known = new Map<string, Source>();
  try {
    for (const s of sources) {
      if (known.has(s.id)) issues.push({ kind: 'duplicate-source', id: s.id });
      const ok = typeof s.id === 'string' && SOURCE_ID.test(s.id) && typeof s.citation === 'string' && s.citation.length > 0
        && isYear(s.year) && typeof s.url === 'string' && /^https:\/\//.test(s.url)
        && typeof s.license === 'string' && LICENSE.includes(s.licenseStatus);
      if (!ok) issues.push({ kind: 'bad-source', id: String(s.id) });
      known.set(s.id, s);
    }
    const seen = new Set<string>();
    for (const p of params) {
      const id = String(p.id);
      if (seen.has(id)) issues.push({ kind: 'duplicate-param', id });
      seen.add(id);
      if (!PARAM_ID.test(id)) issues.push({ kind: 'bad-id', id });
      const source = known.get(p.sourceId);
      if (source === undefined) issues.push({ kind: 'unknown-source', id, sourceId: String(p.sourceId) });
      else if (source.licenseStatus === 'non-commercial') issues.push({ kind: 'non-commercial-source', id, sourceId: source.id });
      if (!(UNITS as readonly string[]).includes(p.unit)) issues.push({ kind: 'unknown-unit', id, unit: String(p.unit) });
      const [lo, hi] = Array.isArray(p.band) ? p.band : [Number.NaN, Number.NaN];
      if (!Number.isFinite(p.value) || !Number.isFinite(lo) || !Number.isFinite(hi)) issues.push({ kind: 'not-finite', id });
      else if (!(lo <= p.value && p.value <= hi)) issues.push({ kind: 'outside-band', id });
      if (!isYear(p.year)) issues.push({ kind: 'bad-year', id });
      if (typeof p.region !== 'string' || !REGION.test(p.region)) issues.push({ kind: 'bad-region', id });
      if (!STATUS.includes(p.status)) issues.push({ kind: 'bad-status', id });
      else if (p.status === 'unverified') issues.push({ kind: 'unverified', id });
    }
  } catch {
    issues.push({ kind: 'bad-source', id: '(unreadable input)' });
  }
  return issues;
}

/** Issues that block use of a parameter set (everything except `unverified`). */
export function blockingIssues(issues: readonly ParamIssue[]): ParamIssue[] {
  return issues.filter((i) => i.kind !== 'unverified');
}

/** Looks up a parameter value by id; throws on unknown ids (authored content error). */
export function paramValue(params: readonly Param[], id: string): number {
  const p = params.find((x) => x.id === id);
  if (p === undefined) throw new RangeError(`Unknown parameter: ${id}`);
  return p.value;
}
